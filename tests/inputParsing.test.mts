import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/application/analyzeCase.js";
import { formatLabEvidenceForUser, parseLabEvidenceReason } from "../lib/domain/labs/labEvidenceDisplay.js";
import { parseLabText } from "../lib/input/labTextParser.js";
import { parseSmartCaseInput } from "../lib/input/smartCaseInput.js";

test("lab paste parser handles simple line-by-line values", () => {
  const result = parseLabText(`
Hb 82
WCC 14.2
Platelets 320
MCV 71
Na 138
K 4.6
Urea 14
Creatinine 110
`);

  assert.equal(result.parsedValues.length, 8);
  assert.equal(result.labs.fbc?.hb, 82);
  assert.equal(result.labs.fbc?.wcc, 14.2);
  assert.equal(result.labs.fbc?.platelets, 320);
  assert.equal(result.labs.fbc?.mcv, 71);
  assert.equal(result.labs.ues?.sodium, 138);
  assert.equal(result.labs.ues?.potassium, 4.6);
  assert.equal(result.labs.ues?.urea, 14);
  assert.equal(result.labs.ues?.creatinine, 110);
});

test("lab paste parser handles copied names, units, abbreviations and ABG labels", () => {
  const result = parseLabText(`
Haemoglobin 68 g/L
White cell count 18 x10^9/L
Cr 260 umol/L
eGFR 22 mL/min
ALT 820 U/L
Bilirubin 54 umol/L
pH 7.12
PaO2 8.1 kPa
PaCO2 3.2 kPa
HCO3 10 mmol/L
BE -12
Lactate 6.0 mmol/L
Glucose 27 mmol/L
`);

  assert.equal(result.labs.fbc?.hb, 68);
  assert.equal(result.labs.fbc?.wcc, 18);
  assert.equal(result.labs.ues?.creatinine, 260);
  assert.equal(result.labs.ues?.egfr, 22);
  assert.equal(result.labs.lfts?.alt, 820);
  assert.equal(result.labs.lfts?.bilirubin, 54);
  assert.equal(result.labs.abg?.ph, 7.12);
  assert.equal(result.labs.abg?.pao2, 8.1);
  assert.equal(result.labs.abg?.paco2, 3.2);
  assert.equal(result.labs.abg?.bicarbonate, 10);
  assert.equal(result.labs.abg?.baseExcess, -12);
  assert.equal(result.labs.abg?.lactate, 6);
  assert.equal(result.labs.ues?.fastingGlucose, 27);
});

test("lab paste parser leaves unknown, malformed, and conflicting values safe", () => {
  const result = parseLabText(`
Troponin 56
Hb
K 4.6
K 6.7
`);

  assert.equal(result.labs.ues?.potassium, undefined);
  assert.equal(result.parsedValues.length, 0);
  assert.ok(result.unparsedLines.includes("Troponin 56"));
  assert.ok(result.unparsedLines.includes("Hb"));
  assert.ok(result.warnings.some((warning) => warning.includes("Conflicting K values detected")));
});

test("lab paste parser accepts identical duplicate values once", () => {
  const result = parseLabText(`
Hb 82
Hb 82
WCC 15
`);

  assert.equal(result.labs.fbc?.hb, 82);
  assert.equal(result.labs.fbc?.wcc, 15);
  assert.equal(result.parsedValues.filter((value) => value.field === "hb").length, 1);
  assert.deepEqual(result.warnings, []);
});

test("lab paste parser accepts identical aliases once", () => {
  const result = parseLabText(`
Hb 82
Haemoglobin 82 g/L
`);

  assert.equal(result.labs.fbc?.hb, 82);
  assert.equal(result.parsedValues.length, 1);
  assert.deepEqual(result.warnings, []);
});

test("lab paste parser rejects conflicting aliases without populating the field", () => {
  const result = parseLabText(`
Hb 82
Haemoglobin 110 g/L
`);

  assert.equal(result.labs.fbc?.hb, undefined);
  assert.equal(result.parsedValues.length, 0);
  assert.ok(result.warnings.some((warning) => warning.includes("Conflicting Hb values detected: 82 and 110")));
});

test("lab paste parser preserves matching existing manual values", () => {
  const result = parseLabText("Hb 82\nWCC 15", { fbc: { hb: 82 } });

  assert.equal(result.labs.fbc?.hb, 82);
  assert.equal(result.labs.fbc?.wcc, 15);
  assert.deepEqual(result.warnings, []);
});

test("lab paste parser rejects pasted values that conflict with existing manual values", () => {
  const result = parseLabText("Hb 110\nWCC 15", { fbc: { hb: 82 } });

  assert.equal(result.labs.fbc?.hb, undefined);
  assert.equal(result.labs.fbc?.wcc, 15);
  assert.ok(result.warnings.some((warning) => warning.includes("pasted 110 differs from existing 82")));
});

test("lab paste parser handles full ABG block with numeric values", () => {
  const result = parseLabText(`
ABG (Room Air)

pH 7.18
PaCO2 3.1 kPa
PaO2 11.8 kPa
HCO3 10 mmol/L
BE -14
Lactate 4.8 mmol/L
`);

  assert.equal(result.labs.abg?.ph, 7.18);
  assert.equal(result.labs.abg?.paco2, 3.1);
  assert.equal(result.labs.abg?.pao2, 11.8);
  assert.equal(result.labs.abg?.bicarbonate, 10);
  assert.equal(result.labs.abg?.baseExcess, -14);
  assert.equal(result.labs.abg?.lactate, 4.8);
  assert.equal(result.labs.abg?.oxygenContext, "room_air");
});

test("lab paste parser handles unicode, units and colon-separated ABG labels", () => {
  const result = parseLabText(`
pH: 7.28
FiO₂: 28%
PaCO₂: 8.8 kPa
PaO₂: 7.4 kPa
HCO₃⁻: 34 mmol/L
Base excess: +5 mmol/L
Lactate: 2.1 mmol/L
`);

  assert.equal(result.labs.abg?.ph, 7.28);
  assert.equal(result.labs.abg?.paco2, 8.8);
  assert.equal(result.labs.abg?.pao2, 7.4);
  assert.equal(result.labs.abg?.bicarbonate, 34);
  assert.equal(result.labs.abg?.baseExcess, 5);
  assert.equal(result.labs.abg?.lactate, 2.1);
  assert.equal(result.labs.abg?.oxygenContext, "supplemental_oxygen");
  assert.equal(result.labs.abg?.fio2, 0.28);
});

test("lab paste parser handles compact tabular ABG labels", () => {
  const result = parseLabText([
    "pH\t7.28",
    "pCO2\t8.8\tkPa",
    "pO2\t7.4\tkPa",
    "HCO3\t34\tmmol/L",
    "BE\t+5\tmmol/L",
    "Lac\t2.1\tmmol/L",
  ].join("\n"));

  assert.equal(result.labs.abg?.ph, 7.28);
  assert.equal(result.labs.abg?.paco2, 8.8);
  assert.equal(result.labs.abg?.pao2, 7.4);
  assert.equal(result.labs.abg?.bicarbonate, 34);
  assert.equal(result.labs.abg?.baseExcess, 5);
  assert.equal(result.labs.abg?.lactate, 2.1);
});

test("lab paste parser handles partial ABG and preserves negative base excess", () => {
  const result = parseLabText(`
pH 7.31
BE -14
`);

  assert.equal(result.labs.abg?.ph, 7.31);
  assert.equal(result.labs.abg?.baseExcess, -14);
  assert.equal(result.labs.abg?.paco2, undefined);
});

test("lab paste parser accepts identical ABG duplicate aliases once", () => {
  const result = parseLabText(`
PaCO2 8.8
PaCO₂ 8.8
`);

  assert.equal(result.labs.abg?.paco2, 8.8);
  assert.equal(result.parsedValues.filter((value) => value.field === "paco2").length, 1);
  assert.deepEqual(result.warnings, []);
});

test("lab paste parser rejects conflicting duplicate ABG aliases", () => {
  const result = parseLabText(`
PaCO2 8.8
PaCO₂ 6.2
`);

  assert.equal(result.labs.abg?.paco2, undefined);
  assert.equal(result.parsedValues.filter((value) => value.field === "paco2").length, 0);
  assert.ok(result.warnings.some((warning) => warning.includes("Conflicting PaCO2 values detected: 8.8 and 6.2")));
});

test("lab paste parser preserves manual ABG value on conflict", () => {
  const result = parseLabText("PaCO2 8.8\npH 7.28", { abg: { paco2: 6 } });

  assert.equal(result.labs.abg?.paco2, undefined);
  assert.equal(result.labs.abg?.ph, 7.28);
  assert.ok(result.warnings.some((warning) => warning.includes("pasted 8.8 differs from existing 6")));
});

test("lab paste parser preserves manual ABG FiO2 value on conflict", () => {
  const result = parseLabText("FiO2 0.28\nPaO2 8.8", { abg: { fio2: 0.4 } });

  assert.equal(result.labs.abg?.fio2, undefined);
  assert.equal(result.labs.abg?.pao2, 8.8);
  assert.ok(result.warnings.some((warning) => warning.includes("pasted 0.28 differs from existing 0.4")));
});

test("pasted ABG values feed existing deterministic ABG interpretation", () => {
  const parsed = parseLabText(`
pH 7.18
PaCO2 3.1 kPa
PaO2 11.8 kPa
HCO3 10 mmol/L
BE -14
Lactate 4.8 mmol/L
`);
  const result = analyzeCase({
    age: "21",
    sex: "female",
    presentingComplaint: "Vomiting",
    history: "Type 1 diabetes with vomiting, abdominal pain, polyuria, polydipsia and Kussmaul breathing.",
    pmh: "Type 1 diabetes",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
    labs: parsed.labs,
  });

  assert.ok(result.labs?.features.includes("metabolic_acidosis"));
  assert.ok(result.labs?.features.includes("raised_lactate"));
  assert.ok(result.labs?.safetyWarnings.some((warning) => warning.id === "severe-acidaemia"));
  assert.ok(result.labDiagnosisModifiers?.some((modifier) => modifier.diagnosis === "Diabetic ketoacidosis"));
});

test("smart input parser populates structured case fields without bypassing the schema", () => {
  const result = parseSmartCaseInput(
    "72M with 2 hours central crushing chest pain radiating to jaw, sweaty and nauseated. PMH HTN and T2DM. HR 105, BP 145/85, chest clear. Hb 140, WCC 11.2, Na 138, K 4.4.",
  );

  assert.equal(result.patch.age, "72");
  assert.equal(result.patch.sex, "male");
  assert.equal(result.patch.presentingComplaint, "Chest pain");
  assert.match(result.patch.history ?? "", /central crushing chest pain/);
  assert.match(result.patch.observations ?? "", /HR 105/);
  assert.match(result.patch.pmh ?? "", /HTN/);
  assert.equal(result.patch.labs?.fbc?.hb, 140);
  assert.equal(result.patch.labs?.fbc?.wcc, 11.2);
  assert.equal(result.patch.labs?.ues?.sodium, 138);
  assert.equal(result.patch.labs?.ues?.potassium, 4.4);
});

test("smart input parser extracts presenting complaint from explicit presentation phrases", () => {
  assert.equal(
    parseSmartCaseInput("63M presents with melaena and dizziness").patch.presentingComplaint,
    "Melaena and dizziness",
  );
  assert.equal(
    parseSmartCaseInput("45F presenting with shortness of breath").patch.presentingComplaint,
    "Shortness of breath",
  );
  assert.equal(
    parseSmartCaseInput("72-year-old man complains of central chest pain").patch.presentingComplaint,
    "Central chest pain",
  );
});

test("smart input parser does not swallow multiline labs into presenting complaint", () => {
  const result = parseSmartCaseInput(`63M presents with melaena and dizziness.

Hb 72, MCV 71, WCC 8.4, Platelets 280.

Urea 15.8, Creatinine 98.

Pulse 118.`);

  assert.equal(result.patch.presentingComplaint, "Melaena and dizziness");
  assert.equal(result.patch.labs?.fbc?.hb, 72);
  assert.equal(result.patch.labs?.fbc?.mcv, 71);
  assert.equal(result.patch.labs?.fbc?.wcc, 8.4);
  assert.equal(result.patch.labs?.fbc?.platelets, 280);
  assert.equal(result.patch.labs?.ues?.urea, 15.8);
  assert.equal(result.patch.labs?.ues?.creatinine, 98);
});

test("lab evidence display hides internal score values in user wording", () => {
  const parsed = parseLabEvidenceReason("Lab: +7 hepatocellular_pattern - Hepatocellular pattern strongly supports acute hepatitis.");
  const userText = formatLabEvidenceForUser(parsed);

  assert.equal(parsed.delta, 7);
  assert.equal(userText, "hepatocellular pattern: Hepatocellular pattern strongly supports acute hepatitis.");
  assert.ok(!userText.includes("+7"));
});
