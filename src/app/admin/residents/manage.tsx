"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { RowMenu } from "@/components/admin/row-menu";
import { Pagination } from "@/components/admin/pagination";
import { ExportMenu } from "@/components/admin/export-menu";
import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { FormError } from "@/components/ui/form-error";
import { AddResidentForm } from "./add-form";
import {
  deleteResident,
  getEstateProfile,
  listDues,
  listEstateTransactions,
  listResidents,
} from "@/lib/api/endpoints/admin";
import { overdueFor, paidBy, periodTotal } from "@/lib/dues-math";
import { formatLongDate, formatNaira, titleCase } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { refId } from "@/lib/schemas/ref";
import { useDebounced } from "@/lib/hooks/use-debounced";
import type { AdminResident } from "@/lib/schemas/admin";

const PER_PAGE = 10;

export function ResidentManagement() {
  const queryClient = useQueryClient();

  /**
   * The search box starts from the URL, so ?search=… works as a link.
   *
   * That is what makes "View resident" on the Payments page possible: it can
   * hand this screen something to look up. Previously the search lived only
   * in component state, so arriving with a query in the URL landed on an
   * unfiltered list and quietly ignored it.
   */
  const params = useSearchParams();
  const [search, setSearch] = useState(() => params.get("search") ?? "");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [pastPaymentFor, setPastPaymentFor] = useState<AdminResident | null>(null);

  /**
   * Searching and paging now happen on the server. The typed value is
   * debounced so one request is sent for what the user meant, rather than one
   * per keystroke arriving out of order.
   */
  const term = useDebounced(search);

  // A new search has its own page 1; staying on page 4 of the old results
  // would show an empty table and look broken.
  useEffect(() => setPage(1), [term]);

  const estate = useQuery({
    queryKey: ["estate", "profile"],
    queryFn: getEstateProfile,
  });

  const residents = useQuery({
    queryKey: ["estate", "residents", page, term],
    queryFn: () => listResidents({ page, limit: PER_PAGE, search: term }),
    // Keeps the current rows on screen while the next page loads, so the
    // table does not flash empty between pages.
    placeholderData: (previous) => previous,
  });

  /**
   * Total Dues and Overdues are still derived — there is no per-resident
   * balance in the API. These two calls fetch the estate's bills and a slice
   * of its payments to work them out. See lib/dues-math.ts for the assumption
   * involved and why it is only an estimate.
   */
  const dues = useQuery({ queryKey: ["estate", "dues"], queryFn: listDues });
  const transactions = useQuery({
    queryKey: ["estate", "transactions", "for-balances"],
    queryFn: () => listEstateTransactions({ page: 1, limit: 100 }),
  });

  const remove = useMutation({
    mutationFn: deleteResident,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["estate", "residents"] }),
  });

  const rows = residents.data?.value.data ?? [];
  const total = residents.data?.value.total ?? 0;
  const pageCount = Math.max(Math.ceil(total / PER_PAGE), 1);
  const unavailable = residents.data?.unavailable ?? residents.isError;

  const allTx = transactions.data?.value.data ?? [];
  const expected = useMemo(
    () => periodTotal(dues.data?.value ?? []),
    [dues.data],
  );

  const columns: Column<AdminResident>[] = [
    {
      key: "id",
      header: "Resident ID",
      // Mongo ids are 24 characters; the last six are enough to tell two rows
      // apart, and the full id is never useful to read aloud.
      cell: (row) => (
        <span className="font-mono text-muted">{row._id.slice(-6)}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <span className="font-medium text-heading">
          {[row.firstName, row.lastName].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    },
    {
      key: "address",
      header: "Address",
      hideBelow: "sm",
      cell: (row) => row.address ?? "—",
    },
    {
      key: "phone",
      header: "Phone",
      hideBelow: "md",
      cell: (row) => row.phoneNumber ?? "—",
    },
    {
      key: "email",
      header: "Email",
      hideBelow: "lg",
      cell: (row) => (
        <span className="break-all text-muted">{row.email ?? "—"}</span>
      ),
    },
    {
      key: "dues",
      header: "Total Dues",
      align: "right",
      hideBelow: "sm",
      cell: () => formatNaira(expected),
    },
    {
      key: "overdue",
      header: "Overdues",
      align: "right",
      cell: (row) =>
        formatNaira(overdueFor(expected, paidBy(allTx, row.userId, row._id))),
    },
  ];

  /**
   * Export covers the current page only.
   *
   * With server-side paging the browser holds one page at a time, so this is
   * what we actually have. Exporting a whole estate would mean walking every
   * page — worth adding if anyone asks, but silently exporting ten rows and
   * calling it "all residents" would be the worse option.
   */
  const exportCsv = () => {
    downloadCsv(
      `residents-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Resident ID", "First Name", "Last Name", "Email", "Phone", "Address",
       "Type", "Move-in date", "Total Dues", "Overdues"],
      rows.map((r) => [
        r._id, r.firstName, r.lastName, r.email, r.phoneNumber, r.address,
        titleCase(r.role), formatLongDate(r.moveInDate), expected,
        overdueFor(expected, paidBy(allTx, r.userId, r._id)),
      ]),
    );
  };

  return (
    <AdminShell
      title="Resident Management"
      breadcrumb="Resident Management"
      estateId={estate.data?._id}
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="deep" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add New Resident
          </Button>

          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:gap-3">
            <div className="min-w-0 flex-1 sm:w-64 sm:flex-none">
              <label htmlFor="resident-search" className="sr-only">
                Search residents
              </label>
              <TextField
                id="resident-search"
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
        {term ? `${total} residents match ${term}` : `${total} residents`}
      </p>

      {unavailable ? (
        <FormError
          message="We couldn't load your resident list. This is a server problem, not a permissions one."
          className="mb-4"
        />
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(row) => row._id}
        loading={residents.isLoading}
        caption="Residents in this estate"
        emptyTitle={
          unavailable
            ? "Residents couldn't be loaded"
            : term
              ? "No matching residents"
              : "No residents yet"
        }
        emptyDescription={
          unavailable
            ? "The server didn't respond. Try again shortly."
            : term
              ? "Try a different name, email or address."
              : "Add your first resident, or share the Resident App link in the sidebar."
        }
        rowAction={(row) => (
          <RowMenu
            label={`Actions for ${row.firstName ?? "resident"}`}
            items={[
              { label: "View Past Payment", onSelect: () => setPastPaymentFor(row) },
              {
                label: "Remove Resident",
                danger: true,
                onSelect: () => {
                  // Destructive and irreversible. The design says "Disable",
                  // but the API only offers delete.
                  const name =
                    [row.firstName, row.lastName].filter(Boolean).join(" ") ||
                    "this resident";
                  if (
                    window.confirm(
                      `Remove ${name}? This deletes their account and cannot be undone.`,
                    )
                  ) {
                    remove.mutate(row._id);
                  }
                },
              },
            ]}
          />
        )}
      />

      <Pagination page={page} pageCount={pageCount} onChange={setPage} />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Resident"
        size="lg"
      >
        <AddResidentForm
          estateId={estate.data?._id}
          onDone={() => {
            setAddOpen(false);
            queryClient.invalidateQueries({ queryKey: ["estate", "residents"] });
          }}
        />
      </Modal>

      <PastPaymentModal
        resident={pastPaymentFor}
        onClose={() => setPastPaymentFor(null)}
      />
    </AdminShell>
  );
}

/**
 * "Chike Past Payment" in the design.
 *
 * The design shows "Payments Percentage: 72/75". Nothing in the API produces
 * that, so this shows the share of one period's dues the resident has paid,
 * labelled as such.
 */
function PastPaymentModal({
  resident,
  onClose,
}: {
  resident: AdminResident | null;
  onClose: () => void;
}) {
  const transactions = useQuery({
    queryKey: ["estate", "transactions", "for-balances"],
    queryFn: () => listEstateTransactions({ page: 1, limit: 100 }),
    enabled: Boolean(resident),
  });

  const dues = useQuery({
    queryKey: ["estate", "dues"],
    queryFn: listDues,
    enabled: Boolean(resident),
  });

  const theirs = (transactions.data?.value.data ?? []).filter((tx) => {
    if (!resident) return false;
    const txUser = refId(tx.userId ?? undefined);
    return (
      Boolean(txUser) &&
      (txUser === refId(resident.userId ?? undefined) || txUser === resident._id)
    );
  });

  const expectedForResident = periodTotal(dues.data?.value ?? []);
  const total = theirs.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
  const name =
    [resident?.firstName, resident?.lastName].filter(Boolean).join(" ") ||
    "Resident";

  return (
    <Modal
      open={Boolean(resident)}
      onClose={onClose}
      title={`${name} — Past Payment`}
      size="lg"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-hairline pb-4">
        <h3 className="text-lg font-bold text-heading">Payments Percentage:</h3>
        <p className="text-muted">
          {expectedForResident > 0
            ? `${Math.min(Math.round((total / expectedForResident) * 100), 100)}% of one period`
            : "No dues configured"}
        </p>
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-bold text-heading">Payment History</h3>
        <p className="text-lg font-bold text-heading">{formatNaira(total)}</p>
      </div>

      {transactions.isLoading ? (
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      ) : theirs.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          No payments recorded for this resident.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {theirs.map((tx) => (
            <li
              key={tx._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-field border border-hairline px-4 py-3 text-sm"
            >
              <span className="font-mono text-muted">{tx.tx_ref ?? "—"}</span>
              <span className="text-muted">
                {tx.createdAt ? new Date(tx.createdAt).toLocaleString("en-NG") : "—"}
              </span>
              <span className="font-medium text-heading">
                {formatNaira(tx.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
