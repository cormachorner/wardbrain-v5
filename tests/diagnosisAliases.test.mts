import test from "node:test";
import assert from "node:assert/strict";

import { normaliseDiagnosisName } from "../lib/diagnosisAliases.js";

const ALIAS_CASES = [
  ["stroke", "Stroke / neurological emergency"],
  ["CVA", "Stroke / neurological emergency"],
  ["cerebrovascular accident", "Stroke / neurological emergency"],
  ["ischemic stroke", "Stroke / neurological emergency"],
  ["delirium", "Delirium secondary to infection"],
  ["SAH", "Subarachnoid haemorrhage"],
  ["subarachnoid hemorrhage", "Subarachnoid haemorrhage"],
  ["berry aneurysm rupture", "Subarachnoid haemorrhage"],
  ["PE", "Pulmonary embolism"],
  ["pulmonary embolus", "Pulmonary embolism"],
  ["lung clot", "Pulmonary embolism"],
  ["AAA", "Abdominal aortic aneurysm"],
  ["ruptured AAA", "Abdominal aortic aneurysm"],
  ["leaking aaa", "Abdominal aortic aneurysm"],
  ["ACS", "Acute coronary syndrome"],
  ["myocardial infarction", "Acute coronary syndrome"],
  ["heart attack", "Acute coronary syndrome"],
  ["STEMI", "Acute coronary syndrome"],
  ["NSTEMI", "Acute coronary syndrome"],
  ["unstable angina", "Acute coronary syndrome"],
  ["acute MI", "Acute coronary syndrome"],
  ["AAS", "Acute aortic syndrome"],
  ["aortic dissection", "Acute aortic syndrome"],
  ["thoracic aortic dissection", "Acute aortic syndrome"],
  ["dissection", "Acute aortic syndrome"],
  ["meningitis", "Meningitis / encephalitis"],
  ["encephalitis", "Meningitis / encephalitis"],
  ["meningoencephalitis", "Meningitis / encephalitis"],
  ["CNS infection", "Meningitis / encephalitis"],
  ["GI bleed", "GI bleed"],
  ["gastrointestinal bleed", "GI bleed"],
  ["upper GI bleed", "GI bleed"],
  ["UGIB", "GI bleed"],
  ["lower gi bleed", "GI bleed"],
  ["LGIB", "GI bleed"],
  ["migraine", "Migraine"],
] as const;

for (const [alias, expected] of ALIAS_CASES) {
  test(`maps ${alias} to ${expected}`, () => {
    assert.equal(normaliseDiagnosisName(alias), expected);
  });
}

test("keeps unknown diagnoses unchanged", () => {
  assert.equal(normaliseDiagnosisName("GORD"), "GORD");
});
