import { NextRequest, NextResponse } from "next/server"
import { requireAdminRoute } from "../../../../../lib/adminAuth"
import {
  getRepositoryErrorPayload,
  listPublishedClinicalTestCasesForRun,
  saveClinicalTestCaseRunResult,
} from "../../../../../lib/repositories/clinicalContentRepository"
import { runClinicalTestCase } from "../../../../../lib/testing/runClinicalTestCase"

export async function POST(request: NextRequest) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const testCases = await listPublishedClinicalTestCasesForRun()
    const summary = { pass: 0, partial: 0, fail: 0 }
    const results = []

    for (const testCase of testCases) {
      const { runResult } = runClinicalTestCase(testCase)

      await saveClinicalTestCaseRunResult(testCase.id, runResult)

      if (runResult.status === "PASS") {
        summary.pass += 1
      } else if (runResult.status === "PARTIAL") {
        summary.partial += 1
      } else {
        summary.fail += 1
      }

      results.push({
        id: testCase.id,
        slug: testCase.slug,
        title: testCase.title,
        runResult,
      })
    }

    return NextResponse.json({
      summary: {
        ...summary,
        total: testCases.length,
      },
      results,
    })
  } catch (error) {
    const payload = getRepositoryErrorPayload(error)
    return NextResponse.json(payload.body, { status: payload.status })
  }
}
