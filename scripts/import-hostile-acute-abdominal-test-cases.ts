import { PrismaClient } from "@prisma/client";
import { GUIDELINE_RULES } from "../lib/domain/guidelineRules";
import { acuteAbdominalPainDiagnoses } from "../lib/domain/presentationBlocks/acuteAbdominalPain";

type HostileClinicalTestCase = {
  slug: string;
  title: string;
  vignette: string;
  expectedLeadDiagnosisSlug: string;
  expectedFeatureSlugs: string[];
  optionalExpectedFeatureSlugs?: string[];
  expectedRedFlagSlugs: string[];
  forbiddenRedFlagSlugs?: string[];
  notes: string;
};

type FeatureLabelSeed = {
  slug: string;
  label: string;
  groupName: string;
  description: string;
  phrases: Array<{
    slug: string;
    phrase: string;
    notes?: string;
  }>;
};

const prisma = new PrismaClient();

const PRESENTATION_BLOCK = "acute_abdominal_pain";
const STATUS = "DRAFT";
const CONTENT_STATUS = "PUBLISHED";

const featureLabelSeeds: FeatureLabelSeed[] = [
  {
    slug: "pain-migration-to-rif",
    label: "Pain migration to RIF",
    groupName: "painPattern",
    description: "Pain that starts centrally or peri-umbilically then localises to the right iliac fossa.",
    phrases: [
      {
        slug: "pain-migration-to-rif-started-central-moved-rif",
        phrase: "started central then moved to the right iliac fossa",
      },
      {
        slug: "pain-migration-to-rif-started-centrally-moved-rif",
        phrase: "started centrally then moved to the right iliac fossa",
      },
      {
        slug: "pain-migration-to-rif-began-centrally-now-rif",
        phrase: "began centrally and is now sharp in the right iliac fossa",
      },
      {
        slug: "pain-migration-to-rif-umbilicus-to-rif",
        phrase: "started around the umbilicus then moved to the right iliac fossa",
      },
    ],
  },
  {
    slug: "pregnancy-possible",
    label: "Pregnancy possible",
    groupName: "gynae",
    description: "Pregnancy is possible, suspected, or confirmed by history or test.",
    phrases: [
      { slug: "pregnancy-possible-could-be-pregnant", phrase: "could be pregnant" },
      { slug: "pregnancy-possible-pregnancy-possible", phrase: "pregnancy possible" },
      { slug: "pregnancy-possible-positive-pregnancy-test", phrase: "positive pregnancy test" },
    ],
  },
  {
    slug: "diabetic-context",
    label: "Diabetic context",
    groupName: "metabolic",
    description: "Known diabetes or insulin-dependent context.",
    phrases: [
      { slug: "diabetic-context-type-1-diabetes", phrase: "type 1 diabetes" },
      { slug: "diabetic-context-type-2-diabetes", phrase: "type 2 diabetes" },
      { slug: "diabetic-context-diabetic", phrase: "diabetic" },
      { slug: "diabetic-context-on-insulin", phrase: "on insulin" },
    ],
  },
  {
    slug: "polyuria",
    label: "Polyuria",
    groupName: "metabolic",
    description: "Passing unusually large amounts of urine.",
    phrases: [
      { slug: "polyuria-passing-lots-of-urine", phrase: "passing lots of urine" },
      { slug: "polyuria-peeing-a-lot", phrase: "peeing a lot" },
      { slug: "polyuria-polyuria", phrase: "polyuria" },
    ],
  },
  {
    slug: "polydipsia",
    label: "Polydipsia",
    groupName: "metabolic",
    description: "Excessive thirst.",
    phrases: [
      { slug: "polydipsia-marked-thirst", phrase: "marked thirst" },
      { slug: "polydipsia-very-thirsty", phrase: "very thirsty" },
      { slug: "polydipsia-excessive-thirst", phrase: "excessive thirst" },
    ],
  },
  {
    slug: "ketosis-breath",
    label: "Ketosis breath",
    groupName: "metabolic",
    description: "Fruity or ketotic breath suggesting ketosis.",
    phrases: [
      { slug: "ketosis-breath-fruity-breath", phrase: "fruity breath" },
      { slug: "ketosis-breath-ketotic-breath", phrase: "ketotic breath" },
      { slug: "ketosis-breath-acetone-breath", phrase: "acetone breath" },
    ],
  },
  {
    slug: "distension",
    label: "Abdominal distension",
    groupName: "abdominalExam",
    description: "Swollen, bloated, or distended abdomen.",
    phrases: [
      { slug: "distension-distended-abdomen", phrase: "distended abdomen" },
      { slug: "distension-swollen-distended-abdomen", phrase: "swollen distended abdomen" },
      { slug: "distension-abdominal-distension", phrase: "abdominal distension" },
    ],
  },
  {
    slug: "obstipation",
    label: "Obstipation",
    groupName: "giFeatures",
    description: "Constipation with failure to pass stool or flatus.",
    phrases: [
      { slug: "obstipation-not-opened-bowels-or-passed-flatus", phrase: "not opened bowels or passed flatus" },
      { slug: "obstipation-no-bowel-motion-and-no-flatus", phrase: "no bowel motion and no flatus" },
      { slug: "obstipation-constipation-not-passed-wind", phrase: "constipation and has not passed wind" },
    ],
  },
  {
    slug: "unable-to-pass-flatus",
    label: "Unable to pass flatus",
    groupName: "giFeatures",
    description: "Unable to pass wind or flatus.",
    phrases: [
      { slug: "unable-to-pass-flatus-not-passed-wind", phrase: "not passed wind" },
      { slug: "unable-to-pass-flatus-cannot-pass-wind", phrase: "cannot pass wind" },
      { slug: "unable-to-pass-flatus-unable-to-pass-flatus", phrase: "unable to pass flatus" },
    ],
  },
  {
    slug: "cva-tenderness",
    label: "CVA tenderness",
    groupName: "urinary",
    description: "Renal angle or costovertebral angle tenderness.",
    phrases: [
      { slug: "cva-tenderness-renal-angle-tenderness", phrase: "renal angle tenderness" },
      { slug: "cva-tenderness-costovertebral-angle-tenderness", phrase: "costovertebral angle tenderness" },
      { slug: "cva-tenderness-cva-tenderness", phrase: "cva tenderness" },
    ],
  },
  {
    slug: "hypertension",
    label: "Hypertension",
    groupName: "riskFactors",
    description: "Known hypertension or high blood pressure.",
    phrases: [
      { slug: "hypertension-hypertension", phrase: "hypertension" },
      { slug: "hypertension-high-blood-pressure", phrase: "high blood pressure" },
      { slug: "hypertension-known-hypertension", phrase: "known hypertension" },
    ],
  },
  {
    slug: "severe-pain",
    label: "Severe pain",
    groupName: "painPattern",
    description: "Severe or very severe pain reported by the patient.",
    phrases: [
      { slug: "severe-pain-severe-pain", phrase: "severe pain" },
      { slug: "severe-pain-severe-abdominal-pain", phrase: "severe abdominal pain" },
      { slug: "severe-pain-severe-flank-pain", phrase: "severe flank pain" },
      { slug: "severe-pain-severe-left-flank-pain", phrase: "severe left flank pain" },
      { slug: "severe-pain-excruciating-pain", phrase: "excruciating pain" },
    ],
  },
];

const cases: HostileClinicalTestCase[] = [
  {
    slug: "hostile-aap-appendicitis-loose-stool-rif",
    title: "Appendicitis with loose stool noise",
    vignette:
      "A 23-year-old has abdominal pain that began centrally and is now sharp in the right iliac fossa. She has focal RIF tenderness, anorexia, nausea, one loose stool, and pain worse on movement when walking.",
    expectedLeadDiagnosisSlug: "appendicitis",
    expectedFeatureSlugs: [
      "abdominal-pain",
      "pain-migration-to-rif",
      "rif-pain",
      "rif-tenderness",
      "anorexia",
      "nausea",
      "diarrhoea",
      "pain-worse-on-movement",
    ],
    expectedRedFlagSlugs: [],
    notes:
      "Hostile comparator: loose stool should not make gastroenteritis outrank a focal RIF appendicitis pattern.",
  },
  {
    slug: "hostile-aap-appendicitis-vomiting-fever-trap",
    title: "Appendicitis with vomiting and fever trap",
    vignette:
      "A 31-year-old has abdominal pain that started around the umbilicus then moved to the right iliac fossa. He is off food, vomited twice, has a low fever, and has marked RIF tenderness. The pain is worse when he coughs or moves.",
    expectedLeadDiagnosisSlug: "appendicitis",
    expectedFeatureSlugs: [
      "abdominal-pain",
      "pain-migration-to-rif",
      "rif-pain",
      "rif-tenderness",
      "anorexia",
      "vomiting",
      "fever",
      "pain-worse-on-movement",
      "pain-worse-with-cough",
    ],
    expectedRedFlagSlugs: [],
    notes:
      "Vomiting and fever are generic; focal RIF tenderness plus movement/cough pain should dominate.",
  },
  {
    slug: "hostile-aap-mesenteric-af-diarrhoea",
    title: "Mesenteric ischaemia with diarrhoea noise",
    vignette:
      "A 79-year-old with atrial fibrillation and peripheral vascular disease has sudden severe abdominal pain. She says the pain is far worse than expected. Her abdomen is soft with only mild tenderness. She has vomited once and passed loose stool.",
    expectedLeadDiagnosisSlug: "mesenteric-ischaemia",
    expectedFeatureSlugs: [
      "abdominal-pain",
      "sudden-onset",
      "older-age",
      "atrial-fibrillation",
      "vascular-disease",
      "pain-out-of-proportion",
      "pain-severe-but-exam-mild",
      "mild-tenderness",
      "vomiting",
      "diarrhoea",
    ],
    expectedRedFlagSlugs: ["mesenteric-ischaemia-escalation-pattern"],
    notes:
      "Loose stool should be treated as noise when AF/vascular risk and pain-exam mismatch are present.",
  },
  {
    slug: "hostile-aap-mesenteric-sweaty-mild-exam",
    title: "Mesenteric ischaemia with mild examination",
    vignette:
      "An 82-year-old smoker with vascular disease is sweaty and restless with severe abdominal pain. The pain is much worse than the mild abdominal tenderness on examination. There is no guarding.",
    expectedLeadDiagnosisSlug: "mesenteric-ischaemia",
    expectedFeatureSlugs: [
      "abdominal-pain",
      "older-age",
      "smoking-history",
      "vascular-disease",
      "sweating",
      "restless",
      "pain-out-of-proportion",
      "pain-severe-but-exam-mild",
      "mild-tenderness",
    ],
    expectedRedFlagSlugs: ["mesenteric-ischaemia-escalation-pattern"],
    notes:
      "Tests severe pain with mild exam and vascular risk without relying on diarrhoea or vomiting.",
  },
  {
    slug: "hostile-aap-perforation-alcohol-pancreatitis-noise",
    title: "Perforation despite alcohol pancreatitis noise",
    vignette:
      "A 48-year-old heavy alcohol user develops sudden severe epigastric and upper abdominal pain. He lies completely still because movement makes it worse. He has guarding and pain worse with coughing.",
    expectedLeadDiagnosisSlug: "perforated-viscus-peritonitis",
    expectedFeatureSlugs: [
      "epigastric-pain",
      "sudden-onset",
      "heavy-alcohol",
      "lying-still",
      "guarding",
      "pain-worse-on-movement",
      "pain-worse-with-cough",
    ],
    expectedRedFlagSlugs: ["perforated-viscus-peritonitis-pattern"],
    notes:
      "Peritonitic behaviour should beat pancreatitis even when alcohol history is present.",
  },
  {
    slug: "hostile-aap-perforation-nsaid-dyspepsia-trap",
    title: "Perforation with dyspepsia/NSAID trap",
    vignette:
      "A 67-year-old taking regular ibuprofen for arthritis has abrupt epigastric abdominal pain. The abdomen is guarded, coughing worsens the pain, and she is lying still on the trolley.",
    expectedLeadDiagnosisSlug: "perforated-viscus-peritonitis",
    expectedFeatureSlugs: [
      "older-age",
      "nsaid-use",
      "epigastric-pain",
      "abdominal-pain",
      "sudden-onset",
      "guarding",
      "pain-worse-with-cough",
      "lying-still",
    ],
    expectedRedFlagSlugs: ["perforated-viscus-peritonitis-pattern"],
    notes:
      "NSAID/dyspeptic context should not hide the peritonitic pattern.",
  },
  {
    slug: "hostile-aap-ectopic-rif-appendix-mimic",
    title: "Ectopic pregnancy mimicking appendicitis",
    vignette:
      "A 26-year-old who could be pregnant has lower abdominal and pelvic pain, worse on the right. Her last period was 7 weeks ago and she has vaginal bleeding with dizziness and pallor. There is RIF discomfort but no diarrhoea.",
    expectedLeadDiagnosisSlug: "ectopic-pregnancy",
    expectedFeatureSlugs: [
      "pelvic-pain",
      "pregnancy-possible",
      "missed-period",
      "vaginal-bleeding",
      "dizziness",
      "pallor",
      "rif-pain",
    ],
    optionalExpectedFeatureSlugs: ["abdominal-pain"],
    expectedRedFlagSlugs: ["ectopic-pregnancy-pattern"],
    notes:
      "Pelvic pain, missed period and bleeding should promote ectopic above appendicitis.",
  },
  {
    slug: "hostile-aap-ectopic-positive-test-collapse",
    title: "Ectopic pregnancy with positive test and collapse",
    vignette:
      "A 34-year-old with a positive pregnancy test has sudden pelvic pain and vaginal bleeding. She feels faint and collapsed briefly in the bathroom before arrival.",
    expectedLeadDiagnosisSlug: "ectopic-pregnancy",
    expectedFeatureSlugs: [
      "pregnancy-possible",
      "positive-pregnancy-test",
      "pelvic-pain",
      "sudden-onset",
      "vaginal-bleeding",
      "dizziness",
      "collapse",
    ],
    expectedRedFlagSlugs: ["ectopic-pregnancy-pattern"],
    notes:
      "Instability should make ectopic a ranked top-tier diagnosis, not only a separate red flag.",
  },
  {
    slug: "hostile-aap-renal-colic-aaa-risk-no-collapse",
    title: "Renal colic despite AAA risk factors",
    vignette:
      "A 71-year-old smoker with hypertension has sudden severe left flank pain radiating toward the groin. He keeps moving around trying to get comfortable and has visible haematuria. He has no collapse and no hypotension.",
    expectedLeadDiagnosisSlug: "renal-colic-ureteric-stone",
    expectedFeatureSlugs: [
      "older-age",
      "smoking-history",
      "hypertension",
      "sudden-onset",
      "severe-pain",
      "flank-pain",
      "loin-to-groin-pain",
      "restless",
      "haematuria",
    ],
    expectedRedFlagSlugs: [],
    notes:
      "AAA risk factors should not beat classic flank-to-groin restless renal colic without instability.",
  },
  {
    slug: "renal-colic-classic",
    title: "Classic renal colic",
    vignette:
      "A patient has sudden severe flank pain radiating toward the groin and keeps moving around trying to get comfortable. There is no collapse and no hypotension.",
    expectedLeadDiagnosisSlug: "renal-colic-ureteric-stone",
    expectedFeatureSlugs: [
      "sudden-onset",
      "severe-pain",
      "flank-pain",
      "loin-to-groin-pain",
      "restless",
    ],
    optionalExpectedFeatureSlugs: ["colicky-pain"],
    expectedRedFlagSlugs: [],
    notes:
      "Classic renal colic should require severe pain rather than severe tenderness; colicky pain is optional because this wording gives flank-to-groin pain and restlessness rather than waves/colic.",
  },
  {
    slug: "hostile-aap-aaa-flank-collapse",
    title: "AAA presenting as flank pain",
    vignette:
      "A 76-year-old smoker with hypertension and vascular disease develops sudden abdominal, back, and left flank pain. He collapses, is sweaty, and is hypotensive on arrival.",
    expectedLeadDiagnosisSlug: "ruptured-symptomatic-abdominal-aortic-aneurysm",
    expectedFeatureSlugs: [
      "older-age",
      "smoking-history",
      "hypertension",
      "vascular-disease",
      "sudden-onset",
      "abdominal-pain",
      "flank-pain",
      "collapse",
      "sweating",
      "hypotension",
    ],
    expectedRedFlagSlugs: ["ruptured-aaa-suspicion-pattern"],
    notes:
      "The same flank-pain frame should flip to AAA when collapse and hypotension are present.",
  },
  {
    slug: "hostile-aap-pyelonephritis-colic-noise",
    title: "Pyelonephritis with renal colic noise",
    vignette:
      "A 39-year-old has right flank pain with fever, vomiting, dysuria, urinary frequency, and renal angle tenderness. She says the pain comes in waves but she is febrile and systemically unwell.",
    expectedLeadDiagnosisSlug: "pyelonephritis",
    expectedFeatureSlugs: [
      "flank-pain",
      "fever",
      "vomiting",
      "dysuria",
      "urinary-frequency",
      "cva-tenderness",
      "colicky-pain",
    ],
    expectedRedFlagSlugs: [],
    notes:
      "Infective urinary features should keep pyelonephritis above renal colic.",
  },
  {
    slug: "hostile-aap-bowel-obstruction-constipation-trap",
    title: "Bowel obstruction labelled constipation",
    vignette:
      "A 69-year-old has crampy colicky abdominal pain, repeated vomiting, a swollen distended abdomen, and constipation. He has not passed wind since yesterday.",
    expectedLeadDiagnosisSlug: "bowel-obstruction",
    expectedFeatureSlugs: [
      "older-age",
      "abdominal-pain",
      "colicky-pain",
      "vomiting",
      "distension",
      "constipation",
      "obstipation",
      "unable-to-pass-flatus",
    ],
    expectedRedFlagSlugs: [],
    notes:
      "Vomiting plus colicky abdominal pain should prevent simple constipation from dominating.",
  },
  {
    slug: "hostile-aap-cholangitis-cholecystitis-trap",
    title: "Cholangitis rather than cholecystitis",
    vignette:
      "A 58-year-old has RUQ pain, fever, jaundice, dark urine, and pale stools. She has nausea and local RUQ tenderness after fatty food.",
    expectedLeadDiagnosisSlug: "acute-cholangitis",
    expectedFeatureSlugs: [
      "ruq-pain",
      "fever",
      "jaundice",
      "dark-urine",
      "pale-stools",
      "nausea",
      "post-prandial-pain",
    ],
    expectedRedFlagSlugs: ["acute-cholangitis-pattern"],
    notes:
      "Jaundice and systemic features should push cholangitis above cholecystitis.",
  },
  {
    slug: "hostile-aap-dka-surgical-abdomen-mimic",
    title: "DKA mimicking a surgical abdomen",
    vignette:
      "A 19-year-old with type 1 diabetes has abdominal pain, nausea, repeated vomiting, sweating, marked thirst, passing lots of urine, and fruity breath. There is diffuse abdominal discomfort but no guarding.",
    expectedLeadDiagnosisSlug: "diabetic-ketoacidosis",
    expectedFeatureSlugs: [
      "abdominal-pain",
      "diabetic-context",
      "nausea",
      "vomiting",
      "sweating",
      "polydipsia",
      "polyuria",
      "ketosis-breath",
      "diffuse-abdominal-pain",
    ],
    expectedRedFlagSlugs: [],
    notes:
      "Metabolic context should keep DKA visible despite abdominal pain and vomiting.",
  },
  {
    slug: "hostile-aap-vague-diarrhoea-no-red-flags",
    title: "Vague abdominal pain without focal red flags",
    vignette:
      "A 28-year-old has vague diffuse abdominal pain with nausea, vomiting, and diarrhoea after a takeaway meal. There is no RIF tenderness, no guarding, no jaundice, no collapse, and no flank-to-groin pain.",
    expectedLeadDiagnosisSlug: "gastroenteritis",
    expectedFeatureSlugs: [
      "abdominal-pain",
      "diffuse-abdominal-pain",
      "nausea",
      "vomiting",
      "diarrhoea",
    ],
    expectedRedFlagSlugs: [],
    notes:
      "Low-risk vague abdominal pain case to ensure benign comparators still work when focal red flags are absent.",
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

function getRequiredFeatureSlugs(testCase: HostileClinicalTestCase) {
  return unique(testCase.expectedFeatureSlugs.map(toFeatureToken));
}

function getOptionalFeatureSlugs(testCase: HostileClinicalTestCase) {
  return unique((testCase.optionalExpectedFeatureSlugs ?? []).map(toFeatureToken));
}

function getExpectedRedFlagSlugs(testCase: HostileClinicalTestCase) {
  return unique(testCase.expectedRedFlagSlugs.map(slugify));
}

function getForbiddenRedFlagSlugs(testCase: HostileClinicalTestCase) {
  return unique((testCase.forbiddenRedFlagSlugs ?? []).map(slugify));
}

function findOverlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function buildDiagnosisSlugSet() {
  return new Set(
    acuteAbdominalPainDiagnoses.flatMap((diagnosis) => [
      slugify(diagnosis.id),
      slugify(diagnosis.name),
    ]),
  );
}

function buildRedFlagSlugSet() {
  return new Set(GUIDELINE_RULES.map((rule) => slugify(rule.title)));
}

async function main() {
  const existingSeedLabels = await prisma.featureLabel.findMany({
    where: { slug: { in: featureLabelSeeds.map((label) => label.slug) } },
    select: { slug: true },
  });
  const existingSeedLabelSlugs = new Set(existingSeedLabels.map((label) => label.slug));
  const existingSeedPhrases = await prisma.featurePhrase.findMany({
    where: { slug: { in: featureLabelSeeds.flatMap((label) => label.phrases.map((phrase) => phrase.slug)) } },
    select: { slug: true },
  });
  const existingSeedPhraseSlugs = new Set(existingSeedPhrases.map((phrase) => phrase.slug));
  const labelsAdded: string[] = [];
  const labelsUpdated: string[] = [];
  const phrasesAdded: string[] = [];
  const phrasesUpdated: string[] = [];

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
      select: { id: true, slug: true },
    });

    if (existingSeedLabelSlugs.has(savedLabel.slug)) {
      labelsUpdated.push(savedLabel.slug);
    } else {
      labelsAdded.push(savedLabel.slug);
    }

    for (const phrase of featureLabel.phrases) {
      const savedPhrase = await prisma.featurePhrase.upsert({
        where: { slug: phrase.slug },
        create: {
          slug: phrase.slug,
          phrase: phrase.phrase,
          notes: phrase.notes ?? `Seeded for hostile acute-abdominal test coverage: ${featureLabel.slug}`,
          status: CONTENT_STATUS,
          featureLabelId: savedLabel.id,
        },
        update: {
          phrase: phrase.phrase,
          notes: phrase.notes ?? `Seeded for hostile acute-abdominal test coverage: ${featureLabel.slug}`,
          status: CONTENT_STATUS,
          featureLabelId: savedLabel.id,
        },
        select: { slug: true },
      });

      if (existingSeedPhraseSlugs.has(savedPhrase.slug)) {
        phrasesUpdated.push(savedPhrase.slug);
      } else {
        phrasesAdded.push(savedPhrase.slug);
      }
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
    cases.flatMap((testCase) => [
      ...testCase.expectedFeatureSlugs,
      ...(testCase.optionalExpectedFeatureSlugs ?? []),
    ].filter((slug) => !featureLabelBySlug.has(slug) && !featureLabelBySlug.has(toFeatureToken(slug)))),
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
  const featureRubricOverlaps = cases
    .map((testCase) => ({
      slug: testCase.slug,
      overlap: findOverlap(getRequiredFeatureSlugs(testCase), getOptionalFeatureSlugs(testCase)),
    }))
    .filter((item) => item.overlap.length > 0);
  const redFlagRubricOverlaps = cases
    .map((testCase) => ({
      slug: testCase.slug,
      overlap: findOverlap(getExpectedRedFlagSlugs(testCase), getForbiddenRedFlagSlugs(testCase)),
    }))
    .filter((item) => item.overlap.length > 0);

  if (
    missingFeatureSlugs.length ||
    missingDiagnosisSlugs.length ||
    missingRedFlagSlugs.length ||
    featureRubricOverlaps.length ||
    redFlagRubricOverlaps.length
  ) {
    console.error(
      JSON.stringify(
        {
          imported: false,
          missingFeatureSlugs,
          missingDiagnosisSlugs,
          missingRedFlagSlugs,
          featureRubricOverlaps,
          redFlagRubricOverlaps,
          labelsAdded,
          labelsUpdated,
          phrasesAdded,
          phrasesUpdated,
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
  const skipped: string[] = [];

  for (const testCase of cases) {
    const requiredFeatureSlugs = getRequiredFeatureSlugs(testCase);
    const optionalFeatureSlugs = getOptionalFeatureSlugs(testCase);
    const expectedRedFlagSlugs = getExpectedRedFlagSlugs(testCase);
    const forbiddenRedFlagSlugs = getForbiddenRedFlagSlugs(testCase);
    const featureIds = [...requiredFeatureSlugs, ...optionalFeatureSlugs].map((slug) => {
      const id = featureLabelBySlug.get(slug);
      if (!id) {
        throw new Error(`Unexpected missing feature label after validation: ${slug}`);
      }
      return id;
    });
    const requiredFeatureSet = new Set(requiredFeatureSlugs);
    const featureRubricJson = {
      requiredExpectedFeatureSlugs: requiredFeatureSlugs,
      optionalExpectedFeatureSlugs: optionalFeatureSlugs,
    };
    const redFlagRubricJson = {
      expectedRedFlagSlugs,
      forbiddenRedFlagSlugs,
    };

    const saved = await prisma.clinicalTestCase.upsert({
      where: { slug: testCase.slug },
      create: {
        slug: testCase.slug,
        title: testCase.title,
        presentationBlock: PRESENTATION_BLOCK,
        vignette: testCase.vignette,
        expectedLeadDiagnosisSlug: testCase.expectedLeadDiagnosisSlug,
        expectedPresentationBlock: PRESENTATION_BLOCK,
        expectedFeatureSlugsJson: featureRubricJson,
        expectedRedFlagSlugsJson: redFlagRubricJson,
        notes: testCase.notes,
        status: STATUS,
        expectedFeatures: {
          create: featureIds.map((featureLabelId, index) => ({
            featureLabelId,
            required: requiredFeatureSet.has([...requiredFeatureSlugs, ...optionalFeatureSlugs][index]),
          })),
        },
      },
      update: {
        title: testCase.title,
        presentationBlock: PRESENTATION_BLOCK,
        vignette: testCase.vignette,
        expectedLeadDiagnosisSlug: testCase.expectedLeadDiagnosisSlug,
        expectedPresentationBlock: PRESENTATION_BLOCK,
        expectedFeatureSlugsJson: featureRubricJson,
        expectedRedFlagSlugsJson: redFlagRubricJson,
        notes: testCase.notes,
        status: STATUS,
        expectedFeatures: {
          deleteMany: {},
          create: featureIds.map((featureLabelId, index) => ({
            featureLabelId,
            required: requiredFeatureSet.has([...requiredFeatureSlugs, ...optionalFeatureSlugs][index]),
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
        phrasesAdded,
        phrasesUpdated,
        created,
        updated,
        skipped,
        totalRequested: cases.length,
        missingFeatureSlugs,
        missingDiagnosisSlugs,
        missingRedFlagSlugs,
        featureRubricOverlaps,
        redFlagRubricOverlaps,
        slugs: cases.map((testCase) => testCase.slug),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Hostile acute-abdominal test-case import failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
