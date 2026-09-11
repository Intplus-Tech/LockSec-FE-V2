import { z } from "zod";

/**
 * Auth request and response shapes.
 *
 * These are now confirmed against the updated API documentation AND against
 * real calls. Where the two disagreed in the past, the real call won; there
 * is no disagreement left in this file.
 */

/* --- Envelopes ---------------------------------------------------------- */

/**
 * Every successful response is `{ message, data }`.
 *
 * Note this is NOT what the original spec described — it documented
 * `{ ok: true, data }`, and there has never been an `ok` field. The updated
 * spec now says `{ message, data }`, matching what the server actually sends.
 */
export const envelope = <T extends z.ZodType>(data: T) =>
  z.object({
    message: z.string().optional(),
    data,
  });

/** A paginated list: `{ message, data: { data, total, page, limit } }`. */
export const paginatedEnvelope = <T extends z.ZodType>(item: T) =>
  z.object({
    message: z.string().optional(),
    data: z.object({
      data: z.array(item),
      total: z.number().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    }),
  });

/* --- Roles -------------------------------------------------------------- */

/**
 * The role strings, now documented in the spec's AuthResponse enum and all
 * confirmed against live tokens except super_admin, for which no account
 * exists to test with.
 */
export const roleSchema = z.enum([
  "resident",
  "estate_admin",
  "security",
  "super_admin",
  "business_owner",
]);

export type Role = z.infer<typeof roleSchema>;

/* --- Login -------------------------------------------------------------- */

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * The login response.
 *
 * `role` and `estateId` are now returned in the body. Previously they existed
 * only inside the JWT, which meant decoding a token just to find out who had
 * signed in — and that is what caused the `admin` versus `estate_admin`
 * redirect loop early on.
 *
 * Both are still optional here, and the handler falls back to the token when
 * they are missing. The deployed API can lag its own documentation, and a
 * login that fails because one field is absent is a bad trade for slightly
 * tidier code.
 */
export const loginResponseSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    user: z.object({
      _id: z.string(),
      email: z.string().optional(),
      role: z.string().optional(),
      estateId: z.string().nullish(),
    }),
    token: z.string(),
    refreshToken: z.string().optional(),
  }),
});

export const securityLoginSchema = z.object({
  securityCode: z
    .string()
    .min(4, "Enter your personnel ID")
    .max(12, "Enter your personnel ID"),
});

export type SecurityLoginInput = z.infer<typeof securityLoginSchema>;

/* --- Registration and password ------------------------------------------ */

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "That password is too long")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

/**
 * The API rejects a '+' in the local part of an email, which is unusual —
 * plus-addressing is legitimate and common. Checking here means the user is
 * told immediately rather than after a round trip.
 */
export const emailSchema = z
  .email("Enter a valid email address")
  .refine((value) => !value.split("@")[0]?.includes("+"), {
    error: "This service doesn't accept '+' in email addresses",
  });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(4, "Enter the code from your email"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/* --- Registration ------------------------------------------------------- */

/**
 * Estate admin registration.
 *
 * Field lengths match the API's documented constraints, so a rejection
 * happens here with a message beside the offending field rather than as a
 * 400 several seconds later.
 */
export const registerEstateSchema = z
  .object({
    estateName: z
      .string()
      .min(2, "Estate name is too short")
      .max(120, "Estate name is too long"),
    fullName: z
      .string()
      .min(2, "Enter your full name")
      .max(120, "That name is too long"),
    email: emailSchema,
    phoneNumber: z
      .string()
      .min(7, "Enter a valid phone number")
      .max(20, "Enter a valid phone number"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterEstateInput = z.infer<typeof registerEstateSchema>;

/**
 * Resident registration.
 *
 * `estateId` comes from the invite link — /register?estate=<id> — which is
 * how a resident is bound to the right estate. There is no picker in the
 * design, and the API requires the field, so the link is the only route in.
 *
 * Business owners must also supply a business name and industry. Expressing
 * that with `.refine` keeps the rule beside the data and points the error at
 * the right field.
 */
export const registerResidentSchema = z
  .object({
    estateId: z.string().min(1, "This invite link is missing its estate"),
    firstName: z
      .string()
      .min(2, "First name is too short")
      .max(120, "First name is too long"),
    lastName: z
      .string()
      .min(2, "Last name is too short")
      .max(120, "Last name is too long"),
    email: emailSchema,
    phoneNumber: z
      .string()
      .min(7, "Enter a valid phone number")
      .max(20, "Enter a valid phone number"),
    moveInDate: z.string().min(1, "Move-in date is required"),
    address: z
      .string()
      .min(5, "Address is too short")
      .max(200, "Address is too long"),
    role: z.enum(["resident", "business_owner"]),
    businessName: z.string().optional(),
    industryType: z
      .enum(["technology", "finance", "healthcare", "education", "other"])
      .optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (d) => d.role !== "business_owner" || Boolean(d.businessName?.trim()),
    { error: "Business name is required", path: ["businessName"] },
  )
  .refine((d) => d.role !== "business_owner" || Boolean(d.industryType), {
    error: "Industry is required",
    path: ["industryType"],
  });

export type RegisterResidentInput = z.infer<typeof registerResidentSchema>;

/** PATCH /auth/change-password — added in the API update. */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.oldPassword !== d.newPassword, {
    error: "Choose a password different from your current one",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
