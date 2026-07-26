# Nova

Fitness coaching app for a gym: admins run the roster, coaches build and approve
programs, and members train off a coach-built plan or one they build themselves.

Next.js (static export) + Supabase, with all data access from the browser.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Run the SQL files in `supabase/` in the Supabase SQL editor, in order:
`schema.sql`, then `migration_002` … `migration_010`. The comments at the top of
each explain what it adds.

The most recent one, `migration_010_custom_plans_alternates.sql`, adds
member-built plans, per-exercise logging, and the coach's "build a plan from
scratch" function — the plan builder and workout logging need it.

## How it fits together

**Roles.** Admin logs in at `/admin` with the hardcoded staff credentials.
Coaches log in on the same screen under the Coach tab and land on
`/admin/coach`. Members log in at `/auth/login`.

**Admin console** (`/admin`) is split into Overview, Members, Coaches,
Assignments and Plans. Members and coaches are created there (credentials are
shown once), members are allocated to coaches individually or in bulk, and any
plan can be reviewed or edited by the admin directly — useful when the person
running the gym is also coaching.

**Coaches** (`/admin/coach`) review submitted plans, edit any active client's
program, and can build a plan from scratch for a member who never filled in the
intake form.

**Members** (`/dashboard`) train off their coach's plan, or build their own at
`/dashboard/plan-builder` — choose how many days a week, search the exercise
library, or create an exercise that isn't in it. A toggle on the dashboard
switches which plan is active; both are kept.

**Alternates.** Every exercise can carry up to three alternates. When logging, a
member picks which one they actually did, so bench press in week 1 and dumbbell
press in week 2 both count toward the same slot. The card shows what they chose
last time, and coaches see swaps in the client's recent activity.

## Code map

- `src/lib/exerciseLibrary.ts` — searchable exercise catalog; also maps
  off-catalog names onto a movement pattern so custom entries still get art.
- `src/lib/planTemplates.ts` — plan types, auto-generated templates, helpers.
- `src/components/exercise/ExerciseArt.tsx` — animated inline-SVG illustration
  per movement pattern (no image assets; respects `prefers-reduced-motion`).
- `src/components/exercise/ExercisePicker.tsx` — search-or-create combobox.
- `src/components/plan/PlanEditor.tsx` — day/exercise/alternate editor shared by
  coaches, admins, and the member plan builder.
