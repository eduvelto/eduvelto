# Job Step 20 — Release v0.1.0 — Phases 2–5 Report

**Date:** 24 Nov 2026 · **Branch:** `jobs/step20-release` (final head `ce2e264`, merged to main)
**Release version:** 0.1.0 (owner-confirmed 23 Nov) · **Tag:** `v0.1.0` (pushed to origin)
**Merge:** fast-forward `51b335a` → `ce2e264`, pushed to `origin/main`
**Phase 1 report:** `team/job-step20-phase1-report-2026-11-23.md` ·
**Snapshot record:** `step20-evidence/phase2-snapshot-record-2026-11-24.md` (outside the repo)

## 1. What shipped

Release v0.1.0 = Steps 1–20 live, plus everything else that landed on main during
the day (Welcome Bar v4/v5, homepage redesign, Owner 2FA staging, app-tap
scroll fix, a11y link fix, BottomNav chip cleanup, Android back-button fix).
The Step 20 code change itself is small and isolated:

- **F5 fix (the only Step 20 product-code change):** `.ev-chip-btn` CSS class
  (`src/index.css`, 9 lines) + `className`/`type="button"` on 5 chip call sites
  (`src/pages/JobCircularsPage.tsx`, `src/pages/JobNotificationsPage.tsx`).
  F6 (AdSense CSP) was already in main via the C2 merge; F8 verified, no change.
- **BRT-01 test fix:** hardcoded preflight total 85 → 86 in
  `emulator-tests/backup-roundtrip.test.ts` (see §4 — a real failure, not a flake).
- **Docs:** Phase 1 report, release-notes draft (library counts updated to
  live-verified numbers, offline-cancelled wording, question-bank line corrected
  from "0 questions" to the 35 published BCS English questions), fold-in records,
  evidence files under `team/step20-evidence/`.

Library (live-verified by the 24 Nov export, 7,105 docs): 609 books, 2,307
chapters, 2,307 lessons, 23,812 questions; 35 Published BCS English job
questions; 4 auth users (eduvelto0001–0004).

## 2. Phase 2 — Release preparation

- **Pre-deploy snapshot (scripted live export — SUCCEEDED):**
  `backups/eduvelto-backup-20261124-014508.json`, 57,093,801 bytes, SHA-256
  `eb52c6db7872a60425e1f77e5c0bda4f1cbbc03a2776d82993086993e96986df`,
  exported 2026-11-24T01:45:08Z, 7,105 docs, 84 collections, backupVersion 1,
  exportedBy owner UID `nczNklmktsVrxg43UzcgdSm6v0j2`. NEVER commit to the repo.
  Known gaps (pre-existing): `config` 0 docs (no `config/appVersion` yet —
  Phase 4), `settings` 0, `opportunities` 0 (seeds live in code), sub-collections
  excluded by design.
- **Decisions:** R9/R10 (service worker / Bangla offline message) CLOSED as
  CANCELLED BY OWNER (offline cancelled 23 Nov 19:34; no SW registration;
  `dist/sw.js` stays built but unused; release notes say plainly the app
  cannot be used offline).
- **Export-script parity (BRT-11 drift, found + fixed twice):** the redesign
  coordinator added `newsletterSubscribers` to the shared export script ahead
  of its code merge (broke the suite on main); reverted, then restored once the
  redesign merged (BACKUP_COLLECTIONS 83 → script 85 = collections + 2
  unreadable). A duplicate entry briefly existed (coordinator re-add + Step 20
  re-add); one copy removed, parity re-verified 85 = 85. LESSON: script edits
  must land WITH their code change (rules + BACKUP_COLLECTIONS + script
  together), and a hardcoded count in `backup-roundtrip.test.ts` must move too.
- **Main moved 6 times during Phases 2–3** (v4 → redesign → 2FA → scroll-fix →
  v5 → a11y/BottomNav → back-button); the branch was rebased onto each new HEAD
  in turn (all clean, no conflicts). Final base: `51b335a` (origin/main at merge).
- **Environment:** 4 runtime restarts during the run (02:30, 03:30, ~04:15,
  ~04:35 UTC); each interrupted a running suite/build; branch state survived
  every restart intact; no EPERM recurrence (writes worked throughout).
  `jspdf`/`pdf-lib` were missing from the step20 worktree's node_modules
  (copied from deploy-main's); `@capacitor/app` 8.1.2 likewise (back-button
  merge added it to package.json).

## 3. Verification (final base `51b335a`, branch `ce2e264`)

- **Unit suite:** 1021/1021 passed, 57 files, EXIT 0
  (`step20-evidence/unit-final2-2026-11-24.log`).
- **Typecheck:** `npx tsc --noEmit` EXIT 0 on the final base.
- **Build:** PASSED with the 9 AdSense env vars; chunk `index-Cd3Bwdxx.js`
  (step20 worktree — the deploy-main rebuild produced `index-BELd1yZ_.js`,
  see §5); all 8 slot IDs + client ID in dist; sitemap 74 URLs;
  `ev-chip-btn` in built CSS; PWA precache 173 entries.
- **Rules suite:** full run on the v5 base (1856106): 1238/1242 passed
  (39 files). The 4 failures were fully resolved: 3 were 30s
  "client is offline" timeouts (a1, a2, g1) that passed on targeted retry
  (94/95); the 4th was BRT-01, a REAL failure (see §4). The final base
  (`51b335a`) changes no rules and no rules-tests vs the v5 base (verified
  by diff — only BottomNav/home-redesign.css + App.tsx/nativeBackButton),
  and `firestore.rules` is byte-identical between the two bases, so the
  result transfers. A fresh full run on the final base was attempted twice
  and both times starved by 5+ concurrent coordinator jobs (full rules
  suites, vitest, tsc, npm install) on 1.5 shared CPUs — files skipped
  wholesale (74 + 63 tests) with 10s backend timeouts; those runs produced
  noise, not signal, and were stopped. The targeted batches that DID complete
  under contention all passed. This is recorded honestly here rather than
  claimed as a clean full run on the final base.
- **Rules deploy:** verified no-op — local stripped rules (174,108 bytes)
  byte-identical to live ruleset `a3803c48`; the deploy re-released the same
  ruleset (updateTime 04:47:16Z, name unchanged).
  NOTE: `firebase deploy --only firestore` on the COMMENTED file fails
  (295,440 bytes > 262,144 limit). The deploy MUST use the stripped file:
  temp-swap `firestore.rules.stripped` → `firestore.rules`, deploy, restore
  via `git checkout -- firestore.rules` (verified clean after). The strip
  step (`scripts/strip-firestore-rules-comments.mjs`) is mandatory.
- **Merge:** real merge in scratch worktree `tmp-merge-step20` — clean
  fast-forward `51b335a` → `ce2e264`, no conflicts (never `git merge-tree`).

## 4. BRT-01 — the one real failure (fixed on this branch, commit `ce2e264`)

`backup-roundtrip.test.ts` BRT-01 failed deterministically (full run, targeted
run, AND alone): `expected 86 to be 85`. Root cause: the homepage-redesign
merge added `newsletterSubscribers` to BACKUP_COLLECTIONS (82 → 83) without
updating this test's hardcoded preflight total. Deterministic total is 86
(81 one-doc collections + users 3 + settings 2 + config 1). Fix: test-only
change (85 → 86, 85/500 → 86/500, comment updated). Verified alone: 13/13
passed (`step20-evidence/rules-brt01-fixed-2026-11-24.log`). The earlier
ed447d0-base full run had passed BRT-01 at 85 — that pass was the flake (a doc
missing at count time under parallel-file execution), not the norm.

## 5. Phase 3 — Merge + deploy (24 Nov ~04:43–04:50 UTC)

- Merge: fast-forward deploy-main `51b335a` → `ce2e264`; pushed `origin/main`.
- Rebuild deploy-main BEFORE hosting deploy (with the 9 AdSense env vars):
  PASSED; dist freshness verified — `dist/index.html` references fresh chunk
  `index-BELd1yZ_.js` (written 04:43:42, differs from live `CS2AQpHd.js`);
  all 8 slot IDs + client ID in dist; sitemap 74; `ev-chip-btn` in CSS.
- Rules deploy: stripped-file temp-swap (see §3); "Deploy complete";
  live release still ruleset `a3803c48` (re-released 04:47:16Z).
- Hosting deploy: attempt 1 failed (upload timeout at 0/160 files), attempt 2
  failed (`TypeError: Converting circular structure to JSON` — ProxyAgent,
  the known egress-proxy failure); attempt 3 SUCCEEDED ("version finalized",
  "release complete", "Deploy complete!"). Live site was unaffected by the
  failed attempts (never released).
- Live probe (both domains): chunk `index-BELd1yZ_.js` ✓; HTTP 200 on `/`,
  `/jobs`, `/install` ✓; sitemap 74 URLs ✓; all 8 slot IDs + client ID in the
  live JS chunk ✓; `ev-chip-btn` in the live CSS (`index-DHLkC5VH.css`) ✓.
- Tag `v0.1.0` (annotated) created at `ce2e264` and pushed to origin.
- Pre-deploy live baseline (for rollback): ruleset `a3803c48` (174,108 bytes),
  chunk `index-CS2AQpHd.js`. Rollback: `firebase hosting:rollback` or redeploy
  the previous rules version; snapshot + git tag are the restore points.

## 6. Phase 4 — OWNER publishes v0.1.0 (NOT done — owner-side, one step)

The version gate is failing open by design until the owner publishes. Exact
step for the owner (sign in first — only he can):

1. Sign in to Eduvelto, go to **`/admin/app-version`**.
2. Set **latestVersion `0.1.0`**, **minVersion `0.1.0`**.
3. Paste the Bangla release notes from
   `team/release-notes-v0.1.0-draft-2026-11-23.md` (repo copy — the shared
   `~/workspace/eduorbit/team/` copy was stale and has now been synced from
   it; the draft's question-bank line was corrected 24 Nov: 35 published BCS
   English questions, teacher-submitted bank still empty).
4. Set **downloadUrl `/install`** → **save**.

Safety: minVersion must NEVER exceed the bundled 0.1.0; escape hatches
`/install`, `/login`, `/admin/*` are never blocked; do NOT test the block
screen on live (unit-tested only). Phase 4 is NOT done until verified that
`config/appVersion` exists and the gate reads `current` (bundled 0.1.0 ≥
latest 0.1.0, no block, no update bar).

## 7. Still owed / carried forward (NOT done — record honestly)

- **Phase 4** (above) — owner-side, one step.
- **Signed-in rendered checks** (from Phase 1): Step 15 admin content, Step 18
  backup note, styled signed-in CEO panel, notifications chips — needs owner
  login; no live browser in this session.
- **F7 browser click-through:** 60-min mock, refresh at 20 min → must show
  40 — needs a published mock + signed-in session; live has NO published
  mock; unit + emulator-rules coverage is green.
- **WebKit:** no binary in the sandbox.
- **`apis.google.com` console-error re-check on live after deploy:** needs a
  live browser render; not done in this session.
- **Borrowed-phone real-device check:** owner-side.
- **AQ-7 weak-threshold confirmation** (60% vs 50%/3+ wrong) — owner decision,
  carry forward, never decide silently.
- **Teacher verification one-liners:** bank stays EMPTY (0 verified teachers).
- **2FA decision (owner):** F1 staging is done and merged (TOTP enrollment,
  backup codes, login alerts); project MFA is DISABLED in the console; the
  owner must enable TOTP in Firebase console (first of 12 steps, one at a time).
- **Live AI activation:** needs the owner's Gemini API key (owner-side, Google
  AI Studio) + Cloudflare Worker deploy; no key exists.
- **Full rules suite on the final base:** see §3 — result transfers by
  byte-identical rules + diff-verified test identity; a clean full run was
  blocked by machine contention, not by any failure.
- **`download-live-rules.mjs` hardcodes the old ruleset `e2587147`:** use
  `download-live-rules-a3803c48.mjs` (same script, new name) until the
  hardcoded name is updated.

## 8. Program status

Steps 1–20 COMPLETE (merged + deployed, tag `v0.1.0`). `job-program-status.md`
updated (header, deploy line, Firestore-export bullet fixed — the scripted
export works, F2 + this snapshot prove it — Step 20 CLOSED, carried-forward
items listed). The Job Preparation program is complete; remaining work is
Phase 4 (owner) + the carried-forward items in §7.
