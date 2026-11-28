// Eduvelto — chrome-free embed page (28 Nov 2026, growth batch item 4).
//
// /embed/:slug — renders ONLY the tool's interactive UI plus a small
// "Powered by Eduvelto.com" footer line, so other sites can iframe the
// tool (see src/components/EmbedWidget.tsx for the snippet). NO
// header/nav/footer/ads/EditorialBadge/ShareButton/guide/related-tools:
// the app shell (HeaderNav/Footer/BottomNav) is hidden for /embed by
// the isAdminShell-style check in App.tsx — see the route line the
// coordinator adds.
//
// - Unknown slug, or a slug with no ToolUI entry (including the alias
//   slugs unit-converter, typing-speed-test, cv-builder,
//   cover-letter-builder, which render full hub pages, not a single
//   tool component) → minimal not-found, robots noindex.
// - Known embeddable slug → the tool component, imported from the
//   single registry in ToolsDetailPage.tsx (never duplicated here).
// - Embed pages are always robots "noindex, nofollow" with canonical
//   pointing at the real tool page — they duplicate the tool pages and
//   must NOT be indexed.
// - Language comes from the optional ?lang=en param (default bn); the
//   embed URL itself carries no lang prefix, keeping it short for
//   backlinks. SSR-safe: no window/document access at render time.

import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { SeoHead } from '../components/SeoHead';
import { toolBySlug } from '../lib/toolsMeta';
import { SITE_URL } from '../lib/langRouting';
import { TOOL_COMPONENTS } from './ToolsDetailPage';

export default function EmbedToolPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { setLanguage } = useLanguage();
  const queryLang = searchParams.get('lang');
  const lang: 'bn' | 'en' = queryLang === 'en' ? 'en' : 'bn';

  // Keep the tool UI in the embed language (mirrors LangLayout's
  // syncLanguageFromPath; effect-only, so SSR output is unaffected).
  useEffect(() => {
    setLanguage(lang);
  }, [lang, setLanguage]);

  const meta = toolBySlug(slug);
  const ToolUI = meta ? TOOL_COMPONENTS[meta.slug] : undefined;

  if (!meta || !ToolUI) {
    return (
      <>
        <SeoHead
          title={lang === 'bn' ? 'পাতা পাওয়া যায়নি | Eduvelto' : 'Page not found | Eduvelto'}
          description={
            lang === 'bn'
              ? 'এই ঠিকানায় কোনো এমবেডযোগ্য টুল নেই।'
              : 'There is no embeddable tool at this address.'
          }
          canonical={`${SITE_URL}/${lang}/tools`}
          lang={lang}
          robots="noindex, nofollow"
        />
        <main
          style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: '48px 16px',
            textAlign: 'center',
            fontFamily: "'Hind Siliguri','Noto Sans Bengali',system-ui,sans-serif",
          }}
        >
          <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>
            {lang === 'bn' ? 'পাতা পাওয়া যায়নি' : 'Page not found'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>
            {lang === 'bn'
              ? 'এই ঠিকানায় কোনো এমবেডযোগ্য টুল নেই।'
              : 'There is no embeddable tool at this address.'}
          </p>
          <Link to={`/${lang}/tools`} style={{ color: 'var(--link, #2563eb)' }}>
            {lang === 'bn' ? 'সব টুল' : 'All tools'}
          </Link>
        </main>
      </>
    );
  }

  const title = lang === 'bn' ? meta.titleBn : meta.titleEn;
  const description = lang === 'bn' ? meta.descriptionBn : meta.descriptionEn;

  return (
    <>
      <SeoHead
        title={`${title} | Eduvelto`}
        description={description}
        canonical={`${SITE_URL}/${lang}/tools/${meta.slug}`}
        lang={lang}
        robots="noindex, nofollow"
      />
      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '16px',
          fontFamily: "'Hind Siliguri','Noto Sans Bengali',system-ui,sans-serif",
        }}
      >
        <ToolUI />
        <footer
          style={{
            marginTop: 20,
            paddingTop: 12,
            borderTop: '1px solid var(--border, #e5e7eb)',
            textAlign: 'center',
            fontSize: 13,
          }}
        >
          <a href={SITE_URL} target="_blank" rel="noopener" style={{ color: 'var(--muted)' }}>
            Powered by Eduvelto.com
          </a>
        </footer>
      </main>
    </>
  );
}
