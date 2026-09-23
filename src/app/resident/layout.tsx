import type { Metadata } from "next";
import { Splash } from "@/components/brand/splash";

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
  return (
    <>
      {/*
        Mounted on the layout rather than the dashboard, so someone arriving
        straight at a deep link — a saved access code, say — gets the same
        opening as someone who came through the sign-in screen. It shows once
        per session, so moving between resident screens does not repeat it.
      */}
      <Splash storageKey="locksec:splash:resident" />
      {children}
    </>
  );
}
