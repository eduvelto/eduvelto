// Eduvelto — Offline page (D-04, QA 27 Nov 2026).
//
// Firebase Hosting's cleanUrls redirects /offline.html -> /offline
// (308), but /offline was NOT a route — it rendered the client-side
// 404 page. This page is the 308 target: the same branded offline
// content as public/offline.html (which the service worker serves
// from its precache when a navigation fetch actually fails).
//
// Static content only — no login, no Firestore reads. Not in the
// sitemap and disallowed in robots.txt (utility page, not content).

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';

export default function OfflinePage() {
  const { t } = useLanguage();
  return (
    <PageShell
      titleBn="অফলাইনে আছেন — Eduvelto"
      titleEn="You're offline — Eduvelto"
      wide
    >
      <Card>
        <p style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#F1B308' }}>
          Eduvelto
        </p>
        <p style={{ margin: '0 0 24px', fontSize: 15, color: 'var(--muted)' }}>
          {t({ bn: 'শেখো, এগিয়ে যাও, স্বপ্ন গড়ো', en: 'Learn, Grow, Achieve' })}
        </p>
        <h1 style={{ fontSize: 22, margin: '0 0 12px' }}>
          {t({ bn: 'আপনি অফলাইনে আছেন', en: "You're offline" })}
        </h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 8px' }}>
          {t({
            bn: 'ইন্টারনেট সংযোগ নেই। সংযোগ ফিরে এলে আবার চেষ্টা করুন।',
            en: 'No internet connection. Please check your connection and try again.',
          })}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 20,
            padding: '12px 28px',
            minHeight: 48,
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            borderRadius: 8,
            background: '#F1B308',
            color: '#041742',
            cursor: 'pointer',
          }}
        >
          {t({ bn: 'আবার চেষ্টা করুন', en: 'Try again' })}
        </button>
        <p style={{ marginTop: 20, fontSize: 14 }}>
          <Link to="/">{t({ bn: 'হোমে ফিরুন', en: 'Back to Home' })}</Link>
        </p>
      </Card>
    </PageShell>
  );
}
