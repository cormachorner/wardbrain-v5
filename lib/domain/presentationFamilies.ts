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
    "GORD",
    "Pneumonia",
    "Musculoskeletal chest pain",
    "Panic / anxiety",
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
    "Heart failure",
    "Panic / anxiety",
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
    "GI bleed",
    "Sepsis",
    "UTI / urosepsis",
  ],
  "confusion-delirium": [
    "Delirium secondary to infection",
    "Sepsis",
    "Stroke / neurological emergency",
    "TIA",
    "Hypoglycaemia",
    "UTI / urosepsis",
    "Meningitis / encephalitis",
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
      chestPain: 6,
      jawPain: 2,
      armPain: 2,
      sweating: 2,
      indigestionLikeChestPain: 4,
      nausea: 1,
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
      wheeze: 3,
      knownAsthma: 3,
      increasedInhalerUse: 3,
      difficultySpeaking: 2,
      productiveCough: 2,
      progressiveCourse: 2,
      recentInfection: 1,
    },
    diagnosisWeights: {
      "Pulmonary embolism": 3,
      Pneumothorax: 3,
      Pneumonia: 2,
      "Asthma exacerbation": 4,
      "COPD exacerbation": 2,
      "Heart failure": 3,
      "Panic / anxiety": 2,
      Sepsis: 1,
    },
  },
  "acute-abdominal-pain": {
    minimumScore: 4,
    textTerms: ["abdominal pain", "epigastric pain", "severe abdominal pain"],
    featureWeights: {
      abdominalPain: 5,
      painOutOfProportion: 5,
      vomiting: 0,
      diarrhoea: 0,
      af: 2,
      collapse: 1,
      giBleed: 2,
      backRadiation: 0,
      severeConstantUpperAbdominalPain: 2,
      gallstoneContext: 1,
      guardingRigidity: 5,
      abdominalMovementPain: 4,
      rifPain: 4,
      migrationToRIF: 5,
      rifTenderness: 4,
      anorexia: 2,
      flankPain: 3,
      loinToGroinPain: 4,
      testicularPain: 4,
      perforationLanguage: 3,
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
      TIA: 2,
      Hypoglycaemia: 3,
      "UTI / urosepsis": 3,
      "Meningitis / encephalitis": 2,
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
      ruqPain: 6,
      abdominalPain: 2,
      jaundice: 6,
      fever: 2,
      rigors: 3,
      darkUrine: 2,
      paleStools: 2,
      pruritus: 2,
      gallstoneContext: 3,
      murphysSign: 3,
      localizedRuqTenderness: 3,
      persistentRuqPain: 3,
      postPrandialPain: 4,
      recurrentBiliaryPain: 4,
      wellBetweenEpisodes: 4,
      obstructiveJaundiceLanguage: 3,
      ibdContext: 2,
      fatigue: 2,
      dryEyesMouth: 2,
      chronicCourse: 2,
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
      unilateralTesticularPain: 6,
      suddenOnset: 2,
      vomiting: 1,
    },
    diagnosisWeights: {
      "Testicular torsion": 4,
    },
  },
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
