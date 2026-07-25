import { BottomNav } from "@/components/shared/BottomNav";
import { WarmupCard } from "@/components/client/WarmupCard";
import { ExerciseCard } from "@/components/client/ExerciseCard";
import { Button } from "@/components/ui/button";

const EXERCISES = [
  { name: "Barbell Bench Press", sets: 4, reps: "8", restSeconds: 90 },
  { name: "Incline Dumbbell Press", sets: 3, reps: "10", restSeconds: 60 },
  { name: "Cable Fly", sets: 3, reps: "12", restSeconds: 45 },
];

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function ClientDashboardPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-nova-bg pb-24">
      <header className="px-5 pt-6">
        <h1 className="text-xl font-semibold text-nova-text">
          Good morning, Aman 👋
        </h1>
        <p className="mt-1 text-sm text-nova-muted">{today}</p>
      </header>

      <div className="mx-5 mt-5 grid grid-cols-3 divide-x divide-nova-border rounded-xl border border-nova-border bg-nova-surface">
        <div className="px-2 py-3 text-center">
          <p className="text-sm font-semibold text-nova-text">Week 2/8</p>
          <p className="mt-0.5 text-xs text-nova-muted">Program</p>
        </div>
        <div className="px-2 py-3 text-center">
          <p className="text-sm font-semibold text-nova-text">4 workouts</p>
          <p className="mt-0.5 text-xs text-nova-muted">Done</p>
        </div>
        <div className="px-2 py-3 text-center">
          <p className="text-sm font-semibold text-nova-text">2-day</p>
          <p className="mt-0.5 text-xs text-nova-muted">Streak</p>
        </div>
      </div>

      <main className="flex-1 px-5">
        <div className="mt-6">
          <WarmupCard />
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-nova-text">
            Today&apos;s Workout
          </h2>
          <p className="mt-0.5 text-xs text-nova-muted">Upper Body Push</p>

          <div className="mt-3 space-y-3">
            {EXERCISES.map((exercise) => (
              <ExerciseCard key={exercise.name} {...exercise} />
            ))}
          </div>
        </div>

        <Button variant="success" className="mt-6 w-full">
          Mark Workout Complete
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
