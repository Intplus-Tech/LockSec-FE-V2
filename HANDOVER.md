# LockSec — handover brief for a new chat

Paste this whole file into the new conversation as your first message, with a
line at the top saying: *"This is the context for work we're continuing.
Read it, then I'll tell you what's next."*

---

## Who I am and what this is

I'm Olayemi, the frontend developer. LockSec is a visitor access control
system for Nigerian residential estates, built for Intplus. Residents create a
short code for each expected visitor, security checks that code at the gate,
and the estate office manages residents, guards and estate dues from one
dashboard.

I rebuilt the entire frontend from scratch as a single Next.js application
serving all three roles. It is finished and deployed. There is also a new
project lead joining, and I have sent her a walkthrough document.

## Where everything lives

| What | Where |
|---|---|
| Live site | https://lock-sec-fe-v2.vercel.app |
| Repo | github.com/Intplus-Tech/LockSec-FE-V2 (branch `main`) |
| Local folder | `~/locksec-fe` (Windows, Git Bash) |
| Backend API | https://locksec-be-ver2.onrender.com/api/v1 |
| API docs | https://locksec-be-ver2.onrender.com/api-docs/ |
| API spec snapshot | `openapi.json` in the repo root |

Vercel is owned by my boss; I don't have team access, so environment variable
changes go through him. Pushing to `main` deploys automatically.

## The stack

Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, TanStack
Query, React Hook Form with Zod 4, lucide-react.

## How it's architected

**One app, three areas.** `/resident`, `/security`, `/admin`, plus `/estate/*`
for estate sign-up and sign-in, and `/login` and `/register` for residents.

**Tokens live in httpOnly cookies**, never in browser JavaScript. Every
authenticated request goes through `/api/proxy/[...path]` on our own server,
which attaches the token and refreshes it when it expires. The backend URL is
never exposed to the browser. This is the BFF pattern.

**Role gating** is in `src/proxy.ts` (middleware was renamed to proxy in Next
16). It redirects each role to its own area before any page renders. The
backend enforces permissions independently.

**Failures degrade honestly.** A `tolerate()` wrapper in the endpoint files
catches specific known failures (500, 502, 503, 504) and returns a flag, so
screens say "unavailable" instead of showing a confident zero. This exists
because an early version showed a resident ₦0 owing when the server was
unreachable, which they would have believed.

### Key folders

```
src/app/admin           estate admin screens
src/app/resident        resident screens
src/app/security        gate screens
src/app/estate          estate sign-up, sign-in, password reset
src/app/api             sign-in handlers and the backend proxy
src/app/page.tsx        the public marketing landing page
src/components/marketing  nav, newsletter, background artwork (decor.tsx)
src/lib/api/endpoints   every backend call, one file per area
src/lib/schemas         Zod validation for forms and API responses
src/lib/dues-math.ts    derived balance figures (see caveat below)
```

## Confirmed API behaviours that differ from the docs

These were all found by making real calls. The documentation has been wrong
repeatedly, so **never trust the spec over a live response**.

- Responses are `{ message, data }` — there is no `ok` field.
- Login returns `{ data: { user, token, refreshToken } }`. The field is
  `token`, not `accessToken`.
- Role strings are `resident`, `estate_admin`, `security`. Not `admin`.
- Access codes last 24 hours. A brand-new code has status `"inactive"`, which
  means "issued, not yet used" — it must still be honoured at the gate.
- Payment type is `estate_dues`, though the spec still says `estate_payments`.
- Payments go through Squad. The initiate response carries `checkout_url`
  (snake case) and `transaction_ref`, and amounts are in kobo.
- Reference fields like `estateId` and `userId` arrive sometimes as a bare id
  string and sometimes as a populated object. `src/lib/schemas/ref.ts` accepts
  both.

## What works, verified against the live API

Sign-up, email verification, sign-in and sign-out for all three roles, on the
live site. Password change and reset. Creating access codes and validating
them at the gate, including showing the guard which resident the visitor is
visiting. Residents seeing and paying estate bills. Admin management of
residents, guards and bills. Server-side search and pagination on all admin
tables. Estate settings that save.

## What's still outstanding

**Backend, two items.** There are no summary endpoints, so the admin
dashboard's three headline figures and the per-resident balance are worked out
in the browser and are approximations — `src/lib/dues-math.ts` explains the
assumption and why it's only an estimate. And `/transactions/estate` returns
`userId` as a bare id, so the Payments table can't show who paid, and the
Overdue column marks everyone overdue. The backend developer has been asked to
populate it.

**Not yet tested end to end.** A real Squad payment through to completion.
Residents editing their own profile, which the API documents as admin-only.
Admin adding a resident directly. CSV exports.

**Needs decisions, not code.** The marketing page says Basic is free and
Professional is ₦100,000; an earlier Figma said ₦150,000 and ₦200,000. The
backend has no plans created yet, so this must be settled before it does.
Several marketing claims also outrun the product — an installable PWA, bulk
onboarding, automated SMS reminders, time-restricted access rules. Terms of
Service and Data Processing pages don't exist and need legal text.

**Operational.** The backend is on Render's free tier and sleeps; first
requests after a quiet period can take up to a minute, and I've seen several
short outages. It should move to a paid tier before any demo. Also, an error
message once revealed the database name `LockSec-Prod-DB`, so development may
still be writing to production — worth confirming.

## What I'm working on right now

The public marketing landing page at `src/app/page.tsx`, matching a Figma
design. Done so far: the hero, the "At its core" intro, the four feature cards
with real product screenshots, pricing, and the closing call-to-action section
with its large LockSec shield backdrop.

The background artwork is drawn as SVG in
`src/components/marketing/decor.tsx` — a pale paper plane, a fan of fine
lines, a dashed flight path, and the shield. All of it was traced by measuring
the Figma screenshots rather than eyeballing them, which mattered: the
shield's foot is a true semicircle whose radius is exactly half its width, and
the whole mark is essentially square at 404 by 406.

Images in `public/`: `security-image.png`, `security-iphone.png`,
`dashboard-shot.png`, `Dashboard-admin.png`, `visitors-code.png`,
`payment-image.png`. Two are unused — `settings-dues.png` and
`resident-management.png`. Note `Dashboard-admin.png` has a capital D while
everything else is lowercase; Linux is case-sensitive and Vercel runs Linux,
so that's worth renaming.

## How I work, and what I need from a new chat

I'm on Windows using Git Bash. I can't edit files inline well, so **send me
complete files or a zip, never a patch or a diff**. Give me one command per
line so I can copy them individually.

**Always give me a verification command after a copy.** Something like
`grep -c "somethingNew" src/path/file.tsx` — a silent no-op copy has cost us
an hour more than once, because `cp -r` from a missing folder fails silently.

**Never rewrite a file from an older copy.** This has broken working code
twice: once losing registration schemas, once reintroducing a `z.coerce` bug
that failed the build. Edit the current version, or ask me to paste it first.

**Run `npm run build` before every push.** The dev server doesn't typecheck,
so type errors only appear at build time. Several deploys failed this way.

**Don't guess at API behaviour — ask me to run a check.** Pasting a script
into the browser console while signed in is quick and has settled every
disagreement between the docs and reality.

Two things I'd rather you didn't do: don't claim something works because the
build passed (a sign-up button once did nothing while the build was clean),
and don't invent a number when data is missing — say it's unavailable instead.

---

*If you need any file's current contents, ask me to `cat` it. If you need to
know what the API actually does, ask me to run a console script. Both are
faster than a wrong guess.*
