import type { DiagnosisBoost, ExtractedFeatures } from "./types";

type DiagnosisBoostRule = {
  diagnosis: string;
  threshold: number;
  points: number;
  reason: string;
  features: string[];
};

const DIAGNOSIS_BOOST_RULES: DiagnosisBoostRule[] = [
  {
    diagnosis: "Acute aortic syndrome",
    threshold: 3,
    points: 5,
    reason: "vascular catastrophe pattern",
    features: [
      "chestPain",
      "suddenOnset",
      "tearingPain",
      "backRadiation",
      "collapse",
      "hypertension",
    ],
  },
  {
    diagnosis: "Abdominal aortic aneurysm",
    threshold: 3,
    points: 5,
    reason: "AAA pattern",
    features: [
      "abdominalPain",
      "backRadiation",
      "collapse",
      "pulsatileAbdomen",
      "smoker",
      "hypotension",
      "hypertension",
    ],
  },
  {
    diagnosis: "Subarachnoid haemorrhage",
    threshold: 2,
    points: 5,
    reason: "sudden severe headache pattern",
    features: ["thunderclap", "headache", "vomiting", "neckStiffness", "collapse"],
  },
  {
    diagnosis: "Stroke / neurological emergency",
    threshold: 2,
    points: 4,
    reason: "neurological emergency pattern",
    features: ["confusion", "focalNeurology", "collapse"],
  },
];

function has(features: ExtractedFeatures, key: string) {
  return features.matchedFeatures.includes(key);
}

export function getDiagnosisBoosts(features: ExtractedFeatures): DiagnosisBoost[] {
  return DIAGNOSIS_BOOST_RULES.flatMap((boostRule) => {
    const matchCount = boostRule.features.filter((feature) => has(features, feature)).length;

    if (matchCount < boostRule.threshold) {
      return [];
    }

    return [
      {
        diagnosis: boostRule.diagnosis,
        reason: boostRule.reason,
        points: boostRule.points,
      },
    ];
  });
}
