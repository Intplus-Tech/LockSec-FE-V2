"use client";

import { useId, useState } from "react";
import { formatNaira } from "@/lib/format";

/**
 * The Dues Payment chart.
 *
 * Hand-drawn SVG rather than a charting library. One chart does not justify
 * Recharts' bundle, and installing dependencies on this project has been
 * painful.
 *
 * Accessibility is what people skip on charts. A bare SVG is opaque to a
 * screen reader — a blind admin gets nothing at all. Here the drawing is
 * decorative (aria-hidden) and the same numbers render as a real table,
 * visually hidden. Everyone gets the data; sighted users also get the shape.
 */

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/**
 * Round a number up to a "nice" one: 1, 2, 2.5 or 5 times a power of ten.
 *
 * This is what stops an axis reading 0.14285714, 0.28571428, 0.42857142. An
 * earlier version divided the maximum into seven equal parts, which produces
 * arbitrary fractions whenever the maximum is not conveniently divisible —
 * and with no payments recorded the maximum was 1, so every gridline was a
 * seventh.
 *
 * Axis labels are for reading at a glance. They should be round numbers a
 * person recognises, not whatever the arithmetic happened to produce.
 */
function niceCeil(value: number): number {
  if (value <= 0) return 0;

  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const fraction = value / base;

  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;

  return nice * base;
}

/** ₦0, ₦500, ₦1.5k, ₦250k, ₦92.5M — short enough to fit an axis. */
function compactNaira(value: number): string {
  if (value === 0) return "₦0";
  if (value >= 1_000_000_000) return `₦${trim(value / 1_000_000_000)}B`;
  if (value >= 1_000_000) return `₦${trim(value / 1_000_000)}M`;
  if (value >= 1_000) return `₦${trim(value / 1_000)}k`;
  return `₦${trim(value)}`;
}

/** 1.50 -> "1.5", 2.00 -> "2" */
function trim(value: number): string {
  return Number(value.toFixed(1)).toString();
}

export function DuesChart({
  values,
  caption = "Dues collected by month",
}: {
  /** Twelve numbers, January to December. */
  values: number[];
  caption?: string;
}) {
  const gradientId = useId();
  const [hovered, setHovered] = useState<number | null>(null);

  const width = 900;
  const height = 260;
  const padding = { top: 24, right: 16, bottom: 32, left: 78 };

  const peak = Math.max(...values, 0);
  const hasData = peak > 0;

  // With no data, use a token scale so the axis still reads sensibly (₦0 to
  // ₦1,000) rather than collapsing to fractions of one naira.
  const max = hasData ? niceCeil(peak) : 1000;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Five gridlines including zero. Fewer, rounder lines read better than
  // seven crowded ones.
  const steps = 5;
  const ticks = Array.from({ length: steps + 1 }, (_, i) => (i / steps) * max);

  const points = values.map((value, index) => ({
    x: padding.left + (index / (values.length - 1)) * innerWidth,
    y: padding.top + innerHeight - (value / max) * innerHeight,
    value,
  }));

  // Catmull-Rom style smoothing, which gives the design's soft curve rather
  // than a jagged polyline.
  const path = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const controlX = (previous.x + point.x) / 2;
      return `C ${controlX} ${previous.y} ${controlX} ${point.y} ${point.x} ${point.y}`;
    })
    .join(" ");

  return (
    <figure className="w-full">
      {/*
        On a 375px screen a 900-unit-wide viewBox is scaled down 2.4x, which
        turns 11px axis labels into roughly 4px — unreadable. Rather than
        shrink the type or drop the labels, the chart keeps its natural size
        and scrolls horizontally on small screens only.
        A chart is one of the few things worth scrolling sideways for: it is a
        single wide object, not a grid of data where scrolling hides columns.
      */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="relative min-w-[36rem]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="presentation"
          aria-hidden="true"
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-line)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--color-chart-line)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines and labels, drawn behind the series. */}
          {ticks.map((tick) => {
            const y = padding.top + innerHeight - (tick / max) * innerHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="var(--color-hairline)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--color-faint)"
                >
                  {compactNaira(tick)}
                </text>
              </g>
            );
          })}

          {hasData ? (
            <>
              <path
                d={`${path} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`}
                fill={`url(#${gradientId})`}
              />
              <path
                d={path}
                fill="none"
                stroke="var(--color-chart-line)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {points.map((point, index) => (
                <g key={index}>
                  {/* A wide invisible target, so hovering does not require
                      hitting a four-pixel dot exactly. */}
                  <rect
                    x={point.x - innerWidth / 24}
                    y={padding.top}
                    width={innerWidth / 12}
                    height={innerHeight}
                    fill="transparent"
                    onMouseEnter={() => setHovered(index)}
                  />
                  {hovered === index ? (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="6"
                      fill="white"
                      stroke="var(--color-chart-line)"
                      strokeWidth="3"
                    />
                  ) : null}
                </g>
              ))}
            </>
          ) : null}
        </svg>

        {/* With nothing to plot, say so rather than drawing a flat line along
            the bottom, which reads as "collected nothing every month" when
            the truth is "no payments recorded yet". */}
        {!hasData ? (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            No payments recorded this year yet
          </p>
        ) : null}

        {/* Inside the min-width wrapper so the month labels scroll in step
            with the chart rather than drifting out of alignment. */}
        <div
          className="mt-1 flex justify-between text-[0.65rem] text-faint"
          style={{ paddingLeft: "8.6%", paddingRight: "1.8%" }}
        >
          {MONTHS.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
        </div>
      </div>

      {hovered !== null ? (
        <p className="mt-3 text-center text-sm font-medium text-heading">
          {MONTHS[hovered]}: {formatNaira(values[hovered])}
        </p>
      ) : null}

      {/* The same data, for anyone who cannot see the drawing. */}
      <figcaption className="sr-only">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Amount collected</th>
            </tr>
          </thead>
          <tbody>
            {values.map((value, index) => (
              <tr key={index}>
                <th scope="row">{MONTHS[index]}</th>
                <td>{formatNaira(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
