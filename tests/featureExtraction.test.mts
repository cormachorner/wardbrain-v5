import test from "node:test";
import assert from "node:assert/strict";

import { extractFeatures } from "../lib/featureExtractor.js";
import { FEATURE_EXTRACTION_CASES } from "./featureExtractionCases.js";

for (const extractionCase of FEATURE_EXTRACTION_CASES) {
  test(extractionCase.description, () => {
    const result = extractFeatures(extractionCase.input);

    for (const expectedFeature of extractionCase.expectedPresent) {
      assert.ok(
        result.matchedFeatures.includes(expectedFeature),
        `Expected ${expectedFeature} in ${extractionCase.id}, got ${result.matchedFeatures.join(", ")}`,
      );
    }

    for (const absentFeature of extractionCase.expectedAbsent) {
      assert.ok(
        !result.matchedFeatures.includes(absentFeature),
        `Did not expect ${absentFeature} in ${extractionCase.id}, got ${result.matchedFeatures.join(", ")}`,
      );
    }
  });
}
