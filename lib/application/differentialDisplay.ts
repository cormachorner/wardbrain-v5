import type { AnalyzeCaseResponse } from "../types";

export function shouldSuppressDifferentialDisplay(result: AnalyzeCaseResponse) {
  const leadDiagnosis = result.differentials[0];

  return result.uncertainty.level === "high" &&
    (
      result.differentials.length === 0 ||
      result.uncertainty.summary.includes("does not yet have enough") ||
      (
        (leadDiagnosis?.score ?? 0) <= 3 &&
        result.uncertainty.reasons.some((reason) =>
          /limited positive support|small number of usable clinical features|display threshold|does not strongly fit/i.test(reason),
        )
      )
    );
}
