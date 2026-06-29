import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/application/analyzeCase.js";
import { canonicalDiagnosisSlug } from "../lib/domain/diagnosisSlug.js";
import { extractFeatures, setDbFeaturePhrasePatternsForTest } from "../lib/domain/featureExtractor.js";

setDbFeaturePhrasePatternsForTest({});

function analyse(vignette: string, overrides: Partial<Parameters<typeof analyzeCase>[0]> = {}) {
  return analyzeCase({
    age: "",
    sex: "",
    presentingComplaint: "Confusion",
    history: vignette,
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    ...overrides,
  });
}

function topSlug(result: ReturnType<typeof analyzeCase>) {
  return canonicalDiagnosisSlug(result.differentials[0]?.name ?? "");
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

function assertNoFeatures(features: string[], forbiddenFeatures: string[]) {
  assert.deepEqual(forbiddenFeatures.filter((feature) => features.includes(feature)), []);
}

test("confusion delirium v1: UTI delirium extracts urinary source and avoids chest false positives", () => {
  const result = analyse(
    "An 84-year-old is acutely confused with fever, urinary frequency, new incontinence and foul-smelling urine. No clear chest pain or breathlessness history.",
    { age: "84" },
  );

  assert.equal(result.presentationSupport.matchedBlockId, "confusion-delirium");
  assert.equal(topSlug(result), "delirium-secondary-to-infection");
  assert.ok(redFlagNames(result).includes("Think delirium pattern"));
  assert.ok(redFlagNames(result).includes("Infection with acute confusion pattern"));
  assertFeatures(result, ["older_age", "confusion", "fever", "urinary_frequency", "urinary_incontinence", "urinary_symptoms"]);
  assertNoFeatures(result.detectedFeatureSlugs, ["chest_pain", "sob"]);
});

test("confusion delirium v1: pneumonia delirium keeps infection delirium ahead of ACS noise", () => {
  const result = analyse(
    "A 79-year-old is suddenly muddled and drowsy with fever, productive cough, green sputum and crackles at the right base. Family deny chest pain.",
    { age: "79" },
  );

  assert.equal(result.presentationSupport.matchedBlockId, "confusion-delirium");
  assert.equal(topSlug(result), "delirium-secondary-to-infection");
  assertFeatures(result, ["confusion", "drowsiness", "fever", "productive_cough", "sputum_change", "crackles", "infection_source"]);
  assertNoFeatures(result.detectedFeatureSlugs, ["chest_pain"]);
});

test("confusion delirium v1: hypoglycaemia is urgent reversible lead when low glucose context is present", () => {
  const result = analyse(
    "A diabetic patient on insulin missed meals and is sweaty, shaky and confused. Capillary glucose is low.",
    { pmh: "Diabetes", meds: "Insulin" },
  );

  assert.equal(topSlug(result), "hypoglycaemia");
  assert.ok(redFlagNames(result).includes("Hypoglycaemia urgent reversible-cause pattern"));
  assertFeatures(result, ["diabetic_context", "hypoglycaemia_cue", "sweating", "confusion"]);
});

test("confusion delirium v1: focal neurology in confusion fires neurological emergency pattern", () => {
  const result = analyse("New confusion with facial droop, left arm weakness and slurred speech. No fever.");

  assert.equal(topSlug(result), "stroke-neurological-emergency");
  assert.ok(redFlagNames(result).includes("New focal neurological deficit pattern"));
  assertFeatures(result, ["confusion", "focal_neurology", "focal_weakness", "dysarthria"]);
});

test("confusion delirium v1: medication toxicity, alcohol withdrawal and metabolic disturbance can lead when signalled", () => {
  assert.equal(
    topSlug(analyse("New confusion and drowsiness after starting morphine and zopiclone. No fever or focal neurology.")),
    "medication-sedative-toxicity",
  );
  assert.equal(
    topSlug(analyse("Alcohol dependent patient stopped drinking yesterday and now has agitation, hallucinations, tremor, sweating and confusion.")),
    "alcohol-withdrawal",
  );
  assert.equal(
    topSlug(analyse("Older patient with poor oral intake, dehydration, hyponatraemia and drowsy confusion. No focal neurology.")),
    "electrolyte-metabolic-disturbance",
  );
});

test("confusion delirium v1: baseline dementia stays comparator when acute deterioration is stated", () => {
  const result = analyse(
    "Known baseline dementia but now acutely worse with fever, smelly urine and poor oral intake.",
    { age: "86" },
  );

  assert.equal(topSlug(result), "delirium-secondary-to-infection");
  assert.notEqual(topSlug(result), "dementia-chronic-cognitive-impairment");
  assertFeatures(result, ["baseline_dementia", "acute_on_chronic_confusion", "fever", "urinary_symptoms", "poor_oral_intake"]);
});

test("confusion delirium v1: negated urinary, focal neurology and meningism are not extracted", () => {
  const features = extractFeatures({
    age: "78",
    sex: "female",
    presentingComplaint: "Confusion",
    history:
      "New confusion. Denies urinary symptoms. No focal neurology. No neck stiffness, no photophobia and no clear chest pain or breathlessness.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
  }).matchedFeatures;

  assert.ok(features.includes("confusion"));
  assertNoFeatures(features, [
    "urinary_symptoms",
    "focal_neurology",
    "neck_stiffness",
    "photophobia",
    "chest_pain",
    "sob",
  ]);
});

