# Job Step 20 — Final Integration + Release Preparation — SCOPING NOTE

**Date:** 23 Nov 2026 · **Scope:** RESEARCH ONLY — no deploy, merge, commit, or code/config change made.
**Author:** scoping subagent (parent orchestrator). **Status:** Step 20 NOT started — no branch, no worktree, no code.

---

## 1. What Step 20 is (authoritative sources)

The ONLY definition of Step 20 in the Job program docs is in the Step 3
architecture doc, §12.2 (time-estimate table):

> | Step 20 | চূড়ান্ত ইন্টিগ্রেশন + রিলিজ-প্রস্তুতি | ১০–১৫ (hours) | সব ধাপের মিলিত যাচাই |

i.e. **Final Integration + Release Preparation — combined verification of
all steps.** Estimate 10–15 h, engine/rules/data-layer only (UI time is in
Step 2 §12, content/question-writing time is separate and NOT in the
estimate).

`team/job-program-status.md` (§"The 20 steps") lists it identically —
"20. Final Integration and Release Preparation" — with no further detail.
No dedicated Step 20 design doc exists, no Step 20 section in the Step 2
design doc, and no "Step 20" / release section in the Master Blueprint
(grep across `~/workspace/eduorbit/*.md` + `team/` finds only the Step 3
table above). The whole-site launch checklist
(`eduvelto-launch-checklist-2026-11-20.md`) is a DIFFERENT, broader gate
list (AdSense, domain/DNS, Privacy Policy, real content) — Step 20 must
NOT absorb it; the launch checklist's per-item owner approvals stay
separate.

### 1.1 What Step 20 IS
1. Combined end-to-end verification of Steps 1–19 **as integrated on main**
   (not per-step in isolation): full rules suite, full unit suite, build,
   preview deploy, route sweep, rendered (Playwright) checks.
2. Close-out / disposition of every carried-forward open item from Steps
   15–19 (see §4) — fix it, or record it as explicitly owed with a reason.
3. Release preparation: version decision, release-notes text, pre-deploy
   snapshot record (tag + live rules version + hosting release + backup),
   merge + deploy of main, live probe, rollback readiness.
4. The release act itself: the owner publishes the first version from
   `/admin/app-version` (§5) — the gate mechanism only becomes live then.
5. ChatGPT second opinion for the step (owner rule 22 Nov 07:27: ChatGPT
   for EVERY step; technical questions only, never private info) +
   USED/ADAPTED/REJECTED fold-in record, per the Steps 4–7 pattern.
6. Program close-out: update `team/job-program-status.md` (STALE — last
   updated 22 Nov ~13:00, still lists Steps 8–20 as "NOT done" although
   8–19 are merged and live) and file the Step 20 report.

### 1.2 What Step 20 is NOT
- No new Job features, no new collections, no new routes (unless
  verification finds a gap — then the fix is scoped, minimal, and
  re-verified like any step fix).
- No content: the question bank stays EMPTY (0 verified teachers, 0
  verified questions). Nothing invented, nothing seeded to live.
- No migration, no billing/Blaze, no spend (৳0 budget stands).
- No written exams anywhere (binding MCQ-only rule).
- No AdSense submission, no DNS/domain change, no Privacy/Terms work
  (separate tracks, separate owner approvals).
- No seed/data application to the live DB (seed JSONs + importers are
  emulator-only, unchanged).

---

## 2. Staging state (verified 23 Nov 2026, read-only)

### 2.1 Branch / worktree — Step 20 does NOT exist yet
- `git branch -a` in `phase2-project-deploy-main`: branches run
  `jobs/step10-result-analysis` … `jobs/step19-device-testing`. **No
  `jobs/step20-*` branch** (local or remote-tracking).
- `git worktree list`: worktrees exist for steps 10–19
  (`phase2-project-step10` … `phase2-project-step19`, plus
  `phase2-project-step19-f7`). **No `phase2-project-step20` worktree.**
- `phase2-project-staging` (`staging/integration`, f593ad4) exists but is
  the filters/cascade integration staging — NOT a Step 20 staging.
- Next run must create: branch `jobs/step20-release` from main + worktree
  `~/workspace/eduorbit/phase2-project-step20` (+ a `tmp-merge-step20`
  worktree for the merge, per the Steps 12–19 pattern).

### 2.2 Main — what is already live
- Main HEAD: `fcc382c` "fix(hosting): add /install to the firebase.json
  rewrite allowlist" (= origin/main).
- All Job Steps 1–19 merged into main (merge commits, newest first):
  step19 `46ec4ab`, step18 `edbb210`, step17 via `6797392`
  (tmp-merge-step17b), step16 `077ff47`, step15 `717433a`, step14
  `1918766`, step13 `31e327a`, step12 `6df278b`, step11 `28bc870`,
  step10 `1692448`, step9 `e92f458`.
- Post-Step-19 batch, all merged + deployed: master quick-wins
  `682e42e`, SEO 79 pages `98b0f88`, F7 timer fix `7840a3c` (merged
  `b27245b`), forced app update `ff68f7b`, founder message `591827e`,
  h1 fix `5a3f90e`, /install allowlist `fcc382c`.
- Last verified test counts on main (from the 23 Nov deploy logs):
  **rules 1162/1162** (33 files, `team/seo-deploy-rules-2026-11-23.log`),
  **unit 791/791** (`team/appupdate-deploy-unit-2026-11-23.log`).
  (Step 19 deploy itself: unit 763, rules 1162 — later batches raised
  unit to 791.)
- **No git tag exists** (`git tag` returns nothing — no `v0.1.0` yet).
  Launch checklist §3 requires tagging the release (e.g. `v0.1.0`) and
  pushing the tag to `EduOrbit/eduvelto`.

### 2.3 Release-related code ALREADY in main
- Forced app update (merged `ff68f7b`, report
  `team/job-forced-app-update-deploy-2026-11-23.md`):
  `src/lib/appVersion.ts`, `src/components/AppVersionGate.tsx` (+
  `AppVersionGate.test.tsx`), `src/pages/AdminAppVersionPage.tsx`,
  `src/lib/admin.ts` (`updateAppVersionConfig`),
  `firestore.rules` config block (lines 4864–4885),
  `src/lib/backup.ts` (`CONFIG_DOC_IDS = ['appVersion']`).
- Bundled version: `APP_VERSION = '0.1.0'` in `src/lib/appVersion.ts`
  = `package.json` `"version": "0.1.0"` (in step — "keep in step" rule).
- PWA install page `/install` exists and is in the `firebase.json`
  rewrite allowlist (HEAD commit `fcc382c`).
- No separate release-notes page; release notes live only as the
  `releaseNotes` field of the `config/appVersion` doc (shown on the
  block screen).

---

## 3. The version gate — confirmed in code

### 3.1 The `/admin/app-version` UI EXISTS in main
- `src/pages/AdminAppVersionPage.tsx` — form for latestVersion /
  minVersion / releaseNotes / downloadUrl; shows the currently published
  values (or empty when nothing published); warns in plain language that
  a minVersion above users' installed version blocks everyone.
- Route: `/admin/app-version` under
  `<Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>`
  (`src/App.tsx:340,350`).
- `AdminGuard` (`src/components/AdminGuard.tsx`): OWNER ONLY —
  `profile?.role !== 'owner'` gets "অনুমতি নেই / Access denied". The
  guard is UX only; the Firestore rules are the real enforcement.

### 3.2 Gate logic (`src/lib/appVersion.ts` + `src/components/AppVersionGate.tsx`)
- Mounted in `App()` (`src/App.tsx:175-177`): on EVERY app load,
  `useAppVersionGate()` fetches `config/appVersion` with
  `getDocFromServer` (NEVER cached — a cached check would defeat the
  block) and calls `checkAppVersion(config, APP_VERSION)`:
  - `config === null` (nothing published yet) → `'current'` — nothing
    enforced.
  - bundled `< minVersion` → `'blocked'`: full-screen "নতুন ভার্সন
    এসেছে" screen replaces the whole app; only a download button
    (lands on `/install`).
  - `minVersion <= bundled < latestVersion` → `'update-available'`:
    non-blocking gold notice bar with an update link.
  - bundled `>= latestVersion` → `'current'`: normal use.
- **"Fails open" — in code, three layers:**
  1. No doc / malformed doc → `fetchAppVersionConfig` returns `null` →
     `'current'`.
  2. Offline / unreachable → `fetch` throws → gate status `'unknown'`
     → user gets in; an `'online'` listener re-checks on reconnect.
     (Also: Firebase not configured → `'current'`.)
  3. Malformed version strings → `compareVersions` returns `0`
     (equal) → never blocks, never forces.
  A typo in the admin form can therefore never lock every user out.
- **Escape hatches** (`isGateExemptPath`, never blocked):
  `/install` (+ subpaths), `/login` (+ subpaths), `/admin/*` — so a
  too-high minVersion is always fixable by the owner from
  `/admin/app-version`.
- Download URL default is `/install` (PWA — there is NO native app,
  no Play Store / APK link; never invent one).

### 3.3 Rules (`firestore.rules` lines 4864–4885, `match /config/{docId}`)
- Read: public, ONLY if `docId == 'appVersion'` (the gate runs before
  sign-in, so even signed-out visitors must read it). Any other config
  docId is denied.
- Create/update: ONLY `isAdmin()` + `docId == 'appVersion'` + fixed key
  set `{latestVersion, minVersion, releaseNotes, downloadUrl,
  updatedAt}` + semver-ish versions + `releaseNotes` string ≤2000 chars
  + `downloadUrl` string, non-empty, ≤500 chars, matches `^(/|https://)`
  + `updatedAt` a real timestamp.
- Delete: `false` (the doc can never be deleted via rules).

### 3.4 Publishing = owner action, no code/deploy
- `updateAppVersionConfig` (`src/lib/admin.ts:1206-1252`) writes ONE doc
  `config/appVersion` + an audit entry (`'app-version-change'`), in one
  write. Saving the form is the whole publish — no build, no deploy.
- **Live state: no `config/appVersion` doc exists yet** (per the task
  brief; the sandbox cannot read the live DB, so the next run must
  confirm by reading the doc from the live site/console). Consequence:
  **the gate is failing open right now — nothing is blocked, and no user
  sees any update bar.** That is by design, not a bug.

### 3.5 Is publishing the first version part of Step 20, or separate?
**Part of Step 20 — as its final owner step.** Reasoning: "Release
Preparation" without a published version releases nothing; the publish
is a 2-minute, no-code owner action and it is the act that makes the
release real. BUT it is strictly sequenced LAST: only after the Step 20
deploy + live verification pass, and only with the version number the
owner chose. It is NOT a precondition for any other Step 20 work (the
gate fails open without it, so verification can proceed before it).
- **Version-number decision (owner, needed before the publish):**
  - RECOMMENDED: stay on `0.1.0` — `latestVersion = minVersion =
    0.1.0`, `downloadUrl = /install`. Bundled version already IS 0.1.0,
    so publishing is a no-op enforcement-wise (everyone is `current`),
    it simply activates the mechanism and proves the publish path.
    Tag the release `v0.1.0` (matches launch checklist §3 example).
  - ALTERNATIVE: bump to a new bundled version (e.g. `1.0.0`) — that
    needs a CODE change (`APP_VERSION` in `src/lib/appVersion.ts` AND
    `package.json` `"version"`, together) + rebuild + redeploy inside
    Step 20 BEFORE publishing. Only if the owner wants a 1.0-style
    number for the public release.
- **Safety warning for the owner (also stated on the page itself):**
  `minVersion` must NEVER be set above the bundled version currently
  live (0.1.0) — every user would get the full-screen block until they
  update. The escape hatches (`/admin/*` etc.) make it recoverable, but
  it must not be tested on live. The block path is already unit-tested
  (`AppVersionGate.test.tsx`); a live block test is NOT part of Step 20.

---

## 4. Carried-forward open items Step 20 must disposition

From the Step 19 report
(`phase2-project-step19/team/job-step19-device-testing-2026-11-23.md`
§7) + earlier steps:

| # | Item | State in main now | Step 20 action |
|---|---|---|---|
| F7 | Timed-mock resume shows FULL duration instead of remaining | **FIXED in main** — commit `7840a3c` (deadline-based timer resume + deadline-checked submit), merged `b27245b`; deploy report `team/job-f7-mock-timer-resume-deploy-2026-11-23.md` | Verify in combined check (60-min mock, refresh at 20 min → must show 40). NOTE: live verification needs a published mock — live has NO published mock definition/manifest, so this check can only run in emulator/preview with a signed-in session; if it cannot run, record as OWED, not as passed. |
| F5 | Chips + small links touch targets (circulars chips 20px, library links 26px; WCAG AA min 24×24) | OPEN, minor | Agent: layout decision + fix, then re-measure; or record as deferred with reason. |
| F6 | AdSense CSP `connect-src` console error on EVERY page (AdSense verification script's config fetch blocked) | OPEN, minor, pre-existing | Agent: allow the AdSense config fetch in CSP, or accept the noise — coordinate with the AdSense review work. |
| F8 | Bottom ad-placeholder strip stays white in dark mode | OPEN, cosmetic | Agent: fix with the ads work, or defer with reason. |
| R5 | Rendered checks owed: Step 15 admin pages, Step 16 guide pages, Step 18 backup-page note, Step 19 fixes on live (nav + CEO panel + dark logo, incl. styled signed-in CEO panel) | OWED | Agent: Playwright rendered verification (skill `playwright_rendered_verification`) on the Step 20 preview + live after deploy. |
| R6 | Borrowed-phone verification (real Android Chrome: Bangla rendering, PWA install + standalone, slow internet, keyboard, screen lock during timed mock) | OWED — **owner-side** | Owner, on his phone. Not a Step 20 blocker; if not done by close, record as owed post-release follow-up. |
| R7 | Lighthouse run (performance targets) | OWED | Agent: run Lighthouse; record as targets-vs-results honestly. |
| R8 | WebKit check | OWED | Agent: only if a WebKit binary is available in the sandbox; else record as unavailable. |
| R9 | SW-update test (install A → deploy B → reopen → new version, cached data/pending answers intact) | OWED | Agent: run on preview (install old build, deploy new, reopen). |
| R10 | Explicit Bangla offline-state message | OWED (offline reload verified; dedicated message not separately verified) | Agent: verify on preview, or record. |
| AQ-7 | Weak-topic threshold: `progress.ts` WEAK_THRESHOLD = 60 vs Step 2 §5 "3+ wrong or accuracy < 50%" | OPEN — **owner confirmation needed** (Step 3 §11.2) | Owner one-line confirmation, or carry forward as a documented open decision. Do NOT decide silently. |
| AQ-13/14/16, AQ-1/2/4/9/10/11 | Answer-hash + anomaly thresholds; external verifier (Cloudflare Worker) evaluation; English question fields; attempt-correction; offline-submit grace (15 min proposal); custom-test sampling; score bands; signed-out circular detail; session-spam limit | OPEN proposals (Step 3 §11.2) | Carry forward as documented open items. AQ-14 evaluation was slated for Step 9 and is still open — Step 20 records it, does not adopt it (needs owner approval + a service-account secret). |
| — | `job-program-status.md` stale (last updated 22 Nov ~13:00; Steps 8–19 unrecorded) | STALE | Agent: update in Step 20 (status + counts + evidence links). |
| — | Production backup / live export | NOT DONE (Step 1 gap; quota-exhausted 22 Nov; in-app export needs owner browser session; Step 18 built emulator-tested backup/restore + `docs/restore-runbook.md`, 76-collection coverage) | Owner-assisted: pre-deploy snapshot per launch checklist §3 (tag + rules version + hosting release + JSON export). Agent records what exists; live export needs the owner session (or an explicitly authorised Admin-SDK run). |

---

## 5. Owner-gated items — complete list (owner ONLY vs agent)

### 5.1 OWNER ONLY (agent cannot do these)
1. **Publish the first version** — sign in as owner → `/admin/app-version`
   → set latestVersion / minVersion / releaseNotes / downloadUrl →
   save. (Route is owner-role-guarded; rules require `isAdmin()`; the
   agent holds no owner credentials.) Recommended values: `0.1.0` /
   `0.1.0` / Bangla release notes / `/install`. AFTER deploy +
   verification only.
2. **Production deploy approval** — separate owner approval for the
   Step 20 deploy (standing rule: surface production deploy, migration,
   DNS, spend, irreversible change, blockers to the owner). Agent
   prepares everything; deploys only after his "koro".
3. **Borrowed-phone real-device check** — on his own Android phone
   (Step 19 follow-up #6). Agent cannot do this from the sandbox.
4. **Owner 2FA decision** — UNDECIDED (per alignment synthesis). Step 20
   does not enable, change, or decide it; flag it to the owner as an
   open security item.
5. **Teacher verification** — owner confirms, with one line each, the
   teachers he knows. Until then the bank stays EMPTY by policy; the
   release ships with honest empty states. Not a Step 20 blocker.
6. **AQ-7 weak-threshold confirmation** (60% vs 50% / 3+ wrong) + any
   other AQ decision he wants to make. One line each; no decision =
   carried forward, not silently decided.
7. **Live Firestore JSON export** (pre-deploy snapshot) — needs his
   browser session (in-app export) or his explicit authorisation of an
   Admin-SDK run. (Agent does the git tag + rules/hosting version
   recording, which needs no session.)

### 5.2 AGENT-DOABLE (no owner session needed)
- Branch + worktree creation, all verification (rules/unit/build/
  preview/routes/rendered checks/Lighthouse/SW-update test), F5/F6/F8
  fixes, release-notes drafting, `job-program-status.md` update, Step 20
  report, merge (after owner deploy approval), rules + hosting deploy,
  live probe, `git tag v0.1.0` + push to `EduOrbit/eduvelto`
  (push access already used for branches), rollback if needed.
- ChatGPT consultation fold-in (parent arranges the consultation, as for
  Step 7; agent folds in USED/ADAPTED/REJECTED with counts).

### 5.3 OUT OF SCOPE for Step 20 (separate tracks, separate approvals)
AdSense submission/activation, DNS/domain changes, any spend, any
migration, written-exam work, new content. (Privacy Policy + Terms pages
already exist in main; submitting anything is still a separate owner
approval.)

---

## 6. Deploy plan for the next run (ordered, with gates)

Follow the established Steps 12–19 deploy pattern (step branch +
worktree → verify → preview → ChatGPT fold-in → tmp-merge worktree with
a REAL merge conflict check — never trust `git merge-tree` preview,
AGENTS.md 22 Nov lesson → rebuild deploy-main + dist-freshness check →
deploy rules BEFORE hosting → live probe).

### Phase 0 — Setup (agent)
0.1 Create branch `jobs/step20-release` from main `fcc382c` + worktree
    `~/workspace/eduorbit/phase2-project-step20`.
0.2 Confirm the live `config/appVersion` state (read the doc from the
    live site/console): expect "does not exist" (fail-open). Record it.
0.3 Ask the owner ONE question (batched): version number for the
    release — stay `0.1.0` (recommended) or bump (e.g. `1.0.0`)? If bump,
    change `APP_VERSION` + `package.json` together in this phase and
    rebuild.

### Phase 1 — Combined verification (the core of Step 20; agent)
1.1 Full rules suite: `npm run test:rules` — **GATE: 1162/1162 or more,
    0 failures** (33 files at Step 19; count may grow with fixes).
1.2 Full unit suite: `npm run test:unit` — **GATE: ≥791 passing,
    0 failures.**
1.3 `npm run build` — **GATE: PASS; dist fresh** (new chunk files
    present — AGENTS.md 23 Nov deploy-main rebuild rule).
1.4 Preview deploy + route sweep (all Job routes, `/jobs/*`, admin
    pages, `/install`, `/admin/app-version`, both domains' paths) —
    **GATE: all routes 200.**
1.5 Rendered checks (Playwright skill): Step 15 admin pages, Step 16
    guide pages, Step 18 backup-page note, Step 19 fixes (bottom nav,
    CEO panel, dark-mode logo, incl. styled signed-in CEO panel) —
    **GATE: no regressions; screenshots filed.**
1.6 F7 resume check in emulator/preview with a signed-in session
    (60-min mock, refresh at 20 min → must show 40) — **GATE: pass, or
    honestly OWED** (live has no published mock; never claim it passed
    on live).
1.7 F5 / F6 / F8: fix (small, low-risk) and re-verify, or record as
    deferred with a stated reason — **GATE: each item has a disposition
    (fixed / deferred-with-reason).**
1.8 Cross-step consistency audit: rulesConfig = 4 verified exams only
    (BCS/Bank/Primary/NTRCA-18th, Bank penalty provisional); bank EMPTY
    with honest empty states; no invented content; Bangla-first
    (English = tab labels only); MCQ-only (no written-exam paths);
    backup coverage still covers every Job collection (76 at Step 18 —
    verify none added since are missed); no secrets in source —
    **GATE: audit note filed, 0 violations.**
1.9 Lighthouse run + SW-update test + Bangla offline-state check —
    **GATE: results recorded honestly (targets vs results, not
    claimed-as-passed).** WebKit only if a binary is available.
1.10 ChatGPT consultation (parent arranges) + fold-in with
     USED/ADAPTED/REJECTED counts — **GATE: verdict "approve" (or all
     required changes done + re-verified).**

### Phase 2 — Release preparation (agent; version decision from Phase 0)
2.1 Draft Bangla release notes (what this release contains: Job Steps
    1–19, 4 verified exams, empty question bank awaiting verified
    teachers, PWA install, forced-update mechanism).
2.2 Pre-deploy snapshot record (launch checklist §3): git tag
    `v0.1.0` (prepared, pushed AFTER owner deploy approval in Phase 3);
    record the currently deployed rules version (console version list)
    + the currently live hosting release + DNS state (no DNS change in
    this step — record only).
2.3 Live Firestore JSON export — owner-assisted (§5.1.7). If the owner
    cannot do it before the deploy window, record explicitly what is
    missing and why, and proceed only with his acknowledgement (the
    Step 18 emulator-tested restore runbook + git tag are the fallback;
    never claim a backup exists that does not).
2.4 Update `team/job-program-status.md`: Steps 8–19 closed with
    evidence, Step 20 in progress.

### Phase 3 — Merge + deploy (OWNER DEPLOY APPROVAL GATE first)
3.1 Merge `jobs/step20-release` into main via a `tmp-merge-step20`
    worktree; run the REAL merge to check conflicts (never trust
    `merge-tree`); resolve by hand if needed.
3.2 Rebuild deploy-main AFTER the fast-forward + dist-freshness check.
3.3 Deploy rules FIRST, then hosting (`firebase deploy --only
    firestore`, then `--only hosting`) — DEPLOY.md order, so the app
    never serves against stale rules.
3.4 Live probe: routes 200 on `eduvelto.web.app` + `eduvelto.com`
    (Job routes, admin, `/install`); Step 19 fixes visible live;
    AdSense intact; no console errors on main flows except the known
    F6 CSP noise if F6 was deferred (dispositioned, not hidden).
    **GATE: live probe green.**
3.5 Push tag `v0.1.0` to `EduOrbit/eduvelto`; record the main HEAD hash.
3.6 Rollback ready throughout: `firebase hosting:rollback` to the
    previous release, or republish the previous rules version from the
    console version list; verify the live site after any rollback.

### Phase 4 — The release act (OWNER, after Phase 3 green)
4.1 Owner signs in → `/admin/app-version` → publishes
    `latestVersion 0.1.0`, `minVersion 0.1.0`, Bangla release notes,
    `downloadUrl /install` → save.
4.2 Agent verifies: read `config/appVersion` (now exists); load the
    live site signed-out — gate status must be `current` (bundled
    0.1.0 ≥ latest 0.1.0), no block screen, no update bar. **GATE:
    published + verified.**
4.3 Do NOT test the block screen on live. (Block path is unit-tested;
    a live block test would lock real users out.)
4.4 Owner borrowed-phone check if he does it the same day; otherwise
    record as owed post-release follow-up (not a blocker).

### Phase 5 — Close-out (agent)
5.1 File the Step 20 report under `team/` (evidence: suite counts,
    build, preview URL, live probe, tag, published version, ChatGPT
    fold-in counts).
5.2 Update `team/job-program-status.md`: **Step 20 CLOSED** with
    evidence; Job program COMPLETE (Steps 1–20); carried-forward items
    listed explicitly (AQ decisions, borrowed-phone if owed, F5/F6/F8
    if deferred, live F7 resume check, AdSense/DNS as separate tracks).
5.3 Report to the parent/owner: what shipped, links, counts, what is
    still owed — nothing claimed that was not verified.

---

## 7. "Step 20 done" — verifiable criteria

1. `jobs/step20-release` merged to main; main HEAD + tag `v0.1.0`
   pushed to `EduOrbit/eduvelto` (verifiable: `git log`, `git tag`,
   GitHub).
2. On the merged main commit: rules suite **≥1162 passing, 0 fail**;
   unit suite **≥791 passing, 0 fail**; build PASS (logs filed).
3. Live probe green: all Job + admin + `/install` routes 200 on both
   domains; Step 19 fixes visible live; AdSense intact.
4. `config/appVersion` published BY THE OWNER and verified live
   (doc readable; gate `current` for bundled 0.1.0; no block, no bar).
5. ChatGPT consultation folded in, counts recorded (USED / ADAPTED /
   REJECTED).
6. Pre-deploy snapshot recorded (tag, live rules version, hosting
   release; JSON export done OR explicitly missing-with-reason +
   owner acknowledgement).
7. Every carried-forward item (§4) has a disposition: fixed +
   re-verified, or explicitly OWED with a reason and an owner (never
   silently dropped).
8. `team/job-program-status.md` updated; Step 20 report filed;
   program marked COMPLETE.

## 8. Evidence index (sources read for this note)
- `team/job-architecture-schema-step3.md` §12.2 (Step 20 definition +
  10–15 h estimate), §11.2 (AQ-1–AQ-16), §12.1 (gap table).
- `team/job-program-status.md` (20-step list; standing rules incl.
  ChatGPT-every-step, ৳0 budget, owner-approval gates; last updated
  22 Nov ~13:00 — stale).
- `phase2-project-deploy-main`: `git log` / `git branch -a` /
  `git worktree list` / `git tag` (empty); `src/lib/appVersion.ts`,
  `src/components/AppVersionGate.tsx`, `src/pages/AdminAppVersionPage.tsx`,
  `src/components/AdminGuard.tsx`, `src/App.tsx`, `firestore.rules`
  (config block), `package.json` (0.1.0), `DEPLOY.md`, `docs/restore-runbook.md`.
- `phase2-project-step19/team/job-step19-device-testing-2026-11-23.md`
  §7 follow-ups (F5/F6/F7/F8, rendered checks, borrowed phone,
  Lighthouse, WebKit, SW-update).
- `team/step19-deploy-rules-2026-11-23.log` (1162 rules),
  `team/appupdate-deploy-unit-2026-11-23.log` (791 unit),
  `team/seo-deploy-rules-2026-11-23.log` (1162 rules),
  `team/job-f7-mock-timer-resume-deploy-2026-11-23.md` (F7 fixed).
- `eduvelto-launch-checklist-2026-11-20.md` §3 (tag/snapshot/rollback)
  + §4 (approval gates) — whole-site scope, NOT Step 20 scope.
- `~/dreams/alignment/derived/ALIGNMENT_SYNTHESIS.md` (owner 2FA
  undecided; no production backup yet; decide-yourself rule with hard
  limits: no spend, no deletions of published content, no
  account-security changes).
