import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { analyzeCase } from "../lib/application/analyzeCase";
import type { AnalyzeCaseResponse, DifferentialResult } from "../lib/types";
import { labWorkflowQaCases } from "../tests/fixtures/labWorkflowQaCases";

type LabWorkflowQaResult = {
  id: string;
  title: string;
  leadBefore: string;
  leadAfter: string;
  top3Before: string[];
  top3After: string[];
  scoreChanges: Array<{
    diagnosis: string;
    before?: number;
    after?: number;
    delta: number;
    rankBefore: number | null;
    rankAfter: number | null;
  }>;
  labModifierTraces: NonNullable<AnalyzeCaseResponse["labDiagnosisModifiers"]>;
  labSafetyWarnings: string[];
  labFeatures: string[];
  labAbnormalities: Array<{
    test: string;
    value?: number;
    unit: string;
    status: string;
    referenceRange: string;
  }>;
  unexpectedMovements: string[];
  notes: string;
};

function top3(result: AnalyzeCaseResponse): string[] {
  return result.differentials.slice(0, 3).map((differential) => differential.name);
}

function rankOf(result: AnalyzeCaseResponse, diagnosis: string): number | null {
  const index = result.differentials.findIndex((differential) => differential.name === diagnosis);
  return index === -1 ? null : index + 1;
}

function scoreMap(result: AnalyzeCaseResponse): Map<string, DifferentialResult> {
  return new Map(result.differentials.map((differential) => [differential.name, differential]));
}

function scoreChanges(before: AnalyzeCaseResponse, after: AnalyzeCaseResponse) {
  const beforeScores = scoreMap(before);
  const afterScores = scoreMap(after);
  const diagnoses = new Set([...beforeScores.keys(), ...afterScores.keys()]);

  return [...diagnoses]
    .map((diagnosis) => {
      const beforeScore = beforeScores.get(diagnosis)?.score;
      const afterScore = afterScores.get(diagnosis)?.score;

      return {
        diagnosis,
        before: beforeScore,
        after: afterScore,
        delta: (afterScore ?? 0) - (beforeScore ?? 0),
        rankBefore: rankOf(before, diagnosis),
        rankAfter: rankOf(after, diagnosis),
      };
    })
    .filter((change) => change.delta !== 0 || change.rankBefore !== change.rankAfter)
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));
}

function unexpectedMovements(
  before: AnalyzeCaseResponse,
  after: AnalyzeCaseResponse,
  forbiddenLeadAfter: readonly string[] = [],
): string[] {
  const findings: string[] = [];
  const leadAfter = after.differentials[0]?.name ?? "";

  if (forbiddenLeadAfter.includes(leadAfter)) {
    findings.push(`forbidden lead diagnosis after labs: ${leadAfter}`);
  }

  for (const change of scoreChanges(before, after)) {
    if (change.rankBefore === null || change.rankAfter === null) {
      continue;
    }

    const jump = change.rankBefore - change.rankAfter;

    if (jump > 3 && Math.abs(change.delta) <= 3) {
      findings.push(`${change.diagnosis} moved up ${jump} ranks from weak lab evidence`);
    }
  }

  return findings;
}

export function evaluateLabWorkflowCases(): LabWorkflowQaResult[] {
  return labWorkflowQaCases.map((testCase) => {
    const before = analyzeCase(testCase.input);
    const after = analyzeCase({ ...testCase.input, labs: testCase.labs });

    return {
      id: testCase.id,
      title: testCase.title,
      leadBefore: before.differentials[0]?.name ?? "None",
      leadAfter: after.differentials[0]?.name ?? "None",
      top3Before: top3(before),
      top3After: top3(after),
      scoreChanges: scoreChanges(before, after),
      labModifierTraces: after.labDiagnosisModifiers ?? [],
      labSafetyWarnings: after.labs?.safetyWarnings.map((warning) => warning.id) ?? [],
      labFeatures: after.labs?.features ?? [],
      labAbnormalities:
        after.labs?.abnormalities.map((abnormality) => ({
          test: abnormality.test,
          value: abnormality.value,
          unit: abnormality.unit,
          status: abnormality.status,
          referenceRange: abnormality.referenceRange,
        })) ?? [],
      unexpectedMovements: unexpectedMovements(before, after, testCase.forbiddenLeadAfter),
      notes: testCase.notes,
    };
  });
}

function printList(label: string, values: readonly string[]): void {
  console.log(`${label}: ${values.length > 0 ? values.join(", ") : "None"}`);
}

function printReport(results: readonly LabWorkflowQaResult[]): void {
  console.log("WardBrain laboratory workflow QA audit");
  console.log("========================================");
  console.log(`Cases evaluated: ${results.length}`);
  console.log("");

  for (const result of results) {
    console.log("--------------------------------------------------");
    console.log(`${result.id}`);
    console.log(result.title);
    console.log(`Lead: ${result.leadBefore} -> ${result.leadAfter}`);
    console.log(`Top 3 before: ${result.top3Before.join(", ") || "None"}`);
    console.log(`Top 3 after: ${result.top3After.join(", ") || "None"}`);
    printList("Lab features", result.labFeatures);
    printList("Safety warnings", result.labSafetyWarnings);
    printList(
      "Lab modifiers",
      result.labModifierTraces.map(
        (modifier) => `${modifier.diagnosis} +${modifier.scoreDelta} ${modifier.feature}`,
      ),
    );
    printList("Unexpected movements", result.unexpectedMovements);
    console.log(`Notes: ${result.notes}`);
  }

  const casesWithSafetyWarnings = results.filter((result) => result.labSafetyWarnings.length > 0).length;
  const casesWithModifiers = results.filter((result) => result.labModifierTraces.length > 0).length;
  const casesWithUnexpectedMovement = results.filter((result) => result.unexpectedMovements.length > 0);

  console.log("");
  console.log("Summary");
  console.log("-------");
  console.log(`Cases with lab safety warnings: ${casesWithSafetyWarnings}`);
  console.log(`Cases with lab diagnosis modifiers: ${casesWithModifiers}`);
  console.log(`Cases with unexpected diagnosis movement: ${casesWithUnexpectedMovement.length}`);

  if (casesWithUnexpectedMovement.length > 0) {
    for (const result of casesWithUnexpectedMovement) {
      console.log(`- ${result.id}: ${result.unexpectedMovements.join("; ")}`);
    }
  }
}

function writeReports(results: readonly LabWorkflowQaResult[]): void {
  mkdirSync(join(process.cwd(), "reports"), { recursive: true });
  writeFileSync(
    join(process.cwd(), "reports", "lab-workflow-qa-results.json"),
    `${JSON.stringify(results, null, 2)}\n`,
  );
}

const results = evaluateLabWorkflowCases();

printReport(results);
writeReports(results);
