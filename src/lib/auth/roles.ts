import { ROLES, type Role } from "./jwt";

/**
 * One place that answers "which parts of the app can this role see?"
 *
 * Keeping it here rather than scattering `if (role === ...)` through
 * components means that when your boss says "actually business owners should
 * see the dues page too", you change one line.
 */

/** Where each role lands after signing in. */
export const HOME_ROUTE: Record<Role, string> = {
  [ROLES.RESIDENT]: "/resident",
  [ROLES.BUSINESS_OWNER]: "/resident",
  [ROLES.SECURITY]: "/security",
  [ROLES.ESTATE_ADMIN]: "/admin",
  [ROLES.SUPER_ADMIN]: "/admin",
};

/**
 * Which roles may enter each top-level section.
 *
 * business_owner is a resident with extra profile fields — same screens, so
 * it maps to the same section.
 */
const SECTION_ACCESS: Record<string, readonly Role[]> = {
  "/resident": [ROLES.RESIDENT, ROLES.BUSINESS_OWNER],
  "/security": [ROLES.SECURITY],
   "/admin": [ROLES.ESTATE_ADMIN, ROLES.SUPER_ADMIN],
};

/**
 * Pages reachable without signing in.
 *
 * /security/login is listed explicitly and matched before the /security
 * section rule, otherwise security staff could never reach their own login.
 */
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/security/login",
  "/estate",
  "/terms",
  "/data-processing",
];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function canAccess(role: Role, pathname: string): boolean {
  const section = Object.keys(SECTION_ACCESS).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!section) return true;

  return SECTION_ACCESS[section].includes(role);
}

export function homeFor(role: Role): string {
  return HOME_ROUTE[role] ?? "/";
}

/** Which sign-in screen to send someone to, based on where they were going. */
export function loginRouteFor(pathname: string): string {
  if (pathname.startsWith("/security")) return "/security/login";
  if (pathname.startsWith("/admin")) return "/estate/login";
  return "/login";
}
