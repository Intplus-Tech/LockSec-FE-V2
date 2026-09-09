import { z } from "zod";
import { refAddress, refName, refSchema, type Ref } from "@/lib/schemas/ref";

/**
 * Schemas for the estate admin area.
 *
 * Response schemas stay forgiving about optional fields — this backend has
 * already proven that a strict schema turns a cosmetic gap into a blank
 * screen. Request schemas are strict, because that is where we can give the
 * user a useful message before a round trip.
 */

/* --- Estate ------------------------------------------------------------- */

export const estateSchema = z.object({
  _id: z.string(),
  userId: refSchema.nullish(),
  estateName: z.string().nullish(),
  fullName: z.string().nullish(),
  email: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  address: z.string().nullish(),
  createdAt: z.string().nullish(),
});

export type Estate = z.infer<typeof estateSchema>;

/* --- Residents ---------------------------------------------------------- */

export const adminResidentSchema = z.object({
  _id: z.string(),
  // Both of these come back sometimes as an id string and sometimes as a
  // populated object, depending on the endpoint. See lib/schemas/ref.ts.
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

export type AdminResident = z.infer<typeof adminResidentSchema>;

export const INDUSTRIES = [
  { value: "technology", label: "Information Technology" },
  { value: "finance", label: "Banking & Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
] as const;

export const createResidentSchema = z
  .object({
    moveInDate: z.string().min(1, "Move-in date is required"),
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    phoneNumber: z.string().min(7, "Enter a valid phone number"),
    email: z.email("Enter a valid email address"),
    address: z.string().min(5, "Address is too short"),
    role: z.enum(["resident", "business_owner"]),
    businessName: z.string().optional(),
    industryType: z
      .enum(["technology", "finance", "healthcare", "education", "other"])
      .optional(),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
  })
  .refine(
    (d) => d.role !== "business_owner" || Boolean(d.businessName?.trim()),
    { error: "Business name is required", path: ["businessName"] },
  )
  .refine((d) => d.role !== "business_owner" || Boolean(d.industryType), {
    error: "Industry is required",
    path: ["industryType"],
  });

export type CreateResidentInput = z.infer<typeof createResidentSchema>;

/* --- Security personnel ------------------------------------------------- */

export const securitySchema = z.object({
  _id: z.string(),
  estateId: refSchema.nullish(),
  userId: refSchema.nullish(),
  firstName: z.string().nullish(),
  middleName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().nullish(),
  address: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  securityCompany: z.string().nullish(),
  /**
   * Returned on creation, and possibly not afterwards. The admin needs it to
   * give to the guard, so the UI shows it prominently once and warns that it
   * may not be recoverable. See backend issue 14.
   */
  securityCode: z.string().nullish(),
  createdAt: z.string().nullish(),
});

export type SecurityPersonnel = z.infer<typeof securitySchema>;

export const createSecuritySchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  // The backend requires this with a 2-character minimum, though the Figma
  // shows it as an ordinary field and marks Email "(optional)" instead.
  middleName: z.string().min(2, "Middle name is required, at least 2 letters"),
  lastName: z.string().min(2, "Last name is too short"),
  address: z.string().min(2, "Address is required"),
  phoneNumber: z.string().min(7, "Enter a valid phone number"),
  email: z.union([z.email("Enter a valid email address"), z.literal("")]),
  securityCompany: z.string().min(2, "Company name is required"),
});

export type CreateSecurityInput = z.infer<typeof createSecuritySchema>;

/* --- Dues --------------------------------------------------------------- */

export const adminDueSchema = z.object({
  _id: z.string(),
  /**
   * Both of these are required by the create endpoint, yet the database
   * contains at least one due with neither. A schema that rejects the whole
   * response over one malformed record hides every good record with it, so
   * these are optional here and defaulted at the point of display.
   *
   * Backend issue 33: `/dues/estate` returns records missing `name` and
   * `amount`, which the create endpoint would not have allowed.
   */
  name: z.string().nullish(),
  amount: z.number().nullish(),
  duration: z.string().nullish(),
  accountName: z.string().nullish(),
  accountNumber: z.union([z.string(), z.number()]).nullish(),
  bankName: z.string().nullish(),
  isDueEnabled: z.boolean().nullish(),
});

export type AdminDue = z.infer<typeof adminDueSchema>;

export const DURATIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;

export const dueFormSchema = z.object({
  name: z.string().min(2, "Give the due a name"),
  amount: z.coerce.number().min(1, "Enter an amount"),
  duration: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  accountName: z.string().min(2, "Account name is required"),
  // A string, not a number: account numbers have leading zeros that a numeric
  // type would silently eat. Converted at the boundary where the API wants a
  // number.
  accountNumber: z
    .string()
    .min(10, "Enter a 10-digit account number")
    .max(10, "Enter a 10-digit account number")
    .regex(/^\d+$/, "Digits only"),
  bankName: z.string().min(2, "Select a bank"),
});

export type DueFormInput = z.infer<typeof dueFormSchema>;

/* --- Transactions ------------------------------------------------------- */

export const adminTransactionSchema = z.object({
  _id: z.string(),
  userId: refSchema.nullish(),
  estateId: refSchema.nullish(),
  type: z.string().nullish(),
  amount: z.number().nullish(),
  description: z.string().nullish(),
  tx_ref: z.string().nullish(),
  duration: z.number().nullish(),
  status: z.string().nullish(),
  createdAt: z.string().nullish(),
});

export type AdminTransaction = z.infer<typeof adminTransactionSchema>;

/* --- Plans -------------------------------------------------------------- */

export const planSchema = z.object({
  _id: z.string().optional(),
  id: z.string().optional(),
  type: z.string().nullish(),
  price: z.number().nullish(),
  description: z.string().nullish(),
  features: z.array(z.string()).nullish(),
});

export type Plan = z.infer<typeof planSchema>;

/** Display name and address from a reference that may or may not be populated. */
export function personFrom(userId: Ref | null | undefined): {
  name: string;
  address: string;
} {
  return {
    name: refName(userId) ?? "—",
    address: refAddress(userId) ?? "—",
  };
}
