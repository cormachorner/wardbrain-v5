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
