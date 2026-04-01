import type { WardBrainPresentationBlockMatch } from "../../types/wardbrain";

export type CaseInput = {
  age: string;
  sex: string;
  presentingComplaint: string;
  history: string;
  pmh: string;
  meds: string;
  social: string;
  keyPositives: string;
  keyNegatives: string;
  observations: string;
  leadDiagnosis?: string;
  otherDifferentials?: string;
  dangerousDiagnoses?: string;
  suspectedDiagnosis?: string;
};

export type ExtractedFeatures = {
  allText: string;
  matchedFeatures: string[];
};

export type RedFlag = {
  name: string;
  explanation: string;
  boostDiagnoses: string[];
  sourceBody?: "NICE" | "GMC" | "HSCNI";
  sourceId?: string;
  sourceCoverage?: "full" | "partial" | "gap";
};

export type DifferentialResult = {
  name: string;
  score: number;
  reasonsFor: string[];
  reasonsAgainst: string[];
};

export type NextStepsRule = {
  diagnosis: string;
  sourceBody?: "NICE" | "GMC" | "HSCNI";
  sourceId?: string;
  sourceCoverage?: "full" | "partial" | "gap";
  investigations: string[];
  immediateNextSteps: string[];
  notes: string[];
};

export type DiagnosisBoost = {
  diagnosis: string;
  reason: string;
  points: number;
};

export type FeatureWeightMap = Record<string, number>;

export type SignatureGate = {
  features: string[];
  threshold: number;
  cappedScore?: number;
};

export type DiagnosisDefinition = {
  id: string;
  name: string;
  presentationBlocks: string[];
  summary?: string;
  features: {
    core: string[];
    discriminating: string[];
    weak?: string[];
    against?: string[];
    exclusions?: string[];
    riskFactors?: string[];
  };
  logic?: {
    boosts?: Array<{
      ifAll?: string[];
      ifAny?: string[];
      add: number;
      reason: string;
    }>;
    penalties?: Array<{
      ifAll?: string[];
      ifAny?: string[];
      subtract: number;
      reason: string;
    }>;
    escalationRules?: Array<{
      ifAll?: string[];
      ifAny?: string[];
      add: number;
      reason: string;
    }>;
  };
  relationships?: {
    commonMimics?: string[];
    patternTags?: string[];
    redFlagTags?: string[];
  };
  language?: {
    featureSynonyms?: Record<string, string[]>;
  };
  teaching?: {
    keyPearls?: string[];
    classicPitfalls?: string[];
  };
  sourceNotes?: string[];
};

export type AnalysisResult = {
  problemRepresentation: string;
  redFlags: RedFlag[];
  differentials: DifferentialResult[];
  nextSteps?: NextStepsRule;
  fitCheck: {
    label: "Strong fit" | "Partial fit" | "Weak fit" | "No diagnosis entered";
    summary: string;
    supporting: string[];
    conflicting: string[];
  };
  reasoningComparison: {
    leadAssessment: string;
    differentialAssessment: string;
    dangerAssessment: string;
  };
  anchorWarning: string;
  presentation: string;
  detectedFeatures?: string[];
};

export type AnalyzeCaseResponse = AnalysisResult & {
  detectedFeatures: string[];
  matchedPresentationBlock: WardBrainPresentationBlockMatch | null;
};
