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
    [500, 403],
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
    [403],
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
    [500, 403],
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
