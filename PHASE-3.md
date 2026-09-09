# Phase 3 — the security app

No new packages. Copy `src/` over yours.

## Routes

| Route | Screen |
|---|---|
| `/security/login` | Personnel ID (already built in phase 1) |
| `/security` | Keypad, error states, and the valid-entry result |

`app/security/page.tsx` replaces your phase-3 placeholder.
`app/api/auth/security-login/route.ts` replaces the guesswork version.

## Test it

Sign in at `/security/login` with the code from the account you created:

    239097

Then:

1. **Type a wrong code** — six digits that do not exist — and press Check.
   You should see "Code not available" in red, the boxes outlined red, and
   the entry cleared ready for another try.
2. **Generate a real code** as your resident in another browser (or an
   incognito window, so both sessions can be open at once), then enter it
   here. You should get the Valid Entry screen.
3. **Use a physical keyboard**: type digits, press Backspace, press Enter.
   All three work without touching the on-screen keys.
4. **Check the same code twice.** It should still validate — but watch
   `amountUsed` climb in the API. See the note below.

## Why the result is not its own URL

Everywhere else in this app, state lives in the URL. Not here.

`POST /access-codes/validate` is a mutation — the backend increments
`amountUsed` each time it is called. If the result lived at
`/security/result?code=239097`, then a refresh, or back-then-forward, would
silently record a second entry for a visitor who arrived once. At a gate that
is a real integrity problem, not a cosmetic one.

So the result is held in memory and lost on refresh. That is the cheaper
mistake.

## What the design asks for that the API cannot supply

The Figma's result screen shows:

    For:
    Mr. Adebayo            Apt 12B Road M

`POST /access-codes/validate` returns the resident as an **id only** —
`userId: "64f1a2b3..."` — with no name or address. So the guard cannot see who
the visitor is actually here to see, which is arguably the most useful line on
the screen.

The code handles both shapes: if the backend starts populating `userId` as an
object, the block fills in with no frontend change. Until then it says
"Resident details not provided by the server" rather than showing an empty box
a guard cannot interpret.

**This is the request to make of your backend developer:** populate `userId`
on the validate response with `firstName`, `lastName` and `address`.

## Backend issues added this phase

13. **`middleName` is required** on `POST /securities`, but the Figma's "Add
    New Security" modal shows it as a plain field while marking Email
    "(optional)". Design and backend disagree.
14. **The security code is only returned once**, in the creation response. The
    Security Management table in the Figma has no code column, so an admin who
    closes that modal without writing it down has no way to recover it. Does
    `GET /securities/{id}` return it? If not, there needs to be a way to
    reveal or regenerate.
15. **The security token carries no `estateId`**, unlike resident and admin
    tokens. If validation is meant to be estate-scoped, confirm the backend
    derives the estate from the user record — a guard at Estate A must not be
    able to validate a code issued at Estate B.
16. **`validate` returns the resident as a bare id** — see above.
17. **Validation error responses have a fourth shape**:
    `{ message, errors: { body: { fieldErrors } } }`. Useful — it says which
    field failed — but our handlers currently discard it and show only
    "Validation failed". Worth wiring through so forms can highlight the
    offending field.

## Role strings — status

    resident       ✓ confirmed
    estate_admin   ✓ confirmed
    security       ✓ confirmed this phase
    business_owner — unverified
    super_admin    — unverified, no such account exists

## Next

Phase 4, the estate admin dashboard, is the largest: dashboard with chart,
resident management with three modals, payments and dues, security personnel
management, settings with its two tabs, and the plan picker. Desktop layout
with a sidebar — a different shell from everything so far.
