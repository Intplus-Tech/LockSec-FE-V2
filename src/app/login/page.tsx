import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ResidentLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your LockSec resident account.",
  // Login pages carry no content worth indexing and look like thin duplicate
  // pages to a crawler.
  robots: { index: false, follow: false },
};

export default function ResidentLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="surface-stars px-5 pb-9 pt-7 text-white min-[400px]:px-6 min-[400px]:pb-10 min-[400px]:pt-8">
        <div className="mx-auto w-full max-w-md">
          <Logo tone="light" />

          {/* The Figma leaves a large gap here. On a short screen a fixed
              64px margin pushes the form below the fold, so it scales with
              the viewport instead. */}
          <h1 className="mt-[clamp(2.5rem,8vh,4rem)] text-display font-extrabold">
            Sign in to your Account
          </h1>

          <p className="mt-3 text-sm text-white/80">
            Don&rsquo;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-brand underline underline-offset-4"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </header>

      <main
        id="main"
        className="flex-1 px-5 py-8 min-[400px]:px-6 min-[400px]:py-10"
      >
        <div className="mx-auto w-full max-w-md">
          <ResidentLoginForm />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-md px-5 pb-8 text-center text-xs text-muted min-[400px]:px-6">
        By signing up, you agree to the{" "}
        <Link href="/terms" className="font-semibold text-heading">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/data-processing" className="font-semibold text-heading">
          Data Processing Agreement
        </Link>
      </footer>
    </div>
  );
}
