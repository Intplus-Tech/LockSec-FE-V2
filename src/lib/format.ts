/**
 * Formatting helpers.
 *
 * Centralised because a currency symbol or date format that appears in nine
 * places will eventually be wrong in one of them.
 */

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** ₦28,000 — the estate app deals in whole naira, so no kobo. */
export function formatNaira(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "₦0";
  }
  return naira.format(amount);
}

/** "Jun 28th" — the short form used in the history table. */
export function formatShortDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  const month = date.toLocaleDateString("en-NG", { month: "short" });
  return `${month} ${day}${suffix}`;
}

/** "July 4, 2023" — the long form used on the profile page. */
export function formatLongDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** For <input type="date">, which requires exactly YYYY-MM-DD. */
export function toDateInputValue(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** "Guest", "Business Owner" — enum values are snake_case on the wire. */
export function titleCase(value: string | null | undefined) {
  if (!value) return "—";
  return value
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
