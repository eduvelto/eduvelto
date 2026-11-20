import { useEffect, useRef } from 'react';
import {
  ADSENSE_CLIENT_ID,
  AD_SLOT_IDS,
  PERSONALISED_ADS,
  adsEnabled,
  type AdPlacement,
} from '../lib/ads';

// EduOrbit — one AdSense ad unit.
//
// Renders NOTHING (null — collapses completely, no fake ad, no placeholder
// box, no invented content) until the placement is configured with real
// AdSense IDs. When configured, loads the AdSense script once and renders
// a responsive <ins class="adsbygoogle"> unit with non-personalised ads
// requested (child safety: PERSONALISED_ADS is always false).
//
// Placement rules (binding, owner brief 20 Nov 21:52 — persistent bottom
// banner): the banner is FIXED to the viewport bottom and lives in the app
// layout OUTSIDE the router outlet (App.tsx), so navigation never reloads
// or interrupts it. It appears on all eligible pages, including lessons,
// quizzes, exams and the AI Teacher (this supersedes the earlier "no ads
// during AI lessons or active exams" rule). The content area reserves the
// banner's height (BOTTOM_BANNER_RESERVE_PX + safe-area inset, set in
// App.tsx), so the banner never covers content, buttons or essential
// navigation. No slot is placed in LessonPage / QuizPage / ExamPage /
// ChapterPage / BookPage as an in-page unit — the banner is the layout's
// own element, not part of those views.
//
// Collapse: the banner container has NO vertical padding of its own, so
// when no ad is available (empty <ins>) it takes zero height. The
// reserved space in the content area only applies while ads are
// configured + enabled, so there is no empty gap when ads are off.

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let adsenseScriptLoading = false;

function loadAdsenseScript(clientId: string): void {
  if (typeof document === 'undefined') return;
  if (
    document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    )
  ) {
    return;
  }
  if (adsenseScriptLoading) return;
  adsenseScriptLoading = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

export default function AdSlot(props: { placement: AdPlacement; format?: 'auto' | 'fluid' }) {
  const { placement } = props;
  const pushedRef = useRef(false);

  const enabled = adsEnabled(placement);

  useEffect(() => {
    if (!enabled || pushedRef.current) return;
    loadAdsenseScript(ADSENSE_CLIENT_ID);
    pushedRef.current = true;
    try {
      // Non-personalised ads requested (child safety). PERSONALISED_ADS is
      // always false, so this always requests non-personalised ads.
      (window.adsbygoogle = window.adsbygoogle || []).push(
        PERSONALISED_ADS ? {} : { google_non_personalized_ads: 1 },
      );
    } catch {
      // AdSense not ready yet; the unit stays empty rather than faking content.
    }
  }, [enabled]);

  // Not configured (no AdSense approval yet): render nothing at all.
  if (!enabled) return null;

  const isBanner = placement === 'bottom-banner';
  return (
    <div
      style={
        isBanner
          ? {
              // Persistent banner: fixed to the viewport bottom, outside
              // the router outlet (App.tsx). No vertical padding of its
              // own, so an empty unit collapses to zero height.
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
              background: '#fff',
              borderTop: '1px solid #ddd',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              textAlign: 'center',
            }
          : { margin: '12px 0', textAlign: 'center' }
      }
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={AD_SLOT_IDS[placement]}
        data-ad-format={props.format ?? 'auto'}
        data-full-width-responsive="true"
        data-npa={PERSONALISED_ADS ? '0' : '1'}
      />
    </div>
  );
}
