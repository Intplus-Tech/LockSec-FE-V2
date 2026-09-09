import type { Metadata } from "next";

export const metadata: Metadata = {
  // Nothing behind a login should be indexed. Applied at the layout level so
  // every resident page inherits it and none can be forgotten.
  robots: { index: false, follow: false },
};

export default function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
