"use client";

import { useState } from "react";
import { Check, ChevronDown, CircleDot, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { relativeDay } from "@/lib/rotation";
import type { PlanDay } from "@/lib/planTemplates";

interface DaySelectorProps {
  days: PlanDay[];
  activeDayId: string;
  /** Next in the rotation — the day after whatever was finished last. */
  suggestedDayId: string | null;
  lastCompleted: Map<string, string>;
  completedTodayDayIds: Set<string>;
  onSelect: (dayId: string) => void;
}

function dayLabel(day: PlanDay) {
  return day.title.split("—")[0].trim() || "Untitled";
}

function daySubtitle(day: PlanDay) {
  const parts = day.title.split("—");
  return parts.length > 1 ? parts.slice(1).join("—").trim() : "";
}

export function DaySelector({
  days,
  activeDayId,
  suggestedDayId,
  lastCompleted,
  completedTodayDayIds,
  onSelect,
}: DaySelectorProps) {
  const [open, setOpen] = useState(false);

  const activeDay = days.find((day) => day.id === activeDayId) ?? days[0];
  const suggestedDay = days.find((day) => day.id === suggestedDayId);
  if (!activeDay) return null;

  const activeDone = completedTodayDayIds.has(activeDay.id);
  const showingSuggested = activeDay.id === suggestedDayId;

  // Once today's session is done, point at whatever comes next in the
  // rotation rather than leaving the finished day as the call to action.
  const upNext =
    activeDone && suggestedDay && suggestedDay.id !== activeDay.id ? suggestedDay : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide",
                activeDone ? "text-nova-success" : "text-nova-accent",
              )}
            >
              {activeDone ? (
                <>
                  <Check className="size-3.5" />
                  Completed today
                </>
              ) : showingSuggested ? (
                <>
                  <Sparkles className="size-3.5" />
                  Up next
                </>
              ) : (
                <>
                  <CircleDot className="size-3.5" />
                  Your pick
                </>
              )}
            </p>

            <h2 className="mt-0.5 truncate text-base font-semibold text-nova-text md:text-lg">
              {dayLabel(activeDay)}
            </h2>
            {daySubtitle(activeDay) && (
              <p className="truncate text-xs text-nova-muted md:text-sm">{daySubtitle(activeDay)}</p>
            )}
            <p className="mt-0.5 text-xs text-nova-muted">
              {activeDay.exercises.length} exercise
              {activeDay.exercises.length === 1 ? "" : "s"} ·{" "}
              {relativeDay(lastCompleted.get(activeDay.id))}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            Change day
            <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          </Button>
        </div>

        {/* Nudge back to the rotation without ever blocking the manual pick. */}
        {!showingSuggested && !activeDone && suggestedDay && (
          <button
            type="button"
            onClick={() => onSelect(suggestedDay.id)}
            className="mt-3 flex w-full items-center gap-1.5 rounded-xl bg-nova-accent/[0.06] px-3 py-2 text-left text-xs font-medium text-nova-accent"
          >
            <Sparkles className="size-3.5 shrink-0" />
            Suggested next: {dayLabel(suggestedDay)} — tap to switch back
          </button>
        )}

        {upNext && (
          <button
            type="button"
            onClick={() => onSelect(upNext.id)}
            className="mt-3 flex w-full items-center gap-2 rounded-xl bg-nova-accent/[0.06] px-3 py-2.5 text-left"
          >
            <Play className="size-4 shrink-0 text-nova-accent" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-nova-text">
                Next up: {dayLabel(upNext)}
              </span>
              <span className="block text-xs text-nova-muted">
                {upNext.exercises.length} exercise{upNext.exercises.length === 1 ? "" : "s"} ·{" "}
                {relativeDay(lastCompleted.get(upNext.id))}
              </span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-nova-accent">Start</span>
          </button>
        )}
      </div>

      {open && (
        <ul className="border-t border-nova-border/70 p-2">
          {days.map((day, index) => {
            const isActive = day.id === activeDay.id;
            const isSuggested = day.id === suggestedDayId;
            const doneToday = completedTodayDayIds.has(day.id);

            return (
              <li key={day.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(day.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                    isActive ? "bg-nova-accent/[0.07]" : "hover:bg-nova-bg",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      doneToday
                        ? "bg-nova-success text-white"
                        : isActive
                          ? "bg-nova-accent text-white"
                          : "bg-nova-bg text-nova-muted ring-1 ring-nova-border",
                    )}
                  >
                    {doneToday ? <Check className="size-4" /> : index + 1}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-nova-text">
                        {dayLabel(day)}
                      </span>
                      {isSuggested && (
                        <span className="shrink-0 rounded-full bg-nova-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-nova-accent">
                          Suggested
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-nova-muted">
                      {daySubtitle(day) ? `${daySubtitle(day)} · ` : ""}
                      {day.exercises.length} exercise{day.exercises.length === 1 ? "" : "s"}
                    </span>
                  </span>

                  <span className="shrink-0 text-xs text-nova-muted">
                    {relativeDay(lastCompleted.get(day.id))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
