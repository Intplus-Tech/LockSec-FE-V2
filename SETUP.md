# LockSec frontend — foundation

The auth layer and API plumbing. No screens yet, by design: these are the
pieces every screen will sit on top of.

## Getting it running

```bash
npx create-next-app@latest locksec-fe \
  --typescript --tailwind --app --src-dir --import-alias "@/*"

cd locksec-fe
npm install zod @tanstack/react-query react-hook-form @hookform/resolvers
npx shadcn@latest init
```

Then copy the `src/` folder from here over the generated one, and copy
`.env.example` to `.env.local`.

## What is in here

| File | Job |
|---|---|
| `lib/env.ts` | Reads environment variables, fails loudly if any are missing |
| `lib/auth/jwt.ts` | Decodes the token — the only place the user's role can be found |
| `lib/auth/cookies.ts` | httpOnly cookie storage for tokens |
| `lib/auth/roles.ts` | Which role may see which section |
| `lib/schemas/auth.ts` | Zod schemas for forms and for validating responses |
| `lib/api/backend.ts` | Server-side calls to the LockSec API |
| `lib/api/client.ts` | Browser-side calls to our own proxy |
| `app/api/auth/login` | Email + password login, sets cookies |
| `app/api/auth/security-login` | Security-code login, sets cookies |
| `app/api/auth/session` | "Who am I?" for client components |
| `app/api/auth/logout` | Clears cookies |
| `app/api/proxy/[...path]` | Forwards authenticated requests, refreshes tokens |
| `middleware.ts` | Redirects by role before pages render |

## How a request flows

```
Component
  -> apiRequest("/access-codes")        lib/api/client.ts
  -> POST /api/proxy/access-codes       browser to our own server
  -> reads httpOnly cookie              app/api/proxy/[...path]
  -> adds Authorization: Bearer <jwt>
  -> LockSec backend
  <- 401 if expired -> refresh -> retry
  <- JSON back to the component
```

The browser never holds a token and never learns the backend's URL.

## Route structure to build next

```
app/
  (auth)/          login, security/login, register, verify-email,
                   forgot-password, reset-password
  (resident)/      resident/...
  (security)/      security/...
  (admin)/         admin/...
```

Route groups — the folders in brackets — do not appear in the URL. They exist
so each phase can have its own `layout.tsx`, giving three different shells
(resident nav, security gate screen, admin sidebar) in one application.

## Backend issues to raise

Confirmed against live calls, not guesses:

1. **Docs do not match the implementation.** The spec says responses are
   `{ ok: true, data }`; they are actually `{ message, data }`. Login is
   documented flat with `accessToken`; it is really nested with `token`.
2. **Role is missing from the login response.** It exists only inside the
   JWT. Returning it in the body would be more conventional.
3. **`estateId` is not validated on registration.** A resident registered
   fine with a made-up estate ID.
4. **Login works on an unverified email.** If verification is meant to gate
   access, it currently does not.
5. **Broken `$ref`s in the spec.** `/estates` points at `CreateEstatesInput`
   and `EstatesResponse`; the real names are `CreateEstateInput` and
   `EstateResponse`. `/users/profile/update` points at `UpdateUserInput`,
   which is not defined anywhere.
6. **No logout endpoint.** Refresh tokens stay valid for 30 days after a
   user signs out.
7. **`/auth/refresh-token` is documented as returning only `refreshToken`** —
   with no access token, which would make it useless. Needs confirming.

## Still unknown

- The role strings for security, estate admin and super admin. Only
  `"resident"` is confirmed. Log in as each and check the token.
- The real response shape of `POST /securities/login`.
