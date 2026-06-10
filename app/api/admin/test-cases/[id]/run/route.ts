import { NextRequest, NextResponse } from "next/server"
import { requireAdminRoute } from "../../../../../../lib/adminAuth"
import {
  getClinicalTestCaseForRun,
  getRepositoryErrorPayload,
  saveClinicalTestCaseRunResult,
} from "../../../../../../lib/repositories/clinicalContentRepository"
import { runClinicalTestCase } from "../../../../../../lib/testing/runClinicalTestCase"

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

    const { runResult } = runClinicalTestCase(testCase)

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
