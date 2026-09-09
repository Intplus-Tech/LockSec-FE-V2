import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/** One of the three figures across the top of the admin dashboard. */
export function StatCard({
  value,
  label,
  loading,
  unavailable,
  className,
}: {
  value: string;
  label: string;
  loading?: boolean;
  unavailable?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card bg-white px-5 py-6 text-center shadow-sm",
        className,
      )}
    >
      {loading ? (
        <Skeleton className="mx-auto h-8 w-32" />
      ) : unavailable ? (
        // Never a zero when we could not read the data. A confident figure
        // that happens to be wrong is worse than an honest gap.
        <p className="text-lg font-medium text-faint">Unavailable</p>
      ) : (
        <p className="break-words text-2xl font-extrabold text-heading lg:text-3xl">
          {value}
        </p>
      )}
      <p className="mt-1.5 text-sm text-muted">{label}</p>
    </div>
  );
}
