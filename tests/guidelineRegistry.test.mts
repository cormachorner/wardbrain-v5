import test from "node:test";
import assert from "node:assert/strict";

import {
  GUIDELINE_REGISTRY,
  guidelineSlug,
  lookupGuidelineSupport,
} from "../lib/guidelines/guidelineRegistry.js";

test("guideline registry entries include source and licence metadata", () => {
  assert.ok(GUIDELINE_REGISTRY.length > 0);

  for (const source of GUIDELINE_REGISTRY) {
    assert.ok(source.id);
    assert.ok(source.title);
    assert.ok(source.source);
    assert.ok(source.url);
    assert.ok(source.licenceStatus);
    assert.ok(source.status);
    assert.ok(source.lastReviewed);
    assert.ok(source.shortTeachingSummary);
    assert.ok(
      source.appliesToDiagnosisSlugs.length > 0 ||
        source.appliesToRedFlagSlugs.length > 0 ||
        source.presentationBlocks.length > 0,
    );
  }
});

test("guideline lookup maps ACS diagnosis and red flag to NICE chest pain source", () => {
  const support = lookupGuidelineSupport({
    diagnosisSlugs: ["acute-coronary-syndrome"],
    redFlagSlugs: ["acs-suspicion-pattern"],
    presentationBlocks: ["chest-pain"],
  });

  const source = support.sources.find((match) => match.source.id === "nice-cg95-chest-pain");

  assert.ok(source);
  assert.equal(source.source.source, "NICE");
  assert.equal(source.source.url, "https://www.nice.org.uk/guidance/cg95");
  assert.deepEqual(source.matchedDiagnosisSlugs, ["acute-coronary-syndrome"]);
  assert.deepEqual(source.matchedRedFlagSlugs, ["acs-suspicion-pattern"]);
});

test("guideline lookup maps source-aware breathlessness red flags without scoring side effects", () => {
  const support = lookupGuidelineSupport({
    diagnosisSlugs: ["pulmonary embolism", "pneumothorax"].map(guidelineSlug),
    redFlagSlugs: ["PE suspicion pattern", "Tension pneumothorax pattern"].map(guidelineSlug),
    presentationBlocks: ["breathlessness"],
  });
  const sourceIds = support.sources.map((match) => match.source.id);

  assert.ok(sourceIds.includes("nice-ng158-vte"));
  assert.ok(sourceIds.includes("wardbrain-pilot-gaps"));
});
