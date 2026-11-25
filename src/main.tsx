import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App';
import { AuthProvider } from './lib/auth';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './lib/theme';
import { isNativeApp } from './lib/isNativeApp';

// Service worker registration is BROWSER-ONLY (app audit, 24 Nov 2026,
// owner brief item 8: the app is fully online-only, no service worker).
// vite-plugin-pwa's auto-registration is disabled (injectRegister: false
// in vite.config.ts); the browser registers here with the same
// autoUpdate semantics as before (immediate takeover), while the
// Capacitor app never registers — it must not precache the shell or
// serve the worker's offline page instead of its own Connection
// Required screen. Registration failure is swallowed: the site works
// fully without the worker.
if (!isNativeApp()) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => undefined);
}

// hydrateRoot evaluation (Phase 2b, 25 Nov 2026 — DECIDED: keep
// createRoot). With __INITIAL_DATA__ present the payload-fed first
// render could in principle hydrate the prerendered HTML — but the
// prerendered #root contains two things the client tree does not
// produce: (a) the book-summary <section data-prerender> that
// scripts/prerender.mjs prepends into #root, and (b) SSR loading /
// skeleton states (renderToString runs no effects, so data pages
// SSR-render their loading state) while the payload-fed client
// renders real content immediately. hydrateRoot requires the client
// render to match the server HTML exactly; both (a) and (b) would
// mismatch, so React would discard the SSR DOM and client-render
// anyway (losing the benefit) with hydration warnings. Adopting
// hydrateRoot needs the summary block moved out of #root AND full
// data-awaiting SSR — both out of scope for this task. The
// __INITIAL_DATA__ benefit (zero reads, instant content after JS
// loads) is delivered without hydration, and the prerendered
// summary stays visible before JS loads.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* HelmetProvider (Phase 1, 25 Nov 2026): <SeoHead /> renders
        through react-helmet-async; the same provider wraps the SSR
        entry (src/entry-server.tsx). */}
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
