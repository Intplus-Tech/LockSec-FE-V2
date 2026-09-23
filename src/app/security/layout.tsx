import type { Metadata } from "next";
import { Splash } from "@/components/brand/splash";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/*
        This layout wraps both /security/login and the gate itself, so a guard
        sees the opening before the Personnel ID screen — which is the first
        thing they use — and not again once they are working.
      */}
      <Splash storageKey="locksec:splash:security" />
      {children}
    </>
  );
}
