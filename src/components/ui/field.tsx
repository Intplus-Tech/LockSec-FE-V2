"use client";

import { createContext, useContext, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The plumbing that makes a form field accessible, done once.
 *
 * A correct field needs four things wired together: the label's `htmlFor`
 * pointing at the input's `id`, `aria-invalid` when there is an error,
 * `aria-describedby` pointing at the error or hint text, and `role="alert"`
 * on the error so a screen reader announces it the moment it appears.
 *
 * Doing that by hand on forty fields guarantees some of them will be wrong.
 * Instead the Field component generates the ids and hands them down through
 * context, and the inputs pick them up automatically.
 *
 *   <Field label="Email" error={errors.email?.message}>
 *     <TextField {...register("email")} />
 *   </Field>
 */

type Tone = "light" | "slab" | "ink";

interface FieldContextValue {
  id: string;
  errorId: string;
  hintId: string;
  hasError: boolean;
  hasHint: boolean;
  tone: Tone;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export function useField() {
  return useContext(FieldContext);
}

/** Everything an input needs in order to be described correctly. */
export function useFieldProps() {
  const field = useField();
  if (!field) return {};

  const describedBy =
    [field.hasError ? field.errorId : null, field.hasHint ? field.hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return {
    id: field.id,
    "aria-invalid": field.hasError || undefined,
    "aria-describedby": describedBy,
  };
}

export function useTone(): Tone {
  return useField()?.tone ?? "light";
}

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  tone?: Tone;
  /** Marks the field required and shows the asterisk from the design. */
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  error,
  hint,
  tone = "light",
  required,
  className,
  children,
}: FieldProps) {
  const base = useId();

  const value: FieldContextValue = {
    id: `${base}-input`,
    errorId: `${base}-error`,
    hintId: `${base}-hint`,
    hasError: Boolean(error),
    hasHint: Boolean(hint),
    tone,
  };

  return (
    <FieldContext.Provider value={value}>
      <div className={cn("space-y-1.5", className)}>
        {label ? (
          <label
            htmlFor={value.id}
            className={cn(
              "block text-sm",
              tone === "light" ? "text-muted" : "text-white/70",
            )}
          >
            {label}
            {required ? (
              <span className="text-bad" aria-hidden="true">
                {" "}
                *
              </span>
            ) : null}
          </label>
        ) : null}

        {children}

        {hint && !error ? (
          <p
            id={value.hintId}
            className={cn(
              "text-xs",
              tone === "light" ? "text-faint" : "text-white/50",
            )}
          >
            {hint}
          </p>
        ) : null}

        {error ? (
          <p id={value.errorId} role="alert" className="text-xs text-bad">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
