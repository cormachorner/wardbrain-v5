import type { ExtractedFeatures } from "./types";
import type {
  PresentationFamily,
  WardBrainPresentationRoute,
} from "../types/wardbrain";
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
    "GORD",
    "Pneumonia",
    "Musculoskeletal chest pain",
  ],
  headache: [
    "Subarachnoid haemorrhage",
    "Migraine",
    "Tension headache",
    "Temporal arteritis",
    "Meningitis / encephalitis",
    "Stroke / neurological emergency",
    "Viral illness",
  ],
  "breathlessness-pleuritic-chest-pain": [
    "Pulmonary embolism",
    "Pneumothorax",
    "Pneumonia",
    "Asthma exacerbation",
    "COPD exacerbation",
    "Sepsis",
    "Acute coronary syndrome",
  ],
  "acute-abdominal-pain": [
    "Abdominal aortic aneurysm",
    "Mesenteric ischaemia",
    "Gastroenteritis",
    "GI bleed",
    "Sepsis",
  ],
  "confusion-delirium": [
    "Delirium secondary to infection",
    "Sepsis",
    "Stroke / neurological emergency",
    "Meningitis / encephalitis",
  ],
  "hearing-loss": [],
  epistaxis: [],
  "vertigo-dizziness": [],
  "red-painful-eye": [],
  "sudden-visual-loss": [],
  "cellulitis-soft-tissue-infection": [],
  "ruq-pain-jaundice": [],
  "testicular-pain-scrotal-swelling": [],
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
    textTerms: ["chest pain", "chest pressure", "chest tightness", "heavy chest pain"],
    featureWeights: {
      chestPain: 6,
      jawPain: 2,
      armPain: 2,
      sweating: 2,
      indigestionLikeChestPain: 4,
      heartburn: 1,
      abdominalPain: 1,
      tearingPain: 1,
      backRadiation: 1,
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
    textTerms: ["headache", "thunderclap headache", "worst headache"],
    featureWeights: {
      headache: 5,
      thunderclap: 4,
      neckStiffness: 2,
      photophobia: 2,
      vomiting: 1,
      focalNeurology: 1,
      visualAura: 2,
      bandLikeHeadache: 2,
      temporalHeadache: 2,
      jawClaudication: 3,
    },
    diagnosisWeights: {
      "Subarachnoid haemorrhage": 3,
      Migraine: 2,
      "Tension headache": 2,
      "Temporal arteritis": 3,
      "Meningitis / encephalitis": 2,
    },
  },
  "breathlessness-pleuritic-chest-pain": {
    minimumScore: 4,
    textTerms: ["shortness of breath", "breathlessness", "pleuritic chest pain"],
    featureWeights: {
      sob: 5,
      pleuriticPain: 4,
      hypoxia: 3,
      tachypnoea: 2,
      tachycardia: 2,
      haemoptysis: 3,
      recentSurgery: 1,
      immobility: 1,
      longHaulTravel: 1,
      unilateralReducedAirEntry: 2,
      wheeze: 2,
      productiveCough: 2,
      progressiveCourse: 2,
    },
    diagnosisWeights: {
      "Pulmonary embolism": 3,
      Pneumothorax: 3,
      Pneumonia: 2,
      "Asthma exacerbation": 2,
      "COPD exacerbation": 2,
      Sepsis: 1,
    },
  },
  "acute-abdominal-pain": {
    minimumScore: 4,
    textTerms: ["abdominal pain", "epigastric pain", "severe abdominal pain"],
    featureWeights: {
      abdominalPain: 6,
      painOutOfProportion: 3,
      vomiting: 1,
      diarrhoea: 1,
      af: 2,
      collapse: 2,
      giBleed: 2,
    },
    diagnosisWeights: {
      "Mesenteric ischaemia": 3,
      "Abdominal aortic aneurysm": 2,
      Gastroenteritis: 1,
      "GI bleed": 2,
    },
  },
  "confusion-delirium": {
    minimumScore: 4,
    textTerms: ["confusion", "delirium", "acutely confused"],
    featureWeights: {
      confusion: 6,
      fever: 1,
      focalNeurology: 2,
      neckStiffness: 2,
      recentInfection: 1,
    },
    diagnosisWeights: {
      "Delirium secondary to infection": 2,
      Sepsis: 2,
      "Stroke / neurological emergency": 2,
      "Meningitis / encephalitis": 2,
    },
  },
  "hearing-loss": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  epistaxis: { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  "vertigo-dizziness": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  "red-painful-eye": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  "sudden-visual-loss": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  "cellulitis-soft-tissue-infection": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  "ruq-pain-jaundice": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
  "testicular-pain-scrotal-swelling": { minimumScore: 999, textTerms: [], featureWeights: {}, diagnosisWeights: {} },
};

function includesTerm(text: string, term: string): boolean {
  return text.includes(term);
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
