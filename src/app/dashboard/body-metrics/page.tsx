"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface MetricRow {
  id: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  logged_at: string;
}

export default function BodyMetricsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/login");
        return;
      }

      setUserId(sessionData.session.user.id);

      const { data } = await supabase
        .from("body_metrics")
        .select("id, weight_kg, body_fat_pct, logged_at")
        .eq("client_id", sessionData.session.user.id)
        .order("logged_at", { ascending: false });

      if (!active) return;
      setMetrics((data as MetricRow[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!weight && !bodyFat) {
      setError("Enter at least a weight or body fat % to log an entry.");
      return;
    }
    if (!userId) return;

    setSubmitting(true);

    const { data, error: insertError } = await supabase
      .from("body_metrics")
      .insert({
        client_id: userId,
        weight_kg: weight ? Number(weight) : null,
        body_fat_pct: bodyFat ? Number(bodyFat) : null,
      })
      .select("id, weight_kg, body_fat_pct, logged_at")
      .single();

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMetrics((prev) => [data as MetricRow, ...prev]);
    setWeight("");
    setBodyFat("");
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  const latest = metrics[0];

  return (
    <div className="flex min-h-dvh w-full flex-col bg-nova-bg pb-24 md:pb-16">
      <BottomNav />

      <div className="mx-auto w-full max-w-[430px] flex-1 md:max-w-2xl">
        <header className="px-5 pt-6 md:px-0 md:pt-10">
          <h1 className="text-xl font-semibold text-nova-text md:text-2xl">Body Metrics</h1>
          <p className="mt-1 text-sm text-nova-muted">Track your weight and body fat over time.</p>
        </header>

        <main className="px-5 md:px-0">
          {latest && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-nova-border/70 bg-nova-surface p-4 text-center shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
                <p className="text-2xl font-semibold text-nova-text">
                  {latest.weight_kg ?? "—"}
                  {latest.weight_kg ? " kg" : ""}
                </p>
                <p className="mt-0.5 text-xs text-nova-muted">Latest weight</p>
              </div>
              <div className="rounded-2xl border border-nova-border/70 bg-nova-surface p-4 text-center shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
                <p className="text-2xl font-semibold text-nova-text">
                  {latest.body_fat_pct ?? "—"}
                  {latest.body_fat_pct ? "%" : ""}
                </p>
                <p className="mt-0.5 text-xs text-nova-muted">Latest body fat</p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-3 rounded-2xl border border-nova-border/70 bg-nova-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)]"
          >
            <h2 className="text-sm font-semibold text-nova-text">Log a new entry</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-nova-text">
                  Weight (kg)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70.5"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-nova-text">
                  Body fat (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="18.5"
                />
              </div>
            </div>
            {error && <p className="text-sm text-nova-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving…" : "Log entry"}
            </Button>
          </form>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-nova-text">History</h2>
            <div className="mt-3 divide-y divide-nova-border rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
              {metrics.length === 0 && (
                <p className="px-4 py-3 text-sm text-nova-muted">
                  No entries yet — log your first one above.
                </p>
              )}
              {metrics.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm text-nova-text">
                    {new Date(m.logged_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-nova-muted">
                    {m.weight_kg ? `${m.weight_kg} kg` : ""}
                    {m.weight_kg && m.body_fat_pct ? " · " : ""}
                    {m.body_fat_pct ? `${m.body_fat_pct}%` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
