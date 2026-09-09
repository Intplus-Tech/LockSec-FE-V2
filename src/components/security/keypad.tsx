"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * The gate keypad.
 *
 * Two input methods on purpose. The on-screen keys are what a guard uses on a
 * tablet mounted at a gate; the physical keyboard listener means the same
 * screen works on a laptop, and gives keyboard and switch users a route in
 * that does not depend on hitting a target accurately.
 *
 * The digit boxes are a live region rather than inputs. A screen reader
 * announces the code as it grows — "2", "23", "239" — which is the useful
 * thing here. Six separate inputs would announce six unlabelled fields and
 * fight the keypad for focus.
 */

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function Keypad({
  value,
  onChange,
  onSubmit,
  length = 6,
  error,
  busy,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  length?: number;
  error?: string | null;
  busy?: boolean;
}) {
  const press = (digit: string) => {
    if (value.length >= length) return;
    onChange(value + digit);
  };

  const del = () => onChange(value.slice(0, -1));

  // Physical keyboard support. Attached to the window rather than an input,
  // because there is no input to focus — the boxes are a display.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (busy) return;

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        press(event.key);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        del();
        return;
      }
      if (event.key === "Enter" && value.length === length) {
        event.preventDefault();
        onSubmit();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, busy, length]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  return (
    <div>
      {/* Code display */}
      <div
        className="mx-auto flex w-full max-w-xs gap-1.5 sm:gap-2"
        role="group"
        aria-label="Access code"
      >
        {digits.map((digit, index) => (
          <div
            key={index}
            aria-hidden="true"
            className={cn(
              "flex aspect-square min-w-0 flex-1 items-center justify-center rounded-field border text-xl font-semibold text-white transition-colors",
              "max-w-12",
              error ? "border-bad" : "border-ink-line",
            )}
          >
            {digit ? "•" : ""}
          </div>
        ))}
      </div>

      {/* The spoken version of the boxes above. */}
      <p className="sr-only" aria-live="polite">
        {value.length === 0
          ? "No digits entered"
          : `${value.length} of ${length} digits entered`}
      </p>

      {/* Error message. Reserved height so the keypad does not jump up and
          down as errors appear and clear — a moving target is the last thing
          you want under someone's thumb. */}
      <p
        role="alert"
        className="mt-5 min-h-6 text-center text-sm font-medium text-bad"
      >
        {error ?? ""}
      </p>

      {/* Keys */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <Key key={key} onClick={() => press(key)} disabled={busy}>
            {key}
          </Key>
        ))}

        <Key onClick={del} disabled={busy} label="Delete last digit">
          Del
        </Key>

        <Key onClick={() => press("0")} disabled={busy}>
          0
        </Key>

        <Key
          onClick={onSubmit}
          disabled={busy || value.length !== length}
          label="Check code"
        >
          {busy ? "…" : "Check"}
        </Key>
      </div>
    </div>
  );
}

function Key({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      // h-16 rather than the usual 44px minimum. This is used one-handed,
      // often at night, sometimes in the rain, by someone holding a torch.
      className="flex h-16 items-center justify-center rounded-card bg-white text-xl font-semibold text-heading transition-colors hover:bg-white/90 active:bg-white/75 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
