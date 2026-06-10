import { analyzeCase } from "../application/analyzeCase"
import { evaluateClinicalTestCase } from "./evaluateClinicalTestCase"
import type { AnalyzeCaseResponse, CaseInput } from "../types"

type ClinicalTestCaseForRun = {
  id?: string
  slug?: string
  title: string
  presentationBlock?: string
  vignette: string
  expectedLeadDiagnosis?: string | null
  expectedLeadDiagnosisSlug: string | null
  expectedFeatureSlugsJson: unknown
  expectedRedFlagSlugsJson: unknown
  expectedFeatures: Array<{
    featureLabel: {
      slug: string
    }
  }>
}

export type ClinicalTestCaseRunOutput = {
  caseInput: CaseInput
  analysis: AnalyzeCaseResponse
  runResult: ReturnType<typeof evaluateClinicalTestCase>
}

function getPresentingComplaint(testCase: ClinicalTestCaseForRun) {
  if (testCase.presentationBlock === "acute_abdominal_pain") {
    return "Abdominal pain"
  }

  return testCase.title.trim()
}

function buildCaseInputFromTestCase(testCase: ClinicalTestCaseForRun): CaseInput {
  return {
    age: "",
    sex: "",
    presentingComplaint: getPresentingComplaint(testCase),
    history: testCase.vignette.trim(),
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  }
}

function getSlugList(value: unknown, keys: string[] = []) {
  if (Array.isArray(value)) {
    return value
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>

    for (const key of keys) {
      if (Array.isArray(record[key])) {
        return record[key]
      }
    }
  }

  return []
}

function getRequiredExpectedFeatureSlugs(testCase: ClinicalTestCaseForRun) {
  const structuredRequired = getSlugList(testCase.expectedFeatureSlugsJson, [
    "requiredExpectedFeatureSlugs",
    "required",
  ])

  if (structuredRequired.length > 0) {
    return structuredRequired
  }

  if (Array.isArray(testCase.expectedFeatureSlugsJson) && testCase.expectedFeatureSlugsJson.length > 0) {
    return testCase.expectedFeatureSlugsJson
  }

  return testCase.expectedFeatures.map((item) => item.featureLabel.slug)
}

export function runClinicalTestCase(testCase: ClinicalTestCaseForRun): ClinicalTestCaseRunOutput {
  const caseInput = buildCaseInputFromTestCase(testCase)
  const analysis = analyzeCase(caseInput)

  if (process.env.WARDBRAIN_TEST_RUNNER_DEBUG === "1") {
    console.log("runClinicalTestCase analyzeCase differentials", {
      id: testCase.id,
      slug: testCase.slug,
      differentials: analysis.differentials.map((differential) => ({
        name: differential.name,
        score: differential.score,
      })),
      detectedFeatureSlugs: analysis.detectedFeatureSlugs,
    })
  }

  const expectedRedFlagSlugs = getSlugList(testCase.expectedRedFlagSlugsJson, [
    "expectedRedFlagSlugs",
    "expected",
    ])
  const runResult = evaluateClinicalTestCase({
    expectedLeadDiagnosisSlug: testCase.expectedLeadDiagnosisSlug ?? testCase.expectedLeadDiagnosis,
    requiredExpectedFeatureSlugs: getRequiredExpectedFeatureSlugs(testCase),
    optionalExpectedFeatureSlugs: getSlugList(testCase.expectedFeatureSlugsJson, [
      "optionalExpectedFeatureSlugs",
      "optional",
    ]),
    expectedRedFlagSlugs: Array.isArray(testCase.expectedRedFlagSlugsJson)
      ? testCase.expectedRedFlagSlugsJson
      : expectedRedFlagSlugs,
    forbiddenRedFlagSlugs: getSlugList(testCase.expectedRedFlagSlugsJson, [
      "forbiddenRedFlagSlugs",
      "forbidden",
    ]),
    analysis,
    detectedFeatureSlugs: analysis.detectedFeatureSlugs,
  })

  return {
    caseInput,
    analysis,
    runResult,
  }
}
