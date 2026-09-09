import { cn } from "@/lib/utils";

/**
 * The LockSec shield. Inline SVG rather than an image file: it scales without
 * a second asset and costs no network request — which matters on the security
 * app, used on a phone at a gate on whatever signal is available.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 shrink-0", className)}
      role="img"
      aria-label="LockSec"
    >
      <path
        d="M6 7.5A1.5 1.5 0 0 1 7.5 6h17A1.5 1.5 0 0 1 26 7.5v9.7c0 4.6-3.1 7.9-9.4 10.6a1.5 1.5 0 0 1-1.2 0C9.1 25.1 6 21.8 6 17.2V7.5Z"
        fill="#2563EB"
      />
      <path
        d="M16 10.5l1.5 3.6 3.6 1.5-3.6 1.5L16 20.7l-1.5-3.6-3.6-1.5 3.6-1.5L16 10.5Z"
        fill="#fff"
      />
    </svg>
  );
}

/**
 * Shield plus wordmark.
 *
 * `hideWordmarkOnSmall` drops the text below 400px, leaving the shield. Used
 * in the estate navbar, where logo + Home + Sign In together are wider than a
 * 320px screen. The shield alone still identifies the product, and the mark
 * keeps its accessible name either way.
 */
export function Logo({
  tone = "dark",
  hideWordmarkOnSmall,
  className,
}: {
  tone?: "dark" | "light";
  hideWordmarkOnSmall?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span
        className={cn(
          "text-xl font-extrabold tracking-tight",
          hideWordmarkOnSmall && "hidden min-[400px]:inline",
        )}
      >
        <span className={tone === "dark" ? "text-heading" : "text-white"}>
          Lock
        </span>
        <span className="text-brand">Sec</span>
      </span>
    </span>
  );
}
