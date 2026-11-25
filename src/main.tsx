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
