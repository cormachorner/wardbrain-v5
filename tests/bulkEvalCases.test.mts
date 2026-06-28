import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  evaluateBulkCase,
  parseBulkEvalCases,
  summarizeByPresentation,
  summarizeByTag,
  toCsv,
} from "../scripts/evaluate-cases.js";

test("bulk evaluation fixture contains the initial labelled case set", async () => {
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), "tests", "fixtures", "evalCases.json"), "utf8"),
  ) as unknown;
  const cases = parseBulkEvalCases(raw);

  assert.equal(cases.length, 30);
  assert.equal(new Set(cases.map((testCase) => testCase.id)).size, cases.length);
  assert.ok(cases.every((testCase) => testCase.expectedFeatureSlugs.length > 0));
  assert.ok(cases.every((testCase) => testCase.tags.length > 0));
  assert.ok(cases.some((testCase) => testCase.tags.includes("acs")));
  assert.ok(cases.some((testCase) => testCase.tags.includes("pe")));
  assert.ok(cases.some((testCase) => testCase.tags.includes("delirium")));

  const result = await evaluateBulkCase(cases[0], { liveLlm: false });

  assert.equal(result.id, cases[0].id);
  assert.equal(result.acceptedLlmFeatureSlugs.length, 0);
  assert.equal(result.llmUsefulAddedFeatures.length, 0);
  assert.equal(result.llmHarmfulAdditions.length, 0);

  const csv = toCsv([result]);
  assert.ok(csv.includes("deterministicLeadCorrect"));

  assert.ok(summarizeByPresentation([result]).length > 0);
  assert.ok(summarizeByTag([result]).length > 0);
});
