// Eduvelto — route-level SEO (22 Nov 2026, feature/seo-visibility;
// fallback noindex added 23 Nov 2026, feature/seo-50-100-pages).
//
// Mounted once in App.tsx. On every route change it applies the SEO
// for that route (title, meta description, Open Graph, canonical,
// Organization + WebSite + WebPage + Breadcrumb JSON-LD) from
// lib/seo.ts. Routes with no SEO entry (auth, admin, dashboards,
// /founder) render nothing — /founder owns its own SEO via
// FounderPage, and the others are not indexable content.
//
// Fallback (23 Nov 2026): when a path has no SEO entry and is NOT
// /founder, RouteSeo applies resolveFallbackSeo — the HOME
// title/description/canonical (the catch-all renders HomePage there)
// plus robots noindex, nofollow — so junk URLs (/jobs/primary,
// unknown slugs) never look indexable. It never changes what the
// user sees.
//
// The hook lives in a child component (SeoApplier) so the hook call
// itself is never conditional: when there is no SEO for a route the
// child simply does not mount.

import { useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { resolveFallbackSeo, resolveRouteSeo, useSeo, type SeoData } from '../lib/seo';

function SeoApplier({ seo, lang }: { seo: SeoData; lang: 'bn' | 'en' }) {
  useSeo(seo, lang);
  return null;
}

export function RouteSeo() {
  const location = useLocation();
  const { lang } = useLanguage();
  const seo = resolveRouteSeo(location.pathname, lang) ?? resolveFallbackSeo(location.pathname, lang);
  if (!seo) return null;
  return <SeoApplier seo={seo} lang={lang} />;
}
