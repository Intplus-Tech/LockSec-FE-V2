# Build errors

Six files. Copy `src/` over yours, then **build before pushing**.

## Why these never appeared locally

`next dev` with Turbopack does not run TypeScript. `next build` does.

So type errors sit invisible through every `npm run dev` and surface only on
Vercel. From now on, before any push:

    npm run build

It takes a couple of minutes and catches exactly this class of problem. Worth
making a habit — a failed deploy in front of your boss is a worse place to
find out.

## 1. `onChoose` on PlanModal — my mistake

Fix 8 removed that prop. Fix 9 then shipped a `dashboard.tsx` built from the
version *before* fix 8, quietly reverting it. My error in how I was patching
files, not something you did.

## 2. `z.coerce.number()` breaks with React Hook Form

The real one, and worth understanding because it will come up again.

`z.coerce.number()` makes a schema's **input** type `unknown` while its
**output** stays `number`. `useForm<T>` takes a single type for both, so the
resolver's input and the form's values disagree and TypeScript refuses it.

The fix is not to coerce in the schema. Let React Hook Form convert instead:

    // schema
    amount: z.number({ error: "Enter an amount" }).min(1, "Enter an amount")

    // form
    register("amount", { valueAsNumber: true })

Now the form hands Zod a real number and the schema just validates it. The
`error` option covers the empty-field case, which arrives as `NaN`.

Applied in two places: the dues amount, and the number of visitors on the
access-code form.

## 3. Dead code removed

`lib/schemas/resident.ts` still held an old copy of the access-code form
schema from before it moved to `lib/schemas/access-code.ts`. Nothing imported
it, but it used `z.coerce` and would have confused the next person reading it.

## Do this

    npm run build

If it passes:

    git add .
    git commit -m "Fix build: remove stale prop, replace z.coerce with valueAsNumber"
    git push

If it fails, paste me the errors — the build stops at the first few, so there
may be more behind these three.

## On the Vercel plan question

Separately from this: do not click Continue on that import screen. It wants to
put the project on your personal Hobby account, which needs a Pro plan for a
private org repo. The Vercel project should live on the company's team, not
yours. Ask your boss to add you to an Intplus Vercel team, or to import it
himself.

Whoever does it will need these environment variables or the build will fail
at runtime:

    BACKEND_URL          https://locksec-be-ver2.onrender.com/api/v1
    NEXT_PUBLIC_SITE_URL https://<the-vercel-url>
