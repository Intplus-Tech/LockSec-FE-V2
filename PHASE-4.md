# Phase 4 — the estate admin dashboard

No new packages. Copy `src/` over yours.
`app/admin/page.tsx` replaces your placeholder.

## Routes

| Route | Screen |
|---|---|
| `/admin` | Dashboard — estate info, three stats, dues chart, recent transactions |
| `/admin/residents` | Resident Management + Add New Resident + Past Payment |
| `/admin/payments` | Payments & Dues |
| `/admin/security` | Security Personnel Management + Add New Security |
| `/admin/settings?tab=dues` | Dues: list, create, edit, enable, delete |
| `/admin/settings?tab=password` | Update Password |

## Things I built differently from the Figma, and why

**The chart is hand-drawn SVG, not a library.** One chart does not justify
Recharts' bundle, and installing anything on this project has been painful.
More importantly it is *accessible*: the SVG is `aria-hidden` and the same
numbers are rendered as a visually-hidden table, so a screen-reader user gets
the data rather than silence. Most charts on the web give them nothing.

**Modals use the native `<dialog>` element.** Focus trapping, Escape to
close, an inert background and top-layer rendering all come free from the
platform. Hand-rolled modals almost always miss at least two of those.

**The sidebar collapses below `lg`.** Your Figma is desktop-only; a web app
has to work on a laptop and a tablet anyway.

**"Disable Resident" is "Remove Resident".** The API offers `DELETE
/residents/{id}` and nothing else — there is no disable flag. Deleting is
destructive and irreversible, so it asks for confirmation and says so
plainly. If disabling is what your boss actually wants, the backend needs a
status field.

**Update Password sends a reset email.** There is no endpoint that accepts an
old password plus a new one. `/auth/reset-password` needs an emailed token.
Rather than ship a three-field form that cannot submit, this offers the flow
that works, with a note in the panel explaining why.

**The "Access Code" and "Payment Collection" master switches are not built.**
There is no estate-settings endpoint. Two toggles that silently do nothing
are worse than two toggles that are not there yet.

**Export is CSV, not Excel and PDF.** CSV opens in Excel and needs no
dependency. PDF would need a library; say the word if it is genuinely
required. Note the BOM in `lib/csv.ts` — without it Excel on Windows renders
every ₦ as mojibake.

## Numbers with no endpoint behind them

The API has no analytics route, so all three dashboard stats are derived from
the transaction and resident lists:

- **Amount Collected This Month** — successful transactions dated this month.
- **No. of Users** — total residents.
- **Due Collected %** — successful transactions as a share of all
  transactions. Your Figma's "82%" almost certainly means *of the money owed,
  this much came in*, which needs a per-resident expected amount the API does
  not expose. This is an honest approximation of a different question.

Also absent: per-resident **Total Dues** and **Overdues** columns, the
**"Payments Percentage: 72/75"** figure, and the **On-Time / Partial /
Overdue** badges. All four need data the API does not return. The tables show
what actually exists instead of inventing it.

**One `GET /estates/summary` would fix most of this.** Worth asking for.

## Search and filtering are client-side

The spec defines a `search` parameter in its shared components but never
attaches it to `/residents/estate` or `/transactions/estate`. For a few
hundred residents, filtering the list we already hold is fine. At a few
thousand it will not be, and the backend will need real search and filter
parameters.

## The security code problem

`securityCode` comes back only in the creation response. The list endpoint
does not return it and there is no reveal or regenerate route — so an admin
who closes the modal without writing it down may leave a guard permanently
unable to sign in.

The app now shows the code in a deliberate modal after creation, with a copy
button and a warning that it will not be shown again. That is damage control,
not a fix. **Backend issue 14 needs solving properly.**

## Test

1. Sign in as the estate admin → `/admin`. Stats and chart render, or read
   "Unavailable" honestly.
2. Residents → Add New Resident. Submit with a bad email — the error should
   appear **on the email field**, not in a banner. That is the fieldErrors
   plumbing paying off.
3. Create a security account → the code modal appears with a copy button.
4. Settings → Dues → Create New Dues → then toggle it off and on.
5. Narrow the window below 1024px — the sidebar becomes a hamburger.
6. Tab through a table with the keyboard, open a row menu, press Escape.
7. Export on any table → a CSV that opens cleanly in Excel with ₦ intact.

## Backend issues — final count 27

New this phase:

24. **No analytics or summary endpoint.** Every dashboard figure is derived.
25. **No estate settings endpoint** for the access-code and payment-collection
    master switches.
26. **No change-password endpoint** that accepts an old password.
27. **No disable flag on residents** — only delete.

Plus the three from earlier that still block real use:

18. `/dues/estate` refuses residents.
19. Access codes expire after ten minutes.
23. `/access-codes/resident` returns a 500.

## Where the project stands

All four phases are built and running against the live backend. What is left
is not frontend work:

- The twenty-seven backend issues, three of which are product-breaking.
- Terms of Service and Data Processing text, which needs a lawyer.
- Confirming the `super_admin` role string, which needs such an account to
  exist.
