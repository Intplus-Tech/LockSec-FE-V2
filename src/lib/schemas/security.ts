import { z } from "zod";

/**
 * Confirmed against a live call, not the spec — the spec was wrong about this
 * endpoint, documenting it as returning a profile with no tokens.
 */
export const securityLoginResponseSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    security: z.object({
      _id: z.string(),
      securityCode: z.string().optional(),
    }),
    token: z.string(),
    refreshToken: z.string().optional(),
  }),
});

/**
 * What POST /access-codes/validate returns on success.
 *
 * Forgiving about optional fields on purpose. A guard at a gate with a
 * visitor waiting must not be shown an error screen because one nullable
 * field was missing — better to render a dash and let them through.
 */
export const validatedCodeSchema = z.object({
  _id: z.string(),
  code: z.string().optional(),
  visitorType: z.string().nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  numOfPeople: z.number().nullish(),
  phoneNumber: z.string().nullish(),
  withVehicle: z.boolean().nullish(),
  plateNum: z.string().nullish(),
  status: z.string().nullish(),
  amountUsed: z.number().nullish(),
  codeExpiresAt: z.string().nullish(),
  /**
   * The resident who created the code. The API returns only an id, so the
   * "For: Mr. Adebayo — Apt 12B Road M" block in the Figma cannot be filled
   * in yet. Kept here so it starts working the moment the backend populates
   * it, without a frontend change.
   */
  userId: z.union([
    z.string(),
    z.object({
      _id: z.string().optional(),
      firstName: z.string().nullish(),
      lastName: z.string().nullish(),
      address: z.string().nullish(),
    }),
  ]).nullish(),
});

export type ValidatedCode = z.infer<typeof validatedCodeSchema>;

/** Pulls resident details out of userId whether it is an id or an object. */
export function residentFrom(userId: ValidatedCode["userId"]) {
  if (!userId || typeof userId === "string") return null;
  const name = [userId.firstName, userId.lastName].filter(Boolean).join(" ");
  if (!name && !userId.address) return null;
  return { name: name || null, address: userId.address ?? null };
}
