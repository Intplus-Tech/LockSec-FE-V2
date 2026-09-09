# Admin screens — full pass against the Figma

Eleven files. Copy `src/` over yours.

## What you flagged

**The "Note for the team" text is gone**, and Update Password is now the
three-field form your Figma shows: Old Password, New Password, re-enter,
Update Password button.

It posts to `PATCH /users/profile/update`, the only endpoint that plausibly
accepts a password change — its request schema is referenced in the spec but
never defined, so nobody knows what it takes. If the server rejects it, a
panel appears offering the email reset flow instead. The user always has a
route that works, and no note about implementation details on screen.

**Search is in the top bar** on the Dashboard, matching the design.
Pages without something to search omit it rather than showing a dead box.

**The estate address.** The estate record has no address field — the API
returns `estateName`, `fullName`, `email` and `phoneNumber` and nothing else,
so "Address not set" was permanent. Estate Info now shows the contact details
that do exist. Backend issue 29: add an address to the estate model.

## Everything else from the Figma, now built

**Dashboard** — y-axis gridlines and labels on the chart, the "This month"
period selector (month/quarter/year), the chart icon, an **Overdue** column,
**On-Time / Partial / Overdue** badges, pagination, and the **Choose your
plan** modal with both cards, feature lists and "I want to look around first".

**Resident Management** — **Total Dues** and **Overdues** columns, a status
column, the Overdues filter dropdown, Export as a menu offering **Excel** and
**Pdf**, and pagination. The Past Payment modal now shows the **Payments
Percentage** line.

**Payments & Dues** — the **Overdue** column, standing badges, export menu,
pagination.

**Security Management** — the **Status** column with its switch, export menu,
pagination.

**Settings → Dues** — the **Access Code** and **Payment Collection** master
switches, and **"How many Entrance do you have?"** appearing only when access
control is on. The bills table is hidden when collection is off, as in the
design. Bank Name is now a dropdown of Nigerian banks rather than a text box.

## Three figures the API cannot supply, and what I did instead

`lib/dues-math.ts` derives them, and the file explains itself:

    Total Dues  = one period of every enabled due
    Paid        = that resident's successful transactions
    Overdue     = Total Dues − Paid, floored at zero

The weakness is stated in the file: it assumes **one** outstanding period,
because nothing in the API says how many periods anyone is behind. A resident
three months in arrears looks identical to one who is one month behind.

Same for **Payments Percentage** — shown as a share of one period rather than
the Figma's "72/75", which needs an expected-payment count that does not
exist.

Delete that file the day the backend exposes a real balance. Until then it is
documented arithmetic rather than an invented number.

## Two controls that cannot save yet

The **Access Code** and **Payment Collection** switches have no endpoint.
They attempt `PATCH /estates/{id}`, so they will start working the moment the
backend supports them. If the call is refused, the switch **reverts** and says
so — it never looks like it saved when it did not.

The **security active switch** is the same story: there is no enabled flag on
the security model, so it explains and points at Remove instead of silently
doing nothing.

## Test

1. `/admin` — search in the top bar, period selector on the chart, y-axis
   labels, "Choose a plan" link if no subscription.
2. `/admin/residents` — Total Dues and Overdues columns, the filter dropdown,
   Export → Excel and Pdf, page numbers along the bottom.
3. `/admin/settings?tab=password` — the three-field form, no note.
4. `/admin/settings?tab=dues` — toggle Payment Collection off; the bills table
   should disappear. Toggle Access Code off; the entrance question should go.
5. Export → Pdf opens the print dialogue, where "Save as PDF" is a
   destination.

## Backend issues — now 30

29. **Estates have no address field**, though the dashboard design shows one.
30. **Security personnel have no active/inactive flag**, though the design
    shows a switch.

Still the three that block real use: `/dues/estate` refuses residents, codes
expire in ten minutes, and `/access-codes/resident` returns a 500.
