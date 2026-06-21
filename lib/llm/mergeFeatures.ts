import type { ExtractedFeatures } from "../types";
import { canonicalFeatureSlug } from "../domain/featureSlug";
import type { LlmProposedFeature } from "./schema";

export type LlmFeatureMergeResult = {
  features: ExtractedFeatures;
  acceptedFeatures: LlmProposedFeature[];
};

export function mergeLlmFeatures(
  deterministicFeatures: ExtractedFeatures,
  proposedFeatures: readonly LlmProposedFeature[],
): LlmFeatureMergeResult {
  const matchedFeatures = [...deterministicFeatures.matchedFeatures];
  const acceptedFeatures: LlmProposedFeature[] = [];

  for (const feature of proposedFeatures) {
    const slug = canonicalFeatureSlug(feature.slug);

    if (!slug || matchedFeatures.includes(slug)) {
      continue;
    }

    matchedFeatures.push(slug);
    acceptedFeatures.push({ ...feature, slug });
  }

  return {
    features: {
      ...deterministicFeatures,
      matchedFeatures,
    },
    acceptedFeatures,
  };
}
