"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  History,
  LogOut,
  MapPin,
  Landmark,
  PersonStanding,
  UserRound,
} from "lucide-react";
import { DashboardTile } from "@/components/resident/tile";
import { Skeleton } from "@/components/ui/skeleton";
import { FormError } from "@/components/ui/form-error";
import { formatNaira } from "@/lib/format";
import {
  getResidentProfile,
  listEstateDues,
  listMyAccessCodes,
} from "@/lib/api/endpoints/resident";
import { logout } from "@/lib/api/endpoints/auth";
import { isUsableCode } from "@/lib/access-code-status";

/**
 * The resident home screen.
 *
 * Three data sources fetched in parallel. Two of the three endpoints are
 * currently broken on the backend — /dues/estate refuses residents, and
 * /access-codes/resident throws a 500 — so both panels are written to
 * degrade rather than take the page down with them.
 *
 * The principle: a dashboard shows what it can and says "unavailable" for the
 * rest. Never invent a number to fill a gap. A confident ₦0 where we were
 * refused the data is a lie, and someone will act on it.
 */
export function ResidentDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["resident", "profile"],
    queryFn: getResidentProfile,
  });

  const codes = useQuery({
    queryKey: ["access-codes", "mine"],
    queryFn: () => listMyAccessCodes(1, 50),
  });

  const dues = useQuery({
    queryKey: ["dues", "estate"],
    queryFn: listEstateDues,
  });

  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear every cached query, not just the session. Otherwise the next
      // person to sign in on this device briefly sees the previous user's
      // data while the refetch is in flight.
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
  });

  const codesUnavailable = codes.data?.unavailable ?? false;
  const duesUnavailable = dues.data?.unavailable ?? false;

  /**
   * "Active" means usable, not status === "active". A newly created code
   * comes back as "inactive" — confirmed against a real response.
   */
  const activeCount =
    codes.data?.value.filter((code) => isUsableCode(code)).length ?? 0;

  /**
   * Sums the estate's enabled dues WITHOUT subtracting what has been paid,
   * because nothing in the API says what has. An upper bound, not a balance.
   */
  const amountDue =
    dues.data?.value
      .filter((due) => due.isDueEnabled !== false)
      .reduce((total, due) => total + (due.amount ?? 0), 0) ?? 0;

  const firstName = profile.data?.firstName ?? "";
  const address = profile.data?.address ?? "";

  const activeCode = codes.data?.value.find((c) => isUsableCode(c));

  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      <header className="surface-stars px-5 pb-8 pt-5 text-white min-[400px]:px-6 min-[400px]:pt-6">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5"
                aria-hidden="true"
              >
                <MapPin className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-white/50">Address</p>
                {profile.isLoading ? (
                  <Skeleton className="mt-1 h-4 w-28 bg-white/10" />
                ) : (
                  <p className="truncate text-sm font-semibold">
                    {address || "Not set"}
                  </p>
                )}
              </div>
            </div>

            {/* The Figma shows a download icon here with no explained
                purpose, and the resident app has no sign-out anywhere.
                Signing out is the more important missing thing. */}
            <button
              type="button"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
              aria-label="Sign out"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>

          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
            {profile.isLoading ? (
              <Skeleton className="h-7 w-40 bg-white/10" />
            ) : (
              <>Hello, {firstName || "there"}</>
            )}
          </h1>
        </div>
      </header>

      <main id="main" className="flex-1 px-5 pb-10 min-[400px]:px-6">
        <div className="mx-auto -mt-1 w-full max-w-md space-y-4">
          {profile.isError ? (
            <FormError
              message="We couldn't load your profile. Try again shortly."
              tone="slab"
            />
          ) : null}

          <section
            aria-label="Account summary"
            className="rounded-card bg-tile-stat p-5"
          >
            <div className="flex items-stretch">
              <div className="flex-1 pr-4">
                <p className="text-sm text-tile-stat-fg/80">Active Code</p>
                {codes.isLoading ? (
                  <Skeleton className="mt-3 h-10 w-12 bg-white/10" />
                ) : codesUnavailable ? (
                  <p className="mt-3 text-sm text-tile-stat-fg/70">
                    Unavailable
                  </p>
                ) : (
                  <p className="mt-2 text-4xl font-extrabold text-tile-stat-fg">
                    {activeCount}
                  </p>
                )}
              </div>

              <div className="w-px shrink-0 bg-white/15" aria-hidden="true" />

              <div className="flex-1 pl-4 text-right">
                <p className="text-sm text-tile-stat-fg/80">Amount Due</p>
                {dues.isLoading ? (
                  <Skeleton className="ml-auto mt-3 h-10 w-28 bg-white/10" />
                ) : duesUnavailable ? (
                  <p className="mt-3 text-sm text-tile-stat-fg/70">
                    Unavailable
                  </p>
                ) : (
                  <p className="mt-2 break-words text-3xl font-extrabold text-tile-stat-fg">
                    {formatNaira(amountDue)}
                  </p>
                )}
              </div>
            </div>
          </section>

          <nav aria-label="Resident actions" className="grid grid-cols-2 gap-4">
            <DashboardTile
              href="/resident/access-codes/new"
              label="Generate Access Code"
              tone="code"
              icon={<PersonStanding className="size-5" />}
            />
            <DashboardTile
              href="/resident/bills/new"
              label="Make Estate Bill"
              tone="bill"
              icon={<Landmark className="size-5" />}
            />
            <DashboardTile
              href="/resident/history"
              label="History"
              tone="history"
              icon={<History className="size-5" />}
            />
            <DashboardTile
              href="/resident/profile"
              label="Profile"
              tone="profile"
              icon={<UserRound className="size-5" />}
            />
          </nav>

          {activeCode ? (
            <Link
              href={`/resident/access-codes/${activeCode._id}`}
              className="flex items-center justify-between gap-3 rounded-card border border-white/10 bg-white/5 px-5 py-4 text-white transition-colors hover:bg-white/10"
            >
              <span className="flex items-center gap-2 text-sm text-white/70">
                <FileText className="size-4 shrink-0" aria-hidden="true" />
                Most recent code
              </span>
              <span className="font-mono text-lg font-bold tracking-widest">
                {activeCode.code}
              </span>
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  );
}
