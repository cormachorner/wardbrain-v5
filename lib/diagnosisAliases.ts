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
    aliases: ["pe", "pulmonary embolism", "pulmonary embolus", "DVT", "lung clot"],
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
    diagnosis: "Migraine",
    aliases: ["migraine"],
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
