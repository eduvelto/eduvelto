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
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
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
