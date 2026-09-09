"use client";

import { ChevronLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The numbered pager from the Figma: ‹ 1 2 3 4 5 … 10 Next ».
 *
 * It paginates rows already in memory. The backend caps a page at 100 records
 * and has no search parameter, so fetching page by page from the server would
 * mean search could only ever look at the current page — worse than useless.
 * Holding up to 100 and paging locally is the honest trade until the backend
 * supports server-side search.
 */
export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  // Show the first, the last, and a window around the current page, with an
  // ellipsis for the gap. Rendering fifty page buttons helps nobody.
  const numbers: (number | "gap")[] = [];
  for (let n = 1; n <= pageCount; n += 1) {
    if (n === 1 || n === pageCount || Math.abs(n - page) <= 1) {
      numbers.push(n);
    } else if (numbers[numbers.length - 1] !== "gap") {
      numbers.push("gap");
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="inline-flex size-9 items-center justify-center rounded-field text-muted disabled:opacity-40"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      {numbers.map((n, index) =>
        n === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-field text-sm",
              n === page
                ? "bg-brand-deep font-semibold text-white"
                : "text-body hover:bg-white",
            )}
          >
            {n}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        className="rounded-field bg-white px-3 py-2 text-sm text-body shadow-sm disabled:opacity-40"
      >
        Next
      </button>

      <button
        type="button"
        onClick={() => onChange(pageCount)}
        disabled={page === pageCount}
        aria-label="Last page"
        className="inline-flex size-9 items-center justify-center rounded-field bg-white text-muted shadow-sm disabled:opacity-40"
      >
        <ChevronsRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

/** Slices rows for the current page. */
export function paginate<T>(rows: T[], page: number, perPage: number) {
  const start = (page - 1) * perPage;
  return rows.slice(start, start + perPage);
}
