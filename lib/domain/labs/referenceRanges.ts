import type { LabRange, Sex, SexSpecificLabRange } from "./labTypes";

export const fbcReferenceRanges = {
  hb: {
    male: { min: 130, max: 170, unit: "g/L" },
    female: { min: 115, max: 155, unit: "g/L" },
    unknown: { min: 115, max: 170, unit: "g/L" },
  } satisfies SexSpecificLabRange,
  wcc: { min: 3.0, max: 10.0, unit: "x10^9/L" },
  platelets: { min: 150, max: 400, unit: "x10^9/L" },
  mcv: { min: 80, max: 96, unit: "fL" },
  mch: { min: 27, max: 33, unit: "pg" },
  mchc: { min: 320, max: 350, unit: "g/L" },
  neutrophils: { min: 2.0, max: 7.5, unit: "x10^9/L" },
  lymphocytes: { min: 1.5, max: 4.0, unit: "x10^9/L" },
  monocytes: { min: 0.2, max: 1.0, unit: "x10^9/L" },
  eosinophils: { min: 0, max: 0.4, unit: "x10^9/L" },
  basophils: { min: 0, max: 0.1, unit: "x10^9/L" },
  reticulocytes: { min: 25, max: 100, unit: "x10^9/L" },
  pcv: {
    male: { min: 0.4, max: 0.54, unit: "" },
    female: { min: 0.37, max: 0.5, unit: "" },
    unknown: { min: 0.37, max: 0.54, unit: "" },
  } satisfies SexSpecificLabRange,
  esr: { max: 20, unit: "mm/hr" },
  dDimer: { max: 0.5, unit: "mg/L" },
} as const satisfies Record<string, LabRange | SexSpecificLabRange>;

export const uesReferenceRanges = {
  sodium: { min: 135, max: 145, unit: "mmol/L" },
  potassium: { min: 3.5, max: 5.3, unit: "mmol/L" },
  chloride: { min: 95, max: 106, unit: "mmol/L" },
  bicarbonate: { min: 22, max: 29, unit: "mmol/L" },
  urea: { min: 2.5, max: 7.8, unit: "mmol/L" },
  creatinine: { min: 60, max: 120, unit: "umol/L" },
  calcium: { min: 2.2, max: 2.6, unit: "mmol/L" },
  magnesium: { min: 0.7, max: 1.0, unit: "mmol/L" },
  phosphate: { min: 0.8, max: 1.5, unit: "mmol/L" },
  egfr: { min: 60, unit: "mL/min/1.73m2" },
  fastingGlucose: { min: 3.5, max: 5.5, unit: "mmol/L" },
} as const satisfies Record<string, LabRange>;

export const lftsReferenceRanges = {
  albumin: { min: 35, max: 50, unit: "g/L" },
  alt: { min: 10, max: 50, unit: "U/L" },
  ast: { min: 10, max: 40, unit: "U/L" },
  alp: { min: 25, max: 115, unit: "U/L" },
  bilirubin: { max: 17, unit: "umol/L" },
  ggt: { min: 9, max: 40, unit: "U/L" },
} as const satisfies Record<string, LabRange>;

export const abgReferenceRanges = {
  ph: { min: 7.35, max: 7.45, unit: "" },
  pao2: { min: 11, max: 15, unit: "kPa" },
  paco2: { min: 4.6, max: 6.4, unit: "kPa" },
  bicarbonate: { min: 22, max: 30, unit: "mmol/L" },
  baseExcess: { min: -2, max: 2, unit: "mmol/L" },
  lactate: { max: 2.0, unit: "mmol/L" },
} as const satisfies Record<string, LabRange>;

export function getSexSpecificRange(range: SexSpecificLabRange, sex: Sex = "unknown"): LabRange {
  return range[sex] ?? range.unknown;
}

