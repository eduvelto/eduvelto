// Eduvelto — CookieConsentBanner + EditorialBadge tests (28 Nov 2026).
//
// Renders with renderToString in plain node (same pattern as
// ShareButton.test.tsx). The banner's visibility logic runs in an
// effect (LocalStorage read after mount), so the server render is
// null by design — that is pinned here, because the prerendered
// HTML must never carry the banner. The show-after-mount / hide-
// after-Accept behaviour is verified live (Playwright), not here.
// The badge's exact owner-ordered wording is pinned in both
// languages.

import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import CookieConsentBanner, { COOKIE_CONSENT_KEY } from '../CookieConsentBanner';
import EditorialBadge, { EDITORIAL_BADGE_BN, EDITORIAL_BADGE_EN } from '../EditorialBadge';

const mockLangState = vi.hoisted(() => ({ lang: 'bn' as 'bn' | 'en' }));

vi.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({
    lang: mockLangState.lang,
    tabLang: mockLangState.lang,
    t: (entry: { bn: string; en: string }) => entry[mockLangState.lang],
    setLanguage: () => {},
  }),
}));

describe('CookieConsentBanner', () => {
  it('uses the agreed LocalStorage key', () => {
    expect(COOKIE_CONSENT_KEY).toBe('eduvelto-cookie-consent');
  });

  it('renders nothing on the server (no banner in prerendered HTML)', () => {
    // The LocalStorage check runs in an effect after mount, so the
    // first render — the one prerender captures — is empty.
    expect(renderToString(<CookieConsentBanner />)).toBe('');
  });
});

describe('EditorialBadge', () => {
  it('carries the exact owner-ordered wording in both languages', () => {
    expect(EDITORIAL_BADGE_BN).toBe(
      'যাচাইকৃত: Eduvelto শিক্ষা ও গবেষণা টিম — হালনাগাদ: নভেম্বর ২০২৬',
    );
    expect(EDITORIAL_BADGE_EN).toBe(
      'Verified: Eduvelto Education & Research Team — Updated: November 2026',
    );
  });

  it('renders the Bangla text when lang is bn', () => {
    mockLangState.lang = 'bn';
    const html = renderToString(<EditorialBadge />);
    expect(html).toContain('যাচাইকৃত: Eduvelto শিক্ষা ও গবেষণা টিম — হালনাগাদ: নভেম্বর ২০২৬');
    expect(html).not.toContain('Verified: Eduvelto Education');
  });

  it('renders the English text when lang is en', () => {
    mockLangState.lang = 'en';
    const html = renderToString(<EditorialBadge />);
    expect(html).toContain('Verified: Eduvelto Education &amp; Research Team — Updated: November 2026');
    expect(html).not.toContain('যাচাইকৃত');
  });
});
