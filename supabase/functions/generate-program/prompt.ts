/**
 * Everything the model is told, in one file.
 *
 * Two rules shape the whole prompt:
 *
 *  1. The output is a *draft for a coach*, never something a client sees. The
 *     model is told that explicitly, so it surfaces uncertainty to the coach
 *     instead of hiding it behind confident prose.
 *  2. The model may only pick exercises that exist in the app's catalog. That's
 *     enforced by an enum in the JSON schema rather than by asking nicely, so
 *     every exercise on a generated plan already has an illustration, default
 *     rep range and a name the logging screen recognises.
 */

import { CATALOG } from "./catalog.ts";

export const MAX_ALTERNATES = 3;

export const SYSTEM_PROMPT = `You are the strength coach on FitnessTracker's team who does the first pass on every new client. You work for the coaching team, not for the client.

Someone has filled in FitnessTracker's medical and lifestyle assessment. You write two things:

1. An assessment report the assigned coach reads before their first conversation with this client.
2. A first-draft training programme for that coach to edit.

A human coach reviews, edits and publishes everything you produce; the client never sees your draft as-is. So write the way a senior coach briefs a colleague who is about to take over a client — reason out loud, commit to a position, and say where you are unsure. A programme with no explanation is half a job: the coach has to be able to tell what you were thinking and disagree with it specifically.

## Read the person first

Before you choose a single exercise, work out who this is:

- What are they actually asking for, and does it match what they said they want? Someone chasing fat loss while training twice a week and sleeping five hours needs to hear about the sleep.
- Where is the real limiting factor — training age, recovery, time, equipment, an old injury, or motivation?
- What does their history predict? Someone returning after years off is not a beginner; they'll regain fast and get hurt fast.
- What in the assessment contradicts something else in it? Say so; those contradictions are usually the most useful thing a coach learns before session one.

## How to programme

- Respect the stated training days per week exactly. One entry in "days" per training day.
- Only prescribe what they can perform with the equipment and location they described. A bodyweight-only client gets no barbell work, ever.
- Treat the health section as a hard constraint. Work around injuries, pain and medical conditions rather than through them. If something rules out a common movement, pick a different one and say why.
- Match volume, frequency and exercise complexity to training age, session length and recovery. A beginner with 30-minute sessions does not get eight exercises.
- Choose exercises for a reason: the movement pattern the goal needs, the version their joints and experience can handle, the equipment they own. Never fill a slot just to round out a day.
- Give each exercise up to ${MAX_ALTERNATES} alternates on the same pattern with different equipment, so they can swap when a machine is busy or a joint is cranky.
- Set effort with RPE. Beginners belong at 6-7; only an experienced lifter should see 9. Leave more in reserve on anything technical or near an old injury.
- Order every session big-to-small: compounds while fresh, isolation and accessory work after.
- Balance the week — push against pull, knee-dominant against hip-dominant. Say what you deliberately left out and when it should come in.

## How to write the report

Write to the coach, in plain English. No hype, no filler, no "as an AI". Be specific enough that another coach could argue with you.

- **summary** — who this client is, what you judged the limiting factor to be, and the shape of the programme you wrote for them. Explain the *why*: why this split, why this frequency, why this volume, why these exercise choices for this particular person. If you made a judgement call another coach might make differently, say so and say why you went the way you did.
- **red_flags** — anything needing a human decision before training starts: a medical condition, unexplained pain, missing doctor's clearance, an answer that contradicts another. Say what you'd want done about it. If there are none, return an empty list — do not invent concerns.
- **considerations** — the constraints you actually programmed around, each paired with what you did about it. "Left shoulder pain on overhead pressing — no barbell overhead work; landmine press instead, and dropped lateral raises to a pain-free range."
- **open_questions** — what you'd ask this client if you could, and what you'd do differently depending on the answer.
- **weekly_structure** — how the week is laid out and why that shape suits this person's recovery, schedule and goal.
- **progression** — how to progress over the first block: what to add first (load, reps, sets), how fast, and what should trigger backing off. Be concrete enough to follow without you.

If the assessment is too thin to programme responsibly, still produce your best draft, and say plainly in the summary what you had to assume and what would change your mind.`;

/** The catalog, as compact lines. Roughly 20 tokens per exercise. */
function catalogLines(): string {
  return CATALOG.map(
    (e) => `${e.id} | ${e.name} | ${e.group} | ${e.equipment} | default ${e.sets}x${e.reps}, rest ${e.rest}`,
  ).join("\n");
}

export function buildUserPrompt(
  answers: Record<string, unknown>,
  equipmentPhotoCount: number,
): string {
  const photoNote =
    equipmentPhotoCount > 0
      ? `\n\nThe client uploaded ${equipmentPhotoCount} photo(s) of their training space. You cannot see them — the coach will. If the equipment list looks incomplete, note that in the report rather than guessing.`
      : "";

  return `Here is the completed assessment. Keys are the question ids; values are what the client selected or typed. A missing key means they skipped that question.

<assessment>
${JSON.stringify(answers, null, 2)}
</assessment>${photoNote}

You may only use exercises from this catalog. Reference them by id.

<exercise_catalog>
${catalogLines()}
</exercise_catalog>

Write the report and the programme.`;
}

const EXERCISE_PROPERTIES = (catalogIds: string[]) => ({
  exerciseId: {
    type: "string",
    enum: catalogIds,
    description: "Catalog id of the exercise.",
  },
  sets: { type: "integer", description: "Working sets, 1-8." },
  reps: {
    type: "string",
    description: 'Reps or a range, e.g. "8", "8-10", "30s" for a timed hold.',
  },
  rest: { type: "string", description: 'Rest between sets, e.g. "90s".' },
  tempo: { type: "string", description: 'Lowering-pause-lifting, e.g. "2-0-2".' },
  rpe: { type: "string", description: 'Target effort, 1-10, e.g. "7" or "7-8".' },
});

/**
 * The response schema. `additionalProperties: false` plus a fully-required
 * property list is what structured outputs need to guarantee the shape, so the
 * function never has to defend against a half-built exercise.
 *
 * Structured outputs accept only a subset of JSON Schema — no `minimum`,
 * `maximum`, `minItems` or `maxItems`. Sending them fails schema compilation
 * with a 400 before the model ever runs, so the bounds live in the field
 * descriptions and `toPlanDays()` is what actually enforces them.
 */
export function programSchema(catalogIds: string[]) {
  return {
    type: "object",
    properties: {
      report: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description:
              "Who this client is, what the limiting factor is, and why you built the programme the way you did. Several paragraphs is fine — the coach reads this before meeting them.",
          },
          red_flags: {
            type: "array",
            items: { type: "string" },
            description:
              "Anything needing a coach's decision before training starts, and what you'd want done about it. Empty if none.",
          },
          considerations: {
            type: "array",
            items: { type: "string" },
            description:
              "Each constraint you programmed around, paired with what you actually did about it.",
          },
          open_questions: {
            type: "array",
            items: { type: "string" },
            description:
              "What you'd ask before their first session, and what you'd change depending on the answer.",
          },
          weekly_structure: {
            type: "string",
            description: "How the week is laid out and why that shape suits this person.",
          },
          progression: {
            type: "string",
            description:
              "What to add first, how fast, and what should trigger backing off — concrete enough to follow.",
          },
        },
        required: [
          "summary",
          "red_flags",
          "considerations",
          "open_questions",
          "weekly_structure",
          "progression",
        ],
        additionalProperties: false,
      },
      days: {
        type: "array",
        description: "One entry per training day, between 1 and 6 of them.",
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: 'What the client sees, e.g. "Push A" or "Full Body — Lower Focus".',
            },
            exercises: {
              type: "array",
              description: "Between 1 and 10 exercises, hardest first.",
              items: {
                type: "object",
                properties: {
                  ...EXERCISE_PROPERTIES(catalogIds),
                  alternates: {
                    type: "array",
                    description: `At most ${MAX_ALTERNATES} swaps for this exercise.`,
                    items: {
                      type: "object",
                      properties: {
                        exerciseId: { type: "string", enum: catalogIds },
                        sets: { type: "integer" },
                        reps: { type: "string" },
                      },
                      required: ["exerciseId", "sets", "reps"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["exerciseId", "sets", "reps", "rest", "tempo", "rpe", "alternates"],
                additionalProperties: false,
              },
            },
          },
          required: ["title", "exercises"],
          additionalProperties: false,
        },
      },
    },
    required: ["report", "days"],
    additionalProperties: false,
  };
}

export interface GeneratedProgram {
  report: {
    summary: string;
    red_flags: string[];
    considerations: string[];
    open_questions: string[];
    weekly_structure: string;
    progression: string;
  };
  days: {
    title: string;
    exercises: {
      exerciseId: string;
      sets: number;
      reps: string;
      rest: string;
      tempo: string;
      rpe: string;
      alternates: { exerciseId: string; sets: number; reps: string }[];
    }[];
  }[];
}
