const DIAGNOSIS_ALIAS_GROUPS = [
  {
    diagnosis: "Acute coronary syndrome",
    aliases: [
      "acs",
      "acute coronary syndrome",
      "mi",
      "myocardial infarction",
      "heart attack",
      "stemi",
      "nstemi",
      "unstable angina",
      "acute mi",
    ],
  },
  {
    diagnosis: "Pulmonary embolism",
    aliases: ["pe", "pulmonary embolism", "pulmonary embolus", "lung clot"],
  },
  {
    diagnosis: "Abdominal aortic aneurysm",
    aliases: ["aaa", "abdominal aortic aneurysm", "ruptured aaa", "leaking aaa"],
  },
  {
    diagnosis: "Acute aortic syndrome",
    aliases: [
      "aas",
      "acute aortic syndrome",
      "aortic dissection",
      "dissection",
      "dissecting aortic aneurysm",
      "dissecting AAA",
      "thoracic aortic dissection",
    ],
  },
  {
    diagnosis: "Subarachnoid haemorrhage",
    aliases: [
      "sah",
      "subarachnoid haemorrhage",
      "subarachnoid hemorrhage",
      "aneurysmal sah",
      "berry aneurysm rupture",
    ],
  },
  {
    diagnosis: "Stroke / neurological emergency",
    aliases: [
      "stroke",
      "cva",
      "cerebrovascular accident",
      "ischaemic stroke",
      "haemorrhagic stroke",
      "hemorrhagic stroke",
      "ischemic stroke",
      "neurological emergency",
    ],
  },
  {
    diagnosis: "Meningitis / encephalitis",
    aliases: ["meningitis", "encephalitis", "meningoencephalitis", "cns infection"],
  },
  {
    diagnosis: "GI bleed",
    aliases: [
      "gi bleed",
      "gastrointestinal bleed",
      "gastrointestinal bleeding",
      "GI bleeding",
      "upper gi bleed",
      "ugib",
      "lower gi bleed",
      "lgib",
    ],
  },
  {
    diagnosis: "Delirium secondary to infection",
    aliases: ["delirium"],
  },
  {
    diagnosis: "Pneumothorax",
    aliases: ["pneumothorax", "ptx", "collapsed lung", "tension pneumothorax"],
  },
  {
    diagnosis: "Sepsis",
    aliases: ["sepsis", "septic", "septic shock", "severe sepsis"],
  },
  {
    diagnosis: "GORD",
    aliases: [
      "gord",
      "gerd",
      "reflux",
      "acid reflux",
      "oesophageal reflux",
      "esophageal reflux",
      "gastro-oesophageal reflux",
      "gastroesophageal reflux",
    ],
  },
  {
    diagnosis: "Mesenteric ischaemia",
    aliases: [
      "mesenteric ischaemia",
      "mesenteric ischemia",
      "bowel ischaemia",
      "bowel ischemia",
      "ischaemic bowel",
      "ischemic bowel",
    ],
  },
  {
    diagnosis: "Pneumonia",
    aliases: [
      "pneumonia",
      "chest infection",
      "cap",
      "community acquired pneumonia",
      "lower respiratory tract infection",
      "lrti",
    ],
  },
  {
    diagnosis: "Gastroenteritis",
    aliases: [
      "gastroenteritis",
      "gastro",
      "infective diarrhoea",
      "infective diarrhea",
      "vomiting and diarrhoea",
      "vomiting and diarrhea",
      "v&d",
    ],
  },
  {
    diagnosis: "Viral illness",
    aliases: ["viral illness", "viral infection", "flu-like illness", "viral syndrome"],
  },
  {
    diagnosis: "Migraine",
    aliases: ["migraine"],
  },
  {
    diagnosis: "Musculoskeletal chest pain",
    aliases: ["musculoskeletal chest pain", "costochondritis", "chest wall pain"],
  },
  {
    diagnosis: "Tension headache",
    aliases: ["tension headache"],
  },
  {
    diagnosis: "Temporal arteritis",
    aliases: ["temporal arteritis", "giant cell arteritis", "gca"],
  },
  {
    diagnosis: "Asthma exacerbation",
    aliases: ["asthma exacerbation", "acute asthma", "asthma attack"],
  },
  {
    diagnosis: "COPD exacerbation",
    aliases: ["copd exacerbation", "acute copd exacerbation", "infective exacerbation of copd"],
  },
] as const;

const DIAGNOSIS_ALIASES = Object.fromEntries(
  DIAGNOSIS_ALIAS_GROUPS.flatMap(({ diagnosis, aliases }) =>
    aliases.map((alias) => [normaliseAliasKey(alias), diagnosis]),
  ),
);

function normaliseAliasKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[./]+/g, " ")
    .replace(/\s+/g, " ");
}

export function normaliseDiagnosisName(name: string): string {
  const trimmedName = name.trim();
  const canonical = DIAGNOSIS_ALIASES[normaliseAliasKey(trimmedName)];

  return canonical ?? trimmedName;
}
