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

test("ectopic pregnancy gets extra top-tier promotion from dizziness and pallor", () => {
  const result = analyzeCase({
    age: "30",
    sex: "female",
    presentingComplaint: "Lower abdominal pain",
    history: "Pelvic pain with vaginal bleeding, missed period, dizziness, and she looks pale.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Ectopic pregnancy");
});

test("ectopic pregnancy is strongly penalized in male patients", () => {
  const result = analyzeCase({
    age: "30",
    sex: "male",
    presentingComplaint: "Lower abdominal pain",
    history: "Pelvic pain with vaginal bleeding and a missed period.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.notEqual(result.differentials[0]?.name, "Ectopic pregnancy");
});

test("mesenteric ischaemia is top-tier in classic vascular abdominal pain despite loose stool noise", () => {
  const result = analyzeCase({
    age: "79",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history:
      "Severe unexplained abdominal pain out of proportion with atrial fibrillation and vascular disease.",
    pmh: "vascular disease",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "one loose stool but no persistent diarrhoea",
    observations: "BP 88/54",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Mesenteric ischaemia");
  assert.ok(result.redFlags.some((flag) => flag.name === "Mesenteric ischaemia escalation pattern"));
});

test("pain out of proportion variant wording is extracted and promotes mesenteric ischaemia", () => {
  const result = analyzeCase({
    age: "76",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "Pain far worse than expected with severe pain and minimal tenderness in a patient with atrial fibrillation.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.ok(result.detectedFeatures.includes("pain out of proportion"));
  assert.equal(result.differentials[0]?.name, "Mesenteric ischaemia");
});

test("mild-exam mismatch wording is extracted and promotes mesenteric ischaemia", () => {
  const result = analyzeCase({
    age: "80",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "Severe pain but mild tenderness, with minimal abdominal findings, in a patient with vascular disease.",
    pmh: "vascular disease",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "one loose stool",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.ok(result.detectedFeatures.includes("severe pain with mild abdominal findings"));
  assert.equal(result.differentials[0]?.name, "Mesenteric ischaemia");
  assert.ok(result.redFlags.some((flag) => flag.name === "Mesenteric ischaemia escalation pattern"));
});

test("exact live mesenteric vignette uses the acute abdominal evaluator path and detects the missing features", () => {
  const input = {
    age: "78",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history:
      "Severe abdominal pain with vomiting and loose stool. The pain is far worse than expected. He cannot get comfortable. The abdomen is only mildly tender. Known atrial fibrillation and peripheral vascular disease.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  };

  const result = analyzeCase(input);

  assert.ok(result.detectedFeatures.includes("pain out of proportion"));
  assert.ok(result.detectedFeatures.includes("severe pain with mild abdominal findings"));
  assert.ok(result.detectedFeatures.includes("severe pain"));
  assert.ok(result.detectedFeatures.includes("vascular disease"));
  assert.equal(result.differentials[0]?.name, "Mesenteric ischaemia");
  assert.ok(result.redFlags.some((flag) => flag.name === "Mesenteric ischaemia escalation pattern"));
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

test("appendicitis remains top-tier when bumps-in-road style movement pain is present", () => {
  const result = analyzeCase({
    age: "24",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history:
      "Pain started centrally then moved to the right iliac fossa with focal tenderness, anorexia, and pain worse over bumps in the road.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "mild loose stool only",
    observations: "",
    leadDiagnosis: "appendicitis",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Appendicitis");
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

test("perforation outranks pancreatitis even with alcohol history when true peritonitic behaviour is present", () => {
  const result = analyzeCase({
    age: "54",
    sex: "male",
    presentingComplaint: "Upper abdominal pain",
    history:
      "Sudden severe upper abdominal pain with guarding, pain worse on movement and coughing, and he is lying still.",
    pmh: "peptic ulcer disease",
    meds: "",
    social: "heavy alcohol intake",
    keyPositives: "",
    keyNegatives: "no back radiation",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Perforated viscus");
});

test("renal colic is strongly promoted by flank-to-groin pain with restlessness", () => {
  const result = analyzeCase({
    age: "37",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history:
      "Severe colicky flank pain radiating to the groin and he cannot get comfortable, pacing with pain.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no dysuria no fever",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Renal colic / ureteric stone");
});

test("exact live flank-pain vignette detects the renal colic composite end-to-end", () => {
  const result = analyzeCase({
    age: "64",
    sex: "male",
    presentingComplaint: "Flank pain",
    history:
      "Sudden severe left flank pain radiating toward the groin. He keeps moving around trying to get comfortable.",
    pmh: "hypertension and smoking history",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no chest pain no shortness of breath no dysuria no fever",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.ok(result.detectedFeatures.includes("sudden onset"));
  assert.ok(result.detectedFeatures.includes("severe pain"));
  assert.ok(result.detectedFeatures.includes("flank pain"));
  assert.ok(result.detectedFeatures.includes("loin-to-groin pain"));
  assert.ok(result.detectedFeatures.includes("restless / cannot get comfortable"));
  assert.equal(result.differentials[0]?.name, "Renal colic / ureteric stone");
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
