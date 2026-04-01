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
          score: 19,
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
          score: 15,
          reasonsFor: [
            "back radiation",
            "collapse / syncope",
            "smoking history",
            "hypertension",
            "AAA pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Acute coronary syndrome",
          score: 6,
          reasonsFor: [
            "chest pain",
            "collapse / syncope",
            "hypertension",
            "smoking history",
            "ACS pattern",
          ],
          reasonsAgainst: ["tearing quality", "back radiation"],
        },
      ],
      fitCheck: {
        label: "Weak fit",
        summary:
          "GORD is a poor fit because it does not explain collapse / syncope, tearing quality, back radiation, sudden onset. GORD would fit better with indigestion-like chest pain, heartburn / retrosternal burning, acid regurgitation and without collapse / syncope, tearing quality, back radiation. Acute aortic syndrome currently provides a better overall explanation.",
        supporting: ["chest pain"],
        conflicting: [
          "sudden onset",
          "tearing quality",
          "back radiation",
          "collapse / syncope",
        ],
      },
      anchorWarning:
        "Your current diagnosis is weakly supported and the case contains red-flag features. Acute aortic syndrome should currently be prioritised above a benign explanation.",
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
          score: 16,
          reasonsFor: [
            "thunderclap onset",
            "headache",
            "vomiting",
            "sudden severe headache pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Meningitis / encephalitis",
          score: 4,
          reasonsFor: ["headache", "vomiting"],
          reasonsAgainst: [],
        },
        {
          name: "Viral illness",
          score: 4,
          reasonsFor: ["headache", "vomiting"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Weak fit",
        summary:
          "Migraine is a poor fit because it does not explain thunderclap onset. Migraine would fit better with photophobia, visual aura and without thunderclap onset. Subarachnoid haemorrhage currently provides a better overall explanation.",
        supporting: ["headache", "vomiting"],
        conflicting: ["thunderclap onset"],
      },
      anchorWarning:
        "Your current diagnosis is weakly supported and the case contains red-flag features. Subarachnoid haemorrhage should currently be prioritised above a benign explanation.",
      presentation:
        "This is a 42-year-old female presenting with headache. Key concerning features include thunderclap onset, vomiting. My leading differential is Subarachnoid haemorrhage, with Meningitis / encephalitis also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: ["thunderclap onset", "headache", "vomiting"],
    },
  },
  {
    id: "sah-alias-vs-meningitis",
    description: "SAH alias with worst headache of life should outrank meningitis",
    input: {
      age: "36",
      sex: "female",
      presentingComplaint: "Headache",
      history: "Worst headache of life with sudden thunderclap onset and vomiting",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "",
      suspectedDiagnosis: "SAH",
    },
    expected: {
      problemRepresentation: "36yo female Headache with thunderclap onset, headache, vomiting",
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
          score: 16,
          reasonsFor: [
            "thunderclap onset",
            "headache",
            "vomiting",
            "sudden severe headache pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Meningitis / encephalitis",
          score: 4,
          reasonsFor: ["headache", "vomiting"],
          reasonsAgainst: [],
        },
        {
          name: "Viral illness",
          score: 4,
          reasonsFor: ["headache", "vomiting"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Strong fit",
        summary: "Subarachnoid haemorrhage is well supported by the current feature pattern.",
        supporting: ["thunderclap onset", "headache", "vomiting"],
        conflicting: [],
      },
      anchorWarning:
        "Your current diagnosis is not obviously undercut by the engine, but keep testing dangerous alternatives before settling.",
      presentation:
        "This is a 36-year-old female presenting with headache. Key concerning features include thunderclap onset, vomiting. My leading differential is Subarachnoid haemorrhage, with Meningitis / encephalitis also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
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
          score: 6,
          reasonsFor: ["confusion", "fever"],
          reasonsAgainst: ["focal neurology"],
        },
        {
          name: "Sepsis",
          score: 6,
          reasonsFor: ["fever", "confusion"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Partial fit",
        summary:
          "Delirium secondary to infection explains part of the case, but does not adequately explain focal neurology.",
        supporting: ["confusion", "fever"],
        conflicting: ["focal neurology"],
      },
      anchorWarning:
        "Keep challenging your anchor. Stroke / neurological emergency currently edges ahead of your chosen diagnosis.",
      presentation:
        "This is a 79-year-old male presenting with confusion. Key concerning features include focal neurology, confusion. Relevant background factors include fever. My leading differential is Stroke / neurological emergency, with Delirium secondary to infection also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: ["confusion", "focal neurology", "fever"],
    },
  },
  {
    id: "mesenteric-ischaemia-vs-gastroenteritis",
    description: "mesenteric ischaemia vs gastroenteritis",
    input: {
      age: "74",
      sex: "male",
      presentingComplaint: "Abdominal pain",
      history: "Sudden severe abdominal pain out of proportion to exam with vomiting and collapse",
      pmh: "atrial fibrillation",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "",
      suspectedDiagnosis: "Gastroenteritis",
    },
    expected: {
      problemRepresentation:
        "74yo male Abdominal pain with sudden onset, collapse / syncope, abdominal pain, pain out of proportion, atrial fibrillation",
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
          name: "Mesenteric ischaemia escalation pattern",
          explanation:
            "Pain out of proportion, especially with atrial fibrillation, collapse, or shock, should escalate mesenteric ischaemia sharply above benign abdominal fallbacks.",
          boostDiagnoses: ["Mesenteric ischaemia"],
          sourceBody: "NICE",
          sourceId: "coverage-gap",
          sourceCoverage: "gap",
        },
      ],
      differentials: [
        {
          name: "Mesenteric ischaemia",
          score: 42,
          reasonsFor: [
            "abdominal pain",
            "pain out of proportion",
            "sudden onset",
            "vomiting",
            "atrial fibrillation",
            "older age",
            "pain out of proportion is highly discriminating for mesenteric ischaemia",
            "vascular or embolic context strongly supports mesenteric ischaemia",
            "pain out of proportion with physiological compromise must escalate mesenteric ischaemia",
            "high-specificity mesenteric emergency pattern",
            "red-flag promotion: Mesenteric ischaemia escalation pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Abdominal aortic aneurysm",
          score: 27,
          reasonsFor: [
            "abdominal pain",
            "sudden onset",
            "collapse / syncope",
            "vomiting",
            "older age",
            "sudden abdominal or back pain with instability fits symptomatic or ruptured AAA",
            "unstable abdominal pain in an older vascular patient must escalate AAA",
            "red-flag promotion: Ruptured AAA suspicion pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Perforated viscus",
          score: 3,
          reasonsFor: ["abdominal pain", "sudden onset", "vomiting"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Weak fit",
        summary:
          "Gastroenteritis is a poor fit because it does not explain collapse / syncope, pain out of proportion, atrial fibrillation. Gastroenteritis would fit better with diarrhoea and without collapse / syncope, pain out of proportion, atrial fibrillation. Mesenteric ischaemia currently provides a better overall explanation.",
        supporting: ["abdominal pain", "vomiting"],
        conflicting: [
          "pain out of proportion",
          "collapse / syncope",
          "atrial fibrillation",
        ],
      },
      anchorWarning:
        "Your current diagnosis is weakly supported and the case contains red-flag features. Mesenteric ischaemia should currently be prioritised above a benign explanation.",
      presentation:
        "This is a 74-year-old male presenting with abdominal pain. Key concerning features include sudden onset, collapse / syncope, abdominal pain, pain out of proportion. Relevant background factors include atrial fibrillation. My leading differential is Mesenteric ischaemia, with Abdominal aortic aneurysm also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: [
        "sudden onset",
        "collapse / syncope",
        "abdominal pain",
        "pain out of proportion",
        "atrial fibrillation",
        "vomiting",
      ],
    },
  },
  {
    id: "pe-vs-pneumonia-vs-pneumothorax",
    description: "PE vs pneumonia vs pneumothorax",
    input: {
      age: "56",
      sex: "female",
      presentingComplaint: "Chest pain and breathlessness",
      history: "Sudden pleuritic chest pain with shortness of breath",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "Sats 88",
      suspectedDiagnosis: "Pneumonia",
    },
    expected: {
      problemRepresentation:
        "56yo female Chest pain and breathlessness with chest pain, sudden onset, shortness of breath, hypoxia, pleuritic pain",
      redFlags: [
        {
          name: "PE suspicion pattern",
          explanation:
            "Chest pain or shortness of breath, especially with collapse or pleuritic features, should prompt formal PE assessment rather than casual exclusion.",
          boostDiagnoses: ["Pulmonary embolism"],
          sourceBody: "NICE",
          sourceId: "NG158",
          sourceCoverage: "full",
        },
      ],
      differentials: [
        {
          name: "Pneumothorax",
          score: 24,
          reasonsFor: [
            "chest pain",
            "shortness of breath",
            "pleuritic pain",
            "hypoxia",
            "sudden onset",
            "pneumothorax pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Pulmonary embolism",
          score: 19,
          reasonsFor: [
            "chest pain",
            "shortness of breath",
            "sudden onset",
            "pleuritic pain",
            "hypoxia",
            "PE pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Acute coronary syndrome",
          score: 6,
          reasonsFor: ["chest pain", "shortness of breath"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Partial fit",
        summary: "Pneumonia explains part of the case, but does not adequately explain sudden onset.",
        supporting: ["shortness of breath", "pleuritic pain", "hypoxia"],
        conflicting: ["sudden onset"],
      },
      anchorWarning:
        "Keep challenging your anchor. Pneumothorax currently edges ahead of your chosen diagnosis.",
      presentation:
        "This is a 56-year-old female presenting with chest pain and breathlessness. Key concerning features include sudden onset, shortness of breath, hypoxia. My leading differential is Pneumothorax, with Pulmonary embolism also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: [
        "chest pain",
        "sudden onset",
        "shortness of breath",
        "hypoxia",
        "pleuritic pain",
      ],
    },
  },
  {
    id: "meningitis-encephalitis-vs-simple-delirium",
    description: "meningitis/encephalitis vs simple delirium",
    input: {
      age: "23",
      sex: "female",
      presentingComplaint: "Confusion",
      history: "Headache, neck stiffness, vomiting and acute confusion",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "fever",
      suspectedDiagnosis: "Delirium secondary to infection",
    },
    expected: {
      problemRepresentation:
        "23yo female Confusion with headache, vomiting, neck stiffness, confusion, fever",
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
        {
          name: "Headache urgent evaluation pattern",
          explanation:
            "Sudden severe headache, especially with vomiting, neurological features, or reduced consciousness, should not be reassured as a simple primary headache.",
          boostDiagnoses: ["Subarachnoid haemorrhage", "Stroke / neurological emergency"],
          sourceBody: "NICE",
          sourceId: "CG150",
          sourceCoverage: "full",
        },
        {
          name: "Meningitis / encephalitis suspicion pattern",
          explanation:
            "This feature cluster should raise urgent concern for meningitis or encephalitis, but the current WardBrain rule is an internal educational pattern rather than a fully source-complete NICE-derived trigger.",
          boostDiagnoses: ["Meningitis / encephalitis"],
          sourceBody: "NICE",
          sourceId: "coverage-gap",
          sourceCoverage: "gap",
        },
      ],
      differentials: [
        {
          name: "Meningitis / encephalitis",
          score: 17,
          reasonsFor: [
            "confusion",
            "fever",
            "headache",
            "neck stiffness",
            "vomiting",
            "meningitis / encephalitis pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Delirium secondary to infection",
          score: 6,
          reasonsFor: ["confusion", "fever"],
          reasonsAgainst: [],
        },
        {
          name: "Sepsis",
          score: 6,
          reasonsFor: ["fever", "confusion"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Partial fit",
        summary:
          "Delirium secondary to infection explains part of the case, but competing diagnoses may fit as well or better.",
        supporting: ["confusion", "fever"],
        conflicting: [],
      },
      anchorWarning:
        "Keep challenging your anchor. Meningitis / encephalitis currently edges ahead of your chosen diagnosis.",
      presentation:
        "This is a 23-year-old female presenting with confusion. Key concerning features include neck stiffness, vomiting, confusion. Relevant background factors include fever. My leading differential is Meningitis / encephalitis, with Delirium secondary to infection also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: [
        "headache",
        "vomiting",
        "neck stiffness",
        "confusion",
        "fever",
      ],
    },
  },
  {
    id: "pneumothorax-with-unilateral-air-entry-sign",
    description: "sudden pleuritic chest pain with sob and unilateral reduced air entry should rank pneumothorax above PE",
    input: {
      age: "29",
      sex: "male",
      presentingComplaint: "Chest pain and shortness of breath",
      history: "Sudden pleuritic chest pain with unilateral reduced air entry on the left",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "",
      suspectedDiagnosis: "Pulmonary embolism",
    },
    expected: {
      problemRepresentation:
        "29yo male Chest pain and shortness of breath with chest pain, sudden onset, unilateral reduced air entry, shortness of breath, pleuritic pain",
      redFlags: [
        {
          name: "PE suspicion pattern",
          explanation:
            "Chest pain or shortness of breath, especially with collapse or pleuritic features, should prompt formal PE assessment rather than casual exclusion.",
          boostDiagnoses: ["Pulmonary embolism"],
          sourceBody: "NICE",
          sourceId: "NG158",
          sourceCoverage: "full",
        },
      ],
      differentials: [
        {
          name: "Pneumothorax",
          score: 34,
          reasonsFor: [
            "chest pain",
            "shortness of breath",
            "pleuritic pain",
            "sudden onset",
            "unilateral reduced air entry",
            "pneumothorax pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Pulmonary embolism",
          score: 9,
          reasonsFor: ["chest pain", "shortness of breath", "sudden onset", "pleuritic pain"],
          reasonsAgainst: ["unilateral reduced air entry"],
        },
      ],
      fitCheck: {
        label: "Strong fit",
        summary: "Pulmonary embolism is well supported by the current feature pattern.",
        supporting: ["chest pain", "shortness of breath", "sudden onset", "pleuritic pain"],
        conflicting: ["unilateral reduced air entry"],
      },
      anchorWarning:
        "Keep challenging your anchor. Pneumothorax currently edges ahead of your chosen diagnosis.",
      presentation:
        "This is a 29-year-old male presenting with chest pain and shortness of breath. Key concerning features include sudden onset, shortness of breath. My leading differential is Pneumothorax, with Pulmonary embolism also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: [
        "chest pain",
        "sudden onset",
        "unilateral reduced air entry",
        "shortness of breath",
        "pleuritic pain",
      ],
    },
  },
  {
    id: "acute-chest-pain-sob-should-prioritise-pe",
    description: "acute chest pain + sob + tachycardia + tachypnoea should prioritise PE over sepsis and pneumothorax",
    input: {
      age: "58",
      sex: "female",
      presentingComplaint: "Chest pain and shortness of breath",
      history: "Sudden onset chest pain and shortness of breath",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "No pleuritic pain, no fever",
      observations: "HR 130, RR 30, sats 96%",
      suspectedDiagnosis: "Pneumothorax",
    },
    expected: {
      problemRepresentation:
        "58yo female Chest pain and shortness of breath with chest pain, sudden onset, shortness of breath, tachypnoea, tachycardia",
      redFlags: [
        {
          name: "PE suspicion pattern",
          explanation:
            "Chest pain or shortness of breath, especially with collapse or pleuritic features, should prompt formal PE assessment rather than casual exclusion.",
          boostDiagnoses: ["Pulmonary embolism"],
          sourceBody: "NICE",
          sourceId: "NG158",
          sourceCoverage: "full",
        },
      ],
      differentials: [
        {
          name: "Pulmonary embolism",
          score: 20,
          reasonsFor: [
            "chest pain",
            "shortness of breath",
            "sudden onset",
            "tachycardia",
            "tachypnoea",
            "PE pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Acute coronary syndrome",
          score: 6,
          reasonsFor: ["chest pain", "shortness of breath"],
          reasonsAgainst: [],
        },
        {
          name: "Pneumothorax",
          score: 5,
          reasonsFor: ["chest pain", "shortness of breath", "sudden onset"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Partial fit",
        summary: "Pneumothorax explains part of the case, but competing diagnoses may fit as well or better.",
        supporting: ["chest pain", "shortness of breath", "sudden onset"],
        conflicting: [],
      },
      anchorWarning:
        "Keep challenging your anchor. Pulmonary embolism currently edges ahead of your chosen diagnosis.",
      presentation:
        "This is a 58-year-old female presenting with chest pain and shortness of breath. Key concerning features include sudden onset, tachycardia, tachypnoea, shortness of breath. My leading differential is Pulmonary embolism, with Acute coronary syndrome also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: [
        "chest pain",
        "sudden onset",
        "shortness of breath",
        "tachypnoea",
        "tachycardia",
      ],
    },
  },
  {
    id: "acs-alias-classic-chest-pain-pattern",
    description: "ACS alias should recognise classic ischemic chest pain pattern",
    input: {
      age: "61",
      sex: "male",
      presentingComplaint: "Chest pain",
      history:
        "Central chest pain radiating to the jaw and left arm with sweating and nausea. He thought it was indigestion.",
      pmh: "known hypertension",
      meds: "",
      social: "current smoker",
      keyPositives: "",
      keyNegatives: "",
      observations: "",
      suspectedDiagnosis: "ACS",
    },
    expected: {
      problemRepresentation:
        "61yo male Chest pain with chest pain, smoking history, hypertension, jaw pain, arm pain",
      redFlags: [
        {
          name: "ACS suspicion pattern",
          explanation:
            "Chest pain or a chest-pain-equivalent pattern such as indigestion-like epigastric discomfort, especially with autonomic features or radiation, should keep acute coronary syndrome high on the differential.",
          boostDiagnoses: ["Acute coronary syndrome"],
          sourceBody: "NICE",
          sourceId: "CG95",
          sourceCoverage: "full",
        },
      ],
      differentials: [
        {
          name: "Acute coronary syndrome",
          score: 27,
          reasonsFor: [
            "chest pain",
            "jaw pain",
            "arm pain",
            "sweating",
            "nausea",
            "indigestion-like chest pain",
            "hypertension",
            "smoking history",
            "ACS pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Acute aortic syndrome",
          score: 4,
          reasonsFor: ["chest pain", "hypertension"],
          reasonsAgainst: [],
        },
        {
          name: "Pulmonary embolism",
          score: 3,
          reasonsFor: ["chest pain"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Strong fit",
        summary: "Acute coronary syndrome is well supported by the current feature pattern.",
        supporting: [
          "chest pain",
          "jaw pain",
          "arm pain",
          "sweating",
          "nausea",
          "indigestion-like chest pain",
          "hypertension",
          "smoking history",
        ],
        conflicting: [],
      },
      anchorWarning:
        "Your current diagnosis is not obviously undercut by the engine, but keep testing dangerous alternatives before settling.",
      presentation:
        "This is a 61-year-old male presenting with chest pain. Relevant background factors include hypertension, smoking history. My leading differential is Acute coronary syndrome, with Acute aortic syndrome also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: [
        "chest pain",
        "smoking history",
        "hypertension",
        "jaw pain",
        "arm pain",
        "sweating",
        "nausea",
        "indigestion-like chest pain",
      ],
    },
  },
  {
    id: "gi-bleed-with-instability",
    description: "GI bleed with instability",
    input: {
      age: "67",
      sex: "male",
      presentingComplaint: "Collapse",
      history: "Collapsed after vomiting blood with melaena and blood per rectum",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "HR 130, systolic 70",
      suspectedDiagnosis: "Gastroenteritis",
    },
    expected: {
      problemRepresentation:
        "67yo male Collapse with collapse / syncope, PR bleeding, melaena, haematemesis, vomiting",
      redFlags: [
        {
          name: "GI bleed instability pattern",
          explanation:
            "Haematemesis, melaena, or rectal bleeding with haemodynamic compromise should raise urgent concern for unstable gastrointestinal bleeding.",
          boostDiagnoses: ["GI bleed"],
          sourceBody: "NICE",
          sourceId: "NG24",
          sourceCoverage: "partial",
        },
      ],
      differentials: [
        {
          name: "GI bleed",
          score: 23,
          reasonsFor: [
            "GI bleed evidence",
            "PR bleeding",
            "melaena",
            "haematemesis",
            "collapse / syncope",
            "hypotension / shock",
            "tachycardia",
            "vomiting",
            "GI bleed instability pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Subarachnoid haemorrhage",
          score: 4,
          reasonsFor: ["vomiting", "collapse / syncope"],
          reasonsAgainst: [],
        },
        {
          name: "Abdominal aortic aneurysm",
          score: 3,
          reasonsFor: ["collapse / syncope", "hypotension / shock"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Weak fit",
        summary:
          "Gastroenteritis is a poor fit because it does not explain collapse / syncope, hypotension / shock, GI bleed evidence, PR bleeding. Gastroenteritis would fit better with abdominal pain, diarrhoea and without collapse / syncope, hypotension / shock, GI bleed evidence. GI bleed currently provides a better overall explanation.",
        supporting: ["vomiting"],
        conflicting: [
          "collapse / syncope",
          "hypotension / shock",
          "GI bleed evidence",
          "PR bleeding",
        ],
      },
      anchorWarning:
        "Your current diagnosis is weakly supported and the case contains red-flag features. GI bleed should currently be prioritised above a benign explanation.",
      presentation:
        "This is a 67-year-old male presenting with collapse. Key concerning features include collapse / syncope, tachycardia, vomiting, melaena. Relevant background factors include hypotension / shock. My leading differential is GI bleed, with Subarachnoid haemorrhage also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: [
        "collapse / syncope",
        "PR bleeding",
        "melaena",
        "haematemesis",
        "vomiting",
        "hypotension / shock",
        "tachycardia",
        "GI bleed evidence",
      ],
    },
  },
  {
    id: "sepsis-vs-viral-illness",
    description: "sepsis vs viral illness",
    input: {
      age: "81",
      sex: "male",
      presentingComplaint: "Fever and confusion",
      history: "New confusion with breathlessness and fever",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "Temp 39, HR 130, RR 32, systolic 70",
      suspectedDiagnosis: "Viral illness",
    },
    expected: {
      problemRepresentation:
        "81yo male Fever and confusion with confusion, shortness of breath, fever, hypotension / shock, tachycardia",
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
        {
          name: "High-risk sepsis pattern",
          explanation:
            "Infection with physiological instability such as hypotension, tachycardia, or tachypnoea should trigger sepsis escalation rather than low-acuity viral framing.",
          boostDiagnoses: ["Sepsis"],
          sourceBody: "NICE",
          sourceId: "NG51",
          sourceCoverage: "partial",
        },
      ],
      differentials: [
        {
          name: "Sepsis",
          score: 15,
          reasonsFor: [
            "fever",
            "hypotension / shock",
            "tachycardia",
            "tachypnoea",
            "confusion",
            "shortness of breath",
            "sepsis pattern",
          ],
          reasonsAgainst: [],
        },
        {
          name: "Delirium secondary to infection",
          score: 8,
          reasonsFor: ["confusion", "fever"],
          reasonsAgainst: [],
        },
        {
          name: "Pneumonia",
          score: 5,
          reasonsFor: ["shortness of breath", "fever"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Weak fit",
        summary:
          "Viral illness is a poor fit because it does not explain hypotension / shock, confusion. Viral illness would fit better without hypotension / shock, confusion. Sepsis currently provides a better overall explanation.",
        supporting: ["fever"],
        conflicting: ["hypotension / shock", "confusion"],
      },
      anchorWarning:
        "Your current diagnosis is weakly supported and the case contains red-flag features. Sepsis should currently be prioritised above a benign explanation.",
      presentation:
        "This is a 81-year-old male presenting with fever and confusion. Key concerning features include tachycardia, tachypnoea, shortness of breath, confusion. Relevant background factors include hypotension / shock, fever. My leading differential is Sepsis, with Delirium secondary to infection also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: [
        "confusion",
        "shortness of breath",
        "fever",
        "hypotension / shock",
        "tachycardia",
        "tachypnoea",
      ],
    },
  },
  {
    id: "generic-instability-should-not-overpromote-gi-bleed",
    description: "generic instability should not overpromote GI bleed without bleeding clues",
    input: {
      age: "71",
      sex: "male",
      presentingComplaint: "Collapse",
      history: "Collapsed and feels weak",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "BP 85/50, HR 130",
      suspectedDiagnosis: "GI bleed",
    },
    expected: {
      problemRepresentation:
        "71yo male Collapse with collapse / syncope, tachycardia, hypotension / shock",
      redFlags: [],
      differentials: [
        {
          name: "GI bleed",
          score: 4,
          reasonsFor: ["collapse / syncope", "hypotension / shock", "tachycardia"],
          reasonsAgainst: [],
        },
        {
          name: "Abdominal aortic aneurysm",
          score: 3,
          reasonsFor: ["collapse / syncope", "hypotension / shock"],
          reasonsAgainst: [],
        },
        {
          name: "Pulmonary embolism",
          score: 3,
          reasonsFor: ["tachycardia", "collapse / syncope"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Partial fit",
        summary: "GI bleed explains part of the case, but competing diagnoses may fit as well or better.",
        supporting: ["collapse / syncope", "hypotension / shock", "tachycardia"],
        conflicting: [],
      },
      anchorWarning:
        "Your current diagnosis is not obviously undercut by the engine, but keep testing dangerous alternatives before settling.",
      presentation:
        "This is a 71-year-old male presenting with collapse. Key concerning features include collapse / syncope, tachycardia. Relevant background factors include hypotension / shock. My leading differential is GI bleed, with Abdominal aortic aneurysm also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: ["collapse / syncope", "tachycardia", "hypotension / shock"],
    },
  },
  {
    id: "generic-instability-should-not-overpromote-sepsis",
    description: "generic instability should not overpromote sepsis without infection context",
    input: {
      age: "63",
      sex: "female",
      presentingComplaint: "Collapse",
      history: "Collapsed with dizziness",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "BP 85/50, HR 130, RR 30",
      suspectedDiagnosis: "Sepsis",
    },
    expected: {
      problemRepresentation:
        "63yo female Collapse with collapse / syncope, tachycardia, tachypnoea, hypotension / shock",
      redFlags: [],
      differentials: [
        {
          name: "GI bleed",
          score: 4,
          reasonsFor: ["collapse / syncope", "hypotension / shock", "tachycardia"],
          reasonsAgainst: [],
        },
        {
          name: "Abdominal aortic aneurysm",
          score: 3,
          reasonsFor: ["collapse / syncope", "hypotension / shock"],
          reasonsAgainst: [],
        },
        {
          name: "Pulmonary embolism",
          score: 3,
          reasonsFor: ["tachycardia", "tachypnoea", "collapse / syncope"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Partial fit",
        summary: "Sepsis explains part of the case, but competing diagnoses may fit as well or better.",
        supporting: ["hypotension / shock", "tachycardia", "tachypnoea", "collapse / syncope"],
        conflicting: [],
      },
      anchorWarning:
        "Keep challenging your anchor. GI bleed currently edges ahead of your chosen diagnosis.",
      presentation:
        "This is a 63-year-old female presenting with collapse. Key concerning features include collapse / syncope, tachycardia, tachypnoea. Relevant background factors include hypotension / shock. My leading differential is GI bleed, with Abdominal aortic aneurysm also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: [
        "collapse / syncope",
        "tachycardia",
        "tachypnoea",
        "hypotension / shock",
      ],
    },
  },
  {
    id: "generic-instability-should-not-overpromote-pneumothorax",
    description: "generic chest pain sudden onset hypoxia should not overpromote pneumothorax without signature features",
    input: {
      age: "47",
      sex: "male",
      presentingComplaint: "Chest pain",
      history: "Sudden chest pain",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "No shortness of breath, no pleuritic pain",
      observations: "sats 88%",
      suspectedDiagnosis: "Pneumothorax",
    },
    expected: {
      problemRepresentation: "47yo male Chest pain with chest pain, hypoxia",
      redFlags: [],
      differentials: [
        {
          name: "Pulmonary embolism",
          score: 5,
          reasonsFor: ["chest pain", "hypoxia"],
          reasonsAgainst: [],
        },
        {
          name: "Acute coronary syndrome",
          score: 2,
          reasonsFor: ["chest pain"],
          reasonsAgainst: [],
        },
      ],
      fitCheck: {
        label: "Weak fit",
        summary:
          "Pneumothorax is currently a weak fit and is being outperformed by a more plausible explanation. Pneumothorax would fit better with pleuritic pain, shortness of breath, sudden onset.",
        supporting: ["chest pain", "hypoxia"],
        conflicting: [],
      },
      anchorWarning:
        "Your current diagnosis looks too narrow. Pulmonary embolism currently explains the pattern better.",
      presentation:
        "This is a 47-year-old male presenting with chest pain. Key concerning features include hypoxia. My leading differential is Pulmonary embolism, with Acute coronary syndrome also important to exclude. I would not settle on a benign explanation until dangerous alternatives have been addressed.",
      detectedFeatures: ["chest pain", "hypoxia"],
    },
  },
];
