export type DiagnosisRule = {
  name: string;
  supportive: string[];
  conflicting: string[];
  expectedImportant?: string[];
};

export const DIAGNOSIS_RULES: DiagnosisRule[] = [
  {
    name: "Acute aortic syndrome",
    supportive: [
      "chestPain",
      "suddenOnset",
      "tearingPain",
      "backRadiation",
      "collapse",
      "hypertension",
    ],
    conflicting: ["fever"],
    expectedImportant: ["suddenOnset", "tearingPain", "backRadiation"],
  },
  {
    name: "Abdominal aortic aneurysm",
    supportive: [
      "abdominalPain",
      "backRadiation",
      "collapse",
      "pulsatileAbdomen",
      "smoker",
      "hypotension",
      "hypertension",
    ],
    conflicting: [],
    expectedImportant: ["collapse", "pulsatileAbdomen"],
  },
  {
    name: "Acute coronary syndrome",
    supportive: ["chestPain", "collapse", "hypertension", "sob"],
    conflicting: ["tearingPain", "pulsatileAbdomen", "backRadiation"],
    expectedImportant: ["chestPain"],
  },
  {
    name: "Pulmonary embolism",
    supportive: ["chestPain", "sob", "collapse", "pleuriticPain", "hypoxia"],
    conflicting: ["pulsatileAbdomen", "tearingPain", "backRadiation"],
    expectedImportant: ["sob", "pleuriticPain"],
  },
  {
    name: "GORD",
    supportive: ["chestPain"],
    conflicting: [
      "suddenOnset",
      "tearingPain",
      "backRadiation",
      "collapse",
      "pulsatileAbdomen",
      "hypotension",
    ],
    expectedImportant: ["chestPain"],
  },
  {
    name: "Mesenteric ischaemia",
    supportive: ["abdominalPain", "painOutOfProportion", "af", "collapse"],
    conflicting: ["chestPain"],
    expectedImportant: ["abdominalPain", "painOutOfProportion"],
  },
  {
    name: "Subarachnoid haemorrhage",
    supportive: ["thunderclap", "headache", "vomiting", "neckStiffness", "collapse"],
    conflicting: [],
    expectedImportant: ["thunderclap", "headache"],
  },
  {
    name: "Stroke / neurological emergency",
    supportive: ["confusion", "focalNeurology", "collapse"],
    conflicting: [],
    expectedImportant: ["focalNeurology", "confusion"],
  },
  {
    name: "Delirium secondary to infection",
    supportive: ["confusion", "fever"],
    conflicting: ["focalNeurology", "thunderclap"],
    expectedImportant: ["confusion"],
  },
];

export function findDiagnosisRule(name: string): DiagnosisRule | undefined {
  return DIAGNOSIS_RULES.find((diagnosisRule) => diagnosisRule.name.toLowerCase() === name.trim().toLowerCase());
}
