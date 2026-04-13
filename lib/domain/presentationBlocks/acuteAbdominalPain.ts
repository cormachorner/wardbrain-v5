import type { DiagnosisDefinition } from "../../types";

export const acuteAbdominalPainFeatureVocabulary = {
  painLocation: [
    "abdominal_pain",
    "upper_abdominal_pain",
    "epigastric_pain",
    "ruq_pain",
    "rif_pain",
    "llq_pain",
    "generalized_abdominal_pain",
    "pelvic_pain",
    "suprapubic_pain",
    "flank_pain",
    "loin_to_groin_pain",
    "back_pain",
    "testicular_pain",
  ],
  painPattern: [
    "sudden_onset",
    "gradual_onset",
    "constant_pain",
    "episodic_pain",
    "recurrent_attacks",
    "pain_settles_between_episodes",
    "progressive_pain",
    "pain_migration_to_rif",
    "severe_pain",
    "colicky_pain",
    "pain_out_of_proportion",
    "pain_severe_but_exam_mild",
    "pain_radiates_to_back",
    "pain_worse_on_movement",
    "pain_worse_with_cough",
    "lying_still",
    "restless",
    "post_prandial_pain",
  ],
  abdominalExam: [
    "localized_tenderness",
    "ruq_tenderness",
    "rif_tenderness",
    "guarding",
    "rigidity",
    "peritonism",
    "murphys_sign",
    "distension",
    "hernia_present",
    "incarcerated_hernia",
  ],
  giFeatures: [
    "nausea",
    "vomiting",
    "diarrhoea",
    "constipation",
    "bowel_habit_change",
    "obstipation",
    "unable_to_pass_flatus",
    "anorexia",
    "jaundice",
    "dark_urine",
    "pale_stools",
    "pruritus",
    "gi_bleed",
    "haematemesis",
    "melaena",
    "pr_bleeding",
    "heartburn",
    "burning_pain",
  ],
  systemic: [
    "fever",
    "rigors",
    "tachycardia",
    "hypotension",
    "collapse",
    "shock",
    "sepsis_pattern",
    "dehydration",
    "confusion",
    "dizziness",
    "pallor",
  ],
  urinary: [
    "urinary_symptoms",
    "dysuria",
    "frequency",
    "haematuria",
    "urinary_retention",
    "cva_tenderness",
  ],
  gynae: [
    "pregnancy_possible",
    "positive_pregnancy_test",
    "missed_period",
    "vaginal_bleeding",
    "adnexal_pain",
  ],
  cardioResp: [
    "chest_pain",
    "sob",
    "cough",
    "hypoxia",
    "acs_equivalent_pain",
  ],
  metabolic: [
    "diabetic_context",
    "polyuria",
    "polydipsia",
    "ketosis_breath",
  ],
  riskFactors: [
    "older_age",
    "smoking_history",
    "hypertension",
    "vascular_disease",
    "atrial_fibrillation",
    "gallstone_history",
    "heavy_alcohol_intake",
    "nsaid_use",
    "peptic_ulcer_history",
    "previous_abdominal_surgery",
    "known_hernia",
    "female_of_childbearing_age",
  ],
} as const;

export const acuteAbdominalPainDiagnoses: DiagnosisDefinition[] = [
  {
    id: "ruptured_or_symptomatic_aaa",
    name: "Ruptured / symptomatic abdominal aortic aneurysm",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Sudden abdominal or back pain with collapse or shock in an older vascular patient.",
    features: {
      core: ["abdominal_pain", "sudden_onset"],
      discriminating: ["collapse", "hypotension", "back_pain"],
      weak: ["vomiting"],
      against: ["diarrhoea", "pain_settles_between_episodes", "urinary_symptoms"],
      riskFactors: ["older_age", "smoking_history", "hypertension", "vascular_disease"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominal_pain", "sudden_onset"],
          ifAny: ["back_pain", "collapse", "hypotension"],
          add: 5,
          reason: "sudden abdominal or back pain with instability fits symptomatic or ruptured AAA",
        },
      ],
      escalationRules: [
        {
          ifAll: ["abdominal_pain"],
          ifAny: ["collapse", "hypotension", "shock"],
          add: 8,
          reason: "unstable abdominal pain in an older vascular patient must escalate AAA",
        },
      ],
      penalties: [
        {
          ifAny: ["diarrhoea", "pain_migration_to_rif", "urinary_symptoms"],
          subtract: 2,
          reason: "localizing gastrointestinal or urinary patterns reduce AAA plausibility",
        },
      ],
    },
    relationships: {
      commonMimics: ["Mesenteric ischaemia", "Perforated viscus / peritonitis", "Renal colic / ureteric stone"],
      patternTags: ["vascular-catastrophe", "shock-pattern"],
      redFlagTags: ["aaa", "collapse", "hypotension"],
    },
    language: {
      featureSynonyms: {
        collapse: ["syncope", "passed out"],
        back_pain: ["pain radiating to the back", "back radiation"],
      },
    },
    teaching: {
      keyPearls: ["AAA should sit above benign abdominal explanations when collapse or shock is present."],
      classicPitfalls: ["Mistaking symptomatic AAA for renal colic, gastroenteritis, or generic back pain."],
    },
    sourceNotes: ["Dangerous vascular abdominal emergency."],
  },
  {
    id: "mesenteric_ischaemia",
    name: "Mesenteric ischaemia",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Severe abdominal pain out of proportion, especially with AF or vascular risk.",
    features: {
      core: ["abdominal_pain", "severe_pain"],
      discriminating: ["pain_out_of_proportion", "pain_severe_but_exam_mild", "sudden_onset"],
      weak: ["vomiting", "bowel_habit_change"],
      against: ["pain_migration_to_rif", "pain_settles_between_episodes", "diarrhoea"],
      riskFactors: ["atrial_fibrillation", "vascular_disease", "older_age"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominal_pain", "pain_out_of_proportion"],
          add: 6,
          reason: "pain out of proportion is highly discriminating for mesenteric ischaemia",
        },
        {
          ifAll: ["abdominal_pain", "pain_severe_but_exam_mild"],
          add: 6,
          reason: "severe pain with mild abdominal findings supports mesenteric ischaemia",
        },
        {
          ifAll: ["abdominal_pain", "pain_out_of_proportion"],
          ifAny: ["atrial_fibrillation", "vascular_disease"],
          add: 4,
          reason: "vascular or embolic context strongly supports mesenteric ischaemia",
        },
        {
          ifAll: ["abdominal_pain", "pain_severe_but_exam_mild"],
          ifAny: ["atrial_fibrillation", "vascular_disease", "older_age"],
          add: 5,
          reason: "vascular-risk severe-pain exam mismatch strongly supports mesenteric ischaemia",
        },
        {
          ifAll: ["abdominal_pain"],
          ifAny: ["pain_out_of_proportion", "pain_severe_but_exam_mild", "severe_pain"],
          add: 4,
          reason: "severe unexplained abdominal pain pattern supports mesenteric ischaemia",
        },
      ],
      escalationRules: [
        {
          ifAll: ["abdominal_pain", "pain_out_of_proportion"],
          ifAny: ["collapse", "hypotension", "shock"],
          add: 7,
          reason: "pain out of proportion with physiological compromise must escalate mesenteric ischaemia",
        },
        {
          ifAll: ["abdominal_pain", "pain_severe_but_exam_mild"],
          ifAny: ["collapse", "hypotension", "shock"],
          add: 7,
          reason: "severe pain with mild abdominal findings and physiological compromise must escalate mesenteric ischaemia",
        },
      ],
      penalties: [
        {
          ifAll: ["pain_migration_to_rif"],
          subtract: 3,
          reason: "migratory RIF pain fits appendicitis better",
        },
      ],
    },
    relationships: {
      commonMimics: ["Gastroenteritis", "Perforated viscus / peritonitis", "Acute pancreatitis"],
      patternTags: ["vascular-abdomen", "pain-out-of-proportion"],
      redFlagTags: ["mesenteric-ischaemia", "shock-pattern"],
    },
    language: {
      featureSynonyms: {
        pain_out_of_proportion: ["pain out of proportion to examination", "pain out of proportion to exam"],
      },
    },
    teaching: {
      keyPearls: ["AF plus pain out of proportion should outrank benign abdominal fallbacks."],
      classicPitfalls: ["Calling it gastroenteritis because vomiting or loose stool is present."],
    },
    sourceNotes: ["Dangerous vascular bowel emergency."],
  },
  {
    id: "perforated_viscus_peritonitis",
    name: "Perforated viscus / peritonitis",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Sudden severe pain with peritonism and pain worsened by movement.",
    features: {
      core: ["abdominal_pain", "sudden_onset"],
      discriminating: ["peritonism", "guarding", "rigidity", "pain_worse_on_movement", "lying_still"],
      weak: ["vomiting", "sepsis_pattern"],
      against: ["pain_settles_between_episodes", "colicky_pain"],
      riskFactors: ["peptic_ulcer_history", "nsaid_use", "previous_abdominal_surgery"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominal_pain", "sudden_onset"],
          ifAny: ["peritonism", "guarding", "rigidity"],
          add: 6,
          reason: "sudden pain with peritoneal signs strongly supports perforation or peritonitis",
        },
        {
          ifAll: ["abdominal_pain", "pain_worse_on_movement"],
          ifAny: ["lying_still", "pain_worse_with_cough"],
          add: 3,
          reason: "movement-aggravated pain with stillness preference fits peritonitic pain",
        },
      ],
      escalationRules: [
        {
          ifAll: ["abdominal_pain"],
          ifAny: ["peritonism", "rigidity", "shock"],
          add: 7,
          reason: "peritonitic abdominal pain is a surgical emergency",
        },
      ],
      penalties: [
        {
          ifAll: ["pain_settles_between_episodes"],
          subtract: 3,
          reason: "episodic settling pain fits colic better than perforation",
        },
      ],
    },
    relationships: {
      commonMimics: ["Acute pancreatitis", "Bowel obstruction", "Appendicitis"],
      patternTags: ["peritonitic-abdomen", "surgical-emergency"],
      redFlagTags: ["peritonitis", "shock-pattern"],
    },
    teaching: {
      keyPearls: ["Peritoneal signs are more valuable than generic severe abdominal pain."],
      classicPitfalls: ["Calling perforation gastroenteritis because vomiting is present."],
    },
    sourceNotes: ["Includes perforated peptic ulcer pattern for MVP use."],
  },
  {
    id: "bowel_obstruction",
    name: "Bowel obstruction",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Vomiting, distension, colicky pain, and obstipation, with escalation if strangulation risk appears.",
    features: {
      core: ["abdominal_pain", "vomiting"],
      discriminating: ["distension", "obstipation", "unable_to_pass_flatus", "colicky_pain"],
      weak: ["previous_abdominal_surgery", "hernia_present"],
      against: ["diarrhoea", "pain_settles_between_episodes"],
      riskFactors: ["previous_abdominal_surgery", "known_hernia"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominal_pain", "vomiting"],
          ifAny: ["distension", "obstipation", "unable_to_pass_flatus"],
          add: 5,
          reason: "vomiting with distension and obstructive bowel symptoms supports bowel obstruction",
        },
      ],
      escalationRules: [
        {
          ifAll: ["abdominal_pain"],
          ifAny: ["incarcerated_hernia", "hypotension", "sepsis_pattern"],
          add: 6,
          reason: "obstruction with strangulation or ischaemia risk should escalate",
        },
      ],
      penalties: [
        {
          ifAll: ["pain_settles_between_episodes"],
          subtract: 2,
          reason: "settling recurrent pain fits biliary colic better",
        },
      ],
    },
    relationships: {
      commonMimics: ["Constipation", "Gastroenteritis", "Incarcerated / strangulated hernia"],
      patternTags: ["obstruction", "surgical-emergency"],
      redFlagTags: ["bowel-obstruction", "strangulation-risk"],
    },
    teaching: {
      keyPearls: ["Ask about flatus, distension, and prior surgery; they add more value than vomiting alone."],
      classicPitfalls: ["Calling it constipation and missing strangulation risk."],
    },
    sourceNotes: ["Merged uncomplicated obstruction and strangulation-risk variant for MVP."],
  },
  {
    id: "intra_abdominal_sepsis",
    name: "Severe sepsis from an intra-abdominal source",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Abdominal source plus fever, rigors, and physiological instability before the exact source is clear.",
    features: {
      core: ["abdominal_pain", "fever"],
      discriminating: ["rigors", "hypotension", "sepsis_pattern"],
      weak: ["vomiting", "confusion"],
      against: ["pain_settles_between_episodes"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominal_pain", "fever"],
          ifAny: ["rigors", "tachycardia", "hypotension"],
          add: 4,
          reason: "abdominal pain plus infective instability supports intra-abdominal sepsis",
        },
      ],
      escalationRules: [
        {
          ifAll: ["abdominal_pain"],
          ifAny: ["hypotension", "shock", "confusion"],
          add: 7,
          reason: "systemically unwell abdominal pain requires sepsis escalation",
        },
      ],
      penalties: [
        {
          ifAll: ["pain_settles_between_episodes"],
          subtract: 3,
          reason: "well intervals fit colic rather than sepsis",
        },
      ],
    },
    relationships: {
      commonMimics: ["Acute cholangitis", "Diverticulitis", "Appendicitis", "Pyelonephritis"],
      patternTags: ["sepsis", "abdominal-source"],
      redFlagTags: ["sepsis", "shock-pattern"],
    },
    teaching: {
      keyPearls: ["This is a syndrome-level emergency label, not a final anatomical diagnosis."],
      classicPitfalls: ["Under-calling abdominal sepsis while waiting for a precise source label."],
    },
    sourceNotes: ["Useful bridge diagnosis for dangerous unstable abdominal presentations."],
  },
  {
    id: "ectopic_pregnancy",
    name: "Ectopic pregnancy",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Pregnancy possibility with pelvic pain and vaginal bleeding, especially if unstable.",
    features: {
      core: ["pelvic_pain"],
      discriminating: ["pregnancy_possible", "missed_period", "vaginal_bleeding"],
      weak: ["collapse", "dizziness", "pallor"],
      against: ["pain_settles_between_episodes", "urinary_symptoms"],
      riskFactors: ["female_of_childbearing_age"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["pelvic_pain"],
          ifAny: ["pregnancy_possible", "positive_pregnancy_test", "missed_period"],
          add: 5,
          reason: "pregnancy context plus pelvic pain strongly supports ectopic pregnancy",
        },
        {
          ifAll: ["pelvic_pain", "vaginal_bleeding"],
          add: 4,
          reason: "pelvic pain with bleeding is a classic ectopic pattern",
        },
        {
          ifAll: ["pelvic_pain", "vaginal_bleeding"],
          ifAny: ["pregnancy_possible", "positive_pregnancy_test", "missed_period"],
          add: 8,
          reason: "classic ectopic pregnancy composite pattern",
        },
        {
          ifAll: ["pelvic_pain", "vaginal_bleeding"],
          ifAny: ["dizziness", "pallor", "collapse", "hypotension"],
          add: 6,
          reason: "unstable ectopic pregnancy warning pattern",
        },
      ],
      escalationRules: [
        {
          ifAll: ["pelvic_pain"],
          ifAny: ["collapse", "hypotension", "shock"],
          add: 8,
          reason: "possible ruptured ectopic with instability must escalate immediately",
        },
      ],
    },
    relationships: {
      commonMimics: ["Ovarian torsion", "Pelvic inflammatory disease", "Ruptured ovarian cyst", "Appendicitis"],
      patternTags: ["gynae-emergency", "pregnancy-related"],
      redFlagTags: ["ectopic-pregnancy", "shock-pattern"],
    },
    language: {
      featureSynonyms: {
        missed_period: ["late period", "amenorrhoea"],
        pregnancy_possible: ["could be pregnant", "pregnancy possible"],
      },
    },
    teaching: {
      keyPearls: ["In reproductive-age patients, pelvic pain plus bleeding should trigger ectopic until excluded."],
      classicPitfalls: ["Missing ectopic when pain is labelled as appendicitis or gastroenteritis."],
    },
    sourceNotes: ["Must-not-miss gynae emergency."],
  },
  {
    id: "appendicitis",
    name: "Appendicitis",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Migratory pain to the RIF with local tenderness, with escalation if perforation or sepsis features appear.",
    features: {
      core: ["abdominal_pain", "rif_pain"],
      discriminating: ["pain_migration_to_rif", "rif_tenderness"],
      weak: ["nausea", "vomiting", "fever", "localized_tenderness", "anorexia", "pain_worse_on_movement"],
      against: ["diarrhoea", "pain_settles_between_episodes", "jaundice"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["rif_pain"],
          ifAny: ["pain_migration_to_rif", "rif_tenderness"],
          add: 5,
          reason: "migratory pain with RIF localization strongly supports appendicitis",
        },
        {
          ifAll: ["rif_tenderness"],
          ifAny: ["pain_worse_on_movement", "pain_worse_with_cough"],
          add: 4,
          reason: "localized peritoneal irritation supports appendicitis",
        },
      ],
      escalationRules: [
        {
          ifAll: ["rif_pain"],
          ifAny: ["sepsis_pattern", "guarding", "rigidity"],
          add: 6,
          reason: "appendicitis with perforation or sepsis risk should escalate",
        },
      ],
      penalties: [
        {
          ifAll: ["pain_settles_between_episodes"],
          subtract: 3,
          reason: "settling recurrent pain argues against appendicitis",
        },
      ],
    },
    relationships: {
      commonMimics: ["Gastroenteritis", "Ovarian torsion", "Ectopic pregnancy", "Mesenteric adenitis"],
      patternTags: ["rif-localization", "surgical-inflammatory"],
      redFlagTags: ["appendicitis", "perforation-risk"],
    },
    teaching: {
      keyPearls: ["Migration and localization are more useful than nausea alone."],
      classicPitfalls: ["Calling appendicitis gastroenteritis when vomiting or loose stool is present."],
    },
    sourceNotes: ["Merged simple appendicitis and perforation-risk variant for MVP."],
  },
  {
    id: "acute_cholangitis",
    name: "Acute cholangitis",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "RUQ pain with jaundice and fever or rigors indicating septic biliary obstruction.",
    features: {
      core: ["ruq_pain", "jaundice", "fever"],
      discriminating: ["rigors", "dark_urine", "pale_stools"],
      weak: ["vomiting", "gallstone_history", "pruritus"],
      against: ["pain_settles_between_episodes"],
      riskFactors: ["gallstone_history"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["ruq_pain", "jaundice"],
          ifAny: ["fever", "rigors"],
          add: 6,
          reason: "biliary sepsis pattern strongly supports cholangitis",
        },
      ],
      escalationRules: [
        {
          ifAll: ["ruq_pain", "jaundice"],
          ifAny: ["hypotension", "confusion", "shock"],
          add: 8,
          reason: "biliary obstruction with sepsis physiology must escalate urgently",
        },
      ],
      penalties: [
        {
          ifAll: ["pain_settles_between_episodes"],
          subtract: 3,
          reason: "well intervals fit biliary colic rather than cholangitis",
        },
      ],
    },
    relationships: {
      commonMimics: ["Acute cholecystitis", "Choledocholithiasis / obstructive jaundice", "Acute hepatitis"],
      patternTags: ["biliary-sepsis", "ruq-jaundice"],
      redFlagTags: ["cholangitis", "sepsis", "obstructive-jaundice"],
    },
    teaching: {
      keyPearls: ["Jaundice plus fever matters more than isolated RUQ pain."],
      classicPitfalls: ["Labeling cholangitis as simple cholecystitis or viral hepatitis."],
    },
    sourceNotes: ["Dangerous RUQ sepsis diagnosis."],
  },
  {
    id: "acute_pancreatitis",
    name: "Acute pancreatitis",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Severe constant epigastric pain, often radiating to the back, with vomiting.",
    features: {
      core: ["epigastric_pain", "constant_pain"],
      discriminating: ["pain_radiates_to_back", "severe_pain"],
      weak: ["vomiting", "nausea"],
      against: ["pain_migration_to_rif", "pain_settles_between_episodes", "urinary_symptoms"],
      riskFactors: ["heavy_alcohol_intake", "gallstone_history"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["epigastric_pain"],
          ifAny: ["pain_radiates_to_back", "heavy_alcohol_intake", "gallstone_history"],
          add: 5,
          reason: "epigastric pain with back radiation or classic trigger context supports pancreatitis",
        },
      ],
      escalationRules: [
        {
          ifAll: ["epigastric_pain"],
          ifAny: ["hypotension", "shock", "sepsis_pattern"],
          add: 5,
          reason: "severe pancreatitis with organ dysfunction should escalate",
        },
      ],
      penalties: [
        {
          ifAll: ["ruq_pain", "fever"],
          ifAny: ["murphys_sign", "ruq_tenderness"],
          subtract: 3,
          reason: "localized febrile RUQ inflammatory pattern fits cholecystitis better",
        },
      ],
    },
    relationships: {
      commonMimics: ["Acute cholecystitis", "Perforated viscus / peritonitis", "Acute coronary syndrome presenting as epigastric pain"],
      patternTags: ["epigastric", "back-radiation"],
      redFlagTags: ["severe-pancreatitis"],
    },
    teaching: {
      keyPearls: ["Back radiation and trigger context are more useful than vomiting alone."],
      classicPitfalls: ["Over-calling pancreatitis from any upper abdominal pain plus vomiting."],
    },
    sourceNotes: ["Keep present but not as a generic abdominal fallback."],
  },
  {
    id: "acute_cholecystitis",
    name: "Acute cholecystitis",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Persistent febrile RUQ pain with localized tenderness or Murphy sign.",
    features: {
      core: ["ruq_pain", "constant_pain"],
      discriminating: ["murphys_sign", "ruq_tenderness", "fever"],
      weak: ["nausea", "vomiting", "post_prandial_pain"],
      against: ["jaundice", "pain_settles_between_episodes"],
      riskFactors: ["gallstone_history"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["ruq_pain"],
          ifAny: ["murphys_sign", "ruq_tenderness", "fever"],
          add: 5,
          reason: "persistent localized inflammatory RUQ pattern supports cholecystitis",
        },
      ],
      penalties: [
        {
          ifAll: ["jaundice", "fever"],
          subtract: 2,
          reason: "jaundice plus fever pushes toward cholangitis",
        },
        {
          ifAll: ["pain_settles_between_episodes"],
          subtract: 3,
          reason: "episodic settling pain fits biliary colic better",
        },
      ],
    },
    relationships: {
      commonMimics: ["Biliary colic", "Acute cholangitis", "Acute pancreatitis"],
      patternTags: ["ruq-inflammatory"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["Persistent inflammatory RUQ pain is more useful than nausea alone."],
      classicPitfalls: ["Confusing cholecystitis with biliary colic or pancreatitis."],
    },
    sourceNotes: ["Common biliary inflammatory surgical diagnosis."],
  },
  {
    id: "biliary_colic",
    name: "Biliary colic",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Episodic post-prandial RUQ or epigastric pain with well intervals.",
    features: {
      core: ["ruq_pain", "episodic_pain"],
      discriminating: ["post_prandial_pain", "recurrent_attacks", "pain_settles_between_episodes"],
      weak: ["epigastric_pain", "gallstone_history"],
      against: ["fever", "jaundice", "constant_pain"],
      riskFactors: ["gallstone_history"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["ruq_pain", "episodic_pain"],
          ifAny: ["post_prandial_pain", "recurrent_attacks", "pain_settles_between_episodes"],
          add: 5,
          reason: "recurrent meal-related settling biliary pain supports biliary colic",
        },
      ],
      penalties: [
        {
          ifAny: ["fever", "jaundice", "constant_pain"],
          subtract: 3,
          reason: "inflammatory, obstructive, or persistent patterns suggest more serious biliary disease",
        },
      ],
    },
    relationships: {
      commonMimics: ["Acute cholecystitis", "Choledocholithiasis / obstructive jaundice", "Acute pancreatitis"],
      patternTags: ["biliary-colic", "episodic-postprandial"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["Well intervals help separate biliary colic from cholecystitis."],
      classicPitfalls: ["Overcalling biliary colic in febrile or jaundiced patients."],
    },
    sourceNotes: ["Common surgical comparator."],
  },
  {
    id: "diverticulitis",
    name: "Diverticulitis",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Lower abdominal pain with fever and localized tenderness, often LLQ.",
    features: {
      core: ["abdominal_pain", "localized_tenderness"],
      discriminating: ["llq_pain", "fever"],
      weak: ["bowel_habit_change", "constipation", "nausea"],
      against: ["pain_migration_to_rif", "pain_settles_between_episodes", "jaundice"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["llq_pain", "localized_tenderness"],
          ifAny: ["fever", "bowel_habit_change"],
          add: 4,
          reason: "localized inflammatory lower abdominal pattern supports diverticulitis",
        },
      ],
    },
    relationships: {
      commonMimics: ["Appendicitis", "Gastroenteritis", "Pyelonephritis"],
      patternTags: ["localized-inflammatory-lower-abdomen"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["Localization matters more than generic abdominal pain plus fever."],
      classicPitfalls: ["Missing perforation or abscess when systemic features are present."],
    },
    sourceNotes: ["Common lower abdominal inflammatory surgical diagnosis."],
  },
  {
    id: "incarcerated_or_strangulated_hernia",
    name: "Incarcerated / strangulated hernia",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Painful hernia with obstruction or compromise.",
    features: {
      core: ["abdominal_pain"],
      discriminating: ["hernia_present", "incarcerated_hernia"],
      weak: ["vomiting", "obstipation", "distension"],
      against: ["pain_settles_between_episodes"],
      riskFactors: ["known_hernia"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["hernia_present", "incarcerated_hernia"],
          add: 6,
          reason: "painful incarcerated hernia is highly specific",
        },
      ],
      escalationRules: [
        {
          ifAll: ["hernia_present"],
          ifAny: ["vomiting", "obstipation", "hypotension"],
          add: 6,
          reason: "hernia plus obstruction or compromise suggests strangulation risk",
        },
      ],
    },
    relationships: {
      commonMimics: ["Bowel obstruction", "Appendicitis"],
      patternTags: ["hernia", "surgical-emergency"],
      redFlagTags: ["strangulation-risk"],
    },
    teaching: {
      keyPearls: ["A known painful hernia changes the abdominal differential substantially."],
      classicPitfalls: ["Missing strangulation when only the abdomen is considered."],
    },
    sourceNotes: ["High-yield surgical emergency."],
  },
  {
    id: "gastroenteritis",
    name: "Gastroenteritis",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Diffuse abdominal pain with vomiting and diarrhoea, usually without focal or red-flag features.",
    features: {
      core: ["abdominal_pain", "vomiting", "diarrhoea"],
      discriminating: ["generalized_abdominal_pain"],
      weak: ["fever", "dehydration"],
      against: ["peritonism", "pain_out_of_proportion", "pain_severe_but_exam_mild", "pain_migration_to_rif", "jaundice"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["vomiting", "diarrhoea"],
          add: 3,
          reason: "combined vomiting and diarrhoea fits infective gastroenteritis",
        },
      ],
      penalties: [
        {
          ifAny: ["peritonism", "pain_out_of_proportion", "pain_severe_but_exam_mild", "pain_migration_to_rif", "jaundice", "testicular_pain"],
          subtract: 5,
          reason: "focal or dangerous localizing features argue strongly against gastroenteritis",
        },
        {
          ifAll: ["abdominal_pain", "severe_pain"],
          ifAny: ["atrial_fibrillation", "vascular_disease", "older_age"],
          subtract: 2,
          reason: "vascular-risk severe abdominal pain should only modestly fit gastroenteritis",
        },
      ],
    },
    relationships: {
      commonMimics: ["Appendicitis", "Mesenteric ischaemia", "Diabetic ketoacidosis"],
      patternTags: ["benign-common-comparator"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["Gastroenteritis should lose quickly when focal or high-risk features appear."],
      classicPitfalls: ["Using vomiting or diarrhoea to explain away surgical or vascular disease."],
    },
    sourceNotes: ["Common benign comparator."],
  },
  {
    id: "constipation",
    name: "Constipation",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Abdominal discomfort with reduced bowel opening and no focal red flags.",
    features: {
      core: ["abdominal_pain", "constipation"],
      discriminating: ["bowel_habit_change"],
      weak: ["distension"],
      against: ["vomiting", "peritonism", "fever", "pain_out_of_proportion"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["constipation"],
          ifAny: ["bowel_habit_change"],
          add: 2,
          reason: "bowel habit change supports constipation as a benign comparator",
        },
      ],
      penalties: [
        {
          ifAny: ["vomiting", "peritonism", "fever", "pain_out_of_proportion"],
          subtract: 4,
          reason: "red flags or obstruction features argue against simple constipation",
        },
      ],
    },
    relationships: {
      commonMimics: ["Bowel obstruction", "IBS"],
      patternTags: ["benign-bowel-comparator"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["Constipation is a comparator, not a reason to dismiss red flags."],
      classicPitfalls: ["Missing obstruction by overcalling constipation."],
    },
    sourceNotes: ["Low-priority benign comparator."],
  },
  {
    id: "peptic_ulcer_disease_gastritis_dyspepsia",
    name: "Peptic ulcer disease / gastritis / dyspepsia",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Upper abdominal burning discomfort without peritonism or instability.",
    features: {
      core: ["epigastric_pain"],
      discriminating: ["burning_pain", "heartburn", "post_prandial_pain"],
      weak: ["nausea"],
      against: ["peritonism", "shock", "pain_radiates_to_back", "jaundice"],
      riskFactors: ["nsaid_use", "peptic_ulcer_history"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["epigastric_pain"],
          ifAny: ["burning_pain", "heartburn"],
          add: 3,
          reason: "burning dyspeptic pattern supports benign upper GI causes",
        },
      ],
      penalties: [
        {
          ifAny: ["peritonism", "shock", "pain_radiates_to_back"],
          subtract: 4,
          reason: "catastrophic or pancreatitis-like features argue against simple dyspepsia",
        },
      ],
    },
    relationships: {
      commonMimics: ["Acute pancreatitis", "Perforated viscus / peritonitis", "Acute coronary syndrome presenting as epigastric pain"],
      patternTags: ["benign-upper-gi-comparator"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["Useful comparator, but do not let it hide ACS, pancreatitis, or perforation."],
      classicPitfalls: ["Calling cardiac or surgical epigastric pain indigestion."],
    },
    sourceNotes: ["Comparator group for upper abdominal pain."],
  },
  {
    id: "ibs",
    name: "Irritable bowel syndrome",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Lower-priority recurrent pain comparator with bowel habit change and well intervals.",
    features: {
      core: ["abdominal_pain", "bowel_habit_change"],
      discriminating: ["recurrent_attacks", "pain_settles_between_episodes"],
      weak: ["constipation", "diarrhoea"],
      against: ["fever", "peritonism", "shock", "localized_tenderness"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominal_pain", "bowel_habit_change", "pain_settles_between_episodes"],
          add: 2,
          reason: "recurrent well-between-attacks bowel pattern fits IBS",
        },
      ],
      penalties: [
        {
          ifAny: ["fever", "peritonism", "shock", "localized_tenderness"],
          subtract: 5,
          reason: "inflammatory or dangerous features argue strongly against IBS",
        },
      ],
    },
    relationships: {
      commonMimics: ["Constipation", "Gastroenteritis", "Diverticulitis"],
      patternTags: ["low-priority-benign-comparator"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["IBS should be weak, not a default explanation for acute pain."],
      classicPitfalls: ["Using IBS to explain red-flag acute abdominal presentations."],
    },
    sourceNotes: ["Keep deliberately low-weight."],
  },
  {
    id: "acute_hepatitis",
    name: "Hepatitis / acute liver inflammation",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "RUQ discomfort with jaundice and systemic upset, but without septic obstruction pattern.",
    features: {
      core: ["ruq_pain", "jaundice"],
      discriminating: ["anorexia"],
      weak: ["fever", "nausea"],
      against: ["rigors", "shock", "murphys_sign"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["ruq_pain", "jaundice"],
          ifAny: ["anorexia"],
          add: 3,
          reason: "hepatic inflammatory pattern with jaundice supports hepatitis",
        },
      ],
      penalties: [
        {
          ifAny: ["rigors", "dark_urine", "pale_stools", "murphys_sign"],
          subtract: 3,
          reason: "obstructive or septic biliary features point away from hepatitis",
        },
      ],
    },
    relationships: {
      commonMimics: ["Acute cholangitis", "Acute cholecystitis", "Choledocholithiasis / obstructive jaundice"],
      patternTags: ["hepatic-inflammatory"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["Hepatitis is usually less septic and less obstructive than cholangitis."],
      classicPitfalls: ["Calling cholangitis hepatitis because jaundice is present."],
    },
    sourceNotes: ["Useful medical RUQ comparator."],
  },
  {
    id: "dka",
    name: "Diabetic ketoacidosis",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Abdominal pain with vomiting in a diabetic patient with dehydration or metabolic clues.",
    features: {
      core: ["abdominal_pain", "vomiting", "diabetic_context"],
      discriminating: ["polyuria", "polydipsia", "ketosis_breath"],
      weak: ["dehydration", "confusion"],
      against: ["localized_tenderness", "pain_migration_to_rif", "murphys_sign"],
      riskFactors: ["diabetic_context"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominal_pain", "diabetic_context"],
          ifAny: ["polyuria", "polydipsia", "ketosis_breath", "dehydration"],
          add: 5,
          reason: "metabolic diabetic pattern with abdominal pain supports DKA",
        },
      ],
      escalationRules: [
        {
          ifAll: ["diabetic_context"],
          ifAny: ["confusion", "shock", "dehydration"],
          add: 6,
          reason: "systemically unwell diabetic patient requires DKA escalation",
        },
      ],
    },
    relationships: {
      commonMimics: ["Gastroenteritis", "Acute pancreatitis", "Appendicitis"],
      patternTags: ["metabolic-emergency"],
      redFlagTags: ["dka"],
    },
    teaching: {
      keyPearls: ["DKA can cause abdominal pain and vomiting without a primary surgical abdomen."],
      classicPitfalls: ["Missing DKA because abdominal symptoms dominate the history."],
    },
    sourceNotes: ["Important medical must-not-miss."],
  },
  {
    id: "lower_lobe_pneumonia",
    name: "Lower lobe pneumonia",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Referred upper abdominal pain with respiratory infective features.",
    features: {
      core: ["abdominal_pain"],
      discriminating: ["cough", "sob", "fever"],
      weak: ["hypoxia"],
      against: ["rif_tenderness", "pain_migration_to_rif", "peritonism"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominal_pain"],
          ifAny: ["cough", "sob", "hypoxia"],
          add: 4,
          reason: "respiratory infective features can explain referred abdominal pain",
        },
      ],
      penalties: [
        {
          ifAny: ["rif_tenderness", "peritonism", "pain_migration_to_rif"],
          subtract: 4,
          reason: "focal abdominal localization argues against referred pneumonia pain",
        },
      ],
    },
    relationships: {
      commonMimics: ["Acute cholecystitis", "Appendicitis"],
      patternTags: ["referred-pain", "medical-mimic"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["Respiratory symptoms can rescue you from an over-surgical abdominal differential."],
      classicPitfalls: ["Forgetting chest causes of upper abdominal pain."],
    },
    sourceNotes: ["Useful non-abdominal mimic."],
  },
  {
    id: "acs_epigastric_presentation",
    name: "Acute coronary syndrome presenting as epigastric pain",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Epigastric or upper abdominal pain with cardiac-equivalent features or vascular risk.",
    features: {
      core: ["epigastric_pain"],
      discriminating: ["acs_equivalent_pain", "chest_pain", "sob"],
      weak: ["nausea", "vomiting"],
      against: ["localized_tenderness", "pain_migration_to_rif", "diarrhoea"],
      riskFactors: ["older_age", "smoking_history", "hypertension", "vascular_disease"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["epigastric_pain"],
          ifAny: ["acs_equivalent_pain", "chest_pain", "sob"],
          add: 5,
          reason: "upper abdominal pain with cardiac-equivalent features supports ACS",
        },
      ],
      escalationRules: [
        {
          ifAll: ["epigastric_pain"],
          ifAny: ["hypotension", "collapse"],
          add: 5,
          reason: "unstable epigastric pain can still be cardiac",
        },
      ],
      penalties: [
        {
          ifAny: ["localized_tenderness", "pain_migration_to_rif", "murphys_sign"],
          subtract: 3,
          reason: "focal abdominal exam features argue against ACS",
        },
      ],
    },
    relationships: {
      commonMimics: ["Peptic ulcer disease / gastritis / dyspepsia", "Acute pancreatitis"],
      patternTags: ["epigastric-cardiac-mimic"],
      redFlagTags: ["acs"],
    },
    teaching: {
      keyPearls: ["Not all upper abdominal pain is GI; preserve a cardiac branch."],
      classicPitfalls: ["Calling ACS dyspepsia or pancreatitis because nausea is present."],
    },
    sourceNotes: ["High-value non-abdominal mimic."],
  },
  {
    id: "ovarian_torsion",
    name: "Ovarian torsion",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Sudden unilateral pelvic pain with vomiting and adnexal localization.",
    features: {
      core: ["pelvic_pain", "sudden_onset"],
      discriminating: ["adnexal_pain"],
      weak: ["vomiting"],
      against: ["pain_settles_between_episodes", "urinary_symptoms", "diarrhoea"],
      riskFactors: ["female_of_childbearing_age"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["pelvic_pain", "sudden_onset"],
          ifAny: ["adnexal_pain", "vomiting"],
          add: 5,
          reason: "sudden pelvic pain with vomiting or adnexal localization supports torsion",
        },
      ],
      escalationRules: [
        {
          ifAll: ["pelvic_pain", "sudden_onset"],
          add: 5,
          reason: "torsion is a time-critical gynae diagnosis",
        },
      ],
    },
    relationships: {
      commonMimics: ["Ectopic pregnancy", "Ruptured ovarian cyst", "Appendicitis"],
      patternTags: ["gynae-emergency", "sudden-pelvic-pain"],
      redFlagTags: ["ovarian-torsion"],
    },
    teaching: {
      keyPearls: ["Vomiting with sudden pelvic pain is more useful than generic abdominal pain."],
      classicPitfalls: ["Calling torsion gastroenteritis or appendicitis."],
    },
    sourceNotes: ["Must-not-miss acute pelvic diagnosis."],
  },
  {
    id: "pelvic_inflammatory_disease",
    name: "Pelvic inflammatory disease",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Pelvic pain with fever and infective gynae pattern.",
    features: {
      core: ["pelvic_pain"],
      discriminating: ["fever", "vaginal_bleeding"],
      weak: ["urinary_symptoms"],
      against: ["sudden_onset", "collapse", "pain_settles_between_episodes"],
      riskFactors: ["female_of_childbearing_age"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["pelvic_pain"],
          ifAny: ["fever", "vaginal_bleeding"],
          add: 3,
          reason: "infective pelvic inflammatory pattern supports PID",
        },
      ],
      penalties: [
        {
          ifAll: ["sudden_onset", "collapse"],
          subtract: 3,
          reason: "sudden collapse fits ectopic better",
        },
      ],
    },
    relationships: {
      commonMimics: ["Ectopic pregnancy", "Appendicitis", "Pyelonephritis"],
      patternTags: ["gynae-infective"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["PID matters because it sits close to appendicitis and ectopic in practice."],
      classicPitfalls: ["Under-recognizing gynae causes in lower abdominal pain."],
    },
    sourceNotes: ["Useful not-to-miss gynae inflammatory comparator."],
  },
  {
    id: "ruptured_ovarian_cyst",
    name: "Ruptured ovarian cyst",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Sudden pelvic pain, usually without septic features.",
    features: {
      core: ["pelvic_pain", "sudden_onset"],
      discriminating: ["adnexal_pain"],
      weak: ["vaginal_bleeding"],
      against: ["fever", "pain_settles_between_episodes"],
      riskFactors: ["female_of_childbearing_age"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["pelvic_pain", "sudden_onset"],
          ifAny: ["adnexal_pain", "vaginal_bleeding"],
          add: 4,
          reason: "sudden adnexal-predominant pain supports ruptured ovarian cyst",
        },
      ],
      penalties: [
        {
          ifAny: ["fever", "rigors"],
          subtract: 2,
          reason: "infective pattern fits PID more than ruptured cyst",
        },
      ],
    },
    relationships: {
      commonMimics: ["Ovarian torsion", "Ectopic pregnancy", "Appendicitis"],
      patternTags: ["sudden-pelvic-pain"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["Usually acute and pelvic, but less septic than PID and less pregnancy-linked than ectopic."],
      classicPitfalls: ["Collapsing all pelvic pain into appendicitis."],
    },
    sourceNotes: ["Useful acute pelvic comparator."],
  },
  {
    id: "renal_colic",
    name: "Renal colic / ureteric stone",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Severe colicky flank-to-groin pain, often with haematuria.",
    features: {
      core: ["flank_pain", "colicky_pain"],
      discriminating: ["loin_to_groin_pain", "haematuria", "restless"],
      weak: ["vomiting"],
      against: ["peritonism", "fever", "pain_migration_to_rif"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["flank_pain"],
          ifAny: ["loin_to_groin_pain", "haematuria", "colicky_pain"],
          add: 5,
          reason: "flank-to-groin colicky pattern strongly supports ureteric stone",
        },
        {
          ifAll: ["flank_pain", "loin_to_groin_pain"],
          ifAny: ["colicky_pain", "restless", "haematuria"],
          add: 8,
          reason: "classic renal colic composite pattern",
        },
      ],
      penalties: [
        {
          ifAny: ["fever", "peritonism"],
          subtract: 3,
          reason: "fever or peritonism suggests pyelonephritis or a surgical abdomen instead",
        },
      ],
    },
    relationships: {
      commonMimics: ["Pyelonephritis", "Ruptured / symptomatic abdominal aortic aneurysm", "Appendicitis"],
      patternTags: ["urology-colic", "flank-to-groin"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["Restless colicky pain differs from still, peritonitic pain."],
      classicPitfalls: ["Missing AAA in older patients with flank or back pain."],
    },
    sourceNotes: ["High-yield urology cause."],
  },
  {
    id: "pyelonephritis",
    name: "Pyelonephritis",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Fever, flank pain, and urinary symptoms, sometimes presenting as abdominal pain.",
    features: {
      core: ["flank_pain", "fever"],
      discriminating: ["urinary_symptoms", "cva_tenderness"],
      weak: ["vomiting"],
      against: ["pain_out_of_proportion", "peritonism", "pain_settles_between_episodes", "restless"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["flank_pain", "fever"],
          ifAny: ["urinary_symptoms", "cva_tenderness"],
          add: 5,
          reason: "feverish flank pain with urinary source supports pyelonephritis",
        },
      ],
      escalationRules: [
        {
          ifAll: ["flank_pain", "fever"],
          ifAny: ["hypotension", "sepsis_pattern"],
          add: 5,
          reason: "urosepsis physiology should escalate",
        },
      ],
      penalties: [
        {
          ifAll: ["flank_pain", "fever"],
          ifAny: ["loin_to_groin_pain", "restless"],
          subtract: 3,
          reason: "restless loin-to-groin pain without a urinary infective source fits renal colic better than pyelonephritis",
        },
      ],
    },
    relationships: {
      commonMimics: ["Renal colic / ureteric stone", "Diverticulitis", "Severe sepsis from an intra-abdominal source"],
      patternTags: ["urinary-source", "infective-flank-pain"],
      redFlagTags: ["urosepsis"],
    },
    teaching: {
      keyPearls: ["Urinary symptoms are more useful than generic fever and vomiting."],
      classicPitfalls: ["Calling pyelonephritis renal colic when vomiting dominates."],
    },
    sourceNotes: ["Not-to-miss urinary infective cause."],
  },
  {
    id: "testicular_torsion",
    name: "Testicular torsion",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Young male with lower abdominal pain that is actually acute scrotal pain unless asked about.",
    features: {
      core: ["testicular_pain", "sudden_onset"],
      discriminating: ["testicular_pain"],
      weak: ["vomiting"],
      against: ["fever", "urinary_symptoms"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["testicular_pain", "sudden_onset"],
          add: 6,
          reason: "acute testicular pain is highly specific for torsion",
        },
      ],
      escalationRules: [
        {
          ifAll: ["testicular_pain", "sudden_onset"],
          add: 7,
          reason: "torsion is a time-critical emergency",
        },
      ],
    },
    relationships: {
      commonMimics: ["Appendicitis", "Renal colic / ureteric stone"],
      patternTags: ["urology-emergency", "referred-lower-abdominal-pain"],
      redFlagTags: ["testicular-torsion"],
    },
    teaching: {
      keyPearls: ["In young males with lower abdominal pain, ask directly about the scrotum."],
      classicPitfalls: ["Missing torsion because the history is taken as abdominal pain only."],
    },
    sourceNotes: ["Must-not-miss referred lower abdominal pain diagnosis."],
  },
  {
    id: "urinary_retention",
    name: "Urinary retention",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Suprapubic pain and inability to pass urine.",
    features: {
      core: ["suprapubic_pain"],
      discriminating: ["urinary_retention"],
      weak: [],
      against: ["diarrhoea", "peritonism", "jaundice"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["suprapubic_pain", "urinary_retention"],
          add: 5,
          reason: "suprapubic pain plus retention strongly supports urinary retention",
        },
      ],
    },
    relationships: {
      commonMimics: ["Constipation", "Pyelonephritis"],
      patternTags: ["urology-lower-abdominal"],
      redFlagTags: [],
    },
    teaching: {
      keyPearls: ["Retention is obvious only if you ask about passing urine."],
      classicPitfalls: ["Calling suprapubic pain abdominal-only without considering the bladder."],
    },
    sourceNotes: ["Commonly overlooked urology mimic."],
  },
];

export const acuteAbdominalPainDeferredSecondPass = [
  "Choledocholithiasis / obstructive jaundice as a separate abdominal-block diagnosis if not already modeled elsewhere",
  "Primary sclerosing cholangitis",
  "Primary biliary cholangitis",
  "Mesenteric adenitis",
  "Ischaemic colitis",
  "Splenic infarct / splenic rupture",
  "Tubo-ovarian abscess",
  "Abdominal wall pain / rectus sheath haematoma",
  "Small bowel obstruction adhesions subtype",
  "Perforated peptic ulcer as a standalone subtype rather than folded into perforated viscus",
] as const;
