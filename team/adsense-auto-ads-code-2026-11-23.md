# AdSense Auto ads script — gated implementation (staging)

**Branch:** `fix/adsense-auto-ads-code` (from main `fe1bd7e`)
**Date:** 23 Nov 2026
**Owner input:** AdSense screenshots 23 Nov 21:22 — site eduvelto.com listed in
AdSense with Auto ads ON + Auto optimize ON, publisher ID
`ca-pub-6571267788512484`; code handed over by the owner.

## What was wrong on main

`index.html` carried the AdSense library as a STATIC `<script>` tag
(added 22 Nov 2026, commit `654f9ab`, "ownership verification script").
It loaded on EVERY page, unconditionally — defeating the master flag.
With Auto ads ON in the AdSense account, that static script could serve
ads the moment Google approves the site, bypassing `ADS_MASTER_ENABLED`
entirely. The `google-adsense-account` meta tag (commit `0b9fe0d`) is the
actual ownership verification and stays.

## What this branch changes

1. **`index.html`** — static `<script async src="...adsbygoogle.js...">`
   REMOVED. Meta verification tag kept. Comment explains why the tag
   must never be re-added.
2. **`src/components/AdSlot.tsx`** — `loadAdsenseScript()` is now a
   named export with an empty-client guard (`if (!clientId) return`).
   No behaviour change: it still runs only from AdSlot's effect when a
   slot's state is `'ad'`, i.e. `adsActive(placement)` =
   `ADS_MASTER_ENABLED && adsEnabled(placement)` — the exact same gate
   as the banner. App.tsx mounts the banner AdSlot on every eligible
   page, so with the gate passing the script loads on every eligible
   page (Auto ads can then work account-wide); auth/admin pages mount
   no slot, so no script loads there.
3. **Tests** — new `src/components/__tests__/adsenseScript.test.tsx`
   (5 tests, fake document, no jsdom): exact owner src + async +
   anonymous; single injection; no duplicate; no-op on empty client;
   no-op with no document. `adsConfig.test.ts`: `adsActive()` is false
   for every placement while the master switch is off.
4. **CSP completion (`firebase.json`)** — the F6 CSP fix allowed
   AdSense scripts only as far as the library's first load. Running
   the library end-to-end (ON preview) showed it also pulls
   sub-resources from `*.adtrafficquality.google` and frames
   `www.google.com`:
   - script-src: `https://*.adtrafficquality.google` (was blocking
     `ep2.adtrafficquality.google/sodar/sodar2.js`)
   - frame-src: `https://*.adtrafficquality.google https://www.google.com`
     (was blocking the `ep2.adtrafficquality.google` + `www.google.com`
     frames the library creates)
   - img-src: `https://*.adtrafficquality.google` (was blocking the
     `ep1.adtrafficquality.google/pagead/sodar` beacon image)
   All three are Google-owned AdSense hosts, same trust class as the
   existing entries. After the fix the ON preview shows zero CSP
   errors. connect-src already had `*.adtrafficquality.google`.
5. **No change** to placements, slot IDs, the exam 50px banner rule,
   or personalised-ads (always off). No AMP code (no AMP pages).

## Gates (unchanged — both must pass before any ad renders)

- `ADS_MASTER_ENABLED` (`src/lib/adsConfig.ts`) — still `false` in
  this branch. It is a CODE constant, not a dashboard toggle: the
  AdminAds page displays it but cannot flip it (see
  `src/pages/AdminAds.tsx:170` — "the developer (Muse) enters the
  publisher ID and 7 slot IDs in deployment settings, flips the master
  switch and redeploys").
- `adsEnabled()` — needs real IDs: `VITE_ADSENSE_CLIENT_ID` (owner
  value: `ca-pub-6571267788512484`) + slot IDs
  (`VITE_ADSENSE_SLOT_*`, all still empty — TODO-AD-UNIT). The owner
  still has to create the ad units in his AdSense account and send the
  IDs to Muse; no slot ID was invented here.

## Verification (this branch)

- Build PASS (`tsc -b && vite build`); unit `792/792`
  (`npm run test:unit`; baseline 791 + 1 new gate assertion; the 5
  new loader tests pass in the component suite).
- Built `dist/index.html`: 0× `adsbygoogle`, 1× `google-adsense-account`.
- Preview verification DONE — see
  `~/workspace/eduorbit/adsense-code-evidence/` (probe.py + JSONs +
  PNGs). Playwright real Chromium via CONNECT relay 127.0.0.1:18099.
  Two preview channels (7-day expiry, 30 Nov 2026); two stale
  superseded channels deleted first to stay under the 51-channel
  quota (`step4-chatgpt-closure`, `link-google-account` — both 21–22
  Nov one-off/step previews, long deployed live):
  - **ON** `https://eduvelto--adsense-code-on-urs2fgbn.web.app`
    (temporary uncommitted master-flip + real client ID +
    `VITE_ADSENSE_SLOT_BOTTOM_BANNER=test-only-not-a-real-unit`,
    reverted after): script in `<head>` = 1, exactly one copy,
    `window.adsbygoogle` loaded, 9 pagead2/doubleclick requests,
    `<ins class="adsbygoogle">` = 2 (bottom-banner unit + Auto ads'
    own), top-banner labelled placeholder = 1. Console errors: only
    ONE — HTTP 400 on the ad request for the test-only slot
    (`slotname=test-only-not-a-real-unit`), because that slot does not
    exist in AdSense; no ad rendered, as expected with a fake slot on
    an unapproved site. CSP errors went 3 → 0 across the fix rounds
    above (desktop + mobile both clean apart from the 400).
  - **OFF** `https://eduvelto--adsense-code-off-83fzgw73.web.app`
    (this branch, committed state): script in `<head>` = 0, no
    pagead2 requests, `<ins>` = 0, `window.adsbygoogle` absent,
    **0 console errors**, both slots show labelled preview
    placeholders (top-banner 728×90 + bottom-banner responsive) —
    desktop AND mobile.
  - **Exam page** `/exam` on the OFF preview: exactly one slot,
    `bottom-banner-small`, labelled placeholder "পরীক্ষার ছোট ব্যানার ·
    সর্বোচ্চ ৫০px", 0 script, 0 requests, 0 console errors — the
    50px exam rule holds at the rendered level.
  - Served CSP header on both previews allows
    `pagead2.googlesyndication.com` (verified with curl).

## Activation (owner-approved step, NOT part of this branch)

After this branch is merged + deployed, ads start ONLY when ALL of
these happen (each needs the owner's separate approval per standing
rules — there is NO "flip the toggle in the admin dashboard" step;
the dashboard displays the switch but cannot change it):
1. Owner creates the ad units in AdSense and sends the slot IDs.
2. Deploy with `VITE_ADSENSE_CLIENT_ID=ca-pub-6571267788512484` and
   the `VITE_ADSENSE_SLOT_*` values set at build time.
3. `ADS_MASTER_ENABLED` flipped to `true` in `src/lib/adsConfig.ts`
   + redeploy.
Until then the site renders nothing (and loads no AdSense script),
exactly as today.
