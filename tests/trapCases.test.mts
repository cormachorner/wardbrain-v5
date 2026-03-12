import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";
import { TRAP_CASES } from "./trapCases.js";

for (const trapCase of TRAP_CASES) {
  test(trapCase.description, () => {
    const result = analyzeCase(trapCase.input);

    assert.deepStrictEqual(
      {
        problemRepresentation: result.problemRepresentation,
        redFlags: result.redFlags,
        differentials: result.differentials,
        fitCheck: result.fitCheck,
        anchorWarning: result.anchorWarning,
        presentation: result.presentation,
        detectedFeatures: result.detectedFeatures,
      },
      trapCase.expected,
    );
  });
}
