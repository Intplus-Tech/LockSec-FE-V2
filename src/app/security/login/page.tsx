import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
      {/*
        A way back to the landing page, for anyone who opened the wrong app.
        Placed before the centred <main>, so it sits at the top without
        disturbing the vertical centring below.

        min-h-11 rather than a bare text link: this is a gate device, used
        with a thumb, sometimes in the rain. Small targets fail there.
      */}
      <div className="mx-auto w-full max-w-sm">
        <Link
          href="/"
          className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-field px-2 text-sm text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Home
        </Link>
      </div>

      <main id="main" className="mx-auto my-auto w-full max-w-sm">
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
