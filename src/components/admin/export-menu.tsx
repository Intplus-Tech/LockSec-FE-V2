"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

/**
 * The Export dropdown from the Figma, offering Excel and PDF.
 *
 * "Excel" produces a CSV, which Excel opens natively — note the BOM in
 * lib/csv.ts, without which Excel on Windows mangles every ₦.
 *
 * "PDF" opens the browser's print dialogue with a print stylesheet applied,
 * where "Save as PDF" is a built-in destination on every modern browser.
 * A real PDF generator would mean shipping a library for something the
 * platform already does.
 */
export function ExportMenu({
  onExcel,
  onPdf,
  disabled,
}: {
  onExcel: () => void;
  onPdf: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex min-h-11 items-center gap-2 rounded-field bg-white px-4 text-sm text-muted shadow-sm hover:text-heading disabled:opacity-50"
      >
        <Download className="size-4" aria-hidden="true" />
        Export
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-field border border-hairline bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExcel();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-body hover:bg-canvas"
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Excel
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onPdf();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-body hover:bg-canvas"
          >
            <FileText className="size-4" aria-hidden="true" />
            Pdf
          </button>
        </div>
      ) : null}
    </div>
  );
}
