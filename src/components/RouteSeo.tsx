// Eduvelto — route-level SEO (22 Nov 2026, feature/seo-visibility;
// fallback noindex added 23 Nov 2026, feature/seo-50-100-pages;
// REWRITTEN 25 Nov 2026, Phase 1 SSG + bilingual: the tags are now
// rendered declaratively through <SeoHead /> (react-helmet-async)
// instead of the imperative useSeo() DOM writes, so the SAME
// component serves the browser and the SSR/prerender path
// (src/entry-server.tsx reads the tags out of the helmet context).
//
// Mounted once in App.tsx. On every route change it applies the SEO
// for that route (title, meta description, Open Graph, canonical,
// Organization + WebSite + WebPage + Breadcrumb JSON-LD) from
// lib/seo.ts. Routes with no SEO entry (auth, admin, dashboards)
// render nothing — they are not indexable content. /founder resolves
// in lib/seo.ts since Phase 2 (25 Nov 2026) and carries ProfilePage
// + Person JSON-LD instead of the generic WebPage.
//
// Fallback (23 Nov 2026): when a path has no SEO entry, RouteSeo
// applies resolveFallbackSeo — the HOME title/description/canonical
// (the catch-all renders HomePage there) plus robots noindex,
// nofollow — so junk URLs (/jobs/not-an-exam, unknown slugs) never
// look indexable. It never changes what the user sees.
//
// resolveRouteSeo() accepts both /:lang-prefixed and bare legacy
// paths; a lang prefix in the URL is the source of truth for the
// page language (see src/lib/seo.ts).

import { useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { resolveFallbackSeo, resolveRouteSeo } from '../lib/seo';
import { stripLangPrefix } from '../lib/langRouting';
import { SeoHead } from './SeoHead';

export function RouteSeo() {
  const location = useLocation();
  const { lang } = useLanguage();
  const seo = resolveRouteSeo(location.pathname, lang) ?? resolveFallbackSeo(location.pathname, lang);
  if (!seo) return null;
  const stripped = stripLangPrefix(location.pathname);
  return (
    <SeoHead
      title={seo.title}
      description={seo.description}
      canonical={seo.canonical}
      lang={stripped.lang ?? lang}
      ogType={seo.ogType}
      ogImage={seo.ogImage}
      robots={seo.robots}
      jsonLd={seo.jsonLd}
    />
  );
}
