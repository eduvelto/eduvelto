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
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: { enabled: false },
    }),
  ],
});
