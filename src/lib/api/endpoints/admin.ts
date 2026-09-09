import { apiRequest, ApiError } from "@/lib/api/client";
import { envelope, paginatedEnvelope } from "@/lib/schemas/auth";
import {
  adminDueSchema,
  adminResidentSchema,
  adminTransactionSchema,
  estateSchema,
  planSchema,
  securitySchema,
  type CreateResidentInput,
  type CreateSecurityInput,
  type DueFormInput,
} from "@/lib/schemas/admin";

/**
 * Estate-admin data access.
 *
 * Same `tolerate` idea as the resident app: this backend has endpoints that
 * fail for reasons the frontend cannot fix, and a dashboard that dies because
 * one panel's endpoint is broken is worse than one that shows the rest and
 * says "unavailable".
 *
 * Only named statuses on named endpoints are tolerated. Everything else still
 * throws, so a genuinely new bug is not hidden.
 */

/**
 * The backend rejects any page size above 100 ("Too big: expected number to
 * be <=100"). Clamping here rather than at each call site means no future
 * screen can get it wrong — a caller asking for 500 quietly gets 100 instead
 * of a 400 that only shows up at runtime.
 */
const MAX_PAGE_SIZE = 100;

const pageSize = (requested: number) => Math.min(requested, MAX_PAGE_SIZE);

export interface Tolerated<T> {
  value: T;
  unavailable: boolean;
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

/* --- Estate ------------------------------------------------------------- */

export const getEstateProfile = () =>
  apiRequest("/estates/profile", { schema: envelope(estateSchema) }).then(
    (r) => r.data,
  );

/* --- Residents ---------------------------------------------------------- */

export const listResidents = (page = 1, limit = MAX_PAGE_SIZE) =>
  tolerate(
    () =>
      apiRequest("/residents/estate", {
        searchParams: { page, limit: pageSize(limit) },
        schema: paginatedEnvelope(adminResidentSchema),
      }).then((r) => r.data),
    { data: [], total: 0, page: 1, limit: pageSize(limit) },
    [403, 500],
  );

export const createResident = (input: CreateResidentInput) =>
  apiRequest("/residents", {
    method: "POST",
    body: input,
    schema: envelope(adminResidentSchema),
  }).then((r) => r.data);

export const updateResidentAdmin = (
  id: string,
  input: Partial<CreateResidentInput>,
) =>
  apiRequest(`/residents/${id}`, {
    method: "PATCH",
    body: input,
    schema: envelope(adminResidentSchema),
  }).then((r) => r.data);

export const deleteResident = (id: string) =>
  apiRequest(`/residents/${id}`, { method: "DELETE" });

/* --- Security ----------------------------------------------------------- */

export const listSecurity = (page = 1, limit = MAX_PAGE_SIZE) =>
  tolerate(
    () =>
      apiRequest("/securities/estate", {
        searchParams: { page, limit: pageSize(limit) },
        schema: paginatedEnvelope(securitySchema),
      }).then((r) => r.data),
    { data: [], total: 0, page: 1, limit: pageSize(limit) },
    [403, 500],
  );

export const createSecurity = (input: CreateSecurityInput) =>
  apiRequest("/securities", {
    method: "POST",
    // The backend rejects an empty email string, so omit the key entirely
    // when it is blank rather than sending "".
    body: input.email ? input : { ...input, email: undefined },
    schema: envelope(securitySchema),
  }).then((r) => r.data);

export const updateSecurity = (
  id: string,
  input: Partial<CreateSecurityInput>,
) =>
  apiRequest(`/securities/${id}`, {
    method: "PATCH",
    body: input,
    schema: envelope(securitySchema),
  }).then((r) => r.data);

export const deleteSecurity = (id: string) =>
  apiRequest(`/securities/${id}`, { method: "DELETE" });

/* --- Dues --------------------------------------------------------------- */

export const listDues = () =>
  tolerate(
    () =>
      apiRequest("/dues/estate", {
        searchParams: { page: 1, limit: MAX_PAGE_SIZE },
        schema: paginatedEnvelope(adminDueSchema),
      }).then((r) => r.data.data),
    [],
    [403, 500],
  );

/** The API takes accountNumber as a number; the form keeps it as a string. */
function toDuePayload(input: DueFormInput) {
  return {
    name: input.name,
    amount: input.amount,
    duration: input.duration,
    accountName: input.accountName,
    accountNumber: Number(input.accountNumber),
    bankName: input.bankName,
  };
}

export const createDue = (input: DueFormInput) =>
  apiRequest("/dues", {
    method: "POST",
    body: toDuePayload(input),
    schema: envelope(adminDueSchema),
  }).then((r) => r.data);

export const updateDue = (
  id: string,
  input: Partial<DueFormInput> & { isDueEnabled?: boolean },
) =>
  apiRequest(`/dues/${id}`, {
    method: "PATCH",
    body:
      input.accountNumber !== undefined
        ? { ...input, accountNumber: Number(input.accountNumber) }
        : input,
    schema: envelope(adminDueSchema),
  }).then((r) => r.data);

export const deleteDue = (id: string) =>
  apiRequest(`/dues/${id}`, { method: "DELETE" });

/* --- Transactions ------------------------------------------------------- */

export const listEstateTransactions = (page = 1, limit = MAX_PAGE_SIZE) =>
  tolerate(
    () =>
      apiRequest("/transactions/estate", {
        searchParams: { page, limit: pageSize(limit) },
        schema: paginatedEnvelope(adminTransactionSchema),
      }).then((r) => r.data),
    { data: [], total: 0, page: 1, limit: pageSize(limit) },
    [403, 500],
  );

/* --- Plans and subscriptions -------------------------------------------- */

export const listPlans = () =>
  tolerate(
    () =>
      apiRequest("/plans", {
        searchParams: { page: 1, limit: 20 },
        schema: paginatedEnvelope(planSchema),
      }).then((r) => r.data.data),
    [],
    [403, 500],
  );

export const listEstateSubscriptions = () =>
  tolerate(
    () =>
      apiRequest<never>("/subscriptions/estate", {
        searchParams: { page: 1, limit: 10 },
      }) as Promise<Record<string, unknown>>,
    {} as Record<string, unknown>,
    [403, 404, 500],
  );

export const createSubscription = (input: {
  planId: string;
  startDate: string;
  endDate: string;
}) =>
  apiRequest<never>("/subscriptions", {
    method: "POST",
    body: input,
  }) as Promise<Record<string, unknown>>;

/* --- Estate settings and password --------------------------------------- */

/**
 * Change the signed-in admin's password.
 *
 * PATCH /users/profile/update is the only endpoint that plausibly accepts
 * this — its request schema (`UpdateUserInput`) is referenced by the spec but
 * never defined, so what it takes is unknown. We send the obvious shape and
 * let the caller handle a rejection.
 *
 * If it turns out not to support passwords, the fallback offered in the UI is
 * the email reset flow, which definitely works.
 */
export const changePassword = (input: {
  oldPassword: string;
  newPassword: string;
}) =>
  apiRequest<never>("/users/profile/update", {
    method: "PATCH",
    body: input,
  }) as Promise<Record<string, unknown>>;

/**
 * Estate-level settings — the Access Code and Payment Collection switches,
 * and the entrance count.
 *
 * There is no settings endpoint. PATCH /estates/{id} exists but is documented
 * "Super Admin only" and its schema has no such fields. We attempt it anyway
 * so that the moment the backend supports it, this works; the UI reverts the
 * switch and explains if the call is refused.
 */
export const updateEstateSettings = (
  id: string,
  input: Record<string, unknown>,
) =>
  apiRequest<never>(`/estates/${id}`, {
    method: "PATCH",
    body: input,
  }) as Promise<Record<string, unknown>>;
