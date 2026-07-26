"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserManagementSection } from "@/components/shared/UserManagementSection";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Admin");

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
        .select("full_name, role, active")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!active) return;

      if (!profile || profile.role !== "admin" || profile.active === false) {
        router.replace("/dashboard");
        return;
      }

      setName(profile.full_name?.split(" ")[0] || "Admin");
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-nova-bg pb-16 md:max-w-3xl">
      <header className="flex items-center justify-between px-5 pt-6 md:px-0 md:pt-10">
        <div>
          <h1 className="text-xl font-semibold text-nova-text md:text-2xl">
            Hi, {name} 👋
          </h1>
          <p className="mt-1 text-sm text-nova-muted">
            Manage coaches and clients across Nova.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm font-medium text-nova-muted hover:text-nova-text"
        >
          Sign out
        </button>
      </header>

      <main className="px-5 md:px-0">
        <UserManagementSection role="coach" title="Coaches" />
        <UserManagementSection role="client" title="Clients" />
      </main>
    </div>
  );
}
