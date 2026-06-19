import test from "node:test";
import assert from "node:assert/strict";

import {
  extractFeatures,
  setDbFeaturePhrasePatternsForTest,
} from "../lib/domain/featureExtractor.js";
import { canonicalFeatureSlug } from "../lib/domain/featureSlug.js";
import { analyzeCase } from "../lib/application/analyzeCase.js";

setDbFeaturePhrasePatternsForTest({});

function extractHistoryFeatures(history: string) {
  return extractFeatures({
    age: "",
    sex: "",
    presentingComplaint: "",
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
  }).matchedFeatures;
}

function analyzePainHistory(history: string) {
  return analyzeCase({
    age: "40",
    sex: "male",
    presentingComplaint: "Pain",
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
  });
}

test("domain feature extractor detects classic localized inflammatory RUQ pattern", () => {
  const features = extractFeatures({
    age: "45",
    sex: "female",
    presentingComplaint: "RUQ pain",
    history:
      "Constant right upper quadrant pain after a heavy meal with fever and tender under the right costal margin.",
    pmh: "known gallstones",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no jaundice",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.ok(features.matchedFeatures.includes("ruq_pain"));
  assert.ok(features.matchedFeatures.includes("persistent_ruq_pain"));
  assert.ok(features.matchedFeatures.includes("localized_ruq_tenderness"));
  assert.ok(features.matchedFeatures.includes("post_prandial_pain"));
});

test("domain feature extractor coordinates abdominal and pelvic pain locations", () => {
  const features = extractHistoryFeatures("She has abdominal and pelvic pain with nausea.");

  assert.ok(features.includes("abdominal_pain"));
  assert.ok(features.includes("pelvic_pain"));
});

test("domain feature extractor coordinates chest and jaw pain locations", () => {
  const features = extractHistoryFeatures("He reports chest and jaw pain while walking.");

  assert.ok(features.includes("chest_pain"));
  assert.ok(features.includes("jaw_pain"));
});

test("domain feature extractor coordinates pain in the back and flank", () => {
  const features = extractHistoryFeatures("There is pain in the back and flank after waking.");

  assert.ok(features.includes("back_pain"));
  assert.ok(features.includes("flank_pain"));
});

test("domain feature extractor does not coordinate negated chest or jaw pain", () => {
  const features = extractHistoryFeatures("She has epigastric discomfort but no chest or jaw pain.");

  assert.ok(!features.includes("chest_pain"));
  assert.ok(!features.includes("jaw_pain"));
});

test("domain feature extractor keeps chest pain radiating to jaw as radiation pattern", () => {
  const features = extractHistoryFeatures("He has chest pain radiating to the jaw with sweating.");

  assert.ok(features.includes("chest_pain"));
  assert.ok(features.includes("pain_radiates_to_jaw"));
});

test("analyzeCase preserves chest and jaw pain slugs from live form fields", () => {
  const result = analyzePainHistory("chest and jaw pain");

  assert.ok(result.detectedFeatureSlugs.includes("chest_pain"));
  assert.ok(result.detectedFeatureSlugs.includes("jaw_pain"));
  assert.ok(result.detectedFeatures.includes("chest pain"));
  assert.ok(result.detectedFeatures.includes("jaw pain"));
});

test("analyzeCase preserves negated coordinated chest and jaw pain", () => {
  const result = analyzePainHistory("no chest or jaw pain");

  assert.ok(!result.detectedFeatureSlugs.includes("chest_pain"));
  assert.ok(!result.detectedFeatureSlugs.includes("jaw_pain"));
});

test("analyzeCase preserves chest pain plus jaw radiation", () => {
  const result = analyzePainHistory("chest pain radiating to the jaw");

  assert.ok(result.detectedFeatureSlugs.includes("chest_pain"));
  assert.ok(result.detectedFeatureSlugs.includes("pain_radiates_to_jaw"));
});

test("domain feature extractor does not trigger missed_period for 3 weeks ago", () => {
  const features = extractFeatures({
    age: "28",
    sex: "female",
    presentingComplaint: "Lower abdominal pain",
    history: "Last period was 3 weeks ago.",
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

  assert.ok(!features.matchedFeatures.includes("missed_period"));
});

test("domain feature extractor triggers missed_period for 4 weeks ago", () => {
  const features = extractFeatures({
    age: "28",
    sex: "female",
    presentingComplaint: "Pelvic pain",
    history: "LMP 4 weeks ago.",
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

  assert.ok(features.matchedFeatures.includes("missed_period"));
});

test("domain feature extractor triggers missed_period for 7 weeks ago", () => {
  const features = extractFeatures({
    age: "31",
    sex: "female",
    presentingComplaint: "Pelvic pain and bleeding",
    history: "Last menstrual period 7 weeks ago.",
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

  assert.ok(features.matchedFeatures.includes("missed_period"));
});

test("domain feature extractor triggers missed_period for last menstrual period was 5 weeks ago", () => {
  const features = extractFeatures({
    age: "31",
    sex: "female",
    presentingComplaint: "Pelvic pain and bleeding",
    history: "Last menstrual period was 5 weeks ago.",
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

  assert.ok(features.matchedFeatures.includes("missed_period"));
});

test("domain feature extractor adds older_age from dynamic age phrases", () => {
  const features = extractFeatures({
    age: "",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "A 79-year-old man presents with central abdominal pain.",
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

  assert.ok(features.matchedFeatures.includes("older_age"));
});

test("domain feature extractor adds older_age from aged wording", () => {
  const features = extractFeatures({
    age: "",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "A patient aged 79 presents with central abdominal pain.",
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

  assert.ok(features.matchedFeatures.includes("older_age"));
});

test("domain feature extractor adds older_age from yo wording", () => {
  const features = extractFeatures({
    age: "",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "A 79yo man presents with abdominal pain.",
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

  assert.ok(features.matchedFeatures.includes("older_age"));
});

test("domain feature extractor adds female childbearing age from structured age and sex", () => {
  const features = extractFeatures({
    age: "32",
    sex: "female",
    presentingComplaint: "Pelvic pain",
    history: "Pelvic pain and vaginal bleeding.",
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

  assert.ok(features.matchedFeatures.includes("female_of_childbearing_age"));
});

test("domain feature extractor handles pregnancy timing and gestational wording dynamically", () => {
  const features = extractHistoryFeatures("She is six weeks pregnant with pelvic pain and bleeding.");

  assert.ok(features.includes("pregnancy_possible"));
  assert.ok(features.includes("missed_period"));
});

test("domain feature extractor maps duration wording to chronic and progressive course features", () => {
  const features = extractHistoryFeatures(
    "He has had dry eyes for six months. The cough has been worsening over three days.",
  );

  assert.ok(features.includes("chronic_course"));
  assert.ok(features.includes("progressive_course"));
});

test("domain feature extractor parses richer vital sign wording from the vignette", () => {
  const features = extractHistoryFeatures(
    "HR is 118, respiratory rate is 28, BP is 85 over 50, oxygen saturations are 90%, and she is febrile at 38.5.",
  );

  assert.ok(features.includes("tachycardia"));
  assert.ok(features.includes("tachypnoea"));
  assert.ok(features.includes("hypotension"));
  assert.ok(features.includes("hypoxia"));
  assert.ok(features.includes("fever"));
});

test("domain feature extractor detects temporal meal relationship beyond exact phrases", () => {
  const features = extractHistoryFeatures("The pain starts 30 minutes after meals and settles later.");

  assert.ok(features.includes("post_prandial_pain"));
  assert.ok(features.includes("worse_after_meals"));
});

test("domain feature extractor adds pain_severe_but_exam_mild from severe pain plus mild exam mismatch", () => {
  const features = extractFeatures({
    age: "79",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history:
      "She feels clammy and says the pain is much worse than expected. She has atrial fibrillation and peripheral vascular disease. Her abdomen is soft with only mild tenderness.",
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

  assert.ok(features.matchedFeatures.includes("pain_out_of_proportion"));
  assert.ok(features.matchedFeatures.includes("pain_severe_but_exam_mild"));
});

test("domain feature extractor adds pain_severe_but_exam_mild from severe pain and soft exam in separate sentences", () => {
  const features = extractFeatures({
    age: "72",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history: "She has excruciating abdominal pain. The abdomen is soft and there is no guarding.",
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

  assert.ok(features.matchedFeatures.includes("pain_severe_but_exam_mild"));
  assert.ok(features.matchedFeatures.includes("pain_out_of_proportion"));
});

test("domain feature extractor adds pain_severe_but_exam_mild from 10 out of 10 pain and minimal findings", () => {
  const features = extractHistoryFeatures("He reports 10/10 abdominal pain. The abdomen has minimal abdominal findings and no peritonism.");

  assert.ok(features.includes("pain_severe_but_exam_mild"));
  assert.ok(features.includes("pain_out_of_proportion"));
});

test("canonical feature slug helper converts DB hyphenated slugs to engine underscore slugs", () => {
  assert.equal(canonicalFeatureSlug("pain-migration-to-rif"), "pain_migration_to_rif");
  assert.equal(canonicalFeatureSlug("pain-out-of-proportion"), "pain_out_of_proportion");
});

test("domain feature extractor canonicalises DB phrase feature slugs before matching", () => {
  setDbFeaturePhrasePatternsForTest({
    "started central then moved to the right iliac fossa": "pain-migration-to-rif",
    "pain out of proportion": "pain-out-of-proportion",
  });

  const features = extractFeatures({
    age: "",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history:
      "The pain started central then moved to the right iliac fossa and is pain out of proportion.",
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

  assert.ok(features.matchedFeatures.includes("pain_migration_to_rif"));
  assert.ok(features.matchedFeatures.includes("pain_out_of_proportion"));
  assert.ok(!features.matchedFeatures.includes("pain-migration-to-rif"));
  assert.ok(!features.matchedFeatures.includes("pain-out-of-proportion"));

  setDbFeaturePhrasePatternsForTest({});
});
