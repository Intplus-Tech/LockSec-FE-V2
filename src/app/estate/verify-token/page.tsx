import type { Metadata } from "next";
import { Suspense } from "react";
import { EstateAuthShell } from "@/components/layout/estate-auth-shell";
import { VerifyTokenForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Reset password token",
  robots: { index: false, follow: false },
};

export default function VerifyTokenPage() {
  return (
    <EstateAuthShell
      title="Reset Password Token"
      subtitle="A Token has been sent to your email"
      back={{ href: "/estate/forgot-password" }}
    >
      {/* useSearchParams needs a Suspense boundary, otherwise the whole
          route opts out of static rendering. */}
      <Suspense fallback={null}>
        <VerifyTokenForm />
      </Suspense>
    </EstateAuthShell>
  );
}
