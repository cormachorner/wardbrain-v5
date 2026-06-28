import { canonicalFeatureSlug } from "../domain/featureSlug";
import type { ExtractedFeatures } from "../types";
import type { LlmProposedFeature } from "./schema";

export type LlmClinicalSanityRejectionReason =
  | "negated_evidence"
  | "contradictory_evidence"
  | "insufficient_evidence"
  | "safer_alternative_feature"
  | "insufficient_instability_for_shock"
  | "dangerous_feature_requires_explicit_evidence"
  | "already_present_deterministically";

export type RejectedLlmFeature = LlmProposedFeature & {
  reason: LlmClinicalSanityRejectionReason;
  suggestedAlternative?: string;
  source: "negation" | "dangerous_feature" | "deterministic_context" | "evidence_quality";
};

export type LlmClinicalSanityFilterResult = {
  acceptedFeatures: LlmProposedFeature[];
  rejectedFeatures: RejectedLlmFeature[];
};

const FEATURE_KEYWORDS: Record<string, string[]> = {
  abdominal_pain: ["abdominal pain", "tummy pain", "belly pain", "abdominal discomfort"],
  chest_heaviness: ["chest heaviness", "heavy feeling", "heavy chest", "someone is sitting on his chest", "someone sitting on chest"],
  colicky_pain: ["colicky pain", "comes in waves", "pain comes in waves", "waves of pain"],
  constant_pain: ["constant pain", "become more constant", "became constant"],
  calf_swelling: ["calf swelling", "calf swollen", "swollen calf", "calf"],
  chest_pain: ["chest pain", "chest discomfort", "chest pressure", "chest tightness"],
  collapse: ["collapse", "collapsed", "syncope", "fainted", "passed out"],
  crackles: ["crackles", "focal crackles", "bibasal crackles", "crepitations"],
  diabetic_context: ["diabetes", "diabetic", "type 1 diabetes", "type 2 diabetes"],
  distension: ["distension", "distended", "abdominal swelling", "swollen abdomen", "ballooned", "bloated"],
  dvt_signs: ["dvt", "calf tenderness", "tender calf", "painful swollen calf", "swollen tender calf"],
  dysuria: ["dysuria", "burning urine", "pain passing urine", "urinary symptoms"],
  dyspnoea: ["shortness of breath", "breathless", "breathlessness", "dyspnoea", "dyspnea"],
  exertional_pain: ["exertional", "on exertion", "mowing the lawn", "walks uphill", "walking uphill", "climbing stairs"],
  fever: ["fever", "febrile", "temperature", "pyrexia"],
  focal_neurology: ["focal neurology", "weakness", "facial droop", "slurred speech", "hemiparesis"],
  guarding: ["guarding", "guarded", "abdominal guarding"],
  haemoptysis: ["haemoptysis", "hemoptysis", "coughing blood", "coughed up blood", "blood-streaked sputum"],
  hyperlipidaemia: ["hyperlipidaemia", "hyperlipidemia", "high cholesterol", "raised cholesterol"],
  hypoxia: ["hypoxia", "hypoxic", "low sats", "sats", "oxygen saturations", "spo2"],
  hypotension: ["hypotension", "hypotensive", "low blood pressure", "bp", "systolic"],
  indigestion_like_chest_pain: ["indigestion", "indigestion-like", "indigestion like", "reflux-like", "heartburn"],
  ketosis_breath: ["fruity breath", "pear-drop breath", "pear drop breath", "ketotic breath", "breath smells fruity", "breath smells of pear drops"],
  kussmaul_breathing: ["kussmaul", "deep breathing", "deep sighing breaths", "breathing very deeply", "big deep sighing breaths"],
  leg_swelling: ["leg swelling", "swollen legs", "legs swollen", "calf swelling", "ankle swelling"],
  nausea: ["nausea", "nauseated", "felt sick", "feeling sick", "sick"],
  neck_stiffness: ["neck stiffness", "stiff neck", "meningism"],
  non_blanching_rash: ["non-blanching rash", "non blanching rash", "petechial rash", "purpuric rash"],
  normal_exam: ["normal exam", "normal chest exam", "normal examination", "chest clear"],
  normal_oxygen_saturations: ["normal sats", "normal oxygen saturations", "sats are 99", "sats 99", "sats are 100"],
  obstipation: ["obstipation", "not passed stool", "hasn't passed stool", "hasn’t passed stool", "nothing out either end"],
  panic_features: ["panic", "panic attack", "anxiety", "anxious"],
  pain_radiates_to_jaw: ["radiates to jaw", "spread to jaw", "spread into his jaw", "jaw radiation"],
  pain_radiates_to_shoulder: ["radiates to shoulder", "spread to shoulder", "left shoulder", "right shoulder"],
  polydipsia: ["polydipsia", "thirsty", "drinking constantly", "can't stop drinking"],
  polyuria: ["polyuria", "peeing constantly", "passing lots of urine", "passing urine a lot"],
  perioral_paraesthesia: ["perioral paraesthesia", "perioral paresthesia", "tingling around mouth", "tingling lips"],
  pregnancy_possible: ["pregnant", "pregnancy", "missed period", "positive pregnancy test", "lmp"],
  positive_pregnancy_test: ["positive pregnancy test", "positive test", "pregnancy test positive"],
  previous_abdominal_surgery: ["previous abdominal surgery", "previous hysterectomy", "previous bowel surgery", "prior abdominal surgery"],
  productive_cough: ["productive cough", "coughing sputum", "coughing phlegm"],
  progressive_course: ["progressive", "worsening", "days of worsening"],
  recent_surgery: ["recent surgery", "recent operation", "knee operation", "knee surgery", "post-op", "post operative"],
  reduced_air_entry: ["reduced air entry", "reduced breath sounds", "quiet chest", "very quiet"],
  rebound_tenderness: ["rebound", "rebound tenderness"],
  rigidity: ["rigidity", "rigid", "board-like", "board like"],
  generalised_peritonism: ["peritonism", "peritonitic", "generalised peritonism", "generalized peritonism"],
  shock: ["shock", "shocked", "hypotension", "hypotensive", "low blood pressure", "collapse", "collapsed", "bp"],
  shortness_of_breath: ["shortness of breath", "breathless", "breathlessness", "dyspnoea", "dyspnea"],
  silent_chest: ["silent chest"],
  sob: ["shortness of breath", "breathless", "breathlessness", "sob", "dyspnoea", "dyspnea"],
  sputum_change: ["sputum change", "green sputum", "increased sputum", "changed sputum"],
  sweating: ["sweating", "sweaty", "clammy", "clamminess", "diaphoretic"],
  tachycardia: ["tachycardia", "tachycardic", "hr", "heart rate", "pulse"],
  tingling: ["tingling", "pins and needles"],
  tracheal_deviation: ["tracheal deviation", "trachea deviated", "trachea shifted", "deviated trachea"],
  type_1_diabetes: ["type 1 diabetes", "t1dm", "type one diabetes"],
  unable_to_pass_flatus: ["unable to pass flatus", "not passed flatus", "hasn't passed flatus", "hasn’t passed flatus", "nothing out either end"],
  unilateral_leg_swelling: [
    "unilateral leg swelling",
    "one leg swollen",
    "one swollen leg",
    "left leg swollen",
    "right leg swollen",
    "left calf swollen",
    "right calf swollen",
  ],
  unilateral_reduced_air_entry: [
    "unilateral reduced air entry",
    "left chest quiet",
    "right chest quiet",
    "left-sided reduced air entry",
    "right-sided reduced air entry",
    "one side quiet",
  ],
  urinary_frequency: ["urinary frequency", "frequency", "urinary symptoms"],
  urinary_symptoms: ["urinary symptoms", "dysuria", "frequency"],
  vaginal_bleeding: ["vaginal bleeding", "pv bleeding", "bleeding"],
  vomiting: ["vomiting", "vomited", "being sick"],
  wheeze: ["wheeze", "wheezy", "wheezing"],
};

const DANGEROUS_FEATURES = new Set([
  "calf_swelling",
  "collapse",
  "dvt_signs",
  "focal_neurology",
  "guarding",
  "haemoptysis",
  "hypotension",
  "neck_stiffness",
  "non_blanching_rash",
  "positive_pregnancy_test",
  "pregnancy_possible",
  "rebound_tenderness",
  "reduced_air_entry",
  "rigidity",
  "generalised_peritonism",
  "shock",
  "silent_chest",
  "tracheal_deviation",
  "unilateral_leg_swelling",
  "unilateral_reduced_air_entry",
  "vaginal_bleeding",
]);

const NEGATION_TERMS =
  "(?:no|not|denies|denied|without|absent|none|negative for|free of|no evidence of|no obvious|no clear|rather than|instead of)";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function evidenceText(feature: LlmProposedFeature) {
  return feature.evidence.trim().toLowerCase();
}

function keywordsForFeature(slug: string) {
  return FEATURE_KEYWORDS[slug] ?? [slug.replaceAll("_", " ")];
}

function evidenceContainsAny(evidence: string, keywords: readonly string[]) {
  return keywords.some((keyword) => new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i").test(evidence));
}

function evidenceHasLocalNegation(slug: string, evidence: string) {
  const keywords = keywordsForFeature(slug);

  return keywords.some((keyword) => {
    const escaped = escapeRegex(keyword);
    const negatedBefore = new RegExp(`${NEGATION_TERMS}\\s+(?:\\w+\\s+){0,5}${escaped}\\b`, "i");
    const negatedAfter = new RegExp(`\\b${escaped}\\b\\s+(?:\\w+\\s+){0,4}(?:absent|negative|denied)\\b`, "i");

    return negatedBefore.test(evidence) || negatedAfter.test(evidence);
  });
}

function hasLowBpEvidence(evidence: string) {
  return /\b(?:bp|blood pressure)\s*(?:is|of|=|:)?\s*(?:[5-8]\d|90)\s*\/\s*\d{2,3}\b/.test(evidence) ||
    /\bsystolic\s*(?:is|of|=|:)?\s*(?:[5-8]\d|90)\b/.test(evidence) ||
    /\b(?:hypotension|hypotensive|unrecordable bp|unrecordable blood pressure|low blood pressure)\b/.test(evidence);
}

function hasShockEvidence(evidence: string) {
  return /\b(?:shock|shocked|in shock)\b/.test(evidence) ||
    hasLowBpEvidence(evidence) ||
    /\b(?:collapse|collapsed|passed out|syncope)\b/.test(evidence) ||
    /\b(?:cold peripheries|poor perfusion)\b.*\b(?:hypotension|hypotensive|bp|blood pressure)\b/.test(evidence);
}

function saferAlternativeFor(slug: string, evidence: string): string | undefined {
  if (
    ["unilateral_leg_swelling", "calf_swelling", "dvt_signs"].includes(slug) &&
    /\b(?:swollen ankles|ankle swelling|ankles swollen|peripheral oedema|peripheral edema|bilateral leg swelling|swollen legs|legs swollen)\b/.test(evidence) &&
    !/\b(?:unilateral|one|single|left|right|calf|tender|dvt)\b/.test(evidence)
  ) {
    return evidence.includes("ankle") ? "ankle_swelling" : "leg_swelling";
  }

  if (
    ["rigidity", "generalised_peritonism", "rebound_tenderness"].includes(slug) &&
    /\b(?:minimal tenderness|mild tenderness|mildly tender|soft abdomen|soft abdominal exam|minimal abdominal findings)\b/.test(evidence)
  ) {
    return evidence.includes("soft") ? "soft_abdomen" : "mild_tenderness";
  }

  if (slug === "hypoxia" && /\b(?:breathing fast|breathing quickly|fast breathing|tachypnoea|tachypnea)\b/.test(evidence) && !/\b(?:sats|spo2|oxygen|hypoxi|low saturations)\b/.test(evidence)) {
    return "tachypnoea";
  }

  if (slug === "collapse" && /\b(?:felt faint|feels faint|lightheaded|dizzy)\b/.test(evidence) && !/\b(?:collapsed|collapse|passed out|syncope|fainted)\b/.test(evidence)) {
    return "dizziness";
  }

  return undefined;
}

function hasDangerousExplicitEvidence(slug: string, evidence: string) {
  if (slug === "shock") {
    return hasShockEvidence(evidence);
  }

  if (slug === "hypotension") {
    return hasLowBpEvidence(evidence);
  }

  if (slug === "unilateral_leg_swelling") {
    return /\b(?:unilateral|one|single|left|right)\b/.test(evidence) && /\b(?:leg|calf)\b/.test(evidence);
  }

  if (slug === "calf_swelling") {
    return /\bcalf\b/.test(evidence) && /\b(?:swelling|swollen|tender|painful)\b/.test(evidence);
  }

  if (slug === "dvt_signs") {
    return /\b(?:dvt|calf tenderness|tender calf|painful swollen calf|swollen tender calf|calf is swollen and tender)\b/.test(evidence);
  }

  if (slug === "unilateral_reduced_air_entry") {
    return /\b(?:left|right|unilateral|one side|one-sided)\b/.test(evidence) &&
      /\b(?:quiet|reduced air entry|reduced breath sounds|very quiet|air entry)\b/.test(evidence);
  }

  if (slug === "reduced_air_entry") {
    return /\b(?:reduced air entry|reduced breath sounds|quiet chest|very quiet chest)\b/.test(evidence);
  }

  return evidenceContainsAny(evidence, keywordsForFeature(slug));
}

function deterministicHas(features: ExtractedFeatures, slug: string) {
  return features.matchedFeatures.includes(slug);
}

function contradictsDeterministicContext(slug: string, evidence: string, deterministicFeatures: ExtractedFeatures) {
  if (
    slug === "hypoxia" &&
    deterministicHas(deterministicFeatures, "normal_oxygen_saturations") &&
    !/\b(?:sats|spo2|oxygen saturations?)\s*(?:[5-8]\d|90)\b|\b(?:hypoxi|low sats|low oxygen)\b/.test(evidence)
  ) {
    return true;
  }

  if (
    slug === "guarding" &&
    deterministicHas(deterministicFeatures, "no_guarding")
  ) {
    return true;
  }

  if (
    ["rigidity", "generalised_peritonism", "rebound_tenderness"].includes(slug) &&
    deterministicHas(deterministicFeatures, "no_guarding") &&
    !hasDangerousExplicitEvidence(slug, evidence)
  ) {
    return true;
  }

  if (
    ["rigidity", "generalised_peritonism", "rebound_tenderness"].includes(slug) &&
    (deterministicHas(deterministicFeatures, "mild_tenderness") ||
      deterministicHas(deterministicFeatures, "minimal_tenderness") ||
      deterministicHas(deterministicFeatures, "pain_severe_but_exam_mild")) &&
    !hasDangerousExplicitEvidence(slug, evidence)
  ) {
    return true;
  }

  if (
    ["focal_neurology", "tracheal_deviation", "unilateral_reduced_air_entry", "reduced_air_entry", "neck_stiffness"].includes(slug) &&
    deterministicHas(deterministicFeatures, "normal_exam") &&
    !hasDangerousExplicitEvidence(slug, evidence)
  ) {
    return true;
  }

  return false;
}

function reject(
  feature: LlmProposedFeature,
  reason: LlmClinicalSanityRejectionReason,
  source: RejectedLlmFeature["source"],
  suggestedAlternative?: string,
): RejectedLlmFeature {
  return {
    ...feature,
    reason,
    source,
    suggestedAlternative,
  };
}

export function filterLlmFeaturesForClinicalSanity(
  proposedFeatures: readonly LlmProposedFeature[],
  deterministicFeatures: ExtractedFeatures,
): LlmClinicalSanityFilterResult {
  const acceptedFeatures: LlmProposedFeature[] = [];
  const rejectedFeatures: RejectedLlmFeature[] = [];
  const deterministic = new Set(deterministicFeatures.matchedFeatures.map(canonicalFeatureSlug));

  for (const feature of proposedFeatures) {
    const slug = canonicalFeatureSlug(feature.slug);
    const evidence = evidenceText(feature);
    const canonicalFeature = { ...feature, slug };

    if (!slug) {
      rejectedFeatures.push(reject(canonicalFeature, "insufficient_evidence", "evidence_quality"));
      continue;
    }

    if (deterministic.has(slug)) {
      rejectedFeatures.push(
        reject(canonicalFeature, "already_present_deterministically", "deterministic_context"),
      );
      continue;
    }

    if (!evidence || evidence.length < 3) {
      rejectedFeatures.push(reject(canonicalFeature, "insufficient_evidence", "evidence_quality"));
      continue;
    }

    if (evidenceHasLocalNegation(slug, evidence)) {
      rejectedFeatures.push(reject(canonicalFeature, "negated_evidence", "negation"));
      continue;
    }

    const suggestedAlternative = saferAlternativeFor(slug, evidence);

    if (suggestedAlternative) {
      rejectedFeatures.push(
        reject(canonicalFeature, "safer_alternative_feature", "evidence_quality", suggestedAlternative),
      );
      continue;
    }

    if (contradictsDeterministicContext(slug, evidence, deterministicFeatures)) {
      rejectedFeatures.push(reject(canonicalFeature, "contradictory_evidence", "deterministic_context"));
      continue;
    }

    if (slug === "shock" && !hasShockEvidence(evidence)) {
      rejectedFeatures.push(
        reject(canonicalFeature, "insufficient_instability_for_shock", "dangerous_feature", "sweating"),
      );
      continue;
    }

    if (DANGEROUS_FEATURES.has(slug) && !hasDangerousExplicitEvidence(slug, evidence)) {
      rejectedFeatures.push(
        reject(canonicalFeature, "dangerous_feature_requires_explicit_evidence", "dangerous_feature"),
      );
      continue;
    }

    if (!DANGEROUS_FEATURES.has(slug) && !evidenceContainsAny(evidence, keywordsForFeature(slug))) {
      rejectedFeatures.push(reject(canonicalFeature, "insufficient_evidence", "evidence_quality"));
      continue;
    }

    acceptedFeatures.push(canonicalFeature);
  }

  return {
    acceptedFeatures,
    rejectedFeatures,
  };
}
