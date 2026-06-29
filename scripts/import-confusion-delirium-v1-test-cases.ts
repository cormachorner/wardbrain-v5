import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { GUIDELINE_RULES } from "../lib/domain/guidelineRules";
import { FAMILY_DIAGNOSIS_MAP } from "../lib/domain/presentationFamilies";
import { canonicalDiagnosisSlug } from "../lib/domain/diagnosisSlug";
import { formatFeatureLabel } from "../lib/domain/featureLabels";
import { guidelineSlug } from "../lib/guidelines/guidelineRegistry";

type EvalCase = {
  id: string;
  title: string;
  presentation: string;
  vignette: string;
  expectedLeadDiagnosisSlug: string;
  expectedFeatureSlugs: string[];
  expectedRedFlagSlugs: string[];
  forbiddenRedFlagSlugs: string[];
  tags: string[];
};

const prisma = new PrismaClient();
const PRESENTATION_BLOCK = "confusion-delirium";
const STATUS = "DRAFT";
const CONTENT_STATUS = "PUBLISHED";

function toFeatureToken(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function toDbFeatureSlug(value: string) {
  return toFeatureToken(value).replace(/_/g, "-");
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getConfusionCases() {
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), "tests", "fixtures", "evalCases.json"), "utf8"),
  ) as EvalCase[];

  return raw.filter((testCase) => testCase.tags.includes("delirium"));
}

function buildDiagnosisSlugSet() {
  return new Set((FAMILY_DIAGNOSIS_MAP["confusion-delirium"] ?? []).map(canonicalDiagnosisSlug));
}

function buildRedFlagSlugSet() {
  return new Set(GUIDELINE_RULES.map((rule) => guidelineSlug(rule.title)));
}

async function main() {
  const testCases = getConfusionCases();
  const requiredFeatureSlugs = unique(testCases.flatMap((testCase) => testCase.expectedFeatureSlugs.map(toFeatureToken)));
  const featureLabelSeeds = requiredFeatureSlugs.map((slug) => ({
    slug: toDbFeatureSlug(slug),
    label: formatFeatureLabel(slug),
    groupName: PRESENTATION_BLOCK,
    description: `Confusion / delirium v1 feature: ${formatFeatureLabel(slug)}.`,
  }));

  for (const featureLabel of featureLabelSeeds) {
    await prisma.featureLabel.upsert({
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
    });
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
    testCases.flatMap((testCase) =>
      testCase.expectedFeatureSlugs
        .map(toFeatureToken)
        .filter((slug) => !featureLabelBySlug.has(slug) && !featureLabelBySlug.has(toDbFeatureSlug(slug))),
    ),
  );
  const missingDiagnosisSlugs = unique(
    testCases
      .map((testCase) => canonicalDiagnosisSlug(testCase.expectedLeadDiagnosisSlug))
      .filter((slug) => !diagnosisSlugs.has(slug)),
  );
  const missingRedFlagSlugs = unique(
    testCases.flatMap((testCase) =>
      [...testCase.expectedRedFlagSlugs, ...testCase.forbiddenRedFlagSlugs]
        .map(guidelineSlug)
        .filter((slug) => !redFlagSlugs.has(slug)),
    ),
  );

  if (missingFeatureSlugs.length > 0 || missingDiagnosisSlugs.length > 0 || missingRedFlagSlugs.length > 0) {
    console.error(
      JSON.stringify(
        {
          imported: false,
          missingFeatureSlugs,
          missingDiagnosisSlugs,
          missingRedFlagSlugs,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  let created = 0;
  let updated = 0;

  for (const testCase of testCases) {
    const featureSlugs = unique(testCase.expectedFeatureSlugs.map(toFeatureToken));
    const featureIds = featureSlugs.map((slug) => {
      const id = featureLabelBySlug.get(slug) ?? featureLabelBySlug.get(toDbFeatureSlug(slug));

      if (!id) {
        throw new Error(`Unexpected missing feature label after validation: ${slug}`);
      }

      return id;
    });

    const existing = await prisma.clinicalTestCase.findUnique({
      where: { slug: testCase.id },
      select: { id: true },
    });
    const saved = await prisma.clinicalTestCase.upsert({
      where: { slug: testCase.id },
      create: {
        slug: testCase.id,
        title: testCase.title,
        presentationBlock: PRESENTATION_BLOCK,
        vignette: testCase.vignette,
        expectedLeadDiagnosis: canonicalDiagnosisSlug(testCase.expectedLeadDiagnosisSlug),
        expectedLeadDiagnosisSlug: canonicalDiagnosisSlug(testCase.expectedLeadDiagnosisSlug),
        expectedPresentationBlock: PRESENTATION_BLOCK,
        expectedFeatureSlugsJson: {
          requiredExpectedFeatureSlugs: featureSlugs,
          optionalExpectedFeatureSlugs: [],
        },
        expectedRedFlagSlugsJson: {
          expectedRedFlagSlugs: unique(testCase.expectedRedFlagSlugs.map(guidelineSlug)),
          forbiddenRedFlagSlugs: unique(testCase.forbiddenRedFlagSlugs.map(guidelineSlug)),
        },
        notes: `Confusion / delirium v1 case: ${testCase.title}.`,
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
        expectedLeadDiagnosis: canonicalDiagnosisSlug(testCase.expectedLeadDiagnosisSlug),
        expectedLeadDiagnosisSlug: canonicalDiagnosisSlug(testCase.expectedLeadDiagnosisSlug),
        expectedPresentationBlock: PRESENTATION_BLOCK,
        expectedFeatureSlugsJson: {
          requiredExpectedFeatureSlugs: featureSlugs,
          optionalExpectedFeatureSlugs: [],
        },
        expectedRedFlagSlugsJson: {
          expectedRedFlagSlugs: unique(testCase.expectedRedFlagSlugs.map(guidelineSlug)),
          forbiddenRedFlagSlugs: unique(testCase.forbiddenRedFlagSlugs.map(guidelineSlug)),
        },
        notes: `Confusion / delirium v1 case: ${testCase.title}.`,
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

    if (existing) {
      updated += 1;
    } else if (saved.slug) {
      created += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        imported: true,
        presentationBlock: PRESENTATION_BLOCK,
        cases: testCases.length,
        created,
        updated,
        status: STATUS,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

