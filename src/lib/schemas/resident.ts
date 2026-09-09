import { z } from "zod";
import { refSchema } from "@/lib/schemas/ref";

/**
 * Schemas for the resident app's data.
 *
 * Every response schema below is deliberately forgiving about fields the
 * backend might omit — `.nullish()` and `.optional()` appear a lot. That is
 * not laziness. This API's documentation has already proven unreliable, and a
 * schema that rejects a response because one optional field is missing turns
 * a cosmetic gap into a blank screen.
 *
 * The rule: be strict about the fields you actually render, forgiving about
 * everything else.
 */

/* -------------------------------------------------------------------------
   Access codes
   ------------------------------------------------------------------------- */


/**
 * The access-code FORM schema lives in lib/schemas/access-code.ts, not here.
 * It moved when the plate-number rules were added, and the copy that used to
 * sit at this spot was dead code.
 */

export const accessCodeSchema = z.object({
  _id: z.string(),
  code: z.string(),
  codeExpiresAt: z.string().nullish(),
  visitorType: z.string(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  numOfPeople: z.number().nullish(),
  phoneNumber: z.string().nullish(),
  withVehicle: z.boolean().nullish(),
  plateNum: z.string().nullish(),
  status: z.string().nullish(),
  isAccessCodeEnabled: z.boolean().nullish(),
  amountUsed: z.number().nullish(),
  createdAt: z.string().nullish(),
});

export type AccessCode = z.infer<typeof accessCodeSchema>;

/* -------------------------------------------------------------------------
   Residents
   ------------------------------------------------------------------------- */

export const residentSchema = z.object({
  _id: z.string(),
  // May arrive as an id string or a populated object — see lib/schemas/ref.ts.
  estateId: refSchema.nullish(),
  userId: refSchema.nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().nullish(),
  address: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  moveInDate: z.string().nullish(),
  role: z.string().nullish(),
  businessName: z.string().nullish(),
  industryType: z.string().nullish(),
  createdAt: z.string().nullish(),
});

export type Resident = z.infer<typeof residentSchema>;

export const updateResidentSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  phoneNumber: z.string().min(7, "Enter a valid phone number"),
  moveInDate: z.string().min(1, "Move-in date is required"),
  address: z.string().min(5, "Address is too short"),
  role: z.enum(["resident", "business_owner"]),
  businessName: z.string().optional(),
  industryType: z
    .enum(["technology", "finance", "healthcare", "education", "other"])
    .optional(),
});

export type UpdateResidentInput = z.infer<typeof updateResidentSchema>;

/* -------------------------------------------------------------------------
   Dues and payments
   ------------------------------------------------------------------------- */

export const dueSchema = z.object({
  _id: z.string(),
  // The database holds at least one due with neither field set. Tolerated
  // here so one bad record cannot blank the whole list — see the note in
  // lib/schemas/admin.ts.
  name: z.string().nullish(),
  amount: z.number().nullish(),
  duration: z.string().nullish(),
  accountName: z.string().nullish(),
  accountNumber: z.union([z.string(), z.number()]).nullish(),
  bankName: z.string().nullish(),
  isDueEnabled: z.boolean().nullish(),
});

export type Due = z.infer<typeof dueSchema>;

export const transactionSchema = z.object({
  _id: z.string(),
  type: z.string().nullish(),
  amount: z.number().nullish(),
  description: z.string().nullish(),
  tx_ref: z.string().nullish(),
  duration: z.number().nullish(),
  status: z.string().nullish(),
  createdAt: z.string().nullish(),
});

export type Transaction = z.infer<typeof transactionSchema>;

/** The payment types the API accepts on POST /payments/initiate. */
export const PAYMENT_TYPES = [
  { value: "estate_payments", label: "Estate Dues" },
  { value: "utility", label: "Utility" },
  { value: "project", label: "Project" },
  { value: "other", label: "Others" },
] as const;
