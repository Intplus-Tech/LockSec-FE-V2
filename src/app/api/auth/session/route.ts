import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { decodeToken, isExpired } from "@/lib/auth/jwt";

/**
 * Tells the browser who it is currently logged in as.
 *
 * Because the tokens are httpOnly, client components cannot inspect them.
 * They ask here instead. The response deliberately contains no tokens —
 * just identity, which is all the UI needs to render a name or hide a menu.
 */
export async function GET() {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const claims = decodeToken(token);
  if (!claims || isExpired(claims)) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: claims.userId,
      email: claims.email,
      role: claims.role,
      estateId: claims.estateId,
    },
  });
}
