"use client";

import { titleCase } from "@/lib/format";
import { displayPlate } from "@/lib/schemas/access-code";
import { residentFrom, type ValidatedCode } from "@/lib/schemas/security";

/**
 * The result screen after a code checks out.
 *
 * The Figma has two variants — one for a named visitor with guests and a
 * plate, one for a company with dashes in those rows. They are the same
 * screen: when a field does not apply it shows a dash. One component, no
 * branching.
 */
export function ValidEntry({
  entry,
  onBack,
}: {
  entry: ValidatedCode;
  onBack: () => void;
}) {
  const name =
    [entry.firstName, entry.lastName].filter(Boolean).join(" ") || "Visitor";

  const guests = entry.numOfPeople
    ? `${titleCase(entry.visitorType)} (${entry.numOfPeople} ${
        entry.numOfPeople === 1 ? "person" : "people"
      })`
    : "-";

  const resident = residentFrom(entry.userId);

  return (
    <div className="surface-stars flex min-h-dvh flex-col px-5 py-8 text-white sm:px-6">
      <main id="main" className="mx-auto w-full max-w-md">
        {/* role="status" so the outcome is announced on arrival rather than
            depending on the guard noticing the screen changed. */}
        <p role="status" className="text-center text-lg font-medium">
          Valid Entry
        </p>

        <h1 className="mt-14 break-words text-center text-display font-extrabold">
          {name}
        </h1>

        <dl className="mt-8 space-y-4">
          <Row label="Phone Number" value={entry.phoneNumber ?? "-"} />
          <Row label="No. of Guests" value={guests} />
          {/* Reads the withVehicle flag rather than the stored string, so the
              backend workaround placeholder never appears here. */}
          <Row label="Plate No." value={displayPlate(entry)} />
        </dl>

        <div className="mt-8 rounded-card border border-white/15 p-5">
          <p className="text-white/60">For:</p>
          {resident ? (
            <div className="mt-3 flex items-start justify-between gap-4">
              <span className="text-white/60">{resident.name ?? "—"}</span>
              <span className="text-right font-medium">
                {resident.address ?? "—"}
              </span>
            </div>
          ) : (
            // The API returns only the resident's id, not their name or
            // address, so the Figma's "Mr. Adebayo — Apt 12B Road M" cannot
            // be filled in. Say so plainly rather than showing a blank box a
            // guard cannot interpret.
            <p className="mt-3 text-sm text-white/40">
              Resident details not provided by the server.
            </p>
          )}
        </div>

        <p className="mt-12 text-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center px-4 text-sm font-medium text-brand"
          >
            Back
          </button>
        </p>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-white/50">{label}</dt>
      <dd className="break-words text-right font-medium">{value}</dd>
    </div>
  );
}
