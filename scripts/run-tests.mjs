import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const buildDir = mkdtempSync(join(tmpdir(), "wardbrain-tests-"));

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  if (result.status !== 0) {
    rmSync(buildDir, { recursive: true, force: true });
    process.exit(result.status ?? 1);
  }
}

run("./node_modules/.bin/tsc", [
  "--outDir",
  buildDir,
  "--module",
  "nodenext",
  "--moduleResolution",
  "nodenext",
  "--target",
  "es2022",
  "--noEmit",
  "false",
  "lib/differentialEngine.ts",
  "lib/featureExtractor.ts",
  "lib/diagnosisBoosts.ts",
  "lib/diagnosisRules.ts",
  "lib/featureLabels.ts",
  "lib/redFlagRules.ts",
  "lib/guidelineRules.ts",
  "lib/types.ts",
  "tests/trapCases.ts",
  "tests/trapCases.test.mts",
]);

run("node", ["--test", join(buildDir, "tests", "trapCases.test.mjs")]);

rmSync(buildDir, { recursive: true, force: true });
