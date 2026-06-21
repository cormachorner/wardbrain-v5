import { messyPilotLlmEvaluationFixtures } from "../tests/fixtures/messyPilotVignettes";
import {
  buildMockLlmClientForCase,
  evaluateLlmExtractionCase,
  summarizeLlmEvaluation,
  type LlmEvaluationCaseResult,
} from "../lib/llm/evaluation";
import { getLlmExtractionConfig } from "../lib/llm/config";
import { openAiLlmCompletionClient } from "../lib/llm/client";
import type { LlmCompletionClient } from "../lib/llm/client";
import type { LlmExtractionConfig } from "../lib/llm/config";

const MOCK_CONFIG: LlmExtractionConfig = {
  enabled: true,
  usable: true,
  provider: "openai",
  model: "mock-eval",
  apiKey: "mock-key",
  confidenceThreshold: 0.8,
  timeoutMs: 1_000,
};

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "None";
}

function redFlagNames(result: LlmEvaluationCaseResult["deterministic"]) {
  return result.redFlags.map((flag) => flag.name);
}

function printCaseResult(result: LlmEvaluationCaseResult) {
  console.log(`\n## ${result.title}`);
  console.log(`ID: ${result.id}`);
  console.log(`Matched block deterministic: ${result.deterministic.presentationSupport.matchedBlockId ?? "None"}`);
  console.log(`Matched block with LLM: ${result.augmented.presentationSupport.matchedBlockId ?? "None"}`);
  console.log(`Deterministic detected features: ${formatList(result.deterministic.detectedFeatureSlugs)}`);
  console.log(`LLM proposed accepted features: ${formatList(result.acceptedLlmFeatureSlugs)}`);
  console.log(`Final merged features: ${formatList(result.augmented.detectedFeatureSlugs)}`);
  console.log(`Deterministic lead diagnosis: ${result.deterministic.differentials[0]?.name ?? "None"}`);
  console.log(`LLM-augmented lead diagnosis: ${result.augmented.differentials[0]?.name ?? "None"}`);
  console.log(`Deterministic red flags: ${formatList(redFlagNames(result.deterministic))}`);
  console.log(`LLM-augmented red flags: ${formatList(redFlagNames(result.augmented))}`);
  console.log(
    `Expected key features recovered: ${
      result.expectedRecovered ? "yes" : `no, missing ${formatList(result.missingExpectedFeaturesAugmented)}`
    }`,
  );
  console.log(
    `Forbidden red flags present: ${formatList(result.forbiddenRedFlagsAugmented)}`,
  );
  console.log(
    `Assessment: ${
      result.causedHarm
        ? "harm"
        : result.leadImproved || result.redFlagsImproved || result.usefulFeaturesAdded
          ? "improved"
          : "unchanged"
    }`,
  );
}

function getEvaluationMode():
  | { mode: "mock"; config: LlmExtractionConfig; clientForCase: (caseId: string) => LlmCompletionClient }
  | { mode: "live"; config: LlmExtractionConfig; clientForCase: (caseId: string) => LlmCompletionClient }
  | { mode: "skipped-live"; reason: string } {
  if (process.env.WARDBRAIN_LLM_EVAL_LIVE !== "1") {
    return {
      mode: "mock",
      config: MOCK_CONFIG,
      clientForCase(caseId) {
        const evaluationCase = messyPilotLlmEvaluationFixtures.find((fixture) => fixture.id === caseId);
        if (!evaluationCase) {
          throw new Error(`Unknown evaluation case: ${caseId}`);
        }

        return buildMockLlmClientForCase(evaluationCase);
      },
    };
  }

  if (process.env.WARDBRAIN_LLM_ENABLED !== "1" || !process.env.OPENAI_API_KEY) {
    return {
      mode: "skipped-live",
      reason: "Live LLM evaluation skipped: missing explicit live eval configuration.",
    };
  }

  const config = getLlmExtractionConfig();

  if (!config.usable) {
    return {
      mode: "skipped-live",
      reason: "Live LLM evaluation skipped: missing explicit live eval configuration.",
    };
  }

  return {
    mode: "live",
    config,
    clientForCase() {
      return openAiLlmCompletionClient;
    },
  };
}

async function main() {
  const mode = getEvaluationMode();

  if (mode.mode === "skipped-live") {
    console.log(mode.reason);
    return;
  }

  console.log(`WardBrain LLM Extraction v0 evaluation (${mode.mode} mode)`);
  console.log("No database writes. No production behaviour changes.");

  const results: LlmEvaluationCaseResult[] = [];

  for (const evaluationCase of messyPilotLlmEvaluationFixtures) {
    const result = await evaluateLlmExtractionCase(evaluationCase, {
      llmConfig: mode.config,
      llmClient: mode.clientForCase(evaluationCase.id),
    });

    results.push(result);
    printCaseResult(result);
  }

  const summary = summarizeLlmEvaluation(results);

  console.log("\n# Summary");
  console.log(`Total cases: ${summary.totalCases}`);
  console.log(`Cases where LLM added useful features: ${summary.casesWhereLlmAddedUsefulFeatures}`);
  console.log(`Cases where lead diagnosis improved: ${summary.casesWhereLeadDiagnosisImproved}`);
  console.log(`Cases where red flags improved: ${summary.casesWhereRedFlagsImproved}`);
  console.log(`Cases where LLM caused harm: ${summary.casesWhereLlmCausedHarm}`);
  console.log(`Cases unchanged: ${summary.casesUnchanged}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
