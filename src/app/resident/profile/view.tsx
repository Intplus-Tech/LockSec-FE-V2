"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FormError } from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import { getResidentProfile } from "@/lib/api/endpoints/resident";
import { logout } from "@/lib/api/endpoints/auth";
import { formatLongDate, titleCase } from "@/lib/format";

export function ProfileView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["resident", "profile"],
    queryFn: getResidentProfile,
  });

  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
  });

  const rows: { label: string; value: string }[] = [
    { label: "First Name", value: profile.data?.firstName ?? "—" },
    { label: "Last Name", value: profile.data?.lastName ?? "—" },
    { label: "Phone No.", value: profile.data?.phoneNumber ?? "—" },
    { label: "Email", value: profile.data?.email ?? "—" },
    { label: "Address", value: profile.data?.address ?? "—" },
    { label: "Type", value: titleCase(profile.data?.role) },
    { label: "Join", value: formatLongDate(profile.data?.createdAt) },
  ];

  // Business owners get two extra rows, matching the register form's shape.
  if (profile.data?.role === "business_owner") {
    rows.splice(
      6,
      0,
      { label: "Business", value: profile.data?.businessName ?? "—" },
      { label: "Industry", value: titleCase(profile.data?.industryType) },
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="surface-stars px-5 pb-8 pt-5 text-white min-[400px]:px-6 min-[400px]:pt-6">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-start justify-between">
            <Link
              href="/resident"
              aria-label="Go back"
              className="-ml-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>

            <Link
              href="/resident/profile/edit"
              aria-label="Edit profile"
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10"
            >
              <Pencil className="size-5" aria-hidden="true" />
            </Link>
          </div>

          <h1 className="mt-5 max-w-[8ch] text-display font-extrabold">
            Profile Settings
          </h1>
        </div>
      </header>

      <main id="main" className="flex-1 px-5 py-7 min-[400px]:px-6">
        <div className="mx-auto w-full max-w-md">
          {profile.isError ? (
            <FormError message="We couldn't load your profile. Try again shortly." />
          ) : null}

          <dl className="divide-y divide-hairline">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 py-4"
              >
                <dt className="shrink-0 text-muted">{row.label}</dt>
                <dd className="min-w-0 break-words text-right font-medium text-heading">
                  {profile.isLoading ? (
                    <Skeleton className="h-5 w-32" />
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {/* Signing out belongs here. The Figma has no logout control
              anywhere in the resident app, which is a gap rather than a
              decision — an account on a shared phone needs a way out. */}
          <Button
            variant="outline"
            fullWidth
            className="mt-10"
            loading={signOut.isPending}
            onClick={() => signOut.mutate()}
          >
            Sign out
          </Button>
        </div>
      </main>
    </div>
  );
}
