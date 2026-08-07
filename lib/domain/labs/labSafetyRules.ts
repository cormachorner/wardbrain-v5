import type { LabInterpretationResult, LabSafetyWarning, LabValueAssessment } from "./labTypes";

export const LAB_SAFETY_THRESHOLDS = {
  potassium: {
    significantHyperkalaemia: 6.0,
    severeHyperkalaemia: 6.5,
    significantHypokalaemia: 2.8,
  },
  sodium: {
    severeHyponatraemia: 120,
    severeHypernatraemia: 155,
  },
  haematology: {
    severeAnaemiaHb: 70,
    severeThrombocytopeniaPlatelets: 20,
  },
  abg: {
    severeAcidaemiaPh: 7.2,
    severeAlkalaemiaPh: 7.6,
    significantHypoxaemiaPao2: 8.0,
    significantHypercapniaPaco2: 8.0,
    raisedLactate: 4.0,
    markedlyRaisedLactate: 6.0,
  },
  glucose: {
    severeHypoglycaemia: 3.0,
    markedHyperglycaemia: 25.0,
  },
  renal: {
    markedCreatinineRise: 300,
    markedEgfrReduction: 30,
  },
} as const;

function findValue(interpretation: LabInterpretationResult, test: string): LabValueAssessment | undefined {
  return interpretation.abnormalities.find(
    (abnormality) =>
      abnormality.test === test &&
      abnormality.value !== undefined &&
      abnormality.status !== "invalid",
  );
}

function trigger(assessment: LabValueAssessment, threshold: string): LabSafetyWarning["triggerValues"][number] {
  return {
    test: assessment.test,
    value: assessment.value ?? 0,
    unit: assessment.unit,
    threshold,
  };
}

function warning(
  id: string,
  severity: LabSafetyWarning["severity"],
  title: string,
  explanation: string,
  triggerValues: LabSafetyWarning["triggerValues"],
  recommendedNextStep?: string,
): LabSafetyWarning {
  return {
    id,
    severity,
    title,
    explanation,
    triggerValues,
    recommendedNextStep,
  };
}

// These are display-only educational safety warnings. They do not feed diagnosis scoring.
export function detectLabSafetyWarnings(
  interpretation: LabInterpretationResult,
): LabSafetyWarning[] {
  const warnings: LabSafetyWarning[] = [];
  const potassium = findValue(interpretation, "K");
  const sodium = findValue(interpretation, "Na");
  const hb = findValue(interpretation, "Hb");
  const platelets = findValue(interpretation, "Platelets");
  const ph = findValue(interpretation, "pH");
  const pao2 = findValue(interpretation, "PaO2");
  const paco2 = findValue(interpretation, "PaCO2");
  const lactate = findValue(interpretation, "Lactate");
  const glucose = findValue(interpretation, "Fasting glucose");
  const creatinine = findValue(interpretation, "Creatinine");
  const egfr = findValue(interpretation, "eGFR");

  if (potassium?.value !== undefined && potassium.value >= LAB_SAFETY_THRESHOLDS.potassium.severeHyperkalaemia) {
    warnings.push(warning(
      "severe-hyperkalaemia",
      "urgent",
      "Severe hyperkalaemia",
      "Potassium is at or above the conservative severe hyperkalaemia threshold.",
      [trigger(potassium, `K >= ${LAB_SAFETY_THRESHOLDS.potassium.severeHyperkalaemia} mmol/L`)],
      "Urgent clinical assessment and ECG should be considered.",
    ));
  } else if (potassium?.value !== undefined && potassium.value >= LAB_SAFETY_THRESHOLDS.potassium.significantHyperkalaemia) {
    warnings.push(warning(
      "significant-hyperkalaemia",
      "warning",
      "Significant hyperkalaemia",
      "Potassium is raised enough to need prompt clinical review.",
      [trigger(potassium, `K >= ${LAB_SAFETY_THRESHOLDS.potassium.significantHyperkalaemia} mmol/L`)],
      "Review urgently in clinical context and consider ECG.",
    ));
  }

  if (potassium?.value !== undefined && potassium.value <= LAB_SAFETY_THRESHOLDS.potassium.significantHypokalaemia) {
    warnings.push(warning(
      "significant-hypokalaemia",
      "urgent",
      "Significant hypokalaemia",
      "Potassium is below the conservative significant hypokalaemia threshold.",
      [trigger(potassium, `K <= ${LAB_SAFETY_THRESHOLDS.potassium.significantHypokalaemia} mmol/L`)],
      "Prompt clinical assessment and ECG should be considered.",
    ));
  }

  if (sodium?.value !== undefined && sodium.value <= LAB_SAFETY_THRESHOLDS.sodium.severeHyponatraemia) {
    warnings.push(warning(
      "severe-hyponatraemia",
      "urgent",
      "Severe hyponatraemia",
      "Sodium is at or below the conservative severe hyponatraemia threshold.",
      [trigger(sodium, `Na <= ${LAB_SAFETY_THRESHOLDS.sodium.severeHyponatraemia} mmol/L`)],
      "Urgent clinical assessment is needed; interpret alongside symptoms and fluid status.",
    ));
  }

  if (sodium?.value !== undefined && sodium.value >= LAB_SAFETY_THRESHOLDS.sodium.severeHypernatraemia) {
    warnings.push(warning(
      "severe-hypernatraemia",
      "urgent",
      "Severe hypernatraemia",
      "Sodium is at or above the conservative severe hypernatraemia threshold.",
      [trigger(sodium, `Na >= ${LAB_SAFETY_THRESHOLDS.sodium.severeHypernatraemia} mmol/L`)],
      "Urgent clinical assessment is needed; interpret alongside volume status.",
    ));
  }

  if (hb?.value !== undefined && hb.value <= LAB_SAFETY_THRESHOLDS.haematology.severeAnaemiaHb) {
    warnings.push(warning(
      "severe-anaemia",
      "urgent",
      "Severe anaemia",
      "Haemoglobin is at or below the conservative severe anaemia threshold.",
      [trigger(hb, `Hb <= ${LAB_SAFETY_THRESHOLDS.haematology.severeAnaemiaHb} g/L`)],
      "Prompt senior clinical review is appropriate, especially if symptomatic or bleeding.",
    ));
  }

  if (platelets?.value !== undefined && platelets.value <= LAB_SAFETY_THRESHOLDS.haematology.severeThrombocytopeniaPlatelets) {
    warnings.push(warning(
      "severe-thrombocytopenia",
      "urgent",
      "Severe thrombocytopenia",
      "Platelets are at or below the conservative severe thrombocytopenia threshold.",
      [trigger(platelets, `Platelets <= ${LAB_SAFETY_THRESHOLDS.haematology.severeThrombocytopeniaPlatelets} x10^9/L`)],
      "Prompt senior clinical review is appropriate, especially if bleeding, febrile, or anticoagulated.",
    ));
  }

  if (ph?.value !== undefined && ph.value <= LAB_SAFETY_THRESHOLDS.abg.severeAcidaemiaPh) {
    warnings.push(warning(
      "severe-acidaemia",
      "urgent",
      "Severe acidaemia",
      "pH is at or below the conservative severe acidaemia threshold.",
      [trigger(ph, `pH <= ${LAB_SAFETY_THRESHOLDS.abg.severeAcidaemiaPh}`)],
      "Urgent clinical assessment is needed; interpret with respiratory status, lactate, glucose, and bicarbonate.",
    ));
  }

  if (ph?.value !== undefined && ph.value >= LAB_SAFETY_THRESHOLDS.abg.severeAlkalaemiaPh) {
    warnings.push(warning(
      "severe-alkalaemia",
      "urgent",
      "Severe alkalaemia",
      "pH is at or above the conservative severe alkalaemia threshold.",
      [trigger(ph, `pH >= ${LAB_SAFETY_THRESHOLDS.abg.severeAlkalaemiaPh}`)],
      "Prompt clinical assessment is appropriate; interpret with potassium and respiratory status.",
    ));
  }

  if (pao2?.value !== undefined && pao2.value < LAB_SAFETY_THRESHOLDS.abg.significantHypoxaemiaPao2) {
    warnings.push(warning(
      "significant-hypoxaemia",
      "urgent",
      "Significant hypoxaemia",
      "PaO2 is below the conservative significant hypoxaemia threshold.",
      [trigger(pao2, `PaO2 < ${LAB_SAFETY_THRESHOLDS.abg.significantHypoxaemiaPao2} kPa`)],
      "Urgent clinical assessment of oxygenation and respiratory status is appropriate.",
    ));
  }

  if (paco2?.value !== undefined && paco2.value >= LAB_SAFETY_THRESHOLDS.abg.significantHypercapniaPaco2) {
    warnings.push(warning(
      "significant-hypercapnia",
      "urgent",
      "Significant hypercapnia",
      "PaCO2 is at or above the conservative significant hypercapnia threshold.",
      [trigger(paco2, `PaCO2 >= ${LAB_SAFETY_THRESHOLDS.abg.significantHypercapniaPaco2} kPa`)],
      "Urgent clinical assessment of ventilation is appropriate.",
    ));
  }

  if (lactate?.value !== undefined && lactate.value >= LAB_SAFETY_THRESHOLDS.abg.markedlyRaisedLactate) {
    warnings.push(warning(
      "markedly-raised-lactate",
      "urgent",
      "Markedly raised lactate",
      "Lactate is at or above the conservative markedly raised lactate threshold.",
      [trigger(lactate, `Lactate >= ${LAB_SAFETY_THRESHOLDS.abg.markedlyRaisedLactate} mmol/L`)],
      "Urgent clinical assessment is appropriate; interpret with perfusion, sepsis, and metabolic context.",
    ));
  } else if (lactate?.value !== undefined && lactate.value >= LAB_SAFETY_THRESHOLDS.abg.raisedLactate) {
    warnings.push(warning(
      "raised-lactate",
      "warning",
      "Raised lactate",
      "Lactate is above the conservative safety-warning threshold.",
      [trigger(lactate, `Lactate >= ${LAB_SAFETY_THRESHOLDS.abg.raisedLactate} mmol/L`)],
      "Review promptly in clinical context.",
    ));
  }

  if (glucose?.value !== undefined && glucose.value <= LAB_SAFETY_THRESHOLDS.glucose.severeHypoglycaemia) {
    warnings.push(warning(
      "severe-hypoglycaemia-lab",
      "urgent",
      "Severe hypoglycaemia",
      "Glucose is at or below the conservative severe hypoglycaemia threshold.",
      [trigger(glucose, `Glucose <= ${LAB_SAFETY_THRESHOLDS.glucose.severeHypoglycaemia} mmol/L`)],
      "Urgent clinical assessment is appropriate.",
    ));
  }

  if (glucose?.value !== undefined && glucose.value >= LAB_SAFETY_THRESHOLDS.glucose.markedHyperglycaemia) {
    warnings.push(warning(
      "marked-hyperglycaemia-lab",
      "warning",
      "Marked hyperglycaemia",
      "Glucose is at or above the conservative marked hyperglycaemia threshold.",
      [trigger(glucose, `Glucose >= ${LAB_SAFETY_THRESHOLDS.glucose.markedHyperglycaemia} mmol/L`)],
      "Review promptly in clinical context, especially if unwell or acidotic.",
    ));
  }

  if (creatinine?.value !== undefined && creatinine.value >= LAB_SAFETY_THRESHOLDS.renal.markedCreatinineRise) {
    warnings.push(warning(
      "marked-renal-impairment-creatinine",
      "warning",
      "Marked renal impairment signal",
      "Creatinine is markedly raised. This is not labelled as AKI without baseline renal function.",
      [trigger(creatinine, `Creatinine >= ${LAB_SAFETY_THRESHOLDS.renal.markedCreatinineRise} umol/L`)],
      "Review renal function trend, urine output, medicines, and hydration status.",
    ));
  }

  if (egfr?.value !== undefined && egfr.value < LAB_SAFETY_THRESHOLDS.renal.markedEgfrReduction) {
    warnings.push(warning(
      "marked-renal-impairment-egfr",
      "warning",
      "Marked renal impairment signal",
      "eGFR is below the conservative marked renal impairment threshold.",
      [trigger(egfr, `eGFR < ${LAB_SAFETY_THRESHOLDS.renal.markedEgfrReduction} mL/min/1.73m2`)],
      "Review renal function trend, urine output, medicines, and hydration status.",
    ));
  }

  return warnings;
}
