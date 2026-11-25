import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  ADSENSE_CLIENT_ID,
  AD_SLOT_IDS,
  PERSONALISED_ADS,
  adSlotHasWidth,
  isBannerPlacement,
  type AdPlacement,
} from '../lib/ads';
import {
  EXAM_BANNER_MAX_HEIGHT_PX,
  getAdRenderState,
} from '../lib/adsConfig';

// Eduvelto — one AdSense ad unit.
//
// Three render states (see lib/adsConfig.ts getAdRenderState):
// - 'ad': master switch ON + real AdSense IDs → the real <ins> unit,
//   non-personalised ads requested (child safety: PERSONALISED_ADS is
//   always false). Every real ad carries a plain "বিজ্ঞাপন
//   (Advertisement)" label above it (the same bilingual string in
//   both languages, so the ad is recognisable whatever language the
//   page is in). The label is deliberately unstyled — small muted
//   text, no background, no border, no padding that could read as a
//   button — clearly an ad, never styled like a Download / Next /
//   Continue button. If AdSense reports the unit unfilled
//   (data-ad-status), the whole slot collapses to nothing (no empty
//   box, no blank strip).
// - 'placeholder': not live, but this is a preview host (Firebase
//   preview channel / localhost) → a clearly labelled "বিজ্ঞাপনের স্থান
//   · নমুনা" box, so placements can be verified without faking an ad.
// - 'none': not live and not a preview host → renders NOTHING (null —
//   collapses completely, no fake ad, no placeholder box).
//
// Placement rules (binding — Hybrid Ad Strategy, owner brief 23 Nov
// 2026 21:52, see team/ads-hybrid-policy-2026-11-23.md; supersedes the
// 22 Nov 2026 plan):
// - The bottom banner is FIXED to the viewport bottom and lives in the
//   app layout OUTSIDE the router outlet (App.tsx), so navigation never
//   reloads or interrupts it. It appears on eligible pages ONLY — NEVER
//   during exams, on the AI Teacher page, on profile pages, or on
//   login/register or admin pages (App.tsx asks
//   adsConfig.getBannerPlacementForPath() and does not mount the slot
//   there at all). Quiz RESULT pages (after the quiz ends) do get it.
// - In-page slots run only where adsConfig.isInPageSlotAllowed() says
//   so: home top-banner (below the hero), library/book in-feed, chapter/
//   lesson in-content (mid) + in-content-2 (end), class-dashboard
//   sidebar/in-content/mobile, directory in-content. Never between quiz
//   questions, never inside an AI answer, never on an exam page.
// - The content area reserves the banner's height (see App.tsx), so
//   the banner never covers content, buttons or essential navigation.
//   When no ad is available the slot collapses to zero height.

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let adsenseScriptLoading = false;

/**
 * Inject the AdSense library into <head> — exactly once, and only with
 * a real publisher ID. Callers MUST gate on the slot state ('ad'):
 * AdSlot's effect calls this only when getAdRenderState() is 'ad',
 * i.e. the master switch (ADS_MASTER_ENABLED) is ON and real AdSense
 * IDs are configured — the same gate as the banner. Never call this
 * unconditionally and never put the <script> tag in index.html: with
 * Auto ads ON in the AdSense account, an ungated script would serve
 * ads the moment Google approves the site, bypassing the master flag.
 * Exported for unit tests (adsenseScript.test.tsx).
 */
export function loadAdsenseScript(clientId: string): void {
  if (typeof document === 'undefined') return;
  if (!clientId) return;
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

/** Human-readable size label shown on the preview placeholder only. */
const PLACEHOLDER_SIZE_LABEL: Record<AdPlacement, { bn: string; en: string }> = {
  'bottom-banner': { bn: 'নিচের ব্যানার · responsive', en: 'Bottom banner · responsive' },
  'bottom-banner-small': { bn: 'পরীক্ষার ছোট ব্যানার · সর্বোচ্চ ৫০px', en: 'Exam small banner · max 50px' },
  'top-banner': { bn: 'উপরের ব্যানার · ৭২৮×৯০', en: 'Top banner · 728×90' },
  sidebar: { bn: 'সাইডবার · ৩০০×২৫০ (ডেস্কটপ)', en: 'Sidebar · 300×250 (desktop)' },
  'in-content': { bn: 'ইন-কনটেন্ট · ৩০০×২৫০', en: 'In-content · 300×250' },
  'in-content-2': { bn: 'ইন-কনটেন্ট ২ · ৩০০×২৫০', en: 'In-content 2 · 300×250' },
  'in-feed': { bn: 'ইন-ফিড · responsive', en: 'In-feed · responsive' },
  'in-feed-2': { bn: 'ইন-ফিড ২ · responsive', en: 'In-feed 2 · responsive' },
  mobile: { bn: 'মোবাইল · ৩২০×৫০', en: 'Mobile · 320×50' },
};

/** Plain-text "বিজ্ঞাপন (Advertisement)" label above every REAL ad unit. Deliberately
 *  unstyled — small muted text, no background, no border, no padding
 *  that could read as a button. An ad must never look like a Download /
 *  Next / Continue button (owner brief 23 Nov 2026 21:52). */
const AD_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  lineHeight: 1.4,
  color: 'var(--muted-ivory)',
  textAlign: 'center',
  marginBottom: 2,
};

function placeholderStyle(placement: AdPlacement): React.CSSProperties {
  const base: React.CSSProperties = {
    border: '2px dashed #c9cfcb',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #fdf9ef 0%, #eff7f6 100%)',
    padding: '10px 14px',
    textAlign: 'center',
    color: '#57616a',
    fontSize: 13,
  };
  if (placement === 'bottom-banner') {
    return {
      ...base,
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      borderRadius: 0,
      borderLeft: 'none',
      borderRight: 'none',
      borderBottom: 'none',
      paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
    };
  }
  if (placement === 'bottom-banner-small') {
    return {
      ...base,
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      borderRadius: 0,
      borderLeft: 'none',
      borderRight: 'none',
      borderBottom: 'none',
      maxHeight: EXAM_BANNER_MAX_HEIGHT_PX,
      overflow: 'hidden',
      padding: '6px 14px',
      paddingBottom: 'calc(6px + env(safe-area-inset-bottom, 0px))',
    };
  }
  if (placement === 'top-banner') {
    return { ...base, margin: '12px auto', maxWidth: 728, minHeight: 90 };
  }
  if (placement === 'sidebar') {
    return { ...base, width: 300, minHeight: 250 };
  }
  if (placement === 'in-content' || placement === 'in-content-2') {
    return { ...base, margin: '12px auto', maxWidth: 300, minHeight: 250 };
  }
  return { ...base, margin: '12px 0' };
}

export default function AdSlot(props: {
  placement: AdPlacement;
  format?: 'auto' | 'fluid';
  /**
   * Called (once, with true) when AdSense reports this unit unfilled
   * and the slot collapses to nothing. App.tsx passes it for the
   * bottom banner only, so the mobile bottom nav drops to the viewport
   * bottom instead of floating over the empty gap.
   */
  onUnfilled?: (unfilled: boolean) => void;
}) {
  const { placement } = props;
  const { t, lang } = useLanguage();
  const pushedRef = useRef(false);
  const insRef = useRef<HTMLElement | null>(null);
  // True once AdSense reports this unit unfilled — the whole slot
  // (label included) collapses to nothing.
  const [unfilled, setUnfilled] = useState(false);

  const state = getAdRenderState(placement);

  useEffect(() => {
    if (state !== 'ad') return;
    const ins = insRef.current;
    if (!ins) return;
    const push = () => {
      if (pushedRef.current) return;
      // 23:00 check (25 Nov 2026): adsbygoogle.push() throws an
      // UNCAUGHT TagError ("No slot size for availableWidth=0")
      // when the slot has zero width — the class dashboard mounts
      // BOTH a mobile slot (display:none above 768px) and a sidebar
      // slot (display:none below 1280px), so on every viewport one
      // of them is hidden and its push throws. The try/catch below
      // cannot catch it: the library throws asynchronously. Never
      // push into a zero-width slot; wait until it gains width.
      if (!adSlotHasWidth(ins)) return;
      pushedRef.current = true;
      loadAdsenseScript(ADSENSE_CLIENT_ID);
      try {
        // Non-personalised ads requested (child safety). PERSONALISED_ADS is
        // always false, so this always requests non-personalised ads.
        (window.adsbygoogle = window.adsbygoogle || []).push(
          PERSONALISED_ADS ? {} : { google_non_personalized_ads: 1 },
        );
      } catch {
        // AdSense not ready yet; the unit stays empty rather than faking content.
      }
    };
    push();
    if (pushedRef.current) return undefined;
    // Hidden right now (zero width) — push the moment it gains width
    // (e.g. the viewport crosses the 768px / 1280px breakpoint).
    const ro = new ResizeObserver(() => push());
    ro.observe(ins);
    return () => ro.disconnect();
  }, [state]);

  useEffect(() => {
    if (state !== 'ad') return;
    const ins = insRef.current;
    if (!ins) return;
    // AdSense writes data-ad-status="filled" | "unfilled" |
    // "unfill-optimized" on the <ins> once the request resolves.
    // Collapse the slot ONLY when it says exactly "unfilled" — no
    // empty box, no blank strip (owner brief 23 Nov 2026 21:52).
    // "unfill-optimized" is AdSense's own collapsed/optimized
    // rendering, NOT a miss, so the strict equality below leaves it
    // alone on purpose. Auto ads' own units are Google-managed and collapse
    // themselves.
    // Audit m13 (24 Nov 2026): the observer was the only trigger,
    // so a slot whose AdSense request never answered stayed an
    // empty gap forever. After 5s with NO data-ad-status at all,
    // treat it as unfilled and collapse (label included). A slow
    // fill that answers within 5s is untouched; a fill that lands
    // after the collapse never re-opens the slot.
    const check = () => {
      if (ins.getAttribute('data-ad-status') === 'unfilled') {
        setUnfilled(true);
        // Tell the layout (App.tsx) the banner is gone, so the mobile
        // bottom nav drops to the viewport bottom instead of floating
        // 112px up over an empty gap (owner 24 Nov 2026 07:14).
        props.onUnfilled?.(true);
      }
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
    const timer = window.setTimeout(() => {
      // A slot that is still zero-width is HIDDEN (responsive rule),
      // not unfilled — leave it mounted so the push effect above can
      // fire when it gains width; collapsing it would unmount the
      // <ins> and the ResizeObserver with it (23:00 check, 25 Nov
      // 2026 — the hidden mobile/sidebar slot must survive).
      if (!ins.getAttribute('data-ad-status') && adSlotHasWidth(ins)) {
        setUnfilled(true);
        props.onUnfilled?.(true);
      }
    }, 5000);
    return () => {
      obs.disconnect();
      window.clearTimeout(timer);
    };
  }, [state, props.onUnfilled]);

  // Not live and not a preview host: render nothing at all.
  if (state === 'none') return null;

  // Preview host, not live: a clearly labelled placeholder box — never
  // a fake ad. The sidebar/mobile wrappers keep the same visibility
  // rules as the real unit (sidebar desktop-only, mobile mobile-only).
  if (state === 'placeholder') {
    const box = (
      <div
        data-ad-placement={placement}
        data-ad-preview="placeholder"
        role="complementary"
        aria-label={t({ bn: 'বিজ্ঞাপনের স্থান — নমুনা', en: 'Ad space — sample' })}
        style={placeholderStyle(placement)}
      >
        <span
          style={{
            display: 'inline-block',
            background: '#142b3b',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 999,
            marginRight: 8,
          }}
        >
          {t({ bn: 'বিজ্ঞাপনের স্থান · নমুনা', en: 'Ad space · sample' })}
        </span>
        <span>{PLACEHOLDER_SIZE_LABEL[placement][lang]}</span>
      </div>
    );
    if (placement === 'sidebar') {
      return <div className="ev-ad-slot-sidebar">{box}</div>;
    }
    if (placement === 'mobile') {
      return <div className="ev-ad-slot-mobile">{box}</div>;
    }
    return box;
  }

  // Real ad (master ON + configured). Unfilled units collapse to
  // nothing — see the observer above.
  if (unfilled) return null;
  const isBanner = isBannerPlacement(placement);
  const isSmall = placement === 'bottom-banner-small';

  let wrapperClass: string | undefined;
  let wrapperStyle: React.CSSProperties;
  if (isBanner) {
    // Persistent banner: fixed to the viewport bottom, outside the
    // router outlet (App.tsx). The small exam banner is capped at 50px
    // and uses the horizontal format — it must never grow taller.
    // (RETAINED code path only — no route returns the small banner
    // since the 23 Nov 2026 exam rule: NO ads during exams.)
    wrapperStyle = {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      background: 'var(--card)',
      borderTop: '1px solid var(--line-strong)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      textAlign: 'center',
      ...(isSmall
        ? { maxHeight: EXAM_BANNER_MAX_HEIGHT_PX, overflow: 'hidden' }
        : {}),
    };
  } else if (placement === 'top-banner') {
    wrapperStyle = { margin: '12px auto', maxWidth: 728, width: '100%', textAlign: 'center' };
  } else if (placement === 'sidebar') {
    wrapperClass = 'ev-ad-slot-sidebar';
    wrapperStyle = { textAlign: 'center' };
  } else if (placement === 'mobile') {
    wrapperClass = 'ev-ad-slot-mobile';
    wrapperStyle = { margin: '12px 0', textAlign: 'center' };
  } else if (placement === 'in-content' || placement === 'in-content-2') {
    wrapperStyle = { margin: '12px auto', maxWidth: 300, width: '100%', textAlign: 'center' };
  } else {
    wrapperStyle = { margin: '12px 0', textAlign: 'center' };
  }

  return (
    <div className={wrapperClass} style={wrapperStyle} data-ad-placement={placement} aria-label={t({ bn: 'বিজ্ঞাপন (Advertisement)', en: 'বিজ্ঞাপন (Advertisement)' })}>
      <div style={AD_LABEL_STYLE}>{t({ bn: 'বিজ্ঞাপন (Advertisement)', en: 'বিজ্ঞাপন (Advertisement)' })}</div>
      <ins
        ref={(el) => {
          insRef.current = el;
        }}
        className="adsbygoogle"
        style={{
          display: 'block',
          ...(isSmall ? { maxHeight: EXAM_BANNER_MAX_HEIGHT_PX } : {}),
        }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={AD_SLOT_IDS[placement]}
        data-ad-format={isSmall ? 'horizontal' : (props.format ?? 'auto')}
        data-full-width-responsive="true"
        data-npa={PERSONALISED_ADS ? '0' : '1'}
      />
    </div>
  );
}
