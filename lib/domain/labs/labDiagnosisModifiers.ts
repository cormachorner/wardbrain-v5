import type { DifferentialResult, ExtractedFeatures } from "../../types";
import type { LabInterpretationResult } from "./labTypes";

export type LabDiagnosisModifier = {
  diagnosis: string;
  feature: string;
  scoreDelta: number;
  explanation: string;
  confidence: "high" | "moderate";
};

type ModifierContext = {
  labs?: LabInterpretationResult;
  features: ExtractedFeatures;
  presentationBlockId?: string;
};

function hasClinicalFeature(features: ExtractedFeatures, feature: string): boolean {
  return features.matchedFeatures.includes(feature);
}

function hasLabFeature(labs: LabInterpretationResult | undefined, feature: string): boolean {
  return Boolean(labs?.features.includes(feature));
}

function hasAnyClinicalFeature(features: ExtractedFeatures, featureList: string[]): boolean {
  return featureList.some((feature) => hasClinicalFeature(features, feature));
}

function isRespiratoryBlock(blockId: string | undefined): boolean {
  return blockId === "breathlessness" || blockId === "breathlessness-pleuritic-chest-pain" || blockId === "pleuritic-chest-pain";
}

function isAcuteAbdominalBlock(blockId: string | undefined): boolean {
  return blockId === "acute_abdominal_pain" || blockId === "acute-abdominal-pain";
}

function isRuqCompatible(features: ExtractedFeatures, blockId: string | undefined): boolean {
  return (
    (isAcuteAbdominalBlock(blockId) || blockId === "ruq-pain-jaundice") &&
    hasAnyClinicalFeature(features, ["ruq_pain", "jaundice", "dark_urine", "pale_stools", "pruritus"])
  );
}

function isInfectionCompatible(features: ExtractedFeatures): boolean {
  return hasAnyClinicalFeature(features, [
    "fever",
    "rigors",
    "infection_source",
    "productive_cough",
    "sputum_change",
    "crackles",
    "urinary_symptoms",
    "dysuria",
    "urinary_frequency",
    "urinary_incontinence",
    "ruq_pain",
    "jaundice",
    "confusion",
  ]);
}

function isBiliaryInfectionCompatible(features: ExtractedFeatures): boolean {
  return hasAnyClinicalFeature(features, [
    "fever",
    "rigors",
    "infection_source",
    "sepsis_features",
    "tachycardia",
    "hypotension",
  ]);
}

function isGiBleedCompatible(features: ExtractedFeatures): boolean {
  return hasAnyClinicalFeature(features, [
    "gi_bleed",
    "pr_bleeding",
    "melaena",
    "haematemesis",
    "coffee_ground_vomit",
    "haematochezia",
    "peptic_ulcer_disease",
    "nsaid_use",
  ]);
}

function isDkaCompatible(features: ExtractedFeatures): boolean {
  return (
    hasAnyClinicalFeature(features, ["diabetic_context", "type_1_diabetes", "hyperglycaemia"]) &&
    hasAnyClinicalFeature(features, [
      "kussmaul_breathing",
      "polyuria",
      "polydipsia",
      "ketosis_breath",
      "vomiting",
      "abdominal_pain",
      "dehydration",
    ])
  );
}

function isAnaemiaCompatible(features: ExtractedFeatures): boolean {
  return hasAnyClinicalFeature(features, [
    "fatigue",
    "pallor",
    "heavy_menstrual_bleeding",
    "progressive_course",
    "chronic_course",
    "sob",
  ]);
}

function isPneumoniaCompatible(features: ExtractedFeatures, blockId: string | undefined): boolean {
  return (
    isRespiratoryBlock(blockId) &&
    hasAnyClinicalFeature(features, ["fever", "productive_cough", "sputum_change", "crackles", "infection_source"]) &&
    hasAnyClinicalFeature(features, ["sob", "cough", "pleuritic_pain", "hypoxia"])
  );
}

function isHeartFailureCompatible(features: ExtractedFeatures, blockId: string | undefined): boolean {
  return (
    isRespiratoryBlock(blockId) &&
    hasClinicalFeature(features, "sob") &&
    hasAnyClinicalFeature(features, [
      "orthopnoea",
      "paroxysmal_nocturnal_dyspnoea",
      "raised_jvp",
      "peripheral_oedema",
      "ankle_swelling",
      "leg_swelling",
      "bibasal_crackles",
      "frothy_sputum",
    ])
  );
}

function isMesentericCompatible(features: ExtractedFeatures): boolean {
  return (
    hasClinicalFeature(features, "abdominal_pain") &&
    (hasClinicalFeature(features, "pain_out_of_proportion") ||
      hasClinicalFeature(features, "pain_severe_but_exam_mild")) &&
    hasAnyClinicalFeature(features, ["atrial_fibrillation", "af", "vascular_disease", "older_age"])
  );
}

function isCopdCompatible(features: ExtractedFeatures, blockId: string | undefined): boolean {
  return (
    isRespiratoryBlock(blockId) &&
    hasAnyClinicalFeature(features, ["known_copd", "copd_history", "smoking_history"]) &&
    hasClinicalFeature(features, "sob")
  );
}

function addModifier(
  modifiers: LabDiagnosisModifier[],
  diagnosis: string,
  feature: string,
  scoreDelta: number,
  confidence: LabDiagnosisModifier["confidence"],
  explanation: string,
) {
  modifiers.push({ diagnosis, feature, scoreDelta, confidence, explanation });
}

export function getLabDiagnosisModifiers({
  labs,
  features,
  presentationBlockId,
}: ModifierContext): LabDiagnosisModifier[] {
  if (!labs) {
    return [];
  }

  const modifiers: LabDiagnosisModifier[] = [];
  const infectionCompatible = isInfectionCompatible(features);
  const giBleedCompatible = isGiBleedCompatible(features);
  const dkaCompatible = isDkaCompatible(features);
  const anaemiaCompatible = isAnaemiaCompatible(features);
  const pneumoniaCompatible = isPneumoniaCompatible(features, presentationBlockId);
  const heartFailureCompatible = isHeartFailureCompatible(features, presentationBlockId);
  const ruqCompatible = isRuqCompatible(features, presentationBlockId);
  const biliaryInfectionCompatible = isBiliaryInfectionCompatible(features);
  const copdCompatible = isCopdCompatible(features, presentationBlockId);

  if (infectionCompatible) {
    if (hasLabFeature(labs, "neutrophilia")) {
      addModifier(modifiers, "Sepsis", "neutrophilia", 2, "moderate", "Neutrophilia modestly supports serious infection when compatible clinical infection features are present.");
      addModifier(modifiers, "Delirium secondary to infection", "neutrophilia", 2, "moderate", "Neutrophilia modestly supports infection as a delirium driver when infection clues are present.");
    }

    if (hasLabFeature(labs, "leucocytosis")) {
      addModifier(modifiers, "Sepsis", "leucocytosis", 2, "moderate", "Leucocytosis modestly supports serious infection when compatible clinical infection features are present.");
      addModifier(modifiers, "Delirium secondary to infection", "leucocytosis", 1, "moderate", "Leucocytosis modestly supports infection as a delirium driver when infection clues are present.");
    }

    if (hasLabFeature(labs, "leucopenia")) {
      addModifier(modifiers, "Sepsis", "leucopenia", 3, "moderate", "Leucopenia can support serious infection in the right clinical context.");
    }

    if (hasLabFeature(labs, "raised_lactate")) {
      addModifier(modifiers, "Sepsis", "raised_lactate", 3, "moderate", "Raised lactate supports systemic illness severity when compatible infection features are present.");
    }

    if (hasLabFeature(labs, "renal_impairment")) {
      addModifier(modifiers, "Sepsis", "renal_impairment", 1, "moderate", "Renal impairment can modestly support systemic illness severity, but does not diagnose sepsis alone.");
    }
  }

  if (giBleedCompatible) {
    if (hasLabFeature(labs, "anaemia")) {
      addModifier(modifiers, "GI bleed", "anaemia", 3, "high", "Anaemia supports blood loss in a compatible GI bleeding presentation.");
    }

    if (hasLabFeature(labs, "microcytic_anaemia")) {
      addModifier(modifiers, "GI bleed", "microcytic_anaemia", 3, "moderate", "Microcytic anaemia supports possible chronic blood loss in a compatible GI bleeding presentation.");
    }

    if (hasLabFeature(labs, "raised_urea")) {
      addModifier(modifiers, "GI bleed", "raised_urea", 2, "moderate", "Raised urea can support upper GI bleeding in the appropriate clinical context.");
    }
  }

  if (anaemiaCompatible) {
    if (hasLabFeature(labs, "anaemia")) {
      addModifier(modifiers, "Anaemia", "anaemia", 4, "high", "Low haemoglobin supports anaemia when compatible symptoms such as fatigue, pallor, heavy bleeding, or progressive breathlessness are present.");
    }

    if (hasLabFeature(labs, "microcytic_anaemia")) {
      addModifier(modifiers, "Anaemia", "microcytic_anaemia", 2, "moderate", "Microcytic anaemia supports an anaemia pattern, but does not by itself prove iron deficiency.");
    }
  }

  if (dkaCompatible) {
    if (hasLabFeature(labs, "metabolic_acidosis")) {
      addModifier(modifiers, "Diabetic ketoacidosis", "metabolic_acidosis", 7, "high", "Metabolic acidosis strongly supports DKA when diabetic/metabolic clinical features are present.");
    }

    if (hasLabFeature(labs, "low_bicarbonate") || hasLabFeature(labs, "low_bicarbonate_abg")) {
      addModifier(modifiers, "Diabetic ketoacidosis", "low_bicarbonate", 3, "high", "Low bicarbonate supports DKA in a compatible diabetic/metabolic presentation.");
    }

    if (hasLabFeature(labs, "hyperglycaemia_lab")) {
      addModifier(modifiers, "Diabetic ketoacidosis", "hyperglycaemia_lab", 6, "high", "Hyperglycaemia strongly supports DKA when diabetic/metabolic clinical features are present.");
    }
  }

  if (pneumoniaCompatible) {
    if (hasLabFeature(labs, "neutrophilia")) {
      addModifier(modifiers, "Pneumonia", "neutrophilia", 2, "moderate", "Neutrophilia modestly supports bacterial pneumonia when compatible respiratory infection features are present.");
    }

    if (hasLabFeature(labs, "leucocytosis")) {
      addModifier(modifiers, "Pneumonia", "leucocytosis", 2, "moderate", "Leucocytosis modestly supports pneumonia when compatible respiratory infection features are present.");
    }

    if (hasLabFeature(labs, "hypoxaemia")) {
      addModifier(modifiers, "Pneumonia", "hypoxaemia", 2, "moderate", "Hypoxaemia supports respiratory severity in a clinically compatible pneumonia presentation.");
    }
  }

  if (heartFailureCompatible && hasLabFeature(labs, "hypoxaemia")) {
    addModifier(modifiers, "Heart failure", "hypoxaemia", 2, "moderate", "Hypoxaemia supports severity in a compatible fluid-overload breathlessness presentation.");
  }

  if (ruqCompatible) {
    const cholestaticLabContext =
      hasLabFeature(labs, "cholestatic_pattern") ||
      (hasLabFeature(labs, "raised_alp") && hasLabFeature(labs, "raised_ggt"));

    if (hasLabFeature(labs, "cholestatic_pattern")) {
      addModifier(modifiers, "Choledocholithiasis / obstructive jaundice", "cholestatic_pattern", 5, "high", "A cholestatic LFT pattern strongly supports biliary obstruction in a compatible RUQ/jaundice presentation.");

      if (biliaryInfectionCompatible) {
        addModifier(modifiers, "Acute cholangitis", "cholestatic_pattern", 5, "high", "A cholestatic LFT pattern supports cholangitis when compatible infective biliary features are also present.");
      }
    }

    if (hasLabFeature(labs, "raised_bilirubin") && cholestaticLabContext) {
      addModifier(modifiers, "Choledocholithiasis / obstructive jaundice", "raised_bilirubin", 2, "moderate", "Raised bilirubin supports biliary obstruction in a compatible RUQ/jaundice presentation.");

      if (biliaryInfectionCompatible) {
        addModifier(modifiers, "Acute cholangitis", "raised_bilirubin", 2, "moderate", "Raised bilirubin supports cholangitis when compatible infective biliary features are also present.");
      }
    }

    if (hasLabFeature(labs, "raised_alp") && hasLabFeature(labs, "raised_ggt")) {
      addModifier(modifiers, "Choledocholithiasis / obstructive jaundice", "raised_alp_ggt", 3, "moderate", "Raised ALP and GGT support cholestasis in a compatible RUQ/jaundice presentation.");

      if (biliaryInfectionCompatible) {
        addModifier(modifiers, "Acute cholangitis", "raised_alp_ggt", 3, "moderate", "Raised ALP and GGT support cholangitis when compatible infective biliary features are also present.");
      }
    }

    if (biliaryInfectionCompatible && (hasLabFeature(labs, "neutrophilia") || hasLabFeature(labs, "leucocytosis"))) {
      addModifier(modifiers, "Acute cholangitis", "inflammatory_blood_results", 2, "moderate", "Inflammatory blood results modestly support cholangitis when the clinical pattern is biliary sepsis.");
    }

    if (hasLabFeature(labs, "hepatocellular_pattern")) {
      addModifier(modifiers, "Hepatitis / acute liver inflammation", "hepatocellular_pattern", 6, "high", "A hepatocellular LFT pattern strongly supports hepatitis or acute liver inflammation in compatible RUQ/jaundice presentations.");
    }

    if (hasLabFeature(labs, "raised_alt") && hasLabFeature(labs, "raised_ast")) {
      addModifier(modifiers, "Hepatitis / acute liver inflammation", "raised_transaminases", 3, "moderate", "Raised ALT and AST support hepatocellular injury in compatible RUQ/jaundice presentations.");
    }
  }

  if (copdCompatible) {
    if (hasLabFeature(labs, "respiratory_acidosis")) {
      addModifier(modifiers, "COPD exacerbation", "respiratory_acidosis", 6, "high", "Respiratory acidosis supports ventilatory failure in a compatible COPD exacerbation presentation.");
    }

    if (hasLabFeature(labs, "hypercapnia")) {
      addModifier(modifiers, "COPD exacerbation", "hypercapnia", 4, "high", "Hypercapnia supports ventilatory failure in a compatible COPD exacerbation presentation.");
    }

    if (hasLabFeature(labs, "hypoxaemia")) {
      addModifier(modifiers, "COPD exacerbation", "hypoxaemia", 3, "moderate", "Hypoxaemia supports respiratory severity in a compatible COPD exacerbation presentation.");
    }
  }

  if (isMesentericCompatible(features) && hasLabFeature(labs, "raised_lactate")) {
    addModifier(modifiers, "Mesenteric ischaemia", "raised_lactate", 2, "moderate", "Raised lactate modestly supports tissue hypoperfusion in a compatible mesenteric ischaemia presentation, but is not diagnostic.");
  }

  return modifiers;
}

export function applyLabDiagnosisModifiers(
  differentials: DifferentialResult[],
  modifiers: LabDiagnosisModifier[],
): DifferentialResult[] {
  if (modifiers.length === 0) {
    return differentials;
  }

  return differentials
    .map((differential) => {
      const matchingModifiers = modifiers.filter((modifier) => modifier.diagnosis === differential.name);

      if (matchingModifiers.length === 0) {
        return differential;
      }

      const scoreDelta = matchingModifiers.reduce((total, modifier) => total + modifier.scoreDelta, 0);
      const labReasons = matchingModifiers.map(
        (modifier) => `Lab: +${modifier.scoreDelta} ${modifier.feature} - ${modifier.explanation}`,
      );

      return {
        ...differential,
        score: differential.score + scoreDelta,
        reasonsFor: [...new Set([...differential.reasonsFor, ...labReasons])],
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function filterApplicableLabDiagnosisModifiers(
  differentials: DifferentialResult[],
  modifiers: LabDiagnosisModifier[],
): LabDiagnosisModifier[] {
  const availableDiagnoses = new Set(differentials.map((differential) => differential.name));

  return modifiers.filter((modifier) => availableDiagnoses.has(modifier.diagnosis));
}
