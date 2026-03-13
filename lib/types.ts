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
  suspectedDiagnosis: string;
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
  anchorWarning: string;
  presentation: string;
  detectedFeatures?: string[];
};
