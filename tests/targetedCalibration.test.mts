import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";

test("epigastric ACS-style case fires ACS red flag without abdominal scaffold logic leaking into ranking", () => {
  const result = analyzeCase({
    age: "64",
    sex: "male",
    presentingComplaint: "Epigastric pain",
    history: "Epigastric pressure radiating to the jaw with sweating and nausea, thought it was indigestion.",
    pmh: "known hypertension",
    meds: "",
    social: "smoker",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "ACS",
  });

  assert.equal(result.differentials[0]?.name, "Acute coronary syndrome");
  assert.ok(result.redFlags.some((flag) => flag.name === "ACS suspicion pattern"));
});

test("spontaneous pneumothorax signature now outranks PE when VTE context is absent", () => {
  const result = analyzeCase({
    age: "21",
    sex: "male",
    presentingComplaint: "Chest pain and shortness of breath",
    history:
      "Tall slim male with sudden unilateral pleuritic chest pain and shortness of breath at rest.",
    pmh: "",
    meds: "",
    social: "smoker",
    keyPositives: "unilateral reduced air entry",
    keyNegatives: "no fever no productive cough",
    observations: "",
    suspectedDiagnosis: "PE",
  });

  assert.equal(result.differentials[0]?.name, "Pneumothorax");
  assert.ok(result.differentials.some((differential) => differential.name === "Pulmonary embolism"));
});

test("musculoskeletal chest wall pattern is educationally favored over PE and ACS when danger features are absent", () => {
  const result = analyzeCase({
    age: "34",
    sex: "female",
    presentingComplaint: "Chest pain",
    history:
      "Localized chest pain after heavy lifting, reproducible on palpation and worse on movement.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no shortness of breath no fever",
    observations: "",
    suspectedDiagnosis: "PE",
  });

  assert.equal(result.differentials[0]?.name, "Musculoskeletal chest pain");
});

test("classic benign migraine aura pattern no longer gets catastrophe-dominant ranking", () => {
  const result = analyzeCase({
    age: "29",
    sex: "female",
    presentingComplaint: "Headache",
    history:
      "Recurrent unilateral throbbing headaches with flashing lights beforehand, photophobia, nausea, and well intervals between episodes.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no focal neurology no fever",
    observations: "",
    suspectedDiagnosis: "Migraine",
  });

  assert.equal(result.differentials[0]?.name, "Migraine");
  assert.ok(!result.redFlags.some((flag) => flag.name === "Headache urgent evaluation pattern"));
});

test("tension headache pattern is recognized without SAH dominance", () => {
  const result = analyzeCase({
    age: "33",
    sex: "male",
    presentingComplaint: "Headache",
    history: "Gradual bilateral band-like headache after stress and poor sleep.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no focal deficit no vomiting",
    observations: "",
    suspectedDiagnosis: "Tension headache",
  });

  assert.equal(result.differentials[0]?.name, "Tension headache");
});

test("temporal arteritis is now surfaced in a compatible older-adult headache pattern", () => {
  const result = analyzeCase({
    age: "76",
    sex: "female",
    presentingComplaint: "Headache",
    history:
      "New temporal headache with scalp tenderness, jaw pain when chewing, blurred vision, and aching shoulders.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "Temporal arteritis",
  });

  assert.equal(result.differentials[0]?.name, "Temporal arteritis");
});

test("infectious progressive pleuritic case favors pneumonia and avoids ACS red flag overfiring", () => {
  const result = analyzeCase({
    age: "58",
    sex: "female",
    presentingComplaint: "Breathlessness and chest pain",
    history:
      "Progressively worsening shortness of breath over several days with pleuritic chest pain, productive cough, green sputum, fever, and rigors.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "Pneumonia",
  });

  assert.equal(result.differentials[0]?.name, "Pneumonia");
  assert.ok(!result.redFlags.some((flag) => flag.name === "ACS suspicion pattern"));
});

test("asthma and COPD exacerbation can now surface as live breathlessness diagnoses", () => {
  const asthmaResult = analyzeCase({
    age: "25",
    sex: "female",
    presentingComplaint: "Shortness of breath",
    history: "Known asthma with wheeze, increased inhaler use, and too breathless to speak full sentences.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "RR 28 sats 91%",
    suspectedDiagnosis: "Asthma exacerbation",
  });

  const copdResult = analyzeCase({
    age: "71",
    sex: "male",
    presentingComplaint: "Shortness of breath",
    history:
      "Known COPD with worsening baseline breathlessness over days, increased sputum volume, and yellow sputum.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "RR 26 sats 90%",
    suspectedDiagnosis: "COPD exacerbation",
  });

  assert.equal(asthmaResult.differentials[0]?.name, "Asthma exacerbation");
  assert.equal(copdResult.differentials[0]?.name, "COPD exacerbation");
});

test("older confused infection case surfaces delirium secondary to infection as an educational lead", () => {
  const result = analyzeCase({
    age: "84",
    sex: "male",
    presentingComplaint: "Confusion",
    history: "Acute fluctuating confusion with fever and productive cough after a recent infection.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "Sepsis",
  });

  assert.equal(result.differentials[0]?.name, "Delirium secondary to infection");
  assert.ok(result.differentials.some((differential) => differential.name === "Sepsis"));
});

test("meningitis encephalitis red flag is now honestly labeled as a coverage gap", () => {
  const result = analyzeCase({
    age: "22",
    sex: "female",
    presentingComplaint: "Headache",
    history: "Headache with fever, stiff neck, photophobia, and drowsiness.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "Meningitis",
  });

  const meningitisFlag = result.redFlags.find(
    (flag) => flag.name === "Meningitis / encephalitis suspicion pattern",
  );

  assert.ok(meningitisFlag);
  assert.equal(meningitisFlag?.sourceId, "coverage-gap");
  assert.equal(meningitisFlag?.sourceCoverage, "gap");
});
