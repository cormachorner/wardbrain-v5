import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../../app/api/analyze-case/route.js";

async function createTestRequest(body: unknown) {
  process.env.WARDBRAIN_TEST_AUTH_BYPASS = "1";

  return new Request("http://localhost/api/analyze-case", {
    method: "POST",
    headers: {
      "content-type": "application/json",
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
    redFlags: Array<{ name: string; triggeredFeatures?: string[] }>;
    diagnosisTraces: Array<{ diagnosis: string; supportingFeatures: string[] }>;
    uncertainty: { level: string; missingInformation: string[] };
    presentationSupport: { supportedBlocks: Array<{ id: string }>; matchedBlockId?: string };
    guidelineSupport: {
      sources: Array<{
        source: { id: string; source: string; url: string; licenceStatus: string };
        matchedDiagnosisSlugs: string[];
        matchedRedFlagSlugs: string[];
      }>;
    };
    matchedPresentationBlock: { block: { id: string } } | null;
  };

  assert.equal(payload.differentials[0]?.name, "Acute coronary syndrome");
  assert.ok(payload.redFlags.some((flag) => flag.name === "ACS suspicion pattern"));
  assert.ok(payload.redFlags.some((flag) => (flag.triggeredFeatures ?? []).includes("chest_pain")));
  assert.equal(payload.diagnosisTraces[0]?.diagnosis, "Acute coronary syndrome");
  assert.ok(payload.diagnosisTraces[0]?.supportingFeatures.length > 0);
  assert.ok(payload.presentationSupport.supportedBlocks.some((block) => block.id === "chest-pain"));
  assert.equal(payload.presentationSupport.matchedBlockId, "chest-pain");
  assert.ok(["low", "moderate", "high"].includes(payload.uncertainty.level));
  assert.ok(
    payload.guidelineSupport.sources.some(
      (match) =>
        match.source.id === "nice-cg95-chest-pain" &&
        match.source.source === "NICE" &&
        match.source.url === "https://www.nice.org.uk/guidance/cg95" &&
        match.source.licenceStatus.length > 0 &&
        match.matchedDiagnosisSlugs.includes("acute-coronary-syndrome") &&
        match.matchedRedFlagSlugs.includes("acs-suspicion-pattern"),
    ),
  );
  assert.equal(payload.matchedPresentationBlock?.block.id, "chest-pain");
});
