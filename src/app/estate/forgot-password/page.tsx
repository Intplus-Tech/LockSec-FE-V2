import type { Metadata } from "next";
import { EstateAuthShell } from "@/components/layout/estate-auth-shell";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <EstateAuthShell
      title="Forget Password"
      subtitle="Enter your email address to reset your password"
      back={{ href: "/estate/login" }}
    >
      <ForgotPasswordForm />
    </EstateAuthShell>
  );
}
