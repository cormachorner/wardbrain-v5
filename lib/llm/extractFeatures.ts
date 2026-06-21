import type { CaseInput } from "../types";
import { getLlmExtractionConfig, type LlmExtractionConfig } from "./config";
import { openAiLlmCompletionClient, type LlmCompletionClient } from "./client";
import { getAllowedLlmFeatureSlugsForBlock } from "./blockFeatureSets";
import { buildLlmFeatureExtractionPrompt } from "./promptBuilders";
import {
  validateLlmFeatureExtractionResponse,
  type LlmProposedFeature,
} from "./schema";

export type LlmExtractionDebugMetadata = {
  attempted: boolean;
  skippedReason?: string;
  acceptedFeatures: string[];
  invalidReasons: string[];
};

export type LlmFeatureExtractionResult = {
  features: LlmProposedFeature[];
  metadata: LlmExtractionDebugMetadata;
};

let hasLoggedSkipOrFailure = false;

function logLlmExtractionWarning(message: string) {
  if (process.env.NODE_ENV === "production" || hasLoggedSkipOrFailure) {
    return;
  }

  hasLoggedSkipOrFailure = true;
  console.warn(message);
}

function emptyResult(skippedReason: string): LlmFeatureExtractionResult {
  return {
    features: [],
    metadata: {
      attempted: false,
      skippedReason,
      acceptedFeatures: [],
      invalidReasons: [],
    },
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("LLM extraction timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export async function extractLlmFeatures(params: {
  input: CaseInput;
  blockId?: string;
  presentationConfidence?: number;
  config?: LlmExtractionConfig;
  client?: LlmCompletionClient;
}): Promise<LlmFeatureExtractionResult> {
  const config = params.config ?? getLlmExtractionConfig();
  const client = params.client ?? openAiLlmCompletionClient;

  if (!config.enabled) {
    return emptyResult("disabled");
  }

  if (!config.usable) {
    logLlmExtractionWarning(`WardBrain LLM extraction skipped: ${config.skipReason ?? "unusable_config"}`);
    return emptyResult(config.skipReason ?? "unusable_config");
  }

  const allowedFeatureSlugs = getAllowedLlmFeatureSlugsForBlock(params.blockId);

  if (allowedFeatureSlugs.length === 0) {
    return emptyResult("unsupported_block");
  }

  if ((params.presentationConfidence ?? 0) < 6) {
    return emptyResult("weak_presentation_match");
  }

  const prompt = buildLlmFeatureExtractionPrompt({
    blockId: params.blockId ?? "unknown",
    input: params.input,
    allowedFeatureSlugs,
  });

  try {
    const rawResponse = await withTimeout(client.completeJson(prompt, config), config.timeoutMs);
    const validated = validateLlmFeatureExtractionResponse(
      rawResponse,
      allowedFeatureSlugs,
      config.confidenceThreshold,
    );

    return {
      features: validated.features,
      metadata: {
        attempted: true,
        acceptedFeatures: validated.features.map((feature) => feature.slug),
        invalidReasons: validated.invalidReasons,
      },
    };
  } catch (error) {
    logLlmExtractionWarning(
      `WardBrain LLM extraction failed; continuing deterministically: ${
        error instanceof Error ? error.message : "unknown_error"
      }`,
    );

    return {
      features: [],
      metadata: {
        attempted: true,
        skippedReason: "provider_failure",
        acceptedFeatures: [],
        invalidReasons: ["provider_failure"],
      },
    };
  }
}
