/**
 * Copies the exercise catalog and the plan presets into the edge function.
 *
 * `supabase functions deploy` only uploads what lives under
 * supabase/functions, so the function can't import from src/. Rather than keep
 * hand-written copies in sync, this regenerates snapshots from the real
 * modules:
 *
 *   npm run sync:edge
 *
 * Run it whenever an exercise or a preset changes. The generated files are
 * checked in, so deploys don't depend on the script having been run.
 */

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const lib = join(here, "..", "src", "lib");
const outDir = join(here, "..", "supabase", "functions", "generate-program");

/**
 * The app's modules import each other through the `@/` alias, which Node can't
 * resolve. Copying them to a temp directory with the alias rewritten to a
 * relative path is enough to import them here — nothing in these three files
 * touches React or the browser.
 */
function loadAppModules() {
  const staging = mkdtempSync(join(tmpdir(), "nova-sync-"));
  for (const name of ["exerciseLibrary", "planTemplates", "planPresets"]) {
    const source = readFileSync(join(lib, `${name}.ts`), "utf8").replace(
      /@\/lib\/(\w+)/g,
      "./$1.ts",
    );
    writeFileSync(join(staging, `${name}.ts`), source);
  }
  return staging;
}

const staging = loadAppModules();
const { EXERCISE_LIBRARY } = await import(
  pathToFileURL(join(staging, "exerciseLibrary.ts")).href
);
const { PLAN_PRESETS } = await import(pathToFileURL(join(staging, "planPresets.ts")).href);

// ---------------------------------------------------------------------------
// Exercise catalog
// ---------------------------------------------------------------------------
// Only the fields the model needs to choose sensibly. Aliases and animation
// patterns are a client concern and would just spend tokens.
interface LibraryExercise {
  id: string;
  name: string;
  group: string;
  equipment: string;
  defaultSets: number;
  defaultReps: string;
  defaultRest: string;
}

const rows = (EXERCISE_LIBRARY as LibraryExercise[]).map((e) => ({
  id: e.id,
  name: e.name,
  group: e.group,
  equipment: e.equipment,
  sets: e.defaultSets,
  reps: e.defaultReps,
  rest: e.defaultRest,
}));

writeFileSync(
  join(outDir, "catalog.ts"),
  `// GENERATED FILE — do not edit.
// Run \`npm run sync:edge\` to regenerate from src/lib/exerciseLibrary.ts.

export interface CatalogEntry {
  id: string;
  name: string;
  group: string;
  equipment: string;
  sets: number;
  reps: string;
  rest: string;
}

export const CATALOG: CatalogEntry[] = ${JSON.stringify(rows, null, 2)};

export const CATALOG_IDS: string[] = CATALOG.map((e) => e.id);

const BY_ID = new Map(CATALOG.map((e) => [e.id, e]));

export function catalogEntry(id: string): CatalogEntry | undefined {
  return BY_ID.get(id);
}
`,
);

// ---------------------------------------------------------------------------
// Plan presets
// ---------------------------------------------------------------------------
interface Preset {
  id: string;
  name: string;
  daysPerWeek: number;
  days: unknown[];
}

const presets = (PLAN_PRESETS as Preset[]).map((p) => ({
  id: p.id,
  name: p.name,
  daysPerWeek: p.daysPerWeek,
  days: p.days,
}));

writeFileSync(
  join(outDir, "presets.ts"),
  `// GENERATED FILE — do not edit.
// Run \`npm run sync:edge\` to regenerate from src/lib/planPresets.ts.

export interface Preset {
  id: string;
  name: string;
  daysPerWeek: number;
  days: unknown[];
}

export const PRESETS: Preset[] = ${JSON.stringify(presets, null, 2)};

/**
 * The preset closest to what the client asked for. Home-only training rules
 * out the gym splits entirely; otherwise it's whichever runs nearest to their
 * available days.
 */
export function pickPreset(daysPerWeek: number, atHome: boolean): Preset {
  const pool = atHome
    ? PRESETS.filter((p) => p.id === "home")
    : PRESETS.filter((p) => p.id !== "home");
  const candidates = pool.length > 0 ? pool : PRESETS;

  return [...candidates].sort(
    (a, b) => Math.abs(a.daysPerWeek - daysPerWeek) - Math.abs(b.daysPerWeek - daysPerWeek),
  )[0];
}
`,
);

console.log(`Wrote ${rows.length} exercises and ${presets.length} presets to ${outDir}`);
