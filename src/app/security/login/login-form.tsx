"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Field } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import {
  securityLoginSchema,
  type SecurityLoginInput,
} from "@/lib/schemas/auth";
import { securityLogin } from "@/lib/api/endpoints/auth";
import { ApiError } from "@/lib/api/client";

/**
 * Security staff sign in with a numeric personnel ID — no email, no password.
 *
 * The design labels it "Security Personnel ID" while the API calls the field
 * `securityCode`. The user-facing label follows the design; the wire format
 * follows the API.
 */
export function SecurityLoginForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SecurityLoginInput>({
    resolver: zodResolver(securityLoginSchema),
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: securityLogin,
    onSuccess: (result) => {
      router.push(result.redirectTo);
      router.refresh();
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.isRateLimited
        ? "Too many attempts. Wait a few minutes and try again."
        : mutation.error.message
      : mutation.error
        ? "Could not sign in. Check your connection and try again."
        : null;

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-6"
    >
      <FormError message={errorMessage} tone="slab" />

      <Field
        label="Security Personnel ID"
        error={errors.securityCode?.message}
        tone="ink"
        required
      >
        <TextField
          // A numeric keypad, not the full keyboard. On a phone at a gate that
          // is the difference between two taps and five.
          inputMode="numeric"
          autoComplete="off"
          placeholder="Enter ID"
          className="h-12"
          {...register("securityCode")}
        />
      </Field>

      <Button type="submit" size="lg" fullWidth loading={mutation.isPending}>
        Log In
      </Button>
    </form>
  );
}
