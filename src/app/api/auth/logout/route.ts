import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";

/**
 * Logging out is simply dropping the cookies. There is no backend logout
 * endpoint in this API, so the tokens stay technically valid until they
 * expire — the browser just no longer holds them.
 *
 * Worth raising with your backend developer: a proper implementation would
 * invalidate the refresh token server-side.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
