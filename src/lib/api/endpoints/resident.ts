import { apiRequest, ApiError } from "@/lib/api/client";
import { envelope, paginatedEnvelope } from "@/lib/schemas/auth";
import {
  accessCodeSchema,
  dueSchema,
  residentSchema,
  transactionSchema,
  type UpdateResidentInput,
} from "@/lib/schemas/resident";
import type { CreateAccessCodeInput } from "@/lib/schemas/access-code";

/**
 * Every call here goes through /api/proxy, which attaches the token from the
 * httpOnly cookie. No component ever sees a token.
 *
 * ---------------------------------------------------------------------------
 * A note on the `tolerate` wrapper below.
 *
 * Several of this backend's endpoints fail in ways that are not the user's
 * fault and not recoverable from the frontend:
 *
 *   GET /dues/estate            403  "Forbidden: insufficient role"
 *   GET /access-codes/resident  500  "Cannot read properties of undefined
 *                                     (reading 'populated')"
 *
 * The second is an unhandled Mongoose exception inside the backend — a crash,
 * not a rule.
 *
 * A dashboard that throws when any one panel's data is unavailable is worse
 * than one that shows the panels it can and says "unavailable" for the rest.
 * So these resolve to a value carrying an `unavailable` flag rather than
 * throwing, and each screen decides what to say.
 *
 * This is deliberately NOT blanket error-swallowing. Only specific known
 * failures are tolerated; anything else still throws and surfaces normally.
 * ---------------------------------------------------------------------------
 */

export interface Tolerated<T> {
  value: T;
  unavailable: boolean;
  /** Kept for display in development, never shown to a user. */
  reason?: string;
}

/**
 * Statuses that mean "we could not get this data", as opposed to "the
 * request was wrong":
 *
 *   500  an unhandled exception inside the backend
 *   502  a bad gateway between us and it
 *   503  the backend is unreachable or asleep
 *   504  it took too long to answer
 *
 * 403 used to be on this list, because /dues/estate refused residents and
 * /access-codes/resident threw. Both are fixed and verified, so a permission
 * error here would now be a real problem worth surfacing rather than hiding.
 *
 * The gateway statuses stay. With the backend down, an untolerated failure
 * left `dues.data` undefined, the dashboard fell back to `?? 0`, and a
 * resident was shown a confident ₦0 — which they would reasonably read as
 * owing nothing. That is worse than an error, because nothing prompts them
 * to doubt it.
 */
const UNAVAILABLE_STATUSES = [500, 502, 503, 504];

async function tolerate<T>(
  work: () => Promise<T>,
  fallback: T,
  statuses: number[],
): Promise<Tolerated<T>> {
  try {
    return { value: await work(), unavailable: false };
  } catch (error) {
    if (error instanceof ApiError && statuses.includes(error.status)) {
      return { value: fallback, unavailable: true, reason: error.message };
    }
    throw error;
  }
}

/* --- Profile ------------------------------------------------------------ */

export const getResidentProfile = () =>
  apiRequest("/residents/profile", {
    schema: envelope(residentSchema),
  }).then((r) => r.data);

export const updateResident = (id: string, input: UpdateResidentInput) =>
  apiRequest(`/residents/${id}`, {
    method: "PATCH",
    body: input,
    schema: envelope(residentSchema),
  }).then((r) => r.data);

/* --- Access codes ------------------------------------------------------- */

export const getAccessCode = (id: string) =>
  apiRequest(`/access-codes/${id}`, {
    schema: envelope(accessCodeSchema),
  }).then((r) => r.data);

export const createAccessCode = (input: CreateAccessCodeInput) =>
  apiRequest("/access-codes", {
    method: "POST",
    body: input,
    schema: envelope(accessCodeSchema),
  }).then((r) => r.data);

type AccessCode = Awaited<ReturnType<typeof getAccessCode>>;

/**
 * GET /access-codes/resident currently returns a 500 from an unhandled
 * exception in the backend's Mongoose query. Tolerated so the dashboard and
 * history screen stay usable while it is broken.
 */
export const listMyAccessCodes = (page = 1, limit = 20) =>
  tolerate<AccessCode[]>(
    () =>
      apiRequest("/access-codes/resident", {
        searchParams: { page, limit },
        schema: paginatedEnvelope(accessCodeSchema),
      }).then((r) => r.data.data),
    [],
    UNAVAILABLE_STATUSES,
  );

/* --- Dues --------------------------------------------------------------- */

type Due = Awaited<ReturnType<typeof getOneDue>>;
const getOneDue = () =>
  apiRequest("/dues/estate", {
    searchParams: { page: 1, limit: 50 },
    schema: paginatedEnvelope(dueSchema),
  }).then((r) => r.data.data[0]);

/**
 * GET /dues/estate is marked "Estate Admins only" and refuses residents, so
 * a resident cannot see what they owe. Backend issue 18 — the most serious
 * one on the list, since paying dues is half of what this app is for.
 */
export const listEstateDues = () =>
  tolerate<Due[]>(
    () =>
      apiRequest("/dues/estate", {
        searchParams: { page: 1, limit: 50 },
        schema: paginatedEnvelope(dueSchema),
      }).then((r) => r.data.data),
    [],
    UNAVAILABLE_STATUSES,
  );

/* --- Payments ----------------------------------------------------------- */

type Transaction = Awaited<ReturnType<typeof getOneTransaction>>;
const getOneTransaction = () =>
  apiRequest("/transactions/resident", {
    searchParams: { page: 1, limit: 1 },
    schema: paginatedEnvelope(transactionSchema),
  }).then((r) => r.data.data[0]);

export const listMyTransactions = (page = 1, limit = 20) =>
  tolerate<Transaction[]>(
    () =>
      apiRequest("/transactions/resident", {
        searchParams: { page, limit },
        schema: paginatedEnvelope(transactionSchema),
      }).then((r) => r.data.data),
    [],
    UNAVAILABLE_STATUSES,
  );

export const initiatePayment = (input: {
  amount: number;
  duration: number;
  type: string;
}) =>
  apiRequest<never>("/payments/initiate", {
    method: "POST",
    body: input,
  }) as Promise<Record<string, unknown>>;

export const verifyPayment = (reference: string) =>
  apiRequest<never>(
    `/payments/verify/${encodeURIComponent(reference)}`,
  ) as Promise<Record<string, unknown>>;

/**
 * Find the provider's checkout link in a payment response.
 *
 * The backend uses Squad. A successful initiate returns, among other things:
 *
 *     "checkout_url": "https://sandbox-pay.squadco.com/c_U0JDNDVF…",
 *     "transaction_ref": "SQTECH6392574733742200002",
 *     "transaction_amount": 10000        // kobo, so NGN 100
 *
 * An earlier version of this list had `checkoutUrl` in camelCase but not
 * `checkout_url` with an underscore — so the link was present, went
 * unrecognised, and the app showed "Payment Successfully" without anyone
 * being charged. Both spellings are now covered, along with the other names
 * providers commonly use.
 *
 * The lesson is narrow but worth keeping: when guessing at field names, cover
 * both casings. The cost of a miss here was a payment screen that lied.
 */
export function findPaymentUrl(body: Record<string, unknown>): string | null {
  const data = (body?.data ?? body) as Record<string, unknown>;

  for (const key of [
    "checkout_url",
    "checkoutUrl",
    "authorization_url",
    "authorizationUrl",
    "payment_url",
    "paymentUrl",
    "redirect_url",
    "redirectUrl",
    "link",
    "url",
  ]) {
    const value = data?.[key];
    if (typeof value === "string" && value.startsWith("http")) return value;
  }

  return null;
}

/**
 * The provider's reference for this payment.
 *
 * Kept so the success screen can confirm the payment really completed by
 * calling /payments/verify/{reference}, rather than assuming it did because
 * the browser came back.
 */
export function findPaymentRef(body: Record<string, unknown>): string | null {
  const data = (body?.data ?? body) as Record<string, unknown>;

  for (const key of ["transaction_ref", "transactionRef", "tx_ref", "reference"]) {
    const value = data?.[key];
    if (typeof value === "string" && value) return value;
  }

  return null;
}
