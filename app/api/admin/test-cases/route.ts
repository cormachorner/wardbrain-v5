import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { requireAdminRoute } from "../../../../lib/adminAuth"
import {
  createClinicalTestCase,
  getRepositoryErrorPayload,
  listClinicalTestCases,
  listFeatureLabels,
} from "../../../../lib/repositories/clinicalContentRepository"
import { clinicalTestCaseSchema } from "../../../../lib/validation/clinicalContent"

export async function GET(request: NextRequest) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const [testCases, featureLabels] = await Promise.all([
      listClinicalTestCases(),
      listFeatureLabels(),
    ])

    return NextResponse.json({ testCases, featureLabels })
  } catch (error) {
    console.error("Error fetching test cases:", error)
    return NextResponse.json({ error: "Failed to fetch test cases." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const body = await request.json()
    const input = clinicalTestCaseSchema.parse(body)
    const testCase = await createClinicalTestCase(input)
    return NextResponse.json({ testCase })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input.", details: error.issues }, { status: 400 })
    }

    const payload = getRepositoryErrorPayload(error)
    return NextResponse.json(payload.body, { status: payload.status })
  }
}
