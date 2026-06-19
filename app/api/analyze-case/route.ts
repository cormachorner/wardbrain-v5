import { NextResponse } from 'next/server';
import { analyzeCase } from '../../../lib/application/analyzeCase';
import type { CaseInput } from '../../../lib/types';
import { z } from "zod"
import { prisma } from "../../../lib/prisma";

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
  const session =
    process.env.WARDBRAIN_TEST_AUTH_BYPASS === "1"
      ? { user: {} }
      // Next/Turbopack resolves this extensionless app import; the test runner never executes it.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore TS2835 is emitted only by the NodeNext test compile.
      : await import("../../../auth").then(({ auth }) => auth())
  const token =
    session?.user || process.env.WARDBRAIN_TEST_AUTH_BYPASS === "1"
      ? null
      : await import("next-auth/jwt").then(({ getToken }) =>
          getToken({
            req: request,
            secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
          }),
        )

  if (!session?.user && !token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json();
    const caseInput: CaseInput = caseInputSchema.parse(body);

    const result = analyzeCase(caseInput);
    const sessionUserId =
      session?.user &&
      "id" in session.user &&
      typeof session.user.id === "string"
        ? session.user.id
        : null;

    const userId =
      sessionUserId
        ? sessionUserId
        : typeof token?.id === "string"
          ? token.id
          : null;

    if (userId) {
      await prisma.case.create({
        data: {
          userId,
          title: caseInput.presentingComplaint || "Untitled case",
          caseData: JSON.stringify(caseInput),
          analysis: JSON.stringify(result),
        },
      });
    }

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
