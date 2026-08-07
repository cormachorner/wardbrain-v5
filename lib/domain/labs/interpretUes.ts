import { uesReferenceRanges } from "./referenceRanges";
import {
  addAbnormality,
  addFeature,
  addMissingWarnings,
  assessValue,
  emptyLabInterpretation,
  type LabInterpretationResult,
  type UesPanel,
} from "./labTypes";

export function interpretUes(panel: UesPanel = {}): LabInterpretationResult {
  const result = emptyLabInterpretation();
  const assessments = {
    sodium: assessValue("Na", panel.sodium, uesReferenceRanges.sodium),
    potassium: assessValue("K", panel.potassium, uesReferenceRanges.potassium),
    chloride: assessValue("Cl", panel.chloride, uesReferenceRanges.chloride),
    bicarbonate: assessValue("HCO3", panel.bicarbonate, uesReferenceRanges.bicarbonate),
    urea: assessValue("Urea", panel.urea, uesReferenceRanges.urea),
    creatinine: assessValue("Creatinine", panel.creatinine, uesReferenceRanges.creatinine),
    calcium: assessValue("Calcium", panel.calcium, uesReferenceRanges.calcium),
    magnesium: assessValue("Magnesium", panel.magnesium, uesReferenceRanges.magnesium),
    phosphate: assessValue("Phosphate", panel.phosphate, uesReferenceRanges.phosphate),
    egfr: assessValue("eGFR", panel.egfr, uesReferenceRanges.egfr),
    fastingGlucose: assessValue("Fasting glucose", panel.fastingGlucose, uesReferenceRanges.fastingGlucose),
  };

  for (const assessment of Object.values(assessments)) {
    addAbnormality(result, assessment);
  }

  if (assessments.sodium.status === "low") addFeature(result.features, "hyponatraemia");
  if (assessments.sodium.status === "high") addFeature(result.features, "hypernatraemia");
  if (assessments.potassium.status === "low") addFeature(result.features, "hypokalaemia");
  if (assessments.potassium.status === "high") addFeature(result.features, "hyperkalaemia");
  if (panel.potassium !== undefined && panel.potassium >= 6.0) {
    addFeature(result.features, "severe_hyperkalaemia");
    result.explanations.push("Potassium is at or above 6.0 mmol/L, producing a severe hyperkalaemia feature.");
  }
  if (assessments.bicarbonate.status === "low") addFeature(result.features, "low_bicarbonate");
  if (assessments.bicarbonate.status === "high") addFeature(result.features, "raised_bicarbonate");
  if (assessments.urea.status === "high") addFeature(result.features, "raised_urea");
  if (assessments.creatinine.status === "high") addFeature(result.features, "raised_creatinine");
  if (assessments.egfr.status === "low") addFeature(result.features, "reduced_egfr");
  if (assessments.creatinine.status === "high" || assessments.egfr.status === "low") {
    addFeature(result.features, "renal_impairment");
  }
  if (assessments.calcium.status === "low") addFeature(result.features, "hypocalcaemia");
  if (assessments.calcium.status === "high") addFeature(result.features, "hypercalcaemia");
  if (assessments.magnesium.status === "low") addFeature(result.features, "hypomagnesaemia");
  if (assessments.magnesium.status === "high") addFeature(result.features, "hypermagnesaemia");
  if (assessments.phosphate.status === "low") addFeature(result.features, "hypophosphataemia");
  if (assessments.phosphate.status === "high") addFeature(result.features, "hyperphosphataemia");
  if (assessments.fastingGlucose.status === "low") addFeature(result.features, "hypoglycaemia_lab");
  if (assessments.fastingGlucose.status === "high") addFeature(result.features, "hyperglycaemia_lab");

  addMissingWarnings(result, Object.values(assessments));

  return result;
}

