const DIAGNOSIS_ALIASES: Record<string, string> = {
  stroke: "Stroke / neurological emergency",
  cva: "Stroke / neurological emergency",
  delirium: "Delirium secondary to infection",
  sah: "Subarachnoid haemorrhage",
  pe: "Pulmonary embolism",
  aaa: "Abdominal aortic aneurysm",
  acs: "Acute coronary syndrome",
  migraine: "Migraine",
  meningitis: "Meningitis / encephalitis",
  encephalitis: "Meningitis / encephalitis",
};

export function normaliseDiagnosisName(name: string): string {
  const trimmedName = name.trim();
  const canonical = DIAGNOSIS_ALIASES[trimmedName.toLowerCase()];

  return canonical ?? trimmedName;
}
