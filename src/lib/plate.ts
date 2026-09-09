/**
 * Nigerian vehicle plate formatting.
 *
 * The backend rejects plates that do not match its expected shape but does
 * not document the rule anywhere — "WERF45GT" came back as a validation
 * error while "IKJ 827 QX" was accepted. The standard civilian format is
 * three letters, three digits, two letters, conventionally spaced.
 *
 * Rather than guess at the exact regex the backend uses, this normalises what
 * the user types into the format that is known to work, and validates loosely
 * enough not to block a legitimate plate we have not thought of.
 */

/** "werf45gt" -> "WERF45GT"; "ikj827qx" -> "IKJ 827 QX" */
export function normalisePlate(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // The common civilian format: 3 letters, 3 digits, 2 letters.
  const match = cleaned.match(/^([A-Z]{3})(\d{3})([A-Z]{2})$/);
  if (match) return `${match[1]} ${match[2]} ${match[3]}`;

  return cleaned;
}

/**
 * Loose enough to accept government, diplomatic and older plates, strict
 * enough to catch a typo before the request is sent.
 */
export function looksLikePlate(input: string): boolean {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length < 6 || cleaned.length > 10) return false;
  // Must contain both letters and digits.
  return /[A-Z]/.test(cleaned) && /\d/.test(cleaned);
}
