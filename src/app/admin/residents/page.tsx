import { Suspense } from "react";
import { ResidentManagement } from "./manage";

export default function ResidentManagementPage() {
  /**
   * The screen reads ?search= from the URL so links like
   * /admin/residents?search=<id> work — which is how "View resident" on the
   * Payments page gets here.
   *
   * Anything reading the URL needs a Suspense boundary, because Next.js
   * prerenders pages at build time on a server that has no URL. Without one
   * the build fails outright rather than at runtime.
   */
  return (
    <Suspense fallback={null}>
      <ResidentManagement />
    </Suspense>
  );
}
