import type { CaseInput } from "../../lib/types";
import type { LlmProposedFeature } from "../../lib/llm/schema";

export type LlmEvaluationFixture = {
  id: string;
  title: string;
  input: CaseInput;
  expectedLeadDiagnosisSlug: string;
  expectedKeyFeatures: string[];
  expectedRedFlags?: string[];
  forbiddenRedFlags?: string[];
  expectedUsefulLlmAddedFeatures: string[];
  mockLlmFeatures: LlmProposedFeature[];
};

function buildInput(overrides: Partial<CaseInput>): CaseInput {
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
    suspectedDiagnosis: "",
    ...overrides,
  };
}

function mockFeature(slug: string, evidence: string, confidence = 0.95): LlmProposedFeature {
  return { slug, evidence, confidence };
}

export const messyPilotLlmEvaluationFixtures: LlmEvaluationFixture[] = [
  {
    id: "messy-acs-indigestion-exertional",
    title: "ACS indigestion / exertional chest heaviness",
    input: buildInput({
      age: "58",
      sex: "male",
      presentingComplaint: "Indigestion",
      history:
        "58-year-old man says he has “indigestion” and a heavy feeling in the middle of his chest since mowing the lawn an hour ago. It spread a bit into his jaw and left shoulder and he felt clammy and sick. He has type 2 diabetes, hypertension and high cholesterol. He keeps saying it’s probably the takeaway he had earlier because he’s had reflux before.",
      suspectedDiagnosis: "Reflux",
    }),
    expectedLeadDiagnosisSlug: "acute-coronary-syndrome",
    expectedKeyFeatures: [
      "chest_pain",
      "chest_heaviness",
      "exertional_pain",
      "pain_radiates_to_jaw",
      "pain_radiates_to_shoulder",
      "nausea",
      "hyperlipidaemia",
      "indigestion_like_chest_pain",
    ],
    expectedRedFlags: ["ACS suspicion pattern"],
    forbiddenRedFlags: ["PE suspicion pattern"],
    expectedUsefulLlmAddedFeatures: [
      "exertional_pain",
      "chest_heaviness",
      "pain_radiates_to_jaw",
      "pain_radiates_to_shoulder",
      "nausea",
      "hyperlipidaemia",
      "indigestion_like_chest_pain",
    ],
    mockLlmFeatures: [
      mockFeature("exertional_pain", "since mowing the lawn"),
      mockFeature("chest_heaviness", "heavy feeling in the middle of his chest"),
      mockFeature("pain_radiates_to_jaw", "spread a bit into his jaw"),
      mockFeature("pain_radiates_to_shoulder", "left shoulder"),
      mockFeature("nausea", "felt sick"),
      mockFeature("hyperlipidaemia", "high cholesterol"),
      mockFeature("indigestion_like_chest_pain", "indigestion"),
    ],
  },
  {
    id: "messy-tension-pneumothorax",
    title: "Tension pneumothorax with quiet hemithorax and hypotension",
    input: buildInput({
      age: "23",
      sex: "male",
      presentingComplaint: "Chest pain and shortness of breath",
      history:
        "Tall 23-year-old man with sudden left-sided pleuritic chest pain and rapidly worsening shortness of breath while sitting watching TV. No cough or fever. Looks distressed, HR 128, sats 89%, BP 92/60. Trachea seems slightly shifted and the left chest is very quiet with hyperresonance.",
      observations: "HR 128, sats 89%, BP 92/60",
    }),
    expectedLeadDiagnosisSlug: "pneumothorax",
    expectedKeyFeatures: [
      "sudden_onset",
      "pleuritic_pain",
      "sob",
      "unilateral_reduced_air_entry",
      "hyperresonance",
      "hypoxia",
      "tachycardia",
      "hypotension",
      "tracheal_deviation",
    ],
    expectedRedFlags: ["Tension pneumothorax pattern"],
    forbiddenRedFlags: ["PE suspicion pattern"],
    expectedUsefulLlmAddedFeatures: [
      "unilateral_reduced_air_entry",
      "tracheal_deviation",
      "hypotension",
    ],
    mockLlmFeatures: [
      mockFeature("unilateral_reduced_air_entry", "left chest is very quiet"),
      mockFeature("tracheal_deviation", "Trachea seems slightly shifted"),
      mockFeature("hypotension", "BP 92/60"),
    ],
  },
  {
    id: "messy-bowel-obstruction-hysterectomy",
    title: "Bowel obstruction after previous hysterectomy with no stool/flatus",
    input: buildInput({
      age: "68",
      sex: "female",
      presentingComplaint: "Abdominal pain",
      history:
        "68-year-old woman with previous hysterectomy presents with 2 days of colicky abdominal pain, abdominal swelling and repeated vomiting. She hasn’t passed stool or flatus since yesterday. Pain has become more constant this evening and she looks uncomfortable. Pulse 108. Abdomen is distended with mild diffuse tenderness and some voluntary guarding, but no obvious rigidity.",
      observations: "Pulse 108",
    }),
    expectedLeadDiagnosisSlug: "bowel-obstruction",
    expectedKeyFeatures: [
      "previous_abdominal_surgery",
      "colicky_pain",
      "distension",
      "vomiting",
      "obstipation",
      "unable_to_pass_flatus",
      "constant_pain",
      "tachycardia",
    ],
    forbiddenRedFlags: ["Perforated viscus / peritonitis pattern"],
    expectedUsefulLlmAddedFeatures: [
      "previous_abdominal_surgery",
      "colicky_pain",
      "distension",
      "obstipation",
      "unable_to_pass_flatus",
      "constant_pain",
    ],
    mockLlmFeatures: [
      mockFeature("previous_abdominal_surgery", "previous hysterectomy"),
      mockFeature("colicky_pain", "colicky abdominal pain"),
      mockFeature("distension", "abdominal swelling"),
      mockFeature("obstipation", "hasn’t passed stool"),
      mockFeature("unable_to_pass_flatus", "or flatus"),
      mockFeature("constant_pain", "Pain has become more constant"),
    ],
  },
  {
    id: "messy-dka-kussmaul-fruity-breath",
    title: "DKA with Kussmaul breathing, polyuria, polydipsia and fruity breath",
    input: buildInput({
      age: "21",
      sex: "male",
      presentingComplaint: "Breathlessness",
      history:
        "21-year-old man with type 1 diabetes has been vomiting since yesterday and is now breathing very deeply and quickly. He says he’s been thirsty for days and peeing constantly. Mild abdominal pain. No cough, no chest pain. Girlfriend says his breath smells “fruity”. HR 120, sats 99% on air, RR 32.",
      observations: "HR 120, sats 99% on air, RR 32",
    }),
    expectedLeadDiagnosisSlug: "diabetic-ketoacidosis",
    expectedKeyFeatures: [
      "diabetic_context",
      "type_1_diabetes",
      "vomiting",
      "abdominal_pain",
      "kussmaul_breathing",
      "polydipsia",
      "polyuria",
      "ketosis_breath",
      "tachycardia",
      "tachypnoea",
    ],
    expectedRedFlags: ["DKA / metabolic acidosis pattern"],
    forbiddenRedFlags: ["PE suspicion pattern"],
    expectedUsefulLlmAddedFeatures: [
      "kussmaul_breathing",
      "polyuria",
      "polydipsia",
      "ketosis_breath",
      "type_1_diabetes",
    ],
    mockLlmFeatures: [
      mockFeature("kussmaul_breathing", "breathing very deeply and quickly"),
      mockFeature("polyuria", "peeing constantly"),
      mockFeature("polydipsia", "thirsty for days"),
      mockFeature("ketosis_breath", "breath smells fruity"),
      mockFeature("type_1_diabetes", "type 1 diabetes"),
    ],
  },
  {
    id: "messy-panic-normal-sats-negated-danger",
    title: "Panic attack with normal sats/exam and negated PE/asthma features",
    input: buildInput({
      age: "27",
      sex: "female",
      presentingComplaint: "Breathlessness",
      history:
        "Sudden breathlessness during a panic attack with hyperventilation, tingling fingers and perioral paraesthesia. Normal sats and normal chest exam. No chest pain, no wheeze, no travel and no haemoptysis.",
      keyNegatives: "no chest pain no wheeze no travel no haemoptysis",
      suspectedDiagnosis: "Panic attack",
    }),
    expectedLeadDiagnosisSlug: "panic-anxiety",
    expectedKeyFeatures: [
      "sob",
      "panic_features",
      "tingling",
      "perioral_paraesthesia",
      "normal_exam",
    ],
    forbiddenRedFlags: [
      "PE suspicion pattern",
      "Severe asthma pattern",
      "ACS suspicion pattern",
    ],
    expectedUsefulLlmAddedFeatures: [],
    mockLlmFeatures: [
      mockFeature("panic_features", "panic attack"),
      mockFeature("tingling", "tingling fingers"),
      mockFeature("perioral_paraesthesia", "perioral paraesthesia"),
      mockFeature("normal_exam", "normal chest exam"),
    ],
  },
];
