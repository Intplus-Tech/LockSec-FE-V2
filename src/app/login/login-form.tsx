"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Field } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { PasswordField } from "@/components/ui/password-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { login } from "@/lib/api/endpoints/auth";
import { ApiError } from "@/lib/api/client";

/**
 * The form is a client component; the page around it stays a server
 * component. That split is deliberate — only the interactive part ships
 * JavaScript, so the page's static text renders instantly and the bundle
 * stays small.
 */
export function ResidentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    // Validate when the field loses focus rather than on every keystroke.
    // Showing "invalid email" while someone is halfway through typing it is
    // hostile.
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      // If they were sent here by the proxy from a protected page, return
      // them to it. Otherwise use the role's home route.
      const next = searchParams.get("next");
      router.push(next ?? result.redirectTo);
      // Refresh so server components re-read the new session cookie.
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
      className="space-y-5"
    >
      <FormError message={errorMessage} />

      <Field label="Email" error={errors.email?.message}>
        <TextField
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
        />
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <PasswordField
          autoComplete="current-password"
          placeholder="Enter your password"
          {...register("password")}
        />
      </Field>

      <div className="flex items-center justify-between">
        <Checkbox label="Remember me" name="remember" />
        <Link
          href="/estate/forgot-password"
          className="text-sm font-medium text-brand"
        >
          Forgot Password ?
        </Link>
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={mutation.isPending}
        className="mt-2"
      >
        Log In
      </Button>
    </form>
  );
}
