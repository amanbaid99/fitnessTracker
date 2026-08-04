"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LineChart,
  ClipboardList,
  MessageCircle,
  Scale,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const clientTabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/progress", label: "Progress", icon: LineChart },
  { href: "/dashboard/body-metrics", label: "Body", icon: Scale },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
];

const coachTabs = [
  { href: "/admin/coach", label: "Clients", icon: Users },
  { href: "/admin/coach/templates", label: "Templates", icon: ClipboardList },
  { href: "/admin/coach/messages", label: "Messages", icon: MessageCircle },
];

export function BottomNav({
  variant = "client",
}: {
  variant?: "client" | "coach";
}) {
  const pathname = usePathname();
  const tabs = variant === "coach" ? coachTabs : clientTabs;

  return (
    <>
      {/* Desktop / tablet: sticky top nav */}
      <header className="sticky top-0 z-50 hidden border-b border-ft-border/70 bg-ft-bg/85 backdrop-blur md:block">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href={tabs[0].href} className="text-base font-semibold tracking-tight text-ft-text">
            FitnessTracker
          </Link>
          <nav>
            <ul className="flex items-center gap-1 rounded-full bg-ft-surface p-1 ring-1 ring-ft-border/70">
              {tabs.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        active ? "bg-ft-ink text-white" : "text-ft-muted hover:text-ft-text",
                      )}
                    >
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      {/* Mobile: fixed bottom tab bar */}
      {/* Sits above the home indicator on iOS rather than under it. */}
      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-ft-border/70 bg-ft-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="flex items-center justify-around">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-ft-text" : "text-ft-muted",
                  )}
                >
                  {/* The active tab gets a filled pill rather than a colour
                      change — legible at a glance on a phone, mid-set. */}
                  <span
                    className={cn(
                      "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                      active ? "bg-ft-ink text-white" : "text-ft-muted",
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
