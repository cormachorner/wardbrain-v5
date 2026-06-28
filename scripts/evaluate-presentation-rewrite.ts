import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { analyzeCase } from "../lib/application/analyzeCase";
import { canonicalDiagnosisSlug } from "../lib/domain/diagnosisSlug";
import { openAiLlmCompletionClient, type LlmCompletionClient } from "../lib/llm/client";
import {
  getLlmPresentationConfig,
  type LlmPresentationConfig,
} from "../lib/llm/config";
import { rewritePresentationWithLlm } from "../lib/llm/presentationRewrite";
import type { AnalyzeCaseResponse, CaseInput } from "../lib/types";
import {
  parseBulkEvalCases,
  type BulkEvalCase,
} from "./evaluate-cases";

export type PresentationEvalResult = {
  id: string;
  title: string;
  leadDiagnosisSlug: string;
  leadDiagnosisName: string;
  top3Differentials: Array<{
    slug: string;
    name: string;
  }>;
  redFlags: string[];
  deterministicPresentation: string;
  llmPresentation?: string;
  attempted: boolean;
  used: boolean;
  fallbackReason?: string;
  unsupportedDiagnosisTerm?: string;
  wordCount: number;
  topDiagnosisMentioned: boolean;
  redFlagsMentionedWhenPresent: boolean;
};

export type PresentationEvalAggregate = {
  total: number;
  attemptedCount: number;
  usedCount: number;
  fallbackCount: number;
  fallbackReasons: Record<string, number>;
  unsupportedDiagnosisTerms: Record<string, number>;
  averageWordCount: number;
};

function buildInput(testCase: BulkEvalCase): CaseInput {
  return {
    age: "",
    sex: "",
    presentingComplaint: testCase.presentation,
    history: testCase.vignette,
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
  };
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function normaliseText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(text: string, phrase: string) {
  const normalisedPhrase = normaliseText(phrase);

  return normalisedPhrase.length > 0 && normaliseText(text).includes(normalisedPhrase);
}

function topDiagnosisMentioned(presentation: string, analysis: AnalyzeCaseResponse) {
  const topDiagnosis = analysis.differentials[0]?.name;

  if (!topDiagnosis) {
    return false;
  }

  const topSlug = canonicalDiagnosisSlug(topDiagnosis);
  const aliases =
    topSlug === "acute-coronary-syndrome"
      ? ["ACS", "acute coronary syndrome", "myocardial infarction", "MI", "heart attack", "cardiac ischaemia", "ischaemic chest pain"]
      : topSlug === "pulmonary-embolism"
        ? ["PE", "pulmonary embolism", "blood clot in the lung"]
        : topSlug === "diabetic-ketoacidosis"
          ? ["DKA", "diabetic ketoacidosis", "ketoacidosis"]
          : [topDiagnosis];

  return aliases.some((alias) => containsPhrase(presentation, alias));
}

function redFlagsMentioned(presentation: string, analysis: AnalyzeCaseResponse) {
  if (analysis.redFlags.length === 0) {
    return true;
  }

  return analysis.redFlags.some((flag) => {
    const cleanedFlag = flag.name
      .replace(/-/g, " ")
      .replace(/\b(suspicion|pattern|red flag)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return [cleanedFlag, ...flag.boostDiagnoses].some((term) =>
      containsPhrase(presentation, term),
    );
  });
}

function createMockPresentationClient(): LlmCompletionClient {
  return {
    async completeJson(prompt) {
      const topDiagnosis = prompt.match(/^Top diagnosis: (.*)$/m)?.[1]?.trim() || "undifferentiated pathology";
      const top3 = prompt.match(/^Top 3 differentials: (.*)$/m)?.[1]?.trim() || "none";
      const redFlags = prompt.match(/^Red flags: (.*)$/m)?.[1]?.trim() || "none";
      const redFlagText = redFlags === "none"
        ? "No specific red-flag pattern is currently highlighted."
        : `Red flags include ${redFlags}.`;

      return JSON.stringify({
        presentation: `This case is most concerning for ${topDiagnosis}. Key alternatives include ${top3}. ${redFlagText} I would present this with the current uncertainty and ask for registrar review.`,
      });
    },
  };
}

function mockPresentationConfig(): LlmPresentationConfig {
  return {
    enabled: true,
    usable: true,
    presentationEnabled: true,
    provider: "openai",
    model: "mock-presentation-rewrite",
    apiKey: "mock-key",
    confidenceThreshold: 0.8,
    timeoutMs: 1_000,
  };
}

export async function evaluatePresentationCase(
  testCase: BulkEvalCase,
  options: {
    liveLlm: boolean;
    config?: LlmPresentationConfig;
    client?: LlmCompletionClient;
  },
): Promise<PresentationEvalResult> {
  const analysis = analyzeCase(buildInput(testCase));
  const config = options.config ?? (options.liveLlm ? getLlmPresentationConfig() : mockPresentationConfig());
  const client = options.client ?? (options.liveLlm ? openAiLlmCompletionClient : createMockPresentationClient());
  const rewrite = await rewritePresentationWithLlm({
    analysis,
    config,
    client,
  });
  const metadata = rewrite.metadata;
  const evaluatedPresentation = metadata.llmPresentationUsed
    ? rewrite.presentation
    : analysis.presentation;

  return {
    id: testCase.id,
    title: testCase.title,
    leadDiagnosisSlug: canonicalDiagnosisSlug(analysis.differentials[0]?.name ?? ""),
    leadDiagnosisName: analysis.differentials[0]?.name ?? "",
    top3Differentials: analysis.differentials.slice(0, 3).map((differential) => ({
      slug: canonicalDiagnosisSlug(differential.name),
      name: differential.name,
    })),
    redFlags: analysis.redFlags.map((flag) => flag.name),
    deterministicPresentation: analysis.presentation,
    llmPresentation: metadata.llmPresentationUsed ? rewrite.presentation : undefined,
    attempted: metadata.llmPresentationAttempted,
    used: metadata.llmPresentationUsed,
    fallbackReason: metadata.llmPresentationFallbackReason,
    unsupportedDiagnosisTerm:
      metadata.llmPresentationFallbackReason === "unsupported_diagnosis_added"
        ? metadata.llmPresentationFallbackTrigger
        : undefined,
    wordCount: wordCount(evaluatedPresentation),
    topDiagnosisMentioned: topDiagnosisMentioned(evaluatedPresentation, analysis),
    redFlagsMentionedWhenPresent: redFlagsMentioned(evaluatedPresentation, analysis),
  };
}

function increment(map: Record<string, number>, key: string | undefined) {
  if (!key) {
    return;
  }

  map[key] = (map[key] ?? 0) + 1;
}

export function summarizePresentationEval(
  results: readonly PresentationEvalResult[],
): PresentationEvalAggregate {
  const fallbackReasons: Record<string, number> = {};
  const unsupportedDiagnosisTerms: Record<string, number> = {};

  for (const result of results) {
    increment(fallbackReasons, result.fallbackReason);
    increment(unsupportedDiagnosisTerms, result.unsupportedDiagnosisTerm);
  }

  return {
    total: results.length,
    attemptedCount: results.filter((result) => result.attempted).length,
    usedCount: results.filter((result) => result.used).length,
    fallbackCount: results.filter((result) => result.fallbackReason).length,
    fallbackReasons,
    unsupportedDiagnosisTerms,
    averageWordCount:
      results.length > 0
        ? results.reduce((sum, result) => sum + result.wordCount, 0) / results.length
        : 0,
  };
}

function csvEscape(value: unknown) {
  const stringValue = Array.isArray(value) ? value.join(";") : String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

export function presentationEvalToCsv(results: readonly PresentationEvalResult[]) {
  const columns = [
    "id",
    "title",
    "leadDiagnosisSlug",
    "leadDiagnosisName",
    "top3Differentials",
    "redFlags",
    "deterministicPresentation",
    "llmPresentation",
    "attempted",
    "used",
    "fallbackReason",
    "unsupportedDiagnosisTerm",
    "wordCount",
    "topDiagnosisMentioned",
    "redFlagsMentionedWhenPresent",
  ] as const;

  return [
    columns.join(","),
    ...results.map((result) =>
      columns.map((column) => {
        const value = column === "top3Differentials"
          ? result.top3Differentials.map((differential) => `${differential.slug}:${differential.name}`)
          : result[column];

        return csvEscape(value);
      }).join(","),
    ),
  ].join("\n");
}

function formatGroupedCounts(values: Record<string, number>) {
  const entries = Object.entries(values);

  return entries.length > 0
    ? entries.map(([key, count]) => `${key}=${count}`).join(", ")
    : "none";
}

function printCase(result: PresentationEvalResult) {
  console.log(
    [
      result.used ? "USED" : "FALLBACK",
      result.id,
      `lead=${result.leadDiagnosisSlug}`,
      `attempted=${result.attempted ? "yes" : "no"}`,
      `used=${result.used ? "yes" : "no"}`,
      result.fallbackReason ? `fallback=${result.fallbackReason}` : "fallback=none",
      result.unsupportedDiagnosisTerm ? `unsupported=${result.unsupportedDiagnosisTerm}` : "",
      `words=${result.wordCount}`,
    ].filter(Boolean).join(" | "),
  );
}

async function main() {
  const liveLlm = process.env.WARDBRAIN_LLM_PRESENTATION_EVAL_LIVE === "1" &&
    process.env.WARDBRAIN_LLM_PRESENTATION_ENABLED === "1" &&
    process.env.WARDBRAIN_LLM_ENABLED === "1";
  const config = getLlmPresentationConfig();

  if (liveLlm && !config.usable) {
    console.log("Live LLM presentation evaluation skipped: missing explicit live eval configuration.");
  }

  const shouldRunLive = liveLlm && config.usable;
  const rawCases = JSON.parse(
    readFileSync(join(process.cwd(), "tests", "fixtures", "evalCases.json"), "utf8"),
  ) as unknown;
  const cases = parseBulkEvalCases(rawCases);
  const results: PresentationEvalResult[] = [];

  console.log(`WardBrain presentation rewrite evaluation (${shouldRunLive ? "live LLM" : "mock"} mode)`);
  console.log(`Cases: ${cases.length}`);
  console.log("No database writes. API keys are not logged.\n");

  for (const testCase of cases) {
    const result = await evaluatePresentationCase(testCase, {
      liveLlm: shouldRunLive,
      config: shouldRunLive ? config : undefined,
    });

    results.push(result);
    printCase(result);
  }

  const aggregate = summarizePresentationEval(results);
  const report = {
    generatedAt: new Date().toISOString(),
    liveLlm: shouldRunLive,
    results,
    aggregate,
  };

  mkdirSync(join(process.cwd(), "reports"), { recursive: true });
  writeFileSync(
    join(process.cwd(), "reports", "presentation-eval-results.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  writeFileSync(
    join(process.cwd(), "reports", "presentation-eval-results.csv"),
    `${presentationEvalToCsv(results)}\n`,
  );

  console.log("\n# Summary");
  console.log(`Attempted: ${aggregate.attemptedCount}/${aggregate.total}`);
  console.log(`Used: ${aggregate.usedCount}/${aggregate.total}`);
  console.log(`Fallback: ${aggregate.fallbackCount}/${aggregate.total}`);
  console.log(`Fallback reasons: ${formatGroupedCounts(aggregate.fallbackReasons)}`);
  console.log(`Unsupported diagnosis terms: ${formatGroupedCounts(aggregate.unsupportedDiagnosisTerms)}`);
  console.log(`Average word count: ${Math.round(aggregate.averageWordCount)}`);
  console.log("\nWrote reports/presentation-eval-results.json");
  console.log("Wrote reports/presentation-eval-results.csv");
}

if (process.argv[1]?.includes("evaluate-presentation-rewrite")) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
