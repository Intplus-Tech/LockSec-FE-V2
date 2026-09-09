import { NextResponse } from "next/server";
import { BackendError, callBackend, messageFrom } from "@/lib/api/backend";

/**
 * Pass-through for endpoints that need no authentication: registration,
 * email verification, forgot/reset password.
 *
 * Why route these through our server at all, rather than letting the browser
 * call the backend directly?
 *
 *   - The backend URL stays server-side, so it is not in the JS bundle.
 *   - No CORS negotiation from the browser.
 *   - One place to add logging or rate limiting later.
 *
 * The allowlist below matters. Without it this would forward ANY path to the
 * backend without a token, which would let someone bypass authentication for
 * endpoints that merely happen to be lenient. Explicitly listing the public
 * endpoints means adding a new one is a deliberate act.
 */
const ALLOWED = new Set([
  "auth/register-estate",
  "auth/register-resident",
  "auth/forgot-password",
  "auth/reset-password",
  "auth/resend-verification-email",
  "auth/resend-forgot-password-email",
]);

/**
 * The backend's messages are written for developers reading a Swagger page,
 * not for someone stuck on a signup form. Where a status code has one
 * unambiguous meaning, say the useful thing instead.
 *
 * Anything not listed here falls through to the backend's own wording, which
 * is usually fine and is always better than a generic "something went wrong"
 * that hides real information.
 */
function friendlyMessage(status: number, fallback: string): string | null {
  switch (status) {
    case 409:
      return "An account with that email already exists. Try signing in instead.";
    case 429:
      return "Too many attempts. Wait a few minutes and try again.";
    case 502:
    case 503:
    case 504:
      return "The server is not responding. Try again in a moment.";
    default:
      return fallback;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const joined = path.join("/");

  if (!ALLOWED.has(joined)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => undefined);

  let result;
  try {
    result = await callBackend(`/${joined}`, { method: "POST", body });
  } catch (error) {
    // callBackend throws BackendError when the network itself fails — most
    // often Render's free tier waking from sleep, which takes 30-60 seconds.
    //
    // Catching it here matters. Without this, the throw escapes the route
    // handler, Next.js turns it into an unhandled 500, and the user sees a
    // stack trace instead of a sentence telling them to try again.
    if (error instanceof BackendError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.error(`Unexpected error calling /${joined}`, error);
    return NextResponse.json(
      { message: "Could not reach the server. Try again in a moment." },
      { status: 503 },
    );
  }

  if (!result.ok) {
    const backendMessage = messageFrom(result.body, "Request failed");

    return NextResponse.json(
      { message: friendlyMessage(result.status, backendMessage) },
      { status: result.status },
    );
  }

  return NextResponse.json(result.body, { status: result.status });
}
