# Job Step 20 — Phase 1 Combined Verification — REPORT

**Date:** 23 Nov 2026 · **Branch:** `jobs/step20-release`
**Worktree:** `~/workspace/eduorbit/phase2-project-step20/` · **Base:** main `5a3f90e` (= origin/main)
**Commit:** `a67591e` (F5 + F6 fixes; rules 0-line diff) · **Mode:** STAGING ONLY — no production
deploy, no merge to main, no tag, no version bump, no live writes, $0 spent.
**Preview:** https://eduvelto--step20-release-yjsbu3be.web.app (expires 2026-11-30 12:50 UTC)

**How this report was produced:** the first Phase 1 coordinator ran 12:28–12:52 UTC and filed
its evidence in the shared `~/workspace/eduorbit/team/` directory, but ended without committing
a report to the branch. This report was written by a resuming run (12:55–13:06 UTC) that
**independently re-verified** the branch — re-running both suites and the build from scratch,
re-checking the preview routes and the served CSP header, and re-confirming the live
`config/appVersion` absence with its own read-only probe — then committed the evidence and
this report to the branch. Nothing in the gate table below is taken on the first run's word
alone: every gate was either re-run here or its evidence files were re-read and spot-checked
against the code and the live preview. (First run 12:28–12:52 UTC; resuming run 12:55–13:06 UTC.)

Scoping note: `team/job-step20-release-scoping-2026-11-23.md` (§6 gates 1.1–1.10).

## Phase 0 — Setup

- Branch `jobs/step20-release` + worktree created from main `5a3f90e`. `node_modules` symlinked
  to `phase2-project/node_modules` (Step 17 pattern).
- **Live `config/appVersion`: CONFIRMED ABSENT — twice.** First run (scripted Firestore REST
  read) returned HTTP 404; the resuming run re-confirmed it with its own read-only probe
  (`team/step20-evidence/check-appversion-live.mjs`, CLI refresh token → oauth2 token held in
  memory only, GET of the single document) — **HTTP 404 again**. Gate failing open by design,
  as expected. No live writes made by either run.
- **Version: 0.1.0** — `APP_VERSION = '0.1.0'` = `package.json` 0.1.0, in step. No bump.
  Owner version decision (stay 0.1.0 vs bump) still open for Phase 2/3.
- **Correction to the brief:** the JRE path given in the task brief (`~/.jdk/...`) does not
  exist. The JRE actually used is `~/workspace/.jdk/jdk-17.0.21.1+2-jre/bin`
  (Temurin 17.0.21.1+2), with `JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"`.

## Gate results

| Gate | Result | Evidence |
|---|---|---|
| 1.1 Rules suite | **PASS 1196/1196** (36 files, exit 0, second full re-run) — first full re-run hit 1 cold-start flake, clean on re-run | See §0 below. |
| 1.2 Unit suite | **PASS 791/791** (37 files) | Independently re-run on the branch (exit 0, ~17 s). Same count as the commit message. |
| 1.3 Build | **PASS** | Independently re-run (`tsc -b && vite build`, exit 0); dist rebuilt 13:02 UTC; `ev-chip-btn` present in built CSS/JS (6 occurrences); `adtrafficquality` correctly absent from dist (CSP is a hosting header, not a bundle asset — verified in `firebase.json:25` and in the served header, gate 1.4). |
| 1.4 Preview + routes | **PASS 49/49 routes 200 (first run); independently re-checked 32/32 + /asdfgh 404** | Preview `step20-release` (one stale channel `step6-foldin2` deleted for the 51-channel quota, same precedent as the H1 run). Resuming run curled 32 key routes (12 + 20): all 200; `/asdfgh` real 404. Sitemap 79 URLs. The served CSP header on the preview contains `https://*.adtrafficquality.google` in script-src, img-src and frame-src, plus `https://www.google.com` in frame-src — the F6 fix is actually live on the preview. |
| 1.5 Rendered checks | **PASS (guest)** | Real Chromium via CONNECT relay (127.0.0.1:18099; `domcontentloaded` + `wait_for_selector`, never `networkidle`). Evidence re-read and spot-checked: 18/18 routes 200, all h1=1 with correct texts (`/jobs` "চাকরির প্রস্তুতি — এক জায়গায়", `/jobs/bcs`, `/jobs/common`, `/jobs/viva`, `/jobs/career`, `/jobs/cv`, `/jobs/circulars`, `/founder`, `/install`, …). `/admin`, `/admin/app-version`, `/admin/backup`, `/ceo` correctly show "অনুমতি নেই" for guests. Mobile 390px: bottom nav renders, 5 buttons white-on-dark, readable (F1 fixed — screenshot `mobile-jobs-nav.png`). Dark mode: header logo `/logo-white.png`, transparent backgrounds, body `rgb(15,27,36)` — no white box (F3 fixed). SIGNED-IN flows still OWED (Step 15 admin content, Step 18 backup note, styled signed-in CEO panel) — needs owner login (R5 partial). |
| 1.6 F7 resume check | **VERIFIED (unit + emulator rules + wiring); browser click-through OWED** | `mockTimer.test.ts` has 15 tests incl. the exact scenario (60-min mock resumed at 20 min → remaining 40 min) — all PASS within the 791. `JobMockPage.tsx` wires it correctly (offset 0 on resume via `resolveExamClockOffsetMillis`, deadline authoritative). The deadline/resume logic is also covered by `emulator-tests/rules-job-mock-timer-resume.test.ts` (17 emulator tests, 60-min BCS mock fixture) inside the rules suite. A browser click-through was NOT run: no published mock exists live, and a preview click-through would need a signed-in session + seeded mock — not done. Recorded OWED per the scoping note's own gate wording, not claimed as passed. |
| 1.7 F5 / F6 / F8 | **F5 FIXED + verified; F6 FIXED + verified; F8 VERIFIED** | See §1 below. |
| 1.8 Cross-step audit | **PASS — 0 violations** | `team/step20-cross-step-audit-2026-11-23.md`. (a) rulesConfig exactly 4 exams (BCS/Bank/Primary/NTRCA-18th, Bank penalty provisional). (b) Question bank EMPTY, honest Bangla empty states. (c) Bangla-first (English = tab labels only). (d) MCQ-only for the Job program — pre-existing exception OUTSIDE Job scope recorded: the legacy academic engine still serves 204 live written exams; removal is a separate owner decision. (e) Backup coverage: 88 rules collections = 82 in BACKUP_COLLECTIONS + 6 reasoned exclusions; only collection added since Step 18 is `config`, and it IS covered doc-by-doc. (f) No secrets in src (only the public-by-design Firebase web config). |
| 1.9 Lighthouse / SW / offline | **DONE, recorded honestly — plus one NEW root cause found on resume (R9)** | `team/step20-lighthouse-2026-11-23.md` + `team/step20-evidence/`. See §2 below. |
| 1.10 ChatGPT fold-in | **SLOT LEFT OPEN** | Parent arranges the consultation (subagents have no live browser). Nothing folded in yet. |

## §0 — Rules suite re-run: the 1195/1196 flake, in full

The commit message claims "rules 1196/1196 (run on main-identical code before the fix)". The
independent re-run on the branch (with the fix, which touches no rules) did **not** reproduce
1196/1196 on its first full run:

- **Full run 1: exit 1 — 1,195 passed / 1 failed of 1,196** (36 files, ~303 s).
  The single failure: `emulator-tests/rules.test.ts > (a1) unauthenticated read of a preview
  lesson is ALLOWED, non-preview Published lesson DENIED` —
  `FirebaseError: Failed to get document because the client is offline.` The log shows the
  Firestore client reporting "Could not reach Cloud Firestore backend. Backend didn't respond
  within 10 seconds" — a cold-start emulator connectivity flake on the suite's first test,
  **not a rules denial**. The other 78 tests in the same file passed, including (a2) on the
  same lesson-read path.
- **Single-file re-run of `rules.test.ts`: exit 0, 79/79 passed including (a1)** (~50 s).
- **Full run 2 (resuming run, after the single-file re-run): exit 0 — 1,196 passed / 0 failed
  of 1,196** (36 files, ~197 s). The flake did not reproduce.
- The 509 "evaluation error / 1000 expressions" lines in the logs are the known fail-closed
  F9 behaviour on denied paths, not failures.

**Verdict:** no rules failure exists in the branch. The headline stands at **1196/1196**
(second full re-run, exit 0). The first run's 1195/1196 is recorded honestly here as a
cold-start emulator flake (first test, backend unreachable within 10 s; passed 79/79 on
single-file re-run and 1196/1196 on the full re-run), not a rules failure — but it is a
reminder that the suite's cold start can flake, so a single full-run number should not be
quoted without its re-run.

## §1 — F5 / F6 / F8 dispositions

**F5 — FIXED in branch `a67591e`, rendered-verified.** The scoping child found 4 chip buttons;
the coordinator found a 5th (the "শুধু যাচাইকৃত / Verified only" chip, `JobCircularsPage.tsx:307`).
Fix: new `.ev-chip-btn` class (`all: unset; inline-flex; min-width/min-height: 24px`, centred)
in `src/index.css`, applied to all 5 chip buttons (circulars ×4, notifications ×1). Inline text
links (retry/dismiss) left as-is — pass/exempt. Re-verified on the redeployed preview:
**21/21 circulars chips measure ≥24×24** (smallest 'সব' exactly 24×24; evidence re-checked:
min width 24, min height 24 across all 21). Notifications chips could not be measured as guest
(page is login-gated) — same class/code, render OWED until signed-in. Library links (26px)
deferred as planned (44px needs a full-card-link restructure). The resuming run confirmed the
diff by hand (`git show a67591e`): exactly the 5 call sites + the CSS rule, nothing else.

**F6 — FIXED in branch `a67591e`, console-verified 0 errors — with a correction to the record.**
The scoping note (§4) and the Step 19 report called F6 "OPEN, connect-src". The `7840a3c` fix
had indeed added `*.adtrafficquality.google` to **connect-src only** — but the AdSense sodar
flow (`ep2.adtrafficquality.google/sodar/sodar2.js`) was blocked in **three** directives, found
one layer at a time by re-probing after each fix:
1. `script-src` blocked sodar2.js → added `https://*.adtrafficquality.google` to `script-src`.
2. `frame-src` then blocked the sodar + recaptcha frames → added `https://*.adtrafficquality.google`
   + `https://www.google.com` to `frame-src`.
3. `img-src` then blocked the sodar pixel (`ep1.adtrafficquality.google/pagead/sodar?...`) →
   added `https://*.adtrafficquality.google` to `img-src`.
Final state on the preview: **console errors 0, CSP mentions 0, CSP-blocked requests 0**
(short dwell and 15 s dwell). Remaining "failed requests" are `net::ERR_ABORTED` navigation
artifacts (Firestore Listen stream + sodar/recaptcha frames aborted by page navigation), not blocks.
The resuming run independently confirmed the fix is served: the preview's `Content-Security-Policy`
response header contains the new hosts in script-src, img-src and frame-src.
One open follow-up: Lighthouse-on-live also flagged `https://apis.google.com/js/api.js`
(Firebase vendor bundle's gapi loader) violating `script-src` — this did **NOT** reproduce on
the preview with a 15 s dwell (0 console errors), so nothing was added for it. Re-check the
console on LIVE after the Step 20 deploy (Lighthouse re-run); if it persists live, it needs
its own investigation — do not expand `script-src` speculatively now.

**F8 — VERIFIED (already fixed in main by `7840a3c`).** Dark-mode override for the ad placeholder
exists; on the preview in dark mode the two `[data-ad-preview]` strips render with transparent
backgrounds (`rgba(0,0,0,0)`) — no white strip. (Correction: the scoping child wrote
"AdPlaceholder.tsx is unused" — the placeholder elements DO render on the homepage; the
rendered result is what matters and it is correct.) Master ad switch is OFF, so no real ad
renders anywhere.

## §2 — Lighthouse / SW-update / offline (gate 1.9, live site)

Full report: `team/step20-lighthouse-2026-11-23.md` (Lighthouse 13.6.0, mobile emulation,
simulated slow 4G, one run per page).

| Page | Perf | A11y | Best practices | SEO |
|---|---|---|---|---|
| `/` | 25 | 100 | 92 | 100 |
| `/jobs` | 3 | 96 | 92 | 100 |
| `/jobs/bcs` | 8 | 96 | 92 | 100 |
| `/library` | 22 | 94 | 92 | 100 |
| `/about` | 28 | 95 | 92 | 100 |

No numeric target exists in the scoping note, so **no pass/fail is claimed**. On Lighthouse's
own scale every page's performance is "poor" (0–49): CLS 0.57–0.80 (good ≤0.1), LCP 3.1–14.2 s
(good ≤2.5 s), TTI 9.2–18.1 s; Job pages worst. A11y 94–100, SEO 100 everywhere. Best
Practices 92 on all pages, driven by `errors-in-console` + `inspector-issues` — the console
errors included the F6 CSP violations (now fixed in the branch, not yet live) plus
`ERR_CONNECTION_CLOSED` (×2 on `/`) and an `Uncaught (in promise) undefined` (on `/`).
Recurring opportunities: unused JS ~190 KiB, unminified JS ~27 KiB, unsized images
(header logo named as a likely CLS contributor), image savings ~626–690 KiB.
**Performance work is NOT in Step 20 scope** — recorded honestly for the roadmap; Step 20 does
not claim a performance pass.

- **R10 Bangla offline message — NOT PASSED / still owed.** No dedicated Bangla offline message
  exists: offline reload/navigation shows only the browser's generic error page
  (`ERR_INTERNET_DISCONNECTED`); dropping the network while loaded shows no banner/toast at all.
- **R9 SW-update test — OWED, with a NEW root cause found on resume:** 0 service-worker
  registrations found on the live homepage in a fresh profile — and the resuming run found
  WHY: the build generates `dist/sw.js` (precache 151 entries, `vite.config.ts`
  `registerType: 'autoUpdate'`, injectManifest `src/sw.ts`), but **nothing in the app ever
  registers it** — there is no `virtual:pwa-register` / `registerSW` import anywhere in
  `src/` or `index.html`. The SW is built but never installed, so there is no SW to update
  and no offline capability at all. Fixing that means adding the registration call — a small
  code change with real behaviour implications (the SW would then actually install on users'
  devices). It was NOT done in Phase 1 (verification only); it is a fix-or-defer decision
  for Phase 2/3. The release-notes draft was corrected on this point: its "অফলাইনে খোলা পাতা
  আবার দেখা যায়" line was removed and "অফলাইনে ব্যবহার এখনো চালু হয়নি" added to the
  "যা নেই" section, because the offline claim was false while no SW registers.
- **R8 WebKit — UNAVAILABLE.** No WebKit binary in the sandbox (`~/.cache/ms-playwright/` has
  Chromium only); `playwright.webkit.launch()` fails. Recorded as unavailable, none claimed.

## Carried-forward / still owed after Phase 1

- Signed-in rendered checks (Step 15 admin content, Step 18 backup note, styled signed-in
  CEO panel, notifications chips) — needs owner login.
- F7 browser click-through (60-min mock, refresh at 20 → must show 40) — needs a published
  mock + signed-in session; unit + emulator-rules coverage is green.
- R10 Bangla offline message — needs to be built (depends on SW registration, R9).
- R9 SW-update test — blocked on the missing SW registration call (root cause found this run;
  fix-or-defer decision for Phase 2/3, not silently fixed in Phase 1).
- WebKit — no binary in sandbox.
- Performance (Lighthouse perf 3–28, CLS 0.57–0.80) — roadmap item, not a Step 20 gate.
- `apis.google.com` console error seen by Lighthouse-on-live — re-check live after deploy.
- ChatGPT consultation + fold-in — parent to arrange; slot open in §6 gate 1.10.
- `job-program-status.md` update (Phase 2.4) — stale lines S1–S9 with proposed corrections are
  in the audit file; file itself NOT edited in this run.
- "2,307 chapters" is UNCONFIRMED (verified on-disk floor: 609 books / **2,109** chapters /
  20,970 questions). The release-notes draft uses the verified floor.
- Owner-gated items unchanged from the scoping note §5: publish first version 0.1.0 at
  `/admin/app-version` (after deploy + verification), deploy approval ("koro"), borrowed-phone
  real-device check, 2FA decision, teacher one-liners, AQ-7 threshold, live export for snapshot.

## Evidence index

- This report: `team/job-step20-phase1-report-2026-11-23.md`
- Scoping note: `team/job-step20-release-scoping-2026-11-23.md`
- Cross-step audit: `team/step20-cross-step-audit-2026-11-23.md`
- F5/F6/F8 dispositions: `team/step20-f5-f6-f8-dispositions-2026-11-23.md`
- Release notes draft: `team/release-notes-v0.1.0-draft-2026-11-23.md`
- Lighthouse + offline + WebKit: `team/step20-lighthouse-2026-11-23.md`, raw data in
  `team/step20-evidence/`
- Rendered checks: `team/step20-rendered/step20-preview-rendered.json` (18 routes),
  `step20-f5-f6-f8-verify.json`, `step20-apis-probe.json`, screenshots in the same dir
- Independent re-verification logs (this run): `team/step20-evidence/verify-rerun-2026-11-23/`
  (`unit.log`, `rules.log`, `rules-a1-rerun.log`, `rules-rerun2.log`, `build.log`) — on disk
  in the worktree (and in the shared `~/workspace/eduorbit/team/` copy); `.log` files are
  untracked per the repo's `*.log` gitignore, like all other suite logs in this project.
- Live `config/appVersion` probe (read-only): `team/step20-evidence/check-appversion-live.mjs`
- Preview: https://eduvelto--step20-release-yjsbu3be.web.app (expires 2026-11-30 12:50 UTC)
- Branch: `jobs/step20-release` @ `a67591e` (4 files, +15/−6 vs main `5a3f90e`; rules 0-line diff)

## What blocks Phase 2/3

Nothing in Phase 1 failed (one rules-suite cold-start flake, clean on re-run — see §0).
Phase 2 (release prep) needs: the owner version decision (0.1.0 recommended), the ChatGPT
fold-in, the `job-program-status.md` update, the SW-registration fix-or-defer decision, and
the pre-deploy snapshot record (live export is owner-assisted). Phase 3 (merge + deploy)
needs the owner's deploy approval ("koro") and the tmp-merge-step20 real-merge conflict check.
Phase 4 (owner publishes first version) follows deploy + live verification.
