import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { analyzeCase, analyzeCaseWithOptionalLlmExtraction } from "../lib/application/analyzeCase";
import { canonicalDiagnosisSlug } from "../lib/domain/diagnosisSlug";
import { canonicalFeatureSlug } from "../lib/domain/featureSlug";
import { getLlmExtractionConfig, type LlmExtractionConfig } from "../lib/llm/config";
import type { AnalyzeCaseResponse, CaseInput } from "../lib/types";

export type BulkEvalCase = {
  id: string;
  title: string;
  presentation: string;
  vignette: string;
  expectedLeadDiagnosisSlug: string;
  expectedFeatureSlugs: string[];
  expectedRedFlagSlugs?: string[];
  forbiddenRedFlagSlugs?: string[];
  forbiddenLeadDiagnosisSlugs?: string[];
  tags?: string[];
};

export type BulkEvalResult = {
  id: string;
  title: string;
  presentation: string;
  tags: string[];
  matchedBlockDeterministic: string | null;
  matchedBlockLlm: string | null;
  deterministicLeadDiagnosisSlug: string;
  llmLeadDiagnosisSlug: string;
  deterministicLeadCorrect: boolean;
  llmLeadCorrect: boolean;
  deterministicExpectedFeatureRecall: number;
  llmExpectedFeatureRecall: number;
  deterministicMissingFeatureSlugs: string[];
  llmMissingFeatureSlugs: string[];
  deterministicExpectedRedFlagsRecovered: string[];
  llmExpectedRedFlagsRecovered: string[];
  deterministicMissingRedFlags: string[];
  llmMissingRedFlags: string[];
  deterministicForbiddenRedFlagsPresent: string[];
  llmForbiddenRedFlagsPresent: string[];
  deterministicForbiddenLeadDiagnosisPresent: boolean;
  llmForbiddenLeadDiagnosisPresent: boolean;
  acceptedLlmFeatureSlugs: string[];
  llmUsefulAddedFeatures: string[];
  llmHarmfulAdditions: string[];
};

type AggregateSummary = {
  group: string;
  total: number;
  deterministicLeadCorrect: number;
  llmLeadCorrect: number;
  averageDeterministicFeatureRecall: number;
  averageLlmFeatureRecall: number;
  casesWithLlmUsefulAddedFeatures: number;
  casesWithLlmHarmfulAdditions: number;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function parseBulkEvalCases(raw: unknown): BulkEvalCase[] {
  if (!Array.isArray(raw)) {
    throw new Error("Evaluation fixture must be a JSON array.");
  }

  return raw.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Evaluation case at index ${index} must be an object.`);
    }

    const record = item as Record<string, unknown>;
    const requiredStrings = [
      "id",
      "title",
      "presentation",
      "vignette",
      "expectedLeadDiagnosisSlug",
    ] as const;

    for (const key of requiredStrings) {
      if (typeof record[key] !== "string" || !record[key].trim()) {
        throw new Error(`Evaluation case at index ${index} is missing ${key}.`);
      }
    }

    return {
      id: record.id as string,
      title: record.title as string,
      presentation: record.presentation as string,
      vignette: record.vignette as string,
      expectedLeadDiagnosisSlug: record.expectedLeadDiagnosisSlug as string,
      expectedFeatureSlugs: asStringArray(record.expectedFeatureSlugs).map(canonicalFeatureSlug),
      expectedRedFlagSlugs: asStringArray(record.expectedRedFlagSlugs),
      forbiddenRedFlagSlugs: asStringArray(record.forbiddenRedFlagSlugs),
      forbiddenLeadDiagnosisSlugs: asStringArray(record.forbiddenLeadDiagnosisSlugs).map(canonicalDiagnosisSlug),
      tags: asStringArray(record.tags),
    };
  });
}

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

function leadSlug(analysis: AnalyzeCaseResponse) {
  return canonicalDiagnosisSlug(analysis.differentials[0]?.name ?? "");
}

function redFlagNames(analysis: AnalyzeCaseResponse) {
  return analysis.redFlags.map((flag) => flag.name);
}

function presentExpectedFeatures(analysis: AnalyzeCaseResponse, expected: readonly string[]) {
  const actual = new Set(analysis.detectedFeatureSlugs.map(canonicalFeatureSlug));
  return expected.filter((slug) => actual.has(slug));
}

function featureRecall(analysis: AnalyzeCaseResponse, expected: readonly string[]) {
  if (expected.length === 0) {
    return 1;
  }

  return presentExpectedFeatures(analysis, expected).length / expected.length;
}

function missingFeatures(analysis: AnalyzeCaseResponse, expected: readonly string[]) {
  const actual = new Set(analysis.detectedFeatureSlugs.map(canonicalFeatureSlug));
  return expected.filter((slug) => !actual.has(slug));
}

function recoveredRedFlags(analysis: AnalyzeCaseResponse, expected: readonly string[]) {
  const actual = new Set(redFlagNames(analysis));
  return expected.filter((slug) => actual.has(slug));
}

function missingRedFlags(analysis: AnalyzeCaseResponse, expected: readonly string[]) {
  const actual = new Set(redFlagNames(analysis));
  return expected.filter((slug) => !actual.has(slug));
}

function presentForbiddenRedFlags(analysis: AnalyzeCaseResponse, forbidden: readonly string[]) {
  const actual = new Set(redFlagNames(analysis));
  return forbidden.filter((slug) => actual.has(slug));
}

function forbiddenLeadPresent(analysis: AnalyzeCaseResponse, forbidden: readonly string[]) {
  return new Set(forbidden.map(canonicalDiagnosisSlug)).has(leadSlug(analysis));
}

export async function evaluateBulkCase(
  testCase: BulkEvalCase,
  options: {
    liveLlm: boolean;
    llmConfig?: LlmExtractionConfig;
  },
): Promise<BulkEvalResult> {
  const input = buildInput(testCase);
  const deterministic = analyzeCase(input);
  const llmAnalysis = options.liveLlm
    ? await analyzeCaseWithOptionalLlmExtraction(input, {
        llmConfig: options.llmConfig ?? getLlmExtractionConfig(),
      })
    : deterministic;
  const expectedLead = canonicalDiagnosisSlug(testCase.expectedLeadDiagnosisSlug);
  const deterministicLead = leadSlug(deterministic);
  const llmLead = leadSlug(llmAnalysis);
  const deterministicMissingFeatureSlugs = missingFeatures(deterministic, testCase.expectedFeatureSlugs);
  const llmMissingFeatureSlugs = missingFeatures(llmAnalysis, testCase.expectedFeatureSlugs);
  const acceptedLlmFeatureSlugs = llmAnalysis.llmExtraction?.acceptedFeatures.map(canonicalFeatureSlug) ?? [];
  const llmUsefulAddedFeatures = acceptedLlmFeatureSlugs.filter(
    (slug) =>
      deterministicMissingFeatureSlugs.includes(slug) &&
      !llmMissingFeatureSlugs.includes(slug),
  );
  const deterministicForbiddenRedFlagsPresent = presentForbiddenRedFlags(
    deterministic,
    testCase.forbiddenRedFlagSlugs ?? [],
  );
  const llmForbiddenRedFlagsPresent = presentForbiddenRedFlags(
    llmAnalysis,
    testCase.forbiddenRedFlagSlugs ?? [],
  );
  const deterministicForbiddenLeadDiagnosisPresent = forbiddenLeadPresent(
    deterministic,
    testCase.forbiddenLeadDiagnosisSlugs ?? [],
  );
  const llmForbiddenLeadDiagnosisPresent = forbiddenLeadPresent(
    llmAnalysis,
    testCase.forbiddenLeadDiagnosisSlugs ?? [],
  );
  const llmHarmfulAdditions = [
    deterministicLead === expectedLead && llmLead !== expectedLead ? "lead_regressed" : "",
    !deterministicForbiddenLeadDiagnosisPresent && llmForbiddenLeadDiagnosisPresent
      ? "forbidden_lead_added"
      : "",
    llmForbiddenRedFlagsPresent.length > deterministicForbiddenRedFlagsPresent.length
      ? "forbidden_red_flag_added"
      : "",
    llmMissingFeatureSlugs.length > deterministicMissingFeatureSlugs.length
      ? "feature_recall_regressed"
      : "",
  ].filter(Boolean);

  return {
    id: testCase.id,
    title: testCase.title,
    presentation: testCase.presentation,
    tags: testCase.tags ?? [],
    matchedBlockDeterministic: deterministic.presentationSupport.matchedBlockId ?? null,
    matchedBlockLlm: llmAnalysis.presentationSupport.matchedBlockId ?? null,
    deterministicLeadDiagnosisSlug: deterministicLead,
    llmLeadDiagnosisSlug: llmLead,
    deterministicLeadCorrect: deterministicLead === expectedLead,
    llmLeadCorrect: llmLead === expectedLead,
    deterministicExpectedFeatureRecall: featureRecall(deterministic, testCase.expectedFeatureSlugs),
    llmExpectedFeatureRecall: featureRecall(llmAnalysis, testCase.expectedFeatureSlugs),
    deterministicMissingFeatureSlugs,
    llmMissingFeatureSlugs,
    deterministicExpectedRedFlagsRecovered: recoveredRedFlags(
      deterministic,
      testCase.expectedRedFlagSlugs ?? [],
    ),
    llmExpectedRedFlagsRecovered: recoveredRedFlags(
      llmAnalysis,
      testCase.expectedRedFlagSlugs ?? [],
    ),
    deterministicMissingRedFlags: missingRedFlags(deterministic, testCase.expectedRedFlagSlugs ?? []),
    llmMissingRedFlags: missingRedFlags(llmAnalysis, testCase.expectedRedFlagSlugs ?? []),
    deterministicForbiddenRedFlagsPresent,
    llmForbiddenRedFlagsPresent,
    deterministicForbiddenLeadDiagnosisPresent,
    llmForbiddenLeadDiagnosisPresent,
    acceptedLlmFeatureSlugs,
    llmUsefulAddedFeatures,
    llmHarmfulAdditions,
  };
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function average(values: readonly number[]) {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function summarizeGroup(group: string, results: readonly BulkEvalResult[]): AggregateSummary {
  return {
    group,
    total: results.length,
    deterministicLeadCorrect: results.filter((result) => result.deterministicLeadCorrect).length,
    llmLeadCorrect: results.filter((result) => result.llmLeadCorrect).length,
    averageDeterministicFeatureRecall: average(
      results.map((result) => result.deterministicExpectedFeatureRecall),
    ),
    averageLlmFeatureRecall: average(results.map((result) => result.llmExpectedFeatureRecall)),
    casesWithLlmUsefulAddedFeatures: results.filter((result) => result.llmUsefulAddedFeatures.length > 0).length,
    casesWithLlmHarmfulAdditions: results.filter((result) => result.llmHarmfulAdditions.length > 0).length,
  };
}

export function summarizeByPresentation(results: readonly BulkEvalResult[]) {
  const groups = new Map<string, BulkEvalResult[]>();

  for (const result of results) {
    groups.set(result.presentation, [...(groups.get(result.presentation) ?? []), result]);
  }

  return [...groups.entries()].map(([group, groupResults]) =>
    summarizeGroup(group, groupResults),
  );
}

export function summarizeByTag(results: readonly BulkEvalResult[]) {
  const groups = new Map<string, BulkEvalResult[]>();

  for (const result of results) {
    for (const tag of result.tags) {
      groups.set(tag, [...(groups.get(tag) ?? []), result]);
    }
  }

  return [...groups.entries()].map(([group, groupResults]) =>
    summarizeGroup(group, groupResults),
  );
}

function csvEscape(value: unknown) {
  const stringValue = Array.isArray(value) ? value.join(";") : String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

export function toCsv(results: readonly BulkEvalResult[]) {
  const columns = [
    "id",
    "title",
    "presentation",
    "tags",
    "matchedBlockDeterministic",
    "matchedBlockLlm",
    "deterministicLeadDiagnosisSlug",
    "llmLeadDiagnosisSlug",
    "deterministicLeadCorrect",
    "llmLeadCorrect",
    "deterministicExpectedFeatureRecall",
    "llmExpectedFeatureRecall",
    "deterministicMissingFeatureSlugs",
    "llmMissingFeatureSlugs",
    "deterministicMissingRedFlags",
    "llmMissingRedFlags",
    "deterministicForbiddenRedFlagsPresent",
    "llmForbiddenRedFlagsPresent",
    "deterministicForbiddenLeadDiagnosisPresent",
    "llmForbiddenLeadDiagnosisPresent",
    "acceptedLlmFeatureSlugs",
    "llmUsefulAddedFeatures",
    "llmHarmfulAdditions",
  ] as const;

  return [
    columns.join(","),
    ...results.map((result) =>
      columns.map((column) => csvEscape(result[column])).join(","),
    ),
  ].join("\n");
}

function printCase(result: BulkEvalResult) {
  console.log(
    [
      result.deterministicLeadCorrect ? "PASS" : "MISS",
      result.id,
      `det=${result.deterministicLeadDiagnosisSlug}`,
      `llm=${result.llmLeadDiagnosisSlug}`,
      `features=${pct(result.deterministicExpectedFeatureRecall)}->${pct(result.llmExpectedFeatureRecall)}`,
      result.llmUsefulAddedFeatures.length > 0
        ? `useful+${result.llmUsefulAddedFeatures.length}`
        : "useful+0",
      result.llmHarmfulAdditions.length > 0
        ? `harm=${result.llmHarmfulAdditions.join("|")}`
        : "harm=none",
    ].join(" | "),
  );
}

function printAggregate(title: string, summaries: readonly AggregateSummary[]) {
  console.log(`\n# ${title}`);

  for (const summary of summaries) {
    console.log(
      `${summary.group}: ${summary.llmLeadCorrect}/${summary.total} lead correct, feature recall ${pct(
        summary.averageDeterministicFeatureRecall,
      )}->${pct(summary.averageLlmFeatureRecall)}, useful ${summary.casesWithLlmUsefulAddedFeatures}, harm ${summary.casesWithLlmHarmfulAdditions}`,
    );
  }
}

async function main() {
  const liveLlm = process.env.WARDBRAIN_LLM_EVAL_LIVE === "1";
  const llmConfig = getLlmExtractionConfig();

  if (liveLlm && !llmConfig.usable) {
    console.log("Live LLM case evaluation skipped: missing explicit live eval configuration.");
  }

  const rawCases = JSON.parse(
    readFileSync(join(process.cwd(), "tests", "fixtures", "evalCases.json"), "utf8"),
  ) as unknown;
  const cases = parseBulkEvalCases(rawCases);
  const shouldRunLlm = liveLlm && llmConfig.usable;
  const results: BulkEvalResult[] = [];

  console.log(`WardBrain bulk case evaluation (${shouldRunLlm ? "live LLM" : "deterministic-only"} mode)`);
  console.log(`Cases: ${cases.length}`);
  console.log("No database writes. No UI changes.\n");

  for (const testCase of cases) {
    const result = await evaluateBulkCase(testCase, {
      liveLlm: shouldRunLlm,
      llmConfig,
    });

    results.push(result);
    printCase(result);
  }

  const aggregate = {
    total: summarizeGroup("all", results),
    byPresentation: summarizeByPresentation(results),
    byTag: summarizeByTag(results),
  };
  const report = {
    generatedAt: new Date().toISOString(),
    liveLlm: shouldRunLlm,
    results,
    aggregate,
  };

  mkdirSync(join(process.cwd(), "reports"), { recursive: true });
  writeFileSync(
    join(process.cwd(), "reports", "eval-results.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  writeFileSync(join(process.cwd(), "reports", "eval-results.csv"), `${toCsv(results)}\n`);

  console.log("\n# Summary");
  console.log(
    `All: ${aggregate.total.llmLeadCorrect}/${aggregate.total.total} lead correct, feature recall ${pct(
      aggregate.total.averageDeterministicFeatureRecall,
    )}->${pct(aggregate.total.averageLlmFeatureRecall)}, useful ${aggregate.total.casesWithLlmUsefulAddedFeatures}, harm ${aggregate.total.casesWithLlmHarmfulAdditions}`,
  );
  printAggregate("By presentation", aggregate.byPresentation);
  printAggregate("By tag", aggregate.byTag);
  console.log("\nWrote reports/eval-results.json");
  console.log("Wrote reports/eval-results.csv");
}

if (process.argv[1]?.includes("evaluate-cases")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
