# Responsive pass — what changed and why

Eleven files. Copy over your `src/` the same way as before.

## Real bugs fixed

**Code boxes overflowed small screens.** Six fixed 44px boxes plus gaps came
to 304px. Add page padding and that is wider than a 320px iPhone SE, so the
boxes were clipped or pushed the page sideways. They now flex — equal share of
the available width, square via aspect-ratio, capped at 3rem so they do not
balloon on desktop. `min-w-0` is what actually permits a flex child to shrink.

**The estate auth card clipped its own top.** `items-center justify-center`
looks right until the content is taller than the viewport, at which point the
overflow spills both ways and the top becomes *unreachable* — you cannot
scroll above the start of a scroll container. Create Estate Account hits this
on a phone in landscape. Fixed with `my-auto` on the child, which centres when
there is room and behaves like normal flow when there is not.

**Security login forced horizontal scroll.** `whitespace-nowrap` on "LockSec
Account" below about 380px. Removed. It may wrap now, which is better than a
sideways-scrolling login screen.

**The estate navbar did not fit.** Logo + "Home" + Sign In pill is roughly
310px of content, wider than a 320px screen once padded. The wordmark now
hides below 400px, leaving the shield.

## Approach: fluid type, not breakpoint chains

Headings use `clamp()` sizes defined once in `globals.css` — `text-display`,
`text-title`, `text-hero`. One class covers every screen and the size scales
smoothly with the viewport.

The alternative, `text-2xl sm:text-3xl lg:text-4xl`, is what most tutorials
show. It leaves gaps: the size is wrong at every width nobody thought to add a
breakpoint for, and 320-360px and 600-700px are the two ranges people
routinely miss. Fluid type has no gaps.

## Also fixed

- **44px minimum touch targets** on every button, the back arrow, the password
  eye toggle, and radio labels. 36px is fine with a mouse and frustrating with
  a thumb.
- **16px input text on mobile.** Below 16px, iOS zooms the page in on focus
  and leaves it zoomed. Drops back to 14px above 640px.
- **`overflow-x: hidden` on `html`** plus `overflow-wrap: break-word` on text
  elements, so one long email address cannot drag the whole page sideways.
- **Name fields stack below 400px.** Two 150px columns leave no room for a
  label plus error text.
- **Page padding steps** from 20px to 24px at 400px. At 320px, 24px each side
  left only 272px of content.
- **`min-h-dvh` everywhere** rather than `min-h-screen`. On mobile Safari
  `100vh` counts an address bar that is not there, so full-height layouts end
  up taller than the visible area.
- **Vertical gaps use `clamp(…, vh, …)`** so a tall header does not push the
  form below the fold on a short screen.

## Invite links are now wired

`/register` reads the estate from the query string:

    /register?estate=67f2c1f5b1a2c3d4e5f67890

That is the "Resident App — Copy link" panel in the admin sidebar. Without the
parameter the form is replaced by a short explanation telling the person to
ask their estate office, rather than letting them fill in nine fields and then
be rejected by the API.

## How to check it

In the browser: F12, then the device-toolbar icon. Test at **320px** (iPhone
SE), **390px** (iPhone 15), **768px** (iPad) and **1440px**. Then rotate to
landscape at 390px and confirm you can still scroll to the top of
`/estate/register`.

The quickest test of all: grab the window edge and drag it slowly from wide to
narrow. Anything that breaks will break visibly as you drag, and you will
catch widths a fixed set of device presets would miss.
