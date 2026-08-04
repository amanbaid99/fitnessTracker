# FitnessTracker — Architecture Overview

*Last updated: 4 August 2026 · Owner: Aman Baid*

---

## TL;DR

- **A coach-first fitness platform.** A member fills in a medical assessment, an LLM drafts a training programme *and a written rationale*, and an assigned coach edits and publishes it. Nothing reaches a member without a human signing off.
- **Static frontend, no application server.** Next.js compiled to static files on GitHub Pages, talking directly to Supabase (Postgres). Authorisation is enforced in the database via row-level security, not in middleware.
- **One piece of server code:** a Supabase Edge Function that calls the Claude API. It exists only because an API key cannot live in a static bundle.
- **The AI is constrained, not trusted.** It can only select from a fixed exercise catalog, its output is schema-validated, and it can never publish.
- **Current stage: working prototype, not production-ready.** One blocking security issue (hardcoded admin credentials) and one process gap (manual database migrations) are documented below with fixes.

---

## System at a glance

```
┌───────────────────────────────┐
│  Browser — Next.js SPA        │      GitHub Pages (static)
│  supabase-js, anon key        │
└──────┬───────────────┬────────┘
       │               │
       │ REST / RPC    │ functions.invoke()
       │ Realtime (WS) │
       ▼               ▼
┌──────────────┐   ┌────────────────────────┐
│  Supabase    │   │  Edge Function (Deno)  │        ┌────────────┐
│              │◄──┤  generate-program      │───────►│ Claude API │
│  Postgres    │   │  service-role key      │        │ opus-5     │
│  + RLS       │   └────────────────────────┘        └────────────┘
│  + Storage   │
│  + Realtime  │
└──────────────┘
```

**Stack:** Next.js 16 (App Router, `output: "export"`) · TypeScript · Tailwind v4 · Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) · Claude `claude-opus-5` · GitHub Actions → GitHub Pages

---

## The product flow

| # | Step | System state |
|---|------|--------------|
| 1 | Member registers (4 fields) | Supabase Auth user + `profiles` row |
| 2 | Completes medical assessment | `assessments` row, autosaved every keystroke, resumable |
| 3 | Submits | `plans` row created, `status = 'awaiting_ai'` |
| 4 | AI drafts programme + report | `status = 'pending'`, editing unlocked for the coach |
| 5 | Coach reviews, edits, publishes | `status = 'approved'` — now visible to the member |
| 6 | Member trains, logs sets, PRs tracked | `exercise_logs`, `exercise_prs` |

Three properties of this flow are deliberate and load-bearing:

1. **The plan row is created before the AI runs.** If generation never fires, the client still appears in a coach's queue rather than disappearing.
2. **`publish_plan()` is the only path to a member.** Enforced in the database, not the UI.
3. **Generation is idempotent.** It refuses to overwrite a plan a coach has started editing unless explicitly forced.

---

## Key architectural decisions

### 1. Static frontend, database-enforced authorisation

There is no API layer. The browser holds a Supabase anon key and queries Postgres directly; row-level security policies decide what each user can see.

| Upside | Downside |
|---|---|
| No servers to run, patch or scale | All business rules must be expressible as SQL policies |
| Hosting is effectively free | No place to hide secrets → forced the Edge Function |
| One less deploy target | Policy bugs are security bugs, and are easy to write |

**Assessment:** correct for the current stage. It stops being correct the moment we need webhooks, scheduled jobs, or payment processing — all of which need a server.

### 2. Role checks live in `SECURITY DEFINER` functions

Every policy calls a helper (`is_active_admin()`, `is_my_client()`, `my_coach_id()`) rather than writing a subquery inline.

This is not a style preference. A policy *on* `profiles` that queries `profiles` re-enters its own policy set, and Postgres aborts with `infinite recursion detected in policy`. That took the entire application down during development. `SECURITY DEFINER` runs outside RLS and breaks the cycle.

> **Rule for anyone touching the schema:** never reference a table inside its own policy. Use a helper function.

### 3. The AI is constrained by schema, not by instruction

The model is not asked politely to behave — it is boxed in:

- **Exercise selection** is an `enum` of real catalog IDs in the JSON schema. It is *incapable* of inventing an exercise that the app can't render.
- **Output shape** is validated by structured outputs; names, defaults and IDs are re-derived server-side from the catalog.
- **Bounds** (sets, days per week, alternates) are enforced in code after the response, never assumed.
- **Publishing** is not something the function can do. Different state, different actor.

The result: an AI-generated plan is structurally identical to one a coach built by hand, so every downstream feature works on it unchanged.

### 4. The AI can be switched off from the admin panel

`app_settings.generation_mode` is read on every run. Flipping it to `static` skips the API entirely and loads the closest saved template (or a built-in split). No redeploy.

This exists so the business is never blocked by an API key, a spend cap, or an outage — and so we can A/B "does the AI draft actually save coaches time?" without a code change.

---

## Data model

| Domain | Tables |
|---|---|
| Identity & roster | `profiles` (role, `assigned_coach_id`, coach bio), `invited_roles` |
| Intake → plan pipeline | `assessments`, `plans` |
| Training history | `workout_logs`, `exercise_logs`, `exercise_prs`, `exercise_pr_history`, `body_metrics` |
| Content & comms | `workout_templates`, `messages`, `app_settings` |

Two schema choices worth flagging:

- **Assessment answers are `jsonb`, not columns.** The intake is still evolving, and a coach only ever reads it whole. Adding a question is a frontend change with no migration.
- **Plan days are `jsonb`.** A programme is a document, read and written atomically. Normalising it would buy query flexibility we don't need and cost transactional simplicity we do.

---

## Security model

| Actor | Authentication | Scope |
|---|---|---|
| Member | Supabase Auth (JWT) | Own data only |
| Coach | Supabase Auth (JWT) | Only clients assigned to them |
| Admin | **Hardcoded credentials in the client bundle** | Everything |

**The admin row is a known critical issue.** The admin panel has no Supabase session at all — it's a `localStorage` flag checked against a username and password compiled into the JavaScript. Every admin action runs through `SECURITY DEFINER` RPCs that bypass RLS entirely.

Anyone who opens the browser's source can read those credentials and gain full access to every client's medical data.

This was a deliberate shortcut for a private prototype (documented in `migration_004`). **It must be resolved before any real user data is stored.** The fix is to make admins ordinary Supabase accounts with `role = 'admin'` and let the existing `is_active_admin()` helper do the work — the policies are already written for it. Estimated effort: 1–2 days.

It also has a live functional cost today: with no JWT, the admin panel cannot call the Edge Function, so AI regeneration is only available to coaches.

---

## AI integration

**Model:** `claude-opus-5` with adaptive thinking and structured outputs.

**Input:** the assessment answers, plus the exercise catalog as compact reference lines.

**Output:** a training programme *and* a coach-facing report — summary, red flags needing a human decision, constraints programmed around, open questions for the first session, weekly structure, and progression rules.

The prompt asks for a senior coach's reasoning rather than a description: read the person first, name contradictions in the assessment, justify why this split at this frequency for this client, and pair every constraint with what was done about it. The intent is that a coach can *disagree specifically*, which is what makes the draft an accelerant rather than something to double-check.

**Failure behaviour is layered:**

```
API succeeds        → AI draft, coach reviews
API fails           → nearest template loaded, error recorded on the plan
No template exists  → built-in split loaded
Everything fails    → plan stays in the coach's queue, flagged, editable by hand
```

There is no state in which a client submits an assessment and nobody notices.

**Cost (estimate, not yet measured):** roughly 5K input tokens and 3–6K output tokens per client, putting a single generation in the region of **$0.15–0.40**. It runs once per client, not per session, so this is negligible against coach time. Worth instrumenting before scaling.

---

## Deployment

| Component | Pipeline | Cadence |
|---|---|---|
| Frontend | Push to default branch → GitHub Actions → GitHub Pages | Every push, ~2 min |
| Edge Function | `supabase functions deploy` from a developer machine | Manual |
| Database | SQL files run by hand in the Supabase SQL editor | Manual |

**The frontend and the database deploy independently, and only one of them is automated.** This is the largest process risk in the system: the UI ships in two minutes, its schema ships when someone remembers. Most of the breakage during development traced back to exactly this gap.

---

## Known risks

| # | Risk | Impact | Fix | Effort |
|---|---|---|---|---|
| 1 | Hardcoded admin credentials in the client bundle | **Critical** — full access to medical data | Move admin to Supabase Auth + `role = 'admin'` | 1–2 days |
| 2 | Migrations applied manually, no tracking of what's been run | High — schema drift, silent breakage | Adopt Supabase CLI migrations in CI | 1 day |
| 3 | No automated tests | Medium — every regression is found by a user | Playwright smoke tests on the core flow | 2–3 days |
| 4 | No error monitoring | Medium — failures are invisible until reported | Sentry or equivalent | Half a day |
| 5 | Exercise catalog duplicated into the Edge Function | Low — a sync script exists but must be remembered | Add a CI check that the snapshot is current | 2 hours |
| 6 | AI cost unmeasured | Low today, matters at volume | Log token usage per generation | 2 hours |

Items 1 and 2 should be closed before onboarding real clients. The rest are ordinary maturation.

---

## What's built vs. what's next

**Working today:** registration and assessment with autosave/resume · AI generation with coach review and publish · plan editing with alternates · per-set workout logging with PR tracking and history · coach/member realtime chat · shared workout templates with ownership rules · admin roster management · body metrics and progress charts.

**Next, in order:**

1. Close risks 1 and 2 (security and migration process)
2. Workout session flow with mandatory load + RPE per set
3. Accountability — flag a member after three missed sessions
4. Configurable check-ins (default fortnightly)
5. Coach command centre — a daily action list rather than a queue
6. Long-term progress view and milestones

---

## Appendix — repository map

```
src/app/                 routes (member dashboard, coach, admin, onboarding)
src/components/          UI, split by audience: client / coach / admin / plan / chat
src/lib/
  assessment.ts          the intake defined as data — form, coach view and AI prompt
                         all read from here, so they cannot drift apart
  exerciseLibrary.ts     84-exercise catalog with movement patterns
  planTemplates.ts       plan types and helpers
  prs.ts                 estimated 1RM (Epley), personal bests, next targets
  rotation.ts            suggests the next training day without forcing it
supabase/
  schema.sql             initial schema
  migration_002…021      incremental changes, run in order
  functions/
    generate-program/    the only server-side code in the system
scripts/
  sync-edge-data.mts     regenerates the function's catalog snapshot from src/
```

**One thing to know before contributing:** the Edge Function cannot import from `src/` — deployment only uploads `supabase/functions/`. Run `npm run sync:edge` after changing the exercise catalog or the presets, or the AI will be choosing from a stale list.
