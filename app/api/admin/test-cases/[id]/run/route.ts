import { NextRequest, NextResponse } from "next/server"
import { requireAdminRoute } from "../../../../../../lib/adminAuth"
import { analyzeCase } from "../../../../../../lib/application/analyzeCase"
import { extractFeatures } from "../../../../../../lib/domain/featureExtractor"
import { detectRedFlags } from "../../../../../../lib/domain/redFlagRules"
import {
  getClinicalTestCaseForRun,
  getRepositoryErrorPayload,
  saveClinicalTestCaseRunResult,
} from "../../../../../../lib/repositories/clinicalContentRepository"
import type { CaseInput } from "../../../../../../lib/types"

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeFeatureToken(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
}

function parseJsonSlugList(value: string | null | undefined) {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((item) => slugify(String(item))) : []
  } catch {
    return []
  }
}

function parseJsonFeatureList(value: string | null | undefined) {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((item) => normalizeFeatureToken(String(item))) : []
  } catch {
    return []
  }
}

function buildCaseInputFromTestCase(vignette: string, title: string): CaseInput {
  return {
    age: "",
    sex: "",
    presentingComplaint: title.trim(),
    history: vignette.trim(),
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const { id } = await params
    const testCase = await getClinicalTestCaseForRun(id)

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found." }, { status: 404 })
    }

    const caseInput = buildCaseInputFromTestCase(testCase.vignette, testCase.title)
    const analysis = analyzeCase(caseInput)
    const extractedFeatures = extractFeatures(caseInput)
    const detectedRedFlagResults = detectRedFlags(extractedFeatures)

    const actualLeadDiagnosis = analysis.differentials[0]?.name ?? null
    const actualLeadDiagnosisSlug = actualLeadDiagnosis ? slugify(actualLeadDiagnosis) : ""
    const actualTop3 = analysis.differentials.slice(0, 3).map((item) => item.name)
    const detectedFeatures = extractedFeatures.matchedFeatures
    const detectedRedFlags = detectedRedFlagResults.map((flag) => slugify(flag.name))

    const expectedLeadDiagnosisSlug = testCase.expectedLeadDiagnosisSlug
      ? slugify(testCase.expectedLeadDiagnosisSlug)
      : ""
    const expectedFeatureSlugs = (() => {
      const storedExpectedFeatures = parseJsonFeatureList(testCase.expectedFeatureSlugsJson)
      if (storedExpectedFeatures.length > 0) {
        return storedExpectedFeatures
      }

      return testCase.expectedFeatures.map((item) => normalizeFeatureToken(item.featureLabel.slug))
    })()
    const expectedRedFlagSlugs = parseJsonSlugList(testCase.expectedRedFlagSlugsJson)

    const missingExpectedFeatures = expectedFeatureSlugs.filter(
      (feature) => !detectedFeatures.includes(feature),
    )
    const missingExpectedRedFlags = expectedRedFlagSlugs.filter(
      (flag) => !detectedRedFlags.includes(flag),
    )
    const leadDiagnosisMatched =
      !expectedLeadDiagnosisSlug || expectedLeadDiagnosisSlug === actualLeadDiagnosisSlug

    const metChecks = [
      expectedLeadDiagnosisSlug ? leadDiagnosisMatched : true,
      missingExpectedFeatures.length === 0,
      missingExpectedRedFlags.length === 0,
    ]
    const passedChecks = metChecks.filter(Boolean).length
    const totalChecks = metChecks.length

    const status =
      passedChecks === totalChecks
        ? "PASS"
        : passedChecks > 0
          ? "PARTIAL"
          : "FAIL"

    const runResult = {
      status,
      actualLeadDiagnosis,
      actualTop3,
      detectedFeatures,
      detectedRedFlags,
      missingExpectedFeatures,
      missingExpectedRedFlags,
      leadDiagnosisMatched,
    } as const

    const updatedTestCase = await saveClinicalTestCaseRunResult(id, runResult)

    return NextResponse.json({
      runResult,
      testCase: updatedTestCase,
    })
  } catch (error) {
    const payload = getRepositoryErrorPayload(error)
    return NextResponse.json(payload.body, { status: payload.status })
  }
}
