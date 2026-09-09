/**
 * The LockSec backend does not return the user's role in the login response
 * body. It only appears inside the JWT. So anything that needs to know who
 * the user is has to read the token.
 *
 * A real decoded access token looks like this:
 *
 *   {
 *     "userId":   "6a995e663414224a81716617",
 *     "email":    "emmanueltofunmi9@gmail.com",
 *     "role":     "resident",
 *     "estateId": "67f2c1f5b1a2c3d4e5f67890",
 *     "iat":      1788436718,
 *     "exp":      1788440318,   // 1 hour after iat
 *     "aud":      "locksec-users",
 *     "iss":      "locksec-be"
 *   }
 *
 * IMPORTANT — this file DECODES, it does not VERIFY.
 *
 * Verifying a JWT means checking the signature, which needs the secret key.
 * That key lives on the backend and we will never have it. So everything
 * here is untrusted: a user could hand-craft a token claiming to be an admin
 * and our decode would happily believe them.
 *
 * That is fine, because we only use the decoded values to decide which page
 * to show. The backend independently verifies the token on every single
 * request, so a forged token gets a 401 the moment it asks for real data.
 * Our routing is a convenience, not a security boundary. Never rely on it
 * to protect anything that actually matters.
 */

export const ROLES = {
  RESIDENT: "resident",
  BUSINESS_OWNER: "business_owner",
  SECURITY: "security",
  ESTATE_ADMIN: "estate_admin",
  SUPER_ADMIN: "super_admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Only "resident" is confirmed against a live token so far. The others are
 * inferred from the OpenAPI spec, which has already proven unreliable.
 * Log in as each user type and check the token before trusting these.
 */
export const CONFIRMED_ROLES: readonly Role[] = [
  ROLES.RESIDENT,
  ROLES.ESTATE_ADMIN,
  ROLES.SUPER_ADMIN,
];

export interface TokenClaims {
  userId: string;
  email: string;
  role: Role;
  estateId?: string;
  iat: number;
  exp: number;
  aud?: string;
  iss?: string;
}

/**
 * Decode the payload of a JWT without verifying its signature.
 *
 * Written with atob/TextDecoder rather than a Node Buffer because this also
 * runs inside Next.js middleware, which uses the Edge runtime and has no
 * Node APIs available.
 */
export function decodeToken(token: string): TokenClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    // JWTs use base64url, which swaps two characters and drops the padding.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);

    const claims = JSON.parse(json) as TokenClaims;

    // A token with no role is useless to us — treat it as invalid.
    if (!claims.role || !claims.userId) return null;

    return claims;
  } catch {
    return null;
  }
}

/**
 * True if the token has expired, with a small safety margin.
 *
 * The margin matters: without it a token that expires in two seconds looks
 * valid, we send the request, and it fails in flight. Refreshing slightly
 * early is much cheaper than handling that race.
 */
export function isExpired(claims: TokenClaims, marginSeconds = 30): boolean {
  const now = Math.floor(Date.now() / 1000);
  return claims.exp - marginSeconds <= now;
}
