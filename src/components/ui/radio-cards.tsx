"use client";

import { cn } from "@/lib/utils";

/**
 * The "I Am A: Resident / Business Owner" control.
 *
 * Built as a real radiogroup with a fieldset and legend, so a screen reader
 * announces "I Am A, Resident, radio button, 1 of 2" — the grouping is what
 * makes the choice comprehensible without sight.
 *
 * The options wrap rather than sitting in a fixed row: "Business Owner" next
 * to "Resident" with a fixed 32px gap overflows a 320px screen.
 */
interface RadioCardsProps {
  legend: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  tone?: "light" | "slab";
}

export function RadioCards({
  legend,
  name,
  value,
  onChange,
  options,
  tone = "light",
}: RadioCardsProps) {
  return (
    <fieldset className="space-y-2">
      <legend
        className={cn(
          "text-sm",
          tone === "light" ? "text-muted" : "text-white/70",
        )}
      >
        {legend}
      </legend>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            // min-h-11 gives the label a 44px touch target even though the
            // radio itself is 16px.
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm",
              tone === "light" ? "text-body" : "text-white/80",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-4 shrink-0 accent-brand"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
