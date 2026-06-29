import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/application/analyzeCase.js";
import { extractFeatures, setDbFeaturePhrasePatternsForTest } from "../lib/domain/featureExtractor.js";
import { findDiagnosisDefinition, getDiagnosisDefinitionsForPresentationBlock } from "../lib/domain/presentationBlocks/index.js";
import { headacheV1Cases } from "./fixtures/headacheV1Cases.js";

setDbFeaturePhrasePatternsForTest({});

function analyseHeadacheCase(testCase: (typeof headacheV1Cases)[number]) {
  return analyzeCase({
    age: testCase.age,
    sex: testCase.sex,
    presentingComplaint: "Headache",
    history: testCase.vignette,
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
  });
}

test("headache v1 registers deterministic diagnosis definitions", () => {
  const definitions = getDiagnosisDefinitionsForPresentationBlock("headache");
  const names = definitions.map((definition) => definition.name);

  assert.equal(definitions.length, 9);
  assert.ok(names.includes("Migraine"));
  assert.ok(names.includes("Tension headache"));
  assert.ok(names.includes("Cluster headache"));
  assert.ok(names.includes("Subarachnoid haemorrhage"));
  assert.ok(names.includes("Meningitis / encephalitis"));
  assert.ok(names.includes("Temporal arteritis"));
  assert.ok(names.includes("Raised intracranial pressure / intracranial mass"));
  assert.ok(names.includes("Cerebral venous sinus thrombosis"));
  assert.ok(names.includes("Stroke / neurological emergency"));
  assert.equal(findDiagnosisDefinition("cluster_headache")?.name, "Cluster headache");
});

for (const testCase of headacheV1Cases) {
  test(`headache v1 live path: ${testCase.title}`, () => {
    const result = analyseHeadacheCase(testCase);
    const top3Names = result.differentials.slice(0, 3).map((differential) => differential.name);

    assert.equal(result.presentationSupport.matchedBlockId, testCase.expectedPresentationBlock ?? "headache");
    assert.equal(result.differentials[0]?.name, testCase.expectedLeadDiagnosis);

    for (const diagnosis of testCase.leadInTop3 ?? []) {
      assert.ok(
        top3Names.includes(diagnosis),
        `${testCase.id}: expected ${diagnosis} in top 3, got ${top3Names.join(", ")}`,
      );
    }

    for (const feature of testCase.expectedFeatureSlugs) {
      assert.ok(
        result.detectedFeatureSlugs.includes(feature),
        `${testCase.id}: missing feature ${feature}; got ${result.detectedFeatureSlugs.join(", ")}`,
      );
    }

    const redFlagNames = result.redFlags.map((flag) => flag.name);

    for (const redFlag of testCase.expectedRedFlags ?? []) {
      assert.ok(
        redFlagNames.includes(redFlag),
        `${testCase.id}: missing red flag ${redFlag}; got ${redFlagNames.join(", ")}`,
      );
    }

    for (const redFlag of testCase.forbiddenRedFlags ?? []) {
      assert.ok(
        !redFlagNames.includes(redFlag),
        `${testCase.id}: forbidden red flag ${redFlag} was present`,
      );
    }
  });
}

test("headache v1 negation suppresses dangerous meningism and neuro features", () => {
  const features = extractFeatures({
    age: "31",
    sex: "female",
    presentingComplaint: "Headache",
    history:
      "Gradual bilateral headache. No fever, no neck stiffness, no rash, no visual symptoms, no focal weakness and no slurred speech.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
  }).matchedFeatures;

  assert.ok(features.includes("headache"));
  assert.ok(features.includes("gradual_onset"));
  assert.ok(!features.includes("fever"));
  assert.ok(!features.includes("neck_stiffness"));
  assert.ok(!features.includes("rash"));
  assert.ok(!features.includes("visual_disturbance"));
  assert.ok(!features.includes("focal_weakness"));
  assert.ok(!features.includes("dysarthria"));
});

test("headache v1 guideline support is returned for diagnosis and red flags", () => {
  const result = analyseHeadacheCase(headacheV1Cases[0]);
  const sourceIds = result.guidelineSupport.sources.map((match) => match.source.id);

  assert.ok(sourceIds.includes("nice-cg150-headache"));
  assert.ok(
    result.guidelineSupport.sources.some((match) =>
      match.matchedRedFlagSlugs.includes("thunderclap-headache-pattern"),
    ),
  );
});
