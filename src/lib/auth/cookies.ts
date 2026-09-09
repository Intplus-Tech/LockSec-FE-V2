import type { NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * Where the tokens live.
 *
 * The obvious choice would be localStorage, and most tutorials do that. We
 * are not, for two reasons:
 *
 * 1. Security. localStorage is readable by any JavaScript on the page. One
 *    compromised npm package and an attacker walks off with tokens that are
 *    valid for 30 days. httpOnly cookies cannot be read by JavaScript at
 *    all — only the server sees them.
 *
 * 2. Middleware. Next.js middleware runs before the page renders, on the
 *    server. It can read cookies. It cannot read localStorage, because
 *    there is no browser yet. Since we gate routes by role in middleware,
 *    cookies are the only option that works.
 *
 * The trade-off is that browser JavaScript can no longer attach the token
 * to requests itself. That is what the proxy route handler is for — see
 * src/app/api/proxy/[...path]/route.ts.
 */

export const ACCESS_TOKEN_COOKIE = "locksec_token";
export const REFRESH_TOKEN_COOKIE = "locksec_refresh";

const ACCESS_MAX_AGE = 60 * 60; // 1 hour, matching the backend's exp
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, matching the backend

const baseOptions = {
  httpOnly: true,
  // Only send over HTTPS in production. Locally we are on http://localhost,
  // where a secure cookie would simply never be sent.
  secure: env.isProduction,
  // "lax" lets the cookie ride along on normal navigation but blocks it on
  // cross-site POSTs, which is the CSRF case we care about.
  sameSite: "lax",
  path: "/",
} as const;

export function setAuthCookies(
  response: NextResponse,
  tokens: { token: string; refreshToken?: string },
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.token, {
    ...baseOptions,
    maxAge: ACCESS_MAX_AGE,
  });

  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...baseOptions,
      maxAge: REFRESH_MAX_AGE,
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}
