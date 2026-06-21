import { DIAGNOSIS_RULES } from "../domain/diagnosisRules";
import { acuteAbdominalPainFeatureVocabulary } from "../domain/presentationBlocks/acuteAbdominalPain";
import { canonicalFeatureSlug } from "../domain/featureSlug";

const SHARED_GENERIC_FEATURES = [
  "older_age",
  "sudden_onset",
  "fever",
  "tachycardia",
  "tachypnoea",
  "hypotension",
  "hypoxia",
  "collapse",
  "shock",
  "sweating",
  "nausea",
  "vomiting",
  "diabetic_context",
  "type_1_diabetes",
  "polyuria",
  "polydipsia",
  "ketosis_breath",
  "kussmaul_breathing",
  "dehydration",
] as const;

const CHEST_PAIN_DIAGNOSES = [
  "Acute coronary syndrome",
  "Pulmonary embolism",
  "Pneumothorax",
  "Acute aortic syndrome",
  "Pneumonia",
  "Pericarditis",
  "GORD",
  "Musculoskeletal chest pain",
  "Anxiety / panic",
];

const BREATHLESSNESS_DIAGNOSES = [
  "Pulmonary embolism",
  "Pneumonia",
  "Asthma exacerbation",
  "COPD exacerbation",
  "Heart failure",
  "Pneumothorax",
  "Acute coronary syndrome",
  "Anxiety / panic",
  "Anaemia",
  "Diabetic ketoacidosis",
];

const EXTRA_CHEST_FEATURES = [
  "central_chest_pain",
  "chest_heaviness",
  "exertional_pain",
  "pain_radiates_to_jaw",
  "pain_radiates_to_shoulder",
  "shoulder_pain",
  "jaw_pain",
  "arm_pain",
  "indigestion_like_chest_pain",
  "acs_equivalent_pain",
  "hyperlipidaemia",
  "pleuritic_pain",
  "sob",
  "haemoptysis",
  "long_haul_travel",
  "recent_surgery",
  "immobility",
  "leg_swelling",
  "dvt_history",
  "unilateral_reduced_air_entry",
  "hyperresonance",
  "tracheal_deviation",
  "tearing_pain",
  "pain_radiates_to_back",
  "back_radiation",
  "heartburn",
  "acid_regurgitation",
  "antacid_relief",
  "reproducible_chest_wall_tenderness",
  "movement_related_chest_pain",
  "panic_features",
  "tingling",
  "normal_exam",
  "normal_oxygen_saturations",
] as const;

const EXTRA_BREATHLESSNESS_FEATURES = [
  "sob",
  "dyspnoea",
  "shortness_of_breath",
  "wheeze",
  "cough",
  "productive_cough",
  "pleuritic_pain",
  "chest_pain",
  "haemoptysis",
  "recent_surgery",
  "immobility",
  "long_haul_travel",
  "oestrogen_use",
  "pregnancy_possible",
  "dvt_history",
  "leg_swelling",
  "respiratory_distress",
  "severe_respiratory_distress",
  "unable_to_speak_full_sentences",
  "accessory_muscle_use",
  "reduced_air_entry",
  "unilateral_reduced_air_entry",
  "hyperresonance",
  "tracheal_deviation",
  "orthopnoea",
  "paroxysmal_nocturnal_dyspnoea",
  "raised_jvp",
  "peripheral_oedema",
  "bibasal_crackles",
  "crackles",
  "frothy_sputum",
  "asthma_history",
  "copd_history",
  "inhaler_use",
  "poor_peak_flow",
  "silent_chest",
  "panic_features",
  "tingling",
  "perioral_paraesthesia",
  "normal_exam",
  "normal_oxygen_saturations",
  "pallor",
  "fatigue",
  "heavy_menstrual_bleeding",
] as const;

function uniqueCanonical(values: readonly string[]) {
  return [...new Set(values.map(canonicalFeatureSlug).filter(Boolean))].sort();
}

function featuresForDiagnoses(diagnosisNames: readonly string[]) {
  const names = new Set(diagnosisNames);
  const features = DIAGNOSIS_RULES
    .filter((rule) => names.has(rule.name))
    .flatMap((rule) => [
      ...rule.supportive,
      ...rule.conflicting,
      ...(rule.expectedImportant ?? []),
      ...Object.keys(rule.supportiveWeights ?? {}),
      ...Object.keys(rule.conflictingWeights ?? {}),
      ...(rule.strongSignatureGate?.features ?? []),
    ]);

  return uniqueCanonical(features);
}

const ACUTE_ABDOMINAL_FEATURES = uniqueCanonical([
  ...Object.values(acuteAbdominalPainFeatureVocabulary).flat(),
  ...SHARED_GENERIC_FEATURES,
]);

const CHEST_PAIN_FEATURES = uniqueCanonical([
  ...featuresForDiagnoses(CHEST_PAIN_DIAGNOSES),
  ...EXTRA_CHEST_FEATURES,
  ...SHARED_GENERIC_FEATURES,
]);

const BREATHLESSNESS_FEATURES = uniqueCanonical([
  ...featuresForDiagnoses(BREATHLESSNESS_DIAGNOSES),
  ...EXTRA_BREATHLESSNESS_FEATURES,
  ...SHARED_GENERIC_FEATURES,
]);

export const LLM_SUPPORTED_BLOCK_IDS = [
  "acute-abdominal-pain",
  "chest-pain",
  "breathlessness-pleuritic-chest-pain",
] as const;

export type LlmSupportedBlockId = typeof LLM_SUPPORTED_BLOCK_IDS[number];

export function getAllowedLlmFeatureSlugsForBlock(blockId?: string): string[] {
  switch (blockId) {
    case "acute-abdominal-pain":
    case "acute_abdominal_pain":
      return ACUTE_ABDOMINAL_FEATURES;
    case "chest-pain":
    case "chest_pain":
      return CHEST_PAIN_FEATURES;
    case "breathlessness-pleuritic-chest-pain":
    case "breathlessness":
    case "pleuritic_chest_pain":
      return BREATHLESSNESS_FEATURES;
    default:
      return [];
  }
}

export function isLlmSupportedBlock(blockId?: string) {
  return getAllowedLlmFeatureSlugsForBlock(blockId).length > 0;
}
