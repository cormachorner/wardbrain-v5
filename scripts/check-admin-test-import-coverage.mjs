import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const testsDir = join(root, "tests");
const scriptsDir = join(root, "scripts");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

function toKebabCase(value) {
  return value
    .replace(/V1$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const v1TestFiles = readdirSync(testsDir)
  .filter((fileName) => fileName.endsWith("V1.test.mts"))
  .sort();

const missingCoverage = v1TestFiles.flatMap((fileName) => {
  const blockSlug = toKebabCase(fileName.replace(".test.mts", ""));
  const importScriptName = `import-${blockSlug}-v1-test-cases.ts`;
  const packageScriptName = `import:${blockSlug}-tests`;
  const expectedPackageCommand = `tsx scripts/${importScriptName}`;
  const errors = [];

  if (!existsSync(join(scriptsDir, importScriptName))) {
    errors.push(`missing scripts/${importScriptName}`);
  }

  if (packageJson.scripts?.[packageScriptName] !== expectedPackageCommand) {
    errors.push(`missing package script "${packageScriptName}": "${expectedPackageCommand}"`);
  }

  return errors.map((error) => `${fileName}: ${error}`);
});

if (missingCoverage.length > 0) {
  console.error("Admin test-case import coverage check failed.");
  console.error("Every *V1.test.mts block needs a matching DB importer so admin /test-cases is populated.");
  for (const error of missingCoverage) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}
