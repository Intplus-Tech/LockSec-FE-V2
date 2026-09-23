import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SiteNav } from "@/components/marketing/site-nav";
import { Newsletter } from "@/components/marketing/newsletter";
import { Shot } from "@/components/marketing/shot";
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
      <section id="features" className="scroll-mt-20 bg-white">
        <div className="mx-auto w-full max-w-4xl px-5 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-title font-extrabold text-heading">
            At its core, Lock<span className="text-brand">Sec</span> is a
            powerful access management platform.
          </h2>

          <p className="mx-auto mt-5 max-w-[60ch] text-body">
            Our solution transforms gate security and resident convenience
            through interactive, interdisciplinary technology. Every modern
            estate can benefit from these key features:
          </p>

          <ul className="mt-10 grid gap-6 text-left sm:grid-cols-3">
            {[
              {
                title: "Robust Code Generation.",
                body: "Create time-bound access passes for any visitor type.",
              },
              {
                title: "Seamless Verification.",
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

          <p className="mx-auto mt-10 max-w-[56ch] border-t border-hairline pt-8 text-sm text-body">
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
          <article className="grid gap-8 rounded-sheet bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h3 className="text-xl font-bold text-heading">
                Community Management
              </h3>
              <p className="mt-2 text-sm text-body">
                Centralized control for all estate residents, businesses, and
                security operations.
              </p>

              <dl className="mt-6 space-y-4">
                {[
                  ["Register", "Self-service tools and bulk onboarding"],
                  ["Manage", "Filterable directory and role-based controls"],
                  ["Track", "Access logs, financial dashboards, security reports"],
                ].map(([term, detail]) => (
                  <div key={term}>
                    <dt className="font-semibold text-heading">{term}</dt>
                    <dd className="mt-0.5 text-sm text-muted">{detail}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <Shot alt="The LockSec estate admin dashboard" />
          </article>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-sheet bg-white p-6 shadow-sm sm:p-8">
              <h3 className="text-xl font-bold text-heading">
                Visitor Code Generation
              </h3>
              <p className="mt-2 text-sm text-body">
                Create secure, time-bound access passes for every visitor type.
              </p>

              <div className="my-8 flex justify-center">
                <Image
                  src="/security-iphone.png"
                  alt="The LockSec resident app on a phone"
                  width={415}
                  height={312}
                  className="h-auto w-full max-w-sm"
                />
              </div>

              <FeatureList
                items={[
                  ["Instant Digital Codes", "Generated in seconds and shared straight to WhatsApp"],
                  ["Smart Delivery Access", "Visitor types for guests, dispatch, cabs and artisans"],
                  ["Vehicle Details", "Plate numbers captured for anyone arriving by car"],
                ]}
              />
            </article>

            <article className="rounded-sheet bg-white p-6 shadow-sm sm:p-8">
              <h3 className="text-xl font-bold text-heading">
                Admin Dashboard
              </h3>
              <p className="mt-2 text-sm text-body">
                Comprehensive analytics and user management.
              </p>

              <Shot alt="Resident management in the LockSec admin dashboard" className="my-8" />

              <FeatureList
                items={[
                  ["Real-Time Access Analytics", "Live monitoring of entries, logs and filters"],
                  ["Payment Tracking", "Financial oversight of dues collected and outstanding"],
                  ["User & Security Management", "Role-based controls for residents, security and admins"],
                ]}
              />
            </article>
          </div>

          <article className="grid gap-8 rounded-sheet bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-2 lg:items-center">
            <Shot alt="Payments and dues in the LockSec admin dashboard" />

            <div>
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
      <section id="pricing" className="scroll-mt-20 bg-canvas">
        <div className="mx-auto w-full max-w-5xl px-5 pb-20 text-center sm:px-6">
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
      <section id="contact" className="scroll-mt-20 bg-brand-tint">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="rounded-sheet bg-brand px-6 py-12 text-white sm:px-10">
            <h2 className="max-w-[14ch] text-title font-extrabold leading-tight">
              Ready to secure your community?
            </h2>
            <Link
              href="/estate/register"
              className="mt-6 inline-flex rounded-field bg-white px-6 py-3 font-medium text-brand-navy transition-colors hover:bg-white/90"
            >
              Get Started
            </Link>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_1.4fr_0.7fr]">
            <div className="rounded-sheet bg-white p-6">
              <p className="text-lg font-bold leading-snug text-heading">
                Every…
                <br />
                gate entry
                <br />
                visitor pass
                <br />
                payment collected
                <br />
                …matters.
              </p>

              <div className="mt-8">
                <Logo />
                <p className="mt-3 text-xs text-muted">
                  © {new Date().getFullYear()} All Rights Reserved, Int+.
                </p>
              </div>
            </div>

            <div className="rounded-sheet bg-white p-6">
              <h3 className="text-lg font-bold text-heading">Support</h3>
              <p className="mt-3 text-sm text-body">
                Have questions? Get in touch or check our help centre.
              </p>

              {/*
                PLACEHOLDER CONTACT DETAILS, taken from the design. Both need
                replacing with real ones before launch — a phone number that
                does not answer costs more trust than no phone number at all.
              */}
              <p className="mt-4 text-sm text-body">
                Text our support team on{" "}
                <span className="font-medium text-heading">(310) 23-5384</span>,
                or email{" "}
                <a
                  href="mailto:support@locksec.com"
                  className="font-medium text-brand underline underline-offset-4"
                >
                  support@locksec.com
                </a>
                .
              </p>

              <p className="mt-6 flex flex-wrap gap-4 text-xs text-muted">
                <Link href="/terms" className="underline underline-offset-4">
                  Terms of Use
                </Link>
                <Link
                  href="/data-processing"
                  className="underline underline-offset-4"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>

            <div className="rounded-sheet bg-white p-6">
              <h3 className="text-lg font-bold text-heading">Social</h3>
              <ul className="mt-4 flex gap-3 lg:flex-col">
                {[
                  { Icon: InstagramIcon, label: "Instagram" },
                  { Icon: FacebookIcon, label: "Facebook" },
                  { Icon: XIcon, label: "X" },
                ].map(({ Icon, label }) => (
                  <li key={label}>
                    {/*
                      No accounts exist yet, so these are marked as
                      placeholders rather than linking nowhere. Give me the
                      handles and they become real links.
                    */}
                    <span
                      title={`${label} — link to be added`}
                      className="inline-flex size-11 items-center justify-center rounded-full border border-hairline text-muted"
                    >
                      <Icon className="size-5" aria-hidden="true" />
                      <span className="sr-only">{label}</span>
                    </span>
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
