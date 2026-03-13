import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";
import { findNextStepsRule } from "../lib/nextStepsRules.js";
import { TRAP_CASES } from "./trapCases.js";

const NEXT_STEPS_CASES = [
  {
    trapCaseId: "acute-chest-pain-sob-should-prioritise-pe",
    diagnosis: "Pulmonary embolism",
    sourceId: "NG158",
    expectedText: ["2-level PE Wells score", "CTPA", "D-dimer"],
  },
  {
    trapCaseId: "acs-alias-classic-chest-pain-pattern",
    diagnosis: "Acute coronary syndrome",
    sourceId: "CG95",
    expectedText: ["12-lead ECG", "urgent hospital assessment", "GTN"],
  },
  {
    trapCaseId: "gi-bleed-with-instability",
    diagnosis: "GI bleed",
    sourceId: "CG141",
    expectedText: ["group and save", "urgent senior review", "urgent endoscopic pathway"],
  },
  {
    trapCaseId: "sepsis-vs-viral-illness",
    diagnosis: "Sepsis",
    sourceId: "NG253",
    expectedText: ["sepsis screening", "cultures", "Sepsis Six-style"],
  },
  {
    trapCaseId: "sah-alias-vs-meningitis",
    diagnosis: "Subarachnoid haemorrhage",
    sourceId: "CG150",
    expectedText: ["urgent neuroimaging", "sudden severe headache", "urgent hospital assessment"],
  },
  {
    trapCaseId: "meningitis-encephalitis-vs-simple-delirium",
    diagnosis: "Meningitis / encephalitis",
    sourceId: "NG143",
    expectedText: ["cultures", "CNS infection", "urgent escalation"],
  },
  {
    trapCaseId: "pneumothorax-with-unilateral-air-entry-sign",
    diagnosis: "Pneumothorax",
    sourceId: "coverage-gap",
    expectedText: ["chest X-ray", "urgent respiratory or emergency review", "unstable"],
  },
  {
    trapCaseId: "acute-aortic-syndrome-vs-gord",
    diagnosis: "Acute aortic syndrome",
    sourceId: "coverage-gap",
    expectedText: ["CT aortic imaging", "urgent escalation", "vascular"],
  },
] as const;

for (const nextStepsCase of NEXT_STEPS_CASES) {
  test(`shows next steps for ${nextStepsCase.diagnosis}`, () => {
    const trapCase = TRAP_CASES.find((candidate) => candidate.id === nextStepsCase.trapCaseId);

    assert.ok(trapCase, `Missing trap case ${nextStepsCase.trapCaseId}`);

    const result = analyzeCase(trapCase.input);

    assert.ok(result.nextSteps, `Expected next steps for ${nextStepsCase.diagnosis}`);
    assert.equal(result.nextSteps.diagnosis, nextStepsCase.diagnosis);
    assert.equal(result.nextSteps.sourceId, nextStepsCase.sourceId);

    const allText = [
      ...result.nextSteps.investigations,
      ...result.nextSteps.immediateNextSteps,
      ...result.nextSteps.notes,
    ].join(" ");

    for (const expectedText of nextStepsCase.expectedText) {
      assert.match(allText, new RegExp(expectedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    }
  });
}

test("has next steps coverage for abdominal aortic aneurysm", () => {
  const rule = findNextStepsRule("AAA");

  assert.ok(rule);
  assert.equal(rule.diagnosis, "Abdominal aortic aneurysm");
  assert.equal(rule.sourceId, "NG156");
});
