import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateLlmExtractionCase,
  summarizeLlmEvaluation,
} from "../lib/llm/evaluation.js";
import type { LlmEvaluationCase } from "../lib/llm/evaluation.js";
import type { LlmExtractionConfig } from "../lib/llm/config.js";
import type { CaseInput } from "../lib/types.js";

const mockConfig: LlmExtractionConfig = {
  enabled: true,
  usable: true,
  provider: "openai",
  model: "mock",
  apiKey: "mock",
  confidenceThreshold: 0.8,
  timeoutMs: 1_000,
};

function buildInput(overrides: Partial<CaseInput>): CaseInput {
  return {
    age: "58",
    sex: "male",
    presentingComplaint: "Chest pain",
    history: "Central chest pain with sweating and nausea.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
    suspectedDiagnosis: "",
    ...overrides,
  };
}

test("LLM evaluation records useful mocked feature injection", async () => {
  const evaluationCase: LlmEvaluationCase = {
    id: "unit-acs-hyperlipidaemia",
    title: "Unit ACS with missing hyperlipidaemia",
    input: buildInput({}),
    expectedLeadDiagnosisSlug: "acute-coronary-syndrome",
    expectedKeyFeatures: ["chest_pain", "hyperlipidaemia"],
    expectedUsefulLlmAddedFeatures: ["hyperlipidaemia"],
    mockLlmFeatures: [
      { slug: "hyperlipidaemia", evidence: "high cholesterol", confidence: 0.95 },
    ],
  };

  const result = await evaluateLlmExtractionCase(evaluationCase, {
    llmConfig: mockConfig,
  });

  assert.deepEqual(result.acceptedLlmFeatureSlugs, ["hyperlipidaemia"]);
  assert.deepEqual(result.missingExpectedFeaturesDeterministic, ["hyperlipidaemia"]);
  assert.deepEqual(result.missingExpectedFeaturesAugmented, []);
  assert.equal(result.usefulFeaturesAdded, true);
  assert.equal(result.expectedRecovered, true);
});

test("LLM evaluation detects harm when forbidden red flags appear after augmentation", async () => {
  const evaluationCase: LlmEvaluationCase = {
    id: "unit-panic-harm",
    title: "Unit panic harm detection",
    input: buildInput({
      age: "27",
      presentingComplaint: "Breathlessness",
      history:
        "Breathlessness during a panic attack with hyperventilation and tingling fingers. Normal sats and normal chest exam.",
      suspectedDiagnosis: "Panic attack",
    }),
    expectedLeadDiagnosisSlug: "panic-anxiety",
    expectedKeyFeatures: ["panic_features"],
    forbiddenRedFlags: ["PE suspicion pattern"],
    expectedUsefulLlmAddedFeatures: [],
    mockLlmFeatures: [
      { slug: "pleuritic_pain", evidence: "bad mock", confidence: 0.95 },
      { slug: "hypoxia", evidence: "bad mock", confidence: 0.95 },
    ],
  };

  const result = await evaluateLlmExtractionCase(evaluationCase, {
    llmConfig: mockConfig,
  });

  assert.ok(result.forbiddenRedFlagsAugmented.includes("PE suspicion pattern"));
  assert.equal(result.causedHarm, true);
});

test("LLM evaluation summary counts useful features harm and unchanged cases", async () => {
  const baseCase: LlmEvaluationCase = {
    id: "unit-unchanged",
    title: "Unit unchanged",
    input: buildInput({}),
    expectedLeadDiagnosisSlug: "acute-coronary-syndrome",
    expectedKeyFeatures: ["chest_pain"],
    expectedUsefulLlmAddedFeatures: [],
    mockLlmFeatures: [],
  };
  const unchanged = await evaluateLlmExtractionCase(baseCase, { llmConfig: mockConfig });
  const useful = {
    ...unchanged,
    usefulFeaturesAdded: true,
    unchanged: false,
  };
  const harmful = {
    ...unchanged,
    causedHarm: true,
    unchanged: false,
  };

  const summary = summarizeLlmEvaluation([unchanged, useful, harmful]);

  assert.equal(summary.totalCases, 3);
  assert.equal(summary.casesWhereLlmAddedUsefulFeatures, 1);
  assert.equal(summary.casesWhereLlmCausedHarm, 1);
  assert.equal(summary.casesUnchanged, 1);
});
