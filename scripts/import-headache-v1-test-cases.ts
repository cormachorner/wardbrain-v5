import { PrismaClient } from "@prisma/client";
import { GUIDELINE_RULES } from "../lib/domain/guidelineRules";
import { ALL_PRESENTATION_BLOCK_DIAGNOSES } from "../lib/domain/presentationBlocks";
import { canonicalDiagnosisSlug } from "../lib/domain/diagnosisSlug";
import { formatFeatureLabel } from "../lib/domain/featureLabels";
import { guidelineSlug } from "../lib/guidelines/guidelineRegistry";
import { headacheV1Cases } from "../tests/fixtures/headacheV1Cases";

const prisma = new PrismaClient();

const PRESENTATION_BLOCK = "headache";
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

function findOverlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function buildDiagnosisSlugSet() {
  return new Set(
    ALL_PRESENTATION_BLOCK_DIAGNOSES.flatMap((diagnosis) => [
      canonicalDiagnosisSlug(diagnosis.name),
      canonicalDiagnosisSlug(diagnosis.id),
    ]),
  );
}

function buildRedFlagSlugSet() {
  return new Set(GUIDELINE_RULES.map((rule) => guidelineSlug(rule.title)));
}

function getRequiredFeatureSlugs(testCase: (typeof headacheV1Cases)[number]) {
  return unique(testCase.expectedFeatureSlugs.map(toFeatureToken));
}

function getExpectedRedFlagSlugs(testCase: (typeof headacheV1Cases)[number]) {
  return unique((testCase.expectedRedFlags ?? []).map(guidelineSlug));
}

function getForbiddenRedFlagSlugs(testCase: (typeof headacheV1Cases)[number]) {
  return unique((testCase.forbiddenRedFlags ?? []).map(guidelineSlug));
}

async function main() {
  const requiredFeatureSlugs = unique(headacheV1Cases.flatMap(getRequiredFeatureSlugs));
  const featureLabelSeeds = requiredFeatureSlugs.map((slug) => ({
    slug: toDbFeatureSlug(slug),
    label: formatFeatureLabel(slug),
    groupName: "headache",
    description: `Headache v1 feature: ${formatFeatureLabel(slug)}.`,
  }));

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
    headacheV1Cases.flatMap((testCase) =>
      getRequiredFeatureSlugs(testCase).filter((slug) => {
        const dbSlug = toDbFeatureSlug(slug);

        return !featureLabelBySlug.has(slug) && !featureLabelBySlug.has(dbSlug);
      }),
    ),
  );
  const missingDiagnosisSlugs = unique(
    headacheV1Cases
      .map((testCase) => canonicalDiagnosisSlug(testCase.expectedLeadDiagnosis))
      .filter((slug) => !diagnosisSlugs.has(slug)),
  );
  const missingRedFlagSlugs = unique(
    headacheV1Cases.flatMap((testCase) =>
      [
        ...getExpectedRedFlagSlugs(testCase),
        ...getForbiddenRedFlagSlugs(testCase),
      ].filter((slug) => !redFlagSlugs.has(slug)),
    ),
  );
  const redFlagRubricOverlaps = headacheV1Cases
    .map((testCase) => ({
      slug: testCase.id,
      overlap: findOverlap(
        getExpectedRedFlagSlugs(testCase),
        getForbiddenRedFlagSlugs(testCase),
      ),
    }))
    .filter((entry) => entry.overlap.length > 0);

  if (
    missingFeatureSlugs.length > 0 ||
    missingDiagnosisSlugs.length > 0 ||
    missingRedFlagSlugs.length > 0 ||
    redFlagRubricOverlaps.length > 0
  ) {
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
    where: { slug: { in: headacheV1Cases.map((testCase) => testCase.id) } },
    select: { slug: true },
  });
  const existingCaseSlugs = new Set(existingCases.map((testCase) => testCase.slug));
  let created = 0;
  let updated = 0;

  for (const testCase of headacheV1Cases) {
    const featureSlugs = getRequiredFeatureSlugs(testCase);
    const featureIds = featureSlugs.map((slug) => {
      const id = featureLabelBySlug.get(slug) ?? featureLabelBySlug.get(toDbFeatureSlug(slug));

      if (!id) {
        throw new Error(`Unexpected missing feature label after validation: ${slug}`);
      }

      return id;
    });
    const saved = await prisma.clinicalTestCase.upsert({
      where: { slug: testCase.id },
      create: {
        slug: testCase.id,
        title: testCase.title,
        presentationBlock: PRESENTATION_BLOCK,
        vignette: testCase.vignette,
        expectedLeadDiagnosis: canonicalDiagnosisSlug(testCase.expectedLeadDiagnosis),
        expectedLeadDiagnosisSlug: canonicalDiagnosisSlug(testCase.expectedLeadDiagnosis),
        expectedPresentationBlock: testCase.expectedPresentationBlock ?? "headache",
        expectedFeatureSlugsJson: {
          requiredExpectedFeatureSlugs: featureSlugs,
          optionalExpectedFeatureSlugs: [],
        },
        expectedRedFlagSlugsJson: {
          expectedRedFlagSlugs: getExpectedRedFlagSlugs(testCase),
          forbiddenRedFlagSlugs: getForbiddenRedFlagSlugs(testCase),
        },
        notes: `Headache v1 ${testCase.title}.`,
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
        expectedLeadDiagnosis: canonicalDiagnosisSlug(testCase.expectedLeadDiagnosis),
        expectedLeadDiagnosisSlug: canonicalDiagnosisSlug(testCase.expectedLeadDiagnosis),
        expectedPresentationBlock: testCase.expectedPresentationBlock ?? "headache",
        expectedFeatureSlugsJson: {
          requiredExpectedFeatureSlugs: featureSlugs,
          optionalExpectedFeatureSlugs: [],
        },
        expectedRedFlagSlugsJson: {
          expectedRedFlagSlugs: getExpectedRedFlagSlugs(testCase),
          forbiddenRedFlagSlugs: getForbiddenRedFlagSlugs(testCase),
        },
        notes: `Headache v1 ${testCase.title}.`,
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
        casesCreated: created,
        casesUpdated: updated,
        labelsAdded,
        labelsUpdated,
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
