import { formatFeatureLabel } from "./featureLabels";
import type { DiagnosisBoost, DifferentialResult, ExtractedFeatures } from "./types";
import type { DiagnosisRule } from "./diagnosisRules";

const DEFAULT_SUPPORTIVE_WEIGHT = 2;
const DEFAULT_CONFLICT_WEIGHT = -2;
const GENERIC_INSTABILITY_FEATURES = new Set([
  "hypotension",
  "tachycardia",
  "hypoxia",
  "tachypnoea",
]);
const PNEUMOTHORAX_YOUNG_SIGNATURE_FEATURES = [
  "tallThinHabitus",
  "suddenOnset",
  "pleuriticPain",
  "unilateralReducedAirEntry",
  "sob",
  "smoker",
] as const;

type AgeBand = "under30" | "30to49" | "50to64" | "65plus" | "unknown";

function has(features: ExtractedFeatures, key: string) {
  return features.matchedFeatures.includes(key);
}

function getAgeBand(age?: number): AgeBand {
  if (!age || Number.isNaN(age)) {
    return "unknown";
  }

  if (age < 30) {
    return "under30";
  }

  if (age < 50) {
    return "30to49";
  }

  if (age < 65) {
    return "50to64";
  }

  return "65plus";
}

function getAgeModifier(rule: DiagnosisRule, features: ExtractedFeatures, age?: number) {
  const ageBand = getAgeBand(age);
  const acsSignatureCount = ["chestPain", "jawPain", "armPain", "sweating", "indigestionLikeChestPain"].filter(
    (feature) => has(features, feature),
  ).length;
  const aaaSignatureCount = ["abdominalPain", "backRadiation", "pulsatileAbdomen"].filter(
    (feature) => has(features, feature),
  ).length;
  const aorticSignatureCount = ["chestPain", "suddenOnset", "tearingPain", "backRadiation"].filter(
    (feature) => has(features, feature),
  ).length;

  switch (rule.name) {
    case "Acute coronary syndrome":
      if (ageBand === "under30") return acsSignatureCount >= 2 ? -1 : -3;
      if (ageBand === "30to49") return acsSignatureCount >= 2 ? 0 : -1;
      if (ageBand === "50to64") return acsSignatureCount >= 1 ? 1 : 0;
      if (ageBand === "65plus") return acsSignatureCount >= 1 ? 2 : 0;
      return 0;
    case "Abdominal aortic aneurysm":
      if (ageBand === "under30") return aaaSignatureCount >= 2 ? -1 : -4;
      if (ageBand === "30to49") return aaaSignatureCount >= 2 ? 0 : -2;
      if (ageBand === "50to64") return aaaSignatureCount >= 1 ? 1 : 0;
      if (ageBand === "65plus") return aaaSignatureCount >= 1 ? 2 : 0;
      return 0;
    case "Acute aortic syndrome":
      if (ageBand === "under30") return aorticSignatureCount >= 3 ? -1 : -3;
      if (ageBand === "30to49") return aorticSignatureCount >= 3 ? 0 : -1;
      if (ageBand === "50to64") return aorticSignatureCount >= 2 ? 1 : 0;
      if (ageBand === "65plus") return aorticSignatureCount >= 2 ? 2 : 0;
      return 0;
    case "Pneumothorax": {
      if (ageBand !== "under30") {
        return 0;
      }

      const matchedYoungSignatureCount = PNEUMOTHORAX_YOUNG_SIGNATURE_FEATURES.filter((feature) =>
        has(features, feature),
      ).length;

      if (matchedYoungSignatureCount >= 5) {
        return 3;
      }

      if (matchedYoungSignatureCount >= 3) {
        return 1;
      }

      return 0;
    }
    default:
      return 0;
  }
}

function getSupportiveWeight(rule: DiagnosisRule, feature: string) {
  if (GENERIC_INSTABILITY_FEATURES.has(feature)) {
    return rule.supportiveWeights?.[feature] ?? 1;
  }

  return rule.supportiveWeights?.[feature] ?? DEFAULT_SUPPORTIVE_WEIGHT;
}

function applySignatureGate(
  rule: DiagnosisRule,
  features: ExtractedFeatures,
  score: number,
): number {
  if (!rule.strongSignatureGate) {
    return score;
  }

  const matchedSignatureCount = rule.strongSignatureGate.features.filter((feature) =>
    has(features, feature),
  ).length;

  if (matchedSignatureCount >= rule.strongSignatureGate.threshold) {
    return score;
  }

  return Math.min(score, rule.strongSignatureGate.cappedScore ?? 6);
}

function getConflictWeight(rule: DiagnosisRule, feature: string) {
  const configuredWeight = rule.conflictingWeights?.[feature];

  if (configuredWeight !== undefined) {
    return -Math.abs(configuredWeight);
  }

  return DEFAULT_CONFLICT_WEIGHT;
}

export function scoreDiagnosis(
  rule: DiagnosisRule,
  features: ExtractedFeatures,
  boosts: DiagnosisBoost[],
  age?: number,
): DifferentialResult {
  let score = 0;
  const reasonsFor: string[] = [];
  const reasonsAgainst: string[] = [];

  for (const feature of rule.supportive) {
    if (has(features, feature)) {
      score += getSupportiveWeight(rule, feature);
      reasonsFor.push(formatFeatureLabel(feature));
    }
  }

  for (const feature of rule.conflicting) {
    if (has(features, feature)) {
      score += getConflictWeight(rule, feature);
      reasonsAgainst.push(formatFeatureLabel(feature));
    }
  }

  for (const boost of boosts) {
    if (boost.diagnosis === rule.name) {
      score += boost.points;
      reasonsFor.push(boost.reason);
    }
  }

  score += getAgeModifier(rule, features, age);
  score = applySignatureGate(rule, features, score);

  return {
    name: rule.name,
    score,
    reasonsFor,
    reasonsAgainst,
  };
}

export function getMatchedSupportiveFeatures(
  rule: DiagnosisRule,
  features: ExtractedFeatures,
): string[] {
  return rule.supportive.filter((feature) => has(features, feature)).map(formatFeatureLabel);
}

export function getMatchedConflictingFeatures(
  rule: DiagnosisRule,
  features: ExtractedFeatures,
): string[] {
  return rule.conflicting.filter((feature) => has(features, feature)).map(formatFeatureLabel);
}
