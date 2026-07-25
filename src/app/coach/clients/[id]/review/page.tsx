import { ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ExerciseReviewRow } from "@/components/coach/ExerciseReviewRow";

const DAYS = [
  {
    value: "day-1",
    label: "Day 1",
    title: "Day 1 — Upper Body Push",
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: "8", rest: "90s", tempo: "3-1-1", rpe: "8" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10", rest: "60s", tempo: "2-1-1", rpe: "7" },
      { name: "Cable Fly", sets: 3, reps: "12", rest: "45s", tempo: "2-1-2", rpe: "7" },
      { name: "Triceps Pushdown", sets: 3, reps: "12", rest: "45s", tempo: "2-0-2", rpe: "8" },
    ],
  },
  { value: "day-2", label: "Day 2", title: "Day 2 — Lower Body", exercises: [] },
  { value: "day-3", label: "Day 3", title: "Day 3 — Upper Body Pull", exercises: [] },
  { value: "day-4", label: "Day 4", title: "Day 4 — Full Body", exercises: [] },
];

export default async function CoachReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-nova-bg pb-24">
      <header className="flex items-center gap-3 px-5 pt-6">
        <Button variant="ghost" size="icon" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold text-nova-text">Review Plan</h1>
      </header>

      <div className="mx-5 mt-4 rounded-xl border border-nova-border bg-nova-surface p-4">
        <p className="font-semibold text-nova-text">Aman Baid</p>
        <p className="text-sm text-nova-muted">28 yrs · Goal: Build muscle</p>
        <span className="mt-2 inline-flex items-center rounded-full bg-nova-danger/15 px-2.5 py-1 text-xs font-medium text-nova-danger">
          ⚠ Lower back pain reported
        </span>
      </div>

      <main className="flex-1 px-5">
        <Tabs defaultValue="day-1" className="mt-5">
          <TabsList>
            {DAYS.map((day) => (
              <TabsTrigger key={day.value} value={day.value}>
                {day.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {DAYS.map((day) => (
            <TabsContent key={day.value} value={day.value} className="mt-4">
              <h2 className="text-sm font-semibold text-nova-text">
                {day.title}
              </h2>

              <div className="mt-3 space-y-3">
                {day.exercises.length > 0 ? (
                  day.exercises.map((exercise, i) => (
                    <ExerciseReviewRow
                      key={exercise.name}
                      {...exercise}
                      defaultOpen={i === 0}
                    />
                  ))
                ) : (
                  <p className="text-sm text-nova-muted">
                    No exercises yet for this day.
                  </p>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-nova-text">
                  Day Notes
                </label>
                <Textarea placeholder="Add notes for this day..." rows={3} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[430px] gap-3 border-t border-nova-border bg-nova-bg/95 px-5 py-4 backdrop-blur">
        <Button variant="outline" className="flex-1">
          Request Changes
        </Button>
        <Button className="flex-1">Approve &amp; Send</Button>
      </div>
    </div>
  );
}
