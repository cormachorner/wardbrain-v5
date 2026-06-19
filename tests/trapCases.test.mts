import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";
import { TRAP_CASES } from "./trapCases.js";

for (const trapCase of TRAP_CASES) {
  test(trapCase.description, () => {
    const result = analyzeCase(trapCase.input);
    const expectedLead = trapCase.expected.differentials[0]?.name;
    const expectedRedFlagNames = trapCase.expected.redFlags.map((flag) => flag.name);

    assert.equal(result.differentials[0]?.name, expectedLead);
    assert.deepEqual(
      expectedRedFlagNames.filter(
        (expectedFlag) => !result.redFlags.some((actualFlag) => actualFlag.name === expectedFlag),
      ),
      [],
    );
    assert.deepEqual(
      trapCase.expected.detectedFeatures.filter(
        (expectedFeature) => !result.detectedFeatures.includes(expectedFeature),
      ),
      [],
    );
  });
}
