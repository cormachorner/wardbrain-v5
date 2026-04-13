import { CONDITION_PROMOTION_REGISTRY_BY_NAME } from "./conditionPromotionRegistry";
import { routePresentationFamilies } from "./presentationFamilies";
import type { DifferentialResult, CaseInput, ExtractedFeatures, RedFlag } from "../types";
import type { PresentationFamily } from "../../types/wardbrain";

const FAMILY_INTEGRATION_TARGETS = new Set<PresentationFamily>([
  "chest-pain",
  "headache",
  "breathlessness-pleuritic-chest-pain",
  "acute-abdominal-pain",
  "ruq-pain-jaundice",
]);

const GLOBALLY_DANGEROUS_DIAGNOSES = new Set([
  "Acute coronary syndrome",
  "Pulmonary embolism",
  "Acute aortic syndrome",
  "Pneumothorax",
  "Subarachnoid haemorrhage",
  "Meningitis / encephalitis",
  "Stroke / neurological emergency",
  "Sepsis",
  "Acute cholangitis",
  "Abdominal aortic aneurysm",
  "Mesenteric ischaemia",
  "Perforated viscus",
  "Ectopic pregnancy",
  "Testicular torsion",
]);

const MIN_CONFIDENT_FAMILY_ROUTE = 6;
const RED_FLAG_PROMOTION_SCORE = 5;
const MIN_RED_FLAG_ELIGIBLE_SCORE = 6;

function buildCaseSearchText(input: CaseInput): string {
  return [
    input.presentingComplaint,
    input.history,
    input.pmh,
    input.meds,
    input.social,
    input.keyPositives,
    input.keyNegatives,
    input.observations,
  ]
    .filter(Boolean)
    .join(" ");
}

function getFamilyAdjustedScore(
  differential: DifferentialResult,
  primaryFamily: PresentationFamily,
  secondaryFamily?: PresentationFamily,
  hasRedFlagPromotion = false,
): number {
  const registryEntry = CONDITION_PROMOTION_REGISTRY_BY_NAME[differential.name];
  const redFlagPromotion = hasRedFlagPromotion ? RED_FLAG_PROMOTION_SCORE : 0;

  if (!registryEntry || registryEntry.promotionStatus !== "live-engine") {
    return differential.score + redFlagPromotion;
  }

  const inPrimaryFamily = registryEntry.presentationFamilies.includes(primaryFamily);
  const inSecondaryFamily = secondaryFamily
    ? registryEntry.presentationFamilies.includes(secondaryFamily)
    : false;

  if (inPrimaryFamily) {
    return differential.score + 2 + redFlagPromotion;
  }

  if (inSecondaryFamily) {
    return differential.score + 1 + redFlagPromotion;
  }

  if (hasRedFlagPromotion) {
    return differential.score + redFlagPromotion - 1;
  }

  if (primaryFamily === "acute-abdominal-pain") {
    if (GLOBALLY_DANGEROUS_DIAGNOSES.has(differential.name) && differential.score >= 8) {
      return differential.score - 3;
    }

    if (GLOBALLY_DANGEROUS_DIAGNOSES.has(differential.name) && differential.score >= 5) {
      return differential.score - 4;
    }

    return differential.score - 6;
  }

  if (GLOBALLY_DANGEROUS_DIAGNOSES.has(differential.name) && differential.score >= 7) {
    return differential.score - 2;
  }

  if (GLOBALLY_DANGEROUS_DIAGNOSES.has(differential.name) && differential.score >= 4) {
    return differential.score - 3;
  }

  return differential.score - 5;
}

function getFamilyTieBreakWeight(
  differential: DifferentialResult,
  primaryFamily: PresentationFamily,
  secondaryFamily?: PresentationFamily,
): number {
  const registryEntry = CONDITION_PROMOTION_REGISTRY_BY_NAME[differential.name];

  if (!registryEntry || registryEntry.promotionStatus !== "live-engine") {
    return 0;
  }

  if (registryEntry.presentationFamilies.includes(primaryFamily)) {
    return 2;
  }

  if (secondaryFamily && registryEntry.presentationFamilies.includes(secondaryFamily)) {
    return 1;
  }

  return 0;
}

function hasFamilyAnchor(
  primaryFamily: PresentationFamily,
  presentingComplaint: string,
  caseSearchText: string,
  features: ExtractedFeatures,
): boolean {
  const headlineText = (presentingComplaint || caseSearchText).toLowerCase();

  switch (primaryFamily) {
    case "chest-pain":
      return (
        features.matchedFeatures.includes("chest_pain") ||
        headlineText.includes("chest pain") ||
        (
          features.matchedFeatures.includes("indigestion_like_chest_pain") &&
          ["jaw_pain", "arm_pain", "sweating", "nausea", "sob"].some((feature) =>
            features.matchedFeatures.includes(feature),
          )
        )
      );
    case "headache":
      return (
        features.matchedFeatures.includes("headache") ||
        features.matchedFeatures.includes("thunderclap") ||
        headlineText.includes("headache")
      );
    case "breathlessness-pleuritic-chest-pain":
      return (
        features.matchedFeatures.includes("sob") ||
        features.matchedFeatures.includes("pleuritic_pain") ||
        features.matchedFeatures.includes("haemoptysis") ||
        features.matchedFeatures.includes("unilateral_reduced_air_entry") ||
        headlineText.includes("breathlessness") ||
        headlineText.includes("shortness of breath") ||
        headlineText.includes("pleuritic")
      );
    case "acute-abdominal-pain":
      return (
        features.matchedFeatures.includes("abdominal_pain") ||
        features.matchedFeatures.includes("pain_out_of_proportion") ||
        features.matchedFeatures.includes("guarding_rigidity") ||
        features.matchedFeatures.includes("flank_pain") ||
        features.matchedFeatures.includes("testicular_pain") ||
        features.matchedFeatures.includes("pelvic_pain") ||
        headlineText.includes("abdominal pain") ||
        headlineText.includes("epigastric pain")
      );
    case "ruq-pain-jaundice":
      return (
        features.matchedFeatures.includes("ruq_pain") ||
        features.matchedFeatures.includes("jaundice") ||
        features.matchedFeatures.includes("dark_urine") ||
        features.matchedFeatures.includes("pale_stools") ||
        (
          features.matchedFeatures.includes("post_prandial_pain") &&
          (
            features.matchedFeatures.includes("recurrent_biliary_pain") ||
            features.matchedFeatures.includes("well_between_episodes") ||
            features.matchedFeatures.includes("gallstone_context")
          )
        ) ||
        headlineText.includes("ruq pain") ||
        headlineText.includes("right upper quadrant") ||
        headlineText.includes("jaundice")
      );
    default:
      return false;
  }
}

function hasEligibleRedFlagPromotion(
  differential: DifferentialResult,
  redFlags: RedFlag[],
): boolean {
  if (differential.score < MIN_RED_FLAG_ELIGIBLE_SCORE) {
    return false;
  }

  return redFlags.some((flag) => flag.boostDiagnoses.includes(differential.name));
}

export function applyPresentationFamilyRanking(
  input: CaseInput,
  features: ExtractedFeatures,
  scoredDifferentials: DifferentialResult[],
  redFlags: RedFlag[] = [],
): DifferentialResult[] {
  const caseSearchText = buildCaseSearchText(input);
  const seededDiagnoses = scoredDifferentials.slice(0, 6).map((differential) => differential.name);
  const familyRoute = routePresentationFamilies(caseSearchText, features, seededDiagnoses);

  const canUseFamilyAnchor = !!familyRoute.primaryFamily && hasFamilyAnchor(
    familyRoute.primaryFamily,
    input.presentingComplaint,
    caseSearchText,
    features,
  );

  if (
    !familyRoute.primaryFamily ||
    !FAMILY_INTEGRATION_TARGETS.has(familyRoute.primaryFamily) ||
    familyRoute.confidence < MIN_CONFIDENT_FAMILY_ROUTE ||
    !canUseFamilyAnchor
  ) {
    if (!familyRoute.primaryFamily || !canUseFamilyAnchor) {
      return scoredDifferentials;
    }

    const primaryFamily = familyRoute.primaryFamily;
    const secondaryFamily = familyRoute.secondaryFamily;

    return [...scoredDifferentials]
      .map((differential) => ({
        ...differential,
        score: differential.score + (hasEligibleRedFlagPromotion(differential, redFlags) ? RED_FLAG_PROMOTION_SCORE : 0),
        reasonsFor: hasEligibleRedFlagPromotion(differential, redFlags)
          ? [
              ...differential.reasonsFor,
              ...redFlags
                .filter((flag) => flag.boostDiagnoses.includes(differential.name))
                .map((flag) => `red-flag promotion: ${flag.name}`),
            ]
          : differential.reasonsFor,
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return (
          getFamilyTieBreakWeight(right, primaryFamily, secondaryFamily) -
          getFamilyTieBreakWeight(left, primaryFamily, secondaryFamily)
        );
      });
  }

  const primaryFamily = familyRoute.primaryFamily!;
  const secondaryFamily = familyRoute.secondaryFamily;

  return scoredDifferentials
    .map((differential) => ({
      differential: hasEligibleRedFlagPromotion(differential, redFlags)
        ? {
            ...differential,
            reasonsFor: [
              ...differential.reasonsFor,
              ...redFlags
                .filter((flag) => flag.boostDiagnoses.includes(differential.name))
                .map((flag) => `red-flag promotion: ${flag.name}`),
            ],
          }
        : differential,
      adjustedScore: getFamilyAdjustedScore(
        differential,
        primaryFamily,
        secondaryFamily,
        hasEligibleRedFlagPromotion(differential, redFlags),
      ),
    }))
    .sort((left, right) => {
      if (right.adjustedScore !== left.adjustedScore) {
        return right.adjustedScore - left.adjustedScore;
      }

      return right.differential.score - left.differential.score;
    })
    .map(({ differential, adjustedScore }) => ({
      ...differential,
      score: adjustedScore,
    }));
}
