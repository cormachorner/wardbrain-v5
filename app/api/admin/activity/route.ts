import { NextRequest, NextResponse } from "next/server"
import { requireAdminRoute } from "../../../../lib/adminAuth"
import { prisma } from "../../../../lib/prisma"

type StoredCaseInput = {
  presentingComplaint?: string
}

type StoredAnalysis = {
  detectedFeatures?: string[]
  redFlags?: Array<{ name?: string }>
  differentials?: Array<{ name?: string }>
  fitCheck?: {
    conflicting?: string[]
  }
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminRoute(request)
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const cases = await prisma.case.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    })

    const activity = cases.map((item) => {
      const caseData = safeParseJson<StoredCaseInput>(item.caseData)
      const analysis = safeParseJson<StoredAnalysis>(item.analysis)

      return {
        id: item.id,
        title: item.title,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        user: item.user,
        presentingComplaint: caseData?.presentingComplaint ?? item.title,
        actualLeadDiagnosis: analysis?.differentials?.[0]?.name ?? null,
        actualTop3: (analysis?.differentials ?? [])
          .slice(0, 3)
          .map((differential) => differential.name)
          .filter(Boolean),
        detectedFeatures: analysis?.detectedFeatures ?? [],
        detectedRedFlags: (analysis?.redFlags ?? [])
          .map((redFlag) => redFlag.name)
          .filter(Boolean),
        potentialMissingFeatures: analysis?.fitCheck?.conflicting ?? [],
        caseData: safeParseJson<Record<string, unknown>>(item.caseData),
        analysis,
      }
    })

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("Error fetching admin activity:", error)
    return NextResponse.json({ error: "Failed to fetch activity." }, { status: 500 })
  }
}
