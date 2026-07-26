import { cn } from "@/lib/utils";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function WeekStrip({ completedDates }: { completedDates: Set<string> }) {
  const start = startOfWeek(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const todayKey = toKey(new Date());

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d) => {
        const key = toKey(d);
        const isToday = key === todayKey;
        const isDone = completedDates.has(key);
        return (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase text-nova-muted">
              {d.toLocaleDateString("en-US", { weekday: "narrow" })}
            </span>
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-medium",
                isDone
                  ? "bg-nova-success text-white"
                  : isToday
                    ? "border-2 border-nova-accent text-nova-accent"
                    : "bg-nova-border/40 text-nova-muted",
              )}
            >
              {d.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
