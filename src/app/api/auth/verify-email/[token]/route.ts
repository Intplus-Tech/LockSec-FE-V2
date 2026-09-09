import { NextResponse } from "next/server";
import { callBackend, messageFrom } from "@/lib/api/backend";

/**
 * The backend puts the verification token in the URL path rather than a
 * body, and uses GET rather than POST, so it does not fit the generic public
 * pass-through and gets its own handler.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const result = await callBackend(
    `/auth/verify-email/${encodeURIComponent(token)}`,
  );

  if (!result.ok) {
    return NextResponse.json(
      { message: messageFrom(result.body, "That code did not work.") },
      { status: result.status },
    );
  }

  return NextResponse.json(result.body);
}
