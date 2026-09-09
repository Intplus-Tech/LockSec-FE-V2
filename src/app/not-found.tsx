import Link from "next/link";
import { Logo } from "@/components/brand/logo";

/**
 * An empty or wrong screen is a moment for direction, not an apology.
 * Say what happened and offer the way back.
 */
export default function NotFound() {
  return (
    <div className="surface-grid flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-heading">
        That page isn&rsquo;t here
      </h1>
      <p className="mt-3 max-w-sm text-body">
        The link may be out of date, or the page may have moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-field bg-brand-deep px-6 py-3 font-medium text-white hover:bg-brand-deep-hover"
      >
        Go to the home page
      </Link>
    </div>
  );
}
