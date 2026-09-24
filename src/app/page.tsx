import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SiteNav } from "@/components/marketing/site-nav";
import { Newsletter } from "@/components/marketing/newsletter";
import {
  DashedFlight,
  PlaneWatermark,
  ShieldBackdrop,
  SwooshLines,
} from "@/components/marketing/decor";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  XIcon,
} from "@/components/marketing/social-icons";

export const metadata: Metadata = {
  title: "LockSec — Smart access control for gated communities",
  description:
    "Generate visitor codes, track entries, and collect dues seamlessly — all from one secure platform.",
  alternates: { canonical: "/" },
};

/**
 * The public marketing page.
 *
 * Everything else in this project is the product — screens behind a sign-in
 * that do work. This is the page in front of it, and it connects to the
 * product at exactly three points: Login, Create Account, and the two pricing
 * buttons.
 *
 * Features, Pricing and Contact are sections of this page, not routes, so the
 * navigation uses anchors.
 *
 * TWO THINGS THAT NEED DECISIONS BEFORE LAUNCH, both noted where they appear:
 * the prices here disagree with the earlier design, and several feature
 * claims describe things the product cannot do yet.
 */
export default function HomePage() {
  return (
    <div className="bg-white">
      <SiteNav />

      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      {/*
        Fills the screen below the header, as in the design.

        `min-h`, not `h`: a fixed height clips the buttons on a short window —
        a laptop at 768px, or a phone held sideways. And `dvh` rather than
        `vh`, because `vh` on a phone counts the space behind the address bar,
        so the last inch of a `100vh` hero stays hidden until you scroll.
      */}
      <section className="surface-grid border-b border-hairline">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-2">
          <div className="pt-10 lg:py-10">
            {/*
              THREE LINES, BY CONSTRUCTION.

              Each line is its own block element rather than text separated by
              <br>, so the shape holds however the type renders. An earlier
              version relied on the heading being narrow enough to break where
              intended — it wasn't, and the heading ran to six lines and pushed
              everything else off the screen.

              `lg:whitespace-nowrap` locks each line from large screens up. It
              is safe because the font size scales with the viewport: at
              1024px the longest line measures roughly 450px in a 550px
              column, and the ratio holds as both grow. Below `lg` the lines
              wrap naturally, which is what a phone needs.

              The weights follow the design — "Smart" and the closing line
              lighter, the two middle phrases heavy.
            */}
            <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-[1.15] tracking-tight text-heading">
              <span className="block lg:whitespace-nowrap">
                Smart{" "}
                <strong className="font-extrabold">Access Control &amp;</strong>
              </span>
              <span className="block font-extrabold lg:whitespace-nowrap">
                Automated Revenue Collection
              </span>
              <span className="block lg:whitespace-nowrap">
                for Gated Communities
              </span>
            </h1>

            {/* max-w-[46ch] keeps the line length readable — long lines are
                hard to track back to the start of the next one. */}
            <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-body">
              Generate visitor codes, track entries, and collect dues
              seamlessly — all from one secure platform.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-5">
              <Link
                href="/estate/register"
                className="inline-flex items-center gap-2 rounded-field bg-brand-navy px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-navy/90"
              >
                Get started
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>

              {/*
                There is no video yet, so this points at the section that
                explains the product rather than opening an empty player.
                Swap the href when one exists.
              */}
              <Link
                href="#features"
                className="inline-flex items-center gap-2.5 text-sm font-medium text-heading"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-full border border-hairline-strong bg-white">
                  <Play className="size-3.5 fill-current" aria-hidden="true" />
                </span>
                Watch Video
              </Link>
            </div>
          </div>

          {/*
            THE ARTWORK IS SIZED BY HEIGHT, NOT WIDTH.

            The design places the officer at about 70% of the hero's height
            and the phone at about a third, with both anchored to the right
            edge. Sizing them against the column width instead — which is
            what an earlier version did — makes the officer shrink on a wide
            short screen and tower on a narrow tall one, because the column
            width and the hero height change independently.

            So on large screens the column stretches to the full row height
            and both images are positioned within it as percentages of that
            height. The proportions then hold at any window size.
          */}
          <div className="relative hidden self-stretch lg:block lg:min-h-[26rem]">
            <Image
              src="/security-image.png"
              alt="A security officer on duty at an estate gate, speaking into a radio"
              width={900}
              height={601}
              // priority: the largest thing on the first screen, so loading it
              // lazily would leave a visible hole.
              priority
              className="absolute bottom-0 right-0 h-[70%] w-auto max-w-none"
            />

            <Image
              src="/security-iphone.png"
              alt="The LockSec resident app showing a visitor summary"
              width={415}
              height={312}
              className="absolute right-[4%] top-[8%] h-[32%] w-auto max-w-none drop-shadow-2xl"
            />
          </div>

          {/*
            Phones and tablets get a simpler arrangement: the photograph at a
            readable width with the phone tucked into the corner. The
            height-based placement above needs a tall column to work against,
            and a stacked layout does not have one.
          */}
          <div className="relative lg:hidden">
            <Image
              src="/security-image.png"
              alt=""
              width={900}
              height={601}
              className="ml-auto h-auto w-[78%] sm:w-[58%]"
            />
            <Image
              src="/security-iphone.png"
              alt=""
              width={415}
              height={312}
              className="absolute right-0 top-0 w-[30%] drop-shadow-2xl sm:w-[22%]"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* What it is                                                        */}
      {/* ---------------------------------------------------------------- */}
      {/*
        The background is the same tint as the cards section below rather than
        white — in the design this whole middle band reads as one surface,
        with the white hero above it and the white cards sitting on top.
      */}
      <section id="features" className="scroll-mt-20 bg-canvas">
        <div className="mx-auto w-full max-w-4xl px-5 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-title font-extrabold text-heading">
            At its core, Lock<span className="text-brand">Sec</span> is a
            powerful access management platform.
          </h2>

          <p className="mx-auto mt-5 max-w-[62ch] text-body">
            Our solution transforms gate security and resident convenience
            through interactive, interdisciplinary technology. Every modern
            estate can benefit from these key features:
          </p>

          {/*
            The two rules bracket the feature columns, and both are narrower
            than the text they sit between — which is what stops them reading
            as section dividers and keeps them as a frame around this one
            group. Same width on both, or the grouping falls apart.
          */}
          <hr className="mx-auto mt-10 max-w-3xl border-t border-hairline" />

          <ul className="mx-auto grid max-w-3xl gap-6 py-8 text-left sm:grid-cols-3">
            {[
              {
                title: "Robust Code Generation.",
                body: "Create time-bound access passes for any visitor type.",
              },
              {
                title: "Seamless Verification.",
                // The design says "in real-time via PWA". The app is not
                // installable — there is no manifest or offline support — so
                // this describes what actually happens. Worth settling with
                // whoever owns the copy.
                body: "Security teams validate entries in real time at the gate.",
              },
              {
                title: "Unified Dashboard.",
                body: "Track access logs, payments, and resident activity in one place.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-2.5">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-heading"
                  aria-hidden="true"
                />
                <p className="text-sm leading-relaxed text-body">
                  <strong className="font-semibold text-heading">
                    {item.title}
                  </strong>{" "}
                  {item.body}
                </p>
              </li>
            ))}
          </ul>

          <hr className="mx-auto max-w-3xl border-t border-hairline" />

          <p className="mx-auto mt-8 max-w-[56ch] text-sm text-body">
            Built for scalability, LockSec adapts to all community sizes — from
            compact apartments to sprawling estates.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Feature cards                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-canvas">
        <div className="mx-auto w-full max-w-6xl space-y-5 px-5 pb-16 sm:px-6 sm:pb-20">
          {/*
            `overflow-hidden` is what lets the artwork run off the edges and
            the screenshot bleed to the card's boundary — without it both
            would spill across the page. `isolate` keeps the decoration's
            stacking to this card.
          */}
          <article className="relative isolate grid gap-8 overflow-hidden rounded-sheet bg-white shadow-sm lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <PlaneWatermark className="bottom-[-3rem] left-[-2rem] w-64 text-brand sm:w-72" />
            <SwooshLines className="right-0 top-0 h-40 w-2/3 text-brand" />

            <div className="relative z-10 p-6 sm:p-8 lg:py-12 lg:pl-12">
              <h3 className="text-xl font-bold text-heading">
                Community Management
              </h3>
              <p className="mt-2 max-w-[42ch] text-sm text-body">
                Centralized control for all estate residents, businesses, and
                security operations.
              </p>

              <dl className="mt-8 space-y-5">
                {[
                  ["Register", "Self-service tools + bulk onboarding"],
                  ["Manage", "Filterable directory + role-based controls"],
                  ["Track", "Access logs + financial dashboards + security reports"],
                ].map(([term, detail]) => (
                  <div key={term}>
                    <dt className="font-bold text-heading">{term}</dt>
                    <dd className="mt-1 text-sm text-muted">{detail}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/*
              The screenshot runs to the card's right edge and is clipped by
              it, as in the design — it reads as a window onto the product
              rather than a picture sitting on a page. The negative margin
              does that; `overflow-hidden` on the card does the clipping.
            */}
            <div className="relative z-10 -mb-px pb-6 pl-6 sm:pl-8 lg:py-10">
              <Image
                src="/dashboard-shot.png"
                alt="The LockSec estate admin dashboard, showing collected dues, resident numbers and recent payments"
                width={605}
                height={508}
                className="h-auto w-full rounded-l-2xl shadow-2xl"
              />
            </div>
          </article>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="relative isolate overflow-hidden rounded-sheet bg-white p-6 shadow-sm sm:p-8">
              <PlaneWatermark className="bottom-[-4rem] right-[-3rem] w-56 rotate-12 text-brand" />

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-heading">
                  Visitor Code Generation
                </h3>
                <p className="mt-2 text-sm text-body">
                  Create secure, time-bound access passes for every visitor
                  type.
                </p>

                {/*
                  The real screen rather than the device photo. It is a tall
                  portrait shot, so it is capped by width instead of filling
                  the card — a 235px-wide image stretched across a desktop
                  card would be soft and badly out of proportion.
                */}
                <div className="my-8 flex justify-center">
                  <Image
                    src="/visitors-code.png"
                    alt="The LockSec resident app showing a generated visitor code with the visitor's details"
                    width={235}
                    height={446}
                    className="h-auto w-[68%] max-w-[235px]"
                  />
                </div>

                <FeatureList
                  items={[
                    ["Instant Digital Codes", "Generated in seconds and shared straight to WhatsApp"],
                    ["Smart Delivery Access", "Visitor types for guests, dispatch, cabs and artisans"],
                    ["Vehicle Details", "Plate numbers captured for anyone arriving by car"],
                  ]}
                />
              </div>
            </article>

            <article className="relative isolate overflow-hidden rounded-sheet bg-white p-6 shadow-sm sm:p-8">
              <SwooshLines className="right-0 top-0 h-32 w-3/4 text-brand" />

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-heading">
                  Admin Dashboard
                </h3>
                <p className="mt-2 text-sm text-body">
                  Comprehensive analytics and user management.
                </p>

                {/*
                  Note the capital D in the filename. Windows ignores case,
                  Linux does not — and Vercel runs Linux, so `/dashboard-admin.png`
                  would load here and 404 in production. Worth renaming the
                  file to lowercase to match the others.
                */}
                <Image
                  src="/Dashboard-admin.png"
                  alt="Resident management in the LockSec admin dashboard"
                  width={605}
                  height={508}
                  className="my-8 h-auto w-full rounded-xl shadow-lg ring-1 ring-hairline"
                />

                <FeatureList
                  items={[
                    ["Real-Time Access Analytics", "Live monitoring of entries, logs and filters"],
                    ["Payment Tracking", "Financial oversight of dues collected and outstanding"],
                    ["User & Security Management", "Role-based controls for residents, security and admins"],
                  ]}
                />
              </div>
            </article>
          </div>

          <article className="relative isolate grid gap-8 overflow-hidden rounded-sheet bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-2 lg:items-center">
            <PlaneWatermark className="bottom-[-3rem] left-[-2rem] w-60 text-brand" />
            <SwooshLines className="right-0 top-0 h-36 w-1/2 text-brand" />

            {/*
              One image, not two.

              payment-image.png is already a composite — the designer exported
              the Payments screen with the Settings panel layered on top of
              it. An earlier version added settings-dues.png over it as well,
              which stacked a second copy of the same panel on the first.

              Worth remembering when a supplied asset looks like a single
              screen: open it on its own before building a layout around it.
              settings-dues.png is now unused and can be deleted, unless it is
              wanted somewhere else.
            */}
            <div className="relative z-10">
              <Image
                src="/payment-image.png"
                alt="The Payments and Dues screen in the LockSec admin dashboard, with the settings panel for creating a new due open in front of it"
                width={650}
                height={486}
                className="h-auto w-full"
              />
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-bold text-heading">
                Payment Tracking
              </h3>
              <p className="mt-2 text-sm text-body">
                Automated dues collection and financial transparency for
                estates.
              </p>

              <div className="mt-6">
                <FeatureList
                  items={[
                    ["Real-Time Payment Monitoring", "Every payment visible the moment it lands"],
                    ["Customizable Billing Cycles", "Daily, weekly, monthly, quarterly or yearly dues"],
                    ["Financial Reporting", "Exportable records for association or management reviews"],
                  ]}
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Pricing                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="pricing"
        className="relative isolate scroll-mt-20 overflow-hidden bg-canvas"
      >
        {/* The dashed flight path from the design, sweeping up past the
            pricing cards. Hidden on small screens, where it would crowd the
            cards rather than frame them. */}
        <DashedFlight className="bottom-6 left-0 hidden w-72 text-brand lg:block" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-20 text-center sm:px-6">
          <h2 className="text-title font-extrabold text-heading">
            The Right Plan for Every Community
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-sm text-body">
            From compact apartments to sprawling estates, LockSec scales with
            your needs.
          </p>

          {/*
            PRICES NEED CONFIRMING. This design says Basic is free and
            Professional is NGN 100,000. The earlier Figma said NGN 150,000
            and NGN 200,000 with no free tier.
            
            These are the numbers an estate will hold you to, and the backend
            has yet to create the plans — so whichever is right should be
            settled before it does, or someone signs up expecting free and
            gets billed.
          */}
          <div className="mt-10 grid gap-5 text-left md:grid-cols-2">
            <PlanCard
              name="Basic"
              price="₦0"
              blurb="Perfect for small communities starting with access control."
              features={[
                "Up to 150 residential units",
                "Visitor code generation",
                "2 admin accounts",
                "Email support",
                "Basic payment tracking (4% transaction fee)",
              ]}
              cta="Get Started for Free"
            />
            <PlanCard
              name="Professional"
              price="₦100,000"
              blurb="For growing estates needing advanced management."
              intro="Everything in Basic, plus:"
              features={[
                "Up to 500 residential units",
                "Custom access rules (time and date restrictions)",
                "Automated payment reminders",
                "Priority support (24hr response)",
                "Financial reporting dashboard",
                "Reduced 2% transaction fee",
              ]}
              cta="Start 14-Day Free Trial"
              featured
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Closing call to action                                            */}
      {/* ---------------------------------------------------------------- */}
      {/*
        The closing section, built around an oversized LockSec shield.

        The proportions come from measuring the design, not from taste:

          shield      88% of the content width, starting 6% down
          cards       begin about 43% down, end about 76% down
          columns     39% / 39% / 14%, with the rest as gaps
          clearance   the shield's foot stops ~6% above the section's end

        The shield spans nearly the full width of the card row — that is what
        lets the cards sit ON it rather than beside it, which is the whole
        composition. An earlier version sized the shield by height alone, so
        on a wide screen it turned narrow and the cards drifted off it.

        The background is a slate blue-grey sampled from the design. It
        appears nowhere else in the product, so giving it a token would imply
        a reuse that does not exist.
      */}
      <section
        id="contact"
        className="relative isolate scroll-mt-20 overflow-hidden bg-[#BCCDDC] lg:min-h-[64rem]"
      >
        <ShieldBackdrop className="left-1/2 top-6 w-[92%] -translate-x-1/2 sm:w-[80%] lg:top-[6%] lg:w-[78%] lg:max-w-[58rem]" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-16 pt-12 sm:px-6 lg:pb-24 lg:pt-24">
          {/*
            The heading starts at the same left edge as the cards below it.
            The design lines those up, and losing that alignment is what made
            an earlier version feel arranged rather than composed.
          */}
          <div className="max-w-sm">
            <h2 className="text-[clamp(1.6rem,3vw,2.35rem)] font-extrabold leading-[1.2] text-white">
              <span className="block">Ready to</span>
              <span className="block">secure your</span>
              <span className="block">community?</span>
            </h2>

            <Link
              href="/estate/register"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-heading shadow-sm transition-colors hover:bg-white/90"
            >
              Get Started
            </Link>
          </div>

          {/*
            Three columns. The middle one is a stack — Support, then the legal
            links in their own smaller card — and the Support card grows to
            fill, so the stack finishes level with the two cards either side.
            In the design all three columns end on the same line.
          */}
          <div className="mt-12 grid items-stretch gap-4 sm:mt-16 lg:grid-cols-[1fr_1fr_0.37fr] lg:gap-[1.1rem]">
            <div className="rounded-2xl bg-white p-6">
              <p className="text-lg leading-snug text-heading">
                <span className="text-muted">Every…</span>
                <br />
                <strong className="font-bold">gate entry</strong>
                <br />
                <strong className="font-bold">visitor pass</strong>
                <br />
                <strong className="font-bold">payment collected</strong>
                <br />
                <span className="text-muted">…matters.</span>
              </p>

              <div className="mt-10">
                <Logo />
                <p className="mt-3 text-xs text-muted">
                  © {new Date().getFullYear()} All Rights Reserved, Int+.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex-1 rounded-2xl bg-white p-6">
                <h3 className="text-lg font-bold text-heading">Support</h3>
                <p className="mt-3 text-sm text-body">
                  Have questions? Get in touch or check out our Help Center.
                </p>

                {/*
                  PLACEHOLDER CONTACT DETAILS, taken from the design. Both
                  need replacing before launch — a number that does not answer
                  costs more trust than no number at all.
                */}
                <p className="mt-3 text-sm text-body">
                  You can also text our support team at{" "}
                  <span className="font-medium text-heading">(310) 23-5384</span>{" "}
                  or email us at{" "}
                  <a
                    href="mailto:support@locksec.com"
                    className="font-medium text-brand underline underline-offset-4"
                  >
                    support@locksec.com
                  </a>
                </p>
              </div>

              <div className="rounded-2xl bg-white px-6 py-4">
                <p className="flex flex-wrap justify-center gap-6 text-sm text-body">
                  <Link href="/terms" className="hover:text-heading">
                    Terms of Use
                  </Link>
                  <Link href="/data-processing" className="hover:text-heading">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6">
              <h3 className="text-lg font-bold text-heading">Social</h3>

              {/*
                The hrefs are placeholders. Replace the three "#" values with
                the real profile URLs; the labels a screen reader reads, the
                hover state and the new-tab handling are already in place.

                `rel="noopener noreferrer"` belongs with `target="_blank"`: it
                stops the opened page reaching back into this one through
                window.opener, and keeps the referrer to ourselves.
              */}
              <ul className="mt-6 flex gap-6 lg:flex-col lg:gap-7">
                {[
                  { Icon: InstagramIcon, label: "Instagram", href: "#" },
                  { Icon: FacebookIcon, label: "Facebook", href: "#" },
                  { Icon: XIcon, label: "X", href: "#" },
                ].map(({ Icon, label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-heading transition-opacity hover:opacity-60"
                    >
                      <Icon className="size-7" />
                      <span className="sr-only">LockSec on {label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Footer                                                            */}
      {/* ---------------------------------------------------------------- */}
      <footer className="bg-brand-navy text-white">
        <div className="mx-auto w-full max-w-4xl px-5 py-14 text-center sm:px-6">
          <h2 className="text-lg font-bold">Subscribe to our newsletter</h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-sm text-white/70">
            Get expert advice for your journey to LockSec delivered to your
            inbox each month. It&rsquo;s short, and worthwhile — we promise.
          </p>

          <Newsletter />

          <div className="mt-12 flex justify-center gap-5 border-t border-white/15 pt-10">
            {[FacebookIcon, InstagramIcon, XIcon, LinkedinIcon].map((Icon, index) => (
              <span
                key={index}
                className="inline-flex size-9 items-center justify-center text-white/70"
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
            ))}
          </div>

          {/*
            The design has no door for security guards. A guard does not use
            an email and password — they sign in with a Personnel ID — so
            without this, anyone who bookmarks the home page has nowhere to
            go. Quiet, but present.
          */}
          <p className="mt-8 text-sm text-white/60">
            Security personnel:{" "}
            <Link
              href="/security/login"
              className="font-medium text-white underline underline-offset-4"
            >
              sign in with your ID
            </Link>
          </p>

          <p className="mt-6 text-xs text-white/50">
            Copyright © {new Date().getFullYear()} — Int+
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function FeatureList({ items }: { items: [string, string][] }) {
  return (
    <dl className="space-y-4">
      {items.map(([term, detail]) => (
        <div key={term}>
          <dt className="text-sm font-semibold text-heading">{term}</dt>
          <dd className="mt-0.5 text-sm text-muted">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function PlanCard({
  name,
  price,
  blurb,
  intro,
  features,
  cta,
  featured,
}: {
  name: string;
  price: string;
  blurb: string;
  intro?: string;
  features: string[];
  cta: string;
  featured?: boolean;
}) {
  return (
    <article
      className={
        featured
          ? "flex flex-col rounded-sheet border-2 border-brand bg-white p-6 shadow-sm sm:p-8"
          : "flex flex-col rounded-sheet border border-hairline bg-white p-6 sm:p-8"
      }
    >
      <h3 className="text-xl font-bold uppercase tracking-wide text-heading">
        {name}
      </h3>
      <p className="mt-2 text-sm text-body">{blurb}</p>

      <p className="mt-6">
        <span className="text-3xl font-extrabold text-brand-deep">{price}</span>
        <span className="ml-1 text-sm text-muted">/monthly</span>
      </p>

      <p className="mt-6 text-sm font-semibold text-heading">Core Features:</p>
      {intro ? (
        <p className="mt-1 text-sm font-medium text-body">{intro}</p>
      ) : null}

      <ul className="mt-4 flex-1 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
            <span className="text-body">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/estate/register"
        className="mt-8 rounded-full border border-hairline-strong px-6 py-3 text-center font-medium text-heading transition-colors hover:bg-canvas"
      >
        {cta}
      </Link>
    </article>
  );
}
