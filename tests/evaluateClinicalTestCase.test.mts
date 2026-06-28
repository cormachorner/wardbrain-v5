import test from "node:test";
import assert from "node:assert/strict";

import { evaluateClinicalTestCase } from "../lib/testing/evaluateClinicalTestCase.js";
import { canonicalDiagnosisSlug } from "../lib/domain/diagnosisSlug.js";
import type { AnalyzeCaseResponse } from "../lib/types.js";

const baseAnalysis: AnalyzeCaseResponse = {
  problemRepresentation: "",
  redFlags: [
    {
      name: "Mesenteric ischaemia escalation pattern",
      explanation: "",
      boostDiagnoses: ["Mesenteric ischaemia"],
    },
  ],
  differentials: [
    { name: "Mesenteric ischaemia", score: 10, reasonsFor: [], reasonsAgainst: [] },
    { name: "Gastroenteritis", score: 4, reasonsFor: [], reasonsAgainst: [] },
    { name: "Renal colic / ureteric stone", score: 3, reasonsFor: [], reasonsAgainst: [] },
  ],
  fitCheck: {
    label: "Strong fit",
    summary: "",
    supporting: [],
    conflicting: [],
  },
  reasoningComparison: {
    leadAssessment: "",
    differentialAssessment: "",
    dangerAssessment: "",
  },
  anchorWarning: "",
  presentation: "",
  presentationSupport: {
    supportedBlocks: [],
    confidence: 0,
    reasons: [],
  },
  diagnosisTraces: [],
  uncertainty: {
    level: "low",
    summary: "",
    reasons: [],
    missingInformation: [],
  },
  guidelineSupport: {
    sources: [],
  },
  detectedFeatureSlugs: [],
  detectedFeatures: [],
  matchedPresentationBlock: null,
};

test("evaluates a passing clinical test case", () => {
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "mesenteric-ischaemia",
    expectedFeatureSlugs: ["abdominal_pain", "pain_out_of_proportion"],
    expectedRedFlagSlugs: ["mesenteric-ischaemia-escalation-pattern"],
    analysis: baseAnalysis,
    detectedFeatureSlugs: ["abdominal_pain", "pain_out_of_proportion", "atrial_fibrillation"],
  });

  assert.equal(result.status, "PASS");
  assert.equal(result.actualLeadDiagnosisSlug, "mesenteric-ischaemia");
  assert.deepEqual(result.actualTop3DiagnosisSlugs, [
    "mesenteric-ischaemia",
    "gastroenteritis",
    "renal-colic-ureteric-stone",
  ]);
  assert.deepEqual(result.missingFeatures, []);
  assert.deepEqual(result.missingRedFlags, []);
  assert.equal(result.leadDiagnosisMatched, true);
  assert.equal(result.leadDiagnosisInTop3, true);
});

test("evaluates partial clinical test cases when only some checks pass", () => {
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "appendicitis",
    expectedFeatureSlugs: ["pain_migration_to_rif", "rif_tenderness"],
    expectedRedFlagSlugs: ["mesenteric-ischaemia-escalation-pattern"],
    analysis: baseAnalysis,
    detectedFeatureSlugs: ["pain_migration_to_rif"],
  });

  assert.equal(result.status, "PARTIAL");
  assert.deepEqual(result.missingFeatures, ["rif_tenderness"]);
  assert.deepEqual(result.missingRedFlags, []);
  assert.equal(result.leadDiagnosisMatched, false);
  assert.equal(result.leadDiagnosisInTop3, false);
});

test("evaluates expected DB hyphen feature slugs against underscore detected feature slugs", () => {
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "mesenteric-ischaemia",
    expectedFeatureSlugs: ["pain-out-of-proportion", "pain-severe-but-exam-mild"],
    expectedRedFlagSlugs: ["mesenteric-ischaemia-escalation-pattern"],
    analysis: baseAnalysis,
    detectedFeatureSlugs: ["pain_out_of_proportion", "pain_severe_but_exam_mild"],
  });

  assert.equal(result.status, "PASS");
  assert.deepEqual(result.missingFeatures, []);
});

test("canonical diagnosis comparison treats ruptured AAA expectation as abdominal aortic aneurysm", () => {
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "ruptured-symptomatic-abdominal-aortic-aneurysm",
    expectedFeatureSlugs: [],
    expectedRedFlagSlugs: [],
    analysis: {
      ...baseAnalysis,
      differentials: [
        { name: "Abdominal aortic aneurysm", score: 20, reasonsFor: [], reasonsAgainst: [] },
      ],
      redFlags: [],
    },
    detectedFeatureSlugs: [],
  });

  assert.equal(result.status, "PASS");
  assert.equal(result.actualLeadDiagnosisSlug, "abdominal-aortic-aneurysm");
  assert.equal(result.leadDiagnosisMatched, true);
});

test("canonical diagnosis aliases support underscore diagnosis ids", () => {
  assert.equal(canonicalDiagnosisSlug("mesenteric_ischaemia"), "mesenteric-ischaemia");
  assert.equal(canonicalDiagnosisSlug("renal_colic"), "renal-colic-ureteric-stone");
  assert.equal(canonicalDiagnosisSlug("biliary_colic"), "biliary-colic-gallstone-disease");
});

test("missing optional expected features do not prevent PASS", () => {
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "mesenteric-ischaemia",
    requiredExpectedFeatureSlugs: ["pain-out-of-proportion"],
    optionalExpectedFeatureSlugs: ["pain-severe-but-exam-mild"],
    expectedRedFlagSlugs: ["mesenteric-ischaemia-escalation-pattern"],
    analysis: baseAnalysis,
    detectedFeatureSlugs: ["pain_out_of_proportion"],
  });

  assert.equal(result.status, "PASS");
  assert.deepEqual(result.missingRequiredFeatures, []);
  assert.deepEqual(result.missingOptionalFeatures, ["pain_severe_but_exam_mild"]);
});

test("unexpected forbidden red flags prevent PASS", () => {
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "mesenteric-ischaemia",
    requiredExpectedFeatureSlugs: ["pain-out-of-proportion"],
    forbiddenRedFlagSlugs: ["mesenteric-ischaemia-escalation-pattern"],
    analysis: baseAnalysis,
    detectedFeatureSlugs: ["pain_out_of_proportion"],
  });

  assert.equal(result.status, "PARTIAL");
  assert.deepEqual(result.unexpectedForbiddenRedFlags, ["mesenteric-ischaemia-escalation-pattern"]);
});

test("overlapping required and optional features are treated as required only", () => {
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "mesenteric-ischaemia",
    requiredExpectedFeatureSlugs: ["pain-out-of-proportion"],
    optionalExpectedFeatureSlugs: ["pain-out-of-proportion", "pain-severe-but-exam-mild"],
    analysis: baseAnalysis,
    detectedFeatureSlugs: ["pain_out_of_proportion"],
  });

  assert.equal(result.status, "PASS");
  assert.deepEqual(result.missingRequiredFeatures, []);
  assert.deepEqual(result.missingOptionalFeatures, ["pain_severe_but_exam_mild"]);
});

test("overlapping expected and forbidden red flags are treated as expected only", () => {
  const result = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: "mesenteric-ischaemia",
    expectedRedFlagSlugs: ["mesenteric-ischaemia-escalation-pattern"],
    forbiddenRedFlagSlugs: ["mesenteric-ischaemia-escalation-pattern"],
    analysis: baseAnalysis,
    detectedFeatureSlugs: [],
  });

  assert.equal(result.status, "PASS");
  assert.deepEqual(result.missingRedFlags, []);
  assert.deepEqual(result.unexpectedForbiddenRedFlags, []);
});
