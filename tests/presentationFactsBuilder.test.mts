import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/application/analyzeCase.js";
import { getLlmPresentationConfig } from "../lib/llm/config.js";
import {
  assessPresentationQuality,
  buildPresentationFacts,
} from "../lib/llm/presentationFactsBuilder.js";
import { buildLlmPresentationRewritePrompt } from "../lib/llm/presentationRewrite.js";
import type { CaseInput } from "../lib/types.js";

const CHEST_PAIN_CASE: CaseInput = {
  age: "72",
  sex: "male",
  presentingComplaint: "Central chest pain",
  history: "Two hours of central crushing chest pain radiating to the jaw with sweating and nausea. No pleuritic pain.",
  pmh: "Type 2 diabetes, hypertension and high cholesterol.",
  meds: "",
  social: "Ex-smoker.",
  keyPositives: "",
  keyNegatives: "No pleuritic pain.",
  observations: "BP 136/82, HR 96, sats 98% on air.",
  leadDiagnosis: "",
  otherDifferentials: "",
  dangerousDiagnoses: "",
};

function buildCase(overrides: Partial<CaseInput>): CaseInput {
  return {
    age: "",
    sex: "",
    presentingComplaint: "",
    history: "",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
    ...overrides,
  };
}

test("presentation facts builder creates a curated registrar handover fact set", () => {
  const analysis = analyzeCase(CHEST_PAIN_CASE);
  const facts = buildPresentationFacts(CHEST_PAIN_CASE, analysis);

  assert.deepEqual(facts.demographics, { age: 72, sex: "male" });
  assert.equal(facts.presenting_problem, "Central chest pain");
  assert.ok(facts.history.includes("two hours duration"));
  assert.ok(facts.history.includes("chest pain"));
  assert.ok(facts.history.includes("radiates to the jaw"));
  assert.ok(facts.history.includes("nausea"));
  assert.ok(facts.relevant_background.includes("hypertension"));
  assert.ok(facts.relevant_background.includes("diabetes"));
  assert.ok(facts.examination.includes("haemodynamically stable"));
  assert.ok(facts.examination.includes("normal oxygen saturations"));
  assert.ok(facts.important_negatives.includes("no pleuritic pain"));
  assert.deepEqual(facts.priority_concerns, ["Acute coronary syndrome"]);
  assert.equal(facts.uncertainty_guidance, "confident_impression");
});

test("presentation prompt uses structured facts rather than raw narrative or deterministic handover", () => {
  const analysis = analyzeCase(CHEST_PAIN_CASE);
  const prompt = buildLlmPresentationRewritePrompt(analysis, CHEST_PAIN_CASE);

  assert.match(prompt, /senior registrar helping a junior doctor/i);
  assert.match(prompt, /Curated clinical payload:/);
  assert.match(prompt, /SYNTHESISE rather than summarise/);
  assert.doesNotMatch(prompt, /Current deterministic Present to the reg text/);
  assert.doesNotMatch(prompt, /Two hours of central crushing chest pain radiating to the jaw/);
});

test("presentation config has presentation-specific temperature for wording variation", () => {
  const config = getLlmPresentationConfig({
    WARDBRAIN_LLM_ENABLED: "1",
    WARDBRAIN_LLM_PRESENTATION_ENABLED: "1",
    WARDBRAIN_LLM_PROVIDER: "openai",
    WARDBRAIN_LLM_MODEL: "mock",
    OPENAI_API_KEY: "mock",
  });

  assert.equal(config.temperature, 0.75);
});

test("presentation quality rubric checks compression, prioritisation and clinical flow", () => {
  const analysis = analyzeCase(CHEST_PAIN_CASE);
  const facts = buildPresentationFacts(CHEST_PAIN_CASE, analysis);
  const presentation =
    "A 72-year-old man with diabetes, hypertension and hyperlipidaemia presents with central chest pain that radiates to the jaw, associated with sweating and nausea. He is currently haemodynamically stable with normal oxygen saturations. Overall, this is most in keeping with Acute coronary syndrome and raises concern for an ACS red flag pattern.";
  const quality = assessPresentationQuality(presentation, facts);

  assert.deepEqual(quality, {
    compression: true,
    prioritisation: true,
    naturalLanguage: true,
    clinicalFlow: true,
    noHallucinations: true,
    noRepetition: true,
    spokenReadability: true,
    noUnsupportedDiagnosisMentions: true,
    noLiteralUncertaintyLabels: true,
    noGenericManagementFiller: true,
    noTemporalDistortion: true,
    noDuplicatedComorbidityLabels: true,
    requiredDiscriminativeFeaturesRetained: true,
    noTopThreeDifferentialListing: true,
    notOverlyTemplated: true,
  });
});

test("presentation quality rubric catches unsupported dangerous diagnosis additions", () => {
  const analysis = analyzeCase(CHEST_PAIN_CASE);
  const facts = buildPresentationFacts(CHEST_PAIN_CASE, analysis);
  const quality = assessPresentationQuality(
    "A 72-year-old man presents with central chest pain. Overall this raises concern for Acute coronary syndrome, but stroke is also likely.",
    facts,
  );

  assert.equal(quality.noHallucinations, false);
  assert.equal(quality.noUnsupportedDiagnosisMentions, false);
});

test("low-information abnormal-lab cases are encoded as diagnostically non-specific", () => {
  const input = buildCase({
    age: "61",
    sex: "male",
    presentingComplaint: "Weakness",
    history: "Weakness for one week with reduced appetite.",
    labs: {
      ues: { creatinine: 260, egfr: 24 },
      abg: { lactate: 5.2 },
    },
  });
  const analysis = analyzeCase(input);
  const facts = buildPresentationFacts(input, analysis);
  const prompt = buildLlmPresentationRewritePrompt(analysis, input);

  assert.equal(analysis.uncertainty.level, "high");
  assert.equal(facts.diagnostic_confidence, "insufficient");
  assert.deepEqual(facts.priority_concerns, []);
  assert.ok(facts.investigations.includes("raised lactate"));
  assert.ok(facts.investigations.includes("renal impairment"));
  assert.match(prompt, /"allowed_diagnoses":\[\]/);
  assert.doesNotMatch(prompt, /Temporal arteritis|Appendicitis/);
});

test("presentation duration extraction does not convert postpartum timing into symptom duration", () => {
  const input = buildCase({
    age: "34",
    sex: "female",
    presentingComplaint: "Pleuritic chest pain",
    history: "34-year-old woman with sudden pleuritic chest pain and shortness of breath, 10 days post C-section.",
    observations: "Sats 93%, HR 118.",
  });
  const facts = buildPresentationFacts(input, analyzeCase(input));

  assert.ok(facts.history.includes("sudden onset"));
  assert.ok(facts.relevant_background.includes("postpartum context"));
  assert.ok(!facts.history.includes("10 days duration"));
});

test("presentation duration extraction does not convert post-operative timing into symptom duration", () => {
  const input = buildCase({
    presentingComplaint: "Pleuritic chest pain",
    history: "Two weeks post-op with sudden pleuritic chest pain and shortness of breath.",
  });
  const facts = buildPresentationFacts(input, analyzeCase(input));

  assert.ok(facts.relevant_background.includes("recent surgery"));
  assert.ok(!facts.history.includes("two weeks duration"));
});

test("presentation duration extraction keeps explicit symptom duration", () => {
  const input = buildCase({
    presentingComplaint: "Chest pain",
    history: "Chest pain for 10 days with shortness of breath.",
  });
  const facts = buildPresentationFacts(input, analyzeCase(input));

  assert.ok(facts.history.includes("10 days duration"));
});

test("presentation background canonicalises diabetes specificity and duplicate synonyms", () => {
  const type1 = buildPresentationFacts(
    buildCase({
      presentingComplaint: "Shortness of breath",
      history: "Type 1 diabetes with vomiting, abdominal pain, polyuria, polydipsia and Kussmaul breathing.",
      pmh: "Type 1 diabetes",
    }),
    analyzeCase(buildCase({
      presentingComplaint: "Shortness of breath",
      history: "Type 1 diabetes with vomiting, abdominal pain, polyuria, polydipsia and Kussmaul breathing.",
      pmh: "Type 1 diabetes",
    })),
  );
  const generic = buildPresentationFacts(
    buildCase({
      presentingComplaint: "Shortness of breath",
      history: "Diabetes with vomiting and abdominal pain.",
      pmh: "Diabetes",
    }),
    analyzeCase(buildCase({
      presentingComplaint: "Shortness of breath",
      history: "Diabetes with vomiting and abdominal pain.",
      pmh: "Diabetes",
    })),
  );
  const duplicatedCopd = buildPresentationFacts(
    buildCase({
      presentingComplaint: "Shortness of breath",
      history: "Known COPD and COPD history with wheeze and productive cough.",
      pmh: "COPD, known COPD",
    }),
    analyzeCase(buildCase({
      presentingComplaint: "Shortness of breath",
      history: "Known COPD and COPD history with wheeze and productive cough.",
      pmh: "COPD, known COPD",
    })),
  );

  assert.ok(type1.relevant_background.includes("type 1 diabetes"));
  assert.ok(!type1.relevant_background.includes("diabetes"));
  assert.ok(generic.relevant_background.includes("diabetes"));
  assert.equal(duplicatedCopd.relevant_background.filter((fact) => fact === "COPD").length, 1);
});

test("presentation facts retain high-value discriminative features ahead of weaker labs", () => {
  const mesenteric = buildCase({
    age: "78",
    presentingComplaint: "Abdominal pain",
    history: "Sudden severe abdominal pain out of proportion to a soft mildly tender abdomen. Known atrial fibrillation.",
    pmh: "Atrial fibrillation",
    observations: "HR 112.",
    labs: { abg: { lactate: 5.6 } },
  });
  const facts = buildPresentationFacts(mesenteric, analyzeCase(mesenteric));

  assert.ok(facts.history.includes("pain out of proportion"));
  assert.ok(facts.investigations.includes("raised lactate"));
  assert.ok(facts.history.indexOf("pain out of proportion") <= 1);
});

test("presentation regression cases expose concise supported facts without top-three diagnosis lists", () => {
  const cases = [
    {
      name: "ACS",
      input: buildCase({
        age: "59",
        sex: "male",
        presentingComplaint: "Chest pain",
        history: "Central crushing chest pain radiating to the jaw with sweating and nausea.",
        pmh: "Hypertension, diabetes and high cholesterol.",
      }),
      requiredHistory: ["chest pain", "radiates to the jaw", "sweating"],
      requiredBackground: ["diabetes", "hypertension", "hyperlipidaemia"],
      maxConcerns: 1,
    },
    {
      name: "COPD",
      input: buildCase({
        age: "74",
        presentingComplaint: "Shortness of breath",
        history: "Known COPD with worsening breathlessness, wheeze and drowsiness.",
        pmh: "COPD",
        labs: { abg: { ph: 7.24, paco2: 8.8, pao2: 7.4 } },
      }),
      requiredBackground: ["COPD"],
      requiredInvestigations: ["respiratory acidosis", "hypoxaemia", "hypercapnia"],
      maxConcerns: 1,
    },
    {
      name: "DKA",
      input: buildCase({
        age: "21",
        presentingComplaint: "Vomiting",
        history: "Type 1 diabetes with vomiting, abdominal pain, polyuria, polydipsia and Kussmaul breathing.",
        pmh: "Type 1 diabetes",
        labs: { ues: { fastingGlucose: 29, bicarbonate: 10 }, abg: { ph: 7.15, bicarbonate: 10 } },
      }),
      requiredHistory: ["Kussmaul breathing", "polyuria", "polydipsia"],
      requiredBackground: ["type 1 diabetes"],
      forbiddenBackground: ["diabetes"],
      requiredInvestigations: ["metabolic acidosis", "hyperglycaemia"],
      maxConcerns: 1,
    },
    {
      name: "Cholangitis",
      input: buildCase({
        presentingComplaint: "RUQ pain and jaundice",
        history: "RUQ pain with fever, jaundice, dark urine and pale stools.",
        labs: { lfts: { bilirubin: 95, alp: 420, ggt: 300, alt: 80 } },
      }),
      requiredHistory: ["fever", "jaundice", "dark urine"],
      requiredInvestigations: ["cholestatic LFT pattern"],
      maxConcerns: 1,
    },
    {
      name: "Acute hepatitis",
      input: buildCase({
        presentingComplaint: "Jaundice",
        history: "Jaundice with malaise and nausea but no fever or RUQ tenderness.",
        keyNegatives: "No fever.",
        labs: { lfts: { bilirubin: 70, alt: 1250, ast: 1100, alp: 90, ggt: 40 } },
      }),
      requiredHistory: ["jaundice", "nausea"],
      requiredInvestigations: ["hepatocellular LFT pattern"],
      maxConcerns: 1,
    },
    {
      name: "GI bleed",
      input: buildCase({
        presentingComplaint: "Melaena",
        history: "Melaena with coffee-ground haematemesis, pallor and collapse.",
        labs: { fbc: { hb: 62, mcv: 82 }, ues: { urea: 21 } },
      }),
      requiredHistory: ["melaena", "haematemesis"],
      requiredInvestigations: ["Severe anaemia", "anaemia", "raised urea"],
      maxConcerns: 1,
    },
    {
      name: "Pneumonia",
      input: buildCase({
        presentingComplaint: "Shortness of breath",
        history: "Fever, productive cough, green sputum, pleuritic pain and shortness of breath with focal crackles.",
        observations: "Sats 89% on air.",
        labs: { fbc: { wcc: 17, neutrophils: 14 } },
      }),
      requiredHistory: ["productive cough", "sputum change", "fever"],
      requiredExamination: ["crackles", "hypoxia"],
      requiredInvestigations: ["leucocytosis"],
      forbiddenConcerns: ["Pneumothorax"],
      maxConcerns: 1,
    },
  ];

  for (const item of cases) {
    const facts = buildPresentationFacts(item.input, analyzeCase(item.input));

    for (const fact of item.requiredHistory ?? []) assert.ok(facts.history.includes(fact), item.name);
    for (const fact of item.requiredBackground ?? []) assert.ok(facts.relevant_background.includes(fact), item.name);
    for (const fact of item.forbiddenBackground ?? []) assert.ok(!facts.relevant_background.includes(fact), item.name);
    for (const fact of item.requiredExamination ?? []) assert.ok(facts.examination.includes(fact), item.name);
    for (const fact of item.requiredInvestigations ?? []) assert.ok(facts.investigations.includes(fact), item.name);
    for (const diagnosis of item.forbiddenConcerns ?? []) assert.ok(!facts.priority_concerns.includes(diagnosis), item.name);
    assert.ok(facts.priority_concerns.length <= item.maxConcerns, item.name);
  }
});
