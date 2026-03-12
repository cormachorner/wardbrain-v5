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
];
