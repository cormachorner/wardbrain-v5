import type { CaseInput, ExtractedFeatures } from "../types";

const FEATURE_PATTERNS: Record<string, string[]> = {
  chestPain: [
    "chest pain",
    "central chest pain",
    "central chest pressure",
    "chest pressure",
    "chest heaviness",
    "heavy chest pain",
    "crushing chest pain",
    "chest tightness",
    "tight chest",
    "central chest discomfort",
    "heavy feeling in chest",
    "dull central chest pain",
    "retrosternal pain",
    "pain on one side of chest",
    "unilateral chest pain",
    "sudden sharp chest pain",
  ],
  suddenOnset: [
    "sudden onset",
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
    "came on suddenly",
    "started suddenly",
  ],
  tearingPain: [
    "tearing",
    "ripping",
    "tearing pain",
    "ripping pain",
  ],
  backRadiation: [
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
  pulsatileAbdomen: [
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
  hypertension: [
    "hypertension",
    "untreated hypertension",
    "high blood pressure",
    "known hypertension",
  ],
  jawPain: [
    "jaw pain",
    "pain to jaw",
    "pain to the jaw",
    "pain in the jaw",
    "radiating to the jaw",
    "pain radiating to the jaw",
    "radiates to the jaw",
    "jaw discomfort",
  ],
  armPain: [
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
  ],
  indigestionLikeChestPain: [
    "indigestion like chest pain",
    "indigestion-like chest pain",
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
  acsEquivalentPain: [
    "epigastric discomfort",
    "upper abdominal pressure",
    "upper abdominal heaviness",
    "indigestion like chest discomfort",
    "indigestion-like chest discomfort",
  ],
  heartburn: [
    "heartburn",
    "retrosternal burning",
    "burning discomfort behind sternum",
    "burning behind sternum",
    "burning behind the sternum",
  ],
  burningPain: [
    "burning pain",
    "burning discomfort",
    "burning upper abdominal pain",
  ],
  worseAfterMeals: [
    "worse after meals",
    "worse after eating",
    "after meals",
    "after eating",
    "post prandial",
    "post-prandial",
  ],
  worseLyingFlat: [
    "worse lying flat",
    "worse when lying flat",
    "worse on lying flat",
    "worse when lying down",
    "worse on lying down",
  ],
  acidRegurgitation: [
    "acidic taste",
    "acid taste",
    "acid in mouth",
    "acid in the mouth",
    "regurgitation",
    "regurgitating acid",
    "brash",
  ],
  antacidRelief: [
    "improves with antacids",
    "improved with antacids",
    "better with antacids",
    "relieved by antacids",
    "settled with antacids",
  ],
  abdominalPain: [
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
  ],
  upperAbdominalPain: [
    "upper abdominal pain",
    "upper abdominal discomfort",
    "upper abdomen pain",
  ],
  epigastricPain: [
    "epigastric pain",
    "epigastric discomfort",
    "pain in the epigastrium",
    "epigastric tenderness",
  ],
  generalizedAbdominalPain: [
    "generalised abdominal pain",
    "generalized abdominal pain",
    "diffuse abdominal pain",
    "whole abdomen pain",
  ],
  rifPain: [
    "rif pain",
    "right iliac fossa pain",
    "pain in the right iliac fossa",
    "right lower quadrant pain",
    "rlq pain",
    "right lower abdominal pain",
  ],
  rifTenderness: [
    "rif tenderness",
    "right iliac fossa tenderness",
    "right lower quadrant tenderness",
    "tender over the rif",
  ],
  migrationToRIF: [
    "migrated to the right iliac fossa",
    "migrated to right iliac fossa",
    "migrated to the right lower quadrant",
    "migrated to right lower quadrant",
    "started central then moved to the right iliac fossa",
    "started around the umbilicus then moved to the right iliac fossa",
    "pain moved to the right iliac fossa",
  ],
  painMigrationToRIF: [
    "migrated to the right iliac fossa",
    "migrated to right iliac fossa",
    "migrated to the right lower quadrant",
    "migrated to right lower quadrant",
    "started central then moved to the right iliac fossa",
    "started around the umbilicus then moved to the right iliac fossa",
    "pain moved to the right iliac fossa",
  ],
  pelvicPain: [
    "pelvic pain",
    "adnexal pain",
    "suprapubic pain",
    "lower pelvic pain",
  ],
  suprapubicPain: [
    "suprapubic pain",
    "pain over the bladder",
    "pain in the suprapubic area",
    "lower central abdominal pain",
  ],
  vaginalBleeding: [
    "vaginal bleeding",
    "pv bleeding",
    "per vaginal bleeding",
    "bleeding per vaginam",
    "spotting in pregnancy",
  ],
  pregnancyPossible: [
    "pregnant",
    "pregnancy possible",
    "could be pregnant",
    "positive pregnancy test",
    "pregnancy test positive",
    "possible pregnancy",
  ],
  positivePregnancyTest: [
    "positive pregnancy test",
    "pregnancy test positive",
    "positive urine pregnancy test",
  ],
  missedPeriod: [
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
  recentMiscarriage: [
    "recent miscarriage",
    "after miscarriage",
    "following miscarriage",
  ],
  ruqPain: [
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
  ruqTenderness: [
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
  darkUrine: [
    "dark urine",
    "dark pee",
    "tea coloured urine",
    "tea-colored urine",
    "cola coloured urine",
    "cola-colored urine",
  ],
  paleStools: [
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
  murphysSign: [
    "murphy's sign",
    "murphys sign",
    "positive murphy's sign",
    "positive murphys sign",
    "inspiratory arrest on ruq palpation",
    "inspiratory arrest on right upper quadrant palpation",
  ],
  localizedRuqTenderness: [
    "ruq tenderness",
    "right upper quadrant tenderness",
    "localised ruq tenderness",
    "localized ruq tenderness",
    "tender ruq",
    "tender right upper quadrant",
    "right costal margin tenderness",
    "tender under the right costal margin",
  ],
  persistentRuqPain: [
    "persistent ruq pain",
    "persistent right upper quadrant pain",
    "constant ruq pain",
    "constant right upper quadrant pain",
    "ongoing ruq pain",
    "ongoing right upper quadrant pain",
    "pain has not settled",
    "persistent upper right abdominal pain",
  ],
  constantPain: [
    "constant pain",
    "constant abdominal pain",
    "pain has not settled",
    "ongoing constant pain",
  ],
  postPrandialPain: [
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
  episodicPain: [
    "episodic pain",
    "comes in episodes",
    "comes and goes",
    "intermittent pain",
  ],
  recurrentAttacks: [
    "recurrent attacks",
    "recurrent episodes",
    "similar attacks before",
    "recurrent pain episodes",
  ],
  recurrentBiliaryPain: [
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
  painSettlesBetweenEpisodes: [
    "pain settling between episodes",
    "pain settles between episodes",
    "settles between episodes",
    "settles between attacks",
    "pain free between attacks",
    "pain free between episodes",
  ],
  unilateralTesticularPain: [
    "testicular pain",
    "unilateral testicular pain",
    "left testicular pain",
    "right testicular pain",
    "acute scrotal pain",
    "one sided testicular pain",
    "one-sided testicular pain",
  ],
  testicularPain: [
    "testicular pain",
    "left testicular pain",
    "right testicular pain",
    "acute scrotal pain",
  ],
  backPain: [
    "back pain",
    "lower back pain",
    "severe back pain",
    "lumbar pain",
  ],
  severePain: [
    "severe pain",
    "very severe pain",
    "excruciating pain",
  ],
  colickyPain: [
    "colicky pain",
    "colic",
    "comes in waves",
    "wave like pain",
    "wave-like pain",
  ],
  urinaryRetention: [
    "urinary retention",
    "unable to pass urine",
    "cannot pass urine",
    "can't pass urine",
    "difficulty passing urine",
  ],
  saddleNumbness: [
    "saddle numbness",
    "saddle anaesthesia",
    "saddle anesthesia",
    "numb around the groin",
    "numbness around the groin",
  ],
  bilateralLegSymptoms: [
    "bilateral leg weakness",
    "both legs weak",
    "bilateral leg pain",
    "bilateral sciatica",
    "both legs numb",
    "bilateral leg numbness",
  ],
  wellBetweenEpisodes: [
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
  obstructiveJaundiceLanguage: [
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
  bowelHabitChange: [
    "change in bowel habit",
    "bowel habit change",
    "bowels changed",
  ],
  obstipation: [
    "obstipation",
    "not opened bowels or passed flatus",
    "no bowel motion and no flatus",
  ],
  unableToPassFlatus: [
    "unable to pass flatus",
    "not passing flatus",
    "no flatus",
    "cannot pass wind",
    "can't pass wind",
  ],
  anorexia: [
    "anorexia",
    "loss of appetite",
    "poor appetite",
    "off food",
  ],
  prBleeding: [
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
  ],
  rigors: [
    "rigors",
    "rigor",
    "shivering",
    "shaking chills",
    "fever with chills",
  ],
  infectionSource: [
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
  alcoholExcess: [
    "alcohol excess",
    "heavy alcohol use",
    "heavy alcohol intake",
    "heavy drinker",
    "drinks heavily",
    "excess alcohol",
    "alcohol dependence",
  ],
  gallstoneContext: [
    "gallstones",
    "known gallstones",
    "gallstone pancreatitis",
    "biliary colic",
    "gallstone history",
  ],
  bingeDrinking: [
    "binge drinking",
    "binge drank",
    "drank heavily last night",
    "alcohol binge",
  ],
  pepticUlcerDisease: [
    "peptic ulcer disease",
    "peptic ulcer",
    "gastric ulcer",
    "duodenal ulcer",
    "pud",
  ],
  nsaidUse: [
    "nsaid use",
    "taking nsaids",
    "regular ibuprofen",
    "ibuprofen use",
    "naproxen use",
    "diclofenac use",
  ],
  severeConstantUpperAbdominalPain: [
    "severe constant upper abdominal pain",
    "severe constant epigastric pain",
    "constant epigastric pain",
    "constant upper abdominal pain",
    "severe epigastric pain",
    "severe upper abdominal pain",
  ],
  guardingRigidity: [
    "guarding",
    "guarded abdomen",
    "abdominal guarding",
    "rigidity",
    "rigid abdomen",
    "board like abdomen",
    "board-like abdomen",
    "peritonism",
    "peritonitic",
  ],
  abdominalMovementPain: [
    "pain worse on movement",
    "pain worse with movement",
    "pain worse on coughing",
    "pain worse with coughing",
    "worse on movement and coughing",
    "worse with movement and coughing",
    "worse on movement or coughing",
    "worse on coughing",
    "worse with coughing",
  ],
  painWorseOnMovement: [
    "pain worse on movement",
    "pain worse with movement",
    "worse on movement",
    "worse with movement",
  ],
  painWorseWithCough: [
    "pain worse on coughing",
    "pain worse with coughing",
    "worse on coughing",
    "worse with coughing",
    "pain worse with cough",
    "pain worse on cough",
  ],
  lyingStill: [
    "lying still",
    "lies still",
    "keeping still because of pain",
    "does not want to move",
  ],
  localizedTenderness: [
    "localized tenderness",
    "localised tenderness",
    "focal tenderness",
  ],
  distension: [
    "distension",
    "abdominal distension",
    "distended abdomen",
    "bloated abdomen",
  ],
  herniaPresent: [
    "hernia",
    "inguinal hernia",
    "femoral hernia",
    "umbilical hernia",
  ],
  knownHernia: [
    "known hernia",
    "history of hernia",
    "inguinal hernia",
    "femoral hernia",
    "umbilical hernia",
  ],
  incarceratedHernia: [
    "incarcerated hernia",
    "strangulated hernia",
    "irreducible hernia",
    "tender irreducible hernia",
  ],
  perforationLanguage: [
    "perforation",
    "perforated viscus",
    "gi perforation",
    "bowel perforation",
    "perforated ulcer",
    "free air",
    "free air under diaphragm",
  ],
  recentSurgery: [
    "recent surgery",
    "post op",
    "post-op",
    "post operative",
    "post-operative",
    "after surgery",
    "following surgery",
  ],
  previousAbdominalSurgery: [
    "previous abdominal surgery",
    "prior abdominal surgery",
    "history of abdominal surgery",
    "laparotomy",
    "previous laparotomy",
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
  longHaulTravel: [
    "long haul flight",
    "long-haul flight",
    "long haul travel",
    "prolonged travel",
    "prolonged flight",
    "long flight",
  ],
  unilateralReducedAirEntry: [
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
  ],
  tallThinHabitus: [
    "tall thin male",
    "tall slim male",
    "tall and thin",
    "tall and slim",
    "tall thin",
  ],
  recentChestDrain: [
    "recent chest drain",
    "had a chest drain recently",
    "post chest drain",
    "after chest drain",
  ],
  previousPneumothorax: [
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
  painOutOfProportion: [
    "pain out of proportion",
    "pain seems out of proportion",
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
  visualAura: [
    "visual aura",
    "aura before headache",
    "flashing lights",
    "zig zags",
    "zig-zags",
    "scintillating scotoma",
  ],
  gradualSpreadPositiveSymptoms: [
    "gradual spread of symptoms",
    "symptoms spread gradually",
    "marching tingling",
    "tingling spreading up the arm",
    "gradually spreading numbness",
    "positive symptoms spread",
  ],
  throbbingHeadache: [
    "throbbing headache",
    "throbbing headaches",
    "unilateral throbbing headaches",
    "pounding headache",
    "pulsating headache",
  ],
  unilateralHeadache: [
    "unilateral headache",
    "unilateral throbbing",
    "unilateral throbbing headache",
    "unilateral throbbing headaches",
    "one sided headache",
    "one-sided headache",
    "left sided headache",
    "right sided headache",
  ],
  recurrentHeadache: [
    "recurrent headaches",
    "recurrent headache",
    "recurrent unilateral throbbing headaches",
    "similar episodes before",
    "same headaches before",
    "recurrent migraines",
    "has had this before",
  ],
  transientFocalDeficit: [
    "transient focal deficit",
    "transient weakness",
    "transient numbness",
    "speech disturbance resolved",
    "slurred speech resolved",
    "symptoms resolved",
    "episode of weakness that resolved",
    "transient visual loss",
  ],
  wellIntervals: [
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
  gradualOnset: [
    "gradual",
    "gradual onset",
    "came on gradually",
    "started gradually",
    "gradually worsening",
  ],
  bilateralHeadache: [
    "bilateral",
    "bilateral headache",
    "bilateral band like headache",
    "bilateral band-like headache",
    "both sides of the head",
    "whole head headache",
  ],
  bandLikeHeadache: [
    "band like",
    "band-like",
    "tight band",
    "tight band around head",
    "pressure band",
  ],
  stressTrigger: [
    "stress",
    "stressed",
    "stress related",
    "stress-related",
  ],
  poorSleep: [
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
  neckStiffness: [
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
  sharedAccommodation: [
    "shared accommodation",
    "student halls",
    "university halls",
    "lives in halls",
    "dormitory",
    "shared housing",
  ],
  recentInfection: [
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
  ibdContext: [
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
  dryEyesMouth: [
    "dry eyes",
    "dry mouth",
    "dry eyes and mouth",
    "sicca symptoms",
    "sicca",
  ],
  chronicCourse: [
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
  focalNeurology: [
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
  urinarySymptoms: [
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
  cvaTenderness: [
    "cva tenderness",
    "costovertebral angle tenderness",
    "renal angle tenderness",
  ],
  flankPain: [
    "flank pain",
    "loin pain",
    "cva tenderness",
    "costovertebral angle tenderness",
  ],
  loinToGroinPain: [
    "loin to groin pain",
    "pain radiating to groin",
    "radiates to the groin",
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
    "needs extra pillows",
    "sleeping propped up",
  ],
  ankleSwelling: [
    "ankle swelling",
    "leg swelling",
    "bilateral leg swelling",
    "peripheral oedema",
    "peripheral edema",
    "pitting oedema",
    "pitting edema",
  ],
  diabeticContext: [
    "diabetic",
    "diabetes",
    "type 1 diabetes",
    "type 2 diabetes",
    "on insulin",
    "insulin dependent",
  ],
  polyuria: [
    "polyuria",
    "passing lots of urine",
    "peeing a lot",
  ],
  polydipsia: [
    "polydipsia",
    "very thirsty",
    "excessive thirst",
  ],
  ketosisBreath: [
    "ketotic breath",
    "ketosis breath",
    "fruity breath",
    "acetone breath",
  ],
  hypoglycaemiaCue: [
    "hypoglycaemia",
    "hypoglycemia",
    "hypo",
    "sweaty and shaky",
    "shaky and sweaty",
    "blood sugar low",
    "low blood sugar",
  ],
  panicFeatures: [
    "panic attack",
    "anxiety attack",
    "very anxious",
    "hyperventilating",
    "sense of doom",
    "tingling in both hands",
    "tingling around the mouth",
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
  pleuriticPain: [
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
  giBleed: [
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
  productiveCough: [
    "productive cough",
    "bringing up sputum",
    "bringing up phlegm",
    "cough with sputum",
    "cough productive of sputum",
  ],
  progressiveCourse: [
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
  knownAsthma: [
    "known asthma",
    "history of asthma",
    "asthmatic",
    "usually uses salbutamol",
  ],
  knownCopd: [
    "known copd",
    "history of copd",
    "copd patient",
    "emphysema",
    "chronic obstructive pulmonary disease",
  ],
  increasedInhalerUse: [
    "increased inhaler use",
    "using inhaler more",
    "using inhaler more often",
    "needing inhaler more",
    "using salbutamol more",
    "using blue inhaler more",
    "using reliever more",
  ],
  difficultySpeaking: [
    "difficulty speaking full sentences",
    "cannot speak full sentences",
    "can't speak full sentences",
    "too breathless to speak full sentences",
    "speaking in words only",
    "too breathless to talk",
    "struggling to finish sentences",
    "unable to complete sentences",
  ],
  sputumChange: [
    "sputum volume increase",
    "more sputum",
    "increased sputum",
    "sputum colour change",
    "change in sputum colour",
    "green sputum",
    "yellow sputum",
  ],
  reproducibleChestWallTenderness: [
    "reproducible tenderness",
    "reproducible chest wall tenderness",
    "reproducible on palpation",
    "pain on palpation",
    "tender on palpation",
    "chest wall tenderness",
    "pain reproducible on palpation",
  ],
  movementRelatedChestPain: [
    "worse on movement",
    "worse with movement",
    "pain on movement",
    "movement related chest pain",
    "worse with twisting",
  ],
  postLiftingOnset: [
    "after heavy lifting",
    "after lifting",
    "post lifting",
    "following heavy lifting",
  ],
  scalpTenderness: [
    "scalp tenderness",
    "tender scalp",
    "painful scalp",
  ],
  jawClaudication: [
    "jaw claudication",
    "pain when chewing",
    "jaw pain when chewing",
    "jaw ache when chewing",
  ],
  temporalHeadache: [
    "temporal headache",
    "temple headache",
    "pain over temple",
    "pain over the temple",
  ],
  transientVisualSymptoms: [
    "transient visual loss",
    "transient visual symptoms",
    "blurred vision",
    "temporary blurred vision",
    "amaurosis fugax",
    "visual blurring",
  ],
  pmrLikeSymptoms: [
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

const FEATURE_NEGATION_PHRASES: Record<string, string[]> = {
  fever: ["no fever", "not feverish", "without fever"],
  vomiting: ["no vomiting", "not vomiting", "without vomiting"],
  diarrhoea: ["no diarrhoea", "no diarrhea", "without diarrhoea", "without diarrhea"],
  pleuriticPain: ["no pleuritic pain", "denies pleuritic pain", "without pleuritic pain"],
  focalNeurology: [
    "no focal neurology",
    "no focal neurological deficit",
    "denies focal neurology",
    "without focal neurology",
  ],
  headache: ["denies headache", "no headache", "without headache"],
};

const HIGH_RESPIRATORY_RATE_THRESHOLD = 22;
const HIGH_HEART_RATE_THRESHOLD = 100;
const LOW_SYSTOLIC_BP_THRESHOLD = 90;
const LOW_SATS_THRESHOLD = 92;
const HIGH_TEMPERATURE_THRESHOLD = 38;
const LOW_TEMPERATURE_THRESHOLD = 36;

function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function hasNegatedPattern(text: string, feature: string, patterns: string[]): boolean {
  const explicitNegations = FEATURE_NEGATION_PHRASES[feature] ?? [];

  if (explicitNegations.some((phrase) => text.includes(phrase))) {
    return true;
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

function getBloodPressureValues(text: string): number[] {
  const systolicMatches = getNumericMatches(text, [
    /\bbp(?:\s+is)?\s+(\d{2,3})\s*\/\s*\d{2,3}\b/g,
    /\bblood pressure(?:\s+is)?\s+(\d{2,3})\s*\/\s*\d{2,3}\b/g,
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
    /\brr\s+(\d{1,2})\b/g,
    /\brespiratory rate\s+(\d{1,2})\b/g,
    /\bresp rate\s+(\d{1,2})\b/g,
  ]);
  const heartRates = getNumericMatches(normalisedObservations, [
    /\bhr\s+(\d{2,3})\b/g,
    /\bpulse\s+(\d{2,3})\b/g,
    /\bheart rate\s+(\d{2,3})\b/g,
  ]);
  const oxygenSaturations = getNumericMatches(normalisedObservations, [
    /\bsats?\s+(\d{2,3})(?:\s*%| percent)?\b/g,
    /\bspo2\s+(\d{2,3})(?:\s*%| percent)?\b/g,
    /\boxygen saturation\s+(\d{2,3})(?:\s*%| percent)?\b/g,
  ]);
  const temperatures = getNumericMatches(normalisedObservations, [
    /\btemp\s+(\d{2}(?:\.\d+)?)\b/g,
    /\btemperature\s+(\d{2}(?:\.\d+)?)\b/g,
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

  if (temperatures.some((temperature) => temperature >= HIGH_TEMPERATURE_THRESHOLD)) {
    observationFeatures.push("fever");
  }

  if (temperatures.some((temperature) => temperature < LOW_TEMPERATURE_THRESHOLD)) {
    observationFeatures.push("hypothermia");
  }

  return observationFeatures;
}

export function extractFeatures(input: CaseInput): ExtractedFeatures {
  const allText = normaliseText(
    [
      input.presentingComplaint,
      input.history,
      input.pmh,
      input.meds,
      input.social,
      input.keyPositives,
      input.keyNegatives,
      input.observations,
    ]
      .join(" ")
      .trim(),
  );

  const matchedFeatures: string[] = [];

  for (const [feature, patterns] of Object.entries(FEATURE_PATTERNS)) {
    const present = hasPattern(allText, patterns);
    const negated = hasNegatedPattern(allText, feature, patterns);

    if (present && !negated) {
      matchedFeatures.push(feature);
    }
  }

  for (const feature of getObservationFeatures(input.observations)) {
    if (!matchedFeatures.includes(feature)) {
      matchedFeatures.push(feature);
    }
  }

  const aliasFeatures: Array<[string, string]> = [
    ["migrationToRIF", "painMigrationToRIF"],
    ["abdominalMovementPain", "painWorseOnMovement"],
    ["wellBetweenEpisodes", "painSettlesBetweenEpisodes"],
    ["unilateralTesticularPain", "testicularPain"],
  ];

  for (const [sourceFeature, aliasFeature] of aliasFeatures) {
    if (matchedFeatures.includes(sourceFeature) && !matchedFeatures.includes(aliasFeature)) {
      matchedFeatures.push(aliasFeature);
    }
  }

  const hasChestPainContext = matchedFeatures.includes("chestPain");

  if (!hasChestPainContext) {
    const chestWallOnlyFeatures = ["movementRelatedChestPain", "postLiftingOnset", "reproducibleChestWallTenderness"];

    for (const feature of chestWallOnlyFeatures) {
      const featureIndex = matchedFeatures.indexOf(feature);

      if (featureIndex >= 0) {
        matchedFeatures.splice(featureIndex, 1);
      }
    }
  }

  return { allText, matchedFeatures };
}
