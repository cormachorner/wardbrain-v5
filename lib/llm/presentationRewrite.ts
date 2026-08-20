import { CONDITION_PROMOTION_REGISTRY } from "../domain/conditionPromotionRegistry";
import { DIAGNOSIS_RULES } from "../domain/diagnosisRules";
import { ALL_PRESENTATION_BLOCK_DIAGNOSES } from "../domain/presentationBlocks";
import type { AnalyzeCaseResponse, CaseInput } from "../types";
import { openAiLlmCompletionClient, type LlmCompletionClient } from "./client";
import {
  getLlmPresentationConfig,
  type LlmPresentationConfig,
} from "./config";
import {
  buildPresentationFacts,
  renderDeterministicPresentationFromFacts,
  type PresentationFacts,
} from "./presentationFactsBuilder";

export type LlmPresentationRewriteMetadata = {
  llmPresentationAttempted: boolean;
  llmPresentationUsed: boolean;
  presentationSource: "deterministic" | "llm" | "llm_repair" | "fallback";
  llmPresentationRepairAttempted?: boolean;
  llmPresentationOriginalOutput?: string;
  llmPresentationOriginalFailureReason?: string;
  llmPresentationOriginalFailureTrigger?: string;
  llmPresentationRepairedOutput?: string;
  llmPresentationRepairedFailureReason?: string;
  llmPresentationRepairedFailureTrigger?: string;
  llmPresentationFallbackReason?: string;
  llmPresentationFallbackTrigger?: string;
};

type LlmPresentationRewriteResult = {
  presentation: string;
  metadata: LlmPresentationRewriteMetadata;
};

type LlmPresentationValidation = {
  presentation?: string;
  fallbackReason?: string;
  fallbackTrigger?: string;
};

const MAX_PRESENTATION_WORDS = 150;
const PROMPT_WORD_LIMIT = 120;
const loggedPresentationFallbackReasons = new Set<string>();

const PRESENTATION_DIAGNOSIS_ALIASES: Record<string, string[]> = {
  "acute coronary syndrome": [
    "ACS",
    "acute coronary syndrome",
    "myocardial infarction",
    "MI",
    "heart attack",
    "cardiac ischaemia",
    "ischaemic chest pain",
  ],
  "pulmonary embolism": [
    "PE",
    "pulmonary embolism",
    "blood clot in the lung",
  ],
  pneumothorax: [
    "pneumothorax",
    "collapsed lung",
  ],
  "acute aortic syndrome": [
    "acute aortic syndrome",
    "aortic dissection",
    "dissection",
  ],
  "diabetic ketoacidosis": [
    "DKA",
    "diabetic ketoacidosis",
    "ketoacidosis",
  ],
  "heart failure": [
    "heart failure",
    "pulmonary oedema",
    "fluid overload",
  ],
  "bowel obstruction": [
    "bowel obstruction",
    "intestinal obstruction",
    "obstruction",
  ],
  "ovarian torsion": [
    "ovarian torsion",
    "torsion",
  ],
  "perforated viscus": [
    "perforated viscus",
    "perforation",
    "peritonitis",
  ],
};

const BENIGN_COMPARATOR_TERMS = new Set([
  "constipation",
]);

const REPAIRABLE_PRESENTATION_FAILURES = new Set([
  "unsupported_diagnosis_added",
  "missing_top_diagnosis",
  "literal_uncertainty_label",
  "generic_management_filler",
  "missing_required_clinical_fact",
  "too_long",
  "wrong_format",
]);

const GENERIC_MANAGEMENT_FILLER = [
  "further evaluation is warranted",
  "continuous monitoring is essential",
  "appropriate management is needed",
  "further intervention should be considered",
  "requires further management",
  "ongoing monitoring",
];

const CRITICAL_FACT_CONCEPT_PATTERNS: Record<string, RegExp[]> = {
  "pain out of proportion": [/\bpain\s+out\s+of\s+proportion\b/i],
  "severe pain with mild examination findings": [
    /\bsevere\s+pain\s+with\s+mild\s+examination\b/i,
    /\bsevere\s+pain\s+despite\s+(?:a\s+)?mild\b/i,
    /\bexam(?:ination)?\s+is\s+mild\b/i,
  ],
  hypotension: [/\bhypotens(?:ion|ive)\b/i, /\blow\s+blood\s+pressure\b/i, /\bshock(?:ed)?\b/i],
  hypoxia: [/\bhypoxi(?:a|c)\b/i, /\blow\s+oxygen\b/i, /\blow\s+saturations\b/i, /\breduced\s+oxygen\s+saturations\b/i],
  hypoxaemia: [/\bhypox(?:a?emia|emia)\b/i, /\blow\s+oxygen\b/i, /\blow\s+pao?2\b/i],
  "reduced consciousness": [
    /\breduced\s+(?:level\s+of\s+)?conscious(?:ness)?\b/i,
    /\bdrows(?:y|iness)\b/i,
  ],
  drowsiness: [/\bdrows(?:y|iness)\b/i, /\breduced\s+(?:level\s+of\s+)?conscious(?:ness)?\b/i],
  "respiratory distress": [/\brespiratory\s+distress\b/i, /\bdistressed\s+breathing\b/i],
  "unable to speak in full sentences": [
    /\bunable\s+to\s+speak\s+in\s+full\s+sentences\b/i,
    /\bcannot\s+speak\s+in\s+full\s+sentences\b/i,
  ],
  "Severe anaemia": [
    /\bsevere\s+ana?emia\b/i,
    /\bsevere\s+\w+\s+ana?emia\b/i,
    /\bprofound\s+ana?emia\b/i,
    /\bprofound\s+\w+\s+ana?emia\b/i,
    /\bh(?:ae|e)moglobin\s+is\s+marked(?:ly)?\s+reduced\b/i,
    /\bmarked(?:ly)?\s+reduced\s+h(?:ae|e)moglobin\b/i,
    /\bseverely\s+reduced\s+h(?:ae|e)moglobin\b/i,
    /\bsevere\s+reduction\s+in\s+h(?:ae|e)moglobin\b/i,
    /\bhb\s+\d+(?:\.\d+)?\s*(?:g\/?l)?\s+with\s+significant\s+ana?emia\b/i,
  ],
  "Markedly raised lactate": [/\bmarkedly\s+raised\s+lactate\b/i, /\braised\s+lactate\b/i, /\bhigh\s+lactate\b/i],
};

const CLINICAL_FACT_CONCEPT_PATTERNS: Record<string, RegExp[]> = {
  ...CRITICAL_FACT_CONCEPT_PATTERNS,
  "microcytic anaemia pattern": [
    /\bmicrocytic\s+ana?emia\b/i,
    /\bmicrocytic\s+pattern\b/i,
    /\bana?emia\s+with\s+(?:a\s+)?microcytic\s+pattern\b/i,
    /\blow\s+h(?:ae|e)moglobin\s+with\s+low\s+mcv\b/i,
  ],
};

const AMBIGUOUS_CLINICAL_DIAGNOSIS_TERMS = new Set([
  "anaemia",
  "anemia",
]);

function emptyResult(
  deterministicPresentation: string,
  fallbackReason: string,
): LlmPresentationRewriteResult {
  return {
    presentation: deterministicPresentation,
    metadata: {
      llmPresentationAttempted: false,
      llmPresentationUsed: false,
      presentationSource: "deterministic",
      llmPresentationFallbackReason: fallbackReason,
    },
  };
}

function deterministicPresentation(
  analysis: AnalyzeCaseResponse,
  input?: CaseInput,
) {
  return renderDeterministicPresentationFromFacts(buildPresentationFacts(input, analysis));
}

function logPresentationFallback(reason: string, trigger?: string) {
  const logKey = trigger ? `${reason}:${trigger}` : reason;

  if (process.env.NODE_ENV === "production" || loggedPresentationFallbackReasons.has(logKey)) {
    return;
  }

  loggedPresentationFallbackReasons.add(logKey);
  console.warn(
    `WardBrain LLM presentation fallback: ${reason}${trigger ? ` (${trigger})` : ""}`,
  );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("LLM presentation rewrite timed out")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function normaliseText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function parsePresentationResponse(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as { presentation?: unknown };
    return typeof parsed.presentation === "string" ? parsed.presentation.trim() : null;
  } catch {
    return null;
  }
}

function diagnosisTerms(diagnosis: string) {
  const normalised = normaliseText(diagnosis);
  const terms = new Set([diagnosis]);

  for (const [canonicalDiagnosis, aliases] of Object.entries(PRESENTATION_DIAGNOSIS_ALIASES)) {
    if (normalised === normaliseText(canonicalDiagnosis)) {
      aliases.forEach((alias) => terms.add(alias));
    }
  }

  for (const entry of CONDITION_PROMOTION_REGISTRY) {
    const registryTerms = [entry.canonicalName, ...entry.aliases];

    if (registryTerms.some((term) => normalised === normaliseText(term))) {
      registryTerms.forEach((term) => terms.add(term));
    }
  }

  return [...terms];
}

function containsTerm(text: string, term: string) {
  const textTokens = normaliseText(text).split(" ").filter(Boolean);
  const termTokens = normaliseText(term).split(" ").filter(Boolean);

  if (termTokens.length === 0 || textTokens.length < termTokens.length) {
    return false;
  }

  return textTokens.some((_, index) =>
    termTokens.every((token, tokenIndex) => textTokens[index + tokenIndex] === token),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function diagnosisTermPattern(term: string) {
  return normaliseText(term)
    .split(" ")
    .filter(Boolean)
    .map(escapeRegExp)
    .join("\\W+");
}

function splitClinicalSentences(text: string) {
  return text
    .split(/(?<=[.!?;])\s+|\n+|,(?=\s*(?:with|although|though|but|and|or)\b)/i)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function clinicalFindingContextBeforeMention(value: string) {
  return /\b(?:investigations?|bloods?|labs?|laboratory|examination|assessment|haemoglobin|hemoglobin|hb|mcv|show|shows|showed|demonstrate|demonstrates|demonstrated|reveal|reveals|revealed|has|had|with|alongside|associated\s+with|evidence\s+of|severe|mild|moderate|marked|markedly|profound|microcytic|macrocytic|normocytic)\b/i.test(value);
}

function clinicalFindingContextAfterMention(value: string) {
  return /\b(?:pattern|finding|feature|on\s+bloods?|on\s+labs?|with\s+(?:a\s+)?microcytic\s+pattern|contributing\s+to\s+(?:his|her|their|the)\s+symptoms?)\b/i.test(value);
}

function isDiagnosisMentionSupportedClinicalFact(
  sentence: string,
  matchStart: number,
  matchEnd: number,
  term: string,
) {
  if (!AMBIGUOUS_CLINICAL_DIAGNOSIS_TERMS.has(normaliseText(term))) {
    return false;
  }

  const before = sentence.slice(Math.max(0, matchStart - 70), matchStart);
  const after = sentence.slice(matchEnd, Math.min(sentence.length, matchEnd + 90));

  return clinicalFindingContextBeforeMention(before) || clinicalFindingContextAfterMention(after);
}

function diagnosticCueBeforeMention(value: string) {
  return /\b(?:differentials?\s+(?:include|includes|included|are|were)|diagnos(?:is|es)\s+(?:include|includes|included|is|are|was|were|to\s+consider)|diagnostic\s+impressions?\s+(?:include|includes|included|is|are|was|were)|(?:leading|main|primary|working|clinical)?\s*impressions?\s+(?:include|includes|included|is|are|was|were)|(?:leading|main|primary|key|clinical)?\s*concerns?\s+(?:include|includes|included|is|are|was|were)|(?:most\s+)?(?:concerning|suggestive)\s+for|raises?\s+concerns?\s+for|in\s+keeping\s+with|consistent\s+with|could\s+(?:be|represent)|may\s+(?:be|represent)|might\s+(?:be|represent)|represents?|suspected|possible|probable|likely|consider(?:ed)?|rule\s+out|exclude)\b/i.test(value);
}

function diagnosticCueAfterMention(value: string) {
  return /\b(?:as\s+(?:another\s+|an?\s+|the\s+)?(?:diagnos(?:is|es)|differential|impression|concern|possibilit(?:y|ies)|alternative)|is\s+(?:also\s+)?(?:another\s+|an?\s+|the\s+)?(?:possible|probable|likely|suspected)\b|is\s+(?:another\s+|an?\s+|the\s+)?(?:possible\s+|probable\s+|likely\s+|suspected\s+)?(?:diagnos(?:is|es)|differential|impression|concern|possibilit(?:y|ies)|alternative)|(?:also\s+)?(?:a\s+)?(?:key|major)\s+concern|(?:also\s+)?(?:another\s+)?(?:possible\s+|probable\s+|likely\s+|suspected\s+)?(?:diagnos(?:is|es)|differential|impression|possibilit(?:y|ies)|alternative)|(?:also\s+)?(?:to\s+)?consider(?:ed)?|(?:requiring\s+)?urgent\s+exclusion|should\s+be\s+(?:considered|excluded|ruled\s+out))\b/i.test(value);
}

function isDiagnosisMentionInDiagnosticContext(
  sentence: string,
  matchStart: number,
  matchEnd: number,
  term: string,
) {
  const before = sentence.slice(Math.max(0, matchStart - 95), matchStart);
  const after = sentence.slice(matchEnd, Math.min(sentence.length, matchEnd + 95));

  if (diagnosticCueBeforeMention(before)) {
    return true;
  }

  if (
    diagnosticCueAfterMention(after) &&
    !/\bis\s+(?:also\s+)?likely\s+contributing\b/i.test(after)
  ) {
    return true;
  }

  if (!isDiagnosisMentionSupportedClinicalFact(sentence, matchStart, matchEnd, term)) {
    return diagnosticCueAfterMention(after);
  }

  return /\b(?:as\s+(?:another\s+)?(?:diagnos(?:is|es)|differential|alternative)|(?:diagnos(?:is|es)|differential|alternative)\s+to\s+consider)\b/i.test(after);
}

function diagnosisTermAppearsAsDiagnosticImpression(sentence: string, term: string) {
  const termPattern = diagnosisTermPattern(term);

  if (!termPattern) {
    return false;
  }

  const mentionPattern = new RegExp(`\\b${termPattern}\\b`, "gi");
  const matches = sentence.matchAll(mentionPattern);

  for (const match of matches) {
    const matchStart = match.index ?? 0;
    const matchEnd = matchStart + match[0].length;

    if (isDiagnosisMentionInDiagnosticContext(sentence, matchStart, matchEnd, term)) {
      return true;
    }
  }

  return false;
}

function getAllowedDiagnosisTerms(
  analysis: AnalyzeCaseResponse,
  facts?: PresentationFacts,
) {
  if (facts) {
    return [
      ...new Set(
        [
          ...facts.priority_concerns.flatMap(diagnosisTerms),
          ...analysis.redFlags.flatMap((flag) =>
            flag.boostDiagnoses
              .filter((diagnosis) => facts.priority_concerns.includes(diagnosis))
              .flatMap(diagnosisTerms),
          ),
        ].filter(Boolean),
      ),
    ];
  }

  if (isDiagnosticallyInsufficientForPresentation(analysis)) {
    return analysis.redFlags.flatMap((flag) => flag.boostDiagnoses.flatMap(diagnosisTerms));
  }

  return [
    ...new Set(
      [
        ...analysis.differentials
          .filter((differential, index) => index === 0 || differential.score >= 7)
          .slice(0, 2)
          .flatMap((differential) =>
          diagnosisTerms(differential.name),
        ),
        ...analysis.redFlags.flatMap((flag) => flag.boostDiagnoses.flatMap(diagnosisTerms)),
      ].filter(Boolean),
    ),
  ];
}

function permittedDiagnosticImpressions(facts: PresentationFacts) {
  return facts.priority_concerns;
}

function isDiagnosticallyInsufficientForPresentation(analysis: AnalyzeCaseResponse) {
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

function getKnownDiagnosisTerms() {
  return [
    ...new Set(
      [
        ...DIAGNOSIS_RULES.map((rule) => rule.name),
        ...ALL_PRESENTATION_BLOCK_DIAGNOSES.map((definition) => definition.name),
        ...CONDITION_PROMOTION_REGISTRY.flatMap((entry) => [
          entry.canonicalName,
          ...entry.aliases,
        ]),
      ].flatMap(diagnosisTerms),
    ),
  ];
}

function findUnsupportedDiagnosisTrigger(
  presentation: string,
  allowedTerms: ReadonlySet<string>,
) {
  return getKnownDiagnosisTerms().find((term) => {
    const normalisedTerm = normaliseText(term);

    return normalisedTerm.length > 1 &&
      !allowedTerms.has(normalisedTerm) &&
      !BENIGN_COMPARATOR_TERMS.has(normalisedTerm) &&
      splitClinicalSentences(presentation).some((sentence) =>
        containsTerm(sentence, term) &&
          diagnosisTermAppearsAsDiagnosticImpression(sentence, term),
      );
  });
}

function requiredCriticalFacts(facts: PresentationFacts | undefined) {
  if (!facts) {
    return [];
  }

  return [
    ...facts.history,
    ...facts.examination,
    ...facts.investigations,
  ].filter((fact) => CRITICAL_FACT_CONCEPT_PATTERNS[fact]);
}

function suppliedClinicalFacts(facts: PresentationFacts) {
  return [
    ...facts.history,
    ...facts.relevant_background,
    ...facts.examination,
    ...facts.investigations,
    ...facts.important_negatives,
  ];
}

function criticalFactConceptIsRetained(text: string, fact: string) {
  return CRITICAL_FACT_CONCEPT_PATTERNS[fact]?.some((pattern) => pattern.test(text)) ?? false;
}

function clinicalFactIsRetained(text: string, fact: string) {
  return CLINICAL_FACT_CONCEPT_PATTERNS[fact]?.some((pattern) => pattern.test(text)) ||
    containsTerm(text, fact);
}

function retainedClinicalFactsFromRejectedPresentation(
  facts: PresentationFacts,
  rejectedPresentation: string,
) {
  return [
    ...facts.history,
    ...facts.relevant_background,
    ...facts.examination,
    ...facts.investigations,
    ...facts.important_negatives,
  ].filter((fact) => clinicalFactIsRetained(rejectedPresentation, fact));
}

export function validateLlmPresentationRewrite(
  raw: string,
  analysis: AnalyzeCaseResponse,
  facts?: PresentationFacts,
): LlmPresentationValidation {
  const presentation = parsePresentationResponse(raw);

  if (!presentation) {
    return { fallbackReason: "invalid_json" };
  }

  if (wordCount(presentation) > MAX_PRESENTATION_WORDS) {
    return { fallbackReason: "too_long" };
  }

  if (presentation.split(/\n\s*\n/).length > 4 || /^\s*[-*•]/m.test(presentation)) {
    return { fallbackReason: "wrong_format" };
  }

  const allowedTerms = new Set(getAllowedDiagnosisTerms(analysis, facts).map(normaliseText));
  const introducedUnsupportedDiagnosis = findUnsupportedDiagnosisTrigger(
    presentation,
    allowedTerms,
  );

  if (introducedUnsupportedDiagnosis) {
    return {
      fallbackReason: "unsupported_diagnosis_added",
      fallbackTrigger: introducedUnsupportedDiagnosis,
    };
  }

  const topDiagnosis = facts
    ? permittedDiagnosticImpressions(facts)[0]
    : analysis.differentials[0]?.name;

  if (
    topDiagnosis &&
    !diagnosisTerms(topDiagnosis).some((term) => containsTerm(presentation, term))
  ) {
    return { fallbackReason: "missing_top_diagnosis" };
  }

  if (/\b(?:low|moderate|high) uncertainty\b/i.test(presentation)) {
    return { fallbackReason: "literal_uncertainty_label" };
  }

  const genericManagementFiller = GENERIC_MANAGEMENT_FILLER.find((term) =>
    containsTerm(presentation, term),
  );

  if (genericManagementFiller) {
    return {
      fallbackReason: "generic_management_filler",
      fallbackTrigger: genericManagementFiller,
    };
  }

  const missingCriticalFact = requiredCriticalFacts(facts).find((fact) =>
    !criticalFactConceptIsRetained(presentation, fact),
  );

  if (missingCriticalFact) {
    return {
      fallbackReason: "missing_required_clinical_fact",
      fallbackTrigger: missingCriticalFact,
    };
  }

  return { presentation };
}

function validationFailureDescription(validation: LlmPresentationValidation) {
  switch (validation.fallbackReason) {
    case "unsupported_diagnosis_added":
      return `it introduced a diagnosis that is not permitted: ${validation.fallbackTrigger ?? "unknown"}`;
    case "missing_top_diagnosis":
      return "it omitted the permitted clinical impression";
    case "literal_uncertainty_label":
      return "it used a literal uncertainty label";
    case "generic_management_filler":
      return "it added generic management filler";
    case "missing_required_clinical_fact":
      return `it omitted a critical clinical fact: ${validation.fallbackTrigger ?? "unknown"}`;
    case "too_long":
      return "it was too long";
    case "wrong_format":
      return "it used the wrong format";
    default:
      return validation.fallbackReason ?? "validation failed";
  }
}

function isRepairablePresentationFailure(validation: LlmPresentationValidation) {
  return Boolean(validation.fallbackReason && REPAIRABLE_PRESENTATION_FAILURES.has(validation.fallbackReason));
}

export function buildLlmPresentationRepairPrompt(params: {
  facts: PresentationFacts;
  rejectedPresentation: string;
  validation: LlmPresentationValidation;
}) {
  const permittedImpressions = permittedDiagnosticImpressions(params.facts);
  const requiredClinicalFacts = requiredCriticalFacts(params.facts);
  const validatedClinicalFactsInRejectedPresentation =
    retainedClinicalFactsFromRejectedPresentation(params.facts, params.rejectedPresentation);
  const clinicalPayload = {
    presentation_facts: params.facts,
    permitted_diagnostic_impressions: permittedImpressions,
    required_clinical_facts: requiredClinicalFacts,
    supplied_clinical_facts: suppliedClinicalFacts(params.facts),
    validated_clinical_facts_present_in_rejected_presentation: validatedClinicalFactsInRejectedPresentation,
  };
  const unsupportedDiagnosis = params.validation.fallbackTrigger ?? "the unsupported diagnosis";
  const factPreservationLines = [
    ...new Set([...requiredClinicalFacts, ...validatedClinicalFactsInRejectedPresentation]),
  ].map((fact) => `- Preserve ${fact}.`);

  return [
    "You are repairing a rejected WardBrain presentation rewrite.",
    "Return JSON only with this exact shape: {\"presentation\":\"...\"}",
    `The previous presentation was rejected because ${validationFailureDescription(params.validation)}.`,
    params.validation.fallbackReason === "unsupported_diagnosis_added"
      ? `Make the smallest possible edit: remove only the unsupported diagnosis mention (${unsupportedDiagnosis}) and any directly attached comparison wording. Preserve every other sentence and every validated clinical fact from the rejected presentation. Preserve the permitted lead impression. Do not rewrite unrelated sentences.`
      : "Rewrite it as a concise UK-style spoken ward presentation in 120 words or fewer, usually 2-4 sentences.",
    `Permitted diagnostic impressions: ${permittedImpressions.length > 0 ? permittedImpressions.join(", ") : "none"}.`,
    `Required clinical facts that must remain represented: ${requiredClinicalFacts.length > 0 ? requiredClinicalFacts.join(", ") : "none"}.`,
    "You may only name diagnoses included in permitted_diagnostic_impressions. Do not introduce alternative diagnoses from your own knowledge.",
    "If the permitted list is empty, do not name any diagnosis; describe the case as diagnostically non-specific.",
    "Use only supplied facts. Do not add management advice. Do not discuss validation.",
    "Preserve every required_clinical_fact using clinically equivalent wording; do not drop critical concepts during repair.",
    "Preserve the validated clinical facts listed in the payload unless the fact is inseparable from the unsupported diagnostic impression itself.",
    ...(
      params.validation.fallbackReason === "unsupported_diagnosis_added" && factPreservationLines.length > 0
        ? ["IMPORTANT:", ...factPreservationLines]
        : []
    ),
    "No bullet points. No markdown. Avoid literal uncertainty labels.",
    "",
    `Rejected presentation: ${params.rejectedPresentation}`,
    `Curated clinical payload: ${JSON.stringify(clinicalPayload)}`,
  ].join("\n");
}

export function buildLlmPresentationRewritePrompt(
  analysis: AnalyzeCaseResponse,
  input?: CaseInput,
) {
  const facts = buildPresentationFacts(input, analysis);
  const permittedImpressions = permittedDiagnosticImpressions(facts);
  const clinicalPayload = {
    presentation_facts: facts,
    permitted_diagnostic_impressions: permittedImpressions,
    allowed_diagnoses: permittedImpressions,
    red_flags: analysis.redFlags.map((flag) => ({
      name: flag.name,
      concern_diagnoses: flag.boostDiagnoses.filter((diagnosis) =>
        facts.priority_concerns.includes(diagnosis),
      ),
    })),
    impression_language:
      facts.uncertainty_guidance === "confident_impression"
        ? "Use phrases such as most in keeping with or highly concerning for."
        : facts.uncertainty_guidance === "cautious_impression"
          ? "Use phrases such as raises concern for or could represent."
          : "State that the presentation remains non-specific and does not yet support a reliable diagnosis.",
  };

  return [
    "You are a senior registrar helping a junior doctor improve their case presentation.",
    "Return JSON only with this exact shape: {\"presentation\":\"...\"}",
    `Write a concise UK-style spoken ward presentation to a registrar in ${PROMPT_WORD_LIMIT} words or fewer, usually 2-4 sentences.`,
    "No bullet points. No markdown.",
    "SYNTHESISE rather than summarise: group related findings, prioritise important information, remove repetition, and use natural spoken clinical language.",
    "Vary sentence construction and opening phrasing. Combine history, examination, and investigations where clinically coherent; avoid fixed transitions like 'This is', 'On examination', 'Given', and 'Overall' in every sentence.",
    "Use only the curated clinical payload below. Do not add symptoms, examination findings, diagnoses, investigations, management, or certainty not supplied.",
    "Use the exact diagnosis names supplied unless rewriting common abbreviations.",
    "You may only name diagnoses included in permitted_diagnostic_impressions. Do not introduce alternative diagnoses from your own knowledge.",
    "Common abbreviations for a permitted diagnosis such as ACS, PE, and DKA are acceptable.",
    "If permitted_diagnostic_impressions is empty, do not mention a named diagnosis; present the case as diagnostically non-specific.",
    "Do not write literal uncertainty labels such as low uncertainty, moderate uncertainty, or high uncertainty.",
    "Do not append generic management advice or invented plans. Ward presentation mode should usually end with the clinical impression.",
    "Imagine saying this aloud during a ward round: concise, prioritised, clinically natural, and educational.",
    "",
    `Curated clinical payload: ${JSON.stringify(clinicalPayload)}`,
  ].join("\n");
}

export async function rewritePresentationWithLlm(params: {
  analysis: AnalyzeCaseResponse;
  input?: CaseInput;
  config?: LlmPresentationConfig;
  client?: LlmCompletionClient;
}): Promise<LlmPresentationRewriteResult> {
  const config = params.config ?? getLlmPresentationConfig();
  const client = params.client ?? openAiLlmCompletionClient;

  if (!config.presentationEnabled) {
    logPresentationFallback("disabled");
    return emptyResult(deterministicPresentation(params.analysis, params.input), "disabled");
  }

  if (!config.enabled) {
    logPresentationFallback("disabled");
    return emptyResult(deterministicPresentation(params.analysis, params.input), "disabled");
  }

  if (!config.usable) {
    const fallbackReason = config.skipReason ?? "unusable_config";
    logPresentationFallback(fallbackReason);
    return emptyResult(deterministicPresentation(params.analysis, params.input), fallbackReason);
  }

  try {
    const facts = buildPresentationFacts(params.input, params.analysis);
    const raw = await withTimeout(
      client.completeJson(buildLlmPresentationRewritePrompt(params.analysis, params.input), config),
      config.timeoutMs,
    );
    const validated = validateLlmPresentationRewrite(raw, params.analysis, facts);

    if (validated.presentation) {
      return {
        presentation: validated.presentation,
        metadata: {
          llmPresentationAttempted: true,
          llmPresentationUsed: true,
          presentationSource: "llm",
          llmPresentationRepairAttempted: false,
        },
      };
    }

    if (isRepairablePresentationFailure(validated)) {
      const rejectedPresentation = parsePresentationResponse(raw) ?? raw;
      const repairRaw = await withTimeout(
        client.completeJson(
          buildLlmPresentationRepairPrompt({
            facts,
            rejectedPresentation,
            validation: validated,
          }),
          config,
        ),
        config.timeoutMs,
      );
      const repairValidated = validateLlmPresentationRewrite(repairRaw, params.analysis, facts);
      const repairedPresentation = parsePresentationResponse(repairRaw) ?? repairRaw;

      if (repairValidated.presentation) {
        return {
          presentation: repairValidated.presentation,
          metadata: {
            llmPresentationAttempted: true,
            llmPresentationUsed: true,
            presentationSource: "llm_repair",
            llmPresentationRepairAttempted: true,
            llmPresentationOriginalOutput: rejectedPresentation,
            llmPresentationOriginalFailureReason: validated.fallbackReason,
            llmPresentationOriginalFailureTrigger: validated.fallbackTrigger,
            llmPresentationRepairedOutput: repairedPresentation,
          },
        };
      }

      const fallbackReason = repairValidated.fallbackReason ?? "invalid_json";
      logPresentationFallback(fallbackReason, repairValidated.fallbackTrigger);

      return {
        presentation: deterministicPresentation(params.analysis, params.input),
        metadata: {
          llmPresentationAttempted: true,
          llmPresentationUsed: false,
          presentationSource: "fallback",
          llmPresentationRepairAttempted: true,
          llmPresentationOriginalOutput: rejectedPresentation,
          llmPresentationOriginalFailureReason: validated.fallbackReason,
          llmPresentationOriginalFailureTrigger: validated.fallbackTrigger,
          llmPresentationRepairedOutput: repairedPresentation,
          llmPresentationRepairedFailureReason: repairValidated.fallbackReason,
          llmPresentationRepairedFailureTrigger: repairValidated.fallbackTrigger,
          llmPresentationFallbackReason: fallbackReason,
          llmPresentationFallbackTrigger: repairValidated.fallbackTrigger,
        },
      };
    }

    const fallbackReason = validated.fallbackReason ?? "invalid_json";
    logPresentationFallback(fallbackReason, validated.fallbackTrigger);

    return {
      presentation: deterministicPresentation(params.analysis, params.input),
      metadata: {
        llmPresentationAttempted: true,
        llmPresentationUsed: false,
        presentationSource: "fallback",
        llmPresentationRepairAttempted: false,
        llmPresentationFallbackReason: fallbackReason,
        llmPresentationFallbackTrigger: validated.fallbackTrigger,
      },
    };
  } catch (error) {
    const fallbackReason =
      error instanceof Error && error.message.includes("timed out")
        ? "timeout"
        : "provider_error";
    logPresentationFallback(fallbackReason);

    return {
      presentation: deterministicPresentation(params.analysis, params.input),
      metadata: {
        llmPresentationAttempted: true,
        llmPresentationUsed: false,
        presentationSource: "fallback",
        llmPresentationFallbackReason: fallbackReason,
      },
    };
  }
}
