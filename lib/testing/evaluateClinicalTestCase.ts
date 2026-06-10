import type { AnalyzeCaseResponse, RedFlag } from "../types"
import { canonicalDiagnosisSlug, slugifyDiagnosisValue } from "../domain/diagnosisSlug"
import { canonicalFeatureSlug } from "../domain/featureSlug"

export type ClinicalTestRunStatus = "PASS" | "PARTIAL" | "FAIL"

export type ClinicalTestEvaluationResult = {
  status: ClinicalTestRunStatus
  missingFeatures: string[]
  missingRequiredFeatures: string[]
  missingOptionalFeatures: string[]
  missingRedFlags: string[]
  unexpectedForbiddenRedFlags: string[]
  actualLeadDiagnosisSlug: string | null
  actualTop3DiagnosisSlugs: string[]
  actualDetectedFeatureSlugs: string[]
  actualRedFlagSlugs: string[]
  leadDiagnosisMatched: boolean | null
  leadDiagnosisInTop3: boolean | null
}

type EvaluateClinicalTestCaseInput = {
  expectedLeadDiagnosisSlug?: string | null
  expectedFeatureSlugs?: unknown
  requiredExpectedFeatureSlugs?: unknown
  optionalExpectedFeatureSlugs?: unknown
  expectedRedFlagSlugs?: unknown
  forbiddenRedFlagSlugs?: unknown
  analysis: AnalyzeCaseResponse
  detectedFeatureSlugs: string[]
}

export function slugifyClinicalTestValue(value: string) {
  return slugifyDiagnosisValue(value)
}

export function normalizeFeatureSlug(value: string) {
  return canonicalFeatureSlug(value)
}

function normalizeSlugArray(value: unknown, normalizer: (item: string) => string) {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value
        .map((item) => normalizer(String(item)))
        .filter(Boolean),
    ),
  )
}

function normalizeRedFlagSlug(flag: RedFlag) {
  return slugifyClinicalTestValue(flag.name)
}

export function evaluateClinicalTestCase({
  expectedLeadDiagnosisSlug,
  expectedFeatureSlugs,
  requiredExpectedFeatureSlugs,
  optionalExpectedFeatureSlugs,
  expectedRedFlagSlugs,
  forbiddenRedFlagSlugs,
  analysis,
  detectedFeatureSlugs,
}: EvaluateClinicalTestCaseInput): ClinicalTestEvaluationResult {
  const normalizedExpectedLead = expectedLeadDiagnosisSlug
    ? canonicalDiagnosisSlug(expectedLeadDiagnosisSlug)
    : ""
  const normalizedRequiredFeatures = normalizeSlugArray(
    requiredExpectedFeatureSlugs ?? expectedFeatureSlugs,
    normalizeFeatureSlug,
  )
  const normalizedRequiredFeatureSet = new Set(normalizedRequiredFeatures)
  const normalizedOptionalFeatures = normalizeSlugArray(optionalExpectedFeatureSlugs, normalizeFeatureSlug)
    .filter((feature) => !normalizedRequiredFeatureSet.has(feature))
  const normalizedExpectedRedFlags = normalizeSlugArray(expectedRedFlagSlugs, slugifyClinicalTestValue)
  const normalizedExpectedRedFlagSet = new Set(normalizedExpectedRedFlags)
  const normalizedForbiddenRedFlags = normalizeSlugArray(forbiddenRedFlagSlugs, slugifyClinicalTestValue)
    .filter((redFlag) => !normalizedExpectedRedFlagSet.has(redFlag))

  const actualLeadDiagnosisSlug = analysis.differentials[0]?.name
    ? canonicalDiagnosisSlug(analysis.differentials[0].name)
    : null
  const actualTop3DiagnosisSlugs = analysis.differentials
    .slice(0, 3)
    .map((differential) => canonicalDiagnosisSlug(differential.name))
  const actualDetectedFeatureSlugs = Array.from(
    new Set(detectedFeatureSlugs.map(normalizeFeatureSlug).filter(Boolean)),
  )
  const actualRedFlagSlugs = Array.from(new Set(analysis.redFlags.map(normalizeRedFlagSlug)))

  const missingRequiredFeatures = normalizedRequiredFeatures.filter(
    (feature) => !actualDetectedFeatureSlugs.includes(feature),
  )
  const missingOptionalFeatures = normalizedOptionalFeatures.filter(
    (feature) => !actualDetectedFeatureSlugs.includes(feature),
  )
  const missingFeatures = missingRequiredFeatures
  const missingRedFlags = normalizedExpectedRedFlags.filter(
    (redFlag) => !actualRedFlagSlugs.includes(redFlag),
  )
  const unexpectedForbiddenRedFlags = normalizedForbiddenRedFlags.filter(
    (redFlag) => actualRedFlagSlugs.includes(redFlag),
  )
  const leadDiagnosisMatched = normalizedExpectedLead
    ? normalizedExpectedLead === actualLeadDiagnosisSlug
    : null
  const leadDiagnosisInTop3 = normalizedExpectedLead
    ? actualTop3DiagnosisSlugs.includes(normalizedExpectedLead)
    : null

  const checks = [
    ...(normalizedExpectedLead ? [leadDiagnosisMatched, leadDiagnosisInTop3] : []),
    ...(normalizedRequiredFeatures.length > 0 ? [missingRequiredFeatures.length === 0] : []),
    ...(normalizedExpectedRedFlags.length > 0 ? [missingRedFlags.length === 0] : []),
    ...(normalizedForbiddenRedFlags.length > 0 ? [unexpectedForbiddenRedFlags.length === 0] : []),
  ]

  const passedChecks = checks.filter(Boolean).length
  const status =
    checks.length === 0 || passedChecks === checks.length
      ? "PASS"
      : passedChecks > 0
        ? "PARTIAL"
        : "FAIL"

  return {
    status,
    missingFeatures,
    missingRequiredFeatures,
    missingOptionalFeatures,
    missingRedFlags,
    unexpectedForbiddenRedFlags,
    actualLeadDiagnosisSlug,
    actualTop3DiagnosisSlugs,
    actualDetectedFeatureSlugs,
    actualRedFlagSlugs,
    leadDiagnosisMatched,
    leadDiagnosisInTop3,
  }
}
