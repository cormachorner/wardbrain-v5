import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeCase,
  analyzeCaseWithOptionalLlmExtraction,
  analyzeCaseWithOptionalLlmPresentation,
} from "../lib/application/analyzeCase.js";
import { shouldSuppressDifferentialDisplay } from "../lib/application/differentialDisplay.js";
import { getLlmExtractionConfig } from "../lib/llm/config.js";
import { extractLlmFeatures } from "../lib/llm/extractFeatures.js";
import { mergeLlmFeatures } from "../lib/llm/mergeFeatures.js";
import { buildPresentationFacts } from "../lib/llm/presentationFactsBuilder.js";
import {
  buildLlmPresentationRepairPrompt,
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

function createSequenceMockClient(responses: string[], calls: { prompts: string[] }): LlmCompletionClient {
  return {
    async completeJson(prompt) {
      calls.prompts.push(prompt);
      return responses[Math.min(calls.prompts.length - 1, responses.length - 1)];
    },
  };
}

function buildGiBleedInput(overrides: Partial<CaseInput> = {}): CaseInput {
  return buildInput({
    age: "66",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history:
      "Melaena, vomiting, epigastric pain, dizziness, tachycardia and pallor.",
    observations: "HR 122. Pale.",
    labs: { fbc: { hb: 62, mcv: 70 }, ues: { urea: 21 } },
    ...overrides,
  });
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
    "A 58-year-old man presents with central chest pain, sweating and nausea. This is highly concerning for ACS, with the ACS red flag pattern represented.";
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

test("LLM presentation repair removes unsupported acute cholangitis from acute hepatitis rewrite", async () => {
  const input = buildInput({
    age: "28",
    sex: "female",
    presentingComplaint: "Jaundice",
    history: "Jaundice with dark urine, malaise and nausea but no fever.",
    keyNegatives: "No fever.",
    labs: { lfts: { bilirubin: 70, alt: 1250, ast: 1100, alp: 90, ggt: 40 } },
  });
  const calls = { prompts: [] as string[] };
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: createSequenceMockClient([
      JSON.stringify({
        presentation:
          "A 28-year-old woman presents with jaundice and dark urine. This is most concerning for Acute hepatitis, with Acute cholangitis also considered.",
      }),
      JSON.stringify({
        presentation:
          "A 28-year-old woman presents with jaundice, dark urine, malaise and nausea. Her liver tests show a hepatocellular pattern. Overall, this is most concerning for Acute hepatitis.",
      }),
    ], calls),
  });

  assert.equal(calls.prompts.length, 2);
  assert.match(calls.prompts[1], /previous presentation was rejected/i);
  assert.equal(result.llmPresentation?.presentationSource, "llm_repair");
  assert.equal(result.llmPresentation?.llmPresentationUsed, true);
  assert.equal(result.llmPresentation?.llmPresentationOriginalFailureReason, "unsupported_diagnosis_added");
  assert.doesNotMatch(result.presentation, /cholangitis/i);
  assert.match(result.presentation, /Acute hepatitis/i);
});

test("LLM presentation repair removes anaemia as an unsupported GI bleed diagnosis", async () => {
  const input = buildGiBleedInput({
    age: "67",
    presentingComplaint: "Melaena",
    history: "Melaena with coffee-ground haematemesis, pallor and collapse.",
    observations: "",
    labs: { fbc: { hb: 62, mcv: 82 }, ues: { urea: 21 } },
  });
  const calls = { prompts: [] as string[] };
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: createSequenceMockClient([
      JSON.stringify({
        presentation:
          "A 67-year-old man presents with melaena and haematemesis. This is concerning for GI bleed and anaemia.",
      }),
      JSON.stringify({
        presentation:
          "A 67-year-old man presents with melaena, coffee-ground haematemesis, pallor and collapse. Bloods show severe anaemia with raised urea. Overall, this is most concerning for GI bleed.",
      }),
    ], calls),
  });

  assert.equal(calls.prompts.length, 2);
  assert.equal(result.llmPresentation?.presentationSource, "llm_repair");
  assert.equal(result.llmPresentation?.llmPresentationOriginalFailureReason, "unsupported_diagnosis_added");
  assert.doesNotMatch(result.presentation, /\banaemia\b.*diagnosis|\band anaemia\b/i);
  assert.match(result.presentation, /GI bleed/i);
});

test("valid GI bleed presentation with severe anaemia fact is accepted without repair", async () => {
  const input = buildGiBleedInput();
  const calls = { prompts: [] as string[] };
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: createSequenceMockClient([
      JSON.stringify({
        presentation:
          "A 66-year-old man presents with melaena, vomiting and epigastric pain, with associated dizziness. He is tachycardic and pale, with severe microcytic anaemia and raised urea. Overall, this is highly concerning for a gastrointestinal bleed.",
      }),
    ], calls),
  });

  assert.equal(calls.prompts.length, 1);
  assert.equal(result.llmPresentation?.presentationSource, "llm");
  assert.equal(result.llmPresentation?.llmPresentationUsed, true);
  assert.match(result.presentation, /severe microcytic anaemia/i);
});

test("GI bleed presentation rejects Anaemia as a diagnostic impression but allows severe anaemia as a fact", () => {
  const input = buildGiBleedInput();
  const analysis = analyzeCase(input);
  const facts = buildPresentationFacts(input, analysis);

  const clinicalFactValidation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "A 66-year-old man presents with melaena, vomiting and epigastric pain. He is tachycardic and pale, with severe microcytic anaemia and raised urea. Overall, this is highly concerning for a gastrointestinal bleed.",
    }),
    analysis,
    facts,
  );
  const diagnosisValidation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "A 66-year-old man presents with melaena, vomiting and epigastric pain. He has severe anaemia and raised urea. The differential includes anaemia alongside gastrointestinal bleed.",
    }),
    analysis,
    facts,
  );

  assert.equal(clinicalFactValidation.fallbackReason, undefined);
  assert.ok(clinicalFactValidation.presentation);
  assert.equal(diagnosisValidation.fallbackReason, "unsupported_diagnosis_added");
  assert.equal(diagnosisValidation.fallbackTrigger?.toLowerCase(), "anaemia");
});

test("GI bleed validator treats anaemia clinical findings separately from diagnostic anaemia", () => {
  const input = buildGiBleedInput();
  const analysis = analyzeCase(input);
  const facts = buildPresentationFacts(input, analysis);
  const validClinicalFindingPresentations = [
    "A 66-year-old man presents with melaena, vomiting and epigastric pain. Investigations show severe anaemia and raised urea. Overall, this is highly concerning for gastrointestinal bleed.",
    "A 66-year-old man presents with melaena, vomiting and epigastric pain. Investigations reveal severe microcytic anaemia and raised urea, raising concerns for a gastrointestinal bleed.",
    "A 66-year-old man presents with melaena, vomiting and epigastric pain. Bloods demonstrate profound anaemia and raised urea. Overall, this is highly concerning for gastrointestinal bleed.",
    "A 66-year-old man presents with melaena, vomiting and epigastric pain. He has severe anaemia with a microcytic pattern and raised urea. Overall, this is highly concerning for gastrointestinal bleed.",
    "A 66-year-old man presents with melaena, vomiting and epigastric pain. His haemoglobin is markedly reduced with raised urea. Overall, this is highly concerning for gastrointestinal bleed.",
  ];
  const invalidDiagnosticPresentations = [
    "A 66-year-old man presents with melaena. The differential includes anaemia alongside gastrointestinal bleed.",
    "A 66-year-old man presents with melaena. Anaemia is another diagnosis to consider alongside gastrointestinal bleed.",
    "A 66-year-old man presents with melaena. This could represent anaemia, although gastrointestinal bleed is also possible.",
    "A 66-year-old man presents with melaena. Overall this is most in keeping with anaemia.",
    "A 66-year-old man presents with melaena. GI bleed is likely, although anaemia is an alternative diagnosis.",
  ];

  for (const presentation of validClinicalFindingPresentations) {
    const validation = validateLlmPresentationRewrite(
      JSON.stringify({ presentation }),
      analysis,
      facts,
    );

    assert.equal(validation.fallbackReason, undefined, presentation);
    assert.ok(validation.presentation, presentation);
  }

  for (const presentation of invalidDiagnosticPresentations) {
    const validation = validateLlmPresentationRewrite(
      JSON.stringify({ presentation }),
      analysis,
      facts,
    );

    assert.equal(validation.presentation, undefined, presentation);
    assert.equal(validation.fallbackReason, "unsupported_diagnosis_added", presentation);
    assert.equal(validation.fallbackTrigger?.toLowerCase(), "anaemia", presentation);
  }
});

test("manual GI bleed presentation with severe microcytic anaemia is accepted without repair", async () => {
  const input = buildGiBleedInput();
  const calls = { prompts: [] as string[] };
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: createSequenceMockClient([
      JSON.stringify({
        presentation:
          "We have a 66-year-old male presenting with abdominal pain, accompanied by melaena and vomiting. He shows signs of tachycardia and pallor. Investigations reveal severe microcytic anaemia and raised urea, which are highly concerning for a gastrointestinal bleed.",
      }),
    ], calls),
  });

  assert.equal(calls.prompts.length, 1);
  assert.equal(result.llmPresentation?.presentationSource, "llm");
  assert.equal(result.llmPresentation?.llmPresentationRepairAttempted, false);
  assert.equal(result.llmPresentation?.llmPresentationFallbackReason, undefined);
  assert.match(result.presentation, /severe microcytic anaemia/i);
});

test("GI bleed with anaemia as another diagnosis still triggers surgical repair", async () => {
  const input = buildGiBleedInput();
  const calls = { prompts: [] as string[] };
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: createSequenceMockClient([
      JSON.stringify({
        presentation:
          "A 66-year-old man presents with melaena, vomiting and epigastric pain. He has severe microcytic anaemia and raised urea. GI bleed is most likely, with anaemia as another diagnosis.",
      }),
      JSON.stringify({
        presentation:
          "A 66-year-old man presents with melaena, vomiting and epigastric pain. He has severe microcytic anaemia and raised urea. GI bleed is most likely.",
      }),
    ], calls),
  });

  assert.equal(calls.prompts.length, 2);
  assert.equal(result.llmPresentation?.presentationSource, "llm_repair");
  assert.equal(result.llmPresentation?.llmPresentationOriginalFailureReason, "unsupported_diagnosis_added");
  assert.equal(result.llmPresentation?.llmPresentationOriginalFailureTrigger?.toLowerCase(), "anaemia");
  assert.match(calls.prompts[1], /Make the smallest possible edit/);
});

test("GI bleed repair prompt preserves required severe anaemia during unsupported diagnosis repair", async () => {
  const input = buildGiBleedInput();
  const calls = { prompts: [] as string[] };
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: createSequenceMockClient([
      JSON.stringify({
        presentation:
          "A 66-year-old man presents with melaena, vomiting, epigastric pain and dizziness. He is tachycardic and pale, with severe microcytic anaemia and raised urea. Overall, this is highly concerning for gastrointestinal bleed, with Anaemia also a key concern.",
      }),
      JSON.stringify({
        presentation:
          "A 66-year-old man presents with melaena, vomiting, epigastric pain and dizziness. He is tachycardic and pale, with severe microcytic anaemia and raised urea. Overall, this is highly concerning for gastrointestinal bleed.",
      }),
    ], calls),
  });

  assert.equal(result.llmPresentation?.presentationSource, "llm_repair");
  assert.equal(result.llmPresentation?.llmPresentationOriginalFailureReason, "unsupported_diagnosis_added");
  assert.match(calls.prompts[1], /required_clinical_facts/);
  assert.match(calls.prompts[1], /Preserve Severe anaemia/);
  assert.match(calls.prompts[1], /Preserve microcytic anaemia pattern/);
  assert.match(result.presentation, /severe microcytic anaemia/i);
  assert.ok(result.presentation.trim().split(/\s+/).length <= 150);
});

test("GI bleed repair cannot remove required severe anaemia concept", async () => {
  const input = buildGiBleedInput();
  const calls = { prompts: [] as string[] };
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: createSequenceMockClient([
      JSON.stringify({
        presentation:
          "A 66-year-old man presents with melaena, vomiting, epigastric pain and dizziness. He is tachycardic and pale, with severe microcytic anaemia and raised urea. Overall, this is highly concerning for gastrointestinal bleed, with Anaemia also a key concern.",
      }),
      JSON.stringify({
        presentation:
          "A 66-year-old man presents with melaena, vomiting, epigastric pain and dizziness. He is tachycardic and pale, with raised urea. Overall, this is highly concerning for gastrointestinal bleed.",
      }),
    ], calls),
  });

  assert.equal(result.llmPresentation?.presentationSource, "fallback");
  assert.equal(result.llmPresentation?.llmPresentationOriginalFailureReason, "unsupported_diagnosis_added");
  assert.equal(result.llmPresentation?.llmPresentationRepairedFailureReason, "missing_required_clinical_fact");
  assert.equal(result.llmPresentation?.llmPresentationRepairedFailureTrigger, "Severe anaemia");
  assert.match(result.llmPresentation?.llmPresentationOriginalOutput ?? "", /Anaemia also a key concern/i);
  assert.match(result.llmPresentation?.llmPresentationRepairedOutput ?? "", /raised urea/i);
  assert.match(result.presentation, /severe microcytic anaemia/i);
});

test("GI bleed fallback deduplicates abdominal pain and anaemia facts", async () => {
  const input = buildGiBleedInput({
    history:
      "Abdominal pain with melaena, vomiting, epigastric pain, dizziness, tachycardia and pallor.",
  });
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: {
      async completeJson() {
        throw new Error("mock provider failure");
      },
    },
  });

  assert.equal(result.llmPresentation?.presentationSource, "fallback");
  assert.equal(result.llmPresentation?.llmPresentationFallbackReason, "provider_error");
  assert.doesNotMatch(result.presentation, /abdominal pain with abdominal pain/i);
  assert.doesNotMatch(result.presentation, /Severe anaemia, anaemia and microcytic anaemia pattern/i);
  assert.match(result.presentation, /epigastric pain/i);
  assert.match(result.presentation, /severe microcytic anaemia/i);
  assert.match(result.presentation, /GI bleed/i);
});

test("valid cholangitis presentation succeeds without repair retry", async () => {
  const input = buildInput({
    presentingComplaint: "RUQ pain and jaundice",
    history: "RUQ pain with fever, jaundice, dark urine and pale stools.",
    labs: { lfts: { bilirubin: 95, alp: 420, ggt: 300, alt: 80 } },
  });
  const calls = { prompts: [] as string[] };
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: createSequenceMockClient([
      JSON.stringify({
        presentation:
          "A patient presents with right upper quadrant pain, fever, jaundice, dark urine and pale stools. Liver tests show a cholestatic pattern. Overall, this is highly concerning for Acute cholangitis.",
      }),
    ], calls),
  });

  assert.equal(calls.prompts.length, 1);
  assert.equal(result.llmPresentation?.presentationSource, "llm");
  assert.equal(result.llmPresentation?.llmPresentationRepairAttempted, false);
});

test("presentation API failure uses modern deterministic fallback wording", async () => {
  const input = buildInput({
    age: "28",
    sex: "female",
    presentingComplaint: "Jaundice",
    history: "Jaundice with dark urine, malaise and nausea but no fever.",
    labs: { lfts: { bilirubin: 70, alt: 1250, ast: 1100, alp: 90, ggt: 40 } },
  });
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: {
      async completeJson() {
        throw new Error("mock provider failure");
      },
    },
  });

  assert.equal(result.llmPresentation?.presentationSource, "fallback");
  assert.equal(result.llmPresentation?.llmPresentationFallbackReason, "provider_error");
  assert.doesNotMatch(result.presentation, /Key concerning features include|My leading differential|I would not settle/i);
  assert.match(result.presentation, /28-year-old woman/i);
  assert.match(result.presentation, /Acute hepatitis/i);
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
        presentation: `This is a 58-year-old man with central chest pain. The leading concern is ${synonym}. The ACS red flag pattern remains important.`,
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
  assert.match(prompt, /permitted_diagnostic_impressions/);
  assert.match(prompt, /Do not introduce alternative diagnoses from your own knowledge/);
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

test("LLM presentation validator respects curated priority concerns when supplied", () => {
  const input = buildInput({
    presentingComplaint: "Shortness of breath",
    history: "Pleuritic pain, haemoptysis and hypoxia after recent surgery.",
  });
  const peAnalysis = {
    ...analyzeCase(input),
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
  const facts = buildPresentationFacts(input, peAnalysis);
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "This patient has likely PE, with pneumothorax also considered. The PE pattern remains important.",
    }),
    peAnalysis,
    facts,
  );

  assert.deepEqual(facts.priority_concerns, ["Pulmonary embolism"]);
  assert.equal(validation.presentation, undefined);
  assert.equal(validation.fallbackReason, "unsupported_diagnosis_added");
  assert.equal(validation.fallbackTrigger?.toLowerCase(), "pneumothorax");
});

test("LLM presentation unsupported diagnosis repair asks for a minimal edit preserving validated facts", () => {
  const input = buildInput({
    age: "67",
    sex: "male",
    presentingComplaint: "Melaena",
    history: "Melaena with coffee-ground haematemesis and pallor.",
    labs: { fbc: { hb: 62, mcv: 72 }, ues: { urea: 21 } },
  });
  const analysis = analyzeCase(input);
  const facts = buildPresentationFacts(input, analysis);
  const rejectedPresentation =
    "A 67-year-old man presents with melaena, coffee-ground haematemesis and pallor. Investigations show severe anaemia with a microcytic pattern and raised urea. Overall, this is most concerning for GI bleed, although acute cholangitis is also possible.";
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({ presentation: rejectedPresentation }),
    analysis,
    facts,
  );
  const prompt = buildLlmPresentationRepairPrompt({
    facts,
    rejectedPresentation,
    validation,
  });

  assert.equal(validation.fallbackReason, "unsupported_diagnosis_added");
  assert.match(prompt, /Make the smallest possible edit/);
  assert.match(prompt, /remove only the unsupported diagnosis mention \(acute cholangitis\)/i);
  assert.match(prompt, /Do not rewrite unrelated sentences/);
  assert.match(prompt, /validated_clinical_facts_present_in_rejected_presentation/);
  assert.match(prompt, /melaena/);
  assert.match(prompt, /Severe anaemia/);
  assert.match(prompt, /raised urea/);
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

test("LLM presentation omitting an unrelated internal red-flag label is allowed", () => {
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
    buildPresentationFacts(buildInput({}), analysis),
  );

  assert.equal(validation.fallbackReason, undefined);
  assert.ok(validation.presentation);
});

test("LLM presentation validation requires critical severity facts when supplied", () => {
  const input = buildInput({
    presentingComplaint: "Shortness of breath",
    history: "Fever, productive cough and shortness of breath.",
    observations: "Sats 86% on air.",
  });
  const analysis = analyzeCase(input);
  const facts = buildPresentationFacts(input, analysis);
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "A 58-year-old man presents with fever, productive cough and shortness of breath. Overall, this is most concerning for Pneumonia.",
    }),
    analysis,
    facts,
  );

  assert.ok(facts.examination.includes("hypoxia"));
  assert.equal(validation.presentation, undefined);
  assert.equal(validation.fallbackReason, "missing_required_clinical_fact");
  assert.equal(validation.fallbackTrigger, "hypoxia");
});

test("LLM presentation validation recognises severe anaemia concept aliases", () => {
  const input = buildInput({
    age: "67",
    sex: "male",
    presentingComplaint: "Melaena",
    history: "Melaena with coffee-ground haematemesis and pallor.",
    labs: { fbc: { hb: 62, mcv: 72 }, ues: { urea: 21 } },
  });
  const analysis = analyzeCase(input);
  const facts = buildPresentationFacts(input, analysis);
  const validPresentations = [
    "A 67-year-old man presents with melaena and coffee-ground haematemesis. Investigations show severe anaemia with a microcytic pattern and raised urea. Overall, this is most concerning for GI bleed.",
    "A 67-year-old man presents with melaena and coffee-ground haematemesis. Investigations show profound anaemia with a microcytic pattern and raised urea. Overall, this is most concerning for GI bleed.",
    "A 67-year-old man presents with melaena and coffee-ground haematemesis. Investigations show markedly reduced haemoglobin with a microcytic pattern and raised urea. Overall, this is most concerning for GI bleed.",
    "A 67-year-old man presents with melaena and coffee-ground haematemesis. Hb 68 g/L with significant anaemia is present alongside raised urea. Overall, this is most concerning for GI bleed.",
  ];

  assert.ok(facts.investigations.includes("Severe anaemia"));

  for (const presentation of validPresentations) {
    const validation = validateLlmPresentationRewrite(
      JSON.stringify({ presentation }),
      analysis,
      facts,
    );

    assert.equal(validation.fallbackReason, undefined, presentation);
    assert.ok(validation.presentation, presentation);
  }
});

test("LLM presentation validation rejects weak or absent anaemia wording for severe anaemia", () => {
  const input = buildInput({
    age: "67",
    sex: "male",
    presentingComplaint: "Melaena",
    history: "Melaena with coffee-ground haematemesis and pallor.",
    labs: { fbc: { hb: 62, mcv: 72 }, ues: { urea: 21 } },
  });
  const analysis = analyzeCase(input);
  const facts = buildPresentationFacts(input, analysis);
  const invalidPresentations = [
    "A 67-year-old man presents with melaena and coffee-ground haematemesis. Investigations show mild anaemia with raised urea. Overall, this is most concerning for GI bleed.",
    "A 67-year-old man presents with melaena and coffee-ground haematemesis. Investigations show raised urea. Overall, this is most concerning for GI bleed.",
  ];

  for (const presentation of invalidPresentations) {
    const validation = validateLlmPresentationRewrite(
      JSON.stringify({ presentation }),
      analysis,
      facts,
    );

    assert.equal(validation.presentation, undefined, presentation);
    assert.ok(validation.fallbackReason, presentation);
  }
});

test("GI bleed LLM presentation with severe anaemia wording succeeds without fallback", async () => {
  const input = buildInput({
    age: "67",
    sex: "male",
    presentingComplaint: "Melaena",
    history: "Melaena with coffee-ground haematemesis and pallor.",
    labs: { fbc: { hb: 62, mcv: 72 }, ues: { urea: 21 } },
  });
  const calls = { prompts: [] as string[] };
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: enabledPresentationConfig,
    llmPresentationClient: createSequenceMockClient([
      JSON.stringify({
        presentation:
          "A 67-year-old man presents with melaena, coffee-ground haematemesis and pallor. Investigations show severe anaemia with a microcytic pattern and raised urea. Overall, this is most concerning for GI bleed.",
      }),
    ], calls),
  });

  assert.equal(calls.prompts.length, 1);
  assert.equal(result.llmPresentation?.presentationSource, "llm");
  assert.equal(result.llmPresentation?.llmPresentationFallbackReason, undefined);
  assert.match(result.presentation, /severe anaemia/i);
});

test("acute hepatitis presentation is valid without mentioning internal cholangitis red flag", () => {
  const input = buildInput({
    age: "28",
    sex: "female",
    presentingComplaint: "Jaundice",
    history: "Jaundice with dark urine, malaise and nausea but no fever.",
    labs: { lfts: { bilirubin: 70, alt: 1250, ast: 1100, alp: 90, ggt: 40 } },
  });
  const analysis = {
    ...analyzeCase(input),
    redFlags: [
      {
        name: "Acute cholangitis pattern",
        explanation: "Internal diagnostic safety signal.",
        boostDiagnoses: ["Acute cholangitis"],
      },
    ],
  };
  const validation = validateLlmPresentationRewrite(
    JSON.stringify({
      presentation:
        "A 28-year-old woman presents with jaundice, dark urine, malaise and nausea. Her liver tests show a hepatocellular pattern. Overall, this is most concerning for Acute hepatitis.",
    }),
    analysis,
    buildPresentationFacts(input, analysis),
  );

  assert.equal(validation.fallbackReason, undefined);
  assert.ok(validation.presentation);
});

test("low-confidence abnormal-lab case suppresses meaningful differential display but keeps lab warnings", async () => {
  const input = buildInput({
    age: "61",
    sex: "male",
    presentingComplaint: "Weakness",
    history: "Weakness for one week with reduced appetite.",
    labs: {
      ues: { creatinine: 260, egfr: 24 },
      abg: { lactate: 5.2 },
    },
  });
  const result = await analyzeCaseWithOptionalLlmPresentation(input, {
    llmConfig: disabledConfig,
    llmPresentationConfig: disabledPresentationConfig,
  });

  assert.equal(shouldSuppressDifferentialDisplay(result), true);
  assert.doesNotMatch(result.presentation, /Temporal arteritis|Appendicitis/i);
  assert.ok(result.labs?.safetyWarnings.some((warning) => /lactate/i.test(warning.title)));
  assert.ok(result.labs?.features.includes("renal_impairment"));
});
