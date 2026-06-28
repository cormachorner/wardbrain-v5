import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeCase,
  analyzeCaseWithOptionalLlmExtraction,
  analyzeCaseWithOptionalLlmPresentation,
} from "../lib/application/analyzeCase.js";
import { getLlmExtractionConfig } from "../lib/llm/config.js";
import { extractLlmFeatures } from "../lib/llm/extractFeatures.js";
import { mergeLlmFeatures } from "../lib/llm/mergeFeatures.js";
import {
  buildLlmPresentationRewritePrompt,
  validateLlmPresentationRewrite,
} from "../lib/llm/presentationRewrite.js";
import { validateLlmFeatureExtractionResponse } from "../lib/llm/schema.js";
import type { LlmCompletionClient } from "../lib/llm/client.js";
import type {
  LlmExtractionConfig,
  LlmPresentationConfig,
} from "../lib/llm/config.js";
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

const enabledPresentationConfig: LlmPresentationConfig = {
  ...enabledConfig,
  presentationEnabled: true,
};

const disabledPresentationConfig: LlmPresentationConfig = {
  ...disabledConfig,
  presentationEnabled: false,
  skipReason: "presentation_disabled",
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

test("LLM presentation rewrite is disabled by default and preserves deterministic text", async () => {
  const input = buildInput({});
  const deterministic = analyzeCase(input);
  const calls = { count: 0 };
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: disabledPresentationConfig,
    llmPresentationClient: createMockClient(
      JSON.stringify({ presentation: "This should not be used." }),
      calls,
    ),
  });

  assert.equal(calls.count, 0);
  assert.equal(result.presentation, deterministic.presentation);
  assert.equal(result.llmPresentation?.presentationSource, "deterministic");
  assert.equal(result.llmPresentation?.llmPresentationAttempted, false);
  assert.equal(result.llmPresentation?.llmPresentationUsed, false);
  assert.equal(result.llmPresentation?.llmPresentationFallbackReason, "disabled");
});

test("LLM presentation rewrite with missing key falls back to deterministic text", async () => {
  const input = buildInput({});
  const deterministic = analyzeCase(input);
  const calls = { count: 0 };
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: {
      ...enabledPresentationConfig,
      usable: false,
      apiKey: undefined,
      skipReason: "missing_api_key",
    },
    llmPresentationClient: createMockClient(
      JSON.stringify({ presentation: "This should not be used." }),
      calls,
    ),
  });

  assert.equal(calls.count, 0);
  assert.equal(result.presentation, deterministic.presentation);
  assert.equal(result.llmPresentation?.presentationSource, "deterministic");
  assert.equal(result.llmPresentation?.llmPresentationAttempted, false);
  assert.equal(result.llmPresentation?.llmPresentationUsed, false);
  assert.equal(result.llmPresentation?.llmPresentationFallbackReason, "missing_api_key");
});

test("valid mocked LLM presentation rewrite is used when explicitly enabled", async () => {
  const calls = { count: 0 };
  const rewritten =
    "This is a 58-year-old man with central chest pain, sweating and nausea. The leading concern is ACS, with PE and acute aortic syndrome considered. There is an ACS red flag pattern and uncertainty remains moderate pending observations and ECG.";
  const result = await analyzeCaseWithOptionalLlmPresentation(buildInput({}), {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: createMockClient(JSON.stringify({ presentation: rewritten }), calls),
  });

  assert.equal(calls.count, 1);
  assert.equal(result.presentation, rewritten);
  assert.equal(result.llmPresentation?.llmPresentationAttempted, true);
  assert.equal(result.llmPresentation?.llmPresentationUsed, true);
});

test("LLM presentation validation allows safe ACS synonyms", () => {
  const analysis = analyzeCase(buildInput({}));

  for (const synonym of [
    "heart attack",
    "MI",
    "myocardial infarction",
    "cardiac ischaemia",
    "ischaemic chest pain",
  ]) {
    const validation = validateLlmPresentationRewrite(
      JSON.stringify({
        presentation: `This is a 58-year-old man with central chest pain. The leading concern is ${synonym}, with PE and acute aortic syndrome also considered. The ACS red flag pattern remains important.`,
      }),
      analysis,
    );

    assert.equal(validation.fallbackReason, undefined, synonym);
    assert.ok(validation.presentation, synonym);
  }
});

test("LLM presentation prompt asks for exact supplied diagnosis names", () => {
  const prompt = buildLlmPresentationRewritePrompt(analyzeCase(buildInput({})));

  assert.match(
    prompt,
    /Use the exact diagnosis names supplied unless rewriting common abbreviations\./,
  );
});

test("invalid LLM presentation JSON falls back", async () => {
  const input = buildInput({});
  const deterministic = analyzeCase(input);
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: createMockClient("not json", { count: 0 }),
  });

  assert.equal(result.presentation, deterministic.presentation);
  assert.equal(result.llmPresentation?.llmPresentationUsed, false);
  assert.equal(result.llmPresentation?.llmPresentationFallbackReason, "invalid_json");
});

test("LLM presentation introducing unsupported diagnosis is rejected", () => {
  const analysis = analyzeCase(buildInput({}));
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "This is likely ACS, but stroke is also a major concern requiring urgent exclusion.",
    }),
    analysis,
  );

  assert.equal(validation.presentation, undefined);
  assert.equal(validation.fallbackReason, "unsupported_diagnosis_added");
  assert.equal(validation.fallbackTrigger, "stroke");
});

test("LLM presentation validator does not match TIA inside common words", () => {
  const analysis = analyzeCase(buildInput({}));

  for (const presentation of [
    "This presentation is concerning for ACS. The ACS red flag pattern remains important.",
    "The differential includes ACS, PE and acute aortic syndrome. The ACS red flag pattern remains important.",
    "This patient needs initial investigation for ACS. The ACS red flag pattern remains important.",
  ]) {
    const validation = validateLlmPresentationRewrite(
      JSON.stringify({ presentation }),
      analysis,
    );

    assert.equal(validation.fallbackReason, undefined, presentation);
    assert.ok(validation.presentation, presentation);
  }
});

test("LLM presentation validator still catches standalone TIA when unapproved", () => {
  const analysis = analyzeCase(buildInput({}));
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "This presentation is concerning for ACS. Possible TIA is also important. The ACS red flag pattern remains important.",
    }),
    analysis,
  );

  assert.equal(validation.presentation, undefined);
  assert.equal(validation.fallbackReason, "unsupported_diagnosis_added");
  assert.equal(validation.fallbackTrigger, "TIA");
});

test("LLM presentation validator matches MI only as a standalone acronym", () => {
  const peAnalysis = {
    ...analyzeCase(buildInput({
      presentingComplaint: "Shortness of breath",
      history:
        "Sudden pleuritic chest pain with shortness of breath and haemoptysis after a long flight. HR 120 and sats 89%.",
    })),
    differentials: [
      {
        name: "Pulmonary embolism",
        score: 10,
        reasonsFor: ["pleuritic pain", "haemoptysis"],
        reasonsAgainst: [],
        suggestions: [],
      },
      {
        name: "Pneumothorax",
        score: 4,
        reasonsFor: ["pleuritic pain"],
        reasonsAgainst: [],
        suggestions: [],
      },
      {
        name: "Pneumonia",
        score: 3,
        reasonsFor: ["breathlessness"],
        reasonsAgainst: [],
        suggestions: [],
      },
    ],
    redFlags: [
      {
        name: "pe-suspicion-pattern",
        explanation: "PE suspicion pattern.",
        boostDiagnoses: ["Pulmonary embolism"],
      },
    ],
  };
  const safeText = "This patient needs initial investigation for pulmonary embolism. The PE pattern remains important.";
  const unsafeText = "This patient has pulmonary embolism, but possible MI is also a concern. The PE pattern remains important.";

  const safeValidation = validateLlmPresentationRewrite(
    JSON.stringify({ presentation: safeText }),
    peAnalysis,
  );
  const unsafeValidation = validateLlmPresentationRewrite(
    JSON.stringify({ presentation: unsafeText }),
    peAnalysis,
  );

  assert.equal(safeValidation.fallbackReason, undefined);
  assert.equal(unsafeValidation.presentation, undefined);
  assert.equal(unsafeValidation.fallbackReason, "unsupported_diagnosis_added");
  assert.equal(unsafeValidation.fallbackTrigger, "MI");
});

test("LLM presentation validator accepts ovarian torsion shortened to torsion", () => {
  const torsionAnalysis = {
    ...analyzeCase(buildInput({
      presentingComplaint: "Pelvic pain",
      history: "Sudden unilateral pelvic pain with vomiting and adnexal tenderness.",
    })),
    differentials: [
      {
        name: "Ovarian torsion",
        score: 10,
        reasonsFor: ["sudden pelvic pain"],
        reasonsAgainst: [],
        suggestions: [],
      },
    ],
    redFlags: [],
  };
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "This patient has sudden pelvic pain and vomiting. The leading concern is torsion.",
    }),
    torsionAnalysis,
  );

  assert.equal(validation.fallbackReason, undefined);
  assert.ok(validation.presentation);
});

test("LLM presentation validator accepts intestinal obstruction for bowel obstruction", () => {
  const obstructionAnalysis = {
    ...analyzeCase(buildInput({
      presentingComplaint: "Abdominal pain",
      history: "Vomiting, distension and no flatus after previous abdominal surgery.",
    })),
    differentials: [
      {
        name: "Bowel obstruction",
        score: 10,
        reasonsFor: ["vomiting", "distension"],
        reasonsAgainst: [],
        suggestions: [],
      },
    ],
    redFlags: [],
  };
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "This patient has vomiting and distension. The leading concern is intestinal obstruction.",
    }),
    obstructionAnalysis,
  );

  assert.equal(validation.fallbackReason, undefined);
  assert.ok(validation.presentation);
});

test("LLM presentation validator permits constipation as benign comparator in bowel obstruction", () => {
  const obstructionAnalysis = {
    ...analyzeCase(buildInput({
      presentingComplaint: "Abdominal pain",
      history: "Vomiting, distension and no flatus after previous abdominal surgery.",
    })),
    differentials: [
      {
        name: "Bowel obstruction",
        score: 10,
        reasonsFor: ["vomiting", "distension"],
        reasonsAgainst: [],
        suggestions: [],
      },
    ],
    redFlags: [],
  };
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "This patient has vomiting and distension. The leading concern is bowel obstruction, with constipation as a less likely benign comparator.",
    }),
    obstructionAnalysis,
  );

  assert.equal(validation.fallbackReason, undefined);
  assert.ok(validation.presentation);
});

test("LLM presentation validator rejects pneumothorax in PE rewrites unless approved", () => {
  const peAnalysis = {
    ...analyzeCase(buildInput({
      presentingComplaint: "Shortness of breath",
      history: "Pleuritic pain, haemoptysis and hypoxia after recent surgery.",
    })),
    differentials: [
      {
        name: "Pulmonary embolism",
        score: 10,
        reasonsFor: ["pleuritic pain", "haemoptysis"],
        reasonsAgainst: [],
        suggestions: [],
      },
      {
        name: "Pneumonia",
        score: 3,
        reasonsFor: ["breathlessness"],
        reasonsAgainst: [],
        suggestions: [],
      },
    ],
    redFlags: [
      {
        name: "pe-suspicion-pattern",
        explanation: "PE suspicion pattern.",
        boostDiagnoses: ["Pulmonary embolism"],
      },
    ],
  };
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "This patient has likely PE, but pneumothorax is also a key concern. The PE pattern remains important.",
    }),
    peAnalysis,
  );

  assert.equal(validation.presentation, undefined);
  assert.equal(validation.fallbackReason, "unsupported_diagnosis_added");
  assert.equal(validation.fallbackTrigger?.toLowerCase(), "pneumothorax");
});

test("LLM presentation validator allows pneumothorax in PE rewrites when approved", () => {
  const peAnalysis = {
    ...analyzeCase(buildInput({
      presentingComplaint: "Shortness of breath",
      history: "Pleuritic pain, haemoptysis and hypoxia after recent surgery.",
    })),
    differentials: [
      {
        name: "Pulmonary embolism",
        score: 10,
        reasonsFor: ["pleuritic pain", "haemoptysis"],
        reasonsAgainst: [],
        suggestions: [],
      },
      {
        name: "Pneumothorax",
        score: 8,
        reasonsFor: ["pleuritic pain"],
        reasonsAgainst: [],
        suggestions: [],
      },
    ],
    redFlags: [
      {
        name: "pe-suspicion-pattern",
        explanation: "PE suspicion pattern.",
        boostDiagnoses: ["Pulmonary embolism"],
      },
    ],
  };
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "This patient has likely PE, with pneumothorax also considered. The PE pattern remains important.",
    }),
    peAnalysis,
  );

  assert.equal(validation.fallbackReason, undefined);
  assert.ok(validation.presentation);
});

test("too-long LLM presentation rewrite is rejected", () => {
  const analysis = analyzeCase(buildInput({}));
  const longText = `ACS ${Array.from({ length: 151 }, () => "word").join(" ")}`;
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({ presentation: longText }),
    analysis,
  );

  assert.equal(validation.presentation, undefined);
  assert.equal(validation.fallbackReason, "too_long");
});

test("LLM presentation omitting a non-diagnosis red flag falls back", () => {
  const analysis = {
    ...analyzeCase(buildInput({})),
    redFlags: [
      {
        name: "custom-safety-pattern",
        explanation: "Mock safety pattern.",
        boostDiagnoses: [],
      },
    ],
  };
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "This is a 58-year-old man with central chest pain. ACS is the leading concern.",
    }),
    analysis,
  );

  assert.equal(validation.presentation, undefined);
  assert.equal(validation.fallbackReason, "missing_red_flag");
});
