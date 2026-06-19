import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";
import { setDbFeaturePhrasePatternsForTest } from "../lib/domain/featureExtractor.js";
import type { CaseInput } from "../lib/types.js";

function buildInput(overrides: Partial<CaseInput>): CaseInput {
  return {
    age: "",
    sex: "male",
    presentingComplaint: "Chest pain",
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
    suspectedDiagnosis: "",
    ...overrides,
  };
}

function expectChestPainCase({
  name,
  input,
  expectedLead,
  expectedFeatures,
  expectedRedFlags = [],
  forbiddenRedFlags = [],
}: {
  name: string;
  input: CaseInput;
  expectedLead: string;
  expectedFeatures: string[];
  expectedRedFlags?: string[];
  forbiddenRedFlags?: string[];
}) {
  test(name, () => {
    setDbFeaturePhrasePatternsForTest({});

    const result = analyzeCase(input);
    const redFlagNames = result.redFlags.map((flag) => flag.name);

    assert.equal(result.differentials[0]?.name, expectedLead);
    assert.deepEqual(
      expectedFeatures.filter((feature) => !result.detectedFeatureSlugs.includes(feature)),
      [],
    );
    assert.deepEqual(
      expectedRedFlags.filter((redFlag) => !redFlagNames.includes(redFlag)),
      [],
    );
    assert.deepEqual(
      forbiddenRedFlags.filter((redFlag) => redFlagNames.includes(redFlag)),
      [],
    );
  });
}

expectChestPainCase({
  name: "chest-pain-v1 ACS classic pressure with radiation and autonomic features",
  input: buildInput({
    age: "64",
    history:
      "Central crushing chest pressure radiating to the jaw and left arm with sweating and nausea. He has hypertension and smokes.",
    pmh: "hypertension",
    social: "smoker",
    suspectedDiagnosis: "ACS",
  }),
  expectedLead: "Acute coronary syndrome",
  expectedFeatures: ["chest_pain", "jaw_pain", "arm_pain", "sweating", "nausea", "hypertension", "smoking_history"],
  expectedRedFlags: ["ACS suspicion pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 pulmonary embolism with pleuritic pain hypoxia haemoptysis and travel",
  input: buildInput({
    age: "42",
    sex: "female",
    history:
      "Sudden pleuritic chest pain with shortness of breath and coughing blood three days after long haul flight. HR 118 and oxygen saturations 90%.",
    observations: "HR 118 sats 90%",
    suspectedDiagnosis: "PE",
  }),
  expectedLead: "Pulmonary embolism",
  expectedFeatures: ["chest_pain", "sudden_onset", "pleuritic_pain", "sob", "haemoptysis", "long_haul_travel", "tachycardia", "hypoxia"],
  expectedRedFlags: ["PE suspicion pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 pneumothorax with unilateral reduced air entry in tall thin smoker",
  input: buildInput({
    age: "24",
    history:
      "Sudden one sided pleuritic chest pain and shortness of breath. He is tall and thin with reduced air entry on the left.",
    social: "smoker",
    suspectedDiagnosis: "Pneumothorax",
  }),
  expectedLead: "Pneumothorax",
  expectedFeatures: ["chest_pain", "sudden_onset", "pleuritic_pain", "sob", "tall_thin_habitus", "unilateral_reduced_air_entry"],
});

expectChestPainCase({
  name: "chest-pain-v1 acute aortic syndrome with tearing pain to back and collapse",
  input: buildInput({
    age: "68",
    history:
      "Abrupt tearing chest pain radiating through to the back between the shoulder blades with collapse. Known hypertension.",
    pmh: "hypertension",
    suspectedDiagnosis: "Aortic dissection",
  }),
  expectedLead: "Acute aortic syndrome",
  expectedFeatures: ["chest_pain", "tearing_pain", "back_radiation", "collapse", "hypertension", "older_age"],
  expectedRedFlags: ["Acute aortic syndrome pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 pneumonia with progressive infective pleuritic pattern",
  input: buildInput({
    age: "58",
    sex: "female",
    history:
      "Progressive pleuritic chest pain and shortness of breath for four days with productive cough, green sputum, fever and rigors.",
    suspectedDiagnosis: "Pneumonia",
  }),
  expectedLead: "Pneumonia",
  expectedFeatures: ["chest_pain", "pleuritic_pain", "sob", "productive_cough", "sputum_change", "fever", "rigors", "infection_source"],
  forbiddenRedFlags: ["ACS suspicion pattern", "Acute cholangitis pattern", "High-risk sepsis pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 pericarditis with positional pleuritic pain after viral illness",
  input: buildInput({
    age: "31",
    history:
      "Sharp central pleuritic chest pain worse lying flat and improved by sitting forward after a recent viral illness.",
    suspectedDiagnosis: "Pericarditis",
  }),
  expectedLead: "Pericarditis",
  expectedFeatures: ["chest_pain", "pleuritic_pain", "worse_lying_flat", "better_sitting_forward", "recent_infection"],
});

expectChestPainCase({
  name: "chest-pain-v1 GORD with meal-related burning reflux relieved by antacids",
  input: buildInput({
    age: "29",
    history:
      "Burning retrosternal chest discomfort after a large spicy meal with acid reflux and sour taste, improved with antacids. No shortness of breath, sweating or radiation.",
    keyNegatives: "no shortness of breath no sweating no radiation",
    suspectedDiagnosis: "GORD",
  }),
  expectedLead: "GORD",
  expectedFeatures: ["chest_pain", "heartburn", "worse_after_meals", "acid_regurgitation", "antacid_relief"],
  forbiddenRedFlags: ["ACS suspicion pattern", "PE suspicion pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 musculoskeletal chest pain after lifting with reproducible tenderness",
  input: buildInput({
    age: "34",
    history:
      "Localized left chest wall pain after heavy lifting, reproducible on palpation and worse when twisting or moving the arm. No shortness of breath.",
    keyNegatives: "no shortness of breath",
    suspectedDiagnosis: "Musculoskeletal chest pain",
  }),
  expectedLead: "Musculoskeletal chest pain",
  expectedFeatures: ["chest_pain", "post_lifting_onset", "reproducible_chest_wall_tenderness", "movement_related_chest_pain"],
  forbiddenRedFlags: ["ACS suspicion pattern", "PE suspicion pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 anxiety panic with hyperventilation and tingling",
  input: buildInput({
    age: "26",
    sex: "female",
    history:
      "Tight chest pain during a panic attack with hyperventilation, tingling fingers, trembling and overwhelming fear. Symptoms settled with breathing control.",
    suspectedDiagnosis: "Panic attack",
  }),
  expectedLead: "Panic / anxiety",
  expectedFeatures: ["chest_pain", "panic_features"],
  forbiddenRedFlags: ["ACS suspicion pattern", "PE suspicion pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 ACS epigastric equivalent in older diabetic patient",
  input: buildInput({
    age: "72",
    sex: "female",
    presentingComplaint: "Epigastric discomfort",
    history:
      "Indigestion-like epigastric and chest heaviness with nausea, sweating and shortness of breath. She has diabetes and hypertension.",
    pmh: "diabetes hypertension",
    suspectedDiagnosis: "ACS",
  }),
  expectedLead: "Acute coronary syndrome",
  expectedFeatures: ["chest_pain", "indigestion_like_chest_pain", "acs_equivalent_pain", "epigastric_pain", "sweating", "nausea", "sob", "diabetic_context", "older_age"],
  expectedRedFlags: ["ACS suspicion pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 hostile ACS beats GORD when reflux noise coexists with ischemic features",
  input: buildInput({
    age: "59",
    history:
      "Burning central chest discomfort after dinner but also pressure radiating to the left arm with sweating and nausea. Hypertension and smoker.",
    pmh: "hypertension",
    social: "smoker",
    suspectedDiagnosis: "GORD",
  }),
  expectedLead: "Acute coronary syndrome",
  expectedFeatures: ["chest_pain", "arm_pain", "sweating", "nausea", "hypertension", "smoking_history"],
  expectedRedFlags: ["ACS suspicion pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 hostile PE beats pneumonia noise when hypoxia tachycardia and travel dominate",
  input: buildInput({
    age: "45",
    sex: "female",
    history:
      "Pleuritic chest pain and shortness of breath after a long haul flight with mild cough. No fever. HR 122, sats 89%.",
    keyNegatives: "no fever",
    observations: "HR 122 sats 89%",
    suspectedDiagnosis: "Pneumonia",
  }),
  expectedLead: "Pulmonary embolism",
  expectedFeatures: ["chest_pain", "pleuritic_pain", "sob", "long_haul_travel", "tachycardia", "hypoxia"],
  expectedRedFlags: ["PE suspicion pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 hostile pneumothorax beats PE when unilateral air entry dominates",
  input: buildInput({
    age: "22",
    history:
      "Sudden pleuritic chest pain and shortness of breath while resting. Tall thin smoker with reduced air entry on the right. No travel, no surgery, no haemoptysis.",
    social: "smoker",
    keyNegatives: "no travel no surgery no haemoptysis",
    suspectedDiagnosis: "PE",
  }),
  expectedLead: "Pneumothorax",
  expectedFeatures: ["chest_pain", "sudden_onset", "pleuritic_pain", "sob", "tall_thin_habitus", "unilateral_reduced_air_entry"],
});

expectChestPainCase({
  name: "chest-pain-v1 hostile aortic syndrome beats ACS when tearing back-radiating collapse dominates",
  input: buildInput({
    age: "71",
    history:
      "Severe chest pain with sweating, but it was abrupt tearing pain radiating to the back and he collapsed. Known hypertension.",
    pmh: "hypertension",
    suspectedDiagnosis: "ACS",
  }),
  expectedLead: "Acute aortic syndrome",
  expectedFeatures: ["chest_pain", "tearing_pain", "back_radiation", "collapse", "hypertension", "sweating", "older_age"],
  expectedRedFlags: ["Acute aortic syndrome pattern"],
  forbiddenRedFlags: ["Hypoglycaemia urgent reversible-cause pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 hostile pneumonia beats PE when infective progressive pattern dominates",
  input: buildInput({
    age: "63",
    history:
      "Pleuritic chest pain with shortness of breath, fever, rigors, productive cough and green sputum worsening over five days. No haemoptysis or travel.",
    keyNegatives: "no haemoptysis no travel",
    suspectedDiagnosis: "PE",
  }),
  expectedLead: "Pneumonia",
  expectedFeatures: ["chest_pain", "pleuritic_pain", "sob", "fever", "rigors", "productive_cough", "sputum_change", "infection_source"],
  forbiddenRedFlags: ["ACS suspicion pattern", "Acute cholangitis pattern", "High-risk sepsis pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 hostile pericarditis beats PE when positional viral pattern dominates",
  input: buildInput({
    age: "28",
    history:
      "Sharp pleuritic central chest pain after a viral illness, worse lying flat and better leaning forward. No haemoptysis, no travel, normal oxygen saturations.",
    keyNegatives: "no haemoptysis no travel normal oxygen saturations",
    suspectedDiagnosis: "PE",
  }),
  expectedLead: "Pericarditis",
  expectedFeatures: ["chest_pain", "pleuritic_pain", "recent_infection", "worse_lying_flat", "better_sitting_forward"],
});

expectChestPainCase({
  name: "chest-pain-v1 hostile GORD beats ACS when reflux features dominate and cardiac features are absent",
  input: buildInput({
    age: "36",
    history:
      "Burning retrosternal discomfort after eating with acid reflux, sour taste and antacid relief. No radiation, no sweating, no shortness of breath.",
    keyNegatives: "no radiation no sweating no shortness of breath",
    suspectedDiagnosis: "ACS",
  }),
  expectedLead: "GORD",
  expectedFeatures: ["chest_pain", "heartburn", "worse_after_meals", "acid_regurgitation"],
  forbiddenRedFlags: ["ACS suspicion pattern", "PE suspicion pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 hostile musculoskeletal pain beats ACS and PE when reproducible movement pattern dominates",
  input: buildInput({
    age: "41",
    history:
      "Sharp localized chest pain after lifting boxes, reproducible on palpation and worse when twisting. No sweating, nausea, radiation or shortness of breath.",
    keyNegatives: "no sweating no nausea no radiation no shortness of breath",
    suspectedDiagnosis: "ACS",
  }),
  expectedLead: "Musculoskeletal chest pain",
  expectedFeatures: ["chest_pain", "post_lifting_onset", "reproducible_chest_wall_tenderness", "movement_related_chest_pain"],
  forbiddenRedFlags: ["ACS suspicion pattern", "PE suspicion pattern"],
});

expectChestPainCase({
  name: "chest-pain-v1 hostile panic beats PE when panic physiology is explicit and oxygen/VTE clues are absent",
  input: buildInput({
    age: "24",
    sex: "female",
    history:
      "Chest tightness with hyperventilation, tingling fingers, trembling and panic during an exam. Oxygen saturations normal, no pleuritic pain, no travel, no haemoptysis.",
    keyNegatives: "normal oxygen saturations no pleuritic pain no travel no haemoptysis",
    suspectedDiagnosis: "PE",
  }),
  expectedLead: "Panic / anxiety",
  expectedFeatures: ["chest_pain", "panic_features"],
  forbiddenRedFlags: ["ACS suspicion pattern", "PE suspicion pattern"],
});
