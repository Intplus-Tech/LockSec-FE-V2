"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  Check,
  Copy,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/api/endpoints/auth";

/**
 * The estate-admin frame: sidebar, top bar, content.
 *
 * The Figma draws this at desktop width only. A web app has to work anyway,
 * so below `lg` the sidebar becomes a slide-in panel behind a hamburger — the
 * same links, reachable on a laptop or tablet, without inventing a different
 * information architecture.
 */

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/residents", label: "Resident Management", icon: UserRoundPlus },
  { href: "/admin/payments", label: "Payments & Dues", icon: Building2 },
  { href: "/admin/security", label: "Security Management", icon: ShieldCheck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  title,
  breadcrumb,
  estateId,
  actions,
  children,
  search,
}: {
  title: string;
  breadcrumb: string;
  estateId?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /**
   * The global search box in the top bar. Pages that have something to search
   * pass a value and a setter; pages that do not omit it and the box is
   * hidden rather than rendered inert.
   */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [navOpen, setNavOpen] = useState(false);

  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.push("/estate/login");
      router.refresh();
    },
  });

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-hairline bg-white transition-transform lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <Link href="/admin" aria-label="LockSec admin home">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
            className="inline-flex size-10 items-center justify-center rounded-field text-muted lg:hidden"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Admin sections" className="flex-1 px-4">
          <ul className="space-y-1">
            {NAV.map((item) => {
              // Exact match for the dashboard, prefix match for the rest, so
              // /admin does not light up while you are on /admin/residents.
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setNavOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-card px-4 py-3 text-sm transition-colors",
                      active
                        ? "bg-white font-semibold text-brand shadow-sm ring-1 ring-hairline"
                        : "text-muted hover:bg-canvas hover:text-heading",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* The two invite links from the design. These are how security staff
            and residents reach their apps. */}
        <div className="space-y-5 px-6 pb-6">
          <CopyLink title="Security App" path="/security/login" />
          <CopyLink
            title="Resident App"
            path={`/register${estateId ? `?estate=${estateId}` : ""}`}
          />
        </div>
      </aside>

      {/* Backdrop for the mobile drawer */}
      {navOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      ) : null}

      <div className="lg:pl-64">
        <header className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-field text-muted hover:bg-white lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>

            <div className="min-w-0">
              <p className="text-sm text-muted">Pages / {breadcrumb}</p>
              <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-heading sm:text-3xl">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3 sm:flex-none">
            {search ? (
              <div className="relative w-full max-w-xs">
                <label htmlFor="global-search" className="sr-only">
                  Search
                </label>
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
                  aria-hidden="true"
                />
                <input
                  id="global-search"
                  type="search"
                  value={search.value}
                  onChange={(event) => search.onChange(event.target.value)}
                  placeholder={search.placeholder ?? "Search"}
                  className="h-11 w-full rounded-full bg-white pl-10 pr-4 text-sm text-heading shadow-sm outline-none placeholder:text-faint focus:ring-2 focus:ring-brand"
                />
              </div>
            ) : null}

            <div className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1.5 shadow-sm">
              <button
                type="button"
                aria-label="Notifications"
                className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-canvas"
              >
                <Bell className="size-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => signOut.mutate()}
                disabled={signOut.isPending}
                aria-label="Sign out"
                className="inline-flex size-10 items-center justify-center rounded-full border border-bad text-bad hover:bg-bad-tint disabled:opacity-50"
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>

              {/* The avatar in the Figma is a photo. There is no avatar field
                  anywhere in the API, so this is the initial-less fallback
                  every avatar component needs anyway. */}
              <span
                aria-hidden="true"
                className="inline-flex size-10 items-center justify-center rounded-full bg-canvas text-muted"
              >
                <UserRound className="size-5" />
              </span>
            </div>
          </div>
        </header>

        <main id="main" className="px-5 pb-12 sm:px-8">
          {actions ? <div className="mb-5">{actions}</div> : null}
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * One of the two shareable app links in the sidebar.
 *
 * WHY THE useEffect. An earlier version built the URL with
 *
 *     typeof window !== "undefined" ? window.location.origin : ""
 *
 * which is the single most common cause of a hydration error, and React's
 * message lists it first for good reason. On the server `window` does not
 * exist, so the HTML said "/security/login". In the browser it does, so React
 * wanted "http://localhost:3000/security/login". The two did not match and
 * React threw the whole subtree away and re-rendered it.
 *
 * The rule: the first client render must produce exactly what the server
 * produced. Anything that only exists in a browser — window, localStorage,
 * Date.now(), Math.random() — has to be read AFTER mount, in an effect, and
 * the component must render something stable until then.
 *
 * So `origin` starts empty on both sides, and fills in on the client one tick
 * later. The path alone is shown in the meantime, which is still meaningful.
 */
function CopyLink({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  // Runs only in the browser, and only after the first render has already
  // matched the server's HTML.
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const href = `${origin}${path}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be refused in an insecure context. The link is on
      // screen and selectable, so failing quietly is acceptable.
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-heading">{title}</p>
        <button
          type="button"
          onClick={copy}
          disabled={!origin}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand disabled:opacity-50"
        >
          {copied ? (
            <>
              <Check className="size-3" aria-hidden="true" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3" aria-hidden="true" /> Copy link
            </>
          )}
        </button>
      </div>

      {/* break-all so a long URL wraps inside the sidebar rather than
          stretching it. */}
      <p className="mt-1 break-all text-xs italic text-faint underline">
        {href}
      </p>

      <p className="sr-only" role="status">
        {copied ? `${title} link copied` : ""}
      </p>
    </div>
  );
}
