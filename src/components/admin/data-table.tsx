"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * The table used on every admin list screen.
 *
 * `columns` describes the shape once; each row renders through it. That keeps
 * the header and the cells in step — the classic table bug is adding a column
 * to one and forgetting the other, and a shared definition makes it
 * impossible.
 *
 * On accessibility: <th scope="col"> is what lets a screen reader say "Name:
 * Adeola Bello" when reading a cell, rather than reciting bare values with no
 * idea which column they belong to. It is one attribute and it is the
 * difference between a usable table and a wall of noise.
 */

export interface Column<T> {
  key: string;
  header: string;
  /** Renders the cell. Given the whole row, so it can combine fields. */
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right";
  /** Hidden below this breakpoint, to keep narrow screens readable. */
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
  /** Rendered in a final, right-aligned column — the row's menu button. */
  rowAction?: (row: T) => React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label={caption}>
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-2 text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "bg-canvas px-4 py-3 text-left font-semibold text-heading first:rounded-l-field",
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
  );
}
