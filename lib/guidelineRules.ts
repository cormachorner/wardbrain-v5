export type GuidelineRule = {
  id: string;
  title: string;
  sourceBody: "NICE" | "GMC" | "HSCNI";
  sourceId: string;
  sourceCoverage: "full" | "partial" | "gap";
  rationale: string;
  triggers: string[];
  boostDiagnoses: string[];
};

export const GUIDELINE_RULES: GuidelineRule[] = [
  {
    id: "nice-ng156-aaa-001",
    title: "Ruptured AAA suspicion pattern",
    sourceBody: "NICE",
    sourceId: "NG156",
    sourceCoverage: "full",
    rationale:
      "New abdominal or back pain with collapse or loss of consciousness, especially in an older person with smoking history or hypertension, should push ruptured or symptomatic AAA higher.",
    triggers: [
      "abdominalPain",
      "backRadiation",
      "collapse",
      "pulsatileAbdomen",
      "smoker",
      "hypertension",
      "hypotension",
    ],
    boostDiagnoses: ["Abdominal aortic aneurysm"],
  },
  {
    id: "nice-cg95-acs-001",
    title: "ACS suspicion pattern",
    sourceBody: "NICE",
    sourceId: "CG95",
    sourceCoverage: "full",
    rationale:
      "Chest pain with associated concerning features such as collapse, breathlessness, or haemodynamic instability should keep acute coronary syndrome high on the differential.",
    triggers: ["chestPain", "collapse", "sob", "hypotension", "hypertension"],
    boostDiagnoses: ["Acute coronary syndrome"],
  },
  {
    id: "nice-ng158-pe-001",
    title: "PE suspicion pattern",
    sourceBody: "NICE",
    sourceId: "NG158",
    sourceCoverage: "full",
    rationale:
      "Chest pain or shortness of breath, especially with collapse or pleuritic features, should prompt formal PE assessment rather than casual exclusion.",
    triggers: ["chestPain", "sob", "collapse", "pleuriticPain"],
    boostDiagnoses: ["Pulmonary embolism"],
  },
  {
    id: "nice-cg103-delirium-001",
    title: "Think delirium pattern",
    sourceBody: "NICE",
    sourceId: "CG103",
    sourceCoverage: "full",
    rationale:
      "An acute change in mental state or behaviour over hours to days should trigger active consideration of delirium and a search for the precipitant.",
    triggers: ["confusion", "fever"],
    boostDiagnoses: ["Delirium secondary to infection"],
  },
  {
    id: "nice-cg150-headache-001",
    title: "Headache urgent evaluation pattern",
    sourceBody: "NICE",
    sourceId: "CG150",
    sourceCoverage: "full",
    rationale:
      "Sudden severe headache, especially with vomiting, neurological features, or reduced consciousness, should not be reassured as a simple primary headache.",
    triggers: ["thunderclap", "headache", "vomiting", "focalNeurology", "collapse"],
    boostDiagnoses: ["Subarachnoid haemorrhage", "Stroke / neurological emergency"],
  },
  {
    id: "gmc-ai-001",
    title: "AI is advisory, not decisive",
    sourceBody: "GMC",
    sourceId: "GMC-AI",
    sourceCoverage: "full",
    rationale:
      "This tool should support reasoning and presentation, but must not replace supervision, professional judgement, or escalation to a senior clinician.",
    triggers: [],
    boostDiagnoses: [],
  },
];
