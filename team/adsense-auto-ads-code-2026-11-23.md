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
4. **No change** to placements, slot IDs, the exam 50px banner rule,
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
- Preview verification: see `~/workspace/eduorbit/adsense-code-evidence/`
  (OFF preview = this branch; ON preview = temporary uncommitted
  master-flip + real client ID + test-only slot value, reverted after).

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
