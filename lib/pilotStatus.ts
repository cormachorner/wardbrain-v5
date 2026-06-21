import { FAMILY_DIAGNOSIS_MAP } from "./domain/presentationFamilies";
import type { PresentationFamily } from "../types/wardbrain";

export type SupportedPresentationBlock = {
  id: PresentationFamily;
  label: string;
  status: "pilot-supported" | "scaffold";
  diagnoses: string[];
};

const PILOT_SUPPORTED_FAMILIES: PresentationFamily[] = [
  "acute-abdominal-pain",
  "breathlessness-pleuritic-chest-pain",
  "chest-pain",
  "confusion-delirium",
  "headache",
  "ruq-pain-jaundice",
  "testicular-pain-scrotal-swelling",
];

const FAMILY_LABELS: Record<PresentationFamily, string> = {
  "acute-abdominal-pain": "Acute abdominal pain",
  "breathlessness-pleuritic-chest-pain": "Breathlessness / pleuritic chest pain",
  "cellulitis-soft-tissue-infection": "Cellulitis / soft tissue infection",
  "chest-pain": "Chest pain",
  "confusion-delirium": "Confusion / delirium",
  epistaxis: "Epistaxis",
  "hearing-loss": "Hearing loss",
  headache: "Headache",
  "red-painful-eye": "Red painful eye",
  "ruq-pain-jaundice": "RUQ pain / jaundice",
  "sudden-visual-loss": "Sudden visual loss",
  "testicular-pain-scrotal-swelling": "Testicular pain / scrotal swelling",
  "vertigo-dizziness": "Vertigo / dizziness",
};

export const SUPPORTED_PRESENTATION_BLOCKS: SupportedPresentationBlock[] =
  PILOT_SUPPORTED_FAMILIES.map((id) => ({
    id,
    label: FAMILY_LABELS[id],
    status: "pilot-supported",
    diagnoses: FAMILY_DIAGNOSIS_MAP[id] ?? [],
  }));

export const PILOT_GATE_STATUS = {
  lastUpdated: "2026-06-21",
  testCommand: "npm test",
  testStatus: "passing",
  testCount: 350,
  lintCommand: "npm run lint",
  lintStatus: "passing",
  buildCommand: "npm run build",
  buildStatus: "passing",
} as const;

export function getSupportedPresentationBlock(id?: string) {
  return SUPPORTED_PRESENTATION_BLOCKS.find((block) => block.id === id);
}
