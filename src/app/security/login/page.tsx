import type { Metadata } from "next";
import { LogoMark } from "@/components/brand/logo";
import { SecurityLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Security sign in",
  robots: { index: false, follow: false },
};

/**
 * The security app is its own visual world: fully dark, no white body, large
 * touch targets. Used one-handed at a gate, often at night, often on an old
 * phone.
 *
 * The heading previously carried `whitespace-nowrap` on "LockSec Account",
 * which forced horizontal overflow below about 380px. Removed — it may wrap,
 * and wrapping is better than a sideways-scrolling login screen.
 */
export default function SecurityLoginPage() {
  return (
    <div className="surface-stars flex min-h-dvh flex-col px-5 py-8 sm:px-6">
      <main
        id="main"
        className="mx-auto my-auto w-full max-w-sm"
      >
        <div className="flex flex-col items-center text-center">
          <LogoMark className="size-10" />
          <h1 className="mt-5 text-title font-extrabold text-white">
            Sign in to your Lock<span className="text-brand">Sec</span> Account
          </h1>
        </div>

        <div className="mt-[clamp(2rem,7vh,3rem)]">
          <SecurityLoginForm />
        </div>
      </main>
    </div>
  );
}
