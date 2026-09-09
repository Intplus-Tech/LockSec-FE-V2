"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Buttons, with the variants that actually appear in the LockSec design.
 *
 * Three things worth internalising:
 *
 * 1. `type` defaults to "button", not "submit". HTML's default is "submit",
 *    which means a stray button inside a form silently submits it. Making
 *    submission explicit removes a whole class of confusing bug.
 *
 * 2. Every size is at least 44px tall — the accepted minimum touch target.
 *    A 36px button is fine with a mouse and frustrating with a thumb, and
 *    this app is used with thumbs at a gate.
 *
 * 3. While loading the button is disabled AND announces itself with
 *    aria-busy, and the label stays in the DOM rather than being swapped for
 *    a spinner. A screen-reader user is told the button is busy instead of
 *    hearing the label vanish.
 */

const variants = {
  /** Mobile primary — the bright blue full-width CTA. */
  primary:
    "bg-brand text-white hover:bg-brand-hover active:bg-brand-hover disabled:bg-brand/50",
  /** Desktop admin primary — the deeper, more saturated blue. */
  deep: "bg-brand-deep text-white hover:bg-brand-deep-hover disabled:bg-brand-deep/50",
  /** The dark navy pill in the marketing navbar. */
  navy: "bg-brand-navy text-white hover:bg-brand-navy/90",
  outline: "border border-hairline-strong bg-white text-body hover:bg-canvas",
  danger: "border border-bad bg-white text-bad hover:bg-bad-tint",
  ghost: "text-brand hover:bg-brand-tint",
  /** The white keys on the security keypad. */
  key: "bg-white text-heading text-xl font-semibold hover:bg-white/90 active:bg-white/80",
} as const;

const sizes = {
  sm: "min-h-11 px-3 text-sm rounded-field",
  md: "min-h-11 px-4 text-sm rounded-field",
  lg: "min-h-13 px-6 text-base rounded-field",
  key: "min-h-14 rounded-card",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2 py-2 text-center font-medium transition-colors",
          "disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : null}
        {children}
      </button>
    );
  },
);
