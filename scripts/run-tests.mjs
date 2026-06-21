import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const buildDir = mkdtempSync(join(tmpdir(), "wardbrain-tests-"));
symlinkSync(join(process.cwd(), "node_modules"), join(buildDir, "node_modules"), "dir");

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV ?? "test",
      WARDBRAIN_TEST_MODE: "1",
      WARDBRAIN_TEST_DB_FALLBACK_LOG_PATH: join(buildDir, "db-feature-phrase-fallback.log"),
    },
  });

  if (result.status !== 0) {
    rmSync(buildDir, { recursive: true, force: true });
    process.exit(result.status ?? 1);
  }
}

run("node", ["scripts/check-admin-test-import-coverage.mjs"]);

run("./node_modules/.bin/tsc", [
  "--outDir",
  buildDir,
  "--module",
  "nodenext",
  "--moduleResolution",
  "nodenext",
  "--target",
  "es2022",
  "--skipLibCheck",
  "true",
  "--noEmit",
  "false",
  "app/api/analyze-case/route.ts",
  "lib/application/analyzeCase.ts",
  "lib/differentialEngine.ts",
  "lib/familyRanking.ts",
  "lib/conditionPromotionRegistry.ts",
  "lib/diagnosisAliases.ts",
  "lib/diagnosisScoring.ts",
  "lib/featureExtractor.ts",
  "lib/diagnosisBoosts.ts",
  "lib/diagnosisRules.ts",
  "lib/featureLabels.ts",
  "lib/normalizeInput.ts",
  "lib/nextStepsRules.ts",
  "lib/presentationFamilies.ts",
  "lib/redFlagRules.ts",
  "lib/wardbrainLookup.ts",
  "lib/guidelineRules.ts",
  "lib/types.ts",
  "lib/types/index.ts",
  "types/next-auth.d.ts",
  "lib/domain/conditionPromotionRegistry.ts",
  "lib/domain/diagnosisAliases.ts",
  "lib/domain/diagnosisBoosts.ts",
  "lib/domain/diagnosisDefinitionEvaluator.ts",
  "lib/domain/diagnosisSlug.ts",
  "lib/domain/diagnosisRules.ts",
  "lib/domain/diagnosisScoring.ts",
  "lib/domain/familyRanking.ts",
  "lib/domain/featureExtractor.ts",
  "lib/domain/featureLabels.ts",
  "lib/domain/featureSlug.ts",
  "lib/domain/guidelineRules.ts",
  "lib/domain/nextStepsRules.ts",
  "lib/domain/normalizeInput.ts",
  "lib/domain/presentationBlocks/acuteAbdominalPain.ts",
  "lib/domain/presentationBlocks/index.ts",
  "lib/domain/presentationFamilies.ts",
  "lib/domain/redFlagRules.ts",
  "lib/domain/wardbrainLookup.ts",
  "lib/testing/evaluateClinicalTestCase.ts",
  "types/wardbrain.ts",
  "content/wardbrain_core_pilot_app_ready.ts",
  "tests/domain.featureExtractor.test.mts",
  "tests/evaluateClinicalTestCase.test.mts",
  "tests/featureExtractionCases.ts",
  "tests/featureExtraction.test.mts",
  "tests/diagnosisAliases.test.mts",
  "tests/conditionPromotionRegistry.test.mts",
  "tests/acuteAbdominalPainDefinitions.test.mts",
  "tests/breathlessnessV1.test.mts",
  "tests/chestPainV1.test.mts",
  "tests/diagnosisDefinitionEvaluator.test.mts",
  "tests/finalCalibration.test.mts",
  "tests/highPriorityCalibration.test.mts",
  "tests/hostileAcuteAbdominalCases.test.mts",
  "tests/integration/analyzeCaseApi.test.mts",
  "tests/messyPilotCases.test.mts",
  "tests/targetedCalibration.test.mts",
  "tests/familyRanking.test.mts",
  "tests/nextSteps.test.mts",
  "tests/reasoningComparison.test.mts",
  "tests/wardbrainLookup.test.mts",
  "tests/trapCases.ts",
  "tests/trapCases.test.mts",
]);

run("node", [
  "--test",
  join(buildDir, "tests", "trapCases.test.mjs"),
  join(buildDir, "tests", "featureExtraction.test.mjs"),
  join(buildDir, "tests", "diagnosisAliases.test.mjs"),
  join(buildDir, "tests", "conditionPromotionRegistry.test.mjs"),
  join(buildDir, "tests", "acuteAbdominalPainDefinitions.test.mjs"),
  join(buildDir, "tests", "breathlessnessV1.test.mjs"),
  join(buildDir, "tests", "chestPainV1.test.mjs"),
  join(buildDir, "tests", "diagnosisDefinitionEvaluator.test.mjs"),
  join(buildDir, "tests", "domain.featureExtractor.test.mjs"),
  join(buildDir, "tests", "evaluateClinicalTestCase.test.mjs"),
  join(buildDir, "tests", "finalCalibration.test.mjs"),
  join(buildDir, "tests", "highPriorityCalibration.test.mjs"),
  join(buildDir, "tests", "hostileAcuteAbdominalCases.test.mjs"),
  join(buildDir, "tests", "integration", "analyzeCaseApi.test.mjs"),
  join(buildDir, "tests", "messyPilotCases.test.mjs"),
  join(buildDir, "tests", "targetedCalibration.test.mjs"),
  join(buildDir, "tests", "familyRanking.test.mjs"),
  join(buildDir, "tests", "nextSteps.test.mjs"),
  join(buildDir, "tests", "reasoningComparison.test.mjs"),
  join(buildDir, "tests", "wardbrainLookup.test.mjs"),
]);

rmSync(buildDir, { recursive: true, force: true });
