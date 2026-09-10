"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { StatCard } from "@/components/admin/stat-card";
import { DuesChart } from "@/components/admin/line-chart";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StandingBadge } from "@/components/admin/standing-badge";
import { PlanModal } from "@/components/admin/plan-modal";
import { Pagination, paginate } from "@/components/admin/pagination";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/format";
import {
  getEstateProfile,
  listEstateSubscriptions,
  listEstateTransactions,
  listResidents,
} from "@/lib/api/endpoints/admin";
import { personFrom, type AdminTransaction } from "@/lib/schemas/admin";
import { listDues } from "@/lib/api/endpoints/admin";
import { overdueFor, paidBy, paymentStanding, periodTotal } from "@/lib/dues-math";

const PERIODS = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
] as const;

const PER_PAGE = 8;

export function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<string>("month");
  const [page, setPage] = useState(1);
  const [planOpen, setPlanOpen] = useState(false);

  const estate = useQuery({
    queryKey: ["estate", "profile"],
    queryFn: getEstateProfile,
  });

  const transactions = useQuery({
    queryKey: ["estate", "transactions"],
    queryFn: () => listEstateTransactions(),
  });

  const residents = useQuery({
    queryKey: ["estate", "residents"],
    queryFn: () => listResidents(),
  });

  const dues = useQuery({ queryKey: ["estate", "dues"], queryFn: listDues });

  const subscription = useQuery({
    queryKey: ["estate", "subscription"],
    queryFn: listEstateSubscriptions,
  });

  const txUnavailable = transactions.data?.unavailable ?? false;
  const residentsUnavailable = residents.data?.unavailable ?? false;

  const allTx = transactions.data?.value.data ?? [];
  const duesList = dues.data?.value ?? [];
  const expected = periodTotal(duesList);

  const { collected, monthly, collectedPct } = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 12 }, () => 0);
    let inPeriod = 0;
    let successTotal = 0;

    for (const tx of allTx) {
      const paid = tx.status?.toLowerCase() === "success";
      if (!tx.createdAt || !paid) continue;

      const date = new Date(tx.createdAt);
      if (Number.isNaN(date.getTime())) continue;

      // Only the current year, or December 2025 and December 2026 would be
      // added together and the chart would lie.
      if (date.getFullYear() !== now.getFullYear()) continue;

      buckets[date.getMonth()] += tx.amount ?? 0;
      successTotal += tx.amount ?? 0;

      const sameMonth = date.getMonth() === now.getMonth();
      const sameQuarter =
        Math.floor(date.getMonth() / 3) === Math.floor(now.getMonth() / 3);

      if (
        (period === "month" && sameMonth) ||
        (period === "quarter" && sameQuarter) ||
        period === "year"
      ) {
        inPeriod += tx.amount ?? 0;
      }
    }

    // "Due Collected" as a share of what the estate expects per period from
    // every resident. An estimate — see lib/dues-math.ts.
    const residentCount = residents.data?.value.total ?? 0;
    const expectedTotal = expected * residentCount;

    return {
      collected: inPeriod,
      monthly: buckets,
      collectedPct: expectedTotal
        ? Math.min(Math.round((successTotal / expectedTotal) * 100), 100)
        : 0,
    };
  }, [allTx, period, expected, residents.data?.value.total]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allTx;
    return allTx.filter((tx) => {
      const person = personFrom(tx.userId);
      return [tx.tx_ref, person.name, person.address]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [allTx, search]);

  const pageCount = Math.ceil(filtered.length / PER_PAGE);
  const rows = paginate(filtered, page, PER_PAGE);

  const columns: Column<AdminTransaction>[] = [
    {
      key: "time",
      header: "Time",
      cell: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleTimeString("en-NG", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
    },
    {
      key: "ref",
      header: "Transaction Ref",
      cell: (row) => <span className="font-mono text-muted">{row.tx_ref ?? "—"}</span>,
    },
    { key: "name", header: "Name", cell: (row) => personFrom(row.userId).name },
    {
      key: "address",
      header: "Address",
      hideBelow: "md",
      cell: (row) => personFrom(row.userId).address,
    },
    {
      key: "amount",
      header: "Amount Paid",
      align: "right",
      cell: (row) => formatNaira(row.amount),
    },
    {
      key: "overdue",
      header: "Overdue",
      align: "right",
      hideBelow: "sm",
      cell: (row) => {
        return formatNaira(overdueFor(expected, paidBy(allTx, row.userId)));
      },
    },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      hideBelow: "lg",
      cell: (row) =>
        row.duration ? `${row.duration} month${row.duration === 1 ? "" : "s"}` : "—",
    },
    {
      key: "status",
      header: "Status",
      hideBelow: "sm",
      cell: (row) => {
        return (
          <StandingBadge
            standing={paymentStanding(expected, paidBy(allTx, row.userId))}
          />
        );
      },
    },
  ];

  const hasSubscription =
    Boolean(subscription.data?.value) &&
    Object.keys(subscription.data?.value ?? {}).length > 0;

  return (
    <AdminShell
      title="Dashboard"
      breadcrumb="Dashboard"
      estateId={estate.data?._id}
      search={{
        value: search,
        onChange: (value) => {
          setSearch(value);
          setPage(1);
        },
      }}
    >
      <section className="rounded-card bg-white/60 p-4 sm:p-5 lg:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_2fr] lg:gap-6">
          <div>
            <h2 className="font-bold text-heading">Estate Info.</h2>
            {estate.isLoading ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              /**
               * The Figma shows a street address here. The estate record has
               * no address field — the API returns estateName, fullName,
               * email and phoneNumber only. So this shows the contact details
               * that do exist rather than a permanent "Address not set".
               *
               * Backend issue 29: add an address to the estate model.
               */
              <div className="mt-3 space-y-1 text-sm text-muted">
                <p className="font-medium text-heading">
                  {estate.data?.estateName ?? "—"}
                </p>
                {estate.data?.fullName ? <p>{estate.data.fullName}</p> : null}
                {estate.data?.email ? (
                  <p className="break-all">{estate.data.email}</p>
                ) : null}
                {estate.data?.phoneNumber ? (
                  <p>{estate.data.phoneNumber}</p>
                ) : null}
              </div>
            )}

            {!hasSubscription && !subscription.isLoading ? (
              <button
                type="button"
                onClick={() => setPlanOpen(true)}
                className="mt-4 text-sm font-medium text-brand underline underline-offset-4"
              >
                Choose a plan
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 min-[420px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <StatCard
              value={formatNaira(collected)}
              label={`Amount Collected ${PERIODS.find((p) => p.value === period)?.label ?? ""}`}
              loading={transactions.isLoading}
              unavailable={txUnavailable}
            />
            <StatCard
              value={String(residents.data?.value.total ?? 0)}
              label="No. of Users"
              loading={residents.isLoading}
              unavailable={residentsUnavailable}
            />
            <StatCard
              value={`${collectedPct}%`}
              label="Due Collected"
              loading={transactions.isLoading || dues.isLoading}
              unavailable={txUnavailable}
            />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-card bg-white p-4 shadow-sm sm:mt-5 sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="font-bold text-heading">Dues Payment</h2>
            <div className="w-36">
              <label htmlFor="chart-period" className="sr-only">
                Chart period
              </label>
              <SelectField
                id="chart-period"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                options={PERIODS}
                className="h-9 border-transparent bg-canvas"
              />
            </div>
          </div>

          <BarChart3 className="size-5 text-brand" aria-hidden="true" />
        </div>

        {transactions.isLoading ? (
          <Skeleton className="mt-6 h-56 w-full" />
        ) : txUnavailable ? (
          <p className="py-16 text-center text-sm text-muted">
            Payment data is unavailable right now.
          </p>
        ) : (
          <div className="mt-6">
            <DuesChart values={monthly} />
          </div>
        )}
      </section>

      <section className="mt-5">
        <h2 className="sr-only">Recent transactions</h2>
        <DataTable
          columns={columns}
          rows={rows}
          keyOf={(row) => row._id}
          loading={transactions.isLoading}
          caption="Recent transactions across the estate"
          emptyTitle={
            txUnavailable ? "Transactions unavailable" : "No transactions yet"
          }
          emptyDescription={
            txUnavailable
              ? "The server could not return payment records."
              : "Payments made by residents will appear here."
          }
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </section>

      <PlanModal open={planOpen} onClose={() => setPlanOpen(false)} />
    </AdminShell>
  );
}
