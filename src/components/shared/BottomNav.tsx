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
      <header className="sticky top-0 z-50 hidden border-b border-nova-border bg-nova-surface/90 backdrop-blur md:block">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-3.5">
          <Link href={tabs[0].href} className="text-base font-semibold tracking-tight text-nova-text">
            Nova
          </Link>
          <nav>
            <ul className="flex items-center gap-1">
              {tabs.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-nova-accent/10 text-nova-accent"
                          : "text-nova-muted hover:text-nova-text",
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
      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-nova-border bg-nova-surface md:hidden">
        <ul className="flex items-center justify-around">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                    active ? "text-nova-accent" : "text-nova-muted",
                  )}
                >
                  <Icon className="size-5" />
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
