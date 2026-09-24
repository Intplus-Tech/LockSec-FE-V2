/**
 * Background artwork for the marketing page.
 *
 * The design carries two motifs, both very pale blue and both easy to miss
 * until you raise the contrast: a large paper-plane at the lower left of a
 * card, and a fan of fine curved lines sweeping across the upper right.
 *
 * All of it is drawn rather than exported as images. Three reasons: it stays
 * sharp at any size, it costs a couple of kilobytes instead of a download,
 * and the colour comes from the same token as everything else, so it cannot
 * drift out of step with the palette.
 *
 * Every piece is `aria-hidden` and `pointer-events-none`. It is decoration —
 * a screen reader should not meet it, and it must never sit between a cursor
 * and a link.
 */

/** The large pale dart at the lower left of a card. */
export function PlaneWatermark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 260"
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${className ?? ""}`}
    >
      {/* The filled dart, pointing up and to the right. */}
      <path
        d="M18 196 L196 36 L118 244 L92 168 Z"
        fill="currentColor"
        opacity="0.22"
      />
      {/* The fold along its underside, a shade darker so the form reads. */}
      <path d="M92 168 L196 36 L118 244 Z" fill="currentColor" opacity="0.14" />
      {/* A thin outlined chevron trailing behind it. */}
      <path
        d="M0 214 L62 214 L128 150"
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinejoin="round"
        opacity="0.16"
      />
    </svg>
  );
}

/**
 * The fan of fine lines across the upper right.
 *
 * Generated rather than hand-written: eighteen near-parallel curves differing
 * only by offset. Writing them out would be eighteen chances to fat-finger a
 * coordinate, and impossible to adjust afterwards.
 */
export function SwooshLines({ className }: { className?: string }) {
  const lines = Array.from({ length: 18 }, (_, i) => {
    const offset = i * 7;
    return `M ${-20 + offset * 0.4} ${10 + offset} Q 150 ${-30 + offset * 0.8} 420 ${60 + offset * 0.55}`;
  });

  return (
    <svg
      viewBox="0 0 420 220"
      aria-hidden="true"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute select-none ${className ?? ""}`}
    >
      {lines.map((d, index) => (
        <path
          key={index}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          // The fan fades towards its lower edge, as in the design, so it
          // dissolves into the card rather than stopping abruptly.
          opacity={0.42 - index * 0.02}
        />
      ))}
    </svg>
  );
}

/**
 * The dashed flight path and small plane, used beside the pricing cards.
 */
export function DashedFlight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${className ?? ""}`}
    >
      <path
        d="M8 172 C 70 176, 120 150, 150 110 S 230 20, 306 34"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="7 9"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M0 150 L52 116 L28 176 L20 154 Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}


/**
 * The oversized LockSec shield behind the closing section.
 *
 * Traced from the design rather than eyeballed, and two things only became
 * clear by measuring.
 *
 * It is ONE shape, not three. What looks like two tablets floating above a
 * dome is a single silhouette with a U-shaped notch cut into the top, ending
 * a little under halfway down. An earlier version drew the pieces separately
 * with a gap between them, which read as three unrelated blobs.
 *
 * And it is essentially SQUARE — 404 wide by 406 tall. An earlier version was
 * 542 by 643, which made it narrow and tall, so on a wide screen it could not
 * span the cards that are supposed to sit on it.
 *
 * The foot is a true semicircle whose radius is exactly half the width:
 * fitting a circle to the traced edge matched every sampled row to within a
 * pixel. The inner corners where the notch ends have a radius of 76, found
 * the same way.
 */
export function ShieldBackdrop({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 404 406"
      aria-hidden="true"
      className={`pointer-events-none absolute select-none ${className ?? ""}`}
    >
      <defs>
        <linearGradient id="shield-fill" x1="0" y1="0" x2="0" y2="1">
          {/* Lighter at the top, deeper at the foot, sampled from the file. */}
          <stop offset="0%" stopColor="#6B87FD" />
          <stop offset="100%" stopColor="#3B61FB" />
        </linearGradient>
      </defs>

      <g fill="url(#shield-fill)">
        {/*
          The two halves above the notch. Their outer top corners are rounded
          at 60; the corners either side of the notch are square at the top
          and rounded at 76 where the notch ends — which is what makes the
          slot appear to widen as it goes down.
        */}
        <path d="M0 60 A60 60 0 0 1 60 0 H191 V108 A76 76 0 0 1 115 184 H0 Z" />
        <path d="M404 60 A60 60 0 0 0 344 0 H213 V108 A76 76 0 0 0 289 184 H404 Z" />

        {/*
          Below the notch the shape is solid, then falls away as a half-disc.

          Written as two cubics rather than an arc command: the control-point
          offset for a quarter circle is a known constant (0.5523 x radius, so
          112 here), and cubics sidestep the sweep-flag confusion that makes
          SVG arcs so easy to get backwards.
        */}
        <path d="M0 184 H404 V204 C404 316 314 406 202 406 C90 406 0 316 0 204 Z" />
      </g>
    </svg>
  );
}
