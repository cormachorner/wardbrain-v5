import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeCase,
  analyzeCaseWithOptionalLlmExtraction,
} from "../lib/application/analyzeCase.js";
import { getLlmExtractionConfig } from "../lib/llm/config.js";
import { extractLlmFeatures } from "../lib/llm/extractFeatures.js";
import { mergeLlmFeatures } from "../lib/llm/mergeFeatures.js";
import { validateLlmFeatureExtractionResponse } from "../lib/llm/schema.js";
import type { LlmCompletionClient } from "../lib/llm/client.js";
import type { LlmExtractionConfig } from "../lib/llm/config.js";
import type { CaseInput } from "../lib/types.js";

const enabledConfig: LlmExtractionConfig = {
  enabled: true,
  usable: true,
  provider: "openai",
  model: "mock-model",
  apiKey: "mock-key",
  confidenceThreshold: 0.8,
  timeoutMs: 1_000,
};

const disabledConfig: LlmExtractionConfig = {
  enabled: false,
  usable: false,
  confidenceThreshold: 0.8,
  timeoutMs: 1_000,
  skipReason: "disabled",
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

function createMockClient(response: string, calls: { count: number }): LlmCompletionClient {
  return {
    async completeJson() {
      calls.count += 1;
      return response;
    },
  };
}

test("LLM extraction is disabled by default config", () => {
  const config = getLlmExtractionConfig({});

  assert.equal(config.enabled, false);
  assert.equal(config.usable, false);
  assert.equal(config.skipReason, "disabled");
});

test("analyzeCaseWithOptionalLlmExtraction preserves deterministic output when disabled", async () => {
  const input = buildInput({});
  const deterministic = analyzeCase(input);
  const calls = { count: 0 };
  const result = await analyzeCaseWithOptionalLlmExtraction(input, {
    llmConfig: disabledConfig,
    llmClient: createMockClient(
      JSON.stringify({ features: [{ slug: "hyperlipidaemia", evidence: "mock", confidence: 1 }] }),
      calls,
    ),
  });

  assert.equal(calls.count, 0);
  assert.deepEqual(result.detectedFeatureSlugs, deterministic.detectedFeatureSlugs);
  assert.deepEqual(result.differentials, deterministic.differentials);
  assert.deepEqual(result.redFlags, deterministic.redFlags);
});

test("LLM config missing skips safely without provider call", async () => {
  const calls = { count: 0 };
  const result = await extractLlmFeatures({
    input: buildInput({}),
    blockId: "chest-pain",
    presentationConfidence: 8,
    config: {
      enabled: true,
      usable: false,
      confidenceThreshold: 0.8,
      timeoutMs: 1_000,
      skipReason: "missing_api_key",
    },
    client: createMockClient("{}", calls),
  });

  assert.equal(calls.count, 0);
  assert.equal(result.metadata.attempted, false);
  assert.equal(result.metadata.skippedReason, "missing_api_key");
});

test("invalid LLM JSON is ignored and deterministic output is preserved", async () => {
  const input = buildInput({});
  const deterministic = analyzeCase(input);
  const calls = { count: 0 };
  const result = await analyzeCaseWithOptionalLlmExtraction(input, {
    llmConfig: enabledConfig,
    llmClient: createMockClient("not json", calls),
  });

  assert.equal(calls.count, 1);
  assert.deepEqual(result.detectedFeatureSlugs, deterministic.detectedFeatureSlugs);
  assert.deepEqual(result.differentials, deterministic.differentials);
});

test("disallowed LLM feature slug is discarded safely", () => {
  const validation = validateLlmFeatureExtractionResponse(
    JSON.stringify({
      features: [
        { slug: "acute_coronary_syndrome", evidence: "diagnosis-shaped output", confidence: 0.99 },
      ],
    }),
    ["chest_pain"],
    0.8,
  );

  assert.deepEqual(validation.features, []);
  assert.ok(validation.invalidReasons.some((reason) => reason.startsWith("disallowed_slug")));
});

test("valid allowed LLM feature is merged without duplicating deterministic features", () => {
  const merged = mergeLlmFeatures(
    { allText: "central chest pain", matchedFeatures: ["chest_pain"] },
    [
      { slug: "chest_pain", evidence: "central chest pain", confidence: 0.95 },
      { slug: "hyperlipidaemia", evidence: "high cholesterol", confidence: 0.95 },
    ],
  );

  assert.deepEqual(merged.features.matchedFeatures, ["chest_pain", "hyperlipidaemia"]);
  assert.deepEqual(merged.acceptedFeatures.map((feature) => feature.slug), ["hyperlipidaemia"]);
});

test("valid allowed LLM feature can augment analysis when explicitly enabled", async () => {
  const calls = { count: 0 };
  const result = await analyzeCaseWithOptionalLlmExtraction(buildInput({}), {
    llmConfig: enabledConfig,
    llmClient: createMockClient(
      JSON.stringify({
        features: [
          { slug: "hyperlipidaemia", evidence: "known high cholesterol", confidence: 0.95 },
        ],
      }),
      calls,
    ),
  });

  assert.equal(calls.count, 1);
  assert.ok(result.detectedFeatureSlugs.includes("hyperlipidaemia"));
  assert.deepEqual(result.llmExtraction?.acceptedFeatures, ["hyperlipidaemia"]);
});

test("unsupported block does not attempt an LLM call", async () => {
  const calls = { count: 0 };
  const result = await extractLlmFeatures({
    input: buildInput({ presentingComplaint: "Rash", history: "Itchy rash on both arms." }),
    blockId: "cellulitis-soft-tissue-infection",
    presentationConfidence: 8,
    config: enabledConfig,
    client: createMockClient(
      JSON.stringify({ features: [{ slug: "chest_pain", evidence: "mock", confidence: 1 }] }),
      calls,
    ),
  });

  assert.equal(calls.count, 0);
  assert.equal(result.metadata.skippedReason, "unsupported_block");
});

test("low-confidence LLM feature is dropped", () => {
  const validation = validateLlmFeatureExtractionResponse(
    JSON.stringify({
      features: [
        { slug: "hyperlipidaemia", evidence: "maybe high cholesterol", confidence: 0.5 },
      ],
    }),
    ["hyperlipidaemia"],
    0.8,
  );

  assert.deepEqual(validation.features, []);
  assert.ok(validation.invalidReasons.includes("low_confidence:hyperlipidaemia"));
});

test("LLM schema validation keeps clinical evidence checks out of the JSON shape layer", () => {
  const validation = validateLlmFeatureExtractionResponse(
    JSON.stringify({
      features: [
        { slug: "leg_swelling", evidence: "swollen ankles", confidence: 0.95 },
        { slug: "unilateral_leg_swelling", evidence: "swollen ankles", confidence: 0.95 },
        { slug: "unilateral_leg_swelling", evidence: "left calf is swollen", confidence: 0.95 },
      ],
    }),
    ["leg_swelling", "unilateral_leg_swelling"],
    0.8,
  );

  assert.deepEqual(validation.features.map((feature) => feature.slug), [
    "leg_swelling",
    "unilateral_leg_swelling",
    "unilateral_leg_swelling",
  ]);
  assert.deepEqual(validation.invalidReasons, []);
});
