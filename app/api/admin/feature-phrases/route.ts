import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { requireAdminRoute } from "../../../../lib/adminAuth"
import {
  createFeaturePhrase,
  getRepositoryErrorPayload,
  listFeatureLabels,
  listFeaturePhrases,
} from "../../../../lib/repositories/clinicalContentRepository"
import { featurePhraseSchema } from "../../../../lib/validation/clinicalContent"

export async function GET(request: NextRequest) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const [featurePhrases, featureLabels] = await Promise.all([
      listFeaturePhrases(),
      listFeatureLabels(),
    ])

    return NextResponse.json({ featurePhrases, featureLabels })
  } catch (error) {
    console.error("Error fetching feature phrases:", error)
    return NextResponse.json({ error: "Failed to fetch feature phrases." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const body = await request.json()
    const input = featurePhraseSchema.parse(body)
    const featurePhrase = await createFeaturePhrase(input)
    return NextResponse.json({ featurePhrase })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input.", details: error.issues }, { status: 400 })
    }

    const payload = getRepositoryErrorPayload(error)
    return NextResponse.json(payload.body, { status: payload.status })
  }
}
