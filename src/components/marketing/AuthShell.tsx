import Link from "next/link";
import { Photo } from "@/components/marketing/Photo";
import { PosterArt } from "@/components/marketing/PosterArt";

/**
 * The frame around sign-in and sign-up.
 *
 * On mobile it's a single centred column — nothing competes with the form. On
 * a wide screen a photo panel carries the brand so the form itself can stay
 * plain: an account form that tries to be decorative is a form that's harder
 * to fill in.
 */
export function AuthShell({
  title,
  intro,
  children,
  footer,
  aside = {
    src: "/images/auth-panel.jpg",
    quote: "Every programme here is read and approved by an ACSM-certified coach.",
  },
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  aside?: { src: string; quote: string };
}) {
  return (
    <div className="flex min-h-dvh w-full">
      <div className="flex w-full flex-col justify-center px-6 py-10 md:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-[26rem]">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-ft-text transition-opacity hover:opacity-70"
          >
            FitnessTracker
          </Link>

          <h1 className="ft-display mt-10 text-3xl text-ft-text md:text-4xl">{title}</h1>
          {intro && <p className="mt-3 text-sm leading-relaxed text-ft-muted">{intro}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-7 text-sm text-ft-muted">{footer}</div>}
        </div>
      </div>

      <aside className="relative hidden lg:block lg:w-1/2">
        <Photo
          src={aside.src}
          alt=""
          fallback={<PosterArt variant="figure" />}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ft-ink/85 to-transparent p-12 pt-32">
          <p className="ft-display max-w-sm text-2xl text-white">
            <span className="ft-accentuate">{aside.quote}</span>
          </p>
        </div>
      </aside>
    </div>
  );
}
