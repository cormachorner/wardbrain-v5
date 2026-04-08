import { formatFeatureLabel } from "./featureLabels";
import type {
  CaseInput,
  DiagnosisDefinition,
  DifferentialResult,
  ExtractedFeatures,
  RedFlag,
} from "../types";

const CORE_FEATURE_WEIGHT = 2;
const DISCRIMINATING_FEATURE_WEIGHT = 4;
const WEAK_FEATURE_WEIGHT = 1;
const AGAINST_FEATURE_WEIGHT = -3;
const EXCLUSION_FEATURE_WEIGHT = -4;
const RISK_FACTOR_WEIGHT = 1;
const SOFT_NEGATIVE_WEIGHT = -1;

const GENERIC_CORE_FEATURE_WEIGHTS: Record<string, number> = {
  abdominalPain: 1,
  generalizedAbdominalPain: 0,
};

const GENERIC_WEAK_FEATURE_WEIGHTS: Record<string, number> = {
  vomiting: 0,
  nausea: 0,
  diarrhoea: 0,
  generalizedAbdominalPain: 0,
};

const SOFT_NEGATIVE_FEATURES = new Set([
  "diarrhoea",
  "vomiting",
  "nausea",
  "generalizedAbdominalPain",
]);

const DEFINITION_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  ruptured_or_symptomatic_aaa: "Abdominal aortic aneurysm",
  perforated_viscus_peritonitis: "Perforated viscus",
  intra_abdominal_sepsis: "Sepsis",
  acs_epigastric_presentation: "Acute coronary syndrome",
};

type Clause = {
  ifAll?: string[];
  ifAny?: string[];
  add?: number;
  subtract?: number;
  reason: string;
};

function buildAugmentedFeatureSet(features: ExtractedFeatures, input: CaseInput): Set<string> {
  const augmented = new Set(features.matchedFeatures);
  const parsedAge = Number.parseInt(input.age, 10);

  if (input.sex === "male" || input.sex === "female") {
    augmented.add(input.sex);
  }

  if (augmented.has("guardingRigidity")) {
    augmented.add("guarding");
    augmented.add("rigidity");
    augmented.add("peritonism");
  }

  if (augmented.has("backRadiation")) {
    augmented.add("painRadiatesToBack");
  }

  if (augmented.has("severeConstantUpperAbdominalPain")) {
    augmented.add("upperAbdominalPain");
    augmented.add("epigastricPain");
    augmented.add("constantPain");
    augmented.add("severePain");
  }

  if (augmented.has("af")) {
    augmented.add("atrialFibrillation");
  }

  if (augmented.has("smoker")) {
    augmented.add("smokingHistory");
  }

  if (augmented.has("gallstoneContext")) {
    augmented.add("gallstoneHistory");
  }

  if (augmented.has("alcoholExcess")) {
    augmented.add("heavyAlcoholIntake");
  }

  if (augmented.has("pepticUlcerDisease")) {
    augmented.add("pepticUlcerHistory");
  }

  if (!Number.isNaN(parsedAge) && parsedAge >= 65) {
    augmented.add("olderAge");
  }

  if (
    input.sex === "female" &&
    !Number.isNaN(parsedAge) &&
    parsedAge >= 12 &&
    parsedAge <= 55
  ) {
    augmented.add("femaleOfChildbearingAge");
  }

  return augmented;
}

function hasFeature(featureSet: Set<string>, feature: string): boolean {
  return featureSet.has(feature);
}

function evaluateClause(featureSet: Set<string>, clause: Pick<Clause, "ifAll" | "ifAny">): boolean {
  const matchesAll = !clause.ifAll || clause.ifAll.every((feature) => hasFeature(featureSet, feature));
  const matchesAny = !clause.ifAny || clause.ifAny.some((feature) => hasFeature(featureSet, feature));

  return matchesAll && matchesAny;
}

function getDefinitionDisplayName(definition: DiagnosisDefinition): string {
  return DEFINITION_DISPLAY_NAME_OVERRIDES[definition.id] ?? definition.name;
}

function getFeatureWeight(
  feature: string,
  defaultWeight: number,
  overrides: Record<string, number>,
): number {
  return overrides[feature] ?? defaultWeight;
}

function hasClearSurgicalAbdominalPattern(featureSet: Set<string>): boolean {
  return (
    (hasFeature(featureSet, "painMigrationToRIF") && (hasFeature(featureSet, "rifPain") || hasFeature(featureSet, "rifTenderness"))) ||
    (hasFeature(featureSet, "peritonism") &&
      (hasFeature(featureSet, "painWorseOnMovement") || hasFeature(featureSet, "lyingStill"))) ||
    (hasFeature(featureSet, "flankPain") &&
      hasFeature(featureSet, "loinToGroinPain") &&
      (hasFeature(featureSet, "restless") || hasFeature(featureSet, "colickyPain")))
  );
}

function getDefinitionPolicyModifier(
  definition: DiagnosisDefinition,
  featureSet: Set<string>,
): { scoreDelta: number; reasonsFor: string[]; reasonsAgainst: string[] } {
  const reasonsFor: string[] = [];
  const reasonsAgainst: string[] = [];
  let scoreDelta = 0;

  switch (definition.id) {
    case "mesenteric_ischaemia":
      if (
        hasFeature(featureSet, "abdominalPain") &&
        (hasFeature(featureSet, "painOutOfProportion") ||
          hasFeature(featureSet, "painSevereButExamMild") ||
          hasFeature(featureSet, "severePain")) &&
        (hasFeature(featureSet, "atrialFibrillation") ||
          hasFeature(featureSet, "vascularDisease") ||
          hasFeature(featureSet, "olderAge"))
      ) {
        scoreDelta += 12;
        reasonsFor.push("high-specificity mesenteric emergency pattern");
      }
      break;
    case "ectopic_pregnancy":
      if (hasFeature(featureSet, "male")) {
        scoreDelta -= 30;
        reasonsAgainst.push("male sex strongly argues against ectopic pregnancy");
      }

      if (
        hasFeature(featureSet, "pelvicPain") &&
        hasFeature(featureSet, "vaginalBleeding") &&
        (hasFeature(featureSet, "pregnancyPossible") ||
          hasFeature(featureSet, "missedPeriod") ||
          hasFeature(featureSet, "positivePregnancyTest"))
      ) {
        scoreDelta += 9;
        reasonsFor.push("high-specificity ectopic pregnancy pattern");
      }

      if (
        hasFeature(featureSet, "pelvicPain") &&
        hasFeature(featureSet, "vaginalBleeding") &&
        (hasFeature(featureSet, "dizziness") ||
          hasFeature(featureSet, "pallor") ||
          hasFeature(featureSet, "collapse") ||
          hasFeature(featureSet, "hypotension"))
      ) {
        scoreDelta += 5;
        reasonsFor.push("ectopic instability warning pattern");
      }
      break;
    case "appendicitis":
      if (
        hasFeature(featureSet, "painMigrationToRIF") &&
        (hasFeature(featureSet, "rifPain") || hasFeature(featureSet, "rifTenderness"))
      ) {
        scoreDelta += 10;
        reasonsFor.push("high-specificity appendicitis localization pattern");
      }

      if (
        hasFeature(featureSet, "painMigrationToRIF") &&
        hasFeature(featureSet, "rifTenderness") &&
        (hasFeature(featureSet, "anorexia") || hasFeature(featureSet, "painWorseOnMovement"))
      ) {
        scoreDelta += 6;
        reasonsFor.push("appendicitis composite pattern");
      }
      break;
    case "perforated_viscus_peritonitis":
      if (
        (hasFeature(featureSet, "peritonism") || hasFeature(featureSet, "guarding") || hasFeature(featureSet, "rigidity")) &&
        (hasFeature(featureSet, "painWorseOnMovement") || hasFeature(featureSet, "lyingStill"))
      ) {
        scoreDelta += 10;
        reasonsFor.push("high-specificity peritonitic emergency pattern");
      }

      if (
        hasFeature(featureSet, "painWorseOnMovement") &&
        !hasFeature(featureSet, "suddenOnset") &&
        !hasFeature(featureSet, "peritonism") &&
        !hasFeature(featureSet, "guarding") &&
        !hasFeature(featureSet, "rigidity") &&
        !hasFeature(featureSet, "lyingStill")
      ) {
        scoreDelta -= 5;
        reasonsAgainst.push("movement pain alone without a true peritonitic pattern is weak support for perforation");
      }
      break;
    case "renal_colic":
      if (
        hasFeature(featureSet, "flankPain") &&
        hasFeature(featureSet, "loinToGroinPain") &&
        hasFeature(featureSet, "restless")
      ) {
        scoreDelta += 12;
        reasonsFor.push("high-specificity renal colic pattern");
      }

      if (
        hasFeature(featureSet, "flankPain") &&
        hasFeature(featureSet, "loinToGroinPain") &&
        (hasFeature(featureSet, "colickyPain") || hasFeature(featureSet, "haematuria"))
      ) {
        scoreDelta += 5;
        reasonsFor.push("renal colic flank-to-groin composite pattern");
      }
      break;
    case "pyelonephritis":
      if (
        hasFeature(featureSet, "flankPain") &&
        !hasFeature(featureSet, "urinarySymptoms") &&
        !hasFeature(featureSet, "cvaTenderness") &&
        (hasFeature(featureSet, "loinToGroinPain") || hasFeature(featureSet, "restless"))
      ) {
        scoreDelta -= 5;
        reasonsAgainst.push("weak infective urinary signature in a renal-colic-like pattern");
      }
      break;
    case "dka":
      if (
        !hasFeature(featureSet, "diabeticContext") &&
        !hasFeature(featureSet, "ketosisBreath") &&
        !hasFeature(featureSet, "polyuria") &&
        !hasFeature(featureSet, "polydipsia")
      ) {
        scoreDelta -= 6;
        reasonsAgainst.push("no metabolic diabetic signature");
      }
      break;
    case "acs_epigastric_presentation":
      if (
        hasFeature(featureSet, "flankPain") &&
        hasFeature(featureSet, "loinToGroinPain") &&
        hasFeature(featureSet, "restless") &&
        !hasFeature(featureSet, "acsEquivalentPain") &&
        !hasFeature(featureSet, "chestPain") &&
        !hasFeature(featureSet, "sob")
      ) {
        scoreDelta -= 8;
        reasonsAgainst.push("no cardiac signature in a classic renal-colic pattern");
      }

      if (
        !hasFeature(featureSet, "acsEquivalentPain") &&
        !hasFeature(featureSet, "chestPain") &&
        !hasFeature(featureSet, "sob") &&
        hasClearSurgicalAbdominalPattern(featureSet)
      ) {
        scoreDelta -= 6;
        reasonsAgainst.push("weak cardiac signature in a clearly abdominal pattern");
      }
      break;
    case "gastroenteritis":
      if (
        hasFeature(featureSet, "abdominalPain") &&
        hasFeature(featureSet, "severePain") &&
        (hasFeature(featureSet, "atrialFibrillation") ||
          hasFeature(featureSet, "vascularDisease") ||
          hasFeature(featureSet, "olderAge"))
      ) {
        scoreDelta -= 3;
        reasonsAgainst.push("vascular-risk severe abdominal pain only modestly fits gastroenteritis");
      }
      break;
    case "ruptured_or_symptomatic_aaa":
      if (
        !hasFeature(featureSet, "collapse") &&
        !hasFeature(featureSet, "hypotension") &&
        !hasFeature(featureSet, "backPain") &&
        !hasFeature(featureSet, "flankPain") &&
        hasClearSurgicalAbdominalPattern(featureSet)
      ) {
        scoreDelta -= 5;
        reasonsAgainst.push("weak vascular signature in a clearly abdominal surgical pattern");
      }
      break;
    default:
      break;
  }

  return { scoreDelta, reasonsFor, reasonsAgainst };
}

function getRedFlagPromotionScore(
  differentialName: string,
  redFlags: RedFlag[],
  featureSet?: Set<string>,
): { scoreDelta: number; reasonsFor: string[] } {
  let scoreDelta = 0;
  const reasonsFor: string[] = [];

  if (differentialName === "Ectopic pregnancy" && featureSet?.has("male")) {
    return { scoreDelta: 0, reasonsFor };
  }

  for (const redFlag of redFlags) {
    if (redFlag.boostDiagnoses.includes(differentialName)) {
      scoreDelta += 6;
      reasonsFor.push(`red-flag promotion: ${redFlag.name}`);
    }
  }

  return { scoreDelta, reasonsFor };
}

export function getMatchedDefinitionSupportiveFeatures(
  definition: DiagnosisDefinition,
  features: ExtractedFeatures,
  input: CaseInput,
): string[] {
  const featureSet = buildAugmentedFeatureSet(features, input);
  const matched = [
    ...definition.features.core.filter((feature) => hasFeature(featureSet, feature)),
    ...definition.features.discriminating.filter((feature) => hasFeature(featureSet, feature)),
    ...(definition.features.weak ?? []).filter((feature) => hasFeature(featureSet, feature)),
    ...(definition.features.riskFactors ?? []).filter((feature) => hasFeature(featureSet, feature)),
  ];

  return [...new Set(matched)].map(formatFeatureLabel);
}

export function getMatchedDefinitionConflictingFeatures(
  definition: DiagnosisDefinition,
  features: ExtractedFeatures,
  input: CaseInput,
): string[] {
  const featureSet = buildAugmentedFeatureSet(features, input);
  const matched = [
    ...(definition.features.against ?? []).filter((feature) => hasFeature(featureSet, feature)),
    ...(definition.features.exclusions ?? []).filter((feature) => hasFeature(featureSet, feature)),
  ];

  return [...new Set(matched)].map(formatFeatureLabel);
}

export function scoreDiagnosisDefinition(
  definition: DiagnosisDefinition,
  features: ExtractedFeatures,
  input: CaseInput,
): DifferentialResult {
  const featureSet = buildAugmentedFeatureSet(features, input);
  let score = 0;
  const reasonsFor = new Set<string>();
  const reasonsAgainst = new Set<string>();

  for (const feature of definition.features.core) {
    if (hasFeature(featureSet, feature)) {
      score += getFeatureWeight(feature, CORE_FEATURE_WEIGHT, GENERIC_CORE_FEATURE_WEIGHTS);
      reasonsFor.add(formatFeatureLabel(feature));
    }
  }

  for (const feature of definition.features.discriminating) {
    if (hasFeature(featureSet, feature)) {
      score += DISCRIMINATING_FEATURE_WEIGHT;
      reasonsFor.add(formatFeatureLabel(feature));
    }
  }

  for (const feature of definition.features.weak ?? []) {
    if (hasFeature(featureSet, feature)) {
      score += getFeatureWeight(feature, WEAK_FEATURE_WEIGHT, GENERIC_WEAK_FEATURE_WEIGHTS);
      reasonsFor.add(formatFeatureLabel(feature));
    }
  }

  for (const feature of definition.features.riskFactors ?? []) {
    if (hasFeature(featureSet, feature)) {
      score += RISK_FACTOR_WEIGHT;
      reasonsFor.add(formatFeatureLabel(feature));
    }
  }

  for (const feature of definition.features.against ?? []) {
    if (hasFeature(featureSet, feature)) {
      score += SOFT_NEGATIVE_FEATURES.has(feature) ? SOFT_NEGATIVE_WEIGHT : AGAINST_FEATURE_WEIGHT;
      reasonsAgainst.add(formatFeatureLabel(feature));
    }
  }

  for (const feature of definition.features.exclusions ?? []) {
    if (hasFeature(featureSet, feature)) {
      score += EXCLUSION_FEATURE_WEIGHT;
      reasonsAgainst.add(formatFeatureLabel(feature));
    }
  }

  for (const boost of definition.logic?.boosts ?? []) {
    if (evaluateClause(featureSet, boost)) {
      score += boost.add;
      reasonsFor.add(boost.reason);
    }
  }

  for (const penalty of definition.logic?.penalties ?? []) {
    if (evaluateClause(featureSet, penalty)) {
      score -= penalty.subtract;
      reasonsAgainst.add(penalty.reason);
    }
  }

  for (const escalation of definition.logic?.escalationRules ?? []) {
    if (evaluateClause(featureSet, escalation)) {
      score += escalation.add;
      reasonsFor.add(escalation.reason);
    }
  }

  const policyModifier = getDefinitionPolicyModifier(definition, featureSet);
  score += policyModifier.scoreDelta;

  for (const reason of policyModifier.reasonsFor) {
    reasonsFor.add(reason);
  }

  for (const reason of policyModifier.reasonsAgainst) {
    reasonsAgainst.add(reason);
  }

  return {
    name: getDefinitionDisplayName(definition),
    score,
    reasonsFor: [...reasonsFor],
    reasonsAgainst: [...reasonsAgainst],
  };
}

export function scoreDiagnosisDefinitions(
  definitions: DiagnosisDefinition[],
  features: ExtractedFeatures,
  input: CaseInput,
  redFlags: RedFlag[] = [],
): DifferentialResult[] {
  return definitions
    .map((definition) => {
      const scored = scoreDiagnosisDefinition(definition, features, input);
      const redFlagPromotion = getRedFlagPromotionScore(scored.name, redFlags, buildAugmentedFeatureSet(features, input));

      return {
        ...scored,
        score: scored.score + redFlagPromotion.scoreDelta,
        reasonsFor: [...new Set([...scored.reasonsFor, ...redFlagPromotion.reasonsFor])],
      };
    })
    .sort((left, right) => right.score - left.score);
}
