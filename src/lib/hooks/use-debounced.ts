"use client";

import { useEffect, useState } from "react";

/**
 * Delays a changing value until the user stops changing it.
 *
 * Search boxes now hit the server, and firing a request per keystroke would
 * send eight requests for "Adeola" — each one a round trip to a backend that
 * can take a second to answer, with the replies arriving out of order. The
 * last reply to arrive wins, which is not necessarily the last one asked for.
 *
 * Waiting 400ms after the final keystroke sends one request for the thing the
 * user actually typed. Short enough to feel instant, long enough to cover
 * normal typing.
 */
export function useDebounced<T>(value: T, delay = 400): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
