/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

// Take over as soon as the new worker is installed (same behaviour as the
// previous generated worker: skipWaiting + clientsClaim).
self.skipWaiting();
clientsClaim();

// Precache the app shell + the branded offline page.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Deep-link navigation — BUG FIX (21 Nov 2026):
// The previous generateSW config used `navigateFallback: '/offline.html'`.
// Workbox implements that as `registerRoute(new NavigationRoute(
// createHandlerBoundToURL('/offline.html')))`, and createHandlerBoundToURL
// serves the precached page straight from cache — it NEVER tries the
// network, and with no allowlist/denylist the route matches EVERY
// navigation. So every hard load / refresh of any route (/health,
// /health/medicines, /library, ...) showed the offline page even while
// online. (Only the very first load of / worked, because the worker was
// not controlling the page yet.)
//
// Correct behaviour: try the network FIRST. Firebase Hosting rewrites
// every route to /index.html, so a hard load of a deep link returns the
// app shell and client-side routing renders the page. The branded offline
// page is served ONLY when the network request actually fails — i.e. the
// user is genuinely offline.
registerRoute(
  new NavigationRoute(async ({ request }) => {
    try {
      return await fetch(request);
    } catch (error) {
      return (await matchPrecache('/offline.html')) ?? Response.error();
    }
  }),
);
