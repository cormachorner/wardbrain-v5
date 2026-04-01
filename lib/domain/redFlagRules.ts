import { GUIDELINE_RULES } from "./guidelineRules";
import type { ExtractedFeatures, RedFlag } from "../types";

function has(features: ExtractedFeatures, key: string) {
  return features.matchedFeatures.includes(key);
}

function countMatches(features: ExtractedFeatures, triggers: string[]) {
  return triggers.filter((trigger) => has(features, trigger)).length;
}

export function detectRedFlags(features: ExtractedFeatures): RedFlag[] {
  const flags: RedFlag[] = [];

  // NICE/GMC-tagged rulebook
  for (const rule of GUIDELINE_RULES) {
    if (rule.id === "gmc-ai-001") continue;

    if (
      rule.requiredAnyFeatures &&
      !rule.requiredAnyFeatures.some((requiredFeature) => has(features, requiredFeature))
    ) {
      continue;
    }

    const matchCount = countMatches(features, rule.triggers);

    if (matchCount >= 2) {
      flags.push({
        name: rule.title,
        explanation: rule.rationale,
        boostDiagnoses: rule.boostDiagnoses,
        sourceBody: rule.sourceBody,
        sourceId: rule.sourceId,
        sourceCoverage: rule.sourceCoverage,
      });
    }
  }

  // Internal non-source-complete rule: acute aortic syndrome
  const aorticCount = [
    has(features, "chestPain"),
    has(features, "suddenOnset"),
    has(features, "tearingPain"),
    has(features, "backRadiation"),
    has(features, "collapse"),
    has(features, "hypertension"),
  ].filter(Boolean).length;

  if (aorticCount >= 3) {
    flags.push({
      name: "Acute aortic syndrome pattern",
      explanation:
        "This feature cluster should strongly raise concern for acute aortic pathology, but this rule is currently an internal WardBrain pattern rather than a fully NICE-derived rule.",
      boostDiagnoses: ["Acute aortic syndrome"],
      sourceBody: "NICE",
      sourceId: "coverage-gap",
      sourceCoverage: "gap",
    });
  }

  return flags;
}
