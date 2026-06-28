import { writeFileSync } from "node:fs";
import type { CaseInput, ExtractedFeatures } from "../types";
import { prisma } from "../prisma";
import { canonicalFeatureSlug } from "./featureSlug";

const FEATURE_PATTERNS: Record<string, string[]> = {
  chest_pain: [
    "chest pain",
    "central chest pain",
    "central chest pressure",
    "chest pressure",
    "chest heaviness",
    "centre of his chest",
    "centre of her chest",
    "centre of the chest",
    "center of his chest",
    "center of her chest",
    "center of the chest",
    "middle of his chest",
    "middle of her chest",
    "middle of the chest",
    "heavy feeling in the middle of his chest",
    "heavy feeling in the middle of her chest",
    "heavy feeling in the middle of the chest",
    "heavy chest pain",
    "crushing chest pain",
    "chest tightness",
    "tight chest",
    "central chest discomfort",
    "heavy feeling in chest",
    "dull central chest pain",
    "retrosternal pain",
    "retrosternal discomfort",
    "burning retrosternal discomfort",
    "burning retrosternal chest discomfort",
    "pain on one side of chest",
    "unilateral chest pain",
    "sudden sharp chest pain",
  ],
  sudden_onset: [
    "sudden onset",
    "sudden",
    "suddenly",
    "sudden pleuritic chest pain",
    "sudden sharp chest pain",
    "sudden abdominal pain",
    "sudden severe abdominal pain",
    "sudden severe generalized abdominal pain",
    "sudden severe generalised abdominal pain",
    "sudden headache",
    "sudden shortness of breath",
    "sudden breathlessness",
    "abrupt onset",
    "abrupt epigastric abdominal pain",
    "came on suddenly",
    "started suddenly",
  ],
  tearing_pain: [
    "tearing",
    "ripping",
    "tearing pain",
    "ripping pain",
  ],
  back_radiation: [
    "radiating to the back",
    "radiates to the back",
    "back radiation",
    "pain to the back",
    "goes through to the back",
    "shoots through to the back",
    "through to the back",
    "radiating through to the back",
    "radiates through to the back",
    "pain through to the back",
    "into the back",
    "to the interscapular region",
    "between the shoulder blades",
    "interscapular pain",
  ],
  collapse: [
    "collapse",
    "collapses",
    "collapsed",
    "syncope",
    "syncopal episode",
    "syncopal event",
    "loss of consciousness",
    "transient loss of consciousness",
    "loc",
    "passed out",
    "blacked out",
    "fainted",
    "fainting",
    "found unconscious",
    "briefly unconscious",
    "unresponsive episode",
  ],
  pulsatile_abdomen: [
    "pulsatile abdomen",
    "pulsating abdomen",
    "pulsatile mass",
    "expansile abdominal mass",
    "pulsating mass",
  ],
  smoker: [
    "smoker",
    "smoking",
    "current smoker",
    "long smoking history",
  ],
  smoking_history: [
    "smoker",
    "smoking",
    "smokes",
    "current smoker",
    "long smoking history",
    "smoking history",
  ],
  hypertension: [
    "hypertension",
    "untreated hypertension",
    "high blood pressure",
    "known hypertension",
  ],
  hyperlipidaemia: [
    "hyperlipidaemia",
    "hyperlipidemia",
    "high cholesterol",
    "raised cholesterol",
  ],
  jaw_pain: [
    "jaw pain",
    "pain to jaw",
    "pain to the jaw",
    "pain in the jaw",
    "radiating to the jaw",
    "pain radiating to the jaw",
    "radiates to the jaw",
    "jaw discomfort",
  ],
  pain_radiates_to_jaw: [
    "radiating to the jaw",
    "pain radiating to the jaw",
    "radiates to the jaw",
    "spread into his jaw",
    "spread into her jaw",
    "spread into the jaw",
    "went into his jaw",
    "went into her jaw",
    "went into the jaw",
    "spread to his jaw",
    "spread to her jaw",
    "spread to the jaw",
    "travels to his jaw",
    "travels to her jaw",
    "travels to the jaw",
    "spread a bit into his jaw",
    "spread a bit into her jaw",
    "spread a bit into the jaw",
    "into his jaw",
    "into her jaw",
    "into the jaw",
  ],
  shoulder_pain: [
    "shoulder pain",
    "left shoulder",
    "right shoulder",
    "left shoulder pain",
    "right shoulder pain",
    "spread into his left shoulder",
    "spread into her left shoulder",
    "spread into the left shoulder",
  ],
  pain_radiates_to_shoulder: [
    "radiating to the shoulder",
    "radiates to the shoulder",
    "spread into his shoulder",
    "spread into her shoulder",
    "spread into his left shoulder",
    "spread into her left shoulder",
    "spread into the left shoulder",
    "spread a bit into his left shoulder",
    "spread a bit into her left shoulder",
    "spread a bit into the left shoulder",
    "jaw and left shoulder",
    "jaw and right shoulder",
    "into his left shoulder",
    "into her left shoulder",
    "into the left shoulder",
  ],
  arm_pain: [
    "arm pain",
    "left arm pain",
    "right arm pain",
    "left arm",
    "right arm",
    "pain to left arm",
    "pain to the left arm",
    "pain to right arm",
    "pain to the right arm",
    "pain radiating to the arm",
    "pain radiating to the left arm",
    "pain radiating to the right arm",
    "radiates to the arm",
    "radiates to the left arm",
    "radiates to the right arm",
    "pain down the left arm",
    "pain down the right arm",
    "left arm discomfort",
  ],
  pain_radiates_to_left_arm: [
    "radiating to the left arm",
    "radiates to the left arm",
    "pain radiating to the left arm",
    "pain down the left arm",
    "spread to his left arm",
    "spread to her left arm",
    "spread to the left arm",
    "spread into his left arm",
    "spread into her left arm",
    "spread into the left arm",
    "went into his left arm",
    "went into her left arm",
    "went into the left arm",
    "travels to his left arm",
    "travels to her left arm",
    "travels to the left arm",
    "jaw and left arm",
  ],
  sweating: [
    "sweating",
    "sweaty",
    "diaphoretic",
    "clammy",
    "cold sweat",
  ],
  nausea: [
    "nausea",
    "nauseated",
    "feeling sick",
    "felt sick",
    "clammy and sick",
  ],
  indigestion_like_chest_pain: [
    "indigestion",
    "indigestion like chest pain",
    "indigestion-like chest pain",
    "indigestion like epigastric and chest heaviness",
    "indigestion-like epigastric and chest heaviness",
    "indigestion-like chest discomfort",
    "indigestion type chest discomfort",
    "indigestion type chest pain",
    "indigestion type pain in chest",
    "burning chest pain",
    "central chest burning",
    "thought it was indigestion",
    "epigastric chest pain",
    "epigastric pressure",
    "epigastric discomfort",
    "epigastric heaviness",
    "epigastric discomfort with chest discomfort",
    "upper abdominal pressure",
    "upper abdominal heaviness",
    "upper abdominal discomfort",
  ],
  acs_equivalent_pain: [
    "indigestion",
    "epigastric discomfort",
    "indigestion like epigastric and chest heaviness",
    "indigestion-like epigastric and chest heaviness",
    "upper abdominal pressure",
    "upper abdominal heaviness",
    "indigestion like chest discomfort",
    "indigestion-like chest discomfort",
  ],
  chest_heaviness: [
    "chest heaviness",
    "heavy chest",
    "heavy feeling in chest",
    "heavy pressure",
    "heavy tight pressure",
    "tight pressure",
    "pressure sensation in the centre of his chest",
    "pressure sensation in the centre of her chest",
    "pressure sensation in the centre of the chest",
    "pressure sensation in the center of his chest",
    "pressure sensation in the center of her chest",
    "pressure sensation in the center of the chest",
    "heavy feeling in the middle of his chest",
    "heavy feeling in the middle of her chest",
    "heavy feeling in the middle of the chest",
  ],
  exertional_pain: [
    "mowing the lawn",
    "mowing lawn",
    "carrying shopping upstairs",
    "carrying groceries upstairs",
    "walking upstairs",
    "walking uphill",
    "climbing stairs",
    "on exertion",
    "with exertion",
    "during exertion",
    "exertional",
  ],
  heartburn: [
    "heartburn",
    "retrosternal burning",
    "burning retrosternal chest discomfort",
    "burning retrosternal discomfort",
    "burning discomfort behind sternum",
    "burning behind sternum",
    "burning behind the sternum",
  ],
  burning_pain: [
    "burning pain",
    "burning discomfort",
    "burning upper abdominal pain",
  ],
  worse_after_meals: [
    "worse after meals",
    "worse after eating",
    "after meals",
    "after eating",
    "after a large spicy meal",
    "large spicy meal",
    "spicy meal",
    "post prandial",
    "post-prandial",
  ],
  worse_lying_flat: [
    "worse lying flat",
    "worse when lying flat",
    "worse on lying flat",
    "worse when lying down",
    "worse on lying down",
  ],
  better_sitting_forward: [
    "better sitting forward",
    "better when sitting forward",
    "improved by sitting forward",
    "improves by sitting forward",
    "relieved by sitting forward",
    "better leaning forward",
    "improved leaning forward",
  ],
  acid_regurgitation: [
    "acidic taste",
    "acid taste",
    "acid reflux",
    "acid in mouth",
    "acid in the mouth",
    "sour taste",
    "regurgitation",
    "regurgitating acid",
    "brash",
  ],
  antacid_relief: [
    "improves with antacids",
    "improved with antacids",
    "better with antacids",
    "relieved by antacids",
    "settled with antacids",
  ],
  abdominal_pain: [
    "abdominal pain",
    "abd pain",
    "epigastric pain",
    "ruq discomfort",
    "right upper quadrant discomfort",
    "ruq pain",
    "right upper quadrant pain",
    "pain in the right upper quadrant",
    "right sided upper abdominal pain",
    "right-sided upper abdominal pain",
    "right upper abdominal pain",
    "tummy pain",
    "stomach pain",
    "abdo pain",
    "abdomen pain",
    "central abdominal pain",
    "upper abdominal pain",
    "lower abdominal pain",
    "generalised abdominal pain",
    "generalized abdominal pain",
    "abdominal discomfort",
    "epigastric discomfort",
    "belly pain",
    "upper abdominal heaviness",
    "upper abdominal pressure",
    "abdominal back and left flank pain",
    "abdominal back and right flank pain",
  ],
  upper_abdominal_pain: [
    "upper abdominal pain",
    "upper abdominal discomfort",
    "upper abdomen pain",
  ],
  epigastric_pain: [
    "epigastric pain",
    "epigastric abdominal pain",
    "epigastric and chest heaviness",
    "epigastric and upper abdominal pain",
    "epigastric discomfort",
    "pain in the epigastrium",
    "epigastric tenderness",
  ],
  generalized_abdominal_pain: [
    "generalised abdominal pain",
    "generalized abdominal pain",
    "diffuse abdominal pain",
    "diffuse abdominal discomfort",
    "whole abdomen pain",
  ],
  rif_pain: [
    "rif pain",
    "rif discomfort",
    "right iliac fossa pain",
    "pain in the right iliac fossa",
    "sharp in the right iliac fossa",
    "sharp pain in the right iliac fossa",
    "pain in the rif",
    "right lower quadrant pain",
    "rlq pain",
    "right lower abdominal pain",
    "pain moved to the right iliac fossa",
    "moved to the right iliac fossa",
  ],
  rif_tenderness: [
    "rif tenderness",
    "focal rif tenderness",
    "right iliac fossa tenderness",
    "right lower quadrant tenderness",
    "tender over the rif",
    "focal tenderness in the right iliac fossa",
    "tender in the right iliac fossa",
  ],
  migration_to_rif: [
    "migrated to the right iliac fossa",
    "migrated to right iliac fossa",
    "migrated to the right lower quadrant",
    "migrated to right lower quadrant",
    "started central then moved to the right iliac fossa",
    "started centrally then moved to the right iliac fossa",
    "started around the umbilicus then moved to the right iliac fossa",
    "pain moved to the right iliac fossa",
    "moved to the right iliac fossa",
    "began centrally and is now sharp in the right iliac fossa",
  ],
  pain_migration_to_rif: [
    "migrated to the right iliac fossa",
    "migrated to right iliac fossa",
    "migrated to the right lower quadrant",
    "migrated to right lower quadrant",
    "started central then moved to the right iliac fossa",
    "started centrally then moved to the right iliac fossa",
    "started around the umbilicus then moved to the right iliac fossa",
    "pain moved to the right iliac fossa",
    "moved to the right iliac fossa",
    "began centrally and is now sharp in the right iliac fossa",
  ],
  pelvic_pain: [
    "pelvic pain",
    "adnexal pain",
    "suprapubic pain",
    "lower pelvic pain",
  ],
  suprapubic_pain: [
    "suprapubic pain",
    "pain over the bladder",
    "pain in the suprapubic area",
    "lower central abdominal pain",
  ],
  vaginal_bleeding: [
    "vaginal bleeding",
    "pv bleeding",
    "per vaginal bleeding",
    "bleeding per vaginam",
    "spotting in pregnancy",
  ],
  pregnancy_possible: [
    "pregnant",
    "pregnancy possible",
    "could be pregnant",
    "positive pregnancy test",
    "pregnancy test positive",
    "possible pregnancy",
  ],
  positive_pregnancy_test: [
    "positive pregnancy test",
    "pregnancy test positive",
    "positive urine pregnancy test",
  ],
  missed_period: [
    "missed period",
    "late period",
    "amenorrhoea",
    "amenorrhea",
  ],
  postpartum: [
    "postpartum",
    "post partum",
    "recent delivery",
    "recent childbirth",
  ],
  recent_miscarriage: [
    "recent miscarriage",
    "after miscarriage",
    "following miscarriage",
  ],
  ruq_pain: [
    "ruq pain",
    "ruq discomfort",
    "right upper quadrant pain",
    "right upper quadrant discomfort",
    "pain in the right upper quadrant",
    "right sided upper abdominal pain",
    "right-sided upper abdominal pain",
    "right upper abdominal pain",
    "pain under the right ribs",
    "right upper abdominal discomfort",
  ],
  ruq_tenderness: [
    "ruq tenderness",
    "right upper quadrant tenderness",
    "tender right upper quadrant",
  ],
  jaundice: [
    "jaundice",
    "jaundiced",
    "yellow skin",
    "yellow eyes",
    "yellowing of the skin",
    "yellowing of the eyes",
    "yellowing of the whites of the eyes",
  ],
  dark_urine: [
    "dark urine",
    "dark pee",
    "tea coloured urine",
    "tea-colored urine",
    "cola coloured urine",
    "cola-colored urine",
  ],
  pale_stools: [
    "pale stools",
    "pale stool",
    "paler poo",
    "pale poo",
    "pale poos",
    "pale faeces",
    "pale feces",
    "clay coloured stool",
    "clay-colored stool",
  ],
  pruritus: [
    "pruritus",
    "itching",
    "itchy skin",
    "itch",
  ],
  murphys_sign: [
    "murphy's sign",
    "murphys sign",
    "positive murphy's sign",
    "positive murphys sign",
    "inspiratory arrest on ruq palpation",
    "inspiratory arrest on right upper quadrant palpation",
  ],
  localized_ruq_tenderness: [
    "ruq tenderness",
    "right upper quadrant tenderness",
    "localised ruq tenderness",
    "localized ruq tenderness",
    "tender ruq",
    "tender right upper quadrant",
    "right costal margin tenderness",
    "tender under the right costal margin",
  ],
  persistent_ruq_pain: [
    "persistent ruq pain",
    "persistent right upper quadrant pain",
    "constant ruq pain",
    "constant right upper quadrant pain",
    "ongoing ruq pain",
    "ongoing right upper quadrant pain",
    "pain has not settled",
    "persistent upper right abdominal pain",
  ],
  constant_pain: [
    "constant pain",
    "constant abdominal pain",
    "become constant",
    "became constant",
    "becoming constant",
    "now become constant",
    "now became constant",
    "pain has become more constant",
    "cramps are becoming constant",
    "became more constant",
    "more constant",
    "pain has not settled",
    "ongoing constant pain",
  ],
  post_prandial_pain: [
    "post prandial pain",
    "post-prandial pain",
    "after fatty meals",
    "after a fatty meal",
    "after fatty food",
    "after fatty foods",
    "after eating fatty food",
    "after eating fatty foods",
    "after a heavy meal",
    "after heavy meal",
    "after meals",
    "post-prandial ruq pain",
    "fatty-food ruq pain",
  ],
  episodic_pain: [
    "episodic pain",
    "comes in episodes",
    "comes and goes",
    "intermittent pain",
  ],
  recurrent_attacks: [
    "recurrent attacks",
    "recurrent episodes",
    "similar attacks before",
    "recurrent pain episodes",
  ],
  recurrent_biliary_pain: [
    "episodic ruq pain",
    "episodic epigastric pain",
    "recurrent attacks",
    "recurrent episodes",
    "recurrent biliary colic",
    "previous biliary colic",
    "pain settling between episodes",
    "pain settles between episodes",
    "settles between attacks",
    "biliary colic history",
    "recurrent biliary pain",
  ],
  pain_settles_between_episodes: [
    "pain settling between episodes",
    "pain settles between episodes",
    "settles between episodes",
    "settles between attacks",
    "pain free between attacks",
    "pain free between episodes",
  ],
  unilateral_testicular_pain: [
    "testicular pain",
    "unilateral testicular pain",
    "left testicular pain",
    "right testicular pain",
    "acute scrotal pain",
    "one sided testicular pain",
    "one-sided testicular pain",
  ],
  testicular_pain: [
    "testicular pain",
    "left testicular pain",
    "right testicular pain",
    "acute scrotal pain",
  ],
  back_pain: [
    "back pain",
    "abdominal back and left flank pain",
    "abdominal back and right flank pain",
    "lower back pain",
    "severe back pain",
    "lumbar pain",
  ],
  severe_pain: [
    "severe pain",
    "very severe pain",
    "excruciating pain",
    "severe abdominal pain",
    "very severe abdominal pain",
    "severe flank pain",
    "severe left flank pain",
    "severe right flank pain",
  ],
  colicky_pain: [
    "colicky pain",
    "colicky abdominal pain",
    "crampy colicky pain",
    "crampy colicky abdominal pain",
    "crampy pain",
    "colic",
    "comes in waves",
    "came in waves",
    "initially came in waves",
    "wave like pain",
    "wave-like pain",
  ],
  urinary_retention: [
    "urinary retention",
    "unable to pass urine",
    "cannot pass urine",
    "can't pass urine",
    "difficulty passing urine",
  ],
  saddle_numbness: [
    "saddle numbness",
    "saddle anaesthesia",
    "saddle anesthesia",
    "numb around the groin",
    "numbness around the groin",
  ],
  bilateral_leg_symptoms: [
    "bilateral leg weakness",
    "both legs weak",
    "bilateral leg pain",
    "bilateral sciatica",
    "both legs numb",
    "bilateral leg numbness",
  ],
  well_between_episodes: [
    "well between episodes",
    "well between attacks",
    "pain free between episodes",
    "pain-free between episodes",
    "pain free between attacks",
    "pain-free between attacks",
    "completely well between episodes",
    "completely well between attacks",
    "settle between episodes",
    "settling between episodes",
    "settles between episodes",
  ],
  obstructive_jaundice_language: [
    "obstructive jaundice",
    "cholestatic picture",
    "cholestatic lfts",
    "cholestatic liver tests",
    "dilated bile duct",
    "dilated cbd",
    "common bile duct stone",
    "cbd stone",
  ],
  diarrhoea: [
    "diarrhoea",
    "diarrhea",
    "loose stools",
    "loose stool",
    "watery stools",
    "watery stool",
    "watery diarrhoea",
    "watery diarrhea",
    "frequent loose stools",
    "bloody diarrhoea",
    "bloody diarrhea",
  ],
  constipation: [
    "constipation",
    "constipated",
    "no bowel movement",
    "not opened bowels",
    "hard stools",
  ],
  bowel_habit_change: [
    "change in bowel habit",
    "bowel habit change",
    "bowels changed",
  ],
  obstipation: [
    "obstipation",
    "not opened bowels or passed flatus",
    "no bowel motion and no flatus",
    "constipation and has not passed wind",
    "not opened his bowels",
    "not opened her bowels",
    "not opened their bowels",
    "not passed wind",
    "has not opened bowels",
    "has not opened his bowels",
    "has not opened her bowels",
    "has not opened their bowels",
    "has not passed wind",
    "hasn t passed stool",
    "hasn't passed stool",
    "has not passed stool",
    "not passed stool",
    "passed stool or flatus",
    "stool or flatus",
  ],
  unable_to_pass_flatus: [
    "unable to pass flatus",
    "not passing flatus",
    "not passed wind",
    "has not passed wind",
    "not opened bowels or passed wind",
    "not opened his bowels or passed wind",
    "not opened her bowels or passed wind",
    "not opened their bowels or passed wind",
    "no flatus",
    "has not passed flatus",
    "hasn t passed flatus",
    "hasn't passed flatus",
    "not passed flatus",
    "passed stool or flatus",
    "stool or flatus",
    "cannot pass wind",
    "can't pass wind",
  ],
  anorexia: [
    "anorexia",
    "loss of appetite",
    "poor appetite",
    "off food",
  ],
  pr_bleeding: [
    "pr bleeding",
    "blood per rectum",
    "bright red blood per rectum",
    "rectal bleeding",
    "fresh blood per rectum",
    "fresh pr bleeding",
    "passing blood",
    "blood in stool",
    "blood in stools",
    "bloody stool",
    "bloody stools",
  ],
  melaena: [
    "melaena",
    "melena",
    "black stools",
    "black stool",
    "black tarry stools",
    "tarry stool",
    "tarry stools",
    "dark stool",
    "dark stools",
  ],
  haematemesis: [
    "haematemesis",
    "hematemesis",
    "coffee ground vomit",
    "coffee-ground vomit",
    "coffee ground vomitus",
    "coffee-ground vomitus",
    "coffee ground emesis",
    "coffee-ground emesis",
    "vomiting blood",
    "vomited blood",
    "blood in vomit",
    "blood stained vomit",
    "blood-stained vomit",
  ],
  haemoptysis: [
    "haemoptysis",
    "hemoptysis",
    "coughing blood",
    "coughing up blood",
    "coughed up blood",
    "blood in sputum",
    "blood streaked sputum",
    "blood-streaked sputum",
    "blood stained sputum",
    "blood-stained sputum",
  ],
  rigors: [
    "rigors",
    "rigor",
    "shivering",
    "shaking chills",
    "fever with chills",
  ],
  infection_source: [
    "cough",
    "productive cough",
    "sputum",
    "green sputum",
    "yellow sputum",
    "purulent sputum",
    "dysuria",
    "urinary frequency",
    "cloudy urine",
    "cellulitis",
    "infected wound",
    "line infection",
  ],
  alcohol_excess: [
    "alcohol excess",
    "heavy alcohol use",
    "heavy alcohol intake",
    "heavy drinker",
    "drinks heavily",
    "excess alcohol",
    "alcohol dependence",
  ],
  gallstone_context: [
    "gallstones",
    "known gallstones",
    "gallstone pancreatitis",
    "biliary colic",
    "gallstone history",
  ],
  binge_drinking: [
    "binge drinking",
    "binge drank",
    "drank heavily last night",
    "alcohol binge",
  ],
  peptic_ulcer_disease: [
    "peptic ulcer disease",
    "peptic ulcer",
    "gastric ulcer",
    "duodenal ulcer",
    "pud",
  ],
  nsaid_use: [
    "nsaid use",
    "taking nsaids",
    "regular ibuprofen",
    "ibuprofen use",
    "naproxen use",
    "diclofenac use",
  ],
  severe_constant_upper_abdominal_pain: [
    "severe constant upper abdominal pain",
    "severe constant epigastric pain",
    "constant epigastric pain",
    "constant upper abdominal pain",
    "severe epigastric pain",
    "severe upper abdominal pain",
  ],
  guarding_rigidity: [
    "rigidity",
    "rigid abdomen",
    "board like abdomen",
    "board-like abdomen",
    "peritonism",
    "peritonitic",
  ],
  guarding: [
    "guarding",
    "focal guarding",
    "guarded",
    "guarded abdomen",
    "abdomen is guarded",
    "abdominal guarding",
    "voluntary guarding",
  ],
  mild_tenderness: [
    "mildly tender",
    "only mild tenderness",
    "mild tenderness",
    "mild abdominal tenderness",
    "minimal tenderness",
  ],
  abdominal_movement_pain: [
    "pain worse on movement",
    "pain worse with movement",
    "pain worse on coughing",
    "pain worse with coughing",
    "movement makes it worse",
    "worse on movement and coughing",
    "worse with movement and coughing",
    "worse on movement or coughing",
    "worse on coughing",
    "worse with coughing",
    "coughing worsens the pain",
    "worse when he coughs or moves",
    "worse when she coughs or moves",
    "worse when they cough or move",
  ],
  pain_worse_on_movement: [
    "pain worse on movement",
    "pain worse with movement",
    "worse on movement",
    "worse with movement",
    "worsens with movement",
    "movement makes it worse",
    "worse over bumps",
    "worse on bumps",
    "worse in the car over bumps",
    "pain on bumps in the road",
    "pain worse over bumps in the road",
    "worse with bumps in the road",
    "pain worse with jolts",
    "worse when he coughs or moves",
    "worse when she coughs or moves",
    "worse when they cough or move",
  ],
  pain_worse_with_cough: [
    "pain worse on coughing",
    "pain worse with coughing",
    "worse on coughing",
    "worse with coughing",
    "pain worse with cough",
    "pain worse on cough",
    "coughing worsens the pain",
    "worse when he coughs or moves",
    "worse when she coughs or moves",
    "worse when they cough or move",
  ],
  lying_still: [
    "lying still",
    "lies still",
    "lies very still",
    "lies completely still",
    "keeping still because of pain",
    "does not want to move",
  ],
  restless: [
    "restless",
    "unable to keep still",
    "can't keep still",
    "cannot keep still",
    "cannot get comfortable",
    "can't get comfortable",
    "unable to get comfortable",
    "writhing in pain",
    "pacing because of pain",
    "keeps moving around trying to get comfortable",
    "moving around trying to get comfortable",
    "trying to get comfortable",
  ],
  localized_tenderness: [
    "localized tenderness",
    "localised tenderness",
    "focal tenderness",
  ],
  distension: [
    "distension",
    "abdominal distension",
    "distended abdomen",
    "visibly swollen",
    "abdomen is visibly swollen",
    "swollen abdomen",
    "abdominal swelling",
    "bloated abdomen",
    "blown up like a drum",
    "abdomen is blown up",
    "bloated",
  ],
  hernia_present: [
    "hernia",
    "inguinal hernia",
    "femoral hernia",
    "umbilical hernia",
  ],
  known_hernia: [
    "known hernia",
    "history of hernia",
    "inguinal hernia",
    "femoral hernia",
    "umbilical hernia",
  ],
  incarcerated_hernia: [
    "incarcerated hernia",
    "strangulated hernia",
    "irreducible hernia",
    "tender irreducible hernia",
  ],
  perforation_language: [
    "perforation",
    "perforated viscus",
    "gi perforation",
    "bowel perforation",
    "perforated ulcer",
    "free air",
    "free air under diaphragm",
  ],
  recent_surgery: [
    "recent surgery",
    "recent knee surgery",
    "recent operation",
    "recent knee operation",
    "post op",
    "post-op",
    "post operative",
    "post-operative",
    "after surgery",
    "following surgery",
  ],
  previous_abdominal_surgery: [
    "previous abdominal surgery",
    "prior abdominal surgery",
    "history of abdominal surgery",
    "laparotomy",
    "previous laparotomy",
    "previous hysterectomy",
    "prior hysterectomy",
    "previous c section",
    "previous c-section",
    "prior c section",
    "prior c-section",
    "caesarean section",
    "cesarean section",
    "appendicectomy",
    "appendectomy",
    "bowel surgery",
    "previous bowel surgery",
    "prior bowel surgery",
  ],
  immobility: [
    "prolonged immobility",
    "immobile",
    "reduced mobility",
    "reduced mobility after injury",
    "reduced mobility after fall",
    "immobility after injury",
    "immobility after a fall",
    "bedbound",
    "bed bound",
  ],
  long_haul_travel: [
    "long haul flight",
    "long-haul flight",
    "long haul travel",
    "prolonged travel",
    "prolonged flight",
    "long flight",
    "recent flight",
    "flew home",
    "flight from abroad",
    "travel from abroad",
  ],
  unilateral_reduced_air_entry: [
    "unilateral reduced air entry",
    "reduced air entry on one side",
    "reduced air entry on the left",
    "reduced air entry on the right",
    "decreased air entry on the left",
    "decreased air entry on the right",
    "decreased air entry left",
    "decreased air entry right",
    "reduced air entry left",
    "reduced air entry right",
    "unilateral decreased breath sounds",
    "unilateral reduced breath sounds",
    "absent breath sounds on one side",
    "absent breath sounds on the left",
    "absent breath sounds on the right",
    "reduced breath sounds on one side",
    "reduced breath sounds on the left",
    "reduced breath sounds on the right",
    "decreased breath sounds on one side",
    "decreased breath sounds on the left",
    "decreased breath sounds on the right",
    "one sided decreased breath sounds",
    "one-sided decreased breath sounds",
    "absent breath sounds",
    "unilateral absent breath sounds",
    "hyperresonant hemithorax",
    "left chest is very quiet",
    "right chest is very quiet",
    "quiet left chest",
    "quiet right chest",
    "quiet hemithorax",
  ],
  tall_thin_habitus: [
    "tall thin male",
    "tall slim male",
    "tall and thin",
    "tall and slim",
    "tall thin",
  ],
  recent_chest_drain: [
    "recent chest drain",
    "had a chest drain recently",
    "post chest drain",
    "after chest drain",
  ],
  previous_pneumothorax: [
    "previous pneumothorax",
    "history of pneumothorax",
    "prior pneumothorax",
    "recurrent pneumothorax",
  ],
  trauma: [
    "chest trauma",
    "rib fracture",
    "after trauma",
    "following trauma",
    "post trauma",
    "spontaneous pneumothorax",
  ],
  pain_out_of_proportion: [
    "pain out of proportion",
    "pain seems out of proportion",
    "severe unexplained abdominal pain",
    "pain far worse than expected",
    "pain is far worse than expected",
    "pain much worse than exam",
    "pain is much worse than exam",
    "severe pain with minimal tenderness",
    "pain disproportionate to findings",
    "pain disproportionate to the findings",
    "severe pain with minimal abdominal findings",
  ],
  pain_severe_but_exam_mild: [
    "severe pain but mild tenderness",
    "severe pain with minimal tenderness",
    "pain much worse than exam",
    "pain is much worse than exam",
    "pain far worse than expected",
    "pain is far worse than expected",
    "pain disproportionate to findings",
    "pain disproportionate to the findings",
    "severe pain with minimal abdominal findings",
    "severe abdominal pain with mild tenderness",
    "soft abdomen despite severe pain",
    "only mildly tender despite severe pain",
    "abdomen is only mildly tender",
    "abdomen only mildly tender",
    "only mildly tender",
    "mildly tender abdomen",
    "minimal abdominal findings",
  ],
  vascular_disease: [
    "vascular disease",
    "peripheral vascular disease",
    "pvd",
    "peripheral arterial disease",
    "pad",
    "known vascular disease",
  ],
  af: [
    "af",
    "atrial fibrillation",
  ],
  thunderclap: [
    "thunderclap headache",
    "thunderclap",
    "worst headache of my life",
    "worst headache of his life",
    "worst headache of her life",
    "worst headache ever",
    "worst ever headache",
    "sudden severe headache",
    "headache came on instantly",
    "instant severe headache",
    "explosive headache",
    "reached maximal intensity immediately",
    "maximal at onset",
    "came on like a thunderclap",
  ],
  headache: [
    "headache",
    "headaches",
    "head pain",
  ],
  visual_aura: [
    "visual aura",
    "aura before headache",
    "flashing lights",
    "zig zags",
    "zig-zags",
    "scintillating scotoma",
  ],
  gradual_spread_positive_symptoms: [
    "gradual spread of symptoms",
    "symptoms spread gradually",
    "marching tingling",
    "tingling spreading up the arm",
    "gradually spreading numbness",
    "positive symptoms spread",
  ],
  throbbing_headache: [
    "throbbing headache",
    "throbbing headaches",
    "unilateral throbbing headaches",
    "pounding headache",
    "pulsating headache",
  ],
  unilateral_headache: [
    "unilateral headache",
    "unilateral throbbing",
    "unilateral throbbing headache",
    "unilateral throbbing headaches",
    "one sided headache",
    "one-sided headache",
    "left sided headache",
    "right sided headache",
  ],
  recurrent_headache: [
    "recurrent headaches",
    "recurrent headache",
    "recurrent unilateral throbbing headaches",
    "similar episodes before",
    "same headaches before",
    "recurrent migraines",
    "has had this before",
  ],
  transient_focal_deficit: [
    "transient focal deficit",
    "transient weakness",
    "transient numbness",
    "speech disturbance resolved",
    "slurred speech resolved",
    "symptoms resolved",
    "episode of weakness that resolved",
    "transient visual loss",
  ],
  well_intervals: [
    "well intervals",
    "well between episodes",
    "well between attacks",
    "well between headaches",
    "between episodes is well",
    "between attacks is well",
    "between headaches is well",
    "completely well between episodes",
    "completely well between attacks",
    "completely well between headaches",
  ],
  gradual_onset: [
    "gradual",
    "gradual onset",
    "came on gradually",
    "started gradually",
    "gradually worsening",
  ],
  bilateral_headache: [
    "bilateral",
    "bilateral headache",
    "bilateral band like headache",
    "bilateral band-like headache",
    "both sides of the head",
    "whole head headache",
  ],
  band_like_headache: [
    "band like",
    "band-like",
    "tight band",
    "tight band around head",
    "pressure band",
  ],
  stress_trigger: [
    "stress",
    "stressed",
    "stress related",
    "stress-related",
  ],
  poor_sleep: [
    "poor sleep",
    "sleep deprived",
    "not sleeping well",
    "sleep deprivation",
  ],
  vomiting: [
    "vomiting",
    "vomited",
    "vomit",
    "being sick",
  ],
  bilious_vomiting: [
    "green vomiting",
    "bilious vomiting",
    "green vomit",
    "bilious vomit",
  ],
  neck_stiffness: [
    "neck stiffness",
    "meningism",
    "stiff neck",
  ],
  photophobia: [
    "photophobia",
    "light sensitivity",
    "sensitive to light",
    "hurts to look at light",
    "light hurts eyes",
    "light hurts the eyes",
  ],
  shared_accommodation: [
    "shared accommodation",
    "student halls",
    "university halls",
    "lives in halls",
    "dormitory",
    "shared housing",
  ],
  recent_infection: [
    "recent infection",
    "recent viral illness",
    "recent cold",
    "recent viral cold",
    "recent sore throat",
    "recent flu like illness",
    "recent flu-like illness",
    "recent uri",
    "recent urti",
    "upper respiratory tract infection",
    "viral trigger",
    "after a viral illness",
    "after a cold",
  ],
  ibd_context: [
    "ulcerative colitis",
    "inflammatory bowel disease",
    "ibd",
  ],
  fatigue: [
    "fatigue",
    "tiredness",
    "tired all the time",
    "very tired",
  ],
  dry_eyes_mouth: [
    "dry eyes",
    "dry mouth",
    "dry eyes and mouth",
    "sicca symptoms",
    "sicca",
  ],
  chronic_course: [
    "months of",
    "for months",
    "over months",
    "chronic",
    "longstanding",
    "gradual over months",
    "slowly progressive",
  ],
  confusion: [
    "confusion",
    "confused",
    "delirium",
    "acutely confused",
    "new confusion",
    "drowsy",
    "difficult to rouse",
    "hard to rouse",
    "fluctuating confusion",
    "fluctuating delirium",
  ],
  fluctuation: [
    "fluctuating confusion",
    "fluctuating delirium",
    "fluctuating course",
    "waxing and waning",
  ],
  focal_neurology: [
    "focal neurology",
    "focal neurological deficit",
    "focal deficit",
    "weakness",
    "unilateral weakness",
    "one sided weakness",
    "one sided numbness",
    "left sided weakness",
    "right sided weakness",
    "left arm weakness",
    "right arm weakness",
    "left leg weakness",
    "right leg weakness",
    "facial droop",
    "face droop",
    "slurred speech",
    "dysarthria",
    "aphasia",
    "hemiparesis",
    "hemianopia",
    "visual field loss",
    "arm weakness",
    "leg weakness",
  ],
  urinary_symptoms: [
    "dysuria",
    "urinary frequency",
    "frequency of urination",
    "burning urine",
    "burning when passing urine",
    "uti symptoms",
    "foul-smelling urine",
    "cloudy urine",
  ],
  dysuria: [
    "dysuria",
    "burning urine",
    "burning when passing urine",
  ],
  frequency: [
    "urinary frequency",
    "frequency of urination",
    "passing urine frequently",
  ],
  haematuria: [
    "haematuria",
    "hematuria",
    "blood in urine",
    "bloody urine",
  ],
  dizziness: [
    "dizziness",
    "dizzy",
    "lightheaded",
    "light-headed",
    "felt faint",
    "feels faint",
    "nearly fainted",
  ],
  pallor: [
    "pallor",
    "looked pale",
    "appeared pale",
  ],
  cva_tenderness: [
    "cva tenderness",
    "costovertebral angle tenderness",
    "renal angle tenderness",
  ],
  flank_pain: [
    "flank pain",
    "left flank pain",
    "right flank pain",
    "abdominal back and left flank pain",
    "abdominal back and right flank pain",
    "loin pain",
    "cva tenderness",
    "costovertebral angle tenderness",
  ],
  loin_to_groin_pain: [
    "loin to groin pain",
    "pain radiating to groin",
    "radiates to the groin",
    "radiating toward the groin",
    "radiates toward the groin",
    "radiating towards the groin",
    "radiates towards the groin",
    "pain from loin to groin",
  ],
  sob: [
    "shortness of breath",
    "sob",
    "dyspnoea",
    "dyspnea",
    "breathless",
    "breathlessness",
    "can t catch breath",
    "can't catch breath",
  ],
  orthopnoea: [
    "orthopnoea",
    "orthopnea",
    "short of breath lying flat",
    "breathless lying flat",
    "cannot lie flat",
    "can't lie flat",
    "cant lie flat",
    "unable to lie flat",
    "needs extra pillows",
    "sleeping propped up",
  ],
  paroxysmal_nocturnal_dyspnoea: [
    "paroxysmal nocturnal dyspnoea",
    "paroxysmal nocturnal dyspnea",
    "pnd",
    "wakes gasping at night",
    "wakes at night gasping",
    "waking at night gasping",
    "wakes up gasping",
    "wakes breathless at night",
    "night-time breathlessness",
    "nighttime breathlessness",
  ],
  ankle_swelling: [
    "ankle swelling",
    "swollen ankles",
    "ankles swollen",
    "ankles are swollen",
    "bilateral ankle swelling",
    "bilateral ankle oedema",
    "bilateral ankle edema",
    "leg swelling",
    "bilateral leg swelling",
    "peripheral oedema",
    "peripheral edema",
    "pitting oedema",
    "pitting edema",
  ],
  leg_swelling: [
    "leg swelling",
    "swollen legs",
    "legs are swollen",
    "legs swollen",
  ],
  unilateral_leg_swelling: [
    "unilateral leg swelling",
    "one leg swollen",
    "one swollen leg",
    "single swollen leg",
    "left leg swollen",
    "right leg swollen",
    "left calf swollen",
    "left calf is swollen",
    "right calf swollen",
    "right calf is swollen",
    "unilateral calf swelling",
  ],
  calf_swelling: [
    "calf swelling",
    "calf swollen",
    "calf is swollen",
    "swollen calf",
    "left calf swelling",
    "right calf swelling",
    "left calf swollen",
    "left calf is swollen",
    "right calf swollen",
    "right calf is swollen",
  ],
  dvt_signs: [
    "dvt signs",
    "clinical signs of dvt",
    "calf tenderness",
    "tender calf",
    "unilateral calf tenderness",
    "painful swollen calf",
    "swollen tender calf",
    "calf is swollen and tender",
    "calf swollen and tender",
  ],
  raised_jvp: [
    "raised jvp",
    "elevated jvp",
    "raised jugular venous pressure",
    "elevated jugular venous pressure",
  ],
  peripheral_oedema: [
    "peripheral oedema",
    "peripheral edema",
    "leg oedema",
    "leg edema",
    "ankle oedema",
    "ankle edema",
    "pitting oedema",
    "pitting edema",
  ],
  frothy_sputum: [
    "frothy sputum",
    "pink frothy sputum",
    "pink frothy phlegm",
  ],
  diabetic_context: [
    "diabetic",
    "diabetes",
    "type 1 diabetes",
    "type 2 diabetes",
    "on insulin",
    "insulin dependent",
  ],
  type_1_diabetes: [
    "type 1 diabetes",
    "type one diabetes",
    "t1dm",
  ],
  dehydration: [
    "dehydration",
    "dehydrated",
    "clinically dehydrated",
    "dry mucous membranes",
  ],
  polyuria: [
    "polyuria",
    "passing lots of urine",
    "peeing a lot",
    "peeing constantly",
    "passing urine frequently",
    "passing urine a lot",
  ],
  polydipsia: [
    "polydipsia",
    "marked thirst",
    "very thirsty",
    "excessive thirst",
    "thirsty for days",
    "cannot stop drinking",
    "can't stop drinking",
    "drinking loads",
    "drinking lots",
  ],
  ketosis_breath: [
    "ketotic breath",
    "ketosis breath",
    "fruity breath",
    "breath smells fruity",
    "breath smelled fruity",
    "smells fruity",
    "smelled fruity",
    "fruity smelling breath",
    "fruity smell",
    "acetone breath",
    "pear drop breath",
    "pear drops",
    "breath smells of pear drops",
  ],
  kussmaul_breathing: [
    "kussmaul breathing",
    "kussmaul respirations",
    "deep rapid breathing",
    "deep and rapid breathing",
    "deep fast breathing",
    "deep and fast breathing",
    "breathing very deep and fast",
    "breathing deep and fast",
    "laboured deep breathing",
    "labored deep breathing",
    "breathing very deeply and quickly",
    "breathing deeply and quickly",
    "acidotic breathing",
  ],
  hyperglycaemia: [
    "hyperglycaemia",
    "hyperglycemia",
    "high blood glucose",
    "high blood sugar",
    "glucose high",
    "blood sugar high",
  ],
  hypoglycaemia_cue: [
    "hypoglycaemia",
    "hypoglycemia",
    "hypo",
    "sweaty and shaky",
    "shaky and sweaty",
    "blood sugar low",
    "low blood sugar",
  ],
  panic_features: [
    "panic attack",
    "anxiety attack",
    "very anxious",
    "hyperventilation",
    "hyperventilating",
    "tingling fingers",
    "sense of doom",
    "tingling in both hands",
    "tingling around the mouth",
  ],
  tingling: [
    "tingling",
    "tingling fingers",
    "tingling in fingers",
    "tingling in both hands",
    "pins and needles",
  ],
  perioral_paraesthesia: [
    "perioral paraesthesia",
    "perioral paresthesia",
    "tingling around the mouth",
    "tingling around mouth",
    "tingling lips",
  ],
  normal_exam: [
    "normal exam",
    "normal examination",
    "normal chest exam",
    "normal chest examination",
    "clear chest",
    "chest clear",
    "chest is clear",
    "normal sats",
    "normal oxygen saturations",
  ],
  normal_oxygen_saturations: [
    "normal sats",
    "normal oxygen saturations",
    "normal oxygenation",
  ],
  heavy_menstrual_bleeding: [
    "heavy menstrual bleeding",
    "heavy periods",
    "very heavy periods",
    "menorrhagia",
  ],
  hypoxia: [
    "hypoxia",
    "hypoxic",
    "low sats",
    "low oxygen saturations",
    "low oxygen saturation",
    "oxygen saturation",
    "reduced oxygen saturation",
    "desaturated",
    "desaturating",
    "desaturation",
    "sats 88",
    "sats 89",
    "spo2 88",
    "spo2 89",
    "o2 sat 88",
    "o2 sat 89",
  ],
  pleuritic_pain: [
    "pleuritic pain",
    "pleuritic chest pain",
    "pleuritic",
    "worse on breathing",
    "pain on breathing",
    "worse on inspiration",
    "worse with inspiration",
    "worse on deep inspiration",
    "worse on deep breath",
    "pain with breathing",
    "pain with deep inspiration",
    "sharp chest pain on breathing",
  ],
  fever: [
    "fever",
    "pyrexia",
    "febrile",
  ],
  hypothermia: [
    "hypothermia",
    "hypothermic",
  ],
  hypotension: [
    "hypotension",
    "shock",
    "hypotensive",
    "low blood pressure",
    "blood pressure 90",
    "bp 80",
    "bp 90",
    "bp 70",
    "systolic 90",
    "systolic 80",
    "systolic 70",
  ],
  shock: [
    "shock",
    "in shock",
    "shocked",
  ],
  tachycardia: [
    "tachycardia",
    "tachycardic",
    "high heart rate",
    "heart rate 120",
    "heart rate 130",
    "hr 120",
    "hr 130",
    "pulse 120",
    "pulse 130",
  ],
  tachypnoea: [
    "tachypnoea",
    "tachypnea",
    "tachypnoeic",
    "tachypneic",
    "high respiratory rate",
    "respiratory rate 30",
    "respiratory rate 32",
    "rr 30",
    "rr 32",
  ],
  gi_bleed: [
    "pr bleeding",
    "blood per rectum",
    "bright red blood per rectum",
    "rectal bleeding",
    "melaena",
    "melena",
    "haematemesis",
    "hematemesis",
    "coffee ground vomit",
    "coffee-ground vomit",
    "coffee ground vomitus",
    "coffee-ground vomitus",
    "coffee ground emesis",
    "coffee-ground emesis",
    "black stools",
    "black stool",
    "tarry stool",
    "tarry stools",
    "dark stool",
    "dark stools",
    "blood in vomit",
    "vomiting blood",
    "vomited blood",
    "fresh pr bleeding",
    "passing blood",
    "bloody stool",
    "bloody stools",
    "bloody diarrhoea",
    "bloody diarrhea",
  ],
  productive_cough: [
    "productive cough",
    "bringing up sputum",
    "bringing up phlegm",
    "cough with sputum",
    "cough productive of sputum",
  ],
  cough: [
    "cough",
    "coughing",
  ],
  progressive_course: [
    "worsening over days",
    "getting worse over days",
    "progressive over days",
    "progressively worse",
    "gradually worsening over days",
    "over several days",
    "few day history",
    "worsening baseline breathlessness over days",
  ],
  wheeze: [
    "wheeze",
    "wheezy",
    "wheezing",
    "audible wheeze",
  ],
  known_asthma: [
    "asthma",
    "known asthma",
    "history of asthma",
    "asthmatic",
    "usually uses salbutamol",
  ],
  asthma_history: [
    "asthma",
    "known asthma",
    "history of asthma",
    "asthma history",
    "asthmatic",
  ],
  known_copd: [
    "known copd",
    "history of copd",
    "copd patient",
    "emphysema",
    "chronic obstructive pulmonary disease",
  ],
  copd_history: [
    "known copd",
    "history of copd",
    "copd history",
    "copd patient",
    "emphysema",
    "chronic obstructive pulmonary disease",
  ],
  increased_inhaler_use: [
    "increased inhaler use",
    "using inhaler more",
    "using inhaler more often",
    "needing inhaler more",
    "using salbutamol more",
    "using blue inhaler more",
    "using reliever more",
  ],
  inhaler_use: [
    "inhaler",
    "inhalers",
    "salbutamol",
    "blue inhaler",
    "reliever inhaler",
  ],
  difficulty_speaking: [
    "difficulty speaking full sentences",
    "cannot speak full sentences",
    "can't speak full sentences",
    "too breathless to speak full sentences",
    "speaking in words only",
    "too breathless to talk",
    "struggling to finish sentences",
    "unable to complete sentences",
  ],
  unable_to_speak_full_sentences: [
    "difficulty speaking full sentences",
    "cannot speak full sentences",
    "can't speak full sentences",
    "can t speak full sentences",
    "unable to speak in full sentences",
    "unable to speak full sentences",
    "too breathless to speak full sentences",
    "speaking in words only",
    "speaking single words",
    "too breathless to talk",
    "struggling to finish sentences",
    "unable to complete sentences",
  ],
  respiratory_distress: [
    "respiratory distress",
    "in respiratory distress",
    "increased work of breathing",
    "working hard to breathe",
    "struggling to breathe",
    "laboured breathing",
    "labored breathing",
  ],
  severe_respiratory_distress: [
    "severe respiratory distress",
    "exhausted from breathing",
    "respiratory exhaustion",
    "tiring with breathing",
    "cyanosed",
    "cyanotic",
  ],
  accessory_muscle_use: [
    "accessory muscle use",
    "using accessory muscles",
    "intercostal recession",
    "subcostal recession",
    "tracheal tug",
  ],
  reduced_air_entry: [
    "reduced air entry",
    "reduced breath sounds",
    "decreased air entry",
    "decreased breath sounds",
  ],
  hyperresonance: [
    "hyperresonance",
    "hyperresonant",
    "hyper resonant",
    "hyper-resonant",
  ],
  tracheal_deviation: [
    "tracheal deviation",
    "trachea shifted",
    "trachea seems slightly shifted",
    "shifted trachea",
  ],
  crackles: [
    "crackles",
    "crepitations",
    "creps",
    "focal crackles",
  ],
  bibasal_crackles: [
    "bibasal crackles",
    "bi basal crackles",
    "bilateral basal crackles",
    "basal crackles bilaterally",
    "crackles at both bases",
    "crepitations at both bases",
  ],
  dvt_history: [
    "dvt history",
    "history of dvt",
    "previous dvt",
    "previous deep vein thrombosis",
    "deep vein thrombosis",
  ],
  oestrogen_use: [
    "oestrogen use",
    "estrogen use",
    "combined pill",
    "combined oral contraceptive",
    "oral contraceptive pill",
    "on the pill",
    "hrt",
    "hormone replacement therapy",
  ],
  poor_peak_flow: [
    "poor peak flow",
    "low peak flow",
    "peak flow low",
    "peak flow 40",
    "peak flow 50",
    "pefr 40",
    "pefr 50",
  ],
  silent_chest: [
    "silent chest",
    "near silent chest",
    "no wheeze despite severe asthma",
    "very poor air movement",
  ],
  sputum_change: [
    "sputum volume increase",
    "more sputum",
    "increased sputum",
    "sputum colour change",
    "change in sputum colour",
    "green sputum",
    "yellow sputum",
  ],
  reproducible_chest_wall_tenderness: [
    "reproducible tenderness",
    "reproducible chest wall tenderness",
    "reproducible on palpation",
    "pain on palpation",
    "tender on palpation",
    "chest wall tenderness",
    "pain reproducible on palpation",
  ],
  movement_related_chest_pain: [
    "worse on movement",
    "worse with movement",
    "pain on movement",
    "movement related chest pain",
    "worse with twisting",
    "worse when twisting",
    "worse moving the arm",
    "worse when moving the arm",
  ],
  post_lifting_onset: [
    "after heavy lifting",
    "after lifting",
    "post lifting",
    "following heavy lifting",
  ],
  scalp_tenderness: [
    "scalp tenderness",
    "tender scalp",
    "painful scalp",
  ],
  jaw_claudication: [
    "jaw claudication",
    "pain when chewing",
    "jaw pain when chewing",
    "jaw ache when chewing",
  ],
  temporal_headache: [
    "temporal headache",
    "temple headache",
    "pain over temple",
    "pain over the temple",
  ],
  transient_visual_symptoms: [
    "transient visual loss",
    "transient visual symptoms",
    "blurred vision",
    "temporary blurred vision",
    "amaurosis fugax",
    "visual blurring",
  ],
  pmr_like_symptoms: [
    "shoulder aching",
    "proximal shoulder aching",
    "pmr",
    "polymyalgia rheumatica",
    "aching shoulders",
  ],
};

const NEGATION_PREFIXES = [
  "no",
  "not",
  "denies",
  "denied",
  "without",
  "nil",
];

const BACKGROUND_CONTEXT_FEATURES = new Set([
  "diabetic_context",
  "hypertension",
  "asthma_history",
  "known_asthma",
  "copd_history",
  "known_copd",
  "smoking_history",
  "smoker",
  "dehydration",
]);

const FEATURE_NEGATION_PHRASES: Record<string, string[]> = {
  fever: ["no fever", "not feverish", "without fever"],
  vomiting: ["no vomiting", "not vomiting", "without vomiting"],
  diarrhoea: ["no diarrhoea", "no diarrhea", "without diarrhoea", "without diarrhea"],
  nausea: ["no nausea", "without nausea", "denies nausea"],
  sweating: ["no sweating", "without sweating", "denies sweating"],
  chest_pain: ["no chest pain", "denies chest pain", "without chest pain"],
  cough: ["no cough", "denies cough", "without cough"],
  productive_cough: ["no productive cough", "denies productive cough", "without productive cough"],
  wheeze: ["no wheeze", "no wheezing", "denies wheeze", "without wheeze"],
  diabetic_context: ["no diabetes", "not diabetic", "without diabetes"],
  hypertension: ["no hypertension", "no high blood pressure", "without hypertension"],
  asthma_history: ["no asthma", "without asthma"],
  known_asthma: ["no asthma", "without asthma"],
  known_copd: ["no copd", "without copd"],
  copd_history: ["no copd", "without copd"],
  dehydration: ["no dehydration", "not dehydrated", "without dehydration"],
  sob: [
    "no shortness of breath",
    "no sob",
    "not short of breath",
    "without shortness of breath",
    "denies shortness of breath",
    "no breathlessness",
    "denies breathlessness",
  ],
  pleuritic_pain: ["no pleuritic pain", "denies pleuritic pain", "without pleuritic pain"],
  focal_neurology: [
    "no focal neurology",
    "no focal neurological deficit",
    "denies focal neurology",
    "without focal neurology",
  ],
  headache: ["denies headache", "no headache", "without headache"],
};

const HIGH_RESPIRATORY_RATE_THRESHOLD = 22;
const HIGH_HEART_RATE_THRESHOLD = 100;
const LOW_SYSTOLIC_BP_THRESHOLD = 92;
const LOW_SATS_THRESHOLD = 92;
const NORMAL_SATS_THRESHOLD = 95;
const HIGH_TEMPERATURE_THRESHOLD = 38;
const LOW_TEMPERATURE_THRESHOLD = 36;
const FEATURE_PHRASE_CACHE_TTL_MS = 30_000;
const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const COORDINATED_PAIN_LOCATION_MAP = [
  { pattern: /\bright\s+iliac\s+fossa\b|\brif\b/g, feature: "rif_pain" },
  { pattern: /\bright\s+upper\s+quadrant\b|\bruq\b/g, feature: "ruq_pain" },
  { pattern: /\babdominal\b|\babdomen\b|\babdo\b|\btummy\b|\bstomach\b/g, feature: "abdominal_pain" },
  { pattern: /\bpelvic\b|\bpelvis\b/g, feature: "pelvic_pain" },
  { pattern: /\bchest\b/g, feature: "chest_pain" },
  { pattern: /\bjaw\b/g, feature: "jaw_pain" },
  { pattern: /\bback\b/g, feature: "back_pain" },
  { pattern: /\bflank\b|\bloin\b/g, feature: "flank_pain" },
  { pattern: /\bshoulder\b/g, feature: "shoulder_pain" },
  { pattern: /\barm\b/g, feature: "arm_pain" },
  { pattern: /\bepigastric\b|\bepigastrium\b/g, feature: "epigastric_pain" },
] as const;

const COORDINATED_PAIN_NEGATION_PATTERN =
  /\b(?:no|not|denies|denied|without|nil)\b(?:\s+\w+){0,8}\s+(?:pain|discomfort|ache|aching)\b/;

let dbPhraseToFeatureSlug = new Map<string, string>();
let dbFeaturePhraseLoadPromise: Promise<void> | null = null;
let dbFeaturePhraseLastLoadedAt = 0;
let dbFeaturePhraseLoadFailed = false;
let dbFeaturePhraseFallbackLogged = false;

function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseFeatureName(feature: string): string {
  return canonicalFeatureSlug(feature);
}

function addMatchedFeature(matchedFeatures: string[], feature: string) {
  const canonicalFeature = canonicalFeatureSlug(feature);

  if (canonicalFeature && !matchedFeatures.includes(canonicalFeature)) {
    matchedFeatures.push(canonicalFeature);
  }
}

function removeMatchedFeature(matchedFeatures: string[], feature: string) {
  const canonicalFeature = canonicalFeatureSlug(feature);
  const featureIndex = matchedFeatures.indexOf(canonicalFeature);

  if (featureIndex >= 0) {
    matchedFeatures.splice(featureIndex, 1);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPatternRegex(pattern: string): RegExp {
  const escapedPattern = escapeRegExp(pattern).replace(/\s+/g, "\\s+");

  return new RegExp(`(?:^|\\s)${escapedPattern}(?:\\s|$)`);
}

function hasPattern(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => buildPatternRegex(pattern).test(text));
}

function isExpectedTestDbPhraseFailure() {
  return process.env.WARDBRAIN_TEST_MODE === "1" || process.env.NODE_ENV === "test";
}

function logDbFeaturePhraseLoadFailure(error: unknown) {
  if (!isExpectedTestDbPhraseFailure()) {
    console.error("Failed to load DB feature phrases for extraction:", error);
    return;
  }

  if (dbFeaturePhraseFallbackLogged) {
    return;
  }

  const fallbackLogPath = process.env.WARDBRAIN_TEST_DB_FALLBACK_LOG_PATH;

  if (fallbackLogPath) {
    try {
      writeFileSync(fallbackLogPath, "1", { flag: "wx" });
    } catch {
      dbFeaturePhraseFallbackLogged = true;
      return;
    }
  }

  console.warn("DB feature phrases unavailable in test mode; using hardcoded phrase fallback.");
  dbFeaturePhraseFallbackLogged = true;
}

async function loadDbFeaturePatterns() {
  try {
    const featurePhrases = await prisma.featurePhrase.findMany({
      where: {
        status: "PUBLISHED",
        featureLabel: {
          status: "PUBLISHED",
        },
      },
      include: {
        featureLabel: {
          select: {
            slug: true,
          },
        }
      },
      orderBy: [{ featureLabelId: "asc" }, { phrase: "asc" }],
    });

    const phraseToFeatureSlug = new Map<string, string>();
    for (const featurePhrase of featurePhrases) {
      const normalizedPhrase = normaliseText(featurePhrase.phrase);

      if (!normalizedPhrase) {
        continue;
      }

      phraseToFeatureSlug.set(normalizedPhrase, normaliseFeatureName(featurePhrase.featureLabel.slug));
    }

    dbPhraseToFeatureSlug = phraseToFeatureSlug;
    dbFeaturePhraseLastLoadedAt = Date.now();
    dbFeaturePhraseLoadFailed = false;
  } catch (error) {
    dbFeaturePhraseLoadFailed = true;
    logDbFeaturePhraseLoadFailure(error);
  } finally {
    dbFeaturePhraseLoadPromise = null;
  }
}

function ensureDbFeaturePatternsLoaded() {
  const cacheIsFresh =
    dbFeaturePhraseLastLoadedAt > 0 &&
    Date.now() - dbFeaturePhraseLastLoadedAt < FEATURE_PHRASE_CACHE_TTL_MS;

  if (cacheIsFresh || dbFeaturePhraseLoadPromise) {
    return;
  }

  if (dbFeaturePhraseLoadFailed && dbFeaturePhraseLastLoadedAt === 0) {
    return;
  }

  dbFeaturePhraseLoadPromise = loadDbFeaturePatterns();
}

export function setDbFeaturePhrasePatternsForTest(patterns: Record<string, string>) {
  dbPhraseToFeatureSlug = new Map(
    Object.entries(patterns).map(([phrase, feature]) => [
      normaliseText(phrase),
      canonicalFeatureSlug(feature),
    ]),
  );
  dbFeaturePhraseLastLoadedAt = Date.now();
  dbFeaturePhraseLoadFailed = false;
  dbFeaturePhraseLoadPromise = null;
}

export function resetDbFeaturePhrasePatternsForTest() {
  dbPhraseToFeatureSlug = new Map();
  dbFeaturePhraseLastLoadedAt = 0;
  dbFeaturePhraseLoadFailed = false;
  dbFeaturePhraseLoadPromise = null;
}

function hasNegatedPattern(text: string, feature: string, patterns: string[]): boolean {
  const explicitNegations = FEATURE_NEGATION_PHRASES[feature] ?? [];

  if (explicitNegations.some((phrase) => text.includes(phrase))) {
    return true;
  }

  if (
    feature === "sob" &&
    /\b(?:no|denies|denied|without)(?:\s+\w+){0,3}\s+(?:shortness\s+of\s+breath|sob|breathlessness|breathless)\b/.test(text)
  ) {
    return true;
  }

  if (BACKGROUND_CONTEXT_FEATURES.has(feature)) {
    return false;
  }

  return patterns.some((pattern) => {
    const escapedPattern = escapeRegExp(pattern).replace(/\s+/g, "\\s+");

    return NEGATION_PREFIXES.some((prefix) => {
      const escapedPrefix = escapeRegExp(prefix);
      const negatedPattern = new RegExp(
        `(?:^|\\s)${escapedPrefix}(?:\\s+\\w+){0,2}\\s+${escapedPattern}(?:\\s|$)`,
      );

      return negatedPattern.test(text);
    });
  });
}

function normaliseClauseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[()[\]{}"']/g, " ")
    .replace(/[,\-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoPainLocationClauses(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[.!?;:\n]|\bbut\b|\bhowever\b/)
    .map(normaliseClauseText)
    .filter(Boolean);
}

function getCoordinatedPainLocationFeatures(rawText: string): string[] {
  const features: string[] = [];

  for (const clause of splitIntoPainLocationClauses(rawText)) {
    if (!/\b(?:pain|discomfort|ache|aching)\b/.test(clause)) {
      continue;
    }

    if (COORDINATED_PAIN_NEGATION_PATTERN.test(clause)) {
      continue;
    }

    const painKeywordMatch = /\b(?:pain|discomfort|ache|aching)\b/.exec(clause);
    if (!painKeywordMatch) {
      continue;
    }

    const locationHits = COORDINATED_PAIN_LOCATION_MAP
      .flatMap(({ pattern, feature }) => {
        pattern.lastIndex = 0;
        return Array.from(clause.matchAll(pattern)).map((match) => ({
          feature,
          index: match.index ?? 0,
        }));
      })
      .sort((left, right) => left.index - right.index);

    const uniqueFeatures = Array.from(new Set(locationHits.map((hit) => hit.feature)));
    if (uniqueFeatures.length < 2) {
      continue;
    }

    const painIndex = painKeywordMatch.index;
    const locationsBeforePain = locationHits.filter((hit) => hit.index < painIndex);
    const locationsAfterPain = locationHits.filter((hit) => hit.index > painIndex);
    const supportsSharedLaterPain =
      locationsBeforePain.length >= 2 &&
      /^[a-z\s]*(?:,|\band\b|\bor\b)[a-z\s]*$/.test(clause.slice(locationsBeforePain[0].index, painIndex));
    const supportsSharedEarlierPain =
      locationsAfterPain.length >= 2 &&
      /\b(?:in|affecting|to|around|over|across)\b/.test(clause.slice(painIndex, locationsAfterPain[0].index + 1));

    if (!supportsSharedLaterPain && !supportsSharedEarlierPain) {
      continue;
    }

    for (const feature of uniqueFeatures) {
      features.push(canonicalFeatureSlug(feature));
    }
  }

  const uniqueFeatures = Array.from(new Set(features));

  if (process.env.WARDBRAIN_FEATURE_EXTRACTOR_DEBUG === "1") {
    console.log("getCoordinatedPainLocationFeatures", {
      rawText,
      matchedFeatures: uniqueFeatures,
    });
  }

  return uniqueFeatures;
}

function normaliseObservations(text: string): string {
  return text
    .toLowerCase()
    .replace(/[,:;=]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getNumericMatches(text: string, regexes: RegExp[]): number[] {
  const matches: number[] = [];

  for (const regex of regexes) {
    const matchedValues = text.matchAll(regex);

    for (const match of matchedValues) {
      const parsedValue = Number(match[1]);

      if (!Number.isNaN(parsedValue)) {
        matches.push(parsedValue);
      }
    }
  }

  return matches;
}

function parseStructuredNumber(value: string | undefined) {
  if (!value) {
    return NaN;
  }

  const normalizedValue = value.toLowerCase();
  const parsedNumber = Number.parseInt(normalizedValue, 10);

  if (!Number.isNaN(parsedNumber)) {
    return parsedNumber;
  }

  return NUMBER_WORDS[normalizedValue] ?? NaN;
}

function getBloodPressureValues(text: string): number[] {
  const systolicMatches = getNumericMatches(text, [
    /\bbp(?:\s+is)?\s+(\d{2,3})\s*\/\s*\d{2,3}\b/g,
    /\bblood pressure(?:\s+is)?\s+(\d{2,3})\s*\/\s*\d{2,3}\b/g,
    /\bbp(?:\s+is)?\s+(\d{2,3})\s+over\s+\d{2,3}\b/g,
    /\bblood pressure(?:\s+is)?\s+(\d{2,3})\s+over\s+\d{2,3}\b/g,
    /\bbp(?:\s+is)?\s+(\d{2,3})\b/g,
    /\bblood pressure(?:\s+is)?\s+(\d{2,3})\b/g,
    /\bsystolic(?:\s+bp)?(?:\s+is)?\s+(\d{2,3})\b/g,
  ]);

  return systolicMatches;
}

function getObservationFeatures(observations: string): string[] {
  const normalisedObservations = normaliseObservations(observations);

  if (!normalisedObservations) {
    return [];
  }

  const observationFeatures: string[] = [];
  const respiratoryRates = getNumericMatches(normalisedObservations, [
    /\brr(?:\s+is)?\s+(\d{1,2})\b/g,
    /\brespiratory rate(?:\s+is)?\s+(\d{1,2})\b/g,
    /\bresp rate(?:\s+is)?\s+(\d{1,2})\b/g,
  ]);
  const heartRates = getNumericMatches(normalisedObservations, [
    /\bhr(?:\s+is)?\s+(\d{2,3})\b/g,
    /\bpulse(?:\s+is)?\s+(\d{2,3})\b/g,
    /\bheart rate(?:\s+is)?\s+(\d{2,3})\b/g,
  ]);
  const oxygenSaturations = getNumericMatches(normalisedObservations, [
    /\bsats?(?:\s+are|\s+is|\s+of)?\s+(\d{2,3})(?:\s*%| percent)?\b/g,
    /\bspo2(?:\s+is|\s+of)?\s+(\d{2,3})(?:\s*%| percent)?\b/g,
    /\boxygen saturations?(?:\s+are|\s+is|\s+of)?\s+(\d{2,3})(?:\s*%| percent)?\b/g,
  ]);
  const temperatures = getNumericMatches(normalisedObservations, [
    /\btemp(?:\s+is)?\s+(\d{2}(?:\.\d+)?)\b/g,
    /\btemperature(?:\s+is)?\s+(\d{2}(?:\.\d+)?)\b/g,
    /\bfebrile(?:\s+at|\s+to)?\s+(\d{2}(?:\.\d+)?)\b/g,
    /(?:^|\s)t\s+(\d{2}(?:\.\d+)?)\b/g,
  ]);
  const systolicBloodPressures = getBloodPressureValues(normalisedObservations);

  if (respiratoryRates.some((rate) => rate >= HIGH_RESPIRATORY_RATE_THRESHOLD)) {
    observationFeatures.push("tachypnoea");
  }

  if (heartRates.some((rate) => rate >= HIGH_HEART_RATE_THRESHOLD)) {
    observationFeatures.push("tachycardia");
  }

  if (systolicBloodPressures.some((pressure) => pressure <= LOW_SYSTOLIC_BP_THRESHOLD)) {
    observationFeatures.push("hypotension");
  }

  if (oxygenSaturations.some((sats) => sats <= LOW_SATS_THRESHOLD)) {
    observationFeatures.push("hypoxia");
  }

  if (oxygenSaturations.some((sats) => sats >= NORMAL_SATS_THRESHOLD)) {
    observationFeatures.push("normal_oxygen_saturations");
  }

  if (temperatures.some((temperature) => temperature >= HIGH_TEMPERATURE_THRESHOLD)) {
    observationFeatures.push("fever");
  }

  if (temperatures.some((temperature) => temperature < LOW_TEMPERATURE_THRESHOLD)) {
    observationFeatures.push("hypothermia");
  }

  return observationFeatures;
}

function getAgeFeatures(allText: string, structuredAge: string, sex: string): string[] {
  const features: string[] = [];
  const ages = [
    Number.parseInt(structuredAge, 10),
    ...[
      /\b(\d{1,3})\s*-\s*year\s*-\s*old\b/g,
      /\b(\d{1,3})\s+year\s+old\b/g,
      /\baged\s+(\d{1,3})\b/g,
      /\b(\d{1,3})\s*y\s*\/?\s*o\b/g,
      /\b(\d{1,3})\s*yo\b/g,
    ].flatMap((pattern) => Array.from(allText.matchAll(pattern)).map((match) => Number.parseInt(match[1] ?? "", 10))),
  ].filter((age) => !Number.isNaN(age));

  if (ages.some((age) => age >= 65)) {
    features.push("older_age");
  }

  if (sex.toLowerCase().includes("female") && ages.some((age) => age >= 12 && age <= 55)) {
    features.push("female_of_childbearing_age");
  }

  return features;
}

function getPregnancyTimingFeatures(allText: string): string[] {
  const features: string[] = [];
  const missedPeriodWeekPatterns = [
    /\b(?:last period(?: was)?|lmp|last menstrual period(?: was)?)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+weeks?\s+ago\b/g,
    /\bperiod overdue by\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+weeks?\b/g,
  ];
  const gestationWeekPatterns = [
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+weeks?\s+pregnant\b/g,
    /\bpregnant\s+at\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+weeks?\b/g,
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+weeks?\s+gestation\b/g,
  ];

  for (const pattern of missedPeriodWeekPatterns) {
    for (const match of allText.matchAll(pattern)) {
      const weeks = parseStructuredNumber(match[1]);

      if (!Number.isNaN(weeks) && weeks >= 4) {
        features.push("missed_period");
      }
    }
  }

  for (const pattern of gestationWeekPatterns) {
    for (const match of allText.matchAll(pattern)) {
      const weeks = parseStructuredNumber(match[1]);

      if (!Number.isNaN(weeks)) {
        features.push("pregnancy_possible");

        if (weeks >= 4) {
          features.push("missed_period");
        }
      }
    }
  }

  return features;
}

function getDurationFeatures(allText: string): string[] {
  const features: string[] = [];
  const durationPattern =
    /\b(?:for|over|during|across|in the last|for the last|over the last)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|several|few)\s+(hours?|days?|weeks?|months?|years?)\b/g;

  for (const match of allText.matchAll(durationPattern)) {
    const quantity = match[1] === "few" || match[1] === "several" ? 3 : parseStructuredNumber(match[1]);
    const unit = match[2] ?? "";
    const contextStart = Math.max(0, (match.index ?? 0) - 40);
    const contextEnd = Math.min(allText.length, (match.index ?? 0) + match[0].length + 40);
    const context = allText.slice(contextStart, contextEnd);

    if ((unit.startsWith("month") || unit.startsWith("year")) && quantity >= 1) {
      features.push("chronic_course");
    }

    if (
      (unit.startsWith("day") || unit.startsWith("week")) &&
      /\b(?:worsening|worse|progressive|progressively|deteriorating|get(?:ting)? worse)\b/.test(context)
    ) {
      features.push("progressive_course");
    }
  }

  const leadingDurationPattern =
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|several|few)\s+(hours?|days?|weeks?|months?|years?)\s+of\s+(?:worsening|progressive|progressively|deteriorating)\b/g;

  for (const match of allText.matchAll(leadingDurationPattern)) {
    const unit = match[2] ?? "";

    if (unit.startsWith("day") || unit.startsWith("week")) {
      features.push("progressive_course");
    }

    if (unit.startsWith("month") || unit.startsWith("year")) {
      features.push("chronic_course");
    }
  }

  return features;
}

function getTemporalRelationshipFeatures(allText: string): string[] {
  const features: string[] = [];

  if (/\b(?:pain|symptoms?|discomfort)\s+(?:starts?|started|comes?|came|begins?|began)\s+(?:\d+\s+)?(?:minutes?|hours?)?\s*(?:after|following)\s+(?:meals?|eating|food|fatty food|a fatty meal|a heavy meal)\b/.test(allText)) {
    features.push("post_prandial_pain", "worse_after_meals");
  }

  if (/\b(?:recurrent|repeated|similar)\s+(?:attacks?|episodes?|bouts?)\b/.test(allText)) {
    features.push("recurrent_attacks");
  }

  return features;
}

function getAcsEquivalentDynamicFeatures(allText: string): string[] {
  const features: string[] = [];
  const hasCentralChestDiscomfort =
    /\b(?:heavy|tight|pressure|heaviness|tightness|discomfort)(?:\s+\w+){0,5}\s+(?:centre|center|middle)\s+of\s+(?:his|her|the)?\s*chest\b/.test(allText) ||
    /\b(?:centre|center|middle)\s+of\s+(?:his|her|the)?\s*chest(?:\s+\w+){0,5}\s+(?:heavy|tight|pressure|heaviness|tightness|discomfort)\b/.test(allText);

  if (hasCentralChestDiscomfort) {
    features.push("chest_pain", "chest_heaviness");
  }

  if (
    /\b(?:mowing|walking uphill|walking upstairs|climbing stairs|carrying shopping|carrying groceries|exerting (?:himself|herself|themselves))\b/.test(allText) &&
    /\b(?:chest|indigestion|heartburn|pressure|heaviness|tightness|discomfort)\b/.test(allText)
  ) {
    features.push("exertional_pain");
  }

  if (/\b(?:went|spread|radiat(?:e|es|ed|ing)|travels?)\s+(?:a\s+bit\s+)?(?:into|to|towards?)\s+(?:his|her|the)?\s*(?:neck|jaw)\b/.test(allText)) {
    features.push("pain_radiates_to_jaw");
  }

  if (/\b(?:went|spread|radiat(?:e|es|ed|ing)|travels?)\s+(?:a\s+bit\s+)?(?:into|to|towards?)\s+(?:his|her|the)?\s*(?:left\s+)?shoulder\b/.test(allText)) {
    features.push("pain_radiates_to_shoulder", "shoulder_pain");
  }

  if (/\b(?:went|spread|radiat(?:e|es|ed|ing)|travels?)\s+(?:a\s+bit\s+)?(?:into|to|towards?)\s+(?:his|her|the)?\s*left\s+arm\b/.test(allText)) {
    features.push("pain_radiates_to_left_arm", "arm_pain");
  }

  return features;
}

function getObstructionDynamicFeatures(allText: string): string[] {
  const features: string[] = [];

  if (/\b(?:blown up like a drum|abdomen (?:is )?blown up|bloated|abdominal swelling|distended abdomen)\b/.test(allText)) {
    features.push("distension");
  }

  if (/\b(?:not|hasn t|has not|haven t|have not)\s+(?:opened (?:his|her|their)?\s*bowels?|passed stool|had a bowel motion|had a bowel movement)\b/.test(allText)) {
    features.push("obstipation");
  }

  if (/\b(?:not|hasn t|has not|haven t|have not)\s+passed\s+(?:flatus|wind)\b/.test(allText)) {
    features.push("unable_to_pass_flatus");
  }

  if (/\b(?:crampy|cramping|colicky|comes in waves|coming in waves)\b/.test(allText)) {
    features.push("colicky_pain");
  }

  if (/\b(?:cramps?|pain)(?:\s+\w+){0,4}\s+(?:becoming|became|become|becomes)\s+(?:more\s+)?constant\b/.test(allText)) {
    features.push("constant_pain");
  }

  return features;
}

function getCompositeFeatures(allText: string, matchedFeatures: string[]): string[] {
  const dynamicFeatures: string[] = [];
  const severePainCompositeSources = ["severe_pain", "pain_out_of_proportion"];
  const severePainCuePatterns = [
    /\bsevere(?:\s+\w+){0,3}\s+pain\b/g,
    /\bexcruciating(?:\s+\w+){0,3}\s+pain\b/g,
    /\b(?:ten|10)\s*\/\s*10\s+pain\b/g,
    /\b10\s+10\s+pain\b/g,
    /\b10\s+out\s+of\s+10\s+pain\b/g,
    /\bworst(?:\s+\w+){0,3}\s+pain\b/g,
    /\bpain(?:\s+is)?\s+(?:much|far)\s+worse\s+than\s+expected\b/g,
    /\bpain\s+much\s+worse\s+than\s+exam\b/g,
  ];
  const mildExamCuePatterns = [
    /\bmildly tender\b/g,
    /\bonly mild tenderness\b/g,
    /\bmild tenderness\b/g,
    /\bmild abdominal tenderness\b/g,
    /\bminimal tenderness\b/g,
    /\bminimal abdominal findings\b/g,
    /\bmild abdominal findings\b/g,
    /\bsoft abdomen\b/g,
    /\babdomen is soft\b/g,
    /\bsoft non tender abdomen\b/g,
    /\bno guarding\b/g,
    /\bno peritonism\b/g,
  ];

  const hasSeverePainCue = severePainCompositeSources.some(
    (feature) => matchedFeatures.includes(feature) || dynamicFeatures.includes(feature),
  ) || severePainCuePatterns.some((pattern) => pattern.test(allText));
  const hasMildExamCue = mildExamCuePatterns.some((pattern) => pattern.test(allText));

  if (hasSeverePainCue && hasMildExamCue) {
    dynamicFeatures.push(canonicalFeatureSlug("pain_severe_but_exam_mild"));
  }

  return dynamicFeatures.map(canonicalFeatureSlug);
}

function getMetabolicBreathFeatures(allText: string): string[] {
  const ketosisBreathPatterns = [
    /\bbreath\s+(?:smells?|smelled)\s+["'“”‘’]?\s*fruity\b/g,
    /\bbreath\s+(?:smells?|smelled)\s+(?:of|like)\s+pear\s+drops?\b/g,
    /\bpear\s+drops?\b/g,
    /\bfruity\s+smell(?:ing)?\s+breath\b/g,
  ];
  const features: string[] = [];

  if (ketosisBreathPatterns.some((pattern) => pattern.test(allText))) {
    features.push("ketosis_breath");
  }

  if (/\b(?:breathing|breathes?)\s+(?:very\s+)?deep(?:ly)?\s+(?:and\s+)?fast\b/.test(allText)) {
    features.push("kussmaul_breathing");
  }

  return features;
}

function getDynamicFeatures(allText: string, matchedFeatures: string[], input: CaseInput): string[] {
  return [
    ...getAgeFeatures(allText, input.age, input.sex),
    ...getPregnancyTimingFeatures(allText),
    ...getDurationFeatures(allText),
    ...getTemporalRelationshipFeatures(allText),
    ...getAcsEquivalentDynamicFeatures(allText),
    ...getObstructionDynamicFeatures(allText),
    ...getCompositeFeatures(allText, matchedFeatures),
    ...getMetabolicBreathFeatures(allText),
  ].map(canonicalFeatureSlug);
}

export function extractFeatures(input: CaseInput): ExtractedFeatures {
  ensureDbFeaturePatternsLoaded();

  const rawText = [
    input.presentingComplaint,
    input.history,
    input.pmh,
    input.meds,
    input.social,
    input.keyPositives,
    input.keyNegatives,
    input.observations,
  ]
    .filter(Boolean)
    .join(". ")
    .trim();

  const allText = normaliseText(
    rawText,
  );

  const matchedFeatures: string[] = [];

  for (const [phrase, feature] of dbPhraseToFeatureSlug.entries()) {
    const present = buildPatternRegex(phrase).test(allText);
    const negated = hasNegatedPattern(allText, feature, [phrase]);

    if (present && !negated) {
      addMatchedFeature(matchedFeatures, feature);
    }
  }

  for (const [feature, patterns] of Object.entries(FEATURE_PATTERNS)) {
    const present = hasPattern(allText, patterns);
    const negated = hasNegatedPattern(allText, feature, patterns);

    if (present && !negated) {
      addMatchedFeature(matchedFeatures, feature);
    }
  }

  for (const feature of getObservationFeatures(rawText)) {
    addMatchedFeature(matchedFeatures, feature);
  }

  const coordinatedPainLocationFeatures = getCoordinatedPainLocationFeatures(rawText);
  for (const feature of coordinatedPainLocationFeatures) {
    addMatchedFeature(matchedFeatures, feature);
  }

  if (process.env.WARDBRAIN_FEATURE_EXTRACTOR_DEBUG === "1") {
    console.log("matchedFeaturesAfterCoordinatedPainLocationExtraction", {
      coordinatedPainLocationFeatures,
      matchedFeatures: [...matchedFeatures],
    });
  }

  for (const feature of getDynamicFeatures(allText, matchedFeatures, input)) {
    addMatchedFeature(matchedFeatures, feature);
  }

  const aliasFeatures: Array<[string, string]> = [
    ["migration_to_rif", "pain_migration_to_rif"],
    ["abdominal_movement_pain", "pain_worse_on_movement"],
    ["well_between_episodes", "pain_settles_between_episodes"],
    ["unilateral_testicular_pain", "testicular_pain"],
    ["af", "atrial_fibrillation"],
    ["frequency", "urinary_frequency"],
    ["guarding_rigidity", "guarding"],
    ["pain_radiates_to_left_arm", "arm_pain"],
    ["smoker", "smoking_history"],
    ["asthma_history", "known_asthma"],
    ["known_asthma", "asthma_history"],
    ["copd_history", "known_copd"],
    ["known_copd", "copd_history"],
    ["inhaler_use", "increased_inhaler_use"],
    ["unable_to_speak_full_sentences", "difficulty_speaking"],
    ["difficulty_speaking", "unable_to_speak_full_sentences"],
    ["ankle_swelling", "peripheral_oedema"],
    ["peripheral_oedema", "ankle_swelling"],
    ["leg_swelling", "ankle_swelling"],
    ["unilateral_leg_swelling", "leg_swelling"],
    ["calf_swelling", "leg_swelling"],
    ["dvt_signs", "leg_swelling"],
    ["productive_cough", "infection_source"],
    ["tingling", "panic_features"],
    ["perioral_paraesthesia", "panic_features"],
    ["kussmaul_breathing", "tachypnoea"],
  ];

  for (const [sourceFeature, aliasFeature] of aliasFeatures) {
    if (matchedFeatures.includes(sourceFeature)) {
      addMatchedFeature(matchedFeatures, aliasFeature);
    }
  }

  if (
    matchedFeatures.includes("crackles") &&
    (matchedFeatures.includes("fever") ||
      matchedFeatures.includes("productive_cough") ||
      matchedFeatures.includes("sputum_change") ||
      matchedFeatures.includes("rigors"))
  ) {
    addMatchedFeature(matchedFeatures, "infection_source");
  }

  if (
    matchedFeatures.includes("pain_severe_but_exam_mild") &&
    !matchedFeatures.includes("pain_out_of_proportion")
  ) {
    addMatchedFeature(matchedFeatures, "pain_out_of_proportion");
  }

  if (
    matchedFeatures.includes("severe_tenderness") &&
    /\b(?:mildly tender|only mild tenderness|mild tenderness|mild abdominal tenderness|minimal tenderness)\b/.test(allText) &&
    !/\b(?:severe tenderness|marked tenderness|exquisite tenderness)\b/.test(allText)
  ) {
    const featureIndex = matchedFeatures.indexOf("severe_tenderness");
    matchedFeatures.splice(featureIndex, 1);
  }

  if (/\b(?:no|not|without|denies|rather than looking)\s+(?:\w+\s+){0,3}wheez(?:e|y|ing)\b/.test(allText)) {
    removeMatchedFeature(matchedFeatures, "wheeze");
  }

  if (/\b(?:no|not|without|denies)\s+(?:\w+\s+){0,3}(?:leg|calf|ankle)\s+swelling\b/.test(allText)) {
    removeMatchedFeature(matchedFeatures, "leg_swelling");
    removeMatchedFeature(matchedFeatures, "ankle_swelling");
    removeMatchedFeature(matchedFeatures, "peripheral_oedema");
  }

  if (/\b(?:no|not|without)\s+(?:obvious\s+)?(?:board\s+like\s+|board-like\s+)?rigidity\b/.test(allText)) {
    removeMatchedFeature(matchedFeatures, "guarding_rigidity");
    removeMatchedFeature(matchedFeatures, "rigidity");
    removeMatchedFeature(matchedFeatures, "peritonism");
  }

  const hasChestPainContext = matchedFeatures.includes("chest_pain");

  if (!hasChestPainContext) {
    const chestWallOnlyFeatures = ["movement_related_chest_pain", "post_lifting_onset", "reproducible_chest_wall_tenderness"];

    for (const feature of chestWallOnlyFeatures) {
      const featureIndex = matchedFeatures.indexOf(feature);

      if (featureIndex >= 0) {
        matchedFeatures.splice(featureIndex, 1);
      }
    }
  }

  return { allText, matchedFeatures };
}
