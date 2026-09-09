/**
 * Central place for environment variables.
 *
 * Why bother instead of using process.env directly everywhere?
 * If BACKEND_URL is missing, we want to know the moment the app boots —
 * not at 2am when a user hits a page and gets "fetch failed undefined".
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Add it to .env.local`,
    );
  }
  return value;
}

export const env = {
  /**
   * The LockSec backend. Server-side only — note there is no NEXT_PUBLIC_
   * prefix, so this value is never shipped to the browser.
   */
  backendUrl: required("BACKEND_URL", process.env.BACKEND_URL),

  isProduction: process.env.NODE_ENV === "production",
} as const;
