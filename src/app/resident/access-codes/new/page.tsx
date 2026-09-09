import { MobileShell } from "@/components/layout/mobile-shell";
import { GenerateCodeForm } from "./form";

export default function GenerateAccessCodePage() {
  return (
    <MobileShell back="/resident" title="Generate Access Code" narrowTitle>
      <GenerateCodeForm />
    </MobileShell>
  );
}
