import type { CaseInput } from "../types";

export function buildLlmFeatureExtractionPrompt(params: {
  blockId: string;
  input: CaseInput;
  allowedFeatureSlugs: readonly string[];
}) {
  const { blockId, input, allowedFeatureSlugs } = params;
  const caseText = [
    `Age: ${input.age || "not provided"}`,
    `Sex: ${input.sex || "not provided"}`,
    `Presenting complaint: ${input.presentingComplaint || "not provided"}`,
    `History: ${input.history || "not provided"}`,
    `PMH: ${input.pmh || "not provided"}`,
    `Meds: ${input.meds || "not provided"}`,
    `Social: ${input.social || "not provided"}`,
    `Key positives: ${input.keyPositives || "not provided"}`,
    `Key negatives: ${input.keyNegatives || "not provided"}`,
    `Observations: ${input.observations || "not provided"}`,
  ].join("\n");

  return [
    "You are assisting WardBrain with feature extraction only.",
    "WardBrain is an educational clinical-reasoning tool. The deterministic engine remains the source of truth.",
    "Do not output diagnoses, red flags, management advice, or prose.",
    `Matched presentation block: ${blockId}.`,
    "Return JSON only with this exact shape:",
    "{\"features\":[{\"slug\":\"feature_slug\",\"evidence\":\"short quoted evidence\",\"confidence\":0.9}]}",
    "Every slug must be from this allowed list:",
    allowedFeatureSlugs.join(", "),
    "Use confidence from 0 to 1. Prefer omission when unsure.",
    "Respect negation. Do not extract a positive feature from explicitly negated text.",
    "Case:",
    caseText,
  ].join("\n");
}
