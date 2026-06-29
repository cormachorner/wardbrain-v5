import { formatFeatureLabel } from "./featureLabels";
import type { DiagnosisBoost, DifferentialResult, ExtractedFeatures } from "../types";
import type { DiagnosisRule } from "./diagnosisRules";

const DEFAULT_SUPPORTIVE_WEIGHT = 2;
const DEFAULT_CONFLICT_WEIGHT = -2;
const GENERIC_SUPPORTIVE_FEATURE_WEIGHTS = new Map<string, number>([
  ["abdominal_pain", 1],
  ["chest_pain", 2],
  ["headache", 2],
  ["sob", 2],
  ["fever", 1],
  ["vomiting", 0],
  ["nausea", 0],
  ["diarrhoea", 0],
]);
const SOFT_NEGATIVE_FEATURES = new Set(["vomiting", "nausea", "diarrhoea", "fever"]);
const GENERIC_INSTABILITY_FEATURES = new Set([
  "hypotension",
  "tachycardia",
  "hypoxia",
  "tachypnoea",
]);
const PNEUMOTHORAX_YOUNG_SIGNATURE_FEATURES = [
  "tall_thin_habitus",
  "sudden_onset",
  "pleuritic_pain",
  "unilateral_reduced_air_entry",
  "sob",
  "smoker",
] as const;
const PE_VTE_CONTEXT_FEATURES = [
  "recent_surgery",
  "immobility",
  "long_haul_travel",
  "haemoptysis",
  "dvt_history",
  "oestrogen_use",
  "pregnancy_possible",
  "leg_swelling",
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
  const acsSignatureCount = ["chest_pain", "jaw_pain", "arm_pain", "sweating", "indigestion_like_chest_pain"].filter(
    (feature) => has(features, feature),
  ).length;
  const aaaSignatureCount = ["abdominal_pain", "back_radiation", "pulsatile_abdomen"].filter(
    (feature) => has(features, feature),
  ).length;
  const aorticSignatureCount = ["chest_pain", "sudden_onset", "tearing_pain", "back_radiation"].filter(
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
        return 4;
      }

      if (matchedYoungSignatureCount >= 3) {
        return 1;
      }

      return 0;
    }
    case "Temporal arteritis":
      if (ageBand === "under30") return -4;
      if (ageBand === "30to49") return -2;
      if (ageBand === "50to64") return 2;
      if (ageBand === "65plus") return 3;
      return 0;
    case "Delirium secondary to infection":
      if (ageBand === "65plus" && has(features, "confusion")) return 2;
      if (ageBand === "50to64" && has(features, "confusion")) return 1;
      return 0;
    default:
      return 0;
  }
}

function getContextModifier(rule: DiagnosisRule, features: ExtractedFeatures, age?: number) {
  const hasStrongAbdominalLocalization =
    has(features, "pain_out_of_proportion") ||
    has(features, "migration_to_rif") ||
    has(features, "rif_tenderness") ||
    has(features, "guarding_rigidity") ||
    has(features, "abdominal_movement_pain") ||
    has(features, "lying_still") ||
    has(features, "flank_pain") ||
    has(features, "loin_to_groin_pain") ||
    has(features, "pelvic_pain") ||
    has(features, "testicular_pain") ||
    has(features, "unilateral_testicular_pain");
  const hasStrongChestSignature =
    has(features, "chest_pain") ||
    has(features, "indigestion_like_chest_pain") ||
    has(features, "jaw_pain") ||
    has(features, "arm_pain") ||
    has(features, "pleuritic_pain") ||
    has(features, "unilateral_reduced_air_entry");
  const hasStrongHeadacheSignature =
    has(features, "headache") ||
    has(features, "thunderclap") ||
    has(features, "jaw_claudication") ||
    has(features, "scalp_tenderness") ||
    has(features, "transient_visual_symptoms");
  const hasUrinarySymptomSignal =
    has(features, "urinary_symptoms") ||
    has(features, "dysuria") ||
    has(features, "frequency") ||
    has(features, "urinary_frequency") ||
    has(features, "urinary_incontinence");
  const hasDeliriumSignal =
    has(features, "confusion") ||
    has(features, "drowsiness") ||
    has(features, "hallucinations") ||
    has(features, "acute_on_chronic_confusion") ||
    has(features, "fluctuation");

  if (rule.name === "Acute cholangitis") {
    const hasAcuteBiliaryInfectivePattern =
      has(features, "ruq_pain") &&
      has(features, "jaundice") &&
      (has(features, "fever") || has(features, "rigors"));
    const hasChronicCholestaticPattern =
      has(features, "chronic_course") &&
      (has(features, "pruritus") || has(features, "fatigue") || has(features, "dry_eyes_mouth") || has(features, "ibd_context"));

    if (!hasAcuteBiliaryInfectivePattern && hasChronicCholestaticPattern) {
      return -4;
    }

    if (hasAcuteBiliaryInfectivePattern) {
      return 5;
    }
  }

  if (rule.name === "Acute cholecystitis") {
    const hasClassicLocalizedInflammatoryRuqPattern =
      has(features, "ruq_pain") &&
      (has(features, "persistent_ruq_pain") || has(features, "localized_ruq_tenderness") || has(features, "murphys_sign")) &&
      (has(features, "fever") || has(features, "nausea") || has(features, "vomiting"));
    const hasObstructiveOrSepticDominance =
      has(features, "jaundice") ||
      has(features, "dark_urine") ||
      has(features, "pale_stools") ||
      has(features, "rigors") ||
      has(features, "hypotension") ||
      has(features, "confusion");

    if (hasClassicLocalizedInflammatoryRuqPattern && !hasObstructiveOrSepticDominance) {
      return 3;
    }

    if (hasObstructiveOrSepticDominance && !has(features, "murphys_sign")) {
      return -2;
    }
  }

  if (rule.name === "Pulmonary embolism") {
    const hasPeSpecificSupport =
      has(features, "pleuritic_pain") ||
      has(features, "hypoxia") ||
      has(features, "haemoptysis") ||
      has(features, "recent_surgery") ||
      has(features, "immobility") ||
      has(features, "long_haul_travel") ||
      has(features, "dvt_history") ||
      has(features, "oestrogen_use") ||
      has(features, "pregnancy_possible") ||
      has(features, "leg_swelling");
    const hasDkaMetabolicSignature =
      (has(features, "diabetic_context") || has(features, "type_1_diabetes")) &&
      has(features, "kussmaul_breathing") &&
      (has(features, "polyuria") || has(features, "polydipsia") || has(features, "ketosis_breath")) &&
      !hasPeSpecificSupport;

    if (hasDkaMetabolicSignature) {
      return -6;
    }
  }

  if (rule.name === "Abdominal aortic aneurysm") {
    const hasUnstableAaaPattern =
      (has(features, "abdominal_pain") || has(features, "flank_pain")) &&
      (has(features, "collapse") || has(features, "hypotension"));

    if (hasUnstableAaaPattern) {
      return 2;
    }

    if (
      has(features, "pain_out_of_proportion") &&
      has(features, "af") &&
      !has(features, "flank_pain") &&
      !has(features, "back_radiation") &&
      !has(features, "pulsatile_abdomen")
    ) {
      return -2;
    }

    if (has(features, "loin_to_groin_pain") && has(features, "haematuria") && !has(features, "collapse")) {
      return -3;
    }
  }

  if (rule.name === "Acute pancreatitis") {
    const hasClassicLocalizedInflammatoryRuqPattern =
      has(features, "ruq_pain") &&
      (has(features, "persistent_ruq_pain") || has(features, "localized_ruq_tenderness") || has(features, "murphys_sign")) &&
      has(features, "fever") &&
      (has(features, "nausea") || has(features, "vomiting"));
    const hasStrongerPancreatitisSignature =
      has(features, "back_radiation") ||
      has(features, "alcohol_excess") ||
      has(features, "binge_drinking") ||
      has(features, "severe_constant_upper_abdominal_pain");

    if (hasClassicLocalizedInflammatoryRuqPattern && !hasStrongerPancreatitisSignature) {
      return -3;
    }

    if (
      has(features, "migration_to_rif") ||
      has(features, "rif_tenderness") ||
      has(features, "rif_pain") ||
      ((has(features, "pregnancy_possible") || has(features, "missed_period")) && has(features, "vaginal_bleeding")) ||
      has(features, "unilateral_testicular_pain") ||
      has(features, "guarding_rigidity") ||
      has(features, "abdominal_movement_pain") ||
      has(features, "lying_still")
    ) {
      return -3;
    }
  }

  if (rule.name === "Perforated viscus") {
    if (
      has(features, "abdominal_pain") &&
      (has(features, "guarding_rigidity") || has(features, "abdominal_movement_pain") || has(features, "lying_still"))
    ) {
      return 4;
    }

    if (
      !has(features, "abdominal_pain") ||
      !(
        has(features, "guarding_rigidity") ||
        has(features, "abdominal_movement_pain") ||
        has(features, "lying_still") ||
        has(features, "perforation_language") ||
        has(features, "sudden_onset")
      )
    ) {
      return -4;
    }
  }

  if (rule.name === "Mesenteric ischaemia") {
    if (!has(features, "abdominal_pain")) {
      return -6;
    }

    if (
      has(features, "abdominal_pain") &&
      has(features, "pain_out_of_proportion") &&
      (has(features, "af") || has(features, "collapse") || has(features, "hypotension"))
    ) {
      return 6;
    }

    if (!has(features, "pain_out_of_proportion")) {
      return -6;
    }
  }

  if (rule.name === "Appendicitis") {
    if (
      (has(features, "rif_pain") || has(features, "migration_to_rif") || has(features, "rif_tenderness")) &&
      (has(features, "fever") || has(features, "anorexia") || has(features, "abdominal_movement_pain"))
    ) {
      return 5;
    }

    if (
      (has(features, "rif_pain") || has(features, "migration_to_rif")) &&
      has(features, "diarrhoea") &&
      !has(features, "vaginal_bleeding")
    ) {
      return 2;
    }
  }

  if (rule.name === "Ectopic pregnancy") {
    if (
      (has(features, "pregnancy_possible") || has(features, "missed_period")) &&
      has(features, "vaginal_bleeding") &&
      (has(features, "abdominal_pain") || has(features, "pelvic_pain"))
    ) {
      return 4;
    }
  }

  if (rule.name === "Ovarian / acute pelvic pathology") {
    if (!has(features, "pelvic_pain") && !has(features, "vaginal_bleeding")) {
      return -3;
    }
  }

  if (rule.name === "Testicular torsion") {
    if ((has(features, "unilateral_testicular_pain") || has(features, "testicular_pain")) && has(features, "sudden_onset")) {
      return 5;
    }
  }

  if (rule.name === "Cauda equina syndrome") {
    if (
      has(features, "back_pain") &&
      (has(features, "urinary_retention") || has(features, "saddle_numbness")) &&
      has(features, "bilateral_leg_symptoms")
    ) {
      return 5;
    }
  }

  if (rule.name === "TIA") {
    if (has(features, "focal_neurology") && has(features, "transient_focal_deficit")) {
      return 4;
    }
  }

  if (rule.name === "Hypoglycaemia") {
    if (
      has(features, "hypoglycaemia_cue") ||
      (has(features, "diabetic_context") && (has(features, "confusion") || has(features, "collapse")))
    ) {
      return 4;
    }
  }

  if (rule.name === "Delirium secondary to infection") {
    const hasCnsInfectionSignature =
      has(features, "headache") &&
      (has(features, "neck_stiffness") ||
        has(features, "photophobia") ||
        has(features, "seizure") ||
        has(features, "reduced_consciousness"));
    const hasInfectiveSupport =
      has(features, "fever") ||
      has(features, "rigors") ||
      has(features, "infection_source") ||
      hasUrinarySymptomSignal ||
      has(features, "productive_cough") ||
      has(features, "crackles") ||
      has(features, "hypoxia");

    if (hasCnsInfectionSignature) {
      return -8;
    }

    if (hasDeliriumSignal && hasInfectiveSupport) {
      return 5;
    }

    if (!hasDeliriumSignal) {
      return -5;
    }
  }

  if (rule.name === "Pneumonia") {
    const hasPneumoniaSource =
      has(features, "productive_cough") ||
      has(features, "sputum_change") ||
      has(features, "crackles") ||
      has(features, "hypoxia");

    if (hasDeliriumSignal && has(features, "fever") && hasPneumoniaSource) {
      return 4;
    }
  }

  if (rule.name === "Heart failure") {
    const overloadCount = [
      has(features, "orthopnoea"),
      has(features, "paroxysmal_nocturnal_dyspnoea"),
      has(features, "bibasal_crackles"),
      has(features, "raised_jvp"),
      has(features, "peripheral_oedema"),
      has(features, "ankle_swelling"),
      has(features, "frothy_sputum"),
    ].filter(Boolean).length;

    if (has(features, "sob") && overloadCount >= 2) {
      return 4;
    }
  }

  if (rule.name === "Asthma exacerbation") {
    const hasStrongInfectivePulmonaryPattern =
      has(features, "productive_cough") &&
      has(features, "fever") &&
      (has(features, "crackles") || has(features, "sputum_change") || has(features, "rigors") || has(features, "infection_source"));
    const hasAsthmaSpecificSupport =
      has(features, "known_asthma") ||
      has(features, "asthma_history") ||
      has(features, "increased_inhaler_use") ||
      has(features, "poor_peak_flow") ||
      has(features, "unable_to_speak_full_sentences") ||
      has(features, "silent_chest");

    if (hasStrongInfectivePulmonaryPattern && !hasAsthmaSpecificSupport) {
      return -5;
    }
  }

  if (rule.name === "UTI / urosepsis") {
    const hasLocalizedPyelonephritisPattern =
      has(features, "flank_pain") &&
      has(features, "fever") &&
      hasUrinarySymptomSignal &&
      has(features, "cva_tenderness");
    const hasInstabilityOrSepsisPattern =
      has(features, "hypotension") ||
      has(features, "confusion") ||
      has(features, "collapse") ||
      has(features, "shock") ||
      has(features, "sepsis_pattern");

    if (hasLocalizedPyelonephritisPattern && !hasInstabilityOrSepsisPattern) {
      return -3;
    }

    if (
      hasUrinarySymptomSignal &&
      (has(features, "fever") || has(features, "rigors")) &&
      (has(features, "confusion") || has(features, "hypotension") || has(features, "flank_pain"))
    ) {
      return 4;
    }

    if (!hasUrinarySymptomSignal && !has(features, "flank_pain")) {
      return -3;
    }
  }

  if (rule.name === "Sepsis") {
    const hasStrongLocalizedPulmonarySource =
      has(features, "productive_cough") &&
      has(features, "progressive_course") &&
      (has(features, "sputum_change") || has(features, "rigors"));
    const hasInstabilityOrHighRiskPhysiology =
      has(features, "hypotension") ||
      has(features, "collapse") ||
      has(features, "confusion") ||
      has(features, "tachycardia") ||
      has(features, "tachypnoea") ||
      has(features, "hypoxia");
    const hasStrongLocalizedUrinarySource =
      hasUrinarySymptomSignal &&
      (has(features, "flank_pain") || has(features, "cva_tenderness") || has(features, "urinary_incontinence"));
    const hasStrongLocalizedBiliarySource =
      has(features, "ruq_pain") && has(features, "jaundice");

    if (
      hasDeliriumSignal &&
      hasInstabilityOrHighRiskPhysiology &&
      (has(features, "fever") || has(features, "rigors") || has(features, "infection_source") || hasStrongLocalizedUrinarySource || hasStrongLocalizedPulmonarySource)
    ) {
      return 3;
    }

    if (
      (hasStrongLocalizedPulmonarySource || hasStrongLocalizedUrinarySource || hasStrongLocalizedBiliarySource) &&
      !hasInstabilityOrHighRiskPhysiology
    ) {
      return -5;
    }
  }

  if (rule.name === "Dementia / chronic cognitive impairment") {
    const hasAcuteOrDangerContext =
      has(features, "acute_on_chronic_confusion") ||
      has(features, "fever") ||
      has(features, "infection_source") ||
      hasUrinarySymptomSignal ||
      has(features, "hypoglycaemia_cue") ||
      has(features, "focal_neurology") ||
      has(features, "neck_stiffness") ||
      has(features, "medication_toxicity_context") ||
      has(features, "alcohol_withdrawal_context") ||
      has(features, "metabolic_disturbance_context") ||
      has(features, "dehydration");

    if (hasAcuteOrDangerContext) {
      return -6;
    }
  }

  if (rule.name === "Choledocholithiasis / obstructive jaundice") {
    const hasStrongSepticPattern =
      has(features, "fever") &&
      (has(features, "rigors") || has(features, "hypotension") || has(features, "confusion"));
    const hasChronicCholestaticPattern =
      has(features, "chronic_course") &&
      (has(features, "pruritus") || has(features, "dry_eyes_mouth") || has(features, "ibd_context"));

    if (hasStrongSepticPattern) {
      return -2;
    }

    if (hasChronicCholestaticPattern) {
      return -2;
    }
  }

  if (rule.name === "Biliary colic / gallstone disease") {
    const hasComplicatedBiliaryPattern =
      has(features, "fever") ||
      has(features, "jaundice") ||
      has(features, "rigors") ||
      has(features, "hypotension") ||
      has(features, "confusion") ||
      has(features, "persistent_ruq_pain") ||
      has(features, "murphys_sign");

    if (hasComplicatedBiliaryPattern) {
      return -3;
    }
  }

  if (rule.name === "Pulmonary embolism") {
    const ageBand = getAgeBand(age);
    const pneumothoraxSignatureCount = PNEUMOTHORAX_YOUNG_SIGNATURE_FEATURES.filter((feature) =>
      has(features, feature),
    ).length;
    const hasVteContext = PE_VTE_CONTEXT_FEATURES.some((feature) => has(features, feature));
    const hasStrongInfectivePulmonaryPattern =
      has(features, "productive_cough") &&
      has(features, "progressive_course") &&
      (has(features, "sputum_change") || has(features, "rigors") || has(features, "infection_source"));
    const hasStrongObstructivePattern =
      has(features, "wheeze") &&
      (has(features, "known_asthma") || has(features, "known_copd")) &&
      (has(features, "increased_inhaler_use") || has(features, "difficulty_speaking"));

    if (ageBand === "under30" && pneumothoraxSignatureCount >= 4 && !hasVteContext) {
      return 0;
    }

    if (
      hasStrongInfectivePulmonaryPattern &&
      !hasVteContext &&
      !has(features, "haemoptysis") &&
      !has(features, "collapse")
    ) {
      return -3;
    }

    if (
      hasStrongObstructivePattern &&
      !hasVteContext &&
      !has(features, "pleuritic_pain") &&
      !has(features, "haemoptysis") &&
      !has(features, "unilateral_reduced_air_entry")
    ) {
      return -2;
    }
  }

  if (rule.name === "Gastroenteritis") {
    if (
      hasStrongAbdominalLocalization ||
      has(features, "jaundice") ||
      has(features, "vaginal_bleeding")
    ) {
      return -4;
    }
  }

  if (rule.name === "Viral illness") {
    if (
      hasStrongAbdominalLocalization ||
      hasStrongChestSignature ||
      hasStrongHeadacheSignature ||
      has(features, "hypotension") ||
      has(features, "collapse") ||
      has(features, "focal_neurology")
    ) {
      return -4;
    }
  }

  if (rule.name === "Diabetic ketoacidosis") {
    if (
      !has(features, "diabetic_context") &&
      !has(features, "hyperglycaemia") &&
      !has(features, "polyuria") &&
      !has(features, "polydipsia") &&
      !has(features, "ketosis_breath") &&
      !has(features, "kussmaul_breathing")
    ) {
      return -5;
    }

    if (
      (has(features, "diabetic_context") || has(features, "hyperglycaemia")) &&
      has(features, "kussmaul_breathing") &&
      (has(features, "polyuria") || has(features, "polydipsia") || has(features, "vomiting") || has(features, "dehydration"))
    ) {
      return 5;
    }
  }

  if (rule.name === "Anaemia") {
    if (
      has(features, "sob") &&
      has(features, "pallor") &&
      (has(features, "fatigue") || has(features, "heavy_menstrual_bleeding"))
    ) {
      return 4;
    }

    if (
      has(features, "hypoxia") ||
      has(features, "wheeze") ||
      has(features, "bibasal_crackles") ||
      has(features, "raised_jvp")
    ) {
      return -2;
    }
  }

  if (rule.name === "Temporal arteritis") {
    if (!hasStrongHeadacheSignature && (hasStrongAbdominalLocalization || hasStrongChestSignature)) {
      return -5;
    }
  }

  if (rule.name === "Pneumothorax") {
    if (!hasStrongChestSignature && hasStrongAbdominalLocalization) {
      return -5;
    }
  }

  if (rule.name === "Panic / anxiety") {
    if (
      hasStrongAbdominalLocalization ||
      has(features, "focal_neurology") ||
      has(features, "thunderclap") ||
      has(features, "hypotension") ||
      has(features, "collapse")
    ) {
      return -4;
    }
  }

  return 0;
}

function getSupportiveWeight(rule: DiagnosisRule, feature: string) {
  const genericWeight = GENERIC_SUPPORTIVE_FEATURE_WEIGHTS.get(feature);

  if (genericWeight !== undefined) {
    const configuredWeight = rule.supportiveWeights?.[feature];

    return configuredWeight !== undefined
      ? Math.min(configuredWeight, genericWeight)
      : genericWeight;
  }

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
  if (SOFT_NEGATIVE_FEATURES.has(feature)) {
    return -1;
  }

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
  score += getContextModifier(rule, features, age);
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
