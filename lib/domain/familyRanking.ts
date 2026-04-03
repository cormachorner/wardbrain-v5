import { CONDITION_PROMOTION_REGISTRY_BY_NAME } from "./conditionPromotionRegistry";
import { routePresentationFamilies } from "./presentationFamilies";
import type { DifferentialResult, CaseInput, ExtractedFeatures } from "../types";
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
): number {
  const registryEntry = CONDITION_PROMOTION_REGISTRY_BY_NAME[differential.name];

  if (!registryEntry || registryEntry.promotionStatus !== "live-engine") {
    return differential.score;
  }

  const inPrimaryFamily = registryEntry.presentationFamilies.includes(primaryFamily);
  const inSecondaryFamily = secondaryFamily
    ? registryEntry.presentationFamilies.includes(secondaryFamily)
    : false;

  if (inPrimaryFamily) {
    return differential.score + 2;
  }

  if (inSecondaryFamily) {
    return differential.score + 1;
  }

  if (primaryFamily === "acute-abdominal-pain") {
    if (GLOBALLY_DANGEROUS_DIAGNOSES.has(differential.name) && differential.score >= 6) {
      return differential.score - 2;
    }

    return differential.score - 5;
  }

  if (GLOBALLY_DANGEROUS_DIAGNOSES.has(differential.name) && differential.score >= 4) {
    return differential.score - 1;
  }

  return differential.score - 3;
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
        features.matchedFeatures.includes("chestPain") ||
        headlineText.includes("chest pain") ||
        (
          features.matchedFeatures.includes("indigestionLikeChestPain") &&
          ["jawPain", "armPain", "sweating", "nausea", "sob"].some((feature) =>
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
        features.matchedFeatures.includes("pleuriticPain") ||
        features.matchedFeatures.includes("haemoptysis") ||
        features.matchedFeatures.includes("unilateralReducedAirEntry") ||
        headlineText.includes("breathlessness") ||
        headlineText.includes("shortness of breath") ||
        headlineText.includes("pleuritic")
      );
    case "acute-abdominal-pain":
      return (
        features.matchedFeatures.includes("abdominalPain") ||
        features.matchedFeatures.includes("painOutOfProportion") ||
        features.matchedFeatures.includes("guardingRigidity") ||
        features.matchedFeatures.includes("flankPain") ||
        features.matchedFeatures.includes("testicularPain") ||
        features.matchedFeatures.includes("pelvicPain") ||
        headlineText.includes("abdominal pain") ||
        headlineText.includes("epigastric pain")
      );
    case "ruq-pain-jaundice":
      return (
        features.matchedFeatures.includes("ruqPain") ||
        features.matchedFeatures.includes("jaundice") ||
        features.matchedFeatures.includes("darkUrine") ||
        features.matchedFeatures.includes("paleStools") ||
        (
          features.matchedFeatures.includes("postPrandialPain") &&
          (
            features.matchedFeatures.includes("recurrentBiliaryPain") ||
            features.matchedFeatures.includes("wellBetweenEpisodes") ||
            features.matchedFeatures.includes("gallstoneContext")
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

export function applyPresentationFamilyRanking(
  input: CaseInput,
  features: ExtractedFeatures,
  scoredDifferentials: DifferentialResult[],
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

    return [...scoredDifferentials].sort((left, right) => {
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
      differential,
      adjustedScore: getFamilyAdjustedScore(
        differential,
        primaryFamily,
        secondaryFamily,
      ),
    }))
    .sort((left, right) => {
      if (right.adjustedScore !== left.adjustedScore) {
        return right.adjustedScore - left.adjustedScore;
      }

      return right.differential.score - left.differential.score;
    })
    .map(({ differential }) => differential);
}
