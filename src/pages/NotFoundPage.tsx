// Eduvelto — Not Found page (WEB-001, Master Plan quick wins, 23 Nov 2026).
//
// Renders for every path that matches NO route (the `*` catch-all in
// App.tsx). Before this page, the catch-all rendered HomePage — a soft
// 404: an unknown URL looked exactly like the homepage. This page says
// plainly, in Bangla + English, that the page was not found, shows the
// address that was tried, and links to Home, Jobs, Library and Contact
// (for reporting a broken link).
//
// SEO: RouteSeo renders nothing here — resolveRouteSeo() returns null
// for unknown paths, by design — so this page sets its own title and a
// `robots` meta tag (`noindex, nofollow`) via the shared useNotFoundMeta
// hook, which removes the robots tag again on unmount so it can never
// leak onto a real page. It deliberately sets NO canonical and NO
// JSON-LD: a not-found URL must not present itself as content. The
// title is restored to the static home fallback on unmount (the next
// route's own SEO overwrites it when it has one).
//
// STATUS: unknown TOP-LEVEL paths (e.g. /asdfgh) now get a real HTTP
// 404 from the hosting config (firebase.json rewrites + public/404.html)
// — this page is the rendered fallback for unknown slugs INSIDE a known
// route family (e.g. /jobs/not-an-exam), where a rewrite cannot tell a
// bad slug from a good one, and for in-app navigation to unknown paths.

import { Link, useLocation } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotFoundMeta } from '../lib/useNotFoundMeta';

const PAGE_TITLE = 'পাতাটি পাওয়া যায়নি — Eduvelto';

export default function NotFoundPage() {
  const { t } = useLanguage();
  const location = useLocation();

  useNotFoundMeta(t({ bn: PAGE_TITLE, en: 'Page not found — Eduvelto' }), true);

  return (
    <PageShell titleBn="এই পাতাটি খুঁজে পাওয়া যায়নি" titleEn="This page could not be found">
      <Card>
        <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink)', margin: '0 0 12px' }}>
          {t({
            bn: 'আপনি যে ঠিকানাটি খুঁজছেন, সেই পাতাটি Eduvelto-তে নেই। হয়তো ঠিকানাটি ভুল টাইপ হয়েছে, অথবা পাতাটি সরিয়ে নেওয়া হয়েছে।',
            en: 'The address you were looking for does not exist on Eduvelto. It may have been typed incorrectly, or the page may have been moved or removed.',
          })}
        </p>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--muted-ivory)',
            margin: '0 0 20px',
            overflowWrap: 'anywhere',
          }}
        >
          {t({ bn: 'চেষ্টা করা ঠিকানা: ', en: 'Address tried: ' })}
          <code>{location.pathname}</code>
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link
            to="/"
            style={{
              padding: '10px 18px',
              minHeight: 48,
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 6,
              background: '#142B3B',
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {t({ bn: 'হোমে যান', en: 'Go to Home' })}
          </Link>
          <Link
            to="/jobs"
            style={{
              padding: '10px 18px',
              minHeight: 48,
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 6,
              border: '1px solid var(--line)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {t({ bn: 'চাকরি প্রস্তুতি', en: 'Job Preparation' })}
          </Link>
          <Link
            to="/library"
            style={{
              padding: '10px 18px',
              minHeight: 48,
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 6,
              border: '1px solid var(--line)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {t({ bn: 'লাইব্রেরি', en: 'Library' })}
          </Link>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-ivory)', margin: '20px 0 0' }}>
          {t({
            bn: 'কোনো লিংক থেকে এখানে এসে থাকলে ভাঙা লিংকটি আমাদের জানান — ',
            en: 'If you arrived here from a link, please let us know about the broken link — ',
          })}
          <Link to="/contact" style={{ fontWeight: 600 }}>
            {t({ bn: 'যোগাযোগ করুন', en: 'contact us' })}
          </Link>
        </p>
      </Card>
    </PageShell>
  );
}
