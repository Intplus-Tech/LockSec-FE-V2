"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FormError } from "@/components/ui/form-error";
import { StatusPill } from "@/components/ui/status-pill";
import { getAccessCode, getResidentProfile } from "@/lib/api/endpoints/resident";
import { titleCase } from "@/lib/format";
import { expiryLabel } from "@/lib/access-code-status";
import { displayPlate } from "@/lib/schemas/access-code";

/**
 * The "Code Successfully Generated" screen.
 *
 * Reached by id rather than by passing the created code through component
 * state, which means the page survives a refresh and can be revisited from
 * history. That matters here more than usual: this is the screen a resident
 * comes back to when their visitor rings from the gate.
 */
export function CodeResult({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const code = useQuery({
    queryKey: ["access-code", id],
    queryFn: () => getAccessCode(id),
  });

  const profile = useQuery({
    queryKey: ["resident", "profile"],
    queryFn: getResidentProfile,
  });

  const copy = async () => {
    if (!code.data?.code) return;
    try {
      await navigator.clipboard.writeText(code.data.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused (insecure context, denied
      // permission). Failing silently is fine — the code is on screen and
      // can be read out.
    }
  };

  const visitorName = [code.data?.firstName, code.data?.lastName]
    .filter(Boolean)
    .join(" ");

  const expiry = expiryLabel(code.data?.codeExpiresAt);

  const shareText = code.data
    ? `Your LockSec access code is ${code.data.code}. Show it at the gate.`
    : "";

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="surface-stars px-5 pb-7 pt-6 text-center text-white min-[400px]:px-6">
        <h1 className="mx-auto max-w-[16ch] text-2xl font-extrabold tracking-tight">
          Code Successfully Generated!
        </h1>
      </header>

      <main id="main" className="flex-1 px-5 py-7 min-[400px]:px-6">
        <div className="mx-auto w-full max-w-md">
          {code.isError ? (
            <FormError message="We couldn't load this code. It may have been removed." />
          ) : null}

          <div className="flex items-center justify-center gap-3">
            {code.isLoading ? (
              <Skeleton className="h-12 w-52" />
            ) : (
              <>
                {/* Tabular figures and wide tracking so the digits are easy
                    to read aloud over a phone without transposing them. */}
                <p className="font-mono text-[2.75rem] font-extrabold leading-none tracking-[0.1em] text-heading">
                  {code.data?.code}
                </p>
                <button
                  type="button"
                  onClick={copy}
                  aria-label={copied ? "Code copied" : "Copy code"}
                  className="inline-flex size-11 items-center justify-center rounded-field text-faint transition-colors hover:text-heading"
                >
                  {copied ? (
                    <Check className="size-5 text-ok" aria-hidden="true" />
                  ) : (
                    <Copy className="size-5" aria-hidden="true" />
                  )}
                </button>
              </>
            )}
          </div>

          {/* Announced politely so a screen-reader user gets confirmation
              that the copy worked, without the focus moving. */}
          <p className="sr-only" role="status">
            {copied ? "Code copied to clipboard" : ""}
          </p>

          {/* Codes expire ten minutes after they are created — confirmed
              against a real response, and documented nowhere. A resident who
              does not know that will hand out a code that has already died
              by the time their visitor reaches the gate. Say it plainly. */}
          {expiry ? (
            <p
              className={
                expiry === "Expired"
                  ? "mt-4 rounded-field bg-bad-tint px-3 py-2 text-center text-sm font-medium text-bad"
                  : "mt-4 rounded-field bg-warn-tint px-3 py-2 text-center text-sm font-medium text-warn"
              }
            >
              {expiry}
            </p>
          ) : null}

          <dl className="mt-7 space-y-4 rounded-card border border-hairline p-5">
            <Row label="Status">
              {code.isLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <StatusPill status={code.data?.status} />
              )}
            </Row>

            <Row label="Number of Visitor">
              {titleCase(code.data?.visitorType)}
              {code.data?.numOfPeople
                ? ` (${code.data.numOfPeople} ${
                    code.data.numOfPeople === 1 ? "person" : "people"
                  })`
                : ""}
            </Row>

            <Row label="Visitor Name">{visitorName || "—"}</Row>

            <Row label="Plate No.">
              {code.data ? displayPlate(code.data) : "—"}
            </Row>

            <div className="border-t border-hairline pt-4">
              <p className="text-sm text-muted">For:</p>
              <div className="mt-2 flex items-start justify-between gap-4">
                <span className="text-muted">
                  {[profile.data?.firstName, profile.data?.lastName]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </span>
                <span className="text-right font-medium text-heading">
                  {profile.data?.address || "—"}
                </span>
              </div>
            </div>
          </dl>

          <div className="mt-7 flex items-start justify-around gap-4 text-center">
            <Link
              href="/resident/access-codes/new"
              className="max-w-[12ch] text-sm font-medium text-brand"
            >
              Generate New Code
            </Link>
            <Link
              href="/resident"
              className="max-w-[12ch] text-sm font-medium text-brand"
            >
              Back to Dashboard
            </Link>
          </div>

          {code.data ? (
            <p className="mt-8 text-center">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm text-body"
              >
                <span
                  className="inline-flex size-6 items-center justify-center rounded-full bg-[#25D366] text-white"
                  aria-hidden="true"
                >
                  <WhatsAppGlyph />
                </span>
                Share via WhatsApp
              </a>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-heading">{children}</dd>
    </div>
  );
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
      <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.7-1.5-3.7-3.3-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.4 1.9.8 2.6.9 3.5.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3M12 21.5c-1.7 0-3.3-.5-4.7-1.3l-3.3.9.9-3.2A9.4 9.4 0 0 1 2.6 12 9.4 9.4 0 0 1 12 2.6a9.4 9.4 0 0 1 0 18.9M12 .7A11.3 11.3 0 0 0 .7 12c0 2 .5 3.9 1.5 5.6L.6 23.4l5.9-1.5c1.6.9 3.5 1.4 5.5 1.4A11.3 11.3 0 0 0 12 .7" />
    </svg>
  );
}
