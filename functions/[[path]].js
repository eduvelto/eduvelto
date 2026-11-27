// Cloudflare Pages Function — SPA fallback + prerendered pages.
//
// The _redirects file (/* /index.html 200) SHOULD do this, but the first two
// Pages deployments served 404 for /bn, /en and other client-side routes.
// This catch-all Function is the belt-and-braces fallback.
//
// 27 Nov 2026 — prerender shadowing fix: this catch-all used to serve
// /index.html for EVERY extensionless path, which shadowed the prerendered
// per-route HTML (dist/bn/tools/<slug>/index.html, dist/bn/books/<id>/...)
// that `npm run build:pages` writes — Googlebot got the home page for
// every tool/book URL even though the prerendered files were in the
// deployment (verified live: /bn/tools/weather/index.html 308-redirects
// to /bn/tools/weather/, proving the file exists, yet /bn/tools/weather
// served the 28,657-byte home page). Now the Function serves the
// prerendered file for the route when one exists, and falls back to
// /index.html only for genuine client-side routes (dashboard, app, ...).
// 27 Nov 2026 — host unification: www.eduvelto.com, eduvelto.pages.dev
// and www.eduvelto.pages.dev 301 to the apex host (see onRequest) —
// Cloudflare analytics showed the same site split across 3 hosts
// (www 20.57k, pages.dev 2.44k requests), diluting SEO/AdSense.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  // Host unification FIRST, before any asset/prerender/SPA logic:
  // the duplicate hosts redirect permanently to the apex host, keeping
  // path + query. Exact-host match only, so branch preview hosts
  // (<branch>.eduvelto.pages.dev) pass through untouched, and the apex
  // host itself is never redirected (no loop).
  if (
    url.hostname === 'www.eduvelto.com' ||
    url.hostname === 'eduvelto.pages.dev' ||
    url.hostname === 'www.eduvelto.pages.dev'
  ) {
    return Response.redirect(`https://eduvelto.com${url.pathname}${url.search}`, 301);
  }
  const path = url.pathname;
  // 28 Nov 2026 (completeness audit, owner-approved duplicate removal):
  // the removed duplicate tools 301 to their canonical tools. This lives
  // HERE, not in public/_redirects — the catch-all Function intercepts
  // every request before _redirects rules are evaluated (verified live
  // 28 Nov 2026: _redirects rules for these URLs returned 200, not 301).
  const TOOL_REDIRECTS = {
    '/bn/tools/pdf-page-extractor': '/bn/tools/pdf-splitter',
    '/en/tools/pdf-page-extractor': '/en/tools/pdf-splitter',
    '/bn/tools/jpg-to-pdf': '/bn/tools/image-to-pdf',
    '/en/tools/jpg-to-pdf': '/en/tools/image-to-pdf',
  };
  const cleanPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  if (TOOL_REDIRECTS[cleanPath]) {
    return Response.redirect(new URL(`${TOOL_REDIRECTS[cleanPath]}${url.search}`, url), 301);
  }
  // Static asset (has a file extension) — let Pages serve it normally.
  if (/\.[a-zA-Z0-9]+$/.test(path)) {
    return context.next();
  }
  // Prerendered page for this route (e.g. /bn/tools/weather ->
  // /bn/tools/weather/index.html) — serve it when it exists so crawlers
  // get the prerendered title/meta instead of the SPA shell.
  const dir = path.endsWith('/') ? path : `${path}/`;
  const prerendered = await context.env.ASSETS.fetch(new URL(`${dir}index.html`, url));
  if (prerendered.ok) {
    return prerendered;
  }
  // No prerendered file (client-side route) — SPA entry point, so the
  // React router takes over.
  return context.env.ASSETS.fetch(new URL('/index.html', url));
}
