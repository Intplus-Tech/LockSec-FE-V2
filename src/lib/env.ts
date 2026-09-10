/**
 * Environment variables.
 *
 * WHY THIS IS LAZY.
 *
 * The obvious version reads and validates on import:
 *
 *     export const env = {
 *       backendUrl: required("BACKEND_URL", process.env.BACKEND_URL),
 *     };
 *
 * That runs the moment anything imports this file — including during
 * `next build`. So a missing variable fails the whole build with a stack
 * trace, rather than the request that actually needed it. On Vercel that
 * means a deploy that never completes, and an error message pointing at a
 * build step instead of at the missing configuration.
 *
 * Reading it through a getter defers the check to first use. The build
 * succeeds; a request that genuinely needs the backend URL and cannot find
 * one fails with a message that says exactly which variable is missing.
 *
 * The rule generalises: validate configuration where it is used, not where
 * the module is loaded. Build time and run time are different machines with
 * different environments.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. ` +
        `Set it in .env.local locally, and in Settings → Environment Variables on Vercel.`,
    );
  }
  return value;
}

export const env = {
  /**
   * The LockSec backend. Server-side only — note there is no NEXT_PUBLIC_
   * prefix, so this value never reaches the browser bundle.
   */
  get backendUrl(): string {
    return required("BACKEND_URL", process.env.BACKEND_URL);
  },

  get isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },
} as const;
