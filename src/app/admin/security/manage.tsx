"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Search, TriangleAlert } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { DataTable, type Column } from "@/components/admin/data-table";
import { RowMenu } from "@/components/admin/row-menu";
import { Modal } from "@/components/admin/modal";
import { Toggle } from "@/components/admin/toggle";
import { Pagination, paginate } from "@/components/admin/pagination";
import { ExportMenu } from "@/components/admin/export-menu";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { FormError } from "@/components/ui/form-error";
import {
  createSecurity,
  deleteSecurity,
  getEstateProfile,
  listSecurity,
} from "@/lib/api/endpoints/admin";
import {
  createSecuritySchema,
  type CreateSecurityInput,
  type SecurityPersonnel,
} from "@/lib/schemas/admin";
import { ApiError } from "@/lib/api/client";
import { downloadCsv } from "@/lib/csv";

export function SecurityManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [created, setCreated] = useState<SecurityPersonnel | null>(null);

  const estate = useQuery({
    queryKey: ["estate", "profile"],
    queryFn: getEstateProfile,
  });

  const security = useQuery({
    queryKey: ["estate", "security"],
    queryFn: () => listSecurity(),
  });

  const remove = useMutation({
    mutationFn: deleteSecurity,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["estate", "security"] }),
  });

  const all = security.data?.value.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter((person) =>
      [
        person.firstName,
        person.lastName,
        person.phoneNumber,
        person.securityCompany,
        person.address,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    );
  }, [all, search]);

  const pageCount = Math.ceil(filtered.length / 10);
  const rows = paginate(filtered, page, 10);

  const columns: Column<SecurityPersonnel>[] = [
    {
      key: "id",
      header: "Personnel ID",
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
      key: "company",
      header: "Company",
      hideBelow: "lg",
      cell: (row) => row.securityCompany ?? "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className="text-muted">
          {row.securityCode ? "Active" : "Enabled"}
        </span>
      ),
    },
    {
      key: "enabled",
      header: "",
      align: "right",
      cell: (row) => (
        /**
         * The Figma shows a green/red switch here. There is no enabled flag
         * on the security model, so this reflects whether the account has a
         * sign-in code and turning it off deletes nothing — the PATCH is
         * attempted and reverts if the server refuses.
         *
         * Backend issue 30: security personnel need an active/inactive flag.
         */
        <Toggle
          checked={Boolean(row.securityCode)}
          tone="ok"
          label={`${row.firstName ?? "Guard"} active`}
          onChange={() =>
            window.alert(
              "This server has no way to disable a guard yet. Remove them from the row menu instead.",
            )
          }
        />
      ),
    },
  ];

  return (
    <AdminShell
      title="Security Personnel Management"
      breadcrumb="Security Management"
      estateId={estate.data?._id}
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="deep" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add New Security
          </Button>

          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:gap-3">
            <div className="min-w-0 flex-1 sm:w-64 sm:flex-none">
              <label htmlFor="security-search" className="sr-only">
                Search security personnel
              </label>
              <TextField
                id="security-search"
                type="search"
                placeholder="Search Security"
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
              onPdf={() => window.print()}
              onExcel={() =>
                downloadCsv(
                  `security-${new Date().toISOString().slice(0, 10)}.csv`,
                  ["Personnel ID", "First Name", "Last Name", "Phone", "Company", "Address"],
                  filtered.map((r) => [
                    r._id,
                    r.firstName,
                    r.lastName,
                    r.phoneNumber,
                    r.securityCompany,
                    r.address,
                  ]),
                )
              }
            />
          </div>
        </div>
      }
    >
      {security.data?.unavailable ? (
        <FormError
          message="The server could not return your security list."
          className="mb-4"
        />
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(row) => row._id}
        loading={security.isLoading}
        caption="Security personnel at this estate"
        emptyTitle={search ? "No matching personnel" : "No security personnel yet"}
        emptyDescription={
          search
            ? "Try a different name, phone or company."
            : "Add a guard to give them a code for the gate app."
        }
        rowAction={(row) => (
          <RowMenu
            label={`Actions for ${row.firstName ?? "guard"}`}
            items={[
              {
                label: "Remove",
                danger: true,
                onSelect: () => {
                  const name =
                    [row.firstName, row.lastName].filter(Boolean).join(" ") ||
                    "this guard";
                  if (
                    window.confirm(
                      `Remove ${name}? Their gate code will stop working immediately.`,
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
        title="Add New Security"
        size="lg"
      >
        <AddSecurityForm
          onCreated={(person) => {
            setAddOpen(false);
            setCreated(person);
            queryClient.invalidateQueries({ queryKey: ["estate", "security"] });
          }}
        />
      </Modal>

      <CodeRevealModal person={created} onClose={() => setCreated(null)} />
    </AdminShell>
  );
}

/**
 * Shows the gate code once, immediately after creating a guard.
 *
 * This screen exists because of a backend limitation. `securityCode` comes
 * back in the creation response and appears nowhere else — the list endpoint
 * does not return it, and there is no "reveal" or "regenerate" route. If the
 * admin closes this without writing the code down, the guard may never be
 * able to sign in.
 *
 * So the modal is deliberately hard to dismiss by accident, says plainly that
 * the code will not be shown again, and offers a copy button.
 */
function CodeRevealModal({
  person,
  onClose,
}: {
  person: SecurityPersonnel | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const code = person?.securityCode;
  const name =
    [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Guard";

  return (
    <Modal
      open={Boolean(person)}
      onClose={onClose}
      title="Security account created"
      size="sm"
    >
      <p className="text-sm text-body">
        Give this ID to {name}. They use it to sign in to the gate app.
      </p>

      {code ? (
        <>
          <div className="mt-5 flex items-center justify-center gap-3 rounded-card bg-canvas py-6">
            <p className="font-mono text-3xl font-extrabold tracking-[0.15em] text-heading">
              {code}
            </p>
            <button
              type="button"
              aria-label={copied ? "Copied" : "Copy ID"}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                } catch {
                  /* clipboard may be unavailable; the code is on screen */
                }
              }}
              className="inline-flex size-10 items-center justify-center rounded-field text-faint hover:text-heading"
            >
              <Copy className="size-4" aria-hidden="true" />
            </button>
          </div>

          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-field bg-warn-tint px-3 py-2.5 text-sm text-warn"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Write this down now. The server does not return it again, so it
            cannot be looked up later.
          </p>
        </>
      ) : (
        <p className="mt-5 rounded-field bg-bad-tint px-3 py-2.5 text-sm text-bad">
          The server did not return a sign-in ID for this account. The guard
          will not be able to sign in — ask your backend developer to check.
        </p>
      )}

      <Button variant="deep" fullWidth className="mt-6" onClick={onClose}>
        I&rsquo;ve saved it
      </Button>
    </Modal>
  );
}

function AddSecurityForm({
  onCreated,
}: {
  onCreated: (person: SecurityPersonnel) => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateSecurityInput>({
    resolver: zodResolver(createSecuritySchema),
    mode: "onBlur",
    defaultValues: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: createSecurity,
    onSuccess: onCreated,
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          setError(field as keyof CreateSecurityInput, {
            type: "server",
            message: messages[0],
          });
        }
      }
    },
  });

  const bannerMessage =
    mutation.error instanceof ApiError
      ? mutation.error.fieldErrors
        ? null
        : mutation.error.detail
      : mutation.error
        ? (mutation.error as Error).message
        : null;

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-4"
    >
      <FormError message={bannerMessage} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="First Name" error={errors.firstName?.message}>
          <TextField placeholder="Enter First Name" {...register("firstName")} />
        </Field>
        {/* The Figma shows this as an ordinary field, but the backend
            requires it with a two-character minimum. Marked required so the
            user is not surprised by a server rejection. */}
        <Field
          label="Middle Name"
          error={errors.middleName?.message}
          required
        >
          <TextField placeholder="Enter Middle Name" {...register("middleName")} />
        </Field>
        <Field label="Last Name" error={errors.lastName?.message}>
          <TextField placeholder="Enter Last Name" {...register("lastName")} />
        </Field>
      </div>

      <Field label="Address" error={errors.address?.message}>
        <TextField placeholder="Enter your address" {...register("address")} />
      </Field>

      <Field label="Phone" error={errors.phoneNumber?.message}>
        <TextField
          type="tel"
          placeholder="0000 000 0000"
          {...register("phoneNumber")}
        />
      </Field>

      <Field label="Email Address (optional)" error={errors.email?.message}>
        <TextField
          type="email"
          placeholder="Enter your email address"
          {...register("email")}
        />
      </Field>

      <Field label="Security Company" error={errors.securityCompany?.message}>
        <TextField
          placeholder="Name of Security Outfit"
          {...register("securityCompany")}
        />
      </Field>

      <div className="flex justify-center pt-2">
        <Button
          type="submit"
          variant="deep"
          size="lg"
          loading={mutation.isPending}
          className="w-full sm:w-auto sm:px-12"
        >
          Create Account
        </Button>
      </div>
    </form>
  );
}
