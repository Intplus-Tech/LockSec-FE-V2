import { cn } from "@/lib/utils";

/**
 * A placeholder block shown while data loads.
 *
 * Skeletons rather than a spinner, because a skeleton preserves the shape of
 * the page: nothing jumps when the real content arrives. A spinner followed
 * by a full layout is a visible lurch every single time.
 *
 * aria-hidden because a screen reader should hear the loading announcement
 * from the region's aria-busy, not a stream of empty boxes.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-field bg-hairline", className)}
    />
  );
}

/** Wraps a loading region so assistive tech is told what is happening. */
export function LoadingRegion({
  loading,
  label,
  children,
}: {
  loading: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div aria-busy={loading} aria-live="polite" aria-label={label}>
      {children}
    </div>
  );
}
