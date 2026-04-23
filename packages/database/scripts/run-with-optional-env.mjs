import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const repoEnvPath = path.resolve(packageRoot, "../../.env");

if (existsSync(repoEnvPath)) {
  process.loadEnvFile(repoEnvPath);
}

const [mode, ...rest] = process.argv.slice(2);

if (!mode) {
  console.error("Missing command mode. Use 'prisma' or 'seed'.");
  process.exit(1);
}

const commandArgs =
  mode === "prisma"
    ? [path.resolve(packageRoot, "../../node_modules/prisma/build/index.js"), ...rest]
    : mode === "seed"
      ? ["--experimental-strip-types", path.resolve(packageRoot, "prisma/seed.ts"), ...rest]
      : null;

if (!commandArgs) {
  console.error(`Unsupported mode '${mode}'. Use 'prisma' or 'seed'.`);
  process.exit(1);
}

const child = spawn(process.execPath, commandArgs, {
  cwd: packageRoot,
  env: process.env,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

