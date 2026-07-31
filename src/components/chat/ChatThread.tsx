"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { SendHorizonal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export interface ChatMessage {
  id: string;
  client_id: string;
  sender_id: string;
  sender_role: "client" | "coach" | "admin";
  body: string;
  created_at: string;
  read_at: string | null;
}

interface ChatThreadProps {
  /** The member whose thread this is. */
  clientId: string;
  /** Who is typing — used for alignment and for the sender columns. */
  viewerId: string;
  viewerRole: "client" | "coach" | "admin";
  /** Shown above the composer when there's nothing to say yet. */
  emptyHint?: string;
  className?: string;
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * A live conversation between a member and their coach.
 *
 * New messages arrive over Supabase Realtime rather than polling; the
 * subscription is per-thread, and the insert is still written optimistically
 * so the sender sees their own message immediately even if the socket is slow.
 */
export function ChatThread({
  clientId,
  viewerId,
  viewerRole,
  emptyHint = "Say hello — messages are delivered instantly.",
  className,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error: loadError } = await supabase
        .from("messages")
        .select("id, client_id, sender_id, sender_role, body, created_at, read_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (loadError) setError(loadError.message);
      setMessages((data as ChatMessage[]) ?? []);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`messages:${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const message = payload.new as ChatMessage;
          setMessages((prev) =>
            // The sender already added it optimistically.
            prev.some((existing) => existing.id === message.id) ? prev : [...prev, message],
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Anything from the other side is read once it's on screen.
  useEffect(() => {
    const unread = messages.filter(
      (message) => message.sender_id !== viewerId && !message.read_at,
    );
    if (unread.length === 0) return;

    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in(
        "id",
        unread.map((message) => message.id),
      )
      .then(() => undefined);
  }, [messages, viewerId]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        client_id: clientId,
        sender_id: viewerId,
        sender_role: viewerRole,
        body,
      })
      .select("id, client_id, sender_id, sender_role, body, created_at, read_at")
      .single();

    setSending(false);

    if (sendError) {
      setError(sendError.message);
      return;
    }

    setDraft("");
    if (data) {
      setMessages((prev) =>
        prev.some((existing) => existing.id === data.id)
          ? prev
          : [...prev, data as ChatMessage],
      );
    }
  }

  // Precomputed rather than tracked during render: a day separator shows
  // whenever a message starts a new calendar day.
  const rows = messages.map((message, index) => ({
    message,
    showDay:
      index === 0 ||
      dayLabel(message.created_at) !== dayLabel(messages[index - 1].created_at),
  }));

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-1 py-2">
        {loading && <p className="py-6 text-center text-sm text-ft-muted">Loading messages…</p>}

        {!loading && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-ft-muted">{emptyHint}</p>
        )}

        {rows.map(({ message, showDay }) => {
          const mine = message.sender_id === viewerId;

          return (
            <div key={message.id}>
              {showDay && (
                <p className="py-2 text-center text-[11px] font-medium uppercase tracking-wide text-ft-muted">
                  {dayLabel(message.created_at)}
                </p>
              )}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2",
                    mine
                      ? "rounded-br-md bg-ft-accent text-white"
                      : "rounded-bl-md bg-ft-surface text-ft-text ring-1 ring-ft-border",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-[10px]",
                      mine ? "text-white/70" : "text-ft-muted",
                    )}
                  >
                    {timeLabel(message.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {error && <p className="px-1 pb-1 text-xs text-ft-danger">{error}</p>}

      <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-ft-border pt-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter starts a new line.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as unknown as FormEvent);
            }
          }}
          rows={1}
          placeholder="Write a message…"
          aria-label="Message"
          className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-ft-border bg-ft-surface px-3 py-2.5 text-sm text-ft-text outline-none placeholder:text-ft-muted focus-visible:ring-2 focus-visible:ring-ft-accent"
        />
        <Button type="submit" size="icon" className="size-11 shrink-0" disabled={sending || !draft.trim()}>
          <SendHorizonal className="size-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
