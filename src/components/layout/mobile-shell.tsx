import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The resident app's screen frame: a dark starfield header meeting a white
 * body, as in the Figma.
 *
 * Responsive notes, since this frames every resident screen:
 *
 *  - Padding steps up from 20px on a small phone to 24px above 400px. At
 *    320px, 24px each side leaves only 272px of content, which makes the
 *    two-column name fields uncomfortably narrow.
 *
 *  - The title uses `text-display`, a clamp() size, so it scales smoothly
 *    rather than jumping between breakpoints.
 *
 *  - `max-w-md` centres a phone-width column on desktop. The design is drawn
 *    for a phone, but this is a web app — without a max width the fields
 *    would stretch to 1400px on a laptop and look broken.
 *
 *  - `min-h-dvh` rather than `min-h-screen`. On mobile Safari, `100vh`
 *    includes the address bar that is not actually there, so a full-height
 *    layout ends up taller than the visible area and the bottom of the page
 *    sits under the browser chrome. `dvh` tracks the real visible height.
 */
export function MobileShell({
  title,
  subtitle,
  back,
  action,
  children,
  headerClassName,
  /** Constrains the title so it wraps like the Figma. Off by default. */
  narrowTitle,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  headerClassName?: string;
  narrowTitle?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header
        className={cn(
          "surface-stars px-5 pb-7 pt-5 text-white min-[400px]:px-6 min-[400px]:pb-8 min-[400px]:pt-6",
          headerClassName,
        )}
      >
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-start justify-between gap-3">
            {back ? (
              <Link
                href={back}
                aria-label="Go back"
                // 44px minimum touch target — the accessibility floor for
                // anything tapped with a thumb.
                className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            {action}
          </div>

          {title ? (
            <h1
              className={cn(
                "mt-5 text-display font-extrabold",
                // The Figma wraps "Generate Access Code" onto three lines.
                // A ch-based max-width does that without hard-coded breaks,
                // but it is opt-in — it would mangle a short title.
                narrowTitle && "max-w-[9ch]",
              )}
            >
              {title}
            </h1>
          ) : null}

          {subtitle ? (
            <div className="mt-2 text-sm text-white/70">{subtitle}</div>
          ) : null}
        </div>
      </header>

      <main
        id="main"
        className="flex-1 px-5 py-6 min-[400px]:px-6 min-[400px]:py-7"
      >
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
