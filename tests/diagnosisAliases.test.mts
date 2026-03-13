import test from "node:test";
import assert from "node:assert/strict";

import { normaliseDiagnosisName } from "../lib/diagnosisAliases.js";

const ALIAS_CASES = [
  ["stroke", "Stroke / neurological emergency"],
  ["delirium", "Delirium secondary to infection"],
  ["SAH", "Subarachnoid haemorrhage"],
  ["PE", "Pulmonary embolism"],
  ["AAA", "Abdominal aortic aneurysm"],
  ["ACS", "Acute coronary syndrome"],
  ["migraine", "Migraine"],
] as const;

for (const [alias, expected] of ALIAS_CASES) {
  test(`maps ${alias} to ${expected}`, () => {
    assert.equal(normaliseDiagnosisName(alias), expected);
  });
}
