// Eduvelto — "Watch Ad to Unlock" (Rewarded Ad) PLACEHOLDER.
//
// This file is a PLACEHOLDER ONLY. It does NOT call any real ad API,
// does NOT trigger any ad, and does NOT use a fake timer or countdown.
//
// Why a placeholder: AdSense is still in review ("Getting ready"), so
// the real Rewarded Ad can only activate after approval. Until then
// every premium output (watermark-free PDF, bulk >5 files, HD video
// output) stays on the Free Download path — free, with watermark —
// and the Unlock option is shown as disabled / coming soon, with
// honest copy saying so.
//
// When AdSense is approved, replace `useRewardedAd` with the real
// OFFICIAL AdSense/GPT Rewarded Ad API call — NEVER with a fake
// timer, countdown, or simulated "ad watched" state. A fake timer
// would risk an AdSense suspension. No timer mechanism and no
// ad-network call may ever be added to this file;
// src/lib/__tests__/rewardedAd.test.ts enforces that.

export const REWARDED_AD_STATUS = 'not-available' as const;

export type RewardedAdReason = 'adsense-review';

export interface RewardedAdState {
  available: false;
  reason: RewardedAdReason;
}

/**
 * Placeholder rewarded-ad state. Always reports unavailable while
 * AdSense is under review. Written as a hook-shaped function so the
 * real implementation (official AdSense/GPT Rewarded Ad API, only
 * after AdSense approval) can replace this body without changing
 * callers — never by adding a fake timer.
 */
export function useRewardedAd(): RewardedAdState {
  return { available: false, reason: 'adsense-review' };
}

export const REWARDED_AD_COPY = {
  freeDownload: { bn: 'ফ্রি ডাউনলোড', en: 'Free Download' },
  unlock: { bn: 'আনলক করুন (৩০ সেকেন্ডের বিজ্ঞাপন দেখুন)', en: 'Unlock (Watch 30s Ad)' },
  comingSoon: {
    bn: 'AdSense review-এ আছে — approve হলে চালু হবে',
    en: 'AdSense is under review — unlock will be available after approval',
  },
} as const;

export type RewardedAdLang = 'bn' | 'en';
