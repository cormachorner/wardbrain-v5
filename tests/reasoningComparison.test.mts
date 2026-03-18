import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";

test("flags a missing key dangerous exclusion when the lead diagnosis is plausible", () => {
  const result = analyzeCase({
    age: "56",
    sex: "female",
    presentingComplaint: "Chest pain and breathlessness",
    history: "Sudden pleuritic chest pain with shortness of breath",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "Sats 88",
    leadDiagnosis: "PE",
    otherDifferentials: "Pneumonia",
    dangerousDiagnoses: "ACS",
  });

  assert.equal(result.fitCheck.label, "Strong fit");
  assert.match(result.reasoningComparison.dangerAssessment, /misses Pulmonary embolism/i);
});

test("identifies a benign lead diagnosis with weak and narrow differentials", () => {
  const result = analyzeCase({
    age: "68",
    sex: "male",
    presentingComplaint: "Chest pain",
    history: "Sudden onset tearing chest pain radiating to the back with collapse",
    pmh: "known hypertension",
    meds: "",
    social: "smoker",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "GORD",
    otherDifferentials: "musculoskeletal pain",
    dangerousDiagnoses: "",
  });

  assert.equal(result.fitCheck.label, "Weak fit");
  assert.match(result.reasoningComparison.differentialAssessment, /narrow/i);
  assert.match(result.reasoningComparison.dangerAssessment, /excluding Acute aortic syndrome/i);
});

test("recognises a good danger list even when the lead diagnosis is imperfect", () => {
  const result = analyzeCase({
    age: "29",
    sex: "male",
    presentingComplaint: "Chest pain and shortness of breath",
    history: "Sudden pleuritic chest pain with unilateral reduced air entry on the left",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "PE",
    otherDifferentials: "Pneumothorax",
    dangerousDiagnoses: "PE, pneumothorax",
  });

  assert.match(result.reasoningComparison.leadAssessment, /lead diagnosis is strong fit|lead diagnosis is partial fit/i);
  assert.match(
    result.reasoningComparison.dangerAssessment,
    /captures the key dangerous diagnoses/i,
  );
});
