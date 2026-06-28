import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";
import { canonicalDiagnosisSlug } from "../lib/domain/diagnosisSlug.js";
import { setDbFeaturePhrasePatternsForTest } from "../lib/domain/featureExtractor.js";
import type { CaseInput } from "../lib/types.js";

function buildInput(overrides: Partial<CaseInput>): CaseInput {
  return {
    age: "",
    sex: "",
    presentingComplaint: "",
    history: "",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
    suspectedDiagnosis: "",
    ...overrides,
  };
}

function redFlagNames(result: ReturnType<typeof analyzeCase>) {
  return result.redFlags.map((flag) => flag.name);
}

function assertFeatures(result: ReturnType<typeof analyzeCase>, expectedFeatures: string[]) {
  assert.deepEqual(
    expectedFeatures.filter((feature) => !result.detectedFeatureSlugs.includes(feature)),
    [],
  );
}

function assertNoFeatures(result: ReturnType<typeof analyzeCase>, forbiddenFeatures: string[]) {
  assert.deepEqual(
    forbiddenFeatures.filter((feature) => result.detectedFeatureSlugs.includes(feature)),
    [],
  );
}

function assertRedFlags(result: ReturnType<typeof analyzeCase>, expectedRedFlags: string[]) {
  const flags = redFlagNames(result);
  assert.deepEqual(expectedRedFlags.filter((flag) => !flags.includes(flag)), []);
}

function assertNoRedFlags(result: ReturnType<typeof analyzeCase>, forbiddenRedFlags: string[]) {
  const flags = redFlagNames(result);
  assert.deepEqual(forbiddenRedFlags.filter((flag) => flags.includes(flag)), []);
}

test("pilot hardening v2: ACS hidden as reflux is routed and escalated by exertional central heaviness", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "62",
    sex: "male",
    presentingComplaint: "Heartburn",
    history:
      "He says it is probably heartburn, but while carrying shopping upstairs he developed a heavy tight pressure sensation in the centre of his chest. It went into his neck, jaw and left arm. He became clammy and felt sick. He has type 2 diabetes, hypertension and high cholesterol.",
    pmh: "Type 2 diabetes. Hypertension. High cholesterol.",
    suspectedDiagnosis: "Reflux",
  }));

  assert.equal(result.presentationSupport.matchedBlockId, "chest-pain");
  assert.ok(result.presentationSupport.confidence >= 6);
  assert.equal(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "acute-coronary-syndrome");
  assert.notEqual(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "gord");
  assertRedFlags(result, ["ACS suspicion pattern"]);
  assertNoRedFlags(result, ["PE suspicion pattern"]);
  assertFeatures(result, [
    "chest_pain",
    "chest_heaviness",
    "exertional_pain",
    "pain_radiates_to_jaw",
    "pain_radiates_to_left_arm",
    "sweating",
    "nausea",
    "diabetic_context",
    "hypertension",
    "hyperlipidaemia",
    "heartburn",
  ]);
});

test("pilot hardening v2: PE mixed with pneumonia and MSK noise keeps PE red flag when VTE signals are present", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "34",
    sex: "female",
    presentingComplaint: "Chest pain and shortness of breath",
    history:
      "She flew home from Spain two days ago and takes the combined pill. Now she has shortness of breath walking around with sharp pain worse on breathing and blood-streaked sputum. There are mild crackles and some chest wall tenderness. HR 118.",
    meds: "Combined oral contraceptive pill",
    observations: "HR 118",
    suspectedDiagnosis: "Pneumonia",
  }));

  const top3 = result.differentials.slice(0, 3).map((diagnosis) => canonicalDiagnosisSlug(diagnosis.name));

  assert.equal(result.presentationSupport.matchedBlockId, "breathlessness-pleuritic-chest-pain");
  assert.ok(top3.includes("pulmonary-embolism"));
  assertRedFlags(result, ["PE suspicion pattern"]);
  assertFeatures(result, [
    "sob",
    "pleuritic_pain",
    "haemoptysis",
    "long_haul_travel",
    "oestrogen_use",
    "tachycardia",
    "crackles",
    "reproducible_chest_wall_tenderness",
  ]);
});

test("pilot hardening v2: acute heart failure overload pattern does not overfire PE", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "82",
    sex: "female",
    presentingComplaint: "Breathlessness",
    history:
      "She is breathless, cannot lie flat, is coughing frothy sputum and has swollen ankles. Examination shows raised JVP, bibasal crackles and peripheral oedema. Sats 88% on air and temperature is 37.8.",
    observations: "sats 88% temp 37.8",
    suspectedDiagnosis: "Pneumonia",
  }));

  assert.equal(result.presentationSupport.matchedBlockId, "breathlessness-pleuritic-chest-pain");
  assert.equal(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "heart-failure");
  assertRedFlags(result, ["Acute heart failure / pulmonary oedema pattern"]);
  assertNoRedFlags(result, ["PE suspicion pattern"]);
  assertFeatures(result, [
    "sob",
    "orthopnoea",
    "frothy_sputum",
    "ankle_swelling",
    "raised_jvp",
    "bibasal_crackles",
    "peripheral_oedema",
    "hypoxia",
  ]);
});

test("pilot hardening v2: generic swollen ankles do not trigger PE red flag in heart failure", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "82",
    sex: "female",
    presentingComplaint: "Breathlessness",
    history:
      "She is acutely breathless, cannot lie flat, wakes gasping at night and has swollen ankles. Raised JVP and bibasal crackles are present. No fever, no productive cough, no pleuritic pain and no haemoptysis.",
    keyNegatives: "no fever no productive cough no pleuritic pain no haemoptysis",
    suspectedDiagnosis: "Pulmonary embolism",
  }));

  assert.equal(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "heart-failure");
  assertRedFlags(result, ["Acute heart failure / pulmonary oedema pattern"]);
  assertNoRedFlags(result, ["PE suspicion pattern"]);
  assertFeatures(result, [
    "sob",
    "orthopnoea",
    "paroxysmal_nocturnal_dyspnoea",
    "ankle_swelling",
    "raised_jvp",
    "bibasal_crackles",
  ]);
});

test("pilot hardening v2: PE red flag fires with unilateral calf swelling and recent surgery", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "54",
    sex: "female",
    presentingComplaint: "Shortness of breath",
    history:
      "She has sudden shortness of breath after recent knee surgery. Her left calf is swollen and tender. HR 118 and sats 90% on air. No fever or productive cough.",
    observations: "HR 118 sats 90%",
    keyNegatives: "no fever no productive cough",
    suspectedDiagnosis: "Pneumonia",
  }));

  assertRedFlags(result, ["PE suspicion pattern"]);
  assertFeatures(result, [
    "sob",
    "sudden_onset",
    "recent_surgery",
    "calf_swelling",
    "dvt_signs",
    "leg_swelling",
    "tachycardia",
    "hypoxia",
  ]);
});

test("pilot hardening v2: generic swollen legs without PE-specific support does not fire PE red flag", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "66",
    sex: "male",
    presentingComplaint: "Breathlessness",
    history:
      "He has mild shortness of breath and says his legs are swollen. No chest pain, no pleuritic pain, no haemoptysis, no recent surgery, no immobility and no long-haul travel.",
    keyNegatives:
      "no chest pain no pleuritic pain no haemoptysis no recent surgery no immobility no long-haul travel",
    suspectedDiagnosis: "Pulmonary embolism",
  }));

  assertFeatures(result, ["sob", "leg_swelling"]);
  assertNoFeatures(result, ["calf_swelling", "unilateral_leg_swelling", "dvt_signs"]);
  assertNoRedFlags(result, ["PE suspicion pattern"]);
});

test("pilot hardening v2: obstruction with voluntary guarding and no rigidity does not become perforation", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "70",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history:
      "Previous C-section and bowel surgery. Her abdomen is blown up like a drum with crampy pain that comes in waves, but the cramps are becoming constant. She has repeated vomiting, has not opened her bowels and has not passed wind. Pulse 112. There is voluntary guarding because she is uncomfortable, but no board-like rigidity.",
    observations: "Pulse 112",
    suspectedDiagnosis: "Perforation",
  }));

  assert.equal(result.presentationSupport.matchedBlockId, "acute-abdominal-pain");
  assert.equal(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "bowel-obstruction");
  assert.notEqual(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "perforated-viscus");
  assertNoRedFlags(result, ["Perforated viscus / peritonitis pattern"]);
  assertFeatures(result, [
    "previous_abdominal_surgery",
    "distension",
    "colicky_pain",
    "constant_pain",
    "vomiting",
    "obstipation",
    "unable_to_pass_flatus",
    "tachycardia",
    "guarding",
  ]);
  assertNoFeatures(result, ["rigidity", "peritonism", "guarding_rigidity"]);
});

test("pilot hardening v2: DKA metabolic breathing does not become asthma or PE when wheeze and chest pain are negated", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "19",
    sex: "male",
    presentingComplaint: "Out of breath",
    history:
      "Type 1 diabetes. He has been vomiting with mild abdominal pain and is breathing very deep and fast rather than looking wheezy. He cannot stop drinking, is passing urine a lot, and his breath smells of pear drops. No cough, no chest pain and no leg swelling. Sats 100% on air, RR 34, HR 126.",
    observations: "Sats 100% on air, RR 34, HR 126",
    suspectedDiagnosis: "Asthma",
  }));

  assert.equal(result.presentationSupport.matchedBlockId, "breathlessness-pleuritic-chest-pain");
  assert.equal(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "diabetic-ketoacidosis");
  assertRedFlags(result, ["DKA / metabolic acidosis pattern"]);
  assertNoRedFlags(result, ["PE suspicion pattern", "Severe asthma pattern"]);
  assertFeatures(result, [
    "diabetic_context",
    "type_1_diabetes",
    "vomiting",
    "abdominal_pain",
    "kussmaul_breathing",
    "polydipsia",
    "polyuria",
    "ketosis_breath",
    "tachycardia",
    "tachypnoea",
    "normal_oxygen_saturations",
  ]);
  assertNoFeatures(result, ["wheeze", "chest_pain", "leg_swelling"]);
});

test("pilot hardening v2: supported delirium routing remains intact", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "84",
    sex: "female",
    presentingComplaint: "Confusion",
    history:
      "Two days of fluctuating confusion with fever and cough. No chest pain and no abdominal pain. Family say this is new and she is usually independent.",
    observations: "Temp 38.6",
    suspectedDiagnosis: "Delirium",
  }));

  assert.equal(result.presentationSupport.matchedBlockId, "confusion-delirium");
  assert.ok(result.presentationSupport.confidence >= 6);
  assert.equal(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "delirium-secondary-to-infection");
  assertNoFeatures(result, ["chest_pain", "abdominal_pain"]);
});
