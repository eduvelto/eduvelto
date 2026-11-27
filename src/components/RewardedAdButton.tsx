// Eduvelto — Rewarded Ad unlock button (PLACEHOLDER).
//
// Renders the Free Download path as the live action and the Unlock
// (Watch 30s Ad) option as disabled / coming soon, with honest copy:
// AdSense is still in review, so no ad can run yet. See
// src/lib/rewardedAd.ts — this component never triggers an ad and
// never uses a timer; the unlock button stays disabled until the
// real official AdSense/GPT Rewarded Ad API replaces the placeholder.

import { REWARDED_AD_COPY, useRewardedAd, type RewardedAdLang } from '../lib/rewardedAd';

interface RewardedAdButtonProps {
  lang?: RewardedAdLang;
  onFreeDownload: () => void;
}

export default function RewardedAdButton({ lang = 'en', onFreeDownload }: RewardedAdButtonProps) {
  const { available } = useRewardedAd();
  const copy = REWARDED_AD_COPY;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <button className="ev-btn ev-btn-primary" type="button" style={{ minHeight: 44 }} onClick={onFreeDownload}>
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
        {copy.unlock[lang]}
      </button>
      {!available ? (
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>{copy.comingSoon[lang]}</span>
      ) : null}
    </div>
  );
}
