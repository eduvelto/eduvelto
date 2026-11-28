// Eduvelto — cookie consent banner (owner order 28 Nov 2026, trust/content batch).
//
// No consent banner existed before this — only PrivacyPage mentioned
// cookies. This is a small fixed banner at the bottom of the screen,
// shown on first visit only: text + a Privacy Policy link + an
// 'Accept' button. Clicking Accept saves 'accepted' to LocalStorage
// (key COOKIE_CONSENT_KEY) and the banner never shows again.
//
// PLACEMENT — it must NEVER cover the bottom nav, the AdSense bottom
// banner, or any button:
// - The banner's CSS (.ev-cookie-banner in index.css) sits it ABOVE
//   the bottom ad banner (--ev-banner reserve, 112px when filled)
//   and ABOVE the mobile bottom nav (76px reserve on <=768px).
// - It also reports its own measured height to App (onHeightChange),
//   so App reserves that height in the shell's bottom padding
//   (--ev-cookie) and page content / footer buttons scroll clear of
//   it while it is visible. Height is measured with ResizeObserver,
//   so the reserve follows the real rendered height in both
//   languages and at every width.
// - z-index 60: above the bottom banner (10) and the bottom nav (40).
// - Hidden on the admin/CEO shells (App renders it only for the
//   public shell, like the Footer and BottomNav).
//
// SSR-safe: the first render shows nothing; the LocalStorage check
// runs in an effect after mount, so the prerendered HTML never
// carries the banner and there is no hydration mismatch.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

/** LocalStorage key for the cookie-consent choice. */
export const COOKIE_CONSENT_KEY = 'eduvelto-cookie-consent';

export default function CookieConsentBanner({
  onHeightChange,
}: {
  /** Called with the banner's rendered height (px) while visible, 0 when hidden. */
  onHeightChange?: (heightPx: number) => void;
}) {
  const { t, lang } = useLanguage();
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(COOKIE_CONSENT_KEY) !== 'accepted') {
        setVisible(true);
      }
    } catch {
      // LocalStorage unavailable (private mode / blocked): show the
      // banner; Accept then just hides it for this visit.
      setVisible(true);
    }
  }, []);

  // Report the measured height while visible so App can reserve it
  // in the shell padding; report 0 once hidden.
  useEffect(() => {
    if (!visible) {
      onHeightChange?.(0);
      return;
    }
    const el = bannerRef.current;
    if (!el) return;
    const report = () => onHeightChange?.(el.offsetHeight);
    report();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, onHeightChange]);

  if (!visible) return null;

  const accept = () => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    } catch {
      // Storage blocked — hiding for this visit is the best we can do.
    }
    setVisible(false);
  };

  return (
    <div
      ref={bannerRef}
      className="ev-cookie-banner"
      role="region"
      aria-label={t({ bn: 'কুকি সম্মতি', en: 'Cookie consent' })}
    >
      <p className="ev-cookie-banner-text">
        {t({
          bn: 'Eduvelto কুকি ব্যবহার করে — আপনার লগইন সেশন ও পছন্দ মনে রাখতে এবং বিজ্ঞাপন দেখাতে। বিস্তারিত জানুন আমাদের ',
          en: 'Eduvelto uses cookies — to remember your login session and preferences, and to show ads. Read our ',
        })}
        <Link to="/privacy-policy" className="ev-cookie-banner-link">
          {t({ bn: 'গোপনীয়তা নীতি', en: 'Privacy Policy' })}
        </Link>
        {lang === 'bn' ? 'তে।' : '.'}
      </p>
      <button type="button" className="ev-cookie-banner-accept" onClick={accept}>
        {t({ bn: 'গ্রহণ করুন', en: 'Accept' })}
      </button>
    </div>
  );
}
