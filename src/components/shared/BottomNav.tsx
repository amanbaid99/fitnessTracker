"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LineChart,
  ClipboardList,
  MessageCircle,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const clientTabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/progress", label: "Progress", icon: LineChart },
  { href: "/dashboard/check-in", label: "Check-in", icon: ClipboardList },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
];

const coachTabs = [
  { href: "/coach", label: "Clients", icon: Users },
  { href: "/coach/check-ins", label: "Check-ins", icon: ClipboardList },
  { href: "/coach/messages", label: "Messages", icon: MessageCircle },
  { href: "/coach/settings", label: "Settings", icon: Settings },
];

export function BottomNav({
  variant = "client",
}: {
  variant?: "client" | "coach";
}) {
  const pathname = usePathname();
  const tabs = variant === "coach" ? coachTabs : clientTabs;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-nova-border bg-nova-surface">
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
  );
}
