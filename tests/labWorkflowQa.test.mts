import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/application/analyzeCase.js";
import type { AnalyzeCaseResponse } from "../lib/types.js";
import { labWorkflowQaCases } from "./fixtures/labWorkflowQaCases.js";

function names(result: AnalyzeCaseResponse): string[] {
  return result.differentials.map((differential) => differential.name);
}

function top3(result: AnalyzeCaseResponse): string[] {
  return names(result).slice(0, 3);
}

function rankOf(result: AnalyzeCaseResponse, diagnosis: string): number {
  const index = names(result).indexOf(diagnosis);
  return index === -1 ? 99 : index + 1;
}

function labModifierDiagnoses(result: AnalyzeCaseResponse): string[] {
  return [...new Set((result.labDiagnosisModifiers ?? []).map((modifier) => modifier.diagnosis))];
}

function labModifierFeatures(result: AnalyzeCaseResponse): string[] {
  return (result.labDiagnosisModifiers ?? []).map((modifier) => modifier.feature);
}

function safetyWarningIds(result: AnalyzeCaseResponse): string[] {
  return result.labs?.safetyWarnings.map((warning) => warning.id) ?? [];
}

function assertExpectedValues(label: string, actual: readonly string[], expected: readonly string[] = []): void {
  for (const expectedValue of expected) {
    assert.ok(
      actual.includes(expectedValue),
      `${label} should include ${expectedValue}. Saw: ${actual.join(", ") || "None"}`,
    );
  }
}

test("lab workflow QA fixture pack covers the requested audit scenarios", () => {
  assert.ok(labWorkflowQaCases.length >= 15);

  const ids = labWorkflowQaCases.map((testCase) => testCase.id);

  assertExpectedValues("lab workflow case ids", ids, [
    "lab-qa-upper-gi-bleed",
    "lab-qa-dka",
    "lab-qa-dka-raised-lactate",
    "lab-qa-sepsis-leukocytosis",
    "lab-qa-sepsis-leukopenia",
    "lab-qa-pneumonia-hypoxaemia",
    "lab-qa-copd-type-2-respiratory-failure",
    "lab-qa-cholangitis",
    "lab-qa-biliary-obstruction-no-infection",
    "lab-qa-hepatocellular-pattern",
    "lab-qa-mesenteric-raised-lactate",
    "lab-qa-mesenteric-normal-lactate",
    "lab-qa-acs-incidental-inflammatory",
    "lab-qa-severe-hyperkalaemia",
    "lab-qa-isolated-renal-impairment",
    "lab-qa-normal-results",
    "lab-qa-partial-panel",
    "lab-qa-multiple-mild-incidental",
  ]);
});

test("lab workflow QA cases keep lab interpretation separate from clinical feature extraction and red flags", () => {
  for (const testCase of labWorkflowQaCases) {
    const withoutLabs = analyzeCase(testCase.input);
    const withLabs = analyzeCase({ ...testCase.input, labs: testCase.labs });
    const labFeatures = withLabs.labs?.features ?? [];

    assert.ok(withLabs.labs, `${testCase.id} should produce lab interpretation output.`);

    for (const labFeature of labFeatures) {
      assert.ok(
        !withLabs.detectedFeatureSlugs.includes(labFeature),
        `${testCase.id}: lab feature ${labFeature} should not be merged into detectedFeatureSlugs.`,
      );
    }

    assert.deepEqual(
      withLabs.redFlags.map((flag) => flag.name),
      withoutLabs.redFlags.map((flag) => flag.name),
      `${testCase.id}: lab safety warnings must not alter existing non-lab red flags.`,
    );
  }
});

test("lab workflow QA cases recover expected interpretation, safety warnings, and bounded modifiers", () => {
  for (const testCase of labWorkflowQaCases) {
    const withLabs = analyzeCase({ ...testCase.input, labs: testCase.labs });

    if (testCase.expectedLeadAfter) {
      assert.equal(
        withLabs.differentials[0]?.name,
        testCase.expectedLeadAfter,
        `${testCase.id}: unexpected lead diagnosis after labs.`,
      );
    }

    assertExpectedValues(
      `${testCase.id}: top 3 diagnoses after labs`,
      top3(withLabs),
      testCase.expectedTop3AfterIncludes,
    );
    assertExpectedValues(
      `${testCase.id}: lab features`,
      withLabs.labs?.features ?? [],
      testCase.expectedLabFeatures,
    );
    assertExpectedValues(
      `${testCase.id}: lab safety warnings`,
      safetyWarningIds(withLabs),
      testCase.expectedSafetyWarningIds,
    );
    assertExpectedValues(
      `${testCase.id}: lab modifier diagnoses`,
      labModifierDiagnoses(withLabs),
      testCase.expectedModifierDiagnoses,
    );

    for (const forbiddenLead of testCase.forbiddenLeadAfter ?? []) {
      assert.notEqual(
        withLabs.differentials[0]?.name,
        forbiddenLead,
        `${testCase.id}: ${forbiddenLead} should not become lead after lab modifiers.`,
      );
    }
  }
});

test("lab workflow QA cases do not show weak-lab overpromotion or duplicate correlated modifiers beyond current bounds", () => {
  for (const testCase of labWorkflowQaCases) {
    const withoutLabs = analyzeCase(testCase.input);
    const withLabs = analyzeCase({ ...testCase.input, labs: testCase.labs });
    const modifierFeatures = labModifierFeatures(withLabs);

    for (const diagnosis of names(withLabs)) {
      const jump = rankOf(withoutLabs, diagnosis) - rankOf(withLabs, diagnosis);
      const labDelta = (withLabs.labDiagnosisModifiers ?? [])
        .filter((modifier) => modifier.diagnosis === diagnosis)
        .reduce((sum, modifier) => sum + modifier.scoreDelta, 0);

      assert.ok(
        !(jump > 3 && labDelta <= 3),
        `${testCase.id}: ${diagnosis} moved up ${jump} ranks from only +${labDelta} lab points.`,
      );
    }

    assert.ok(
      modifierFeatures.filter((feature) => feature === "low_bicarbonate").length <= 1,
      `${testCase.id}: low bicarbonate should not be duplicated as a lab modifier.`,
    );
    assert.ok(
      modifierFeatures.filter((feature) => feature === "cholestatic_pattern").length <= 2,
      `${testCase.id}: cholestatic pattern should remain bounded across biliary diagnoses.`,
    );
    assert.ok(
      modifierFeatures.filter((feature) => feature === "respiratory_acidosis").length <= 1,
      `${testCase.id}: respiratory acidosis should not be duplicated as a lab modifier.`,
    );
  }
});
