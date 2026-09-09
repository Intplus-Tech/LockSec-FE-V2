"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { createSubscription, listPlans } from "@/lib/api/endpoints/admin";
import { formatNaira } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import type { Plan } from "@/lib/schemas/admin";

/**
 * "Choose your plan" from the Figma.
 *
 * Plans come from GET /plans. The two cards from the design are shown as a
 * fallback when the backend has none, so the screen is never empty — but a
 * fallback plan has no real id, so subscribing to one cannot work. The button
 * says so plainly rather than failing with a server error.
 */
const FALLBACK_PLANS: Plan[] = [
  {
    _id: "",
    type: "Basic",
    price: 150000,
    description: "Perfect for small communities starting with access control.",
    features: [
      "Up to 150 residential units",
      "Visitor code generation",
      "2 admin accounts",
      "Email support",
      "Basic payment tracking (4% transaction fee)",
    ],
  },
  {
    _id: "",
    type: "Professional",
    price: 200000,
    description: "For growing estates needing advanced management.",
    features: [
      "Up to 500 residential units",
      "Custom access rules (time/date restrictions)",
      "Automated payment reminders",
      "Priority support (24hr response)",
      "Financial reporting dashboard",
      "Reduced 2% transaction fee",
    ],
  },
];

/** Trial length for the Professional card, per the design's "14-Day". */
const TRIAL_DAYS = 14;

export function PlanModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [chosen, setChosen] = useState<string | null>(null);

  const plans = useQuery({
    queryKey: ["plans"],
    queryFn: listPlans,
    enabled: open,
  });

  const live = plans.data?.value ?? [];
  const usingFallback = live.length === 0;
  const rows = usingFallback ? FALLBACK_PLANS : live;

  const subscribe = useMutation({
    mutationFn: ({ planId, trial }: { planId: string; trial: boolean }) => {
      const start = new Date();
      const end = new Date(start);

      // A trial runs fourteen days; a paid plan runs a month. The API takes
      // explicit dates rather than a duration, so we compute both.
      if (trial) {
        end.setDate(end.getDate() + TRIAL_DAYS);
      } else {
        end.setMonth(end.getMonth() + 1);
      }

      return createSubscription({
        planId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
    },
    onSuccess: () => {
      // The dashboard checks for a subscription to decide whether to offer
      // this modal, so it has to refetch.
      queryClient.invalidateQueries({ queryKey: ["estate", "subscription"] });
      onClose();
    },
  });

  const errorMessage = subscribe.error
    ? subscribe.error instanceof ApiError
      ? subscribe.error.status === 409
        ? "You already have a subscription on this estate."
        : subscribe.error.detail
      : (subscribe.error as Error).message
    : null;

  return (
    <Modal open={open} onClose={onClose} title="Choose your plan" size="lg">
      <FormError message={errorMessage} className="mb-5" />

      {usingFallback ? (
        <p className="mb-5 rounded-field bg-warn-tint px-3 py-2.5 text-sm text-warn">
          These are the plans from the design. The server has none configured,
          so they cannot be subscribed to yet — ask your backend developer to
          create them via <code>POST /plans</code>.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        {rows.map((plan, index) => {
          const planId = plan._id || plan.id || "";
          const trial = index === 1;
          const busy = subscribe.isPending && chosen === planId;

          return (
            <article
              key={planId || `fallback-${index}`}
              className="flex flex-col rounded-card border border-hairline p-5"
            >
              <h3 className="text-lg font-bold uppercase tracking-wide text-heading">
                {plan.type ?? "Plan"}
              </h3>
              <p className="mt-2 text-sm text-muted">{plan.description}</p>

              <p className="mt-5">
                <span className="text-3xl font-extrabold text-brand-deep">
                  {formatNaira(plan.price ?? 0)}
                </span>
                <span className="ml-1 text-sm text-muted">/monthly</span>
              </p>

              <p className="mt-5 text-sm font-semibold text-heading">
                Core Features:
              </p>
              {trial ? (
                <p className="mt-1 text-sm font-medium text-body">
                  Everything in Basic, plus:
                </p>
              ) : null}

              <ul className="mt-3 flex-1 space-y-2.5">
                {(plan.features ?? []).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-brand"
                      aria-hidden="true"
                    />
                    <span className="text-body">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={trial ? "deep" : "outline"}
                fullWidth
                className="mt-6 rounded-full"
                loading={busy}
                disabled={!planId || subscribe.isPending}
                onClick={() => {
                  setChosen(planId);
                  subscribe.mutate({ planId, trial });
                }}
              >
                {!planId
                  ? "Not available yet"
                  : trial
                    ? `Start ${TRIAL_DAYS}-Day Free Trial`
                    : "Get Started for Free"}
              </Button>
            </article>
          );
        })}
      </div>

      <p className="mt-6 text-center">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-brand underline underline-offset-4"
        >
          I want to look around first
        </button>
      </p>
    </Modal>
  );
}
