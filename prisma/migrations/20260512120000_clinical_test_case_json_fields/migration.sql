ALTER TABLE "ClinicalTestCase"
  ALTER COLUMN "expectedFeatureSlugsJson" TYPE JSONB
    USING CASE
      WHEN "expectedFeatureSlugsJson" IS NULL THEN NULL
      ELSE "expectedFeatureSlugsJson"::jsonb
    END,
  ALTER COLUMN "expectedRedFlagSlugsJson" TYPE JSONB
    USING CASE
      WHEN "expectedRedFlagSlugsJson" IS NULL THEN NULL
      ELSE "expectedRedFlagSlugsJson"::jsonb
    END,
  ALTER COLUMN "lastRunResultJson" TYPE JSONB
    USING CASE
      WHEN "lastRunResultJson" IS NULL THEN NULL
      ELSE "lastRunResultJson"::jsonb
    END;
