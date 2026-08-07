import { lftsReferenceRanges } from "./referenceRanges";
import {
  addAbnormality,
  addFeature,
  addMissingWarnings,
  assessValue,
  emptyLabInterpretation,
  type LabInterpretationResult,
  type LftsPanel,
} from "./labTypes";

export function interpretLfts(panel: LftsPanel = {}): LabInterpretationResult {
  const result = emptyLabInterpretation();
  const assessments = {
    albumin: assessValue("Albumin", panel.albumin, lftsReferenceRanges.albumin),
    alt: assessValue("ALT", panel.alt, lftsReferenceRanges.alt),
    ast: assessValue("AST", panel.ast, lftsReferenceRanges.ast),
    alp: assessValue("ALP", panel.alp, lftsReferenceRanges.alp),
    bilirubin: assessValue("Bilirubin", panel.bilirubin, lftsReferenceRanges.bilirubin),
    ggt: assessValue("GGT", panel.ggt, lftsReferenceRanges.ggt),
  };

  for (const assessment of Object.values(assessments)) {
    addAbnormality(result, assessment);
  }

  if (assessments.albumin.status === "low") addFeature(result.features, "hypoalbuminaemia");
  if (assessments.alt.status === "high") addFeature(result.features, "raised_alt");
  if (assessments.ast.status === "high") addFeature(result.features, "raised_ast");
  if (assessments.alp.status === "high") addFeature(result.features, "raised_alp");
  if (assessments.bilirubin.status === "high") addFeature(result.features, "raised_bilirubin");
  if (assessments.ggt.status === "high") addFeature(result.features, "raised_ggt");

  const hasMarkedTransaminaseRise =
    (panel.alt !== undefined && panel.alt >= 3 * lftsReferenceRanges.alt.max) ||
    (panel.ast !== undefined && panel.ast >= 3 * lftsReferenceRanges.ast.max);
  const hasNormalAlp = assessments.alp.status === "normal" || assessments.alp.status === "missing";
  const hasCholestaticSignal = assessments.alp.status === "high" && assessments.bilirubin.status === "high";

  if (hasMarkedTransaminaseRise && hasNormalAlp) {
    addFeature(result.features, "hepatocellular_pattern");
    result.explanations.push("Marked transaminase rise with normal ALP gives a hepatocellular pattern.");
  }

  if (hasCholestaticSignal) {
    addFeature(result.features, "cholestatic_pattern");
    result.explanations.push("Raised ALP with raised bilirubin gives a cholestatic pattern.");
  }

  addMissingWarnings(result, Object.values(assessments));

  return result;
}

