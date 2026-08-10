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

  const hasMetabolicAcidosis =
    assessments.ph.status === "low" && assessments.bicarbonate.status === "low";
  const hasRespiratoryAcidosis =
    assessments.ph.status === "low" && assessments.paco2.status === "high";
  const hasRespiratoryAlkalosis =
    assessments.ph.status === "high" && assessments.paco2.status === "low";
  const hasMetabolicAlkalosis =
    assessments.ph.status === "high" && assessments.bicarbonate.status === "high";

  if (hasMetabolicAcidosis) {
    addFeature(result.features, "metabolic_acidosis");
    result.explanations.push("pH is low and bicarbonate is low, supporting a primary metabolic acidosis pattern.");
  }

  if (hasRespiratoryAcidosis) {
    addFeature(result.features, "respiratory_acidosis");
    result.explanations.push("pH is low and PaCO2 is high, supporting a primary respiratory acidosis pattern.");
  }

  if (hasRespiratoryAlkalosis) {
    addFeature(result.features, "respiratory_alkalosis");
    result.explanations.push("pH is high and PaCO2 is low, supporting a primary respiratory alkalosis pattern.");
  }

  if (hasMetabolicAlkalosis) {
    addFeature(result.features, "metabolic_alkalosis");
    result.explanations.push("pH is high and bicarbonate is high, supporting a primary metabolic alkalosis pattern.");
  }

  if (
    (hasMetabolicAcidosis && hasRespiratoryAcidosis) ||
    (hasMetabolicAlkalosis && hasRespiratoryAlkalosis)
  ) {
    addFeature(result.features, "possible_mixed_acid_base_disorder");
    result.explanations.push("Both metabolic and respiratory abnormalities point in the same pH direction, so this may represent a mixed acid-base disorder.");
  }

  if (
    assessments.ph.status === "normal" &&
    assessments.paco2.status !== "normal" &&
    assessments.paco2.status !== "missing" &&
    assessments.paco2.status !== "invalid" &&
    assessments.bicarbonate.status !== "normal" &&
    assessments.bicarbonate.status !== "missing" &&
    assessments.bicarbonate.status !== "invalid"
  ) {
    addFeature(result.features, "possible_compensated_or_mixed_acid_base_disorder");
    result.explanations.push("PaCO2 and bicarbonate are both abnormal with a normal pH, which may reflect compensation or mixed acid-base physiology.");
  }

  addMissingWarnings(result, Object.values(assessments));

  return result;
}
