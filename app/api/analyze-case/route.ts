import { NextRequest, NextResponse } from 'next/server';
import { analyzeCase } from '../../../lib/application/analyzeCase';
import type { CaseInput } from '../../../lib/types';
import { getToken } from "next-auth/jwt"

export async function POST(request: NextRequest) {
  // Check for JWT token - optional for MVP
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const caseInput: CaseInput = await request.json();

    // Basic validation
    if (!caseInput.presentingComplaint) {
      return NextResponse.json({ error: 'Presenting complaint is required' }, { status: 400 });
    }

    const result = analyzeCase(caseInput);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
