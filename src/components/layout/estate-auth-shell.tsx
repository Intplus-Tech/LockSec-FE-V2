import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/**
 * The estate-admin auth frame: a pale grid page with a marketing navbar and a
 * dark card floating in the middle.
 *
 * Two responsive problems this solves, both of which broke the first version:
 *
 * 1. CENTRING THAT CLIPS. `items-center justify-center` on a flex container
 *    looks right until the content is taller than the viewport — then the
 *    overflow spills equally in both directions and the TOP becomes
 *    unreachable, because you cannot scroll above the start of a scroll
 *    container. The Create Estate Account form is tall enough to hit this on
 *    a phone in landscape. `my-auto` on the child is the fix: it centres when
 *    there is room and behaves like normal flow when there is not.
 *
 * 2. NAVBAR OVERFLOW. Logo + "Home" + a Sign In pill is about 310px of
 *    content, which does not fit a 320px screen with padding. The wordmark
 *    now hides below 400px, leaving just the shield.
 */
export function EstateAuthShell({
  title,
  subtitle,
  back,
  navAction,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label?: string };
  navAction?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const action = navAction ?? { href: "/estate/login", label: "Sign In" };

  return (
    <div className="surface-grid flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-10 sm:py-5">
        <Link href="/" aria-label="LockSec home" className="shrink-0">
          <Logo hideWordmarkOnSmall />
        </Link>

        <nav className="flex shrink-0 items-center gap-3 text-sm sm:gap-6">
          <Link href="/" className="text-heading hover:text-brand">
            Home
          </Link>
          <Link
            href={action.href}
            className="whitespace-nowrap rounded-field bg-brand-navy px-4 py-2 font-medium text-white hover:bg-brand-navy/90 sm:px-5"
          >
            {action.label}
          </Link>
        </nav>
      </header>

      <main id="main" className="flex flex-1 justify-center px-4 py-8 sm:px-5">
        {/* my-auto, not justify-center — see the note above. */}
        <div className="my-auto w-full max-w-lg">
          {back ? (
            <Link
              href={back.href}
              className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm text-heading hover:text-brand"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              {back.label ?? "Back"}
            </Link>
          ) : null}

          <div className="rounded-sheet bg-slab px-5 py-7 sm:px-10 sm:py-10">
            <h1 className="text-center text-title font-extrabold text-white">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-center text-sm text-white/60">
                {subtitle}
              </p>
            ) : null}

            <div className="mt-7">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
