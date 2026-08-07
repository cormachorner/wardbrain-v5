import { abgReferenceRanges } from "./referenceRanges";
import {
  addAbnormality,
  addFeature,
  addMissingWarnings,
  assessValue,
  emptyLabInterpretation,
  type AbgPanel,
  type LabInterpretationResult,
} from "./labTypes";

export function interpretAbg(panel: AbgPanel = {}): LabInterpretationResult {
  const result = emptyLabInterpretation();
  const assessments = {
    ph: assessValue("pH", panel.ph, abgReferenceRanges.ph),
    pao2: assessValue("PaO2", panel.pao2, abgReferenceRanges.pao2),
    paco2: assessValue("PaCO2", panel.paco2, abgReferenceRanges.paco2),
    bicarbonate: assessValue("Bicarbonate", panel.bicarbonate, abgReferenceRanges.bicarbonate),
    baseExcess: assessValue("Base excess", panel.baseExcess, abgReferenceRanges.baseExcess),
    lactate: assessValue("Lactate", panel.lactate, abgReferenceRanges.lactate),
  };

  for (const assessment of Object.values(assessments)) {
    addAbnormality(result, assessment);
  }

  if (assessments.ph.status === "low") addFeature(result.features, "acidaemia");
  if (assessments.ph.status === "high") addFeature(result.features, "alkalaemia");
  if (assessments.pao2.status === "low") addFeature(result.features, "hypoxaemia");
  if (assessments.paco2.status === "low") addFeature(result.features, "hypocapnia");
  if (assessments.paco2.status === "high") addFeature(result.features, "hypercapnia");
  if (assessments.bicarbonate.status === "low") addFeature(result.features, "low_bicarbonate_abg");
  if (assessments.bicarbonate.status === "high") addFeature(result.features, "raised_bicarbonate_abg");
  if (assessments.baseExcess.status === "low") addFeature(result.features, "base_deficit");
  if (assessments.baseExcess.status === "high") addFeature(result.features, "base_excess");
  if (assessments.lactate.status === "high") {
    addFeature(result.features, "raised_lactate");
    result.explanations.push("Lactate is above the educational reference range.");
  }

  if (assessments.ph.status === "low" && assessments.bicarbonate.status === "low") {
    addFeature(result.features, "metabolic_acidosis");
  }

  if (assessments.ph.status === "low" && assessments.paco2.status === "high") {
    addFeature(result.features, "respiratory_acidosis");
  }

  if (assessments.ph.status === "high" && assessments.paco2.status === "low") {
    addFeature(result.features, "respiratory_alkalosis");
  }

  if (assessments.ph.status === "high" && assessments.bicarbonate.status === "high") {
    addFeature(result.features, "metabolic_alkalosis");
  }

  addMissingWarnings(result, Object.values(assessments));

  return result;
}

