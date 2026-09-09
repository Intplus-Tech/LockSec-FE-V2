import { cn } from "@/lib/utils";

/**
 * The coloured status dot and label used for access codes and transactions.
 *
 * Colour alone is never the signal — the label always says the status in
 * words too. Roughly one man in twelve has some form of colour blindness, and
 * "the green one" is not information they can use.
 */
const tones = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  neutral: "text-muted",
} as const;

const dots = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  neutral: "bg-faint",
} as const;

export type StatusTone = keyof typeof tones;

/** Maps the API's status strings onto a tone. */
export function toneForStatus(status: string | null | undefined): StatusTone {
  switch (status?.toLowerCase()) {
    case "active":
    case "success":
      return "ok";
    case "pending":
    case "partial":
      return "warn";
    case "expired":
    case "failed":
    case "inactive":
      return "bad";
    default:
      return "neutral";
  }
}

export function StatusPill({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const tone = toneForStatus(status);
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : "Unknown";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium",
        tones[tone],
        className,
      )}
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", dots[tone])}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
