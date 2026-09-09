"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A dialog, built on the native <dialog> element.
 *
 * Using the platform element rather than a div gives us four things
 * hand-rolled modals almost always get wrong: focus trapped inside while
 * open, Escape to close, the background made inert, and top-layer rendering
 * that no ancestor's overflow or z-index can interfere with.
 *
 * ON CENTRING. The browser's own stylesheet centres a modal dialog with
 *
 *     dialog { inset: 0; margin: auto; }
 *
 * but Tailwind's preflight resets `margin: 0` on every element, which
 * silently defeats it and pins the dialog to the top-left corner. `m-auto`
 * below puts it back. This is worth remembering: the platform default was
 * correct, and a CSS reset broke it.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      // showModal(), not show(). Only showModal gives the top layer, the
      // focus trap and the inert background.
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const widths = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
  } as const;

  return (
    <dialog
      ref={ref}
      // Fires on Escape as well as dialog.close(), so this is the single
      // place that tells React the dialog went away.
      onClose={onClose}
      onClick={(event) => {
        // The backdrop is part of the dialog element, so a click landing on
        // the dialog itself rather than a child means the backdrop.
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        // m-auto restores the centring Tailwind's preflight removes.
        "m-auto w-[calc(100vw-2rem)] rounded-sheet bg-white p-0 shadow-xl backdrop:bg-black/40",
        "max-h-[calc(100dvh-2rem)] overflow-hidden",
        widths[size],
      )}
      aria-labelledby="modal-title"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-7 sm:pt-6">
          <h2
            id="modal-title"
            className="text-lg font-bold text-heading sm:text-xl"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-field text-muted hover:bg-canvas hover:text-heading"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="border-t border-hairline" />

        {/* Only the body scrolls, so the title and close button stay put on a
            long form like Add New Resident. */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {children}
        </div>
      </div>
    </dialog>
  );
}
