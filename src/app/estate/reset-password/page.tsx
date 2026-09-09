import type { Metadata } from "next";
import { Suspense } from "react";
import { EstateAuthShell } from "@/components/layout/estate-auth-shell";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <EstateAuthShell title="Reset Password" subtitle="Create a new password">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </EstateAuthShell>
  );
}
