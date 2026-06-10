const FEATURE_SLUG_ALIASES: Record<string, string> = {
  diffuse_abdominal_pain: "generalized_abdominal_pain",
};

export function canonicalFeatureSlug(value: string) {
  const slug = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return FEATURE_SLUG_ALIASES[slug] ?? slug;
}
