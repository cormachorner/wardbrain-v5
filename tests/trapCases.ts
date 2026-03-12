import type { AnalysisResult, CaseInput } from "../lib/types";

export type TrapCase = {
  id: string;
  description: string;
  input: CaseInput;
  expected: Pick<
    AnalysisResult & { detectedFeatures: string[] },
    | "problemRepresentation"
    | "fitCheck"
    | "anchorWarning"
    | "presentation"
    | "detectedFeatures"
    | "redFlags"
    | "differentials"
  >;
};

export const TRAP_CASES: TrapCase[] = [
  {
    id: "acute-aortic-syndrome-vs-gord",
    description: "acute aortic syndrome / AAA vs GORD",
    input: {
      age: "68",
      sex: "male",
      presentingComplaint: "Chest pain",
      history: "Sudden onset tearing chest pain radiating to the back with collapse",
      pmh: "known hypertension",
      meds: "",
      social: "smoker",
      keyPositives: "",
      keyNegatives: "",
      observations: "",
      suspectedDiagnosis: "GORD",
    },
    expected: {
      problemRepresentation:
        "68yo male Chest pain with chest pain, sudden onset, tearing quality, back radiation, collapse / syncope",
      redFlags: [
        {
          name: "Ruptured AAA suspicion pattern",
          explanation:
            "New abdominal or back pain with collapse or loss of consciousness, especially in an older person with smoking history or hypertension, should push ruptured or symptomatic AAA higher.",
          boostDiagnoses: ["Abdominal aortic aneurysm"],
          sourceBody: "NICE",
          sourceId: "NG156",
          sourceCoverage: "full",
        },
        {
          name: "ACS suspicion pattern",
          explanation:
            "Chest pain with associated concerning features such as collapse, breathlessness, or haemodynamic instability should keep acute coronary syndrome high on the differential.",
          boostDiagnoses: ["Acute coronary syndrome"],
          sourceBody: "NICE",
          sourceId: "CG95",
          sourceCoverage: "full",
        },
        {
          name: "PE suspicion pattern",
          explanation:
            "Chest pain or shortness of breath, especially with collapse or pleuritic features, should prompt formal PE assessment rather than casual exclusion.",
          boostDiagnoses: ["Pulmonary embolism"],
          sourceBody: "NICE",
          sourceId: "NG158",
          sourceCoverage: "full",
        },
        {
          name: "Acute aortic syndrome pattern",
          explanation:
            "This feature cluster should strongly raise concern for acute aortic pathology, but this rule is currently an internal WardBrain pattern rather than a fully NICE-derived rule.",
          boostDiagnoses: ["Acute aortic syndrome"],
          sourceBody: "NICE",
          sourceId: "coverage-gap",
          sourceCoverage: "gap",
        },
      ],
      differentials: [
        {
          name: "Acute aortic syndrome",
          score: 17,
          reasonsFor: [
            "chest pain",
            "sudden onset",
            "tearing quality",
            "back radiation",
            "collapse / syncope",
            "hypertension",
            "vascular catastrophe pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Abdominal aortic aneurysm",
          score: 13,
          reasonsFor: [
            "back radiation",
            "collapse / syncope",
            "smoking history",
            "hypertension",
            "AAA pattern",
          ],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Weak fit",
        summary:
          "GORD is a poor fit because it does not explain sudden onset, tearing quality, back radiation, collapse / syncope. Acute aortic syndrome currently provides a better overall explanation.",
        supporting: ["chest pain"],
        conflicting: [
          "sudden onset",
          "tearing quality",
          "back radiation",
          "collapse / syncope",
        ],
      },
      anchorWarning:
        "You may be anchoring too early. Acute aortic syndrome currently fits the pattern better than your entered diagnosis.",
      presentation:
        "This is a 68-year-old male presenting with chest pain. Key concerning features include sudden onset, tearing quality, back radiation, collapse / syncope. Relevant background factors include hypertension, smoking history. My leading differential is Acute aortic syndrome, with Abdominal aortic aneurysm also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: [
        "chest pain",
        "sudden onset",
        "tearing quality",
        "back radiation",
        "collapse / syncope",
        "smoking history",
        "hypertension",
      ],
    },
  },
  {
    id: "thunderclap-headache-vs-migraine",
    description: "thunderclap headache vs migraine",
    input: {
      age: "42",
      sex: "female",
      presentingComplaint: "Headache",
      history: "sudden thunderclap headache with vomiting",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "",
      suspectedDiagnosis: "Migraine",
    },
    expected: {
      problemRepresentation: "42yo female Headache with thunderclap onset, headache, vomiting",
      redFlags: [
        {
          name: "Headache urgent evaluation pattern",
          explanation:
            "Sudden severe headache, especially with vomiting, neurological features, or reduced consciousness, should not be reassured as a simple primary headache.",
          boostDiagnoses: ["Subarachnoid haemorrhage", "Stroke / neurological emergency"],
          sourceBody: "NICE",
          sourceId: "CG150",
          sourceCoverage: "full",
        },
      ],
      differentials: [
        {
          name: "Subarachnoid haemorrhage",
          score: 11,
          reasonsFor: [
            "thunderclap onset",
            "headache",
            "vomiting",
            "sudden severe headache pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Acute aortic syndrome",
          score: 0,
          reasonsFor: [],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Weak fit",
        summary:
          "Your suspected diagnosis is not recognised by the current rule set, so it cannot yet be stress-tested properly.",
        supporting: [],
        conflicting: ["not yet represented in the current diagnosis rules"],
      },
      anchorWarning:
        "You may be anchoring too early. Subarachnoid haemorrhage currently fits the pattern better than your entered diagnosis.",
      presentation:
        "This is a 42-year-old female presenting with headache. Key concerning features include thunderclap onset, vomiting. My leading differential is Subarachnoid haemorrhage, with Acute aortic syndrome also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: ["thunderclap onset", "headache", "vomiting"],
    },
  },
  {
    id: "confusion-focal-neurology-vs-delirium",
    description: "confusion + focal neurology vs simple delirium",
    input: {
      age: "79",
      sex: "male",
      presentingComplaint: "Confusion",
      history: "new confusion with facial droop and slurred speech",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "fever",
      suspectedDiagnosis: "Delirium secondary to infection",
    },
    expected: {
      problemRepresentation: "79yo male Confusion with confusion, focal neurology, fever",
      redFlags: [
        {
          name: "Think delirium pattern",
          explanation:
            "An acute change in mental state or behaviour over hours to days should trigger active consideration of delirium and a search for the precipitant.",
          boostDiagnoses: ["Delirium secondary to infection"],
          sourceBody: "NICE",
          sourceId: "CG103",
          sourceCoverage: "full",
        },
      ],
      differentials: [
        {
          name: "Stroke / neurological emergency",
          score: 8,
          reasonsFor: [
            "confusion",
            "focal neurology",
            "neurological emergency pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Delirium secondary to infection",
          score: 2,
          reasonsFor: ["confusion", "fever"],
          reasonsAgainst: ["focal neurology"],
        },
      ],
      fitCheck: {
        label: "Weak fit",
        summary:
          "Delirium secondary to infection is a poor fit because it does not explain focal neurology. Stroke / neurological emergency currently provides a better overall explanation.",
        supporting: ["confusion", "fever"],
        conflicting: ["focal neurology"],
      },
      anchorWarning:
        "Your current diagnosis is weakly supported and the case contains red-flag features. Stroke / neurological emergency should currently be prioritised above a benign explanation.",
      presentation:
        "This is a 79-year-old male presenting with confusion. Key concerning features include focal neurology, confusion. My leading differential is Stroke / neurological emergency, with Delirium secondary to infection also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: ["confusion", "focal neurology", "fever"],
    },
  },
];
