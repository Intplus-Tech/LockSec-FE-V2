import { z } from "zod";
import { refAddress, refName, refSchema, type Ref } from "@/lib/schemas/ref";

/**
 * Confirmed against a live call, not the spec — the spec was wrong about the
 * login endpoint, documenting it as returning a profile with no tokens.
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
 * visitor waiting must not see an error screen because one nullable field
 * was missing — better to render a dash and let them through.
 *
 * A field that the UI reads must still be DECLARED here, though, even if it
 * is optional. `isAccessCodeEnabled` was missing and the gate screen reads it
 * to decide whether a code has been switched off, which failed the build.
 * The schema is the contract between the API and the UI; a field the UI uses
 * and the schema does not mention is a hole in that contract.
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
  /** Whether an admin has switched this code off, independent of expiry. */
  isAccessCodeEnabled: z.boolean().nullish(),
  amountUsed: z.number().nullish(),
  codeExpiresAt: z.string().nullish(),
  estateId: refSchema.nullish(),
  /**
   * The resident who created the code.
   *
   * The API currently returns only an id, so the "For: Mr. Adebayo — Apt 12B
   * Road M" block in the Figma cannot be filled in. This accepts a populated
   * object too, so it starts working the moment the backend populates it,
   * with no frontend change. See backend issue 18.
   */
  userId: refSchema.nullish(),
});

export type ValidatedCode = z.infer<typeof validatedCodeSchema>;

/** Resident name and address, when the reference has been populated. */
export function residentFrom(userId: Ref | null | undefined) {
  const name = refName(userId);
  const address = refAddress(userId);
  if (!name && !address) return null;
  return { name, address };
}
