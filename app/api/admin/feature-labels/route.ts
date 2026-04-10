import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { requireAdminRoute } from "../../../../lib/adminAuth"
import {
  createFeatureLabel,
  getRepositoryErrorPayload,
  listFeatureLabels,
} from "../../../../lib/repositories/clinicalContentRepository"
import { featureLabelSchema } from "../../../../lib/validation/clinicalContent"

export async function GET(request: NextRequest) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const featureLabels = await listFeatureLabels()
    return NextResponse.json({ featureLabels })
  } catch (error) {
    console.error("Error fetching feature labels:", error)
    return NextResponse.json({ error: "Failed to fetch feature labels." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const body = await request.json()
    const input = featureLabelSchema.parse(body)
    const featureLabel = await createFeatureLabel(input)
    return NextResponse.json({ featureLabel })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input.", details: error.issues }, { status: 400 })
    }

    const payload = getRepositoryErrorPayload(error)
    return NextResponse.json(payload.body, { status: payload.status })
  }
}
