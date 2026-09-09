import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { decodeToken, isExpired } from "@/lib/auth/jwt";
import { canAccess, homeFor, isPublicRoute, loginRouteFor } from "@/lib/auth/roles";

/**
 * Runs on the server before any page renders.
 *
 * Next.js 16 renamed this file from middleware.ts to proxy.ts, and the
 * exported function from `middleware` to `proxy`. The behaviour is the same.
 *
 * This is what makes the three phases feel like separate apps while living in
 * one codebase: a resident who types /admin never sees an admin page flash on
 * screen before being redirected. They never get there.
 *
 * Remember what this is and is not. It is routing, based on a token we can
 * decode but cannot verify — the signing secret lives on the backend. Someone
 * could forge a token claiming to be an admin and reach the admin layout, but
 * every piece of data on that page comes from the backend, which verifies
 * properly and returns 401. They would see an empty shell full of errors.
 *
 * Middleware is user experience. The backend is the security.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const claims = token ? decodeToken(token) : null;
  const signedIn = Boolean(claims && !isExpired(claims));

  const isLoginPage =
    pathname === "/login" ||
    pathname === "/security/login" ||
    pathname === "/estate/login";

  // Already signed in and heading for a login page? Send them home instead.
  if (signedIn && isLoginPage) {
    return NextResponse.redirect(new URL(homeFor(claims!.role), request.url));
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!signedIn) {
    const loginUrl = new URL(loginRouteFor(pathname), request.url);
    // Remember where they were headed so we can return them after signing in.
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  

  // Signed in, but the wrong section for their role — send them to their own.
  if (!canAccess(claims!.role, pathname)) {
    return NextResponse.redirect(new URL(homeFor(claims!.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Skip API routes, Next.js internals and static files.
   *
   * The /api exclusion matters: those routes handle their own auth, and
   * running redirect logic on an XHR would return an HTML login page where
   * the caller expected JSON.
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
