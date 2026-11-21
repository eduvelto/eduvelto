/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

// Take over as soon as the new worker is installed (same behaviour as the
// previous generated worker: skipWaiting + clientsClaim).
self.skipWaiting();
clientsClaim();

// Navigation — network-first, offline page ONLY on real network failure.
// Registered FIRST, before precacheAndRoute below: Workbox matches routes
// in registration order, and precacheAndRoute matches navigations to `/`
// (it maps a trailing `/` to the precached `index.html`). If the precache
// route ran first, opening the app at `/` while offline would serve the
// cached app shell instead of the branded offline page — verified 21 Nov
// 2026 on the staging build: offline `/` showed the home page (FAIL),
// offline `/library` showed the offline page (PASS). Do not move the
// precache call above this route.
//
// Deep-link background (21 Nov 2026): the previous generateSW config used
// `navigateFallback: '/offline.html'`. Workbox implements that as
// `registerRoute(new NavigationRoute(createHandlerBoundToURL('/offline.html')))`,
// and createHandlerBoundToURL serves the precached page straight from
// cache — it NEVER tries the network, and with no allowlist/denylist the
// route matches EVERY navigation. So every hard load / refresh of any route
// (/health, /health/medicines, /library, ...) showed the offline page even
// while online. (Only the very first load of / worked, because the worker
// was not controlling the page yet.)
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

// Precache the app shell + the branded offline page. The precached
// `index.html` is still served for non-navigation requests for it; it no
// longer shadows navigations (see the route above).
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
