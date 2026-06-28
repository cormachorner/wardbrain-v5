import { CONDITION_PROMOTION_REGISTRY } from "../domain/conditionPromotionRegistry";
import { DIAGNOSIS_RULES } from "../domain/diagnosisRules";
import { ALL_PRESENTATION_BLOCK_DIAGNOSES } from "../domain/presentationBlocks";
import type { AnalyzeCaseResponse } from "../types";
import { openAiLlmCompletionClient, type LlmCompletionClient } from "./client";
import {
  getLlmPresentationConfig,
  type LlmPresentationConfig,
} from "./config";

export type LlmPresentationRewriteMetadata = {
  llmPresentationAttempted: boolean;
  llmPresentationUsed: boolean;
  presentationSource: "deterministic" | "llm" | "fallback";
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

function getAllowedDiagnosisTerms(analysis: AnalyzeCaseResponse) {
  return [
    ...new Set(
      [
        ...analysis.differentials.slice(0, 3).flatMap((differential) =>
          diagnosisTerms(differential.name),
        ),
        ...analysis.redFlags.flatMap((flag) => flag.boostDiagnoses.flatMap(diagnosisTerms)),
      ].filter(Boolean),
    ),
  ];
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
      containsTerm(presentation, term);
  });
}

function redFlagTerms(analysis: AnalyzeCaseResponse) {
  return analysis.redFlags.flatMap((flag) => {
    const cleanedFlagName = flag.name
      .replace(/-/g, " ")
      .replace(/\b(suspicion|pattern|red flag)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return [
      cleanedFlagName,
      ...flag.boostDiagnoses.flatMap(diagnosisTerms),
    ].filter(Boolean);
  });
}

export function validateLlmPresentationRewrite(
  raw: string,
  analysis: AnalyzeCaseResponse,
): LlmPresentationValidation {
  const presentation = parsePresentationResponse(raw);

  if (!presentation) {
    return { fallbackReason: "invalid_json" };
  }

  if (wordCount(presentation) > MAX_PRESENTATION_WORDS) {
    return { fallbackReason: "too_long" };
  }

  const topDiagnosis = analysis.differentials[0]?.name;

  if (topDiagnosis && !diagnosisTerms(topDiagnosis).some((term) => containsTerm(presentation, term))) {
    return { fallbackReason: "missing_top_diagnosis" };
  }

  const allowedTerms = new Set(getAllowedDiagnosisTerms(analysis).map(normaliseText));
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

  if (analysis.redFlags.length > 0) {
    const hasRedFlagRepresentation = redFlagTerms(analysis).some((term) =>
      containsTerm(presentation, term),
    );

    if (!hasRedFlagRepresentation) {
      return {
        fallbackReason: "missing_red_flag",
        fallbackTrigger: analysis.redFlags.map((flag) => flag.name).join(", "),
      };
    }
  }

  return { presentation };
}

export function buildLlmPresentationRewritePrompt(analysis: AnalyzeCaseResponse) {
  const topDiagnosis = analysis.differentials[0]?.name ?? "undifferentiated presentation";
  const top3 = analysis.differentials.slice(0, 3).map((differential) => differential.name);
  const nextSteps = analysis.nextSteps
    ? [
        ...analysis.nextSteps.investigations,
        ...analysis.nextSteps.immediateNextSteps,
        ...analysis.nextSteps.notes,
      ].slice(0, 8)
    : [];

  return [
    "You are rewriting an existing WardBrain educational handover summary.",
    "Return JSON only with this exact shape: {\"presentation\":\"...\"}",
    `Rewrite as a concise UK-style clinical handover to a registrar under ${PROMPT_WORD_LIMIT} words.`,
    "Do not add new facts, diagnoses, red flags, or management.",
    "Use the exact diagnosis names supplied unless rewriting common abbreviations.",
    "Do not remove important red flags.",
    "Include uncertainty if WardBrain states uncertainty.",
    "",
    `Matched presentation block: ${analysis.presentationSupport.matchedBlockId ?? "none"}`,
    `Top diagnosis: ${topDiagnosis}`,
    `Top 3 differentials: ${top3.join(", ") || "none"}`,
    `Detected features: ${analysis.detectedFeatureSlugs.join(", ") || "none"}`,
    `Red flags: ${analysis.redFlags.map((flag) => flag.name).join(", ") || "none"}`,
    `Uncertainty: ${analysis.uncertainty.level} - ${analysis.uncertainty.summary}`,
    `Suggested next steps: ${nextSteps.join("; ") || "none"}`,
    `Current deterministic Present to the reg text: ${analysis.presentation}`,
  ].join("\n");
}

export async function rewritePresentationWithLlm(params: {
  analysis: AnalyzeCaseResponse;
  config?: LlmPresentationConfig;
  client?: LlmCompletionClient;
}): Promise<LlmPresentationRewriteResult> {
  const config = params.config ?? getLlmPresentationConfig();
  const client = params.client ?? openAiLlmCompletionClient;

  if (!config.presentationEnabled) {
    logPresentationFallback("disabled");
    return emptyResult(params.analysis.presentation, "disabled");
  }

  if (!config.enabled) {
    logPresentationFallback("disabled");
    return emptyResult(params.analysis.presentation, "disabled");
  }

  if (!config.usable) {
    const fallbackReason = config.skipReason ?? "unusable_config";
    logPresentationFallback(fallbackReason);
    return emptyResult(params.analysis.presentation, fallbackReason);
  }

  try {
    const raw = await withTimeout(
      client.completeJson(buildLlmPresentationRewritePrompt(params.analysis), config),
      config.timeoutMs,
    );
    const validated = validateLlmPresentationRewrite(raw, params.analysis);

    if (!validated.presentation) {
      const fallbackReason = validated.fallbackReason ?? "invalid_json";
      logPresentationFallback(fallbackReason, validated.fallbackTrigger);

      return {
        presentation: params.analysis.presentation,
        metadata: {
          llmPresentationAttempted: true,
          llmPresentationUsed: false,
          presentationSource: "fallback",
          llmPresentationFallbackReason: fallbackReason,
          llmPresentationFallbackTrigger: validated.fallbackTrigger,
        },
      };
    }

    return {
      presentation: validated.presentation,
      metadata: {
        llmPresentationAttempted: true,
        llmPresentationUsed: true,
        presentationSource: "llm",
      },
    };
  } catch (error) {
    const fallbackReason =
      error instanceof Error && error.message.includes("timed out")
        ? "timeout"
        : "provider_error";
    logPresentationFallback(fallbackReason);

    return {
      presentation: params.analysis.presentation,
      metadata: {
        llmPresentationAttempted: true,
        llmPresentationUsed: false,
        presentationSource: "fallback",
        llmPresentationFallbackReason: fallbackReason,
      },
    };
  }
}
