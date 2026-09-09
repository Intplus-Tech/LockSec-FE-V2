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
 */
export default function HomePage() {
  return (
    <div className="surface-grid min-h-dvh">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-10 sm:py-5">
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

      <main id="main" className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-28">
        <h1 className="text-hero font-extrabold text-heading">
          Every visitor accounted for
        </h1>

        {/* max-w-[60ch] keeps the line length readable regardless of screen
            width — long lines are hard to track back to the next line. */}
        <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-body">
          Residents create a code for each expected visitor. Security checks the
          code at the gate. Estate admins see every entry and every payment in
          one place.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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

        <section className="mt-16 border-t border-hairline pt-10 sm:mt-20">
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
