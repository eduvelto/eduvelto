import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA: the manifest lives in public/manifest.webmanifest (manifest: false
// stops the plugin generating its own). The service worker is a custom
// injectManifest worker (src/sw.ts): the app shell is precached, and
// deep-link navigation is network-first with the branded offline page as
// the fallback ONLY when the network request actually fails.
//
// DO NOT re-add `navigateFallback: '/offline.html'` here. Workbox's
// generateSW implements navigateFallback as a NavigationRoute bound to
// the precached offline page, which serves offline.html for EVERY hard
// load / refresh of any route even while online (verified 21 Nov 2026:
// /health and /health/medicines showed "অফলাইনে আছেন" on an online
// browser; the server itself returns HTTP 200 for those routes).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: false,
      // NO AUTO-REGISTRATION (app audit, 24 Nov 2026, owner brief item 8:
      // the app is fully online-only, no service worker). With
      // injectRegister: false the plugin does NOT inject registerSW.js
      // into index.html; src/main.tsx registers the worker manually and
      // ONLY in a browser (isNativeApp() gate). The Capacitor app must
      // never precache the shell or serve the worker's offline page
      // instead of its own Connection Required screen. Browser behaviour
      // is unchanged: main.tsx calls registerSW({ immediate: true }),
      // the same semantics as the old auto-registration.
      injectRegister: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    // SCALE (10k users): split the vendor code out of the app bundle so
    // repeat visits reuse the cached vendor chunk (React + Firebase change
    // far less often than app code). Measured before/after in the
    // scalability report (team/scalability-10k-report.md).
    // NOTE: manualChunks must NOT split the PWA service worker (src/sw.ts
    // is built separately by vite-plugin-pwa); these chunks cover the app
    // entry only.
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});
