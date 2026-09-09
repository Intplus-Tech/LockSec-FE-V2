"use client";

import { useQuery } from "@tanstack/react-query";
import { getSession } from "@/lib/api/endpoints/auth";

/**
 * Who is signed in, for client components.
 *
 * The tokens are httpOnly, so the browser cannot read them. This asks our own
 * /api/auth/session route, which decodes the cookie server-side and returns
 * only the identity — never the token.
 */
export function useSession() {
  const query = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    staleTime: 5 * 60_000,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isSignedIn: Boolean(query.data),
  };
}
