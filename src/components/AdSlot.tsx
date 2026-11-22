import { useEffect, useRef } from 'react';
import {
  ADSENSE_CLIENT_ID,
  AD_SLOT_IDS,
  PERSONALISED_ADS,
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
//   always false).
// - 'placeholder': not live, but this is a preview host (Firebase
//   preview channel / localhost) → a clearly labelled "বিজ্ঞাপনের স্থান
//   · নমুনা" box, so placements can be verified without faking an ad.
// - 'none': not live and not a preview host → renders NOTHING (null —
//   collapses completely, no fake ad, no placeholder box).
//
// Placement rules (binding — ads placement plan 22 Nov 2026, see
// team/ads-placement-plan-2026-11-22.md):
// - The bottom banner is FIXED to the viewport bottom and lives in the
//   app layout OUTSIDE the router outlet (App.tsx), so navigation never
//   reloads or interrupts it. It appears on all eligible pages — but
//   NEVER on login/register or admin pages (App.tsx asks
//   adsConfig.getBannerPlacementForPath() and does not mount the slot
//   there at all).
// - EXAM RULE (owner 22 Nov 2026 10:45, "akdom cuto"): exam pages get
//   ONLY 'bottom-banner-small' — max 50px high, horizontal format,
//   56px reserved. It never covers the timer, questions, answers or
//   buttons. No in-content / top / sidebar slot is ever mounted on an
//   exam page (enforced in adsConfig, not here).
// - The content area reserves the banner's height (see App.tsx), so
//   the banner never covers content, buttons or essential navigation.
//   When no ad is available the slot collapses to zero height.

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

/** Human-readable size label shown on the preview placeholder only. */
const PLACEHOLDER_SIZE_LABEL: Record<AdPlacement, string> = {
  'bottom-banner': 'নিচের ব্যানার · responsive',
  'bottom-banner-small': 'পরীক্ষার ছোট ব্যানার · সর্বোচ্চ ৫০px',
  'top-banner': 'উপরের ব্যানার · ৭২৮×৯০',
  sidebar: 'সাইডবার · ৩০০×২৫০ (ডেস্কটপ)',
  'in-content': 'ইন-কনটেন্ট · ৩০০×২৫০',
  'in-feed': 'ইন-ফিড · responsive',
  'in-feed-2': 'ইন-ফিড ২ · responsive',
  mobile: 'মোবাইল · ৩২০×৫০',
};

function placeholderStyle(placement: AdPlacement): React.CSSProperties {
  const base: React.CSSProperties = {
    border: '2px dashed #c9cfcb',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #fdf9ef 0%, #eff7f6 100%)',
    padding: '10px 14px',
    textAlign: 'center',
    color: '#68747b',
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
  if (placement === 'in-content') {
    return { ...base, margin: '12px auto', maxWidth: 300, minHeight: 250 };
  }
  return { ...base, margin: '12px 0' };
}

export default function AdSlot(props: { placement: AdPlacement; format?: 'auto' | 'fluid' }) {
  const { placement } = props;
  const pushedRef = useRef(false);

  const state = getAdRenderState(placement);

  useEffect(() => {
    if (state !== 'ad' || pushedRef.current) return;
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
  }, [state]);

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
        aria-label="বিজ্ঞাপনের স্থান — নমুনা"
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
          বিজ্ঞাপনের স্থান · নমুনা
        </span>
        <span>{PLACEHOLDER_SIZE_LABEL[placement]}</span>
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

  // Real ad (master ON + configured).
  const isBanner = isBannerPlacement(placement);
  const isSmall = placement === 'bottom-banner-small';

  let wrapperClass: string | undefined;
  let wrapperStyle: React.CSSProperties;
  if (isBanner) {
    // Persistent banner: fixed to the viewport bottom, outside the
    // router outlet (App.tsx). The small exam banner is capped at 50px
    // and uses the horizontal format — it must never grow taller.
    wrapperStyle = {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      background: '#fff',
      borderTop: '1px solid #ddd',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      textAlign: 'center',
      ...(isSmall
        ? { maxHeight: EXAM_BANNER_MAX_HEIGHT_PX, overflow: 'hidden' }
        : {}),
    };
  } else if (placement === 'top-banner') {
    wrapperStyle = { margin: '12px auto', maxWidth: 728, textAlign: 'center' };
  } else if (placement === 'sidebar') {
    wrapperClass = 'ev-ad-slot-sidebar';
    wrapperStyle = { textAlign: 'center' };
  } else if (placement === 'mobile') {
    wrapperClass = 'ev-ad-slot-mobile';
    wrapperStyle = { margin: '12px 0', textAlign: 'center' };
  } else if (placement === 'in-content') {
    wrapperStyle = { margin: '12px auto', maxWidth: 300, textAlign: 'center' };
  } else {
    wrapperStyle = { margin: '12px 0', textAlign: 'center' };
  }

  return (
    <div className={wrapperClass} style={wrapperStyle} data-ad-placement={placement}>
      <ins
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
