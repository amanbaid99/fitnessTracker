# FitnessTracker

Coach-first fitness platform. A member signs up, fills in a medical and
lifestyle assessment, and the AI drafts an assessment report and a training
programme. The assigned coach edits and publishes it — nothing reaches a member
until a human has signed it off.

Next.js (static export) + Supabase, with all data access from the browser. The
one piece of server code is a Supabase edge function, because the Claude API key
can't live in a static bundle.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Setting up a Supabase project

1. **Run the SQL.** In the Supabase SQL editor, run the files in `supabase/` in
   order: `schema.sql`, then `migration_002` … `migration_021`. The comment at
   the top of each explains what it adds. They're idempotent, so re-running one
   is safe.

   `migration_018` is the coach-first pipeline (assessments, the plan review
   states, coach profile fields), `migration_019` creates the private
   `assessment-uploads` storage bucket the equipment photos go into, `migration_020` fixes the profiles policies so they don't recurse, and
   `migration_021` adds the AI/templates toggle the admin panel reads.

2. **Deploy the generator.** With the [Supabase CLI](https://supabase.com/docs/guides/cli):

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase functions deploy generate-program
   ```

   Without this step nothing breaks — plans just arrive in the coach's queue
   with no draft attached, and the coach writes them by hand.

## The pipeline

```
register → assessment → submit_assessment()  → plan, status 'awaiting_ai'
                      → generate-program     → days + ai_report, 'pending'
                      → coach edits, publish_plan() → 'approved', member trains
```

`publish_plan()` is the only way a plan reaches a member, and only a coach or an
admin can call it.

## How it fits together

**Roles.** Admin logs in at `/admin` with the hardcoded staff credentials.
Coaches log in on the same screen under the Coach tab and land on
`/admin/coach`. Members log in at `/auth/login`.

**Admin console** (`/admin`) is split into Overview, Members, Coaches,
Assignments and Plans. Members and coaches are created there (credentials are
shown once), members are allocated to coaches individually or in bulk, and any
plan can be reviewed or edited by the admin directly — useful when the person
running the gym is also coaching.

**Coaches** (`/admin/coach`) see only their own roster, review and edit each
client's programme before publishing it, keep shared workout templates, and chat
with clients in real time.

**Members** (`/dashboard`) train off the plan their coach published. The day
selector suggests what's next but lets them start any day, and the rotation
continues from whatever they actually did.

**Alternates.** Every exercise can carry up to three alternates. When logging, a
member picks which one they actually did, so bench press in week 1 and dumbbell
press in week 2 both count toward the same slot. The card shows what they chose
last time, and coaches see swaps in the client's recent activity.

## AI generation

`supabase/functions/generate-program/` is the only thing that talks to the Claude
API. It reads the submitted assessment, calls `claude-opus-5` with a JSON schema
whose `exerciseId` is an enum of real catalog ids — so a generated exercise
always has an illustration, a name the logging screen knows, and usable
alternates — and writes `days` + `ai_report` back to the plan as a draft for the
coach.

The function can't import from `src/`, since only `supabase/functions/` is
uploaded on deploy. `npm run sync:edge` regenerates its catalog and preset snapshots from
`src/lib/exerciseLibrary.ts` and `src/lib/planPresets.ts`; run it whenever an
exercise or a preset changes.

## Deploying

`.github/workflows/deploy-pages.yml` builds a static export and publishes it to
GitHub Pages on every push to `main`. The trigger is read from the branch that
was pushed, so if the default branch is ever renamed, that list has to be
updated in the same commit or deploys stop silently. The Supabase URL and anon key
come from `.env.production`; both are public values by design, with row-level
security doing the actual protecting.

## Code map

- `src/lib/assessment.ts` — the assessment as data, so the form, the coach's
  read-only view and the AI prompt describe the same questions.
- `src/lib/exerciseLibrary.ts` — searchable exercise catalog; also maps
  off-catalog names onto a movement pattern so custom entries still get art.
- `src/lib/planTemplates.ts` — plan types, auto-generated templates, helpers.
- `src/lib/rotation.ts` — which day to suggest next from training history.
- `src/lib/prs.ts` — estimated 1RM, personal bests, next targets.
- `src/components/exercise/ExerciseArt.tsx` — animated inline-SVG illustration
  per movement pattern (no image assets; respects `prefers-reduced-motion`).
- `src/components/exercise/ExercisePicker.tsx` — search-or-create combobox.
- `src/components/plan/PlanEditor.tsx` — day/exercise/alternate editor shared by
  coaches and admins.
- `src/components/chat/ChatThread.tsx` — realtime coach/client messaging.
