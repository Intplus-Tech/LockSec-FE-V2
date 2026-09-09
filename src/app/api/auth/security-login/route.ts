import { NextResponse } from "next/server";
import { BackendError, callBackend, messageFrom } from "@/lib/api/backend";
import { setAuthCookies } from "@/lib/auth/cookies";
import { decodeToken } from "@/lib/auth/jwt";
import { homeFor } from "@/lib/auth/roles";
import { securityLoginSchema } from "@/lib/schemas/auth";
import { securityLoginResponseSchema } from "@/lib/schemas/security";

/**
 * Security staff sign in with a numeric code — no email, no password.
 *
 * This handler used to guess at the response shape. It no longer needs to:
 * a real call confirmed it, and the schema now matches exactly.
 *
 *   {
 *     "message": "Login successful",
 *     "data": {
 *       "security": { "_id": "...", "securityCode": "239097" },
 *       "token": "...",
 *       "refreshToken": "..."
 *     }
 *   }
 *
 * Note this is the same envelope as /auth/login, with `security` where the
 * other has `user`. The spec documented it as returning a bare profile with
 * no tokens at all, which was wrong.
 *
 * The decoded token carries role "security" and, unlike the resident and
 * admin tokens, NO estateId. Nothing here depends on that, but it is worth
 * knowing when scoping data later.
 */
export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);

  const parsed = securityLoginSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await callBackend("/securities/login", {
      method: "POST",
      body: parsed.data,
    });
  } catch (error) {
    // The backend sleeps on Render's free tier. Turn a network failure into
    // a readable message rather than letting it become an unhandled 500.
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
            ? "That ID was not recognised. Check with your estate office."
            : messageFrom(result.body, "Login failed"),
      },
      { status: result.status },
    );
  }

  const validated = securityLoginResponseSchema.safeParse(result.body);
  if (!validated.success) {
    console.error("Security login response did not match schema", validated.error);
    return NextResponse.json(
      { message: "Unexpected response from the server" },
      { status: 502 },
    );
  }

  const { token, refreshToken, security } = validated.data.data;

  const claims = decodeToken(token);
  if (!claims) {
    return NextResponse.json(
      { message: "Could not read the session token" },
      { status: 502 },
    );
  }

  const response = NextResponse.json({
    user: {
      id: security._id,
      email: claims.email,
      role: claims.role,
    },
    redirectTo: homeFor(claims.role),
  });

  setAuthCookies(response, { token, refreshToken });
  return response;
}
