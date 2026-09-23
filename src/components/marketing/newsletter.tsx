"use client";

import { useState } from "react";

/**
 * Newsletter signup.
 *
 * There is no endpoint for this yet, and a form that silently swallows an
 * address is worse than one that admits it is not ready. So the form posts to
 * whatever is in NEXT_PUBLIC_NEWSLETTER_ACTION — a Mailchimp, Buttondown or
 * Formspree URL — and says plainly that it is not connected when that is
 * unset.
 *
 * Wiring it up later is one environment variable, with no code change.
 */
export function Newsletter() {
  const action = process.env.NEXT_PUBLIC_NEWSLETTER_ACTION;
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  if (!action) {
    return (
      <div className="mx-auto mt-6 max-w-lg text-center">
        <p className="text-sm text-white/55">
          Newsletter signup isn&rsquo;t connected yet. In the meantime, write to{" "}
          <a
            href="mailto:support@locksec.com"
            className="font-medium text-white underline underline-offset-4"
          >
            support@locksec.com
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      method="post"
      target="_blank"
      onSubmit={() => setDone(true)}
      className="mx-auto mt-6 flex w-full max-w-lg overflow-hidden rounded-field bg-white"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        className="min-w-0 flex-1 px-4 py-3 text-sm text-heading outline-none placeholder:text-faint"
      />
      <button
        type="submit"
        className="shrink-0 bg-brand-navy px-5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-navy/90"
      >
        Subscribe now
      </button>

      <p className="sr-only" role="status">
        {done ? "Subscription submitted" : ""}
      </p>
    </form>
  );
}
