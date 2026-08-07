import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/application/analyzeCase.js";
import type { LabPanels } from "../lib/domain/labs/labTypes.js";
import type { AnalyzeCaseResponse, CaseInput } from "../lib/types.js";

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
    age: "70",
    sex: "male",
    ...overrides,
  };
}

function withLabs(input: CaseInput, labs: LabPanels): CaseInput {
  return { ...input, labs };
}

function names(result: AnalyzeCaseResponse): string[] {
  return result.differentials.map((differential) => differential.name);
}

function top3(result: AnalyzeCaseResponse): string[] {
  return names(result).slice(0, 3);
}

function scoreFor(result: AnalyzeCaseResponse, diagnosis: string): number {
  const match = result.differentials.find((differential) => differential.name === diagnosis);
  assert.ok(match, `${diagnosis} should be present in displayed differentials. Saw: ${names(result).join(", ")}`);
  return match.score;
}

function rankOf(result: AnalyzeCaseResponse, diagnosis: string): number {
  const index = names(result).indexOf(diagnosis);
  return index === -1 ? 99 : index + 1;
}

function modifierFeatures(result: AnalyzeCaseResponse, diagnosis: string): string[] {
  return (result.labDiagnosisModifiers ?? [])
    .filter((modifier) => modifier.diagnosis === diagnosis)
    .map((modifier) => modifier.feature);
}

function totalLabDelta(result: AnalyzeCaseResponse, diagnosis: string): number {
  return (result.labDiagnosisModifiers ?? [])
    .filter((modifier) => modifier.diagnosis === diagnosis)
    .reduce((total, modifier) => total + modifier.scoreDelta, 0);
}

function labFeatures(result: AnalyzeCaseResponse): string[] {
  return result.labs?.features ?? [];
}

function safetyWarningIds(result: AnalyzeCaseResponse): string[] {
  return result.labs?.safetyWarnings.map((warning) => warning.id) ?? [];
}

function assertRedFlagsUnchanged(before: AnalyzeCaseResponse, after: AnalyzeCaseResponse): void {
  assert.deepEqual(after.redFlags.map((flag) => flag.name), before.redFlags.map((flag) => flag.name));
}

function assertNoWeakLabOverpromotion(
  before: AnalyzeCaseResponse,
  after: AnalyzeCaseResponse,
  protectedLead: string,
  weaklyModifiedDiagnoses: string[],
): void {
  for (const diagnosis of weaklyModifiedDiagnoses) {
    const rankJump = rankOf(before, diagnosis) - rankOf(after, diagnosis);
    assert.ok(rankJump <= 3, `${diagnosis} moved ${rankJump} positions from weak lab evidence`);
    assert.notEqual(after.differentials[0]?.name, diagnosis, `${diagnosis} should not become lead from weak lab evidence`);
  }

  assert.equal(after.differentials[0]?.name, protectedLead);
}

test("biochemical regression: upper GI bleed gains appropriate support from anaemia and raised urea", () => {
  const clinical = buildInput({
    presentingComplaint: "Collapse",
    history: "He collapsed after two episodes of coffee-ground haematemesis and has passed black melaena overnight.",
    observations: "HR 122, BP 96/60.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    fbc: { hb: 76, mcv: 84 },
    ues: { urea: 19, creatinine: 96 },
  }));

  assert.equal(biochemical.differentials[0]?.name, "GI bleed");
  assert.ok(scoreFor(biochemical, "GI bleed") > scoreFor(baseline, "GI bleed"));
  assert.deepEqual(modifierFeatures(biochemical, "GI bleed").sort(), ["anaemia", "raised_urea"].sort());
  assert.ok(totalLabDelta(biochemical, "GI bleed") <= 8);
});

test("biochemical regression: chronic microcytic anaemia pattern is recognised without sepsis or renal promotion", () => {
  const clinical = buildInput({
    presentingComplaint: "Fatigue",
    history: "Months of fatigue and intermittent dark stools, without fever, rigors or reduced urine output.",
    observations: "Afebrile.",
  });
  const biochemical = analyzeCase(withLabs(clinical, {
    fbc: { hb: 88, mcv: 69, wcc: 7.2, neutrophils: 4.6 },
    ues: { creatinine: 82, urea: 5.5 },
  }));

  assert.ok(labFeatures(biochemical).includes("microcytic_anaemia"));
  assert.deepEqual(modifierFeatures(biochemical, "Sepsis"), []);
  assert.deepEqual(modifierFeatures(biochemical, "Delirium secondary to infection"), []);
});

test("biochemical regression: symptomatic anaemia gains bounded support from low Hb and microcytosis", () => {
  const clinical = buildInput({
    age: "34",
    sex: "female",
    presentingComplaint: "Shortness of breath",
    history: "Progressive exertional breathlessness with fatigue, pallor and heavy menstrual bleeding.",
    observations: "HR 104, sats 99% on air.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    fbc: { hb: 82, mcv: 71, wcc: 6.8, neutrophils: 4.2 },
  }));

  assert.equal(biochemical.differentials[0]?.name, "Anaemia");
  assert.ok(scoreFor(biochemical, "Anaemia") > scoreFor(baseline, "Anaemia"));
  assert.deepEqual(modifierFeatures(biochemical, "Anaemia").sort(), ["anaemia", "microcytic_anaemia"].sort());
  assert.ok(totalLabDelta(biochemical, "Anaemia") <= 6);
});

test("biochemical regression: incidental low Hb without anaemia context does not promote anaemia over a strong presentation", () => {
  const clinical = buildInput({
    presentingComplaint: "Headache",
    history: "Sudden thunderclap headache with vomiting and neck stiffness.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    fbc: { hb: 101, mcv: 86 },
  }));

  assert.equal(biochemical.differentials[0]?.name, baseline.differentials[0]?.name);
  assert.deepEqual(modifierFeatures(biochemical, "Anaemia"), []);
});

test("biochemical regression: DKA gains strong support from hyperglycaemia and metabolic acidosis", () => {
  const clinical = buildInput({
    age: "22",
    presentingComplaint: "Shortness of breath",
    history: "Type 1 diabetes with vomiting, abdominal pain, thirst, passing lots of urine and deep fast breathing.",
    observations: "RR 32, sats 99% on air.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    ues: { fastingGlucose: 29, bicarbonate: 11 },
    abg: { ph: 7.16, bicarbonate: 10, lactate: 1.6 },
  }));

  assert.equal(biochemical.differentials[0]?.name, "Diabetic ketoacidosis");
  assert.ok(scoreFor(biochemical, "Diabetic ketoacidosis") > scoreFor(baseline, "Diabetic ketoacidosis"));
  assert.ok(modifierFeatures(biochemical, "Diabetic ketoacidosis").includes("metabolic_acidosis"));
  assert.ok(modifierFeatures(biochemical, "Diabetic ketoacidosis").includes("hyperglycaemia_lab"));
  assert.ok(totalLabDelta(biochemical, "Diabetic ketoacidosis") <= 16);
});

test("biochemical regression: raised lactate in sepsis does not promote DKA without diabetic metabolic context", () => {
  const clinical = buildInput({
    presentingComplaint: "Confusion",
    history: "New confusion with fever, rigors and smelly urine. No diabetes, vomiting, abdominal pain, thirst or polyuria.",
    observations: "HR 118, BP 94/60.",
  });
  const biochemical = analyzeCase(withLabs(clinical, {
    fbc: { wcc: 17.5, neutrophils: 14.2 },
    ues: { fastingGlucose: 5.8 },
    abg: { lactate: 5.6 },
  }));

  assert.ok(top3(biochemical).includes("Sepsis"));
  assert.deepEqual(modifierFeatures(biochemical, "Diabetic ketoacidosis"), []);
  assert.notEqual(biochemical.differentials[0]?.name, "Diabetic ketoacidosis");
});

test("biochemical regression: acute cholangitis gains support from cholestasis plus inflammatory bloods", () => {
  const clinical = buildInput({
    presentingComplaint: "Abdominal pain",
    history: "RUQ pain with fever, rigors, jaundice, dark urine and vomiting.",
    observations: "Temperature 38.8, HR 112.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    fbc: { wcc: 18.2, neutrophils: 15.3 },
    lfts: { alp: 510, bilirubin: 96, ggt: 180, alt: 72 },
  }));

  assert.equal(biochemical.differentials[0]?.name, "Acute cholangitis");
  assert.ok(scoreFor(biochemical, "Acute cholangitis") > scoreFor(baseline, "Acute cholangitis"));
  assert.ok(modifierFeatures(biochemical, "Acute cholangitis").includes("cholestatic_pattern"));
  assert.ok(modifierFeatures(biochemical, "Acute cholangitis").includes("inflammatory_blood_results"));
});

test("biochemical regression: simple biliary obstruction is supported without lab-only cholangitis overpromotion", () => {
  const clinical = buildInput({
    presentingComplaint: "Jaundice",
    history: "Painless jaundice with dark urine and pale stools. No fever, no rigors and no systemic upset.",
    observations: "Afebrile, haemodynamically stable.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    fbc: { wcc: 7.4, neutrophils: 4.5 },
    lfts: { alp: 470, bilirubin: 112, ggt: 170, alt: 64 },
  }));

  assert.ok(scoreFor(biochemical, "Choledocholithiasis / obstructive jaundice") > scoreFor(baseline, "Choledocholithiasis / obstructive jaundice"));
  assert.ok(modifierFeatures(biochemical, "Choledocholithiasis / obstructive jaundice").includes("cholestatic_pattern"));
  assert.deepEqual(modifierFeatures(biochemical, "Acute cholangitis"), []);
  assert.notEqual(biochemical.differentials[0]?.name, "Acute cholangitis");
});

test("biochemical regression: hepatocellular injury pattern does not create biliary-obstruction dominance", () => {
  const clinical = buildInput({
    presentingComplaint: "Jaundice",
    history: "Jaundice with malaise, nausea and RUQ discomfort but no fever or rigors.",
  });
  const biochemical = analyzeCase(withLabs(clinical, {
    lfts: { alt: 760, ast: 640, alp: 82, bilirubin: 58, ggt: 46 },
  }));

  assert.ok(labFeatures(biochemical).includes("hepatocellular_pattern"));
  assert.ok(!labFeatures(biochemical).includes("cholestatic_pattern"));
  assert.deepEqual(modifierFeatures(biochemical, "Choledocholithiasis / obstructive jaundice"), []);
  assert.deepEqual(modifierFeatures(biochemical, "Acute cholangitis"), []);
});

test("biochemical regression: COPD exacerbation gains support from type 2 respiratory failure", () => {
  const clinical = buildInput({
    presentingComplaint: "Shortness of breath",
    history: "Known COPD with worsening breathlessness, wheeze and increased sputum.",
    pmh: "COPD.",
    social: "Long smoking history.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    abg: { ph: 7.24, paco2: 8.8, pao2: 7.1, bicarbonate: 28 },
  }));

  assert.equal(biochemical.differentials[0]?.name, "COPD exacerbation");
  assert.ok(scoreFor(biochemical, "COPD exacerbation") > scoreFor(baseline, "COPD exacerbation"));
  assert.deepEqual(
    modifierFeatures(biochemical, "COPD exacerbation").sort(),
    ["hypercapnia", "hypoxaemia", "respiratory_acidosis"].sort(),
  );
  assert.ok(totalLabDelta(biochemical, "COPD exacerbation") <= 13);
});

test("biochemical regression: pneumonia with hypoxaemia remains clinically dominant and does not force COPD", () => {
  const clinical = buildInput({
    presentingComplaint: "Shortness of breath",
    history: "Fever, productive green cough, pleuritic chest pain and focal crackles at the right base. No COPD history.",
    observations: "Sats 88% on air, temperature 38.6.",
  });
  const biochemical = analyzeCase(withLabs(clinical, {
    fbc: { wcc: 16.1, neutrophils: 13.5 },
    abg: { pao2: 7.2, paco2: 4.7, ph: 7.39, lactate: 1.5 },
  }));

  assert.equal(biochemical.differentials[0]?.name, "Pneumonia");
  assert.deepEqual(
    modifierFeatures(biochemical, "Pneumonia").sort(),
    ["hypoxaemia", "leucocytosis", "neutrophilia"].sort(),
  );
  assert.ok(totalLabDelta(biochemical, "Pneumonia") <= 6);
  assert.deepEqual(modifierFeatures(biochemical, "COPD exacerbation"), []);
  assertNoWeakLabOverpromotion(analyzeCase(clinical), biochemical, "Pneumonia", ["Sepsis"]);
});

test("biochemical regression: hypoxaemia without respiratory infection context does not promote pneumonia", () => {
  const clinical = buildInput({
    age: "23",
    presentingComplaint: "Shortness of breath",
    history: "Type 1 diabetes with vomiting, thirst, polyuria and deep fast breathing. No fever, cough or sputum.",
    observations: "Sats 99% on air, RR 32.",
  });
  const biochemical = analyzeCase(withLabs(clinical, {
    ues: { fastingGlucose: 28, bicarbonate: 13 },
    abg: { ph: 7.18, bicarbonate: 12, pao2: 7.4 },
  }));

  assert.equal(biochemical.differentials[0]?.name, "Diabetic ketoacidosis");
  assert.deepEqual(modifierFeatures(biochemical, "Pneumonia"), []);
});

test("biochemical regression: heart failure gains only modest hypoxaemia support in fluid-overload context", () => {
  const clinical = buildInput({
    presentingComplaint: "Shortness of breath",
    history: "Progressive breathlessness with orthopnoea, frothy sputum, raised JVP, bibasal crackles and swollen ankles.",
    observations: "Sats 86% on air.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    abg: { pao2: 7.0, paco2: 5.1, ph: 7.38 },
  }));

  assert.equal(biochemical.differentials[0]?.name, "Heart failure");
  assert.ok(scoreFor(biochemical, "Heart failure") > scoreFor(baseline, "Heart failure"));
  assert.deepEqual(modifierFeatures(biochemical, "Heart failure"), ["hypoxaemia"]);
  assert.equal(totalLabDelta(biochemical, "Heart failure"), 2);
});

test("biochemical regression: hypoxaemia alone does not promote heart failure without fluid-overload context", () => {
  const clinical = buildInput({
    presentingComplaint: "Shortness of breath",
    history: "Sudden pleuritic breathlessness with one-sided reduced air entry and hyperresonance.",
    observations: "Sats 88% on air.",
  });
  const biochemical = analyzeCase(withLabs(clinical, {
    abg: { pao2: 7.2, paco2: 4.5, ph: 7.4 },
  }));

  assert.equal(biochemical.differentials[0]?.name, "Pneumothorax");
  assert.deepEqual(modifierFeatures(biochemical, "Heart failure"), []);
});

test("biochemical regression: lactate gives only modest support in compatible mesenteric ischaemia", () => {
  const clinical = buildInput({
    presentingComplaint: "Abdominal pain",
    history: "Severe abdominal pain out of proportion to a soft abdomen in an older patient with atrial fibrillation.",
    pmh: "Atrial fibrillation and peripheral vascular disease.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    abg: { lactate: 5.8, ph: 7.34 },
  }));

  assert.equal(biochemical.differentials[0]?.name, "Mesenteric ischaemia");
  assert.ok(scoreFor(biochemical, "Mesenteric ischaemia") > scoreFor(baseline, "Mesenteric ischaemia"));
  assert.equal(totalLabDelta(biochemical, "Mesenteric ischaemia"), 2);
});

test("biochemical regression: normal lactate does not penalise mesenteric ischaemia", () => {
  const clinical = buildInput({
    presentingComplaint: "Abdominal pain",
    history: "Severe abdominal pain out of proportion to a soft abdomen in an older patient with atrial fibrillation.",
    pmh: "Atrial fibrillation.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    abg: { lactate: 1.1, ph: 7.39 },
  }));

  assert.equal(scoreFor(biochemical, "Mesenteric ischaemia"), scoreFor(baseline, "Mesenteric ischaemia"));
});

test("biochemical regression: severe hyperkalaemia from renal impairment creates lab safety warning without general red-flag coupling", () => {
  const clinical = buildInput({
    presentingComplaint: "Weakness",
    history: "Several days of poor oral intake and reduced urine output. No chest pain, fever or abdominal pain.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    ues: { potassium: 6.7, creatinine: 286, egfr: 18, urea: 24 },
  }));

  assert.ok(safetyWarningIds(biochemical).includes("severe-hyperkalaemia"));
  assert.ok(labFeatures(biochemical).includes("renal_impairment"));
  assert.deepEqual(biochemical.labDiagnosisModifiers, undefined);
  assertRedFlagsUnchanged(baseline, biochemical);
});

test("biochemical regression: isolated raised creatinine does not diagnose AKI or cause major unrelated ranking shift", () => {
  const clinical = buildInput({
    presentingComplaint: "Headache",
    history: "Gradual bilateral pressure headache after a stressful week with normal neurology and no fever.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    ues: { creatinine: 168, egfr: 42 },
  }));

  assert.deepEqual(names(biochemical).slice(0, 3), names(baseline).slice(0, 3));
  assert.deepEqual(biochemical.labDiagnosisModifiers, undefined);
});

test("biochemical regression: leukopenia supports serious infection in context without false reassurance", () => {
  const clinical = buildInput({
    presentingComplaint: "Confusion",
    history: "New confusion with fever, rigors, urinary incontinence and smelly urine.",
    observations: "Temperature 39.1, HR 124.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    fbc: { wcc: 2.4, neutrophils: 1.9 },
    abg: { lactate: 3.2 },
  }));

  assert.ok(top3(biochemical).includes("Sepsis"));
  assert.ok(scoreFor(biochemical, "Sepsis") > scoreFor(baseline, "Sepsis"));
  assert.ok(modifierFeatures(biochemical, "Sepsis").includes("leucopenia"));
});

test("biochemical regression: incidental mild abnormalities do not overturn strong clinical evidence", () => {
  const cases: Array<{ title: string; labs: LabPanels }> = [
    { title: "mild ALT", labs: { lfts: { alt: 72, ast: 34, alp: 88, bilirubin: 12 } } },
    { title: "mild urea", labs: { ues: { urea: 9.1, creatinine: 88 } } },
    { title: "mild neutrophilia", labs: { fbc: { wcc: 10.8, neutrophils: 8.1 } } },
  ];
  const clinical = buildInput({
    presentingComplaint: "Chest pain",
    history: "Central crushing chest pressure radiating to the jaw and left arm with sweating and nausea.",
    pmh: "Diabetes and hypertension.",
  });
  const baseline = analyzeCase(clinical);

  for (const item of cases) {
    const biochemical = analyzeCase(withLabs(clinical, item.labs));

    assert.equal(biochemical.differentials[0]?.name, "Acute coronary syndrome", item.title);
    assert.deepEqual(names(biochemical).slice(0, 3), names(baseline).slice(0, 3), item.title);
    assert.deepEqual(biochemical.labDiagnosisModifiers, undefined, item.title);
  }
});

test("biochemical regression: ACS remains dominant over nonspecific leukocytosis and mild lactate", () => {
  const clinical = buildInput({
    presentingComplaint: "Chest pain",
    history: "Central crushing chest pressure radiating to the jaw with sweating and nausea. No fever, cough or urinary symptoms.",
    pmh: "Diabetes, hypertension and high cholesterol.",
  });
  const baseline = analyzeCase(clinical);
  const biochemical = analyzeCase(withLabs(clinical, {
    fbc: { wcc: 12.4, neutrophils: 9.2 },
    abg: { lactate: 2.4, ph: 7.39 },
  }));

  assert.equal(biochemical.differentials[0]?.name, "Acute coronary syndrome");
  assertNoWeakLabOverpromotion(baseline, biochemical, "Acute coronary syndrome", ["Sepsis"]);
  assert.deepEqual(modifierFeatures(biochemical, "Sepsis"), []);
});
