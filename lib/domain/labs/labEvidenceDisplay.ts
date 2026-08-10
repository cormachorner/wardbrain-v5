export type LabEvidenceDisplay = {
  delta?: number;
  feature: string;
  explanation: string;
};

function formatSlug(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

export function isLabEvidenceReason(reason: string) {
  return reason.startsWith("Lab:");
}

export function parseLabEvidenceReason(reason: string): LabEvidenceDisplay {
  const match = reason.match(/^Lab:\s*\+(\d+)\s+(.+?)\s+-\s+(.+)$/);

  if (!match) {
    return {
      feature: "Laboratory evidence",
      explanation: reason.replace(/^Lab:\s*/, ""),
    };
  }

  return {
    delta: Number(match[1]),
    feature: formatSlug(match[2]),
    explanation: match[3],
  };
}

export function formatLabEvidenceForUser(reason: LabEvidenceDisplay): string {
  return `${reason.feature}: ${reason.explanation}`;
}
