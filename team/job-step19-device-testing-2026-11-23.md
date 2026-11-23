# Job Step 19 — Device Testing — 2026-11-23

- **Status: CLOSED IN STAGING.** Branch `jobs/step19-device-testing`, base main `1918766` (Step 14 live). No merge, no deploy in this step.
- **Deploy: HELD — after the 23 Nov ~14:30 Asia/Dhaka cron, never inside the 14:00–15:30 window**, with the Step 15/16/17/18 deploys in dependency order. The fixes in this step change user-visible CSS (mobile nav, CEO panel, header logo), so they deploy with that batch.
- **Preview:** https://eduvelto--step19-device-testing-l5097cin.web.app (expires 2026-11-30 00:22:12 UTC). Final build: JS `index-BuZgzal8.js`, CSS `index-B14pm7o8.css` (hashes changed from the first build's `index-BQz_Oaw2.css` after the logo-swap rebuild; the preview references exactly the final dist files).
- **Cost:** $0. No live Firestore reads/writes for testing (renders are reads only; no submissions, no test accounts, no data created). No rules change (`firestore.rules` 0-line diff vs main).
- **Scope note:** tested main `1918766` as it stands. Steps 15 (Admin), 16 (Viva/Career/CV), 17 (Security Testing + rules-size savings) and 18 (Backup/Recovery Testing) are closed in staging on their own branches and NOT on main — their pages are NOT covered here. Negative control (preview by-content): `/jobs/viva` and `/admin/jobs/circulars` return only the plain SPA shell with no viva/admin-circulars content, consistent with those steps not being on this branch.

## 0. Spec and assumptions

The Job program design docs + launch checklist say only: "Mobile responsiveness — device testing (390px phones, tablets, desktop), after Hosting deploy; test on real devices". The spec is thin, so the matrix was defined from the parent brief + the Gemini/ChatGPT advice (fold-in §5), with these stated assumptions:

- Primary device is a low-end Android phone ~360px wide (Bangladeshi students); tablets and desktop are secondary.
- Key surfaces: `/jobs` hub + exam pages, `/jobs/dashboard`, `/jobs/planner`, practice + results + wrong-answers, `/jobs/circulars` + `/jobs/calendar`, library/class pages, auth (LoginWall), PWA installability.
- Known constraints carried in: exam-page bottom ad banner ~50px mobile (~90px desktop, reserve 96px), exam pages show only a very small bottom banner never covering questions; Bangla fonts (Noto Sans Bengali / Hind Siliguri) must render; header language toggle (Bangla default, English nav labels only).
- Rendered-check environment: the sandbox egress proxy `127.0.0.1:18080` has been DOWN since 22 Nov ~14:26. Real Playwright renders work through a local CONNECT forwarder on `127.0.0.1:18081` (reads the proxy URL from env, forwards CONNECT with Basic auth; no credentials logged). Chromium via `~/workspace/.venv-img/bin/python`, `--proxy-server=http://127.0.0.1:18081` + `--ignore-certificate-errors`. This is the first real rendered evidence on live since the proxy went down. Nothing in this report is claimed from a browser-task scan or a text fetch — only from real renders, real computed styles, or code reads, each labelled as such.

## 1. Test matrix (rendered)

Live site, main `1918766`, before the fixes in §3. All HTTP 200. `overflowPx = document.documentElement.scrollWidth − clientWidth`.

| Viewport | Routes rendered | Overflow | Notes |
|---|---|---|---|
| 360×800, Slow-4G throttle + 4× CPU | 16: `/`, `/jobs`, `/jobs/bcs`, `/jobs/dashboard`, `/jobs/planner`, `/jobs/wrong-answers`, `/jobs/circulars`, `/jobs/calendar`, `/jobs/notifications`, `/class`, `/library`, `/admissions`, `/admissions/national-university`, `/login`, `/privacy`, `/admin` | 0 on all | Bangla font loaded on all 16. Signed-out gated pages render their LoginWall/gate correctly (see §1.1). Bottom-nav defect found here (F1). |
| 360×740 (shorter viewport, browser UI bar) | 5: `/`, `/jobs`, `/jobs/bcs`, `/jobs/circulars`, `/library` | 0 on all | |
| 414×896 | 5: `/`, `/jobs`, `/jobs/bcs`, `/jobs/circulars`, `/library` | 0 on all | |
| 768×1024 (tablet portrait) | 5: `/`, `/jobs`, `/jobs/bcs`, `/jobs/circulars`, `/library` | 0 on all | |
| 1280×800 (desktop) | 16 (same set as 360×800) | 0 on all | |
| 1920×1080 (desktop) | 2: `/`, `/jobs` | 0 on all | |
| 320×720 (spot check) | 4: `/`, `/jobs`, `/jobs/bcs`, `/jobs/circulars` | 0 on all | Bangla font loaded on all 4. |
| **Total** | **49 route renders + 4 spot checks** | **0 everywhere** | No horizontal overflow anywhere on live. |

Evidence: `~/workspace/eduorbit/step19/device-matrix.json` (49 renders), `device-followup.json` (320px + dark-mode + offline retests), screenshots `~/workspace/eduorbit/step19/shots/` (56+ shots).

### 1.1 Signed-out gates (rendered, correct behaviour)

- `/jobs/dashboard` renders "আমার চাকরির ড্যাশবোর্ড" + "প্রোফাইল দেখতে লগইন করুন।" + "লগইন করুন" button.
- `/admin` renders "অনুমতি নেই" (0 buttons, 1 link).
- `/jobs` and `/jobs/bcs` have no `h1` (h2-led pages — screenshot-verified, not a defect).
- Owner confirmed 23 Nov 06:24–06:25 that exam-taking AND reading both require login ("exam dite obossoi login korte hobe", "porar jnno o login korte hobe"). Hub/listing pages stay public + crawlable; chapters/lessons, questions, practice, mock, results, progress stay login-gated. The LoginWall renders above are the intended behaviour, not defects.

### 1.2 Fixed / sticky elements (measured, live)

- Header sticky, 117px tall at top (~15% of an 800px viewport — observation, not a defect).
- Bottom nav fixed, 47px tall at bottom before the fix (644–800 at 360×800; 60px after the fix, §3).
- `.ev-app-shell` reserves 60px + banner + safe-area-inset-bottom on mobile, so content is not covered. Bottom-nav height after the fix (60px) is within the reserve.
- Scroll-to-bottom check (preview, §4): at maximum scroll the lowest content element bottom is ~549px vs nav top 644px (~95px gap) on `/` and `/jobs` — the last content is fully reachable above the nav. Mid-scroll overlap of card text under the fixed nav is normal fixed-nav behaviour, not a defect.

### 1.3 Dark mode (rendered)

- Works at 360px and 1280px (toggle via `button[aria-label="ডার্ক মোড"]`; light bg `rgb(244,241,233)` / color `rgb(32,43,51)` → dark bg `rgb(15,27,36)` / color `rgb(232,238,242)`).
- First 1280px attempt failed on a probe bug (two toggle buttons in DOM — mobile + desktop variants; strict-mode timeout) — retested with a `:visible` selector, PASS.
- Theme stored per-device in localStorage `eduvelto-theme`, applied as `data-theme` on `<html>` (`src/lib/theme.tsx`).

### 1.4 PWA (rendered, live + preview)

- Manifest 200: name/short_name "Eduvelto", display `standalone`, start_url `/`, lang `bn`, 3 icons (192/512/maskable), theme_color `#0A1F44`; `offline.html` 200.
- SW registered, scope `https://eduvelto.com/`. Custom injectManifest worker (`src/sw.ts`): skipWaiting + clientsClaim, precache app shell + offline page, NavigationRoute network-first with offline.html fallback ONLY on fetch failure (deliberate — the old navigateFallback served offline.html for every hard load even online, fixed 21 Nov 2026).
- Offline reload: WORKS once the SW activates. Install takes ~25–35s in the sandbox (registering at ~10s, installing until ~35s, then active + controller; first two offline attempts failed with ERR_INTERNET_DISCONNECTED because the SW had not finished installing — a first-visit offline window, minor). After activation, offline reload renders the home page ("স্বপ্ন পূরণের পথে Eduvelto"). All 136 precache URLs return 200 (checked individually).
- Preview origin re-verified after the fixes (§4): manifest 200 with the same fields, SW active + controlling immediately (already installed), offline reload of `/` PASS.
- Install-prompt UI cannot be tested headless — OWED, needs real Android Chrome.

### 1.5 Bangla rendering (rendered)

- `document.fonts.status` = `loaded` on every page; Hind Siliguri 400/500/600/700 all `loaded`; body computed font-family `"Hind Siliguri", "Noto Sans Bengali", system-ui, …` (16px, line-height 25.6px = 1.60).
- `document.fonts.check()` = true in Hind Siliguri AND Noto Sans Bengali for all 15 ChatGPT test strings on every page checked (home, /jobs, /library, /jobs/bcs): ক্ষ, জ্ঞ, ত্র, শ্র, ন্ত্র, প্রস্তুতি, ৩৫ নম্বর, বিজ্ঞাপন, চাকরি, ০১২৩৪৫৬৭৮৯, কি/কী, ে, ো, ৌ. Screenshots visually inspected — no tofu/missing-glyph boxes.
- Line-height on card/question elements 1.60–1.70 (inside the 1.5–1.8 band), so vowel marks don't clip. (One heading style measured 1.30–1.35 — Poppins-led headings, not body/card text.)
- Caveat: `/library` first timed out on `networkidle` (60s — a long-lived connection, not a page failure); retried with `domcontentloaded` + 6s and it loaded. Library card bodies were still skeleton placeholders at capture — heading/footer Bangla verified visually, card-body conjuncts verified via `fonts.check` only.

## 2. Findings

### F1 — MAJOR, FIXED: mobile bottom-nav "বেশি কিছু" and "মেনু" buttons unreadable (live)

- **Where:** every 360px render (home + all routes), light and dark mode.
- **Evidence:** computed style on live 23 Nov ~06:05 — nav bg `rgb(20,43,59)`; the first three nav items (হোম, আমার কোর্স, প্রগ্রেস — `<a>` elements) render white text on dark navy; the last two (`<button>` elements) render white text `rgba(255,255,255,0.85)` on light grey `rgb(239,239,239)` — the Chrome default button background. Buttons measured 76×45 and 48×45px. Screenshots: `shots/360x800-home-dark.png` (before) vs `shots/fix-360x800-home-dark.png` / `fix2-360x800-home-dark.png` (after).
- **Root cause (verified in source + built CSS):** `src/index.css` line 2385–2386 — `@media (max-width: 768px) {.ev-bottom-nav-link {` opens a rule that is never closed there; the intended declarations live ~350 lines later and got swallowed/nested by the CSS processor. Built CSS (live `dist/assets/index-C9hSc0Pz.css`) proves it: the top-level `.ev-bottom-nav-link` rule has ONLY padding/color/font-size (no `background:transparent`, no `display:flex`, no `border:0`, no `min-height`), and the CEO Panel rules became descendants (`.ev-bottom-nav-link .ev-ceo-shell`, etc.). A brace-depth scan (comment-aware) confirmed the nesting: the 2385 `@media` + 2386 rule stayed open until two stray closing braces at old lines 2807/2817, and an orphaned declaration fragment (padding/color/font-size only) sat at old lines 2804–2806.
- **Fix:** §3. **Verified by re-render on the preview** — all 5 items now `background: rgba(0,0,0,0)`, `display: flex`, 58px tall; "বেশি কিছু" and "মেনু" fully readable in light and dark mode.

### F2 — MAJOR, FIXED: the CEO panel is effectively UNSTYLED (live)

- **Evidence:** no top-level `.ev-ceo-shell` rule exists in the live built CSS (grep for a top-level rule returned nothing; the only `.ev-ceo-shell` occurrence is the descendant `.ev-bottom-nav-link .ev-ceo-shell`). Counted precisely: **52 of 65 `.ev-ceo-*` selectors in the built CSS exist ONLY as `.ev-bottom-nav-link` descendants** — including `.ev-ceo-shell`, `.ev-ceo-header`, `.ev-ceo-main`. All CEO-panel styles only apply inside a bottom-nav link element, which never contains CEO content.
- **Cause:** the same broken nesting as F1 (the entire CEO Panel section, `src/index.css` ~2391–2724, was pasted inside the unclosed `.ev-bottom-nav-link` rule).
- **Impact:** the CEO panel was deployed live 22 Nov ~14:28 and only ever verified signed-out ("অনুমতি নেই") — the styled signed-in panel was never actually rendered. This is a Step 19 finding, not a new defect introduced by this step.
- **Fix:** §3 — the same repair. **Verified in the rebuilt CSS:** 65 `.ev-ceo-*` selectors, **0** prefixed with `.ev-bottom-nav-link`; top-level `.ev-ceo-shell{max-width:560px;margin:0 auto;background:var(--card);min-height:100vh;…}` present. The styled signed-in CEO panel itself is still OWED as a rendered check (needs a signed-in owner session).

### F3 — Minor, FIXED: header logo shows a WHITE box in dark mode

- **Evidence:** screenshot `360x800-home-dark.png` (23 Nov ~05:56): `logo.png` (white background, 2729×912 RGB) renders inside a white rectangle on the dark header. `logo-white.png` exists in `public/` (2729×912 RGBA, same lockup, transparent) but was not used in the header.
- **Fix:** §3 — `HeaderNav.tsx` now renders `/logo-white.png` in dark mode, `/logo.png` in light mode (theme already available via `useTheme()`). **Verified by re-render:** dark-mode logo src is `/logo-white.png`, and the dark screenshot shows the white logo blending into the dark header with no white box.

### F4 — Minor, FIXED: small touch targets below the 44px target

- **Measured on live (360px):** header icon buttons 40×40 ('ডার্ক মোড', 'EN' 61×40), search 'খুঁজুন' 36×36.
- **Fix:** §3 — `.ev-header-icon-btn` 40→44px (base rule + mobile override), `.ev-home-msearch button` 36→44px. **Verified by re-render on the preview:** theme button 44×44, search button 44×44, overflow still 0 at 360px, header row fits (logo ~132px + actions ≈ 293px < 328px usable).

### F5 — Minor, OPEN: more small touch targets (not fixed)

- **Measured on live (360px):** circulars filter chips ~20px tall ('সব' 15×20, 'বিসিএস' 37×20), library book links 26px tall (49–53 small targets counted on `/library` at 360×740/414×896), inline text links 19–26px tall ('← হোম' 46×26, 'লগইন করুন →' 96×26, 'সর্বশেষ বিজ্ঞপ্তি দেখুন →' 149×26).
- WCAG 2.2 AA minimum is 24×24 — the chips fall below even that; inline text links are a common pattern and lower priority. **Not fixed in this step** — a chip min-height change alters the filter-row layout and needs a layout decision, not a blind bump. Follow-up.

### F6 — Minor, OPEN: AdSense CSP console error on EVERY page (pre-existing)

- All 49 renders log `console.error: Connecting to 'https://ep1.adtrafficquality.google/getconfig/sodar?...' violates CSP directive "connect-src 'self'"`. The AdSense verification script loads on every page (site in review) but its config fetch is CSP-blocked. Cosmetic console noise, pre-existing, not a Step 19 defect to fix — follow-up for the CSP/AdSense work.

### F7 — MAJOR, OPEN (found by code): timed-mock resume shows the FULL duration instead of remaining time

- **Found by:** timer-by-code verification (`~/workspace/eduorbit/step19/timer-code-check.md`); **confirmed by the coordinator by reading the code** (not just the subagent's claim).
- **Mechanism:** `enterExam` (`src/pages/JobMockPage.tsx:171`) computes `offsetRef.current = serverStarted − Date.now()`, where `serverStarted` is the `startedMillis` passed in. `remaining = deadlineMillis − (now + offsetRef.current)` (`JobMockPage.tsx:280`). On a FRESH start, `startMockSession` returns `startedAtMillis: Date.now()` (`src/lib/jobMock.ts:596`), so the offset ≈ 0 and the countdown is correct. On RESUME, `doResume` passes `resumable.startedAtMillis`, which `findResumableMockSession` read from the STORED session doc (`src/lib/jobMock.ts:491` — the ORIGINAL start time). So the offset becomes −(elapsed time) and the displayed remaining becomes the full duration. Simulated from the code: 60-min mock, refresh at 20 min → displayed **60 min**, true remaining **40 min**.
- The stored deadline itself restores correctly (`ensureMockDeadline`, `src/lib/jobMock.ts:620-626` — returns the stored `endsAt` when it exists). Only the displayed countdown is wrong. No unit test covers the page-level offset/resume math.
- **Knock-ons:** auto-submit fires after the real deadline (it keys off the inflated `remaining`, `JobMockPage.tsx:287-290`); the late attempt is then denied by rules, and the page shows a generic error instead of the expired state until the displayed clock also runs out.
- **Related gap (same check):** the session → `submitted` transition itself is NOT deadline-checked by rules (only answer changes are gated), so a late submit can flip the session with no attempt created (orphan). Server enforcement otherwise verified: Job late submit denied at attempt create — `submittedAt <= sessAfter.endsAt` (`firestore.rules:1528`, M1-b), `submittedAt` is a server timestamp. `nuAttempts`: late writes denied (`request.time <= deadlineAt`, L3530); `deadlineAt`/`startedAt` immutable (not in update `affectedKeys`, L3536-3540). Honest limit: `deadlineAt` is client-set, only bounded, not exact.
- **NOT fixed in Step 19 — deliberate scope call.** This is exam logic, not a layout defect, and it cannot be verified by re-rendering (no signed-in session exists; live has no published mock definition/manifest, so a real timed mock cannot run on live at all). The brief allows only clear-cut, low-risk layout fixes verifiable by re-render. **Recommended fix (follow-up):** on resume, do not recompute the offset from the historical `startedAt` — use offset 0 (trust the client clock; the stored deadline is authoritative and the rules enforce it server-side), or persist the start-time skew. Verification must be: 60-min mock, refresh at 20 min → display must show 40. Also consider a deadline check on the session → `submitted` transition, or document the orphan outcome.
- **What passed by code:** countdown anchored to the stored server `endsAt` (set once, exactly `startedAt + duration`), `setInterval` only ticks `now` (`JobMockPage.tsx:276,280`); fresh start correct; tab switch / screen lock: deadline never pauses (no visibility handler; absolute-deadline math self-corrects on return — unless the page reloads, which hits the resume bug); auto-submit fires once at ≤10s remaining; offline it retries and never promises submission; double-submit: one attempt doc only (doc-ID = session ID plus rules `allow update: false`, `firestore.rules:4526`; UI guard is only the disabled button, `JobMockPage.tsx:692` — `doSubmit` has no in-flight ref guard); study clock (`src/lib/activeStudyTime.ts`) pauses on hidden/blur with 90s idle timeout (`ACTIVE_IDLE_TIMEOUT_MS = 90_000`, L52) while the exam deadline is untouched; practice is untimed by design (no timer; rules force `endsAt == null`); result page renders only the stored attempt (shows time taken vs allowed minutes, no overtime flag).

### F8 — Minor, OPEN: bottom ad-placeholder strip stays white in dark mode (cosmetic)

- Observed in all 360×800 dark-mode screenshots. Cosmetic; follow-up with the ads work.

### Investigated, NOT defects

- Fixed bottom nav overlapping lower card text at mid-scroll (flagged during the Bangla/PWA render): **not a defect** — scroll-to-bottom measurement (§1.2) proves the last content is fully reachable above the nav.
- Header 117px tall (~15% of an 800px viewport): observation, not a defect.
- `/jobs` and `/jobs/bcs` have no `h1`: h2-led pages, not a defect.
- AdSense CSP error: F6 (open, pre-existing).
- Guest quizzes returning 403: explained, not a bug (repo rules make quizzes signed-in-only; live matches).

## 3. Fixes made

Only 2 files changed (plus this report). No rules change. No redesign.

| File | Change |
|---|---|
| `src/index.css` | (a) Repaired the broken bottom-nav block: replaced the empty `@media (max-width: 768px) { .ev-bottom-nav-link {` opener (old line 2385–2386) with the complete rule (`display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; min-height:58px; padding:8px 2px 6px; border:0; background:transparent; color:rgba(255,255,255,0.85); font-family:var(--font-body); font-size:12px; font-weight:500; line-height:1.2; text-decoration:none; cursor:pointer`) + `:hover` + `-active` + the closing `}` for the media query — so the CEO Panel section is top-level again. (b) Deleted the orphaned declaration fragment (old lines 2804–2807: bare `padding/color/font-size` + stray `}`). (c) Deleted the stray closing brace before the CEO Approval Center section (old line 2817). (d) `.ev-header-icon-btn` 40→44px (base + mobile override). (e) `.ev-home-msearch button` 36→44px. |
| `src/components/HeaderNav.tsx:279` | Header logo: `src="/logo.png"` → `src={theme === 'dark' ? '/logo-white.png' : '/logo.png'}` (one line; `theme` already in scope via `useTheme()`; both files are 2729×912, so layout is unchanged). |

**Verification of the repair (built CSS, then preview render):**

- Brace balance after the edits: final depth 0, never negative (comment-aware scan).
- Rebuilt CSS (`dist/assets/index-B14pm7o8.css`): `.ev-bottom-nav-link{display:flex;…;min-height:58px;padding:8px 2px 6px;border:0;background:transparent;color:#ffffffd9;…}`; top-level `.ev-ceo-shell` present; `.ev-ceo-*` selectors 65 total, **0** prefixed with `.ev-bottom-nav-link` (was 52).
- Preview render (360×800, light + dark): all 5 nav items `background: rgba(0,0,0,0)`, `display: flex`, 58px tall; "বেশি কিছু" and "মেনু" readable; "হোম" amber when active; nav bar 60px tall (within the 60px shell reserve); overflow still 0; dark-mode logo src `/logo-white.png` with no white box; theme button 44×44; search button 44×44.
- Before/after screenshots: `shots/360x800-home-dark.png` (live, before) vs `shots/fix-360x800-home-dark.png` and `shots/fix2-360x800-home-dark.png` (preview, after). The before shot shows the two white unreadable button boxes; the after shots show all five items white-on-navy.
- Preview channel note: the 50-channel quota was full, so the superseded `step11-dashboard` preview channel was deleted to free a slot (Step 11 is live since 23 Nov 00:25; the channel was superseded — the same pattern Step 18 used when it deleted `step10-merge-e365201`). No live content was touched.

## 4. Verification gates

| Gate | Result |
|---|---|
| Build | PASS — 70 modules; PWA precache 136 entries, 1942.94 KiB; `dist/sw.js` generated. |
| Unit suite | **28 files, 666/666 PASS** (`npm run test:unit`). |
| Full rules suite | **Run 1: exit 0 (green). Run 2: 7 failed / 1037 passed (1044)** — timing flakes under parallel load (run 2 took 686s vs 182s for run 1; the failures were all read-path/integration tests whose setup data hadn't landed, e.g. "expected 5 docs, got 0" + a cross-user list succeeding on empty data). **Isolated re-runs of exactly the 5 affected files: 48/48 PASS** — step12-planner 4/4, step10-result-analysis 7/7, auth-gating 19/19, guardian-e2e + step9-full-exam-integration 18/18. `firestore.rules` is unchanged (0-line diff), so no rules regression was possible. Logs: `~/workspace/eduorbit/step19/rules-suite.log`, `rules-rerun-5files.log`, `rules-rerun-2files.log`. (One re-run incident: the 5-file run's vitest main process exited while workers were still running and the emulator shut down mid-run, leaving lingering workers retrying against a dead emulator; the workers were killed by PID and the 2 inconclusive files re-run cleanly, 18/18.) |
| Preview deploy | PASS — channel `step19-device-testing`, expires 2026-11-30 00:22:12 UTC. |
| Preview BY-CONTENT | **15/15 routes 200** with the new Step 19 bundle present on 15/15; old live bundle on 0/15; identical 5,189-byte SPA shell on every route; manifest PASS; CSS checks PASS; negative control PASS (`/jobs/viva`, `/admin/jobs/circulars` return only the plain shell). Evidence: `~/workspace/eduorbit/step19/preview-by-content.json` (+ probe `probe_preview.py`). |
| Bangla rendering (preview render) | PASS — fonts loaded; `fonts.check` true for all 15 test strings; line-height 1.60–1.70. Evidence: `~/workspace/eduorbit/step19/bangla-pwa-check.json`, probe `probe_bangla_pwa.py`, screenshots `shots/bangla-360x800-*.png`. |
| PWA / offline (preview render) | PASS — manifest 200 (same fields); SW active + controlling; offline reload of `/` renders home. Install prompt OWED (headless). |
| Dark mode (preview render) | PASS — measured colours both themes; logo swap verified. Screenshots `shots/fix2-360x800-home-dark.png`, `shots/dark-360x800-home.png`. |
| Scroll-to-bottom (preview render) | PASS — last content ~95px above the nav top at max scroll on `/` and `/jobs`. Evidence: `~/workspace/eduorbit/step19/scroll-bottom.json`. |
| Timer (by code) | Verified as in F7 — fresh start + deadline anchoring + server enforcement PASS; resume-display bug FOUND (F7, open); live timer scenarios OWED. Evidence: `~/workspace/eduorbit/step19/timer-code-check.md`. |

## 5. Multi-AI fold-in

Both consultations were forwarded by the parent and folded in before closing. Where AI advice conflicts with sandbox/repo facts, the facts win.

### 5.1 Gemini (https://gemini.google.com/app/81e0b0f177406b3b)

| # | Gemini item | Disposition | Reason / evidence |
|---|---|---|---|
| G1 | Matrix P0: 360×800, Chrome Android, Slow 4G/3G + 4–6× CPU — exam hub, practice & timed mock, results, login wall | USED | 360×800 Slow-4G + 4× CPU on 16 routes; practice/mock/results are login-gated, so their LoginWall was verified rendered; the timed mock itself is OWED (no signed-in session). |
| G2 | Matrix P0: 360×740, Android WebView/in-app browser, normal 4G + intermittent offline — timed mock, dashboard, planner, circulars | ADAPTED | 360×740 rendered on 5 routes; offline tested via SW offline reload, not intermittent-offline mock; WebView/in-app browser not available in the sandbox; timed mock OWED. |
| G3 | Matrix P1: 390/412 mid-range, tablet 768×1024/1024×768, P2 desktop 1280/1440 | ADAPTED | Rendered 414×896, 768×1024, 1280×800, 1920×1080; 390×844/412×915/1024×768/1440×900 not rendered separately — 414 covers the large-phone class; Safari not available (OWED). |
| G4 | Overflow: `scrollWidth <= innerWidth` every route at 360px; watch wide Bangla words, 100vw, tables | USED | 49 renders + 4 spot checks, all 0. No `overflow-x: hidden` fix was applied — the fix was a real CSS repair. |
| G5 | Touch targets ≥44×44 with gaps | USED | Measured on live; nav 58px after the fix; header/search bumped to 44px; chips/links recorded as open minor F5. |
| G6 | Bangla fonts actually load; juktakkhors/kar marks; line-height 1.5–1.65 | USED | Fonts loaded on all renders; `fonts.check` true for all 15 strings; line-height measured 1.60–1.70. |
| G7 | Sticky headers/bottom banners never cover content; safe-area + bottom padding = fixed-bar height | USED | Header sticky 117px, nav fixed 47→60px, shell reserve 60px + banner + safe-area; scroll-to-bottom proves last content reachable (§1.2). |
| G8 | Timers anchored to start/end timestamps; warn near expiry; auto-submit predictable | USED (by code) | EndsAt-anchored, auto-submit ≤10s; resume-display bug FOUND (F7); server enforcement verified in rules. |
| G9 | PWA manifest + SW + offline with a clear Bangla offline state | ADAPTED | Manifest + SW + offline reload verified; an explicit Bangla offline-state message was not separately verified — follow-up. |
| G10 | Dark mode: contrast, elevation borders, Bangla legibility, status badges | ADAPTED | Both themes measured at 360 + 1280; logo fixed; correct/incorrect badge colours NOT verified (results page login-gated) — OWED with the signed-in flows. |
| G11 | Chrome DevTools Device Mode / Playwright matrix | USED | Playwright via the forwarder; DevTools not used (headless only). |
| G12 | Android Studio Emulator AVDs (real Chrome for Android, soft keyboard, PWA install) | REJECTED | No Android Studio in this sandbox; Playwright emulation used instead; real-device check is an owner follow-up. |
| G13 | BrowserStack limited free trial | REJECTED | No trial sign-ups without a separate decision (cost/ToS). |
| G14 | Lighthouse / PageSpeed Insights audits | ADAPTED | Not run — no audited Lighthouse run in this step; targets recorded as project targets, not results; follow-up. |
| G15 | Must-not-dos: no quota-burning loops on live, no synthetic submissions, no half-baked SW on live traffic, no test banners/debug overlays/loosened rules | USED | 49 renders are reads only; no submissions; SW behaviour verified on the preview origin for the new build; no rules change; no overlays. |

### 5.2 ChatGPT (https://chatgpt.com/uc/6b038044-a0dc-83ea-82d7-e109a71045e7)

| # | ChatGPT item | Disposition | Reason / evidence |
|---|---|---|---|
| C1 | Matrix incl. 320×720 (P1), 375×812 Safari sim (P1), 1366×768, 1440×900 | ADAPTED | 320×720 spot-checked on 4 routes (all 0 overflow); 375 Safari sim impossible — no WebKit binary in the sandbox (OWED); 1366/1440 not rendered separately — 1280 + 1920 cover desktop. |
| C2 | A desktop browser resized to 360px is NOT a real Android phone — borrow at least one real device before declaring the PWA fully tested | USED (as a stated limit) | Emulation for breadth; borrowed-phone verification is an OWNER-side follow-up, never claimed as done. |
| C3 | Per-page focus: exam hub, practice, timed mock, results, dashboard, planner, circulars, library/classes, login walls | USED | All rendered signed-out; practice/mock/results content OWED (login-gated). |
| C4 | Overflow as its own category + safeguards (box-sizing, max-width 100%, overflow-wrap); do NOT use `overflow-x: hidden` as the only fix | USED | 0 overflow measured everywhere; no `overflow-x: hidden` fix applied. |
| C5 | Touch targets ≥44px; whole answer option clickable; no destructive action next to a common action | ADAPTED | Targets measured/fixed; whole-option clickability NOT verified live (practice login-gated) — OWED; no destructive adjacency found on rendered pages. |
| C6 | Bangla test strings (যুক্তবর্ণ ক্ষ জ্ঞ ত্র শ্র ন্ত্র, কারচিহ্ন কি কী কে কৈ কু কূ, digits ০১২৩৪৫৬৭৮৯, mixed "Chapter ১২ — Algebra (বীজগণিত)") | USED | All 15 strings `fonts.check` true in both fonts; screenshots inspected. |
| C7 | Do NOT judge Bangla rendering from desktop screenshots alone — test at least one real Android browser | USED (as a limit) | Renders are headless Chromium; real Android rendering is an owner follow-up. |
| C8 | Sticky/banner acceptance: every question readable, every option tappable, submit reachable, keyboard never traps | ADAPTED | Nav/banner coverage verified by measurement + scroll-to-bottom; question/option/submit reachability OWED (login-gated mock); keyboard trap not testable headless — OWED. |
| C9 | Timed-exam scenarios: refresh restores time, tab switch/lock keep timer accurate, disconnect/reconnect, double-tap submit = one, back nav, timer zero, clock change must NOT extend time | USED (by code) | Verified against the implementation; refresh-restore bug FOUND (F7); live scenarios OWED; clock-change: server timestamp backstop verified for Job mocks (`submittedAt` is a server timestamp); NU `deadlineAt` is client-set, bounded not exact — recorded. |
| C10 | Server must enforce the deadline | USED | Verified: Job late submit denied at attempt create (`firestore.rules:1528`); session→`submitted` transition gap FOUND (F7). |
| C11 | Firebase unreachable during submission must never silently discard answers | ADAPTED (by code) | Offline retries, never promises submission; live scenario OWED. |
| C12 | PWA install + offline (manifest, standalone, SW updates must not erase cached data/pending answers) | ADAPTED | Manifest + SW + offline reload verified on the preview; install UI OWED; SW-update data preservation not tested — follow-up. |
| C13 | Dark mode: both themes, system/manual, mid-page switch, refresh, correct/incorrect not by colour alone | ADAPTED | Both themes measured at 360 + 1280; logo swap verified; correct/incorrect colour-alone check OWED (results login-gated); preference persistence via localStorage verified by code (`theme.tsx`). |
| C14 | Zero-cost toolkit (DevTools, Playwright incl. sample config, Android Emulator, Lighthouse, Firebase Test Lab) | ADAPTED | Playwright used; DevTools/Emulator/Test Lab not available or not used; Lighthouse not run. |
| C15 | Low-end network profiles (400Kbps/200Kbps/400ms, 150Kbps/800ms) + performance targets (Lighthouse 85+/95+, LCP <2.5s, INP <200ms, CLS <0.1, JS <200KB) | ADAPTED | Slow-4G + 4× CPU used for the 360×800 matrix; the 400/150Kbps profiles not run separately; Lighthouse targets recorded as project targets, not results. |
| C16 | Production safety rules (never modify real student data, never destructive tests on prod, never weaken rules, never real credentials in automation, never deliberately break connectivity, mind Spark quotas) | USED | No student data modified; no destructive tests; no rules change; no real credentials in automation; quota respected (reads only). |
| C17 | Execution order: Phase 1 layout → Phase 2 exam function → Phase 3 sticky → Phase 4 PWA/offline → Phase 5 compatibility → Phase 6 final verification | USED | Followed; Phase 5 partial (WebKit OWED). |
| C18 | 47-check master list + FIVE RELEASE BLOCKERS | ADAPTED (into this report) | (1) No horizontal overflow at 360px — **PASS**. (2) No question/option hidden behind sticky elements or banners — **PARTIAL**: nav/banner coverage PASS, question/option reachability OWED (login-gated). (3) No lost answers, incorrect timers, or duplicate submissions — **PARTIAL**: by code PASS except the F7 resume bug, which is OPEN. (4) No broken Bangla rendering on Android Chrome — **PASS by render**, real-device OWED. (5) No critical PWA install, offline-data, or Firebase security failures — **PASS** (PWA/offline verified; no rules change; security covered by Step 17 staging). |

## 6. Honest limits — what was NOT verified (OWED)

- **WebKit / iOS Safari:** Playwright WebKit binary does not exist in the sandbox (`webkit-2388/pw_run.sh` missing). iOS Safari rendering is OWED.
- **Real Android phone:** none available in the sandbox. Borrowed-phone verification (real Bangla rendering, PWA install, standalone launch, slow internet, keyboard, screen lock during a timed mock) is an OWNER-side follow-up, not claimable from here.
- **Signed-in flows:** practice, timed mock, results, MCQ option rows — login-gated, no test account on live. Live has NO published mock definition/manifest, so a real timed mock cannot run on live at all until a Moderator publishes one (data task, not a code gap).
- **PWA install prompt + standalone launch:** cannot be tested headless — OWED, needs real Android Chrome.
- **Timer live scenarios:** refresh restores time (user-visible), lock keeps timer accurate, double-submit race, Firebase-unreachable-during-submit — all need a signed-in session; OWED.
- **Styled signed-in CEO panel:** the CSS now applies (F2 verified in the built CSS), but the styled panel itself has never been rendered — OWED, needs a signed-in owner session.
- **Step 15/16/17/18 pages:** not on main; their rendered checks (admin verification queue + editor, viva/career/CV guides, backup page note) are owed after their deploys.
- **Lighthouse scores:** no audited Lighthouse run in this step — the ChatGPT targets (Performance 85+, Accessibility 95+, LCP <2.5s, INP <200ms, CLS <0.1) are recorded as project targets, not results.
- **SW-update data preservation** (deploy B must not erase cached data/pending answers): not tested — follow-up.
- **Explicit Bangla offline-state messaging:** offline reload verified; a dedicated Bangla offline-state message was not separately verified — follow-up.
- **Correct/incorrect colours not by colour alone:** results page is login-gated — OWED with the signed-in flows.

## 7. Follow-ups (highest first)

1. **F7 — mock resume timer fix** (recommended: offset 0 on resume, or persist the start-time skew) + decide on a deadline check for the session → `submitted` transition (or document the orphan outcome). Verification: 60-min mock, refresh at 20 min → display must show 40. Needs a signed-in mock session; live needs a published mock first.
2. **F5 — chips + small links touch targets** (circulars chips 20px, library links 26px) — layout decision, then re-measure.
3. **F6 — AdSense CSP `connect-src`** — allow the AdSense config fetch or accept the console noise; coordinate with the AdSense review work.
4. **F8 — ad-placeholder strip white in dark mode** (cosmetic).
5. **Rendered checks after the deploys:** Step 15 admin pages, Step 16 guide pages, Step 18 backup-page note, and the Step 19 fixes themselves on live (nav + CEO panel + dark logo) — including the styled signed-in CEO panel.
6. **Borrowed-phone verification** (owner): real Android Chrome — Bangla rendering, PWA install + standalone, slow internet, keyboard, screen lock during a timed mock.
7. **WebKit check** when a binary is available in the sandbox; **Lighthouse run** for the performance targets.
8. **SW-update test** (install A → deploy B → reopen → new version, cached data/pending answers intact).

## Appendix — evidence paths

- Report: `team/job-step19-device-testing-2026-11-23.md` (this file, in the step19 worktree).
- Probe scripts + JSON + logs: `~/workspace/eduorbit/step19/` — `probe_device.py`, `probe_followup.py`, `probe_sw.py`, `probe_nav.py`, `probe_fix_verify.py`, `probe_fix_verify2.py`, `probe_preview.py`, `probe_bangla_pwa.py`, `probe_scroll_bottom.py`; `device-matrix.json`, `device-followup.json`, `sw-activation.json`, `fix-verify.json`, `fix-verify2.json`, `preview-by-content.json`, `bangla-pwa-check.json`, `scroll-bottom.json`, `timer-code-check.md`, `rules-suite.log`, `rules-rerun-5files.log`, `rules-rerun-2files.log`.
- Screenshots: `~/workspace/eduorbit/step19/shots/` — live matrix (56+), `fix-360x800-home-*.png`, `fix2-360x800-home-*.png`, `bangla-360x800-*.png`, `offline-360x800-home.png`, `dark-360x800-home.png`, `scroll-bottom-*.png`.
- Preview: https://eduvelto--step19-device-testing-l5097cin.web.app (expires 2026-11-30 00:22:12 UTC).
- Context received during this step (not in scope, recorded for the record): owner brief 23 Nov 06:21 — SEO Master Plan (113 items) accepted as the governing SEO plan; owner confirmations 06:24–06:25 that exam-taking and reading both require login (hubs public, exam/reading content login-gated — confirms the live state and the LoginWall renders in §1.1).
