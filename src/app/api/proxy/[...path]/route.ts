import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendError, callBackend } from "@/lib/api/backend";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth/cookies";

/**
 * The single door between the browser and the LockSec backend.
 *
 * A request to /api/proxy/access-codes becomes a request to
 * <backend>/access-codes with the Authorization header filled in from the
 * httpOnly cookie. Everything authenticated goes through here, which means
 * token refresh is implemented once instead of in every hook.
 *
 * WHAT CHANGED AND WHY IT MATTERS:
 *
 * This used to rebuild failed responses as `{ message }`, throwing away
 * everything else the backend sent. That looked tidy and cost real debugging
 * time — the backend returns Zod's flattened errors on a 400:
 *
 *   {
 *     "message": "Validation failed",
 *     "errors": { "body": { "fieldErrors": { "numOfPeople": ["..."] } } }
 *   }
 *
 * ...and we were discarding the only part that says WHICH field is wrong,
 * leaving a useless "Validation failed" banner.
 *
 * Now the body passes through untouched. The rule generalises: a proxy should
 * forward, not editorialise. Translate messages for the user at the point of
 * display, where you know the context, not in the pipe where you do not.
 */

type Params = { params: Promise<{ path: string[] }> };

async function handle(request: Request, { params }: Params) {
  const { path } = await params;
  const backendPath = `/${path.join("/")}`;
  const search = new URL(request.url).searchParams.toString();

  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Not signed in" }, { status: 401 });
  }

  const method = request.method as "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

  let body: unknown;
  if (method !== "GET" && method !== "DELETE") {
    body = await request.json().catch(() => undefined);
  }

  let result;
  try {
    result = await callBackend(backendPath, { method, body, token, search });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { message: "Could not reach the server. Try again in a moment." },
      { status: 503 },
    );
  }

  // Access token expired — refresh once, then replay the original request.
  if (result.status === 401 && refreshToken) {
    let refreshed;
    try {
      refreshed = await callBackend<Record<string, unknown>>(
        "/auth/refresh-token",
        { method: "POST", body: { refreshToken } },
      );
    } catch {
      refreshed = null;
    }

    if (refreshed?.ok) {
      // The spec documents this endpoint as returning only { refreshToken },
      // which cannot be right — you would have nothing to authenticate with.
      // So look in every plausible place for a new access token.
      const rb = refreshed.body as {
        data?: { token?: string; accessToken?: string; refreshToken?: string };
        token?: string;
        accessToken?: string;
        refreshToken?: string;
      };

      const newToken =
        rb.data?.token ?? rb.data?.accessToken ?? rb.token ?? rb.accessToken;
      const newRefresh = rb.data?.refreshToken ?? rb.refreshToken;

      if (newToken) {
        try {
          result = await callBackend(backendPath, {
            method,
            body,
            token: newToken,
            search,
          });
        } catch {
          return NextResponse.json(
            { message: "Could not reach the server. Try again in a moment." },
            { status: 503 },
          );
        }

        const response = NextResponse.json(result.body, {
          status: result.status,
        });
        setAuthCookies(response, {
          token: newToken,
          refreshToken: newRefresh ?? refreshToken,
        });
        return response;
      }
    }

    // Refresh failed — the session is genuinely over.
    const response = NextResponse.json(
      { message: "Your session has expired. Please sign in again." },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  // Pass the backend's response through verbatim, success or failure.
  return NextResponse.json(result.body, { status: result.status });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
