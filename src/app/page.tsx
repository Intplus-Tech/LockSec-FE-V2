import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "LockSec — Estate access control",
  description:
    "Residents create a code for each visitor. Security checks it at the gate. Admins see every entry and every payment in one place.",
  alternates: { canonical: "/" },
};

/**
 * The public landing page — where the navbar's "Home" link goes, and the only
 * page that should be indexed.
 *
 * Kept deliberately plain: there is no design or marketing copy for this page
 * yet, so this is honest scaffolding that says what the product does and
 * routes each of the three audiences to the right door. Replace the copy when
 * the real thing exists.
 *
 * FITTING ONE SCREEN. The page is sized to the viewport, with the content
 * centred in whatever height is left below the header.
 *
 * Two details make that work rather than break:
 *
 * `min-h-dvh`, not `h-dvh`. `dvh` measures the height actually visible —
 * `vh` on a phone includes the space behind the address bar, so a `100vh`
 * page has its last inch hidden until you scroll. And `min-h` rather than a
 * fixed height means a short window, like a phone held sideways, lets the
 * page grow and scroll instead of clipping the buttons.
 *
 * The gaps are `clamp()` rather than fixed steps, so they shrink on a short
 * screen before anything is forced out of view, and open back up on a
 * desktop.
 */
export default function HomePage() {
  return (
    <div className="surface-grid flex min-h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-10 sm:py-5">
        <Logo hideWordmarkOnSmall />
        <nav className="flex items-center gap-3 text-sm sm:gap-6">
          <Link
            href="/estate/login"
            className="whitespace-nowrap rounded-field bg-brand-navy px-4 py-2 font-medium text-white hover:bg-brand-navy/90 sm:px-5"
          >
            Sign In
          </Link>
        </nav>
      </header>

      <main
        id="main"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-[clamp(1.5rem,5vh,4rem)] sm:px-6"
      >
        <h1 className="text-hero font-extrabold text-heading">
          Every visitor accounted for
        </h1>

        {/* max-w-[55ch] keeps the line length readable regardless of screen
            width — long lines are hard to track back to the next line. */}
        <p className="mt-[clamp(0.75rem,2.5vh,1.5rem)] max-w-[55ch] text-lg leading-relaxed text-body">
          Residents create a code for each expected visitor. Security checks the
          code at the gate. Estate admins see every entry and every payment in
          one place.
        </p>

        <div className="mt-[clamp(1.25rem,4vh,2.5rem)] flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/estate/register"
            className="rounded-field bg-brand-deep px-6 py-3 text-center font-medium text-white hover:bg-brand-deep-hover"
          >
            Set up your estate
          </Link>
          <Link
            href="/login"
            className="rounded-field border border-hairline-strong bg-white px-6 py-3 text-center font-medium text-body hover:bg-canvas"
          >
            Resident sign in
          </Link>
        </div>

        <section className="mt-[clamp(1.75rem,6vh,4rem)] border-t border-hairline pt-[clamp(1rem,3vh,2.5rem)]">
          <h2 className="text-sm text-muted">Signing in as security?</h2>
          <p className="mt-2 text-body">
            Use the link your estate admin gave you, or{" "}
            <Link
              href="/security/login"
              className="font-medium text-brand underline underline-offset-4"
            >
              enter your personnel ID
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
