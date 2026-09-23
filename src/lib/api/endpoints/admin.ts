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
 * Lists are paginated and searched BY THE SERVER. The backend now supports a
 * `search` parameter, confirmed live: one resident, filtered to none by a
 * nonsense term. Before that, everything was filtered in the browser over
 * whatever page happened to be loaded — which meant an estate with more than
 * a hundred residents could only ever search the first hundred.
 *
 * `tolerate` remains, but only for failures that genuinely mean "we could not
 * get this data": the server being unreachable, asleep, or throwing. The
 * permission and server-error cases it used to cover have been fixed.
 */

const DEFAULT_PAGE_SIZE = 10;

/** The backend rejects any page size above 100. Clamp rather than fail. */
const MAX_PAGE_SIZE = 100;
const pageSize = (requested: number) => Math.min(requested, MAX_PAGE_SIZE);

/**
 * Statuses that mean the data could not be fetched, as opposed to the request
 * being wrong. Showing an empty table for these would tell an admin their
 * estate has no residents, which is a worse lie than an error message.
 */
const UNAVAILABLE_STATUSES = [500, 502, 503, 504];

export interface Tolerated<T> {
  value: T;
  unavailable: boolean;
  reason?: string;
}

async function tolerate<T>(
  work: () => Promise<T>,
  fallback: T,
  statuses: number[] = UNAVAILABLE_STATUSES,
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

/** What every list screen passes in. */
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const emptyPage = <T>(limit: number): Page<T> => ({
  data: [],
  total: 0,
  page: 1,
  limit,
});

/** Blank searches are omitted entirely rather than sent as `search=`. */
const listSearchParams = (p: ListParams) => ({
  page: p.page ?? 1,
  limit: pageSize(p.limit ?? DEFAULT_PAGE_SIZE),
  search: p.search?.trim() ? p.search.trim() : undefined,
});

/* --- Estate ------------------------------------------------------------- */

export const getEstateProfile = () =>
  apiRequest("/estates/profile", { schema: envelope(estateSchema) }).then(
    (r) => r.data,
  );

/**
 * Self-service estate update, added to the API in the latest round.
 *
 * Previously the only way to change an estate was PATCH /estates/{id}, which
 * is restricted to super admins — so the Settings switches could be read and
 * not written, and reverted whenever anyone tried. This endpoint is scoped to
 * the caller's own estate and is confirmed working: setting entranceCount to
 * 2 returned 200, and reading the profile back showed 2.
 */
export const updateEstateProfile = (input: {
  estateName?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  accessCodeEnabled?: boolean;
  paymentCollectionEnabled?: boolean;
  entranceCount?: number;
}) =>
  apiRequest("/estates/profile", {
    method: "PATCH",
    body: input,
    schema: envelope(estateSchema),
  }).then((r) => r.data);

/* --- Residents ---------------------------------------------------------- */

type AdminResident = Awaited<ReturnType<typeof createResident>>;

export const listResidents = (params: ListParams = {}) =>
  tolerate<Page<AdminResident>>(
    () =>
      apiRequest("/residents/estate", {
        searchParams: listSearchParams(params),
        schema: paginatedEnvelope(adminResidentSchema),
      }).then((r) => r.data as Page<AdminResident>),
    emptyPage(params.limit ?? DEFAULT_PAGE_SIZE),
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

type SecurityPersonnel = Awaited<ReturnType<typeof createSecurity>>;

export const listSecurity = (params: ListParams = {}) =>
  tolerate<Page<SecurityPersonnel>>(
    () =>
      apiRequest("/securities/estate", {
        searchParams: listSearchParams(params),
        schema: paginatedEnvelope(securitySchema),
      }).then((r) => r.data as Page<SecurityPersonnel>),
    emptyPage(params.limit ?? DEFAULT_PAGE_SIZE),
  );

export const createSecurity = (input: CreateSecurityInput) =>
  apiRequest("/securities", {
    method: "POST",
    // An empty email string is rejected, so omit the key rather than send "".
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
    [] as Awaited<ReturnType<typeof createDue>>[],
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

type AdminTransaction = Awaited<ReturnType<typeof getOneTransaction>>;
const getOneTransaction = () =>
  apiRequest("/transactions/estate", {
    searchParams: { page: 1, limit: 1 },
    schema: paginatedEnvelope(adminTransactionSchema),
  }).then((r) => r.data.data[0]);

export const listEstateTransactions = (params: ListParams = {}) =>
  tolerate<Page<AdminTransaction>>(
    () =>
      apiRequest("/transactions/estate", {
        searchParams: listSearchParams(params),
        schema: paginatedEnvelope(adminTransactionSchema),
      }).then((r) => r.data as Page<AdminTransaction>),
    emptyPage(params.limit ?? DEFAULT_PAGE_SIZE),
  );

/* --- Plans and subscriptions -------------------------------------------- */

export const listPlans = () =>
  tolerate(
    () =>
      apiRequest("/plans", {
        searchParams: { page: 1, limit: 20 },
        schema: paginatedEnvelope(planSchema),
      }).then((r) => r.data.data),
    [] as Awaited<ReturnType<typeof listPlansRaw>>,
  );

const listPlansRaw = () =>
  apiRequest("/plans", {
    searchParams: { page: 1, limit: 1 },
    schema: paginatedEnvelope(planSchema),
  }).then((r) => r.data.data);

export const listEstateSubscriptions = () =>
  tolerate(
    () =>
      apiRequest<never>("/subscriptions/estate", {
        searchParams: { page: 1, limit: 10 },
      }) as Promise<Record<string, unknown>>,
    {} as Record<string, unknown>,
    [...UNAVAILABLE_STATUSES, 404],
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

/* --- Password ----------------------------------------------------------- */

export const changePassword = (input: {
  oldPassword: string;
  newPassword: string;
}) =>
  apiRequest<never>("/auth/change-password", {
    method: "PATCH",
    body: input,
  }) as Promise<Record<string, unknown>>;
