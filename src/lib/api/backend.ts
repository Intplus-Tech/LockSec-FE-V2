import { env } from "@/lib/env";

/**
 * Server-side calls to the LockSec backend.
 *
 * Only route handlers and server components import this. The browser never
 * talks to the backend directly — it goes through our own /api routes, which
 * hold the tokens. See the proxy route for why.
 */

export interface BackendResult<T = unknown> {
  ok: boolean;
  status: number;
  body: T;
}

export class BackendError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

interface CallOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  /** Forwarded query string, e.g. "page=2&limit=10". */
  search?: string;
}

export async function callBackend<T = unknown>(
  path: string,
  options: CallOptions = {},
): Promise<BackendResult<T>> {
  const { method = "GET", body, token, search } = options;

  const url = `${env.backendUrl}${path}${search ? `?${search}` : ""}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Never cache API calls. Next.js caches fetch aggressively by default,
      // and a cached list of visitors at a security gate would be dangerous.
      cache: "no-store",
    });
  } catch {
    // The backend is on Render's free tier, which sleeps after inactivity
    // and can take 30-60 seconds to wake. A network-level failure here is
    // usually that, not a bug in your code.
    throw new BackendError(
      "Could not reach the server. It may be waking up — try again in a moment.",
      503,
    );
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text };
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    body: parsed as T,
  };
}

/**
 * Pull a human-readable message out of an error body.
 * This backend returns plain { message: "..." } on failure.
 */
export function messageFrom(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof (body as { message: unknown }).message === "string"
  ) {
    return (body as { message: string }).message;
  }
  return fallback;
}
