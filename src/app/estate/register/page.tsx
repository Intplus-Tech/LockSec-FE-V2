import type { Metadata } from "next";
import { EstateAuthShell } from "@/components/layout/estate-auth-shell";
import { EstateRegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create estate account",
  robots: { index: false, follow: false },
};

export default function EstateRegisterPage() {
  return (
    <EstateAuthShell title="Create Estate Account">
      <EstateRegisterForm />
    </EstateAuthShell>
  );
}
