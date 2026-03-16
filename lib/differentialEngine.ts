import { extractFeatures } from "./featureExtractor";
import { getDiagnosisBoosts } from "./diagnosisBoosts";
import {
  getMatchedConflictingFeatures,
  getMatchedSupportiveFeatures,
  scoreDiagnosis,
} from "./diagnosisScoring";
import { DIAGNOSIS_RULES, findDiagnosisRule } from "./diagnosisRules";
import { normaliseDiagnosisName } from "./diagnosisAliases";
import { formatFeatureLabel } from "./featureLabels";
import { findNextStepsRule } from "./nextStepsRules";
import { detectRedFlags } from "./redFlagRules";
import type {
  AnalysisResult,
  CaseInput,
  DifferentialResult,
  ExtractedFeatures,
} from "./types";

const DIFFERENTIAL_DISPLAY_THRESHOLD = 6;
const PLAUSIBLE_DIFFERENTIAL_THRESHOLD = 3;
const MIN_DISPLAYED_DIFFERENTIALS = 3;
const FIT_CHECK_PRESENTATION_ORDER = [
  "collapse",
  "hypotension",
  "hypoxia",
  "tachycardia",
  "tachypnoea",
  "focalNeurology",
  "thunderclap",
  "neckStiffness",
  "tearingPain",
  "backRadiation",
  "painOutOfProportion",
  "giBleed",
  "prBleeding",
  "melaena",
  "haematemesis",
  "pleuriticPain",
  "chestPain",
  "abdominalPain",
  "diarrhoea",
  "vomiting",
  "headache",
  "confusion",
  "fever",
  "sob",
  "constipation",
  "suddenOnset",
  "pulsatileAbdomen",
  "smoker",
  "hypertension",
  "af",
] as const;

const FIT_CHECK_PRESENTATION_PRIORITY = new Map<string, number>(
  FIT_CHECK_PRESENTATION_ORDER.map((feature, index) => [feature, index]),
);

function sortFeaturesForCritique(features: string[]): string[] {
  return [...features].sort((left, right) => {
    const leftPriority = FIT_CHECK_PRESENTATION_PRIORITY.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = FIT_CHECK_PRESENTATION_PRIORITY.get(right) ?? Number.MAX_SAFE_INTEGER;

    return leftPriority - rightPriority;
  });
}

function buildWeakFitContrast(
  rule: NonNullable<ReturnType<typeof findDiagnosisRule>>,
  features: ExtractedFeatures,
  conflictingFeatures: string[],
) {
  const missingExpected = sortFeaturesForCritique(
    (rule.expectedImportant ?? []).filter((feature) => !features.matchedFeatures.includes(feature)),
  )
    .slice(0, 3)
    .map(formatFeatureLabel);

  const contradictoryPresentation = sortFeaturesForCritique(conflictingFeatures)
    .slice(0, 3)
    .map(formatFeatureLabel);

  if (missingExpected.length > 0 && contradictoryPresentation.length > 0) {
    return `${rule.name} would fit better with ${missingExpected.join(", ")} and without ${contradictoryPresentation.join(", ")}.`;
  }

  if (missingExpected.length > 0) {
    return `${rule.name} would fit better with ${missingExpected.join(", ")}.`;
  }

  if (contradictoryPresentation.length > 0) {
    return `${rule.name} would fit better without ${contradictoryPresentation.join(", ")}.`;
  }

  const alternativeSupport = sortFeaturesForCritique(
    rule.supportive.filter((feature) => !features.matchedFeatures.includes(feature)),
  )
    .slice(0, 3)
    .map(formatFeatureLabel);

  return alternativeSupport.length > 0
    ? `${rule.name} would fit better with ${alternativeSupport.join(", ")}.`
    : "";
}

function buildProblemRepresentation(input: CaseInput, features: ExtractedFeatures) {
  const demographic = [input.age ? `${input.age}yo` : "", input.sex].filter(Boolean).join(" ");
  const headline = input.presentingComplaint || "undifferentiated presentation";
  const featureSummary = features.matchedFeatures
    .slice(0, 5)
    .map(formatFeatureLabel)
    .join(", ");

  return [demographic, headline, featureSummary ? `with ${featureSummary}` : ""]
    .filter(Boolean)
    .join(" ");
}

function buildFitCheck(
  suspectedDiagnosis: string,
  differentials: DifferentialResult[],
  features: ExtractedFeatures,
): AnalysisResult["fitCheck"] {
  const canonicalSuspectedDiagnosis = normaliseDiagnosisName(suspectedDiagnosis);

  if (!suspectedDiagnosis.trim()) {
    return {
      label: "No diagnosis entered",
      summary: "Enter a suspected diagnosis to test whether it fits the case pattern.",
      supporting: [],
      conflicting: [],
    };
  }

  const rule = findDiagnosisRule(canonicalSuspectedDiagnosis);
  const rankedMatch = differentials.find(
    (d) => d.name.toLowerCase() === canonicalSuspectedDiagnosis.toLowerCase(),
  );

  if (!rule) {
    return {
      label: "Weak fit",
      summary:
        "Your suspected diagnosis is not recognised by the current rule set, so it cannot yet be stress-tested properly.",
      supporting: [],
      conflicting: ["not yet represented in the current diagnosis rules"],
    };
  }

  const supporting = getMatchedSupportiveFeatures(rule, features);
  const conflicting = getMatchedConflictingFeatures(rule, features);
  const prioritisedConflictingFeatures = sortFeaturesForCritique(
    rule.conflicting.filter((feature) => features.matchedFeatures.includes(feature)),
  );

  const top = differentials[0];

  if (!rankedMatch || rankedMatch.score < 3) {
    const unexplained = prioritisedConflictingFeatures.slice(0, 5).map(formatFeatureLabel);
    const contrastSentence = buildWeakFitContrast(rule, features, prioritisedConflictingFeatures);

    return {
      label: "Weak fit",
      summary:
        unexplained.length > 0
          ? `${rule.name} is a poor fit because it does not explain ${unexplained.join(
              ", ",
            )}.${contrastSentence ? ` ${contrastSentence}` : ""}${
              top?.name ? ` ${top.name} currently provides a better overall explanation.` : ""
            }`
          : `${rule.name} is currently a weak fit and is being outperformed by a more plausible explanation.${
              contrastSentence ? ` ${contrastSentence}` : ""
            }`,
      supporting,
      conflicting,
    };
  }

  if (rankedMatch.score >= 7) {
    return {
      label: "Strong fit",
      summary: `${rule.name} is well supported by the current feature pattern.`,
      supporting,
      conflicting,
    };
  }

  return {
    label: "Partial fit",
    summary:
      conflicting.length > 0
        ? `${rule.name} explains part of the case, but does not adequately explain ${conflicting
            .slice(0, 4)
            .join(", ")}.`
        : `${rule.name} explains part of the case, but competing diagnoses may fit as well or better.`,
    supporting,
    conflicting,
  };
}

function buildAnchorWarning(
  suspectedDiagnosis: string,
  differentials: DifferentialResult[],
  redFlagCount: number,
  fitLabel: AnalysisResult["fitCheck"]["label"],
) {
  const canonicalSuspectedDiagnosis = normaliseDiagnosisName(suspectedDiagnosis);

  if (!suspectedDiagnosis.trim()) {
    return "No anchor tested yet. Enter a suspected diagnosis to stress-test your reasoning.";
  }

  const top = differentials[0];
  const suspected = differentials.find(
    (d) => d.name.toLowerCase() === canonicalSuspectedDiagnosis.toLowerCase(),
  );

  if (!suspected) {
    return `You may be anchoring too early. ${top.name} currently fits the pattern better than your entered diagnosis.`;
  }

  if (fitLabel === "Weak fit" && redFlagCount > 0) {
    return `Your current diagnosis is weakly supported and the case contains red-flag features. ${top.name} should currently be prioritised above a benign explanation.`;
  }

  if (fitLabel === "Weak fit") {
    return `Your current diagnosis looks too narrow. ${top.name} currently explains the pattern better.`;
  }

  if (top.name !== suspected.name) {
    return `Keep challenging your anchor. ${top.name} currently edges ahead of your chosen diagnosis.`;
  }

  return "Your current diagnosis is not obviously undercut by the engine, but keep testing dangerous alternatives before settling.";
}

function buildPresentation(
  input: CaseInput,
  topDifferentials: DifferentialResult[],
  features: ExtractedFeatures,
) {
  const demographic = [input.age ? `${input.age}-year-old` : "", input.sex]
    .filter(Boolean)
    .join(" ");

  const top = topDifferentials[0]?.name ?? "undifferentiated pathology";
  const second = topDifferentials[1]?.name;

  const featureOrder = [
    "suddenOnset",
    "tearingPain",
    "backRadiation",
    "collapse",
    "tachycardia",
    "tachypnoea",
    "pulsatileAbdomen",
    "abdominalPain",
    "painOutOfProportion",
    "diarrhoea",
    "sob",
    "hypoxia",
    "focalNeurology",
    "thunderclap",
    "neckStiffness",
    "vomiting",
    "confusion",
    "melaena",
    "haematemesis",
    "prBleeding",
    "giBleed",
  ];

  const riskOrder = ["hypertension", "smoker", "af", "hypotension", "fever"];

  const summaryFeatures = featureOrder
    .filter((feature) => features.matchedFeatures.includes(feature))
    .slice(0, 4)
    .map(formatFeatureLabel);

  const riskFeatures = riskOrder
    .filter((feature) => features.matchedFeatures.includes(feature))
    .slice(0, 3)
    .map(formatFeatureLabel);

  const presentationParts: string[] = [];

  presentationParts.push(
    `This is a ${demographic || "patient"} presenting with ${
      input.presentingComplaint
        ? input.presentingComplaint.toLowerCase()
        : "an undifferentiated presentation"
    }.`,
  );

  if (summaryFeatures.length > 0) {
    presentationParts.push(`Key concerning features include ${summaryFeatures.join(", ")}.`);
  }

  if (riskFeatures.length > 0) {
    presentationParts.push(`Relevant background factors include ${riskFeatures.join(", ")}.`);
  }

  presentationParts.push(
    `My leading differential is ${top}${
      second ? `, with ${second} also important to exclude.` : "."
    }`,
  );

  presentationParts.push(
    "I would not settle on a benign explanation until dangerous alternatives have been addressed.",
  );

  return presentationParts.join(" ");
}
  

export function analyzeCase(input: CaseInput): AnalysisResult & { detectedFeatures: string[] } {
  const features = extractFeatures(input);
  const redFlags = detectRedFlags(features);
  const boosts = getDiagnosisBoosts(features);
  const parsedAge = Number.parseInt(input.age, 10);
  const age = Number.isNaN(parsedAge) ? undefined : parsedAge;

  const scored = DIAGNOSIS_RULES.map((rule) => scoreDiagnosis(rule, features, boosts, age)).sort(
    (a, b) => b.score - a.score,
  );

  const filteredDifferentials = scored.filter(
    (dx, index) =>
      index < 2 ||
      dx.score >= DIFFERENTIAL_DISPLAY_THRESHOLD ||
      dx.reasonsFor.some((reason) => reason.includes("pattern")),
  );

  const plausibleDifferentials = scored.filter((dx) => dx.score >= PLAUSIBLE_DIFFERENTIAL_THRESHOLD);
  const minimumDisplayCount = plausibleDifferentials.length >= MIN_DISPLAYED_DIFFERENTIALS
    ? MIN_DISPLAYED_DIFFERENTIALS
    : 2;

  const differentials = [...filteredDifferentials];

  if (differentials.length < minimumDisplayCount) {
    for (const differential of plausibleDifferentials) {
      if (differentials.some((existingDifferential) => existingDifferential.name === differential.name)) {
        continue;
      }

      differentials.push(differential);

      if (differentials.length >= minimumDisplayCount) {
        break;
      }
    }
  }

  differentials.sort((a, b) => b.score - a.score);

  const displayedDifferentials = differentials.slice(0, 5);

  const fitCheck = buildFitCheck(input.suspectedDiagnosis, scored, features);
  const anchorWarning = buildAnchorWarning(
    input.suspectedDiagnosis,
    scored,
    redFlags.length,
    fitCheck.label,
  );
  const problemRepresentation = buildProblemRepresentation(input, features);
  const presentation = buildPresentation(input, displayedDifferentials, features);
  const nextSteps = displayedDifferentials[0]
    ? findNextStepsRule(displayedDifferentials[0].name)
    : undefined;

  return {
    problemRepresentation,
    redFlags,
    differentials: displayedDifferentials,
    nextSteps,
    fitCheck,
    anchorWarning,
    presentation,
    detectedFeatures: features.matchedFeatures.map(formatFeatureLabel),
  };
}
