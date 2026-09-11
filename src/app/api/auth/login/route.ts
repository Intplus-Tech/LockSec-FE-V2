import { NextResponse } from "next/server";
import { BackendError, callBackend, messageFrom } from "@/lib/api/backend";
import { setAuthCookies } from "@/lib/auth/cookies";
import { decodeToken } from "@/lib/auth/jwt";
import { homeFor } from "@/lib/auth/roles";
import {
  loginSchema,
  loginResponseSchema,
  roleSchema,
} from "@/lib/schemas/auth";

/**
 * Sign in, and put the tokens in httpOnly cookies.
 *
 * WHAT CHANGED. The API now returns `role` and `estateId` in the response
 * body. Previously they existed only inside the JWT, so this handler had to
 * decode the token to find out who had just signed in — and a wrong guess at
 * the role string (`admin` instead of `estate_admin`) once produced an
 * infinite redirect loop that presented as a network error.
 *
 * So: prefer the body, fall back to the token.
 *
 * The fallback is not redundancy for its own sake. A deployed API can lag its
 * own documentation — we have seen exactly that on this project — and a login
 * that fails because one newly-documented field is missing would be a bad
 * trade for slightly tidier code. When the body has it, we use it; when it
 * does not, the old path still works.
 */
export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await callBackend("/auth/login", {
      method: "POST",
      body: parsed.data,
    });
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

  if (!result.ok) {
    return NextResponse.json(
      {
        message:
          result.status === 401
            ? "That email and password don't match."
            : messageFrom(result.body, "Sign in failed"),
      },
      { status: result.status },
    );
  }

  const validated = loginResponseSchema.safeParse(result.body);
  if (!validated.success) {
    console.error("Login response did not match schema", validated.error);
    return NextResponse.json(
      { message: "Unexpected response from the server" },
      { status: 502 },
    );
  }

  const { user, token, refreshToken } = validated.data.data;

  // The body first, the token as a fallback.
  const claims = decodeToken(token);
  const rawRole = user.role ?? claims?.role;
  const estateId = user.estateId ?? claims?.estateId;

  /**
   * Narrow the arbitrary string to a role we recognise.
   *
   * Casting would compile and be wrong. `homeFor()` maps a role to a home
   * screen, and an unrecognised value would return undefined — which is
   * exactly what produced the infinite redirect loop when the docs said
   * `admin` and the server said `estate_admin`. The proxy would bounce the
   * user to a route that bounced them back.
   *
   * So an unknown role is an explicit, visible failure with a log line
   * naming the value, rather than a redirect loop nobody can diagnose.
   */
  const parsedRole = roleSchema.safeParse(rawRole);

  if (!parsedRole.success) {
    console.error(
      `Unrecognised role from the API: ${JSON.stringify(rawRole)}. ` +
        `Add it to roleSchema in lib/schemas/auth.ts if it is legitimate.`,
    );
    return NextResponse.json(
      { message: "Could not determine your account type" },
      { status: 502 },
    );
  }

  const role = parsedRole.data;

  const response = NextResponse.json({
    user: {
      id: user._id,
      email: user.email ?? claims?.email,
      role,
      estateId,
    },
    redirectTo: homeFor(role),
  });

  setAuthCookies(response, { token, refreshToken });
  return response;
}
