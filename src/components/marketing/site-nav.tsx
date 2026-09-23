"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * The marketing header.
 *
 * Features, Pricing and Contact are sections of this one page rather than
 * separate routes, so they are anchors. Login and Create Account are the two
 * places where this page hands over to the product.
 *
 * Below `md` the links collapse into a panel. A row of six links at 375px
 * either wraps into a mess or shrinks past readability, and neither is worth
 * defending.
 */
const LINKS = [
  { href: "/", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Contact" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline/60 bg-white/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
        <Link href="/" aria-label="LockSec home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-body transition-colors hover:text-heading"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/estate/login"
            className="text-sm font-medium text-body transition-colors hover:text-heading"
          >
            Login
          </Link>
          <Link
            href="/estate/register"
            className="rounded-field bg-brand-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-navy/90"
          >
            Create Account
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-field text-heading md:hidden"
        >
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        id="site-menu"
        className={cn(
          "border-t border-hairline bg-white md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav aria-label="Main" className="px-5 py-3">
          <ul className="space-y-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-field px-2 py-3 text-body hover:bg-canvas"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-col gap-2 border-t border-hairline pt-4">
            <Link
              href="/estate/login"
              onClick={() => setOpen(false)}
              className="rounded-field border border-hairline-strong px-4 py-3 text-center font-medium text-body"
            >
              Login
            </Link>
            <Link
              href="/estate/register"
              onClick={() => setOpen(false)}
              className="rounded-field bg-brand-navy px-4 py-3 text-center font-medium text-white"
            >
              Create Account
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
