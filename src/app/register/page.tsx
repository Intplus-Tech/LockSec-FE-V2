import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ResidentRegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your LockSec resident account.",
  robots: { index: false, follow: false },
};

/**
 * Residents reach this page from an invite link the estate admin shares:
 *
 *     /register?estate=67f2c1f5b1a2c3d4e5f67890
 *
 * That is the "Resident App — Copy link" panel in the admin sidebar. The
 * estate id is required by the API and there is no picker in the design, so
 * the link is how a resident is bound to the right estate.
 */
export default function ResidentRegisterPage() {
  return (
    <MobileShell
      back="/login"
      title="Register"
      subtitle={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand underline underline-offset-4"
          >
            Log In
          </Link>
        </>
      }
    >
      {/* Reads ?estate= from the URL — unknown while prerendering, so the
          form needs a Suspense boundary around it. */}
      <Suspense fallback={<div className="h-96" aria-hidden="true" />}>
        <ResidentRegisterForm />
      </Suspense>
    </MobileShell>
  );
}
