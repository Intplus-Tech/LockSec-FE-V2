"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextField, type TextFieldProps } from "./text-field";
import { useTone } from "./field";

/**
 * A password input with the show/hide toggle from the design.
 *
 * Details that are easy to get wrong: the toggle is a real
 * <button type="button"> (without the type it would submit the form), its
 * accessible name changes with state so the user is told what pressing it
 * will do, and it is a 40px tap target rather than a 16px icon.
 */
export const PasswordField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = React.useState(false);
    const tone = useTone();
    const Icon = visible ? EyeOff : Eye;

    return (
      <TextField
        ref={ref}
        type={visible ? "text" : "password"}
        {...props}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className={cnToggle(tone)}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        }
      />
    );
  },
);

function cnToggle(tone: "light" | "slab" | "ink") {
  const base =
    "inline-flex size-10 items-center justify-center rounded-field transition-colors";
  return tone === "light"
    ? `${base} text-faint hover:text-body`
    : `${base} text-white/50 hover:text-white`;
}
