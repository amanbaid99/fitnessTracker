/**
 * generate-program — turns a submitted assessment into a draft programme.
 *
 * Why an edge function at all: the app is a static export, so there is no
 * server to hold ANTHROPIC_API_KEY. This runs on Supabase, holds the key, and
 * is the only thing that ever talks to the Claude API.
 *
 * Where it sits in the pipeline:
 *
 *   submit_assessment()  → plan row created with status 'awaiting_ai'
 *   generate-program     → fills in days + ai_report, status 'pending'
 *   coach edits, publish_plan() → status 'approved', client can see it
 *
 * It deliberately never publishes. If generation fails the plan stays in the
 * coach's queue with an explanation attached, because a coach writing the
 * programme by hand is a worse day, not a broken product.
 *
 * Deploy:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase functions deploy generate-program
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { CATALOG_IDS, catalogEntry } from "./catalog.ts";
import { pickPreset } from "./presets.ts";
import {
  buildUserPrompt,
  MAX_ALTERNATES,
  programSchema,
  SYSTEM_PROMPT,
  type GeneratedProgram,
} from "./prompt.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

interface PlanRow {
  id: string;
  client_id: string;
  status: string;
  assessment_id: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  // Two clients on purpose: the caller's own token decides *who* is asking,
  // the service key does the writing (clients have no update rights on plans).
  const asCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: userData } = await asCaller.auth.getUser();
  const caller = userData?.user;
  if (!caller) return json({ error: "Not signed in" }, 401);

  let body: { assessmentId?: string; planId?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Expected a JSON body" }, 400);
  }

  // ---------------------------------------------------------------------
  // Find the plan, and check the caller is allowed near it
  // ---------------------------------------------------------------------
  let plan: PlanRow | null = null;

  if (body.planId) {
    const { data } = await admin
      .from("plans")
      .select("id, client_id, status, assessment_id")
      .eq("id", body.planId)
      .maybeSingle();
    plan = data;
  } else if (body.assessmentId) {
    const { data } = await admin
      .from("plans")
      .select("id, client_id, status, assessment_id")
      .eq("assessment_id", body.assessmentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    plan = data;
  } else {
    return json({ error: "Pass an assessmentId or a planId" }, 400);
  }

  if (!plan) return json({ error: "No plan is waiting on that assessment" }, 404);

  if (plan.client_id !== caller.id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role, active")
      .eq("id", caller.id)
      .maybeSingle();
    const staff = profile?.active && (profile.role === "coach" || profile.role === "admin");
    if (!staff) return json({ error: "That plan isn't yours" }, 403);
  }

  // Generation is idempotent: a retried invoke (flaky network, a client that
  // refreshed) must not overwrite what a coach has already started editing.
  if (plan.status !== "awaiting_ai" && !body.force) {
    return json({ status: plan.status, skipped: "already generated" });
  }

  const { data: assessment } = await admin
    .from("assessments")
    .select("id, answers, equipment_photos")
    .eq("id", plan.assessment_id ?? "")
    .maybeSingle();

  if (!assessment) return json({ error: "That plan has no assessment attached" }, 404);

  // ---------------------------------------------------------------------
  // Generate
  // ---------------------------------------------------------------------
  // The gym can turn the API off from the admin panel — no redeploy, and it
  // takes effect on the very next assessment.
  const { data: modeRow } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "generation_mode")
    .maybeSingle();

  const mode = modeRow?.value ?? "ai";

  if (mode === "static") {
    return json(await useStaticPlan(admin, plan, "Static mode is on in the admin panel"));
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!apiKey) {
    const fell = await useStaticPlan(admin, plan, "ANTHROPIC_API_KEY is not set");
    return json(fell);
  }

  try {
    const program = await generate(apiKey, assessment.answers ?? {}, assessment.equipment_photos ?? []);
    const days = toPlanDays(program);

    if (days.length === 0) throw new Error("The model returned no training days");

    await admin
      .from("plans")
      .update({
        days,
        ai_report: program.report,
        generated_by: "ai",
        status: "pending",
      })
      .eq("id", plan.id);

    await admin.from("assessments").update({ status: "processed" }).eq("id", assessment.id);

    return json({ status: "pending", generated_by: "ai", days: days.length });
  } catch (error) {
    console.error("generate-program failed", error);
    const fell = await useStaticPlan(
      admin,
      plan,
      error instanceof Error ? error.message : String(error),
    );
    return json(fell);
  }
});

/** One Claude call, constrained to the catalog and to the plan's shape. */
async function generate(
  apiKey: string,
  answers: Record<string, unknown>,
  photos: string[],
): Promise<GeneratedProgram> {
  const client = new Anthropic({ apiKey });

  // Streamed because a six-day programme with alternates is a long response,
  // and a non-streamed request that size risks the platform's HTTP timeout.
  const message = await client.messages
    .stream({
      model: "claude-opus-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: programSchema(CATALOG_IDS) },
      },
      messages: [{ role: "user", content: buildUserPrompt(answers, photos.length) }],
    })
    .finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error("The model declined to answer this assessment");
  }

  const text = message.content.find((block) => block.type === "text");
  if (!text || text.type !== "text") throw new Error("No JSON in the response");

  return JSON.parse(text.text) as GeneratedProgram;
}

const clamp = (n: number, low: number, high: number) =>
  Math.min(high, Math.max(low, Math.round(Number(n) || low)));

/**
 * Model output → the `days` shape the app already stores. Names and default
 * rest come from the catalog rather than from the model, so a generated plan
 * is indistinguishable from one a coach built in the plan editor.
 *
 * This is also where the bounds the schema can't express get enforced: set
 * counts, the alternate limit, and the length of the week.
 */
function toPlanDays(program: GeneratedProgram) {
  return program.days.slice(0, 6).map((day, index) => ({
    id: `day-${index + 1}`,
    title: day.title,
    exercises: day.exercises
      .slice(0, 10)
      .map((exercise) => {
        const catalog = catalogEntry(exercise.exerciseId);
        if (!catalog) return null;
        return {
          name: catalog.name,
          exerciseId: catalog.id,
          sets: clamp(exercise.sets, 1, 8),
          reps: exercise.reps,
          rest: exercise.rest || catalog.rest,
          tempo: exercise.tempo || "2-0-2",
          rpe: exercise.rpe,
          alternates: (exercise.alternates ?? [])
            .map((alternate) => {
              const alt = catalogEntry(alternate.exerciseId);
              if (!alt || alt.id === catalog.id) return null;
              return {
                name: alt.name,
                exerciseId: alt.id,
                sets: clamp(alternate.sets, 1, 8),
                reps: alternate.reps,
              };
            })
            .filter((a): a is NonNullable<typeof a> => a !== null)
            .slice(0, MAX_ALTERNATES),
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null),
  }))
  // A day the catalog filter emptied out would render as a blank session.
  .filter((day) => day.exercises.length > 0);
}

/**
 * The no-API path, used both when static mode is switched on in the admin
 * panel and when a generation attempt fails. Preference order:
 *
 *   1. the closest workout template (admin-owned first) — the gym's own work
 *   2. the closest built-in preset, so this always produces a real programme
 *
 * Either way the plan lands in the coach's queue as a draft, never published.
 */
async function useStaticPlan(
  admin: ReturnType<typeof createClient>,
  plan: PlanRow,
  reason: string,
) {
  const { data: assessment } = await admin
    .from("assessments")
    .select("answers")
    .eq("id", plan.assessment_id ?? "")
    .maybeSingle();

  const answers = (assessment?.answers ?? {}) as Record<string, unknown>;
  const wanted = Number(answers.days_per_week ?? 3);
  const atHome = answers.training_location === "home";

  const { data: templates } = await admin
    .from("workout_templates")
    .select("id, name, days, days_per_week, owner_role")
    .order("owner_role", { ascending: true }); // 'admin' sorts before 'coach'

  const template = (templates ?? [])
    .filter((t) => Array.isArray(t.days) && t.days.length > 0)
    .sort(
      (a, b) =>
        Math.abs((a.days_per_week ?? a.days.length) - wanted) -
        Math.abs((b.days_per_week ?? b.days.length) - wanted),
    )[0];

  const preset = template ? null : pickPreset(wanted, atHome);
  const source = template ?? preset;

  if (!source) {
    // Can't happen — there is always a preset — but the plan should still be
    // visible to a coach rather than vanish if it somehow did.
    await admin
      .from("plans")
      .update({ ai_report: { summary: "No programme could be loaded.", error: reason } })
      .eq("id", plan.id);
    return { status: "awaiting_ai", generated_by: null, reason };
  }

  const report = {
    summary: `"${source.name}" was loaded as a starting point — no AI analysis was done. Read the assessment and adjust it to this client before publishing.`,
    red_flags: [],
    considerations: [],
    open_questions: [],
    weekly_structure: "",
    progression: "",
    error: reason,
  };

  await admin
    .from("plans")
    .update({
      days: source.days,
      ai_report: report,
      generated_by: "fallback",
      status: "pending",
    })
    .eq("id", plan.id);

  return {
    status: "pending",
    generated_by: "fallback",
    source: template ? `template: ${source.name}` : `preset: ${source.name}`,
    reason,
  };
}
