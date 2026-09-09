import { cn } from "@/lib/utils";

/**
 * Shown when a list has nothing in it.
 *
 * An empty list is a moment for direction, not an apology. Say what would be
 * here, and give the one action that would fill it.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-12 text-center", className)}>
      <p className="font-semibold text-heading">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-[36ch] text-sm text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
