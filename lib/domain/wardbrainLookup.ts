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
      chestPain: 6,
      jawPain: 2,
      armPain: 2,
      sweating: 2,
      nausea: 1,
      indigestionLikeChestPain: 3,
      abdominalPain: 1,
      sob: 1,
      tearingPain: 2,
      backRadiation: 1,
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
          chestPain: 3,
          jawPain: 3,
          armPain: 3,
          sweating: 2,
          nausea: 1,
          indigestionLikeChestPain: 4,
          abdominalPain: 1,
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
          suddenOnset: 2,
          tearingPain: 4,
          backRadiation: 3,
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
      focalNeurology: 3,
      neckStiffness: 3,
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
      abdominalPain: 7,
      suddenOnset: 3,
      vomiting: 2,
      collapse: 2,
      hypotension: 2,
      painOutOfProportion: 6,
      af: 5,
      alcoholExcess: 3,
      bingeDrinking: 2,
      backRadiation: 2,
      severeConstantUpperAbdominalPain: 3,
      gallstoneContext: 2,
      guardingRigidity: 4,
      abdominalMovementPain: 3,
      perforationLanguage: 4,
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
          painOutOfProportion: 6,
          af: 5,
          suddenOnset: 3,
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
          abdominalPain: 2,
          vomiting: 2,
          alcoholExcess: 4,
          bingeDrinking: 3,
          backRadiation: 2,
          gallstoneContext: 2,
          severeConstantUpperAbdominalPain: 3,
          guardingRigidity: 2,
          abdominalMovementPain: 2,
          perforationLanguage: 3,
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
      neckStiffness: 2,
      photophobia: 2,
      focalNeurology: 2,
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
          neckStiffness: 2,
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
      pleuriticPain: 4,
      hypoxia: 3,
      tachypnoea: 2,
      tachycardia: 2,
      unilateralReducedAirEntry: 2,
      haemoptysis: 2,
      wheeze: 3,
      knownAsthma: 3,
      increasedInhalerUse: 3,
      difficultySpeaking: 2,
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
          pleuriticPain: 3,
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
          pleuriticPain: 2,
          suddenOnset: 2,
          unilateralReducedAirEntry: 5,
          tallThinHabitus: 2,
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
          knownAsthma: 4,
          increasedInhalerUse: 3,
          difficultySpeaking: 3,
          recentInfection: 1,
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
      ruqPain: 6,
      jaundice: 6,
      fever: 2,
      rigors: 3,
      darkUrine: 2,
      paleStools: 2,
      pruritus: 2,
      gallstoneContext: 3,
      murphysSign: 4,
      localizedRuqTenderness: 3,
      persistentRuqPain: 3,
      postPrandialPain: 4,
      recurrentBiliaryPain: 4,
      wellBetweenEpisodes: 4,
      obstructiveJaundiceLanguage: 4,
      fatigue: 2,
      dryEyesMouth: 2,
      chronicCourse: 2,
      ibdContext: 3,
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
          ruqPain: 3,
          jaundice: 4,
          fever: 3,
          rigors: 3,
          darkUrine: 1,
          paleStools: 1,
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
          ruqPain: 3,
          murphysSign: 5,
          fever: 2,
          nausea: 1,
          vomiting: 1,
          gallstoneContext: 2,
          postPrandialPain: 2,
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
          ruqPain: 2,
          postPrandialPain: 4,
          recurrentBiliaryPain: 4,
          wellBetweenEpisodes: 5,
          gallstoneContext: 3,
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
          darkUrine: 3,
          paleStools: 3,
          pruritus: 1,
          obstructiveJaundiceLanguage: 4,
          gallstoneContext: 2,
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
          dryEyesMouth: 3,
          chronicCourse: 3,
          ibdContext: 4,
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
