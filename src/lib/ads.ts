// Eduvelto — Website advertising configuration (Advertising track, parallel
// with Steps 1–8; owner brief 20 Nov 21:44, URGENT).
//
// WEBSITE (Google AdSense) preparation only. No AdMob code lives in this
// repo — the Android/iOS apps are a separate codebase and get their own
// AdMob integration there.
//
// Honest gates (binding):
// - ADSENSE_CLIENT_ID and AD_SLOT_IDS are EMPTY until Google approves the
//   site. Never invent a publisher ID or a slot ID. Until they are set,
//   adsEnabled() is false for every placement and AdSlot renders nothing.
// - PERSONALISED_ADS is ALWAYS false: non-personalised ads only (child
//   safety — no personalised targeted ads to minors, ever).
// - Approval cannot be submitted until the site is live on eduvelto.com
//   with real content. Domain connection and deployment still need the
//   owner's explicit approval.
// - Video ads and creator monetisation stay OFF — general advertising and
//   video monetisation are two separate systems.
// - Placement toggles for the in-feed slots are stored in this
//   browser's localStorage for now. A Firestore home for them now
//   exists (settings/ads — see firestore.rules); the move happens
//   with the dashboard work, and the toggles must be labelled
//   "this browser only" until then. The bottom banner is NEVER a
//   toggle: it is mandatory (owner brief 20 Nov 21:52) and
//   adsEnabled('bottom-banner') below ignores any toggle value.
// - PAGE POLICY lives in ./adsConfig.ts (owner brief 22 Nov 10:43):
//   which page gets which banner (incl. the exam SMALL banner,
//   owner 22 Nov 10:45) and which in-page slots each page type may
//   carry. This file only holds the AdSense integration (IDs, the
//   <ins> unit, toggles) — it does not decide page policy.
//   isBottomBannerAllowed() was removed for that reason: App.tsx now
//   asks adsConfig.getBannerPlacementForPath() instead.

// SUPERSESSION (owner brief 20 Nov 21:52, MANDATORY — persistent bottom
// banner): the bottom banner is now required on ALL eligible pages,
// including lessons, quizzes, exams and the AI Teacher. This SUPERSEDES
// the earlier 20 Nov 13:25 rule "no ads during AI lessons or active
// exams". The reconciliation is reserved space: the content area reserves
// the banner's height (BOTTOM_BANNER_RESERVE_PX + safe-area inset) so
// the banner never covers content, buttons, navigation, quiz answers or
// essential controls. When no ad is available the slot collapses to zero
// height — no fake ads, no empty placeholder boxes.

export type AdPlacement = 'bottom-banner' | 'bottom-banner-small' | 'top-banner' | 'sidebar' | 'in-content' | 'in-feed' | 'in-feed-2' | 'mobile';

// Placement layout (owner brief 20 Nov 22:06): 1 persistent bottom banner
// (always) + 2 in-feed slots in the middle of list pages, revealed on
// scroll — the second in-feed slot sits lower down the list than the first.
// Extended 22 Nov 2026 (ads placement plan): top banner (home), sidebar
// + mobile + in-content (class dashboard), in-content (directory), and
// the exam small banner (bottom-banner-small, shares the bottom banner's
// unit — see AD_SLOT_IDS below).

export interface AdPlacementDef {
  id: AdPlacement;
  labelBn: string;
  labelEn: string;
  whereBn: string;
  whereEn: string;
  format: 'banner' | 'in-feed';
}

export const AD_PLACEMENTS: readonly AdPlacementDef[] = [
  {
    id: 'bottom-banner',
    labelBn: 'নিচের ব্যানার (স্থায়ী)',
    labelEn: 'Bottom banner (persistent)',
    whereBn: 'সব পাতায় — হোম, লাইব্রেরি, পাঠ, বই, কুইজ, পরীক্ষা, AI Teacher, প্রোফাইল; নিচে জায়গা রেখে দেওয়া হয়, তাই কিছু ঢাকে না',
    whereEn: 'All pages — home, library, lessons, books, quizzes, exams, AI Teacher, profiles; space is reserved below the content so it never covers anything',
    format: 'banner',
  },
  {
    id: 'bottom-banner-small',
    labelBn: 'পরীক্ষার ছোট ব্যানার (সর্বোচ্চ ৫০px)',
    labelEn: 'Exam small banner (max 50px)',
    whereBn: 'শুধু পরীক্ষা ও ফলাফল পাতায় — মালিকের নির্দেশ ২২ নভেম্বর ২০২৬, ১০:৪৫ ("akdom cuto"); নিচের ব্যানারের unit-ই ব্যবহার করে',
    whereEn: 'Exam and result pages only — owner rule 22 Nov 2026, 10:45 ("akdom cuto"); shares the bottom banner unit',
    format: 'banner',
  },
  {
    id: 'top-banner',
    labelBn: 'উপরের ব্যানার',
    labelEn: 'Top banner',
    whereBn: 'হোম পাতায় হিরোর নিচে — ৭২৮×৯০ (মোবাইলে ছোট responsive)',
    whereEn: 'Home page, below the hero — 728×90 (smaller responsive on mobile)',
    format: 'banner',
  },
  {
    id: 'sidebar',
    labelBn: 'সাইডবার',
    labelEn: 'Sidebar',
    whereBn: 'ক্লাস ড্যাশবোর্ডে — শুধু ডেস্কটপে (≥১২৮০px), ৩০০×২৫০',
    whereEn: 'Class dashboard — desktop only (≥1280px), 300×250',
    format: 'in-feed',
  },
  {
    id: 'in-content',
    labelBn: 'কনটেন্টের ভেতরের বিজ্ঞাপন',
    labelEn: 'In-content slot',
    whereBn: 'তালিকার ১০ম আইটেমের পর (ক্লাস ড্যাশবোর্ডের Books ট্যাব, ডিরেক্টরি) — ৩০০×২৫০',
    whereEn: 'After the 10th list item (class dashboard Books tab, directory) — 300×250',
    format: 'in-feed',
  },
  {
    id: 'in-feed',
    labelBn: 'তালিকার ভেতরের বিজ্ঞাপন',
    labelEn: 'In-feed slot',
    whereBn: 'হোম পাতার তালিকার ভেতরে — পাঠ, কুইজ, পরীক্ষার ভেতরে নয়',
    whereEn: 'Inside the home-page list — never inside lessons, quizzes or exams',
    format: 'in-feed',
  },
  {
    id: 'in-feed-2',
    labelBn: 'তালিকার ভেতরের ২য় বিজ্ঞাপন',
    labelEn: 'Second in-feed slot',
    whereBn: 'হোম ও লাইব্রেরি তালিকার নিচের দিকে — স্ক্রল করলে দেখা যায়; পাঠ, কুইজ, পরীক্ষার ভেতরে নয়',
    whereEn: 'Lower down the home and library lists — revealed on scroll; never inside lessons, quizzes or exams',
    format: 'in-feed',
  },
  {
    id: 'mobile',
    labelBn: 'মোবাইল ব্যানার',
    labelEn: 'Mobile banner',
    whereBn: 'ক্লাস ড্যাশবোর্ডের উপরে — শুধু মোবাইলে (≤৭৬৮px), ৩২০×৫০',
    whereEn: 'Top of the class dashboard — mobile only (≤768px), 320×50',
    format: 'in-feed',
  },
];

/**
 * Read a build-time variable by a DYNAMIC key on purpose: Vite inlines
 * statically-known `import.meta.env.X` accesses (and an unset variable
 * folds to ''), which would let the minifier delete the AdSense code from
 * the bundle as dead code. A computed lookup keeps the value
 * runtime-dynamic, so the real AdSense integration stays in the built
 * bundle as evidence — while still rendering nothing at runtime until a
 * real ID is supplied.
 */
function readEnv(name: string): string {
  const env = import.meta.env as unknown as Record<string, unknown>;
  const value = env[name];
  return typeof value === 'string' ? value : '';
}

/** Google AdSense publisher ID (ca-pub-…). Set via the VITE_ADSENSE_CLIENT_ID
 *  build-time variable AFTER AdSense approves the site — never invent one.
 *  Empty until approved. */
export const ADSENSE_CLIENT_ID: string = readEnv('VITE_ADSENSE_CLIENT_ID');

/** AdSense slot IDs, one per placement. Set via build-time variables after
 *  AdSense approval — never invent one. Empty until approved.
 *  TODO-AD-UNIT: 'bottom-banner-small' SHARES the bottom banner's unit
 *  (same env var on purpose — the exam banner is the same unit rendered
 *  smaller, not a second unit). Every other new placement has its own
 *  env var, all empty until the owner creates the units. */
export const AD_SLOT_IDS: Record<AdPlacement, string> = {
  'bottom-banner': readEnv('VITE_ADSENSE_SLOT_BOTTOM_BANNER'),
  'bottom-banner-small': readEnv('VITE_ADSENSE_SLOT_BOTTOM_BANNER'),
  'top-banner': readEnv('VITE_ADSENSE_SLOT_TOP_BANNER'),
  sidebar: readEnv('VITE_ADSENSE_SLOT_SIDEBAR'),
  'in-content': readEnv('VITE_ADSENSE_SLOT_IN_CONTENT'),
  'in-feed': readEnv('VITE_ADSENSE_SLOT_IN_FEED'),
  'in-feed-2': readEnv('VITE_ADSENSE_SLOT_IN_FEED_2'),
  mobile: readEnv('VITE_ADSENSE_SLOT_MOBILE'),
};

/** True for the two layout-level banner placements (full-size + exam-small).
 *  Both are mandatory with NO toggle — see getPlacementEnabled() below. */
export function isBannerPlacement(placement: AdPlacement): boolean {
  return placement === 'bottom-banner' || placement === 'bottom-banner-small';
}

/** Non-personalised ads only, ALWAYS (child safety). Never set to true. */
export const PERSONALISED_ADS = false;

/** Child-safety rules for advertising (binding).
 *  NOTE (owner brief 20 Nov 21:52): the persistent bottom banner now
 *  appears on all eligible pages INCLUDING lessons, quizzes, exams and
 *  the AI Teacher — this supersedes the earlier "no ads during AI lessons
 *  or active exams" rule. The banner never covers content or controls:
 *  the content area reserves its height (see BOTTOM_BANNER_RESERVE_PX).
 *  It still never covers essential navigation (the header sits at the
 *  top; the banner is fixed to the bottom). */
export const ADS_CHILD_SAFETY = {
  personalisedAds: false,
  familySafeOnly: true,
  noAdsOver: ['essential navigation'],
  minSpacingPx: 12,
} as const;

/**
 * Height (px) the content area reserves for the persistent bottom banner,
 * so the fixed banner never covers content, buttons or controls. The
 * banner itself is a standard responsive unit (~50px mobile / ~90px
 * desktop); 96px covers it plus spacing. Safe-area inset is added on
 * top of this at the call site.
 */
export const BOTTOM_BANNER_RESERVE_PX = 96;

/** Pages the persistent bottom banner appears on (owner brief 20 Nov 21:52).
 *  'Exams' means the SMALL banner (max 50px — owner rule 22 Nov 2026,
 *  10:45). Login/register + admin pages are NOT in this list: the banner
 *  never appears there (enforced by adsConfig.getBannerPlacementForPath()). */
export const BOTTOM_BANNER_ELIGIBLE_PAGES: readonly string[] = [
  'Home',
  'Library',
  'Lessons',
  'Books',
  'Quizzes',
  'Exams (ছোট ব্যানার — সর্বোচ্চ ৫০px)',
  'AI Teacher',
  'Profiles',
  'Directory',
  'Progress',
  'Routine',
];

// NOTE (22 Nov 2026): isBottomBannerAllowed() was REMOVED — page policy
// (which banner, if any, on which route — incl. the exam small banner
// and the login/admin exclusions) now lives in ./adsConfig.ts
// (getBannerPlacementForPath). App.tsx asks adsConfig, not this file.

const PLACEMENT_TOGGLES_KEY = 'eduvelto-ads-placements-v1';

type PlacementToggles = Partial<Record<AdPlacement, boolean>>;

function readToggles(): PlacementToggles {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PLACEMENT_TOGGLES_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as PlacementToggles;
  } catch {
    return {};
  }
}

/** Admin toggle for a placement. Default ON: a placement is ready the moment its IDs are configured (it still renders nothing until then — see adsEnabled).
 *  The bottom banner (full-size AND exam-small) has NO toggle (owner brief 20 Nov 21:52 — mandatory):
 *  it is always enabled, and setPlacementEnabled() ignores it. */
export function getPlacementEnabled(placement: AdPlacement): boolean {
  if (isBannerPlacement(placement)) return true;
  return readToggles()[placement] ?? true;
}

export function setPlacementEnabled(placement: AdPlacement, enabled: boolean): void {
  // The mandatory bottom banner cannot be turned off — not even by an
  // admin tap (review 20 Nov 2026, ads B1: the one-click off-switch).
  // This covers the exam small banner too: it is the same mandatory
  // banner, rendered smaller.
  if (isBannerPlacement(placement)) return;
  if (typeof localStorage === 'undefined') return;
  const toggles = readToggles();
  toggles[placement] = enabled;
  try {
    localStorage.setItem(PLACEMENT_TOGGLES_KEY, JSON.stringify(toggles));
  } catch {
    // Non-fatal: toggles are a local preference only.
  }
}

export function isPlacementConfigured(placement: AdPlacement): boolean {
  return ADSENSE_CLIENT_ID !== '' && AD_SLOT_IDS[placement] !== '';
}

export type AdPlacementStatus = 'not-configured' | 'ready' | 'active';

export function placementStatus(placement: AdPlacement): AdPlacementStatus {
  if (!isPlacementConfigured(placement)) return 'not-configured';
  // A banner placement is never "ready" (off-but-configured): once its
  // IDs exist it is live — there is no off state for it.
  if (isBannerPlacement(placement)) return 'active';
  return getPlacementEnabled(placement) ? 'active' : 'ready';
}

/** True only when the placement has real AdSense IDs AND its toggle is on.
 *  A banner placement ignores the toggle entirely: configured = live.
 *  NOTE: this is the "configured" gate only — the master activation
 *  switch lives in ./adsConfig.ts (adsActive). AdSlot and the app shell
 *  must use adsActive(), not this function. */
export function adsEnabled(placement: AdPlacement): boolean {
  if (isBannerPlacement(placement)) return isPlacementConfigured(placement);
  return isPlacementConfigured(placement) && getPlacementEnabled(placement);
}
