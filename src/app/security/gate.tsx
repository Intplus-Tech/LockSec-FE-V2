"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Keypad } from "@/components/security/keypad";
import { ValidEntry } from "@/components/security/valid-entry";
import { validateAccessCode } from "@/lib/api/endpoints/security";
import { logout } from "@/lib/api/endpoints/auth";
import { ApiError } from "@/lib/api/client";
import { isDisabledCode, isExpiredCode } from "@/lib/access-code-status";
import type { ValidatedCode } from "@/lib/schemas/security";

/**
 * The gate screen.
 *
 * The result is held in component state rather than pushed to its own route,
 * which is unusual for this codebase and deliberate. POST
 * /access-codes/validate increments the code's `amountUsed` — it is a
 * mutation, not a lookup. If the result lived at a URL, a refresh or a
 * back-then-forward would silently record a second entry for a visitor who
 * arrived once. Losing the screen on refresh is the cheaper mistake.
 */
export function SecurityGate() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [code, setCode] = useState("");
  const [entry, setEntry] = useState<ValidatedCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useMutation({
    mutationFn: validateAccessCode,
    onSuccess: (result) => {
      /**
       * IMPORTANT: a valid, unused code comes back with status "inactive".
       * Confirmed by creating one and reading the response.
       *
       * An earlier version rejected "inactive" as "Code not available",
       * which would have turned away every visitor holding a perfectly good
       * code. Only expiry and an explicit disable are grounds for refusal.
       */
      if (isExpiredCode(result.status, result.codeExpiresAt)) {
        setError("Code Expired");
        setCode("");
        return;
      }

      if (isDisabledCode(result.isAccessCodeEnabled)) {
        setError("Code not available");
        setCode("");
        return;
      }

      setError(null);
      setEntry(result);
    },
    onError: (err) => {
      setCode("");

      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("Code not available");
          return;
        }
        if (err.status === 401) {
          // Session gone. Back to sign in, rather than showing a gate error
          // for something that is not the visitor's fault.
          router.push("/security/login");
          return;
        }
        setError(err.detail);
        return;
      }

      setError("Could not check that code. Try again.");
    },
  });

  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.push("/security/login");
      router.refresh();
    },
  });

  if (entry) {
    return (
      <ValidEntry
        entry={entry}
        onBack={() => {
          setEntry(null);
          setCode("");
          setError(null);
        }}
      />
    );
  }

  return (
    <div className="surface-stars flex min-h-dvh flex-col px-5 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-sm justify-end">
        <button
          type="button"
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
          aria-label="Sign out"
          className="inline-flex size-11 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>

      <main id="main" className="mx-auto my-auto w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="size-9" />
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-white">
            Lock<span className="text-brand">Sec</span>
          </p>
          <p className="mt-4 max-w-[24ch] text-sm text-white/60">
            Enter the code provided by the guest
          </p>
        </div>

        <div className="mt-8">
          <Keypad
            value={code}
            onChange={(next) => {
              setCode(next);
              // Clear the error as soon as they start over, so a stale
              // "Code Expired" is not sitting there while they retype.
              if (error) setError(null);
            }}
            onSubmit={() => check.mutate(code)}
            error={error}
            busy={check.isPending}
          />
        </div>
      </main>
    </div>
  );
}
