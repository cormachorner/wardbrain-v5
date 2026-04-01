import type { DiagnosisDefinition } from "../../types";

export const acuteAbdominalPainFeatureVocabulary = {
  painLocation: [
    "abdominalPain",
    "upperAbdominalPain",
    "epigastricPain",
    "ruqPain",
    "rifPain",
    "llqPain",
    "generalizedAbdominalPain",
    "pelvicPain",
    "suprapubicPain",
    "flankPain",
    "loinToGroinPain",
    "backPain",
    "testicularPain",
  ],
  painPattern: [
    "suddenOnset",
    "gradualOnset",
    "constantPain",
    "episodicPain",
    "recurrentAttacks",
    "painSettlesBetweenEpisodes",
    "progressivePain",
    "painMigrationToRIF",
    "severePain",
    "colickyPain",
    "painOutOfProportion",
    "painRadiatesToBack",
    "painWorseOnMovement",
    "painWorseWithCough",
    "lyingStill",
    "postPrandialPain",
  ],
  abdominalExam: [
    "localizedTenderness",
    "ruqTenderness",
    "rifTenderness",
    "guarding",
    "rigidity",
    "peritonism",
    "murphysSign",
    "distension",
    "herniaPresent",
    "incarceratedHernia",
  ],
  giFeatures: [
    "nausea",
    "vomiting",
    "diarrhoea",
    "constipation",
    "bowelHabitChange",
    "obstipation",
    "unableToPassFlatus",
    "anorexia",
    "jaundice",
    "darkUrine",
    "paleStools",
    "pruritus",
    "giBleed",
    "haematemesis",
    "melaena",
    "prBleeding",
    "heartburn",
    "burningPain",
  ],
  systemic: [
    "fever",
    "rigors",
    "tachycardia",
    "hypotension",
    "collapse",
    "shock",
    "sepsisPattern",
    "dehydration",
    "confusion",
  ],
  urinary: [
    "urinarySymptoms",
    "dysuria",
    "frequency",
    "haematuria",
    "urinaryRetention",
    "cvaTenderness",
  ],
  gynae: [
    "pregnancyPossible",
    "positivePregnancyTest",
    "missedPeriod",
    "vaginalBleeding",
    "adnexalPain",
  ],
  cardioResp: [
    "chestPain",
    "sob",
    "cough",
    "hypoxia",
    "acsEquivalentPain",
  ],
  metabolic: [
    "diabeticContext",
    "polyuria",
    "polydipsia",
    "ketosisBreath",
  ],
  riskFactors: [
    "olderAge",
    "smokingHistory",
    "hypertension",
    "vascularDisease",
    "atrialFibrillation",
    "gallstoneHistory",
    "heavyAlcoholIntake",
    "nsaidUse",
    "pepticUlcerHistory",
    "previousAbdominalSurgery",
    "knownHernia",
    "femaleOfChildbearingAge",
  ],
} as const;

export const acuteAbdominalPainDiagnoses: DiagnosisDefinition[] = [
  {
    id: "ruptured_or_symptomatic_aaa",
    name: "Ruptured / symptomatic abdominal aortic aneurysm",
    presentationBlocks: ["acute_abdominal_pain"],
    summary: "Sudden abdominal or back pain with collapse or shock in an older vascular patient.",
    features: {
      core: ["abdominalPain", "suddenOnset"],
      discriminating: ["collapse", "hypotension", "backPain"],
      weak: ["vomiting"],
      against: ["diarrhoea", "painSettlesBetweenEpisodes", "urinarySymptoms"],
      riskFactors: ["olderAge", "smokingHistory", "hypertension", "vascularDisease"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominalPain", "suddenOnset"],
          ifAny: ["backPain", "collapse", "hypotension"],
          add: 5,
          reason: "sudden abdominal or back pain with instability fits symptomatic or ruptured AAA",
        },
      ],
      escalationRules: [
        {
          ifAll: ["abdominalPain"],
          ifAny: ["collapse", "hypotension", "shock"],
          add: 8,
          reason: "unstable abdominal pain in an older vascular patient must escalate AAA",
        },
      ],
      penalties: [
        {
          ifAny: ["diarrhoea", "painMigrationToRIF", "urinarySymptoms"],
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
        backPain: ["pain radiating to the back", "back radiation"],
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
      core: ["abdominalPain", "severePain"],
      discriminating: ["painOutOfProportion", "suddenOnset"],
      weak: ["vomiting", "bowelHabitChange"],
      against: ["painMigrationToRIF", "painSettlesBetweenEpisodes"],
      riskFactors: ["atrialFibrillation", "vascularDisease", "olderAge"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominalPain", "painOutOfProportion"],
          add: 6,
          reason: "pain out of proportion is highly discriminating for mesenteric ischaemia",
        },
        {
          ifAll: ["abdominalPain", "painOutOfProportion"],
          ifAny: ["atrialFibrillation", "vascularDisease"],
          add: 4,
          reason: "vascular or embolic context strongly supports mesenteric ischaemia",
        },
      ],
      escalationRules: [
        {
          ifAll: ["abdominalPain", "painOutOfProportion"],
          ifAny: ["collapse", "hypotension", "shock"],
          add: 7,
          reason: "pain out of proportion with physiological compromise must escalate mesenteric ischaemia",
        },
      ],
      penalties: [
        {
          ifAll: ["painMigrationToRIF"],
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
        painOutOfProportion: ["pain out of proportion to examination", "pain out of proportion to exam"],
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
      core: ["abdominalPain", "suddenOnset"],
      discriminating: ["peritonism", "guarding", "rigidity", "painWorseOnMovement", "lyingStill"],
      weak: ["vomiting", "sepsisPattern"],
      against: ["painSettlesBetweenEpisodes", "colickyPain"],
      riskFactors: ["pepticUlcerHistory", "nsaidUse", "previousAbdominalSurgery"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominalPain", "suddenOnset"],
          ifAny: ["peritonism", "guarding", "rigidity"],
          add: 6,
          reason: "sudden pain with peritoneal signs strongly supports perforation or peritonitis",
        },
        {
          ifAll: ["abdominalPain", "painWorseOnMovement"],
          ifAny: ["lyingStill", "painWorseWithCough"],
          add: 3,
          reason: "movement-aggravated pain with stillness preference fits peritonitic pain",
        },
      ],
      escalationRules: [
        {
          ifAll: ["abdominalPain"],
          ifAny: ["peritonism", "rigidity", "shock"],
          add: 7,
          reason: "peritonitic abdominal pain is a surgical emergency",
        },
      ],
      penalties: [
        {
          ifAll: ["painSettlesBetweenEpisodes"],
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
      core: ["abdominalPain", "vomiting"],
      discriminating: ["distension", "obstipation", "unableToPassFlatus", "colickyPain"],
      weak: ["previousAbdominalSurgery", "herniaPresent"],
      against: ["diarrhoea", "painSettlesBetweenEpisodes"],
      riskFactors: ["previousAbdominalSurgery", "knownHernia"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominalPain", "vomiting"],
          ifAny: ["distension", "obstipation", "unableToPassFlatus"],
          add: 5,
          reason: "vomiting with distension and obstructive bowel symptoms supports bowel obstruction",
        },
      ],
      escalationRules: [
        {
          ifAll: ["abdominalPain"],
          ifAny: ["incarceratedHernia", "hypotension", "sepsisPattern"],
          add: 6,
          reason: "obstruction with strangulation or ischaemia risk should escalate",
        },
      ],
      penalties: [
        {
          ifAll: ["painSettlesBetweenEpisodes"],
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
      core: ["abdominalPain", "fever"],
      discriminating: ["rigors", "hypotension", "sepsisPattern"],
      weak: ["vomiting", "confusion"],
      against: ["painSettlesBetweenEpisodes"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominalPain", "fever"],
          ifAny: ["rigors", "tachycardia", "hypotension"],
          add: 4,
          reason: "abdominal pain plus infective instability supports intra-abdominal sepsis",
        },
      ],
      escalationRules: [
        {
          ifAll: ["abdominalPain"],
          ifAny: ["hypotension", "shock", "confusion"],
          add: 7,
          reason: "systemically unwell abdominal pain requires sepsis escalation",
        },
      ],
      penalties: [
        {
          ifAll: ["painSettlesBetweenEpisodes"],
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
      core: ["pelvicPain"],
      discriminating: ["pregnancyPossible", "missedPeriod", "vaginalBleeding"],
      weak: ["collapse"],
      against: ["painSettlesBetweenEpisodes", "urinarySymptoms"],
      riskFactors: ["femaleOfChildbearingAge"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["pelvicPain"],
          ifAny: ["pregnancyPossible", "positivePregnancyTest", "missedPeriod"],
          add: 5,
          reason: "pregnancy context plus pelvic pain strongly supports ectopic pregnancy",
        },
        {
          ifAll: ["pelvicPain", "vaginalBleeding"],
          add: 4,
          reason: "pelvic pain with bleeding is a classic ectopic pattern",
        },
      ],
      escalationRules: [
        {
          ifAll: ["pelvicPain"],
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
        missedPeriod: ["late period", "amenorrhoea"],
        pregnancyPossible: ["could be pregnant", "pregnancy possible"],
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
      core: ["abdominalPain", "rifPain"],
      discriminating: ["painMigrationToRIF", "rifTenderness"],
      weak: ["nausea", "vomiting", "fever", "localizedTenderness"],
      against: ["diarrhoea", "painSettlesBetweenEpisodes", "jaundice"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["rifPain"],
          ifAny: ["painMigrationToRIF", "rifTenderness"],
          add: 5,
          reason: "migratory pain with RIF localization strongly supports appendicitis",
        },
      ],
      escalationRules: [
        {
          ifAll: ["rifPain"],
          ifAny: ["sepsisPattern", "guarding", "rigidity"],
          add: 6,
          reason: "appendicitis with perforation or sepsis risk should escalate",
        },
      ],
      penalties: [
        {
          ifAll: ["painSettlesBetweenEpisodes"],
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
      core: ["ruqPain", "jaundice", "fever"],
      discriminating: ["rigors", "darkUrine", "paleStools"],
      weak: ["vomiting", "gallstoneHistory", "pruritus"],
      against: ["painSettlesBetweenEpisodes"],
      riskFactors: ["gallstoneHistory"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["ruqPain", "jaundice"],
          ifAny: ["fever", "rigors"],
          add: 6,
          reason: "biliary sepsis pattern strongly supports cholangitis",
        },
      ],
      escalationRules: [
        {
          ifAll: ["ruqPain", "jaundice"],
          ifAny: ["hypotension", "confusion", "shock"],
          add: 8,
          reason: "biliary obstruction with sepsis physiology must escalate urgently",
        },
      ],
      penalties: [
        {
          ifAll: ["painSettlesBetweenEpisodes"],
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
      core: ["epigastricPain", "constantPain"],
      discriminating: ["painRadiatesToBack", "severePain"],
      weak: ["vomiting", "nausea"],
      against: ["painMigrationToRIF", "painSettlesBetweenEpisodes", "urinarySymptoms"],
      riskFactors: ["heavyAlcoholIntake", "gallstoneHistory"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["epigastricPain"],
          ifAny: ["painRadiatesToBack", "heavyAlcoholIntake", "gallstoneHistory"],
          add: 5,
          reason: "epigastric pain with back radiation or classic trigger context supports pancreatitis",
        },
      ],
      escalationRules: [
        {
          ifAll: ["epigastricPain"],
          ifAny: ["hypotension", "shock", "sepsisPattern"],
          add: 5,
          reason: "severe pancreatitis with organ dysfunction should escalate",
        },
      ],
      penalties: [
        {
          ifAll: ["ruqPain", "fever"],
          ifAny: ["murphysSign", "ruqTenderness"],
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
      core: ["ruqPain", "constantPain"],
      discriminating: ["murphysSign", "ruqTenderness", "fever"],
      weak: ["nausea", "vomiting", "postPrandialPain"],
      against: ["jaundice", "painSettlesBetweenEpisodes"],
      riskFactors: ["gallstoneHistory"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["ruqPain"],
          ifAny: ["murphysSign", "ruqTenderness", "fever"],
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
          ifAll: ["painSettlesBetweenEpisodes"],
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
      core: ["ruqPain", "episodicPain"],
      discriminating: ["postPrandialPain", "recurrentAttacks", "painSettlesBetweenEpisodes"],
      weak: ["epigastricPain", "gallstoneHistory"],
      against: ["fever", "jaundice", "constantPain"],
      riskFactors: ["gallstoneHistory"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["ruqPain", "episodicPain"],
          ifAny: ["postPrandialPain", "recurrentAttacks", "painSettlesBetweenEpisodes"],
          add: 5,
          reason: "recurrent meal-related settling biliary pain supports biliary colic",
        },
      ],
      penalties: [
        {
          ifAny: ["fever", "jaundice", "constantPain"],
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
      core: ["abdominalPain", "localizedTenderness"],
      discriminating: ["llqPain", "fever"],
      weak: ["bowelHabitChange", "constipation", "nausea"],
      against: ["painMigrationToRIF", "painSettlesBetweenEpisodes", "jaundice"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["llqPain", "localizedTenderness"],
          ifAny: ["fever", "bowelHabitChange"],
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
      core: ["abdominalPain"],
      discriminating: ["herniaPresent", "incarceratedHernia"],
      weak: ["vomiting", "obstipation", "distension"],
      against: ["painSettlesBetweenEpisodes"],
      riskFactors: ["knownHernia"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["herniaPresent", "incarceratedHernia"],
          add: 6,
          reason: "painful incarcerated hernia is highly specific",
        },
      ],
      escalationRules: [
        {
          ifAll: ["herniaPresent"],
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
      core: ["abdominalPain", "vomiting", "diarrhoea"],
      discriminating: ["generalizedAbdominalPain"],
      weak: ["fever", "dehydration"],
      against: ["peritonism", "painOutOfProportion", "painMigrationToRIF", "jaundice"],
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
          ifAny: ["peritonism", "painOutOfProportion", "painMigrationToRIF", "jaundice", "testicularPain"],
          subtract: 5,
          reason: "focal or dangerous localizing features argue strongly against gastroenteritis",
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
      core: ["abdominalPain", "constipation"],
      discriminating: ["bowelHabitChange"],
      weak: ["distension"],
      against: ["vomiting", "peritonism", "fever", "painOutOfProportion"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["constipation"],
          ifAny: ["bowelHabitChange"],
          add: 2,
          reason: "bowel habit change supports constipation as a benign comparator",
        },
      ],
      penalties: [
        {
          ifAny: ["vomiting", "peritonism", "fever", "painOutOfProportion"],
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
      core: ["epigastricPain"],
      discriminating: ["burningPain", "heartburn", "postPrandialPain"],
      weak: ["nausea"],
      against: ["peritonism", "shock", "painRadiatesToBack", "jaundice"],
      riskFactors: ["nsaidUse", "pepticUlcerHistory"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["epigastricPain"],
          ifAny: ["burningPain", "heartburn"],
          add: 3,
          reason: "burning dyspeptic pattern supports benign upper GI causes",
        },
      ],
      penalties: [
        {
          ifAny: ["peritonism", "shock", "painRadiatesToBack"],
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
      core: ["abdominalPain", "bowelHabitChange"],
      discriminating: ["recurrentAttacks", "painSettlesBetweenEpisodes"],
      weak: ["constipation", "diarrhoea"],
      against: ["fever", "peritonism", "shock", "localizedTenderness"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominalPain", "bowelHabitChange", "painSettlesBetweenEpisodes"],
          add: 2,
          reason: "recurrent well-between-attacks bowel pattern fits IBS",
        },
      ],
      penalties: [
        {
          ifAny: ["fever", "peritonism", "shock", "localizedTenderness"],
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
      core: ["ruqPain", "jaundice"],
      discriminating: ["anorexia"],
      weak: ["fever", "nausea"],
      against: ["rigors", "shock", "murphysSign"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["ruqPain", "jaundice"],
          ifAny: ["anorexia"],
          add: 3,
          reason: "hepatic inflammatory pattern with jaundice supports hepatitis",
        },
      ],
      penalties: [
        {
          ifAny: ["rigors", "darkUrine", "paleStools", "murphysSign"],
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
      core: ["abdominalPain", "vomiting", "diabeticContext"],
      discriminating: ["polyuria", "polydipsia", "ketosisBreath"],
      weak: ["dehydration", "confusion"],
      against: ["localizedTenderness", "painMigrationToRIF", "murphysSign"],
      riskFactors: ["diabeticContext"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominalPain", "diabeticContext"],
          ifAny: ["polyuria", "polydipsia", "ketosisBreath", "dehydration"],
          add: 5,
          reason: "metabolic diabetic pattern with abdominal pain supports DKA",
        },
      ],
      escalationRules: [
        {
          ifAll: ["diabeticContext"],
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
      core: ["abdominalPain"],
      discriminating: ["cough", "sob", "fever"],
      weak: ["hypoxia"],
      against: ["rifTenderness", "painMigrationToRIF", "peritonism"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["abdominalPain"],
          ifAny: ["cough", "sob", "hypoxia"],
          add: 4,
          reason: "respiratory infective features can explain referred abdominal pain",
        },
      ],
      penalties: [
        {
          ifAny: ["rifTenderness", "peritonism", "painMigrationToRIF"],
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
      core: ["epigastricPain"],
      discriminating: ["acsEquivalentPain", "chestPain", "sob"],
      weak: ["nausea", "vomiting"],
      against: ["localizedTenderness", "painMigrationToRIF", "diarrhoea"],
      riskFactors: ["olderAge", "smokingHistory", "hypertension", "vascularDisease"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["epigastricPain"],
          ifAny: ["acsEquivalentPain", "chestPain", "sob"],
          add: 5,
          reason: "upper abdominal pain with cardiac-equivalent features supports ACS",
        },
      ],
      escalationRules: [
        {
          ifAll: ["epigastricPain"],
          ifAny: ["hypotension", "collapse"],
          add: 5,
          reason: "unstable epigastric pain can still be cardiac",
        },
      ],
      penalties: [
        {
          ifAny: ["localizedTenderness", "painMigrationToRIF", "murphysSign"],
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
      core: ["pelvicPain", "suddenOnset"],
      discriminating: ["adnexalPain"],
      weak: ["vomiting"],
      against: ["painSettlesBetweenEpisodes", "urinarySymptoms", "diarrhoea"],
      riskFactors: ["femaleOfChildbearingAge"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["pelvicPain", "suddenOnset"],
          ifAny: ["adnexalPain", "vomiting"],
          add: 5,
          reason: "sudden pelvic pain with vomiting or adnexal localization supports torsion",
        },
      ],
      escalationRules: [
        {
          ifAll: ["pelvicPain", "suddenOnset"],
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
      core: ["pelvicPain"],
      discriminating: ["fever", "vaginalBleeding"],
      weak: ["urinarySymptoms"],
      against: ["suddenOnset", "collapse", "painSettlesBetweenEpisodes"],
      riskFactors: ["femaleOfChildbearingAge"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["pelvicPain"],
          ifAny: ["fever", "vaginalBleeding"],
          add: 3,
          reason: "infective pelvic inflammatory pattern supports PID",
        },
      ],
      penalties: [
        {
          ifAll: ["suddenOnset", "collapse"],
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
      core: ["pelvicPain", "suddenOnset"],
      discriminating: ["adnexalPain"],
      weak: ["vaginalBleeding"],
      against: ["fever", "painSettlesBetweenEpisodes"],
      riskFactors: ["femaleOfChildbearingAge"],
    },
    logic: {
      boosts: [
        {
          ifAll: ["pelvicPain", "suddenOnset"],
          ifAny: ["adnexalPain", "vaginalBleeding"],
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
      core: ["flankPain", "colickyPain"],
      discriminating: ["loinToGroinPain", "haematuria"],
      weak: ["vomiting"],
      against: ["peritonism", "fever", "painMigrationToRIF"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["flankPain"],
          ifAny: ["loinToGroinPain", "haematuria", "colickyPain"],
          add: 5,
          reason: "flank-to-groin colicky pattern strongly supports ureteric stone",
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
      core: ["flankPain", "fever"],
      discriminating: ["urinarySymptoms", "cvaTenderness"],
      weak: ["vomiting"],
      against: ["painOutOfProportion", "peritonism", "painSettlesBetweenEpisodes"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["flankPain", "fever"],
          ifAny: ["urinarySymptoms", "cvaTenderness"],
          add: 5,
          reason: "feverish flank pain with urinary source supports pyelonephritis",
        },
      ],
      escalationRules: [
        {
          ifAll: ["flankPain", "fever"],
          ifAny: ["hypotension", "sepsisPattern"],
          add: 5,
          reason: "urosepsis physiology should escalate",
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
      core: ["testicularPain", "suddenOnset"],
      discriminating: ["testicularPain"],
      weak: ["vomiting"],
      against: ["fever", "urinarySymptoms"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["testicularPain", "suddenOnset"],
          add: 6,
          reason: "acute testicular pain is highly specific for torsion",
        },
      ],
      escalationRules: [
        {
          ifAll: ["testicularPain", "suddenOnset"],
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
      core: ["suprapubicPain"],
      discriminating: ["urinaryRetention"],
      weak: [],
      against: ["diarrhoea", "peritonism", "jaundice"],
      riskFactors: [],
    },
    logic: {
      boosts: [
        {
          ifAll: ["suprapubicPain", "urinaryRetention"],
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
