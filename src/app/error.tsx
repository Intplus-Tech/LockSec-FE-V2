"use client";

import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";

/**
 * The last line of defence when a page throws.
 *
 * Must be a client component — React needs to catch the error on the client
 * to render this. `reset` re-runs the failed render, which is often enough
 * when the cause was a transient network failure (a sleeping Render server,
 * for instance).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replace with your error reporting service when you add one.
    console.error(error);
  }, [error]);

  return (
    <div className="surface-grid flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-heading">
        Something broke on our side
      </h1>
      <p className="mt-3 max-w-sm text-body">
        The page didn&rsquo;t load. Trying again usually works.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-field bg-brand-deep px-6 py-3 font-medium text-white hover:bg-brand-deep-hover"
      >
        Try again
      </button>
    </div>
  );
}
