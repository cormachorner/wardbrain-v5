import test from "node:test";
import assert from "node:assert/strict";

import { extractFeatures } from "../lib/domain/featureExtractor.js";

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
