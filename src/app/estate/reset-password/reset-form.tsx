"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/schemas/auth";
import { resetPassword } from "@/lib/api/endpoints/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: { token },
  });

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordInput) =>
      resetPassword({ token: values.token, newPassword: values.newPassword }),
    onSuccess: () => router.push("/estate/login?reset=1"),
  });

  // Arriving here without a token means the link or the flow broke. Say so
  // plainly and give a way out, rather than showing a form that cannot work.
  if (!token) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-white/70">
          This reset link is missing its token. Request a new one to continue.
        </p>
        <Button
          variant="deep"
          size="lg"
          fullWidth
          onClick={() => router.push("/estate/forgot-password")}
        >
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-5"
    >
      <FormError
        message={mutation.error ? (mutation.error as Error).message : null}
        tone="slab"
      />

      <input type="hidden" {...register("token")} />

      <Field
        label="New Password"
        error={errors.newPassword?.message}
        tone="slab"
        hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
      >
        <PasswordField
          autoComplete="new-password"
          placeholder="New Password"
          icon={<Lock className="size-4" />}
          {...register("newPassword")}
        />
      </Field>

      <Field
        label="Re Enter Password"
        error={errors.confirmPassword?.message}
        tone="slab"
      >
        <PasswordField
          autoComplete="new-password"
          placeholder="Enter Password"
          icon={<Lock className="size-4" />}
          {...register("confirmPassword")}
        />
      </Field>

      <Button
        type="submit"
        variant="deep"
        size="lg"
        fullWidth
        loading={mutation.isPending}
      >
        Verify
      </Button>
    </form>
  );
}
