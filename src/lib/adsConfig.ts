// Eduvelto — central ad placement config (owner brief 22 Nov 2026 10:43:
// "ads kun kun page a colbe kivabe colbe seta o tik kore diyo").
//
// This file is the SINGLE source of truth for WHERE ads run and HOW.
// The AdSense integration itself (publisher/slot IDs, script loading,
// the <ins> unit) lives in ./ads.ts + components/AdSlot.tsx; this file
// decides policy only, so a policy change never touches the integration.
//
// HYBRID AD STRATEGY (owner brief 23 Nov 2026 21:52 — BINDING, this is
// the NEWEST rule and SUPERSEDES the 22 Nov 2026 placement rules; see
// team/ads-hybrid-policy-2026-11-23.md). What changed vs 22 Nov:
// - EXAM: NO ads during exams — the 22 Nov small-banner rule
//   ("akdom cuto", max 50px) is REMOVED. getBannerPlacementForPath()
//   returns null for exam pages. The 'bottom-banner-small' placement,
//   its reserve (56px) and its 50px cap are RETAINED as code paths
//   only — no route returns the small banner any more.
// - Quiz RESULT pages (after the quiz ends) DO get the normal bottom
//   banner — "quiz only AFTER the quiz ends, never between questions".
//   Timed mocks (/jobs/mock/:mockId) count as exams: NO ads.
// - AI Teacher: NO ads — the whole page is a conversation surface.
// - Profile: NO ads (was: full banner). Login/register + admin: still
//   NO ads. Private messages: NO ads (no message routes exist yet).
// - Homepage: LIMITED — one top-banner slot below the hero + the
//   bottom banner, nothing above the fold.
// - Books/library: in-feed (mid-list) + in-feed-2 (end of list).
// - Chapter/lesson: in-content (mid-lesson) + in-content-2 (end).
// - Articles (no article routes exist yet — /blog is a Part 1 item):
//   top-banner + in-content + in-content-2, ready when they land.
// - Master switch ADS_MASTER_ENABLED is OFF by default. Ads stay off
//   until Google approves the site AND real ad-unit IDs exist. The
//   IDs-empty gate in ./ads.ts stays as a second, independent gate —
//   both must pass before any ad renders.
// - Bottom banner: every page EXCEPT login/register, admin, exam,
//   profile, AI conversation pages, and the suspended-account screen.
//   It is mandatory and has no off-switch.
// - AI ASSISTANT RULE (directive §4, 23 Nov 2026): NO ads of any kind
//   on AI conversation pages — /ai-assistant gets no banner at all.
//   (ai-teacher is a scripted demo page, not a conversation — its
//   banner behaviour is owned by the hybrid-ads stream, not this file.)
// - EXAM RULE (owner 23 Nov 2026, BINDING): NO ads during exams at all
//   — the 22 Nov small-banner rule is superseded. No in-content, top,
//   or sidebar slot may ever appear on an exam page either.
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
import { stripLangPrefix } from './langRouting';

/**
 * Master activation switch. ON since 23 Nov 2026 by the owner's order
 * ("tumi on kore rhako auto cole moto") — ads start automatically the
 * moment Google approves the site. Until approval, requests return
 * unfilled and units collapse, so nothing visible shows. Real ad-unit
 * IDs are set in deployment settings (see team/adsense-slot-ids-2026-11-23.md).
 * The IDs-empty gate in ./ads.ts stays as a second gate.
 */
export const ADS_MASTER_ENABLED = true;

/** Height (px) the content area reserves for the exam small banner. */
export const BOTTOM_BANNER_SMALL_RESERVE_PX = 56;

/** Maximum rendered height (px) of the exam small banner — 320x50. */
export const EXAM_BANNER_MAX_HEIGHT_PX = 50;

/** Ad-unit env-var name per placement (TODO-AD-UNIT — set after AdSense
 *  approval; NEVER invent a slot ID. The small exam banner shares the
 *  bottom banner's unit — no separate unit is created for it, and the
 *  placement is disabled since 23 Nov 2026.) */
export const AD_UNIT_ENV_VARS: Record<AdPlacement, string> = {
  'bottom-banner': 'VITE_ADSENSE_SLOT_BOTTOM_BANNER',
  'bottom-banner-small': 'VITE_ADSENSE_SLOT_BOTTOM_BANNER',
  'top-banner': 'VITE_ADSENSE_SLOT_TOP_BANNER',
  sidebar: 'VITE_ADSENSE_SLOT_SIDEBAR',
  'in-content': 'VITE_ADSENSE_SLOT_IN_CONTENT',
  'in-content-2': 'VITE_ADSENSE_SLOT_IN_CONTENT_2',
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
  | 'article'
  | 'exam'
  | 'exam-result'
  | 'admin'
  | 'ai-teacher'
  | 'ai-assistant'
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
  // Phase 1 (25 Nov 2026): public routes live under /:lang — classify
  // the bare path, or /bn/jobs/mock/x would read as 'unknown' and get
  // a banner DURING an exam, and /bn/ai-assistant would lose its
  // no-ads rule.
  const path =
    stripLangPrefix(pathname.split('?')[0].replace(/\/+$/, '') || '/').path;
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
  // Timed job mocks are exams in progress — NO ads (23 Nov 2026 rule).
  if (seg[0] === 'jobs' && seg[1] === 'mock') return 'exam';
  // Job mock results are after the exam — the banner returns there.
  if (seg[0] === 'jobs' && seg[1] === 'result') return 'exam-result';
  // Articles (no routes exist yet — /blog is a Part 1 item). The policy
  // is ready so a future article template only has to mount the slots.
  if (seg[0] === 'blog' || seg[0] === 'articles') return 'article';
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
  if (path === '/ai-assistant') return 'ai-assistant';
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
 * that decides the banner variant.
 * - null: no banner at all — auth pages, admin pages, exam pages
 *   (23 Nov 2026: NO ads during exams — the 22 Nov small-banner rule
 *   is superseded), AI Teacher pages (the whole page is a conversation
 *   surface), AI Assistant pages (directive §4, 23 Nov 2026 — no ads
 *   of any kind on AI conversation pages), and profile pages.
 * - 'bottom-banner': everything else, including quiz/job RESULT pages
 *   (after the quiz ends — "quiz only AFTER the quiz ends").
 * 'bottom-banner-small' is RETAINED as a code path (type, reserve,
 * AdSlot rendering) but no route returns it any more.
 */
export function getBannerPlacementForPath(pathname: string): BannerPlacement | null {
  const type = getPageAdType(pathname);
  if (
    type === 'auth' ||
    type === 'admin' ||
    type === 'exam' ||
    type === 'ai-teacher' ||
    type === 'ai-assistant' ||
    type === 'profile'
  ) {
    return null;
  }
  return 'bottom-banner';
}

/** Reserved content height (px) for a banner placement (0 = no banner).
 *  The full banner reserves 112px: ~90px desktop ad + the plain
 *  "বিজ্ঞাপন (Advertisement)" label row (~16px) + spacing. The exam small banner
 *  reserve is RETAINED (56px) although no route returns it any more. */
export function getBannerReservePx(placement: BannerPlacement | null): number {
  if (placement === 'bottom-banner') return 112;
  if (placement === 'bottom-banner-small') return BOTTOM_BANNER_SMALL_RESERVE_PX;
  return 0;
}

/**
 * Bottom-nav offset (px) for the mobile bottom nav: the nav sits above
 * the bottom ad banner ONLY while the banner is actually rendered.
 * When AdSense reports the banner unfilled the slot collapses to
 * nothing (AdSlot returns null) — the nav must then sit at the very
 * viewport bottom (offset 0), not float 112px up over an empty gap
 * with page content visible below it (owner 24 Nov 2026 07:14: the nav
 * rendered mid-page with card content below it on live, measured
 * gapBelowNav 112px at every scroll position while no banner element
 * existed in the DOM). Pure — unit-tested in adsConfig.test.ts.
 */
export function getBottomNavOffsetPx(args: {
  bannerVisible: boolean;
  bannerReservePx: number;
  bannerCollapsed: boolean;
}): number {
  if (!args.bannerVisible || args.bannerCollapsed) return 0;
  return args.bannerReservePx;
}

/**
 * Whether an IN-PAGE slot (anything that is not the layout's bottom
 * banner) may appear on a page of this type. Banner placements always
 * return false here — they are layout-level, decided by
 * getBannerPlacementForPath(), not by this function.
 * Allowed (Hybrid Ad Strategy, 23 Nov 2026):
 * - home → top-banner only (LIMITED: below the hero, nothing above
 *   the fold);
 * - class-dashboard → sidebar/in-content/mobile;
 * - library → in-feed/in-feed-2; book → in-feed/in-feed-2;
 * - chapter/lesson → in-content (mid) + in-content-2 (end);
 * - directory → in-content;
 * - article → top-banner/in-content/in-content-2 (no article routes
 *   exist yet — ready when they land).
 * Everything else (exam, exam-result, ai-teacher, profile, auth,
 * admin, dashboards, health, info, ...) gets the banner only — no
 * in-page slot, ever. In particular: never a slot between quiz
 * questions, inside an AI answer, or on a page the student is being
 * examined on.
 */
export function isInPageSlotAllowed(pageType: PageAdType, placement: AdPlacement): boolean {
  if (placement === 'bottom-banner' || placement === 'bottom-banner-small') return false;
  switch (pageType) {
    case 'home':
      return placement === 'top-banner';
    case 'class-dashboard':
      return placement === 'sidebar' || placement === 'in-content' || placement === 'mobile';
    case 'library':
    case 'book':
      return placement === 'in-feed' || placement === 'in-feed-2';
    case 'chapter':
    case 'lesson':
      return placement === 'in-content' || placement === 'in-content-2';
    case 'directory':
      return placement === 'in-content';
    case 'article':
      return placement === 'top-banner' || placement === 'in-content' || placement === 'in-content-2';
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
