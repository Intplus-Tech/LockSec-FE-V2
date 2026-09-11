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
 * request was wrong".
 *
 *   403  the backend refuses residents this endpoint
 *   500  an unhandled exception inside the backend
 *   502  a bad gateway between us and it
 *   503  the backend is unreachable or asleep
 *   504  it took too long to answer
 *
 * The gateway statuses were missing, which produced exactly the bug this
 * whole mechanism exists to prevent: with the backend down, the dues query
 * threw instead of being tolerated, `dues.data` was undefined, and the
 * dashboard fell back to `?? 0` and displayed a confident **₦0**.
 *
 * A resident seeing ₦0 concludes they owe nothing. That is worse than an
 * error message, because there is no reason for them to doubt it.
 */
const UNAVAILABLE_STATUSES = [403, 500, 502, 503, 504];

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
 * STILL BROKEN. Returns 500:
 *
 *     "Cannot read properties of undefined (reading 'populated')"
 *
 * An unhandled Mongoose exception in the backend, so nothing sent differently
 * will help. There is no workaround either: `/access-codes` is admin-only and
 * returns 403 to residents, and `/access-codes/{id}` needs ids that only the
 * broken list can supply.
 *
 * Tolerated so the dashboard and history screen stay usable. The history tab
 * says the list is unavailable rather than claiming the resident has no
 * codes — which would be untrue, and would make them think theirs had
 * vanished. Backend issue 23.
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
 * Residents can now read this — confirmed by a live 200 response. It was
 * previously 403 "Forbidden: insufficient role", which blocked the dashboard's
 * Amount Due and the whole Make Estate Bill screen.
 *
 * Still wrapped in `tolerate` on purpose. Being permitted to call an endpoint
 * is not the same as it always succeeding, and the alternative when it fails
 * is a confident ₦0 that a resident would read as "you owe nothing".
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

/** Payment providers name their redirect a dozen different ways. */
export function findPaymentUrl(body: Record<string, unknown>): string | null {
  const data = (body?.data ?? body) as Record<string, unknown>;

  for (const key of [
    "authorization_url",
    "authorizationUrl",
    "paymentUrl",
    "payment_url",
    "link",
    "checkoutUrl",
    "redirectUrl",
  ]) {
    const value = data?.[key];
    if (typeof value === "string" && value.startsWith("http")) return value;
  }

  return null;
}
