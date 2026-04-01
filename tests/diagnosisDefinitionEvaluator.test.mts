import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";
import { scoreDiagnosisDefinition } from "../lib/domain/diagnosisDefinitionEvaluator.js";
import { extractFeatures } from "../lib/domain/featureExtractor.js";
import { findDiagnosisDefinition } from "../lib/domain/presentationBlocks/index.js";

test("definition evaluator supports combined ifAll plus ifAny semantics", () => {
  const definition = findDiagnosisDefinition("mesenteric_ischaemia");

  assert.ok(definition);

  const features = extractFeatures({
    age: "78",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "Severe abdominal pain out of proportion with collapse and atrial fibrillation.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "BP 84/50",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  const scored = scoreDiagnosisDefinition(definition, features, {
    age: "78",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "Severe abdominal pain out of proportion with collapse and atrial fibrillation.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "BP 84/50",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.ok(scored.reasonsFor.includes("vascular or embolic context strongly supports mesenteric ischaemia"));
  assert.ok(scored.reasonsFor.includes("pain out of proportion with physiological compromise must escalate mesenteric ischaemia"));
});

test("acute abdominal cases use diagnosis definitions as the primary ranking path", () => {
  const result = analyzeCase({
    age: "39",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "Severe colicky flank pain radiating from the loin to the groin with haematuria and vomiting.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no collapse no chest pain",
    observations: "",
    leadDiagnosis: "renal colic",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Renal colic / ureteric stone");
});

test("high-specificity ectopic red flags promote ectopic into the top tier of ranked output", () => {
  const result = analyzeCase({
    age: "28",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history: "Pelvic pain with vaginal bleeding, dizziness, and a missed period. Could be pregnant.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "ectopic pregnancy",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Ectopic pregnancy");
  assert.ok(result.redFlags.some((flag) => flag.name === "Ectopic pregnancy pattern"));
});

test("appendicitis localization outranks diverticulitis despite mild diarrhoea noise", () => {
  const result = analyzeCase({
    age: "22",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history:
      "Pain started centrally then migrated to the right iliac fossa with focal tenderness and anorexia.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "mild loose stool but no persistent diarrhoea",
    observations: "",
    leadDiagnosis: "appendicitis",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Appendicitis");
  const diverticulitisIndex = result.differentials.findIndex((d) => d.name === "Diverticulitis");
  if (diverticulitisIndex !== -1) {
    assert.ok(diverticulitisIndex > 0);
  }
});

test("peritonitic upper abdominal pain outranks pancreatitis when guarding and lying-still features are present", () => {
  const result = analyzeCase({
    age: "61",
    sex: "female",
    presentingComplaint: "Upper abdominal pain",
    history:
      "Sudden severe upper abdominal pain with guarding, worse on movement, and lying still in bed.",
    pmh: "peptic ulcer disease",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no back radiation no binge drinking",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Perforated viscus");
});

test("non-migrated blocks still use the legacy rule engine path", () => {
  const result = analyzeCase({
    age: "64",
    sex: "male",
    presentingComplaint: "Chest pain",
    history: "Central chest pressure radiating to the jaw with sweating and nausea.",
    pmh: "hypertension",
    meds: "",
    social: "smoker",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "ACS",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Acute coronary syndrome");
});
