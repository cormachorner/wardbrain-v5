import type { ExtractedFeatures } from "../types";
import { canonicalFeatureSlug } from "../domain/featureSlug";
import type { LlmProposedFeature } from "./schema";
import {
  filterLlmFeaturesForClinicalSanity,
  type RejectedLlmFeature,
} from "./clinicalSanityFilter";

export type LlmFeatureMergeResult = {
  features: ExtractedFeatures;
  acceptedFeatures: LlmProposedFeature[];
  rejectedFeatures: RejectedLlmFeature[];
};

export function mergeLlmFeatures(
  deterministicFeatures: ExtractedFeatures,
  proposedFeatures: readonly LlmProposedFeature[],
): LlmFeatureMergeResult {
  const matchedFeatures = [...deterministicFeatures.matchedFeatures];
  const sanity = filterLlmFeaturesForClinicalSanity(proposedFeatures, deterministicFeatures);
  const acceptedFeatures: LlmProposedFeature[] = [];

  for (const feature of sanity.acceptedFeatures) {
    const slug = canonicalFeatureSlug(feature.slug);

    if (!slug) {
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
    rejectedFeatures: sanity.rejectedFeatures,
  };
}
