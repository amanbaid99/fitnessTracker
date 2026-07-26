"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { TemplateWorkshop } from "@/components/plan/TemplateWorkshop";
import { supabase } from "@/lib/supabase";

export default function CoachTemplatesPage() {
  const router = useRouter();
  const [coachId, setCoachId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

      setCoachId(sessionData.session.user.id);
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
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-nova-bg pb-24 md:pb-16">
      <BottomNav variant="coach" />

      <div className="mx-auto w-full max-w-[430px] flex-1 md:max-w-2xl lg:max-w-4xl">
        <header className="px-5 pt-6 md:px-0 md:pt-10">
          <h1 className="text-xl font-semibold text-nova-text md:text-2xl">Workout templates</h1>
          <p className="mt-1 text-sm text-nova-muted">
            Build programs once, then assign them to any client. Templates from your admin and
            other coaches are here to use or copy — only their owner can change them.
          </p>
        </header>

        <main className="px-5 pt-6 md:px-0">
          <TemplateWorkshop mode="coach" coachId={coachId} />
        </main>
      </div>
    </div>
  );
}
