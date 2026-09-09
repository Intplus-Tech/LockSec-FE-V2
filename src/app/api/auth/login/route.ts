import { NextResponse } from "next/server";
import { callBackend, messageFrom } from "@/lib/api/backend";
import { setAuthCookies } from "@/lib/auth/cookies";
import { decodeToken } from "@/lib/auth/jwt";
import { homeFor } from "@/lib/auth/roles";
import { loginResponseSchema, loginSchema } from "@/lib/schemas/auth";

/**
 * Login for residents, business owners and admins.
 *
 * The browser posts here rather than to the backend directly, so that the
 * tokens land in httpOnly cookies that JavaScript cannot read.
 *
 * We return the role and a redirect target, but never the tokens.
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

  const result = await callBackend("/auth/login", {
    method: "POST",
    body: parsed.data,
  });

  if (!result.ok) {
    // Pass the backend's own wording through — it distinguishes bad
    // credentials from rate limiting, and the user deserves to know which.
    return NextResponse.json(
      { message: messageFrom(result.body, "Login failed") },
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

  const { token, refreshToken, user } = validated.data.data;

  // The role is not in the response body — only in the token.
  const claims = decodeToken(token);
  if (!claims) {
    return NextResponse.json(
      { message: "Could not read the session token" },
      { status: 502 },
    );
  }

  const response = NextResponse.json({
    user: {
      id: user._id,
      email: user.email,
      role: claims.role,
      estateId: claims.estateId,
    },
    redirectTo: homeFor(claims.role),
  });

  setAuthCookies(response, { token, refreshToken });
  return response;
}
