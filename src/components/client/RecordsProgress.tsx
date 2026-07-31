"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExerciseArt } from "@/components/exercise/ExerciseArt";
import { formatRecord, type PersonalRecord } from "@/lib/prs";
import { relativeDay } from "@/lib/rotation";

export interface PrHistoryRow {
  exercise_key: string;
  exercise_name: string;
  weight_kg: number | null;
  reps: number | null;
  estimated_1rm: number | null;
  source: "starting" | "logged";
  achieved_at: string;
}

interface RecordsProgressProps {
  records: PersonalRecord[];
  history: PrHistoryRow[];
}

// One series, so identity comes from the title rather than a legend box.
const SERIES = "#6366f1";
const GRID = "#e8e9f0";
const AXIS_TEXT = "#6b7280";
const SURFACE = "#ffffff";

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface TooltipPayloadItem {
  payload: { label: string; oneRm: number; weight: number | null; reps: number | null };
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-ft-border bg-ft-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-ft-text">{point.label}</p>
      <p className="mt-0.5 text-xs text-ft-muted">
        {point.weight ? `${point.weight} kg` : "—"}
        {point.reps ? ` × ${point.reps}` : ""} · est. 1RM {point.oneRm} kg
      </p>
    </div>
  );
}

export function RecordsProgress({ records, history }: RecordsProgressProps) {
  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          new Date(b.updated_at ?? b.achieved_at).getTime() -
          new Date(a.updated_at ?? a.achieved_at).getTime(),
      ),
    [records],
  );

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const activeKey = selectedKey ?? sortedRecords[0]?.exercise_key ?? null;
  const activeRecord = sortedRecords.find((record) => record.exercise_key === activeKey);

  const series = useMemo(() => {
    if (!activeKey) return [];
    return history
      .filter((row) => row.exercise_key === activeKey && row.estimated_1rm != null)
      .sort(
        (a, b) => new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime(),
      )
      .map((row) => ({
        label: shortDate(row.achieved_at),
        oneRm: row.estimated_1rm as number,
        weight: row.weight_kg,
        reps: row.reps,
      }));
  }, [history, activeKey]);

  /**
   * Strength moves a few percent at a time, so a zero baseline would flatten
   * every trend into a straight edge — fine to truncate on a line chart, as
   * long as the ticks land on round numbers rather than whatever the data
   * happens to be.
   */
  const scale = useMemo(() => {
    const values = series.map((point) => point.oneRm);
    if (values.length === 0) return { domain: [0, 10] as [number, number], ticks: [0, 10] };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = Math.max(5, Math.ceil((max - min) / 4 / 5) * 5);
    const low = Math.floor((min - step / 2) / step) * step;
    const high = Math.ceil((max + step / 2) / step) * step;

    const ticks: number[] = [];
    for (let value = low; value <= high + 0.001; value += step) ticks.push(value);
    return { domain: [low, high] as [number, number], ticks };
  }, [series]);

  if (records.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ft-border bg-ft-surface px-4 py-8 text-center text-sm text-ft-muted">
        No records yet. Log your sets on the home tab, or add your starting numbers in
        the plan builder.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-ft-border/70 bg-ft-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
        <h3 className="text-sm font-semibold text-ft-text">
          {activeRecord?.exercise_name ?? "Progress"}
        </h3>
        <p className="mt-0.5 text-xs text-ft-muted">
          Estimated one-rep max, kg — each point is a new record.
        </p>

        <div className="-mx-2 mt-3 flex gap-1.5 overflow-x-auto px-2 pb-1">
          {sortedRecords.map((record) => (
            <button
              key={record.exercise_key}
              type="button"
              onClick={() => setSelectedKey(record.exercise_key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                record.exercise_key === activeKey
                  ? "bg-ft-accent text-white"
                  : "bg-ft-bg text-ft-muted ring-1 ring-ft-border hover:text-ft-text",
              )}
            >
              {record.exercise_name}
            </button>
          ))}
        </div>

        {series.length < 2 ? (
          <p className="mt-4 rounded-xl bg-ft-bg px-4 py-6 text-center text-xs text-ft-muted">
            {series.length === 1
              ? "One record so far — beat it to start the trend line."
              : "No history for this exercise yet."}
          </p>
        ) : (
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                />
                <YAxis
                  domain={scale.domain}
                  ticks={scale.ticks}
                  tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="oneRm"
                  stroke={SERIES}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  // Surface ring keeps markers legible where they meet the line.
                  dot={{ r: 4, fill: SERIES, stroke: SURFACE, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: SERIES, stroke: SURFACE, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ft-text">Personal records</h3>
        <ul className="mt-3 divide-y divide-ft-border rounded-2xl border border-ft-border/70 bg-ft-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
          {sortedRecords.map((record) => (
            <li key={record.exercise_key} className="flex items-center gap-3 px-4 py-3">
              <ExerciseArt name={record.exercise_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ft-text">
                  {record.exercise_name}
                </p>
                <p className="text-xs text-ft-muted">
                  {record.source === "starting"
                    ? "Starting number"
                    : relativeDay(record.achieved_at)}
                  {record.estimated_1rm ? ` · est. 1RM ${record.estimated_1rm} kg` : ""}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ft-text">
                <Trophy className="size-3.5 text-ft-warning" />
                {formatRecord(record)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
