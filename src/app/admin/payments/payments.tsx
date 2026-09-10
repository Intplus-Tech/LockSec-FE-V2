"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Pagination, paginate } from "@/components/admin/pagination";
import { ExportMenu } from "@/components/admin/export-menu";
import { RowMenu } from "@/components/admin/row-menu";
import { TextField } from "@/components/ui/text-field";
import { SelectField } from "@/components/ui/select-field";
import { FormError } from "@/components/ui/form-error";
import {
  getEstateProfile,
  listDues,
  listEstateTransactions,
} from "@/lib/api/endpoints/admin";
import { overdueFor, paidBy, periodTotal } from "@/lib/dues-math";
import { formatNaira } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { personFrom, type AdminTransaction } from "@/lib/schemas/admin";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "success", label: "Successful" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
] as const;

export function PaymentsAndDues() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const estate = useQuery({
    queryKey: ["estate", "profile"],
    queryFn: getEstateProfile,
  });

  const transactions = useQuery({
    queryKey: ["estate", "transactions"],
    queryFn: () => listEstateTransactions(),
  });

  const dues = useQuery({ queryKey: ["estate", "dues"], queryFn: listDues });

  const all = transactions.data?.value.data ?? [];
  const expected = periodTotal(dues.data?.value ?? []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return all.filter((tx) => {
      if (status && tx.status?.toLowerCase() !== status) return false;
      if (!term) return true;

      const person = personFrom(tx.userId);
      return [tx.tx_ref, person.name, person.address]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [all, search, status]);

  const pageCount = Math.ceil(filtered.length / 10);
  const rows = paginate(filtered, page, 10);

  /**
   * The Figma's filter reads "Overdues". There is no overdue concept in the
   * API — a transaction has a status of pending, success or failed, and
   * nothing says what a resident *should* have paid by now. Filtering by
   * status is the honest version of the same control.
   */
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
      cell: (row) => {
        return formatNaira(overdueFor(expected, paidBy(all, row.userId)));
      },
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
      `payments-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Transaction Ref", "Name", "Address", "Date", "Amount", "Duration", "Status"],
      filtered.map((tx) => {
        const person = personFrom(tx.userId);
        return [
          tx.tx_ref,
          person.name,
          person.address,
          tx.createdAt ? new Date(tx.createdAt).toISOString() : "",
          tx.amount,
          tx.duration,
          tx.status,
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
          <div className="w-40">
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <SelectField
              id="status-filter"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              options={STATUS_FILTERS}
            />
          </div>

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
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                icon={<Search className="size-4" />}
              />
            </div>

            <ExportMenu
              disabled={!filtered.length}
              onExcel={exportCsv}
              onPdf={() => window.print()}
            />
          </div>
        </div>
      }
    >
      <p className="sr-only" role="status">
        {filtered.length} payments shown
      </p>

      {transactions.data?.unavailable ? (
        <FormError
          message="The server could not return payment records."
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
          search || status ? "No matching payments" : "No payments yet"
        }
        emptyDescription={
          search || status
            ? "Try a different search or filter."
            : "Payments made by residents will appear here."
        }
        rowAction={(row) => (
          /**
           * The Figma shows the three-dot affordance on this table but never
           * what is inside it. Rather than invent menu items, this offers the
           * one action the data supports: jump to that resident's record.
           * Ask your designer what else belongs here.
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
