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
  ],
  collapse: [
    "collapse",
    "collapsed",
    "syncope",
    "loss of consciousness",
    "loc",
    "passed out",
    "blacked out",
    "fainted",
    "fainting",
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
    "weakness",
    "unilateral weakness",
    "facial droop",
    "slurred speech",
    "aphasia",
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
    "oxygen saturation",
    "desaturating",
    "desaturation",
  ],
  pleuriticPain: [
    "pleuritic pain",
    "pleuritic chest pain",
    "worse on breathing",
    "pain on breathing",
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

function normaliseText(text: string): string {
  return text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ");
}

function hasPattern(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function hasNegatedPattern(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    return NEGATION_PREFIXES.some((prefix) =>
      text.includes(`${prefix} ${pattern}`),
    );
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
    const negated = hasNegatedPattern(allText, patterns);

    if (present && !negated) {
      matchedFeatures.push(feature);
    }
  }

  return { allText, matchedFeatures };
}
