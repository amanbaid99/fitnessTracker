import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  Dumbbell,
  LineChart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/marketing/Photo";
import { PosterArt } from "@/components/marketing/PosterArt";
import { Reveal } from "@/components/marketing/Reveal";

const STEPS = [
  {
    n: "01",
    title: "A proper assessment",
    body: "Training history, injuries, medications, sleep, stress, the equipment you actually have. It takes about ten minutes and saves as you go, so you can stop and come back.",
  },
  {
    n: "02",
    title: "A programme drafted around it",
    body: "Our AI reads every answer and drafts a complete programme, plus a written brief explaining why it made each choice for you specifically.",
  },
  {
    n: "03",
    title: "Your ACSM coach signs it off",
    body: "An ACSM-certified coach reviews the draft, changes what they disagree with, and publishes it. Nothing reaches you until they have approved it.",
  },
];

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Every session, written down",
    body: "Sets, reps, rest, tempo and target effort — no guessing what the plan meant.",
  },
  {
    icon: Dumbbell,
    title: "Swaps built in",
    body: "Every exercise carries up to three alternates, so a busy machine or a sore joint doesn't end the session.",
  },
  {
    icon: LineChart,
    title: "Your numbers, tracked",
    body: "Log each set as you go. Personal bests update themselves, and you see what to beat before you lift.",
  },
  {
    icon: MessageCircle,
    title: "Your coach, in your pocket",
    body: "Message them directly. No app-switching, no waiting for a weekly email.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-ft-bg">
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-50 border-b border-ft-border/60 bg-ft-bg/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <span className="text-base font-semibold tracking-tight text-ft-text">
            FitnessTracker
          </span>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#how" className="text-sm text-ft-muted transition-colors hover:text-ft-text">
              How it works
            </Link>
            <Link
              href="#coaches"
              className="text-sm text-ft-muted transition-colors hover:text-ft-text"
            >
              Your coach
            </Link>
            <Link
              href="#inside"
              className="text-sm text-ft-muted transition-colors hover:text-ft-text"
            >
              What you get
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-ft-muted transition-colors hover:text-ft-text"
            >
              Log in
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="md:hidden">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-5 pt-14 pb-10 md:px-8 md:pt-24 md:pb-16">
          <p className="ft-eyebrow">Coaching, not content</p>

          <h1 className="ft-display mt-4 max-w-3xl text-[2.6rem] text-ft-text sm:text-6xl md:text-7xl">
            Training built around
            <br className="hidden sm:block" /> your body,{" "}
            <span className="ft-accentuate">not a template.</span>
          </h1>

          <div className="mt-7 max-w-xl md:mt-9">
            <p className="text-base leading-relaxed text-ft-muted md:text-lg">
              Tell us about your health, your history and what you have to train with. You get a
              programme written for you and a coach who stays with you — not a library of videos
              to work through alone.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/auth/register">
                  Start your assessment
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">I already have an account</Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-ft-muted">
              Ten minutes. Save and come back whenever you like.
            </p>
          </div>
        </section>

        {/* Photo band — the emotional register the copy can't carry alone. */}
        <section className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <Reveal className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <Photo
              src="/images/hero-lifting.jpg"
              alt="A coached lifting session"
              fallback={<PosterArt variant="figure" />}
              priority
              className="aspect-[3/4] rounded-2xl md:rounded-3xl"
            />
            <Photo
              src="/images/hero-coach.jpg"
              alt="A coach working with a client"
              fallback={<PosterArt variant="barbell" tone="yellow" />}
              className="aspect-[3/4] rounded-2xl md:rounded-3xl"
            />

            <div className="col-span-2 flex flex-col justify-between rounded-2xl bg-ft-highlight p-5 md:rounded-3xl md:p-7">
              <div>
                <p className="ft-display text-4xl text-ft-ink md:text-5xl">Every plan</p>
                <p className="ft-display text-4xl text-ft-ink md:text-5xl">
                  <span className="ft-accentuate">approved by an ACSM coach.</span>
                </p>
              </div>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-ft-ink/75">
                AI drafts fast, but it doesn&apos;t know you. Every programme is read, corrected
                and published by a coach certified by the American College of Sports Medicine.
              </p>
            </div>
          </Reveal>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* What this actually is                                            */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-28">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <Reveal className="md:col-span-5">
              <p className="ft-eyebrow">What it is</p>
              <h2 className="ft-display mt-3 text-3xl text-ft-text md:text-5xl">
                A coach&apos;s practice, <span className="ft-accentuate">not an app.</span>
              </h2>
            </Reveal>

            <Reveal delay={120} className="space-y-5 text-base leading-relaxed text-ft-muted md:col-span-7 md:text-lg">
              <p>
                Most fitness apps hand you a plan and leave. FitnessTracker is built the other way
                round: a coach is at the centre of it, and the software exists to give them more
                time for the part only they can do.
              </p>
              <p>
                It starts with a full health and lifestyle assessment — the kind a good coach would
                take you through in person. Our AI reads it and drafts your programme in minutes
                instead of hours, along with a written brief for your coach: what it judged your
                limiting factor to be, what it programmed around, and what it would ask you.
              </p>
              <p className="text-ft-text">
                Your coach edits that draft and publishes it. From then on you train off a plan
                that names every set, tracks every personal best, and adapts as your coach watches
                what you actually do.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* How it works                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section id="how" className="scroll-mt-20 bg-ft-surface-alt/60 py-16 md:py-28">
          <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
            <p className="ft-eyebrow">How it works</p>
            <h2 className="ft-display mt-3 max-w-xl text-3xl text-ft-text md:text-5xl">
              Three steps, then you train.
            </h2>

            <ol className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-6">
              {STEPS.map(({ n, title, body }, i) => (
                <Reveal
                  key={n}
                  delay={i * 90}
                  className="rounded-3xl border border-ft-border/70 bg-ft-surface p-6 md:p-7"
                >
                  <span className="ft-display block text-4xl text-ft-border md:text-5xl">{n}</span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-ft-text">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ft-muted">{body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Credentials                                                      */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="coaches"
          className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16 md:px-8 md:py-28"
        >
          <div className="grid gap-8 md:grid-cols-12 md:gap-14">
            <Reveal className="md:col-span-5">
              <Photo
                src="/images/coach-portrait.jpg"
                alt="One of our coaches"
                fallback={<PosterArt variant="portrait" />}
                className="aspect-[4/5] rounded-3xl"
              />
            </Reveal>

            <Reveal delay={120} className="md:col-span-7">
              <p className="ft-eyebrow">Who writes your programme</p>
              <h2 className="ft-display mt-3 text-3xl text-ft-text md:text-5xl">
                Certified by the <span className="ft-accentuate">ACSM.</span>
              </h2>

              <div className="mt-6 space-y-5 text-base leading-relaxed text-ft-muted md:text-lg">
                <p>
                  The American College of Sports Medicine has set the standards for exercise
                  science since 1954. Its guidelines for exercise testing and prescription are the
                  reference the wider industry works from — including the screening protocols that
                  decide when training should be adjusted, or paused, around a medical condition.
                </p>
                <p>
                  An ACSM certification is not a weekend course. It is an accredited examination
                  covering exercise physiology, health screening, programme design and emergency
                  response, and it has to be maintained through continuing education rather than
                  earned once and kept forever.
                </p>
                <p className="text-ft-text">
                  That is who reads your assessment, decides what the AI got wrong, and puts their
                  name to your programme.
                </p>
              </div>

              <dl className="mt-8 grid gap-4 border-t border-ft-border pt-6 sm:grid-cols-3">
                <div>
                  <dt className="ft-display text-3xl text-ft-text">1954</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-ft-muted">
                    Setting exercise science standards since
                  </dd>
                </div>
                <div>
                  <dt className="ft-display text-3xl text-ft-text">Accredited</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-ft-muted">
                    Examined and independently accredited, not self-certified
                  </dd>
                </div>
                <div>
                  <dt className="ft-display text-3xl text-ft-text">Ongoing</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-ft-muted">
                    Maintained by continuing education, not earned once
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* What you get                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section id="inside" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16 md:px-8 md:py-28">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="ft-eyebrow">What you get</p>
              <h2 className="ft-display mt-3 max-w-md text-3xl text-ft-text md:text-5xl">
                Everything the session needs.
              </h2>
            </div>
            <Button asChild variant="outline" className="w-fit">
              <Link href="/auth/register">Start your assessment</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-14 md:gap-5">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <Reveal
                key={title}
                delay={i * 80}
                className="rounded-3xl border border-ft-border/70 bg-ft-surface p-6 md:p-7"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-ft-ink text-white">
                  <Icon className="size-[18px]" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-ft-text">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ft-muted">{body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Trust                                                            */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-8 md:pb-28">
          <div className="grid gap-4 md:grid-cols-3 md:gap-5">
            <div className="rounded-3xl border border-ft-border/70 bg-ft-surface p-6 md:p-7">
              <ShieldCheck className="size-5 text-ft-text" />
              <h3 className="mt-4 text-base font-semibold tracking-tight text-ft-text">
                Your history stays private
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ft-muted">
                Your assessment is visible to you and your assigned coach. Nobody else on the
                platform can read it.
              </p>
            </div>

            <div className="rounded-3xl border border-ft-border/70 bg-ft-surface p-6 md:p-7">
              <Sparkles className="size-5 text-ft-text" />
              <h3 className="mt-4 text-base font-semibold tracking-tight text-ft-text">
                AI drafts, your coach decides
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ft-muted">
                The AI can only propose. Publishing a programme is something only your
                ACSM-certified coach can do.
              </p>
            </div>

            <Photo
              src="/images/gym-detail.jpg"
              alt="Detail of a training space"
              fallback={<PosterArt variant="arcs" />}
              className="aspect-[4/3] rounded-3xl md:aspect-auto"
            />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Closing CTA                                                      */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-8 md:pb-28">
          <Reveal className="rounded-3xl bg-ft-ink px-6 py-12 text-center md:px-16 md:py-20">
            <h2 className="ft-display mx-auto max-w-2xl text-3xl text-white md:text-5xl">
              Start with the assessment.{" "}
              <span className="ft-accentuate text-ft-highlight">The rest follows.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/65 md:text-base">
              Ten minutes now, and your coach has everything they need to write the first block.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="highlight">
                <Link href="/auth/register">
                  Create your account
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/auth/login">Log in</Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-ft-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-ft-muted sm:flex-row sm:items-center sm:justify-between md:px-8">
          <span>FitnessTracker — coaching, written for you.</span>
          <Link href="/admin" className="transition-colors hover:text-ft-text">
            Staff login
          </Link>
        </div>
      </footer>
    </div>
  );
}
