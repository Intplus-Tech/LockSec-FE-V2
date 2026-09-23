"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { ExportMenu } from "@/components/admin/export-menu";
import { RowMenu } from "@/components/admin/row-menu";
import { TextField } from "@/components/ui/text-field";
import { FormError } from "@/components/ui/form-error";
import {
  getEstateProfile,
  listDues,
  listEstateTransactions,
} from "@/lib/api/endpoints/admin";
import { overdueFor, paidBy, periodTotal } from "@/lib/dues-math";
import { formatNaira } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { useDebounced } from "@/lib/hooks/use-debounced";
import { personFrom, type AdminTransaction } from "@/lib/schemas/admin";

const PER_PAGE = 10;

/**
 * Payments & Dues.
 *
 * NOTE ON THE STATUS FILTER. The design has a filter dropdown here, and there
 * used to be one filtering by transaction status. It has been removed.
 *
 * With paging done by the server, a client-side filter only sees the ten rows
 * currently loaded — so selecting "Failed" would show the failed payments on
 * *this page* while appearing to show all of them. A control that quietly
 * answers a different question than the one asked is worse than no control.
 *
 * The API has no status parameter yet. Once it does, this becomes a few lines
 * and the dropdown comes back.
 */
export function PaymentsAndDues() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const term = useDebounced(search);
  useEffect(() => setPage(1), [term]);

  const estate = useQuery({
    queryKey: ["estate", "profile"],
    queryFn: getEstateProfile,
  });

  const transactions = useQuery({
    queryKey: ["estate", "transactions", page, term],
    queryFn: () => listEstateTransactions({ page, limit: PER_PAGE, search: term }),
    placeholderData: (previous) => previous,
  });

  const dues = useQuery({ queryKey: ["estate", "dues"], queryFn: listDues });
  const balances = useQuery({
    queryKey: ["estate", "transactions", "for-balances"],
    queryFn: () => listEstateTransactions({ page: 1, limit: 100 }),
  });

  const rows = transactions.data?.value.data ?? [];
  const total = transactions.data?.value.total ?? 0;
  const pageCount = Math.max(Math.ceil(total / PER_PAGE), 1);
  const unavailable = transactions.data?.unavailable ?? transactions.isError;

  const expected = periodTotal(dues.data?.value ?? []);
  const allTx = balances.data?.value.data ?? [];

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
      cell: (row) => (
        <span className="font-mono text-muted">{row.tx_ref ?? "—"}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <span className="font-medium text-heading">
          {personFrom(row.userId).name}
        </span>
      ),
    },
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
      cell: (row) =>
        formatNaira(overdueFor(expected, paidBy(allTx, row.userId))),
    },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      hideBelow: "lg",
      cell: (row) =>
        row.duration
          ? `${row.duration} month${row.duration === 1 ? "" : "s"}`
          : "—",
    },
  ];

  const exportCsv = () => {
    downloadCsv(
      `payments-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Transaction Ref", "Name", "Address", "Date", "Amount", "Duration", "Status"],
      rows.map((tx) => {
        const person = personFrom(tx.userId);
        return [
          tx.tx_ref, person.name, person.address,
          tx.createdAt ? new Date(tx.createdAt).toISOString() : "",
          tx.amount, tx.duration, tx.status,
        ];
      }),
    );
  };

  return (
    <AdminShell
      title="Payments & Dues"
      breadcrumb="Payments & Dues"
      estateId={estate.data?._id}
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:gap-3">
            <div className="min-w-0 flex-1 sm:w-64 sm:flex-none">
              <label htmlFor="payment-search" className="sr-only">
                Search payments
              </label>
              <TextField
                id="payment-search"
                type="search"
                placeholder="Search Residents"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                icon={<Search className="size-4" />}
              />
            </div>

            <ExportMenu
              disabled={!rows.length}
              onExcel={exportCsv}
              onPdf={() => window.print()}
            />
          </div>
        </div>
      }
    >
      <p className="sr-only" role="status">
        {total} payments
      </p>

      {unavailable ? (
        <FormError
          message="We couldn't load payment records. Try again shortly."
          className="mb-4"
        />
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(row) => row._id}
        loading={transactions.isLoading}
        caption="Payments made across the estate"
        emptyTitle={
          unavailable
            ? "Payments couldn't be loaded"
            : term
              ? "No matching payments"
              : "No payments yet"
        }
        emptyDescription={
          unavailable
            ? "The server didn't respond. Try again shortly."
            : term
              ? "Try a different search."
              : "Payments made by residents will appear here."
        }
        rowAction={(row) => (
          /**
           * The design shows a three-dot menu here but never what is inside
           * it. Rather than invent items, this offers the one action the data
           * supports: look that resident up.
           */
          <RowMenu
            label={`Actions for ${personFrom(row.userId).name}`}
            items={[
              {
                label: "View resident",
                onSelect: () => {
                  const name = personFrom(row.userId).name;
                  if (name !== "—") {
                    window.location.href = `/admin/residents?q=${encodeURIComponent(name)}`;
                  }
                },
              },
            ]}
          />
        )}
      />

      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </AdminShell>
  );
}
