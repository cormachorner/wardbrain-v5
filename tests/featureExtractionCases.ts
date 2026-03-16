import type { CaseInput } from "../lib/types";

export type FeatureExtractionCase = {
  id: string;
  description: string;
  input: CaseInput;
  expectedPresent: string[];
  expectedAbsent: string[];
};

const EMPTY_CASE: CaseInput = {
  age: "",
  sex: "",
  presentingComplaint: "",
  history: "",
  pmh: "",
  meds: "",
  social: "",
  keyPositives: "",
  keyNegatives: "",
  observations: "",
  suspectedDiagnosis: "",
};

export const FEATURE_EXTRACTION_CASES: FeatureExtractionCase[] = [
  {
    id: "aortic-wording-variation",
    description: "detects back radiation and collapse from alternative aortic phrasing",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Chest pain",
      history:
        "Abrupt chest pain going between the shoulder blades. He blacked out briefly afterwards.",
    },
    expectedPresent: ["chestPain", "backRadiation", "collapse"],
    expectedAbsent: ["thunderclap", "abdominalPain"],
  },
  {
    id: "thunderclap-negated-vomiting",
    description: "detects thunderclap wording while respecting no vomiting",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Headache",
      history: "Worst ever headache, maximal at onset.",
      keyNegatives: "No vomiting.",
    },
    expectedPresent: ["thunderclap", "headache"],
    expectedAbsent: ["vomiting", "focalNeurology"],
  },
  {
    id: "pe-risk-context-wording",
    description: "detects PE risk context from surgery immobility and travel wording",
    input: {
      ...EMPTY_CASE,
      history:
        "Shortness of breath after recent surgery, prolonged immobility after a fall, and a long-haul flight.",
    },
    expectedPresent: ["sob", "recentSurgery", "immobility", "longHaulTravel"],
    expectedAbsent: ["unilateralReducedAirEntry", "giBleed"],
  },
  {
    id: "focal-neuro-negation-and-headache-negation",
    description: "does not infer focal neurology or headache when explicitly negated",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Confusion",
      history: "Acute confusion with fever.",
      keyNegatives: "No focal neurology. Denies headache.",
    },
    expectedPresent: ["confusion", "fever"],
    expectedAbsent: ["focalNeurology", "headache"],
  },
  {
    id: "pe-wording-variation",
    description: "detects pleuritic pain and hypoxia from alternative respiratory wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Chest pain and breathlessness",
      history: "Sharp chest pain worse on deep breath.",
      observations: "Sats 88% on air.",
    },
    expectedPresent: ["chestPain", "sob", "pleuriticPain", "hypoxia"],
    expectedAbsent: ["collapse", "thunderclap"],
  },
  {
    id: "unilateral-air-entry-wording",
    description: "detects unilateral reduced air entry from unilateral chest sign wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Chest pain and shortness of breath",
      history: "Sudden pleuritic chest pain with unilateral reduced air entry on the left.",
    },
    expectedPresent: [
      "chestPain",
      "sob",
      "suddenOnset",
      "pleuriticPain",
      "unilateralReducedAirEntry",
    ],
    expectedAbsent: ["hypoxia", "fever"],
  },
  {
    id: "pneumothorax-context-wording",
    description: "detects pneumothorax context from habitus and prior thoracic wording",
    input: {
      ...EMPTY_CASE,
      history:
        "Tall thin male with previous pneumothorax after recent chest drain and chest trauma.",
    },
    expectedPresent: ["tallThinHabitus", "previousPneumothorax", "recentChestDrain", "trauma"],
    expectedAbsent: ["longHaulTravel", "fever"],
  },
  {
    id: "abdominal-wording-variation",
    description: "detects abdominal pain from broader abdominal wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Upper abdominal pain",
      history: "Central abdominal pain with epigastric discomfort.",
    },
    expectedPresent: ["abdominalPain"],
    expectedAbsent: ["chestPain", "pleuriticPain"],
  },
  {
    id: "pleuritic-fever-negations",
    description: "respects no pleuritic pain and no fever negation phrases",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Shortness of breath",
      history: "Breathless but no pleuritic pain.",
      observations: "No fever.",
    },
    expectedPresent: ["sob"],
    expectedAbsent: ["pleuriticPain", "fever"],
  },
  {
    id: "acs-context-wording",
    description: "detects ACS contextual symptoms and risk features",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Chest pain",
      history:
        "Central chest pain radiating to the jaw and left arm with sweating and nausea. He thought it was indigestion.",
      pmh: "known hypertension",
      social: "current smoker",
    },
    expectedPresent: [
      "chestPain",
      "jawPain",
      "armPain",
      "sweating",
      "nausea",
      "indigestionLikeChestPain",
      "hypertension",
      "smoker",
    ],
    expectedAbsent: ["thunderclap", "abdominalPain"],
  },
  {
    id: "acs-synonym-wording",
    description: "detects ACS symptom synonyms from pressure heaviness and radiation wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Central chest pressure",
      history:
        "Heavy feeling in chest with pain to jaw and pain to left arm, clammy and nauseated.",
    },
    expectedPresent: ["chestPain", "jawPain", "armPain", "sweating", "nausea"],
    expectedAbsent: ["pleuriticPain", "thunderclap"],
  },
  {
    id: "pe-synonym-wording",
    description: "detects PE symptom synonyms including breathlessness and haemoptysis",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Sudden breathlessness",
      history: "Sharp chest pain on breathing and coughed up blood. He can't catch breath.",
    },
    expectedPresent: ["suddenOnset", "sob", "chestPain", "pleuriticPain", "haemoptysis"],
    expectedAbsent: ["unilateralReducedAirEntry", "giBleed"],
  },
  {
    id: "pneumothorax-synonym-wording",
    description: "detects pneumothorax symptom synonyms from one-sided pain and breath sounds",
    input: {
      ...EMPTY_CASE,
      history:
        "Sudden sharp chest pain on one side of chest with shortness of breath and one-sided decreased breath sounds.",
    },
    expectedPresent: ["chestPain", "suddenOnset", "sob", "unilateralReducedAirEntry"],
    expectedAbsent: ["haemoptysis", "fever"],
  },
  {
    id: "sah-synonym-wording",
    description: "detects SAH synonym wording from explosive immediate-onset headache",
    input: {
      ...EMPTY_CASE,
      history: "Worst headache of my life. The headache came on instantly and was explosive.",
    },
    expectedPresent: ["headache", "thunderclap"],
    expectedAbsent: ["focalNeurology", "vomiting"],
  },
  {
    id: "gi-bleed-wording-variation",
    description: "detects upper and lower gi bleeding phrases plus unstable observations",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Collapse",
      history: "Vomited blood with melaena and blood per rectum.",
      observations: "HR 130 and systolic 70.",
    },
    expectedPresent: [
      "haematemesis",
      "melaena",
      "prBleeding",
      "giBleed",
      "tachycardia",
      "hypotension",
    ],
    expectedAbsent: ["diarrhoea", "constipation"],
  },
  {
    id: "gi-bleed-synonym-wording",
    description: "detects GI bleed synonyms from coffee-ground vomit and rectal blood wording",
    input: {
      ...EMPTY_CASE,
      history: "Coffee-ground vomit with black tarry stools and fresh PR bleeding, now passing blood.",
    },
    expectedPresent: ["haematemesis", "melaena", "prBleeding", "giBleed"],
    expectedAbsent: ["diarrhoea", "constipation"],
  },
  {
    id: "gi-bleed-risk-context",
    description: "detects GI bleed risk context from alcohol ulcer and nsaid wording",
    input: {
      ...EMPTY_CASE,
      history:
        "Heavy alcohol intake in a heavy drinker with binge drinking, known peptic ulcer disease, and regular ibuprofen.",
    },
    expectedPresent: ["alcoholExcess", "bingeDrinking", "pepticUlcerDisease", "nsaidUse"],
    expectedAbsent: ["thunderclap", "focalNeurology"],
  },
  {
    id: "stool-wording-variation",
    description: "detects diarrhoea and constipation wording distinctly",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Abdominal pain",
      history: "Loose stools then watery diarrhoea, but previously constipated with hard stools.",
    },
    expectedPresent: ["abdominalPain", "diarrhoea", "constipation"],
    expectedAbsent: ["giBleed", "prBleeding"],
  },
  {
    id: "sepsis-observation-wording",
    description: "detects fever tachycardia tachypnoea hypotension from observation wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Fever",
      observations: "Temp 39, HR 130, RR 32, low blood pressure, low sats.",
    },
    expectedPresent: ["fever", "tachycardia", "tachypnoea", "hypotension", "hypoxia"],
    expectedAbsent: ["prBleeding", "constipation"],
  },
  {
    id: "meningitis-context-wording",
    description: "detects meningitis context from photophobia recent infection and shared accommodation",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Headache",
      history:
        "Headache with photophobia after a recent flu-like illness. Lives in student halls.",
    },
    expectedPresent: ["headache", "photophobia", "recentInfection", "sharedAccommodation"],
    expectedAbsent: ["armPain", "giBleed"],
  },
  {
    id: "meningitis-synonym-wording",
    description: "detects meningitis encephalitis symptom synonyms from neck stiffness light sensitivity and reduced arousal",
    input: {
      ...EMPTY_CASE,
      history:
        "Headache with fever, stiff neck, light hurts eyes, drowsy and difficult to rouse after a recent viral illness.",
    },
    expectedPresent: [
      "headache",
      "fever",
      "neckStiffness",
      "photophobia",
      "confusion",
      "recentInfection",
    ],
    expectedAbsent: ["armPain", "prBleeding"],
  },
  {
    id: "rr-28",
    description: "detects tachypnoea from RR 28",
    input: {
      ...EMPTY_CASE,
      observations: "RR 28",
    },
    expectedPresent: ["tachypnoea"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "respiratory-rate-30",
    description: "detects tachypnoea from respiratory rate 30",
    input: {
      ...EMPTY_CASE,
      observations: "respiratory rate 30",
    },
    expectedPresent: ["tachypnoea"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "temp-39-8",
    description: "detects fever from temp 39.8",
    input: {
      ...EMPTY_CASE,
      observations: "temp 39.8",
    },
    expectedPresent: ["fever"],
    expectedAbsent: ["hypothermia", "tachycardia"],
  },
  {
    id: "t-40-1",
    description: "detects fever from t 40.1",
    input: {
      ...EMPTY_CASE,
      observations: "T 40.1",
    },
    expectedPresent: ["fever"],
    expectedAbsent: ["hypothermia", "tachypnoea"],
  },
  {
    id: "temperature-36-8",
    description: "does not detect fever from normal temperature 36.8",
    input: {
      ...EMPTY_CASE,
      observations: "temperature 36.8",
    },
    expectedPresent: [],
    expectedAbsent: ["fever", "hypothermia"],
  },
  {
    id: "bp-85-50",
    description: "detects hypotension from BP 85/50",
    input: {
      ...EMPTY_CASE,
      observations: "BP 85/50",
    },
    expectedPresent: ["hypotension"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "bp-90-60",
    description: "detects hypotension from bp 90/60",
    input: {
      ...EMPTY_CASE,
      observations: "bp 90/60",
    },
    expectedPresent: ["hypotension"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "blood-pressure-85-50",
    description: "detects hypotension from blood pressure 85/50",
    input: {
      ...EMPTY_CASE,
      observations: "blood pressure 85/50",
    },
    expectedPresent: ["hypotension"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "systolic-85",
    description: "detects hypotension from systolic 85",
    input: {
      ...EMPTY_CASE,
      observations: "systolic 85",
    },
    expectedPresent: ["hypotension"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "sats-88",
    description: "detects hypoxia from sats 88 percent",
    input: {
      ...EMPTY_CASE,
      observations: "sats 88%",
    },
    expectedPresent: ["hypoxia"],
    expectedAbsent: ["tachypnoea", "fever"],
  },
  {
    id: "hr-130",
    description: "detects tachycardia from HR 130",
    input: {
      ...EMPTY_CASE,
      observations: "HR 130",
    },
    expectedPresent: ["tachycardia"],
    expectedAbsent: ["hypotension", "fever"],
  },
  {
    id: "temperature-35-1",
    description: "detects hypothermia from temperature 35.1",
    input: {
      ...EMPTY_CASE,
      observations: "temperature 35.1",
    },
    expectedPresent: ["hypothermia"],
    expectedAbsent: ["fever"],
  },
];
