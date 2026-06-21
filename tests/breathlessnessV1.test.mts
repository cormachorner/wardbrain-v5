import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";
import { setDbFeaturePhrasePatternsForTest } from "../lib/domain/featureExtractor.js";
import type { CaseInput } from "../lib/types.js";

function buildInput(overrides: Partial<CaseInput>): CaseInput {
  return {
    age: "",
    sex: "female",
    presentingComplaint: "Shortness of breath",
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

function expectBreathlessnessCase({
  name,
  input,
  expectedLead,
  expectedFeatures,
  expectedRedFlags = [],
  forbiddenRedFlags = [],
  forbiddenLeads = [],
  leadMustBeTop3 = false,
}: {
  name: string;
  input: CaseInput;
  expectedLead: string;
  expectedFeatures: string[];
  expectedRedFlags?: string[];
  forbiddenRedFlags?: string[];
  forbiddenLeads?: string[];
  leadMustBeTop3?: boolean;
}) {
  test(name, () => {
    setDbFeaturePhrasePatternsForTest({});

    const result = analyzeCase(input);
    const top3Names = result.differentials.slice(0, 3).map((differential) => differential.name);
    const redFlagNames = result.redFlags.map((flag) => flag.name);

    if (leadMustBeTop3) {
      assert.ok(top3Names.includes(expectedLead), `${expectedLead} not in top 3: ${top3Names.join(", ")}`);
    } else {
      assert.equal(result.differentials[0]?.name, expectedLead);
    }

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
    assert.deepEqual(
      forbiddenLeads.filter((lead) => result.differentials[0]?.name === lead),
      [],
    );
  });
}

expectBreathlessnessCase({
  name: "breathlessness-v1 PE after long-haul flight with pleuritic pain tachycardia hypoxia",
  input: buildInput({
    age: "45",
    history:
      "Sudden shortness of breath with pleuritic chest pain after a long haul flight. She is tachycardic and hypoxic with HR 124 and sats 89%.",
    observations: "HR 124 sats 89%",
    suspectedDiagnosis: "PE",
  }),
  expectedLead: "Pulmonary embolism",
  expectedFeatures: ["sob", "pleuritic_pain", "chest_pain", "sudden_onset", "long_haul_travel", "tachycardia", "hypoxia"],
  expectedRedFlags: ["PE suspicion pattern"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 pneumonia fever productive cough focal crackles hypoxia",
  input: buildInput({
    age: "61",
    history:
      "Four days of worsening shortness of breath with fever, productive cough, green sputum and focal crackles at the right base. Oxygen saturations are 90%.",
    observations: "sats 90%",
    suspectedDiagnosis: "Pneumonia",
  }),
  expectedLead: "Pneumonia",
  expectedFeatures: ["sob", "fever", "productive_cough", "sputum_change", "crackles", "hypoxia", "progressive_course"],
  forbiddenRedFlags: ["PE suspicion pattern", "ACS suspicion pattern"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 asthma exacerbation with wheeze inhaler use unable to speak full sentences",
  input: buildInput({
    age: "23",
    pmh: "Known asthma",
    history:
      "Known asthma with worsening shortness of breath and audible wheeze. She is using her blue inhaler more and can't speak full sentences. Sats 91%, RR 30.",
    observations: "sats 91% RR 30",
    suspectedDiagnosis: "Asthma attack",
  }),
  expectedLead: "Asthma exacerbation",
  expectedFeatures: ["sob", "wheeze", "known_asthma", "asthma_history", "inhaler_use", "increased_inhaler_use", "unable_to_speak_full_sentences", "tachypnoea", "hypoxia"],
  expectedRedFlags: ["Severe asthma pattern"],
  forbiddenLeads: ["Panic / anxiety"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 COPD exacerbation smoker sputum change wheeze",
  input: buildInput({
    age: "70",
    sex: "male",
    pmh: "COPD",
    social: "current smoker",
    history:
      "Known COPD and long smoking history with worsening breathlessness over several days, wheeze, productive cough and increased green sputum.",
    suspectedDiagnosis: "COPD exacerbation",
  }),
  expectedLead: "COPD exacerbation",
  expectedFeatures: ["sob", "known_copd", "copd_history", "smoking_history", "wheeze", "productive_cough", "sputum_change", "progressive_course"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 acute heart failure orthopnoea bibasal crackles oedema raised JVP",
  input: buildInput({
    age: "78",
    sex: "male",
    history:
      "Acute breathlessness with orthopnoea, waking at night gasping, bibasal crackles, raised JVP and bilateral ankle oedema. No fever or productive cough.",
    keyNegatives: "no fever no productive cough",
    suspectedDiagnosis: "Acute heart failure",
  }),
  expectedLead: "Heart failure",
  expectedFeatures: ["sob", "orthopnoea", "paroxysmal_nocturnal_dyspnoea", "bibasal_crackles", "raised_jvp", "peripheral_oedema", "ankle_swelling"],
  expectedRedFlags: ["Acute heart failure / pulmonary oedema pattern"],
  forbiddenLeads: ["Pneumonia"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 pneumothorax sudden unilateral pleuritic dyspnoea reduced air entry",
  input: buildInput({
    age: "24",
    sex: "male",
    social: "smoker",
    history:
      "Sudden shortness of breath with right-sided pleuritic chest pain. He has unilateral reduced air entry and hyperresonance on the right.",
    suspectedDiagnosis: "Pneumothorax",
  }),
  expectedLead: "Pneumothorax",
  expectedFeatures: ["sob", "sudden_onset", "pleuritic_pain", "chest_pain", "unilateral_reduced_air_entry", "reduced_air_entry", "hyperresonance", "smoking_history"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 ACS breathlessness equivalent older diabetic autonomic features",
  input: buildInput({
    age: "74",
    pmh: "diabetes hypertension",
    history:
      "Older diabetic patient with shortness of breath, chest heaviness, nausea and sweating. No pleuritic pain, no cough and no fever.",
    keyNegatives: "no pleuritic pain no cough no fever",
    suspectedDiagnosis: "ACS",
  }),
  expectedLead: "Acute coronary syndrome",
  expectedFeatures: ["sob", "chest_pain", "nausea", "sweating", "diabetic_context", "hypertension", "older_age"],
  expectedRedFlags: ["ACS suspicion pattern"],
  forbiddenRedFlags: ["PE suspicion pattern"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 panic attack tingling hyperventilation normal sats exam",
  input: buildInput({
    age: "27",
    history:
      "Sudden breathlessness during a panic attack with hyperventilation, tingling fingers and perioral paraesthesia. Normal sats and normal chest exam. No chest pain, no wheeze.",
    keyNegatives: "no chest pain no wheeze",
    suspectedDiagnosis: "Panic attack",
  }),
  expectedLead: "Panic / anxiety",
  expectedFeatures: ["sob", "panic_features", "tingling", "perioral_paraesthesia", "normal_exam"],
  forbiddenRedFlags: ["PE suspicion pattern", "Severe asthma pattern", "ACS suspicion pattern"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 anaemia progressive dyspnoea pallor fatigue heavy periods",
  input: buildInput({
    age: "36",
    history:
      "Several months of progressive exertional shortness of breath with marked fatigue, pallor and very heavy periods. Chest is clear with no oedema.",
    keyNegatives: "no oedema",
    suspectedDiagnosis: "Anaemia",
  }),
  expectedLead: "Anaemia",
  expectedFeatures: ["sob", "fatigue", "pallor", "heavy_menstrual_bleeding", "chronic_course", "normal_exam"],
  forbiddenLeads: ["Heart failure"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 DKA Kussmaul diabetes polyuria polydipsia vomiting",
  input: buildInput({
    age: "19",
    pmh: "type 1 diabetes",
    history:
      "Type 1 diabetes with deep rapid Kussmaul breathing, vomiting, abdominal pain, dehydration, polyuria and polydipsia. Glucose high.",
    suspectedDiagnosis: "DKA",
  }),
  expectedLead: "Diabetic ketoacidosis",
  expectedFeatures: ["diabetic_context", "kussmaul_breathing", "tachypnoea", "vomiting", "abdominal_pain", "dehydration", "polyuria", "polydipsia", "hyperglycaemia"],
  expectedRedFlags: ["DKA / metabolic acidosis pattern"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 hostile pneumonia beats PE when infection dominates",
  input: buildInput({
    age: "52",
    history:
      "Pleuritic chest pain and shortness of breath with fever, productive cough, green sputum and focal crackles. No travel, no surgery, no haemoptysis. Sats 94%.",
    keyNegatives: "no travel no surgery no haemoptysis",
    observations: "sats 94%",
    suspectedDiagnosis: "PE",
  }),
  expectedLead: "Pneumonia",
  expectedFeatures: ["sob", "pleuritic_pain", "chest_pain", "fever", "productive_cough", "sputum_change", "crackles"],
  forbiddenRedFlags: ["PE suspicion pattern"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 hostile PE beats pneumonia with cough noise",
  input: buildInput({
    age: "49",
    history:
      "Shortness of breath with mild cough after long haul travel, haemoptysis, tachycardia and hypoxia. Pleuritic pain is present. HR 118, sats 88%.",
    observations: "HR 118 sats 88%",
    suspectedDiagnosis: "Pneumonia",
  }),
  expectedLead: "Pulmonary embolism",
  expectedFeatures: ["sob", "cough", "long_haul_travel", "haemoptysis", "tachycardia", "hypoxia", "pleuritic_pain"],
  expectedRedFlags: ["PE suspicion pattern"],
  forbiddenLeads: ["Pneumonia"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 hostile asthma beats panic with low peak flow hypoxia",
  input: buildInput({
    age: "29",
    pmh: "asthma",
    history:
      "Anxious and breathless, but she has wheeze, poor peak flow, accessory muscle use and sats 90%. She cannot speak full sentences.",
    observations: "sats 90%",
    suspectedDiagnosis: "Panic attack",
  }),
  expectedLead: "Asthma exacerbation",
  expectedFeatures: ["sob", "wheeze", "known_asthma", "poor_peak_flow", "accessory_muscle_use", "hypoxia", "unable_to_speak_full_sentences"],
  expectedRedFlags: ["Severe asthma pattern"],
  forbiddenLeads: ["Panic / anxiety"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 hostile panic beats PE asthma when vitals and exam reassuring",
  input: buildInput({
    age: "22",
    history:
      "Breathlessness during a panic attack with hyperventilation, tingling fingers and perioral paraesthesia. Normal sats, normal chest exam, no chest pain, no wheeze, no travel and no haemoptysis.",
    keyNegatives: "no chest pain no wheeze no travel no haemoptysis",
    suspectedDiagnosis: "PE",
  }),
  expectedLead: "Panic / anxiety",
  expectedFeatures: ["sob", "panic_features", "tingling", "perioral_paraesthesia", "normal_exam"],
  forbiddenRedFlags: ["PE suspicion pattern", "Severe asthma pattern", "ACS suspicion pattern"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 hostile heart failure beats pneumonia without infective sputum",
  input: buildInput({
    age: "82",
    history:
      "Breathlessness with orthopnoea, raised JVP, bibasal crackles and peripheral oedema. No fever and no productive cough.",
    keyNegatives: "no fever no productive cough",
    suspectedDiagnosis: "Pneumonia",
  }),
  expectedLead: "Heart failure",
  expectedFeatures: ["sob", "orthopnoea", "raised_jvp", "bibasal_crackles", "peripheral_oedema"],
  expectedRedFlags: ["Acute heart failure / pulmonary oedema pattern"],
  forbiddenLeads: ["Pneumonia"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 hostile COPD beats asthma in older smoker with COPD sputum change",
  input: buildInput({
    age: "73",
    sex: "male",
    pmh: "COPD",
    social: "smoker",
    history:
      "Older smoker with known COPD has breathlessness, wheeze, productive cough and increased sputum over several days.",
    suspectedDiagnosis: "Asthma",
  }),
  expectedLead: "COPD exacerbation",
  expectedFeatures: ["sob", "wheeze", "known_copd", "copd_history", "smoking_history", "productive_cough", "sputum_change", "progressive_course", "older_age"],
  forbiddenLeads: ["Asthma exacerbation"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 hostile pneumothorax beats PE with unilateral hyperresonance",
  input: buildInput({
    age: "25",
    sex: "male",
    history:
      "Sudden breathlessness and pleuritic chest pain. There is unilateral reduced air entry with hyperresonance. No travel, no haemoptysis.",
    keyNegatives: "no travel no haemoptysis",
    suspectedDiagnosis: "PE",
  }),
  expectedLead: "Pneumothorax",
  expectedFeatures: ["sob", "sudden_onset", "pleuritic_pain", "chest_pain", "unilateral_reduced_air_entry", "hyperresonance"],
  forbiddenRedFlags: ["PE suspicion pattern"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 hostile ACS beats PE in diabetic autonomic chest heaviness",
  input: buildInput({
    age: "69",
    pmh: "type 2 diabetes hypertension",
    history:
      "Shortness of breath with chest heaviness, nausea and sweating in an older diabetic patient. No pleuritic pain, no haemoptysis and no travel.",
    keyNegatives: "no pleuritic pain no haemoptysis no travel",
    suspectedDiagnosis: "PE",
  }),
  expectedLead: "Acute coronary syndrome",
  expectedFeatures: ["sob", "chest_pain", "nausea", "sweating", "diabetic_context", "hypertension", "older_age"],
  expectedRedFlags: ["ACS suspicion pattern"],
  forbiddenRedFlags: ["PE suspicion pattern"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 hostile DKA beats sepsis without infection instability",
  input: buildInput({
    age: "31",
    pmh: "diabetes",
    history:
      "Diabetes with Kussmaul breathing, polyuria, polydipsia, vomiting and dehydration. Glucose high. No fever, no cough and no infective symptoms.",
    keyNegatives: "no fever no cough",
    suspectedDiagnosis: "Sepsis",
  }),
  expectedLead: "Diabetic ketoacidosis",
  expectedFeatures: ["diabetic_context", "kussmaul_breathing", "tachypnoea", "polyuria", "polydipsia", "vomiting", "dehydration", "hyperglycaemia"],
  expectedRedFlags: ["DKA / metabolic acidosis pattern"],
  forbiddenRedFlags: ["High-risk sepsis pattern"],
  forbiddenLeads: ["Sepsis"],
});

expectBreathlessnessCase({
  name: "breathlessness-v1 hostile anaemia beats heart failure without overload",
  input: buildInput({
    age: "34",
    history:
      "Progressive exertional breathlessness for months with pallor, fatigue and heavy menstrual bleeding. No crackles, no oedema and JVP is not raised.",
    keyNegatives: "no crackles no oedema JVP is not raised",
    suspectedDiagnosis: "Heart failure",
  }),
  expectedLead: "Anaemia",
  expectedFeatures: ["sob", "pallor", "fatigue", "heavy_menstrual_bleeding", "chronic_course"],
  forbiddenLeads: ["Heart failure"],
});
