import type { ExtractedFeatures } from "../types";
import type {
  PresentationFamily,
  WardBrainPresentationRoute,
} from "../../types/wardbrain";
import { CONDITION_PROMOTION_REGISTRY } from "./conditionPromotionRegistry";

type FamilyRule = {
  minimumScore: number;
  textTerms: string[];
  featureWeights: Record<string, number>;
  diagnosisWeights: Record<string, number>;
};

export const FAMILY_DIAGNOSIS_MAP: Record<PresentationFamily, string[]> = {
  "chest-pain": [
    "Acute coronary syndrome",
    "Pulmonary embolism",
    "Acute aortic syndrome",
    "Pneumothorax",
    "Pericarditis",
    "GORD",
    "Pneumonia",
    "Musculoskeletal chest pain",
    "Panic / anxiety",
  ],
  headache: [
    "Subarachnoid haemorrhage",
    "Migraine",
    "Tension headache",
    "Cluster headache",
    "Temporal arteritis",
    "Meningitis / encephalitis",
    "Raised intracranial pressure / intracranial mass",
    "Cerebral venous sinus thrombosis",
    "Stroke / neurological emergency",
    "Viral illness",
  ],
  "breathlessness-pleuritic-chest-pain": [
    "Pulmonary embolism",
    "Pneumothorax",
    "Pneumonia",
    "Asthma exacerbation",
    "COPD exacerbation",
    "Heart failure",
    "Panic / anxiety",
    "Anaemia",
    "Diabetic ketoacidosis",
    "Sepsis",
    "Acute coronary syndrome",
  ],
  "acute-abdominal-pain": [
    "Abdominal aortic aneurysm",
    "Mesenteric ischaemia",
    "Appendicitis",
    "Acute pancreatitis",
    "Perforated viscus",
    "Ectopic pregnancy",
    "Ovarian / acute pelvic pathology",
    "Cauda equina syndrome",
    "Gastroenteritis",
    "Diabetic ketoacidosis",
    "GI bleed",
    "Sepsis",
    "UTI / urosepsis",
  ],
  "confusion-delirium": [
    "Delirium secondary to infection",
    "Sepsis",
    "Pneumonia",
    "Stroke / neurological emergency",
    "TIA",
    "Hypoglycaemia",
    "UTI / urosepsis",
    "Meningitis / encephalitis",
    "Medication / sedative toxicity",
    "Alcohol withdrawal",
    "Electrolyte / metabolic disturbance",
    "Dementia / chronic cognitive impairment",
  ],
  "hearing-loss": [],
  epistaxis: [],
  "vertigo-dizziness": [],
  "red-painful-eye": [],
  "sudden-visual-loss": [],
  "cellulitis-soft-tissue-infection": [],
  "ruq-pain-jaundice": [
    "Acute cholangitis",
    "Acute cholecystitis",
    "Choledocholithiasis / obstructive jaundice",
    "Biliary colic / gallstone disease",
    "Primary sclerosing cholangitis",
    "Primary biliary cholangitis",
  ],
  "testicular-pain-scrotal-swelling": ["Testicular torsion"],
};

export const SCAFFOLD_FAMILY_MAP: Record<string, PresentationFamily> = {
  "confusion-delirium": "confusion-delirium",
  "hearing-loss": "hearing-loss",
  epistaxis: "epistaxis",
  "vertigo-dizziness": "vertigo-dizziness",
  "red-painful-eye": "red-painful-eye",
  "sudden-visual-loss": "sudden-visual-loss",
  "cellulitis-soft-tissue-infection": "cellulitis-soft-tissue-infection",
  "ruq-pain-jaundice": "ruq-pain-jaundice",
  "acute-abdominal-pain": "acute-abdominal-pain",
  "testicular-pain-scrotal-swelling": "testicular-pain-scrotal-swelling",
  "chest-pain": "chest-pain",
  headache: "headache",
  "breathlessness-pleuritic-chest-pain": "breathlessness-pleuritic-chest-pain",
};

export const CONDITION_PROMOTION_STATUS = Object.fromEntries(
  CONDITION_PROMOTION_REGISTRY.map((entry) => [entry.canonicalName, entry.promotionStatus]),
);

const FAMILY_RULES: Record<
  PresentationFamily,
  FamilyRule
> = {
  "chest-pain": {
    minimumScore: 4,
    textTerms: [
      "chest pain",
      "chest pressure",
      "chest tightness",
      "heavy chest pain",
      "epigastric discomfort",
      "upper abdominal pressure",
      "upper abdominal heaviness",
    ],
    featureWeights: {
      chest_pain: 6,
      jaw_pain: 2,
      arm_pain: 2,
      sweating: 2,
      indigestion_like_chest_pain: 4,
      nausea: 1,
      heartburn: 1,
      abdominal_pain: 1,
      tearing_pain: 1,
      back_radiation: 1,
      collapse: 1,
    },
    diagnosisWeights: {
      "Acute coronary syndrome": 5,
      "Acute aortic syndrome": 4,
      GORD: 1,
    },
  },
  headache: {
    minimumScore: 4,
    textTerms: [
      "headache",
      "severe headache",
      "sudden headache",
      "thunderclap headache",
      "worst headache",
      "gradual headache",
      "unilateral headache",
      "bilateral headache",
      "occipital headache",
      "temporal headache",
      "frontal headache",
    ],
    featureWeights: {
      headache: 5,
      severe_headache: 2,
      thunderclap: 4,
      worst_headache_of_life: 4,
      sudden_onset: 2,
      gradual_onset: 1,
      unilateral_headache: 2,
      bilateral_headache: 1,
      occipital_headache: 2,
      frontal_headache: 1,
      neck_stiffness: 2,
      photophobia: 2,
      phonophobia: 1,
      vomiting: 1,
      focal_neurology: 1,
      focal_weakness: 2,
      aphasia: 2,
      ataxia: 2,
      visual_aura: 2,
      band_like_headache: 2,
      temporal_headache: 2,
      jaw_claudication: 3,
      papilloedema: 3,
      worse_on_waking: 2,
      worse_lying_flat: 2,
      seizure: 2,
      pregnancy_possible: 1,
    },
    diagnosisWeights: {
      "Subarachnoid haemorrhage": 3,
      Migraine: 2,
      "Tension headache": 2,
      "Cluster headache": 2,
      "Temporal arteritis": 3,
      "Meningitis / encephalitis": 2,
      "Raised intracranial pressure / intracranial mass": 2,
      "Cerebral venous sinus thrombosis": 2,
    },
  },
  "breathlessness-pleuritic-chest-pain": {
    minimumScore: 4,
    textTerms: ["shortness of breath", "breathlessness", "pleuritic chest pain"],
    featureWeights: {
      sob: 5,
      pleuritic_pain: 4,
      hypoxia: 3,
      tachypnoea: 2,
      tachycardia: 2,
      haemoptysis: 3,
      recent_surgery: 1,
      immobility: 1,
      long_haul_travel: 1,
      unilateral_reduced_air_entry: 2,
      wheeze: 3,
      known_asthma: 3,
      increased_inhaler_use: 3,
      difficulty_speaking: 2,
      unable_to_speak_full_sentences: 2,
      poor_peak_flow: 3,
      productive_cough: 2,
      progressive_course: 2,
      recent_infection: 1,
      orthopnoea: 3,
      bibasal_crackles: 3,
      raised_jvp: 3,
      peripheral_oedema: 3,
      kussmaul_breathing: 4,
      diabetic_context: 3,
      pallor: 3,
      fatigue: 2,
    },
    diagnosisWeights: {
      "Pulmonary embolism": 3,
      Pneumothorax: 3,
      Pneumonia: 2,
      "Asthma exacerbation": 4,
      "COPD exacerbation": 2,
      "Heart failure": 3,
      "Panic / anxiety": 2,
      Anaemia: 2,
      "Diabetic ketoacidosis": 2,
      Sepsis: 1,
    },
  },
  "acute-abdominal-pain": {
    minimumScore: 4,
    textTerms: ["abdominal pain", "epigastric pain", "severe abdominal pain"],
    featureWeights: {
      abdominal_pain: 5,
      pain_out_of_proportion: 5,
      vomiting: 0,
      diarrhoea: 0,
      af: 2,
      collapse: 1,
      gi_bleed: 2,
      back_radiation: 0,
      severe_constant_upper_abdominal_pain: 2,
      gallstone_context: 1,
      guarding_rigidity: 5,
      abdominal_movement_pain: 4,
      rif_pain: 4,
      migration_to_rif: 5,
      rif_tenderness: 4,
      anorexia: 2,
      flank_pain: 3,
      loin_to_groin_pain: 4,
      testicular_pain: 4,
      perforation_language: 3,
    },
    diagnosisWeights: {
      "Mesenteric ischaemia": 5,
      Appendicitis: 5,
      "Abdominal aortic aneurysm": 3,
      "Acute pancreatitis": 2,
      "Perforated viscus": 4,
      "Ectopic pregnancy": 4,
      "Ovarian / acute pelvic pathology": 3,
      "Testicular torsion": 4,
      Gastroenteritis: 1,
      "GI bleed": 2,
      "UTI / urosepsis": 2,
    },
  },
  "confusion-delirium": {
    minimumScore: 4,
    textTerms: [
      "confusion",
      "delirium",
      "acutely confused",
      "new confusion",
      "suddenly muddled",
      "not himself",
      "not herself",
      "off legs",
      "hallucinations",
      "disorientated",
      "disoriented",
    ],
    featureWeights: {
      confusion: 6,
      drowsiness: 3,
      hallucinations: 3,
      fluctuation: 3,
      acute_on_chronic_confusion: 4,
      fever: 2,
      infection_source: 2,
      urinary_symptoms: 3,
      urinary_incontinence: 2,
      productive_cough: 2,
      crackles: 2,
      hypoxia: 2,
      hypoglycaemia_cue: 4,
      focal_neurology: 4,
      neck_stiffness: 3,
      photophobia: 2,
      seizure: 3,
      reduced_consciousness: 3,
      medication_toxicity_context: 4,
      alcohol_withdrawal_context: 4,
      metabolic_disturbance_context: 4,
      poor_oral_intake: 2,
      dehydration: 2,
      baseline_dementia: 1,
      recent_infection: 1,
    },
    diagnosisWeights: {
      "Delirium secondary to infection": 2,
      Sepsis: 2,
      Pneumonia: 2,
      "Stroke / neurological emergency": 2,
      TIA: 2,
      Hypoglycaemia: 3,
      "UTI / urosepsis": 3,
      "Meningitis / encephalitis": 2,
      "Medication / sedative toxicity": 2,
      "Alcohol withdrawal": 2,
      "Electrolyte / metabolic disturbance": 2,
      "Dementia / chronic cognitive impairment": 1,
    },
  },
  "hearing-loss": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  epistaxis: { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  "vertigo-dizziness": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  "red-painful-eye": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  "sudden-visual-loss": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  "cellulitis-soft-tissue-infection": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  "ruq-pain-jaundice": {
    minimumScore: 4,
    textTerms: [
      "ruq pain",
      "right upper quadrant pain",
      "jaundice",
      "yellow skin",
      "yellow eyes",
      "biliary colic",
      "obstructive jaundice",
      "fatty-food ruq pain",
      "post-prandial ruq pain",
      "gallstone attack",
    ],
    featureWeights: {
      ruq_pain: 6,
      abdominal_pain: 2,
      jaundice: 6,
      fever: 2,
      rigors: 3,
      dark_urine: 2,
      pale_stools: 2,
      pruritus: 2,
      gallstone_context: 3,
      murphys_sign: 3,
      localized_ruq_tenderness: 3,
      persistent_ruq_pain: 3,
      post_prandial_pain: 4,
      recurrent_biliary_pain: 4,
      well_between_episodes: 4,
      obstructive_jaundice_language: 3,
      ibd_context: 2,
      fatigue: 2,
      dry_eyes_mouth: 2,
      chronic_course: 2,
      hypotension: 1,
      confusion: 1,
    },
    diagnosisWeights: {
      "Acute cholangitis": 5,
      "Acute cholecystitis": 4,
      "Choledocholithiasis / obstructive jaundice": 4,
      "Biliary colic / gallstone disease": 4,
      "Primary sclerosing cholangitis": 1,
      "Primary biliary cholangitis": 1,
      Sepsis: 1,
    },
  },
  "testicular-pain-scrotal-swelling": {
    minimumScore: 4,
    textTerms: ["testicular pain", "acute scrotal pain"],
    featureWeights: {
      unilateral_testicular_pain: 6,
      sudden_onset: 2,
      vomiting: 1,
    },
    diagnosisWeights: {
      "Testicular torsion": 4,
    },
  },
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesTerm(text: string, term: string): boolean {
  if (!text.includes(term)) {
    return false;
  }

  const escapedTerm = escapeRegExp(term).replace(/\s+/g, "\\s+");
  const negatedTerm = new RegExp(
    `\\b(?:no|not|denies|denied|without|nil)(?:\\s+\\w+){0,3}\\s+${escapedTerm}\\b`,
  );

  return !negatedTerm.test(text);
}

export function routePresentationFamilies(
  rawCaseText: string,
  features: ExtractedFeatures,
  rankedDiagnoses: string[] = [],
): WardBrainPresentationRoute {
  const normalizedText = rawCaseText.toLowerCase();
  const scoredFamilies = (Object.entries(FAMILY_RULES) as Array<[PresentationFamily, FamilyRule]>)
    .map(([family, rule]) => {
      let score = 0;
      const reasons: string[] = [];

      for (const term of rule.textTerms) {
        if (includesTerm(normalizedText, term)) {
          score += 2;
          reasons.push(`text:${term}`);
        }
      }

      for (const [feature, weight] of Object.entries(rule.featureWeights)) {
        if (features.matchedFeatures.includes(feature)) {
          score += weight;
          reasons.push(`feature:${feature}`);
        }
      }

      for (const [diagnosis, weight] of Object.entries(rule.diagnosisWeights)) {
        if (rankedDiagnoses.includes(diagnosis)) {
          score += weight;
          reasons.push(`diagnosis:${diagnosis}`);
        }
      }

      if (
        family === "headache" &&
        !features.matchedFeatures.includes("headache") &&
        !rule.textTerms.some((term) => includesTerm(normalizedText, term))
      ) {
        score = 0;
        reasons.length = 0;
      }

      return { family, score, reasons, minimumScore: rule.minimumScore };
    })
    .filter((candidate) => candidate.score >= candidate.minimumScore)
    .sort((left, right) => right.score - left.score);

  const primary = scoredFamilies[0];
  const secondary = scoredFamilies[1];

  return {
    primaryFamily: primary?.family,
    secondaryFamily:
      secondary && primary && primary.score - secondary.score <= 2 ? secondary.family : undefined,
    confidence: primary?.score ?? 0,
    reasons: primary?.reasons.slice(0, 5) ?? [],
  };
}
