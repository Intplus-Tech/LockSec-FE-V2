import { z } from "zod";

/**
 * Written for Zod 4. If you have seen Zod 3 examples elsewhere, two things
 * changed that matter here:
 *
 *   z.string().email()  ->  z.email()
 *   z.ZodTypeAny        ->  z.ZodType
 *
 * Zod does two jobs in this project, and both are worth understanding.
 *
 * Going out: validating what the user typed before we send it. Catching a
 * bad email in the browser is faster and friendlier than a round trip.
 *
 * Coming back: validating what the server sent us. This is the part people
 * skip, and it is the part that saves you. TypeScript types vanish at
 * runtime — if you write `res.data.user as User` and the backend renames a
 * field, TypeScript stays silent and you get `undefined` on screen. Zod
 * actually checks, and fails at the boundary where the problem is instead of
 * three components deep.
 *
 * That matters especially here, because this backend's documentation has
 * already proven not to match its implementation.
 */

// ---------------------------------------------------------------------------
// Shared rules
// ---------------------------------------------------------------------------

/**
 * The backend rejects "+" in the local part of an email — an unusual rule,
 * so we mirror it here to fail fast rather than round-tripping for a 400.
 */
export const emailSchema = z
  .email("Enter a valid email address")
  .refine((value) => !value.split("@")[0]?.includes("+"), {
    error: "Email cannot contain a '+' character",
  });

/** Backend rule: 8-72 chars, at least one uppercase, lowercase and number. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: emailSchema,
  // Deliberately loose. Applying the full password rules to a login form
  // means an older account with a weaker password could never sign in, and
  // it leaks your password policy to anyone poking at the form.
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Security staff sign in with a code only — no email, no password. */
export const securityLoginSchema = z.object({
  securityCode: z
    .string()
    .min(1, "Security code is required")
    .regex(/^\d+$/, "Security code must be numbers only"),
});
export type SecurityLoginInput = z.infer<typeof securityLoginSchema>;

export const registerEstateSchema = z.object({
  estateName: z.string().min(2, "Estate name is too short").max(120),
  fullName: z.string().min(2, "Full name is too short"),
  email: emailSchema,
  phoneNumber: z.string().min(7, "Phone number is too short").max(20),
  password: passwordSchema,
});
export type RegisterEstateInput = z.infer<typeof registerEstateSchema>;

export const registerResidentSchema = z
  .object({
    estateId: z.string().min(1, "Estate is required"),
    firstName: z.string().min(2, "First name is too short").max(120),
    lastName: z.string().min(2, "Last name is too short"),
    email: emailSchema,
    phoneNumber: z.string().min(7, "Phone number is too short").max(20),
    moveInDate: z.string().min(1, "Move-in date is required"),
    address: z.string().min(5, "Address is too short").max(200),
    role: z.enum(["resident", "business_owner"]),
    businessName: z.string().max(120).optional(),
    industryType: z
      .enum(["technology", "finance", "healthcare", "education", "other"])
      .optional(),
    password: passwordSchema,
  })
  // Conditional requirement: business owners must supply business details.
  // Expressing it here keeps the rule next to the data instead of buried in
  // a component's submit handler.
  .refine(
    (data) => data.role !== "business_owner" || Boolean(data.businessName),
    { error: "Business name is required", path: ["businessName"] },
  )
  .refine(
    (data) => data.role !== "business_owner" || Boolean(data.industryType),
    { error: "Industry type is required", path: ["industryType"] },
  );
export type RegisterResidentInput = z.infer<typeof registerResidentSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset code is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/**
 * The shape below is what the server ACTUALLY returns, confirmed against a
 * live call. It is not what the OpenAPI spec documents.
 *
 *   Spec says:   { _id, email, role, accessToken, refreshToken }
 *   Reality is:  { message, data: { user: { _id, email }, token, refreshToken } }
 *
 * Three differences that would each have broken the app: the payload is
 * nested under `data`, the field is `token` rather than `accessToken`, and
 * there is no `role` anywhere — it exists only inside the JWT.
 *
 * If the backend is later fixed to match its own docs, this schema throws
 * immediately and points straight at the change.
 */
export const loginResponseSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    user: z.object({
      _id: z.string(),
      email: z.string(),
    }),
    token: z.string(),
    refreshToken: z.string().optional(),
  }),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * Every other endpoint wraps its payload the same way: { message, data }.
 * This helper builds a schema for any inner shape, so we describe the
 * envelope once instead of repeating it on every endpoint.
 *
 *   const schema = envelope(residentSchema);
 */
export function envelope<T extends z.ZodType>(inner: T) {
  return z.object({
    message: z.string().optional(),
    data: inner,
  });
}

/** Paginated lists come back as { data: { data: [...], total, page, limit } }. */
export function paginatedEnvelope<T extends z.ZodType>(item: T) {
  return envelope(
    z.object({
      data: z.array(item),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
    }),
  );
}

/** Errors are plain { message } — the spec's richer error shape is fiction. */
export const errorResponseSchema = z.object({
  message: z.string(),
});
