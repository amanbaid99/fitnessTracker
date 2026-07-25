import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";
import { cn } from "@/lib/utils";

const PENDING_REVIEWS = [
  { id: "1", name: "Aman Baid", goal: "Build muscle", submitted: "Submitted 2 days ago" },
  { id: "2", name: "Priya Shah", goal: "Fat loss", submitted: "Submitted 2 days ago" },
];

const ACTIVE_CLIENTS = [
  { name: "Rohan Mehta", week: "Week 4/8", status: "on-track" },
  { name: "Neha Kapoor", week: "Week 1/8", status: "overdue" },
  { name: "Karan Verma", week: "Week 6/8", status: "flagged" },
  { name: "Isha Patel", week: "Week 3/8", status: "on-track" },
] as const;

const RECENT_CHECKINS = [
  { name: "Rohan Mehta", note: "Energy 8/10 · Sleep 7h" },
  { name: "Isha Patel", note: "Energy 6/10 · Sleep 6.5h" },
];

const statusColor: Record<string, string> = {
  "on-track": "bg-nova-success",
  overdue: "bg-nova-warning",
  flagged: "bg-nova-danger",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CoachDashboardPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-nova-bg pb-24">
      <header className="px-5 pt-6">
        <h1 className="text-xl font-semibold text-nova-text">
          Hi, Coach Sarah 👋
        </h1>
        <p className="mt-1 text-sm text-nova-muted">3 plans need your review</p>
      </header>

      <main className="flex-1 px-5">
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-nova-text">
              Pending Review
            </h2>
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-nova-warning/20 text-xs font-semibold text-nova-warning">
              3
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {PENDING_REVIEWS.map((client) => (
              <Link
                key={client.id}
                href={`/coach/clients/${client.id}/review`}
                className="flex items-center justify-between rounded-xl border-l-4 border-nova-warning bg-nova-surface p-4"
              >
                <div>
                  <p className="text-sm font-medium text-nova-text">
                    {client.name}
                  </p>
                  <p className="mt-0.5 text-xs text-nova-muted">
                    {client.goal} · {client.submitted}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-nova-accent">
                  Review
                  <ChevronRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-nova-text">
            Active Clients
          </h2>
          <div className="mt-3 divide-y divide-nova-border rounded-xl border border-nova-border bg-nova-surface">
            {ACTIVE_CLIENTS.map((client) => (
              <div
                key={client.name}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-nova-accent/15 text-xs font-semibold text-nova-accent">
                  {initials(client.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-nova-text">
                    {client.name}
                  </p>
                  <p className="text-xs text-nova-muted">{client.week}</p>
                </div>
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    statusColor[client.status],
                  )}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-nova-text">
            Recent Check-ins
          </h2>
          <div className="mt-3 space-y-2">
            {RECENT_CHECKINS.map((checkin) => (
              <div
                key={checkin.name}
                className="flex items-center justify-between rounded-xl border border-nova-border bg-nova-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-nova-text">
                    {checkin.name}
                  </p>
                  <p className="text-xs text-nova-muted">submitted today</p>
                </div>
                <span className="text-xs text-nova-muted">{checkin.note}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav variant="coach" />
    </div>
  );
}
