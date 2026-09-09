import { ApiError } from "@/lib/api/client";

/**
 * Auth calls made from the browser.
 *
 * Anything that produces a session hits our own /api/auth/* route handlers,
 * because those are what write the httpOnly cookies. Anything that does not
 * involve tokens (register, verify email, forgot password) goes through
 * /api/public, an unauthenticated pass-through to the backend.
 */

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  estateId?: string;
}

interface LoginResult {
  user: SessionUser;
  redirectTo: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === "string" ? data.message : "Something went wrong",
      response.status,
    );
  }

  return data as T;
}

/** Email and password — residents, business owners and estate admins. */
export function login(input: { email: string; password: string }) {
  return post<LoginResult>("/api/auth/login", input);
}

/** Security personnel — code only, no email or password. */
export function securityLogin(input: { securityCode: string }) {
  return post<LoginResult>("/api/auth/security-login", input);
}

export function logout() {
  return post<{ ok: true }>("/api/auth/logout", {});
}

export async function getSession(): Promise<SessionUser | null> {
  const response = await fetch("/api/auth/session");
  if (!response.ok) return null;
  const data = await response.json();
  return data.user ?? null;
}

const publicPost = <T,>(path: string, body: unknown) =>
  post<T>(`/api/public${path}`, body);

export const registerEstate = (input: Record<string, unknown>) =>
  publicPost("/auth/register-estate", input);

export const registerResident = (input: Record<string, unknown>) =>
  publicPost("/auth/register-resident", input);

export const forgotPassword = (input: { email: string }) =>
  publicPost("/auth/forgot-password", input);

export const resetPassword = (input: { token: string; newPassword: string }) =>
  publicPost("/auth/reset-password", input);

export const resendVerificationEmail = (input: { email: string }) =>
  publicPost("/auth/resend-verification-email", input);

export const resendForgotPasswordEmail = (input: { email: string }) =>
  publicPost("/auth/resend-forgot-password-email", input);
