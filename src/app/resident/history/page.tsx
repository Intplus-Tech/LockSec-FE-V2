import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { HistoryTabs } from "./tabs";

export default function HistoryPage() {
  return (
    <MobileShell back="/resident" title="View History" narrowTitle>
      <Suspense fallback={null}>
        <HistoryTabs />
      </Suspense>
    </MobileShell>
  );
}
