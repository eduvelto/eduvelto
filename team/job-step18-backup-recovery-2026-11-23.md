# Job Step 18 — Backup/Recovery Testing — Report

**Date:** 2026-11-23 · **Branch:** `jobs/step18-backup-recovery` · **Base:** main `1918766` (Step 14 live)
**Worktree:** `~/workspace/eduorbit/phase2-project-step18/` · **Status:** CLOSED IN STAGING — report + commit + push are this document's close-out. No deploy, no merge to main, no live Firestore reads or writes, $0 spent.

## 1. Spec and assumptions

The Step 18 spec in the Job program design docs is thin: the architecture doc `team/job-architecture-schema-step3.md` §9 defines the backup *design* (client JSON export, BACKUP_COLLECTIONS, no restore button, console/Admin-SDK restore), and the Master Project audit finding **H4 / SEC-002** states the gap — *no production backup + no restore test*. There is no step-by-step Step 18 spec in the design docs, so the test scope was defined from the verified facts in the task brief and stated here:

- Two export paths exist: (1) in-app client-side owner-only JSON export (`src/lib/backup.ts`, paginated 500/page, Step-1 preflight count first, typing `EXPORT` required when over half the quota, route `/admin/backup`, owner-only via AdminGuard, **no restore button by design**, subcollections excluded by design); `validateBackup()` / `restoreBackup()` iterate BACKUP_COLLECTIONS. (2) Scripted REST fallback `~/workspace/eduorbit/backups/export-full-rest.mjs` (outside the repo) producing the same JSON format.
- Production export FAILED 21:16 on HTTP 429 (quota exhausted, ~3,529 docs read, NO file written); retry is owned by the runonce job Mon 23 Nov ~14:30 Asia/Dhaka, which also does class-stats activation + public-IDs deploy/backfill. Production has ~7,100 docs.
- Rules-size gate: compiled rules on main ≈ 255,920 / 256,000 (margin ~80 bytes). Step 18 proves **no rules change is needed** — `firestore.rules` is untouched (0-line diff), so no strip/probe was required.
- Rendered (Playwright) checks: sandbox proxy down — recorded as OWED, never as passed. A preview deploy + BY-CONTENT check was done instead (§5).

## 2. What was built

| # | Item | Files | Result |
|---|------|-------|--------|
| a | BACKUP_COLLECTIONS completeness / coverage-drift test | `src/lib/__tests__/backup.test.ts` | PASS — see §3 |
| b | Backup-format validation tests | `src/lib/__tests__/backup.test.ts` | PASS — 28 tests |
| c | Round-trip restore tests (emulator, disposable data only) | `emulator-tests/backup-roundtrip.test.ts` | PASS — 12/12 |
| d | Restore authorization tests | `emulator-tests/backup-roundtrip.test.ts` | PASS |
| e | Preflight + over-half confirmation flow tests | `src/lib/__tests__/backup.test.ts` | PASS (static/UI invariants; see honest limits) |
| f | Scripted exporter format-parity test | `src/lib/__tests__/backup.test.ts` | PASS (list parity + `dec()`; see §6 BRT-11) |
| g | Written restore runbook, procedure tested in emulator | `docs/restore-runbook.md` | DONE — 274 lines |

### 2.1 Coverage: BACKUP_COLLECTIONS 46 → 76

`src/lib/backup.ts` now lists **76 collections** (+31 vs the live 46):

- **Job 8** — jobCategories, jobExams, jobSubjects, jobChapters, jobTopics, jobLessons, jobExamDefinitions, jobQuestionSetManifests.
- **NU 19** — nuSubjects, nuChapters, nuTopics, nuLessons, nuQuestions, nuQuestionBundles, nuQuestionKeys, nuQuestionDraftKeys, nuExamConfigs, nuCircularConfigs, nuCalendarEvents, nuFacts, nuGroups, nuInstitutions, nuNotices, nuPublications, nuCorrections, nuReports, nuReviews.
- **Admin/contact/health 4** — teacherChangeRequests, contactMessages, doctors, supportMessages.

New supporting structures in `backup.ts`:

- `BACKUP_EXCLUSIONS` (6, each with a written reason): jobReceipts, quizReceipts, nuReceipts (10-minute tokens); jobExamUserLocks (transient); directMessages, follows (owner cannot list-read — see F-3).
- `BACKUP_CLIENT_UNREADABLE` = `['directMessages', 'follows']` — script/console only.
- `BACKUP_KNOWN_PENDING` (5): jobReports, jobCorrections, circularHistory, approvedDomains (Step 15, staging) + `counters` (public user IDs, merges in the 14:30 cron). The drift test asserts these are **still absent**, so the note cannot go stale silently.
- `SETTINGS_DOC_IDS` = `['features', 'ads']` + `readSettingsDocs()` — settings is read doc-by-doc because the rules have no collection-level match (finding F-2).
- `follows` REMOVED from the list (finding F-3).
- Header comment updated (76 collections, settings doc-by-doc, follows/directMessages script-only).

### 2.2 Scripted exporter synced (outside the repo — NOT in this commit)

`~/workspace/eduorbit/backups/export-full-rest.mjs` COLLECTIONS synced to **78 = 76 + follows + directMessages**. **It was missing `circulars` until Step 18 — the 22 Nov scripted exports silently omitted every published circular.** Stale comments fixed (~7,092 docs figure, 45-count-query note). Flagged prominently because this file is the tool the 14:30 cron runs and it will NOT be in the git commit.

### 2.3 `.gitignore` + AdminBackupPage honesty note

- `.gitignore` gained `eduvelto-backup-*.json` + `**/eduvelto-backup-*.json` — a real production backup file can never be committed to the public repo.
- `src/pages/AdminBackupPage.tsx`: 3-line honesty note under the collection checkboxes — follows + directMessages are only available via script/console export. This is the ONLY user-facing code change in Step 18.

### 2.4 Restore runbook — `docs/restore-runbook.md`

Two export methods + their differences, the backup format, inventory (76 + 2 + 6 excluded + 5 pending + 17 subcollections), where backups live + who may touch them, triage & freeze, validation (complete vs incomplete policy), Procedure A (targeted JSON restore via client SDK), Procedure B (console native export/import — **NOT interchangeable with custom JSON**), Procedure C (Admin-SDK full restore — **NOT built yet**, follow-up), verification checklist, incident-log template, follow-ups, production safety boundary.

## 3. Verification numbers

| Gate | Result |
|------|--------|
| Build (`npm run build`) | **PASS** |
| Unit suite (`npm run test:unit`) | **29 files, 694/694 PASS** (666 baseline + 28 new in `src/lib/__tests__/backup.test.ts`) |
| Emulator backup suite | **12/12 PASS** (~29 s) — `emulator-tests/backup-roundtrip.test.ts` |
| Full rules suite (`npm run test:rules`) | **30 files, 1,056/1,056 PASS** (1,044 baseline on main 1918766 + 12 new; second run, exit 0; log `~/workspace/eduorbit/step18-rules-full.log`) |
| `firestore.rules` diff vs main | **0 lines** — no rules change, no probe needed; the ~80-byte compiled margin is intact |
| Preview deploy + BY-CONTENT check | **PASS** — https://eduvelto--step18-backup-recovery-mbafoybf.web.app (expires 29 Nov 23:46 UTC); main bundle `index-ChLSF5Gi.js` md5 `b3937093…` = dist; `AdminBackupPage-BA4kSoNS.js` md5 `99388e8b…` = dist and contains the new note text (`"Two collections are not listed here"` ×1, `"follows ও directMessages"` ×1). One superseded merge preview channel (`step10-merge-e365201`) was deleted first to free a quota slot (50-channel limit reached). |
| Rendered (Playwright) check | **OWED** — sandbox proxy down; a bundle-content check is not a render |
| Live Firestore reads/writes | **0** — all testing in the emulator |
| Spend | **$0** |

### 3.1 Unit tests — `src/lib/__tests__/backup.test.ts` (28 tests, 377 lines)

- **Drift test:** every rules collection ∈ list ∪ exclusions; every list entry is a real rules collection except `settings`; no duplicates/overlap; every exclusion has a reason; `BACKUP_KNOWN_PENDING` still absent. The inventory is grounded in the rules file's 81 unique top-level `match` collections, not the arch-doc list.
- **validateBackup fixtures:** valid; non-object; **empty file rejected**; wrong app; missing/unsupported version; missing/invalid `exportedAt`; missing header/data; header-count mismatch/truncation; duplicate ids; missing id; unknown collection; non-object data.
- **downloadBackup split:** ≤10,000 docs one file; >10,000 one file per collection (DOM-stubbed).
- **friendlyAdminError known-gap test** (F-1): documents the current behaviour.
- **UI invariants:** no `restoreBackup` import/handler on the page; "no Restore button" text; preflight-first gate; EXPORT gate; sub-collection honesty text.
- **Scripted-exporter parity:** script list == BACKUP_COLLECTIONS + CLIENT_UNREADABLE; BackupFile format markers; `dec()` **extracted from the shipped script** and tested for timestamp/geopoint/int/double/bool/string/null/array/map/reference.

### 3.2 Emulator round-trip — `emulator-tests/backup-roundtrip.test.ts` (12 tests, 540 lines)

- **Settings list/count denial probe (owner) + single-doc reads work** (F-2 proof).
- **Owner export coverage:** preflight total **79 docs** (74×1 + users×3 + settings×2); all 76 collections present.
- **Round-trip notices + circulars:** 3 notices with Timestamp/GeoPoint/nested map/array/null/bool/numbers + 2 draft circulars; export → validate → wipe → restore → **deep-equal, timestamp-aware**.
- **Pagination:** 1,250 notices, 500 games, 501 circulars — exact counts, unique ids (500/501 page boundaries exact).
- **Idempotency:** restore 3× stable; stale edit overwritten.
- **Merge semantics:** DB A,B,C + backup A,B,D → **C remains — restore is a merge, never a replacement/rollback**.
- **Subcollection boundary:** users/u1/jobAttempts + posts/p1/comments NOT in the JSON.
- **Export authz:** guest + student denied, owner allowed.
- **Restore authz:** student restore 0 succeeded, nothing written.
- **Deleted published jobQuestion restore FAILS for the owner** (proves the documented limit: client restore cannot recreate deleted docs).
- **directMessages owner list denied** (F-3 proof).
- **Invalid file rejected before any write** (pre-existing doc untouched).

## 4. Findings (all emulator-proved)

### F-2 — settings: collection list/count is DENIED for the owner (fixed in code)

A collection list/count query on `settings` is denied for the owner (`false for 'list' @ L4612` catch-all) because the rules have only single-doc matches (`/settings/features`, `/settings/ads`); single-doc reads work. Fixed doc-by-doc in `backup.ts`. **Note: this likely explains the owner's 21:05 phone preflight failure** (REST counts worked 21:07 because REST bypasses rules).

### F-3 — follows: owner cannot list-read it (excluded; owner decision owed)

The read rule is follower-only with no staff tail, so an owner list/count is denied; the in-app export could never export it. Moved to exclusions. **Granting the owner read over everyone's follow graph is a privacy decision for the owner** (one-line rules tail `|| isAdmin()` if he wants it). Data is NOT lost — the scripted export covers it.

### F-1 — friendlyAdminError matches on `error.message`, not `error.code` (documented, NOT fixed)

The `permission-denied` map entry is dead for real Firebase errors (the code lives in `error.code`), so the owner sees the generic "কিছু একটা ভুল হয়েছে।" Test documents the current behaviour. Fix (prefer `error.code`) is a follow-up — per the brief ("test and report, do not silently fix").

### Corrections to earlier notes

- **Nav-gap note was STALE:** `/admin/backup` IS linked — /admin → Settings card → /admin/settings → link to /admin/backup (also from CeoSettingsPage). It is not in the main admin sidebar, but it is reachable in two clicks.
- **Arch doc §9.1 list is partly aspirational:** `jobMocks`, `jobCalendarEvents`, `jobCurrentAffairs`, `jobNotifications`, `jobAnalyticsAggregates`, `jobWrongAnswers`, `jobFavorites`, `jobPlanner`, `jobRevisionSchedule` are NOT Firestore collections on main (`jobMocks` is a TS module name; notifications/wrong-answers/planner are derived/client-side). The drift inventory is grounded in rules matches (81 unique top-level collections), not the arch-doc list.
- **`counters` must join BACKUP_COLLECTIONS at the public-ID merge** (loss = duplicate public IDs) and leave `BACKUP_KNOWN_PENDING`, or the drift test goes red.

## 5. Multi-AI fold-in

### 5.1 Gemini — https://gemini.google.com/app/b9f3ae70dc934af6

| # | Gemini item | Verdict | Reason / evidence |
|---|-------------|---------|-------------------|
| 1A | Round-trip tests incl. edge-case types + subcollection boundary | USED | 12 emulator tests (§3.2): timestamps, GeoPoint, nested maps/arrays, nulls, bools, numbers, auto/custom IDs; subcollection boundary asserted explicitly |
| 1B | Idempotency (restore 2×, no duplicates, stale edits overwritten) | USED | Restore 3× stable; stale edit overwritten (test exceeds the suggested 2×) |
| 1C | Corrupt & partial handling; validate rejects BEFORE mutating; document mid-run error behaviour | USED / ADAPTED | Validation-rejects-before-write PROVED by test (invalid file, pre-existing doc untouched). Mid-run write-failure behaviour is DOCUMENTED in the runbook (re-run; restore is idempotent so a re-run is safe) rather than fault-injected in the emulator |
| 1D | Coverage-drift static check + preflight/paging boundaries 0, 1, 499, 500, 501, 1,250 | USED / ADAPTED | Drift test USED, grounded in the rules file as the independent source. Paging verified at 500/501/1,250 docs; exact 0/1/499 boundaries NOT separately exercised (honest limit, §7) |
| 1E | Restore authz (unauthenticated / non-owner denied, owner allowed) + UI invariant (no restore button) | USED | Guest + student export denied, student restore 0 succeeded; UI invariant tests assert no restore handler/button |
| 1F | Zero-cost restore runbook (triage/freeze, paths, preflight/quota, execute/verify, smoke check, incident log) | USED | `docs/restore-runbook.md` follows this shape exactly |
| 2 | MUST NOT DO: no live restore tests, no live read loops, no restore button, subcollections not a defect, never commit backup files | USED | All respected: 0 live reads/writes; no restore button added; subcollection exclusion documented as design boundary; `.gitignore` backup guard added |

### 5.2 ChatGPT — https://chatgpt.com/uc/6b037963-8d50-83ea-ac0b-19d4ebdb8edd

**Key distinction adopted as a standing rule: backup validity ≠ recovery validity.** A backup is not recovery-tested merely because `validateBackup()` succeeds. The two statuses are tracked separately in this report and in the runbook; the post-14:30-cron follow-up (§8) is what establishes *recovery validity* for a real production backup.

| # | ChatGPT item | Verdict | Reason / evidence |
|---|--------------|---------|-------------------|
| 1 | Six objectives (coverage, validate+restore, no duplicates, invalid rejected, drift, human-followable procedure) | USED | Framing for the test plan; each objective has a passing test or a documented limit |
| 2 | Test matrix (round-trip, fidelity, pagination, empty, idempotency, corrupt, partial, schema, drift, authz, runbook) | USED | All rows covered except the empty-collection round-trip (see row 3) |
| 3 | Round-trip detail: >500 docs in one collection, varied types, unusual-but-valid IDs, an empty collection, optional fields; compare CONTENTS not counts; subcollection exclusion explicit; JSON ≠ console native format | USED / ADAPTED | >500 docs, varied types, content (deep-equal) comparison, subcollection boundary — all USED. A seeded **empty-collection** round-trip was NOT separately run (empty *file* is rejected by validateBackup; every collection in the coverage seed had ≥1 doc) — honest limit §7. JSON-vs-console non-interchangeability USED and stated in the runbook |
| 4 | Idempotency 3× + modified-backup merge test (A,B,C vs A,B,D — document whether C is deleted or left) | USED | Restore 3× stable; merge semantics PROVED and documented: C remains — merge, never replacement/rollback |
| 5 | Corrupt/partial fixtures (invalid JSON, empty, missing/unsupported version, missing collections object, missing required collection, invalid id/structure/type, duplicate ids, truncated array, wrong counts — all Reject) + completeness metadata `{formatVersion, createdAt, collections, metadata:{expectedDocumentCounts, exportedDocumentCounts, complete}}` | USED / ADAPTED | All listed fixtures REJECTED by tests. The `complete` boolean was NOT added to the format — the existing header already carries per-collection counts and header-count mismatch is rejected; adding a new format field would change the exporter/parser contract for both paths (follow-up, §8) |
| 6 | Coverage drift: independently-maintained APPLICATION_COLLECTIONS vs BACKUP_COLLECTIONS + explicit BACKUP_EXCLUSIONS; fail on undocumented differences | ADAPTED | Drift + exclusions USED, but the independent source is the **rules file's 81 `match` collections**, not a second hand-maintained list — stronger, because a hand list can share the same omission |
| 7 | Authorization: owner allowed, unauthenticated/non-owner denied, tampering denied; rules (not hidden buttons) enforce; Admin SDK bypasses rules so restore authz is operator/IAM, not client rules | USED | Export authz proved in emulator; no client restore path exists (UI invariant tests); runbook states the Admin-SDK operator/IAM boundary |
| 8 | REST parity: same dataset, same coverage/IDs/values, correct type decoding + pagination, HTTP-failure handling; compare NORMALIZED contents | ADAPTED | List parity + `dec()` extracted from the shipped script and unit-tested for all types — USED. A full same-dataset client-vs-REST content comparison was NOT run: the script targets the production REST endpoint and has no emulator path (follow-up alongside the live-backup validation, §8) |
| 9 | Production safety boundary: never destructive restore tests on live; quota cost of full exports; verify an EXISTING backup artifact locally, don't create extra exports | USED | Stated in the runbook + this report; Step 18 did 0 live reads/writes |
| 10 | Runbook docs (BACKUP_RECOVERY_RUNBOOK.md + BACKUP_FORMAT.md + BACKUP_COLLECTIONS.md) + 12-step checklist; custom JSON is NOT console-importable without a conversion procedure | USED / ADAPTED | 12-step checklist + all required explanations are in the single `docs/restore-runbook.md`; format/collections content lives in the runbook + `backup.ts` header + drift test rather than three separate MD files (avoids three sources of truth drifting). Console non-interchangeability stated explicitly |
| 11 | Structure: tests/backup/fixtures/ + per-area test files; zero-cost tooling only | ADAPTED | Repo conventions followed instead: `src/lib/__tests__/backup.test.ts` + `emulator-tests/backup-roundtrip.test.ts`; zero-cost tooling only (emulator, Node, Firebase CLI, Git, Markdown) |
| 12 | Acceptance BRT-01..BRT-13 | USED except BRT-07, BRT-11 ADAPTED | BRT-01 ✓ round-trip · BRT-02 ✓ pagination · BRT-03 ✓ fidelity · BRT-04 ✓ subcollections excluded · BRT-05 ✓ idempotency · BRT-06 ✓ corrupt rejected · BRT-07 ADAPTED (header-count mismatch rejected; no separate `complete` flag) · BRT-08 ✓ drift · BRT-09 ✓ export authz · BRT-10 ✓ no production restore interface · BRT-11 ADAPTED (list + decoder parity; same-dataset content compare not run) · BRT-12 ✓ runbook written + reviewed (by test) · BRT-13 ✓ no destructive production testing |

## 6. Honest limits

1. **No real production backup has been validated yet.** The 21:16 export failed; the 14:30 cron produces the first real file. Backup validity AND recovery validity of production data are both still unproven until §8 runs.
2. **Client restore cannot recreate deleted docs** — proved by test (deleted published jobQuestion restore FAILS for the owner). A deleted doc is recoverable only from a console native export or an Admin-SDK restore from a file that still contains it.
3. **Restore is a merge, never a replacement/rollback** — docs absent from the backup are left untouched. An operator who expects a full rollback will be surprised; the runbook states this.
4. **Subcollections are never in the JSON backup** (17 subcollections inventoried in the runbook) — the only complete copy is a console native export.
5. **Reference fields are not revived** — a restored doc's reference-typed field points at the original doc path; if that target was deleted, the reference dangles. (Follow-up.)
6. **Paging boundaries 0/1/499 not separately exercised** (500/501/1,250 verified). **Empty-collection round-trip not separately seeded.**
7. **F-1 friendlyAdminError** still shows the generic text for real Firebase errors (documented, fix is a follow-up).
8. **Rendered (Playwright) check OWED** — proxy down. Only a bundle-content check was possible (§3).
9. **Rules cannot prove counter increment + profile create happened in one transaction** (public-IDs honest limit, unchanged) — relevant because `counters` joins the backup list at that merge.
10. **Preflight/export count mismatch policy:** preflight and export are separate operations, so concurrent production writes can make counts differ. The format rejects header-count mismatch on *import*; the export side has no `complete` flag (see ChatGPT row 5) — a follow-up, not a silent fix.

## 7. Follow-ups (in priority order)

1. **Post-14:30-cron live-backup validation (HIGHEST — small step, do not re-export):** inspect the EXISTING artifact the cron produces locally — parse it, run `validateBackup()` on it, compare header counts vs the cron's preflight counts, spot-check `circulars`, `jobQuestions` (35), `jobQuestionBundles` (13), `jobQuestionKeys` (13), `quizKeys` (100). Then establish *recovery validity*: restore the file into the **emulator** (disposable data) and deep-compare — never restore into live. Record backup validity vs recovery validity separately.
2. **Build + emulator-test the Admin-SDK restore script** (runbook §5.4 / Procedure C) — the only full-restore path; currently documented, not built.
3. **`counters` merge-time action + the four Step 15 collections at their merge** — add to BACKUP_COLLECTIONS, remove from BACKUP_KNOWN_PENDING, or the drift test goes red.
4. **F-1 friendlyAdminError fix** — prefer `error.code` over `error.message`.
5. **F-3 follows owner decision** — whether the follows read rule gains an `|| isAdmin()` tail (privacy decision).
6. **Reference-field revive gap** — document or handle dangling references after restore.
7. **Console native export cadence** on the pre-deploy checklist (the only complete copy incl. subcollections).
8. **`complete` flag / export-completeness metadata** in the BackupFile format (ChatGPT row 5) — format change across both exporters; needs a version bump, not a quiet edit.
9. **REST exporter same-dataset parity** — compare normalized client vs REST export contents on one disposable dataset (ChatGPT row 8).
10. **Paging 0/1/499 boundaries + empty-collection round-trip** — small test additions for the next backup touch.

## 8. Deploy notes

- **No deploy in this step.** `firestore.rules` untouched; the only user-facing change is a 3-line honesty note on AdminBackupPage (preview-verified by content, §3).
- **No merge to main.** The branch carries the 76-collection list, the drift test, the runbook, and the `.gitignore` guard. It merges cleanly onto main 1918766 in principle, but merges are sequenced after the 14:30 cron's public-IDs/rules deploy — do not merge this branch ahead of that window.
- **The scripted exporter change is NOT in this commit** (the file lives outside the repo at `~/workspace/eduorbit/backups/export-full-rest.mjs`) — the 14:30 cron must run the synced copy (78 collections, circulars included).

## 9. Files changed

| File | Change |
|------|--------|
| `src/lib/backup.ts` | 76 collections, exclusions, known-pending, settings doc-by-doc, `follows` removed (+145/−7) |
| `src/lib/__tests__/backup.test.ts` | NEW — 28 tests (drift, validation fixtures, download split, UI invariants, parity) |
| `emulator-tests/backup-roundtrip.test.ts` | NEW — 12 tests (round-trip, pagination, idempotency, merge, authz, boundaries) |
| `docs/restore-runbook.md` | NEW — restore runbook (274 lines) |
| `src/pages/AdminBackupPage.tsx` | 3-line honesty note (follows/directMessages script-only) |
| `.gitignore` | `eduvelto-backup-*.json` guard |
| `~/workspace/eduorbit/backups/export-full-rest.mjs` | Synced to 78 collections (outside repo, not committed) |

## 10. Environment notes (for the next step)

- Node v24; repo-local firebase CLI v13.35.1; JRE on PATH (`~/workspace/.jdk/jdk-17.0.21.1+2-jre/bin`) + `JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"`; rules suites run SEQUENTIALLY on DEFAULT ports; full rules suite takes ~3 min.
- `/tmp` does NOT persist between exec calls — all evidence kept under `~/workspace/` (full rules log: `~/workspace/eduorbit/step18-rules-full.log`).
- Preview channels: quota is 50 — the first create attempt failed 429 (quota reached); one superseded merge preview (`step10-merge-e365201`) was deleted to free a slot. Future steps should delete their superseded preview channels.
- `node_modules` in this worktree is a symlink to deploy-main's node_modules (gitignored, not committed).
