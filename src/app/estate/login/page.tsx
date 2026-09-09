import type { Metadata } from "next";
import { EstateAuthShell } from "@/components/layout/estate-auth-shell";
import { EstateLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Estate sign in",
  robots: { index: false, follow: false },
};

export default function EstateLoginPage() {
  return (
    <EstateAuthShell
      title="Sign In to your estate account"
      subtitle="Enter your details to proceed further"
      navAction={{ href: "/estate/register", label: "Create Account" }}
    >
      <EstateLoginForm />
    </EstateAuthShell>
  );
}
