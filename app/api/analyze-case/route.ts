import { analyzeCase } from "../../../lib/application/analyzeCase";
import type { CaseInput } from "../../../lib/types";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const input = body as Partial<CaseInput>;

  const response = analyzeCase({
    age: typeof input.age === "string" ? input.age : "",
    sex: typeof input.sex === "string" ? input.sex : "",
    presentingComplaint:
      typeof input.presentingComplaint === "string" ? input.presentingComplaint : "",
    history: typeof input.history === "string" ? input.history : "",
    pmh: typeof input.pmh === "string" ? input.pmh : "",
    meds: typeof input.meds === "string" ? input.meds : "",
    social: typeof input.social === "string" ? input.social : "",
    keyPositives: typeof input.keyPositives === "string" ? input.keyPositives : "",
    keyNegatives: typeof input.keyNegatives === "string" ? input.keyNegatives : "",
    observations: typeof input.observations === "string" ? input.observations : "",
    leadDiagnosis: typeof input.leadDiagnosis === "string" ? input.leadDiagnosis : "",
    otherDifferentials:
      typeof input.otherDifferentials === "string" ? input.otherDifferentials : "",
    dangerousDiagnoses:
      typeof input.dangerousDiagnoses === "string" ? input.dangerousDiagnoses : "",
    suspectedDiagnosis: typeof input.suspectedDiagnosis === "string" ? input.suspectedDiagnosis : "",
  });

  return Response.json(response);
}
