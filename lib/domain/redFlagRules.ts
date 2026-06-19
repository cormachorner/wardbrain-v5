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

    if (rule.id === "nice-ng156-aaa-001") {
      const hasAaaPainContext =
        has(features, "abdominal_pain") ||
        has(features, "back_radiation") ||
        has(features, "back_pain") ||
        has(features, "flank_pain") ||
        has(features, "pulsatile_abdomen");
      const hasInstability = has(features, "collapse") || has(features, "hypotension");
      const hasVascularContext =
        has(features, "older_age") ||
        has(features, "smoker") ||
        has(features, "smoking_history") ||
        has(features, "vascular_disease") ||
        has(features, "hypertension");

      if (!hasAaaPainContext || !hasInstability || !hasVascularContext) {
        continue;
      }
    }

    if (rule.id === "nice-cg95-acs-001") {
      const hasChestOrEquivalentPain =
        has(features, "chest_pain") ||
        has(features, "indigestion_like_chest_pain") ||
        has(features, "acs_equivalent_pain") ||
        has(features, "epigastric_pain") ||
        has(features, "upper_abdominal_pain");
      const hasCardiacSignature =
        has(features, "jaw_pain") ||
        has(features, "arm_pain") ||
        has(features, "pain_radiates_to_jaw") ||
        has(features, "pain_radiates_to_left_arm") ||
        has(features, "indigestion_like_chest_pain") ||
        has(features, "acs_equivalent_pain") ||
        has(features, "sweating") ||
        has(features, "nausea") ||
        has(features, "collapse") ||
        has(features, "hypotension");

      if (!hasChestOrEquivalentPain || !hasCardiacSignature) {
        continue;
      }
    }

    if (rule.id === "wardbrain-gap-bowel-obstruction-001") {
      const hasObstructionPattern =
        has(features, "abdominal_pain") &&
        has(features, "vomiting") &&
        has(features, "distension") &&
        (has(features, "obstipation") || has(features, "unable_to_pass_flatus"));
      const hasStrangulationRisk =
        has(features, "constant_pain") ||
        has(features, "guarding") ||
        has(features, "tachycardia") ||
        has(features, "hypotension") ||
        has(features, "fever") ||
        has(features, "sepsis_pattern");

      if (!hasObstructionPattern || !hasStrangulationRisk) {
        continue;
      }
    }

    if (rule.id === "nice-ng51-sepsis-001") {
      const hasInstabilityOrHighRiskPhysiology =
        has(features, "hypotension") ||
        has(features, "collapse") ||
        has(features, "confusion") ||
        has(features, "tachycardia") ||
        has(features, "tachypnoea") ||
        has(features, "hypoxia");

      if (!hasInstabilityOrHighRiskPhysiology) {
        continue;
      }
    }

    if (rule.id === "wardbrain-gap-hypoglycaemia-001") {
      const hasGlycaemicContext =
        has(features, "hypoglycaemia_cue") ||
        has(features, "diabetic_context");

      if (!hasGlycaemicContext) {
        continue;
      }
    }

    if (rule.id === "nice-cg188-cholangitis-001") {
      if (!has(features, "ruq_pain") || !has(features, "jaundice")) {
        continue;
      }
    }

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
    has(features, "chest_pain"),
    has(features, "sudden_onset"),
    has(features, "tearing_pain"),
    has(features, "back_radiation"),
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
