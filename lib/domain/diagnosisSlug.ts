const DIAGNOSIS_SLUG_ALIASES: Record<string, string> = {
  "mesenteric-ischaemia": "mesenteric-ischaemia",
  "ruptured-symptomatic-abdominal-aortic-aneurysm": "abdominal-aortic-aneurysm",
  "ruptured-or-symptomatic-abdominal-aortic-aneurysm": "abdominal-aortic-aneurysm",
  "ruptured-symptomatic-aaa": "abdominal-aortic-aneurysm",
  "ruptured-or-symptomatic-aaa": "abdominal-aortic-aneurysm",
  aaa: "abdominal-aortic-aneurysm",
  "renal-colic": "renal-colic-ureteric-stone",
  "ureteric-stone": "renal-colic-ureteric-stone",
  "renal-colic-ureteric-stone": "renal-colic-ureteric-stone",
  "perforated-viscus-peritonitis": "perforated-viscus",
  "biliary-colic": "biliary-colic-gallstone-disease",
  dka: "diabetic-ketoacidosis",
};

export function slugifyDiagnosisValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function canonicalDiagnosisSlug(value: string) {
  const slug = slugifyDiagnosisValue(value);

  return DIAGNOSIS_SLUG_ALIASES[slug] ?? slug;
}
