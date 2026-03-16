import type { DiagnosisBoost, ExtractedFeatures } from "./types";

type DiagnosisBoostRule = {
  diagnosis: string;
  threshold: number;
  points: number;
  reason: string;
  features: string[];
  requiredAnyFeatures?: string[];
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
    points: 6,
    reason: "sudden severe headache pattern",
    features: ["thunderclap", "headache", "vomiting", "neckStiffness", "collapse"],
    requiredAnyFeatures: ["thunderclap"],
  },
  {
    diagnosis: "Stroke / neurological emergency",
    threshold: 2,
    points: 4,
    reason: "neurological emergency pattern",
    features: ["confusion", "focalNeurology", "collapse"],
  },
  {
    diagnosis: "Mesenteric ischaemia",
    threshold: 3,
    points: 5,
    reason: "mesenteric ischaemia pattern",
    features: ["abdominalPain", "painOutOfProportion", "af", "collapse"],
  },
  {
    diagnosis: "Acute coronary syndrome",
    threshold: 3,
    points: 4,
    reason: "ACS pattern",
    features: [
      "chestPain",
      "jawPain",
      "armPain",
      "sweating",
      "nausea",
      "indigestionLikeChestPain",
      "hypertension",
      "smoker",
      "sob",
      "collapse",
    ],
    requiredAnyFeatures: ["chestPain", "jawPain", "armPain", "indigestionLikeChestPain"],
  },
  {
    diagnosis: "Pulmonary embolism",
    threshold: 5,
    points: 5,
    reason: "PE pattern",
    features: [
      "chestPain",
      "sob",
      "suddenOnset",
      "tachycardia",
      "tachypnoea",
      "pleuriticPain",
      "hypoxia",
      "collapse",
      "recentSurgery",
      "immobility",
      "longHaulTravel",
    ],
  },
  {
    diagnosis: "Pneumothorax",
    threshold: 3,
    points: 7,
    reason: "pneumothorax pattern",
    features: [
      "sob",
      "pleuriticPain",
      "unilateralReducedAirEntry",
      "trauma",
      "suddenOnset",
      "tallThinHabitus",
      "recentChestDrain",
      "previousPneumothorax",
    ],
    requiredAnyFeatures: ["unilateralReducedAirEntry", "pleuriticPain", "trauma"],
  },
  {
    diagnosis: "Meningitis / encephalitis",
    threshold: 3,
    points: 5,
    reason: "meningitis / encephalitis pattern",
    features: [
      "confusion",
      "fever",
      "headache",
      "neckStiffness",
      "vomiting",
      "photophobia",
      "sharedAccommodation",
      "recentInfection",
    ],
    requiredAnyFeatures: ["fever", "headache", "neckStiffness", "photophobia"],
  },
  {
    diagnosis: "GI bleed",
    threshold: 2,
    points: 5,
    reason: "GI bleed instability pattern",
    features: ["giBleed", "prBleeding", "melaena", "haematemesis"],
  },
  {
    diagnosis: "Sepsis",
    threshold: 4,
    points: 5,
    reason: "sepsis pattern",
    features: ["fever", "hypothermia", "rigors", "infectionSource", "hypotension", "tachycardia", "tachypnoea", "confusion", "sob", "collapse"],
    requiredAnyFeatures: ["fever", "hypothermia", "rigors", "infectionSource"],
  },
];

function has(features: ExtractedFeatures, key: string) {
  return features.matchedFeatures.includes(key);
}

export function getDiagnosisBoosts(features: ExtractedFeatures): DiagnosisBoost[] {
  return DIAGNOSIS_BOOST_RULES.flatMap((boostRule) => {
    if (
      boostRule.requiredAnyFeatures &&
      !boostRule.requiredAnyFeatures.some((feature) => has(features, feature))
    ) {
      return [];
    }

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
