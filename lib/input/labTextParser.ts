import type { LabPanels } from "../domain/labs/labTypes";

type LabPanelKey = "fbc" | "ues" | "lfts" | "abg";

export type ParsedLabValue = {
  label: string;
  panel: LabPanelKey;
  field: string;
  value: number;
  raw: string;
};

export type LabTextParseResult = {
  labs: LabPanels;
  parsedValues: ParsedLabValue[];
  unparsedLines: string[];
  warnings: string[];
};

type LabAlias = {
  panel: LabPanelKey;
  field: string;
  label: string;
  patterns: RegExp[];
};

const LAB_ALIASES: LabAlias[] = [
  { panel: "fbc", field: "hb", label: "Hb", patterns: [/\bhb\b/i, /\bha?emoglobin\b/i] },
  { panel: "fbc", field: "wcc", label: "WCC", patterns: [/\bwcc\b/i, /\bwhite\s*(cell|blood)\s*count\b/i] },
  { panel: "fbc", field: "platelets", label: "Platelets", patterns: [/\bplt\b/i, /\bplatelets?\b/i] },
  { panel: "fbc", field: "mcv", label: "MCV", patterns: [/\bmcv\b/i] },
  { panel: "fbc", field: "mch", label: "MCH", patterns: [/\bmch\b/i] },
  { panel: "fbc", field: "mchc", label: "MCHC", patterns: [/\bmchc\b/i] },
  { panel: "fbc", field: "neutrophils", label: "Neutrophils", patterns: [/\bneuts?\b/i, /\bneutrophils?\b/i] },
  { panel: "fbc", field: "lymphocytes", label: "Lymphocytes", patterns: [/\blymphs?\b/i, /\blymphocytes?\b/i] },
  { panel: "fbc", field: "monocytes", label: "Monocytes", patterns: [/\bmonocytes?\b/i] },
  { panel: "fbc", field: "eosinophils", label: "Eosinophils", patterns: [/\beosinophils?\b/i] },
  { panel: "fbc", field: "basophils", label: "Basophils", patterns: [/\bbasophils?\b/i] },
  { panel: "fbc", field: "reticulocytes", label: "Reticulocytes", patterns: [/\bretics?\b/i, /\breticulocytes?\b/i] },
  { panel: "fbc", field: "pcv", label: "PCV", patterns: [/\bpcv\b/i] },
  { panel: "fbc", field: "esr", label: "ESR", patterns: [/\besr\b/i] },
  { panel: "fbc", field: "dDimer", label: "D-dimer", patterns: [/\bd-?\s*dimer\b/i] },
  { panel: "ues", field: "sodium", label: "Na", patterns: [/\bna\b/i, /\bsodium\b/i] },
  { panel: "ues", field: "potassium", label: "K", patterns: [/\bk\b/i, /\bpotassium\b/i] },
  { panel: "ues", field: "chloride", label: "Chloride", patterns: [/\bcl\b/i, /\bchloride\b/i] },
  { panel: "ues", field: "bicarbonate", label: "Bicarbonate", patterns: [/\bbicarbonate\b/i] },
  { panel: "ues", field: "urea", label: "Urea", patterns: [/\burea\b/i] },
  { panel: "ues", field: "creatinine", label: "Creatinine", patterns: [/\bcr\b/i, /\bcreatinine\b/i] },
  { panel: "ues", field: "egfr", label: "eGFR", patterns: [/\begfr\b/i] },
  { panel: "ues", field: "calcium", label: "Calcium", patterns: [/\bcalcium\b/i] },
  { panel: "ues", field: "magnesium", label: "Magnesium", patterns: [/\bmagnesium\b/i] },
  { panel: "ues", field: "phosphate", label: "Phosphate", patterns: [/\bphosphate\b/i] },
  { panel: "ues", field: "fastingGlucose", label: "Glucose", patterns: [/\bglucose\b/i, /\bfasting\s*glucose\b/i] },
  { panel: "lfts", field: "albumin", label: "Albumin", patterns: [/\balbumin\b/i] },
  { panel: "lfts", field: "alt", label: "ALT", patterns: [/\balt\b/i] },
  { panel: "lfts", field: "ast", label: "AST", patterns: [/\bast\b/i] },
  { panel: "lfts", field: "alp", label: "ALP", patterns: [/\balp\b/i] },
  { panel: "lfts", field: "bilirubin", label: "Bilirubin", patterns: [/\bbilirubin\b/i, /\bbili\b/i] },
  { panel: "lfts", field: "ggt", label: "GGT", patterns: [/\bggt\b/i] },
  { panel: "abg", field: "ph", label: "pH", patterns: [/\bph\b/i] },
  { panel: "abg", field: "pao2", label: "PaO2", patterns: [/\bpao2\b/i, /\bpa\s*o2\b/i] },
  { panel: "abg", field: "paco2", label: "PaCO2", patterns: [/\bpaco2\b/i, /\bpa\s*co2\b/i] },
  { panel: "abg", field: "bicarbonate", label: "HCO3", patterns: [/\bhco3\b/i, /\bhco3-\b/i] },
  { panel: "abg", field: "baseExcess", label: "Base excess", patterns: [/\bbe\b/i, /\bbase\s*excess\b/i] },
  { panel: "abg", field: "lactate", label: "Lactate", patterns: [/\blactate\b/i] },
];

function splitRows(text: string): string[] {
  return text
    .replaceAll("→", " ")
    .replaceAll("↑", " ")
    .replaceAll("↓", " ")
    .split(/\n|;|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findAlias(line: string): { alias: LabAlias; valueSearchText: string } | undefined {
  for (const alias of LAB_ALIASES) {
    for (const pattern of alias.patterns) {
      const match = line.match(pattern);

      if (match?.index !== undefined) {
        return {
          alias,
          valueSearchText: line.slice(match.index + match[0].length),
        };
      }
    }
  }

  return undefined;
}

function parseNumber(line: string): number | undefined {
  const match = line.match(/[-+]?\d+(?:\.\d+)?/);

  if (!match) {
    return undefined;
  }

  const value = Number(match[0]);

  return Number.isFinite(value) ? value : undefined;
}

function canonicalFieldKey(value: Pick<ParsedLabValue, "panel" | "field">): string {
  return `${value.panel}.${value.field}`;
}

function getExistingLabValue(labs: LabPanels | undefined, parsed: ParsedLabValue): number | undefined {
  const panel = labs?.[parsed.panel] as Record<string, number | undefined> | undefined;
  return panel?.[parsed.field];
}

function setLabValue(labs: LabPanels, parsed: ParsedLabValue): void {
  const panel = {
    ...(labs[parsed.panel] ?? {}),
  } as Record<string, number | undefined>;

  panel[parsed.field] = parsed.value;
  labs[parsed.panel] = panel;
}

export function mergeLabPanels(existing: LabPanels | undefined, incoming: LabPanels): LabPanels {
  return {
    ...existing,
    sex: existing?.sex ?? incoming.sex,
    fbc: { ...(incoming.fbc ?? {}), ...(existing?.fbc ?? {}) },
    ues: { ...(incoming.ues ?? {}), ...(existing?.ues ?? {}) },
    lfts: { ...(incoming.lfts ?? {}), ...(existing?.lfts ?? {}) },
    abg: { ...(incoming.abg ?? {}), ...(existing?.abg ?? {}) },
  };
}

export function parseLabText(text: string, existingLabs?: LabPanels): LabTextParseResult {
  const labs: LabPanels = {};
  const candidateValues: ParsedLabValue[] = [];
  const parsedValues: ParsedLabValue[] = [];
  const unparsedLines: string[] = [];
  const warnings: string[] = [];

  for (const row of splitRows(text)) {
    const aliasMatch = findAlias(row);
    const value = aliasMatch ? parseNumber(aliasMatch.valueSearchText) : undefined;

    if (!aliasMatch || value === undefined) {
      unparsedLines.push(row);
      continue;
    }

    const parsed = {
      label: aliasMatch.alias.label,
      panel: aliasMatch.alias.panel,
      field: aliasMatch.alias.field,
      value,
      raw: row,
    };

    candidateValues.push(parsed);
  }

  const groupedValues = candidateValues.reduce<Record<string, ParsedLabValue[]>>((groups, parsed) => {
    const key = canonicalFieldKey(parsed);
    groups[key] = [...(groups[key] ?? []), parsed];
    return groups;
  }, {});

  for (const values of Object.values(groupedValues)) {
    const firstValue = values[0];
    const uniqueValues = [...new Set(values.map((value) => value.value))];
    const existingValue = getExistingLabValue(existingLabs, firstValue);

    if (uniqueValues.length > 1) {
      warnings.push(
        `Conflicting ${firstValue.label} values detected: ${uniqueValues.join(" and ")}. Review manually.`,
      );
      continue;
    }

    if (existingValue !== undefined && existingValue !== firstValue.value) {
      warnings.push(
        `Conflicting ${firstValue.label} value detected: pasted ${firstValue.value} differs from existing ${existingValue}. Existing value preserved.`,
      );
      continue;
    }

    setLabValue(labs, firstValue);
    parsedValues.push(firstValue);
  }

  return {
    labs,
    parsedValues,
    unparsedLines,
    warnings,
  };
}
