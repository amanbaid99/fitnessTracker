"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/shared/BottomNav";
import { ChatThread } from "@/components/chat/ChatThread";
import { supabase } from "@/lib/supabase";

interface ClientRow {
  id: string;
  full_name: string;
}

interface ThreadSummary {
  clientId: string;
  lastBody: string;
  lastAt: string;
  unread: number;
}

function initials(name: string) {
  return (name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function shortTime(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CoachMessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ThreadSummary>>({});
  const [openClientId, setOpenClientId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/admin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, active")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!active) return;

      if (!profile || profile.role !== "coach" || profile.active === false) {
        await supabase.auth.signOut();
        router.replace("/admin");
        return;
      }

      const me = sessionData.session.user.id;
      setCoachId(me);

      const { data: roster } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("assigned_coach_id", me)
        .eq("active", true)
        .order("full_name");

      if (!active) return;

      const rows = (roster as ClientRow[]) ?? [];
      setClients(rows);

      if (rows.length > 0) {
        // One query for every thread; the newest message per client wins.
        const { data: messages } = await supabase
          .from("messages")
          .select("client_id, sender_id, body, created_at, read_at")
          .in(
            "client_id",
            rows.map((client) => client.id),
          )
          .order("created_at", { ascending: false });

        if (!active) return;

        const next: Record<string, ThreadSummary> = {};
        for (const message of messages ?? []) {
          const existing = next[message.client_id];
          if (!existing) {
            next[message.client_id] = {
              clientId: message.client_id,
              lastBody: message.body,
              lastAt: message.created_at,
              unread: 0,
            };
          }
          if (message.sender_id !== me && !message.read_at) {
            next[message.client_id].unread += 1;
          }
        }
        setSummaries(next);
      }

      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading || !coachId) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-ft-muted">Loading…</p>
      </div>
    );
  }

  const openClient = clients.find((client) => client.id === openClientId);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-ft-bg pb-20 md:pb-6">
      <BottomNav variant="coach" />

      <div className="mx-auto w-full max-w-[430px] flex-1 px-5 md:max-w-4xl md:px-0">
        {/* Mobile is a two-screen flow: list, then the thread. Desktop shows
            both side by side. */}
        <div className="md:grid md:grid-cols-[260px_1fr] md:gap-6 md:pt-8">
          <aside className={cn(openClient && "hidden md:block")}>
            <h1 className="py-4 text-lg font-semibold text-ft-text md:py-0 md:pb-3">
              Messages
            </h1>

            {clients.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ft-border px-4 py-8 text-center text-sm text-ft-muted">
                No clients assigned to you yet.
              </p>
            ) : (
              <ul className="divide-y divide-ft-border overflow-hidden rounded-2xl border border-ft-border/70 bg-ft-surface">
                {clients.map((client) => {
                  const summary = summaries[client.id];
                  return (
                    <li key={client.id}>
                      <button
                        type="button"
                        onClick={() => setOpenClientId(client.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-ft-accent/[0.03]",
                          openClientId === client.id && "bg-ft-accent/[0.06]",
                        )}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ft-accent/10 text-xs font-semibold text-ft-accent">
                          {initials(client.full_name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-medium text-ft-text">
                              {client.full_name || "(no name)"}
                            </span>
                            {summary && (
                              <span className="shrink-0 text-[11px] text-ft-muted">
                                {shortTime(summary.lastAt)}
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-xs text-ft-muted">
                            {summary?.lastBody ?? "No messages yet"}
                          </span>
                        </span>
                        {summary && summary.unread > 0 && (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ft-accent text-[11px] font-semibold text-white">
                            {summary.unread}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className={cn("flex min-h-0 flex-col", !openClient && "hidden md:flex")}>
            {openClient ? (
              <>
                <header className="flex items-center gap-2 py-3 md:pt-0">
                  <button
                    type="button"
                    onClick={() => setOpenClientId(null)}
                    aria-label="Back to conversations"
                    className="rounded-md p-1.5 text-ft-muted transition-colors hover:bg-ft-surface hover:text-ft-text md:hidden"
                  >
                    <ArrowLeft className="size-5" />
                  </button>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ft-accent/10 text-xs font-semibold text-ft-accent">
                    {initials(openClient.full_name)}
                  </span>
                  <p className="truncate text-sm font-semibold text-ft-text">
                    {openClient.full_name || "(no name)"}
                  </p>
                </header>

                <div className="flex min-h-0 flex-1 flex-col pb-3 [height:calc(100dvh-11rem)] md:[height:calc(100dvh-9rem)]">
                  <ChatThread
                    clientId={openClient.id}
                    viewerId={coachId}
                    viewerRole="coach"
                    emptyHint={`Start the conversation with ${openClient.full_name.split(" ")[0] || "your client"}.`}
                  />
                </div>
              </>
            ) : (
              <div className="hidden flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-ft-border py-20 text-center md:flex">
                <MessageCircle className="size-6 text-ft-muted" />
                <p className="mt-2 text-sm text-ft-muted">
                  Pick a client to open the conversation.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
