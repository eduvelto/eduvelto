import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA: the manifest lives in public/manifest.webmanifest (manifest: false
// stops the plugin generating its own). The service worker caches the app
// shell only; Firestore data is never cached for offline use beyond the
// current session's in-progress attempt (see blueprint §6.2).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Offline: a failed navigation shows the branded offline page.
        // The app shell itself is precached, so a reload retries the app.
        navigateFallback: '/offline.html',
      },
      devOptions: { enabled: false },
    }),
  ],
});
