import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

// Shared page shell — every page renders through this, so the header
// treatment, spacing and empty states stay consistent across the app.
// (ui/premium-polish: navy title + gold accent bar, wider option for
// list pages, card-style empty state, page-enter animation.)
//
// LANGUAGE (21 Nov 16:09/16:11): the shell renders ONE language only —
// the title is titleBn in Bangla mode, titleEn in English mode. Call
// sites keep passing both; the shell picks. Same for EmptyState.

export function PageShell(props: {
  titleBn: string;
  titleEn: string;
  children?: ReactNode;
  /** Wide layout (960px) for list/browse pages; default is 720px reading width. */
  wide?: boolean;
  /** Extra-wide shell (px) — homepage/class dashboard with the 300px side-ad rail. */
  maxWidth?: number;
  /** Hide the "back home" footer link (home page itself). */
  hideHomeLink?: boolean;
  /** Hide the generic page title (home page: the hero is the title). */
  hideTitle?: boolean;
}) {
  const { lang, t } = useLanguage();
  return (
    <main
      className="ev-page"
      style={{
        maxWidth: props.maxWidth ?? (props.wide ? 960 : 720),
        margin: '0 auto',
        padding: '28px 16px 40px',
        fontFamily: "'Hind Siliguri','Noto Sans Bengali',system-ui,-apple-system,'Segoe UI',sans-serif",
      }}
    >
      {props.hideTitle ? null : (
        <>
          <h1
            style={{
              fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--heading)',
              margin: '0 0 4px',
              lineHeight: 1.3,
            }}
          >
            {lang === 'bn' ? props.titleBn : props.titleEn}
          </h1>
          <div
            aria-hidden="true"
            style={{ width: 48, height: 4, borderRadius: 2, background: '#D9A441', margin: '6px 0 10px' }}
          />
        </>
      )}
      {props.children}
      {props.hideHomeLink ? null : (
        <p style={{ marginTop: 36, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
          <Link to="/" style={{ fontWeight: 600 }}>
            {t({ bn: '← হোম', en: '← Home' })}
          </Link>
        </p>
      )}
    </main>
  );
}

export function EmptyState(props: { bn: string; en: string }) {
  const { lang } = useLanguage();
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '24px 18px',
        background: 'var(--teal-soft)',
        textAlign: 'center',
      }}
    >
      <div aria-hidden="true" style={{ marginBottom: 10, color: 'var(--teal-text)' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--heading)', fontSize: 16 }}>
        {lang === 'bn' ? props.bn : props.en}
      </p>
    </div>
  );
}
