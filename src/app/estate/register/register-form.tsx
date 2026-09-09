"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Building2, Lock, Mail, Phone, User } from "lucide-react";
import { Field } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { PasswordField } from "@/components/ui/password-field";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import {
  registerEstateSchema,
  type RegisterEstateInput,
} from "@/lib/schemas/auth";
import { registerEstate } from "@/lib/api/endpoints/auth";

export function EstateRegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterEstateInput>({
    resolver: zodResolver(registerEstateSchema),
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: registerEstate,
    onSuccess: () => {
      // Carry the email forward so the verification screen can offer "resend"
      // without asking for it again.
      const email = encodeURIComponent(getValues("email"));
      router.push(`/estate/verify-email?email=${email}`);
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-4"
    >
      <FormError
        message={mutation.error ? (mutation.error as Error).message : null}
        tone="slab"
      />

      <Field label="Estate Name" error={errors.estateName?.message} tone="slab">
        <TextField
          placeholder="Enter Your Estate Name"
          icon={<Building2 className="size-4" />}
          {...register("estateName")}
        />
      </Field>

      <Field label="Full Name" error={errors.fullName?.message} tone="slab">
        <TextField
          autoComplete="name"
          placeholder="Enter Your Full Name"
          icon={<User className="size-4" />}
          {...register("fullName")}
        />
      </Field>

      <Field label="Phone Number" error={errors.phoneNumber?.message} tone="slab">
        <TextField
          type="tel"
          autoComplete="tel"
          placeholder="Enter Phone Number"
          icon={<Phone className="size-4" />}
          {...register("phoneNumber")}
        />
      </Field>

      <Field label="Email Address" error={errors.email?.message} tone="slab">
        <TextField
          type="email"
          autoComplete="email"
          placeholder="Enter Email Address"
          icon={<Mail className="size-4" />}
          {...register("email")}
        />
      </Field>

      <Field
        label="Create Password"
        error={errors.password?.message}
        tone="slab"
        hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
      >
        <PasswordField
          autoComplete="new-password"
          placeholder="Enter Password"
          icon={<Lock className="size-4" />}
          {...register("password")}
        />
      </Field>

      <Button
        type="submit"
        variant="deep"
        size="lg"
        fullWidth
        loading={mutation.isPending}
        className="mt-2"
      >
        Create Account
      </Button>

      <p className="text-center">
        <Link
          href="/estate/login"
          className="text-sm font-semibold text-white hover:text-brand"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}
