"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * TanStack Query handles server state: fetching, caching, refetching,
 * loading and error flags. Without it you end up hand-rolling useEffect +
 * useState in every component and quietly getting the edge cases wrong.
 *
 * The client is created inside useState rather than at module scope so that
 * each browser session gets its own cache. At module scope on the server,
 * one user's cached data could be served to the next request.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for a minute. Stops a refetch storm
            // when someone tabs back and forth between screens.
            staleTime: 60_000,
            // Do not hammer a sleeping Render instance with retries.
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
