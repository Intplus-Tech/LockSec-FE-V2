"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listEstateDues } from "@/lib/api/endpoints/resident";
import { formatNaira } from "@/lib/format";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

/**
 * Choose a bill and how many periods to pay for.
 *
 * NOTE ON THE DESIGN. The Figma's bill dropdown is a multi-select with
 * checkboxes — Estate Dues, Utility, Project, Others — but the form field
 * shows one value and POST /payments/initiate accepts a single `type`. Built
 * as single-select to match what the API can do. Paying several bills at once
 * is a genuinely different feature, worth settling with your designer.
 */
export function EstateBillForm() {
  const router = useRouter();
  const [dueId, setDueId] = useState("");
  const [months, setMonths] = useState("1");

  const dues = useQuery({
    queryKey: ["dues", "estate"],
    queryFn: listEstateDues,
  });

  const available = (dues.data?.value ?? []).filter(
    (due) => due.isDueEnabled !== false,
  );

  const selected = available.find((due) => due._id === dueId);
  const payable = selected ? (selected.amount ?? 0) * Number(months || 1) : 0;

  if (dues.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (dues.isError) {
    return (
      <FormError message="We couldn't load your estate's bills. Try again shortly." />
    );
  }

  // The backend refuses this endpoint to residents. Tell the truth rather
  // than pretending the estate simply has no bills — those are different
  // situations and a resident who owes money deserves to know which.
  if (dues.data?.unavailable) {
    return (
      <EmptyState
        title="Bills aren't available yet"
        description="Your estate's bill list can't be shown to residents at the moment. Contact your estate office to pay, and we'll enable this as soon as it's fixed."
      />
    );
  }

  if (available.length === 0) {
    return (
      <EmptyState
        title="No bills to pay"
        description="Your estate hasn't set up any dues yet, or payment collection is switched off. Check with your estate office."
      />
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="space-y-5">
        <Field label="Estate Bill">
          <SelectField
            placeholder="Select a bill"
            value={dueId}
            onChange={(event) => setDueId(event.target.value)}
            options={available.map((due) => ({
              value: due._id,
              label: due.name ?? "Unnamed bill",
            }))}
          />
        </Field>

        <Field label="Month(s)">
          <SelectField
            value={months}
            onChange={(event) => setMonths(event.target.value)}
            options={MONTH_OPTIONS}
          />
        </Field>

        <Field label="Amount Payable">
          {/* readOnly rather than disabled. A disabled input is skipped by
              keyboard navigation and often unreadable to a screen reader. */}
          <TextField
            readOnly
            value={formatNaira(payable)}
            className="bg-canvas text-muted"
            tabIndex={0}
          />
        </Field>
      </div>

      <div className="mt-auto pt-10">
        <Button
          size="lg"
          fullWidth
          disabled={!selected}
          onClick={() =>
            router.push(`/resident/bills/summary?due=${dueId}&months=${months}`)
          }
        >
          Make Payment
        </Button>
      </div>
    </div>
  );
}
