"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { Field } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/schemas/auth";
import { forgotPassword } from "@/lib/api/endpoints/auth";

export function ForgotPasswordForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      const email = encodeURIComponent(getValues("email"));
      router.push(`/estate/verify-token?email=${email}`);
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-6"
    >
      <FormError
        message={mutation.error ? (mutation.error as Error).message : null}
        tone="slab"
      />

      <Field label="Email Address" error={errors.email?.message} tone="slab">
        <TextField
          type="email"
          autoComplete="email"
          placeholder="Enter Email Address"
          icon={<Mail className="size-4" />}
          {...register("email")}
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
