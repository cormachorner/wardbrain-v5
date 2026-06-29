import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  evaluateBulkCase,
  filterBulkEvalCases,
  loadBulkEvalCases,
  parseBulkEvalCliArgs,
  parseBulkEvalCases,
  summarizeByPresentation,
  summarizeByTag,
  toCsv,
} from "../scripts/evaluate-cases.js";
import {
  getFeatureImportanceLevel,
  getFeatureImportanceWeight,
} from "../lib/llm/featureImportance.js";

test("bulk evaluation fixture contains the initial labelled case set", async () => {
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), "tests", "fixtures", "evalCases.json"), "utf8"),
  ) as unknown;
  const cases = parseBulkEvalCases(raw);

  assert.equal(cases.length, 37);
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
  assert.ok(result.deterministicExpectedFeatureRecallWeighted >= 0);
  assert.ok(result.deterministicExpectedFeatureRecallWeighted <= 1);
  assert.equal(
    result.deterministicExpectedFeatureRecallWeighted,
    result.llmExpectedFeatureRecallWeighted,
  );

  const csv = toCsv([result]);
  assert.ok(csv.includes("deterministicLeadCorrect"));
  assert.ok(csv.includes("deterministicExpectedFeatureRecallWeighted"));
  assert.ok(csv.includes("llmExpectedFeatureRecallWeighted"));

  const presentationSummary = summarizeByPresentation([result]);
  const tagSummary = summarizeByTag([result]);

  assert.ok(presentationSummary.length > 0);
  assert.ok(tagSummary.length > 0);
  assert.ok(presentationSummary[0].averageDeterministicFeatureRecallWeighted >= 0);
  assert.ok(tagSummary[0].averageLlmFeatureRecallWeighted >= 0);
});

test("bulk evaluation harness includes headache v1 fixtures", async () => {
  const cases = loadBulkEvalCases();

  assert.equal(cases.length, 57);
  assert.equal(new Set(cases.map((testCase) => testCase.id)).size, cases.length);
  assert.equal(cases.filter((testCase) => testCase.tags.includes("headache_v1")).length, 20);
  assert.ok(cases.some((testCase) => testCase.presentation === "headache"));
  assert.equal(cases.filter((testCase) => testCase.tags.includes("delirium")).length, 10);
  assert.ok(cases.some((testCase) => testCase.presentation === "confusion"));

  const headacheCase = cases.find(
    (testCase) => testCase.id === "headache-v1-sah-thunderclap-vomiting-neck-stiffness",
  );

  assert.ok(headacheCase);

  const result = await evaluateBulkCase(headacheCase, { liveLlm: false });

  assert.equal(result.id, headacheCase.id);
  assert.equal(result.presentation, "headache");
  assert.equal(result.tags.includes("headache_v1"), true);
  assert.equal(result.deterministicLeadCorrect, true);

  const presentationSummary = summarizeByPresentation([result]);
  const tagSummary = summarizeByTag([result]);

  assert.ok(presentationSummary.some((summary) => summary.group === "headache"));
  assert.ok(tagSummary.some((summary) => summary.group === "headache"));
  assert.ok(tagSummary.some((summary) => summary.group === "headache_v1"));
});

test("bulk evaluation CLI --case filters to a single case", () => {
  const cases = loadBulkEvalCases();
  const args = parseBulkEvalCliArgs([
    "--case",
    "bulk-heart-failure-001-overload",
    "--verbose",
  ]);
  const filtered = filterBulkEvalCases(cases, args);

  assert.equal(args.verbose, true);
  assert.deepEqual(filtered.map((testCase) => testCase.id), [
    "bulk-heart-failure-001-overload",
  ]);
  assert.throws(
    () => filterBulkEvalCases(cases, { caseId: "missing-case" }),
    /Evaluation case not found: missing-case/,
  );
  assert.throws(() => parseBulkEvalCliArgs(["--case"]), /Missing case id/);
});

test("feature importance weights are slug-only and default to supporting", () => {
  assert.equal(getFeatureImportanceLevel("hypoxia"), "critical");
  assert.equal(getFeatureImportanceWeight("hypoxia"), 5);
  assert.equal(getFeatureImportanceWeight("tachycardia"), 3);
  assert.equal(getFeatureImportanceWeight("nausea"), 1);
  assert.equal(getFeatureImportanceWeight("smoking-history"), 1);
  assert.equal(getFeatureImportanceWeight("unknown_future_feature"), 1);
});
