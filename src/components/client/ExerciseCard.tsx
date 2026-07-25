import { Play, Repeat, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExerciseCardProps {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

export function ExerciseCard({ name, sets, reps, restSeconds }: ExerciseCardProps) {
  return (
    <div className="rounded-xl border border-nova-border bg-nova-surface p-4">
      <div className="flex gap-3">
        <div className="size-[60px] shrink-0 rounded-lg bg-nova-border" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-nova-text">{name}</p>
          <p className="mt-0.5 text-xs text-nova-muted">
            {sets} × {reps} · Rest {restSeconds}s
          </p>
          <div className="mt-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Watch demo"
            >
              <Play className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Swap exercise"
            >
              <Repeat className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Exercise notes"
            >
              <Info className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm">Log Sets</Button>
      </div>
    </div>
  );
}
