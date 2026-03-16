import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";

test("young tall thin male smoker with unilateral reduced air entry ranks pneumothorax above PE", () => {
  const result = analyzeCase({
    age: "22",
    sex: "male",
    presentingComplaint: "Chest pain and shortness of breath",
    history:
      "Tall thin male with sudden pleuritic chest pain, shortness of breath, and unilateral reduced air entry on the right.",
    pmh: "",
    meds: "",
    social: "current smoker",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "PE",
  });

  assert.equal(result.differentials[0]?.name, "Pneumothorax");
  assert.equal(result.differentials[1]?.name, "Pulmonary embolism");
  assert.ok(result.differentials[1]?.score && result.differentials[1].score > 0);
  assert.ok((result.differentials[0]?.score ?? 0) > (result.differentials[1]?.score ?? 0));
});

test("migraine does not appear in GI bleed pattern without headache context", () => {
  const result = analyzeCase({
    age: "67",
    sex: "male",
    presentingComplaint: "Collapse",
    history: "Collapsed after vomiting blood with melaena and blood per rectum",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "HR 130, systolic 70",
    suspectedDiagnosis: "GI bleed",
  });

  assert.ok(!result.differentials.some((differential) => differential.name === "Migraine"));
});

test("infection source plus fever now triggers sepsis red flag without generic instability only", () => {
  const result = analyzeCase({
    age: "73",
    sex: "female",
    presentingComplaint: "Fever",
    history: "Fever with productive cough and new confusion",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "Sepsis",
  });

  assert.ok(result.redFlags.some((flag) => flag.name === "High-risk sepsis pattern"));
});

test("older chest pain pattern keeps ACS highly plausible", () => {
  const result = analyzeCase({
    age: "72",
    sex: "male",
    presentingComplaint: "Chest pain",
    history: "Central chest pain radiating to the jaw with sweating",
    pmh: "known hypertension",
    meds: "",
    social: "current smoker",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "ACS",
  });

  assert.equal(result.differentials[0]?.name, "Acute coronary syndrome");
});

test("older vascular catastrophe pattern keeps AAS above AAA", () => {
  const result = analyzeCase({
    age: "78",
    sex: "male",
    presentingComplaint: "Chest pain",
    history: "Sudden tearing chest pain radiating to the back with collapse",
    pmh: "known hypertension",
    meds: "",
    social: "smoker",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "Acute aortic syndrome",
  });

  assert.equal(result.differentials[0]?.name, "Acute aortic syndrome");
  assert.equal(result.differentials[1]?.name, "Abdominal aortic aneurysm");
});

test("very young adult chest pain without strong signature features does not overpromote ACS AAA or AAS", () => {
  const result = analyzeCase({
    age: "23",
    sex: "male",
    presentingComplaint: "Chest pain",
    history: "Mild central chest pain after eating",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "GORD",
  });

  assert.ok(!result.differentials.slice(0, 2).some((d) => d.name === "Abdominal aortic aneurysm"));
  assert.ok(!result.differentials.slice(0, 2).some((d) => d.name === "Acute aortic syndrome"));
  assert.ok(!result.differentials.slice(0, 2).some((d) => d.name === "Acute coronary syndrome"));
});
