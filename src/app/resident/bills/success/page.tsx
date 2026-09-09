import { Suspense } from "react";
import { PaymentSuccess } from "./success";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccess />
    </Suspense>
  );
}
