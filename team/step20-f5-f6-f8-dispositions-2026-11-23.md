# Step 20 Phase 1 — F5 / F6 / F8 dispositions (gate 1.7)

**Date:** 23 Nov 2026 · **Scope:** REPORT ONLY — no project file was edited. Fix plans only; the parent applies fixes.
**Source tree:** `~/workspace/eduorbit/phase2-project-step20/` — branch `jobs/step20-release`, HEAD `5a3f90e` (== main).
**Origin:** Step 19 report (`phase2-project-step19/team/job-step19-device-testing-2026-11-23.md` §7) + scoping note (`team/job-step20-release-scoping-2026-11-23.md` §4).

**Headline correction to the scoping note:** its §4 table lists F6 and F8 as OPEN. That was already out of date when written — **both were fixed in main by commit `7840a3c`** ("fix(job-mock): deadline-based timer resume + deadline-checked submit (F7/F8/F6)", 23 Nov 01:18 UTC, merged `b27245b` 23 Nov 11:48 UTC) **and deployed to live hosting the same day** (`team/f7-deploy-hosting-2026-11-23.log`, "✔ Deploy complete!", 23 Nov 11:54 UTC). The Step 19 probe ran *before* that fix/deploy, against the old CSP and old CSS. F6 and F8 therefore need **live re-verification, not a new code fix**. F5 is genuinely still open and has a minimal safe fix (below).

---

## F5 — Chips + small links touch targets — OPEN, minimal safe fix exists

### What Step 19 measured (live, 360px)
- Circulars filter chips ~20px tall ('সব' 15×20, 'বিসিএস' 37×20).
- Library book links 26px tall (49–53 small targets counted on `/library`).
- Inline text links 19–26px tall ('← হোম' 46×26, 'লগইন করুন →' 96×26, 'সর্বশেষ বিজ্ঞপ্তি দেখুন →' 149×26).
- Reference standard: WCAG 2.2 AA SC 2.5.8 Target Size (Minimum) = **24×24 CSS px**. (The project's own Step 2 design aspiration is 44×44; the WCAG 24×24 minimum is the gate used here.)

### Measured in code now (this audit)
- **Circulars chips — CONFIRMED FAIL.** The filter chips are `<Chip>` (a `<span class="ev-chip">`, `src/index.css:510-522`: `padding: 3px 10px; font-size: 13px; line-height: 1.5` → outer span ≈ 25.5px tall) wrapping a `<button style={{ all: 'unset', cursor: 'pointer' }}>` (`src/pages/JobCircularsPage.tsx:274-287` exam chips, `:293-303` status chips). `all: unset` makes the button an **inline** element, so its actual tap target is only its text line box: **≈20px tall** (13px × 1.5) and as narrow as the text — **'সব' ≈15px wide**. The span's padding is *not* clickable (clicking the padding hits the span, not the button, so the button's `onClick` never fires). Effective target for 'সব': **15×20 — fails 24×24 on both axes**; 'বিসিএস': 37×20 — fails on height. Same pattern in `src/pages/JobNotificationsPage.tsx:181-185` (category filter chips).
  - NOT affected: `src/pages/JobCalendarPage.tsx:207-218` day cells (`all: unset` but `display: block; minHeight: 56` — targets are 56px+, PASS).
  - NOT affected: retry buttons (`JobCircularsPage.tsx:318`, `JobNotificationsPage.tsx:199`, `JobCalendarPage.tsx:247`) — inline text links, see below.
- **Library book links — PASS WCAG minimum.** The book title is a plain inline `<Link>` (`src/pages/LibraryPage.tsx:355,391`: `fontSize: 16, lineHeight: 1.5` → 24px line box; Step 19 measured 26px tall, width = full title). **26×(wide) ≥ 24×24 — passes the WCAG minimum.** It fails only the project's 44px aspiration, which is not a WCAG failure.
- **Inline text links — PASS / exempt.** '← হোম' etc. measure ~26px tall, i.e. ≥24 on height, and WCAG 2.2 SC 2.5.8 explicitly excepts inline targets. No change.

### Disposition: FIX the chips (minimal safe fix); DEFER the rest with reason
**Fix — chips only (2 files, 1 CSS rule + 3 JSX call sites):**

1. `src/index.css` — add after the `.ev-chip-outline` rule (`:531`):
   ```css
   /* F5 (Step 20): filter-chip buttons must meet the WCAG 2.2 AA 24×24
      minimum. The button's `all: unset` makes it inline, so its tap
      target was only its text line box (~20px tall, 'সব' 15px wide).
      `all: unset` first, then the sizing — declarations after `all`
      in the same rule win over the reset. */
   .ev-chip-btn {
     all: unset;
     display: inline-flex;
     align-items: center;
     justify-content: center;
     min-width: 24px;
     min-height: 24px;
     cursor: pointer;
   }
   ```
2. `src/pages/JobCircularsPage.tsx` — replace `style={{ all: 'unset', cursor: 'pointer' }}` with `className="ev-chip-btn"` on the three filter buttons (`:274-280` "সব", `:284-286` per-exam, `:294-300` per-status). Do NOT touch the retry button at `:318` (inline text link, exempt).
3. `src/pages/JobNotificationsPage.tsx:181` — same replacement on the category filter button (`style={{ all: 'unset', cursor: 'pointer' }}` → `className="ev-chip-btn"`). Do NOT touch the retry button at `:199`.

**Why this is safe:** the change is scoped to the four filter-button call sites (the only `Chip > button` patterns in `src/` — verified by grep for `all: 'unset'`); the chip grows from ~25.5px to 30px tall (24px button + 3px padding each side) and the rows already wrap (`flexWrap: 'wrap'` / horizontal scroll with `overflowX: 'auto'` in the circulars filter row, `JobCircularsPage.tsx:265-270`), so no overlap and no layout break. No other `.ev-chip` (status badges, card chips) is touched — a global `.ev-chip` min-height bump was rejected because it would resize every non-interactive badge on the site.

**Verification after the fix (parent to run):** re-measure on the preview at 360px — every filter-chip button must be ≥24×24 ('সব' ≥24 wide); confirm 0 horizontal overflow and that the filter rows still wrap; run `npm run test:unit` (no test touches these buttons, but the build must still pass) + `npm run build`.

**Deferred with reason:**
- *Library links to 44px:* reaching 44px tall would require restructuring every book card into a full-card link (the link is currently the title text only inside a `Card`). That is a behaviour/layout change, not a minimal fix — and the links already pass the WCAG 24×24 minimum. Defer to a later layout pass; revisit only if the project adopts 44px as a hard gate.
- *Inline text links ('← হোম', retry links, '✕ ফিল্টার সরান'):* pass the WCAG minimum and/or fall under the inline-target exception; they are a common pattern and lower priority, as Step 19 already judged. No change.

---

## F6 — AdSense CSP `connect-src` console error on every page — ALREADY FIXED in main + deployed; needs live re-verification only

### What Step 19 measured
- All 49 renders logged: `Connecting to 'https://ep1.adtrafficquality.google/getconfig/sodar?...' violates CSP directive "connect-src 'self'"`. The AdSense verification script (`index.html:59`, `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6571267788512484`) loads on every page while the site is in AdSense review; its config fetch to `ep1.adtrafficquality.google` was CSP-blocked.

### What the code shows now (this audit)
- `firebase.json:25` — the live CSP's `connect-src` is now:
  `connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://*.gstatic.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.adtrafficquality.google`
- The host `https://*.adtrafficquality.google` was added by **commit `7840a3c`** (diff verified: the only `firebase.json` change in that commit is appending `https://*.adtrafficquality.google` to `connect-src`; commit message: "F6: added https://*.adtrafficquality.google to connect-src (AdSense config fetch was CSP-blocked)"). `*.adtrafficquality.google` covers `ep1.adtrafficquality.google` (single-label wildcard). No other CSP exists in the repo (no CSP `<meta>` in `index.html`; no CSP in `firebase.staging.json` / `firebase.alt-ports.json` / `firebase.step7.json` — grep clean).
- Merged to main as `b27245b` (23 Nov 11:48 UTC); **deployed to live hosting 23 Nov 11:54 UTC** — `team/f7-deploy-hosting-2026-11-23.log` ends "✔ Deploy complete!" / "Hosting URL: https://eduvelto.web.app". Later hosting deploys (`team/appupdate-deploy-hosting-2026-11-23.log` 12:06 UTC, `hosting2` 12:08 UTC) rebuilt from main, which contains the fix, so the live site has served the corrected CSP since 23 Nov ~11:54 UTC. The Step 19 probe predates that deploy, which is why it still saw the error.
- The Step 17 CSP unit test (`src/lib/__tests__/security-step17.test.ts:67-78`) pins only `fonts.googleapis.com` in `style-src`; it does not pin `connect-src` — no test change is needed for this fix, and none is proposed.

### Disposition: FIXED — no code change. Remaining step (verification, not a fix)
- Load the live site in a browser and confirm the `ep1.adtrafficquality.google/getconfig/sodar` CSP error is gone from the console (Step 20 Phase 1.4/1.5 live probe). If it persists, the cause would be a stale cached `index.html`/headers or a second CSP source — re-check then; do not widen the CSP pre-emptively.
- **No AdSense submission, activation, or account action is involved** — this only unblocks the verification script's config fetch. Coordinate with the AdSense review work only in the sense that the console must be clean for review; nothing is submitted here.

---

## F8 — Bottom ad-placeholder strip stays white in dark mode — ALREADY FIXED in main + deployed; needs rendered re-verification only

### What Step 19 measured
- Observed in all 360×800 dark-mode screenshots: the bottom ad-placeholder strip rendered white (light gradient) against the dark page. Cosmetic.

### What the code shows now (this audit)
- The strip is the **AdSlot preview placeholder**, not the `.ev-ad` component: on preview hosts `AdSlot` renders state `'placeholder'` (`src/components/AdSlot.tsx:161-185`) with `data-ad-preview="placeholder"` and an **inline** light gradient (`placeholderStyle()`, `AdSlot.tsx:81-90`: `background: 'linear-gradient(135deg, #fdf9ef 0%, #eff7f6 100%)'`). The fixed bottom banner is the `bottom-banner` / `bottom-banner-small` placement (`AdSlot.tsx:94-124`: `position: fixed; bottom: 0`).
- **Commit `7840a3c` fixed exactly this** (diff verified in `src/index.css`): it added, after the existing `html[data-theme="dark"] .ev-ad` override,
  ```css
  html[data-theme="dark"] [data-ad-preview="placeholder"] {
    background: linear-gradient(135deg, #1c2a20, #12292b) !important;
    border-color: var(--line-strong) !important;
    color: var(--muted) !important;
  }
  ```
  with the comment: the AdSlot preview placeholder is inline-styled with the same light gradient, so the CSS `.ev-ad` override cannot reach it — scoped to `[data-ad-preview="placeholder"]` so it can never touch a real ad (real units carry no such attribute), `!important` because only `!important` beats an inline style; values mirror the `.ev-ad` dark override. The pre-existing dark override for `.ev-ad` itself is at `src/index.css:3687` (`background: linear-gradient(135deg, #1c2a20, #12292b)`).
- On **live**, there is no strip at all to be white: the master switch is OFF (`src/lib/adsConfig.ts:45`, `ADS_MASTER_ENABLED = false`), so `getAdRenderState()` returns `'none'` and `AdSlot` renders `null` (`AdSlot.tsx:143-144`); when ads do go live, the real-ad wrapper uses theme-aware `background: 'var(--card)'` (`AdSlot.tsx:211-222`). `src/components/AdPlaceholder.tsx` (the `.ev-ad` box) has **no usages** in `src/` — dead component, not the strip.
- Merged `b27245b`, deployed to live hosting 23 Nov 11:54 UTC (same `team/f7-deploy-hosting-2026-11-23.log` as F6), and present in all later main deploys. The Step 19 dark screenshots predate the fix — and the fix's own commit message confirms the white strip appeared "in dark mode on preview hosts", matching the placeholder (preview-only) mechanism.

### Disposition: FIXED — no code change. Remaining step (verification, not a fix)
- Rendered re-check (Step 20 Phase 1.5): on a **preview** host in dark mode, the bottom placeholder strip must show the dark gradient (not white); on **live** in dark mode there must be no strip at all (master switch OFF). If the preview strip is still white, the cause would be CSS ordering/caching — re-check then; do not add another override pre-emptively.

---

## Summary table

| Item | State in main now | Disposition | Action left |
|---|---|---|---|
| F5 chips | OPEN — filter-chip buttons 15×20 / 37×20, fail WCAG 24×24 | **FIX** (minimal safe fix specified above: `.ev-chip-btn` + 4 call sites) | Parent applies fix, re-measures on preview at 360px (≥24×24, 0 overflow) |
| F5 library links | Pass WCAG (26px tall) | **DEFER** (44px needs full-card-link restructure) | None for Step 20 |
| F5 inline text links | Pass / WCAG inline exception | **NO CHANGE** | None |
| F6 CSP | **FIXED** by `7840a3c` (connect-src += `*.adtrafficquality.google`), deployed live 23 Nov 11:54 UTC | **FIXED — verify on live** | Live console check in the Step 20 probe |
| F8 dark strip | **FIXED** by `7840a3c` (`[data-ad-preview="placeholder"]` dark override), deployed live 23 Nov 11:54 UTC | **FIXED — verify by render** | Dark-mode rendered check on preview + live in Step 20 Phase 1.5 |

**Note for the parent:** the scoping note's §4 table ("F6 OPEN", "F8 OPEN") should be corrected to "FIXED in main by `7840a3c`, deployed 23 Nov 11:54 UTC — live verification owed", since the Step 19 report it cites predates that commit. F7's status in the same table ("FIXED in main") is correct.
