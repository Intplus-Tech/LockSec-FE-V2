import type { MetadataRoute } from "next";

/**
 * Everything behind a login is disallowed. Not for security — a crawler
 * cannot sign in anyway — but so that thin, identical login pages do not
 * dilute the site's search presence.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://locksec.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/resident/", "/security/", "/admin/", "/estate/", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
