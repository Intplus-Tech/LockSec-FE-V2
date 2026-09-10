"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { RowMenu } from "@/components/admin/row-menu";
import { Pagination, paginate } from "@/components/admin/pagination";
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
import {
  overdueFor,
  paidBy,
  paymentStanding,
  periodTotal,
} from "@/lib/dues-math";
import { formatLongDate, formatNaira, titleCase } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { refId } from "@/lib/schemas/ref";
import type { AdminResident } from "@/lib/schemas/admin";

export function ResidentManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [standingFilter, setStandingFilter] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [pastPaymentFor, setPastPaymentFor] = useState<AdminResident | null>(
    null,
  );

  const estate = useQuery({
    queryKey: ["estate", "profile"],
    queryFn: getEstateProfile,
  });

  const residents = useQuery({
    queryKey: ["estate", "residents"],
    queryFn: () => listResidents(),
  });

  // Needed for the Total Dues and Overdues columns, which have no endpoint —
  // see lib/dues-math.ts for how they are derived and why.
  const dues = useQuery({ queryKey: ["estate", "dues"], queryFn: listDues });
  const transactions = useQuery({
    queryKey: ["estate", "transactions"],
    queryFn: () => listEstateTransactions(),
  });

  const remove = useMutation({
    mutationFn: deleteResident,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["estate", "residents"] }),
  });

  const all = residents.data?.value.data ?? [];
  const allTx = transactions.data?.value.data ?? [];
  const expected = periodTotal(dues.data?.value ?? []);

  /**
   * Filtering happens in the browser.
   *
   * The spec defines a `search` query parameter in its shared components but
   * does not attach it to /residents/estate, so there is no server-side
   * search to call. For an estate of a few hundred residents this is fine —
   * we already hold the whole list. It would not scale to thousands, at which
   * point the backend needs a real search parameter.
   */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return all.filter((resident) => {
      if (standingFilter) {
        const paid = paidBy(allTx, resident.userId, resident._id);
        if (paymentStanding(expected, paid) !== standingFilter) return false;
      }

      if (!term) return true;

      return [
        resident.firstName,
        resident.lastName,
        resident.email,
        resident.address,
        resident.phoneNumber,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [all, allTx, search, standingFilter, expected]);

  const pageCount = Math.ceil(filtered.length / 10);
  const rows = paginate(filtered, page, 10);

  const columns: Column<AdminResident>[] = [
    {
      key: "id",
      header: "Resident ID",
      // The Figma shows a short numeric id. Mongo ids are 24 hex characters,
      // so the last six are shown — enough to tell two rows apart, and the
      // full id is never useful to read aloud.
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
        formatNaira(
          overdueFor(expected, paidBy(allTx, row.userId, row._id)),
        ),
    },
  ];

  const exportCsv = () => {
    downloadCsv(
      `residents-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Resident ID", "First Name", "Last Name", "Email", "Phone", "Address", "Type", "Move-in date", "Total Dues", "Overdues"],
      filtered.map((r) => [
        r._id,
        r.firstName,
        r.lastName,
        r.email,
        r.phoneNumber,
        r.address,
        titleCase(r.role),
        formatLongDate(r.moveInDate),
        expected,
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
          <div className="w-36">
            <label htmlFor="standing-filter" className="sr-only">
              Filter residents
            </label>
            <select
              id="standing-filter"
              value={standingFilter}
              onChange={(event) => {
                setStandingFilter(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-field bg-white px-3 text-sm text-muted shadow-sm outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">All residents</option>
              <option value="overdue">Overdues</option>
              <option value="partial">Partial</option>
              <option value="on-time">On-Time</option>
            </select>
          </div>

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
      {/* Announced politely so a screen-reader user learns the result count
          changed as they type, without focus leaving the search box. */}
      <p className="sr-only" role="status">
        {search ? `${rows.length} residents match ${search}` : ""}
      </p>

      {residents.data?.unavailable ? (
        <FormError
          message="The server could not return your resident list. This is a backend problem, not a permissions one."
          className="mb-4"
        />
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(row) => row._id}
        loading={residents.isLoading}
        caption="Residents in this estate"
        emptyTitle={search ? "No matching residents" : "No residents yet"}
        emptyDescription={
          search
            ? "Try a different name, email or address."
            : "Add your first resident, or share the Resident App link in the sidebar."
        }
        rowAction={(row) => (
          <RowMenu
            label={`Actions for ${row.firstName ?? "resident"}`}
            items={[
              {
                label: "View Past Payment",
                onSelect: () => setPastPaymentFor(row),
              },
              {
                label: "Remove Resident",
                danger: true,
                onSelect: () => {
                  // A destructive, irreversible action gets a confirmation.
                  // The Figma says "Disable Resident", but the API only
                  // offers DELETE — see the note in PHASE-4.md.
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
 * "Chike Past Payment" in the Figma.
 *
 * The design shows "Payments Percentage: 72/75 (96% capacity)". Nothing in
 * the API produces that — there is no expected-payment count per resident. So
 * this shows the transactions we can actually attribute to them and leaves
 * the invented ratio out rather than fabricating one.
 */
function PastPaymentModal({
  resident,
  onClose,
}: {
  resident: AdminResident | null;
  onClose: () => void;
}) {
  const transactions = useQuery({
    queryKey: ["estate", "transactions"],
    queryFn: () => listEstateTransactions(1, 100),
    enabled: Boolean(resident),
  });

  const theirs = (transactions.data?.value.data ?? []).filter((tx) => {
    if (!resident) return false;
    const txUser = refId(tx.userId ?? undefined);
    return (
      Boolean(txUser) &&
      (txUser === refId(resident.userId ?? undefined) ||
        txUser === resident._id)
    );
  });

  const dues = useQuery({
    queryKey: ["estate", "dues"],
    queryFn: listDues,
    enabled: Boolean(resident),
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
      {/* "Payments Percentage" in the Figma. There is no expected-payment
          count per resident in the API, so this is the share of what they owe
          that they have paid, and it is labelled as an estimate. */}
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
                {tx.createdAt
                  ? new Date(tx.createdAt).toLocaleString("en-NG")
                  : "—"}
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
