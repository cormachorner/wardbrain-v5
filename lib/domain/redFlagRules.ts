import { GUIDELINE_RULES } from "./guidelineRules";
import type { ExtractedFeatures, RedFlag } from "../types";

function has(features: ExtractedFeatures, key: string) {
  return features.matchedFeatures.includes(key);
}

function countMatches(features: ExtractedFeatures, triggers: string[]) {
  return triggers.filter((trigger) => has(features, trigger)).length;
}

function getMatchedTriggers(features: ExtractedFeatures, triggers: string[]) {
  return triggers.filter((trigger) => has(features, trigger));
}

export function detectRedFlags(features: ExtractedFeatures): RedFlag[] {
  const flags: RedFlag[] = [];

  // NICE/GMC-tagged rulebook
  for (const rule of GUIDELINE_RULES) {
    if (rule.id === "gmc-ai-001") continue;

    if (rule.id === "nice-cg150-headache-001") {
      const hasDangerousHeadacheContext =
        has(features, "thunderclap") ||
        has(features, "worst_headache_of_life") ||
        has(features, "focal_neurology") ||
        has(features, "focal_weakness") ||
        has(features, "aphasia") ||
        has(features, "ataxia") ||
        has(features, "dysarthria") ||
        has(features, "cranial_nerve_deficit") ||
        has(features, "collapse") ||
        has(features, "reduced_consciousness") ||
        (has(features, "neck_stiffness") &&
          (has(features, "fever") || has(features, "confusion") || has(features, "vomiting")));

      if (!has(features, "headache") || !hasDangerousHeadacheContext) {
        continue;
      }
    }

    if (rule.id === "nice-cg150-thunderclap-headache-001") {
      const hasThunderclapPattern =
        has(features, "thunderclap") ||
        has(features, "worst_headache_of_life") ||
        (has(features, "sudden_onset") && has(features, "severe_headache"));

      if (!has(features, "headache") || !hasThunderclapPattern) {
        continue;
      }
    }

    if (rule.id === "nice-cg150-sah-001") {
      const hasThunderclapPattern =
        has(features, "thunderclap") ||
        has(features, "worst_headache_of_life") ||
        (has(features, "sudden_onset") && has(features, "severe_headache"));
      const hasAssociatedSahFeature =
        has(features, "vomiting") ||
        has(features, "neck_stiffness") ||
        has(features, "collapse") ||
        has(features, "seizure") ||
        has(features, "reduced_consciousness") ||
        has(features, "focal_neurology");

      if (!has(features, "headache") || !hasThunderclapPattern || !hasAssociatedSahFeature) {
        continue;
      }
    }

    if (rule.id === "nice-ng240-meningitis-headache-001") {
      const hasCnsInfectionContext =
        has(features, "neck_stiffness") ||
        has(features, "photophobia") ||
        has(features, "rash") ||
        has(features, "confusion") ||
        has(features, "seizure") ||
        has(features, "reduced_consciousness");

      if (!has(features, "headache") || !has(features, "fever") || !hasCnsInfectionContext) {
        continue;
      }
    }

    if (rule.id === "wardbrain-gap-meningitis-001") {
      const hasCnsInfectionContext =
        has(features, "neck_stiffness") ||
        has(features, "photophobia") ||
        has(features, "rash") ||
        has(features, "confusion") ||
        has(features, "reduced_consciousness");

      if (!has(features, "headache") || !has(features, "fever") || !hasCnsInfectionContext) {
        continue;
      }
    }

    if (rule.id === "nice-cks-gca-001") {
      const hasAgeContext = has(features, "age_over_50") || has(features, "older_age");
      const hasHeadacheContext = has(features, "headache") || has(features, "temporal_headache");
      const hasGcaSpecificFeature =
        has(features, "jaw_claudication") ||
        has(features, "scalp_tenderness") ||
        has(features, "temporal_tenderness") ||
        has(features, "visual_loss") ||
        has(features, "transient_visual_loss") ||
        has(features, "pmr_like_symptoms");

      if (!hasAgeContext || !hasHeadacheContext || !hasGcaSpecificFeature) {
        continue;
      }
    }

    if (rule.id === "nice-ng127-raised-icp-001") {
      const hasRaisedIcpFeature =
        has(features, "worse_on_waking") ||
        has(features, "worse_lying_flat") ||
        has(features, "worse_with_coughing") ||
        has(features, "papilloedema") ||
        (has(features, "vomiting") && has(features, "visual_disturbance")) ||
        has(features, "cancer") ||
        has(features, "immunosuppression");

      if (!has(features, "headache") || !hasRaisedIcpFeature) {
        continue;
      }
    }

    if (rule.id === "nice-ng127-focal-neuro-headache-001") {
      const hasFocalDeficit =
        has(features, "focal_neurology") ||
        has(features, "focal_weakness") ||
        has(features, "sensory_loss") ||
        has(features, "aphasia") ||
        has(features, "ataxia") ||
        has(features, "dysarthria") ||
        has(features, "cranial_nerve_deficit") ||
        has(features, "visual_loss");

      const hasNeurologicalPresentationContext =
        has(features, "headache") ||
        has(features, "confusion") ||
        has(features, "drowsiness") ||
        has(features, "sudden_onset");

      if (!hasNeurologicalPresentationContext || !hasFocalDeficit) {
        continue;
      }
    }

    if (rule.id === "nice-ng253-infection-delirium-001") {
      const hasDeliriumContext =
        has(features, "confusion") ||
        has(features, "drowsiness") ||
        has(features, "acute_on_chronic_confusion") ||
        has(features, "fluctuation");
      const hasInfectionOrPhysiologyContext =
        has(features, "fever") ||
        has(features, "rigors") ||
        has(features, "infection_source") ||
        has(features, "urinary_symptoms") ||
        has(features, "productive_cough") ||
        has(features, "crackles") ||
        has(features, "hypoxia") ||
        has(features, "tachycardia") ||
        has(features, "hypotension");

      if (!hasDeliriumContext || !hasInfectionOrPhysiologyContext) {
        continue;
      }
    }

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

    if (rule.id === "nice-ng158-pe-001") {
      const hasDyspnoeaOrPleuriticPain = has(features, "sob") || has(features, "pleuritic_pain");
      const hasVteSpecificSignal =
        has(features, "haemoptysis") ||
        has(features, "unilateral_leg_swelling") ||
        has(features, "calf_swelling") ||
        has(features, "dvt_signs") ||
        has(features, "dvt_history") ||
        has(features, "recent_surgery") ||
        has(features, "immobility") ||
        has(features, "long_haul_travel") ||
        has(features, "oestrogen_use") ||
        has(features, "pregnancy_possible");
      const hasPeSpecificSupport =
        has(features, "pleuritic_pain") ||
        has(features, "haemoptysis") ||
        hasVteSpecificSignal;
      const hasPeCompatibleSignature =
        has(features, "pleuritic_pain") ||
        has(features, "haemoptysis") ||
        hasVteSpecificSignal;
      const hasMeaningfulPeSignal =
        has(features, "tachycardia") ||
        has(features, "hypoxia") ||
        hasVteSpecificSignal;
      const hasDkaMetabolicSignature =
        (has(features, "diabetic_context") || has(features, "type_1_diabetes")) &&
        has(features, "kussmaul_breathing") &&
        (has(features, "polyuria") || has(features, "polydipsia") || has(features, "ketosis_breath")) &&
        !hasPeSpecificSupport;
      const hasStrongInfectivePulmonaryPattern =
        has(features, "productive_cough") &&
        has(features, "fever") &&
        (has(features, "crackles") || has(features, "sputum_change") || has(features, "rigors"));
      const hasStrongObstructiveAirwayPattern =
        has(features, "wheeze") &&
        (has(features, "known_asthma") || has(features, "asthma_history") || has(features, "known_copd") || has(features, "copd_history"));
      const hasStrongPneumothoraxPattern =
        has(features, "unilateral_reduced_air_entry") ||
        has(features, "hyperresonance");
      const hasStrongHeartFailurePattern =
        [
          has(features, "orthopnoea"),
          has(features, "paroxysmal_nocturnal_dyspnoea"),
          has(features, "raised_jvp"),
          has(features, "bibasal_crackles"),
          has(features, "peripheral_oedema"),
          has(features, "ankle_swelling"),
        ].filter(Boolean).length >= 2;

      if (!hasDyspnoeaOrPleuriticPain || !hasMeaningfulPeSignal || !hasPeCompatibleSignature || hasDkaMetabolicSignature) {
        continue;
      }

      if (
        !hasVteSpecificSignal &&
        (hasStrongInfectivePulmonaryPattern ||
          hasStrongObstructiveAirwayPattern ||
          hasStrongPneumothoraxPattern ||
          hasStrongHeartFailurePattern)
      ) {
        continue;
      }
    }

    if (rule.id === "wardbrain-gap-severe-asthma-001") {
      const hasAsthmaOrWheeze =
        has(features, "known_asthma") ||
        has(features, "asthma_history") ||
        has(features, "wheeze");
      const hasSeverePhysiology =
        has(features, "unable_to_speak_full_sentences") ||
        has(features, "difficulty_speaking") ||
        has(features, "hypoxia") ||
        has(features, "silent_chest") ||
        has(features, "poor_peak_flow") ||
        has(features, "tachypnoea") ||
        has(features, "severe_respiratory_distress");

      if (!hasAsthmaOrWheeze || !hasSeverePhysiology) {
        continue;
      }
    }

    if (rule.id === "wardbrain-gap-heart-failure-001") {
      const overloadCount = [
        has(features, "orthopnoea"),
        has(features, "paroxysmal_nocturnal_dyspnoea"),
        has(features, "bibasal_crackles"),
        has(features, "raised_jvp"),
        has(features, "peripheral_oedema"),
        has(features, "ankle_swelling"),
        has(features, "frothy_sputum"),
      ].filter(Boolean).length;

      if (!has(features, "sob") || overloadCount < 2) {
        continue;
      }
    }

    if (rule.id === "wardbrain-gap-tension-pneumothorax-001") {
      const hasSuddenDyspnoeaOrPleuriticPain =
        has(features, "sudden_onset") &&
        (has(features, "sob") || has(features, "pleuritic_pain"));
      const hasInstability =
        has(features, "hypoxia") ||
        has(features, "hypotension") ||
        has(features, "tachycardia") ||
        has(features, "severe_respiratory_distress");

      if (!hasSuddenDyspnoeaOrPleuriticPain || !has(features, "unilateral_reduced_air_entry") || !hasInstability) {
        continue;
      }
    }

    if (rule.id === "wardbrain-gap-dka-breathlessness-001") {
      const hasMetabolicContext = has(features, "diabetic_context") || has(features, "hyperglycaemia");
      const metabolicFeatureCount = [
        has(features, "kussmaul_breathing"),
        has(features, "polyuria"),
        has(features, "polydipsia"),
        has(features, "vomiting"),
        has(features, "abdominal_pain"),
        has(features, "dehydration"),
      ].filter(Boolean).length;

      if (!hasMetabolicContext || metabolicFeatureCount < 2) {
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
    const triggeredFeatures = getMatchedTriggers(features, rule.triggers);

    if (matchCount >= 2) {
      flags.push({
        name: rule.title,
        explanation: rule.rationale,
        boostDiagnoses: rule.boostDiagnoses,
        triggeredFeatures,
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
      triggeredFeatures: [
        "chest_pain",
        "sudden_onset",
        "tearing_pain",
        "back_radiation",
        "collapse",
        "hypertension",
      ].filter((feature) => has(features, feature)),
      sourceBody: "NICE",
      sourceId: "coverage-gap",
      sourceCoverage: "gap",
    });
  }

  return flags;
}
