import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
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
      <header className="surface-stars px-5 pb-9 pt-7 text-white min-[400px]:px-6 min-[400px]:pb-10 min-[400px]:pt-8">
        <div className="mx-auto w-full max-w-md">
          <Logo tone="light" />

          {/* The Figma leaves a large gap here. On a short screen a fixed
              margin pushes the form below the fold, so it scales with the
              viewport instead. */}
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
          {/**
           * The form reads ?next= from the URL with useSearchParams, which
           * cannot be known while the page is being prerendered at build
           * time. Suspense marks the boundary where the server stops and the
           * browser takes over.
           *
           * Without it the build fails outright — Next.js refuses to
           * prerender a page whose output depends on a URL it does not have
           * yet. The fallback is a skeleton the same shape as the form, so
           * nothing jumps when the real thing arrives.
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
