"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CodeInput } from "@/components/ui/code-input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { resendVerificationEmail } from "@/lib/api/endpoints/auth";

/**
 * Email verification.
 *
 * The backend exposes this as GET /auth/verify-email/{token} — the token goes
 * in the path, not a JSON body — so this posts to a small dedicated route
 * handler rather than the generic public pass-through.
 *
 * Residents land here too after registering, which is why the "next" step is
 * chosen from the flow query parameter rather than hard-coded.
 */
export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const flow = searchParams.get("flow");

  const [code, setCode] = useState("");

  const verify = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(
        `/api/auth/verify-email/${encodeURIComponent(token)}`,
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message ?? "That code did not work.");
      }
      return data;
    },
    onSuccess: () =>
      router.push(flow === "resident" ? "/login?verified=1" : "/estate/login?verified=1"),
  });

  const resend = useMutation({ mutationFn: resendVerificationEmail });

  return (
    <div className="space-y-6">
      <FormError
        message={verify.error ? (verify.error as Error).message : null}
        tone="slab"
      />

      <CodeInput
        label="Email verification code"
        value={code}
        onChange={setCode}
        onComplete={(value) => verify.mutate(value)}
        invalid={verify.isError}
        disabled={verify.isPending}
      />

      <Button
        variant="deep"
        size="lg"
        fullWidth
        loading={verify.isPending}
        onClick={() => verify.mutate(code)}
        disabled={code.length !== 6}
      >
        Verify
      </Button>

      <p className="text-center">
        <button
          type="button"
          onClick={() => email && resend.mutate({ email })}
          disabled={!email || resend.isPending}
          className="text-sm font-semibold text-white hover:text-brand disabled:opacity-50"
        >
          {resend.isSuccess ? "Sent" : "Resend"}
        </button>
      </p>
    </div>
  );
}
