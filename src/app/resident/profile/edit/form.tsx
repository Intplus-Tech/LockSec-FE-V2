"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Field } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { SelectField } from "@/components/ui/select-field";
import { RadioCards } from "@/components/ui/radio-cards";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Skeleton } from "@/components/ui/skeleton";
import {
  updateResidentSchema,
  type UpdateResidentInput,
} from "@/lib/schemas/resident";
import {
  getResidentProfile,
  updateResident,
} from "@/lib/api/endpoints/resident";
import { toDateInputValue } from "@/lib/format";

const INDUSTRIES = [
  { value: "technology", label: "Information Technology" },
  { value: "finance", label: "Banking & Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
] as const;

export function EditProfileForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["resident", "profile"],
    queryFn: getResidentProfile,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateResidentInput>({
    resolver: zodResolver(updateResidentSchema),
    mode: "onBlur",
  });

  // The form renders before the data arrives, so fill it in once the profile
  // lands. reset() rather than setValue() for each field, because reset also
  // updates the "pristine" baseline — otherwise the form would be considered
  // dirty the moment it loaded.
  useEffect(() => {
    if (!profile.data) return;
    reset({
      firstName: profile.data.firstName ?? "",
      lastName: profile.data.lastName ?? "",
      phoneNumber: profile.data.phoneNumber ?? "",
      moveInDate: toDateInputValue(profile.data.moveInDate),
      address: profile.data.address ?? "",
      role:
        profile.data.role === "business_owner" ? "business_owner" : "resident",
      businessName: profile.data.businessName ?? "",
      industryType:
        (profile.data.industryType as UpdateResidentInput["industryType"]) ??
        undefined,
    });
  }, [profile.data, reset]);

  const role = watch("role");
  const isBusiness = role === "business_owner";

  const mutation = useMutation({
    mutationFn: (values: UpdateResidentInput) => {
      if (!profile.data?._id) throw new Error("Profile not loaded yet");
      return updateResident(profile.data._id, values);
    },
    onSuccess: () => {
      // Drop the cached profile so the view screen shows the new values
      // rather than what it fetched before the edit.
      queryClient.invalidateQueries({ queryKey: ["resident", "profile"] });
      router.push("/resident/profile");
    },
  });

  if (profile.isLoading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
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

      <div className="grid gap-5 min-[400px]:grid-cols-2 min-[400px]:gap-3">
        <Field label="First Name" error={errors.firstName?.message}>
          <TextField autoComplete="given-name" {...register("firstName")} />
        </Field>
        <Field label="Last Name" error={errors.lastName?.message}>
          <TextField autoComplete="family-name" {...register("lastName")} />
        </Field>
      </div>

      {/* Email is shown but not editable — changing a login identifier is a
          different operation with its own verification, and this endpoint
          does not accept it. */}
      <Field label="Email" hint="Contact your estate office to change this.">
        <TextField
          readOnly
          value={profile.data?.email ?? ""}
          className="bg-canvas text-muted"
        />
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
        value={role ?? "resident"}
        onChange={(value) =>
          setValue("role", value as UpdateResidentInput["role"], {
            shouldValidate: true,
            shouldDirty: true,
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

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={mutation.isPending}
        disabled={!isDirty}
      >
        Update
      </Button>
    </form>
  );
}
