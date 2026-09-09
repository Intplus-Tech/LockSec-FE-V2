import { apiRequest } from "@/lib/api/client";
import { envelope } from "@/lib/schemas/auth";
import { validatedCodeSchema } from "@/lib/schemas/security";

/**
 * Check a code at the gate.
 *
 * Note this is a POST that mutates: the backend tracks `amountUsed`, so
 * calling it twice counts as two entries. That is why the result screen keeps
 * its data in memory rather than re-fetching from a URL — a refresh would
 * otherwise silently record a second entry for a visitor who arrived once.
 */
export const validateAccessCode = (code: string) =>
  apiRequest("/access-codes/validate", {
    method: "POST",
    body: { code },
    schema: envelope(validatedCodeSchema),
  }).then((r) => r.data);

export const getSecurityProfile = () =>
  apiRequest<never>("/securities/profile") as Promise<Record<string, unknown>>;
