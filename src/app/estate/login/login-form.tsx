"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Lock, Mail } from "lucide-react";
import { Field } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { PasswordField } from "@/components/ui/password-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { login } from "@/lib/api/endpoints/auth";
import { ApiError } from "@/lib/api/client";

export function EstateLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      router.push(searchParams.get("next") ?? result.redirectTo);
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
      <FormError message={errorMessage} tone="slab" />

      <Field label="Email Address" error={errors.email?.message} tone="slab">
        <TextField
          type="email"
          autoComplete="email"
          placeholder="Enter Email Address"
          icon={<Mail className="size-4" />}
          {...register("email")}
        />
      </Field>

      <Field label="Your Password" error={errors.password?.message} tone="slab">
        <PasswordField
          autoComplete="current-password"
          placeholder="Enter Password"
          icon={<Lock className="size-4" />}
          {...register("password")}
        />
      </Field>

      <div className="flex items-center justify-between">
        <Checkbox label="Remember me" name="remember" tone="slab" />
        <Link
          href="/estate/forgot-password"
          className="text-sm text-white/70 hover:text-white"
        >
          Forgot Password?
        </Link>
      </div>

      <Button
        type="submit"
        variant="deep"
        size="lg"
        fullWidth
        loading={mutation.isPending}
      >
        Sign In
      </Button>

      <p className="text-center">
        <Link
          href="/estate/register"
          className="text-sm font-semibold text-white hover:text-brand"
        >
          Create Account
        </Link>
      </p>
    </form>
  );
}
