export type WardBrainDifferential = string;
export type WardBrainRedFlag = string;
export type WardBrainNextStepGroup = string[];
export type PresentationFamily =
  | "chest-pain"
  | "headache"
  | "breathlessness-pleuritic-chest-pain"
  | "acute-abdominal-pain"
  | "confusion-delirium"
  | "hearing-loss"
  | "epistaxis"
  | "vertigo-dizziness"
  | "red-painful-eye"
  | "sudden-visual-loss"
  | "cellulitis-soft-tissue-infection"
  | "ruq-pain-jaundice"
  | "testicular-pain-scrotal-swelling";

export type ConditionPromotionStatus =
  | "live-engine"
  | "scaffold-only"
  | "learn-more"
  | "merged"
  | "excluded";

export interface WardBrainTriggerConfig {
  presentationTerms: string[];
  searchTerms: string[];
}

export interface WardBrainPresentationBlock {
  id: string;
  presentation: string;
  leadPattern: string;
  differentials: WardBrainDifferential[];
  featuresForLead: string[];
  featuresAgainstLead: string[];
  worstCaseToExclude: string[];
  redFlags: WardBrainRedFlag[];
  firstLineTests: WardBrainNextStepGroup;
  immediateActions: WardBrainNextStepGroup;
  escalation: string;
  outputStyle: string;
  sourceAnchor: string;
  learnMoreKey: string;
  triggers: WardBrainTriggerConfig;
}

export interface WardBrainBlockEmphasis {
  id: string;
  title: string;
  summary: string;
  highlightedDifferentials: string[];
}

export interface WardBrainPresentationBlockMatch {
  block: WardBrainPresentationBlock;
  emphasis?: WardBrainBlockEmphasis;
  score: number;
}

export interface WardBrainPresentationRoute {
  primaryFamily?: PresentationFamily;
  secondaryFamily?: PresentationFamily;
  confidence: number;
  reasons: string[];
}

export interface WardBrainConditionPromotionEntry {
  canonicalName: string;
  presentationFamilies: PresentationFamily[];
  promotionStatus: ConditionPromotionStatus;
  aliases: string[];
  notes?: string;
  sourceAnchor?: string;
  learnMoreKey?: string;
  mergedInto?: string;
}
