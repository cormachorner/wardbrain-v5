import type {
  ConditionPromotionStatus,
  PresentationFamily,
  WardBrainConditionPromotionEntry,
} from "../types/wardbrain";

const LIVE_ENGINE = "live-engine" satisfies ConditionPromotionStatus;
const SCAFFOLD_ONLY = "scaffold-only" satisfies ConditionPromotionStatus;

export const CONDITION_PROMOTION_REGISTRY: WardBrainConditionPromotionEntry[] = [
  {
    canonicalName: "Acute coronary syndrome",
    presentationFamilies: ["chest-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["ACS", "acute coronary syndrome", "MI", "myocardial infarction"],
    sourceAnchor: "NICE CG95",
    learnMoreKey: "acute-coronary-syndrome",
  },
  {
    canonicalName: "Pulmonary embolism",
    presentationFamilies: ["chest-pain", "breathlessness-pleuritic-chest-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["PE", "pulmonary embolism", "pulmonary embolus", "lung clot"],
    sourceAnchor: "NICE NG158",
    learnMoreKey: "pulmonary-embolism",
  },
  {
    canonicalName: "Acute aortic syndrome",
    presentationFamilies: ["chest-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["AAS", "acute aortic syndrome", "aortic dissection"],
    notes: "High-risk chest pain family diagnosis with future scope for dedicated scaffold emphasis.",
    learnMoreKey: "acute-aortic-syndrome",
  },
  {
    canonicalName: "Pneumothorax",
    presentationFamilies: ["chest-pain", "breathlessness-pleuritic-chest-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["pneumothorax", "PTX", "collapsed lung", "tension pneumothorax"],
    learnMoreKey: "pneumothorax",
  },
  {
    canonicalName: "GORD",
    presentationFamilies: ["chest-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["GORD", "GERD", "reflux", "acid reflux"],
    learnMoreKey: "gord",
  },
  {
    canonicalName: "Pneumonia",
    presentationFamilies: ["chest-pain", "breathlessness-pleuritic-chest-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["pneumonia", "chest infection", "CAP", "community acquired pneumonia"],
    learnMoreKey: "pneumonia",
  },
  {
    canonicalName: "Subarachnoid haemorrhage",
    presentationFamilies: ["headache"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["SAH", "subarachnoid haemorrhage", "subarachnoid hemorrhage"],
    sourceAnchor: "NICE CG150",
    learnMoreKey: "subarachnoid-haemorrhage",
  },
  {
    canonicalName: "Migraine",
    presentationFamilies: ["headache"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["migraine"],
    learnMoreKey: "migraine",
  },
  {
    canonicalName: "Meningitis / encephalitis",
    presentationFamilies: ["headache", "confusion-delirium"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["meningitis", "encephalitis", "meningoencephalitis", "CNS infection"],
    sourceAnchor: "NICE NG143",
    learnMoreKey: "meningitis-encephalitis",
  },
  {
    canonicalName: "Stroke / neurological emergency",
    presentationFamilies: ["headache", "confusion-delirium"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["stroke", "CVA", "cerebrovascular accident", "neurological emergency"],
    learnMoreKey: "stroke-neurological-emergency",
  },
  {
    canonicalName: "Abdominal aortic aneurysm",
    presentationFamilies: ["acute-abdominal-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["AAA", "abdominal aortic aneurysm", "ruptured AAA", "leaking AAA"],
    sourceAnchor: "NICE NG156",
    learnMoreKey: "abdominal-aortic-aneurysm",
  },
  {
    canonicalName: "Mesenteric ischaemia",
    presentationFamilies: ["acute-abdominal-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: [
      "mesenteric ischaemia",
      "mesenteric ischemia",
      "bowel ischaemia",
      "bowel ischemia",
    ],
    learnMoreKey: "mesenteric-ischaemia",
  },
  {
    canonicalName: "Gastroenteritis",
    presentationFamilies: ["acute-abdominal-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["gastroenteritis", "gastro", "vomiting and diarrhoea", "V&D"],
    learnMoreKey: "gastroenteritis",
  },
  {
    canonicalName: "GI bleed",
    presentationFamilies: ["acute-abdominal-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["GI bleed", "gastrointestinal bleed", "UGIB", "LGIB"],
    sourceAnchor: "NICE CG141",
    learnMoreKey: "gi-bleed",
  },
  {
    canonicalName: "Sepsis",
    presentationFamilies: ["breathlessness-pleuritic-chest-pain", "acute-abdominal-pain", "confusion-delirium"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["sepsis", "septic", "septic shock", "severe sepsis"],
    sourceAnchor: "NICE NG253",
    learnMoreKey: "sepsis",
  },
  {
    canonicalName: "Delirium secondary to infection",
    presentationFamilies: ["confusion-delirium"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["delirium"],
    learnMoreKey: "delirium-secondary-to-infection",
  },
  {
    canonicalName: "Viral illness",
    presentationFamilies: ["headache"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["viral illness", "viral infection", "flu-like illness", "viral syndrome"],
    notes: "Broad febrile illness placeholder in the live engine until a dedicated fever/febrile illness family exists.",
    learnMoreKey: "viral-illness",
  },
  {
    canonicalName: "Pericarditis",
    presentationFamilies: ["chest-pain"],
    promotionStatus: SCAFFOLD_ONLY,
    aliases: ["pericarditis"],
    notes: "Seeded for future chest-pain family expansion; not yet promoted into live ranking.",
    learnMoreKey: "pericarditis",
  },
  {
    canonicalName: "Musculoskeletal chest pain",
    presentationFamilies: ["chest-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["musculoskeletal chest pain", "musculoskeletal pain", "costochondritis"],
    notes: "Useful benign comparator for future chest-pain broadening.",
    learnMoreKey: "musculoskeletal-chest-pain",
  },
  {
    canonicalName: "Tension headache",
    presentationFamilies: ["headache"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["tension headache"],
    notes: "Seeded as a future benign headache comparator.",
    learnMoreKey: "tension-headache",
  },
  {
    canonicalName: "Temporal arteritis",
    presentationFamilies: ["headache"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["temporal arteritis", "giant cell arteritis", "GCA"],
    notes: "Important to support educational coverage before live-engine promotion.",
    learnMoreKey: "temporal-arteritis",
  },
  {
    canonicalName: "Asthma exacerbation",
    presentationFamilies: ["breathlessness-pleuritic-chest-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["asthma exacerbation", "acute asthma", "asthma attack"],
    notes: "Seeded for future breathlessness family expansion.",
    learnMoreKey: "asthma-exacerbation",
  },
  {
    canonicalName: "COPD exacerbation",
    presentationFamilies: ["breathlessness-pleuritic-chest-pain"],
    promotionStatus: LIVE_ENGINE,
    aliases: ["copd exacerbation", "acute copd exacerbation", "infective exacerbation of copd"],
    notes: "Seeded for future breathlessness family expansion.",
    learnMoreKey: "copd-exacerbation",
  },
];

export const CONDITION_PROMOTION_REGISTRY_BY_NAME = Object.fromEntries(
  CONDITION_PROMOTION_REGISTRY.map((entry) => [entry.canonicalName, entry]),
) as Record<string, WardBrainConditionPromotionEntry>;

export const LIVE_ENGINE_CONDITIONS = CONDITION_PROMOTION_REGISTRY
  .filter((entry) => entry.promotionStatus === LIVE_ENGINE)
  .map((entry) => entry.canonicalName);

export const CONDITION_PROMOTION_STATUS: Record<string, ConditionPromotionStatus> =
  Object.fromEntries(
    CONDITION_PROMOTION_REGISTRY.map((entry) => [entry.canonicalName, entry.promotionStatus]),
  );

export function getConditionsForFamily(family: PresentationFamily): WardBrainConditionPromotionEntry[] {
  return CONDITION_PROMOTION_REGISTRY.filter((entry) => entry.presentationFamilies.includes(family));
}
