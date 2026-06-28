import { analyzeCase, analyzeCaseWithOptionalLlmExtraction } from "../application/analyzeCase";
import { canonicalDiagnosisSlug } from "../domain/diagnosisSlug";
import { canonicalFeatureSlug } from "../domain/featureSlug";
import type { LlmCompletionClient } from "./client";
import type { LlmExtractionConfig } from "./config";
import type { LlmProposedFeature } from "./schema";
import type { AnalyzeCaseResponse, CaseInput } from "../types";

export type LlmEvaluationCase = {
  id: string;
  title: string;
  input: CaseInput;
  expectedLeadDiagnosisSlug: string;
  expectedKeyFeatures: string[];
  expectedRedFlags?: string[];
  forbiddenRedFlags?: string[];
  forbiddenLeadDiagnosisSlugs?: string[];
  expectedUsefulLlmAddedFeatures?: string[];
  mockLlmFeatures: LlmProposedFeature[];
};

export type LlmEvaluationCaseResult = {
  id: string;
  title: string;
  deterministic: AnalyzeCaseResponse;
  augmented: AnalyzeCaseResponse;
  acceptedLlmFeatureSlugs: string[];
  expectedRecovered: boolean;
  missingExpectedFeaturesDeterministic: string[];
  missingExpectedFeaturesAugmented: string[];
  forbiddenRedFlagsDeterministic: string[];
  forbiddenRedFlagsAugmented: string[];
  forbiddenLeadDeterministic: boolean;
  forbiddenLeadAugmented: boolean;
  expectedRedFlagsMissingDeterministic: string[];
  expectedRedFlagsMissingAugmented: string[];
  leadImproved: boolean;
  redFlagsImproved: boolean;
  usefulFeaturesAdded: boolean;
  causedHarm: boolean;
  unchanged: boolean;
};

export type LlmEvaluationSummary = {
  totalCases: number;
  casesWhereLlmAddedUsefulFeatures: number;
  casesWhereLeadDiagnosisImproved: number;
  casesWhereRedFlagsImproved: number;
  casesWhereLlmCausedHarm: number;
  casesUnchanged: number;
};

export function buildMockLlmClientForCase(evaluationCase: LlmEvaluationCase): LlmCompletionClient {
  return {
    async completeJson() {
      return JSON.stringify({
        features: evaluationCase.mockLlmFeatures,
      });
    },
  };
}

function redFlagNames(result: AnalyzeCaseResponse) {
  return result.redFlags.map((flag) => flag.name);
}

function getLeadSlug(result: AnalyzeCaseResponse) {
  return canonicalDiagnosisSlug(result.differentials[0]?.name ?? "");
}

function missingFeatures(result: AnalyzeCaseResponse, expectedFeatures: readonly string[]) {
  const actual = new Set(result.detectedFeatureSlugs.map(canonicalFeatureSlug));
  return expectedFeatures
    .map(canonicalFeatureSlug)
    .filter((feature) => !actual.has(feature));
}

function missingRedFlags(result: AnalyzeCaseResponse, expectedRedFlags: readonly string[] = []) {
  const actual = new Set(redFlagNames(result));
  return expectedRedFlags.filter((flag) => !actual.has(flag));
}

function presentForbiddenRedFlags(result: AnalyzeCaseResponse, forbiddenRedFlags: readonly string[] = []) {
  const actual = new Set(redFlagNames(result));
  return forbiddenRedFlags.filter((flag) => actual.has(flag));
}

export async function evaluateLlmExtractionCase(
  evaluationCase: LlmEvaluationCase,
  options: {
    llmConfig: LlmExtractionConfig;
    llmClient?: LlmCompletionClient;
  },
): Promise<LlmEvaluationCaseResult> {
  const deterministic = analyzeCase(evaluationCase.input);
  const augmented = await analyzeCaseWithOptionalLlmExtraction(evaluationCase.input, {
    llmConfig: options.llmConfig,
    llmClient: options.llmClient ?? buildMockLlmClientForCase(evaluationCase),
  });
  const acceptedLlmFeatureSlugs = augmented.llmExtraction?.acceptedFeatures ?? [];
  const expectedLead = canonicalDiagnosisSlug(evaluationCase.expectedLeadDiagnosisSlug);
  const deterministicLead = getLeadSlug(deterministic);
  const augmentedLead = getLeadSlug(augmented);
  const forbiddenLeads = new Set(
    (evaluationCase.forbiddenLeadDiagnosisSlugs ?? []).map(canonicalDiagnosisSlug),
  );
  const missingExpectedFeaturesDeterministic = missingFeatures(
    deterministic,
    evaluationCase.expectedKeyFeatures,
  );
  const missingExpectedFeaturesAugmented = missingFeatures(
    augmented,
    evaluationCase.expectedKeyFeatures,
  );
  const expectedRedFlagsMissingDeterministic = missingRedFlags(
    deterministic,
    evaluationCase.expectedRedFlags,
  );
  const expectedRedFlagsMissingAugmented = missingRedFlags(
    augmented,
    evaluationCase.expectedRedFlags,
  );
  const forbiddenRedFlagsDeterministic = presentForbiddenRedFlags(
    deterministic,
    evaluationCase.forbiddenRedFlags,
  );
  const forbiddenRedFlagsAugmented = presentForbiddenRedFlags(
    augmented,
    evaluationCase.forbiddenRedFlags,
  );
  const forbiddenLeadDeterministic = forbiddenLeads.has(deterministicLead);
  const forbiddenLeadAugmented = forbiddenLeads.has(augmentedLead);
  const leadImproved = deterministicLead !== expectedLead && augmentedLead === expectedLead;
  const redFlagsImproved =
    expectedRedFlagsMissingAugmented.length < expectedRedFlagsMissingDeterministic.length;
  const recoveredExpectedFeatures = missingExpectedFeaturesDeterministic.filter(
    (feature) => !missingExpectedFeaturesAugmented.includes(feature),
  );
  const usefulFeaturesAdded =
    recoveredExpectedFeatures.length > 0 ||
    (acceptedLlmFeatureSlugs.length > 0 && (leadImproved || redFlagsImproved));
  const causedHarm =
    (deterministicLead === expectedLead && augmentedLead !== expectedLead) ||
    (!forbiddenLeadDeterministic && forbiddenLeadAugmented) ||
    forbiddenRedFlagsAugmented.length > forbiddenRedFlagsDeterministic.length ||
    missingExpectedFeaturesAugmented.length > missingExpectedFeaturesDeterministic.length;
  const unchanged =
    !usefulFeaturesAdded &&
    !leadImproved &&
    !redFlagsImproved &&
    !causedHarm;

  return {
    id: evaluationCase.id,
    title: evaluationCase.title,
    deterministic,
    augmented,
    acceptedLlmFeatureSlugs,
    expectedRecovered: missingExpectedFeaturesAugmented.length === 0,
    missingExpectedFeaturesDeterministic,
    missingExpectedFeaturesAugmented,
    forbiddenRedFlagsDeterministic,
    forbiddenRedFlagsAugmented,
    forbiddenLeadDeterministic,
    forbiddenLeadAugmented,
    expectedRedFlagsMissingDeterministic,
    expectedRedFlagsMissingAugmented,
    leadImproved,
    redFlagsImproved,
    usefulFeaturesAdded,
    causedHarm,
    unchanged,
  };
}

export function summarizeLlmEvaluation(
  results: readonly LlmEvaluationCaseResult[],
): LlmEvaluationSummary {
  return {
    totalCases: results.length,
    casesWhereLlmAddedUsefulFeatures: results.filter((result) => result.usefulFeaturesAdded).length,
    casesWhereLeadDiagnosisImproved: results.filter((result) => result.leadImproved).length,
    casesWhereRedFlagsImproved: results.filter((result) => result.redFlagsImproved).length,
    casesWhereLlmCausedHarm: results.filter((result) => result.causedHarm).length,
    casesUnchanged: results.filter((result) => result.unchanged).length,
  };
}
