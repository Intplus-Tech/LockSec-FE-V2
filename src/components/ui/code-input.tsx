"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The row of separate boxes used for email verification, the password reset
 * token, and the security gate code.
 *
 * SIZING. Six fixed 44px boxes plus gaps come to 304px, which overflows a
 * 320px screen once page padding is added — the boxes get clipped or push the
 * page sideways. So the boxes flex instead: each takes an equal share of the
 * available width, stays square via aspect-ratio, and stops growing at 3rem
 * so they do not become comically large on a desktop. `min-w-0` is what
 * actually allows a flex child to shrink below its content size; without it
 * the row would still overflow.
 *
 * ACCESSIBILITY. A row of six inputs is a classic trap. The common
 * implementation breaks paste, breaks backspace, and announces six unlabelled
 * fields to a screen reader. This version handles all of it:
 *
 *   - Pasting "482913" anywhere fills every box.
 *   - Backspace on an empty box moves back and clears, which is what people
 *     expect and almost nobody implements.
 *   - Arrow keys move between boxes.
 *   - inputMode="numeric" brings up the number pad; autoComplete
 *     "one-time-code" lets iOS offer the code straight from the email.
 *   - The boxes share one label, so assistive technology hears a single
 *     clear field rather than six mystery ones.
 */

interface CodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  /** Fired when the last box is filled — lets a form auto-submit. */
  onComplete?: (value: string) => void;
  label: string;
  invalid?: boolean;
  disabled?: boolean;
  tone?: "slab" | "ink";
  className?: string;
}

export function CodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  label,
  invalid,
  disabled,
  tone = "slab",
  className,
}: CodeInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  const commit = (next: string) => {
    const cleaned = next.replace(/\D/g, "").slice(0, length);
    onChange(cleaned);
    if (cleaned.length === length) onComplete?.(cleaned);
  };

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;

    const chars = value.split("");
    // Several digits at once (autofill, fast typing) spill forward into the
    // following boxes rather than being truncated.
    for (let i = 0; i < typed.length && index + i < length; i += 1) {
      chars[index + i] = typed[i];
    }

    commit(chars.join("").slice(0, length));
    refs.current[Math.min(index + typed.length, length - 1)]?.focus();
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const chars = value.padEnd(length, " ").split("");

      if (chars[index] && chars[index] !== " ") {
        chars[index] = " ";
        commit(chars.join("").replace(/ /g, ""));
      } else if (index > 0) {
        chars[index - 1] = " ";
        commit(chars.join("").replace(/ /g, ""));
        refs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    commit(pasted.slice(0, length));
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  const boxTone =
    tone === "slab"
      ? "bg-slab-field border-slab-line text-white"
      : "bg-transparent border-ink-line text-white";

  return (
    <div
      className={cn("mx-auto flex w-full max-w-xs gap-1.5 sm:gap-2", className)}
    >
      <span className="sr-only" id="code-input-label">
        {label}
      </span>

      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          disabled={disabled}
          aria-labelledby="code-input-label"
          aria-invalid={invalid || undefined}
          value={digits[index] === " " ? "" : digits[index]}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={cn(
            // min-w-0 is what lets these shrink below their content width.
            "aspect-square min-w-0 flex-1 rounded-field border text-center text-lg font-semibold outline-none transition-colors",
            "max-w-12 focus:border-brand disabled:opacity-50",
            boxTone,
            invalid && "border-bad",
          )}
        />
      ))}
    </div>
  );
}
