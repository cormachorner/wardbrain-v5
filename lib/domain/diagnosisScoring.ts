import { formatFeatureLabel } from "./featureLabels";
import type { DiagnosisBoost, DifferentialResult, ExtractedFeatures } from "../types";
import type { DiagnosisRule } from "./diagnosisRules";

const DEFAULT_SUPPORTIVE_WEIGHT = 2;
const DEFAULT_CONFLICT_WEIGHT = -2;
const GENERIC_SUPPORTIVE_FEATURE_WEIGHTS = new Map<string, number>([
  ["abdominalPain", 1],
  ["chestPain", 2],
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
  "tallThinHabitus",
  "suddenOnset",
  "pleuriticPain",
  "unilateralReducedAirEntry",
  "sob",
  "smoker",
] as const;
const PE_VTE_CONTEXT_FEATURES = ["recentSurgery", "immobility", "longHaulTravel", "haemoptysis"] as const;

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
  const acsSignatureCount = ["chestPain", "jawPain", "armPain", "sweating", "indigestionLikeChestPain"].filter(
    (feature) => has(features, feature),
  ).length;
  const aaaSignatureCount = ["abdominalPain", "backRadiation", "pulsatileAbdomen"].filter(
    (feature) => has(features, feature),
  ).length;
  const aorticSignatureCount = ["chestPain", "suddenOnset", "tearingPain", "backRadiation"].filter(
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
    has(features, "painOutOfProportion") ||
    has(features, "migrationToRIF") ||
    has(features, "rifTenderness") ||
    has(features, "guardingRigidity") ||
    has(features, "abdominalMovementPain") ||
    has(features, "lyingStill") ||
    has(features, "flankPain") ||
    has(features, "loinToGroinPain") ||
    has(features, "pelvicPain") ||
    has(features, "testicularPain") ||
    has(features, "unilateralTesticularPain");
  const hasStrongChestSignature =
    has(features, "chestPain") ||
    has(features, "indigestionLikeChestPain") ||
    has(features, "jawPain") ||
    has(features, "armPain") ||
    has(features, "pleuriticPain") ||
    has(features, "unilateralReducedAirEntry");
  const hasStrongHeadacheSignature =
    has(features, "headache") ||
    has(features, "thunderclap") ||
    has(features, "jawClaudication") ||
    has(features, "scalpTenderness") ||
    has(features, "visualSymptoms");

  if (rule.name === "Acute cholangitis") {
    const hasAcuteBiliaryInfectivePattern =
      has(features, "ruqPain") &&
      has(features, "jaundice") &&
      (has(features, "fever") || has(features, "rigors"));
    const hasChronicCholestaticPattern =
      has(features, "chronicCourse") &&
      (has(features, "pruritus") || has(features, "fatigue") || has(features, "dryEyesMouth") || has(features, "ibdContext"));

    if (!hasAcuteBiliaryInfectivePattern && hasChronicCholestaticPattern) {
      return -4;
    }
  }

  if (rule.name === "Acute cholecystitis") {
    const hasClassicLocalizedInflammatoryRuqPattern =
      has(features, "ruqPain") &&
      (has(features, "persistentRuqPain") || has(features, "localizedRuqTenderness") || has(features, "murphysSign")) &&
      (has(features, "fever") || has(features, "nausea") || has(features, "vomiting"));
    const hasObstructiveOrSepticDominance =
      has(features, "jaundice") ||
      has(features, "darkUrine") ||
      has(features, "paleStools") ||
      has(features, "rigors") ||
      has(features, "hypotension") ||
      has(features, "confusion");

    if (hasClassicLocalizedInflammatoryRuqPattern && !hasObstructiveOrSepticDominance) {
      return 3;
    }

    if (hasObstructiveOrSepticDominance && !has(features, "murphysSign")) {
      return -2;
    }
  }

  if (rule.name === "Abdominal aortic aneurysm") {
    const hasUnstableAaaPattern =
      (has(features, "abdominalPain") || has(features, "flankPain")) &&
      (has(features, "collapse") || has(features, "hypotension"));

    if (hasUnstableAaaPattern) {
      return 2;
    }

    if (
      has(features, "painOutOfProportion") &&
      has(features, "af") &&
      !has(features, "flankPain") &&
      !has(features, "backRadiation") &&
      !has(features, "pulsatileAbdomen")
    ) {
      return -2;
    }

    if (has(features, "loinToGroinPain") && has(features, "haematuria") && !has(features, "collapse")) {
      return -3;
    }
  }

  if (rule.name === "Acute pancreatitis") {
    const hasClassicLocalizedInflammatoryRuqPattern =
      has(features, "ruqPain") &&
      (has(features, "persistentRuqPain") || has(features, "localizedRuqTenderness") || has(features, "murphysSign")) &&
      has(features, "fever") &&
      (has(features, "nausea") || has(features, "vomiting"));
    const hasStrongerPancreatitisSignature =
      has(features, "backRadiation") ||
      has(features, "alcoholExcess") ||
      has(features, "bingeDrinking") ||
      has(features, "severeConstantUpperAbdominalPain");

    if (hasClassicLocalizedInflammatoryRuqPattern && !hasStrongerPancreatitisSignature) {
      return -3;
    }

    if (
      has(features, "migrationToRIF") ||
      has(features, "rifTenderness") ||
      has(features, "rifPain") ||
      ((has(features, "pregnancyPossible") || has(features, "missedPeriod")) && has(features, "vaginalBleeding")) ||
      has(features, "unilateralTesticularPain") ||
      has(features, "guardingRigidity") ||
      has(features, "abdominalMovementPain") ||
      has(features, "lyingStill")
    ) {
      return -3;
    }
  }

  if (rule.name === "Perforated viscus") {
    if (
      has(features, "abdominalPain") &&
      (has(features, "guardingRigidity") || has(features, "abdominalMovementPain") || has(features, "lyingStill"))
    ) {
      return 4;
    }

    if (
      !has(features, "abdominalPain") ||
      !(
        has(features, "guardingRigidity") ||
        has(features, "abdominalMovementPain") ||
        has(features, "lyingStill") ||
        has(features, "perforationLanguage") ||
        has(features, "suddenOnset")
      )
    ) {
      return -4;
    }
  }

  if (rule.name === "Mesenteric ischaemia") {
    if (!has(features, "abdominalPain")) {
      return -6;
    }

    if (
      has(features, "abdominalPain") &&
      has(features, "painOutOfProportion") &&
      (has(features, "af") || has(features, "collapse") || has(features, "hypotension"))
    ) {
      return 6;
    }

    if (!has(features, "painOutOfProportion")) {
      return -6;
    }
  }

  if (rule.name === "Appendicitis") {
    if (
      (has(features, "rifPain") || has(features, "migrationToRIF") || has(features, "rifTenderness")) &&
      (has(features, "fever") || has(features, "anorexia") || has(features, "abdominalMovementPain"))
    ) {
      return 5;
    }

    if (
      (has(features, "rifPain") || has(features, "migrationToRIF")) &&
      has(features, "diarrhoea") &&
      !has(features, "vaginalBleeding")
    ) {
      return 2;
    }
  }

  if (rule.name === "Ectopic pregnancy") {
    if (
      (has(features, "pregnancyPossible") || has(features, "missedPeriod")) &&
      has(features, "vaginalBleeding") &&
      (has(features, "abdominalPain") || has(features, "pelvicPain"))
    ) {
      return 4;
    }
  }

  if (rule.name === "Ovarian / acute pelvic pathology") {
    if (!has(features, "pelvicPain") && !has(features, "vaginalBleeding")) {
      return -3;
    }
  }

  if (rule.name === "Testicular torsion") {
    if ((has(features, "unilateralTesticularPain") || has(features, "testicularPain")) && has(features, "suddenOnset")) {
      return 5;
    }
  }

  if (rule.name === "Cauda equina syndrome") {
    if (
      has(features, "backPain") &&
      (has(features, "urinaryRetention") || has(features, "saddleNumbness")) &&
      has(features, "bilateralLegSymptoms")
    ) {
      return 5;
    }
  }

  if (rule.name === "TIA") {
    if (has(features, "focalNeurology") && has(features, "transientFocalDeficit")) {
      return 4;
    }
  }

  if (rule.name === "Hypoglycaemia") {
    if (
      (has(features, "diabeticContext") || has(features, "hypoglycaemiaCue")) &&
      (has(features, "confusion") || has(features, "collapse") || has(features, "sweating"))
    ) {
      return 4;
    }
  }

  if (rule.name === "Heart failure") {
    if (has(features, "sob") && has(features, "orthopnoea") && has(features, "ankleSwelling")) {
      return 4;
    }
  }

  if (rule.name === "UTI / urosepsis") {
    if (
      has(features, "urinarySymptoms") &&
      (has(features, "fever") || has(features, "rigors")) &&
      (has(features, "confusion") || has(features, "hypotension") || has(features, "flankPain"))
    ) {
      return 4;
    }

    if (!has(features, "urinarySymptoms") && !has(features, "flankPain")) {
      return -3;
    }
  }

  if (rule.name === "Choledocholithiasis / obstructive jaundice") {
    const hasStrongSepticPattern =
      has(features, "fever") &&
      (has(features, "rigors") || has(features, "hypotension") || has(features, "confusion"));
    const hasChronicCholestaticPattern =
      has(features, "chronicCourse") &&
      (has(features, "pruritus") || has(features, "dryEyesMouth") || has(features, "ibdContext"));

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
      has(features, "persistentRuqPain") ||
      has(features, "murphysSign");

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
      has(features, "productiveCough") &&
      has(features, "progressiveCourse") &&
      (has(features, "sputumChange") || has(features, "rigors") || has(features, "infectionSource"));
    const hasStrongObstructivePattern =
      has(features, "wheeze") &&
      (has(features, "knownAsthma") || has(features, "knownCopd")) &&
      (has(features, "increasedInhalerUse") || has(features, "difficultySpeaking"));

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
      !has(features, "pleuriticPain") &&
      !has(features, "haemoptysis") &&
      !has(features, "unilateralReducedAirEntry")
    ) {
      return -2;
    }
  }

  if (rule.name === "Gastroenteritis") {
    if (
      hasStrongAbdominalLocalization ||
      has(features, "jaundice") ||
      has(features, "vaginalBleeding")
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
      has(features, "focalNeurology")
    ) {
      return -4;
    }
  }

  if (rule.name === "Diabetic ketoacidosis") {
    if (
      !has(features, "diabeticContext") &&
      !has(features, "polyuria") &&
      !has(features, "polydipsia") &&
      !has(features, "ketosisBreath")
    ) {
      return -5;
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
      has(features, "focalNeurology") ||
      has(features, "thunderclap") ||
      has(features, "hypotension") ||
      has(features, "collapse")
    ) {
      return -4;
    }
  }

  if (rule.name === "Sepsis") {
    const hasStrongLocalizedPulmonarySource =
      has(features, "productiveCough") &&
      has(features, "progressiveCourse") &&
      (has(features, "sputumChange") || has(features, "rigors"));
    const hasStrongLocalizedUrinarySource =
      has(features, "urinarySymptoms") &&
      (has(features, "flankPain") || has(features, "cvaTenderness"));
    const hasStrongLocalizedBiliarySource =
      has(features, "ruqPain") && has(features, "jaundice");

    if (
      (hasStrongLocalizedPulmonarySource || hasStrongLocalizedUrinarySource || hasStrongLocalizedBiliarySource) &&
      !has(features, "collapse")
    ) {
      return -2;
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
