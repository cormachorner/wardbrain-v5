import { interpretAbg } from "./interpretAbg";
import { interpretFbc } from "./interpretFbc";
import { interpretLfts } from "./interpretLfts";
import { interpretUes } from "./interpretUes";
import { detectLabSafetyWarnings } from "./labSafetyRules";
import { mergeLabInterpretations, type LabInterpretationResult, type LabPanels } from "./labTypes";

function hasPanelValues(panel: Record<string, unknown> | undefined): boolean {
  return Boolean(
    panel &&
      Object.entries(panel).some(
        ([key, value]) => !["oxygenContext", "fio2"].includes(key) && value !== undefined && value !== "",
      ),
  );
}

// This intentionally derives lab-only features and does not feed the diagnosis engine.
export function deriveLabFeatures(panels: LabPanels): LabInterpretationResult {
  const results: LabInterpretationResult[] = [];

  if (hasPanelValues(panels.fbc)) {
    results.push(interpretFbc(panels.fbc, panels.sex));
  }

  if (hasPanelValues(panels.ues)) {
    results.push(interpretUes(panels.ues));
  }

  if (hasPanelValues(panels.lfts)) {
    results.push(interpretLfts(panels.lfts));
  }

  if (hasPanelValues(panels.abg)) {
    results.push(interpretAbg(panels.abg));
  }

  const interpretation = mergeLabInterpretations(results);

  return {
    ...interpretation,
    safetyWarnings: detectLabSafetyWarnings(interpretation),
  };
}
