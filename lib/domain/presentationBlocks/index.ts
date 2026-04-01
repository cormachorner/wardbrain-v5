import type { DiagnosisDefinition } from "../../types";
import {
  acuteAbdominalPainDeferredSecondPass,
  acuteAbdominalPainDiagnoses,
  acuteAbdominalPainFeatureVocabulary,
} from "./acuteAbdominalPain";

export const PRESENTATION_BLOCK_DIAGNOSIS_REGISTRY = {
  acute_abdominal_pain: acuteAbdominalPainDiagnoses,
} as const satisfies Record<string, DiagnosisDefinition[]>;

export const PRESENTATION_BLOCK_FEATURE_VOCABULARIES = {
  acute_abdominal_pain: acuteAbdominalPainFeatureVocabulary,
} as const;

export const ALL_PRESENTATION_BLOCK_FEATURES = [
  ...new Set(Object.values(PRESENTATION_BLOCK_FEATURE_VOCABULARIES).flatMap((groups) => Object.values(groups).flat())),
];

export const PRESENTATION_BLOCK_DEFERRED_DIAGNOSES = {
  acute_abdominal_pain: acuteAbdominalPainDeferredSecondPass,
} as const;

export const ALL_PRESENTATION_BLOCK_DIAGNOSES = Object.values(
  PRESENTATION_BLOCK_DIAGNOSIS_REGISTRY,
).flat();

export function getDiagnosisDefinitionsForPresentationBlock(blockId: string): DiagnosisDefinition[] {
  return PRESENTATION_BLOCK_DIAGNOSIS_REGISTRY[blockId as keyof typeof PRESENTATION_BLOCK_DIAGNOSIS_REGISTRY] ?? [];
}

export function findDiagnosisDefinition(term: string): DiagnosisDefinition | undefined {
  const normalised = term.trim().toLowerCase();

  if (!normalised) {
    return undefined;
  }

  return ALL_PRESENTATION_BLOCK_DIAGNOSES.find(
    (definition) =>
      definition.id.toLowerCase() === normalised || definition.name.toLowerCase() === normalised,
  );
}
