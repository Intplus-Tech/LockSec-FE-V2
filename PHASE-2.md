# Phase 2 — the resident app

No new packages. Copy `src/` over yours.

## Routes

| Route | Screen |
|---|---|
| `/resident` | Dashboard |
| `/resident/access-codes/new` | Generate Access Code |
| `/resident/access-codes/[id]` | Code Successfully Generated |
| `/resident/bills/new` | Make Estate Bill |
| `/resident/bills/summary` | Payment Summary |
| `/resident/bills/success` | Payment Successfully |
| `/resident/history` | View History (two tabs) |
| `/resident/profile` | Profile Settings |
| `/resident/profile/edit` | Edit Profile |

`app/resident/page.tsx` replaces your phase-2 placeholder.

## Two things I changed from the design, deliberately

**The dashboard's download icon is now sign out.** The Figma shows a
download icon in the header with no explained purpose, and the resident app
has no logout control anywhere — which is a gap, not a decision. An account on
a shared phone needs a way out. Sign out is also on the Profile page, where
people look for it. Tell me what the download icon was meant to do and I will
put it back.

**The estate bill picker is single-select.** Your Figma shows checkboxes —
Estate Dues, Utility, Project, Others — but the form field displays one value
and `POST /payments/initiate` takes one `type`. Paying several bills at once
is a different feature, not a styling choice. Worth settling with your
designer.

## Numbers that are derived, not fetched

Three figures on screen have no endpoint behind them. Each is computed here
and each is a guess worth checking:

- **Active Code** — counted from the resident's own codes where status is
  `active`.
- **Amount Due** — the sum of the estate's enabled dues. This does not
  subtract what has already been paid, because nothing in the API says what
  has. Almost certainly wrong for a resident who is up to date.
- **Service charge (₦100)** — appears only in the Figma. Hard-coded and named
  `SERVICE_CHARGE` in two files so it is findable.

A single `GET /residents/summary` returning active codes and an outstanding
balance would replace all three and be correct rather than approximate.

## What to test

Sign in as your resident, then:

1. Generate an access code with **Coming with Vehicle = No**. The plate field
   should not appear. Switch to Yes and it should, and submitting without a
   plate should show an error on that field.
2. On the code screen, tap the copy icon — the icon becomes a tick.
3. Go back to the dashboard. Active Code should have gone up by one.
4. History → both tabs. Change tab, then refresh the page: the tab should
   survive, because it lives in the URL.
5. Profile → edit → change your address → Update. The profile view should
   show the new value immediately, not the old cached one.
6. Keyboard: on History, focus a tab and press the left and right arrows.

## Backend issues this surfaced

Adding to the list — these are new:

9. **`PATCH /residents/{id}` is documented "Admin only"** but the design has
   residents editing their own profile. Either the docs are wrong or the
   endpoint is, and Edit Profile will 403 until it is resolved. This is the
   one most likely to block you.
10. **No resident summary endpoint** — see above.
11. **`POST /payments/initiate` response shape unknown.** The documented
    `PaymentResponse` contains no payment-provider URL, which cannot be right
    for a system taking card payments. The code looks for a redirect URL under
    seven common names and falls through to the success screen if it finds
    none. Complete one real payment and we can tighten it.
12. **No service charge in the API.**

## Next

Phase 3 is the security app: the keypad, code validation, the two valid-entry
results, and the expired / not-available error states. Short phase.

Before it: create a security account so we can confirm the `security` role
string and the real shape of `POST /securities/login`. Both are still guesses,
and the `estate_admin` surprise showed what a wrong guess costs.
