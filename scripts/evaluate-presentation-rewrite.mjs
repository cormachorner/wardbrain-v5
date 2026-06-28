import { spawnSync } from "node:child_process";
import { join } from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const tsxCli = join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const result = spawnSync(process.execPath, [
  tsxCli,
  "scripts/evaluate-presentation-rewrite.ts",
  ...process.argv.slice(2),
], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
