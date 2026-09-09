import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The four coloured tiles on the resident dashboard.
 *
 * Each tone pairs a background with a foreground, kept together so a tile can
 * never be built with a mismatched pair — the contrast has been checked for
 * these combinations and not for arbitrary ones.
 */
const tones = {
  code: { tile: "bg-tile-code", fg: "text-tile-code-fg", chip: "bg-tile-code-fg/15" },
  bill: { tile: "bg-tile-bill", fg: "text-tile-bill-fg", chip: "bg-tile-bill-fg/15" },
  history: {
    tile: "bg-tile-history",
    fg: "text-tile-history-fg",
    chip: "bg-tile-history-fg/15",
  },
  profile: {
    tile: "bg-tile-profile",
    fg: "text-tile-profile-fg",
    chip: "bg-tile-profile-fg/15",
  },
} as const;

export function DashboardTile({
  href,
  label,
  icon,
  tone,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  tone: keyof typeof tones;
}) {
  const t = tones[tone];

  return (
    <Link
      href={href}
      className={cn(
        "flex aspect-square flex-col justify-between rounded-card p-4 transition-opacity hover:opacity-90",
        t.tile,
      )}
    >
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-field",
          t.chip,
          t.fg,
        )}
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* max-w-[7ch] makes "Generate Access Code" wrap onto two lines the way
          the Figma does, without a hard-coded line break that would look
          wrong in another language. */}
      <span className={cn("max-w-[8ch] text-base font-medium", t.fg)}>
        {label}
      </span>
    </Link>
  );
}
