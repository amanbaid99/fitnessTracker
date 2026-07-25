import Link from "next/link";
import { ArrowRight } from "lucide-react";

const LINKS = [
  { href: "/onboarding", label: "Onboarding Form", sub: "Step 3 of 7 — Medical History" },
  { href: "/onboarding/review", label: "Plan Under Review", sub: "Post-onboarding waiting screen" },
  { href: "/dashboard", label: "Client Dashboard", sub: "Today's workout" },
  { href: "/coach/clients/1/review", label: "Coach Review", sub: "Review & approve a client's plan" },
  { href: "/coach", label: "Coach Dashboard", sub: "Pending reviews & active clients" },
];

export default function DevNavigationPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 py-10">
      <h1 className="text-xl font-semibold text-nova-text">
        Nova — Dev Navigation
      </h1>
      <p className="mt-1 text-sm text-nova-muted">
        Jump to any screen for development.
      </p>

      <nav className="mt-6 space-y-3">
        {LINKS.map(({ href, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-xl border border-nova-border bg-nova-surface p-4 transition-colors hover:border-nova-accent"
          >
            <div>
              <p className="text-sm font-medium text-nova-text">{label}</p>
              <p className="mt-0.5 text-xs text-nova-muted">{sub}</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-nova-muted" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
