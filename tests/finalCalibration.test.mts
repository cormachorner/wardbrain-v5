import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";

test("young tall thin male with unilateral reduced air entry ranks pneumothorax above PE", () => {
  const result = analyzeCase({
    age: "22",
    sex: "male",
    presentingComplaint: "Chest pain and shortness of breath",
    history:
      "Tall thin male with sudden pleuritic chest pain, shortness of breath, and unilateral reduced air entry on the right.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "PE",
  });

  assert.equal(result.differentials[0]?.name, "Pneumothorax");
  assert.equal(result.differentials[1]?.name, "Pulmonary embolism");
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
