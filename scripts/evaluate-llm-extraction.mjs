import { spawnSync } from "node:child_process";
import { join } from "node:path";

const tsxCli = join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const result = spawnSync(process.execPath, [tsxCli, "scripts/evaluate-llm-extraction.ts"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
