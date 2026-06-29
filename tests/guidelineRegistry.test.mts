import test from "node:test";
import assert from "node:assert/strict";

import {
  GUIDELINE_COVERAGE_EXEMPTIONS,
  GUIDELINE_REGISTRY,
  guidelineSlug,
  lookupGuidelineSupport,
} from "../lib/guidelines/guidelineRegistry.js";
import { GUIDELINE_RULES } from "../lib/domain/guidelineRules.js";
import { SUPPORTED_PRESENTATION_BLOCKS } from "../lib/pilotStatus.js";

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

test("pilot-supported diagnosis slugs have guideline support or documented exemptions", () => {
  const mappedDiagnosisSlugs = new Set(
    GUIDELINE_REGISTRY.flatMap((source) => source.appliesToDiagnosisSlugs.map(guidelineSlug)),
  );
  const exemptDiagnosisSlugs = new Set(
    GUIDELINE_COVERAGE_EXEMPTIONS
      .filter((exemption) => exemption.kind === "diagnosis")
      .map((exemption) => exemption.slug),
  );
  const pilotDiagnosisSlugs = [
    ...new Set(
      SUPPORTED_PRESENTATION_BLOCKS.flatMap((block) =>
        block.diagnoses.map(guidelineSlug),
      ),
    ),
  ].sort();
  const missingCoverage = pilotDiagnosisSlugs.filter(
    (slug) => !mappedDiagnosisSlugs.has(slug) && !exemptDiagnosisSlugs.has(slug),
  );

  assert.deepEqual(missingCoverage, []);
});

test("pilot red-flag slugs have guideline support or documented exemptions", () => {
  const mappedRedFlagSlugs = new Set(
    GUIDELINE_REGISTRY.flatMap((source) => source.appliesToRedFlagSlugs.map(guidelineSlug)),
  );
  const exemptRedFlagSlugs = new Set(
    GUIDELINE_COVERAGE_EXEMPTIONS
      .filter((exemption) => exemption.kind === "redFlag")
      .map((exemption) => exemption.slug),
  );
  const redFlagSlugs = GUIDELINE_RULES
    .filter((rule) => rule.id !== "gmc-ai-001")
    .map((rule) => guidelineSlug(rule.title))
    .sort();
  const missingCoverage = redFlagSlugs.filter(
    (slug) => !mappedRedFlagSlugs.has(slug) && !exemptRedFlagSlugs.has(slug),
  );

  assert.deepEqual(missingCoverage, []);
});

test("guideline coverage exemptions are documented and unique", () => {
  const keys = GUIDELINE_COVERAGE_EXEMPTIONS.map(
    (exemption) => `${exemption.kind}:${exemption.slug}`,
  );

  assert.equal(keys.length, new Set(keys).size);

  for (const exemption of GUIDELINE_COVERAGE_EXEMPTIONS) {
    assert.ok(exemption.slug);
    assert.ok(exemption.reason.length >= 20);
  }
});
