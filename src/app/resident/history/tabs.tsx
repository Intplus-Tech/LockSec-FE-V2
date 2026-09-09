"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import {
  listMyAccessCodes,
  listMyTransactions,
} from "@/lib/api/endpoints/resident";
import { formatNaira, formatShortDate, titleCase } from "@/lib/format";

type Tab = "access-code" | "payment";

/**
 * Two tabs over two different endpoints.
 *
 * The active tab lives in the URL (?tab=payment) rather than component state.
 * That makes it shareable, survivable across a refresh, and correct when the
 * browser back button is used — three things local state gets wrong for free.
 *
 * Built with real tab semantics: role="tablist", aria-selected, and arrow-key
 * navigation between tabs, which is what a screen-reader user expects when
 * they hear "tab, 1 of 2".
 */
export function HistoryTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "payment" ? "payment" : "access-code";

  const setTab = (next: Tab) => {
    router.replace(`/resident/history?tab=${next}`, { scroll: false });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "access-code", label: "Access Code" },
    { id: "payment", label: "Payment" },
  ];

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = tabs.findIndex((t) => t.id === tab);
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : (index - 1 + tabs.length) % tabs.length;
    setTab(tabs[next].id);
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="History type"
        onKeyDown={onKeyDown}
        className="flex border-b border-hairline"
      >
        {tabs.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              id={`tab-${item.id}`}
              aria-selected={active}
              aria-controls={`panel-${item.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(item.id)}
              className={cn(
                "min-h-11 flex-1 border-b-2 px-2 pb-2 text-sm transition-colors",
                active
                  ? "border-heading font-semibold text-heading"
                  : "border-transparent text-faint hover:text-body",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="pt-6"
      >
        {tab === "access-code" ? <AccessCodeTable /> : <PaymentTable />}
      </div>
    </div>
  );
}

function AccessCodeTable() {
  const query = useQuery({
    queryKey: ["access-codes", "mine"],
    queryFn: () => listMyAccessCodes(1, 50),
  });

  if (query.isLoading) return <TableSkeleton columns={3} />;
  if (query.isError) {
    return <FormError message="We couldn't load your access codes." />;
  }

  // The endpoint is currently throwing a 500 on the backend. Say that this
  // is a server problem rather than showing "no codes yet", which would be
  // untrue and would make a resident think their codes had vanished.
  if (query.data?.unavailable) {
    return (
      <EmptyState
        title="Codes can't be listed right now"
        description="The server had a problem loading your access codes. Your codes still work — this list will come back."
      />
    );
  }

  const rows = query.data?.value ?? [];

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No access codes yet"
        description="Codes you create for visitors will appear here."
        action={
          <Button
            onClick={() => {
              window.location.href = "/resident/access-codes/new";
            }}
          >
            Generate a code
          </Button>
        }
      />
    );
  }

  return (
    // overflow-x-auto so a long name scrolls the table rather than the page.
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[19rem] text-left text-sm">
        <caption className="sr-only">Access codes you have created</caption>
        <thead>
          <tr className="border-b border-hairline">
            <Th>Name</Th>
            <Th>Type</Th>
            <Th align="right">Code</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id} className="border-b border-hairline last:border-0">
              <Td>
                <Link
                  href={`/resident/access-codes/${row._id}`}
                  className="font-semibold text-heading underline-offset-4 hover:underline"
                >
                  {[row.firstName, row.lastName].filter(Boolean).join(" ") ||
                    "—"}
                </Link>
              </Td>
              <Td className="text-muted">{titleCase(row.visitorType)}</Td>
              <Td align="right" className="font-mono text-muted">
                {row.code}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentTable() {
  const query = useQuery({
    queryKey: ["transactions", "mine"],
    queryFn: () => listMyTransactions(1, 50),
  });

  if (query.isLoading) return <TableSkeleton columns={4} />;
  if (query.isError) {
    return <FormError message="We couldn't load your payments." />;
  }

  if (query.data?.unavailable) {
    return (
      <EmptyState
        title="Payments can't be listed right now"
        description="The server had a problem loading your payment history. Try again shortly."
      />
    );
  }

  const rows = query.data?.value ?? [];

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No payments yet"
        description="Estate dues and other payments you make will be listed here."
      />
    );
  }

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[22rem] text-left text-sm">
        <caption className="sr-only">Payments you have made</caption>
        <thead>
          <tr className="border-b border-hairline">
            <Th>Reference</Th>
            <Th>Date</Th>
            <Th align="right">Amount</Th>
            <Th align="right">Months</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id} className="border-b border-hairline last:border-0">
              <Td className="font-mono text-muted">{row.tx_ref ?? "—"}</Td>
              <Td className="text-muted">{formatShortDate(row.createdAt)}</Td>
              <Td align="right" className="text-muted">
                {formatNaira(row.amount)}
              </Td>
              <Td align="right" className="text-muted">
                {row.duration ?? "—"}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "pb-3 font-semibold text-heading",
        align === "right" && "text-right",
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td className={cn("py-4", align === "right" && "text-right", className)}>
      {children}
    </td>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading history">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, row) => (
        <div key={row} className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
