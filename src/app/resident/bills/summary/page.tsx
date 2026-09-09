import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { PaymentSummary } from "./summary";

export default function PaymentSummaryPage() {
  return (
    <MobileShell back="/resident/bills/new" title="Payment Summary" narrowTitle>
      <Suspense fallback={null}>
        <PaymentSummary />
      </Suspense>
    </MobileShell>
  );
}
