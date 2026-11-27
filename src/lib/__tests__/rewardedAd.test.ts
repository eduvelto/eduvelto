// Eduvelto — unit tests for the Rewarded Ad placeholder
// (src/lib/rewardedAd.ts + src/components/RewardedAdButton.tsx).
//
// The placeholder must stay honest: unavailable while AdSense is in
// review ("Getting ready"), no real ad API called, and no fake timer
// or countdown anywhere in the placeholder sources. The last check
// reads the two source files and fails if a timer mechanism or an
// ad-network call ever appears in them.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { REWARDED_AD_COPY, REWARDED_AD_STATUS, useRewardedAd } from '../rewardedAd';
import RewardedAdButton from '../../components/RewardedAdButton';

describe('rewardedAd placeholder', () => {
  it('reports not-available', () => {
    expect(REWARDED_AD_STATUS).toBe('not-available');
  });

  it('useRewardedAd returns unavailable with the adsense-review reason', () => {
    expect(useRewardedAd()).toEqual({ available: false, reason: 'adsense-review' });
  });

  it('renders the Free Download action live and Unlock disabled, in bn and en', () => {
    for (const lang of ['bn', 'en'] as const) {
      const html = renderToString(
        React.createElement(RewardedAdButton, { lang, onFreeDownload: () => {} }),
      );
      expect(html).toContain(REWARDED_AD_COPY.freeDownload[lang]);
      expect(html).toContain(REWARDED_AD_COPY.unlock[lang]);
      expect(html).toContain(REWARDED_AD_COPY.comingSoon[lang]);
      // The unlock button is the disabled one; the free download is live.
      expect(html).toMatch(/disabled/);
    }
    const en = renderToString(React.createElement(RewardedAdButton, { lang: 'en', onFreeDownload: () => {} }));
    expect(en).toContain('AdSense is under review — unlock will be available after approval');
    const bn = renderToString(React.createElement(RewardedAdButton, { lang: 'bn', onFreeDownload: () => {} }));
    expect(bn).toContain('AdSense review-এ আছে — approve হলে চালু হবে');
  });

  it('references no timer mechanism and no ad-network API in the placeholder sources', () => {
    const sources = [
      join(__dirname, '../rewardedAd.ts'),
      join(__dirname, '../../components/RewardedAdButton.tsx'),
    ];
    const forbidden = ['setTimeout', 'setInterval', 'setImmediate', 'googletag', 'adsbygoogle', 'requestAnimationFrame'];
    for (const file of sources) {
      const text = readFileSync(file, 'utf8');
      for (const token of forbidden) {
        expect(text, `${file} must not reference ${token}`).not.toContain(token);
      }
    }
  });

  it('durationSeconds=15 renders the 15s unlock copy (bn and en), not the 30s copy', () => {
    for (const lang of ['bn', 'en'] as const) {
      const html = renderToString(
        React.createElement(RewardedAdButton, { lang, durationSeconds: 15, onFreeDownload: () => {} }),
      );
      expect(html).toContain(REWARDED_AD_COPY.unlock15[lang]);
      expect(html).not.toContain(REWARDED_AD_COPY.unlock[lang]);
      expect(html).toContain(REWARDED_AD_COPY.freeDownload[lang]);
    }
  });

  it('default duration is 30s: the 15s copy never appears without the prop', () => {
    for (const lang of ['bn', 'en'] as const) {
      const html = renderToString(
        React.createElement(RewardedAdButton, { lang, onFreeDownload: () => {} }),
      );
      expect(html).toContain(REWARDED_AD_COPY.unlock[lang]);
      expect(html).not.toContain(REWARDED_AD_COPY.unlock15[lang]);
    }
  });

  it('disabled=true disables the Free Download button; by default it stays live', () => {
    const disabledHtml = renderToString(
      React.createElement(RewardedAdButton, { lang: 'en', disabled: true, onFreeDownload: () => {} }),
    );
    expect(disabledHtml).toMatch(/<button[^>]*disabled[^>]*>Free Download</);
    const liveHtml = renderToString(
      React.createElement(RewardedAdButton, { lang: 'en', onFreeDownload: () => {} }),
    );
    expect(liveHtml).not.toMatch(/<button[^>]*disabled[^>]*>Free Download</);
  });
});
