import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluatePresentationCase,
  summarizePresentationEval,
  presentationEvalToCsv,
} from "../scripts/evaluate-presentation-rewrite.js";
import type { LlmCompletionClient } from "../lib/llm/client.js";
import type { LlmPresentationConfig } from "../lib/llm/config.js";
import type { BulkEvalCase } from "../scripts/evaluate-cases.js";

const enabledPresentationConfig: LlmPresentationConfig = {
  enabled: true,
  usable: true,
  presentationEnabled: true,
  provider: "openai",
  model: "mock",
  apiKey: "mock-key",
  confidenceThreshold: 0.8,
  timeoutMs: 1_000,
};

const acsCase: BulkEvalCase = {
  id: "presentation-eval-acs",
  title: "ACS presentation eval case",
  presentation: "chest_pain",
  vignette:
    "58-year-old man with central chest pain, sweating and nausea. It radiates to the jaw. He has hypertension.",
  expectedLeadDiagnosisSlug: "acute-coronary-syndrome",
  expectedFeatureSlugs: ["chest_pain"],
  expectedRedFlagSlugs: ["acs-suspicion-pattern"],
  forbiddenRedFlagSlugs: [],
  forbiddenLeadDiagnosisSlugs: [],
  tags: ["acs"],
};

function mockClient(presentation: string): LlmCompletionClient {
  return {
    async completeJson() {
      return JSON.stringify({ presentation });
    },
  };
}

test("presentation eval counts accepted mock rewrite as used", async () => {
  const result = await evaluatePresentationCase(acsCase, {
    liveLlm: true,
    config: enabledPresentationConfig,
    client: mockClient(
      "This is a 58-year-old man with central chest pain, sweating, nausea and jaw radiation. The leading concern is ACS, with PE and acute aortic syndrome considered. The ACS red flag pattern is present and registrar review is needed.",
    ),
  });
  const summary = summarizePresentationEval([result]);

  assert.equal(result.used, true);
  assert.equal(result.fallbackReason, undefined);
  assert.equal(summary.usedCount, 1);
  assert.equal(summary.fallbackCount, 0);
  assert.ok(presentationEvalToCsv([result]).includes("llmPresentation"));
});

test("presentation eval captures unsupported diagnosis fallback term", async () => {
  const result = await evaluatePresentationCase(acsCase, {
    liveLlm: true,
    config: enabledPresentationConfig,
    client: mockClient(
      "This is a 58-year-old man with central chest pain. The leading concern is ACS, but stroke is also a key concern. The ACS red flag pattern is present.",
    ),
  });
  const summary = summarizePresentationEval([result]);

  assert.equal(result.used, false);
  assert.equal(result.fallbackReason, "unsupported_diagnosis_added");
  assert.equal(result.unsupportedDiagnosisTerm, "stroke");
  assert.deepEqual(summary.unsupportedDiagnosisTerms, { stroke: 1 });
});

test("presentation eval counts too-long fallback", async () => {
  const result = await evaluatePresentationCase(acsCase, {
    liveLlm: true,
    config: enabledPresentationConfig,
    client: mockClient(`ACS ${Array.from({ length: 151 }, () => "word").join(" ")}`),
  });
  const summary = summarizePresentationEval([result]);

  assert.equal(result.used, false);
  assert.equal(result.fallbackReason, "too_long");
  assert.equal(summary.fallbackReasons.too_long, 1);
});

test("presentation eval counts missing-red-flag fallback", async () => {
  const result = await evaluatePresentationCase(acsCase, {
    liveLlm: true,
    config: enabledPresentationConfig,
    client: mockClient(
      "This is a 58-year-old man with central chest pain. The leading concern is ACS.",
    ),
  });
  const summary = summarizePresentationEval([result]);

  assert.equal(result.used, false);
  assert.equal(result.fallbackReason, "missing_red_flag");
  assert.equal(summary.fallbackReasons.missing_red_flag, 1);
});
