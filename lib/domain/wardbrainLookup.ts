import type { CaseInput, ExtractedFeatures } from "../types";
import { extractFeatures } from "./featureExtractor";
import { getSearchTokens, normalizeText } from "./normalizeInput";
import { routePresentationFamilies, SCAFFOLD_FAMILY_MAP } from "./presentationFamilies";
import type {
  WardBrainBlockEmphasis,
  WardBrainPresentationBlock,
  WardBrainPresentationBlockMatch,
} from "../../types/wardbrain";

type BlockHintConfig = {
  features?: Record<string, number>;
  differentialHints?: Record<string, number>;
  subpatterns?: Array<{
    id: string;
    title: string;
    summary: string;
    highlightedDifferentials: string[];
    featureWeights?: Record<string, number>;
    differentialHints?: Record<string, number>;
    minimumScore?: number;
  }>;
};

const MIN_BROAD_FAMILY_TEXT_SCORE = 2;
const MIN_BROAD_FAMILY_HINT_SCORE = 5;
const MIN_SCAFFOLD_MATCH_SCORE = 5;

const BLOCK_HINTS: Record<string, BlockHintConfig> = {
  "chest-pain": {
    features: {
      chest_pain: 6,
      jaw_pain: 2,
      arm_pain: 2,
      sweating: 2,
      nausea: 1,
      indigestion_like_chest_pain: 3,
      abdominal_pain: 1,
      sob: 1,
      tearing_pain: 2,
      back_radiation: 1,
    },
    differentialHints: {
      "Acute coronary syndrome": 3,
      "Pulmonary embolism": 2,
      "Acute aortic syndrome": 2,
      Pneumothorax: 2,
    },
    subpatterns: [
      {
        id: "acs-oriented",
        title: "ACS-oriented emphasis",
        summary:
          "This chest pain pattern reads most strongly through an acute coronary syndrome lens, while still keeping other dangerous thoracic causes in view.",
        highlightedDifferentials: [
          "Acute coronary syndrome",
          "Pulmonary embolism",
          "Acute aortic syndrome",
        ],
        featureWeights: {
          chest_pain: 3,
          jaw_pain: 3,
          arm_pain: 3,
          sweating: 2,
          nausea: 1,
          indigestion_like_chest_pain: 4,
          abdominal_pain: 1,
        },
        differentialHints: {
          "Acute coronary syndrome": 4,
        },
        minimumScore: 7,
      },
      {
        id: "aortic-chest-pain",
        title: "Aortic chest pain emphasis",
        summary:
          "This chest pain pattern has a vascular-catastrophe flavour, so the scaffold should keep acute aortic pathology high rather than treat it as routine chest pain.",
        highlightedDifferentials: [
          "Acute aortic syndrome",
          "Acute coronary syndrome",
          "Pulmonary embolism",
        ],
        featureWeights: {
          sudden_onset: 2,
          tearing_pain: 4,
          back_radiation: 3,
          collapse: 2,
        },
        differentialHints: {
          "Acute aortic syndrome": 4,
        },
        minimumScore: 7,
      },
    ],
  },
  "confusion-delirium": {
    features: {
      confusion: 6,
      fever: 2,
      focal_neurology: 3,
      neck_stiffness: 3,
    },
    differentialHints: {
      Sepsis: 2,
      "Stroke / neurological emergency": 3,
      "Meningitis / encephalitis": 3,
      "Delirium secondary to infection": 2,
    },
  },
  "acute-abdominal-pain": {
    features: {
      abdominal_pain: 7,
      sudden_onset: 3,
      vomiting: 2,
      collapse: 2,
      hypotension: 2,
      pain_out_of_proportion: 6,
      af: 5,
      alcohol_excess: 3,
      binge_drinking: 2,
      back_radiation: 2,
      severe_constant_upper_abdominal_pain: 3,
      gallstone_context: 2,
      guarding_rigidity: 4,
      abdominal_movement_pain: 3,
      perforation_language: 4,
    },
    differentialHints: {
      "Mesenteric ischaemia": 5,
      "Abdominal aortic aneurysm": 3,
      "Acute pancreatitis": 4,
      "Perforated viscus": 4,
      "GI bleed": 2,
      Gastroenteritis: 1,
    },
    subpatterns: [
      {
        id: "vascular-abdominal-emergency",
        title: "Vascular abdominal emergency emphasis",
        summary:
          "This abdominal pain pattern has vascular red-flag features, so the scaffold should be read through a mesenteric ischaemia / vascular catastrophe lens rather than a routine pancreatitis pathway.",
        highlightedDifferentials: [
          "Mesenteric ischaemia",
          "Abdominal aortic aneurysm",
          "Perforated viscus",
        ],
        featureWeights: {
          pain_out_of_proportion: 6,
          af: 5,
          sudden_onset: 3,
          collapse: 3,
          hypotension: 3,
          vomiting: 1,
        },
        differentialHints: {
          "Mesenteric ischaemia": 6,
          "Abdominal aortic aneurysm": 3,
        },
        minimumScore: 8,
      },
      {
        id: "pancreatitis-perforation",
        title: "Pancreatitis / perforation emphasis",
        summary:
          "This abdominal pain pattern fits the default acute abdominal pain teaching scaffold, with pancreatitis or perforation-style causes more in the foreground.",
        highlightedDifferentials: [
          "Acute pancreatitis",
          "Perforated viscus",
          "Biliary / hepatobiliary emergency",
        ],
        featureWeights: {
          abdominal_pain: 2,
          vomiting: 2,
          alcohol_excess: 4,
          binge_drinking: 3,
          back_radiation: 2,
          gallstone_context: 2,
          severe_constant_upper_abdominal_pain: 3,
          guarding_rigidity: 2,
          abdominal_movement_pain: 2,
          perforation_language: 3,
        },
        differentialHints: {
          "Acute pancreatitis": 4,
          "Perforated viscus": 4,
        },
        minimumScore: 5,
      },
    ],
  },
  headache: {
    features: {
      headache: 6,
      thunderclap: 5,
      vomiting: 1,
      neck_stiffness: 2,
      photophobia: 2,
      focal_neurology: 2,
    },
    differentialHints: {
      "Subarachnoid haemorrhage": 3,
      Migraine: 2,
      "Meningitis / encephalitis": 2,
    },
    subpatterns: [
      {
        id: "sah-oriented",
        title: "Thunderclap / SAH emphasis",
        summary:
          "This headache pattern is being framed through a thunderclap-secondary-headache lens rather than a primary headache scaffold.",
        highlightedDifferentials: [
          "Subarachnoid haemorrhage",
          "Meningitis / encephalitis",
          "Stroke / neurological emergency",
        ],
        featureWeights: {
          thunderclap: 6,
          vomiting: 1,
          collapse: 2,
          neck_stiffness: 2,
        },
        differentialHints: {
          "Subarachnoid haemorrhage": 4,
        },
        minimumScore: 8,
      },
    ],
  },
  "breathlessness-pleuritic-chest-pain": {
    features: {
      sob: 6,
      pleuritic_pain: 4,
      hypoxia: 3,
      tachypnoea: 2,
      tachycardia: 2,
      unilateral_reduced_air_entry: 2,
      haemoptysis: 2,
      wheeze: 3,
      known_asthma: 3,
      increased_inhaler_use: 3,
      difficulty_speaking: 2,
    },
    differentialHints: {
      "Pulmonary embolism": 3,
      Pneumothorax: 3,
      Pneumonia: 2,
      "Asthma exacerbation": 3,
    },
    subpatterns: [
      {
        id: "pe-oriented",
        title: "PE-oriented emphasis",
        summary:
          "This pleuro-respiratory pattern is leaning toward PE, so the scaffold should foreground VTE risk and physiological instability rather than a generic respiratory split.",
        highlightedDifferentials: [
          "Pulmonary embolism",
          "Pneumothorax",
          "Pneumonia",
        ],
        featureWeights: {
          pleuritic_pain: 3,
          sob: 2,
          tachycardia: 2,
          tachypnoea: 2,
          hypoxia: 2,
          haemoptysis: 2,
        },
        differentialHints: {
          "Pulmonary embolism": 4,
        },
        minimumScore: 8,
      },
      {
        id: "pneumothorax-oriented",
        title: "Pneumothorax-oriented emphasis",
        summary:
          "This pleuro-respiratory pattern has stronger unilateral chest signs, so the scaffold should be read through a pneumothorax lens.",
        highlightedDifferentials: [
          "Pneumothorax",
          "Pulmonary embolism",
          "Pneumonia",
        ],
        featureWeights: {
          pleuritic_pain: 2,
          sudden_onset: 2,
          unilateral_reduced_air_entry: 5,
          tall_thin_habitus: 2,
          trauma: 2,
        },
        differentialHints: {
          Pneumothorax: 4,
        },
        minimumScore: 8,
      },
      {
        id: "asthma-oriented",
        title: "Asthma-oriented emphasis",
        summary:
          "This breathlessness pattern has obstructive-airways features, so the scaffold should foreground asthma before forcing a pleural or thromboembolic explanation.",
        highlightedDifferentials: [
          "Asthma exacerbation",
          "Pneumonia",
          "Pulmonary embolism",
        ],
        featureWeights: {
          sob: 2,
          wheeze: 4,
          known_asthma: 4,
          increased_inhaler_use: 3,
          difficulty_speaking: 3,
          recent_infection: 1,
        },
        differentialHints: {
          "Asthma exacerbation": 5,
        },
        minimumScore: 9,
      },
    ],
  },
  "ruq-pain-jaundice": {
    features: {
      ruq_pain: 6,
      jaundice: 6,
      fever: 2,
      rigors: 3,
      dark_urine: 2,
      pale_stools: 2,
      pruritus: 2,
      gallstone_context: 3,
      murphys_sign: 4,
      localized_ruq_tenderness: 3,
      persistent_ruq_pain: 3,
      post_prandial_pain: 4,
      recurrent_biliary_pain: 4,
      well_between_episodes: 4,
      obstructive_jaundice_language: 4,
      fatigue: 2,
      dry_eyes_mouth: 2,
      chronic_course: 2,
      ibd_context: 3,
      hypotension: 2,
      confusion: 2,
    },
    differentialHints: {
      "Acute cholangitis": 4,
      "Acute cholecystitis": 3,
      "Choledocholithiasis / obstructive jaundice": 3,
      "Biliary colic / gallstone disease": 2,
      "Primary sclerosing cholangitis": 1,
      "Primary biliary cholangitis": 1,
    },
    subpatterns: [
      {
        id: "cholangitis-oriented",
        title: "Acute cholangitis emphasis",
        summary:
          "This RUQ / jaundice pattern has infective-obstructive features, so the scaffold should foreground acute cholangitis and urgent biliary source-control thinking.",
        highlightedDifferentials: [
          "Acute cholangitis",
          "Choledocholithiasis / obstructive jaundice",
          "Acute cholecystitis",
        ],
        featureWeights: {
          ruq_pain: 3,
          jaundice: 4,
          fever: 3,
          rigors: 3,
          dark_urine: 1,
          pale_stools: 1,
          hypotension: 2,
          confusion: 2,
        },
        differentialHints: {
          "Acute cholangitis": 5,
        },
        minimumScore: 9,
      },
      {
        id: "cholecystitis-oriented",
        title: "Acute cholecystitis emphasis",
        summary:
          "This RUQ pain pattern looks more gallbladder-inflammation dominant than jaundice-dominant, so the scaffold should foreground acute cholecystitis and gallstone disease.",
        highlightedDifferentials: [
          "Acute cholecystitis",
          "Biliary colic / gallstone disease",
          "Acute cholangitis",
        ],
        featureWeights: {
          ruq_pain: 3,
          murphys_sign: 5,
          fever: 2,
          nausea: 1,
          vomiting: 1,
          gallstone_context: 2,
          post_prandial_pain: 2,
        },
        differentialHints: {
          "Acute cholecystitis": 5,
        },
        minimumScore: 8,
      },
      {
        id: "biliary-colic-oriented",
        title: "Biliary colic emphasis",
        summary:
          "This pattern looks recurrent and meal-triggered rather than septic, so the scaffold should foreground biliary colic and symptomatic gallstone disease.",
        highlightedDifferentials: [
          "Biliary colic / gallstone disease",
          "Acute cholecystitis",
          "Choledocholithiasis / obstructive jaundice",
        ],
        featureWeights: {
          ruq_pain: 2,
          post_prandial_pain: 4,
          recurrent_biliary_pain: 4,
          well_between_episodes: 5,
          gallstone_context: 3,
        },
        differentialHints: {
          "Biliary colic / gallstone disease": 5,
        },
        minimumScore: 9,
      },
      {
        id: "obstructive-jaundice-oriented",
        title: "Obstructive jaundice emphasis",
        summary:
          "This pattern is more cholestatic than septic, so the scaffold should foreground bile-duct obstruction and gallstone-related jaundice rather than jump straight to sepsis.",
        highlightedDifferentials: [
          "Choledocholithiasis / obstructive jaundice",
          "Acute cholangitis",
          "Biliary colic / gallstone disease",
        ],
        featureWeights: {
          jaundice: 3,
          dark_urine: 3,
          pale_stools: 3,
          pruritus: 1,
          obstructive_jaundice_language: 4,
          gallstone_context: 2,
        },
        differentialHints: {
          "Choledocholithiasis / obstructive jaundice": 5,
        },
        minimumScore: 8,
      },
      {
        id: "chronic-cholestatic-oriented",
        title: "Chronic cholestatic emphasis",
        summary:
          "This pattern has chronic cholestatic features rather than an acute septic picture, so the scaffold should keep PSC and PBC in view as educational comparators.",
        highlightedDifferentials: [
          "Primary sclerosing cholangitis",
          "Primary biliary cholangitis",
          "Choledocholithiasis / obstructive jaundice",
        ],
        featureWeights: {
          pruritus: 3,
          fatigue: 3,
          dry_eyes_mouth: 3,
          chronic_course: 3,
          ibd_context: 4,
          jaundice: 1,
        },
        differentialHints: {
          "Primary sclerosing cholangitis": 4,
          "Primary biliary cholangitis": 4,
        },
        minimumScore: 8,
      },
    ],
  },
};

function getCaseSearchText(input: CaseInput): string {
  return [
    input.presentingComplaint,
    input.history,
    input.keyPositives,
    input.keyNegatives,
    input.observations,
    input.pmh,
    input.social,
  ]
    .filter(Boolean)
    .join(" ");
}

export function getAllSearchTerms(block: WardBrainPresentationBlock): string[] {
  return [
    block.presentation,
    ...block.triggers.presentationTerms,
    ...block.triggers.searchTerms,
  ];
}

export function getPresentationBlockById(
  id: string,
  blocks: WardBrainPresentationBlock[],
): WardBrainPresentationBlock | undefined {
  return blocks.find((block) => block.id === id);
}

function scoreTermMatch(query: string, block: WardBrainPresentationBlock): number {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const queryTokens = new Set(getSearchTokens(query));
  let bestScore = 0;

  for (const term of getAllSearchTerms(block)) {
    const normalizedTerm = normalizeText(term);

    if (!normalizedTerm) {
      continue;
    }

    if (normalizedTerm === normalizedQuery) {
      return 1000;
    }

    if (normalizedTerm.includes(normalizedQuery) || normalizedQuery.includes(normalizedTerm)) {
      bestScore = Math.max(bestScore, 500);
    }

    const sharedTokens = getSearchTokens(term).filter((token) => queryTokens.has(token)).length;
    bestScore = Math.max(bestScore, sharedTokens);
  }

  return bestScore;
}

function scoreFeatureHints(
  blockId: string,
  features: ExtractedFeatures,
  differentialNames: string[],
): number {
  const hints = BLOCK_HINTS[blockId];

  if (!hints) {
    return 0;
  }

  let score = 0;

  for (const [feature, weight] of Object.entries(hints.features ?? {})) {
    if (features.matchedFeatures.includes(feature)) {
      score += weight;
    }
  }

  for (const [differential, weight] of Object.entries(hints.differentialHints ?? {})) {
    if (differentialNames.includes(differential)) {
      score += weight;
    }
  }

  return score;
}

function selectBlockEmphasis(
  blockId: string,
  features: ExtractedFeatures,
  differentialNames: string[],
): WardBrainBlockEmphasis | undefined {
  const subpatterns = BLOCK_HINTS[blockId]?.subpatterns ?? [];
  const rankedSubpatterns = subpatterns
    .map((subpattern) => {
      let score = 0;

      for (const [feature, weight] of Object.entries(subpattern.featureWeights ?? {})) {
        if (features.matchedFeatures.includes(feature)) {
          score += weight;
        }
      }

      for (const [differential, weight] of Object.entries(subpattern.differentialHints ?? {})) {
        if (differentialNames.includes(differential)) {
          score += weight;
        }
      }

      return { subpattern, score };
    })
    .filter(({ subpattern, score }) => score >= (subpattern.minimumScore ?? 1))
    .sort((left, right) => right.score - left.score);

  return rankedSubpatterns[0]?.subpattern;
}

export function matchPresentationBlock(
  input: string,
  blocks: WardBrainPresentationBlock[],
): WardBrainPresentationBlock | undefined {
  const normalizedInput = normalizeText(input);

  if (!normalizedInput) {
    return undefined;
  }

  const rankedMatches = blocks
    .map((block) => ({ block, score: scoreTermMatch(normalizedInput, block) }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  return rankedMatches[0]?.block;
}

export function matchPresentationBlockForCase(
  input: CaseInput,
  blocks: WardBrainPresentationBlock[],
  differentialNames: string[] = [],
): WardBrainPresentationBlockMatch | undefined {
  const caseSearchText = getCaseSearchText(input);
  const normalizedCaseSearchText = normalizeText(caseSearchText);

  if (!normalizedCaseSearchText) {
    return undefined;
  }

  const features = extractFeatures(input);
  const familyRoute = routePresentationFamilies(caseSearchText, features, differentialNames);
  const allowedFamilies = [
    familyRoute.primaryFamily,
    familyRoute.secondaryFamily,
  ].filter(Boolean);
  const rankedMatches = blocks
    .map((block) => {
      const textScore = scoreTermMatch(caseSearchText, block);
      const featureScore = scoreFeatureHints(block.id, features, differentialNames);
      const blockFamily = SCAFFOLD_FAMILY_MAP[block.id];
      const familyBonus =
        allowedFamilies.length === 0
          ? 0
          : blockFamily === familyRoute.primaryFamily
            ? 5
            : blockFamily === familyRoute.secondaryFamily
              ? 2
              : -10;

      return {
        block,
        textScore,
        featureScore,
        score: textScore + featureScore + familyBonus,
      };
    })
    .filter(
      (candidate) =>
        candidate.score >= MIN_SCAFFOLD_MATCH_SCORE &&
        (allowedFamilies.length === 0 ||
          allowedFamilies.includes(SCAFFOLD_FAMILY_MAP[candidate.block.id])) &&
        (candidate.textScore >= MIN_BROAD_FAMILY_TEXT_SCORE ||
          candidate.featureScore >= MIN_BROAD_FAMILY_HINT_SCORE),
    )
    .sort((left, right) => right.score - left.score);

  const bestMatch = rankedMatches[0];

  if (!bestMatch) {
    return undefined;
  }

  return {
    block: bestMatch.block,
    emphasis: selectBlockEmphasis(bestMatch.block.id, features, differentialNames),
    score: bestMatch.score,
  };
}
