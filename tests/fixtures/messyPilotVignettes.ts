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
  forbiddenLeadDiagnosisSlugs?: string[];
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

export const hardUnseenLlmEvaluationFixtures: LlmEvaluationFixture[] = [
  {
    id: "hard-unseen-acs-no-pain-sitting-on-chest",
    title: "Hard unseen ACS without the word pain",
    input: buildInput({
      age: "62",
      sex: "male",
      presentingComplaint: "Chest pressure",
      history:
        "A 62-year-old man says it feels like someone is sitting on his chest when he walks uphill. It settles when he stops and rests, but came back today with clamminess and feeling sick. The tightness seems to go up into his throat. He has type 2 diabetes and high cholesterol.",
      suspectedDiagnosis: "Indigestion",
    }),
    expectedLeadDiagnosisSlug: "acute-coronary-syndrome",
    expectedKeyFeatures: [
      "chest_pain",
      "chest_heaviness",
      "exertional_pain",
      "sweating",
      "nausea",
      "diabetic_context",
      "hyperlipidaemia",
    ],
    expectedRedFlags: ["ACS suspicion pattern"],
    forbiddenRedFlags: ["PE suspicion pattern"],
    forbiddenLeadDiagnosisSlugs: ["gord", "panic-anxiety"],
    expectedUsefulLlmAddedFeatures: [
      "chest_pain",
      "chest_heaviness",
      "exertional_pain",
      "sweating",
      "nausea",
      "diabetic_context",
      "hyperlipidaemia",
    ],
    mockLlmFeatures: [
      mockFeature("chest_pain", "someone is sitting on his chest"),
      mockFeature("chest_heaviness", "someone is sitting on his chest"),
      mockFeature("exertional_pain", "when he walks uphill"),
      mockFeature("sweating", "clamminess"),
      mockFeature("nausea", "feeling sick"),
      mockFeature("diabetic_context", "type 2 diabetes"),
      mockFeature("hyperlipidaemia", "high cholesterol"),
    ],
  },
  {
    id: "hard-unseen-pe-pulled-rib-muscle",
    title: "Hard unseen PE disguised as pulled rib muscle",
    input: buildInput({
      age: "44",
      sex: "female",
      presentingComplaint: "Rib pain and breathlessness",
      history:
        "She thinks she has pulled a rib muscle, but the sharp right-sided pain is worse when she breathes in and she is short of breath. She had a knee operation ten days ago and her left calf is swollen. HR 122 and sats are 88% on air. No fever and no productive cough.",
      observations: "HR 122, sats 88% on air",
      suspectedDiagnosis: "Pulled muscle",
    }),
    expectedLeadDiagnosisSlug: "pulmonary-embolism",
    expectedKeyFeatures: [
      "pleuritic_pain",
      "sob",
      "recent_surgery",
      "leg_swelling",
      "tachycardia",
      "hypoxia",
    ],
    expectedRedFlags: ["PE suspicion pattern"],
    forbiddenRedFlags: ["Pneumonia with sepsis risk pattern"],
    forbiddenLeadDiagnosisSlugs: ["musculoskeletal-chest-pain", "pneumonia"],
    expectedUsefulLlmAddedFeatures: [
      "pleuritic_pain",
      "sob",
      "recent_surgery",
      "leg_swelling",
      "tachycardia",
      "hypoxia",
    ],
    mockLlmFeatures: [
      mockFeature("pleuritic_pain", "worse when she breathes in"),
      mockFeature("sob", "short of breath"),
      mockFeature("recent_surgery", "knee operation ten days ago"),
      mockFeature("leg_swelling", "left calf is swollen"),
      mockFeature("tachycardia", "HR 122"),
      mockFeature("hypoxia", "sats are 88% on air"),
    ],
  },
  {
    id: "hard-unseen-pneumonia-explicit-pe-negatives",
    title: "Hard unseen pneumonia with explicit PE negatives",
    input: buildInput({
      age: "57",
      sex: "male",
      presentingComplaint: "Breathlessness and cough",
      history:
        "Five days of worsening breathlessness with fever, productive cough bringing up green sputum, and focal crackles at the left base. He has no pleuritic chest pain, no haemoptysis, no calf swelling, no recent surgery and no long-haul travel.",
      keyNegatives:
        "no pleuritic chest pain no haemoptysis no calf swelling no recent surgery no long-haul travel",
    }),
    expectedLeadDiagnosisSlug: "pneumonia",
    expectedKeyFeatures: [
      "sob",
      "fever",
      "productive_cough",
      "sputum_change",
      "crackles",
      "progressive_course",
    ],
    forbiddenRedFlags: ["PE suspicion pattern"],
    forbiddenLeadDiagnosisSlugs: ["pulmonary-embolism"],
    expectedUsefulLlmAddedFeatures: [
      "sob",
      "fever",
      "productive_cough",
      "sputum_change",
      "crackles",
      "progressive_course",
    ],
    mockLlmFeatures: [
      mockFeature("sob", "breathlessness"),
      mockFeature("fever", "fever"),
      mockFeature("productive_cough", "productive cough"),
      mockFeature("sputum_change", "green sputum"),
      mockFeature("crackles", "focal crackles at the left base"),
      mockFeature("progressive_course", "Five days of worsening"),
    ],
  },
  {
    id: "hard-unseen-dka-deep-sighing-breaths",
    title: "Hard unseen DKA without saying Kussmaul",
    input: buildInput({
      age: "19",
      sex: "female",
      presentingComplaint: "Breathlessness and vomiting",
      history:
        "A 19-year-old with type 1 diabetes missed her insulin and has been vomiting all night. She is taking big deep sighing breaths and her mum says her breath smells of pear drops. She has been drinking constantly and passing lots of urine. Sats are 99% on air. No wheeze and no cough.",
      observations: "Sats 99% on air",
    }),
    expectedLeadDiagnosisSlug: "diabetic-ketoacidosis",
    expectedKeyFeatures: [
      "diabetic_context",
      "type_1_diabetes",
      "vomiting",
      "kussmaul_breathing",
      "ketosis_breath",
      "polydipsia",
      "polyuria",
      "normal_oxygen_saturations",
    ],
    expectedRedFlags: ["DKA / metabolic acidosis pattern"],
    forbiddenRedFlags: ["PE suspicion pattern", "Severe asthma pattern"],
    forbiddenLeadDiagnosisSlugs: ["pulmonary-embolism", "asthma-exacerbation"],
    expectedUsefulLlmAddedFeatures: [
      "diabetic_context",
      "type_1_diabetes",
      "vomiting",
      "kussmaul_breathing",
      "ketosis_breath",
      "polydipsia",
      "polyuria",
      "normal_oxygen_saturations",
    ],
    mockLlmFeatures: [
      mockFeature("diabetic_context", "type 1 diabetes"),
      mockFeature("type_1_diabetes", "type 1 diabetes"),
      mockFeature("vomiting", "vomiting all night"),
      mockFeature("kussmaul_breathing", "big deep sighing breaths"),
      mockFeature("ketosis_breath", "breath smells of pear drops"),
      mockFeature("polydipsia", "drinking constantly"),
      mockFeature("polyuria", "passing lots of urine"),
      mockFeature("normal_oxygen_saturations", "Sats are 99% on air"),
    ],
  },
  {
    id: "hard-unseen-bowel-obstruction-nontextbook",
    title: "Hard unseen bowel obstruction without textbook wording",
    input: buildInput({
      age: "71",
      sex: "male",
      presentingComplaint: "Abdominal pain and vomiting",
      history:
        "A 71-year-old with previous bowel surgery says his belly feels tight and ballooned. The pain comes in waves and he has vomited repeatedly. He says there has been nothing out either end since yesterday. There is mild tenderness but no board-like rigidity.",
      keyNegatives: "no board-like rigidity",
    }),
    expectedLeadDiagnosisSlug: "bowel-obstruction",
    expectedKeyFeatures: [
      "older_age",
      "previous_abdominal_surgery",
      "distension",
      "colicky_pain",
      "vomiting",
      "obstipation",
      "unable_to_pass_flatus",
    ],
    forbiddenRedFlags: ["Perforated viscus / peritonitis pattern"],
    forbiddenLeadDiagnosisSlugs: ["perforated-viscus", "gastroenteritis"],
    expectedUsefulLlmAddedFeatures: [
      "previous_abdominal_surgery",
      "distension",
      "colicky_pain",
      "vomiting",
      "obstipation",
      "unable_to_pass_flatus",
    ],
    mockLlmFeatures: [
      mockFeature("previous_abdominal_surgery", "previous bowel surgery"),
      mockFeature("distension", "belly feels tight and ballooned"),
      mockFeature("colicky_pain", "pain comes in waves"),
      mockFeature("vomiting", "vomited repeatedly"),
      mockFeature("obstipation", "nothing out either end"),
      mockFeature("unable_to_pass_flatus", "nothing out either end"),
    ],
  },
];

export const llmEvaluationFixtureSections = [
  {
    label: "baseline messy pilot cases",
    fixtures: messyPilotLlmEvaluationFixtures,
  },
  {
    label: "hard unseen cases",
    fixtures: hardUnseenLlmEvaluationFixtures,
  },
] as const;

export const allLlmEvaluationFixtures: LlmEvaluationFixture[] =
  llmEvaluationFixtureSections.flatMap((section) => section.fixtures);
