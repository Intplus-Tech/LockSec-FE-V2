/**
 * What the access-code statuses actually mean.
 *
 * Confirmed by creating a real code: the backend returns
 *
 *     "status": "inactive",  "isAccessCodeEnabled": true
 *
 * on a brand-new, perfectly valid code. So `inactive` does NOT mean
 * "rejected" — it appears to mean "issued but not yet used". Presumably a
 * code becomes `active` once a visitor has entered on it.
 *
 * This caught out an earlier version of the app in two places, and both were
 * my guesses rather than anything the spec said:
 *
 *   - The dashboard counted `status === "active"`, so a resident who had just
 *     created three codes saw a count of zero.
 *   - The security gate rejected `inactive` as "Code not available", which
 *     would have turned away every visitor holding a valid unused code.
 *
 * Hence this file. One place that decides what a status means, with the
 * evidence written down beside it.
 *
 * STILL UNVERIFIED: nobody has observed a code transition to `active`, so
 * that reading is inference. If the backend developer confirms different
 * semantics, this is the only file to change.
 */

export type CodeStatus = "active" | "inactive" | "expired" | string;

/** Definitely no longer usable. */
export function isExpiredCode(
  status: string | null | undefined,
  expiresAt?: string | null,
): boolean {
  if (status?.toLowerCase() === "expired") return true;

  // Trust the timestamp as well as the status. The backend may only
  // recalculate status lazily, and a code that expired two minutes ago should
  // not be honoured because nothing has touched the record since.
  if (expiresAt) {
    const expiry = new Date(expiresAt).getTime();
    if (!Number.isNaN(expiry) && expiry <= Date.now()) return true;
  }

  return false;
}

/** Switched off by an admin, regardless of expiry. */
export function isDisabledCode(enabled: boolean | null | undefined): boolean {
  return enabled === false;
}

/**
 * Usable at the gate right now.
 *
 * Note what this does NOT do: it does not require status === "active".
 * A newly issued code is `inactive` and must be honoured.
 */
export function isUsableCode(code: {
  status?: string | null;
  isAccessCodeEnabled?: boolean | null;
  codeExpiresAt?: string | null;
}): boolean {
  if (isDisabledCode(code.isAccessCodeEnabled)) return false;
  if (isExpiredCode(code.status, code.codeExpiresAt)) return false;
  return true;
}

/** "Expires in 7 minutes", or "Expired". */
export function expiryLabel(expiresAt?: string | null): string | null {
  if (!expiresAt) return null;

  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return null;

  const remaining = expiry - Date.now();
  if (remaining <= 0) return "Expired";

  const minutes = Math.floor(remaining / 60_000);
  if (minutes < 1) return "Expires in under a minute";
  if (minutes === 1) return "Expires in 1 minute";
  if (minutes < 60) return `Expires in ${minutes} minutes`;

  const hours = Math.round(minutes / 60);
  return `Expires in ${hours} ${hours === 1 ? "hour" : "hours"}`;
}
