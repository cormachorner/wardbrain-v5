import { formatFeatureLabel } from "../domain/featureLabels";
import type { AnalyzeCaseResponse, CaseInput } from "../types";

export type PresentationFacts = {
  demographics: {
    age?: number;
    sex?: string;
  };
  diagnostic_confidence: "sufficient" | "insufficient";
  presenting_problem: string;
  history: string[];
  relevant_background: string[];
  examination: string[];
  investigations: string[];
  important_negatives: string[];
  priority_concerns: string[];
  uncertainty_guidance: "confident_impression" | "cautious_impression" | "non_specific";
  uncertainty_summary?: string;
};

const HISTORY_FEATURE_ORDER = [
  "sudden_onset",
  "gradual_onset",
  "chronic_course",
  "progressive_course",
  "central_chest_pain",
  "chest_heaviness",
  "chest_pain",
  "exertional_pain",
  "pain_radiates_to_jaw",
  "pain_radiates_to_left_arm",
  "pain_radiates_to_shoulder",
  "back_radiation",
  "tearing_pain",
  "pleuritic_pain",
  "sob",
  "productive_cough",
  "sputum_change",
  "abdominal_pain",
  "generalized_abdominal_pain",
  "epigastric_pain",
  "ruq_pain",
  "rif_pain",
  "jaundice",
  "dark_urine",
  "pale_stools",
  "melaena",
  "haematemesis",
  "pr_bleeding",
  "pain_out_of_proportion",
  "pain_severe_but_exam_mild",
  "severe_pain",
  "vomiting",
  "nausea",
  "sweating",
  "diarrhoea",
  "constipation",
  "obstipation",
  "unable_to_pass_flatus",
  "headache",
  "thunderclap",
  "neck_stiffness",
  "photophobia",
  "confusion",
  "focal_neurology",
  "collapse",
  "dizziness",
];

const EXAM_FEATURE_ORDER = [
  "haemodynamically_stable",
  "tachycardia",
  "tachypnoea",
  "hypotension",
  "hypoxia",
  "fever",
  "reduced_consciousness",
  "respiratory_distress",
  "unable_to_speak_full_sentences",
  "crackles",
  "bibasal_crackles",
  "wheeze",
  "unilateral_reduced_air_entry",
  "hyperresonance",
  "raised_jvp",
  "peripheral_oedema",
  "pallor",
  "guarding",
  "rigidity",
  "rebound_tenderness",
  "mild_tenderness",
  "cva_tenderness",
  "focal_weakness",
  "aphasia",
  "ataxia",
];

const DISCRIMINATIVE_HISTORY_FEATURE_ORDER = [
  "pain_out_of_proportion",
  "pain_severe_but_exam_mild",
  "sudden_onset",
  "central_chest_pain",
  "chest_heaviness",
  "exertional_pain",
  "pain_radiates_to_jaw",
  "pain_radiates_to_left_arm",
  "tearing_pain",
  "back_radiation",
  "pleuritic_pain",
  "sob",
  "productive_cough",
  "sputum_change",
  "fever",
  "melaena",
  "haematemesis",
  "pr_bleeding",
  "jaundice",
  "dark_urine",
  "pale_stools",
  "ruq_pain",
  "abdominal_pain",
  "vomiting",
  "nausea",
  "sweating",
  "polyuria",
  "polydipsia",
  "kussmaul_breathing",
  "confusion",
  "drowsiness",
];

const DISCRIMINATIVE_EXAM_FEATURE_ORDER = [
  "reduced_consciousness",
  "hypotension",
  "hypoxia",
  "tachypnoea",
  "tachycardia",
  "fever",
  "respiratory_distress",
  "unable_to_speak_full_sentences",
  "wheeze",
  "crackles",
  "bibasal_crackles",
  "unilateral_reduced_air_entry",
  "guarding",
  "rigidity",
  "rebound_tenderness",
  "pallor",
  "cva_tenderness",
];

const PRESENTATION_FEATURE_LABELS: Record<string, string> = {
  acs_equivalent_pain: "ACS-equivalent epigastric discomfort",
  back_radiation: "radiates to the back",
  bibasal_crackles: "bibasal crackles",
  central_chest_pain: "central chest pain",
  chest_heaviness: "chest heaviness",
  chest_pain: "chest pain",
  copd_history: "COPD",
  cva_tenderness: "renal angle tenderness",
  dark_urine: "dark urine",
  diabetic_context: "diabetes",
  difficulty_speaking: "difficulty speaking full sentences",
  drowsiness: "drowsiness",
  exertional_pain: "exertional pain",
  fever: "fever",
  generalized_abdominal_pain: "generalised abdominal pain",
  haemodynamically_stable: "haemodynamically stable",
  hyperlipidaemia: "hyperlipidaemia",
  hypoxia: "hypoxia",
  indigestion_like_chest_pain: "indigestion-like pain",
  jaundice: "jaundice",
  known_copd: "COPD",
  kussmaul_breathing: "Kussmaul breathing",
  melaena: "melaena",
  normal_oxygen_saturations: "normal oxygen saturations",
  pain_out_of_proportion: "pain out of proportion",
  pain_severe_but_exam_mild: "severe pain with mild examination findings",
  pain_radiates_to_jaw: "radiates to the jaw",
  pain_radiates_to_left_arm: "radiates to the left arm",
  pain_radiates_to_shoulder: "radiates to the shoulder",
  pale_stools: "pale stools",
  peripheral_oedema: "peripheral oedema",
  postpartum: "postpartum context",
  previous_abdominal_surgery: "previous abdominal surgery",
  productive_cough: "productive cough",
  respiratory_distress: "respiratory distress",
  severe_pain: "severe pain",
  smoking_history: "smoking history",
  sob: "shortness of breath",
  sputum_change: "sputum change",
  sudden_onset: "sudden onset",
  tachycardia: "tachycardia",
  tachypnoea: "tachypnoea",
  type_1_diabetes: "type 1 diabetes",
  unable_to_pass_flatus: "unable to pass flatus",
  unable_to_speak_full_sentences: "unable to speak in full sentences",
};

const IMPORTANT_NEGATIVE_PATTERNS = [
  { pattern: /\bno (?:clear )?chest pain\b/i, text: "no chest pain" },
  { pattern: /\bno (?:clear )?(?:shortness of breath|sob|breathlessness)\b/i, text: "no breathlessness" },
  { pattern: /\bno pleuritic (?:pain|chest pain)\b/i, text: "no pleuritic pain" },
  { pattern: /\bno fever\b/i, text: "no fever" },
  { pattern: /\bno cough\b/i, text: "no cough" },
  { pattern: /\bno haemoptysis\b/i, text: "no haemoptysis" },
  { pattern: /\bno (?:focal )?neurolog(?:y|ical signs?)\b/i, text: "no focal neurology" },
  { pattern: /\bno neck stiffness\b/i, text: "no neck stiffness" },
  { pattern: /\bno guarding\b/i, text: "no guarding" },
  { pattern: /\bno (?:obvious )?rigidity\b/i, text: "no rigidity" },
];

const INVESTIGATION_FEATURE_LABELS: Record<string, string> = {
  anaemia: "anaemia",
  microcytic_anaemia: "microcytic anaemia pattern",
  leucocytosis: "leucocytosis",
  neutrophilia: "neutrophilia",
  raised_urea: "raised urea",
  metabolic_acidosis: "metabolic acidosis",
  respiratory_acidosis: "respiratory acidosis",
  respiratory_alkalosis: "respiratory alkalosis",
  metabolic_alkalosis: "metabolic alkalosis",
  hyperglycaemia_lab: "hyperglycaemia",
  raised_lactate: "raised lactate",
  hypoxaemia: "hypoxaemia",
  hypercapnia: "hypercapnia",
  cholestatic_pattern: "cholestatic LFT pattern",
  hepatocellular_pattern: "hepatocellular LFT pattern",
  marked_transaminase_elevation: "marked transaminase elevation",
  renal_impairment: "renal impairment",
  hyperkalaemia: "hyperkalaemia",
  severe_hyperkalaemia: "severe hyperkalaemia",
};

const AGE_SEX_PATTERN = /\b(?:(\d{1,3})\s*(?:-| )?\s*(?:year|yr|y|yo|yrs?)(?:-old)?\s*)?(male|female|man|woman|gentleman|lady)\b/i;
const AGE_ONLY_PATTERN = /\b(\d{1,3})\s*(?:-| )?\s*(?:year|yr|y|yo|yrs?)(?:-old)?\b/i;
const DURATION_VALUE = "(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|several|few)\\s+(?:minutes?|hours?|days?|weeks?|months?|years?)";
const SYMPTOM_TERMS = "chest pain|pain|shortness of breath|breathlessness|cough|fever|weakness|reduced appetite|vomiting|diarrhoea|headache";
const SYMPTOM_DURATION_PATTERNS = [
  new RegExp(`\\b(?:for|over|around|approximately|about)\\s+(${DURATION_VALUE})\\s+(?:with|of)?\\s*(?:${SYMPTOM_TERMS})\\b`, "i"),
  new RegExp(`\\b(?:${SYMPTOM_TERMS})\\s+(?:for|over|around|approximately|about)\\s+(${DURATION_VALUE})\\b`, "i"),
  new RegExp(`\\b(${DURATION_VALUE})\\s+(?:history|duration)?\\s*of\\s+(?:(?:\\w+\\s+){0,4})?(?:${SYMPTOM_TERMS})\\b`, "i"),
];
const STABILITY_PATTERNS = [
  { pattern: /\b(?:bp\s*\d{2,3}\/\d{2,3}|blood pressure\s*\d{2,3}\/\d{2,3}|haemodynamically stable|hemodynamically stable|stable observations)\b/i, text: "haemodynamically stable" },
  { pattern: /\b(?:sats?|spo2|oxygen saturations?)\s*(?:of\s*)?(?:9[5-9]|100)\s*%?\s*(?:on\s*(?:air|room air|ra))?\b/i, text: "normal oxygen saturations" },
  { pattern: /\b(?:chest clear|clear chest|no respiratory distress|not in respiratory distress)\b/i, text: "no respiratory distress" },
];

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function compactText(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim();
}

function featureLabels(slugs: string[], orderedFeatures: string[], limit: number) {
  return orderedFeatures
    .filter((feature) => slugs.includes(feature))
    .slice(0, limit)
    .map((feature) => PRESENTATION_FEATURE_LABELS[feature] ?? formatFeatureLabel(feature));
}

function hasFeature(slugs: string[], feature: string) {
  return slugs.includes(feature);
}

function allStructuredText(input: CaseInput | undefined) {
  return [
    input?.presentingComplaint,
    input?.history,
    input?.pmh,
    input?.meds,
    input?.social,
    input?.keyPositives,
    input?.keyNegatives,
    input?.observations,
  ].filter(Boolean).join(" ");
}

function extractImportantNegatives(input: CaseInput) {
  const text = [
    input.history,
    input.keyNegatives,
    input.observations,
  ].filter(Boolean).join(" ");

  return IMPORTANT_NEGATIVE_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ text: negative }) => negative);
}

function extractDurationFact(input: CaseInput | undefined) {
  const text = [input?.presentingComplaint, input?.history, input?.keyPositives]
    .filter(Boolean)
    .join(" ");
  const duration = SYMPTOM_DURATION_PATTERNS
    .map((pattern) => text.match(pattern)?.[1])
    .find(Boolean);

  return duration ? `${duration.toLowerCase()} duration` : undefined;
}

function extractStabilityFacts(input: CaseInput | undefined) {
  const observations = input?.observations ?? "";

  return STABILITY_PATTERNS
    .filter(({ pattern }) => pattern.test(observations))
    .map(({ text }) => text);
}

function buildInvestigationFacts(analysis: AnalyzeCaseResponse) {
  const labFeatures = analysis.labs?.features
    .map((feature) => INVESTIGATION_FEATURE_LABELS[feature])
    .filter(Boolean)
    .slice(0, 5) ?? [];
  const labWarnings = analysis.labs?.safetyWarnings
    .map((warning) => warning.title)
    .slice(0, 3) ?? [];

  return unique([...labWarnings, ...labFeatures]).slice(0, 6);
}

function extractContextFacts(input: CaseInput | undefined) {
  const text = allStructuredText(input);
  const facts: string[] = [];

  if (/\b(?:postpartum|post partum|post-?c-?section|after c-?section|following c-?section|postnatal|after delivery|following delivery|\d+\s+days?\s+post\s+c-?section|\d+\s+days?\s+postpartum)\b/i.test(text)) {
    facts.push("postpartum context");
  }

  if (/\b(?:post-?op|post-?operative|after surgery|following surgery|\d+\s+(?:days?|weeks?)\s+(?:post|after|following)\s+(?:op|operation|surgery))\b/i.test(text)) {
    facts.push("recent surgery");
  }

  return facts;
}

function buildBackgroundFacts(slugs: string[], input: CaseInput | undefined) {
  const facts: string[] = [];

  if (hasFeature(slugs, "type_1_diabetes")) {
    facts.push("type 1 diabetes");
  } else if (hasFeature(slugs, "diabetic_context")) {
    facts.push("diabetes");
  }

  if (hasFeature(slugs, "hypertension")) facts.push("hypertension");
  if (hasFeature(slugs, "hyperlipidaemia")) facts.push("hyperlipidaemia");
  if (hasFeature(slugs, "smoking_history") || hasFeature(slugs, "smoker")) facts.push("smoking history");
  if (hasFeature(slugs, "af") || hasFeature(slugs, "atrial_fibrillation")) facts.push("atrial fibrillation");
  if (hasFeature(slugs, "vascular_disease")) facts.push("vascular disease");
  if (hasFeature(slugs, "known_copd") || hasFeature(slugs, "copd_history")) facts.push("COPD");
  if (hasFeature(slugs, "asthma_history") || hasFeature(slugs, "known_asthma")) facts.push("asthma");
  if (hasFeature(slugs, "previous_abdominal_surgery")) facts.push("previous abdominal surgery");
  if (hasFeature(slugs, "anticoagulation")) facts.push("anticoagulation");
  if (hasFeature(slugs, "pregnancy_possible")) facts.push("pregnancy possible");
  if (hasFeature(slugs, "postpartum")) facts.push("postpartum context");
  if (hasFeature(slugs, "recent_surgery")) facts.push("recent surgery");
  if (hasFeature(slugs, "immobility")) facts.push("immobility");
  if (hasFeature(slugs, "long_haul_travel")) facts.push("long-haul travel");
  if (hasFeature(slugs, "oestrogen_use")) facts.push("oestrogen use");
  if (hasFeature(slugs, "immunosuppression")) facts.push("immunosuppression");
  if (hasFeature(slugs, "cancer")) facts.push("cancer");

  return unique([...facts, ...extractContextFacts(input)]).slice(0, 6);
}

function isDiagnosticallyInsufficient(analysis: AnalyzeCaseResponse) {
  const topScore = analysis.differentials[0]?.score ?? 0;

  return analysis.uncertainty.level === "high" &&
    (
      analysis.differentials.length === 0 ||
      analysis.uncertainty.summary.includes("does not yet have enough") ||
      (
        topScore < 7 &&
        analysis.uncertainty.reasons.some((reason) =>
          /limited positive support|small number of usable clinical features|display threshold|does not strongly fit/i.test(reason),
        )
      )
    );
}

function uncertaintyGuidance(
  analysis: AnalyzeCaseResponse,
): PresentationFacts["uncertainty_guidance"] {
  if (isDiagnosticallyInsufficient(analysis)) {
    return "non_specific";
  }

  if (analysis.uncertainty.level === "low") {
    return "confident_impression";
  }

  return "cautious_impression";
}

function buildPriorityConcerns(analysis: AnalyzeCaseResponse) {
  if (isDiagnosticallyInsufficient(analysis)) {
    return [];
  }

  const lead = analysis.differentials[0];

  if (lead && lead.score >= 7) {
    return [lead.name];
  }

  return [];
}

function buildHistoryFacts(input: CaseInput | undefined, slugs: string[]) {
  return unique([
    extractDurationFact(input),
    ...featureLabels(slugs, DISCRIMINATIVE_HISTORY_FEATURE_ORDER, 8),
    ...featureLabels(slugs, HISTORY_FEATURE_ORDER, 8),
  ]).slice(0, 9);
}

function buildExaminationFacts(input: CaseInput | undefined, slugs: string[]) {
  return unique([
    ...featureLabels(slugs, DISCRIMINATIVE_EXAM_FEATURE_ORDER, 6),
    ...extractStabilityFacts(input),
    ...featureLabels(slugs, EXAM_FEATURE_ORDER, 6),
  ]).slice(0, 7);
}

function parseDemographics(input: CaseInput | undefined) {
  const parsedAge = Number.parseInt(input?.age ?? "", 10);
  const explicitSex = input?.sex === "male" || input?.sex === "female" ? input.sex : undefined;
  const text = allStructuredText(input);
  const ageSexMatch = text.match(AGE_SEX_PATTERN);
  const ageOnlyMatch = text.match(AGE_ONLY_PATTERN);
  const inferredAge = Number.parseInt(ageSexMatch?.[1] ?? ageOnlyMatch?.[1] ?? "", 10);
  const inferredSex = ageSexMatch?.[2]?.toLowerCase();

  return {
    age: Number.isFinite(parsedAge)
      ? parsedAge
      : Number.isFinite(inferredAge)
        ? inferredAge
        : undefined,
    sex: explicitSex ??
      (inferredSex === "male" || inferredSex === "man" || inferredSex === "gentleman"
        ? "male"
        : inferredSex === "female" || inferredSex === "woman" || inferredSex === "lady"
          ? "female"
          : undefined),
  };
}

export function buildPresentationFacts(
  input: CaseInput | undefined,
  analysis: AnalyzeCaseResponse,
): PresentationFacts {
  const detectedSlugs = analysis.detectedFeatureSlugs ?? [];
  const presentingProblem = compactText(input?.presentingComplaint) ??
    analysis.presentationSupport.matchedBlockLabel ??
    "undifferentiated presentation";
  const diagnosticConfidence = isDiagnosticallyInsufficient(analysis)
    ? "insufficient"
    : "sufficient";

  return {
    demographics: parseDemographics(input),
    diagnostic_confidence: diagnosticConfidence,
    presenting_problem: presentingProblem,
    history: buildHistoryFacts(input, detectedSlugs),
    relevant_background: buildBackgroundFacts(detectedSlugs, input),
    examination: buildExaminationFacts(input, detectedSlugs),
    investigations: buildInvestigationFacts(analysis),
    important_negatives: unique(input ? extractImportantNegatives(input) : []).slice(0, 5),
    priority_concerns: buildPriorityConcerns(analysis),
    uncertainty_guidance: uncertaintyGuidance(analysis),
    uncertainty_summary: diagnosticConfidence === "insufficient"
      ? "Clinical information is insufficient to support a reliable diagnosis."
      : undefined,
  };
}

function demographicPhrase(facts: PresentationFacts) {
  const age = facts.demographics.age ? `${facts.demographics.age}-year-old` : undefined;
  const sex = facts.demographics.sex === "male"
    ? "man"
    : facts.demographics.sex === "female"
      ? "woman"
      : undefined;

  return [age, sex].filter(Boolean).join(" ") || "patient";
}

function sentenceList(values: string[]) {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  return `${values.slice(0, -1).join(", ")} and ${values.at(-1)}`;
}

function canonicalisePainFactsForRendering(values: string[]) {
  const specificPainFacts = [
    "epigastric pain",
    "RUQ pain",
    "RIF pain",
    "central chest pain",
    "chest heaviness",
    "generalised abdominal pain",
    "upper abdominal pain",
    "lower abdominal pain",
  ];
  const hasSpecificAbdominalPain = values.some((value) =>
    specificPainFacts.includes(value) && /abdominal|epigastric|RUQ|RIF/i.test(value),
  );

  if (!hasSpecificAbdominalPain) {
    return values;
  }

  return values.filter((value) => value !== "abdominal pain");
}

function canonicaliseInvestigationFactsForRendering(values: string[]) {
  const hasSevereAnaemia = values.includes("Severe anaemia");
  const hasMicrocyticAnaemia = values.includes("microcytic anaemia pattern");

  if (hasSevereAnaemia && hasMicrocyticAnaemia) {
    return [
      "severe microcytic anaemia",
      ...values.filter((value) =>
        value !== "Severe anaemia" &&
          value !== "anaemia" &&
          value !== "microcytic anaemia pattern",
      ),
    ];
  }

  if (hasSevereAnaemia) {
    return values.filter((value) => value !== "anaemia");
  }

  if (hasMicrocyticAnaemia) {
    return values.filter((value) => value !== "anaemia");
  }

  return values;
}

function canonicaliseFactsForRendering(values: string[]) {
  return unique(canonicalisePainFactsForRendering(canonicaliseInvestigationFactsForRendering(values)));
}

export function renderDeterministicPresentationFromFacts(facts: PresentationFacts) {
  const openingFeatures = canonicaliseFactsForRendering(facts.history).slice(0, 4);
  const openingDetail = openingFeatures.length > 0
    ? ` with ${sentenceList(openingFeatures)}`
    : "";
  const sentences = [
    `A ${demographicPhrase(facts)} presents with ${facts.presenting_problem.toLowerCase()}${openingDetail}.`,
  ];
  const background = facts.relevant_background.slice(0, 3);

  if (background.length > 0) {
    sentences.push(`Relevant background includes ${sentenceList(background)}.`);
  }

  const clinicalState = canonicaliseFactsForRendering([
    ...facts.examination.slice(0, 3),
    ...canonicaliseFactsForRendering(facts.investigations).slice(0, 3),
  ]);

  if (clinicalState.length > 0) {
    sentences.push(`Assessment highlights ${sentenceList(clinicalState)}.`);
  }

  if (facts.diagnostic_confidence === "insufficient") {
    sentences.push(facts.uncertainty_summary ?? "The presentation remains diagnostically non-specific.");
  } else if (facts.priority_concerns[0]) {
    sentences.push(`Overall, this is most concerning for ${facts.priority_concerns[0]}.`);
  } else {
    sentences.push("Overall, the presentation remains diagnostically non-specific.");
  }

  return sentences.slice(0, 4).join(" ");
}

export type PresentationQualityAssessment = {
  compression: boolean;
  prioritisation: boolean;
  naturalLanguage: boolean;
  clinicalFlow: boolean;
  noHallucinations: boolean;
  noRepetition: boolean;
  spokenReadability: boolean;
  noUnsupportedDiagnosisMentions: boolean;
  noLiteralUncertaintyLabels: boolean;
  noGenericManagementFiller: boolean;
  noTemporalDistortion: boolean;
  noDuplicatedComorbidityLabels: boolean;
  requiredDiscriminativeFeaturesRetained: boolean;
  noTopThreeDifferentialListing: boolean;
  notOverlyTemplated: boolean;
};

const KNOWN_DIAGNOSIS_TERMS = [
  "acute coronary syndrome",
  "acs",
  "pulmonary embolism",
  "pe",
  "pneumothorax",
  "acute aortic syndrome",
  "aortic dissection",
  "diabetic ketoacidosis",
  "dka",
  "acute cholangitis",
  "acute hepatitis",
  "choledocholithiasis",
  "obstructive jaundice",
  "gi bleed",
  "gastrointestinal bleed",
  "mesenteric ischaemia",
  "mesenteric ischemia",
  "pneumonia",
  "sepsis",
  "temporal arteritis",
  "appendicitis",
  "stroke",
  "copd exacerbation",
];

const DIAGNOSIS_EQUIVALENTS: Record<string, string[]> = {
  "Acute coronary syndrome": ["acute coronary syndrome", "acs", "myocardial infarction", "mi"],
  "Pulmonary embolism": ["pulmonary embolism", "pe"],
  Pneumothorax: ["pneumothorax"],
  "Acute aortic syndrome": ["acute aortic syndrome", "aortic dissection"],
  "Diabetic ketoacidosis": ["diabetic ketoacidosis", "dka"],
  "Acute cholangitis": ["acute cholangitis", "cholangitis"],
  "Acute hepatitis": ["acute hepatitis", "hepatitis"],
  "GI bleed": ["gi bleed", "gastrointestinal bleed", "upper gi bleed"],
  "Mesenteric ischaemia": ["mesenteric ischaemia", "mesenteric ischemia"],
  Pneumonia: ["pneumonia"],
  "COPD exacerbation": ["copd exacerbation"],
};

const GENERIC_MANAGEMENT_FILLER = [
  "further evaluation is warranted",
  "continuous monitoring is essential",
  "appropriate management is needed",
  "further intervention should be considered",
  "requires further management",
  "ongoing monitoring",
];

function containsTerm(text: string, term: string) {
  const textTokens = text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const termTokens = term
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (termTokens.length === 0 || textTokens.length < termTokens.length) {
    return false;
  }

  return textTokens.some((_, index) =>
    termTokens.every((token, tokenIndex) => textTokens[index + tokenIndex] === token),
  );
}

function allowedDiagnosisTerms(facts: PresentationFacts) {
  return new Set(
    facts.priority_concerns.flatMap((diagnosis) =>
      DIAGNOSIS_EQUIVALENTS[diagnosis] ?? [diagnosis.toLowerCase()],
    ).map((term) => term.toLowerCase()),
  );
}

function requiredDiscriminativeTerms(facts: PresentationFacts) {
  return [...facts.history, ...facts.examination].filter((fact) =>
    [
      "pain out of proportion",
      "productive cough",
      "focal crackles",
      "crackles",
      "melaena",
      "haematemesis",
      "jaundice",
      "radiates to the jaw",
      "radiates to the left arm",
      "Kussmaul breathing",
    ].includes(fact),
  );
}

export function assessPresentationQuality(
  presentation: string,
  facts: PresentationFacts,
): PresentationQualityAssessment {
  const words = presentation.trim().split(/\s+/).filter(Boolean);
  const lower = presentation.toLowerCase();
  const allowedTerms = new Set([
    ...facts.priority_concerns.map((term) => term.toLowerCase()),
    ...facts.history.map((term) => term.toLowerCase()),
    ...facts.relevant_background.map((term) => term.toLowerCase()),
    ...facts.examination.map((term) => term.toLowerCase()),
    ...facts.investigations.map((term) => term.toLowerCase()),
  ]);
  const repeatedSentences = presentation
    .split(/[.!?]/)
    .map((sentence) => sentence.trim().toLowerCase())
    .filter(Boolean);
  const allowedDiagnoses = allowedDiagnosisTerms(facts);
  const unsupportedDiagnosisMentioned = KNOWN_DIAGNOSIS_TERMS.some((term) =>
    containsTerm(lower, term) &&
      !allowedDiagnoses.has(term) &&
      ![...allowedDiagnoses].some((allowed) => term.includes(allowed) || allowed.includes(term)),
  );
  const requiredTerms = requiredDiscriminativeTerms(facts);
  const transitionStarts = repeatedSentences.filter((sentence) =>
    /^(this is|on examination|given|overall|there is|the patient)/.test(sentence),
  ).length;
  const topThreeListed = facts.priority_concerns.length >= 3 &&
    facts.priority_concerns.every((concern) => lower.includes(concern.toLowerCase()));

  return {
    compression: words.length >= 20 && words.length <= 150,
    prioritisation: facts.diagnostic_confidence === "insufficient" ||
      facts.priority_concerns.some((concern) =>
        (DIAGNOSIS_EQUIVALENTS[concern] ?? [concern]).some((term) => lower.includes(term.toLowerCase())),
      ),
    naturalLanguage: !/^(features|history|background|examination|investigations):/i.test(presentation),
    clinicalFlow: /present(?:s|ed|ing)|admitted|attend|history of/i.test(presentation) &&
      /(overall|most|concern|in keeping with|raises|non-specific|insufficient|support a reliable diagnosis)/i.test(presentation),
    noHallucinations: !["stroke", "pancreatitis", "appendicitis", "pneumothorax", "pulmonary embolism"]
      .some((term) => lower.includes(term) && !allowedTerms.has(term)),
    noRepetition: repeatedSentences.length === new Set(repeatedSentences).size,
    spokenReadability: presentation.split(/\n\s*\n/).length <= 4 && !presentation.includes("*"),
    noUnsupportedDiagnosisMentions: !unsupportedDiagnosisMentioned,
    noLiteralUncertaintyLabels: !/\b(?:low|moderate|high) uncertainty\b/i.test(presentation),
    noGenericManagementFiller: !GENERIC_MANAGEMENT_FILLER.some((term) => lower.includes(term)),
    noTemporalDistortion: !(lower.includes("10 days") && lower.includes("chest pain for")),
    noDuplicatedComorbidityLabels: !/(type 1 diabetes[^.]+type 2 diabetes|type 2 diabetes[^.]+type 1 diabetes|copd[^.]+copd|hypertension[^.]+hypertension)/i.test(presentation),
    requiredDiscriminativeFeaturesRetained: requiredTerms.every((term) => lower.includes(term.toLowerCase())),
    noTopThreeDifferentialListing: !topThreeListed,
    notOverlyTemplated: transitionStarts <= 2,
  };
}
