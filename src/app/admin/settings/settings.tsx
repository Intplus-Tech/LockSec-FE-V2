"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { Modal } from "@/components/admin/modal";
import { Toggle } from "@/components/admin/toggle";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { SelectField } from "@/components/ui/select-field";
import { PasswordField } from "@/components/ui/password-field";
import { FormError } from "@/components/ui/form-error";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  changePassword,
  createDue,
  deleteDue,
  getEstateProfile,
  listDues,
  updateDue,
  updateEstateSettings,
} from "@/lib/api/endpoints/admin";
import {
  DURATIONS,
  dueFormSchema,
  type AdminDue,
  type DueFormInput,
} from "@/lib/schemas/admin";
import { formatNaira, titleCase } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type Tab = "password" | "dues";

export function SettingsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "password" ? "password" : "dues";

  const estate = useQuery({
    queryKey: ["estate", "profile"],
    queryFn: getEstateProfile,
  });

  const setTab = (next: Tab) =>
    router.replace(`/admin/settings?tab=${next}`, { scroll: false });

  return (
    <AdminShell
      title="Settings"
      breadcrumb={`Settings / ${tab === "password" ? "Update Password" : "Dues"}`}
      estateId={estate.data?._id}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-5">
        <nav
          aria-label="Settings sections"
          className="h-fit overflow-hidden rounded-card bg-white shadow-sm"
        >
          {/* A vertical list of two items wastes a whole screen on a phone,
              so below `lg` it becomes a horizontal strip with the active
              marker moving from the left edge to the bottom. */}
          <ul className="flex lg:block">
            {(
              [
                { id: "password", label: "Update Password" },
                { id: "dues", label: "Dues" },
              ] as const
            ).map((item) => (
              <li key={item.id} className="flex-1 lg:flex-none">
                <button
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={tab === item.id ? "page" : undefined}
                  className={cn(
                    "w-full px-4 py-3.5 text-sm transition-colors",
                    "border-b-2 lg:border-b-0 lg:border-l-2 lg:px-6 lg:py-4 lg:text-left",
                    tab === item.id
                      ? "border-brand-deep font-medium text-brand-deep"
                      : "border-transparent text-body hover:bg-canvas",
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="rounded-card bg-white p-4 shadow-sm sm:p-5 lg:p-7">
          {tab === "password" ? (
            <UpdatePasswordPanel />
          ) : (
            <DuesPanel estateId={estate.data?._id} />
          )}
        </div>
      </div>
    </AdminShell>
  );
}

/* ------------------------------------------------------------------------ */
/* Update Password                                                          */
/* ------------------------------------------------------------------------ */

const passwordFormSchema = z
  .object({
    oldPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.oldPassword !== d.newPassword, {
    error: "Choose a password different from your current one",
    path: ["newPassword"],
  });

type PasswordFormInput = z.infer<typeof passwordFormSchema>;

function UpdatePasswordPanel() {
  const estate = useQuery({
    queryKey: ["estate", "profile"],
    queryFn: getEstateProfile,
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PasswordFormInput>({
    resolver: zodResolver(passwordFormSchema),
    mode: "onBlur",
  });

  /**
   * Posts to PATCH /auth/change-password, which now exists.
   *
   * The previous version posted to /users/profile/update and then proved the
   * change by attempting a sign-in, because that endpoint returned 200 without
   * changing anything. With a real endpoint the proof is unnecessary — a 401
   * means the old password was wrong, and anything else is a real error.
   */
  const change = useMutation({
    mutationFn: (values: PasswordFormInput) =>
      changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => reset(),
    onError: (error) => {
      // The API returns 401 specifically for a wrong current password, so put
      // the message on that field rather than in a banner.
      if (error instanceof ApiError && error.status === 401) {
        setError("oldPassword", {
          type: "server",
          message: "That isn't your current password.",
        });
        return;
      }
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          setError(field as keyof PasswordFormInput, {
            type: "server",
            message: messages[0],
          });
        }
      }
    },
  });

  /** The endpoint is missing entirely — an older deployment of the API. */
  const missing =
    change.error instanceof ApiError &&
    [404, 405, 501].includes(change.error.status);

  const sendReset = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/public/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: estate.data?.email }),
      });
      if (!response.ok) throw new Error("Could not send the reset email.");
      return response.json();
    },
  });

  const bannerError =
    change.error && !missing
      ? change.error instanceof ApiError
        ? change.error.status === 401 || change.error.fieldErrors
          ? null // already shown on a field
          : change.error.detail
        : (change.error as Error).message
      : null;

  return (
    <div className="max-w-xl">
      <h2 className="font-bold text-heading">Update Password</h2>

      <form
        noValidate
        onSubmit={handleSubmit((values) => change.mutate(values))}
        className="mt-5 space-y-4"
      >
        {change.isSuccess ? (
          <p
            role="status"
            className="rounded-field bg-ok-tint px-3 py-2.5 text-sm text-ok"
          >
            Password updated. Use your new password next time you sign in.
          </p>
        ) : null}

        <FormError message={bannerError} />

        <Field label="Old Password" error={errors.oldPassword?.message}>
          <PasswordField
            autoComplete="current-password"
            placeholder="Enter your old password"
            {...register("oldPassword")}
          />
        </Field>

        <Field
          label="New Password"
          error={errors.newPassword?.message}
          hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
        >
          <PasswordField
            autoComplete="new-password"
            placeholder="Enter your new password"
            {...register("newPassword")}
          />
        </Field>

        <Field label="New Password" error={errors.confirmPassword?.message}>
          <PasswordField
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            {...register("confirmPassword")}
          />
        </Field>

        <Button
          type="submit"
          variant="deep"
          size="lg"
          loading={change.isPending}
          className="mt-2 w-full sm:w-auto sm:px-10"
        >
          Update Password
        </Button>
      </form>

      {/* Only if the server does not have the endpoint at all. */}
      {missing ? (
        <div
          role="alert"
          className="mt-6 rounded-card border border-warn/40 bg-warn-tint p-5"
        >
          <p className="text-sm font-medium text-heading">
            Your password was not changed.
          </p>
          <p className="mt-2 text-sm text-body">
            This server can&rsquo;t change a password directly. We can email a
            six-digit code to{" "}
            <span className="font-medium text-heading">
              {estate.data?.email ?? "your address"}
            </span>{" "}
            so you can set a new one instead.
          </p>

          {sendReset.isSuccess ? (
            <p role="status" className="mt-3 text-sm font-medium text-ok">
              Email sent — check your inbox.
            </p>
          ) : (
            <Button
              variant="outline"
              className="mt-4"
              loading={sendReset.isPending}
              disabled={!estate.data?.email}
              onClick={() => sendReset.mutate()}
            >
              Email me a reset code
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Dues                                                                     */
/* ------------------------------------------------------------------------ */

const ENTRANCE_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

function DuesPanel({ estateId }: { estateId?: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminDue | null>(null);
  const [creating, setCreating] = useState(false);

  // The two master switches from the design.
  const [accessCode, setAccessCode] = useState(true);
  const [collection, setCollection] = useState(true);
  const [entrances, setEntrances] = useState("1");
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const dues = useQuery({ queryKey: ["estate", "dues"], queryFn: listDues });

  /**
   * These switches have no endpoint. PATCH /estates/{id} is attempted so that
   * they start working the moment the backend supports them; if it refuses,
   * the switch reverts and says so rather than pretending the change stuck.
   */
  const saveSettings = useMutation({
    mutationFn: (input: Record<string, unknown>) => {
      if (!estateId) throw new Error("Estate not loaded");
      return updateEstateSettings(estateId, input);
    },
    onError: () =>
      setSettingsError(
        "This server can't save estate settings yet, so that switch didn't stick.",
      ),
  });

  const setAccessCodeSetting = (next: boolean) => {
    setSettingsError(null);
    setAccessCode(next);
    saveSettings.mutate(
      { isAccessCodeEnabled: next },
      { onError: () => setAccessCode(!next) },
    );
  };

  const setCollectionSetting = (next: boolean) => {
    setSettingsError(null);
    setCollection(next);
    saveSettings.mutate(
      { isPaymentCollectionEnabled: next },
      { onError: () => setCollection(!next) },
    );
  };

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateDue(id, { isDueEnabled: enabled }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["estate", "dues"] }),
  });

  const remove = useMutation({
    mutationFn: deleteDue,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["estate", "dues"] }),
  });

  const rows = dues.data?.value ?? [];

  return (
    <div>
      <section className="space-y-5">
        <div className="flex items-start justify-between gap-6 border-b border-hairline pb-5">
          <div>
            <h2 className="font-semibold text-heading">Access Code</h2>
            <p className="mt-1 max-w-xs text-xs text-muted">
              Your residents can now use the access control
            </p>

            {/* Only relevant when access control is on, exactly as the Figma
                shows it. */}
            {accessCode ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label
                  htmlFor="entrances"
                  className="text-xs text-muted"
                >
                  How many Entrance do you have?
                </label>
                <div className="w-24">
                  <SelectField
                    id="entrances"
                    value={entrances}
                    onChange={(event) => setEntrances(event.target.value)}
                    options={ENTRANCE_OPTIONS}
                    className="h-9"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <Toggle
            checked={accessCode}
            onChange={setAccessCodeSetting}
            label="Access code enabled for residents"
          />
        </div>

        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="font-semibold text-heading">Payment Collection</h2>
            <p className="mt-1 max-w-xs text-xs text-muted">
              Your residents can now pay for all dues and projects fee
            </p>
          </div>

          <Toggle
            checked={collection}
            onChange={setCollectionSetting}
            label="Payment collection enabled"
          />
        </div>

        {settingsError ? (
          <FormError message={settingsError} />
        ) : null}
      </section>

      {/* The bills table only appears when collection is on, as in the
          design — there is nothing to configure when residents cannot pay. */}
      {collection ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-heading">All Bills</h2>
            <Button variant="ghost" onClick={() => setCreating(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Create New Bills
            </Button>
          </div>

          {dues.data?.unavailable ? (
            <FormError
              message="The server could not return your dues."
              className="mt-4"
            />
          ) : null}

          {dues.isLoading ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No bills set up"
              description="Create a bill so residents can pay their dues through the app."
              action={
                <Button variant="deep" onClick={() => setCreating(true)}>
                  Create a bill
                </Button>
              }
            />
          ) : (
            <>
            {/* Cards on phones — the same reasoning as the main data table:
                eight columns cannot be read at 375px, and a card shows every
                field rather than hiding half of them. */}
            <ul className="mt-5 space-y-3 lg:hidden">
              {rows.map((due) => (
                <li
                  key={due._id}
                  className="rounded-card border border-hairline p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-heading">
                      {due.name || (
                        <span className="italic text-faint">Unnamed bill</span>
                      )}
                    </p>
                    <Toggle
                      checked={due.isDueEnabled !== false}
                      label={`${due.name || "Unnamed bill"} enabled`}
                      disabled={toggle.isPending}
                      onChange={(next) =>
                        toggle.mutate({ id: due._id, enabled: next })
                      }
                    />
                  </div>

                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Amount</dt>
                      <dd className="text-heading">
                        {formatNaira(due.amount ?? 0)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Periodic</dt>
                      <dd className="text-heading">{titleCase(due.duration)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Account No.</dt>
                      <dd className="font-mono text-heading">
                        {due.accountNumber ?? "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Bank</dt>
                      <dd className="break-words text-right text-heading">
                        {due.bankName ?? "—"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex justify-end gap-1 border-t border-hairline pt-3">
                    <button
                      type="button"
                      onClick={() => setEditing(due)}
                      aria-label={`Edit ${due.name || "unnamed bill"}`}
                      className="inline-flex size-10 items-center justify-center rounded-field text-brand hover:bg-brand-tint"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${due.name || "unnamed bill"}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete "${due.name || "this unnamed bill"}"? Residents will no longer be able to pay it.`,
                          )
                        ) {
                          remove.mutate(due._id);
                        }
                      }}
                      className="inline-flex size-10 items-center justify-center rounded-field text-bad hover:bg-bad-tint"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 hidden lg:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Bills residents can pay
                </caption>
                <thead>
                  <tr className="border-b border-hairline text-xs text-muted">
                    <th scope="col" className="pb-2 pr-3 font-medium">Edit</th>
                    <th scope="col" className="pb-2 pr-3 font-medium">Bill Names</th>
                    <th scope="col" className="pb-2 pr-3 font-medium">Amount</th>
                    <th scope="col" className="pb-2 pr-3 font-medium">Periodic</th>
                    <th scope="col" className="pb-2 pr-3 font-medium">Account No.</th>
                    <th scope="col" className="pb-2 pr-3 font-medium">Bank Name</th>
                    <th scope="col" className="pb-2 pr-3 font-medium">
                      <span className="sr-only">Enabled</span>
                    </th>
                    <th scope="col" className="pb-2 font-medium">
                      <span className="sr-only">Delete</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((due) => (
                    <tr key={due._id} className="border-b border-hairline/60">
                      <td className="py-3 pr-3">
                        <button
                          type="button"
                          onClick={() => setEditing(due)}
                          aria-label={`Edit ${due.name || "unnamed bill"}`}
                          className="inline-flex size-9 items-center justify-center rounded-field text-brand hover:bg-brand-tint"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                      </td>
                      <td className="py-3 pr-3 font-medium text-heading">
                        {/* A due with no name exists in the database. Say
                            "Unnamed bill" rather than rendering nothing, so
                            the admin can find and fix it. */}
                        {due.name || (
                          <span className="italic text-faint">Unnamed bill</span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-muted">
                        {formatNaira(due.amount ?? 0)}
                      </td>
                      <td className="py-3 pr-3 text-muted">
                        {titleCase(due.duration)}
                      </td>
                      <td className="py-3 pr-3 font-mono text-muted">
                        {due.accountNumber ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-muted">
                        {due.bankName ?? "—"}
                      </td>
                      <td className="py-3 pr-3">
                        <Toggle
                          checked={due.isDueEnabled !== false}
                          label={`${due.name || "Unnamed bill"} enabled`}
                          disabled={toggle.isPending}
                          onChange={(next) =>
                            toggle.mutate({ id: due._id, enabled: next })
                          }
                        />
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          aria-label={`Delete ${due.name || "unnamed bill"}`}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${due.name || "this unnamed bill"}"? Residents will no longer be able to pay it.`,
                              )
                            ) {
                              remove.mutate(due._id);
                            }
                          }}
                          className="inline-flex size-9 items-center justify-center rounded-field text-bad hover:bg-bad-tint"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>
      ) : null}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create New Dues"
      >
        <DueForm
          submitLabel="Create Dues"
          onDone={() => {
            setCreating(false);
            queryClient.invalidateQueries({ queryKey: ["estate", "dues"] });
          }}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit Dues"
      >
        {editing ? (
          <DueForm
            due={editing}
            submitLabel="Updates Dues"
            onDone={() => {
              setEditing(null);
              queryClient.invalidateQueries({ queryKey: ["estate", "dues"] });
            }}
            onDelete={() => {
              if (
                window.confirm(
                  `Delete "${editing.name || "this unnamed bill"}"? Residents will no longer be able to pay it.`,
                )
              ) {
                remove.mutate(editing._id);
                setEditing(null);
              }
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

/** The bank list in the Figma is a dropdown, so this is a select. */
const BANKS = [
  "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank",
  "First City Monument Bank", "Guaranty Trust Bank", "Heritage Bank",
  "Keystone Bank", "Kuda", "Opay", "Palmpay", "Polaris Bank",
  "Providus Bank", "Stanbic IBTC", "Standard Chartered", "Sterling Bank",
  "Union Bank", "United Bank for Africa", "Unity Bank", "Wema Bank",
  "Zenith Bank",
].map((name) => ({ value: name, label: name }));

function DueForm({
  due,
  submitLabel,
  onDone,
  onDelete,
}: {
  due?: AdminDue;
  submitLabel: string;
  onDone: () => void;
  onDelete?: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DueFormInput>({
    resolver: zodResolver(dueFormSchema),
    mode: "onBlur",
    defaultValues: due
      ? {
          name: due.name ?? "",
          amount: due.amount ?? 0,
          duration: (due.duration as DueFormInput["duration"]) ?? "monthly",
          accountName: due.accountName ?? "",
          accountNumber: String(due.accountNumber ?? ""),
          bankName: due.bankName ?? "",
        }
      : { duration: "monthly" },
  });

  const mutation = useMutation({
    mutationFn: (values: DueFormInput) =>
      due ? updateDue(due._id, values) : createDue(values),
    onSuccess: onDone,
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          setError(field as keyof DueFormInput, {
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

      <Field label="Name of Dues" error={errors.name?.message}>
        <TextField placeholder="Estate Dues" {...register("name")} />
      </Field>

      <Field label="Amount" error={errors.amount?.message}>
        <TextField
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="₦0"
          // valueAsNumber makes React Hook Form convert the input's string
          // to a number before Zod sees it — see the note in the schema.
          {...register("amount", { valueAsNumber: true })}
        />
      </Field>

      <Field label="Periodic" error={errors.duration?.message}>
        <SelectField options={DURATIONS} {...register("duration")} />
      </Field>

      <p className="pt-2 text-sm font-medium text-heading">
        Settlement Account for this Bills
      </p>

      <Field label="Account Name" error={errors.accountName?.message}>
        <TextField placeholder="Enter Account Name" {...register("accountName")} />
      </Field>

      <Field label="Account Number" error={errors.accountNumber?.message}>
        {/* Text, not number. A numeric input silently eats the leading zero
            most Nigerian account numbers start with. */}
        <TextField
          inputMode="numeric"
          maxLength={10}
          placeholder="0000000000"
          {...register("accountNumber")}
        />
      </Field>

      <Field label="Bank Name" error={errors.bankName?.message}>
        <SelectField
          placeholder="Select bank"
          options={BANKS}
          {...register("bankName")}
        />
      </Field>

      <div className="flex flex-wrap gap-3 pt-3">
        {onDelete ? (
          <Button variant="danger" onClick={onDelete} className="flex-1">
            Delete
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="deep"
          loading={mutation.isPending}
          className="flex-1"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
