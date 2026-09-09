import type { AdminDue, AdminTransaction } from "@/lib/schemas/admin";
import { refId, type Ref } from "@/lib/schemas/ref";

/**
 * The "Total Dues" and "Overdues" columns in the Figma.
 *
 * There is no endpoint for either. What the API gives us is a list of the
 * estate's recurring dues and a list of transactions, so this derives the
 * columns from those two:
 *
 *     Total Dues  = one period of every enabled due
 *     Paid        = that resident's successful transactions
 *     Overdue     = Total Dues − Paid, floored at zero
 *
 * That is a defensible reading, not a specification. In particular it assumes
 * one outstanding period per resident, because nothing in the API says how
 * many periods anyone is behind. A resident three months in arrears looks the
 * same as one who is one month behind.
 *
 * Replace the whole file the moment the backend exposes a real balance. Until
 * then this is documented arithmetic rather than an invented number, and the
 * UI labels it as an estimate.
 */

export function periodTotal(dues: AdminDue[]): number {
  return dues
    .filter((due) => due.isDueEnabled !== false)
    .reduce((sum, due) => sum + (due.amount ?? 0), 0);
}

/** Successful payments attributable to one resident. */
export function paidBy(
  transactions: AdminTransaction[],
  residentUserRef?: Ref | null,
  residentId?: string | null,
): number {
  // Accepts a reference in either shape, so callers do not each have to
  // remember which endpoint populated it.
  const userId = refId(residentUserRef ?? undefined);
  if (!userId && !residentId) return 0;

  return transactions
    .filter((tx) => {
      if (tx.status?.toLowerCase() !== "success") return false;
      const id = refId(tx.userId ?? undefined);
      return Boolean(id) && (id === userId || id === residentId);
    })
    .reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
}

export function overdueFor(total: number, paid: number): number {
  return Math.max(total - paid, 0);
}

/** The On-Time / Partial / Overdue badge in the Figma. */
export function paymentStanding(
  total: number,
  paid: number,
): "on-time" | "partial" | "overdue" {
  if (total <= 0 || paid >= total) return "on-time";
  if (paid > 0) return "partial";
  return "overdue";
}

export const STANDING_LABEL = {
  "on-time": "On-Time",
  partial: "Partial",
  overdue: "Overdue",
} as const;

export const STANDING_TONE = {
  "on-time": "ok",
  partial: "warn",
  overdue: "bad",
} as const;
