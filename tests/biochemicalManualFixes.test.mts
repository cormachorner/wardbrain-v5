import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../app/api/analyze-case/route.js";
import { analyzeCase } from "../lib/application/analyzeCase.js";
import { interpretAbg, deriveLabFeatures } from "../lib/domain/labs/index.js";
import type { AnalyzeCaseResponse, CaseInput } from "../lib/types.js";

const baseCase: CaseInput = {
  age: "58",
  sex: "female",
  presentingComplaint: "Jaundice",
  history: "",
  pmh: "",
  meds: "",
  social: "",
  keyPositives: "",
  keyNegatives: "",
  observations: "",
  leadDiagnosis: "",
  otherDifferentials: "",
  dangerousDiagnoses: "",
};

function names(result: AnalyzeCaseResponse): string[] {
  return result.differentials.map((differential) => differential.name);
}

function modifierFeatures(result: AnalyzeCaseResponse, diagnosis: string): string[] {
  return (result.labDiagnosisModifiers ?? [])
    .filter((modifier) => modifier.diagnosis === diagnosis)
    .map((modifier) => modifier.feature);
}

async function createTestRequest(body: unknown) {
  process.env.WARDBRAIN_TEST_AUTH_BYPASS = "1";

  return new Request("http://localhost/api/analyze-case", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("manual biochemical fix: hepatocellular RUQ case ranks acute hepatitis above biliary obstruction and cholangitis", () => {
  const result = analyzeCase({
    ...baseCase,
    presentingComplaint: "Jaundice and RUQ discomfort",
    history: "Malaise, jaundice and RUQ discomfort with nausea. No fever and no rigors.",
    labs: {
      lfts: { alt: 820, ast: 640, alp: 92, bilirubin: 54 },
    },
  });

  assert.ok(result.labs?.features.includes("hepatocellular_pattern"));
  assert.equal(result.differentials[0]?.name, "Acute hepatitis");
  assert.ok(names(result).indexOf("Acute hepatitis") < names(result).indexOf("Choledocholithiasis / obstructive jaundice"));
  assert.ok(!modifierFeatures(result, "Acute cholangitis").includes("inflammatory_blood_results"));
});

test("manual biochemical fix: cholangitis and biliary obstruction controls remain stable", () => {
  const cholangitis = analyzeCase({
    ...baseCase,
    presentingComplaint: "RUQ pain and jaundice",
    history: "RUQ pain with jaundice, fever, rigors, dark urine and vomiting.",
    observations: "Temperature 38.8, HR 112.",
    labs: {
      fbc: { wcc: 18.2, neutrophils: 15.3 },
      lfts: { alp: 510, bilirubin: 96, ggt: 180, alt: 72 },
    },
  });
  const obstruction = analyzeCase({
    ...baseCase,
    history: "Painless jaundice with dark urine and pale stools. No fever, rigors or systemic upset.",
    labs: {
      fbc: { wcc: 7.4, neutrophils: 4.5 },
      lfts: { alp: 470, bilirubin: 112, ggt: 170, alt: 64 },
    },
  });

  assert.equal(cholangitis.differentials[0]?.name, "Acute cholangitis");
  assert.equal(obstruction.differentials[0]?.name, "Choledocholithiasis / obstructive jaundice");
  assert.deepEqual(modifierFeatures(obstruction, "Acute cholangitis"), []);
});

test("manual biochemical fix: DILI needs medication or toxin context and is not promoted by hepatocellular labs alone", () => {
  const labs = { lfts: { alt: 820, ast: 640, alp: 92, bilirubin: 54 } };
  const withoutMedicationContext = analyzeCase({
    ...baseCase,
    history: "Malaise, jaundice and RUQ discomfort with nausea. No fever or rigors.",
    labs,
  });
  const withMedicationContext = analyzeCase({
    ...baseCase,
    history: "Malaise, jaundice and RUQ discomfort after starting a new medication. No fever or rigors.",
    meds: "New medication started last week.",
    labs,
  });

  assert.deepEqual(modifierFeatures(withoutMedicationContext, "Drug-induced liver injury"), []);
  assert.ok(modifierFeatures(withMedicationContext, "Drug-induced liver injury").includes("hepatocellular_pattern"));
  assert.ok(names(withMedicationContext).includes("Drug-induced liver injury"));
});

test("manual biochemical fix: ABG primary acid-base classification covers clear and mixed patterns", () => {
  const metabolicAcidosis = interpretAbg({ ph: 7.12, paco2: 3.2, bicarbonate: 10 });
  const respiratoryAcidosis = interpretAbg({ ph: 7.22, paco2: 8.4, bicarbonate: 25 });
  const metabolicAlkalosis = interpretAbg({ ph: 7.52, paco2: 5.3, bicarbonate: 36 });
  const respiratoryAlkalosis = interpretAbg({ ph: 7.51, paco2: 3.1, bicarbonate: 24 });
  const normal = interpretAbg({ ph: 7.4, paco2: 5.2, bicarbonate: 24, lactate: 1.2 });
  const mixed = interpretAbg({ ph: 7.12, paco2: 8.4, bicarbonate: 10 });
  const missing = interpretAbg({ ph: 7.12 });

  assert.ok(metabolicAcidosis.features.includes("metabolic_acidosis"));
  assert.ok(!metabolicAcidosis.features.includes("respiratory_acidosis"));
  assert.ok(respiratoryAcidosis.features.includes("respiratory_acidosis"));
  assert.ok(metabolicAlkalosis.features.includes("metabolic_alkalosis"));
  assert.ok(respiratoryAlkalosis.features.includes("respiratory_alkalosis"));
  assert.deepEqual(normal.features, []);
  assert.ok(mixed.features.includes("possible_mixed_acid_base_disorder"));
  assert.ok(!missing.features.includes("metabolic_acidosis"));
});

test("manual biochemical fix: DKA ABG and glucose return metabolic acidosis and hyperglycaemia", () => {
  const result = deriveLabFeatures({
    ues: { fastingGlucose: 27 },
    abg: { ph: 7.12, paco2: 3.2, bicarbonate: 10 },
  });

  assert.ok(result.features.includes("acidaemia"));
  assert.ok(result.features.includes("metabolic_acidosis"));
  assert.ok(result.features.includes("hyperglycaemia_lab"));
});

test("manual biochemical fix: analyze-case required field validation is friendly and specific", async () => {
  const missingAll = await POST(await createTestRequest({
    age: "",
    sex: "",
    presentingComplaint: "",
    history: "",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
  }));
  const missingComplaint = await POST(await createTestRequest({
    ...baseCase,
    presentingComplaint: "",
  }));

  assert.equal(missingAll.status, 400);
  assert.deepEqual(await missingAll.json(), {
    error: "Please add the patient’s age, sex and presenting complaint before analysing the case.",
  });
  assert.equal(missingComplaint.status, 400);
  assert.deepEqual(await missingComplaint.json(), {
    error: "Please add the presenting complaint before analysing the case.",
  });
});

test("manual biochemical fix: vague low-information cases do not surface arbitrary confident leads", () => {
  const result = analyzeCase({
    age: "80",
    sex: "male",
    presentingComplaint: "Weakness",
    history: "Weak and off colour. No clear localising history is available yet.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
    labs: {
      fbc: { wcc: 18, neutrophils: 15 },
      ues: { creatinine: 260, potassium: 5.7 },
      abg: { ph: 7.3, lactate: 4.8 },
    },
  });

  assert.deepEqual(result.differentials, []);
  assert.equal(result.uncertainty.level, "high");
  assert.ok(result.uncertainty.summary.includes("does not yet have enough"));
  assert.ok(result.labs?.safetyWarnings.some((warning) => warning.id === "raised-lactate"));
});

test("manual biochemical fix: strong classic presentation remains unaffected by low-information gate", () => {
  const result = analyzeCase({
    age: "64",
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
  });

  assert.equal(result.differentials[0]?.name, "Acute coronary syndrome");
  assert.ok(result.differentials[0]?.score >= 3);
});
