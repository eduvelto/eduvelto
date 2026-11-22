// Eduvelto — route-level SEO (22 Nov 2026, feature/seo-visibility).
//
// Mounted once in App.tsx. On every route change it applies the SEO
// for that route (title, meta description, Open Graph, canonical,
// Organization + WebSite + WebPage + Breadcrumb JSON-LD) from
// lib/seo.ts. Routes with no SEO entry (auth, admin, dashboards,
// /founder) render nothing — /founder owns its own SEO via
// FounderPage, and the others are not indexable content.
//
// The hook lives in a child component (SeoApplier) so the hook call
// itself is never conditional: when there is no SEO for a route the
// child simply does not mount.

import { useLocation } from 'react-router-dom';
import { resolveRouteSeo, useSeo, type SeoData } from '../lib/seo';

function SeoApplier({ seo }: { seo: SeoData }) {
  useSeo(seo);
  return null;
}

export function RouteSeo() {
  const location = useLocation();
  const seo = resolveRouteSeo(location.pathname);
  if (!seo) return null;
  return <SeoApplier seo={seo} />;
}
