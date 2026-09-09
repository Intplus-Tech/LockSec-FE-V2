"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useFieldProps, useTone } from "./field";

/**
 * The text input used across all three apps.
 *
 * `tone` is inherited from the surrounding Field, so a field on a dark
 * estate-admin card and one on a white resident form are the same component
 * and look right in both places.
 *
 * `w-full` plus `min-w-0` matters more than it looks: an input inside a flex
 * or grid container will refuse to shrink below its intrinsic width without
 * min-w-0, which is a common cause of a form overflowing a narrow phone.
 */

const toneStyles = {
  light:
    "bg-white border-hairline text-heading placeholder:text-faint focus:border-brand",
  slab: "bg-slab-field border-slab-line text-white placeholder:text-white/40 focus:border-brand",
  ink: "bg-white border-transparent text-heading placeholder:text-faint focus:border-brand",
} as const;

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icon rendered inside the field on the left, as in the admin auth screens. */
  icon?: React.ReactNode;
  /** Rendered inside on the right — the eye toggle, a calendar, a caret. */
  trailing?: React.ReactNode;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ className, icon, trailing, ...props }, ref) {
    const fieldProps = useFieldProps();
    const tone = useTone();

    return (
      <div className="relative w-full min-w-0">
        {icon ? (
          <span
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2",
              tone === "light" ? "text-faint" : "text-white/50",
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}

        <input
          ref={ref}
          {...fieldProps}
          {...props}
          className={cn(
            "h-11 w-full min-w-0 rounded-field border outline-none transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-60",
            icon ? "pl-10" : "pl-3.5",
            trailing ? "pr-11" : "pr-3.5",
            toneStyles[tone],
            // aria-invalid is set by Field, so the error style follows the
            // accessibility attribute rather than a separate prop that could
            // drift out of sync with it.
            "aria-[invalid=true]:border-bad",
            className,
          )}
        />

        {trailing ? (
          <span className="absolute right-1 top-1/2 -translate-y-1/2">
            {trailing}
          </span>
        ) : null}
      </div>
    );
  },
);
