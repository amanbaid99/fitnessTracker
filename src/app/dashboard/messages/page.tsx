"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";
import { ChatThread } from "@/components/chat/ChatThread";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function MessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [coachName, setCoachName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("assigned_coach_id")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!active) return;

      setUserId(sessionData.session.user.id);

      if (profile?.assigned_coach_id) {
        const { data: coach } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", profile.assigned_coach_id)
          .maybeSingle();

        if (!active) return;
        setCoachName(coach?.full_name || "Your coach");
      }

      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading || !userId) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-nova-bg pb-20 md:pb-6">
      <BottomNav />

      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-5 md:max-w-2xl md:px-0">
        <header className="flex items-center gap-3 py-4 md:pt-8">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-nova-accent/10 text-nova-accent">
            {coachName ? <ShieldCheck className="size-5" /> : <MessageCircle className="size-5" />}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-nova-text">
              {coachName ?? "Messages"}
            </h1>
            <p className="text-xs text-nova-muted">
              {coachName ? "Your coach" : "No coach assigned yet"}
            </p>
          </div>
        </header>

        {coachName ? (
          // Height is pinned so the composer sits just above the mobile tab
          // bar rather than being pushed off-screen by a long conversation.
          <div className="flex min-h-0 flex-1 flex-col pb-3 [height:calc(100dvh-9.5rem)] md:[height:calc(100dvh-8rem)]">
            <ChatThread
              clientId={userId}
              viewerId={userId}
              viewerRole="client"
              emptyHint={`Send ${coachName.split(" ")[0]} a message — they'll see it right away.`}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-nova-accent/10 text-nova-accent">
              <MessageCircle className="size-6" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-nova-text">
              You don&apos;t have a coach yet
            </h2>
            <p className="mt-1.5 max-w-xs text-sm text-nova-muted">
              Ask for a coach-built plan and you&apos;ll be paired with one — then you can
              message them here any time.
            </p>
            <Button asChild className="mt-5">
              <Link href="/onboarding/coach-request">Get a coach</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
