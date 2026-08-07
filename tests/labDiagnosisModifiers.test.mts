import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/application/analyzeCase.js";
import { deriveLabFeatures } from "../lib/domain/labs/deriveLabFeatures.js";
import {
  applyLabDiagnosisModifiers,
  getLabDiagnosisModifiers,
} from "../lib/domain/labs/labDiagnosisModifiers.js";
import type { AnalyzeCaseResponse, CaseInput, DifferentialResult, ExtractedFeatures } from "../lib/types.js";

const EMPTY_CASE: CaseInput = {
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
  leadDiagnosis: "",
  otherDifferentials: "",
  dangerousDiagnoses: "",
};

function buildInput(overrides: Partial<CaseInput>): CaseInput {
  return {
    ...EMPTY_CASE,
    age: "68",
    sex: "male",
    ...overrides,
  };
}

function scoreFor(result: AnalyzeCaseResponse, diagnosis: string): number {
  const match = result.differentials.find((differential) => differential.name === diagnosis);
  assert.ok(match, `${diagnosis} should be present in displayed differentials`);
  return match.score;
}

function modifierFeatures(result: AnalyzeCaseResponse, diagnosis: string): string[] {
  return (result.labDiagnosisModifiers ?? [])
    .filter((modifier) => modifier.diagnosis === diagnosis)
    .map((modifier) => modifier.feature);
}

function rankSignature(result: AnalyzeCaseResponse) {
  return result.differentials.map((differential) => ({
    name: differential.name,
    score: differential.score,
  }));
}

test("lab diagnosis modifiers: no-lab cases retain identical names and scores", () => {
  const input = buildInput({
    presentingComplaint: "Chest pain",
    history: "Central chest pressure radiating to the jaw with sweating and nausea.",
    pmh: "Diabetes and hypertension.",
  });

  assert.deepEqual(rankSignature(analyzeCase(input)), rankSignature(analyzeCase({ ...input, labs: undefined })));
});

test("lab diagnosis modifiers: GI bleed plus anaemia and raised urea improves GI bleed ranking", () => {
  const input = buildInput({
    presentingComplaint: "Collapse",
    history: "Collapse with coffee-ground vomiting and melaena. He is tachycardic and looks pale.",
    observations: "HR 118.",
  });
  const withoutLabs = analyzeCase(input);
  const withLabs = analyzeCase({
    ...input,
    labs: {
      fbc: { hb: 82, mcv: 72 },
      ues: { urea: 16 },
    },
  });

  assert.ok(scoreFor(withLabs, "GI bleed") > scoreFor(withoutLabs, "GI bleed"));
  assert.deepEqual(modifierFeatures(withLabs, "GI bleed").sort(), ["anaemia", "microcytic_anaemia", "raised_urea"].sort());
  assert.ok(withLabs.differentials.find((differential) => differential.name === "GI bleed")?.reasonsFor.some((reason) => reason.startsWith("Lab:")));
});

test("lab diagnosis modifiers: isolated raised urea without GI bleed symptoms does not strongly promote GI bleed", () => {
  const input = buildInput({
    presentingComplaint: "Chest pain",
    history: "Central crushing chest pressure radiating to the jaw with sweating and nausea.",
  });
  const withoutLabs = analyzeCase(input);
  const withLabs = analyzeCase({
    ...input,
    labs: { ues: { urea: 18 } },
  });

  assert.deepEqual(rankSignature(withLabs), rankSignature(withoutLabs));
  assert.deepEqual(modifierFeatures(withLabs, "GI bleed"), []);
});

test("lab diagnosis modifiers: DKA plus hyperglycaemia and metabolic acidosis improves DKA ranking", () => {
  const input = buildInput({
    age: "21",
    presentingComplaint: "Shortness of breath",
    history: "Type 1 diabetes with vomiting, abdominal pain, polyuria, polydipsia and deep fast breathing.",
    observations: "RR 30, sats 99% on air.",
  });
  const withoutLabs = analyzeCase(input);
  const withLabs = analyzeCase({
    ...input,
    labs: {
      ues: { fastingGlucose: 28, bicarbonate: 12 },
      abg: { ph: 7.18, bicarbonate: 12 },
    },
  });

  assert.ok(scoreFor(withLabs, "Diabetic ketoacidosis") > scoreFor(withoutLabs, "Diabetic ketoacidosis"));
  assert.ok(modifierFeatures(withLabs, "Diabetic ketoacidosis").includes("metabolic_acidosis"));
  assert.ok(modifierFeatures(withLabs, "Diabetic ketoacidosis").includes("hyperglycaemia_lab"));
});

test("lab diagnosis modifiers: raised lactate alone does not promote DKA", () => {
  const input = buildInput({
    age: "32",
    presentingComplaint: "Shortness of breath",
    history: "Panic symptoms with tingling and normal examination. No diabetes, no vomiting, no abdominal pain.",
    observations: "Sats 99% on air.",
  });
  const result = analyzeCase({
    ...input,
    labs: { abg: { lactate: 6 } },
  });

  assert.deepEqual(modifierFeatures(result, "Diabetic ketoacidosis"), []);
  assert.notEqual(result.differentials[0]?.name, "Diabetic ketoacidosis");
  assert.ok(result.labs?.safetyWarnings.some((warning) => warning.id === "markedly-raised-lactate"));
});

test("lab diagnosis modifiers: cholestatic LFTs improve cholangitis in compatible RUQ jaundice presentations", () => {
  const input = buildInput({
    presentingComplaint: "Abdominal pain",
    history: "RUQ pain with jaundice, fever and rigors.",
  });
  const withoutLabs = analyzeCase(input);
  const withLabs = analyzeCase({
    ...input,
    labs: { lfts: { alp: 450, bilirubin: 80, ggt: 140 } },
  });

  assert.ok(scoreFor(withLabs, "Acute cholangitis") > scoreFor(withoutLabs, "Acute cholangitis"));
  assert.ok(modifierFeatures(withLabs, "Acute cholangitis").includes("cholestatic_pattern"));
});

test("lab diagnosis modifiers: hepatocellular pattern supports hepatitis when that diagnosis is in the scoring set", () => {
  const labs = deriveLabFeatures({ lfts: { alt: 520, ast: 420, alp: 90, bilirubin: 42 } });
  const features: ExtractedFeatures = {
    allText: "RUQ discomfort with jaundice.",
    matchedFeatures: ["ruq_pain", "jaundice"],
  };
  const baseDifferentials: DifferentialResult[] = [
    { name: "Hepatitis / acute liver inflammation", score: 4, reasonsFor: [], reasonsAgainst: [] },
    { name: "Acute cholangitis", score: 5, reasonsFor: [], reasonsAgainst: [] },
  ];

  const modifiers = getLabDiagnosisModifiers({
    labs,
    features,
    presentationBlockId: "acute_abdominal_pain",
  });
  const scored = applyLabDiagnosisModifiers(baseDifferentials, modifiers);

  const hepatitis = scored.find((differential) => differential.name === "Hepatitis / acute liver inflammation");
  assert.ok(hepatitis);
  assert.equal(hepatitis.score, 13);
  assert.deepEqual(
    modifiers
      .filter((modifier) => modifier.diagnosis === "Hepatitis / acute liver inflammation")
      .map((modifier) => modifier.feature),
    ["hepatocellular_pattern", "raised_transaminases"],
  );
  assert.ok(hepatitis.reasonsFor.some((reason) => reason.startsWith("Lab:")));
});

test("lab diagnosis modifiers: hypercapnic respiratory acidosis supports COPD in compatible respiratory context", () => {
  const input = buildInput({
    presentingComplaint: "Shortness of breath",
    history: "Known COPD with worsening breathlessness, wheeze and increased sputum over several days.",
    pmh: "COPD",
    social: "Long smoking history.",
  });
  const withoutLabs = analyzeCase(input);
  const withLabs = analyzeCase({
    ...input,
    labs: { abg: { ph: 7.25, paco2: 8.4, pao2: 7.5, bicarbonate: 26 } },
  });

  assert.ok(scoreFor(withLabs, "COPD exacerbation") > scoreFor(withoutLabs, "COPD exacerbation"));
  assert.ok(modifierFeatures(withLabs, "COPD exacerbation").includes("respiratory_acidosis"));
});

test("lab diagnosis modifiers: raised lactate modestly supports mesenteric ischaemia but is not diagnostic", () => {
  const compatibleInput = buildInput({
    presentingComplaint: "Abdominal pain",
    history: "Severe abdominal pain out of proportion to a soft examination in an older patient with atrial fibrillation.",
    pmh: "Atrial fibrillation.",
  });
  const compatibleWithoutLabs = analyzeCase(compatibleInput);
  const compatibleWithLabs = analyzeCase({
    ...compatibleInput,
    labs: { abg: { lactate: 5.2 } },
  });
  const incompatible = analyzeCase(buildInput({
    presentingComplaint: "Vomiting",
    history: "Vomiting and diarrhoea after a takeaway with mild cramping abdominal pain.",
    labs: { abg: { lactate: 5.2 } },
  }));

  assert.ok(scoreFor(compatibleWithLabs, "Mesenteric ischaemia") > scoreFor(compatibleWithoutLabs, "Mesenteric ischaemia"));
  assert.deepEqual(modifierFeatures(compatibleWithLabs, "Mesenteric ischaemia"), ["raised_lactate"]);
  assert.deepEqual(modifierFeatures(incompatible, "Mesenteric ischaemia"), []);
});

test("lab diagnosis modifiers: normal lactate does not reduce mesenteric ischaemia", () => {
  const input = buildInput({
    presentingComplaint: "Abdominal pain",
    history: "Severe abdominal pain out of proportion to a soft examination in an older patient with atrial fibrillation.",
    pmh: "Atrial fibrillation.",
  });
  const withoutLabs = analyzeCase(input);
  const withNormalLactate = analyzeCase({
    ...input,
    labs: { abg: { lactate: 1.2 } },
  });

  assert.equal(scoreFor(withNormalLactate, "Mesenteric ischaemia"), scoreFor(withoutLabs, "Mesenteric ischaemia"));
});

test("lab diagnosis modifiers: severe lab safety warnings remain separate from diagnosis red flags", () => {
  const input = buildInput({
    presentingComplaint: "Chest pain",
    history: "Central chest pressure radiating to the jaw with sweating.",
  });
  const withoutLabs = analyzeCase(input);
  const withLabs = analyzeCase({
    ...input,
    labs: { ues: { potassium: 6.7 }, abg: { ph: 7.12 } },
  });

  assert.deepEqual(withLabs.redFlags, withoutLabs.redFlags);
  assert.ok(withLabs.labs?.safetyWarnings.length);
  assert.deepEqual(withLabs.labDiagnosisModifiers, undefined);
});

test("lab diagnosis modifiers: unrelated abnormal labs do not produce major ranking changes", () => {
  const input = buildInput({
    presentingComplaint: "Chest pain",
    history: "Central chest pressure radiating to the jaw with sweating and nausea.",
  });
  const withoutLabs = analyzeCase(input);
  const withUnrelatedLabs = analyzeCase({
    ...input,
    labs: { lfts: { alp: 450, bilirubin: 70, ggt: 160 } },
  });

  assert.deepEqual(rankSignature(withUnrelatedLabs), rankSignature(withoutLabs));
  assert.deepEqual(withUnrelatedLabs.labDiagnosisModifiers, undefined);
});
