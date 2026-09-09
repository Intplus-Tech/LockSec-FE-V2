import { MobileShell } from "@/components/layout/mobile-shell";
import { EstateBillForm } from "./form";

export default function MakeEstateBillPage() {
  return (
    <MobileShell back="/resident" title="Make Estate Bill" narrowTitle>
      <EstateBillForm />
    </MobileShell>
  );
}
