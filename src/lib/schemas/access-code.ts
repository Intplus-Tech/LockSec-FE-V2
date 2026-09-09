import { z } from "zod";
import { looksLikePlate, normalisePlate } from "@/lib/plate";

/**
 * The access-code form schema.
 *
 * An HTML <select> can only produce strings, so `withVehicle` is
 * "true" | "false" here and converts to a boolean on the way out. A schema
 * must describe what the form element actually produces, not what the API
 * wants — an earlier version declared it as z.boolean() and the resolver
 * rejected every submission before the conversion could run.
 */

export const VISITOR_TYPES = [
  { value: "guest", label: "Guest" },
  { value: "dispatch", label: "Dispatch" },
  { value: "cab", label: "Cab" },
  { value: "artisan", label: "Artisan" },
] as const;

/**
 * WORKAROUND — remove this when the backend is fixed.
 *
 * The backend requires `plateNum` on every access code, including ones where
 * `withVehicle` is false. Its own spec says the opposite ("required if
 * withVehicle is true"), and the error it returns is
 *
 *     fieldErrors: { plateNum: ["Bank name is required"] }
 *
 * — a message copy-pasted from the dues validator, which is how we know this
 * is a mistake in their code rather than a deliberate rule.
 *
 * So we send this placeholder when there is no vehicle. Nothing displays it:
 * every screen that shows a plate keys off the `withVehicle` boolean instead,
 * so a visitor arriving on foot shows "-" as the design intends.
 *
 * When the backend is fixed, delete this constant and send `undefined`.
 */
export const NO_VEHICLE_PLATE = "NO VEHICLE";

export const createAccessCodeFormSchema = z
  .object({
    visitorType: z.enum(["guest", "dispatch", "cab", "artisan"]),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    numOfPeople: z.coerce
      .number()
      .int("Enter a whole number")
      .min(1, "At least one person")
      .max(50, "That seems too many — check with your estate office"),
    phoneNumber: z
      .string()
      .min(7, "Enter a valid phone number")
      .max(20, "Enter a valid phone number"),
    withVehicle: z.enum(["true", "false"]),
    plateNum: z.string().optional(),
  })
  .refine(
    (data) => data.withVehicle !== "true" || Boolean(data.plateNum?.trim()),
    {
      error: "Plate number is required when a vehicle is coming",
      path: ["plateNum"],
    },
  )
  // The backend rejects malformed plates without documenting the rule.
  // Catching it here puts the error on the field immediately, rather than as
  // a 400 several seconds later.
  .refine(
    (data) =>
      data.withVehicle !== "true" ||
      !data.plateNum ||
      looksLikePlate(data.plateNum),
    {
      error: "Enter a valid plate number, for example IKJ 827 QX",
      path: ["plateNum"],
    },
  );

export type CreateAccessCodeForm = z.infer<typeof createAccessCodeFormSchema>;

export interface CreateAccessCodeInput {
  visitorType: string;
  firstName: string;
  lastName: string;
  numOfPeople: number;
  phoneNumber: string;
  withVehicle: boolean;
  plateNum: string;
}

/** One place that turns form values into an API payload. */
export function toAccessCodePayload(
  form: CreateAccessCodeForm,
): CreateAccessCodeInput {
  const withVehicle = form.withVehicle === "true";

  return {
    visitorType: form.visitorType,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    numOfPeople: form.numOfPeople,
    phoneNumber: form.phoneNumber.trim(),
    withVehicle,
    plateNum:
      withVehicle && form.plateNum
        ? normalisePlate(form.plateNum)
        : NO_VEHICLE_PLATE,
  };
}

/**
 * What to display in a "Plate No." row.
 *
 * Keys off `withVehicle` rather than the stored string, so the placeholder
 * above never reaches a screen — and so an old record with a stale plate on a
 * no-vehicle visit still displays correctly.
 */
export function displayPlate(code: {
  withVehicle?: boolean | null;
  plateNum?: string | null;
}): string {
  if (!code.withVehicle) return "-";
  if (!code.plateNum || code.plateNum === NO_VEHICLE_PLATE) return "-";
  return code.plateNum;
}
