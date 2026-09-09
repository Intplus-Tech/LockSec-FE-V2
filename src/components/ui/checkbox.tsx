"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A checkbox that keeps the real <input> in the DOM rather than replacing it
 * with a styled div. The native element brings keyboard support, form
 * participation and screen-reader semantics for free; we only restyle it.
 */
export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  tone?: "light" | "slab";
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, tone = "light", className, ...props }, ref) {
    return (
      <label
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 text-sm",
          tone === "light" ? "text-body" : "text-white/80",
          className,
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            "size-4 rounded-sm border accent-brand",
            tone === "light" ? "border-hairline-strong" : "border-slab-line",
          )}
          {...props}
        />
        {label}
      </label>
    );
  },
);
