"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFieldProps, useTone } from "./field";

/**
 * A native <select> styled to match the design.
 *
 * Deliberately native rather than a custom listbox. On a phone at a gate,
 * the OS picker is faster, works with one thumb, and is already accessible.
 * A custom dropdown would look identical in Figma and be worse to use.
 */

const toneStyles = {
  light: "bg-white border-hairline text-heading focus:border-brand",
  slab: "bg-slab-field border-slab-line text-white focus:border-brand",
  ink: "bg-white border-transparent text-heading focus:border-brand",
} as const;

export interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  options: readonly { value: string; label: string }[];
}

export const SelectField = React.forwardRef<
  HTMLSelectElement,
  SelectFieldProps
>(function SelectField({ className, placeholder, options, ...props }, ref) {
  const fieldProps = useFieldProps();
  const tone = useTone();

  return (
    <div className="relative">
      <select
        ref={ref}
        {...fieldProps}
        {...props}
        className={cn(
          "h-11 w-full appearance-none rounded-field border pl-3.5 pr-10 text-sm outline-none transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "aria-[invalid=true]:border-bad",
          toneStyles[tone],
          className,
        )}
      >
        {placeholder ? (
          <option value="">{placeholder}</option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2",
          tone === "light" ? "text-faint" : "text-white/50",
        )}
        aria-hidden="true"
      />
    </div>
  );
});
