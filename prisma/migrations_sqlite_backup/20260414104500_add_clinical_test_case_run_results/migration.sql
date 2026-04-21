ALTER TABLE "ClinicalTestCase" ADD COLUMN "expectedLeadDiagnosisSlug" TEXT;
ALTER TABLE "ClinicalTestCase" ADD COLUMN "expectedFeatureSlugsJson" TEXT;
ALTER TABLE "ClinicalTestCase" ADD COLUMN "expectedRedFlagSlugsJson" TEXT;
ALTER TABLE "ClinicalTestCase" ADD COLUMN "lastRunAt" DATETIME;
ALTER TABLE "ClinicalTestCase" ADD COLUMN "lastRunStatus" TEXT;
ALTER TABLE "ClinicalTestCase" ADD COLUMN "lastRunResultJson" TEXT;
