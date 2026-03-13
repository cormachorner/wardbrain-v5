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

function has(features: ExtractedFeatures, key: string) {
  return features.matchedFeatures.includes(key);
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
