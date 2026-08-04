// Loads the monorepo-root .env regardless of which package's CWD a script
// runs from (pnpm --filter scripts run with CWD set to that package dir).
// Node/drizzle-kit don't load .env files on their own, and relying on
// developers to manually `source .env` before every command is fragile
// and shell-specific (breaks on Windows PowerShell) — so every entry point
// that needs DATABASE_URL imports this first.
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../../");

config({ path: path.join(repoRoot, ".env") });
