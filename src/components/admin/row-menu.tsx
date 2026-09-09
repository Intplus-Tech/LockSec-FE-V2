"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The three-dot menu at the end of a table row.
 *
 * Uses the native <details> element, which gives open/close state, keyboard
 * activation and correct semantics without a line of JavaScript. The only
 * additions are closing on outside click and on Escape, which <details> does
 * not do by itself.
 */
export function RowMenu({
  label = "Row actions",
  items,
}: {
  label?: string;
  items: { label: string; onSelect: () => void; danger?: boolean }[];
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        // Return focus to the trigger, or the user is left nowhere.
        ref.current?.querySelector("summary")?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <details
      ref={ref}
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      className="relative inline-block text-left"
    >
      <summary
        aria-label={label}
        className="inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-field text-faint hover:bg-canvas hover:text-heading [&::-webkit-details-marker]:hidden"
      >
        <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
          <circle cx="5" cy="4" r="1.4" fill="currentColor" />
          <circle cx="11" cy="4" r="1.4" fill="currentColor" />
          <circle cx="5" cy="8" r="1.4" fill="currentColor" />
          <circle cx="11" cy="8" r="1.4" fill="currentColor" />
          <circle cx="5" cy="12" r="1.4" fill="currentColor" />
          <circle cx="11" cy="12" r="1.4" fill="currentColor" />
        </svg>
      </summary>

      <div
        // right-0 so the menu opens inward from the row's right edge rather
        // than off the side of the screen.
        className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-field border border-hairline bg-white py-1 shadow-lg"
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              setOpen(false);
              item.onSelect();
            }}
            className={cn(
              "block w-full px-4 py-2.5 text-left text-sm hover:bg-canvas",
              item.danger ? "text-bad" : "text-body",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </details>
  );
}
