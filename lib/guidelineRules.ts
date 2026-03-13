export type GuidelineRule = {
  id: string;
  title: string;
  sourceBody: "NICE" | "GMC" | "HSCNI";
  sourceId: string;
  sourceCoverage: "full" | "partial" | "gap";
  rationale: string;
  triggers: string[];
  boostDiagnoses: string[];
  requiredAnyFeatures?: string[];
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
    requiredAnyFeatures: ["abdominalPain", "backRadiation", "pulsatileAbdomen"],
  },
  {
    id: "nice-cg95-acs-001",
    title: "ACS suspicion pattern",
    sourceBody: "NICE",
    sourceId: "CG95",
    sourceCoverage: "full",
    rationale:
      "Chest pain with associated concerning features such as collapse, breathlessness, or haemodynamic instability should keep acute coronary syndrome high on the differential.",
    triggers: ["chestPain", "jawPain", "armPain", "indigestionLikeChestPain", "collapse", "sob", "hypotension", "hypertension", "sweating"],
    boostDiagnoses: ["Acute coronary syndrome"],
    requiredAnyFeatures: ["chestPain", "jawPain", "armPain", "indigestionLikeChestPain"],
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
    requiredAnyFeatures: ["chestPain", "sob", "pleuriticPain"],
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
    requiredAnyFeatures: ["confusion"],
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
    requiredAnyFeatures: ["thunderclap", "headache", "focalNeurology"],
  },
  {
    id: "nice-ng143-meningitis-001",
    title: "Meningitis / encephalitis suspicion pattern",
    sourceBody: "NICE",
    sourceId: "NG143",
    sourceCoverage: "partial",
    rationale:
      "Fever with severe headache or neck stiffness should prompt urgent consideration of meningitis or encephalitis rather than reassurance as a simple infective delirium or viral syndrome.",
    triggers: ["fever", "headache", "neckStiffness", "photophobia", "recentInfection", "sharedAccommodation"],
    boostDiagnoses: ["Meningitis / encephalitis"],
    requiredAnyFeatures: ["fever", "headache", "neckStiffness", "photophobia"],
  },
  {
    id: "nice-ng51-sepsis-001",
    title: "High-risk sepsis pattern",
    sourceBody: "NICE",
    sourceId: "NG51",
    sourceCoverage: "partial",
    rationale:
      "Infection with physiological instability such as hypotension, tachycardia, or tachypnoea should trigger sepsis escalation rather than low-acuity viral framing.",
    triggers: ["fever", "tachycardia", "tachypnoea", "infectionSource"],
    boostDiagnoses: ["Sepsis"],
    requiredAnyFeatures: ["fever", "hypothermia", "rigors", "infectionSource"],
  },
  {
    id: "nice-ng24-gi-bleed-001",
    title: "GI bleed instability pattern",
    sourceBody: "NICE",
    sourceId: "NG24",
    sourceCoverage: "partial",
    rationale:
      "Haematemesis, melaena, or rectal bleeding with haemodynamic compromise should raise urgent concern for unstable gastrointestinal bleeding.",
    triggers: ["giBleed", "prBleeding", "melaena", "haematemesis", "collapse"],
    boostDiagnoses: ["GI bleed"],
    requiredAnyFeatures: ["giBleed", "prBleeding", "melaena", "haematemesis"],
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
