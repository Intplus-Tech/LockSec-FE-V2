"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getResidentProfile,
  listEstateDues,
} from "@/lib/api/endpoints/resident";
import { formatNaira } from "@/lib/format";

const SERVICE_CHARGE = 100;

export function PaymentSuccess() {
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

  const shareText = `Estate payment of ${formatNaira(total)} completed via LockSec.`;

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="surface-stars px-5 py-7 text-center text-white min-[400px]:px-6">
        <h1 className="mx-auto max-w-[12ch] text-2xl font-extrabold tracking-tight">
          Payment Successfully!
        </h1>
      </header>

      <main id="main" className="flex-1 px-5 py-7 min-[400px]:px-6">
        <div className="mx-auto w-full max-w-md">
          {/* role="status" so a screen reader announces the outcome on
              arrival. The tick is decorative — the word "Success" carries the
              meaning, so colour is never the only signal. */}
          <p
            role="status"
            className="flex items-center justify-center gap-2 text-2xl font-extrabold text-heading"
          >
            <CheckCircle2 className="size-7 text-ok" aria-hidden="true" />
            Success
          </p>

          {dues.isLoading ? (
            <Skeleton className="mt-7 h-64 w-full" />
          ) : (
            <dl className="mt-7 space-y-4 rounded-card border border-hairline p-5">
              <Row label="Type of Bill" value={due?.name ?? "Estate Dues"} />
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
          )}

          <div className="mt-7 flex items-start justify-around gap-4 text-center">
            <Link
              href="/resident/bills/new"
              className="max-w-[12ch] text-sm font-medium text-brand"
            >
              Make New Payment
            </Link>
            <Link
              href="/resident"
              className="max-w-[12ch] text-sm font-medium text-brand"
            >
              Back to Dashboard
            </Link>
          </div>

          <p className="mt-8 text-center">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-body"
            >
              <span
                className="inline-flex size-6 items-center justify-center rounded-full bg-[#25D366] text-white"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                  <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.7-1.5-3.7-3.3-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.4 1.9.8 2.6.9 3.5.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3M12 21.5c-1.7 0-3.3-.5-4.7-1.3l-3.3.9.9-3.2A9.4 9.4 0 0 1 2.6 12 9.4 9.4 0 0 1 12 2.6a9.4 9.4 0 0 1 0 18.9M12 .7A11.3 11.3 0 0 0 .7 12c0 2 .5 3.9 1.5 5.6L.6 23.4l5.9-1.5c1.6.9 3.5 1.4 5.5 1.4A11.3 11.3 0 0 0 12 .7" />
                </svg>
              </span>
              Share via WhatsApp
            </a>
          </p>
        </div>
      </main>
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
