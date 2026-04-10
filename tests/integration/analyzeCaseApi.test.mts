import test from "node:test";
import assert from "node:assert/strict";
import { encode } from "next-auth/jwt";

import { POST } from "../../app/api/analyze-case/route.js";

async function createTestRequest(body: unknown) {
  const secret = "test-secret";
  process.env.NEXTAUTH_SECRET = secret;

  const token = await encode({
    token: {
      sub: "test-user",
      role: "ADMIN",
      email: "admin@example.com",
    },
    secret,
    salt: "authjs.session-token",
  });

  return new Request("http://localhost/api/analyze-case", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `authjs.session-token=${token}`,
    },
    body: JSON.stringify(body),
  });
}

test("analyze-case API returns structured analysis JSON", async () => {
  const response = await POST(
    await createTestRequest({
      age: "64",
      sex: "male",
      presentingComplaint: "Chest pain",
      history: "Central chest pressure radiating to the jaw with sweating and nausea.",
      pmh: "hypertension",
      meds: "",
      social: "smoker",
      keyPositives: "",
      keyNegatives: "",
      observations: "",
      leadDiagnosis: "ACS",
      otherDifferentials: "",
      dangerousDiagnoses: "",
    }),
  );

  assert.equal(response.status, 200);

  const payload = (await response.json()) as {
    differentials: Array<{ name: string }>;
    redFlags: Array<{ name: string }>;
    matchedPresentationBlock: { block: { id: string } } | null;
  };

  assert.equal(payload.differentials[0]?.name, "Acute coronary syndrome");
  assert.ok(payload.redFlags.some((flag) => flag.name === "ACS suspicion pattern"));
  assert.equal(payload.matchedPresentationBlock?.block.id, "chest-pain");
});
