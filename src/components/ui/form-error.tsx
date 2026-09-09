"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The banner shown when a whole form fails — bad credentials, rate limit,
 * server unreachable.
 *
 * role="alert" means it is announced the moment it appears, without the user
 * having to go looking for it. That matters most for the people most likely
 * to miss a colour change.
 *
 * The copy comes from the server, which returns plain English messages.
 */
export function FormError({
  message,
  tone = "light",
  className,
}: {
  message?: string | null;
  tone?: "light" | "slab";
  className?: string;
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-field px-3 py-2.5 text-sm",
        tone === "light"
          ? "bg-bad-tint text-bad"
          : "bg-bad/15 text-red-300",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
