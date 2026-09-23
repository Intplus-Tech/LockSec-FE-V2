import type { Metadata } from "next";
import { SplashOnEntry } from "@/components/brand/splash";

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
        This layout wraps both the Personnel ID screen and the gate itself, so
        it cannot use one rule for both. Signing in shows the opening every
        time; the gate shows it once per session, because a guard comes back
        to that screen after every visitor.
      */}
      <SplashOnEntry
        storageKey="locksec:splash:security"
        entryPaths={["/security/login"]}
      />
      {children}
    </>
  );
}
