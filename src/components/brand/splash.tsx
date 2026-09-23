"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * The opening screen for the resident and security apps.
 *
 * WHERE IT APPEARS. On the way *in* — before the sign-in screen, not after
 * it. The sign-in screen is the first screen of the app, so an opening that
 * appeared behind it would be arriving late.
 *
 * It is mounted on the resident and security layouts and on the shared
 * sign-in and registration pages, which between them cover every way into
 * either app: through the landing page, from a bookmark, or straight to a
 * deep link such as an estate's invite link.
 *
 * TWO BEHAVIOURS, BY PLACE. On a sign-in screen it shows every time: coming
 * back to sign in again is a fresh start and should feel like one. Inside the
 * apps it shows once per browser session — a guard returns to the gate after
 * every visitor, and a resident moves between four screens, so a logo
 * animation each time would be an obstacle rather than a flourish.
 *
 * Either way it records having been shown, so signing in and landing on the
 * dashboard gives one opening rather than two in a row. Session storage
 * rather than local, so a fresh visit tomorrow starts over.
 *
 * NO ARTIFICIAL WAIT WHERE THERE IS REAL LOADING. Pass `ready` and the splash
 * stays until the screen behind it has what it needs; `minMs` only stops it
 * flashing past too quickly to read on a fast connection.
 */
export function Splash({
  ready = true,
  minMs = 1100,
  once = true,
  storageKey,
}: {
  /** False while the screen behind is still loading. */
  ready?: boolean;
  /** Shortest time to stay on screen, so it is readable rather than a flash. */
  minMs?: number;
  /**
   * True inside the apps — show once per session. False on sign-in screens,
   * where every arrival is a fresh start.
   */
  once?: boolean;
  /** Separate keys per app, so signing in as a guard still gets its opening. */
  storageKey: string;
}) {
  const [phase, setPhase] = useState<"visible" | "leaving" | "gone">("visible");
  const shownAt = useRef(Date.now());

  /**
   * Whether this session has already seen the splash can only be known in the
   * browser. Reading it during render would make the server's HTML and the
   * browser's first render disagree, which React rejects.
   *
   * So both render the splash, and a layout effect — which runs before the
   * browser paints — removes it immediately if it has been seen. No mismatch,
   * and no visible flash on repeat visits.
   */
  const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

  useIsomorphicLayoutEffect(() => {
    if (!once) return;

    try {
      if (window.sessionStorage.getItem(storageKey) === "seen") {
        setPhase("gone");
      }
    } catch {
      // Storage can be unavailable in private modes. Showing the splash is
      // the harmless outcome, so there is nothing to handle.
    }
  }, [once, storageKey]);

  useEffect(() => {
    if (phase !== "visible" || !ready) return;

    const remaining = Math.max(minMs - (Date.now() - shownAt.current), 0);
    const timer = window.setTimeout(() => setPhase("leaving"), remaining);
    return () => window.clearTimeout(timer);
  }, [phase, ready, minMs]);

  useEffect(() => {
    if (phase !== "leaving") return;

    try {
      window.sessionStorage.setItem(storageKey, "seen");
    } catch {
      /* see above */
    }

    // Matches the fade duration below, so the element is removed only once it
    // is invisible.
    const timer = window.setTimeout(() => setPhase("gone"), 400);
    return () => window.clearTimeout(timer);
  }, [phase, storageKey]);

  if (phase === "gone") return null;

  return (
    <div
      // aria-hidden because the visible content is a logo, which tells a
      // screen-reader user nothing. The status message below carries the
      // meaning instead.
      aria-hidden="true"
      className={cn(
        "surface-stars fixed inset-0 z-[60] flex flex-col items-center justify-center",
        "transition-opacity duration-400 ease-out motion-reduce:transition-none",
        phase === "leaving" && "pointer-events-none opacity-0",
      )}
    >
      <div className="flex flex-col items-center">
        <LogoMark className="size-14" />
        <p className="mt-4 text-3xl font-extrabold tracking-tight text-white">
          Lock<span className="text-brand">Sec</span>
        </p>
      </div>

      <p className="absolute bottom-12 text-sm text-white/55">
        Powered By <span className="font-semibold text-white/80">Int+</span>
      </p>
    </div>
  );
}

/** Announced to assistive technology while the splash covers the screen. */
export function SplashAnnouncement({ loading }: { loading: boolean }) {
  return (
    <p className="sr-only" role="status">
      {loading ? "Loading LockSec" : ""}
    </p>
  );
}


/**
 * Chooses the behaviour from the current route.
 *
 * The security layout wraps both the gate and its sign-in screen, so it
 * cannot simply pick one setting — the sign-in screen should show the opening
 * every time, the gate should not. This reads the path and decides.
 *
 * The `key` matters: a layout does not remount as you move between its pages,
 * so without it the splash would stay in its finished state forever. Changing
 * the key on navigation gives a fresh one, which then applies whichever rule
 * fits the page just opened.
 */
export function SplashOnEntry({
  storageKey,
  entryPaths,
}: {
  storageKey: string;
  /** Routes that should show the opening on every visit. */
  entryPaths: string[];
}) {
  const pathname = usePathname();
  const isEntry = entryPaths.includes(pathname);

  return (
    <Splash key={pathname} storageKey={storageKey} once={!isEntry} />
  );
}
