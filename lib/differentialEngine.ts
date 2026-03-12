import { extractFeatures } from "./featureExtractor";
import { getDiagnosisBoosts } from "./diagnosisBoosts";
import { DIAGNOSIS_RULES, findDiagnosisRule } from "./diagnosisRules";
import { formatFeatureLabel } from "./featureLabels";
import { detectRedFlags } from "./redFlagRules";
import type {
  AnalysisResult,
  CaseInput,
  DifferentialResult,
  DiagnosisBoost,
  ExtractedFeatures,
} from "./types";

function has(features: ExtractedFeatures, key: string) {
  return features.matchedFeatures.includes(key);
}

function scoreDiagnosis(
  rule: (typeof DIAGNOSIS_RULES)[number],
  features: ExtractedFeatures,
  boosts: DiagnosisBoost[],
): DifferentialResult {
  let score = 0;
  const reasonsFor: string[] = [];
  const reasonsAgainst: string[] = [];

  for (const feature of rule.supportive) {
    if (has(features, feature)) {
      score += 2;
      reasonsFor.push(formatFeatureLabel(feature));
    }
  }

  for (const feature of rule.conflicting) {
    if (has(features, feature)) {
      score -= 2;
      reasonsAgainst.push(formatFeatureLabel(feature));
    }
  }

  for (const boost of boosts) {
    if (boost.diagnosis === rule.name) {
      score += boost.points;
      reasonsFor.push(boost.reason);
    }
  }

  return {
    name: rule.name,
    score,
    reasonsFor,
    reasonsAgainst,
  };
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
  if (!suspectedDiagnosis.trim()) {
    return {
      label: "No diagnosis entered",
      summary: "Enter a suspected diagnosis to test whether it fits the case pattern.",
      supporting: [],
      conflicting: [],
    };
  }

  const rule = findDiagnosisRule(suspectedDiagnosis);
  const rankedMatch = differentials.find(
    (d) => d.name.toLowerCase() === suspectedDiagnosis.trim().toLowerCase(),
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

  const supporting = rule.supportive.filter((f) => has(features, f)).map(formatFeatureLabel);
  const conflicting = rule.conflicting.filter((f) => has(features, f)).map(formatFeatureLabel);

  const top = differentials[0];

  if (!rankedMatch || rankedMatch.score < 3) {
    const unexplained = conflicting.slice(0, 5);
    return {
      label: "Weak fit",
      summary:
        unexplained.length > 0
          ? `${rule.name} is a poor fit because it does not explain ${unexplained.join(
              ", ",
            )}.${top?.name ? ` ${top.name} currently provides a better overall explanation.` : ""}`
          : `${rule.name} is currently a weak fit and is being outperformed by a more plausible explanation.`,
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
  if (!suspectedDiagnosis.trim()) {
    return "No anchor tested yet. Enter a suspected diagnosis to stress-test your reasoning.";
  }

  const top = differentials[0];
  const suspected = differentials.find(
    (d) => d.name.toLowerCase() === suspectedDiagnosis.trim().toLowerCase(),
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
    "pulsatileAbdomen",
    "sob",
    "hypoxia",
    "focalNeurology",
    "thunderclap",
    "vomiting",
    "confusion",
  ];

  const riskOrder = ["hypertension", "smoker", "af", "hypotension"];

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

  const scored = DIAGNOSIS_RULES.map((rule) => scoreDiagnosis(rule, features, boosts)).sort(
    (a, b) => b.score - a.score,
  );

  const differentials = scored
    .filter(
      (dx, index) => index < 2 || dx.score >= 3 || dx.reasonsFor.some((r) => r.includes("pattern")),
    )
    .slice(0, 5);

  const fitCheck = buildFitCheck(input.suspectedDiagnosis, differentials, features);
  const anchorWarning = buildAnchorWarning(
    input.suspectedDiagnosis,
    differentials,
    redFlags.length,
    fitCheck.label,
  );
  const problemRepresentation = buildProblemRepresentation(input, features);
  const presentation = buildPresentation(input, differentials, features);

  return {
    problemRepresentation,
    redFlags,
    differentials,
    fitCheck,
    anchorWarning,
    presentation,
    detectedFeatures: features.matchedFeatures.map(formatFeatureLabel),
  };
}
