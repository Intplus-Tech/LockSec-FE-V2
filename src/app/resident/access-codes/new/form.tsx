"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Field } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import {
  createAccessCodeFormSchema,
  toAccessCodePayload,
  VISITOR_TYPES,
  type CreateAccessCodeForm,
} from "@/lib/schemas/access-code";
import { createAccessCode } from "@/lib/api/endpoints/resident";

export function GenerateCodeForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateAccessCodeForm>({
    resolver: zodResolver(createAccessCodeFormSchema),
    mode: "onBlur",
    defaultValues: {
      visitorType: "guest",
      numOfPeople: 1,
      // A string, because that is what a <select> produces. The schema
      // expects a string here and converts to a boolean on submit.
      withVehicle: "false",
    },
  });

  const withVehicle = watch("withVehicle") === "true";

  const mutation = useMutation({
    mutationFn: createAccessCode,
    onSuccess: (code) => {
      // The dashboard's active-code count is now stale. Marking the query
      // invalid makes it refetch, so the number is right when the user
      // returns there.
      queryClient.invalidateQueries({ queryKey: ["access-codes"] });
      router.push(`/resident/access-codes/${code._id}?created=1`);
    },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        mutation.mutate(toAccessCodePayload(values)),
      )}
      className="space-y-5"
    >
      <FormError
        message={mutation.error ? (mutation.error as Error).message : null}
      />

      <Field label="Visitor Type:" error={errors.visitorType?.message}>
        <SelectField options={VISITOR_TYPES} {...register("visitorType")} />
      </Field>

      <div className="grid gap-5 min-[400px]:grid-cols-2 min-[400px]:gap-3">
        <Field label="First Name" error={errors.firstName?.message}>
          <TextField autoComplete="off" {...register("firstName")} />
        </Field>
        <Field label="Last Name" error={errors.lastName?.message}>
          <TextField autoComplete="off" {...register("lastName")} />
        </Field>
      </div>

      <Field label="Phone Number" error={errors.phoneNumber?.message}>
        <TextField type="tel" autoComplete="off" {...register("phoneNumber")} />
      </Field>

      <Field label="No. of Persons" error={errors.numOfPeople?.message}>
        <TextField
          type="number"
          inputMode="numeric"
          min={1}
          {...register("numOfPeople")}
        />
      </Field>

      <Field label="Coming with Vehicle?" error={errors.withVehicle?.message}>
        <SelectField
          options={[
            { value: "false", label: "No" },
            { value: "true", label: "Yes" },
          ]}
          {...register("withVehicle")}
        />
      </Field>

      {/* Only asked for when it applies. Rendered conditionally rather than
          disabled, so it stays out of the tab order too. */}
      {withVehicle ? (
        <Field
          label="Plate Number"
          error={errors.plateNum?.message}
          hint="Three letters, three digits, two letters."
        >
          <TextField
            autoComplete="off"
            placeholder="IKJ 827 QX"
            // The backend rejects unspaced plates without saying so. The
            // hint sets the expectation before they type.
            className="uppercase"
            {...register("plateNum")}
          />
        </Field>
      ) : null}

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={mutation.isPending}
        className="mt-2"
      >
        Generate Access Code
      </Button>
    </form>
  );
}
