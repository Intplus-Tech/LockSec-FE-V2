"use client";

import { cn } from "@/lib/utils";

/**
 * The pill switch used on the settings and security screens.
 *
 * A real checkbox underneath, visually hidden, with role="switch" on the
 * input. That keeps keyboard operation, form participation and the announced
 * on/off state, none of which a styled div would have.
 *
 * `label` is required rather than optional on purpose. A switch with no
 * accessible name is announced as just "switch, on" — which tells a
 * screen-reader user the state of something, but not what.
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  tone = "brand",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  tone?: "brand" | "ok";
}) {
  const on = tone === "ok" ? "bg-ok" : "bg-brand-deep";

  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          // Focus lives on the hidden input, so mirror it onto the visible
          // track — otherwise a keyboard user cannot see where they are.
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
          checked ? on : "bg-hairline-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-all",
            checked ? "left-[1.375rem]" : "left-0.5",
          )}
        />
      </span>
    </label>
  );
}
