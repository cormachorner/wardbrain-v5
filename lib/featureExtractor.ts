import type { CaseInput, ExtractedFeatures } from "./types";

const FEATURE_PATTERNS: Record<string, string[]> = {
  chestPain: [
    "chest pain",
    "central chest pain",
    "chest tightness",
    "tight chest",
    "retrosternal pain",
  ],
  suddenOnset: [
    "sudden onset",
    "suddenly",
    "abrupt onset",
    "abruptly",
    "came on suddenly",
    "started suddenly",
  ],
  tearingPain: [
    "tearing",
    "ripping",
    "tearing pain",
    "ripping pain",
  ],
  backRadiation: [
    "radiating to the back",
    "radiates to the back",
    "back radiation",
    "pain to the back",
    "goes through to the back",
    "shoots through to the back",
    "through to the back",
    "radiating through to the back",
    "radiates through to the back",
    "pain through to the back",
    "into the back",
    "to the interscapular region",
    "between the shoulder blades",
    "interscapular pain",
  ],
  collapse: [
    "collapse",
    "collapsed",
    "syncope",
    "syncopal episode",
    "syncopal event",
    "loss of consciousness",
    "transient loss of consciousness",
    "loc",
    "passed out",
    "blacked out",
    "fainted",
    "fainting",
    "found unconscious",
    "briefly unconscious",
    "unresponsive episode",
  ],
  pulsatileAbdomen: [
    "pulsatile abdomen",
    "pulsating abdomen",
    "pulsatile mass",
    "expansile abdominal mass",
    "pulsating mass",
  ],
  smoker: [
    "smoker",
    "smoking",
    "current smoker",
    "long smoking history",
  ],
  hypertension: [
    "hypertension",
    "untreated hypertension",
    "high blood pressure",
    "known hypertension",
  ],
  abdominalPain: [
    "abdominal pain",
    "abd pain",
    "epigastric pain",
    "tummy pain",
    "stomach pain",
    "abdo pain",
    "abdomen pain",
    "central abdominal pain",
    "upper abdominal pain",
    "lower abdominal pain",
    "generalised abdominal pain",
    "generalized abdominal pain",
    "abdominal discomfort",
    "epigastric discomfort",
    "belly pain",
  ],
  painOutOfProportion: [
    "pain out of proportion",
    "pain seems out of proportion",
  ],
  af: [
    "af",
    "atrial fibrillation",
  ],
  thunderclap: [
    "thunderclap headache",
    "thunderclap",
    "worst headache of my life",
    "worst headache of his life",
    "worst headache of her life",
    "worst headache ever",
    "worst ever headache",
    "sudden severe headache",
    "instant severe headache",
    "reached maximal intensity immediately",
    "maximal at onset",
    "came on like a thunderclap",
  ],
  headache: [
    "headache",
    "head pain",
  ],
  vomiting: [
    "vomiting",
    "vomited",
    "vomit",
    "being sick",
  ],
  neckStiffness: [
    "neck stiffness",
    "meningism",
    "stiff neck",
  ],
  confusion: [
    "confusion",
    "confused",
    "delirium",
    "acutely confused",
    "new confusion",
  ],
  focalNeurology: [
    "focal neurology",
    "focal neurological deficit",
    "focal deficit",
    "weakness",
    "unilateral weakness",
    "one sided weakness",
    "one sided numbness",
    "left sided weakness",
    "right sided weakness",
    "left arm weakness",
    "right arm weakness",
    "left leg weakness",
    "right leg weakness",
    "facial droop",
    "face droop",
    "slurred speech",
    "dysarthria",
    "aphasia",
    "hemiparesis",
    "hemianopia",
    "visual field loss",
    "arm weakness",
    "leg weakness",
  ],
  sob: [
    "shortness of breath",
    "sob",
    "dyspnoea",
    "dyspnea",
    "breathless",
    "breathlessness",
  ],
  hypoxia: [
    "hypoxia",
    "hypoxic",
    "low sats",
    "low oxygen saturations",
    "low oxygen saturation",
    "oxygen saturation",
    "reduced oxygen saturation",
    "desaturated",
    "desaturating",
    "desaturation",
    "sats 88",
    "sats 89",
    "spo2 88",
    "spo2 89",
    "o2 sat 88",
    "o2 sat 89",
  ],
  pleuriticPain: [
    "pleuritic pain",
    "pleuritic chest pain",
    "pleuritic",
    "worse on breathing",
    "pain on breathing",
    "worse on inspiration",
    "worse with inspiration",
    "worse on deep inspiration",
    "worse on deep breath",
    "pain with breathing",
    "pain with deep inspiration",
    "sharp chest pain on breathing",
  ],
  fever: [
    "fever",
    "pyrexia",
    "febrile",
    "temperature",
  ],
  hypotension: [
    "hypotension",
    "shock",
    "hypotensive",
    "bp 80",
    "bp 70",
    "systolic 80",
    "systolic 70",
  ],
};

const NEGATION_PREFIXES = [
  "no",
  "not",
  "denies",
  "denied",
  "without",
  "nil",
];

const FEATURE_NEGATION_PHRASES: Record<string, string[]> = {
  fever: ["no fever", "not feverish", "without fever"],
  vomiting: ["no vomiting", "not vomiting", "without vomiting"],
  pleuriticPain: ["no pleuritic pain", "denies pleuritic pain", "without pleuritic pain"],
  focalNeurology: [
    "no focal neurology",
    "no focal neurological deficit",
    "denies focal neurology",
    "without focal neurology",
  ],
  headache: ["denies headache", "no headache", "without headache"],
};

function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPattern(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasNegatedPattern(text: string, feature: string, patterns: string[]): boolean {
  const explicitNegations = FEATURE_NEGATION_PHRASES[feature] ?? [];

  if (explicitNegations.some((phrase) => text.includes(phrase))) {
    return true;
  }

  return patterns.some((pattern) => {
    const escapedPattern = escapeRegExp(pattern);

    return NEGATION_PREFIXES.some((prefix) => {
      const escapedPrefix = escapeRegExp(prefix);
      const negatedPattern = new RegExp(
        `(?:^|\\s)${escapedPrefix}(?:\\s+\\w+){0,2}\\s+${escapedPattern}(?:\\s|$)`,
      );

      return negatedPattern.test(text);
    });
  });
}

export function extractFeatures(input: CaseInput): ExtractedFeatures {
  const allText = normaliseText(
    [
      input.presentingComplaint,
      input.history,
      input.pmh,
      input.meds,
      input.social,
      input.keyPositives,
      input.keyNegatives,
      input.observations,
      input.suspectedDiagnosis,
    ]
      .join(" ")
      .trim(),
  );

  const matchedFeatures: string[] = [];

  for (const [feature, patterns] of Object.entries(FEATURE_PATTERNS)) {
    const present = hasPattern(allText, patterns);
    const negated = hasNegatedPattern(allText, feature, patterns);

    if (present && !negated) {
      matchedFeatures.push(feature);
    }
  }

  return { allText, matchedFeatures };
}
