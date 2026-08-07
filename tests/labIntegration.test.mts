import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/application/analyzeCase.js";
import type { AnalyzeCaseResponse, CaseInput } from "../lib/types.js";
import { POST } from "../app/api/analyze-case/route.js";

const baseCase: CaseInput = {
  age: "58",
  sex: "male",
  presentingComplaint: "Chest pain",
  history: "Central crushing chest pressure radiating to the jaw with sweating and nausea.",
  pmh: "Type 2 diabetes and hypertension.",
  meds: "",
  social: "Smoker.",
  keyPositives: "",
  keyNegatives: "",
  observations: "HR 110.",
  leadDiagnosis: "",
  otherDifferentials: "",
  dangerousDiagnoses: "",
};

function rankSignature(result: AnalyzeCaseResponse) {
  return result.differentials.map((differential) => ({
    name: differential.name,
    score: differential.score,
  }));
}

function redFlagSignature(result: AnalyzeCaseResponse) {
  return result.redFlags.map((flag) => ({
    name: flag.name,
    explanation: flag.explanation,
    boostDiagnoses: flag.boostDiagnoses,
  }));
}

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

test("lab integration: no labs preserves existing analysis shape", () => {
  const result = analyzeCase(baseCase);

  assert.equal(result.labs, undefined);
  assert.equal(result.differentials[0]?.name, "Acute coronary syndrome");
});

test("lab integration: partial panels produce display-only interpretation", () => {
  const withoutLabs = analyzeCase(baseCase);
  const withLabs = analyzeCase({
    ...baseCase,
    labs: {
      fbc: {
        hb: 82,
        wcc: 14.2,
        mcv: 72,
        neutrophils: 9,
      },
      ues: {
        potassium: 6.4,
        creatinine: 190,
      },
      abg: {
        ph: 7.21,
        bicarbonate: 15,
        lactate: 4.6,
      },
    },
  });

  assert.deepEqual(rankSignature(withLabs), rankSignature(withoutLabs));
  assert.ok(withLabs.labs);
  assert.ok(withLabs.labs.features.includes("microcytic_anaemia"));
  assert.ok(withLabs.labs.features.includes("severe_hyperkalaemia"));
  assert.ok(withLabs.labs.features.includes("metabolic_acidosis"));
  assert.ok(withLabs.labs.features.includes("raised_lactate"));
  assert.ok(withLabs.labs.safetyWarnings.some((warning) => warning.id === "significant-hyperkalaemia"));
  assert.ok(withLabs.labs.abnormalities.some((abnormality) => abnormality.test === "Hb"));
  assert.ok(!withLabs.detectedFeatureSlugs.includes("microcytic_anaemia"));
  assert.ok(!withLabs.redFlags.some((flag) => flag.name === "Severe hyperkalaemia"));
});

test("lab integration: sex-specific Hb interpretation does not affect diagnosis ranking", () => {
  const male = analyzeCase({
    ...baseCase,
    sex: "male",
    labs: { fbc: { hb: 120, pcv: 0.38 } },
  });
  const female = analyzeCase({
    ...baseCase,
    sex: "female",
    labs: { fbc: { hb: 120, pcv: 0.38 } },
  });

  assert.deepEqual(rankSignature(male), rankSignature(female));
  assert.ok(male.labs?.features.includes("anaemia"));
  assert.ok(!female.labs?.features.includes("anaemia"));
});

test("lab integration: invalid direct numeric values are reported without changing scores", () => {
  const withoutLabs = analyzeCase(baseCase);
  const withInvalidLabs = analyzeCase({
    ...baseCase,
    labs: {
      fbc: { hb: Number.NaN },
      ues: { potassium: -1 },
      abg: { lactate: Number.POSITIVE_INFINITY },
    },
  });

  assert.deepEqual(rankSignature(withInvalidLabs), rankSignature(withoutLabs));
  assert.equal(
    withInvalidLabs.labs?.abnormalities.filter((abnormality) => abnormality.status === "invalid").length,
    3,
  );
  assert.deepEqual(withInvalidLabs.labs?.safetyWarnings, []);
});

test("lab integration: safety warnings do not alter diagnosis names scores or red flags", () => {
  const withoutLabs = analyzeCase(baseCase);
  const withSafetyWarnings = analyzeCase({
    ...baseCase,
    labs: {
      fbc: {
        hb: 62,
        platelets: 18,
      },
      ues: {
        potassium: 6.7,
        sodium: 118,
        fastingGlucose: 2.1,
      },
      abg: {
        ph: 7.12,
        pao2: 6.8,
        lactate: 6,
      },
    },
  });

  assert.deepEqual(rankSignature(withSafetyWarnings), rankSignature(withoutLabs));
  assert.deepEqual(redFlagSignature(withSafetyWarnings), redFlagSignature(withoutLabs));
  assert.ok(withSafetyWarnings.labs?.safetyWarnings.length);
  assert.ok(!withSafetyWarnings.detectedFeatureSlugs.includes("severe_hyperkalaemia"));
});

test("lab integration: analyze-case API remains backwards compatible without labs", async () => {
  const response = await POST(await createTestRequest(baseCase));
  const payload = (await response.json()) as AnalyzeCaseResponse;

  assert.equal(response.status, 200);
  assert.equal(payload.labs, undefined);
  assert.equal(payload.differentials[0]?.name, "Acute coronary syndrome");
});

test("lab integration: analyze-case API accepts optional laboratory values", async () => {
  const response = await POST(
    await createTestRequest({
      ...baseCase,
      labs: {
        fbc: {
          hb: 82,
          mcv: 72,
        },
        lfts: {
          alt: 420,
          alp: 90,
        },
      },
    }),
  );
  const payload = (await response.json()) as AnalyzeCaseResponse;

  assert.equal(response.status, 200);
  assert.ok(payload.labs?.features.includes("microcytic_anaemia"));
  assert.ok(payload.labs?.features.includes("hepatocellular_pattern"));
  assert.equal(payload.differentials[0]?.name, "Acute coronary syndrome");
});
