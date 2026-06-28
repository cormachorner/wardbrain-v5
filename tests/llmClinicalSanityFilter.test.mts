import test from "node:test";
import assert from "node:assert/strict";

import { filterLlmFeaturesForClinicalSanity } from "../lib/llm/clinicalSanityFilter.js";
import type { ExtractedFeatures } from "../lib/types.js";

function filterOne(
  slug: string,
  evidence: string,
  deterministicFeatures: string[] = [],
) {
  return filterLlmFeaturesForClinicalSanity(
    [{ slug, evidence, confidence: 0.95 }],
    { allText: evidence, matchedFeatures: deterministicFeatures } satisfies ExtractedFeatures,
  );
}

function assertRejected(
  slug: string,
  evidence: string,
  expectedReason: string,
  deterministicFeatures: string[] = [],
) {
  const result = filterOne(slug, evidence, deterministicFeatures);

  assert.deepEqual(result.acceptedFeatures, []);
  assert.equal(result.rejectedFeatures[0]?.slug, slug);
  assert.equal(result.rejectedFeatures[0]?.reason, expectedReason);
}

function assertAccepted(slug: string, evidence: string, deterministicFeatures: string[] = []) {
  const result = filterOne(slug, evidence, deterministicFeatures);

  assert.deepEqual(result.rejectedFeatures, []);
  assert.deepEqual(result.acceptedFeatures.map((feature) => feature.slug), [slug]);
}

test("LLM clinical sanity filter rejects locally negated evidence", () => {
  assertRejected("guarding", "no guarding", "negated_evidence");
  assertRejected("chest_pain", "no chest pain", "negated_evidence");
  assertRejected("sob", "denies shortness of breath", "negated_evidence");
  assertRejected("dyspnoea", "denies shortness of breath", "negated_evidence");
  assertRejected("wheeze", "not wheezy", "negated_evidence");
  assertRejected("haemoptysis", "no haemoptysis", "negated_evidence");
});

test("LLM clinical sanity filter requires explicit evidence for dangerous abdominal signs", () => {
  assertRejected("rigidity", "minimal tenderness", "safer_alternative_feature");
  assert.equal(filterOne("rigidity", "minimal tenderness").rejectedFeatures[0]?.suggestedAlternative, "mild_tenderness");
  assertRejected("generalised_peritonism", "mild tenderness", "safer_alternative_feature");
  assertRejected("rigidity", "soft abdomen", "safer_alternative_feature");
  assertRejected("generalised_peritonism", "soft abdomen", "safer_alternative_feature");
});

test("LLM clinical sanity filter distinguishes unilateral chest findings from vague quiet chest", () => {
  assertAccepted("unilateral_reduced_air_entry", "left chest is very quiet");
  assertRejected(
    "unilateral_reduced_air_entry",
    "quiet chest",
    "dangerous_feature_requires_explicit_evidence",
  );
});

test("LLM clinical sanity filter rejects over-specific dangerous features with safer alternatives", () => {
  const swollenAnkle = filterOne("unilateral_leg_swelling", "swollen ankles");
  assert.equal(swollenAnkle.rejectedFeatures[0]?.reason, "safer_alternative_feature");
  assert.equal(swollenAnkle.rejectedFeatures[0]?.suggestedAlternative, "ankle_swelling");

  const dvt = filterOne("dvt_signs", "swollen ankles");
  assert.equal(dvt.rejectedFeatures[0]?.reason, "safer_alternative_feature");
  assert.equal(dvt.rejectedFeatures[0]?.suggestedAlternative, "ankle_swelling");

  const shock = filterOne("shock", "clammy");
  assert.equal(shock.rejectedFeatures[0]?.reason, "insufficient_instability_for_shock");
  assert.equal(shock.rejectedFeatures[0]?.suggestedAlternative, "sweating");

  const hypoxia = filterOne("hypoxia", "breathing fast");
  assert.equal(hypoxia.rejectedFeatures[0]?.reason, "safer_alternative_feature");
  assert.equal(hypoxia.rejectedFeatures[0]?.suggestedAlternative, "tachypnoea");
});

test("LLM clinical sanity filter rejects deterministic-context contradictions", () => {
  assertRejected("hypoxia", "breathless", "contradictory_evidence", [
    "normal_oxygen_saturations",
  ]);
  assertRejected("rigidity", "minimal tenderness", "safer_alternative_feature", [
    "mild_tenderness",
  ]);
  assertRejected("guarding", "guarding", "contradictory_evidence", ["no_guarding"]);
});

test("LLM clinical sanity filter accepts explicit positive dangerous evidence", () => {
  assertAccepted("rigidity", "board-like rigidity");
  assertAccepted("hypotension", "BP 82/50");
  assertAccepted("shock", "hypotensive with BP 82/50");
  assertAccepted("haemoptysis", "coughed up blood");
  assertAccepted("unilateral_leg_swelling", "left calf swollen and tender");
  assertAccepted("calf_swelling", "left calf swollen and tender");
  assertAccepted("tracheal_deviation", "trachea deviated to the right");
});
