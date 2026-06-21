import { PrismaClient } from "@prisma/client";
import { DIAGNOSIS_RULES } from "../lib/domain/diagnosisRules";
import { GUIDELINE_RULES } from "../lib/domain/guidelineRules";

type BreathlessnessClinicalTestCase = {
  slug: string;
  title: string;
  vignette: string;
  expectedLeadDiagnosisSlug: string;
  expectedFeatureSlugs: string[];
  expectedRedFlagSlugs?: string[];
  forbiddenRedFlagSlugs?: string[];
  notes: string;
};

const prisma = new PrismaClient();

const PRESENTATION_BLOCK = "breathlessness";
const EXPECTED_PRESENTATION_BLOCK = "breathlessness-pleuritic-chest-pain";
const STATUS = "DRAFT";
const CONTENT_STATUS = "PUBLISHED";

const cases: BreathlessnessClinicalTestCase[] = [
  {
    slug: "breathlessness-v1-pe-flight-pleuritic-hypoxia",
    title: "PE after long-haul flight with pleuritic pain, tachycardia and hypoxia",
    vignette:
      "A 45-year-old woman has sudden shortness of breath with pleuritic chest pain after a long haul flight. She is tachycardic and hypoxic with HR 124 and sats 89%.",
    expectedLeadDiagnosisSlug: "pulmonary-embolism",
    expectedFeatureSlugs: ["sob", "pleuritic_pain", "chest_pain", "sudden_onset", "long_haul_travel", "tachycardia", "hypoxia"],
    expectedRedFlagSlugs: ["pe-suspicion-pattern"],
    notes: "Strong breathlessness v1 case: VTE risk plus pleuritic dyspnoea and abnormal physiology should rank PE first.",
  },
  {
    slug: "breathlessness-v1-pneumonia-productive-crackles-hypoxia",
    title: "Pneumonia with fever, productive cough, focal crackles and hypoxia",
    vignette:
      "A 61-year-old has four days of worsening shortness of breath with fever, productive cough, green sputum and focal crackles at the right base. Oxygen saturations are 90%.",
    expectedLeadDiagnosisSlug: "pneumonia",
    expectedFeatureSlugs: ["sob", "fever", "productive_cough", "sputum_change", "crackles", "hypoxia", "progressive_course"],
    forbiddenRedFlagSlugs: ["pe-suspicion-pattern", "acs-suspicion-pattern"],
    notes: "Strong breathlessness v1 case: consolidation/infective pattern should rank pneumonia first without PE/ACS overfire.",
  },
  {
    slug: "breathlessness-v1-asthma-severe-speech-hypoxia",
    title: "Asthma exacerbation with wheeze, inhaler use and inability to speak full sentences",
    vignette:
      "A 23-year-old with known asthma has worsening shortness of breath and audible wheeze. She is using her blue inhaler more and can't speak full sentences. Sats 91%, RR 30.",
    expectedLeadDiagnosisSlug: "asthma-exacerbation",
    expectedFeatureSlugs: ["sob", "wheeze", "known_asthma", "asthma_history", "inhaler_use", "increased_inhaler_use", "unable_to_speak_full_sentences", "tachypnoea", "hypoxia"],
    expectedRedFlagSlugs: ["severe-asthma-pattern"],
    notes: "Strong breathlessness v1 case: severe asthma physiology should beat panic.",
  },
  {
    slug: "breathlessness-v1-copd-smoker-sputum-wheeze",
    title: "COPD exacerbation in smoker with sputum change and wheeze",
    vignette:
      "A 70-year-old man with known COPD and a long smoking history has worsening breathlessness over several days, wheeze, productive cough and increased green sputum.",
    expectedLeadDiagnosisSlug: "copd-exacerbation",
    expectedFeatureSlugs: ["sob", "known_copd", "copd_history", "smoking_history", "wheeze", "productive_cough", "sputum_change", "progressive_course"],
    notes: "Strong breathlessness v1 case: COPD history plus sputum change should rank COPD exacerbation first.",
  },
  {
    slug: "breathlessness-v1-heart-failure-fluid-overload",
    title: "Acute heart failure with orthopnoea, bibasal crackles, oedema and raised JVP",
    vignette:
      "A 78-year-old man has acute breathlessness with orthopnoea, waking at night gasping, bibasal crackles, raised JVP and bilateral ankle oedema. No fever or productive cough.",
    expectedLeadDiagnosisSlug: "heart-failure",
    expectedFeatureSlugs: ["sob", "orthopnoea", "paroxysmal_nocturnal_dyspnoea", "bibasal_crackles", "raised_jvp", "peripheral_oedema", "ankle_swelling"],
    expectedRedFlagSlugs: ["acute-heart-failure-pulmonary-oedema-pattern"],
    notes: "Strong breathlessness v1 case: fluid overload pattern should rank heart failure first.",
  },
  {
    slug: "breathlessness-v1-pneumothorax-unilateral-air-entry",
    title: "Pneumothorax with sudden unilateral pleuritic breathlessness and reduced air entry",
    vignette:
      "A 24-year-old male smoker has sudden shortness of breath with right-sided pleuritic chest pain. He has unilateral reduced air entry and hyperresonance on the right.",
    expectedLeadDiagnosisSlug: "pneumothorax",
    expectedFeatureSlugs: ["sob", "sudden_onset", "pleuritic_pain", "chest_pain", "unilateral_reduced_air_entry", "reduced_air_entry", "hyperresonance", "smoking_history"],
    notes: "Strong breathlessness v1 case: unilateral pneumothorax signs should rank pneumothorax first.",
  },
  {
    slug: "breathlessness-v1-acs-equivalent-diabetic",
    title: "ACS breathlessness equivalent in older diabetic patient",
    vignette:
      "A 74-year-old diabetic patient with hypertension has shortness of breath, chest heaviness, nausea and sweating. No pleuritic pain, no cough and no fever.",
    expectedLeadDiagnosisSlug: "acute-coronary-syndrome",
    expectedFeatureSlugs: ["sob", "chest_pain", "nausea", "sweating", "diabetic_context", "hypertension", "older_age"],
    expectedRedFlagSlugs: ["acs-suspicion-pattern"],
    forbiddenRedFlagSlugs: ["pe-suspicion-pattern"],
    notes: "Strong breathlessness v1 case: ACS-equivalent autonomic pattern should beat respiratory mimics.",
  },
  {
    slug: "breathlessness-v1-panic-normal-exam-tingling",
    title: "Panic attack with tingling, hyperventilation, normal sats and normal exam",
    vignette:
      "A 27-year-old has sudden breathlessness during a panic attack with hyperventilation, tingling fingers and perioral paraesthesia. Normal sats and normal chest exam. No chest pain, no wheeze.",
    expectedLeadDiagnosisSlug: "panic-anxiety",
    expectedFeatureSlugs: ["sob", "panic_features", "tingling", "perioral_paraesthesia", "normal_exam"],
    forbiddenRedFlagSlugs: ["pe-suspicion-pattern", "severe-asthma-pattern", "acs-suspicion-pattern"],
    notes: "Strong breathlessness v1 case: reassuring exam/vitals plus panic physiology should rank panic/anxiety first.",
  },
  {
    slug: "breathlessness-v1-anaemia-heavy-periods",
    title: "Anaemia with progressive dyspnoea, pallor, fatigue and heavy menstrual bleeding",
    vignette:
      "A 36-year-old woman has several months of progressive exertional shortness of breath with marked fatigue, pallor and very heavy periods. Chest is clear with no oedema.",
    expectedLeadDiagnosisSlug: "anaemia",
    expectedFeatureSlugs: ["sob", "fatigue", "pallor", "heavy_menstrual_bleeding", "chronic_course", "normal_exam"],
    notes: "Strong breathlessness v1 case: progressive anaemia pattern should beat heart failure.",
  },
  {
    slug: "breathlessness-v1-dka-kussmaul-polyuria",
    title: "DKA with Kussmaul breathing, diabetes, polyuria, polydipsia and vomiting",
    vignette:
      "A 19-year-old with type 1 diabetes has deep rapid Kussmaul breathing, vomiting, abdominal pain, dehydration, polyuria and polydipsia. Glucose high.",
    expectedLeadDiagnosisSlug: "diabetic-ketoacidosis",
    expectedFeatureSlugs: ["diabetic_context", "kussmaul_breathing", "tachypnoea", "vomiting", "abdominal_pain", "dehydration", "polyuria", "polydipsia", "hyperglycaemia"],
    expectedRedFlagSlugs: ["dka-metabolic-acidosis-pattern"],
    notes: "Strong breathlessness v1 case: metabolic respiratory compensation should rank DKA first.",
  },
  {
    slug: "hostile-breathlessness-pneumonia-pe-noise",
    title: "Hostile pneumonia beats PE when infection dominates",
    vignette:
      "A 52-year-old has pleuritic chest pain and shortness of breath with fever, productive cough, green sputum and focal crackles. No travel, no surgery, no haemoptysis. Sats 94%.",
    expectedLeadDiagnosisSlug: "pneumonia",
    expectedFeatureSlugs: ["sob", "pleuritic_pain", "chest_pain", "fever", "productive_cough", "sputum_change", "crackles"],
    forbiddenRedFlagSlugs: ["pe-suspicion-pattern"],
    notes: "Hostile breathlessness v1 case: pleuritic infection should not overfire PE without VTE support.",
  },
  {
    slug: "hostile-breathlessness-pe-cough-noise",
    title: "Hostile PE beats pneumonia with mild cough noise",
    vignette:
      "A 49-year-old has shortness of breath with mild cough after long haul travel, haemoptysis, tachycardia and hypoxia. Pleuritic pain is present. HR 118, sats 88%.",
    expectedLeadDiagnosisSlug: "pulmonary-embolism",
    expectedFeatureSlugs: ["sob", "cough", "long_haul_travel", "haemoptysis", "tachycardia", "hypoxia", "pleuritic_pain"],
    expectedRedFlagSlugs: ["pe-suspicion-pattern"],
    notes: "Hostile breathlessness v1 case: VTE risk and physiology should beat mild cough noise.",
  },
  {
    slug: "hostile-breathlessness-asthma-panic-noise",
    title: "Hostile asthma beats panic with low peak flow and hypoxia",
    vignette:
      "A 29-year-old with asthma is anxious and breathless, but she has wheeze, poor peak flow, accessory muscle use and sats 90%. She cannot speak full sentences.",
    expectedLeadDiagnosisSlug: "asthma-exacerbation",
    expectedFeatureSlugs: ["sob", "wheeze", "known_asthma", "poor_peak_flow", "accessory_muscle_use", "hypoxia", "unable_to_speak_full_sentences"],
    expectedRedFlagSlugs: ["severe-asthma-pattern"],
    notes: "Hostile breathlessness v1 case: objective severe asthma features should beat anxiety framing.",
  },
  {
    slug: "hostile-breathlessness-panic-pe-asthma-noise",
    title: "Hostile panic beats PE/asthma when vitals and exam are reassuring",
    vignette:
      "A 22-year-old has breathlessness during a panic attack with hyperventilation, tingling fingers and perioral paraesthesia. Normal sats, normal chest exam, no chest pain, no wheeze, no travel and no haemoptysis.",
    expectedLeadDiagnosisSlug: "panic-anxiety",
    expectedFeatureSlugs: ["sob", "panic_features", "tingling", "perioral_paraesthesia", "normal_exam"],
    forbiddenRedFlagSlugs: ["pe-suspicion-pattern", "severe-asthma-pattern", "acs-suspicion-pattern"],
    notes: "Hostile breathlessness v1 case: panic should win when danger physiology is explicitly absent.",
  },
  {
    slug: "hostile-breathlessness-heart-failure-pneumonia-noise",
    title: "Hostile heart failure beats pneumonia without infective sputum",
    vignette:
      "An 82-year-old has breathlessness with orthopnoea, raised JVP, bibasal crackles and peripheral oedema. No fever and no productive cough.",
    expectedLeadDiagnosisSlug: "heart-failure",
    expectedFeatureSlugs: ["sob", "orthopnoea", "raised_jvp", "bibasal_crackles", "peripheral_oedema"],
    expectedRedFlagSlugs: ["acute-heart-failure-pulmonary-oedema-pattern"],
    notes: "Hostile breathlessness v1 case: fluid overload should beat pneumonia when infection features are absent.",
  },
  {
    slug: "hostile-breathlessness-copd-asthma-noise",
    title: "Hostile COPD beats asthma in older smoker with COPD and sputum change",
    vignette:
      "A 73-year-old older smoker with known COPD has breathlessness, wheeze, productive cough and increased sputum over several days.",
    expectedLeadDiagnosisSlug: "copd-exacerbation",
    expectedFeatureSlugs: ["sob", "wheeze", "known_copd", "copd_history", "smoking_history", "productive_cough", "sputum_change", "progressive_course", "older_age"],
    notes: "Hostile breathlessness v1 case: COPD history and sputum change should beat asthma.",
  },
  {
    slug: "hostile-breathlessness-pneumothorax-pe-noise",
    title: "Hostile pneumothorax beats PE with unilateral reduced air entry and hyperresonance",
    vignette:
      "A 25-year-old man has sudden breathlessness and pleuritic chest pain. There is unilateral reduced air entry with hyperresonance. No travel, no haemoptysis.",
    expectedLeadDiagnosisSlug: "pneumothorax",
    expectedFeatureSlugs: ["sob", "sudden_onset", "pleuritic_pain", "chest_pain", "unilateral_reduced_air_entry", "hyperresonance"],
    forbiddenRedFlagSlugs: ["pe-suspicion-pattern"],
    notes: "Hostile breathlessness v1 case: pneumothorax-specific signs should beat PE.",
  },
  {
    slug: "hostile-breathlessness-acs-pe-noise",
    title: "Hostile ACS beats PE in diabetic patient with autonomic chest heaviness",
    vignette:
      "A 69-year-old with type 2 diabetes and hypertension has shortness of breath with chest heaviness, nausea and sweating. No pleuritic pain, no haemoptysis and no travel.",
    expectedLeadDiagnosisSlug: "acute-coronary-syndrome",
    expectedFeatureSlugs: ["sob", "chest_pain", "nausea", "sweating", "diabetic_context", "hypertension", "older_age"],
    expectedRedFlagSlugs: ["acs-suspicion-pattern"],
    forbiddenRedFlagSlugs: ["pe-suspicion-pattern"],
    notes: "Hostile breathlessness v1 case: ACS equivalent should beat PE without pleuritic/VTE support.",
  },
  {
    slug: "hostile-breathlessness-dka-sepsis-noise",
    title: "Hostile DKA beats sepsis without infection or instability",
    vignette:
      "A 31-year-old with diabetes has Kussmaul breathing, polyuria, polydipsia, vomiting and dehydration. Glucose high. No fever, no cough and no infective symptoms.",
    expectedLeadDiagnosisSlug: "diabetic-ketoacidosis",
    expectedFeatureSlugs: ["diabetic_context", "kussmaul_breathing", "tachypnoea", "polyuria", "polydipsia", "vomiting", "dehydration", "hyperglycaemia"],
    expectedRedFlagSlugs: ["dka-metabolic-acidosis-pattern"],
    forbiddenRedFlagSlugs: ["high-risk-sepsis-pattern"],
    notes: "Hostile breathlessness v1 case: metabolic acidosis should beat sepsis when infection is absent.",
  },
  {
    slug: "hostile-breathlessness-anaemia-heart-failure-noise",
    title: "Hostile anaemia beats heart failure without overload",
    vignette:
      "A 34-year-old woman has progressive exertional breathlessness for months with pallor, fatigue and heavy menstrual bleeding. No crackles, no oedema and JVP is not raised.",
    expectedLeadDiagnosisSlug: "anaemia",
    expectedFeatureSlugs: ["sob", "pallor", "fatigue", "heavy_menstrual_bleeding", "chronic_course"],
    notes: "Hostile breathlessness v1 case: anaemia should beat heart failure when overload signs are absent.",
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

function toFeatureLabelSlug(value: string) {
  return slugify(toFeatureToken(value));
}

function humanizeFeature(value: string) {
  return toFeatureToken(value)
    .split("_")
    .map((word) => word === "sob" ? "SOB" : word)
    .join(" ");
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function findOverlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function getFeatureSlugs(testCase: BreathlessnessClinicalTestCase) {
  return unique(testCase.expectedFeatureSlugs.map(toFeatureToken));
}

function getExpectedRedFlagSlugs(testCase: BreathlessnessClinicalTestCase) {
  return unique((testCase.expectedRedFlagSlugs ?? []).map(slugify));
}

function getForbiddenRedFlagSlugs(testCase: BreathlessnessClinicalTestCase) {
  return unique((testCase.forbiddenRedFlagSlugs ?? []).map(slugify));
}

function buildDiagnosisSlugSet() {
  return new Set(DIAGNOSIS_RULES.map((diagnosis) => slugify(diagnosis.name)));
}

function buildRedFlagSlugSet() {
  return new Set([
    ...GUIDELINE_RULES.map((rule) => slugify(rule.title)),
    "acute-aortic-syndrome-pattern",
    "hypoglycaemia-urgent-reversible-cause-pattern",
  ]);
}

async function main() {
  const featureLabelSlugs = unique(
    cases.flatMap((testCase) => testCase.expectedFeatureSlugs.map(toFeatureLabelSlug)),
  );
  const existingSeedLabels = await prisma.featureLabel.findMany({
    where: { slug: { in: featureLabelSlugs } },
    select: { slug: true },
  });
  const existingSeedLabelSlugs = new Set(existingSeedLabels.map((label) => label.slug));
  const labelsAdded: string[] = [];
  const labelsUpdated: string[] = [];

  for (const slug of featureLabelSlugs) {
    const savedLabel = await prisma.featureLabel.upsert({
      where: { slug },
      create: {
        slug,
        label: humanizeFeature(slug),
        description: `Breathlessness v1 feature: ${humanizeFeature(slug)}.`,
        groupName: "breathlessness",
        status: CONTENT_STATUS,
      },
      update: {
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
      getFeatureSlugs(testCase).filter(
        (slug) => !featureLabelBySlug.has(slug) && !featureLabelBySlug.has(toFeatureLabelSlug(slug)),
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
      const id = featureLabelBySlug.get(slug) ?? featureLabelBySlug.get(toFeatureLabelSlug(slug));
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
        expectedPresentationBlock: EXPECTED_PRESENTATION_BLOCK,
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
        expectedPresentationBlock: EXPECTED_PRESENTATION_BLOCK,
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
        presentationBlock: PRESENTATION_BLOCK,
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
    console.error("Breathlessness v1 test-case import failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
