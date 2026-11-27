// Cloudflare Pages Function — SPA fallback.
//
// The _redirects file (/* /index.html 200) SHOULD do this, but the first two
// Pages deployments served 404 for /bn, /en and other client-side routes.
// This catch-all Function is the belt-and-braces fallback: any path that is
// not a static asset (no file extension) gets the SPA entry point, so the
// React router handles it. Static assets (JS/CSS/images/...) pass through
// untouched via context.next().
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  // Static asset (has a file extension) — let Pages serve it normally.
  if (/\.[a-zA-Z0-9]+$/.test(path)) {
    return context.next();
  }
  // SPA route — serve index.html with a 200 so the client router takes over.
  return context.env.ASSETS.fetch(new URL("/index.html", url));
}
