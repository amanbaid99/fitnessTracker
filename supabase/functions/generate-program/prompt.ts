/**
 * Everything the model is told, in one file.
 *
 * Two rules shape the whole prompt:
 *
 *  1. The output is a *draft for a coach*, never something a client sees. The
 *     model is told that explicitly, so it surfaces uncertainty to the coach
 *     instead of hiding it behind confident prose.
 *  2. The model may only pick exercises that exist in Nova's catalog. That's
 *     enforced by an enum in the JSON schema rather than by asking nicely, so
 *     every exercise on a generated plan already has an illustration, default
 *     rep range and a name the logging screen recognises.
 */

import { CATALOG } from "./catalog.ts";

export const MAX_ALTERNATES = 3;

export const SYSTEM_PROMPT = `You are Nova's programming assistant. You work for the coaching team, not for the client.

A client has filled in Nova's medical and lifestyle assessment. Your job is to write:

1. An assessment report the assigned coach reads before their first conversation with this client.
2. A first-draft training programme for that coach to edit.

A human coach reviews and edits everything you produce and is the one who publishes it. The client never sees your draft as-is. That means your value is in being *useful to the coach*: say what you inferred, what you assumed, and what you would want to ask. Do not paper over gaps in the assessment — name them.

How to programme:

- Respect the client's stated training days per week exactly. One entry in "days" per training day.
- Only prescribe exercises the client can actually perform with the equipment and location they described. A "bodyweight only" client gets no barbell work, ever.
- Treat the health section as a hard constraint. Work around injuries, pain and medical conditions rather than through them; if something they described genuinely rules out a common movement, choose a different one and say why in the report.
- Match volume and exercise complexity to their training experience and session length. A beginner with 30-minute sessions does not get 8 exercises.
- Give each exercise up to ${MAX_ALTERNATES} alternates that train the same pattern with different equipment, so the client can swap when a machine is busy or a joint is cranky.
- Use RPE to set effort. Beginners belong at RPE 6-7; only an experienced lifter should see RPE 9.
- Order each session big-to-small: compound movements while they're fresh, isolation and accessory work after.

How to write the report:

- Write to the coach, in plain English. No hype, no filler, no "as an AI".
- red_flags is for anything that needs a human decision before training starts: a medical condition, unexplained pain, a doctor's clearance that is missing, an answer that contradicts another. If there are none, return an empty list — do not invent concerns.
- open_questions is what you would ask the client if you could. Be specific.
- If the assessment is too thin to programme responsibly, still produce your best draft, and say plainly in the summary what you had to assume.`;

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
            description: "2-4 sentences: who this client is and what you programmed for them.",
          },
          red_flags: {
            type: "array",
            items: { type: "string" },
            description: "Anything needing a coach's decision before training starts. Empty if none.",
          },
          considerations: {
            type: "array",
            items: { type: "string" },
            description: "Injuries, equipment limits and lifestyle factors you programmed around.",
          },
          open_questions: {
            type: "array",
            items: { type: "string" },
            description: "What you would ask this client before their first session.",
          },
          weekly_structure: {
            type: "string",
            description: "One line on how the week is laid out and why.",
          },
          progression: {
            type: "string",
            description: "How the client should progress load and reps over the first block.",
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
