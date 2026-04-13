import type { CaseInput } from "../lib/types";

export type FeatureExtractionCase = {
  id: string;
  description: string;
  input: CaseInput;
  expectedPresent: string[];
  expectedAbsent: string[];
};

const EMPTY_CASE: CaseInput = {
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
  suspectedDiagnosis: "",
};

export const FEATURE_EXTRACTION_CASES: FeatureExtractionCase[] = [
  {
    id: "aortic-wording-variation",
    description: "detects back radiation and collapse from alternative aortic phrasing",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Chest pain",
      history:
        "Abrupt chest pain going between the shoulder blades. He blacked out briefly afterwards.",
    },
    expectedPresent: ["chest_pain", "back_radiation", "collapse"],
    expectedAbsent: ["thunderclap", "abdominal_pain"],
  },
  {
    id: "thunderclap-negated-vomiting",
    description: "detects thunderclap wording while respecting no vomiting",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Headache",
      history: "Worst ever headache, maximal at onset.",
      keyNegatives: "No vomiting.",
    },
    expectedPresent: ["thunderclap", "headache"],
    expectedAbsent: ["vomiting", "focal_neurology"],
  },
  {
    id: "pe-risk-context-wording",
    description: "detects PE risk context from surgery immobility and travel wording",
    input: {
      ...EMPTY_CASE,
      history:
        "Shortness of breath after recent surgery, prolonged immobility after a fall, and a long-haul flight.",
    },
    expectedPresent: ["sob", "recent_surgery", "immobility", "long_haul_travel"],
    expectedAbsent: ["unilateral_reduced_air_entry", "gi_bleed"],
  },
  {
    id: "focal-neuro-negation-and-headache-negation",
    description: "does not infer focal neurology or headache when explicitly negated",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Confusion",
      history: "Acute confusion with fever.",
      keyNegatives: "No focal neurology. Denies headache.",
    },
    expectedPresent: ["confusion", "fever"],
    expectedAbsent: ["focal_neurology", "headache"],
  },
  {
    id: "pe-wording-variation",
    description: "detects pleuritic pain and hypoxia from alternative respiratory wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Chest pain and breathlessness",
      history: "Sharp chest pain worse on deep breath.",
      observations: "Sats 88% on air.",
    },
    expectedPresent: ["chest_pain", "sob", "pleuritic_pain", "hypoxia"],
    expectedAbsent: ["collapse", "thunderclap"],
  },
  {
    id: "unilateral-air-entry-wording",
    description: "detects unilateral reduced air entry from unilateral chest sign wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Chest pain and shortness of breath",
      history: "Sudden pleuritic chest pain with unilateral reduced air entry on the left.",
    },
    expectedPresent: [
      "chest_pain",
      "sob",
      "sudden_onset",
      "pleuritic_pain",
      "unilateral_reduced_air_entry",
    ],
    expectedAbsent: ["hypoxia", "fever"],
  },
  {
    id: "pneumothorax-context-wording",
    description: "detects pneumothorax context from habitus and prior thoracic wording",
    input: {
      ...EMPTY_CASE,
      history:
        "Tall thin male with previous pneumothorax after recent chest drain and chest trauma.",
    },
    expectedPresent: ["tall_thin_habitus", "previous_pneumothorax", "recent_chest_drain", "trauma"],
    expectedAbsent: ["long_haul_travel", "fever"],
  },
  {
    id: "abdominal-wording-variation",
    description: "detects abdominal pain from broader abdominal wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Upper abdominal pain",
      history: "Central abdominal pain with epigastric discomfort.",
    },
    expectedPresent: ["abdominal_pain"],
    expectedAbsent: ["chest_pain", "pleuritic_pain"],
  },
  {
    id: "pancreatitis-language",
    description: "detects classic pancreatitis wording from epigastric back-radiating pain with alcohol or gallstone context",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Epigastric pain",
      history:
        "Severe constant upper abdominal pain radiating to the back with vomiting after binge drinking and known gallstones.",
    },
    expectedPresent: [
      "abdominal_pain",
      "severe_constant_upper_abdominal_pain",
      "back_radiation",
      "vomiting",
      "binge_drinking",
      "gallstone_context",
    ],
    expectedAbsent: ["diarrhoea", "pleuritic_pain"],
  },
  {
    id: "perforation-language",
    description: "detects perforated viscus wording from sudden abdominal pain with guarding and movement pain",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Abdominal pain",
      history:
        "Sudden severe generalized abdominal pain with guarding and rigidity, worse on movement and coughing, with concern for perforation.",
    },
    expectedPresent: [
      "abdominal_pain",
      "sudden_onset",
      "guarding_rigidity",
      "abdominal_movement_pain",
      "perforation_language",
    ],
    expectedAbsent: ["diarrhoea", "chest_pain"],
  },
  {
    id: "acute-cholangitis-language",
    description: "detects acute cholangitis wording from RUQ pain with jaundice rigors and cholestatic clues",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "RUQ pain and jaundice",
      history:
        "Right upper quadrant pain with jaundice, rigors, dark urine, pale stools, and known gallstones.",
    },
    expectedPresent: [
      "abdominal_pain",
      "ruq_pain",
      "jaundice",
      "rigors",
      "dark_urine",
      "pale_stools",
      "gallstone_context",
    ],
    expectedAbsent: ["diarrhoea", "thunderclap"],
  },
  {
    id: "biliary-colic-language",
    description: "detects recurrent biliary colic wording from fatty-meal episodic RUQ pain",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "RUQ pain",
      history:
        "Episodic RUQ pain after fatty meals with recurrent attacks that settle between episodes.",
    },
    expectedPresent: [
      "abdominal_pain",
      "ruq_pain",
      "post_prandial_pain",
      "recurrent_biliary_pain",
      "well_between_episodes",
    ],
    expectedAbsent: ["jaundice", "rigors", "hypotension"],
  },
  {
    id: "acute-cholecystitis-language",
    description: "detects persistent febrile RUQ pain with Murphy-sign and tenderness wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "RUQ pain",
      history:
        "Persistent RUQ pain with localized RUQ tenderness, positive Murphy's sign, fever, nausea, and vomiting after a fatty meal with known gallstones.",
    },
    expectedPresent: [
      "abdominal_pain",
      "ruq_pain",
      "persistent_ruq_pain",
      "localized_ruq_tenderness",
      "murphys_sign",
      "fever",
      "nausea",
      "vomiting",
      "post_prandial_pain",
      "gallstone_context",
    ],
    expectedAbsent: ["jaundice", "rigors"],
  },
  {
    id: "choledocholithiasis-language",
    description: "detects obstructive jaundice wording from duct-stone and cholestatic phrases",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Jaundice",
      history:
        "Mild RUQ discomfort with jaundice, dark urine, pale stools, itch, and suspected bile duct stone on a cholestatic picture after previous biliary colic.",
    },
    expectedPresent: [
      "abdominal_pain",
      "ruq_pain",
      "jaundice",
      "dark_urine",
      "pale_stools",
      "pruritus",
      "obstructive_jaundice_language",
      "gallstone_context",
      "recurrent_biliary_pain",
    ],
    expectedAbsent: ["rigors", "hypotension", "thunderclap"],
  },
  {
    id: "chronic-cholestatic-language",
    description: "detects chronic cholestatic comparator wording from itch fatigue sicca and IBD context",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Jaundice and itch",
      history:
        "Months of pruritus, fatigue, dry eyes and mouth, with ulcerative colitis and intermittent jaundice.",
    },
    expectedPresent: ["jaundice", "pruritus", "fatigue", "dry_eyes_mouth", "ibd_context", "chronic_course"],
    expectedAbsent: ["rigors", "hypotension", "thunderclap"],
  },
  {
    id: "pleuritic-fever-negations",
    description: "respects no pleuritic pain and no fever negation phrases",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Shortness of breath",
      history: "Breathless but no pleuritic pain.",
      observations: "No fever.",
    },
    expectedPresent: ["sob"],
    expectedAbsent: ["pleuritic_pain", "fever"],
  },
  {
    id: "acs-context-wording",
    description: "detects ACS contextual symptoms and risk features",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Chest pain",
      history:
        "Central chest pain radiating to the jaw and left arm with sweating and nausea. He thought it was indigestion.",
      pmh: "known hypertension",
      social: "current smoker",
    },
    expectedPresent: [
      "chest_pain",
      "jaw_pain",
      "arm_pain",
      "sweating",
      "nausea",
      "indigestion_like_chest_pain",
      "hypertension",
      "smoker",
    ],
    expectedAbsent: ["thunderclap", "abdominal_pain"],
  },
  {
    id: "acs-synonym-wording",
    description: "detects ACS symptom synonyms from pressure heaviness and radiation wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Central chest pressure",
      history:
        "Heavy feeling in chest with pain to jaw and pain to left arm, clammy and nauseated.",
    },
    expectedPresent: ["chest_pain", "jaw_pain", "arm_pain", "sweating", "nausea"],
    expectedAbsent: ["pleuritic_pain", "thunderclap"],
  },
  {
    id: "epigastric-acs-wording",
    description: "detects atypical ACS epigastric discomfort and upper abdominal heaviness wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Epigastric pain",
      history:
        "Epigastric discomfort and upper abdominal heaviness radiating to the jaw with sweating and nausea, thought it was indigestion.",
    },
    expectedPresent: ["abdominal_pain", "indigestion_like_chest_pain", "jaw_pain", "sweating", "nausea"],
    expectedAbsent: ["pleuritic_pain", "productive_cough"],
  },
  {
    id: "pe-synonym-wording",
    description: "detects PE symptom synonyms including breathlessness and haemoptysis",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Sudden breathlessness",
      history: "Sharp chest pain on breathing and coughed up blood. He can't catch breath.",
    },
    expectedPresent: ["sudden_onset", "sob", "chest_pain", "pleuritic_pain", "haemoptysis"],
    expectedAbsent: ["unilateral_reduced_air_entry", "gi_bleed"],
  },
  {
    id: "pneumothorax-synonym-wording",
    description: "detects pneumothorax symptom synonyms from one-sided pain and breath sounds",
    input: {
      ...EMPTY_CASE,
      history:
        "Sudden sharp chest pain on one side of chest with shortness of breath and one-sided decreased breath sounds.",
    },
    expectedPresent: ["chest_pain", "sudden_onset", "sob", "unilateral_reduced_air_entry"],
    expectedAbsent: ["haemoptysis", "fever"],
  },
  {
    id: "sah-synonym-wording",
    description: "detects SAH synonym wording from explosive immediate-onset headache",
    input: {
      ...EMPTY_CASE,
      history: "Worst headache of my life. The headache came on instantly and was explosive.",
    },
    expectedPresent: ["headache", "thunderclap"],
    expectedAbsent: ["focal_neurology", "vomiting"],
  },
  {
    id: "gi-bleed-wording-variation",
    description: "detects upper and lower gi bleeding phrases plus unstable observations",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Collapse",
      history: "Vomited blood with melaena and blood per rectum.",
      observations: "HR 130 and systolic 70.",
    },
    expectedPresent: [
      "haematemesis",
      "melaena",
      "pr_bleeding",
      "gi_bleed",
      "tachycardia",
      "hypotension",
    ],
    expectedAbsent: ["diarrhoea", "constipation"],
  },
  {
    id: "gi-bleed-synonym-wording",
    description: "detects GI bleed synonyms from coffee-ground vomit and rectal blood wording",
    input: {
      ...EMPTY_CASE,
      history: "Coffee-ground vomit with black tarry stools and fresh PR bleeding, now passing blood.",
    },
    expectedPresent: ["haematemesis", "melaena", "pr_bleeding", "gi_bleed"],
    expectedAbsent: ["diarrhoea", "constipation"],
  },
  {
    id: "gi-bleed-risk-context",
    description: "detects GI bleed risk context from alcohol ulcer and nsaid wording",
    input: {
      ...EMPTY_CASE,
      history:
        "Heavy alcohol intake in a heavy drinker with binge drinking, known peptic ulcer disease, and regular ibuprofen.",
    },
    expectedPresent: ["alcohol_excess", "binge_drinking", "peptic_ulcer_disease", "nsaid_use"],
    expectedAbsent: ["thunderclap", "focal_neurology"],
  },
  {
    id: "stool-wording-variation",
    description: "detects diarrhoea and constipation wording distinctly",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Abdominal pain",
      history: "Loose stools then watery diarrhoea, but previously constipated with hard stools.",
    },
    expectedPresent: ["abdominal_pain", "diarrhoea", "constipation"],
    expectedAbsent: ["gi_bleed", "pr_bleeding"],
  },
  {
    id: "sepsis-observation-wording",
    description: "detects fever tachycardia tachypnoea hypotension from observation wording",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Fever",
      observations: "Temp 39, HR 130, RR 32, low blood pressure, low sats.",
    },
    expectedPresent: ["fever", "tachycardia", "tachypnoea", "hypotension", "hypoxia"],
    expectedAbsent: ["pr_bleeding", "constipation"],
  },
  {
    id: "meningitis-context-wording",
    description: "detects meningitis context from photophobia recent infection and shared accommodation",
    input: {
      ...EMPTY_CASE,
      presentingComplaint: "Headache",
      history:
        "Headache with photophobia after a recent flu-like illness. Lives in student halls.",
    },
    expectedPresent: ["headache", "photophobia", "recent_infection", "shared_accommodation"],
    expectedAbsent: ["arm_pain", "gi_bleed"],
  },
  {
    id: "meningitis-synonym-wording",
    description: "detects meningitis encephalitis symptom synonyms from neck stiffness light sensitivity and reduced arousal",
    input: {
      ...EMPTY_CASE,
      history:
        "Headache with fever, stiff neck, light hurts eyes, drowsy and difficult to rouse after a recent viral illness.",
    },
    expectedPresent: [
      "headache",
      "fever",
      "neck_stiffness",
      "photophobia",
      "confusion",
      "recent_infection",
    ],
    expectedAbsent: ["arm_pain", "pr_bleeding"],
  },
  {
    id: "rr-28",
    description: "detects tachypnoea from RR 28",
    input: {
      ...EMPTY_CASE,
      observations: "RR 28",
    },
    expectedPresent: ["tachypnoea"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "respiratory-rate-30",
    description: "detects tachypnoea from respiratory rate 30",
    input: {
      ...EMPTY_CASE,
      observations: "respiratory rate 30",
    },
    expectedPresent: ["tachypnoea"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "temp-39-8",
    description: "detects fever from temp 39.8",
    input: {
      ...EMPTY_CASE,
      observations: "temp 39.8",
    },
    expectedPresent: ["fever"],
    expectedAbsent: ["hypothermia", "tachycardia"],
  },
  {
    id: "t-40-1",
    description: "detects fever from t 40.1",
    input: {
      ...EMPTY_CASE,
      observations: "T 40.1",
    },
    expectedPresent: ["fever"],
    expectedAbsent: ["hypothermia", "tachypnoea"],
  },
  {
    id: "temperature-36-8",
    description: "does not detect fever from normal temperature 36.8",
    input: {
      ...EMPTY_CASE,
      observations: "temperature 36.8",
    },
    expectedPresent: [],
    expectedAbsent: ["fever", "hypothermia"],
  },
  {
    id: "bp-85-50",
    description: "detects hypotension from BP 85/50",
    input: {
      ...EMPTY_CASE,
      observations: "BP 85/50",
    },
    expectedPresent: ["hypotension"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "bp-90-60",
    description: "detects hypotension from bp 90/60",
    input: {
      ...EMPTY_CASE,
      observations: "bp 90/60",
    },
    expectedPresent: ["hypotension"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "blood-pressure-85-50",
    description: "detects hypotension from blood pressure 85/50",
    input: {
      ...EMPTY_CASE,
      observations: "blood pressure 85/50",
    },
    expectedPresent: ["hypotension"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "systolic-85",
    description: "detects hypotension from systolic 85",
    input: {
      ...EMPTY_CASE,
      observations: "systolic 85",
    },
    expectedPresent: ["hypotension"],
    expectedAbsent: ["tachycardia", "fever"],
  },
  {
    id: "sats-88",
    description: "detects hypoxia from sats 88 percent",
    input: {
      ...EMPTY_CASE,
      observations: "sats 88%",
    },
    expectedPresent: ["hypoxia"],
    expectedAbsent: ["tachypnoea", "fever"],
  },
  {
    id: "hr-130",
    description: "detects tachycardia from HR 130",
    input: {
      ...EMPTY_CASE,
      observations: "HR 130",
    },
    expectedPresent: ["tachycardia"],
    expectedAbsent: ["hypotension", "fever"],
  },
  {
    id: "temperature-35-1",
    description: "detects hypothermia from temperature 35.1",
    input: {
      ...EMPTY_CASE,
      observations: "temperature 35.1",
    },
    expectedPresent: ["hypothermia"],
    expectedAbsent: ["fever"],
  },
  {
    id: "gord-language-variation",
    description: "detects GORD-style symptom language from heartburn reflux and antacid relief",
    input: {
      ...EMPTY_CASE,
      history:
        "Retrosternal burning with acidic taste and regurgitation, worse after meals and worse lying flat, improves with antacids.",
    },
    expectedPresent: [
      "heartburn",
      "acid_regurgitation",
      "worse_after_meals",
      "worse_lying_flat",
      "antacid_relief",
    ],
    expectedAbsent: ["sudden_onset", "collapse"],
  },
  {
    id: "musculoskeletal-chest-wall-language",
    description: "detects reproducible chest wall tenderness and post-lifting pain",
    input: {
      ...EMPTY_CASE,
      history:
        "Localized chest pain after heavy lifting, reproducible on palpation and worse on movement.",
    },
    expectedPresent: [
      "chest_pain",
      "reproducible_chest_wall_tenderness",
      "movement_related_chest_pain",
      "post_lifting_onset",
    ],
    expectedAbsent: ["hypoxia", "haemoptysis"],
  },
  {
    id: "migraine-aura-language",
    description: "detects migraine aura and stereotyped benign primary headache language",
    input: {
      ...EMPTY_CASE,
      history:
        "Recurrent unilateral throbbing headaches with flashing lights beforehand, photophobia, nausea, and well intervals between episodes.",
    },
    expectedPresent: [
      "headache",
      "visual_aura",
      "unilateral_headache",
      "throbbing_headache",
      "photophobia",
      "nausea",
      "recurrent_headache",
      "well_intervals",
    ],
    expectedAbsent: ["thunderclap", "focal_neurology"],
  },
  {
    id: "tension-headache-language",
    description: "detects tension headache language from band-like bilateral gradual pattern",
    input: {
      ...EMPTY_CASE,
      history:
        "Gradual bilateral band-like headache after stress and poor sleep, no focal deficit.",
    },
    expectedPresent: [
      "headache",
      "gradual_onset",
      "bilateral_headache",
      "band_like_headache",
      "stress_trigger",
      "poor_sleep",
    ],
    expectedAbsent: ["focal_neurology", "thunderclap"],
  },
  {
    id: "temporal-arteritis-language",
    description: "detects temporal arteritis language from jaw claudication scalp tenderness and visual symptoms",
    input: {
      ...EMPTY_CASE,
      history:
        "Older patient with temporal headache, scalp tenderness, jaw pain when chewing, blurred vision, and aching shoulders.",
    },
    expectedPresent: [
      "headache",
      "temporal_headache",
      "scalp_tenderness",
      "jaw_claudication",
      "transient_visual_symptoms",
      "pmr_like_symptoms",
    ],
    expectedAbsent: ["thunderclap", "vomiting"],
  },
  {
    id: "pneumonia-language",
    description: "detects progressive infectious pneumonia language without false sudden onset",
    input: {
      ...EMPTY_CASE,
      history:
        "Progressively worsening shortness of breath over several days with productive cough, green sputum, fever, and rigors.",
    },
    expectedPresent: ["sob", "productive_cough", "sputum_change", "progressive_course", "fever", "rigors"],
    expectedAbsent: ["sudden_onset"],
  },
  {
    id: "asthma-language",
    description: "detects asthma exacerbation language from wheeze inhaler use and speech difficulty",
    input: {
      ...EMPTY_CASE,
      history:
        "Known asthma with wheeze, chest tightness after a recent viral cold, increased inhaler use, and too breathless to speak full sentences.",
    },
    expectedPresent: ["known_asthma", "wheeze", "increased_inhaler_use", "difficulty_speaking", "recent_infection", "chest_pain"],
    expectedAbsent: ["productive_cough", "known_copd"],
  },
  {
    id: "copd-language",
    description: "detects COPD exacerbation language from baseline worsening and sputum change",
    input: {
      ...EMPTY_CASE,
      history:
        "Known COPD with worsening baseline breathlessness over days, increased sputum volume, and yellow sputum.",
    },
    expectedPresent: ["known_copd", "sob", "progressive_course", "sputum_change"],
    expectedAbsent: ["known_asthma", "thunderclap"],
  },
];
