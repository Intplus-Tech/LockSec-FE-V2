import type { Metadata } from "next";
import { Suspense } from "react";
import { EstateAuthShell } from "@/components/layout/estate-auth-shell";
import { VerifyEmailForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <EstateAuthShell
      title="Verify Your Email"
      subtitle="A Token has been sent to your email"
      back={{ href: "/estate/login" }}
    >
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </EstateAuthShell>
  );
}
