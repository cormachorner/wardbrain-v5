import { NextResponse } from 'next/server';
import { analyzeCase } from '../../../lib/application/analyzeCase';
import type { CaseInput } from '../../../lib/types';
import { getToken } from "next-auth/jwt"
import { z } from "zod"

const caseInputSchema = z.object({
  age: z.string().min(1),
  sex: z.string().min(1),
  presentingComplaint: z.string().min(1),
  history: z.string(),
  pmh: z.string(),
  meds: z.string(),
  social: z.string(),
  keyPositives: z.string(),
  keyNegatives: z.string(),
  observations: z.string(),
  leadDiagnosis: z.string().optional(),
  otherDifferentials: z.string().optional(),
  dangerousDiagnoses: z.string().optional(),
  suspectedDiagnosis: z.string().optional(),
})

export async function POST(request: Request) {
  // Check for JWT token - optional for MVP
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json();
    const caseInput: CaseInput = caseInputSchema.parse(body);

    const result = analyzeCase(caseInput);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
