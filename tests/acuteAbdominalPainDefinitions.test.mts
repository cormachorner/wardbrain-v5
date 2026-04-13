import test from "node:test";
import assert from "node:assert/strict";

import { extractFeatures } from "../lib/domain/featureExtractor.js";
import {
  acuteAbdominalPainDiagnoses,
  acuteAbdominalPainFeatureVocabulary,
} from "../lib/domain/presentationBlocks/acuteAbdominalPain.js";
import { findDiagnosisDefinition } from "../lib/domain/presentationBlocks/index.js";

function flattenVocabulary(): Set<string> {
  return new Set(Object.values(acuteAbdominalPainFeatureVocabulary).flat());
}

function collectDefinitionFeatures(): Set<string> {
  const features = new Set<string>();

  for (const definition of acuteAbdominalPainDiagnoses) {
    const { core, discriminating, weak = [], against = [], exclusions = [], riskFactors = [] } =
      definition.features;

    for (const feature of [...core, ...discriminating, ...weak, ...against, ...exclusions, ...riskFactors]) {
      features.add(feature);
    }

    for (const clause of definition.logic?.boosts ?? []) {
      for (const feature of [...(clause.ifAll ?? []), ...(clause.ifAny ?? [])]) {
        features.add(feature);
      }
    }

    for (const clause of definition.logic?.penalties ?? []) {
      for (const feature of [...(clause.ifAll ?? []), ...(clause.ifAny ?? [])]) {
        features.add(feature);
      }
    }

    for (const clause of definition.logic?.escalationRules ?? []) {
      for (const feature of [...(clause.ifAll ?? []), ...(clause.ifAny ?? [])]) {
        features.add(feature);
      }
    }
  }

  return features;
}

test("acute abdominal pain definitions only reference features present in the shared vocabulary", () => {
  const vocabulary = flattenVocabulary();
  const referenced = collectDefinitionFeatures();
  const missing = [...referenced].filter((feature) => !vocabulary.has(feature));

  assert.deepEqual(missing, []);
});

test("acute abdominal pain diagnosis definitions are centrally discoverable", () => {
  assert.equal(findDiagnosisDefinition("appendicitis")?.id, "appendicitis");
  assert.equal(findDiagnosisDefinition("renal_colic")?.name, "Renal colic / ureteric stone");
});

test("acute abdominal pain high-value extractor hooks are present", () => {
  const features = extractFeatures({
    age: "29",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history:
      "Pain out of proportion to exam, started around the umbilicus then moved to the right iliac fossa, worse on movement, settles between episodes after fatty meals on previous attacks, missed period with vaginal bleeding, dark urine and pale stools.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "positive pregnancy test",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  for (const feature of [
    "pain_out_of_proportion",
    "pain_migration_to_rif",
    "pain_worse_on_movement",
    "pain_settles_between_episodes",
    "post_prandial_pain",
    "pregnancy_possible",
    "positive_pregnancy_test",
    "missed_period",
    "vaginal_bleeding",
    "dark_urine",
    "pale_stools",
  ]) {
    assert.ok(features.matchedFeatures.includes(feature), `Expected feature ${feature} to be extracted`);
  }
});

test("acute abdominal pain testicular and urinary retention hooks are present", () => {
  const features = extractFeatures({
    age: "19",
    sex: "male",
    presentingComplaint: "Lower abdominal pain",
    history: "Sudden testicular pain and cannot pass urine.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.ok(features.matchedFeatures.includes("testicular_pain"));
  assert.ok(features.matchedFeatures.includes("urinary_retention"));
});
