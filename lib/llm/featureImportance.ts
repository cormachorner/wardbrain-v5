import { canonicalFeatureSlug } from "../domain/featureSlug";

export const FEATURE_IMPORTANCE_WEIGHTS = {
  critical: 5,
  important: 3,
  supporting: 1,
} as const;

export type FeatureImportanceLevel = keyof typeof FEATURE_IMPORTANCE_WEIGHTS;

const criticalFeatureSlugs = new Set(
  [
    "hypotension",
    "hypoxia",
    "haemoptysis",
    "pain_out_of_proportion",
    "rigidity",
    "unilateral_leg_swelling",
    "tracheal_deviation",
    "focal_neurology",
    "pregnancy_positive",
    "positive_pregnancy_test",
    "kussmaul_breathing",
  ].map(canonicalFeatureSlug),
);

const importantFeatureSlugs = new Set(
  [
    "tachycardia",
    "tachypnoea",
    "vomiting",
    "orthopnoea",
    "bibasal_crackles",
    "raised_jvp",
    "previous_abdominal_surgery",
    "diabetic_context",
  ].map(canonicalFeatureSlug),
);

export function getFeatureImportanceLevel(slug: string): FeatureImportanceLevel {
  const canonicalSlug = canonicalFeatureSlug(slug);

  if (criticalFeatureSlugs.has(canonicalSlug)) {
    return "critical";
  }

  if (importantFeatureSlugs.has(canonicalSlug)) {
    return "important";
  }

  return "supporting";
}

export function getFeatureImportanceWeight(slug: string): number {
  return FEATURE_IMPORTANCE_WEIGHTS[getFeatureImportanceLevel(slug)];
}
