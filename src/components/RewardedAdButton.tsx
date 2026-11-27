// Eduvelto — Rewarded Ad unlock button (PLACEHOLDER).
//
// Renders the Free Download path as the live action and the Unlock
// (Watch 30s Ad) option as disabled / coming soon, with honest copy:
// AdSense is still in review, so no ad can run yet. See
// src/lib/rewardedAd.ts — this component never triggers an ad and
// never uses a timer; the unlock button stays disabled until the
// real official AdSense/GPT Rewarded Ad API replaces the placeholder.

import { REWARDED_AD_COPY, useRewardedAd, type RewardedAdDuration, type RewardedAdLang } from '../lib/rewardedAd';

interface RewardedAdButtonProps {
  lang?: RewardedAdLang;
  onFreeDownload: () => void;
  /**
   * Intended rewarded-ad duration for this download (ads rollout,
   * 27 Nov 2026): 30s (default) for high-value take-away files
   * (PDF / video / audio / .docx), 15s for lighter outputs (image
   * downloads, small text/data exports). COPY-LEVEL ONLY until the
   * real rewarded API lands — it selects the unlock copy; the
   * placeholder never triggers an ad and never uses a timer.
   */
  durationSeconds?: RewardedAdDuration;
  /**
   * Disables the Free Download action too (e.g. the QPG free quota is
   * exhausted — the gate must not re-enable a download the quota
   * blocks). Default false.
   */
  disabled?: boolean;
}

export default function RewardedAdButton({ lang = 'en', onFreeDownload, durationSeconds = 30, disabled = false }: RewardedAdButtonProps) {
  const { available } = useRewardedAd();
  const copy = REWARDED_AD_COPY;
  const unlockCopy = durationSeconds === 15 ? copy.unlock15[lang] : copy.unlock[lang];
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <button className="ev-btn ev-btn-primary" type="button" style={{ minHeight: 44 }} onClick={onFreeDownload} disabled={disabled}>
        {copy.freeDownload[lang]}
      </button>
      <button
        className="ev-btn ev-btn-ghost"
        type="button"
        style={{ minHeight: 44 }}
        disabled={!available}
        aria-disabled={!available}
        title={copy.comingSoon[lang]}
      >
        {unlockCopy}
      </button>
      {!available ? (
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>{copy.comingSoon[lang]}</span>
      ) : null}
    </div>
  );
}
