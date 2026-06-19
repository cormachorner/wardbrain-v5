import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";
import { extractFeatures, setDbFeaturePhrasePatternsForTest } from "../lib/domain/featureExtractor.js";
import { evaluateClinicalTestCase } from "../lib/testing/evaluateClinicalTestCase.js";
import { runClinicalTestCase } from "../lib/testing/runClinicalTestCase.js";
import type { CaseInput } from "../lib/types.js";

function buildInput(history: string, sex: CaseInput["sex"] = "female"): CaseInput {
  return {
    age: "",
    sex,
    presentingComplaint: "Abdominal pain",
    history,
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
}

test("hostile-aap-mesenteric-af-diarrhoea uses canonical dynamic features end to end", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 79-year-old with atrial fibrillation and peripheral vascular disease has sudden severe abdominal pain. She says the pain is far worse than expected. Her abdomen is soft with only mild tenderness. She has vomited once and passed loose stool.",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "mesenteric-ischaemia",
    expectedFeatureSlugs: [
      "older-age",
      "pain-out-of-proportion",
      "pain-severe-but-exam-mild",
      "atrial-fibrillation",
      "vascular-disease",
    ],
    expectedRedFlagSlugs: ["mesenteric-ischaemia-escalation-pattern"],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("older_age"));
  assert.ok(features.matchedFeatures.includes("pain_severe_but_exam_mild"));
  assert.ok(features.matchedFeatures.includes("pain_out_of_proportion"));
  assert.equal(analysis.differentials[0]?.name, "Mesenteric ischaemia");
  assert.deepEqual(result.missingFeatures, []);
  assert.deepEqual(result.missingRedFlags, []);
});

test("hostile-aap-appendicitis-loose-stool-rif extracts classic RIF pattern end to end", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 23-year-old has abdominal pain that began centrally and is now sharp in the right iliac fossa. She has focal RIF tenderness, anorexia, nausea, one loose stool, and pain worse on movement when walking.",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "appendicitis",
    expectedFeatureSlugs: [
      "abdominal-pain",
      "pain-migration-to-rif",
      "rif-pain",
      "rif-tenderness",
      "anorexia",
      "pain-worse-on-movement",
    ],
    expectedRedFlagSlugs: [],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("pain_migration_to_rif"));
  assert.ok(features.matchedFeatures.includes("rif_pain"));
  assert.ok(features.matchedFeatures.includes("rif_tenderness"));
  assert.equal(analysis.differentials[0]?.name, "Appendicitis");
  assert.deepEqual(result.missingFeatures, []);
});

test("hostile-aap-appendicitis-vomiting-fever-trap extracts cough and movement pain", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 31-year-old has abdominal pain that started around the umbilicus then moved to the right iliac fossa. He is off food, vomited twice, has a low fever, and has marked RIF tenderness. The pain is worse when he coughs or moves.",
    "male",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "appendicitis",
    expectedFeatureSlugs: [
      "abdominal-pain",
      "pain-migration-to-rif",
      "rif-pain",
      "rif-tenderness",
      "anorexia",
      "vomiting",
      "fever",
      "pain-worse-on-movement",
      "pain-worse-with-cough",
    ],
    expectedRedFlagSlugs: [],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("pain_worse_on_movement"));
  assert.ok(features.matchedFeatures.includes("pain_worse_with_cough"));
  assert.equal(analysis.differentials[0]?.name, "Appendicitis");
  assert.deepEqual(result.missingFeatures, []);
});

test("hostile-aap-mesenteric-mild-exam extracts mild tenderness without severe tenderness", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "An 82-year-old smoker with vascular disease is sweaty and restless with severe abdominal pain. The pain is much worse than the mild abdominal tenderness on examination. There is no guarding.",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "mesenteric-ischaemia",
    expectedFeatureSlugs: [
      "older-age",
      "vascular-disease",
      "smoking-history",
      "severe-pain",
      "mild-tenderness",
      "pain-severe-but-exam-mild",
      "pain-out-of-proportion",
    ],
    expectedRedFlagSlugs: ["mesenteric-ischaemia-escalation-pattern"],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("mild_tenderness"));
  assert.ok(!features.matchedFeatures.includes("severe_tenderness"));
  assert.equal(analysis.differentials[0]?.name, "Mesenteric ischaemia");
  assert.deepEqual(result.missingFeatures, []);
});

test("hostile-aap-aaa-flank-collapse triggers AAA red flag and canonical diagnosis match", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 76-year-old smoker with hypertension and vascular disease develops sudden abdominal, back, and left flank pain. He collapses, is sweaty, and is hypotensive on arrival.",
    "male",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "ruptured-symptomatic-abdominal-aortic-aneurysm",
    expectedFeatureSlugs: [
      "abdominal-pain",
      "flank-pain",
      "back-pain",
      "collapse",
      "hypotension",
      "older-age",
      "vascular-disease",
      "hypertension",
    ],
    expectedRedFlagSlugs: ["ruptured-aaa-suspicion-pattern"],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("abdominal_pain"));
  assert.ok(features.matchedFeatures.includes("flank_pain"));
  assert.ok(features.matchedFeatures.includes("collapse"));
  assert.equal(analysis.differentials[0]?.name, "Abdominal aortic aneurysm");
  assert.ok(analysis.redFlags.some((flag) => flag.name === "Ruptured AAA suspicion pattern"));
  assert.equal(result.leadDiagnosisMatched, true);
  assert.deepEqual(result.missingFeatures, []);
  assert.deepEqual(result.missingRedFlags, []);
});

test("hostile-aap-pyelonephritis-colic-noise ranks pyelonephritis over UTI/urosepsis", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 39-year-old has right flank pain with fever, vomiting, dysuria, urinary frequency, and renal angle tenderness. She says the pain comes in waves but she is febrile and systemically unwell.",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "pyelonephritis",
    expectedFeatureSlugs: [
      "flank-pain",
      "fever",
      "dysuria",
      "urinary-frequency",
      "cva-tenderness",
    ],
    expectedRedFlagSlugs: [],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("urinary_frequency"));
  assert.ok(features.matchedFeatures.includes("cva_tenderness"));
  assert.equal(analysis.matchedPresentationBlock?.block.id, "acute-abdominal-pain");
  assert.equal(analysis.differentials[0]?.name, "Pyelonephritis");
  assert.notEqual(analysis.differentials[0]?.name, "UTI / urosepsis");
  assert.ok(!analysis.redFlags.some((flag) => flag.name === "Ruptured AAA suspicion pattern"));
  assert.deepEqual(result.missingFeatures, []);
});

test("admin run service ranks hostile pyelonephritis above UTI/urosepsis", () => {
  setDbFeaturePhrasePatternsForTest({});

  const { analysis, caseInput, runResult } = runClinicalTestCase({
    slug: "hostile-aap-pyelonephritis-colic-noise",
    title: "Pyelonephritis with renal colic noise",
    presentationBlock: "acute_abdominal_pain",
    vignette:
      "A 39-year-old has right flank pain with fever, vomiting, dysuria, urinary frequency, and renal angle tenderness. She says the pain comes in waves but she is febrile and systemically unwell.",
    expectedLeadDiagnosisSlug: "pyelonephritis",
    expectedFeatureSlugsJson: {
      requiredExpectedFeatureSlugs: [
        "flank-pain",
        "fever",
        "vomiting",
        "dysuria",
        "urinary-frequency",
        "cva-tenderness",
        "colicky-pain",
      ],
      optionalExpectedFeatureSlugs: [],
    },
    expectedRedFlagSlugsJson: {
      expectedRedFlagSlugs: [],
      forbiddenRedFlagSlugs: [],
    },
    expectedFeatures: [],
  });

  assert.equal(caseInput.presentingComplaint, "Abdominal pain");
  assert.equal(caseInput.history.includes("right flank pain with fever"), true);
  assert.equal(analysis.differentials[0]?.name, "Pyelonephritis");
  assert.ok(!analysis.differentials.some((item, index) => index === 0 && item.name === "UTI / urosepsis"));
  assert.equal(runResult.actualLeadDiagnosisSlug, "pyelonephritis");
  assert.ok(runResult.actualTop3DiagnosisSlugs.includes("pyelonephritis"));
  assert.deepEqual(runResult.missingFeatures, []);
});

test("admin run service falls back to legacy expectedLeadDiagnosis when slug is empty", () => {
  setDbFeaturePhrasePatternsForTest({});

  const { runResult } = runClinicalTestCase({
    slug: "legacy-renal-colic-classic",
    title: "Classic renal colic",
    presentationBlock: "acute_abdominal_pain",
    vignette:
      "A patient has sudden severe flank pain radiating toward the groin and keeps moving around trying to get comfortable. There is no collapse and no hypotension.",
    expectedLeadDiagnosis: "renal_colic",
    expectedLeadDiagnosisSlug: null,
    expectedFeatureSlugsJson: {
      requiredExpectedFeatureSlugs: [
        "sudden-onset",
        "severe-pain",
        "flank-pain",
        "loin-to-groin-pain",
        "restless",
      ],
      optionalExpectedFeatureSlugs: ["colicky-pain"],
    },
    expectedRedFlagSlugsJson: {
      expectedRedFlagSlugs: [],
      forbiddenRedFlagSlugs: [],
    },
    expectedFeatures: [],
  });

  assert.equal(runResult.actualLeadDiagnosisSlug, "renal-colic-ureteric-stone");
  assert.equal(runResult.leadDiagnosisMatched, true);
  assert.deepEqual(runResult.missingFeatures, []);
  assert.deepEqual(runResult.missingOptionalFeatures, ["colicky_pain"]);
});

test("admin run service canonicalises legacy perforated viscus expectedLeadDiagnosis", () => {
  setDbFeaturePhrasePatternsForTest({});

  const { runResult } = runClinicalTestCase({
    slug: "perforated-viscus-classic",
    title: "Perforation with peritonism",
    presentationBlock: "acute_abdominal_pain",
    vignette:
      "A 68-year-old woman presents with sudden severe abdominal pain that worsens with movement. She lies very still. She has a history of NSAID use. On examination she has guarding and diffuse tenderness.",
    expectedLeadDiagnosis: "perforated_viscus_peritonitis",
    expectedLeadDiagnosisSlug: null,
    expectedFeatureSlugsJson: {
      requiredExpectedFeatureSlugs: [
        "pain-worse-on-movement",
        "lying-still",
        "sudden-onset",
        "abdominal-pain",
        "guarding",
        "severe-pain",
      ],
      optionalExpectedFeatureSlugs: [],
    },
    expectedRedFlagSlugsJson: {
      expectedRedFlagSlugs: [],
      forbiddenRedFlagSlugs: [],
    },
    expectedFeatures: [],
  });

  assert.equal(runResult.actualLeadDiagnosisSlug, "perforated-viscus");
  assert.equal(runResult.leadDiagnosisMatched, true);
  assert.deepEqual(runResult.missingFeatures, []);
});

test("hostile-aap-cholangitis-jaundice-fever ranks cholangitis above obstructive jaundice and avoids pale stool pallor", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 58-year-old has RUQ pain, fever, jaundice, dark urine, and pale stools. She has nausea and local RUQ tenderness after fatty food.",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "acute-cholangitis",
    expectedFeatureSlugs: [
      "ruq-pain",
      "fever",
      "jaundice",
      "dark-urine",
      "pale-stools",
    ],
    expectedRedFlagSlugs: ["acute-cholangitis-pattern"],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.equal(analysis.differentials[0]?.name, "Acute cholangitis");
  assert.ok(
    analysis.differentials.findIndex((item) => item.name === "Acute cholangitis") <
      analysis.differentials.findIndex((item) => item.name === "Choledocholithiasis / obstructive jaundice"),
  );
  assert.ok(!features.matchedFeatures.includes("pallor"));
  assert.deepEqual(result.missingFeatures, []);
  assert.deepEqual(result.missingRedFlags, []);
});

test("hostile-aap-bowel-obstruction-constipation-flatus extracts colicky obstructive pattern", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 69-year-old has crampy colicky abdominal pain, repeated vomiting, a swollen distended abdomen, and constipation. He has not passed wind since yesterday.",
    "male",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "bowel-obstruction",
    expectedFeatureSlugs: [
      "colicky-pain",
      "distension",
      "constipation",
      "obstipation",
      "unable-to-pass-flatus",
    ],
    expectedRedFlagSlugs: [],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("colicky_pain"));
  assert.ok(features.matchedFeatures.includes("obstipation"));
  assert.ok(features.matchedFeatures.includes("unable_to_pass_flatus"));
  assert.equal(analysis.differentials[0]?.name, "Bowel obstruction");
  assert.deepEqual(result.missingFeatures, []);
});

test("hostile-aap-bowel-obstruction-strangulation-risk beats perforation with focal guarding only", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 67-year-old man with previous abdominal surgery presents with 24 hours of worsening central abdominal pain and repeated green vomiting. The pain initially came in waves but has now become constant. His abdomen is visibly swollen, and he has not opened his bowels or passed wind since yesterday. He is tachycardic and has focal guarding in the lower abdomen.",
    "male",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "bowel-obstruction",
    expectedFeatureSlugs: [
      "abdominal-pain",
      "vomiting",
      "bilious-vomiting",
      "colicky-pain",
      "constant-pain",
      "distension",
      "obstipation",
      "unable-to-pass-flatus",
      "previous-abdominal-surgery",
      "tachycardia",
      "guarding",
    ],
    expectedRedFlagSlugs: ["bowel-obstruction-strangulation-risk-pattern"],
    forbiddenRedFlagSlugs: ["perforated-viscus-peritonitis-pattern"],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("distension"));
  assert.ok(features.matchedFeatures.includes("obstipation"));
  assert.ok(features.matchedFeatures.includes("unable_to_pass_flatus"));
  assert.ok(features.matchedFeatures.includes("colicky_pain"));
  assert.ok(features.matchedFeatures.includes("constant_pain"));
  assert.ok(features.matchedFeatures.includes("bilious_vomiting"));
  assert.ok(features.matchedFeatures.includes("guarding"));
  assert.ok(!features.matchedFeatures.includes("guarding_rigidity"));
  assert.ok(!features.matchedFeatures.includes("rigidity"));
  assert.ok(!features.matchedFeatures.includes("peritonism"));
  assert.equal(analysis.differentials[0]?.name, "Bowel obstruction");
  assert.ok(analysis.redFlags.some((flag) => flag.name === "Bowel obstruction strangulation risk pattern"));
  assert.ok(!analysis.redFlags.some((flag) => flag.name === "Perforated viscus / peritonitis pattern"));
  assert.deepEqual(result.missingFeatures, []);
  assert.deepEqual(result.missingRedFlags, []);
  assert.deepEqual(result.unexpectedForbiddenRedFlags, []);
});

test("hostile-aap-perforation-alcohol-noise extracts peritonitic behaviour and outranks pancreatitis", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 48-year-old heavy alcohol user develops sudden severe epigastric and upper abdominal pain. He lies completely still because movement makes it worse. He has guarding and pain worse with coughing.",
    "male",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "perforated-viscus",
    expectedFeatureSlugs: [
      "sudden-onset",
      "epigastric-pain",
      "lying-still",
      "guarding",
      "pain-worse-on-movement",
      "pain-worse-with-cough",
    ],
    expectedRedFlagSlugs: ["perforated-viscus-peritonitis-pattern"],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.equal(analysis.differentials[0]?.name, "Perforated viscus");
  assert.ok(!analysis.differentials.slice(0, 1).some((item) => item.name === "Acute pancreatitis"));
  assert.deepEqual(result.missingFeatures, []);
  assert.deepEqual(result.missingRedFlags, []);
});

test("hostile-aap-perforation-nsaid-cough extracts guarded cough-pain pattern", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 67-year-old taking regular ibuprofen for arthritis has abrupt epigastric abdominal pain. The abdomen is guarded, coughing worsens the pain, and she is lying still on the trolley.",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "perforated-viscus",
    expectedFeatureSlugs: [
      "sudden-onset",
      "epigastric-pain",
      "guarding",
      "lying-still",
      "pain-worse-with-cough",
    ],
    expectedRedFlagSlugs: ["perforated-viscus-peritonitis-pattern"],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("pain_worse_with_cough"));
  assert.equal(analysis.differentials[0]?.name, "Perforated viscus");
  assert.deepEqual(result.missingFeatures, []);
  assert.deepEqual(result.missingRedFlags, []);
});

test("hostile-aap-ectopic-rif-appendix-mimic detects missed period dynamically end to end", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 26-year-old who could be pregnant has lower abdominal and pelvic pain, worse on the right. Her last period was 7 weeks ago and she has vaginal bleeding with dizziness and pallor. There is RIF discomfort but no diarrhoea.",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "ectopic-pregnancy",
    expectedFeatureSlugs: [
      "pregnancy-possible",
      "missed-period",
      "vaginal-bleeding",
      "pelvic-pain",
    ],
    expectedRedFlagSlugs: ["ectopic-pregnancy-pattern"],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("missed_period"));
  assert.ok(features.matchedFeatures.includes("pregnancy_possible"));
  assert.ok(features.matchedFeatures.includes("rif_pain"));
  assert.equal(analysis.differentials[0]?.name, "Ectopic pregnancy");
  assert.deepEqual(result.missingFeatures, []);
  assert.deepEqual(result.missingRedFlags, []);
});

test("hostile-aap-ectopic-collapse does not trigger false AAA red flag", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 34-year-old with a positive pregnancy test has sudden pelvic pain and vaginal bleeding. She feels faint and collapsed briefly in the bathroom before arrival.",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "ectopic-pregnancy",
    expectedFeatureSlugs: [
      "positive-pregnancy-test",
      "pelvic-pain",
      "vaginal-bleeding",
      "dizziness",
      "collapse",
    ],
    expectedRedFlagSlugs: ["ectopic-pregnancy-pattern"],
    forbiddenRedFlagSlugs: ["ruptured-aaa-suspicion-pattern"],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("dizziness"));
  assert.equal(analysis.differentials[0]?.name, "Ectopic pregnancy");
  assert.ok(!analysis.redFlags.some((flag) => flag.name === "Ruptured AAA suspicion pattern"));
  assert.deepEqual(result.missingFeatures, []);
  assert.deepEqual(result.missingRedFlags, []);
  assert.deepEqual(result.unexpectedForbiddenRedFlags, []);
});

test("hostile-aap-vague-diffuse-pain canonicalises generalized abdominal pain", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 28-year-old has vague diffuse abdominal pain with nausea, vomiting, and diarrhoea after a takeaway meal. There is no RIF tenderness, no guarding, no jaundice, no collapse, and no flank-to-groin pain.",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "gastroenteritis",
    expectedFeatureSlugs: [
      "generalized-abdominal-pain",
      "nausea",
      "vomiting",
      "diarrhoea",
    ],
    expectedRedFlagSlugs: [],
    forbiddenRedFlagSlugs: ["ruptured-aaa-suspicion-pattern", "acute-coronary-syndrome-pattern"],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("generalized_abdominal_pain"));
  assert.ok(!features.matchedFeatures.includes("diffuse_abdominal_pain"));
  assert.equal(analysis.differentials[0]?.name, "Gastroenteritis");
  assert.deepEqual(result.missingFeatures, []);
  assert.deepEqual(result.unexpectedForbiddenRedFlags, []);
});

test("hostile-aap-dka-diffuse-discomfort extracts generalized discomfort without false guarding", () => {
  setDbFeaturePhrasePatternsForTest({});

  const input = buildInput(
    "A 19-year-old with type 1 diabetes has abdominal pain, nausea, repeated vomiting, sweating, marked thirst, passing lots of urine, and fruity breath. There is diffuse abdominal discomfort but no guarding.",
  );
  const features = extractFeatures(input);
  const analysis = analyzeCase(input);
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "dka",
    expectedFeatureSlugs: [
      "abdominal-pain",
      "nausea",
      "vomiting",
      "diabetic-context",
      "polydipsia",
      "polyuria",
      "ketosis-breath",
      "generalized-abdominal-pain",
    ],
    forbiddenRedFlagSlugs: ["perforated-viscus-peritonitis-pattern", "hypoglycaemia-pattern"],
    analysis,
    detectedFeatureSlugs: features.matchedFeatures,
  });

  assert.ok(features.matchedFeatures.includes("generalized_abdominal_pain"));
  assert.ok(!features.matchedFeatures.includes("guarding"));
  assert.ok(!features.matchedFeatures.includes("guarding_rigidity"));
  assert.equal(analysis.differentials[0]?.name, "Diabetic ketoacidosis");
  assert.deepEqual(result.missingFeatures, []);
  assert.deepEqual(result.unexpectedForbiddenRedFlags, []);
});
