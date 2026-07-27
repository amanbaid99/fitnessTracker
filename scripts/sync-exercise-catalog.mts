/**
 * Copies the exercise catalog into the edge function.
 *
 * `supabase functions deploy` only uploads what lives under
 * supabase/functions, so the function can't import src/lib/exerciseLibrary.ts
 * directly. Rather than keep a second hand-written list in sync, this script
 * regenerates a snapshot from the real catalog:
 *
 *   npm run sync:catalog
 *
 * Run it whenever an exercise is added or renamed — the generated file is
 * checked in so deploys don't depend on the script having been run.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { EXERCISE_LIBRARY } from "../src/lib/exerciseLibrary.ts";

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, "..", "supabase", "functions", "generate-program", "catalog.ts");

// Only the fields the model needs to choose sensibly. Aliases and animation
// patterns are a client concern and would just spend tokens.
const rows = EXERCISE_LIBRARY.map((e) => ({
  id: e.id,
  name: e.name,
  group: e.group,
  equipment: e.equipment,
  sets: e.defaultSets,
  reps: e.defaultReps,
  rest: e.defaultRest,
}));

const file = `// GENERATED FILE — do not edit.
// Run \`npm run sync:catalog\` to regenerate from src/lib/exerciseLibrary.ts.

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
`;

writeFileSync(target, file);
console.log(`Wrote ${rows.length} exercises to ${target}`);
