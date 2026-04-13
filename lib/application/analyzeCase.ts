import { corePilotBlocks } from "../../content/wardbrain_core_pilot_app_ready";
import { CONDITION_PROMOTION_REGISTRY_BY_NAME } from "../domain/conditionPromotionRegistry";
import { normaliseDiagnosisName } from "../domain/diagnosisAliases";
import { getDiagnosisBoosts } from "../domain/diagnosisBoosts";
import {
  getMatchedDefinitionConflictingFeatures,
  getMatchedDefinitionSupportiveFeatures,
  scoreDiagnosisDefinition,
  scoreDiagnosisDefinitions,
} from "../domain/diagnosisDefinitionEvaluator";
import {
  getMatchedConflictingFeatures,
  getMatchedSupportiveFeatures,
  scoreDiagnosis,
} from "../domain/diagnosisScoring";
import { DIAGNOSIS_RULES, findDiagnosisRule } from "../domain/diagnosisRules";
import { extractFeatures } from "../domain/featureExtractor";
import { formatFeatureLabel } from "../domain/featureLabels";
import { applyPresentationFamilyRanking } from "../domain/familyRanking";
import { findNextStepsRule } from "../domain/nextStepsRules";
import {
  findDiagnosisDefinition,
  getDiagnosisDefinitionsForPresentationBlock,
} from "../domain/presentationBlocks";
import { routePresentationFamilies } from "../domain/presentationFamilies";
import { detectRedFlags } from "../domain/redFlagRules";
import { matchPresentationBlockForCase } from "../domain/wardbrainLookup";
import type {
  AnalysisResult,
  AnalyzeCaseResponse,
  CaseInput,
  DifferentialResult,
  ExtractedFeatures,
} from "../types";

const DIFFERENTIAL_DISPLAY_THRESHOLD = 6;
const PLAUSIBLE_DIFFERENTIAL_THRESHOLD = 3;
const MIN_DISPLAYED_DIFFERENTIALS = 3;
const FIT_CHECK_PRESENTATION_ORDER = [
  "collapse",
  "hypotension",
  "hypoxia",
  "tachycardia",
  "tachypnoea",
  "focal_neurology",
  "thunderclap",
  "neck_stiffness",
  "tearing_pain",
  "back_radiation",
  "pain_out_of_proportion",
  "gi_bleed",
  "pr_bleeding",
  "melaena",
  "haematemesis",
  "pleuritic_pain",
  "chest_pain",
  "abdominal_pain",
  "diarrhoea",
  "vomiting",
  "headache",
  "confusion",
  "fever",
  "sob",
  "constipation",
  "sudden_onset",
  "pulsatile_abdomen",
  "smoker",
  "hypertension",
  "af",
] as const;

const FIT_CHECK_PRESENTATION_PRIORITY = new Map<string, number>(
  FIT_CHECK_PRESENTATION_ORDER.map((feature, index) => [feature, index]),
);

function getLeadDiagnosis(input: CaseInput): string {
  return input.leadDiagnosis?.trim() || input.suspectedDiagnosis?.trim() || "";
}

function canonicaliseDiagnosisEntry(value: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const matchedRule = findDiagnosisRule(trimmedValue);

  if (matchedRule) {
    return matchedRule.name;
  }

  const matchedDefinition = findDiagnosisDefinition(trimmedValue);

  if (matchedDefinition) {
    return matchedDefinition.name;
  }

  return normaliseDiagnosisName(trimmedValue);
}

function parseDiagnosisList(value?: string): string[] {
  if (!value?.trim()) {
    return [];
  }

  const parts = value
    .split(/[\n,]/)
    .map((item) => canonicaliseDiagnosisEntry(item))
    .filter(Boolean);

  return [...new Set(parts)];
}

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
  leadDiagnosis: string,
  differentials: DifferentialResult[],
  features: ExtractedFeatures,
  input: CaseInput,
): AnalysisResult["fitCheck"] {
  const canonicalSuspectedDiagnosis = canonicaliseDiagnosisEntry(leadDiagnosis);

  if (!leadDiagnosis.trim()) {
    return {
      label: "No diagnosis entered",
      summary: "Enter a lead diagnosis to test whether it fits the case pattern.",
      supporting: [],
      conflicting: [],
    };
  }

  const rule = findDiagnosisRule(canonicalSuspectedDiagnosis);
  const rankedMatch = differentials.find(
    (d) => d.name.toLowerCase() === canonicalSuspectedDiagnosis.toLowerCase(),
  );

  if (!rule) {
    const definition = findDiagnosisDefinition(canonicalSuspectedDiagnosis);

    if (definition) {
      const scoredDefinition = scoreDiagnosisDefinition(definition, features, input);
      const supporting = getMatchedDefinitionSupportiveFeatures(definition, features, input);
      const conflicting = getMatchedDefinitionConflictingFeatures(definition, features, input);

      if (scoredDefinition.score >= 10) {
        return {
          label: "Strong fit",
          summary: `${scoredDefinition.name} is well supported by the current feature pattern.`,
          supporting,
          conflicting,
        };
      }

      if (scoredDefinition.score >= 5) {
        return {
          label: "Partial fit",
          summary:
            conflicting.length > 0
              ? `${scoredDefinition.name} explains part of the case, but does not adequately explain ${conflicting
                  .slice(0, 4)
                  .join(", ")}.`
              : `${scoredDefinition.name} explains part of the case, but competing diagnoses may fit as well or better.`,
          supporting,
          conflicting,
        };
      }

      return {
        label: "Weak fit",
        summary:
          conflicting.length > 0
            ? `${scoredDefinition.name} is a poor fit because it does not explain ${conflicting
                .slice(0, 4)
                .join(", ")}.`
            : `${scoredDefinition.name} is currently a weak fit and is being outperformed by a more plausible explanation.`,
        supporting,
        conflicting,
      };
    }

    return {
      label: "Weak fit",
      summary:
        "Your lead diagnosis is not recognised by the current rule set, so it cannot yet be stress-tested properly.",
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
  leadDiagnosis: string,
  differentials: DifferentialResult[],
  redFlagCount: number,
  fitLabel: AnalysisResult["fitCheck"]["label"],
) {
  const canonicalSuspectedDiagnosis = canonicaliseDiagnosisEntry(leadDiagnosis);

  if (!leadDiagnosis.trim()) {
    return "No anchor tested yet. Enter a lead diagnosis to stress-test your reasoning.";
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

function buildReasoningComparison(
  input: CaseInput,
  differentials: DifferentialResult[],
  redFlags: AnalysisResult["redFlags"],
  fitCheck: AnalysisResult["fitCheck"],
): AnalysisResult["reasoningComparison"] {
  const leadDiagnosis = getLeadDiagnosis(input);
  const otherDifferentials = parseDiagnosisList(input.otherDifferentials);
  const dangerList = parseDiagnosisList(input.dangerousDiagnoses);
  const topDifferential = differentials[0]?.name;
  const plausibleDifferentials = differentials
    .filter((differential) => differential.score >= PLAUSIBLE_DIFFERENTIAL_THRESHOLD)
    .slice(0, 3)
    .map((differential) => differential.name);
  const keyDangerDiagnoses = [
    ...new Set(
      [
        ...differentials.slice(0, 2).map((differential) => differential.name),
        ...redFlags
          .flatMap((flag) => flag.boostDiagnoses)
          .filter((diagnosis) => plausibleDifferentials.includes(diagnosis)),
      ].filter(Boolean),
    ),
  ].slice(0, 3);

  const missingDifferentials = plausibleDifferentials.filter(
    (diagnosis) => diagnosis !== topDifferential && !otherDifferentials.includes(diagnosis),
  );
  const missingDangerDiagnoses = keyDangerDiagnoses.filter(
    (diagnosis) => !dangerList.includes(diagnosis),
  );

  let leadAssessment = leadDiagnosis
    ? `Your lead diagnosis is ${fitCheck.label.toLowerCase()}: ${fitCheck.summary}`
    : "You have not entered a lead diagnosis yet, so WardBrain cannot compare your main anchor.";

  if (leadAssessment.endsWith("..")) {
    leadAssessment = leadAssessment.slice(0, -1);
  }

  let differentialAssessment = "You have not entered any other differentials yet.";

  if (otherDifferentials.length > 0) {
    differentialAssessment =
      missingDifferentials.length > 0
        ? `Your differential list is a bit narrow. Consider widening it to include ${missingDifferentials
            .slice(0, 2)
            .join(", ")}.`
        : "Your differential list is reasonably broad against the current engine output.";
  } else if (plausibleDifferentials.length > 1) {
    differentialAssessment = `Your differential list looks narrow for this pattern. Consider adding ${plausibleDifferentials
      .slice(1, 3)
      .join(", ")}.`;
  }

  let dangerAssessment = "You have not entered any dangerous diagnoses to exclude yet.";

  if (dangerList.length > 0) {
    dangerAssessment =
      missingDangerDiagnoses.length > 0
        ? `Your danger list misses ${missingDangerDiagnoses.slice(0, 2).join(", ")}.`
        : "Your danger list captures the key dangerous diagnoses raised by this case.";
  } else if (keyDangerDiagnoses.length > 0) {
    dangerAssessment = `Think about explicitly excluding ${keyDangerDiagnoses.slice(0, 2).join(", ")}.`;
  }

  return {
    leadAssessment,
    differentialAssessment,
    dangerAssessment,
  };
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
    "sudden_onset",
    "tearing_pain",
    "back_radiation",
    "collapse",
    "tachycardia",
    "tachypnoea",
    "pulsatile_abdomen",
    "abdominal_pain",
    "pain_out_of_proportion",
    "diarrhoea",
    "sob",
    "hypoxia",
    "focal_neurology",
    "thunderclap",
    "neck_stiffness",
    "vomiting",
    "confusion",
    "melaena",
    "haematemesis",
    "pr_bleeding",
    "gi_bleed",
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
  

export function analyzeCase(input: CaseInput): AnalyzeCaseResponse {
  const validatedInput = validateCaseInput(input);
  const features = extractFeatures(validatedInput);
  const redFlags = detectRedFlags(features);
  const parsedAge = Number.parseInt(validatedInput.age, 10);
  const age = Number.isNaN(parsedAge) ? undefined : parsedAge;
  const initialFamilyRoute = routePresentationFamilies(
    [
      validatedInput.presentingComplaint,
      validatedInput.history,
      validatedInput.pmh,
      validatedInput.meds,
      validatedInput.social,
      validatedInput.keyPositives,
      validatedInput.keyNegatives,
      validatedInput.observations,
    ]
      .filter(Boolean)
      .join(" "),
    features,
  );
  const usesAcuteAbdominalDefinitionScoring = initialFamilyRoute.primaryFamily === "acute-abdominal-pain";

  const rawScored = usesAcuteAbdominalDefinitionScoring
    ? scoreDiagnosisDefinitions(
        getDiagnosisDefinitionsForPresentationBlock("acute_abdominal_pain"),
        features,
        validatedInput,
        redFlags,
      )
    : (() => {
        const boosts = getDiagnosisBoosts(features);
        const eligibleRules = DIAGNOSIS_RULES.filter((rule) => {
          const registryEntry = CONDITION_PROMOTION_REGISTRY_BY_NAME[rule.name];

          return !registryEntry || registryEntry.promotionStatus === "live-engine";
        });

        return eligibleRules
          .map((rule) => scoreDiagnosis(rule, features, boosts, age))
          .sort((a, b) => b.score - a.score);
      })();
  const scored = usesAcuteAbdominalDefinitionScoring
    ? rawScored
    : applyPresentationFamilyRanking(validatedInput, features, rawScored, redFlags);

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

  const leadDiagnosis = getLeadDiagnosis(validatedInput);
  const fitCheck = buildFitCheck(leadDiagnosis, scored, features, validatedInput);
  const anchorWarning = buildAnchorWarning(
    leadDiagnosis,
    scored,
    redFlags.length,
    fitCheck.label,
  );
  const reasoningComparison = buildReasoningComparison(validatedInput, scored, redFlags, fitCheck);
  const problemRepresentation = buildProblemRepresentation(validatedInput, features);
  const presentation = buildPresentation(validatedInput, displayedDifferentials, features);
  const nextSteps = displayedDifferentials[0]
    ? findNextStepsRule(displayedDifferentials[0].name)
    : undefined;
  const matchedPresentationBlock = matchPresentationBlockForCase(
    validatedInput,
    corePilotBlocks,
    displayedDifferentials.map((differential) => differential.name),
  );

  return {
    problemRepresentation,
    redFlags,
    differentials: displayedDifferentials,
    nextSteps,
    fitCheck,
    reasoningComparison,
    anchorWarning,
    presentation,
    detectedFeatures: features.matchedFeatures.map(formatFeatureLabel),
    matchedPresentationBlock: matchedPresentationBlock ?? null,
  };
}

function validateCaseInput(input: CaseInput): CaseInput {
  return {
    age: (input.age ?? "").trim(),
    sex: input.sex === "male" || input.sex === "female" ? input.sex : "",
    presentingComplaint: (input.presentingComplaint ?? "").trim(),
    history: (input.history ?? "").trim(),
    pmh: (input.pmh ?? "").trim(),
    meds: (input.meds ?? "").trim(),
    social: (input.social ?? "").trim(),
    keyPositives: (input.keyPositives ?? "").trim(),
    keyNegatives: (input.keyNegatives ?? "").trim(),
    observations: (input.observations ?? "").trim(),
    leadDiagnosis: (input.leadDiagnosis ?? "").trim(),
    otherDifferentials: (input.otherDifferentials ?? "").trim(),
    dangerousDiagnoses: (input.dangerousDiagnoses ?? "").trim(),
    suspectedDiagnosis: (input.suspectedDiagnosis ?? "").trim(),
  };
}
