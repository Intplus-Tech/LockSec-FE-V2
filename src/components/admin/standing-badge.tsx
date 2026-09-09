import { cn } from "@/lib/utils";
import {
  STANDING_LABEL,
  STANDING_TONE,
  type paymentStanding,
} from "@/lib/dues-math";

type Standing = ReturnType<typeof paymentStanding>;

const dots = { ok: "bg-ok", warn: "bg-warn", bad: "bg-bad" } as const;
const text = { ok: "text-ok", warn: "text-warn", bad: "text-bad" } as const;

/**
 * The On-Time / Partial / Overdue pill.
 *
 * The word carries the meaning; the colour only reinforces it. Colour alone
 * would be unreadable for roughly one man in twelve.
 */
export function StandingBadge({ standing }: { standing: Standing }) {
  const tone = STANDING_TONE[standing];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium",
        text[tone],
      )}
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", dots[tone])}
        aria-hidden="true"
      />
      {STANDING_LABEL[standing]}
    </span>
  );
}
