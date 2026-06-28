export type GuidelineSourceStatus =
  | "current"
  | "replaced"
  | "partial"
  | "coverage-gap"
  | "external-summary-only";

export type GuidelineSource = {
  id: string;
  title: string;
  source: "NICE" | "BTS/NICE/SIGN" | "WardBrain";
  url: string;
  licenceStatus: string;
  status: GuidelineSourceStatus;
  lastReviewed: string;
  appliesToDiagnosisSlugs: string[];
  appliesToRedFlagSlugs: string[];
  presentationBlocks: string[];
  shortTeachingSummary: string;
};

export type GuidelineSupportMatch = {
  source: GuidelineSource;
  matchedDiagnosisSlugs: string[];
  matchedRedFlagSlugs: string[];
  matchedPresentationBlocks: string[];
};

export type GuidelineSupport = {
  sources: GuidelineSupportMatch[];
};

export const GUIDELINE_REGISTRY: GuidelineSource[] = [
  {
    id: "nice-cg95-chest-pain",
    title: "Recent-onset chest pain of suspected cardiac origin: assessment and diagnosis",
    source: "NICE",
    url: "https://www.nice.org.uk/guidance/cg95",
    licenceStatus: "Linked source with WardBrain-authored short summary only; no bulk NICE content copied.",
    status: "current",
    lastReviewed: "2019-09-04",
    appliesToDiagnosisSlugs: ["acute-coronary-syndrome"],
    appliesToRedFlagSlugs: ["acs-suspicion-pattern"],
    presentationBlocks: ["chest-pain"],
    shortTeachingSummary:
      "Recent central chest discomfort, equivalent symptoms, radiation, autonomic features, or risk context should keep ACS prominent and prompt senior-led assessment.",
  },
  {
    id: "nice-ng158-vte",
    title: "Venous thromboembolic diseases: diagnosis, management and thrombophilia testing",
    source: "NICE",
    url: "https://www.nice.org.uk/guidance/ng158",
    licenceStatus: "Linked source with WardBrain-authored short summary only; no bulk NICE content copied.",
    status: "current",
    lastReviewed: "2026-05-01",
    appliesToDiagnosisSlugs: ["pulmonary-embolism"],
    appliesToRedFlagSlugs: ["pe-suspicion-pattern"],
    presentationBlocks: ["breathlessness", "chest-pain"],
    shortTeachingSummary:
      "Breathlessness or pleuritic pain with VTE-specific signals should trigger formal PE/DVT reasoning rather than casual exclusion.",
  },
  {
    id: "nice-ng156-aaa",
    title: "Abdominal aortic aneurysm: diagnosis and management",
    source: "NICE",
    url: "https://www.nice.org.uk/guidance/ng156",
    licenceStatus: "Linked source with WardBrain-authored short summary only; no bulk NICE content copied.",
    status: "current",
    lastReviewed: "2020-03-19",
    appliesToDiagnosisSlugs: ["abdominal-aortic-aneurysm"],
    appliesToRedFlagSlugs: ["ruptured-aaa-suspicion-pattern"],
    presentationBlocks: ["acute-abdominal-pain"],
    shortTeachingSummary:
      "Older or vascular-risk patients with abdominal, back, or flank pain plus collapse or hypotension need AAA actively considered.",
  },
  {
    id: "nice-cg188-gallstone-disease",
    title: "Gallstone disease: diagnosis and management",
    source: "NICE",
    url: "https://www.nice.org.uk/guidance/cg188",
    licenceStatus: "Linked source with WardBrain-authored short summary only; no bulk NICE content copied.",
    status: "current",
    lastReviewed: "2014-10-29",
    appliesToDiagnosisSlugs: [
      "acute-cholangitis",
      "acute-cholecystitis",
      "choledocholithiasis-obstructive-jaundice",
      "biliary-colic-gallstone-disease",
    ],
    appliesToRedFlagSlugs: ["acute-cholangitis-pattern"],
    presentationBlocks: ["acute-abdominal-pain", "ruq-pain-jaundice"],
    shortTeachingSummary:
      "RUQ pain with jaundice, fever, rigors, or cholestatic symptoms should separate cholangitis/obstruction from uncomplicated biliary colic.",
  },
  {
    id: "nice-ng126-ectopic-pregnancy",
    title: "Ectopic pregnancy and miscarriage: diagnosis and initial management",
    source: "NICE",
    url: "https://www.nice.org.uk/guidance/ng126",
    licenceStatus: "Linked source with WardBrain-authored short summary only; no bulk NICE content copied.",
    status: "current",
    lastReviewed: "2026-06-17",
    appliesToDiagnosisSlugs: ["ectopic-pregnancy"],
    appliesToRedFlagSlugs: ["ectopic-pregnancy-pattern"],
    presentationBlocks: ["acute-abdominal-pain"],
    shortTeachingSummary:
      "Early pregnancy possibility with abdominal or pelvic pain, bleeding, collapse, or instability should keep ectopic pregnancy high.",
  },
  {
    id: "nice-ng253-sepsis-adults",
    title: "Suspected sepsis in people aged 16 or over: recognition, assessment and early management",
    source: "NICE",
    url: "https://www.nice.org.uk/guidance/ng253",
    licenceStatus: "Linked source with WardBrain-authored short summary only; no bulk NICE content copied.",
    status: "current",
    lastReviewed: "2025-12-05",
    appliesToDiagnosisSlugs: ["sepsis", "uti-urosepsis", "delirium-secondary-to-infection"],
    appliesToRedFlagSlugs: ["high-risk-sepsis-pattern"],
    presentationBlocks: ["breathlessness", "confusion-delirium", "acute-abdominal-pain"],
    shortTeachingSummary:
      "Infection plus abnormal physiology or acute mental-state change should prompt structured sepsis risk assessment and source search.",
  },
  {
    id: "nice-cg103-delirium",
    title: "Delirium: prevention, diagnosis and management in hospital and long-term care",
    source: "NICE",
    url: "https://www.nice.org.uk/guidance/cg103",
    licenceStatus: "Linked source with WardBrain-authored short summary only; no bulk NICE content copied.",
    status: "current",
    lastReviewed: "2023-01-18",
    appliesToDiagnosisSlugs: ["delirium-secondary-to-infection"],
    appliesToRedFlagSlugs: ["think-delirium-pattern"],
    presentationBlocks: ["confusion-delirium"],
    shortTeachingSummary:
      "Acute change in attention, cognition, perception, or behaviour should be treated as delirium until assessed and precipitating causes are sought.",
  },
  {
    id: "nice-ng245-asthma",
    title: "Asthma: diagnosis, monitoring and chronic asthma management (BTS, NICE, SIGN)",
    source: "BTS/NICE/SIGN",
    url: "https://www.nice.org.uk/guidance/ng245",
    licenceStatus: "Linked source with WardBrain-authored short summary only; no bulk NICE/BTS/SIGN content copied.",
    status: "partial",
    lastReviewed: "2024-11-27",
    appliesToDiagnosisSlugs: ["asthma-exacerbation"],
    appliesToRedFlagSlugs: ["severe-asthma-pattern"],
    presentationBlocks: ["breathlessness"],
    shortTeachingSummary:
      "Wheeze or asthma context with severe respiratory physiology should be treated as a high-risk breathlessness pattern.",
  },
  {
    id: "nice-ng115-copd",
    title: "Chronic obstructive pulmonary disease in over 16s: diagnosis and management",
    source: "NICE",
    url: "https://www.nice.org.uk/guidance/ng115",
    licenceStatus: "Linked source with WardBrain-authored short summary only; no bulk NICE content copied.",
    status: "current",
    lastReviewed: "2022-01-12",
    appliesToDiagnosisSlugs: ["copd-exacerbation"],
    appliesToRedFlagSlugs: [],
    presentationBlocks: ["breathlessness"],
    shortTeachingSummary:
      "Known COPD, smoking context, wheeze, and sputum change support COPD exacerbation as a breathlessness comparator.",
  },
  {
    id: "nice-ng250-pneumonia",
    title: "Pneumonia in adults: diagnosis and management",
    source: "NICE",
    url: "https://www.nice.org.uk/guidance/ng250",
    licenceStatus: "Linked source with WardBrain-authored short summary only; no bulk NICE content copied.",
    status: "current",
    lastReviewed: "2025-10-31",
    appliesToDiagnosisSlugs: ["pneumonia"],
    appliesToRedFlagSlugs: [],
    presentationBlocks: ["breathlessness", "chest-pain"],
    shortTeachingSummary:
      "Fever, productive cough, focal chest signs, and hypoxia support pneumonia, while maintaining attention to PE and sepsis when physiology or risk factors demand it.",
  },
  {
    id: "nice-ng17-type-1-diabetes",
    title: "Type 1 diabetes in adults: diagnosis and management",
    source: "NICE",
    url: "https://www.nice.org.uk/guidance/ng17",
    licenceStatus: "Linked source with WardBrain-authored short summary only; no bulk NICE content copied.",
    status: "current",
    lastReviewed: "2022-08-17",
    appliesToDiagnosisSlugs: ["diabetic-ketoacidosis"],
    appliesToRedFlagSlugs: ["dka-metabolic-acidosis-pattern"],
    presentationBlocks: ["breathlessness", "acute-abdominal-pain"],
    shortTeachingSummary:
      "Diabetes with vomiting, abdominal pain, osmotic symptoms, dehydration, or Kussmaul-type breathing should keep DKA/metabolic acidosis prominent.",
  },
  {
    id: "wardbrain-pilot-gaps",
    title: "WardBrain pilot internal coverage-gap map",
    source: "WardBrain",
    url: "/status",
    licenceStatus: "Internal educational metadata; not a substitute for local or national guidance.",
    status: "coverage-gap",
    lastReviewed: "2026-06-29",
    appliesToDiagnosisSlugs: [
      "bowel-obstruction",
      "mesenteric-ischaemia",
      "perforated-viscus",
      "pneumothorax",
      "heart-failure",
    ],
    appliesToRedFlagSlugs: [
      "bowel-obstruction-strangulation-risk-pattern",
      "mesenteric-ischaemia-escalation-pattern",
      "perforated-viscus-peritonitis-pattern",
      "tension-pneumothorax-pattern",
      "acute-heart-failure-pulmonary-oedema-pattern",
    ],
    presentationBlocks: ["acute-abdominal-pain", "breathlessness", "chest-pain"],
    shortTeachingSummary:
      "Some pilot red-flag patterns are WardBrain-authored educational safety scaffolds pending deeper source mapping; treat them as prompts to escalate, not quoted guideline text.",
  },
];

export function guidelineSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function intersect(left: string[], right: ReadonlySet<string>) {
  return left.filter((item) => right.has(item));
}

export function lookupGuidelineSupport(params: {
  diagnosisSlugs: string[];
  redFlagSlugs: string[];
  presentationBlocks: string[];
}): GuidelineSupport {
  const diagnosisSlugs = new Set(params.diagnosisSlugs.map(guidelineSlug));
  const redFlagSlugs = new Set(params.redFlagSlugs.map(guidelineSlug));
  const presentationBlocks = new Set(params.presentationBlocks.map(guidelineSlug));

  const sources = GUIDELINE_REGISTRY.map((source) => {
    const matchedDiagnosisSlugs = intersect(source.appliesToDiagnosisSlugs, diagnosisSlugs);
    const matchedRedFlagSlugs = intersect(source.appliesToRedFlagSlugs, redFlagSlugs);
    const matchedPresentationBlocks = intersect(source.presentationBlocks, presentationBlocks);

    if (
      matchedDiagnosisSlugs.length === 0 &&
      matchedRedFlagSlugs.length === 0 &&
      matchedPresentationBlocks.length === 0
    ) {
      return null;
    }

    return {
      source,
      matchedDiagnosisSlugs,
      matchedRedFlagSlugs,
      matchedPresentationBlocks,
    };
  }).filter((match): match is GuidelineSupportMatch => Boolean(match));

  return { sources };
}
