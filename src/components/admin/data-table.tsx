"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * The table used on every admin list screen.
 *
 * RESPONSIVE STRATEGY. Below `md` this stops being a table and becomes a list
 * of cards, one per row, with each cell labelled.
 *
 * The alternatives are worse. Horizontal scrolling hides columns behind a
 * gesture people frequently do not discover, and on a touch screen it fights
 * with the page's own vertical scroll. Shrinking the text to fit seven columns
 * into 375px produces something nobody can read. Hiding columns means the
 * mobile user simply cannot see data that exists.
 *
 * Cards mean a phone user sees *every* field, just stacked. It is more
 * scrolling and no loss of information, which is the right trade on a device
 * people are already scrolling on.
 *
 * `columns` still describes the shape once, so the table and the cards can
 * never drift apart — the classic bug of adding a column to one and
 * forgetting the other is impossible.
 */

export interface Column<T> {
  key: string;
  header: string;
  /** Renders the cell. Given the whole row, so it can combine fields. */
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right";
  /**
   * Hidden below this breakpoint in TABLE mode. Card mode ignores it — on a
   * card there is room for everything.
   */
  hideBelow?: "sm" | "md" | "lg";
}

const hideClasses = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

export function DataTable<T>({
  columns,
  rows,
  keyOf,
  loading,
  emptyTitle,
  emptyDescription,
  caption,
  rowAction,
}: {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  loading?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  caption: string;
  rowAction?: (row: T) => React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label={caption}>
        <Skeleton className="hidden h-12 w-full md:block" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full md:h-14" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      {/* Cards — phones and small tablets */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={keyOf(row)}
            className="rounded-card border border-hairline bg-white p-4"
          >
            <dl className="space-y-2.5">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="flex items-start justify-between gap-4"
                >
                  <dt className="shrink-0 text-xs font-medium text-muted">
                    {column.header}
                  </dt>
                  <dd className="min-w-0 break-words text-right text-sm text-heading">
                    {column.cell(row)}
                  </dd>
                </div>
              ))}
            </dl>

            {rowAction ? (
              <div className="mt-3 flex justify-end border-t border-hairline pt-3">
                {rowAction(row)}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {/* Table — tablets and up */}
      <div className="hidden md:block">
        <table className="w-full border-separate border-spacing-y-2 text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap bg-canvas px-4 py-3 text-left font-semibold text-heading first:rounded-l-field",
                    column.align === "right" && "text-right",
                    column.hideBelow && hideClasses[column.hideBelow],
                    !rowAction && "last:rounded-r-field",
                  )}
                >
                  {column.header}
                </th>
              ))}
              {rowAction ? (
                <th scope="col" className="rounded-r-field bg-canvas px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={keyOf(row)} className="bg-white">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "border-y border-hairline px-4 py-4 first:rounded-l-field first:border-l last:rounded-r-field last:border-r",
                      column.align === "right" && "text-right",
                      column.hideBelow && hideClasses[column.hideBelow],
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {rowAction ? (
                  <td className="rounded-r-field border-y border-r border-hairline px-4 py-4 text-right">
                    {rowAction(row)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
