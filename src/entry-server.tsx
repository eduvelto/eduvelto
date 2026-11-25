// Eduvelto — SSR entry (Phase 1, SSG + bilingual, 25 Nov 2026,
// feature/ssg-bilingual-support).
//
// Built with `vite build --ssr src/entry-server.tsx --outDir
// dist-ssr` and consumed by scripts/prerender.mjs, which calls
// render(url) per public URL and writes the resulting HTML to
// dist/. The SAME App component serves the browser (src/main.tsx)
// and the prerender — no forked templates.
//
// What render() returns:
// - html: the app rendered to a string for this URL (StaticRouter).
// - helmet: the react-helmet-async server state (title / meta /
//   link / script, each with toString()) — the prerender script
//   injects these into the <head> of the output page.
//
// HONEST LIMIT (documented, not hidden): renderToString runs the
// render pass only — effects never run, so data-backed pages render
// their loading/empty state here and perform NO Firestore reads.
// The prerender script therefore injects the real per-page head
// tags (from resolveRouteSeo / bookSeoData formulas) plus, for book
// pages, a server-rendered summary block with the book's real data
// from the fixture / live REST. Full data-awaiting SSR is Phase 2
// work; Phase 1 delivers correct head + URLs + shell + book
// summaries. A render that throws for a URL is caught by the
// prerender script, which falls back to shell + head injection.

import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './lib/auth';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './lib/theme';

export function render(url: string): { html: string; helmet: HelmetServerState | null } {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </StaticRouter>
    </HelmetProvider>,
  );
  return { html, helmet: helmetContext.helmet ?? null };
}
