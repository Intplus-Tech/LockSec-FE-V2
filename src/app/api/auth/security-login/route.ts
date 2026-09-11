import { NextResponse } from "next/server";
import { z } from "zod";
import { BackendError, callBackend, messageFrom } from "@/lib/api/backend";
import { setAuthCookies } from "@/lib/auth/cookies";
import { decodeToken } from "@/lib/auth/jwt";
import { homeFor } from "@/lib/auth/roles";
import { roleSchema, securityLoginSchema } from "@/lib/schemas/auth";

/**
 * Security staff sign in with a numeric code — no email, no password.
 *
 * The response shape is confirmed by a real call and now matches the updated
 * documentation, which also adds `role` and `estateId` to the security
 * object. Same approach as /auth/login: prefer the body, fall back to the
 * token.
 *
 * Worth noting the original spec documented this endpoint as returning a
 * profile with no tokens at all, which could not have been true of a login
 * endpoint. It is correct now.
 */
const securityLoginResponseSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    security: z.object({
      _id: z.string(),
      securityCode: z.string().optional(),
      role: z.string().optional(),
      estateId: z.string().nullish(),
    }),
    token: z.string(),
    refreshToken: z.string().optional(),
  }),
});

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

  const { security, token, refreshToken } = validated.data.data;

  const claims = decodeToken(token);
  const rawRole = security.role ?? claims?.role ?? "security";

  /**
   * Same narrowing as /auth/login. This endpoint only ever issues security
   * accounts, so "security" is a sound default — but the value still has to
   * be a role we recognise before it reaches homeFor(), or an unexpected
   * string becomes a redirect loop rather than an error.
   */
  const parsedRole = roleSchema.safeParse(rawRole);
  const role = parsedRole.success ? parsedRole.data : "security";

  if (!parsedRole.success) {
    console.warn(
      `Unrecognised role on security login: ${JSON.stringify(rawRole)}. ` +
        `Falling back to "security".`,
    );
  }

  const response = NextResponse.json({
    user: {
      id: security._id,
      email: claims?.email,
      role,
      estateId: security.estateId ?? claims?.estateId,
    },
    redirectTo: homeFor(role),
  });

  setAuthCookies(response, { token, refreshToken });
  return response;
}
