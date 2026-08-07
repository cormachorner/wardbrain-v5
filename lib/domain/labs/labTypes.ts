export type Sex = "male" | "female" | "unknown";

export type LabSeverity = "low" | "high" | "normal" | "invalid" | "missing";

export type LabRange = {
  min?: number;
  max?: number;
  unit: string;
};

export type SexSpecificLabRange = {
  male: LabRange;
  female: LabRange;
  unknown: LabRange;
};

export type LabValueAssessment = {
  test: string;
  value?: number;
  unit: string;
  status: LabSeverity;
  referenceRange: string;
  message: string;
};

export type LabSafetyWarning = {
  id: string;
  severity: "warning" | "urgent";
  title: string;
  explanation: string;
  triggerValues: Array<{
    test: string;
    value: number;
    unit: string;
    threshold: string;
  }>;
  recommendedNextStep?: string;
};

export type LabInterpretationResult = {
  features: string[];
  abnormalities: LabValueAssessment[];
  warnings: string[];
  explanations: string[];
  safetyWarnings: LabSafetyWarning[];
};

export type FbcPanel = {
  hb?: number;
  wcc?: number;
  platelets?: number;
  mcv?: number;
  mch?: number;
  mchc?: number;
  neutrophils?: number;
  lymphocytes?: number;
  monocytes?: number;
  eosinophils?: number;
  basophils?: number;
  reticulocytes?: number;
  pcv?: number;
  esr?: number;
  dDimer?: number;
};

export type UesPanel = {
  sodium?: number;
  potassium?: number;
  chloride?: number;
  bicarbonate?: number;
  urea?: number;
  creatinine?: number;
  calcium?: number;
  magnesium?: number;
  phosphate?: number;
  egfr?: number;
  fastingGlucose?: number;
};

export type LftsPanel = {
  albumin?: number;
  alt?: number;
  ast?: number;
  alp?: number;
  bilirubin?: number;
  ggt?: number;
};

export type AbgPanel = {
  ph?: number;
  pao2?: number;
  paco2?: number;
  bicarbonate?: number;
  baseExcess?: number;
  lactate?: number;
  oxygenContext?: "room_air" | "supplemental_oxygen" | "unknown";
  fio2?: number;
};

export type LabPanels = {
  sex?: Sex;
  fbc?: FbcPanel;
  ues?: UesPanel;
  lfts?: LftsPanel;
  abg?: AbgPanel;
};

export function emptyLabInterpretation(): LabInterpretationResult {
  return {
    features: [],
    abnormalities: [],
    warnings: [],
    explanations: [],
    safetyWarnings: [],
  };
}

export function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function mergeLabInterpretations(results: LabInterpretationResult[]): LabInterpretationResult {
  return {
    features: unique(results.flatMap((result) => result.features)),
    abnormalities: results.flatMap((result) => result.abnormalities),
    warnings: unique(results.flatMap((result) => result.warnings)),
    explanations: unique(results.flatMap((result) => result.explanations)),
    safetyWarnings: results.flatMap((result) => result.safetyWarnings),
  };
}

export function formatRange(range: LabRange): string {
  if (range.min !== undefined && range.max !== undefined) {
    return `${range.min}-${range.max} ${range.unit}`;
  }

  if (range.min !== undefined) {
    return `>${range.min} ${range.unit}`;
  }

  if (range.max !== undefined) {
    return `<${range.max} ${range.unit}`;
  }

  return range.unit;
}

export function isValidLabValue(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function assessValue(test: string, value: number | undefined, range: LabRange): LabValueAssessment {
  if (value === undefined) {
    return {
      test,
      unit: range.unit,
      status: "missing",
      referenceRange: formatRange(range),
      message: `${test} not provided.`,
    };
  }

  const rangeAllowsNegativeValues = range.min !== undefined && range.min < 0;

  if (typeof value !== "number" || !Number.isFinite(value) || (!rangeAllowsNegativeValues && value < 0)) {
    return {
      test,
      value,
      unit: range.unit,
      status: "invalid",
      referenceRange: formatRange(range),
      message: `${test} value is invalid.`,
    };
  }

  if (range.min !== undefined && value < range.min) {
    return {
      test,
      value,
      unit: range.unit,
      status: "low",
      referenceRange: formatRange(range),
      message: `${test} is below the educational reference range.`,
    };
  }

  if (range.max !== undefined && value > range.max) {
    return {
      test,
      value,
      unit: range.unit,
      status: "high",
      referenceRange: formatRange(range),
      message: `${test} is above the educational reference range.`,
    };
  }

  return {
    test,
    value,
    unit: range.unit,
    status: "normal",
    referenceRange: formatRange(range),
    message: `${test} is within the educational reference range.`,
  };
}

export function addFeature(features: string[], feature: string): void {
  if (!features.includes(feature)) {
    features.push(feature);
  }
}

export function addAbnormality(result: LabInterpretationResult, assessment: LabValueAssessment): void {
  if (assessment.status === "low" || assessment.status === "high" || assessment.status === "invalid") {
    result.abnormalities.push(assessment);
  }
}

export function addMissingWarnings(result: LabInterpretationResult, assessments: LabValueAssessment[]): void {
  for (const assessment of assessments) {
    if (assessment.status === "missing") {
      result.warnings.push(assessment.message);
    }
  }
}
