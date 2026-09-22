import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCase } from "../lib/application/analyzeCase.js";
import { extractFeatures, setDbFeaturePhrasePatternsForTest, resetDbFeaturePhrasePatternsForTest } from "../lib/domain/featureExtractor.js";
import { mergeLlmFeatures } from "../lib/llm/mergeFeatures.js";
import { deriveLabFeatures } from "../lib/domain/labs/deriveLabFeatures.js";
import { parseSmartCaseInput } from "../lib/input/smartCaseInput.js";
import { parseLabText, mergeLabPanels } from "../lib/input/labTextParser.js";
import type { CaseInput } from "../lib/types.js";
const base: CaseInput = { age: "58", sex: "male", presentingComplaint: "Breathlessness", history: "", pmh: "", meds: "", social: "", keyPositives: "", keyNegatives: "", observations: "" };
const dkaText = "24F with breathlessness, nausea, abdominal discomfort, fatigue, polyuria/polydipsia, deep tachypnoea. glucose 24 mmol/L, pH 7.16, HCO3 10 mmol/L, PaCO2 3.1 kPa";

for (const [phrase, slug] of [["pleuritic pain", "pleuritic_pain"], ["fever", "fever"], ["haemoptysis", "haemoptysis"], ["wheeze", "wheeze"], ["diabetes", "diabetic_context"], ["productive cough", "productive_cough"]]) {
  for (const text of [`no ${phrase}`, `denies ${phrase}`, `without ${phrase}`, `${phrase} absent`]) {
    test(`explicit negative: ${text} stays negative through deterministic and LLM paths`, () => {
      const features = extractFeatures({ ...base, history: text });
      assert.ok(!features.matchedFeatures.includes(slug));
      const merged = mergeLlmFeatures(features, [{ slug, evidence: phrase, confidence: 0.95 }]);
      assert.ok(!merged.features.matchedFeatures.includes(slug));
      assert.equal(merged.rejectedFeatures[0]?.reason, "negated_evidence");
    });
  }
}

test("negation does not leak across sentence or field boundaries", () => {
  const features = extractFeatures({ ...base, history: "No fever. Pleuritic pain. No cough.", pmh: "Diabetes. Hypertension.", observations: "HR 120. Sats 89%." });
  for (const slug of ["pleuritic_pain", "diabetic_context", "hypertension", "tachycardia", "hypoxia"]) assert.ok(features.matchedFeatures.includes(slug), slug);
});

test("DB aliases cannot reintroduce a negated feature", () => {
  try {
    setDbFeaturePhrasePatternsForTest({ "pain on inspiration": "pleuritic_pain" });
    const f = extractFeatures({ ...base, history: "No pain on inspiration." });
    assert.ok(!mergeLlmFeatures(f, [{ slug: "pleuritic_pain", evidence: "pain on inspiration", confidence: 0.9 }]).features.matchedFeatures.includes("pleuritic_pain"));
  } finally { resetDbFeaturePhrasePatternsForTest(); }
});

test("QA PE: dry cough without fever is not an infection source or sepsis flag", () => {
  const result = analyzeCase({ ...base, history: "Sudden breathlessness following a long flight with unilateral calf swelling. Mild dry cough but no fever. No pleuritic pain.", observations: "HR 112, RR 26, BP 94/60" });
  for (const slug of ["pleuritic_pain", "infection_source", "fever"]) assert.ok(!result.detectedFeatureSlugs.includes(slug), slug);
  assert.ok(result.detectedFeatureSlugs.includes("hypotension"));
  assert.ok(!result.redFlags.some((flag) => /sepsis/i.test(flag.name)));
  assert.equal(result.differentials[0]?.name, "Pulmonary embolism");
  const merged = mergeLlmFeatures(extractFeatures({ ...base, history: "Mild dry cough but no fever." }), [{ slug: "infection_source", evidence: "mild dry cough", confidence: 0.99 }]);
  assert.ok(!merged.features.matchedFeatures.includes("infection_source"));
});

for (const complaint of ["Breathlessness", "Abdominal pain", "Confusion", "Chest pain", "Headache"]) {
  test(`QA DKA: metabolic case leads despite ${complaint} routing`, () => {
    const parsed = parseSmartCaseInput(dkaText);
    const result = analyzeCase({ ...base, ...parsed.patch, presentingComplaint: complaint });
    assert.equal(result.differentials[0]?.name, "Diabetic ketoacidosis");
    assert.ok(result.differentials[0].reasonsFor.some((reason) => /ketones/i.test(reason)));
  });
}

test("DKA safeguards: isolated acidosis, isolated glucose and no metabolic context do not get DKA lab boosts", () => {
  const gas = { ph: 7.16, bicarbonate: 10, paco2: 3.1 };
  for (const input of [
    { ...base, history: "Polyuria and polydipsia", labs: { abg: gas } },
    { ...base, history: "Polyuria and polydipsia", labs: { ues: { fastingGlucose: 24 } } },
    { ...base, history: "Fever and productive cough", labs: { abg: gas, ues: { fastingGlucose: 24 } } },
    { ...base, history: "Polyuria and polydipsia", labs: { abg: gas, ues: { fastingGlucose: 6 } } },
  ]) assert.ok(!analyzeCase(input).labDiagnosisModifiers?.some((modifier) => modifier.diagnosis === "Diabetic ketoacidosis"));
});

test("main vignette and dedicated parser extract multiple inline values identically", () => {
  const text = "58-year-old man with fatigue. Hb 82 g/L WCC 14.2 Na 138 K 4.6. Glucose 24 mmol/L pH 7.16 HCO3 10 mmol/L PaCO2 3.1 kPa.";
  const smart = parseSmartCaseInput(text);
  assert.deepEqual(smart.patch.labs, parseLabText(text).labs);
  assert.equal(smart.parsedLabCount, 8);
  assert.equal(smart.patch.labs?.fbc?.hb, 82);
  assert.equal(smart.patch.labs?.abg?.paco2, 3.1);
  assert.equal(parseLabText("Hb low with fatigue for 3 days. Glucose unavailable pH 7.16").labs.fbc?.hb, undefined);
});

test("lab precedence: existing values win, duplicates deduplicate, conflicts remain unfilled, cleared fields refill", () => {
  const existing = { fbc: { hb: 100 }, ues: { potassium: undefined } };
  const parsed = parseSmartCaseInput("58M Hb 82 Hb 82 WCC 12 K 4.1", existing);
  const merged = mergeLabPanels(existing, parsed.patch.labs ?? {});
  assert.equal(merged.fbc?.hb, 100);
  assert.equal(merged.ues?.potassium, 4.1);
  assert.ok(parsed.warnings.some((warning) => /Existing value preserved/.test(warning)));
  assert.equal(parseLabText("Hb 82 Hb 100").labs.fbc?.hb, undefined);
  assert.equal(parseLabText("Hb 82 Hb 82").parsedValues.length, 1);
});

for (const text of ["58-year-old man", "58 year old male", "58M", "aged 58", "58–year–old man"]) test(`age: ${text}`, () => assert.equal(parseSmartCaseInput(text).patch.age, "58"));
for (const text of ["HR 58 BP 120/80", "58M and 24F", "Father aged 58", "158-year-old man"]) test(`ambiguous age: ${text}`, () => assert.equal(parseSmartCaseInput(text).patch.age, undefined));

test("QA qualitative hepatobiliary findings have no invented numbers or severity", () => {
  const text = "ALT/transaminases raised. Bilirubin raised. ALP/GGT raised.";
  const result = analyzeCase({ ...base, presentingComplaint: "RUQ pain and jaundice", history: text });
  for (const feature of ["raised_alt", "raised_bilirubin", "raised_alp", "raised_ggt"]) assert.ok(result.labs?.qualitativeFeatures?.includes(feature), feature);
  assert.deepEqual(result.labs?.abnormalities, []);
  assert.deepEqual(result.labs?.safetyWarnings, []);
  assert.ok(result.labDiagnosisModifiers?.length);
  assert.ok(result.labDiagnosisModifiers?.every((modifier) => modifier.scoreDelta === 1));
});

test("QA qualitative anaemia: modest context-specific support, not severe anaemia", () => {
  const result = analyzeCase({ ...base, history: "Progressive breathlessness and fatigue. Hb low / anaemia." });
  assert.ok(result.labs?.features.includes("anaemia"));
  assert.ok(result.labDiagnosisModifiers?.some((modifier) => modifier.diagnosis === "Anaemia" && modifier.scoreDelta === 1));
  assert.deepEqual(result.labs?.safetyWarnings, []);
});

test("qualitative WCC, creatinine and glucose recognised; numeric results override even normal or invalid values", () => {
  const text = "WCC raised / leucocytosis. Hb low / anaemia. Creatinine raised. Glucose raised / hyperglycaemia.";
  const result = deriveLabFeatures({}, text);
  assert.deepEqual(new Set(result.qualitativeFeatures), new Set(["leucocytosis", "anaemia", "raised_creatinine", "hyperglycaemia_lab"]));
  const numeric = deriveLabFeatures({ fbc: { wcc: 7, hb: 140 }, ues: { creatinine: 80, fastingGlucose: 5 } }, text);
  assert.equal(numeric.qualitativeFeatures, undefined);
  assert.equal(deriveLabFeatures({ fbc: { hb: -2 } }, "Hb low").qualitativeFeatures, undefined);
  assert.equal(deriveLabFeatures({}, "No anaemia. ALT not raised. No leucocytosis. Glucose raised absent.").qualitativeFeatures, undefined);
});

test("QA sepsis control: infection plus BP 94/60 contributes, BP alone does not establish sepsis or shock", () => {
  const result = analyzeCase({ ...base, history: "Fever, rigors and productive cough.", observations: "BP: 94/60, HR 115, RR 28" });
  assert.ok(result.detectedFeatureSlugs.includes("hypotension"));
  assert.ok(result.redFlags.some((flag) => /sepsis/i.test(flag.name)));
  const normal = extractFeatures({ ...base, observations: "BP 100/60" });
  assert.ok(!normal.matchedFeatures.includes("hypotension"));
  const low = extractFeatures({ ...base, observations: "BP 94/60" });
  assert.ok(!low.matchedFeatures.includes("shock"));
  assert.ok(!low.matchedFeatures.includes("infection_source"));
});


test("coordinated negatives cannot boost pleuritic diagnoses; new positive assertions remain separate", () => {
  const f = extractFeatures({ ...base, history: "No fever, cough or pleuritic pain. Without wheeze or haemoptysis. No fever but pleuritic pain absent." });
  for (const feature of ["fever", "cough", "pleuritic_pain", "wheeze", "haemoptysis"]) assert.ok(!f.matchedFeatures.includes(feature), feature);
  const positive = extractFeatures({ ...base, history: "No fever or cough but pleuritic pain with unilateral calf swelling." });
  assert.ok(positive.matchedFeatures.includes("pleuritic_pain"));
});

test("normal numeric glucose overrides qualitative hyperglycaemia in clinical evidence and DKA boosts", () => {
  const result = analyzeCase({ ...base, history: "Hyperglycaemia, polyuria and polydipsia.", labs: { ues: { fastingGlucose: 5 }, abg: { ph: 7.16, bicarbonate: 10, paco2: 3.1 } } });
  assert.ok(!result.detectedFeatureSlugs.includes("hyperglycaemia"));
  assert.ok(!result.labDiagnosisModifiers?.some((modifier) => modifier.diagnosis === "Diabetic ketoacidosis"));
});


test("qualitative reports remain local to each analyte and never imply sepsis from instability alone", () => {
  const labs = deriveLabFeatures({}, "ALT normal, bilirubin raised. No anaemia, creatinine raised.");
  assert.deepEqual(new Set(labs.qualitativeFeatures), new Set(["raised_bilirubin", "raised_creatinine"]));
  const result = analyzeCase({ ...base, history: "Creatinine raised. WCC raised.", observations: "BP 94/60" });
  assert.ok(!result.labDiagnosisModifiers?.some((modifier) => modifier.diagnosis === "Sepsis"));
});


test("legacy DB cough mapping cannot restore infection source or sepsis over-inference", () => {
  try {
    setDbFeaturePhrasePatternsForTest({ cough: "infection_source" });
    const result = analyzeCase({ ...base, history: "Mild dry cough but no fever.", observations: "BP 94/60 HR 115" });
    assert.ok(!result.detectedFeatureSlugs.includes("infection_source"));
    assert.ok(!result.redFlags.some((flag) => /sepsis/i.test(flag.name)));
  } finally { resetDbFeaturePhrasePatternsForTest(); }
});


test("numeric precedence also survives optional LLM extraction", () => {
  const features = extractFeatures({ ...base, history: "Hyperglycaemia and polyuria.", labs: { ues: { fastingGlucose: 5 } } });
  const merged = mergeLlmFeatures(features, [{ slug: "hyperglycaemia", evidence: "Hyperglycaemia", confidence: 0.99 }]);
  assert.ok(!merged.features.matchedFeatures.includes("hyperglycaemia"));
  assert.equal(merged.rejectedFeatures[0]?.reason, "contradictory_evidence");
});

test("unsupported explicit units cannot be silently treated as canonical numeric measurements", () => {
  const parsed = parseSmartCaseInput("24F glucose 24 mg/dL, Hb 8 g/dL, PaCO2 30 mmHg, pH 7.16");
  assert.equal(parsed.patch.labs?.ues?.fastingGlucose, undefined);
  assert.equal(parsed.patch.labs?.fbc?.hb, undefined);
  assert.equal(parsed.patch.labs?.abg?.paco2, undefined);
  assert.equal(parsed.patch.labs?.abg?.ph, 7.16);
  assert.equal(parsed.warnings.filter((warning) => warning.includes("not a supported paste unit")).length, 3);
});
