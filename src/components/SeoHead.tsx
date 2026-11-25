// Eduvelto — declarative SEO head tags (Phase 1, SSG + bilingual,
// 25 Nov 2026, feature/ssg-bilingual-support).
//
// <SeoHead /> is the single declarative API for per-page SEO. It
// renders through react-helmet-async, so the same component works
// in the browser (HelmetProvider in src/main.tsx) and in SSR
// (HelmetProvider + helmetContext in src/entry-server.tsx, where the
// prerender script reads the tags out of the context).
//
// What it emits, for a page whose canonical is
// https://eduvelto.com/{lang}{path}:
// - <title>, <meta name="description">
// - <link rel="canonical"> (the lang-prefixed URL itself)
// - reciprocal hreflang: bn -> /bn{path}, en -> /en{path},
//   x-default -> /bn{path}
// - Open Graph (title, description, type, url, locale + alternate
//   locale, image + dimensions) and Twitter summary_large_image
// - <meta name="robots"> only when `robots` is passed (e.g. the
//   noindex fallback)
// - one <script type="application/ld+json"> per JSON-LD object
//
// It does NOT replace src/lib/seo.ts: resolveRouteSeo() still owns
// the per-route title/description/JSON-LD data (2293 lines, kept),
// and useSeo() stays exported for back-compat + tests. RouteSeo
// now renders <SeoHead /> with the data resolveRouteSeo returns,
// and BookPage renders it with bookSeoData() once the book loads.
// The prerender script (scripts/prerender.mjs) emits the same tag
// set into static HTML using the same formulas — see its header
// comment for the deliberate duplication (it is plain JS and cannot
// import this TS module).

import { Helmet } from 'react-helmet-async';
import { alternateLangUrl, hreflangUrls, stripLangPrefix, type SupportedLang } from '../lib/langRouting';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, OG_IMAGE_URL, ogLocaleForLang } from '../lib/seo';

export type SeoHeadProps = {
  title: string;
  description: string;
  /** Absolute canonical URL, lang-prefixed (e.g. https://eduvelto.com/bn/jobs/bcs) —
   *  EXCEPT app routes (/exam, /progress), whose canonical is the bare URL
   *  (23:00 check, 25 Nov 2026). */
  canonical: string;
  lang: SupportedLang;
  ogType?: string;
  ogImage?: string;
  /** 'noindex, nofollow' etc. Absent = indexable (no robots tag). */
  robots?: string;
  /** JSON-LD objects, one <script> tag each. */
  jsonLd?: unknown[];
};

export function SeoHead({ title, description, canonical, lang, ogType, ogImage, robots, jsonLd }: SeoHeadProps) {
  // A bare canonical (/exam, /progress — app routes outside /:lang)
  // has NO language variants: /bn/exam and /en/exam redirect to it,
  // so emitting hreflang to those URLs would point Google at
  // redirects. Omit the alternates for bare canonicals only.
  const isBareCanonical = stripLangPrefix(new URL(canonical).pathname).lang === null;
  const hreflang = isBareCanonical ? null : hreflangUrls(canonical, lang);
  const ogLocale = ogLocaleForLang(lang);
  const image = ogImage ?? OG_IMAGE_URL;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {/* No fragment wrapper: react-helmet-async drops fragment
          children, so each alternate is a direct conditional child. */}
      {hreflang ? <link rel="alternate" hrefLang="bn" href={hreflang.bn} /> : null}
      {hreflang ? <link rel="alternate" hrefLang="en" href={hreflang.en} /> : null}
      {hreflang ? <link rel="alternate" hrefLang="x-default" href={hreflang.xDefault} /> : null}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType ?? 'website'} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={ogLocale.locale} />
      <meta property="og:locale:alternate" content={ogLocale.alternate} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {robots ? <meta name="robots" content={robots} /> : null}
      {(jsonLd ?? []).map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}

/** The same tag set as plain data (used by the entry-server +
//  prerender tests and by any caller that needs the strings
//  without rendering). Kept in sync with <SeoHead /> above. */
export function seoHeadData(props: SeoHeadProps) {
  // Same bare-canonical rule as <SeoHead /> above: no hreflang
  // alternates for app routes whose canonical is the bare URL.
  const isBareCanonical = stripLangPrefix(new URL(props.canonical).pathname).lang === null;
  const hreflang = isBareCanonical ? null : hreflangUrls(props.canonical, props.lang);
  return {
    title: props.title,
    description: props.description,
    canonical: props.canonical,
    hreflang,
    ogLocale: ogLocaleForLang(props.lang),
    ogImage: props.ogImage ?? OG_IMAGE_URL,
    alternateLangUrl: (target: SupportedLang) => alternateLangUrl(props.canonical, target),
  };
}
