import type { JSX } from "react";

type MetaTag = JSX.IntrinsicElements["meta"];
type LinkTag = JSX.IntrinsicElements["link"];
type ScriptTag = JSX.IntrinsicElements["script"];

/**
 * Public identity for search results and link previews.
 *
 * pixel-perfect-view-757.lovable.app redirects to this domain, so canonical,
 * share and sitemap URLs always name it.
 */
export const SITE_URL = "https://patterns.lakefrontdigital.io";
export const SITE_NAME = "Pattern";

/** Link-preview card built from the landing illustration; served from public/. */
export const SHARE_IMAGE = {
  path: "/og-image.jpg",
  type: "image/jpeg",
  width: 1200,
  height: 630,
  alt: "Pattern: “Astrology that shows its work.” beside an engraved Moon circled by orbit lines.",
} as const;

/** Defaults every route inherits until it names its own title and description. */
export const SITE_DEFAULTS = {
  title: "Pattern — Personal astrology that shows its work",
  description:
    "Pattern calculates your natal chart and the transits active in it, then shows the aspect, orb, phase and source behind every reading.",
} as const;

/**
 * Indexable pages. public/sitemap.xml lists exactly these paths, and each one
 * sets its own canonical link through publicPageHead.
 */
export const PUBLIC_PATHS = ["/", "/transit-chart-calculator"] as const;
export type PublicPath = (typeof PUBLIC_PATHS)[number];

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href;
}

/** Site-wide tags the root route sets once; pages override title and text only. */
export function siteMeta(): MetaTag[] {
  const image = absoluteUrl(SHARE_IMAGE.path);
  return [
    { title: SITE_DEFAULTS.title },
    { name: "description", content: SITE_DEFAULTS.description },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:type", content: "website" },
    { property: "og:title", content: SITE_DEFAULTS.title },
    { property: "og:description", content: SITE_DEFAULTS.description },
    { property: "og:image", content: image },
    { property: "og:image:type", content: SHARE_IMAGE.type },
    { property: "og:image:width", content: String(SHARE_IMAGE.width) },
    { property: "og:image:height", content: String(SHARE_IMAGE.height) },
    { property: "og:image:alt", content: SHARE_IMAGE.alt },
    // Twitter reads og:title and og:description when its own tags are absent,
    // so routes that only override Open Graph text never inherit stale copy.
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: SHARE_IMAGE.alt },
  ];
}

/** Title, description, share text and canonical link for one indexable page. */
export function publicPageHead({
  path,
  title,
  description,
}: {
  path: PublicPath;
  title: string;
  description: string;
}): { meta: MetaTag[]; links: LinkTag[] } {
  const url = absoluteUrl(path);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:url", content: url },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      {property:"og:type",content:"website"},
      {name:"twitter:card",content:"summary_large_image"},
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/** Structured data for a route's head scripts. "<" is escaped so text can never close the tag. */
export function jsonLd(data: Record<string, unknown>): ScriptTag {
  return {
    type: "application/ld+json",
    children: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(
      /</g,
      "\\u003c",
    ),
  };
}
