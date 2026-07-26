import Link from "next/link";
import { ClipboardList, UserCheck, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Tell us about yourself",
    body: "Create your account and share your goals and health history in one short form.",
  },
  {
    icon: UserCheck,
    title: "Your coach builds your plan",
    body: "A real coach reviews your profile and tailors a program specifically for you.",
  },
  {
    icon: LineChart,
    title: "Train and track progress",
    body: "See your plan, log workouts, and check in weekly as your coach adjusts your program.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-nova-bg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight text-nova-text">
          Nova
        </span>
        <nav className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-nova-muted hover:text-nova-text"
          >
            Log in
          </Link>
          <Button asChild size="sm">
            <Link href="/onboarding">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="py-16 text-center md:py-24">
          <h1 className="mx-auto max-w-2xl text-4xl font-semibold leading-tight text-nova-text md:text-5xl">
            Fitness coaching, tailored by a real coach
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-nova-muted md:text-lg">
            Tell us your goals, get a program built for you, and train with a
            coach who reviews your progress every step of the way.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/onboarding">Create your account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/login">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 pb-20 md:grid-cols-3 md:gap-8">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-nova-border/70 bg-nova-surface p-6 shadow-[0_1px_2px_rgba(28,30,38,0.04)]"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-nova-accent/10 text-nova-accent">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-nova-text">
                {title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-nova-muted">
                {body}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-nova-border px-6 py-8 text-center text-xs text-nova-muted">
        Nova — AI-assisted fitness coaching. ·{" "}
        <Link href="/admin" className="hover:text-nova-text hover:underline">
          Staff login
        </Link>
      </footer>
    </div>
  );
}
