"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CodeInput } from "@/components/ui/code-input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { resendForgotPasswordEmail } from "@/lib/api/endpoints/auth";

/**
 * The six-digit token from the password reset email.
 *
 * There is no "check this token" endpoint on the backend — the token is only
 * validated when it is submitted together with the new password. So this
 * screen carries the code forward in the URL rather than pretending to
 * verify it, and the real check happens on the next screen.
 */
export function VerifyTokenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);

  const resend = useMutation({ mutationFn: resendForgotPasswordEmail });

  const submit = () => {
    setTouched(true);
    if (code.length !== 6) return;
    router.push(
      `/estate/reset-password?token=${code}&email=${encodeURIComponent(email)}`,
    );
  };

  const invalid = touched && code.length !== 6;

  return (
    <div className="space-y-6">
      <FormError
        message={invalid ? "Enter all six digits." : null}
        tone="slab"
      />

      <CodeInput
        label="Password reset token"
        value={code}
        onChange={setCode}
        onComplete={submit}
        invalid={invalid}
      />

      <Button variant="deep" size="lg" fullWidth onClick={submit}>
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
