import type { CaseInput, ExtractedFeatures } from "./types";

const FEATURE_PATTERNS: Record<string, string[]> = {
  chestPain: [
    "chest pain",
    "central chest pain",
    "central chest pressure",
    "chest pressure",
    "chest heaviness",
    "heavy chest pain",
    "crushing chest pain",
    "chest tightness",
    "tight chest",
    "central chest discomfort",
    "heavy feeling in chest",
    "dull central chest pain",
    "retrosternal pain",
    "pain on one side of chest",
    "unilateral chest pain",
    "sudden sharp chest pain",
  ],
  suddenOnset: [
    "sudden onset",
    "sudden pleuritic chest pain",
    "sudden sharp chest pain",
    "sudden abdominal pain",
    "sudden headache",
    "sudden shortness of breath",
    "sudden breathlessness",
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
  jawPain: [
    "jaw pain",
    "pain to jaw",
    "pain to the jaw",
    "pain in the jaw",
    "pain radiating to the jaw",
    "radiates to the jaw",
    "jaw discomfort",
  ],
  armPain: [
    "arm pain",
    "left arm pain",
    "right arm pain",
    "left arm",
    "right arm",
    "pain to left arm",
    "pain to the left arm",
    "pain to right arm",
    "pain to the right arm",
    "pain radiating to the arm",
    "pain radiating to the left arm",
    "pain radiating to the right arm",
    "radiates to the arm",
    "radiates to the left arm",
    "radiates to the right arm",
    "pain down the left arm",
    "pain down the right arm",
    "left arm discomfort",
  ],
  sweating: [
    "sweating",
    "sweaty",
    "diaphoretic",
    "clammy",
    "cold sweat",
  ],
  nausea: [
    "nausea",
    "nauseated",
    "feeling sick",
  ],
  indigestionLikeChestPain: [
    "indigestion like chest pain",
    "indigestion-like chest pain",
    "indigestion type chest pain",
    "indigestion type pain in chest",
    "burning chest pain",
    "central chest burning",
    "thought it was indigestion",
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
  diarrhoea: [
    "diarrhoea",
    "diarrhea",
    "loose stools",
    "loose stool",
    "watery stools",
    "watery stool",
    "watery diarrhoea",
    "watery diarrhea",
    "frequent loose stools",
    "bloody diarrhoea",
    "bloody diarrhea",
  ],
  constipation: [
    "constipation",
    "constipated",
    "no bowel movement",
    "not opened bowels",
    "hard stools",
  ],
  prBleeding: [
    "pr bleeding",
    "blood per rectum",
    "bright red blood per rectum",
    "rectal bleeding",
    "fresh blood per rectum",
    "fresh pr bleeding",
    "passing blood",
    "blood in stool",
    "blood in stools",
    "bloody stool",
    "bloody stools",
  ],
  melaena: [
    "melaena",
    "melena",
    "black stools",
    "black stool",
    "black tarry stools",
    "tarry stool",
    "tarry stools",
    "dark stool",
    "dark stools",
  ],
  haematemesis: [
    "haematemesis",
    "hematemesis",
    "coffee ground vomit",
    "coffee-ground vomit",
    "coffee ground vomitus",
    "coffee-ground vomitus",
    "coffee ground emesis",
    "coffee-ground emesis",
    "vomiting blood",
    "vomited blood",
    "blood in vomit",
    "blood stained vomit",
    "blood-stained vomit",
  ],
  haemoptysis: [
    "haemoptysis",
    "hemoptysis",
    "coughing blood",
    "coughing up blood",
    "coughed up blood",
    "blood in sputum",
  ],
  rigors: [
    "rigors",
    "rigor",
    "shivering",
    "shaking chills",
    "fever with chills",
  ],
  infectionSource: [
    "cough",
    "productive cough",
    "purulent sputum",
    "dysuria",
    "urinary frequency",
    "cloudy urine",
    "cellulitis",
    "infected wound",
    "line infection",
  ],
  alcoholExcess: [
    "alcohol excess",
    "heavy alcohol use",
    "heavy alcohol intake",
    "heavy drinker",
    "drinks heavily",
    "excess alcohol",
    "alcohol dependence",
  ],
  bingeDrinking: [
    "binge drinking",
    "binge drank",
    "drank heavily last night",
    "alcohol binge",
  ],
  pepticUlcerDisease: [
    "peptic ulcer disease",
    "peptic ulcer",
    "gastric ulcer",
    "duodenal ulcer",
    "pud",
  ],
  nsaidUse: [
    "nsaid use",
    "taking nsaids",
    "regular ibuprofen",
    "ibuprofen use",
    "naproxen use",
    "diclofenac use",
  ],
  recentSurgery: [
    "recent surgery",
    "post op",
    "post-op",
    "post operative",
    "post-operative",
    "after surgery",
    "following surgery",
  ],
  immobility: [
    "prolonged immobility",
    "immobile",
    "reduced mobility",
    "reduced mobility after injury",
    "reduced mobility after fall",
    "immobility after injury",
    "immobility after a fall",
    "bedbound",
    "bed bound",
  ],
  longHaulTravel: [
    "long haul flight",
    "long-haul flight",
    "long haul travel",
    "prolonged travel",
    "prolonged flight",
    "long flight",
  ],
  unilateralReducedAirEntry: [
    "unilateral reduced air entry",
    "reduced air entry on one side",
    "reduced air entry on the left",
    "reduced air entry on the right",
    "decreased air entry on the left",
    "decreased air entry on the right",
    "decreased air entry left",
    "decreased air entry right",
    "reduced air entry left",
    "reduced air entry right",
    "unilateral decreased breath sounds",
    "unilateral reduced breath sounds",
    "absent breath sounds on one side",
    "absent breath sounds on the left",
    "absent breath sounds on the right",
    "reduced breath sounds on one side",
    "reduced breath sounds on the left",
    "reduced breath sounds on the right",
    "decreased breath sounds on one side",
    "decreased breath sounds on the left",
    "decreased breath sounds on the right",
    "one sided decreased breath sounds",
    "one-sided decreased breath sounds",
    "absent breath sounds",
    "unilateral absent breath sounds",
    "hyperresonant hemithorax",
  ],
  tallThinHabitus: [
    "tall thin male",
    "tall slim male",
    "tall and thin",
    "tall and slim",
    "tall thin",
  ],
  recentChestDrain: [
    "recent chest drain",
    "had a chest drain recently",
    "post chest drain",
    "after chest drain",
  ],
  previousPneumothorax: [
    "previous pneumothorax",
    "history of pneumothorax",
    "prior pneumothorax",
    "recurrent pneumothorax",
  ],
  trauma: [
    "chest trauma",
    "rib fracture",
    "after trauma",
    "following trauma",
    "post trauma",
    "spontaneous pneumothorax",
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
    "headache came on instantly",
    "instant severe headache",
    "explosive headache",
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
  photophobia: [
    "photophobia",
    "light sensitivity",
    "sensitive to light",
    "hurts to look at light",
    "light hurts eyes",
    "light hurts the eyes",
  ],
  sharedAccommodation: [
    "shared accommodation",
    "student halls",
    "university halls",
    "lives in halls",
    "dormitory",
    "shared housing",
  ],
  recentInfection: [
    "recent infection",
    "recent viral illness",
    "recent cold",
    "recent sore throat",
    "recent flu like illness",
    "recent flu-like illness",
    "recent uri",
  ],
  confusion: [
    "confusion",
    "confused",
    "delirium",
    "acutely confused",
    "new confusion",
    "drowsy",
    "difficult to rouse",
    "hard to rouse",
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
    "can t catch breath",
    "can't catch breath",
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
  ],
  hypothermia: [
    "hypothermia",
    "hypothermic",
  ],
  hypotension: [
    "hypotension",
    "shock",
    "hypotensive",
    "low blood pressure",
    "blood pressure 90",
    "bp 80",
    "bp 90",
    "bp 70",
    "systolic 90",
    "systolic 80",
    "systolic 70",
  ],
  tachycardia: [
    "tachycardia",
    "tachycardic",
    "high heart rate",
    "heart rate 120",
    "heart rate 130",
    "hr 120",
    "hr 130",
    "pulse 120",
    "pulse 130",
  ],
  tachypnoea: [
    "tachypnoea",
    "tachypnea",
    "tachypnoeic",
    "tachypneic",
    "high respiratory rate",
    "respiratory rate 30",
    "respiratory rate 32",
    "rr 30",
    "rr 32",
  ],
  giBleed: [
    "pr bleeding",
    "blood per rectum",
    "bright red blood per rectum",
    "rectal bleeding",
    "melaena",
    "melena",
    "haematemesis",
    "hematemesis",
    "coffee ground vomit",
    "coffee-ground vomit",
    "coffee ground vomitus",
    "coffee-ground vomitus",
    "coffee ground emesis",
    "coffee-ground emesis",
    "black stools",
    "black stool",
    "tarry stool",
    "tarry stools",
    "dark stool",
    "dark stools",
    "blood in vomit",
    "vomiting blood",
    "vomited blood",
    "fresh pr bleeding",
    "passing blood",
    "bloody stool",
    "bloody stools",
    "bloody diarrhoea",
    "bloody diarrhea",
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
  diarrhoea: ["no diarrhoea", "no diarrhea", "without diarrhoea", "without diarrhea"],
  pleuriticPain: ["no pleuritic pain", "denies pleuritic pain", "without pleuritic pain"],
  focalNeurology: [
    "no focal neurology",
    "no focal neurological deficit",
    "denies focal neurology",
    "without focal neurology",
  ],
  headache: ["denies headache", "no headache", "without headache"],
};

const HIGH_RESPIRATORY_RATE_THRESHOLD = 22;
const HIGH_HEART_RATE_THRESHOLD = 100;
const LOW_SYSTOLIC_BP_THRESHOLD = 90;
const LOW_SATS_THRESHOLD = 92;
const HIGH_TEMPERATURE_THRESHOLD = 38;
const LOW_TEMPERATURE_THRESHOLD = 36;

function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPatternRegex(pattern: string): RegExp {
  const escapedPattern = escapeRegExp(pattern).replace(/\s+/g, "\\s+");

  return new RegExp(`(?:^|\\s)${escapedPattern}(?:\\s|$)`);
}

function hasPattern(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => buildPatternRegex(pattern).test(text));
}

function hasNegatedPattern(text: string, feature: string, patterns: string[]): boolean {
  const explicitNegations = FEATURE_NEGATION_PHRASES[feature] ?? [];

  if (explicitNegations.some((phrase) => text.includes(phrase))) {
    return true;
  }

  return patterns.some((pattern) => {
    const escapedPattern = escapeRegExp(pattern).replace(/\s+/g, "\\s+");

    return NEGATION_PREFIXES.some((prefix) => {
      const escapedPrefix = escapeRegExp(prefix);
      const negatedPattern = new RegExp(
        `(?:^|\\s)${escapedPrefix}(?:\\s+\\w+){0,2}\\s+${escapedPattern}(?:\\s|$)`,
      );

      return negatedPattern.test(text);
    });
  });
}

function normaliseObservations(text: string): string {
  return text
    .toLowerCase()
    .replace(/[,:;=]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getNumericMatches(text: string, regexes: RegExp[]): number[] {
  const matches: number[] = [];

  for (const regex of regexes) {
    const matchedValues = text.matchAll(regex);

    for (const match of matchedValues) {
      const parsedValue = Number(match[1]);

      if (!Number.isNaN(parsedValue)) {
        matches.push(parsedValue);
      }
    }
  }

  return matches;
}

function getBloodPressureValues(text: string): number[] {
  const systolicMatches = getNumericMatches(text, [
    /\bbp(?:\s+is)?\s+(\d{2,3})\s*\/\s*\d{2,3}\b/g,
    /\bblood pressure(?:\s+is)?\s+(\d{2,3})\s*\/\s*\d{2,3}\b/g,
    /\bbp(?:\s+is)?\s+(\d{2,3})\b/g,
    /\bblood pressure(?:\s+is)?\s+(\d{2,3})\b/g,
    /\bsystolic(?:\s+bp)?(?:\s+is)?\s+(\d{2,3})\b/g,
  ]);

  return systolicMatches;
}

function getObservationFeatures(observations: string): string[] {
  const normalisedObservations = normaliseObservations(observations);

  if (!normalisedObservations) {
    return [];
  }

  const observationFeatures: string[] = [];
  const respiratoryRates = getNumericMatches(normalisedObservations, [
    /\brr\s+(\d{1,2})\b/g,
    /\brespiratory rate\s+(\d{1,2})\b/g,
    /\bresp rate\s+(\d{1,2})\b/g,
  ]);
  const heartRates = getNumericMatches(normalisedObservations, [
    /\bhr\s+(\d{2,3})\b/g,
    /\bpulse\s+(\d{2,3})\b/g,
    /\bheart rate\s+(\d{2,3})\b/g,
  ]);
  const oxygenSaturations = getNumericMatches(normalisedObservations, [
    /\bsats?\s+(\d{2,3})(?:\s*%| percent)?\b/g,
    /\bspo2\s+(\d{2,3})(?:\s*%| percent)?\b/g,
    /\boxygen saturation\s+(\d{2,3})(?:\s*%| percent)?\b/g,
  ]);
  const temperatures = getNumericMatches(normalisedObservations, [
    /\btemp\s+(\d{2}(?:\.\d+)?)\b/g,
    /\btemperature\s+(\d{2}(?:\.\d+)?)\b/g,
    /(?:^|\s)t\s+(\d{2}(?:\.\d+)?)\b/g,
  ]);
  const systolicBloodPressures = getBloodPressureValues(normalisedObservations);

  if (respiratoryRates.some((rate) => rate >= HIGH_RESPIRATORY_RATE_THRESHOLD)) {
    observationFeatures.push("tachypnoea");
  }

  if (heartRates.some((rate) => rate >= HIGH_HEART_RATE_THRESHOLD)) {
    observationFeatures.push("tachycardia");
  }

  if (systolicBloodPressures.some((pressure) => pressure <= LOW_SYSTOLIC_BP_THRESHOLD)) {
    observationFeatures.push("hypotension");
  }

  if (oxygenSaturations.some((sats) => sats <= LOW_SATS_THRESHOLD)) {
    observationFeatures.push("hypoxia");
  }

  if (temperatures.some((temperature) => temperature >= HIGH_TEMPERATURE_THRESHOLD)) {
    observationFeatures.push("fever");
  }

  if (temperatures.some((temperature) => temperature < LOW_TEMPERATURE_THRESHOLD)) {
    observationFeatures.push("hypothermia");
  }

  return observationFeatures;
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

  for (const feature of getObservationFeatures(input.observations)) {
    if (!matchedFeatures.includes(feature)) {
      matchedFeatures.push(feature);
    }
  }

  return { allText, matchedFeatures };
}
