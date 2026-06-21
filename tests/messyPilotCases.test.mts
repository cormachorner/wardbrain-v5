import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";
import { setDbFeaturePhrasePatternsForTest } from "../lib/domain/featureExtractor.js";
import { canonicalDiagnosisSlug } from "../lib/domain/diagnosisSlug.js";
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

test("messy ACS indigestion exertional chest heaviness routes to chest pain and beats reflux", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "",
    sex: "male",
    presentingComplaint: "Indigestion",
    history:
      "58-year-old man says he has “indigestion” and a heavy feeling in the middle of his chest since mowing the lawn an hour ago. It spread a bit into his jaw and left shoulder and he felt clammy and sick. He has type 2 diabetes, hypertension and high cholesterol. He keeps saying it’s probably the takeaway he had earlier because he’s had reflux before.",
    suspectedDiagnosis: "Reflux",
  }));

  assert.equal(result.presentationSupport.matchedBlockId, "chest-pain");
  assert.equal(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "acute-coronary-syndrome");
  assert.ok(redFlagNames(result).includes("ACS suspicion pattern"));
  assert.notEqual(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "gord");
  assertFeatures(result, [
    "chest_pain",
    "chest_heaviness",
    "exertional_pain",
    "pain_radiates_to_jaw",
    "pain_radiates_to_shoulder",
    "shoulder_pain",
    "sweating",
    "nausea",
    "diabetic_context",
    "hypertension",
    "hyperlipidaemia",
    "indigestion_like_chest_pain",
  ]);
});

test("messy tension pneumothorax fires red flag without PE overfire", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "",
    sex: "male",
    presentingComplaint: "Chest pain and shortness of breath",
    history:
      "Tall 23-year-old man with sudden left-sided pleuritic chest pain and rapidly worsening shortness of breath while sitting watching TV. No cough or fever. Looks distressed, HR 128, sats 89%, BP 92/60. Trachea seems slightly shifted and the left chest is very quiet with hyperresonance.",
    observations: "HR 128, sats 89%, BP 92/60",
  }));

  assert.equal(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "pneumothorax");
  assert.ok(redFlagNames(result).includes("Tension pneumothorax pattern"));
  assert.ok(!redFlagNames(result).includes("PE suspicion pattern"));
  assertFeatures(result, [
    "sudden_onset",
    "pleuritic_pain",
    "sob",
    "unilateral_reduced_air_entry",
    "hyperresonance",
    "hypoxia",
    "tachycardia",
    "hypotension",
    "tracheal_deviation",
  ]);
});

test("messy bowel obstruction beats perforated viscus without false rigidity", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history:
      "68-year-old woman with previous hysterectomy presents with 2 days of colicky abdominal pain, abdominal swelling and repeated vomiting. She hasn’t passed stool or flatus since yesterday. Pain has become more constant this evening and she looks uncomfortable. Pulse 108. Abdomen is distended with mild diffuse tenderness and some voluntary guarding, but no obvious rigidity.",
    observations: "Pulse 108",
  }));

  assert.equal(result.presentationSupport.matchedBlockId, "acute-abdominal-pain");
  assert.equal(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "bowel-obstruction");
  assert.notEqual(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "perforated-viscus");
  assertFeatures(result, [
    "older_age",
    "previous_abdominal_surgery",
    "colicky_pain",
    "distension",
    "vomiting",
    "obstipation",
    "unable_to_pass_flatus",
    "constant_pain",
    "tachycardia",
    "guarding",
  ]);
  assert.ok(!result.detectedFeatureSlugs.includes("rigidity"));
  assert.ok(!result.detectedFeatureSlugs.includes("peritonism"));
});

test("messy DKA metabolic acidosis breathlessness beats PE", () => {
  setDbFeaturePhrasePatternsForTest({});

  const result = analyzeCase(buildInput({
    age: "",
    sex: "male",
    presentingComplaint: "Breathlessness",
    history:
      "21-year-old man with type 1 diabetes has been vomiting since yesterday and is now breathing very deeply and quickly. He says he’s been thirsty for days and peeing constantly. Mild abdominal pain. No cough, no chest pain. Girlfriend says his breath smells “fruity”. HR 120, sats 99% on air, RR 32.",
    observations: "HR 120, sats 99% on air, RR 32",
  }));

  assert.equal(result.presentationSupport.matchedBlockId, "breathlessness-pleuritic-chest-pain");
  assert.equal(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "diabetic-ketoacidosis");
  assert.ok(redFlagNames(result).includes("DKA / metabolic acidosis pattern"));
  assert.notEqual(canonicalDiagnosisSlug(result.differentials[0]?.name ?? ""), "pulmonary-embolism");
  assert.ok(!redFlagNames(result).includes("PE suspicion pattern"));
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
});
