import { fbcReferenceRanges, getSexSpecificRange } from "./referenceRanges";
import {
  addAbnormality,
  addFeature,
  addMissingWarnings,
  assessValue,
  emptyLabInterpretation,
  type FbcPanel,
  type LabInterpretationResult,
  type Sex,
} from "./labTypes";

export function interpretFbc(panel: FbcPanel = {}, sex: Sex = "unknown"): LabInterpretationResult {
  const result = emptyLabInterpretation();
  const assessments = {
    hb: assessValue("Hb", panel.hb, getSexSpecificRange(fbcReferenceRanges.hb, sex)),
    wcc: assessValue("WCC", panel.wcc, fbcReferenceRanges.wcc),
    platelets: assessValue("Platelets", panel.platelets, fbcReferenceRanges.platelets),
    mcv: assessValue("MCV", panel.mcv, fbcReferenceRanges.mcv),
    mch: assessValue("MCH", panel.mch, fbcReferenceRanges.mch),
    mchc: assessValue("MCHC", panel.mchc, fbcReferenceRanges.mchc),
    neutrophils: assessValue("Neutrophils", panel.neutrophils, fbcReferenceRanges.neutrophils),
    lymphocytes: assessValue("Lymphocytes", panel.lymphocytes, fbcReferenceRanges.lymphocytes),
    monocytes: assessValue("Monocytes", panel.monocytes, fbcReferenceRanges.monocytes),
    eosinophils: assessValue("Eosinophils", panel.eosinophils, fbcReferenceRanges.eosinophils),
    basophils: assessValue("Basophils", panel.basophils, fbcReferenceRanges.basophils),
    reticulocytes: assessValue("Reticulocytes", panel.reticulocytes, fbcReferenceRanges.reticulocytes),
    pcv: assessValue("PCV", panel.pcv, getSexSpecificRange(fbcReferenceRanges.pcv, sex)),
    esr: assessValue("ESR", panel.esr, fbcReferenceRanges.esr),
    dDimer: assessValue("D-dimer", panel.dDimer, fbcReferenceRanges.dDimer),
  };

  for (const assessment of Object.values(assessments)) {
    addAbnormality(result, assessment);
  }

  if (assessments.hb.status === "low") {
    addFeature(result.features, "anaemia");
    result.explanations.push("Haemoglobin is below the sex-specific educational reference range.");
  }

  if (assessments.hb.status === "high") {
    addFeature(result.features, "polycythaemia");
  }

  if (assessments.mcv.status === "low") {
    addFeature(result.features, "microcytosis");
  }

  if (assessments.mcv.status === "high") {
    addFeature(result.features, "macrocytosis");
  }

  if (assessments.hb.status === "low" && assessments.mcv.status === "low") {
    addFeature(result.features, "microcytic_anaemia");
    result.explanations.push("Low Hb with low MCV gives a deterministic microcytic anaemia pattern.");
  }

  if (assessments.hb.status === "low" && assessments.mcv.status === "high") {
    addFeature(result.features, "macrocytic_anaemia");
  }

  if (assessments.wcc.status === "high") addFeature(result.features, "leucocytosis");
  if (assessments.wcc.status === "low") addFeature(result.features, "leucopenia");
  if (assessments.platelets.status === "high") addFeature(result.features, "thrombocytosis");
  if (assessments.platelets.status === "low") addFeature(result.features, "thrombocytopenia");
  if (assessments.neutrophils.status === "high") addFeature(result.features, "neutrophilia");
  if (assessments.neutrophils.status === "low") addFeature(result.features, "neutropenia");
  if (assessments.lymphocytes.status === "high") addFeature(result.features, "lymphocytosis");
  if (assessments.lymphocytes.status === "low") addFeature(result.features, "lymphopenia");
  if (assessments.eosinophils.status === "high") addFeature(result.features, "eosinophilia");
  if (assessments.esr.status === "high") addFeature(result.features, "raised_esr");
  if (assessments.dDimer.status === "high") addFeature(result.features, "raised_d_dimer");
  if (assessments.pcv.status === "low") addFeature(result.features, "low_pcv");
  if (assessments.pcv.status === "high") addFeature(result.features, "raised_pcv");

  addMissingWarnings(result, Object.values(assessments));

  return result;
}

