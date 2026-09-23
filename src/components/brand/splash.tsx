"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * The opening screen for the resident and security apps.
 *
 * TWO THINGS THIS DELIBERATELY AVOIDS.
 *
 * It does not add an artificial delay on top of a page that is already ready.
 * Where there is real loading to wait for — the resident dashboard fetches a
 * profile, codes and dues before it can show anything — the splash covers
 * that instead of a blank frame. `minMs` only stops it flashing past too
 * quickly to read on a fast connection.
 *
 * And it shows once per browser session, not on every navigation. A guard
 * working a gate returns to this screen after every visitor; a logo animation
 * each time would be maddening. Session storage rather than local, so a fresh
 * visit tomorrow gets the full opening again.
 */
export function Splash({
  ready = true,
  minMs = 1100,
  storageKey,
}: {
  /** False while the screen behind is still loading. */
  ready?: boolean;
  /** Shortest time to stay on screen, so it is readable rather than a flash. */
  minMs?: number;
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
    try {
      if (window.sessionStorage.getItem(storageKey) === "seen") {
        setPhase("gone");
      }
    } catch {
      // Storage can be unavailable in private modes. Showing the splash is
      // the harmless outcome, so there is nothing to handle.
    }
  }, [storageKey]);

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
