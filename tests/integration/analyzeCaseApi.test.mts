import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../app/api/analyze-case/route.js";

test("analyze-case API returns structured analysis JSON", async () => {
  const response = await POST(
    new Request("http://localhost/api/analyze-case", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
