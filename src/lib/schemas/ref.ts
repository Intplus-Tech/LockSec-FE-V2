import { z } from "zod";

/**
 * A Mongo reference that may or may not be populated.
 *
 * This backend is inconsistent about it. `GET /residents/estate` returns
 * `estateId` as a full object; other endpoints return the same field as a
 * bare id string. A schema that insists on one shape rejects the response
 * whenever the backend sends the other, and the whole screen goes blank over
 * a field nothing was even displaying.
 *
 * So every reference field uses this. Accept both, and normalise with
 * `refId()` wherever an id is actually needed.
 *
 * The general lesson: be strict about the fields you render, and permissive
 * about the shape of everything else. A response schema exists to catch
 * changes that would break your UI, not to police the server's style.
 */
export const refSchema = z.union([
  z.string(),
  z
    .object({
      _id: z.string().optional(),
      firstName: z.string().nullish(),
      lastName: z.string().nullish(),
      email: z.string().nullish(),
      address: z.string().nullish(),
      estateName: z.string().nullish(),
    })
    .loose(),
]);

export type Ref = z.infer<typeof refSchema>;

/** The id, whichever shape came back. */
export function refId(value: Ref | null | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value._id;
}

/** A display name from a populated ref, or null when it is just an id. */
export function refName(value: Ref | null | undefined): string | null {
  if (!value || typeof value === "string") return null;
  const name = [value.firstName, value.lastName].filter(Boolean).join(" ");
  return name || value.estateName || null;
}

/** An address from a populated ref, or null. */
export function refAddress(value: Ref | null | undefined): string | null {
  if (!value || typeof value === "string") return null;
  return value.address ?? null;
}
