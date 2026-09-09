"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Skeleton } from "@/components/ui/skeleton";
import {
  findPaymentUrl,
  getResidentProfile,
  initiatePayment,
  listEstateDues,
} from "@/lib/api/endpoints/resident";
import { formatNaira } from "@/lib/format";

/**
 * The service charge is not in the API anywhere — it appears only in the
 * Figma, as a flat ₦100. Hard-coded here and named, so that when someone asks
 * "where does the hundred naira come from?" the answer is findable. Move it
 * to the backend when there is an endpoint for it.
 */
const SERVICE_CHARGE = 100;

export function PaymentSummary() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dueId = searchParams.get("due") ?? "";
  const months = Number(searchParams.get("months") ?? "1");

  const dues = useQuery({
    queryKey: ["dues", "estate"],
    queryFn: listEstateDues,
  });

  const profile = useQuery({
    queryKey: ["resident", "profile"],
    queryFn: getResidentProfile,
  });

  const due = dues.data?.value.find((d) => d._id === dueId);
  const subtotal = due ? (due.amount ?? 0) * months : 0;
  const total = subtotal + SERVICE_CHARGE;

  const pay = useMutation({
    mutationFn: () =>
      initiatePayment({
        amount: total,
        duration: months,
        type: "estate_payments",
      }),
    onSuccess: (body) => {
      // If the backend hands back a payment-provider URL, that is where the
      // user must go to actually pay. Otherwise fall through to the success
      // screen, which is what the current backend appears to do.
      const url = findPaymentUrl(body);
      if (url) {
        window.location.href = url;
        return;
      }
      router.push(`/resident/bills/success?due=${dueId}&months=${months}`);
    },
  });

  if (dues.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!due) {
    return (
      <div className="space-y-5">
        <FormError message="We couldn't find that bill. Choose one again." />
        <Button
          size="lg"
          fullWidth
          onClick={() => router.push("/resident/bills/new")}
        >
          Choose a bill
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      <FormError
        message={pay.error ? (pay.error as Error).message : null}
        className="mb-5"
      />

      <dl className="space-y-4 rounded-card border border-hairline p-5">
        <Row label="Type of Bill" value={due.name ?? "Estate Dues"} />
        <Row label="Apartment" value={profile.data?.address ?? "—"} />

        <div className="pt-2" />

        <Row label="No. of Months" value={String(months)} />
        <Row
          label={`${months} ${months === 1 ? "Month" : "Months"} Amt.`}
          value={formatNaira(subtotal)}
        />
        <Row label="Service Charge" value={formatNaira(SERVICE_CHARGE)} />

        <div className="border-t border-hairline pt-4">
          <Row label="Total Amt." value={formatNaira(total)} emphasis />
        </div>
      </dl>

      <div className="mt-auto pt-10">
        <Button
          size="lg"
          fullWidth
          loading={pay.isPending}
          onClick={() => pay.mutate()}
        >
          Complete Payment
        </Button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd
        className={
          emphasis
            ? "text-right text-lg font-bold text-heading"
            : "text-right font-medium text-heading"
        }
      >
        {value}
      </dd>
    </div>
  );
}
