import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { requireAdminRoute } from "../../../../../lib/adminAuth"
import {
  deleteFeaturePhrase,
  getRepositoryErrorPayload,
  updateFeaturePhrase,
} from "../../../../../lib/repositories/clinicalContentRepository"
import { featurePhraseSchema } from "../../../../../lib/validation/clinicalContent"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const { id } = await params
    const body = await request.json()
    const input = featurePhraseSchema.parse(body)
    const featurePhrase = await updateFeaturePhrase(id, input)
    return NextResponse.json({ featurePhrase })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input.", details: error.issues }, { status: 400 })
    }

    const payload = getRepositoryErrorPayload(error)
    return NextResponse.json(payload.body, { status: payload.status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const { id } = await params
    await deleteFeaturePhrase(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const payload = getRepositoryErrorPayload(error)
    return NextResponse.json(payload.body, { status: payload.status })
  }
}
