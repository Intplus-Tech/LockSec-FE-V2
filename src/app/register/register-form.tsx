"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
  registerResidentSchema,
  type RegisterResidentInput,
} from "@/lib/schemas/auth";
import { registerResident } from "@/lib/api/endpoints/auth";

/** From the Figma's industry modal, mapped to the API's enum values. */
const INDUSTRIES = [
  { value: "technology", label: "Information Technology" },
  { value: "finance", label: "Banking & Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
] as const;

export function ResidentRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The estate comes from the admin's invite link.
  const estateId = searchParams.get("estate") ?? "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RegisterResidentInput>({
    resolver: zodResolver(registerResidentSchema),
    mode: "onBlur",
    defaultValues: { role: "resident", estateId },
  });

  const role = watch("role");
  const isBusiness = role === "business_owner";

  const mutation = useMutation({
    mutationFn: registerResident,
    onSuccess: () => {
      const email = encodeURIComponent(getValues("email"));
      router.push(`/estate/verify-email?flow=resident&email=${email}`);
    },
  });

  // Without an estate id the API will reject the registration, so say so up
  // front rather than letting someone fill in nine fields and then fail.
  if (!estateId) {
    return (
      <div className="rounded-card border border-hairline bg-canvas p-5 text-sm">
        <h2 className="font-semibold text-heading">
          You need an invite link
        </h2>
        <p className="mt-2 text-body">
          Residents join through a link from their estate admin, which connects
          the account to the right estate. Ask your estate office for it.
        </p>
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
      />

      <input type="hidden" {...register("estateId")} />

      {/* Stacked below 400px. Two 150px columns leave no room for a label
          like "Phone Number" plus its error text, and the fields become
          uncomfortable to tap accurately. */}
      <div className="grid gap-5 min-[400px]:grid-cols-2 min-[400px]:gap-3">
        <Field label="First Name" error={errors.firstName?.message}>
          <TextField autoComplete="given-name" {...register("firstName")} />
        </Field>
        <Field label="Last Name" error={errors.lastName?.message}>
          <TextField autoComplete="family-name" {...register("lastName")} />
        </Field>
      </div>

      <Field label="Email" error={errors.email?.message}>
        <TextField type="email" autoComplete="email" {...register("email")} />
      </Field>

      <Field label="Phone Number" error={errors.phoneNumber?.message}>
        <TextField type="tel" autoComplete="tel" {...register("phoneNumber")} />
      </Field>

      <Field label="Move-In Date" error={errors.moveInDate?.message}>
        <TextField type="date" {...register("moveInDate")} />
      </Field>

      <Field label="Address" error={errors.address?.message}>
        <TextField autoComplete="street-address" {...register("address")} />
      </Field>

      <RadioCards
        legend="I Am A"
        name="role"
        value={role}
        onChange={(value) =>
          setValue("role", value as RegisterResidentInput["role"], {
            shouldValidate: true,
          })
        }
        options={[
          { value: "resident", label: "Resident" },
          { value: "business_owner", label: "Business Owner" },
        ]}
      />

      {/* Business fields appear only for business owners, matching the two
          register variants in the design. Conditionally rendered rather than
          hidden with CSS, so they are not in the tab order when they do not
          apply. */}
      {isBusiness ? (
        <>
          <Field label="Business Name" error={errors.businessName?.message}>
            <TextField
              autoComplete="organization"
              {...register("businessName")}
            />
          </Field>

          <Field label="Industry" error={errors.industryType?.message}>
            <SelectField
              placeholder="Select an industry"
              options={INDUSTRIES}
              {...register("industryType")}
            />
          </Field>
        </>
      ) : null}

      <Field
        label="Set Password"
        error={errors.password?.message}
        hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
      >
        <PasswordField autoComplete="new-password" {...register("password")} />
      </Field>

      <Button type="submit" size="lg" fullWidth loading={mutation.isPending}>
        Register
      </Button>
    </form>
  );
}
