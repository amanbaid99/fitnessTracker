"use client";

import { useState } from "react";
import {
  HeartPulse,
  Activity,
  Droplet,
  Wind,
  Bone,
  Footprints,
  Bandage,
  CircleOff,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const CONDITIONS = [
  { id: "heart-disease", label: "Heart disease", icon: HeartPulse },
  { id: "high-blood-pressure", label: "High blood pressure", icon: Activity },
  { id: "diabetes", label: "Diabetes", icon: Droplet },
  { id: "asthma", label: "Asthma", icon: Wind },
  { id: "back-pain", label: "Back pain", icon: Bone },
  { id: "knee-pain", label: "Knee pain", icon: Footprints },
  { id: "recent-injury", label: "Recent injury", icon: Bandage },
  { id: "none", label: "None of the above", icon: CircleOff },
];

export default function OnboardingMedicalHistoryPage() {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-nova-bg pb-28">
      <header className="flex items-center justify-between px-5 pt-6">
        <span className="text-lg font-semibold tracking-tight text-nova-text">
          Nova
        </span>
        <span className="text-sm font-medium text-nova-muted">
          Step 3 of 7
        </span>
      </header>

      <div className="px-5 pt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-nova-surface">
          <div
            className="h-full rounded-full bg-nova-accent transition-all"
            style={{ width: `${(3 / 7) * 100}%` }}
          />
        </div>
      </div>

      <main className="flex-1 px-5 pt-8">
        <h1 className="text-2xl font-semibold leading-snug text-nova-text">
          Any medical history we should know about?
        </h1>
        <p className="mt-2 text-sm text-nova-muted">
          This helps your coach keep your training safe and effective.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {CONDITIONS.map(({ id, label, icon: Icon }) => {
            const isSelected = selected.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border bg-nova-surface p-4 text-left transition-colors",
                  isSelected
                    ? "border-nova-accent ring-1 ring-nova-accent"
                    : "border-nova-border",
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    isSelected ? "text-nova-accent" : "text-nova-muted",
                  )}
                />
                <span className="text-sm font-medium text-nova-text">
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <label
            htmlFor="medical-notes"
            className="mb-2 block text-sm font-medium text-nova-text"
          >
            Anything else? (optional)
          </label>
          <Textarea
            id="medical-notes"
            placeholder="Medications, past surgeries, doctor restrictions..."
            rows={4}
          />
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-nova-muted">
          <Lock className="size-3.5" />
          Your data is private and only shared with your coach.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[430px] gap-3 border-t border-nova-border bg-nova-bg/95 px-5 py-4 backdrop-blur">
        <Button variant="ghost" className="flex-1">
          Back
        </Button>
        <Button className="flex-1">Continue</Button>
      </div>
    </div>
  );
}
