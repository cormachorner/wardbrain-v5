import type { LabInterpretationResult, LabPanels } from "./labTypes";
import { parseLabText } from "../../input/labTextParser";

type Finding = { feature: string; panel: "fbc" | "ues" | "lfts"; fields: string[]; label: string; pattern: RegExp };
const raised = "(?:(?:mildly|moderately|markedly|slightly)\\s+)?(?:raised|elevated|high|increased)";
const findings: Finding[] = [
  { feature: "raised_alt", panel: "lfts", fields: ["alt", "ast"], label: "ALT / transaminases raised", pattern: new RegExp(`\\b(?:(?:alt|transaminases?)(?:\\s*(?:[/&]|and)\\s*(?:alt|transaminases?))?\\s+(?:are\\s+|is\\s+)?${raised}|${raised}\\s+(?:alt|transaminases?))\\b`, "i") },
  { feature: "raised_bilirubin", panel: "lfts", fields: ["bilirubin"], label: "Bilirubin raised", pattern: new RegExp(`\\b(?:bilirubin\\s+(?:is\\s+)?${raised}|${raised}\\s+bilirubin)\\b`, "i") },
  ...["alp", "ggt"].map((test): Finding => ({ feature: `raised_${test}`, panel: "lfts", fields: [test], label: `${test.toUpperCase()} raised`, pattern: new RegExp(`\\b(?:${test}(?:\\s*(?:[/&]|and)\\s*(?:alp|ggt))?\\s+(?:is\\s+|are\\s+)?${raised}|${raised}\\s+(?:alp\\s*(?:[/&]|and)\\s*)?${test})\\b`, "i") })),
  { feature: "leucocytosis", panel: "fbc", fields: ["wcc"], label: "WCC raised", pattern: new RegExp(`\\b(?:wcc\\s+(?:is\\s+)?${raised}|${raised}\\s+wcc|leu[ck]ocytosis)\\b`, "i") },
  { feature: "anaemia", panel: "fbc", fields: ["hb"], label: "Hb low / anaemia", pattern: /\b(?:hb\s+(?:is\s+)?low|low\s+hb|ana?emia)\b/i },
  { feature: "raised_creatinine", panel: "ues", fields: ["creatinine"], label: "Creatinine raised", pattern: new RegExp(`\\b(?:creatinine\\s+(?:is\\s+)?${raised}|${raised}\\s+creatinine)\\b`, "i") },
  { feature: "hyperglycaemia_lab", panel: "ues", fields: ["fastingGlucose"], label: "Glucose raised", pattern: new RegExp(`\\b(?:glucose\\s+(?:is\\s+)?${raised}|${raised}\\s+(?:blood\\s+)?glucose|hyperglyc[ae]emia|hyperglycaemia)\\b`, "i") },
];

// Qualitative evidence carries no fabricated value, reference range or severity.
export function addQualitativeLabFindings(result: LabInterpretationResult, panels: LabPanels, text: string): LabInterpretationResult {
  const narrativeNumbers = parseLabText(text).labs;
  const detected = findings.filter((finding) => {
    if (finding.fields.some((field) =>
      (panels[finding.panel] as Record<string, unknown> | undefined)?.[field] !== undefined ||
      (narrativeNumbers[finding.panel] as Record<string, unknown> | undefined)?.[field] !== undefined)) return false;
    return text.split(/[.;!\n]/).some((clause) => {
      const match = finding.pattern.exec(clause);
      if (!match) return false;
      const before = clause.slice(0, match.index).split(/,|\bbut\b|\bhowever\b/i).at(-1) ?? "";
      const after = clause.slice(match.index + match[0].length);
      return !/\b(?:no|not|denies|without|normal|previous|history of|possible|suspected|if)\b[^;]*$/i.test(before) &&
        !/^\s*(?:is\s+)?(?:absent|excluded|ruled out|not present)\b/i.test(after);
    });
  });
  if (!detected.length) return result;
  const qualitativeFeatures = detected.map((finding) => finding.feature);
  return {
    ...result,
    features: [...new Set([...result.features, ...qualitativeFeatures])],
    qualitativeFeatures,
    explanations: [...result.explanations, ...detected.map((finding) => `${finding.label}: reported qualitatively; obtain the numeric result to assess magnitude.`)],
  };
}
