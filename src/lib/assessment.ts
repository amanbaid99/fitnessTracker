/**
 * Nova's medical assessment.
 *
 * The whole intake lives here as data rather than markup so the form, the
 * coach's read-only view, and the AI prompt all describe the same questions.
 * Fields come from the workflow document; the remaining Google Form questions
 * slot in as extra entries without touching the form component.
 */

export type FieldKind =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "date"
  | "number"
  | "choice"
  | "multi"
  | "scale";

export interface AssessmentField {
  id: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  unit?: string;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  /** Only shown when another field holds one of these values. */
  showWhen?: { field: string; equals: string[] };
}

export interface AssessmentStep {
  id: string;
  title: string;
  intro?: string;
  fields: AssessmentField[];
}

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const ASSESSMENT_STEPS: AssessmentStep[] = [
  {
    id: "about-you",
    title: "About you",
    intro: "The basics your coach needs to know who they're training.",
    fields: [
      { id: "full_name", label: "Full name", kind: "text", required: true, placeholder: "Aman Baid" },
      { id: "email", label: "Email address", kind: "email", required: true, placeholder: "you@example.com" },
      { id: "phone", label: "Phone number", kind: "tel", required: true, placeholder: "+91 98765 43210" },
      { id: "date_of_birth", label: "Date of birth", kind: "date", required: true },
      {
        id: "gender",
        label: "Gender",
        kind: "choice",
        required: true,
        options: [
          { value: "female", label: "Female" },
          { value: "male", label: "Male" },
          { value: "other", label: "Other" },
          { value: "prefer-not-to-say", label: "Prefer not to say" },
        ],
      },
      { id: "height_cm", label: "Height", kind: "number", unit: "cm", required: true, min: 100, max: 250 },
      { id: "weight_kg", label: "Weight", kind: "number", unit: "kg", required: true, min: 30, max: 300 },
    ],
  },
  {
    id: "goals",
    title: "Your goal",
    intro: "What you want out of training shapes everything your coach writes.",
    fields: [
      {
        id: "primary_goal",
        label: "Primary goal",
        kind: "choice",
        required: true,
        options: [
          { value: "build-muscle", label: "Build muscle" },
          { value: "fat-loss", label: "Lose fat" },
          { value: "strength", label: "Get stronger" },
          { value: "general-fitness", label: "General health and fitness" },
          { value: "sport", label: "Train for a sport or event" },
          { value: "rehab", label: "Recover from an injury" },
        ],
      },
      {
        id: "goal_detail",
        label: "Anything specific you're working towards?",
        kind: "textarea",
        placeholder: "A wedding in June, a first pull-up, getting back to 5-a-side…",
      },
      {
        id: "goal_timeline",
        label: "Timeframe",
        kind: "choice",
        options: [
          { value: "3-months", label: "About 3 months" },
          { value: "6-months", label: "About 6 months" },
          { value: "12-months", label: "A year or more" },
          { value: "open", label: "No fixed deadline" },
        ],
      },
    ],
  },
  {
    id: "health",
    title: "Health & medical history",
    intro: "Be as complete as you can — this is what keeps your training safe.",
    fields: [
      {
        id: "medical_conditions",
        label: "Do any of these apply to you?",
        kind: "multi",
        options: [
          { value: "heart-disease", label: "Heart disease" },
          { value: "high-blood-pressure", label: "High blood pressure" },
          { value: "diabetes", label: "Diabetes" },
          { value: "asthma", label: "Asthma or breathing issues" },
          { value: "thyroid", label: "Thyroid condition" },
          { value: "pregnancy", label: "Pregnant or post-partum" },
          { value: "none", label: "None of these" },
        ],
      },
      {
        id: "medical_history",
        label: "Medical history",
        kind: "textarea",
        hint: "Conditions, surgeries, medications, anything a doctor has told you about training.",
        placeholder: "Shoulder surgery in 2022, on medication for blood pressure…",
      },
      {
        id: "previous_injuries",
        label: "Previous injuries",
        kind: "textarea",
        placeholder: "Torn ACL (left knee, 2019), lower back strain last year…",
      },
      {
        id: "current_pain",
        label: "Any pain or physical limitations right now?",
        kind: "textarea",
        placeholder: "Left shoulder hurts on overhead pressing, knees ache going downstairs…",
      },
      {
        id: "cleared_by_doctor",
        label: "Has a doctor cleared you for exercise?",
        kind: "choice",
        options: [...YES_NO, { value: "not-needed", label: "Never needed to ask" }],
      },
    ],
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    intro: "Recovery is half the programme. This tells your coach what you're working with.",
    fields: [
      {
        id: "current_routine",
        label: "What does your training look like right now?",
        kind: "textarea",
        placeholder: "Gym twice a week, mostly machines. Walk the dog daily.",
      },
      {
        id: "training_experience",
        label: "How long have you trained?",
        kind: "choice",
        required: true,
        options: [
          { value: "beginner", label: "New, or coming back after a long break" },
          { value: "intermediate", label: "Six months to a couple of years" },
          { value: "advanced", label: "Several years, consistently" },
        ],
      },
      {
        id: "days_per_week",
        label: "Days a week you can train",
        kind: "choice",
        required: true,
        options: [2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} days` })),
      },
      {
        id: "session_length",
        label: "How long per session?",
        kind: "choice",
        options: [
          { value: "30", label: "Around 30 minutes" },
          { value: "45", label: "45 minutes" },
          { value: "60", label: "An hour" },
          { value: "90", label: "90 minutes or more" },
        ],
      },
      { id: "sleep_hours", label: "Sleep per night", kind: "number", unit: "hours", min: 3, max: 12 },
      {
        id: "sleep_quality",
        label: "Sleep quality",
        kind: "scale",
        hint: "1 = terrible, 5 = excellent",
        min: 1,
        max: 5,
      },
      {
        id: "nutrition_habits",
        label: "How would you describe your eating?",
        kind: "textarea",
        placeholder: "Three meals, cook most nights, takeaway at weekends…",
      },
      {
        id: "daily_activity",
        label: "Daily activity level outside training",
        kind: "choice",
        options: [
          { value: "sedentary", label: "Desk job, little walking" },
          { value: "light", label: "On my feet some of the day" },
          { value: "active", label: "Active job or lots of walking" },
          { value: "very-active", label: "Physical job" },
        ],
      },
      {
        id: "stress_level",
        label: "Stress level lately",
        kind: "scale",
        hint: "1 = very low, 5 = very high",
        min: 1,
        max: 5,
      },
    ],
  },
  {
    id: "setup",
    title: "Where you'll train",
    intro: "So your programme only contains things you can actually do.",
    fields: [
      {
        id: "training_location",
        label: "Where will you train?",
        kind: "choice",
        required: true,
        options: [
          { value: "gym", label: "Full gym" },
          { value: "home", label: "At home" },
          { value: "both", label: "A mix of both" },
        ],
      },
      {
        id: "equipment",
        label: "What equipment do you have access to?",
        kind: "multi",
        options: [
          { value: "barbell", label: "Barbell & plates" },
          { value: "dumbbells", label: "Dumbbells" },
          { value: "kettlebells", label: "Kettlebells" },
          { value: "machines", label: "Machines" },
          { value: "cables", label: "Cables" },
          { value: "bands", label: "Resistance bands" },
          { value: "pull-up-bar", label: "Pull-up bar" },
          { value: "bench", label: "Bench" },
          { value: "cardio-machines", label: "Cardio machines" },
          { value: "bodyweight-only", label: "Bodyweight only" },
        ],
      },
      {
        id: "equipment_notes",
        label: "Anything else about your setup?",
        kind: "textarea",
        showWhen: { field: "training_location", equals: ["home", "both"] },
        placeholder: "Adjustable dumbbells up to 24kg, a bench, and a doorway pull-up bar.",
      },
    ],
  },
  {
    id: "anything-else",
    title: "Anything else",
    fields: [
      {
        id: "preferences",
        label: "Exercises you love or hate?",
        kind: "textarea",
        placeholder: "Hate burpees. Would like to learn to deadlift properly.",
      },
      {
        id: "notes_for_coach",
        label: "Anything else your coach should know?",
        kind: "textarea",
        placeholder: "Travel for work every other week…",
      },
    ],
  },
];

export type AssessmentAnswers = Record<string, string | string[] | undefined>;

export function isFieldVisible(field: AssessmentField, answers: AssessmentAnswers): boolean {
  if (!field.showWhen) return true;
  const value = answers[field.showWhen.field];
  return typeof value === "string" && field.showWhen.equals.includes(value);
}

/** Required, visible fields that are still blank on a given step. */
export function missingRequired(
  step: AssessmentStep,
  answers: AssessmentAnswers,
): AssessmentField[] {
  return step.fields.filter((field) => {
    if (!field.required || !isFieldVisible(field, answers)) return false;
    const value = answers[field.id];
    return Array.isArray(value) ? value.length === 0 : !value?.toString().trim();
  });
}

export function assessmentProgress(answers: AssessmentAnswers): number {
  const visible = ASSESSMENT_STEPS.flatMap((step) =>
    step.fields.filter((field) => isFieldVisible(field, answers)),
  );
  const answered = visible.filter((field) => {
    const value = answers[field.id];
    return Array.isArray(value) ? value.length > 0 : Boolean(value?.toString().trim());
  });
  return Math.round((answered.length / Math.max(1, visible.length)) * 100);
}

/** Flat label/value pairs for the coach's summary and the AI prompt. */
export function summariseAnswers(
  answers: AssessmentAnswers,
): { step: string; items: { label: string; value: string }[] }[] {
  return ASSESSMENT_STEPS.map((step) => ({
    step: step.title,
    items: step.fields
      .filter((field) => isFieldVisible(field, answers))
      .map((field) => {
        const raw = answers[field.id];
        const value = Array.isArray(raw)
          ? raw
              .map((v) => field.options?.find((o) => o.value === v)?.label ?? v)
              .join(", ")
          : field.options?.find((o) => o.value === raw)?.label ?? (raw ?? "");
        return { label: field.label, value: value ? `${value}${field.unit ? ` ${field.unit}` : ""}` : "—" };
      })
      .filter((item) => item.value !== "—"),
  })).filter((group) => group.items.length > 0);
}
