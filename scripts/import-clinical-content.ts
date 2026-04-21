import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

type SqliteFeatureLabel = {
  slug: string;
  label: string;
  description: string | null;
  groupName: string | null;
  status: string;
};

type SqliteUser = {
  email: string;
  name: string | null;
  image: string | null;
  password: string | null;
  role: string;
};

type SqliteFeaturePhrase = {
  slug: string;
  phrase: string;
  notes: string | null;
  status: string;
  featureLabelSlug: string;
};

type SqliteClinicalTestCase = {
  slug: string;
  title: string;
  presentationBlock: string;
  vignette: string;
  expectedLeadDiagnosis: string | null;
  expectedLeadDiagnosisSlug: string | null;
  expectedPresentationBlock: string | null;
  expectedFeatureSlugsJson: string | null;
  expectedRedFlagSlugsJson: string | null;
  notes: string | null;
  status: string;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunResultJson: string | null;
};

type SqliteClinicalTestCaseFeature = {
  testCaseSlug: string;
  featureLabelSlug: string;
  required: number | boolean;
};

const prisma = new PrismaClient();

function readSqliteJson<T>(sqliteDbPath: string, sql: string): T[] {
  const raw = execFileSync("sqlite3", ["-json", sqliteDbPath, sql], {
    encoding: "utf8",
  }).trim();

  if (!raw) {
    return [];
  }

  return JSON.parse(raw) as T[];
}

async function main() {
  const sqliteDbPath = resolve(process.cwd(), process.env.SQLITE_CONTENT_DB ?? "prisma/dev.db");
  const users = readSqliteJson<SqliteUser>(
    sqliteDbPath,
    `
      select
        email,
        name,
        image,
        password,
        role
      from User
      order by email;
    `,
  );

  const featureLabels = readSqliteJson<SqliteFeatureLabel>(
    sqliteDbPath,
    `
      select
        slug,
        label,
        description,
        groupName,
        status
      from FeatureLabel
      order by slug;
    `,
  );

  const featurePhrases = readSqliteJson<SqliteFeaturePhrase>(
    sqliteDbPath,
    `
      select
        fp.slug,
        fp.phrase,
        fp.notes,
        fp.status,
        fl.slug as featureLabelSlug
      from FeaturePhrase fp
      join FeatureLabel fl on fl.id = fp.featureLabelId
      order by fp.slug;
    `,
  );

  const clinicalTestCases = readSqliteJson<SqliteClinicalTestCase>(
    sqliteDbPath,
    `
      select
        slug,
        title,
        presentationBlock,
        vignette,
        expectedLeadDiagnosis,
        expectedLeadDiagnosisSlug,
        expectedPresentationBlock,
        expectedFeatureSlugsJson,
        expectedRedFlagSlugsJson,
        notes,
        status,
        lastRunAt,
        lastRunStatus,
        lastRunResultJson
      from ClinicalTestCase
      order by slug;
    `,
  );

  const clinicalTestCaseFeatures = readSqliteJson<SqliteClinicalTestCaseFeature>(
    sqliteDbPath,
    `
      select
        ctc.slug as testCaseSlug,
        fl.slug as featureLabelSlug,
        ctcf.required as required
      from ClinicalTestCaseFeature ctcf
      join ClinicalTestCase ctc on ctc.id = ctcf.testCaseId
      join FeatureLabel fl on fl.id = ctcf.featureLabelId
      order by ctc.slug, fl.slug;
    `,
  );

  const featureLabelIdBySlug = new Map<string, string>();
  const testCaseIdBySlug = new Map<string, string>();

  for (const user of users) {
    const email = user.email.toLowerCase().trim();

    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: user.name,
        image: user.image,
        password: user.password,
        role: user.role,
      },
      update: {
        name: user.name,
        image: user.image,
        password: user.password,
        role: user.role,
      },
    });
  }

  for (const featureLabel of featureLabels) {
    const saved = await prisma.featureLabel.upsert({
      where: { slug: featureLabel.slug },
      create: {
        slug: featureLabel.slug,
        label: featureLabel.label,
        description: featureLabel.description,
        groupName: featureLabel.groupName,
        status: featureLabel.status,
      },
      update: {
        label: featureLabel.label,
        description: featureLabel.description,
        groupName: featureLabel.groupName,
        status: featureLabel.status,
      },
      select: { id: true, slug: true },
    });

    featureLabelIdBySlug.set(saved.slug, saved.id);
  }

  for (const featurePhrase of featurePhrases) {
    const featureLabelId = featureLabelIdBySlug.get(featurePhrase.featureLabelSlug);

    if (!featureLabelId) {
      throw new Error(`Missing feature label during phrase import: ${featurePhrase.featureLabelSlug}`);
    }

    await prisma.featurePhrase.upsert({
      where: { slug: featurePhrase.slug },
      create: {
        slug: featurePhrase.slug,
        phrase: featurePhrase.phrase,
        notes: featurePhrase.notes,
        status: featurePhrase.status,
        featureLabelId,
      },
      update: {
        phrase: featurePhrase.phrase,
        notes: featurePhrase.notes,
        status: featurePhrase.status,
        featureLabelId,
      },
    });
  }

  for (const testCase of clinicalTestCases) {
    const saved = await prisma.clinicalTestCase.upsert({
      where: { slug: testCase.slug },
      create: {
        slug: testCase.slug,
        title: testCase.title,
        presentationBlock: testCase.presentationBlock,
        vignette: testCase.vignette,
        expectedLeadDiagnosis: testCase.expectedLeadDiagnosis,
        expectedLeadDiagnosisSlug: testCase.expectedLeadDiagnosisSlug,
        expectedPresentationBlock: testCase.expectedPresentationBlock,
        expectedFeatureSlugsJson: testCase.expectedFeatureSlugsJson,
        expectedRedFlagSlugsJson: testCase.expectedRedFlagSlugsJson,
        notes: testCase.notes,
        status: testCase.status,
        lastRunAt: testCase.lastRunAt ? new Date(testCase.lastRunAt) : null,
        lastRunStatus: testCase.lastRunStatus,
        lastRunResultJson: testCase.lastRunResultJson,
      },
      update: {
        title: testCase.title,
        presentationBlock: testCase.presentationBlock,
        vignette: testCase.vignette,
        expectedLeadDiagnosis: testCase.expectedLeadDiagnosis,
        expectedLeadDiagnosisSlug: testCase.expectedLeadDiagnosisSlug,
        expectedPresentationBlock: testCase.expectedPresentationBlock,
        expectedFeatureSlugsJson: testCase.expectedFeatureSlugsJson,
        expectedRedFlagSlugsJson: testCase.expectedRedFlagSlugsJson,
        notes: testCase.notes,
        status: testCase.status,
        lastRunAt: testCase.lastRunAt ? new Date(testCase.lastRunAt) : null,
        lastRunStatus: testCase.lastRunStatus,
        lastRunResultJson: testCase.lastRunResultJson,
      },
      select: { id: true, slug: true },
    });

    testCaseIdBySlug.set(saved.slug, saved.id);
  }

  for (const testCaseFeature of clinicalTestCaseFeatures) {
    const testCaseId = testCaseIdBySlug.get(testCaseFeature.testCaseSlug);
    const featureLabelId = featureLabelIdBySlug.get(testCaseFeature.featureLabelSlug);

    if (!testCaseId) {
      throw new Error(`Missing clinical test case during link import: ${testCaseFeature.testCaseSlug}`);
    }

    if (!featureLabelId) {
      throw new Error(`Missing feature label during link import: ${testCaseFeature.featureLabelSlug}`);
    }

    await prisma.clinicalTestCaseFeature.upsert({
      where: {
        testCaseId_featureLabelId: {
          testCaseId,
          featureLabelId,
        },
      },
      create: {
        testCaseId,
        featureLabelId,
        required: Boolean(testCaseFeature.required),
      },
      update: {
        required: Boolean(testCaseFeature.required),
      },
    });
  }

  console.log(
    `Imported ${users.length} users, ${featureLabels.length} feature labels, ${featurePhrases.length} feature phrases, ${clinicalTestCases.length} test cases, and ${clinicalTestCaseFeatures.length} test-case feature links from ${sqliteDbPath}`,
  );
}

main()
  .catch((error) => {
    console.error("Clinical content import failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
