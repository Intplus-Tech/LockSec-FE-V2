import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Splash } from "@/components/brand/splash";
import { Skeleton } from "@/components/ui/skeleton";
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
      {/* once={false}: coming back to sign in again is a fresh start, so the
          opening plays every time rather than only the first. */}
      <Splash once={false} storageKey="locksec:splash:resident" />

      <header className="surface-stars px-5 pb-9 pt-7 text-white min-[400px]:px-6 min-[400px]:pb-10 min-[400px]:pt-8">
        <div className="mx-auto w-full max-w-md">
          {/* A way back to the landing page. Without it, anyone who opened
              the wrong app is stuck reaching for the browser's back button,
              which is not obvious on a phone in a standalone window. */}
          <Link
            href="/"
            className="-ml-2 mb-4 inline-flex min-h-11 items-center gap-2 rounded-field px-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Home
          </Link>

          <Logo tone="light" />

          {/* The Figma leaves a large gap here. On a short screen a fixed
              margin pushes the form below the fold, so it scales with the
              viewport instead. */}
          <h1 className="mt-[clamp(2rem,6vh,3.5rem)] text-display font-extrabold">
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
          {/**
           * The form reads ?next= from the URL with useSearchParams, which
           * cannot be known while the page is being prerendered at build
           * time. Suspense marks the boundary where the server stops and the
           * browser takes over.
           */}
          <Suspense fallback={<FormSkeleton />}>
            <ResidentLoginForm />
          </Suspense>
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

function FormSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-13 w-full" />
    </div>
  );
}
