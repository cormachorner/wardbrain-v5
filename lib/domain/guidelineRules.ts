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
      "Chest pain or a chest-pain-equivalent pattern such as indigestion-like epigastric discomfort, especially with autonomic features or radiation, should keep acute coronary syndrome high on the differential.",
    triggers: [
      "chestPain",
      "jawPain",
      "armPain",
      "indigestionLikeChestPain",
      "nausea",
      "collapse",
      "sob",
      "hypotension",
      "hypertension",
      "sweating",
    ],
    boostDiagnoses: ["Acute coronary syndrome"],
    requiredAnyFeatures: ["jawPain", "armPain", "indigestionLikeChestPain", "sweating", "nausea"],
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
    id: "wardbrain-gap-mesenteric-001",
    title: "Mesenteric ischaemia escalation pattern",
    sourceBody: "NICE",
    sourceId: "coverage-gap",
    sourceCoverage: "gap",
    rationale:
      "Pain out of proportion or severe pain with a mild abdominal examination, especially with atrial fibrillation, vascular disease, or older age, should escalate mesenteric ischaemia sharply above benign abdominal fallbacks.",
    triggers: [
      "abdominalPain",
      "painOutOfProportion",
      "painSevereButExamMild",
      "af",
      "vascularDisease",
      "olderAge",
      "collapse",
      "hypotension",
    ],
    boostDiagnoses: ["Mesenteric ischaemia"],
    requiredAnyFeatures: ["painOutOfProportion", "painSevereButExamMild"],
  },
  {
    id: "wardbrain-gap-perforation-001",
    title: "Perforated viscus / peritonitis pattern",
    sourceBody: "NICE",
    sourceId: "coverage-gap",
    sourceCoverage: "gap",
    rationale:
      "Sudden abdominal pain with guarding, rigidity, or lying still because of pain should escalate perforated viscus or peritonitis above softer upper abdominal diagnoses.",
    triggers: [
      "abdominalPain",
      "suddenOnset",
      "guardingRigidity",
      "abdominalMovementPain",
      "lyingStill",
      "hypotension",
    ],
    boostDiagnoses: ["Perforated viscus"],
    requiredAnyFeatures: ["guardingRigidity", "lyingStill"],
  },
  {
    id: "wardbrain-gap-tia-001",
    title: "Transient focal neurological pattern",
    sourceBody: "NICE",
    sourceId: "coverage-gap",
    sourceCoverage: "gap",
    rationale:
      "A sudden transient focal deficit should not be dismissed as benign just because symptoms have improved or resolved.",
    triggers: ["focalNeurology", "transientFocalDeficit", "suddenOnset"],
    boostDiagnoses: ["TIA", "Stroke / neurological emergency"],
    requiredAnyFeatures: ["transientFocalDeficit", "focalNeurology"],
  },
  {
    id: "wardbrain-gap-cauda-001",
    title: "Cauda equina pattern",
    sourceBody: "NICE",
    sourceId: "coverage-gap",
    sourceCoverage: "gap",
    rationale:
      "Urinary retention, saddle sensory change, or bilateral leg symptoms with back pain should escalate cauda equina syndrome urgently.",
    triggers: ["backPain", "urinaryRetention", "saddleNumbness", "bilateralLegSymptoms"],
    boostDiagnoses: ["Cauda equina syndrome"],
    requiredAnyFeatures: ["urinaryRetention", "saddleNumbness", "bilateralLegSymptoms"],
  },
  {
    id: "wardbrain-gap-ectopic-001",
    title: "Ectopic pregnancy pattern",
    sourceBody: "NICE",
    sourceId: "coverage-gap",
    sourceCoverage: "gap",
    rationale:
      "Pregnancy possibility with abdominal or pelvic pain and vaginal bleeding should strongly escalate ectopic pregnancy, especially if there is collapse or shock.",
    triggers: ["pregnancyPossible", "missedPeriod", "vaginalBleeding", "abdominalPain", "pelvicPain", "collapse", "hypotension"],
    boostDiagnoses: ["Ectopic pregnancy"],
    requiredAnyFeatures: ["vaginalBleeding", "pregnancyPossible", "missedPeriod"],
  },
  {
    id: "wardbrain-gap-torsion-001",
    title: "Testicular torsion pattern",
    sourceBody: "NICE",
    sourceId: "coverage-gap",
    sourceCoverage: "gap",
    rationale:
      "Sudden unilateral testicular pain with vomiting should escalate testicular torsion rather than being absorbed into generic abdominal pain.",
    triggers: ["unilateralTesticularPain", "suddenOnset", "vomiting"],
    boostDiagnoses: ["Testicular torsion"],
    requiredAnyFeatures: ["unilateralTesticularPain"],
  },
  {
    id: "wardbrain-gap-hypoglycaemia-001",
    title: "Hypoglycaemia urgent reversible-cause pattern",
    sourceBody: "NICE",
    sourceId: "coverage-gap",
    sourceCoverage: "gap",
    rationale:
      "Diabetic context with sweating, shakiness, collapse, or confusion should keep hypoglycaemia high as an urgent reversible cause.",
    triggers: ["diabeticContext", "hypoglycaemiaCue", "sweating", "confusion", "collapse"],
    boostDiagnoses: ["Hypoglycaemia"],
    requiredAnyFeatures: ["diabeticContext", "hypoglycaemiaCue"],
  },
  {
    id: "wardbrain-gap-meningitis-001",
    title: "Meningitis / encephalitis suspicion pattern",
    sourceBody: "NICE",
    sourceId: "coverage-gap",
    sourceCoverage: "gap",
    rationale:
      "This feature cluster should raise urgent concern for meningitis or encephalitis, but the current WardBrain rule is an internal educational pattern rather than a fully source-complete NICE-derived trigger.",
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
    id: "nice-cg188-cholangitis-001",
    title: "Acute cholangitis pattern",
    sourceBody: "NICE",
    sourceId: "CG188",
    sourceCoverage: "partial",
    rationale:
      "RUQ pain with jaundice and fever or rigors should raise urgent concern for acute cholangitis rather than being treated as uncomplicated biliary pain.",
    triggers: [
      "ruqPain",
      "jaundice",
      "fever",
      "rigors",
      "darkUrine",
      "paleStools",
    ],
    boostDiagnoses: ["Acute cholangitis"],
    requiredAnyFeatures: ["jaundice", "rigors"],
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
