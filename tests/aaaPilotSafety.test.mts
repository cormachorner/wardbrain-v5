import test from "node:test";
import assert from "node:assert/strict";

import { resetDbFeaturePhrasePatternsForTest, setDbFeaturePhrasePatternsForTest } from "../lib/domain/featureExtractor.js";
import { analyzeCase } from "../lib/application/analyzeCase.js";
import type { CaseInput } from "../lib/types.js";

const base: CaseInput = {
  age: "72",
  sex: "male",
  presentingComplaint: "Abdominal pain",
  history: "",
  pmh: "",
  meds: "",
  social: "",
  keyPositives: "",
  keyNegatives: "",
  observations: "",
};

function analyzeHistory(history: string) {
  return analyzeCase({ ...base, history });
}

function hasAaaWarning(result: ReturnType<typeof analyzeCase>) {
  return result.redFlags.some((flag) => flag.name === "Ruptured AAA suspicion pattern");
}

function rankOf(result: ReturnType<typeof analyzeCase>, diagnosis: string) {
  const index = result.differentials.findIndex((differential) => differential.name === diagnosis);
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

test("pilot scoring: obstructive jaundice outranks unsupported AAA and GI bleed despite mild instability", () => {
  const result = analyzeHistory(
    "72-year-old man with right upper quadrant abdominal pain and jaundice. He has no fever or rigors. BP 94/60, HR 112. Bilirubin raised, ALP and GGT elevated, ALT mildly raised and WCC raised.",
  );

  const obstructiveRank = rankOf(result, "Choledocholithiasis / obstructive jaundice");
  assert.ok(Number.isFinite(obstructiveRank));
  assert.ok(obstructiveRank < rankOf(result, "Abdominal aortic aneurysm"));
  assert.ok(obstructiveRank < rankOf(result, "GI bleed"));
  assert.equal(hasAaaWarning(result), false);
  assert.ok(!result.redFlags.some((flag) => flag.name === "GI bleed instability pattern"));
});

test("pilot scoring: genuine unstable AAA remains the leading diagnosis", () => {
  const result = analyzeHistory(
    "A 76-year-old smoker with hypertension and vascular disease develops sudden severe abdominal and back pain, then collapses. BP 78/40.",
  );

  assert.equal(result.differentials[0]?.name, "Abdominal aortic aneurysm");
  assert.equal(hasAaaWarning(result), true);
});

test("pilot scoring: genuine unstable GI bleed remains the leading diagnosis", () => {
  const result = analyzeHistory(
    "A 67-year-old man has melaena and coffee-ground haematemesis with epigastric pain, then collapses. BP 82/48, HR 124.",
  );

  assert.equal(result.differentials[0]?.name, "GI bleed");
  assert.ok(result.redFlags.some((flag) => flag.name === "GI bleed instability pattern"));
  assert.equal(hasAaaWarning(result), false);
});

test("pilot scoring: syndrome-specific must-not-miss warnings survive the compatibility gates", () => {
  const aaa = analyzeHistory("72-year-old man with sudden severe abdominal pain and a pulsatile mass. BP 78/45.");
  const giBleed = analyzeHistory("72-year-old man with haematemesis and melaena. BP 82/48, HR 124.");

  assert.equal(hasAaaWarning(aaa), true);
  assert.ok(giBleed.redFlags.some((flag) => flag.name === "GI bleed instability pattern"));
});

test("pilot eligibility: exact obstructive-jaundice case excludes ectopic and unsupported sepsis", () => {
  const result = analyzeHistory(
    "72-year-old man with right upper quadrant abdominal pain and jaundice. He has no fever or rigors. BP 94/60, HR 112. Bilirubin raised, ALP and GGT elevated, ALT mildly raised and WCC raised.",
  );

  assert.equal(result.differentials[0]?.name, "Choledocholithiasis / obstructive jaundice");
  assert.ok(!result.differentials.some((differential) => differential.name === "Ectopic pregnancy"));
  assert.ok(!result.differentials.some((differential) => differential.name === "Sepsis"));
  assert.ok(!result.labDiagnosisModifiers?.some((modifier) => modifier.diagnosis === "Sepsis"));
  assert.ok(!result.redFlags.some((flag) => /sepsis|ectopic/i.test(flag.name)));
});

test("pilot sepsis gate: genuine cholangitis retains sepsis support and escalation", () => {
  const result = analyzeHistory(
    "72-year-old man with RUQ pain, jaundice, fever and rigors. BP 94/60, HR 112. Bilirubin raised, ALP and GGT elevated and WCC raised.",
  );

  assert.equal(result.differentials[0]?.name, "Acute cholangitis");
  assert.ok(result.differentials.some((differential) => differential.name === "Sepsis" && differential.score > 0));
  assert.ok(result.redFlags.some((flag) => flag.name === "High-risk sepsis pattern"));
  assert.ok(result.redFlags.some((flag) => flag.name === "Acute cholangitis pattern"));
});

test("pilot eligibility: compatible reproductive-age pregnancy presentation retains ectopic", () => {
  const result = analyzeCase({
    ...base,
    age: "32",
    sex: "female",
    history: "Positive pregnancy test with sudden pelvic pain, vaginal bleeding and collapse. BP 84/50, HR 120.",
  });

  assert.equal(result.differentials[0]?.name, "Ectopic pregnancy");
  assert.ok(result.redFlags.some((flag) => flag.name === "Ectopic pregnancy pattern"));
});

test("pilot eligibility: unknown sex uses explicit reproductive evidence without inventing it", () => {
  const explicitContext = analyzeCase({
    ...base,
    age: "",
    sex: "",
    history: "Positive pregnancy test with pelvic pain and vaginal bleeding.",
  });
  const noContext = analyzeCase({
    ...base,
    age: "",
    sex: "",
    history: "Abdominal pain with BP 94/60 and HR 112.",
  });

  assert.ok(explicitContext.differentials.some((differential) => differential.name === "Ectopic pregnancy"));
  assert.ok(!noContext.differentials.some((differential) => differential.name === "Ectopic pregnancy"));
  assert.ok(!noContext.detectedFeatureSlugs.includes("pregnancy_possible"));
});

test("pilot AAA: exact cholangitis QA case retains infection escalation without a rupture warning", () => {
  const result = analyzeHistory(
    "72-year-old man with RUQ pain, jaundice, fever/rigors, vomiting, HR 112, BP 94/60",
  );

  for (const slug of ["abdominal_pain", "older_age", "hypotension", "tachycardia", "jaundice", "rigors"]) {
    assert.ok(result.detectedFeatureSlugs.includes(slug), slug);
  }
  assert.equal(result.differentials[0]?.name, "Acute cholangitis");
  assert.equal(hasAaaWarning(result), false);
  assert.ok(result.redFlags.some((flag) => flag.name === "Acute cholangitis pattern"));
  assert.ok(result.redFlags.some((flag) => /sepsis/i.test(flag.name)));
});

for (const history of [
  "72-year-old man with abdominal pain, HR 112, BP 94/60.",
  "72-year-old man with RUQ pain and jaundice. BP 94/60, HR 112. Bilirubin 120, ALP 340, ALT 85, WCC 17.",
  "72-year-old man with abdominal pain. No collapse, no shock and no pulsatile mass. BP 94/60.",
  "72-year-old smoker with hypertension and abdominal pain. BP 94/60.",
]) {
  test(`pilot AAA: age and nonspecific pain with mild hypotension are insufficient: ${history}`, () => {
    const result = analyzeHistory(history);
    assert.ok(result.detectedFeatureSlugs.includes("hypotension"));
    assert.equal(hasAaaWarning(result), false);
  });
}

for (const [description, history, requiredFeatures] of [
  [
    "established flank-pain and collapse pattern",
    "A 76-year-old smoker with hypertension and vascular disease develops sudden abdominal, back, and left flank pain. He collapses, is sweaty, and is hypotensive on arrival.",
    ["flank_pain", "collapse", "hypotension"],
  ],
  [
    "abdominal pain and syncope despite normal current BP",
    "72-year-old man with abdominal pain and syncope. BP 120/80.",
    ["abdominal_pain", "collapse"],
  ],
  [
    "sudden severe abdominal pain with mild hypotension",
    "72-year-old man with sudden severe abdominal pain. BP 94/60.",
    ["sudden_onset", "severe_pain", "hypotension"],
  ],
  [
    "sudden back pain with marked hypotension",
    "72-year-old man with sudden severe back pain. BP 78/45.",
    ["sudden_onset", "back_pain", "hypotension"],
  ],
  [
    "sudden flank pain with hypotension",
    "72-year-old smoker with sudden left flank pain. BP 85/50.",
    ["sudden_onset", "flank_pain", "hypotension"],
  ],
  [
    "pulsatile mass with pain and hypotension",
    "72-year-old man with abdominal pain and a pulsatile mass. BP 94/60.",
    ["pulsatile_abdomen", "hypotension"],
  ],
  [
    "explicit shock with abdominal pain",
    "72-year-old man with abdominal pain. He is in shock with BP 75/40.",
    ["abdominal_pain", "shock", "hypotension"],
  ],
] as const) {
  test(`pilot AAA: preserve warning for ${description}`, () => {
    const result = analyzeHistory(history);
    for (const slug of requiredFeatures) assert.ok(result.detectedFeatureSlugs.includes(slug), slug);
    assert.equal(hasAaaWarning(result), true);
  });
}

test("pilot AAA: infection findings do not suppress a simultaneous convincing rupture pattern", () => {
  const result = analyzeHistory(
    "72-year-old man with RUQ pain, jaundice, fever and rigors. He develops sudden severe abdominal pain and collapses. HR 112, BP 78/40.",
  );
  assert.equal(hasAaaWarning(result), true);
  assert.ok(result.redFlags.some((flag) => /sepsis/i.test(flag.name)));
});


test("pilot AAA: denying shock does not erase measured low BP in a convincing acute pain pattern", () => {
  const result = analyzeHistory("72-year-old man with sudden severe abdominal and back pain. No shock. BP 94/60.");
  assert.ok(result.detectedFeatureSlugs.includes("hypotension"));
  assert.ok(!result.detectedFeatureSlugs.includes("shock"));
  assert.equal(hasAaaWarning(result), true);
});

test("pilot AAA: a denied shock phrase alone supplies no hypotension evidence", () => {
  const result = analyzeHistory("72-year-old man with abdominal pain. No shock. BP 120/80.");
  assert.ok(!result.detectedFeatureSlugs.includes("hypotension"));
  assert.ok(!result.detectedFeatureSlugs.includes("shock"));
  assert.equal(hasAaaWarning(result), false);
});


test("pilot AAA: a legacy shock-to-hypotension DB alias cannot negate measured low BP", () => {
  try {
    setDbFeaturePhrasePatternsForTest({ shock: "hypotension" });
    const result = analyzeHistory("72-year-old man with sudden severe abdominal pain. No shock. BP 94/60.");
    assert.ok(result.detectedFeatureSlugs.includes("hypotension"));
    assert.ok(!result.detectedFeatureSlugs.includes("shock"));
    assert.equal(hasAaaWarning(result), true);
  } finally {
    resetDbFeaturePhrasePatternsForTest();
  }
});
