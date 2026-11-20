// EduOrbit — Website advertising configuration (Advertising track, parallel
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
// - Placement toggles are stored in this browser's localStorage for now.
//   Do NOT move them to Firestore without a rules change approved for that
//   purpose (no new collection, no rules change in this track).

export type AdPlacement = 'bottom-banner' | 'in-feed';

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
    labelBn: 'নিচের ব্যানার',
    labelEn: 'Bottom banner',
    whereBn: 'তালিকা/হোম পাতার নিচে — পাঠ, কুইজ, পরীক্ষা ও বইয়ের পাতায় নয়',
    whereEn: 'Bottom of list/home pages — never on lesson, quiz, exam or book pages',
    format: 'banner',
  },
  {
    id: 'in-feed',
    labelBn: 'তালিকার ভেতরের বিজ্ঞাপন',
    labelEn: 'In-feed slot',
    whereBn: 'হোম পাতার তালিকার ভেতরে — পাঠ, কুইজ, পরীক্ষার ভেতরে নয়',
    whereEn: 'Inside the home-page list — never inside lessons, quizzes or exams',
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
 *  AdSense approval — never invent one. Empty until approved. */
export const AD_SLOT_IDS: Record<AdPlacement, string> = {
  'bottom-banner': readEnv('VITE_ADSENSE_SLOT_BOTTOM_BANNER'),
  'in-feed': readEnv('VITE_ADSENSE_SLOT_IN_FEED'),
};

/** Non-personalised ads only, ALWAYS (child safety). Never set to true. */
export const PERSONALISED_ADS = false;

/** Child-safety rules for advertising (binding). */
export const ADS_CHILD_SAFETY = {
  personalisedAds: false,
  familySafeOnly: true,
  noAdsOver: ['lesson', 'quiz', 'exam', 'essential navigation'],
  minSpacingPx: 12,
} as const;

/**
 * Routes where the bottom banner must NEVER appear (learning + assessment
 * views). The list page itself stays allowed; detail pages under /library/
 * (a single book) are excluded too.
 */
const ADS_FREE_PATH_PREFIXES = ['/lessons', '/quiz', '/exam', '/books', '/library/'] as const;

export function isBottomBannerAllowed(pathname: string): boolean {
  return !ADS_FREE_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

const PLACEMENT_TOGGLES_KEY = 'eduorbit-ads-placements-v1';

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

/** Admin toggle for a placement. Default ON: a placement is ready the moment its IDs are configured (it still renders nothing until then — see adsEnabled). */
export function getPlacementEnabled(placement: AdPlacement): boolean {
  return readToggles()[placement] ?? true;
}

export function setPlacementEnabled(placement: AdPlacement, enabled: boolean): void {
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
  return getPlacementEnabled(placement) ? 'active' : 'ready';
}

/** True only when the placement has real AdSense IDs AND its toggle is on. */
export function adsEnabled(placement: AdPlacement): boolean {
  return isPlacementConfigured(placement) && getPlacementEnabled(placement);
}
