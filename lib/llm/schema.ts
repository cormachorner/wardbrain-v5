import { canonicalFeatureSlug } from "../domain/featureSlug";

export type LlmProposedFeature = {
  slug: string;
  evidence: string;
  confidence: number;
};

export type LlmFeatureExtractionValidation = {
  features: LlmProposedFeature[];
  invalidReasons: string[];
};

type RawLlmFeature = {
  slug?: unknown;
  evidence?: unknown;
  confidence?: unknown;
};

function parseResponse(raw: unknown): unknown {
  if (typeof raw !== "string") {
    return raw;
  }

  return JSON.parse(raw);
}

export function validateLlmFeatureExtractionResponse(
  raw: unknown,
  allowedFeatureSlugs: readonly string[],
  confidenceThreshold: number,
): LlmFeatureExtractionValidation {
  const invalidReasons: string[] = [];
  const allowed = new Set(allowedFeatureSlugs.map(canonicalFeatureSlug));
  let parsed: unknown;

  try {
    parsed = parseResponse(raw);
  } catch {
    return {
      features: [],
      invalidReasons: ["invalid_json"],
    };
  }

  if (!parsed || typeof parsed !== "object" || !("features" in parsed)) {
    return {
      features: [],
      invalidReasons: ["missing_features_array"],
    };
  }

  const rawFeatures = (parsed as { features: unknown }).features;
  if (!Array.isArray(rawFeatures)) {
    return {
      features: [],
      invalidReasons: ["features_not_array"],
    };
  }

  const features: LlmProposedFeature[] = [];

  for (const item of rawFeatures as RawLlmFeature[]) {
    if (!item || typeof item !== "object") {
      invalidReasons.push("feature_not_object");
      continue;
    }

    const slug = typeof item.slug === "string" ? canonicalFeatureSlug(item.slug) : "";
    const evidence = typeof item.evidence === "string" ? item.evidence.trim().slice(0, 240) : "";
    const confidence = typeof item.confidence === "number" ? item.confidence : Number.NaN;

    if (!slug || !allowed.has(slug)) {
      invalidReasons.push(`disallowed_slug:${slug || "missing"}`);
      continue;
    }

    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      invalidReasons.push(`invalid_confidence:${slug}`);
      continue;
    }

    if (confidence < confidenceThreshold) {
      invalidReasons.push(`low_confidence:${slug}`);
      continue;
    }

    features.push({
      slug,
      evidence,
      confidence,
    });
  }

  return {
    features,
    invalidReasons,
  };
}
