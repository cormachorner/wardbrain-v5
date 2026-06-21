export type LlmExtractionConfig = {
  enabled: boolean;
  usable: boolean;
  provider?: string;
  model?: string;
  apiKey?: string;
  confidenceThreshold: number;
  timeoutMs: number;
  skipReason?: string;
};

type EnvLike = Record<string, string | undefined>;

const DEFAULT_CONFIDENCE_THRESHOLD = 0.8;
const DEFAULT_TIMEOUT_MS = 4_000;

function parseNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getLlmExtractionConfig(
  env: EnvLike = process.env,
): LlmExtractionConfig {
  const enabled = env.WARDBRAIN_LLM_ENABLED === "1";
  const provider = env.WARDBRAIN_LLM_PROVIDER?.trim();
  const model = env.WARDBRAIN_LLM_MODEL?.trim();
  const apiKey = env.OPENAI_API_KEY?.trim();
  const confidenceThreshold = parseNumber(
    env.WARDBRAIN_LLM_CONFIDENCE_THRESHOLD,
    DEFAULT_CONFIDENCE_THRESHOLD,
  );
  const timeoutMs = parseNumber(env.WARDBRAIN_LLM_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

  if (!enabled) {
    return {
      enabled,
      usable: false,
      confidenceThreshold,
      timeoutMs,
      skipReason: "disabled",
    };
  }

  if (!provider) {
    return {
      enabled,
      usable: false,
      confidenceThreshold,
      timeoutMs,
      skipReason: "missing_provider",
    };
  }

  if (provider !== "openai") {
    return {
      enabled,
      usable: false,
      provider,
      confidenceThreshold,
      timeoutMs,
      skipReason: "unsupported_provider",
    };
  }

  if (!model) {
    return {
      enabled,
      usable: false,
      provider,
      confidenceThreshold,
      timeoutMs,
      skipReason: "missing_model",
    };
  }

  if (!apiKey) {
    return {
      enabled,
      usable: false,
      provider,
      model,
      confidenceThreshold,
      timeoutMs,
      skipReason: "missing_api_key",
    };
  }

  return {
    enabled,
    usable: true,
    provider,
    model,
    apiKey,
    confidenceThreshold,
    timeoutMs,
  };
}
