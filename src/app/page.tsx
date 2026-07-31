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
    <div className="flex min-h-dvh w-full flex-col bg-ft-bg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight text-ft-text">
          FitnessTracker
        </span>
        <nav className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-ft-muted hover:text-ft-text"
          >
            Log in
          </Link>
          <Button asChild size="sm">
            <Link href="/auth/register">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="py-16 text-center md:py-24">
          <h1 className="mx-auto max-w-2xl text-4xl font-semibold leading-tight text-ft-text md:text-5xl">
            Fitness coaching, tailored by a real coach
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ft-muted md:text-lg">
            Tell us your goals, get a program built for you, and train with a
            coach who reviews your progress every step of the way.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/auth/register">Create your account</Link>
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
              className="rounded-2xl border border-ft-border/70 bg-ft-surface p-6 shadow-[0_1px_2px_rgba(28,30,38,0.04)]"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-ft-accent/10 text-ft-accent">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-ft-text">
                {title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ft-muted">
                {body}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-ft-border px-6 py-8 text-center text-xs text-ft-muted">
        FitnessTracker — AI-assisted fitness coaching. ·{" "}
        <Link href="/admin" className="hover:text-ft-text hover:underline">
          Staff login
        </Link>
      </footer>
    </div>
  );
}
