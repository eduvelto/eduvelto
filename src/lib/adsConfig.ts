// Eduvelto — central ad placement config (owner brief 22 Nov 2026 10:43:
// "ads kun kun page a colbe kivabe colbe seta o tik kore diyo").
//
// This file is the SINGLE source of truth for WHERE ads run and HOW.
// The AdSense integration itself (publisher/slot IDs, script loading,
// the <ins> unit) lives in ./ads.ts + components/AdSlot.tsx; this file
// decides policy only, so a policy change never touches the integration.
//
// Decisions (recorded 22 Nov 2026 — see team/ads-placement-plan-2026-11-22.md):
// - Master switch ADS_MASTER_ENABLED is OFF by default. Ads stay off
//   until Google approves the site AND real ad-unit IDs exist. The
//   IDs-empty gate in ./ads.ts stays as a second, independent gate —
//   both must pass before any ad renders.
// - Bottom banner: every page EXCEPT login/register, admin, and the
//   suspended-account screen. It is mandatory and has no off-switch.
// - EXAM RULE (owner 22 Nov 2026 10:45, BINDING — "akdom cuto"): exam
//   pages get ONLY the bottom banner, in its SMALLEST form (max 50px
//   high, 56px reserved). No in-content, top, or sidebar slot may ever
//   appear on an exam page. getBannerPlacementForPath() is the only
//   place that decides the banner variant, and it cannot return anything
//   but 'bottom-banner-small' for an exam page.
// - In-page slots (top / sidebar / in-content / in-feed / mobile) run
//   ONLY on the page types listed in isInPageSlotAllowed() — never on
//   exam, reading (book/chapter/lesson), auth, or admin pages.
// - Personalised ads are ALWAYS off (./ads.ts PERSONALISED_ADS = false).
//   Vignette + full-screen interstitials are BLOCKED (no code path
//   renders them; Auto ads stays OFF).
// - PWA = the same AdSense script (the website IS the app). Native apps
//   (not built yet) would need AdMob separately — nothing here covers them.

import {
  ADSENSE_CLIENT_ID,
  AD_SLOT_IDS,
  adsEnabled,
  type AdPlacement,
} from './ads';

/**
 * Master activation switch. Default OFF — ads stay off until Google
 * approves the site AND real ad-unit IDs are set in deployment settings.
 * Flip to true ONLY after site approval + unit IDs (owner action:
 * create the units in his AdSense account and send the IDs to Muse).
 * The IDs-empty gate in ./ads.ts stays as a second gate.
 */
export const ADS_MASTER_ENABLED = false;

/** Height (px) the content area reserves for the exam small banner. */
export const BOTTOM_BANNER_SMALL_RESERVE_PX = 56;

/** Maximum rendered height (px) of the exam small banner — 320x50. */
export const EXAM_BANNER_MAX_HEIGHT_PX = 50;

/** Ad-unit env-var name per placement (TODO-AD-UNIT — set after AdSense
 *  approval; NEVER invent a slot ID. The small exam banner shares the
 *  bottom banner's unit — no separate unit is created for it.) */
export const AD_UNIT_ENV_VARS: Record<AdPlacement, string> = {
  'bottom-banner': 'VITE_ADSENSE_SLOT_BOTTOM_BANNER',
  'bottom-banner-small': 'VITE_ADSENSE_SLOT_BOTTOM_BANNER',
  'top-banner': 'VITE_ADSENSE_SLOT_TOP_BANNER',
  sidebar: 'VITE_ADSENSE_SLOT_SIDEBAR',
  'in-content': 'VITE_ADSENSE_SLOT_IN_CONTENT',
  'in-feed': 'VITE_ADSENSE_SLOT_IN_FEED',
  'in-feed-2': 'VITE_ADSENSE_SLOT_IN_FEED_2',
  mobile: 'VITE_ADSENSE_SLOT_MOBILE',
};

export type PageAdType =
  | 'home'
  | 'section-hub'
  | 'class-dashboard'
  | 'auth'
  | 'profile'
  | 'dashboard'
  | 'directory'
  | 'subject'
  | 'library'
  | 'book'
  | 'chapter'
  | 'lesson'
  | 'exam'
  | 'exam-result'
  | 'admin'
  | 'ai-teacher'
  | 'routine'
  | 'progress'
  | 'social'
  | 'health'
  | 'info'
  | 'unknown';

/** Classify a pathname into its ad page-type. Query strings are ignored;
 *  trailing slashes are ignored; unknown paths fall back to 'unknown'
 *  (which gets the normal banner — the '*' route renders HomePage). */
export function getPageAdType(pathname: string): PageAdType {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  const seg = path.split('/').filter(Boolean);
  if (path === '/') return 'home';
  if (
    path === '/login' ||
    path === '/register' ||
    path === '/register/role' ||
    path === '/teacher/register'
  ) {
    return 'auth';
  }
  if (seg[0] === 'admin') return 'admin';
  if (seg[0] === 'quiz') {
    return seg[2] === 'result' ? 'exam-result' : 'exam';
  }
  if (path === '/exam') return 'exam';
  if (seg[0] === 'class') {
    return seg.length === 1 ? 'section-hub' : 'class-dashboard';
  }
  if (path === '/jobs' || path === '/admissions' || path === '/skills') return 'section-hub';
  if (path === '/profile' || seg[0] === 'profile') return 'profile';
  if (
    path === '/dashboard' ||
    path === '/student' ||
    path === '/teacher' ||
    path === '/guardian'
  ) {
    return 'dashboard';
  }
  if (path === '/directory') return 'directory';
  if (seg[0] === 'subjects') return 'subject';
  if (path === '/library') return 'library';
  if (seg[0] === 'library') return 'book';
  if (seg[0] === 'books') return 'chapter';
  if (seg[0] === 'lessons') return 'lesson';
  if (path === '/ai-teacher') return 'ai-teacher';
  if (path === '/routine') return 'routine';
  if (path === '/progress') return 'progress';
  if (path === '/social') return 'social';
  if (seg[0] === 'health') return 'health';
  if (
    path === '/about' ||
    path === '/founder' ||
    path === '/contact' ||
    path === '/privacy'
  ) {
    return 'info';
  }
  return 'unknown';
}

export type BannerPlacement = 'bottom-banner' | 'bottom-banner-small';

/**
 * Which bottom banner (if any) a pathname gets. This is the ONLY place
 * that decides the banner variant — and it is the enforcement point for
 * the owner's exam rule (22 Nov 2026 10:45): an exam page can only ever
 * receive 'bottom-banner-small', never the full-size banner.
 * - null: no banner at all (auth pages + admin pages).
 * - 'bottom-banner-small': the exam flow (/quiz/*, /exam).
 * - 'bottom-banner': everything else.
 */
export function getBannerPlacementForPath(pathname: string): BannerPlacement | null {
  const type = getPageAdType(pathname);
  if (type === 'auth' || type === 'admin') return null;
  if (type === 'exam' || type === 'exam-result') return 'bottom-banner-small';
  return 'bottom-banner';
}

/** Reserved content height (px) for a banner placement (0 = no banner). */
export function getBannerReservePx(placement: BannerPlacement | null): number {
  if (placement === 'bottom-banner') return 96;
  if (placement === 'bottom-banner-small') return BOTTOM_BANNER_SMALL_RESERVE_PX;
  return 0;
}

/**
 * Whether an IN-PAGE slot (anything that is not the layout's bottom
 * banner) may appear on a page of this type. Banner placements always
 * return false here — they are layout-level, decided by
 * getBannerPlacementForPath(), not by this function.
 * Allowed: home → top-banner; class-dashboard → sidebar/in-content/
 * mobile; library → in-feed/in-feed-2; directory → in-content.
 * Everything else (exam, reading, auth, admin, profile, dashboards,
 * health, info, ...) gets the banner only — no in-page slot, ever.
 */
export function isInPageSlotAllowed(pageType: PageAdType, placement: AdPlacement): boolean {
  if (placement === 'bottom-banner' || placement === 'bottom-banner-small') return false;
  switch (pageType) {
    case 'home':
      return placement === 'top-banner';
    case 'class-dashboard':
      return placement === 'sidebar' || placement === 'in-content' || placement === 'mobile';
    case 'library':
      return placement === 'in-feed' || placement === 'in-feed-2';
    case 'directory':
      return placement === 'in-content';
    default:
      return false;
  }
}

/**
 * True only when the master switch is ON and the placement is configured
 * (real AdSense IDs) + toggled on. This is what AdSlot and the app shell
 * use — the old adsEnabled() alone is no longer enough.
 */
export function adsActive(placement: AdPlacement): boolean {
  return ADS_MASTER_ENABLED && adsEnabled(placement);
}

export type AdRenderState = 'ad' | 'placeholder' | 'none';

/**
 * What a slot renders right now:
 * - 'ad': master ON + configured → the real AdSense unit.
 * - 'placeholder': not live, but this is a preview host (Firebase
 *   preview channel / localhost) → a clearly labelled "বিজ্ঞাপনের স্থান ·
 *   নমুনা" box, so placements can be verified without faking an ad.
 * - 'none': not live and not a preview host → renders nothing at all.
 */
export function getAdRenderState(placement: AdPlacement): AdRenderState {
  if (adsActive(placement)) return 'ad';
  if (isPreviewHost()) return 'placeholder';
  return 'none';
}

/** Pure hostname check (kept separate so unit tests can call it without
 *  a window): Firebase preview channels look like
 *  eduvelto--<channel>-<hash>.web.app — the '--' marks them. Production
 *  (eduvelto.web.app / eduvelto.com) has no '--'. */
export function isPreviewHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('--')
  );
}

/** True when this page is served from a preview host (see above). */
export function isPreviewHost(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  return isPreviewHostname(window.location.hostname);
}

/** Slot IDs as the admin page reports them (empty = TODO-AD-UNIT). */
export function adUnitStatus(): { clientSet: boolean; slotsSet: Partial<Record<AdPlacement, boolean>> } {
  const slotsSet = {} as Partial<Record<AdPlacement, boolean>>;
  (Object.keys(AD_SLOT_IDS) as AdPlacement[]).forEach((p) => {
    slotsSet[p] = AD_SLOT_IDS[p] !== '';
  });
  return { clientSet: ADSENSE_CLIENT_ID !== '', slotsSet };
}
