import { z } from "zod";

/**
 * The API client used by components in the browser.
 *
 * It never mentions the LockSec backend URL and never touches a token. It
 * calls /api/proxy/... on our own Next.js server, which attaches the token
 * from the httpOnly cookie and forwards the request.
 *
 * This is the BFF pattern — Backend For Frontend. Three things it buys:
 * tokens stay out of JavaScript's reach, token refresh happens in one place,
 * and the backend URL is not exposed to the browser.
 */

/** Zod's flattened field errors, as this backend returns them on a 400. */
export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    /**
     * Per-field messages, when the backend supplies them. A form can map
     * these onto its inputs so the error appears beside the offending field
     * instead of in a banner that does not say what to change.
     */
    public fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  /** The auth endpoints allow 5 attempts per window before rejecting. */
  get isRateLimited() {
    return this.status === 429;
  }

  /**
   * A single readable sentence, preferring the specific field message over
   * the generic "Validation failed".
   *
   * Also translates raw database errors. The backend passes MongoDB
   * exceptions straight through — a duplicate email arrives as
   *
   *   E11000 duplicate key error collection: LockSec-Prod-DB.users
   *   index: email_1 dup key: { email: "someone@example.com" }
   *
   * That is meaningless to an estate manager and leaks the database name,
   * the collection, the index and someone's email address. Translating it
   * here covers every form at once.
   */
  get detail(): string {
    const raw = this.message ?? "";

    if (raw.includes("E11000") || raw.includes("duplicate key")) {
      const field = /index:\s*(\w+?)_/.exec(raw)?.[1];
      return field
        ? `That ${field.replace(/([A-Z])/g, " $1").toLowerCase()} is already in use on another account.`
        : "Those details are already in use on another account.";
    }

    const first = this.fieldErrors
      ? Object.entries(this.fieldErrors)[0]
      : undefined;


    if (first) {
      const [field, messages] = first;
      const label = field
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
      return `${label}: ${messages[0]}`;
    }

    return this.message;
  }
}

/**
 * Dig the field errors out of whatever shape the backend used.
 *
 * This API has produced several. Checking each known location is less
 * fragile than assuming one, and returns undefined rather than throwing when
 * none matches.
 */
export function extractFieldErrors(body: unknown): FieldErrors | undefined {
  if (!body || typeof body !== "object") return undefined;

  const candidates = [
    (body as any)?.errors?.body?.fieldErrors,
    (body as any)?.errors?.fieldErrors,
    (body as any)?.errors,
    (body as any)?.fieldErrors,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      const entries = Object.entries(candidate).filter(
        ([, value]) => Array.isArray(value) && value.length > 0,
      );
      if (entries.length > 0) {
        return Object.fromEntries(entries) as FieldErrors;
      }
    }
  }

  return undefined;
}

interface RequestOptions<T extends z.ZodType> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Validate the response against this schema before returning it. */
  schema?: T;
  searchParams?: Record<string, string | number | undefined>;
}

export async function apiRequest<T extends z.ZodType = z.ZodType>(
  path: string,
  options: RequestOptions<T> = {},
): Promise<z.infer<T>> {
  const { method = "GET", body, schema, searchParams } = options;

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined) query.set(key, String(value));
  }
  const qs = query.toString();

  const response = await fetch(`/api/proxy${path}${qs ? `?${qs}` : ""}`, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      parsed &&
      typeof parsed === "object" &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : "Something went wrong";

    // Log the whole body in development. When a backend rejects a request
    // for a reason it does not name, this is the fastest route to the answer.
    //
    // console.warn, NOT console.error. Next.js 16 intercepts console.error
    // and raises its full-screen error overlay, which made every handled 403
    // look like a crash. A logged diagnostic is not a crash — the code below
    // throws an ApiError that callers catch and turn into a message.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[api] ${method} ${path} failed`, response.status, parsed);
    }

    throw new ApiError(message, response.status, extractFieldErrors(parsed));
  }

  if (!schema) return parsed as z.infer<T>;

  const result = schema.safeParse(parsed);
  if (!result.success) {
    console.warn(`Response from ${path} did not match schema`, result.error);
    throw new ApiError(
      "The server returned unexpected data. Please try again.",
      500,
    );
  }

  return result.data;
}
