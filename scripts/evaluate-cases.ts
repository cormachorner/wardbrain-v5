import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { analyzeCase, analyzeCaseWithOptionalLlmExtraction } from "../lib/application/analyzeCase";
import { canonicalDiagnosisSlug } from "../lib/domain/diagnosisSlug";
import { canonicalFeatureSlug } from "../lib/domain/featureSlug";
import { getAllowedLlmFeatureSlugsForBlock } from "../lib/llm/blockFeatureSets";
import { filterLlmFeaturesForClinicalSanity } from "../lib/llm/clinicalSanityFilter";
import { openAiLlmCompletionClient, type LlmCompletionClient } from "../lib/llm/client";
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

export type BulkEvalCliArgs = {
  caseId?: string;
  verbose?: boolean;
};

export function parseBulkEvalCliArgs(args: readonly string[]): BulkEvalCliArgs {
  const parsed: BulkEvalCliArgs = { verbose: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--case") {
      const caseId = args[index + 1];

      if (!caseId || caseId.startsWith("--")) {
        throw new Error("Missing case id after --case.");
      }

      parsed.caseId = caseId;
      index += 1;
      continue;
    }

    if (arg === "--verbose") {
      parsed.verbose = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

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

export function filterBulkEvalCases(
  cases: readonly BulkEvalCase[],
  args: BulkEvalCliArgs,
): BulkEvalCase[] {
  if (!args.caseId) {
    return [...cases];
  }

  const matchedCase = cases.find((testCase) => testCase.id === args.caseId);

  if (!matchedCase) {
    throw new Error(
      `Evaluation case not found: ${args.caseId}. Available case ids: ${cases
        .map((testCase) => testCase.id)
        .join(", ")}`,
    );
  }

  return [matchedCase];
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

type LlmFeatureDecision = {
  slug: string;
  evidence: string;
  confidence: number | null;
  reason?: string;
  source?: string;
  suggestedAlternative?: string;
};

type BulkEvalRun = {
  result: BulkEvalResult;
  input: CaseInput;
  deterministic: AnalyzeCaseResponse;
  llmAnalysis: AnalyzeCaseResponse;
  llmRawResponse?: string;
};

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
    llmClient?: LlmCompletionClient;
  },
): Promise<BulkEvalResult> {
  return (await runBulkEvalCase(testCase, options)).result;
}

async function runBulkEvalCase(
  testCase: BulkEvalCase,
  options: {
    liveLlm: boolean;
    llmConfig?: LlmExtractionConfig;
    llmClient?: LlmCompletionClient;
    captureLlmRawResponse?: boolean;
  },
): Promise<BulkEvalRun> {
  const input = buildInput(testCase);
  const deterministic = analyzeCase(input);
  let llmRawResponse: string | undefined;
  const llmClient =
    options.captureLlmRawResponse && options.liveLlm
      ? {
          async completeJson(prompt: string, config: LlmExtractionConfig) {
            const raw = await (options.llmClient ?? openAiLlmCompletionClient).completeJson(
              prompt,
              config,
            );
            llmRawResponse = raw;
            return raw;
          },
        }
      : options.llmClient;
  const llmAnalysis = options.liveLlm
    ? await analyzeCaseWithOptionalLlmExtraction(input, {
        llmConfig: options.llmConfig ?? getLlmExtractionConfig(),
        llmClient,
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

  const result = {
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

  return {
    result,
    input,
    deterministic,
    llmAnalysis,
    llmRawResponse,
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

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "None";
}

function formatRawJson(raw?: string) {
  if (!raw?.trim()) {
    return "None";
  }

  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function getRawLlmFeatureItems(raw?: string): Array<Record<string, unknown>> {
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as { features?: unknown };
    return Array.isArray(parsed.features)
      ? parsed.features.filter((item): item is Record<string, unknown> =>
          Boolean(item && typeof item === "object"),
        )
      : [];
  } catch {
    return [];
  }
}

function getLlmFeatureDecisions(params: {
  rawResponse?: string;
  deterministicFeatureSlugs: readonly string[];
  acceptedFeatureSlugs: readonly string[];
  allowedFeatureSlugs: readonly string[];
  confidenceThreshold: number;
}) {
  const allowed = new Set(params.allowedFeatureSlugs.map(canonicalFeatureSlug));
  const deterministic = new Set(params.deterministicFeatureSlugs.map(canonicalFeatureSlug));
  const acceptedRemaining = new Map<string, number>();
  const proposed: LlmFeatureDecision[] = [];
  const accepted: LlmFeatureDecision[] = [];
  const rejected: LlmFeatureDecision[] = [];

  for (const slug of params.acceptedFeatureSlugs.map(canonicalFeatureSlug)) {
    acceptedRemaining.set(slug, (acceptedRemaining.get(slug) ?? 0) + 1);
  }

  if (params.rawResponse?.trim()) {
    try {
      JSON.parse(params.rawResponse);
    } catch {
      rejected.push({
        slug: "response",
        evidence: "",
        confidence: null,
        reason: "invalid_json",
      });
      return { proposed, accepted, rejected };
    }
  }

  for (const item of getRawLlmFeatureItems(params.rawResponse)) {
    const rawSlug = typeof item.slug === "string" ? item.slug : "";
    const slug = canonicalFeatureSlug(rawSlug);
    const evidence = typeof item.evidence === "string" ? item.evidence : "";
    const confidence = typeof item.confidence === "number" ? item.confidence : null;
    const decision: LlmFeatureDecision = {
      slug: slug || rawSlug || "missing_slug",
      evidence,
      confidence,
    };

    proposed.push(decision);

    if (!slug || !allowed.has(slug)) {
      rejected.push({ ...decision, reason: "disallowed_slug" });
      continue;
    }

    if (confidence === null || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      rejected.push({ ...decision, reason: "invalid_confidence" });
      continue;
    }

    if (confidence < params.confidenceThreshold) {
      rejected.push({ ...decision, reason: "low_confidence" });
      continue;
    }

    const sanity = filterLlmFeaturesForClinicalSanity(
      [{ slug, evidence, confidence }],
      {
        allText: "",
        matchedFeatures: [...params.deterministicFeatureSlugs],
      },
    );
    const sanityRejection = sanity.rejectedFeatures[0];

    if (sanityRejection) {
      rejected.push({
        ...decision,
        reason: sanityRejection.reason,
        source: sanityRejection.source,
        suggestedAlternative: sanityRejection.suggestedAlternative,
      });
      continue;
    }

    const remainingAcceptedCount = acceptedRemaining.get(slug) ?? 0;

    if (remainingAcceptedCount > 0) {
      acceptedRemaining.set(slug, remainingAcceptedCount - 1);
      accepted.push(decision);
      continue;
    }

    rejected.push({
      ...decision,
      reason: deterministic.has(slug)
        ? "already_present_deterministically"
        : "duplicate_or_not_merged",
    });
  }

  return { proposed, accepted, rejected };
}

function formatFeatureDecision(decision: LlmFeatureDecision) {
  const confidence = decision.confidence === null ? "n/a" : decision.confidence.toFixed(2);
  const evidence = decision.evidence ? ` | evidence: ${decision.evidence}` : "";
  const reason = decision.reason ? ` | reason: ${decision.reason}` : "";
  const source = decision.source ? ` | source: ${decision.source}` : "";
  const alternative = decision.suggestedAlternative
    ? ` | suggested alternative: ${decision.suggestedAlternative}`
    : "";
  return `- ${decision.slug} | confidence: ${confidence}${evidence}${reason}${source}${alternative}`;
}

function printVerboseCase(run: BulkEvalRun, testCase: BulkEvalCase, llmConfig: LlmExtractionConfig) {
  const { result, deterministic, llmAnalysis } = run;
  const allowedFeatureSlugs = getAllowedLlmFeatureSlugsForBlock(
    deterministic.presentationSupport.matchedBlockId,
  );
  const decisions = getLlmFeatureDecisions({
    rawResponse: run.llmRawResponse,
    deterministicFeatureSlugs: deterministic.detectedFeatureSlugs,
    acceptedFeatureSlugs: result.acceptedLlmFeatureSlugs,
    allowedFeatureSlugs,
    confidenceThreshold: llmConfig.confidenceThreshold,
  });
  const deterministicRedFlags = redFlagNames(deterministic);
  const finalRedFlags = llmAnalysis.redFlags;
  const newlyForbiddenRedFlags = result.llmForbiddenRedFlagsPresent.filter(
    (flag) => !result.deterministicForbiddenRedFlagsPresent.includes(flag),
  );
  const acceptedLlmFeatureSet = new Set(result.acceptedLlmFeatureSlugs.map(canonicalFeatureSlug));

  console.log("\n==================================================");
  console.log(result.id);
  console.log(result.title);
  console.log("\nOriginal vignette\n");
  console.log(testCase.vignette);

  console.log("\nExpected:");
  console.log(`- Lead diagnosis: ${testCase.expectedLeadDiagnosisSlug}`);
  console.log(`- Expected features: ${formatList(testCase.expectedFeatureSlugs)}`);
  console.log(`- Expected red flags: ${formatList(testCase.expectedRedFlagSlugs ?? [])}`);
  console.log(`- Forbidden red flags: ${formatList(testCase.forbiddenRedFlagSlugs ?? [])}`);

  console.log("\nDeterministic extraction:");
  console.log(`- Feature slugs: ${formatList(deterministic.detectedFeatureSlugs)}`);
  console.log(`- Lead diagnosis: ${result.deterministicLeadDiagnosisSlug}`);
  console.log(`- Red flags: ${formatList(deterministicRedFlags)}`);

  console.log("\nLLM raw response (JSON only)");
  console.log(formatRawJson(run.llmRawResponse));

  console.log("\nLLM proposed features");
  console.log(decisions.proposed.length > 0 ? decisions.proposed.map(formatFeatureDecision).join("\n") : "None");

  console.log("\nAccepted LLM features");
  console.log(decisions.accepted.length > 0 ? decisions.accepted.map(formatFeatureDecision).join("\n") : "None");

  console.log("\nRejected LLM features");
  console.log(decisions.rejected.length > 0 ? decisions.rejected.map(formatFeatureDecision).join("\n") : "None");

  console.log("\nMerged features");
  console.log(formatList(llmAnalysis.detectedFeatureSlugs));

  console.log("\nFinal lead diagnosis");
  console.log(result.llmLeadDiagnosisSlug);

  console.log("\nFinal red flags");
  if (finalRedFlags.length === 0) {
    console.log("None");
  } else {
    for (const flag of finalRedFlags) {
      console.log(`- ${flag.name}`);
      console.log(`  Triggered by feature(s): ${formatList(flag.triggeredFeatures ?? [])}`);
    }
  }

  if (result.llmHarmfulAdditions.length > 0) {
    console.log("\n*** HARM DETECTED ***");
    console.log("Reason:");

    if (newlyForbiddenRedFlags.length > 0) {
      for (const flagName of newlyForbiddenRedFlags) {
        const flag = finalRedFlags.find((candidate) => candidate.name === flagName);
        const triggerFeatures = flag?.triggeredFeatures ?? [];
        const responsibleFeatures = triggerFeatures.filter((feature) =>
          acceptedLlmFeatureSet.has(canonicalFeatureSlug(feature)),
        );

        console.log(`Forbidden red flag added:\n${flagName}`);
        console.log(`\nTrigger features:\n${formatList(triggerFeatures)}`);
        console.log(`\nNew LLM feature(s) responsible:\n${formatList(responsibleFeatures)}`);
      }
    }

    const otherHarms = result.llmHarmfulAdditions.filter(
      (harm) => harm !== "forbidden_red_flag_added",
    );

    if (otherHarms.length > 0) {
      console.log(formatList(otherHarms));
    }
  }

  console.log("==================================================\n");
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
  const cliArgs = parseBulkEvalCliArgs(process.argv.slice(2));
  const cases = filterBulkEvalCases(parseBulkEvalCases(rawCases), cliArgs);
  const shouldRunLlm = liveLlm && llmConfig.usable;
  const results: BulkEvalResult[] = [];

  console.log(`WardBrain bulk case evaluation (${shouldRunLlm ? "live LLM" : "deterministic-only"} mode)`);
  console.log(`Cases: ${cases.length}`);
  console.log("No database writes. No UI changes.\n");

  for (const testCase of cases) {
    const run = await runBulkEvalCase(testCase, {
      liveLlm: shouldRunLlm,
      llmConfig,
      captureLlmRawResponse: cliArgs.verbose,
    });
    const { result } = run;

    results.push(result);
    printCase(result);

    if (cliArgs.verbose) {
      printVerboseCase(run, testCase, llmConfig);
    }
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
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
