# Phase 1 — design system, shells, and every auth screen

## Install

```bash
npm install lucide-react tw-animate-css
```

Everything else is already in the project.

Copy `src/` over your existing `src/`. Two files replace ones you already
have: `app/globals.css` and `lib/auth/roles.ts`. `proxy.ts` replaces the one
you renamed — take this version, it adds per-role login routing.

Add to `.env.local`:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Routes in this phase

| Route | Screen |
|---|---|
| `/` | Public landing page |
| `/login` | Resident sign in (mobile) |
| `/register` | Resident / business owner sign up |
| `/security/login` | Security personnel ID |
| `/estate/login` | Estate admin sign in (desktop) |
| `/estate/register` | Create estate account |
| `/estate/forgot-password` | Request reset email |
| `/estate/verify-token` | Six-digit reset token |
| `/estate/reset-password` | Set new password |
| `/estate/verify-email` | Six-digit email verification |

Plus `not-found`, `error`, `robots.txt` and `sitemap.xml`.

## What to test

```bash
npm run dev
```

1. `/login` — sign in with your test resident. You should land on `/resident`
   (which 404s until phase 2 — that is correct).
2. `/login` with a wrong password — the error banner should show the
   backend's own wording.
3. Try `/admin` while signed in as a resident — you should be bounced back
   to `/resident`.
4. Tab through any form with the keyboard. Every control should show a
   visible blue focus ring.
5. Narrow the browser to phone width. The resident screens should look like
   the Figma; the estate screens should stay usable.

## Design tokens

All in `app/globals.css` under `@theme`. Tailwind v4 has no config file — that
block *is* the config. Change a hex there and it changes everywhere.

Two blues on purpose: `brand` (#2563EB) for the mobile apps, `brand-deep`
(#1A28C8) for the desktop admin. Both appear in your Figma and they are not
interchangeable.

The starfield and grid backgrounds are `surface-stars` and `surface-grid`,
drawn in CSS rather than shipped as images — a few hundred bytes, no network
request, scales to any screen.

## Decisions worth knowing

**Font is a guess.** Plus Jakarta Sans is close to the Figma but I could not
read the exact family from screenshots. Confirm it and change the one import
in `app/layout.tsx`.

**Native `<select>`, not a custom dropdown.** Your Figma shows custom-looking
dropdown panels. On a phone at a gate the OS picker is faster, works with one
thumb, and is already accessible. A custom listbox would match the mockup and
be worse to use.

**The six-box code input handles paste, backspace and arrow keys**, and
presents itself to screen readers as one labelled field rather than six
mystery boxes. This is the component most often built badly.

**Login pages are `noindex`.** Only `/` is indexed.

## Open questions for your boss or the backend developer

1. **Residents have no way to choose their estate.** The API requires
   `estateId` on registration and your design has no picker. Most likely
   residents are meant to arrive by invite link (`/register?estate=<id>`).
   Confirm before phase 2 — it changes the registration flow.
2. **Password reset has no "check token" endpoint.** The token is only
   validated when submitted with the new password, so the token screen
   carries it forward rather than verifying it. A wrong code surfaces one
   screen later than the design implies.
3. **No logout endpoint** on the backend. Signing out drops the cookies, but
   the refresh token stays valid for 30 days.
4. **Security login response shape is still unverified.** The handler accepts
   several plausible shapes. Create a security account and sign in once so we
   can tighten it.
5. **Role strings for security, admin and super admin are still guesses.**
   Only `resident` is confirmed. Each is a one-line fix in `lib/auth/jwt.ts`.
6. **The estate admin sidebar differs between screenshots** — some include
   "Access Control", some do not. Which is canonical?
7. **Status badges (On-Time / Partial / Overdue) and "Payments Percentage
   72/75" have no API source.** Computed client-side, or missing endpoints?

## Next

Phase 2 is the resident app: dashboard, generate access code, code
generated, estate bill, payment summary, payment success, history, profile,
edit profile.
