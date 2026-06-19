import { PrismaClient } from "@prisma/client";
import { DIAGNOSIS_RULES } from "../lib/domain/diagnosisRules";
import { GUIDELINE_RULES } from "../lib/domain/guidelineRules";

type ChestPainClinicalTestCase = {
  slug: string;
  title: string;
  vignette: string;
  sex?: string;
  age?: string;
  pmh?: string;
  social?: string;
  observations?: string;
  keyNegatives?: string;
  suspectedDiagnosis?: string;
  expectedLeadDiagnosisSlug: string;
  expectedFeatureSlugs: string[];
  expectedRedFlagSlugs?: string[];
  forbiddenRedFlagSlugs?: string[];
  notes: string;
};

type FeatureLabelSeed = {
  slug: string;
  label: string;
  groupName: string;
  description: string;
};

const prisma = new PrismaClient();

const PRESENTATION_BLOCK = "chest_pain";
const STATUS = "DRAFT";
const CONTENT_STATUS = "PUBLISHED";

const featureLabelSeeds: FeatureLabelSeed[] = [
  { slug: "chest-pain", label: "Chest pain", groupName: "painLocation", description: "Pain, pressure, tightness, or discomfort in the chest." },
  { slug: "jaw-pain", label: "Jaw pain", groupName: "painLocation", description: "Jaw pain or discomfort, including cardiac radiation patterns." },
  { slug: "arm-pain", label: "Arm pain", groupName: "painLocation", description: "Arm pain or radiation, especially left-arm cardiac-type radiation." },
  { slug: "sweating", label: "Sweating", groupName: "systemic", description: "Diaphoresis or sweating." },
  { slug: "nausea", label: "Nausea", groupName: "giFeatures", description: "Nausea." },
  { slug: "hypertension", label: "Hypertension", groupName: "riskFactors", description: "Known hypertension or high blood pressure." },
  { slug: "smoking-history", label: "Smoking history", groupName: "riskFactors", description: "Current or previous smoking history." },
  { slug: "sudden-onset", label: "Sudden onset", groupName: "painPattern", description: "Abrupt or sudden onset of symptoms." },
  { slug: "pleuritic-pain", label: "Pleuritic pain", groupName: "painPattern", description: "Pain worse with breathing or pleuritic in character." },
  { slug: "sob", label: "Shortness of breath", groupName: "cardioResp", description: "Shortness of breath or breathlessness." },
  { slug: "haemoptysis", label: "Haemoptysis", groupName: "cardioResp", description: "Coughing blood." },
  { slug: "long-haul-travel", label: "Long-haul travel", groupName: "riskFactors", description: "Recent long-haul travel or immobility risk." },
  { slug: "tachycardia", label: "Tachycardia", groupName: "systemic", description: "Elevated heart rate." },
  { slug: "hypoxia", label: "Hypoxia", groupName: "cardioResp", description: "Low oxygen saturations or hypoxia." },
  { slug: "tall-thin-habitus", label: "Tall thin habitus", groupName: "riskFactors", description: "Tall thin body habitus relevant to spontaneous pneumothorax." },
  { slug: "unilateral-reduced-air-entry", label: "Unilateral reduced air entry", groupName: "cardioResp", description: "Reduced breath sounds or air entry on one side." },
  { slug: "tearing-pain", label: "Tearing pain", groupName: "painPattern", description: "Tearing or ripping pain character." },
  { slug: "back-radiation", label: "Back radiation", groupName: "painPattern", description: "Pain radiating through or to the back." },
  { slug: "collapse", label: "Collapse", groupName: "systemic", description: "Collapse, syncope, or loss of consciousness." },
  { slug: "older-age", label: "Older age", groupName: "riskFactors", description: "Age 65 or above." },
  { slug: "productive-cough", label: "Productive cough", groupName: "cardioResp", description: "Productive cough." },
  { slug: "sputum-change", label: "Sputum change", groupName: "cardioResp", description: "New or changed sputum, including green sputum." },
  { slug: "fever", label: "Fever", groupName: "systemic", description: "Fever or raised temperature." },
  { slug: "rigors", label: "Rigors", groupName: "systemic", description: "Rigors or shaking chills." },
  { slug: "infection-source", label: "Infection source", groupName: "systemic", description: "Features suggesting an infective source." },
  { slug: "worse-lying-flat", label: "Worse lying flat", groupName: "painPattern", description: "Pain worsens lying flat." },
  { slug: "better-sitting-forward", label: "Better sitting forward", groupName: "painPattern", description: "Pain improves sitting or leaning forward." },
  { slug: "recent-infection", label: "Recent infection", groupName: "riskFactors", description: "Recent viral or respiratory infection." },
  { slug: "heartburn", label: "Heartburn", groupName: "giFeatures", description: "Burning retrosternal discomfort or heartburn." },
  { slug: "worse-after-meals", label: "Worse after meals", groupName: "painPattern", description: "Symptoms worse after eating." },
  { slug: "acid-regurgitation", label: "Acid regurgitation", groupName: "giFeatures", description: "Acid reflux, sour taste, or regurgitation." },
  { slug: "antacid-relief", label: "Antacid relief", groupName: "giFeatures", description: "Symptoms improve with antacids." },
  { slug: "post-lifting-onset", label: "Post-lifting onset", groupName: "riskFactors", description: "Pain started after lifting or exertional strain." },
  { slug: "reproducible-chest-wall-tenderness", label: "Reproducible chest wall tenderness", groupName: "abdominalExam", description: "Pain reproducible on chest wall palpation." },
  { slug: "movement-related-chest-pain", label: "Movement-related chest pain", groupName: "painPattern", description: "Chest pain worse with movement, twisting, or arm movement." },
  { slug: "panic-features", label: "Panic features", groupName: "systemic", description: "Panic, hyperventilation, tingling, trembling, or overwhelming fear." },
  { slug: "indigestion-like-chest-pain", label: "Indigestion-like chest pain", groupName: "painPattern", description: "Indigestion-like chest discomfort that may represent ACS equivalent pain." },
  { slug: "acs-equivalent-pain", label: "ACS equivalent pain", groupName: "painPattern", description: "Atypical ACS-equivalent discomfort such as epigastric heaviness." },
  { slug: "epigastric-pain", label: "Epigastric pain", groupName: "painLocation", description: "Epigastric or upper abdominal pain." },
  { slug: "diabetic-context", label: "Diabetic context", groupName: "riskFactors", description: "Known diabetes or insulin-dependent context." },
];

const cases: ChestPainClinicalTestCase[] = [
  {
    slug: "chest-pain-v1-acs-classic-pressure-radiation",
    title: "ACS classic pressure with radiation and autonomic features",
    age: "64",
    pmh: "hypertension",
    social: "smoker",
    suspectedDiagnosis: "ACS",
    vignette: "Central crushing chest pressure radiating to the jaw and left arm with sweating and nausea. He has hypertension and smokes.",
    expectedLeadDiagnosisSlug: "acute-coronary-syndrome",
    expectedFeatureSlugs: ["chest_pain", "jaw_pain", "arm_pain", "sweating", "nausea", "hypertension", "smoking_history"],
    expectedRedFlagSlugs: ["acs-suspicion-pattern"],
    notes: "Strong chest pain v1 case: classic ACS pressure/radiation/autonomic pattern.",
  },
  {
    slug: "chest-pain-v1-pe-pleuritic-hypoxia-travel",
    title: "Pulmonary embolism with pleuritic pain, hypoxia, haemoptysis and travel",
    age: "42",
    sex: "female",
    observations: "HR 118 sats 90%",
    suspectedDiagnosis: "PE",
    vignette: "Sudden pleuritic chest pain with shortness of breath and coughing blood three days after long haul flight. HR 118 and oxygen saturations 90%.",
    expectedLeadDiagnosisSlug: "pulmonary-embolism",
    expectedFeatureSlugs: ["chest_pain", "sudden_onset", "pleuritic_pain", "sob", "haemoptysis", "long_haul_travel", "tachycardia", "hypoxia"],
    expectedRedFlagSlugs: ["pe-suspicion-pattern"],
    notes: "Strong chest pain v1 case: PE signal should dominate pneumonia/panic comparators.",
  },
  {
    slug: "chest-pain-v1-pneumothorax-unilateral-air-entry",
    title: "Pneumothorax with unilateral reduced air entry in tall thin smoker",
    age: "24",
    social: "smoker",
    suspectedDiagnosis: "Pneumothorax",
    vignette: "Sudden one sided pleuritic chest pain and shortness of breath. He is tall and thin with reduced air entry on the left.",
    expectedLeadDiagnosisSlug: "pneumothorax",
    expectedFeatureSlugs: ["chest_pain", "sudden_onset", "pleuritic_pain", "sob", "tall_thin_habitus", "unilateral_reduced_air_entry"],
    notes: "Strong chest pain v1 case: pneumothorax-specific exam should rank pneumothorax first.",
  },
  {
    slug: "chest-pain-v1-aortic-syndrome-tearing-collapse",
    title: "Acute aortic syndrome with tearing pain to back and collapse",
    age: "68",
    pmh: "hypertension",
    suspectedDiagnosis: "Aortic dissection",
    vignette: "Abrupt tearing chest pain radiating through to the back between the shoulder blades with collapse. Known hypertension.",
    expectedLeadDiagnosisSlug: "acute-aortic-syndrome",
    expectedFeatureSlugs: ["chest_pain", "tearing_pain", "back_radiation", "collapse", "hypertension", "older_age"],
    expectedRedFlagSlugs: ["acute-aortic-syndrome-pattern"],
    notes: "Strong chest pain v1 case: aortic catastrophe signal should outrank ACS.",
  },
  {
    slug: "chest-pain-v1-pneumonia-infective-pleuritic",
    title: "Pneumonia with progressive infective pleuritic pattern",
    age: "58",
    sex: "female",
    suspectedDiagnosis: "Pneumonia",
    vignette: "Progressive pleuritic chest pain and shortness of breath for four days with productive cough, green sputum, fever and rigors.",
    expectedLeadDiagnosisSlug: "pneumonia",
    expectedFeatureSlugs: ["chest_pain", "pleuritic_pain", "sob", "productive_cough", "sputum_change", "fever", "rigors", "infection_source"],
    forbiddenRedFlagSlugs: ["acs-suspicion-pattern", "acute-cholangitis-pattern", "high-risk-sepsis-pattern"],
    notes: "Strong chest pain v1 case: infective respiratory pattern should rank pneumonia first without unrelated red flags.",
  },
  {
    slug: "chest-pain-v1-pericarditis-positional-viral",
    title: "Pericarditis with positional pleuritic pain after viral illness",
    age: "31",
    suspectedDiagnosis: "Pericarditis",
    vignette: "Sharp central pleuritic chest pain worse lying flat and improved by sitting forward after a recent viral illness.",
    expectedLeadDiagnosisSlug: "pericarditis",
    expectedFeatureSlugs: ["chest_pain", "pleuritic_pain", "worse_lying_flat", "better_sitting_forward", "recent_infection"],
    notes: "Strong chest pain v1 case: positional viral pleuritic pain should rank pericarditis first.",
  },
  {
    slug: "chest-pain-v1-gord-meal-reflux-antacid",
    title: "GORD with meal-related burning reflux relieved by antacids",
    age: "29",
    keyNegatives: "no shortness of breath no sweating no radiation",
    suspectedDiagnosis: "GORD",
    vignette: "Burning retrosternal chest discomfort after a large spicy meal with acid reflux and sour taste, improved with antacids. No shortness of breath, sweating or radiation.",
    expectedLeadDiagnosisSlug: "gord",
    expectedFeatureSlugs: ["chest_pain", "heartburn", "worse_after_meals", "acid_regurgitation", "antacid_relief"],
    forbiddenRedFlagSlugs: ["acs-suspicion-pattern", "pe-suspicion-pattern"],
    notes: "Strong chest pain v1 case: reflux features should rank GORD first when cardiac/PE features are negated.",
  },
  {
    slug: "chest-pain-v1-msk-reproducible-lifting",
    title: "Musculoskeletal chest pain after lifting with reproducible tenderness",
    age: "34",
    keyNegatives: "no shortness of breath",
    suspectedDiagnosis: "Musculoskeletal chest pain",
    vignette: "Localized left chest wall pain after heavy lifting, reproducible on palpation and worse when twisting or moving the arm. No shortness of breath.",
    expectedLeadDiagnosisSlug: "musculoskeletal-chest-pain",
    expectedFeatureSlugs: ["chest_pain", "post_lifting_onset", "reproducible_chest_wall_tenderness", "movement_related_chest_pain"],
    forbiddenRedFlagSlugs: ["acs-suspicion-pattern", "pe-suspicion-pattern"],
    notes: "Strong chest pain v1 case: reproducible movement-related pain should rank MSK first.",
  },
  {
    slug: "chest-pain-v1-panic-hyperventilation-tingling",
    title: "Anxiety / panic with hyperventilation and tingling",
    age: "26",
    sex: "female",
    suspectedDiagnosis: "Panic attack",
    vignette: "Tight chest pain during a panic attack with hyperventilation, tingling fingers, trembling and overwhelming fear. Symptoms settled with breathing control.",
    expectedLeadDiagnosisSlug: "panic-anxiety",
    expectedFeatureSlugs: ["chest_pain", "panic_features"],
    forbiddenRedFlagSlugs: ["acs-suspicion-pattern", "pe-suspicion-pattern"],
    notes: "Strong chest pain v1 case: explicit panic physiology should rank panic/anxiety first.",
  },
  {
    slug: "chest-pain-v1-acs-epigastric-equivalent-diabetic",
    title: "ACS epigastric equivalent in older diabetic patient",
    age: "72",
    sex: "female",
    pmh: "diabetes hypertension",
    suspectedDiagnosis: "ACS",
    vignette: "A 72-year-old woman has indigestion-like epigastric and chest heaviness with nausea, sweating and shortness of breath. She has diabetes and hypertension.",
    expectedLeadDiagnosisSlug: "acute-coronary-syndrome",
    expectedFeatureSlugs: ["chest_pain", "indigestion_like_chest_pain", "acs_equivalent_pain", "epigastric_pain", "sweating", "nausea", "sob", "diabetic_context", "older_age"],
    expectedRedFlagSlugs: ["acs-suspicion-pattern"],
    notes: "Strong chest pain v1 case: atypical diabetic ACS equivalent should still rank ACS first.",
  },
  {
    slug: "hostile-chest-pain-acs-reflux-noise",
    title: "Hostile ACS beats GORD when reflux noise coexists with ischaemic features",
    age: "59",
    pmh: "hypertension",
    social: "smoker",
    suspectedDiagnosis: "GORD",
    vignette: "Burning central chest discomfort after dinner but also pressure radiating to the left arm with sweating and nausea. Hypertension and smoker.",
    expectedLeadDiagnosisSlug: "acute-coronary-syndrome",
    expectedFeatureSlugs: ["chest_pain", "arm_pain", "sweating", "nausea", "hypertension", "smoking_history"],
    expectedRedFlagSlugs: ["acs-suspicion-pattern"],
    notes: "Hostile chest pain v1 case: reflux noise must not bury ACS signal.",
  },
  {
    slug: "hostile-chest-pain-pe-pneumonia-noise",
    title: "Hostile PE beats pneumonia noise when hypoxia tachycardia and travel dominate",
    age: "45",
    sex: "female",
    observations: "HR 122 sats 89%",
    keyNegatives: "no fever",
    suspectedDiagnosis: "Pneumonia",
    vignette: "Pleuritic chest pain and shortness of breath after a long haul flight with mild cough. No fever. HR 122, sats 89%.",
    expectedLeadDiagnosisSlug: "pulmonary-embolism",
    expectedFeatureSlugs: ["chest_pain", "pleuritic_pain", "sob", "long_haul_travel", "tachycardia", "hypoxia"],
    expectedRedFlagSlugs: ["pe-suspicion-pattern"],
    notes: "Hostile chest pain v1 case: VTE physiology should outrank mild cough/pneumonia noise.",
  },
  {
    slug: "hostile-chest-pain-pneumothorax-pe-noise",
    title: "Hostile pneumothorax beats PE when unilateral air entry dominates",
    age: "22",
    social: "smoker",
    keyNegatives: "no travel no surgery no haemoptysis",
    suspectedDiagnosis: "PE",
    vignette: "Sudden pleuritic chest pain and shortness of breath while resting. Tall thin smoker with reduced air entry on the right. No travel, no surgery, no haemoptysis.",
    expectedLeadDiagnosisSlug: "pneumothorax",
    expectedFeatureSlugs: ["chest_pain", "sudden_onset", "pleuritic_pain", "sob", "tall_thin_habitus", "unilateral_reduced_air_entry"],
    notes: "Hostile chest pain v1 case: unilateral pneumothorax signature should beat generic PE features.",
  },
  {
    slug: "hostile-chest-pain-aortic-syndrome-acs-noise",
    title: "Hostile aortic syndrome beats ACS when tearing back-radiating collapse dominates",
    age: "71",
    pmh: "hypertension",
    suspectedDiagnosis: "ACS",
    vignette: "A 71-year-old man has severe chest pain with sweating, but it was abrupt tearing pain radiating to the back and he collapsed. Known hypertension.",
    expectedLeadDiagnosisSlug: "acute-aortic-syndrome",
    expectedFeatureSlugs: ["chest_pain", "tearing_pain", "back_radiation", "collapse", "hypertension", "sweating", "older_age"],
    expectedRedFlagSlugs: ["acute-aortic-syndrome-pattern"],
    forbiddenRedFlagSlugs: ["hypoglycaemia-urgent-reversible-cause-pattern"],
    notes: "Hostile chest pain v1 case: sweating/ACS noise should not bury aortic catastrophe pattern.",
  },
  {
    slug: "hostile-chest-pain-pneumonia-pe-noise",
    title: "Hostile pneumonia beats PE when infective progressive pattern dominates",
    age: "63",
    keyNegatives: "no haemoptysis no travel",
    suspectedDiagnosis: "PE",
    vignette: "Pleuritic chest pain with shortness of breath, fever, rigors, productive cough and green sputum worsening over five days. No haemoptysis or travel.",
    expectedLeadDiagnosisSlug: "pneumonia",
    expectedFeatureSlugs: ["chest_pain", "pleuritic_pain", "sob", "fever", "rigors", "productive_cough", "sputum_change", "infection_source"],
    forbiddenRedFlagSlugs: ["acs-suspicion-pattern", "acute-cholangitis-pattern", "high-risk-sepsis-pattern"],
    notes: "Hostile chest pain v1 case: infection cluster should beat PE when VTE clues are negated.",
  },
  {
    slug: "hostile-chest-pain-pericarditis-pe-noise",
    title: "Hostile pericarditis beats PE when positional viral pattern dominates",
    age: "28",
    keyNegatives: "no haemoptysis no travel normal oxygen saturations",
    suspectedDiagnosis: "PE",
    vignette: "Sharp pleuritic central chest pain after a viral illness, worse lying flat and better leaning forward. No haemoptysis, no travel, normal oxygen saturations.",
    expectedLeadDiagnosisSlug: "pericarditis",
    expectedFeatureSlugs: ["chest_pain", "pleuritic_pain", "recent_infection", "worse_lying_flat", "better_sitting_forward"],
    notes: "Hostile chest pain v1 case: positional pericarditic pattern should beat PE framing.",
  },
  {
    slug: "hostile-chest-pain-gord-acs-noise",
    title: "Hostile GORD beats ACS when reflux features dominate and cardiac features are absent",
    age: "36",
    keyNegatives: "no radiation no sweating no shortness of breath",
    suspectedDiagnosis: "ACS",
    vignette: "Burning retrosternal discomfort after eating with acid reflux, sour taste and antacid relief. No radiation, no sweating, no shortness of breath.",
    expectedLeadDiagnosisSlug: "gord",
    expectedFeatureSlugs: ["chest_pain", "heartburn", "worse_after_meals", "acid_regurgitation"],
    forbiddenRedFlagSlugs: ["acs-suspicion-pattern", "pe-suspicion-pattern"],
    notes: "Hostile chest pain v1 case: reflux should beat ACS when ischaemic support is explicitly absent.",
  },
  {
    slug: "hostile-chest-pain-msk-acs-pe-noise",
    title: "Hostile musculoskeletal pain beats ACS and PE when reproducible movement pattern dominates",
    age: "41",
    keyNegatives: "no sweating no nausea no radiation no shortness of breath",
    suspectedDiagnosis: "ACS",
    vignette: "Sharp localized chest pain after lifting boxes, reproducible on palpation and worse when twisting. No sweating, nausea, radiation or shortness of breath.",
    expectedLeadDiagnosisSlug: "musculoskeletal-chest-pain",
    expectedFeatureSlugs: ["chest_pain", "post_lifting_onset", "reproducible_chest_wall_tenderness", "movement_related_chest_pain"],
    forbiddenRedFlagSlugs: ["acs-suspicion-pattern", "pe-suspicion-pattern"],
    notes: "Hostile chest pain v1 case: reproducible chest wall findings should beat danger diagnoses when danger support is negated.",
  },
  {
    slug: "hostile-chest-pain-panic-pe-noise",
    title: "Hostile panic beats PE when panic physiology is explicit and oxygen/VTE clues are absent",
    age: "24",
    sex: "female",
    keyNegatives: "normal oxygen saturations no pleuritic pain no travel no haemoptysis",
    suspectedDiagnosis: "PE",
    vignette: "Chest tightness with hyperventilation, tingling fingers, trembling and panic during an exam. Oxygen saturations normal, no pleuritic pain, no travel, no haemoptysis.",
    expectedLeadDiagnosisSlug: "panic-anxiety",
    expectedFeatureSlugs: ["chest_pain", "panic_features"],
    forbiddenRedFlagSlugs: ["acs-suspicion-pattern", "pe-suspicion-pattern"],
    notes: "Hostile chest pain v1 case: panic physiology should beat PE when VTE/oxygen clues are absent.",
  },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toFeatureToken(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function findOverlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function getFeatureSlugs(testCase: ChestPainClinicalTestCase) {
  return unique(testCase.expectedFeatureSlugs.map(toFeatureToken));
}

function getExpectedRedFlagSlugs(testCase: ChestPainClinicalTestCase) {
  return unique((testCase.expectedRedFlagSlugs ?? []).map(slugify));
}

function getForbiddenRedFlagSlugs(testCase: ChestPainClinicalTestCase) {
  return unique((testCase.forbiddenRedFlagSlugs ?? []).map(slugify));
}

function buildDiagnosisSlugSet() {
  return new Set(DIAGNOSIS_RULES.flatMap((diagnosis) => [slugify(diagnosis.name)]));
}

function buildRedFlagSlugSet() {
  return new Set([
    ...GUIDELINE_RULES.map((rule) => slugify(rule.title)),
    "acute-aortic-syndrome-pattern",
    "hypoglycaemia-urgent-reversible-cause-pattern",
  ]);
}

async function main() {
  const existingSeedLabels = await prisma.featureLabel.findMany({
    where: { slug: { in: featureLabelSeeds.map((label) => label.slug) } },
    select: { slug: true },
  });
  const existingSeedLabelSlugs = new Set(existingSeedLabels.map((label) => label.slug));
  const labelsAdded: string[] = [];
  const labelsUpdated: string[] = [];

  for (const featureLabel of featureLabelSeeds) {
    const savedLabel = await prisma.featureLabel.upsert({
      where: { slug: featureLabel.slug },
      create: {
        slug: featureLabel.slug,
        label: featureLabel.label,
        description: featureLabel.description,
        groupName: featureLabel.groupName,
        status: CONTENT_STATUS,
      },
      update: {
        label: featureLabel.label,
        description: featureLabel.description,
        groupName: featureLabel.groupName,
        status: CONTENT_STATUS,
      },
      select: { slug: true },
    });

    if (existingSeedLabelSlugs.has(savedLabel.slug)) {
      labelsUpdated.push(savedLabel.slug);
    } else {
      labelsAdded.push(savedLabel.slug);
    }
  }

  const featureLabels = await prisma.featureLabel.findMany({
    select: { id: true, slug: true },
  });
  const featureLabelBySlug = new Map(
    featureLabels.flatMap((label) => [
      [label.slug, label.id],
      [toFeatureToken(label.slug), label.id],
    ]),
  );
  const diagnosisSlugs = buildDiagnosisSlugSet();
  const redFlagSlugs = buildRedFlagSlugSet();

  const missingFeatureSlugs = unique(
    cases.flatMap((testCase) =>
      testCase.expectedFeatureSlugs.filter(
        (slug) => !featureLabelBySlug.has(slug) && !featureLabelBySlug.has(toFeatureToken(slug)),
      ),
    ),
  );
  const missingDiagnosisSlugs = unique(
    cases
      .map((testCase) => testCase.expectedLeadDiagnosisSlug)
      .filter((slug) => !diagnosisSlugs.has(slug)),
  );
  const missingRedFlagSlugs = unique(
    cases.flatMap((testCase) =>
      [
        ...getExpectedRedFlagSlugs(testCase),
        ...getForbiddenRedFlagSlugs(testCase),
      ].filter((slug) => !redFlagSlugs.has(slug)),
    ),
  );
  const redFlagRubricOverlaps = cases
    .map((testCase) => ({
      slug: testCase.slug,
      overlap: findOverlap(getExpectedRedFlagSlugs(testCase), getForbiddenRedFlagSlugs(testCase)),
    }))
    .filter((item) => item.overlap.length > 0);

  if (missingFeatureSlugs.length || missingDiagnosisSlugs.length || missingRedFlagSlugs.length || redFlagRubricOverlaps.length) {
    console.error(
      JSON.stringify(
        {
          imported: false,
          labelsAdded,
          labelsUpdated,
          missingFeatureSlugs,
          missingDiagnosisSlugs,
          missingRedFlagSlugs,
          redFlagRubricOverlaps,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  const existingCases = await prisma.clinicalTestCase.findMany({
    where: { slug: { in: cases.map((testCase) => testCase.slug) } },
    select: { slug: true },
  });
  const existingCaseSlugs = new Set(existingCases.map((testCase) => testCase.slug));

  let created = 0;
  let updated = 0;

  for (const testCase of cases) {
    const featureSlugs = getFeatureSlugs(testCase);
    const featureIds = featureSlugs.map((slug) => {
      const id = featureLabelBySlug.get(slug);
      if (!id) {
        throw new Error(`Unexpected missing feature label after validation: ${slug}`);
      }
      return id;
    });
    const featureRubricJson = {
      requiredExpectedFeatureSlugs: featureSlugs,
      optionalExpectedFeatureSlugs: [],
    };
    const redFlagRubricJson = {
      expectedRedFlagSlugs: getExpectedRedFlagSlugs(testCase),
      forbiddenRedFlagSlugs: getForbiddenRedFlagSlugs(testCase),
    };

    const saved = await prisma.clinicalTestCase.upsert({
      where: { slug: testCase.slug },
      create: {
        slug: testCase.slug,
        title: testCase.title,
        presentationBlock: PRESENTATION_BLOCK,
        vignette: testCase.vignette,
        expectedLeadDiagnosis: testCase.expectedLeadDiagnosisSlug,
        expectedLeadDiagnosisSlug: testCase.expectedLeadDiagnosisSlug,
        expectedPresentationBlock: "chest-pain",
        expectedFeatureSlugsJson: featureRubricJson,
        expectedRedFlagSlugsJson: redFlagRubricJson,
        notes: testCase.notes,
        status: STATUS,
        expectedFeatures: {
          create: featureIds.map((featureLabelId) => ({
            featureLabelId,
            required: true,
          })),
        },
      },
      update: {
        title: testCase.title,
        presentationBlock: PRESENTATION_BLOCK,
        vignette: testCase.vignette,
        expectedLeadDiagnosis: testCase.expectedLeadDiagnosisSlug,
        expectedLeadDiagnosisSlug: testCase.expectedLeadDiagnosisSlug,
        expectedPresentationBlock: "chest-pain",
        expectedFeatureSlugsJson: featureRubricJson,
        expectedRedFlagSlugsJson: redFlagRubricJson,
        notes: testCase.notes,
        status: STATUS,
        expectedFeatures: {
          deleteMany: {},
          create: featureIds.map((featureLabelId) => ({
            featureLabelId,
            required: true,
          })),
        },
      },
      select: { slug: true },
    });

    if (existingCaseSlugs.has(saved.slug)) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        imported: true,
        labelsAdded,
        labelsUpdated,
        created,
        updated,
        totalRequested: cases.length,
        slugs: cases.map((testCase) => testCase.slug),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Chest-pain v1 test-case import failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
