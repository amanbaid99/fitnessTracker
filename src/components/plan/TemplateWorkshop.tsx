"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Lock, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlanEditor } from "@/components/plan/PlanEditor";
import { supabase } from "@/lib/supabase";
import { normalizeDays, type PlanDay } from "@/lib/planTemplates";
import { PLAN_PRESETS } from "@/lib/planPresets";

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  days: PlanDay[] | null;
  days_per_week: number | null;
  created_by: string | null;
  owner_name?: string;
  owner_role: "admin" | "coach";
  updated_at: string;
}

interface TemplateWorkshopProps {
  /**
   * "admin" writes through definer RPCs (the panel has no Supabase session)
   * and may edit anything; "coach" writes directly under RLS and may only
   * edit its own templates.
   */
  mode: "admin" | "coach";
  /** The signed-in coach — decides which rows are editable in coach mode. */
  coachId?: string;
}

interface Draft {
  id: string | null;
  name: string;
  description: string;
  days: PlanDay[];
}

export function TemplateWorkshop({ mode, coachId }: TemplateWorkshopProps) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (mode === "admin") {
      const { data, error: loadError } = await supabase.rpc("admin_list_templates");
      return { rows: (data as WorkoutTemplate[]) ?? [], error: loadError };
    }

    const { data, error: loadError } = await supabase
      .from("workout_templates")
      .select("id, name, description, days, days_per_week, created_by, owner_role, updated_at")
      .order("updated_at", { ascending: false });
    return { rows: (data as WorkoutTemplate[]) ?? [], error: loadError };
  }, [mode]);

  useEffect(() => {
    let active = true;

    async function load() {
      const { rows, error: loadError } = await fetchTemplates();
      if (!active) return;
      if (loadError) setError(loadError.message);
      setTemplates(rows);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [fetchTemplates]);

  async function refresh() {
    const { rows } = await fetchTemplates();
    setTemplates(rows);
  }

  /** Admins own everything; a coach owns only what they wrote. */
  function canEdit(template: WorkoutTemplate) {
    if (mode === "admin") return true;
    return template.owner_role === "coach" && template.created_by === coachId;
  }

  function startNew(days: PlanDay[] = [], name = "", description = "") {
    setError(null);
    setDraft({ id: null, name, description, days: normalizeDays(days) });
  }

  function startEdit(template: WorkoutTemplate) {
    setError(null);
    setDraft({
      id: template.id,
      name: template.name,
      description: template.description ?? "",
      days: normalizeDays(template.days),
    });
  }

  async function save() {
    if (!draft) return;
    setError(null);

    if (!draft.name.trim()) {
      setError("Give the template a name.");
      return;
    }
    if (draft.days.every((day) => day.exercises.length === 0)) {
      setError("Add at least one exercise.");
      return;
    }

    setSaving(true);

    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      days: draft.days,
      days_per_week: draft.days.length,
    };

    const result =
      mode === "admin"
        ? await supabase.rpc("admin_save_template", {
            p_id: draft.id,
            p_name: payload.name,
            p_description: payload.description,
            p_days: payload.days,
            p_days_per_week: payload.days_per_week,
          })
        : draft.id
          ? await supabase
              .from("workout_templates")
              .update({ ...payload, updated_at: new Date().toISOString() })
              .eq("id", draft.id)
          : await supabase
              .from("workout_templates")
              .insert({ ...payload, created_by: coachId, owner_role: "coach" });

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setDraft(null);
    refresh();
  }

  async function remove(template: WorkoutTemplate) {
    setError(null);

    const result =
      mode === "admin"
        ? await supabase.rpc("admin_delete_template", { p_id: template.id })
        : await supabase.from("workout_templates").delete().eq("id", template.id);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    refresh();
  }

  if (draft) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ft-text">
            {draft.id ? "Edit template" : "New template"}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
            <X className="size-3.5" />
            Cancel
          </Button>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ft-text">Name</span>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. Beginner Push/Pull/Legs"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ft-text">
            Description <span className="text-ft-muted">(optional)</span>
          </span>
          <Textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Who it's for, how to run it…"
            rows={2}
          />
        </label>

        <PlanEditor
          days={draft.days}
          showCoachFields
          onChange={(days) => setDraft({ ...draft, days })}
        />

        {error && <p className="text-sm text-ft-danger">{error}</p>}

        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save template"}
          </Button>
          <Button variant="outline" onClick={() => setDraft(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-ft-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => startNew()}>
          <Plus className="size-3.5" />
          New template
        </Button>
        <span className="text-xs text-ft-muted">or start from a built-in split:</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PLAN_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() =>
              startNew(
                JSON.parse(JSON.stringify(preset.days)) as PlanDay[],
                preset.name,
                preset.tagline,
              )
            }
            className="rounded-full bg-ft-surface px-3 py-1.5 text-xs font-medium text-ft-muted ring-1 ring-ft-border transition-colors hover:text-ft-text"
          >
            <Copy className="mr-1 inline size-3" />
            {preset.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-ft-muted">Loading templates…</p>
      ) : templates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ft-border px-4 py-6 text-center text-sm text-ft-muted">
          No templates yet. Create one and every coach can assign it.
        </p>
      ) : (
        <ul className="space-y-2">
          {templates.map((template) => {
            const editable = canEdit(template);
            const dayCount = template.days_per_week ?? template.days?.length ?? 0;

            return (
              <li
                key={template.id}
                className="rounded-xl border border-ft-border/70 bg-ft-surface p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-ft-text">
                      <span className="truncate">{template.name}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          template.owner_role === "admin"
                            ? "bg-ft-accent/10 text-ft-accent"
                            : "bg-ft-bg text-ft-muted",
                        )}
                      >
                        {template.owner_role === "admin"
                          ? "Admin"
                          : (template.owner_name ?? "Coach")}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-ft-muted">
                      {dayCount} day{dayCount === 1 ? "" : "s"}
                      {template.description ? ` · ${template.description}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {editable ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => startEdit(template)}>
                          Edit
                        </Button>
                        <button
                          type="button"
                          aria-label={`Delete ${template.name}`}
                          onClick={() => remove(template)}
                          className="rounded-md p-2 text-ft-muted transition-colors hover:bg-ft-bg hover:text-ft-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className="flex items-center gap-1 text-xs text-ft-muted"
                          title="Only its owner or an admin can edit this template"
                        >
                          <Lock className="size-3" />
                          Read-only
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            startNew(
                              normalizeDays(template.days),
                              `${template.name} (copy)`,
                              template.description ?? "",
                            )
                          }
                        >
                          <Copy className="size-3.5" />
                          Copy
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
