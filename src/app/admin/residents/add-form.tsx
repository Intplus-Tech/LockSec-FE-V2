"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Field } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { PasswordField } from "@/components/ui/password-field";
import { SelectField } from "@/components/ui/select-field";
import { RadioCards } from "@/components/ui/radio-cards";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import {
  createResidentSchema,
  INDUSTRIES,
  type CreateResidentInput,
} from "@/lib/schemas/admin";
import { createResident } from "@/lib/api/endpoints/admin";
import { ApiError } from "@/lib/api/client";

export function AddResidentForm({
  estateId,
  onDone,
}: {
  estateId?: string;
  onDone: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateResidentInput>({
    resolver: zodResolver(createResidentSchema),
    mode: "onBlur",
    defaultValues: { role: "resident" },
  });

  const role = watch("role");
  const isBusiness = role === "business_owner";

  const mutation = useMutation({
    mutationFn: (values: CreateResidentInput) =>
      createResident({ ...values, estateId } as CreateResidentInput & {
        estateId?: string;
      }),
    onSuccess: onDone,
    onError: (error) => {
      /**
       * Map the backend's per-field errors onto the actual inputs.
       *
       * This is what the fieldErrors plumbing was for. Instead of a banner
       * saying "Validation failed", the message lands beside the field that
       * caused it — which is the difference between a user fixing it in five
       * seconds and giving up.
       */
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          setError(field as keyof CreateResidentInput, {
            type: "server",
            message: messages[0],
          });
        }
      }
    },
  });

  const bannerMessage =
    mutation.error instanceof ApiError
      ? mutation.error.fieldErrors
        ? null // Already shown on the fields themselves.
        : mutation.error.detail
      : mutation.error
        ? (mutation.error as Error).message
        : null;

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-4"
    >
      <FormError message={bannerMessage} />

      <Field label="Move-In Date?" error={errors.moveInDate?.message}>
        <TextField type="date" {...register("moveInDate")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First Name" error={errors.firstName?.message}>
          <TextField placeholder="Enter First Name" {...register("firstName")} />
        </Field>
        <Field label="Last Name" error={errors.lastName?.message}>
          <TextField placeholder="Enter Last Name" {...register("lastName")} />
        </Field>
      </div>

      <Field label="Phone" error={errors.phoneNumber?.message}>
        <TextField
          type="tel"
          placeholder="0000 000 0000"
          {...register("phoneNumber")}
        />
      </Field>

      <Field label="Email Address" error={errors.email?.message}>
        <TextField
          type="email"
          placeholder="Enter your email address"
          {...register("email")}
        />
      </Field>

      <Field label="Home Address" error={errors.address?.message}>
        <TextField
          placeholder="Enter your Home address"
          {...register("address")}
        />
      </Field>

      <RadioCards
        legend="I Am A"
        name="role"
        value={role}
        onChange={(value) =>
          setValue("role", value as CreateResidentInput["role"], {
            shouldValidate: true,
          })
        }
        options={[
          { value: "resident", label: "Resident" },
          { value: "business_owner", label: "Business Owner" },
        ]}
      />

      {isBusiness ? (
        <>
          <Field label="Business Name" error={errors.businessName?.message}>
            <TextField
              placeholder="What is the registered name"
              {...register("businessName")}
            />
          </Field>

          <Field label="Industry" error={errors.industryType?.message}>
            <SelectField
              placeholder="Select the industry the business belong"
              options={INDUSTRIES}
              {...register("industryType")}
            />
          </Field>
        </>
      ) : null}

      <Field
        label="Create Password"
        error={errors.password?.message}
        hint="The resident can change this after signing in."
      >
        <PasswordField
          autoComplete="new-password"
          placeholder="Create Password for the resident"
          {...register("password")}
        />
      </Field>

      <div className="flex justify-center pt-2">
        <Button
          type="submit"
          variant="deep"
          size="lg"
          loading={mutation.isPending}
          className="w-full sm:w-auto sm:px-12"
        >
          Create Account
        </Button>
      </div>
    </form>
  );
}
