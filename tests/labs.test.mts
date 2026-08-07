import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveLabFeatures,
  interpretAbg,
  interpretFbc,
  interpretLfts,
  interpretUes,
  LAB_SAFETY_THRESHOLDS,
} from "../lib/domain/labs/index.js";

function hasAllFeatures(actual: string[], expected: string[]) {
  assert.deepEqual(expected.filter((feature) => !actual.includes(feature)), []);
}

function hasNoFeatures(actual: string[], forbidden: string[]) {
  assert.deepEqual(forbidden.filter((feature) => actual.includes(feature)), []);
}

test("labs: normal panel values produce no abnormalities or derived abnormal features", () => {
  const result = deriveLabFeatures({
    sex: "male",
    fbc: {
      hb: 145,
      wcc: 7,
      platelets: 250,
      mcv: 88,
      mch: 30,
      mchc: 335,
      neutrophils: 4,
      lymphocytes: 2,
      monocytes: 0.5,
      eosinophils: 0.2,
      basophils: 0.05,
      reticulocytes: 60,
      pcv: 0.45,
      esr: 12,
      dDimer: 0.4,
    },
    ues: {
      sodium: 140,
      potassium: 4.4,
      chloride: 100,
      bicarbonate: 25,
      urea: 5,
      creatinine: 85,
      calcium: 2.4,
      magnesium: 0.8,
      phosphate: 1.1,
      egfr: 90,
      fastingGlucose: 5,
    },
    lfts: {
      albumin: 42,
      alt: 30,
      ast: 25,
      alp: 90,
      bilirubin: 12,
      ggt: 25,
    },
    abg: {
      ph: 7.4,
      pao2: 12,
      paco2: 5.2,
      bicarbonate: 24,
      baseExcess: 0,
      lactate: 1.2,
    },
  });

  assert.deepEqual(result.features, []);
  assert.deepEqual(result.abnormalities, []);
  assert.deepEqual(result.safetyWarnings, []);
});

test("labs: FBC detects low, high and composite anaemia patterns", () => {
  const result = interpretFbc({
    hb: 82,
    wcc: 12,
    platelets: 90,
    mcv: 72,
    neutrophils: 8.2,
    lymphocytes: 1.1,
    eosinophils: 0.6,
    esr: 60,
    dDimer: 1.1,
  }, "female");

  hasAllFeatures(result.features, [
    "anaemia",
    "microcytosis",
    "microcytic_anaemia",
    "leucocytosis",
    "thrombocytopenia",
    "neutrophilia",
    "lymphopenia",
    "eosinophilia",
    "raised_esr",
    "raised_d_dimer",
  ]);
  assert.ok(result.abnormalities.some((abnormality) => abnormality.test === "Hb" && abnormality.status === "low"));
});

test("labs: sex-specific Hb and PCV ranges are applied", () => {
  const male = interpretFbc({ hb: 120, pcv: 0.38 }, "male");
  const female = interpretFbc({ hb: 120, pcv: 0.38 }, "female");

  hasAllFeatures(male.features, ["anaemia", "low_pcv"]);
  hasNoFeatures(female.features, ["anaemia", "low_pcv"]);
});

test("labs: boundary values are treated as normal", () => {
  const fbc = interpretFbc({ hb: 130, wcc: 3, platelets: 400, mcv: 96, esr: 20, dDimer: 0.5 }, "male");
  const ues = interpretUes({ sodium: 135, potassium: 5.3, egfr: 60, fastingGlucose: 5.5 });
  const lfts = interpretLfts({ albumin: 35, alt: 50, ast: 40, alp: 115, bilirubin: 17, ggt: 40 });
  const abg = interpretAbg({ ph: 7.35, pao2: 11, paco2: 6.4, bicarbonate: 30, baseExcess: -2, lactate: 2 });

  assert.deepEqual(fbc.abnormalities, []);
  assert.deepEqual(ues.abnormalities, []);
  assert.deepEqual(lfts.abnormalities, []);
  assert.deepEqual(abg.abnormalities, []);
});

test("labs: U&Es detect electrolyte, renal and glucose abnormalities", () => {
  const result = interpretUes({
    sodium: 128,
    potassium: 6.4,
    bicarbonate: 18,
    urea: 12,
    creatinine: 190,
    calcium: 2.8,
    magnesium: 0.5,
    phosphate: 1.8,
    egfr: 42,
    fastingGlucose: 2.9,
  });

  hasAllFeatures(result.features, [
    "hyponatraemia",
    "hyperkalaemia",
    "severe_hyperkalaemia",
    "low_bicarbonate",
    "raised_urea",
    "raised_creatinine",
    "reduced_egfr",
    "renal_impairment",
    "hypercalcaemia",
    "hypomagnesaemia",
    "hyperphosphataemia",
    "hypoglycaemia_lab",
  ]);
});

test("labs: LFTs derive hepatocellular and cholestatic patterns deterministically", () => {
  const hepatocellular = interpretLfts({ alt: 420, ast: 160, alp: 90, bilirubin: 12 });
  const cholestatic = interpretLfts({ alt: 45, alp: 450, bilirubin: 80, ggt: 120 });

  hasAllFeatures(hepatocellular.features, ["raised_alt", "raised_ast", "hepatocellular_pattern"]);
  hasNoFeatures(hepatocellular.features, ["cholestatic_pattern"]);
  hasAllFeatures(cholestatic.features, ["raised_alp", "raised_bilirubin", "raised_ggt", "cholestatic_pattern"]);
});

test("labs: ABG detects acid-base, oxygenation and lactate abnormalities", () => {
  const metabolicAcidosis = interpretAbg({
    ph: 7.21,
    pao2: 8,
    paco2: 4,
    bicarbonate: 12,
    baseExcess: -8,
    lactate: 4.5,
  });
  const respiratoryAcidosis = interpretAbg({ ph: 7.25, paco2: 8, bicarbonate: 25 });
  const respiratoryAlkalosis = interpretAbg({ ph: 7.52, paco2: 3.1, bicarbonate: 24 });
  const metabolicAlkalosis = interpretAbg({ ph: 7.5, paco2: 5, bicarbonate: 35 });

  hasAllFeatures(metabolicAcidosis.features, [
    "acidaemia",
    "hypoxaemia",
    "hypocapnia",
    "low_bicarbonate_abg",
    "base_deficit",
    "raised_lactate",
    "metabolic_acidosis",
  ]);
  hasAllFeatures(respiratoryAcidosis.features, ["acidaemia", "hypercapnia", "respiratory_acidosis"]);
  hasAllFeatures(respiratoryAlkalosis.features, ["alkalaemia", "hypocapnia", "respiratory_alkalosis"]);
  hasAllFeatures(metabolicAlkalosis.features, ["alkalaemia", "raised_bicarbonate_abg", "metabolic_alkalosis"]);
});

test("labs: missing values create warnings without abnormalities", () => {
  const result = interpretFbc({}, "unknown");

  assert.equal(result.abnormalities.length, 0);
  assert.ok(result.warnings.includes("Hb not provided."));
  assert.ok(result.warnings.includes("WCC not provided."));
});

test("labs: invalid values are reported without throwing", () => {
  const result = deriveLabFeatures({
    fbc: { hb: -1 },
    ues: { potassium: Number.NaN },
    lfts: { alt: Number.POSITIVE_INFINITY },
    abg: { lactate: -0.1 },
  });

  assert.equal(result.abnormalities.filter((abnormality) => abnormality.status === "invalid").length, 4);
  assert.ok(result.warnings.length > 0);
  assert.deepEqual(result.safetyWarnings, []);
});

test("labs safety: minor abnormalities do not automatically become safety warnings", () => {
  const result = deriveLabFeatures({
    fbc: {
      hb: LAB_SAFETY_THRESHOLDS.haematology.severeAnaemiaHb + 1,
      platelets: LAB_SAFETY_THRESHOLDS.haematology.severeThrombocytopeniaPlatelets + 1,
    },
    ues: {
      potassium: LAB_SAFETY_THRESHOLDS.potassium.significantHyperkalaemia - 0.1,
      sodium: LAB_SAFETY_THRESHOLDS.sodium.severeHyponatraemia + 1,
      fastingGlucose: LAB_SAFETY_THRESHOLDS.glucose.severeHypoglycaemia + 0.1,
    },
    abg: {
      ph: LAB_SAFETY_THRESHOLDS.abg.severeAcidaemiaPh + 0.01,
      pao2: LAB_SAFETY_THRESHOLDS.abg.significantHypoxaemiaPao2,
      lactate: LAB_SAFETY_THRESHOLDS.abg.raisedLactate - 0.1,
    },
  });

  assert.deepEqual(result.safetyWarnings, []);
});

test("labs safety: exact threshold values generate expected warnings", () => {
  const result = deriveLabFeatures({
    fbc: {
      hb: LAB_SAFETY_THRESHOLDS.haematology.severeAnaemiaHb,
      platelets: LAB_SAFETY_THRESHOLDS.haematology.severeThrombocytopeniaPlatelets,
    },
    ues: {
      potassium: LAB_SAFETY_THRESHOLDS.potassium.severeHyperkalaemia,
      sodium: LAB_SAFETY_THRESHOLDS.sodium.severeHyponatraemia,
      fastingGlucose: LAB_SAFETY_THRESHOLDS.glucose.severeHypoglycaemia,
    },
    abg: {
      ph: LAB_SAFETY_THRESHOLDS.abg.severeAcidaemiaPh,
      lactate: LAB_SAFETY_THRESHOLDS.abg.markedlyRaisedLactate,
    },
  });

  assert.deepEqual(
    result.safetyWarnings.map((warning) => warning.id).sort(),
    [
      "markedly-raised-lactate",
      "severe-acidaemia",
      "severe-anaemia",
      "severe-hyperkalaemia",
      "severe-hyponatraemia",
      "severe-hypoglycaemia-lab",
      "severe-thrombocytopenia",
    ].sort(),
  );
  assert.ok(result.safetyWarnings.every((warning) => warning.triggerValues.length > 0));
});

test("labs safety: just above and below directional thresholds are detected", () => {
  const result = deriveLabFeatures({
    ues: {
      potassium: LAB_SAFETY_THRESHOLDS.potassium.significantHypokalaemia - 0.1,
      sodium: LAB_SAFETY_THRESHOLDS.sodium.severeHypernatraemia + 1,
      creatinine: LAB_SAFETY_THRESHOLDS.renal.markedCreatinineRise + 1,
      egfr: LAB_SAFETY_THRESHOLDS.renal.markedEgfrReduction - 1,
      fastingGlucose: LAB_SAFETY_THRESHOLDS.glucose.markedHyperglycaemia + 1,
    },
    abg: {
      ph: LAB_SAFETY_THRESHOLDS.abg.severeAlkalaemiaPh + 0.01,
      pao2: LAB_SAFETY_THRESHOLDS.abg.significantHypoxaemiaPao2 - 0.1,
      paco2: LAB_SAFETY_THRESHOLDS.abg.significantHypercapniaPaco2,
      lactate: LAB_SAFETY_THRESHOLDS.abg.raisedLactate,
    },
  });

  assert.deepEqual(
    result.safetyWarnings.map((warning) => warning.id).sort(),
    [
      "marked-hyperglycaemia-lab",
      "marked-renal-impairment-creatinine",
      "marked-renal-impairment-egfr",
      "raised-lactate",
      "severe-alkalaemia",
      "severe-hypernatraemia",
      "significant-hypercapnia",
      "significant-hypokalaemia",
      "significant-hypoxaemia",
    ].sort(),
  );
});

test("labs safety: regression values produce high-value warnings only", () => {
  const result = deriveLabFeatures({
    sex: "female",
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
      lactate: 6.0,
    },
  });

  assert.deepEqual(
    result.safetyWarnings.map((warning) => warning.id).sort(),
    [
      "markedly-raised-lactate",
      "severe-acidaemia",
      "severe-anaemia",
      "severe-hyperkalaemia",
      "severe-hyponatraemia",
      "severe-hypoglycaemia-lab",
      "severe-thrombocytopenia",
      "significant-hypoxaemia",
    ].sort(),
  );
  assert.ok(result.safetyWarnings.some((warning) => warning.severity === "urgent"));
});

test("labs safety: missing and partial panels do not create safety warnings", () => {
  assert.deepEqual(deriveLabFeatures({}).safetyWarnings, []);
  assert.deepEqual(deriveLabFeatures({ fbc: { hb: 90 } }).safetyWarnings, []);
});
