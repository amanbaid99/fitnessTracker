"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, CloudOff, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ASSESSMENT_STEPS,
  assessmentProgress,
  isFieldVisible,
  missingRequired,
  type AssessmentAnswers,
  type AssessmentField,
} from "@/lib/assessment";

type SaveState = "idle" | "saving" | "saved" | "error";

const EQUIPMENT_BUCKET = "assessment-uploads";

function Field({
  field,
  value,
  onChange,
}: {
  field: AssessmentField;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  const label = (
    <span className="mb-1.5 block text-sm font-medium text-nova-text">
      {field.label}
      {field.required && <span className="ml-1 text-nova-danger">*</span>}
      {field.unit && <span className="ml-1 font-normal text-nova-muted">({field.unit})</span>}
    </span>
  );

  const hint = field.hint && (
    <span className="mt-1 block text-xs text-nova-muted">{field.hint}</span>
  );

  if (field.kind === "choice") {
    return (
      <div>
        {label}
        <div className="grid gap-2 sm:grid-cols-2">
          {field.options?.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={value === option.value}
              className={cn(
                "rounded-xl border bg-nova-surface px-3.5 py-3 text-left text-sm transition-colors",
                value === option.value
                  ? "border-nova-accent text-nova-text ring-1 ring-nova-accent"
                  : "border-nova-border/70 text-nova-muted hover:text-nova-text",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {hint}
      </div>
    );
  }

  if (field.kind === "multi") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {field.options?.map((option) => {
            const on = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  // "None of these" is exclusive — picking it clears the rest.
                  if (option.value === "none") {
                    onChange(on ? [] : ["none"]);
                    return;
                  }
                  const next = selected.filter((v) => v !== "none");
                  onChange(on ? next.filter((v) => v !== option.value) : [...next, option.value]);
                }}
                aria-pressed={on}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  on
                    ? "border-nova-accent bg-nova-accent/[0.06] text-nova-accent"
                    : "border-nova-border/70 bg-nova-surface text-nova-muted hover:text-nova-text",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {hint}
      </div>
    );
  }

  if (field.kind === "scale") {
    const min = field.min ?? 1;
    const max = field.max ?? 5;
    return (
      <div>
        {label}
        <div className="flex gap-2">
          {Array.from({ length: max - min + 1 }, (_, i) => String(min + i)).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={value === n}
              className={cn(
                "h-11 flex-1 rounded-xl border text-sm font-medium transition-colors",
                value === n
                  ? "border-nova-accent bg-nova-accent text-white"
                  : "border-nova-border/70 bg-nova-surface text-nova-muted hover:text-nova-text",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {hint}
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <label className="block">
        {label}
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
        />
        {hint}
      </label>
    );
  }

  const inputType =
    field.kind === "number"
      ? "number"
      : field.kind === "date"
        ? "date"
        : field.kind === "email"
          ? "email"
          : field.kind === "tel"
            ? "tel"
            : "text";

  return (
    <label className="block">
      {label}
      <Input
        type={inputType}
        inputMode={field.kind === "number" ? "decimal" : undefined}
        min={field.min}
        max={field.max}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
      {hint}
    </label>
  );
}

export default function AssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = ASSESSMENT_STEPS[stepIndex];
  const progress = assessmentProgress(answers);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/register");
        return;
      }

      const userId = sessionData.session.user.id;

      // Resume the draft if there is one; a submitted assessment means the
      // client is past this stage entirely.
      const { data: existing } = await supabase
        .from("assessments")
        .select("id, answers, current_step, status, equipment_photos")
        .eq("client_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (existing?.status && existing.status !== "draft") {
        router.replace("/onboarding/review");
        return;
      }

      if (existing) {
        setAssessmentId(existing.id);
        setAnswers((existing.answers as AssessmentAnswers) ?? {});
        setPhotos(existing.equipment_photos ?? []);
        setStepIndex(Math.min(existing.current_step ?? 0, ASSESSMENT_STEPS.length - 1));
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();

        const seeded: AssessmentAnswers = {
          full_name: profile?.full_name ?? "",
          email: sessionData.session.user.email ?? "",
        };

        const { data: created } = await supabase
          .from("assessments")
          .insert({ client_id: userId, answers: seeded })
          .select("id")
          .single();

        if (!active) return;
        setAssessmentId(created?.id ?? null);
        setAnswers(seeded);
      }

      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  /** Debounced autosave — the doc requires the form to survive a dropped
   *  connection or a closed tab without losing what's been typed. */
  const scheduleSave = useCallback(
    (nextAnswers: AssessmentAnswers, nextStep: number) => {
      if (!assessmentId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);

      setSaveState("saving");
      saveTimer.current = setTimeout(async () => {
        const { error } = await supabase
          .from("assessments")
          .update({
            answers: nextAnswers,
            current_step: nextStep,
            updated_at: new Date().toISOString(),
          })
          .eq("id", assessmentId);

        setSaveState(error ? "error" : "saved");
      }, 700);
    },
    [assessmentId],
  );

  function setAnswer(fieldId: string, value: string | string[]) {
    setErrors([]);
    setAnswers((prev) => {
      const next = { ...prev, [fieldId]: value };
      scheduleSave(next, stepIndex);
      return next;
    });
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files?.length || !assessmentId) return;
    setUploading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;

    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${userId}/${assessmentId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(EQUIPMENT_BUCKET).upload(path, file);
      if (!error) uploaded.push(path);
    }

    const next = [...photos, ...uploaded];
    setPhotos(next);
    await supabase.from("assessments").update({ equipment_photos: next }).eq("id", assessmentId);
    setUploading(false);
  }

  async function removePhoto(path: string) {
    const next = photos.filter((p) => p !== path);
    setPhotos(next);
    await supabase.storage.from(EQUIPMENT_BUCKET).remove([path]);
    if (assessmentId) {
      await supabase.from("assessments").update({ equipment_photos: next }).eq("id", assessmentId);
    }
  }

  function goToStep(next: number) {
    setStepIndex(next);
    setErrors([]);
    scheduleSave(answers, next);
    window.scrollTo({ top: 0 });
  }

  function handleNext() {
    const missing = missingRequired(step, answers);
    if (missing.length > 0) {
      setErrors(missing.map((field) => field.label));
      return;
    }
    if (stepIndex < ASSESSMENT_STEPS.length - 1) goToStep(stepIndex + 1);
  }

  async function handleSubmit() {
    const missing = ASSESSMENT_STEPS.flatMap((s) => missingRequired(s, answers));
    if (missing.length > 0) {
      setErrors(missing.map((field) => field.label));
      return;
    }
    if (!assessmentId) return;

    setSubmitting(true);

    // Flush anything still pending before the row is read server-side.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await supabase
      .from("assessments")
      .update({ answers, current_step: stepIndex })
      .eq("id", assessmentId);

    const { error } = await supabase.rpc("submit_assessment", {
      p_assessment_id: assessmentId,
    });

    setSubmitting(false);

    if (error) {
      setErrors([error.message]);
      return;
    }

    router.push("/onboarding/review");
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading your assessment…</p>
      </div>
    );
  }

  const isLast = stepIndex === ASSESSMENT_STEPS.length - 1;
  const showEquipmentPhotos =
    step.id === "setup" && ["home", "both"].includes((answers.training_location as string) ?? "");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-12 pt-5 md:max-w-lg md:px-0">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => (stepIndex === 0 ? router.push("/") : goToStep(stepIndex - 1))}
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full text-nova-muted hover:bg-nova-surface hover:text-nova-text"
        >
          <ArrowLeft className="size-5" />
        </button>

        <p className="flex items-center gap-1.5 text-xs text-nova-muted">
          {saveState === "saving" && (
            <>
              <Loader2 className="size-3 animate-spin" />
              Saving
            </>
          )}
          {saveState === "saved" && (
            <>
              <Check className="size-3 text-nova-success" />
              Progress saved
            </>
          )}
          {saveState === "error" && (
            <>
              <CloudOff className="size-3 text-nova-danger" />
              Offline — we&apos;ll retry
            </>
          )}
        </p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-nova-muted">
          <span>
            Step {stepIndex + 1} of {ASSESSMENT_STEPS.length}
          </span>
          <span>{progress}% complete</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-nova-border">
          <div
            className="h-full rounded-full bg-nova-accent transition-all"
            style={{ width: `${Math.max(4, progress)}%` }}
          />
        </div>
      </div>

      <h1 className="mt-5 text-xl font-semibold text-nova-text">{step.title}</h1>
      {step.intro && <p className="mt-1 text-sm text-nova-muted">{step.intro}</p>}

      <div className="mt-6 flex-1 space-y-5">
        {step.fields
          .filter((field) => isFieldVisible(field, answers))
          .map((field) => (
            <Field
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={(value) => setAnswer(field.id, value)}
            />
          ))}

        {showEquipmentPhotos && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-nova-text">
              Photos of your equipment
            </span>
            <p className="mb-2 text-xs text-nova-muted">
              Optional, but it helps Nova identify exactly what you have and build around it.
            </p>

            {photos.length > 0 && (
              <ul className="mb-2 space-y-1.5">
                {photos.map((path) => (
                  <li
                    key={path}
                    className="flex items-center gap-2 rounded-lg border border-nova-border/70 bg-nova-surface px-3 py-2"
                  >
                    <Camera className="size-3.5 shrink-0 text-nova-muted" />
                    <span className="min-w-0 flex-1 truncate text-xs text-nova-text">
                      {path.split("/").pop()}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhoto(path)}
                      aria-label="Remove photo"
                      className="text-nova-muted hover:text-nova-danger"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-nova-accent/50 py-3 text-sm font-medium text-nova-accent">
              <Camera className="size-4" />
              {uploading ? "Uploading…" : "Add photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files)}
              />
            </label>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mt-5 rounded-xl border border-nova-danger/30 bg-nova-danger/[0.05] px-3 py-2.5">
          <p className="text-sm font-medium text-nova-danger">
            {errors.length === 1 ? "Still needed:" : "Still needed:"}
          </p>
          <p className="mt-0.5 text-xs text-nova-danger">{errors.join(" · ")}</p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {stepIndex > 0 && (
          <Button variant="outline" className="flex-1" onClick={() => goToStep(stepIndex - 1)}>
            Back
          </Button>
        )}
        {isLast ? (
          <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit assessment"}
          </Button>
        ) : (
          <Button className="flex-1" onClick={handleNext}>
            Continue
          </Button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-nova-muted">
        Your answers save as you go — you can close this and pick up where you left off.
      </p>
    </div>
  );
}
