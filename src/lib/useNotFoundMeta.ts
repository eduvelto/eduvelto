// Eduvelto — shared noindex hook for not-found states (WEB-001 follow-up,
// Master Plan quick wins, 23 Nov 2026).
//
// The catch-all NotFoundPage and the dynamic-family "not found" cards
// (unknown exam / subject / topic slugs) all need the same behaviour:
// while the not-found state is showing, set a distinct document.title
// and a `robots` meta tag (`noindex, nofollow`); on cleanup, remove the
// tag we added (or restore a pre-existing one untouched) and restore the
// static home fallback title — so the tag can never leak onto a real
// page. RouteSeo renders nothing for these states (resolveRouteSeo()
// returns null for unknown paths), and PageShell only renders the title
// as an <h1>, never as document.title — hence this hook.
//
// `active` gates the effect: call it unconditionally at the top of the
// component with the not-found condition (e.g. `!def`). When active is
// false the effect does nothing at all.
//
// The restore titles MUST match the live home titles exactly
// (seo.ts STATIC_ROUTES['/'] / index.html <title>): brand-SEO wave 1
// removed "সেরা" from the Bangla home title and wave 2 removed
// "Best" from the English one — a stale "সেরা"/"Best" here would put
// the superlative back into document.title on every not-found
// cleanup. A unit test (seo.test.ts, wave 2) pins the match.

import { useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const HOME_FALLBACK_TITLE_BN = 'Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম';
const HOME_FALLBACK_TITLE_EN = "Eduvelto — Bangladesh's Free Education Platform";

export function useNotFoundMeta(title: string, active: boolean): void {
  const { lang } = useLanguage();
  useEffect(() => {
    if (!active) return;
    document.title = title;
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !robots;
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    const previous = robots.getAttribute('content');
    robots.setAttribute('content', 'noindex, nofollow');
    return () => {
      // Remove the tag we added; restore a pre-existing one untouched.
      if (created) {
        robots?.remove();
      } else if (previous === null) {
        robots?.removeAttribute('content');
      } else {
        robots?.setAttribute('content', previous);
      }
      document.title = lang === 'bn' ? HOME_FALLBACK_TITLE_BN : HOME_FALLBACK_TITLE_EN;
    };
  }, [active, title, lang]);
}
