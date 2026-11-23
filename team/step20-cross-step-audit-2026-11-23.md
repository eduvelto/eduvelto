# Step 20 Phase 1 — Cross-step consistency audit (gate 1.8)

**Date:** 23 Nov 2026 · **Scope:** REPORT ONLY — no file inside the project worktree was edited.
**Source tree:** `~/workspace/eduorbit/phase2-project-step20/` — branch `jobs/step20-release`, HEAD `5a3f90e` (== main).
**Method:** every check below was verified in code, file by file (exact file:line evidence). No live-DB read was possible from this session; live-state claims are marked as such.

**Overall verdict: 0 VIOLATIONS.** All six items PASS. Two honest observations are recorded (not violations):
- (O1) The legacy academic engine still contains written-exam paths — pre-existing, outside the Job program, removal is a separate owner decision (see item (d)).
- (O2) The brief's "2,307 chapters" figure is UNCONFIRMED — the verified on-disk floor is 2,109 chapters (see item (b) note + release-notes draft).

---

## (a) rulesConfig = exactly 4 verified exams — PASS

`src/lib/jobExams.ts:581-685` — `JOB_RULES_CONFIGS` has exactly four keys:

| Exam | questionCount / timeMinutes | negativeMarking | provisional | patternStatus | scoringConfigVersion |
|---|---|---|---|---|---|
| `bcs` (`:582-605`) | 200 / 120 | **0.5**, verified | null | `verified` | `v1` |
| `bank` (`:606-636`) | 100 / 60 | **null** | **0.25**, `negativeMarkingVerified: false` | `not_verified` | `v0-provisional` |
| `primary-teacher` (`:637-660`) | 90 / 90 | **0.25**, verified | null | `verified`, pass 45 (50%) | `v1` |
| `ntrca` (`:661-685`) | 100 / 60 | **0.25**, verified | null | `last_verified`, cycle `18th`, pass 40 | `18th-v1` |

- Subject-mark sums match questionCount per exam (BCS 35+35+30+20+10+15+15+15+15+10 = 200; Bank 25+25+20+20+10 = 100; Primary 25+25+20+20 = 90; NTRCA 25×4 = 100) — and the unit test asserts the sums (`jobExams.ts:451-466` header comment).
- Bank penalty is provisional exactly as required: `negativeMarking: null` (`:617`), `provisionalNegativeMarking: 0.25` (`:618`), `negativeMarkingVerified: false` (`:622`); the interface comment (`:478-486`) forbids an unverified penalty in the scoring field. The engine never scores from the provisional value (see `src/lib/jobEngine.ts:37,51`).
- The other 10 exams return null from `jobRulesConfig()` (`jobExams.ts:689-691`); their states are explained, not silently "unknown", in `JOB_PATTERN_STATUS` (`:536-553` — 9× `not_verified`, `it-professional` `scope_pending`).
- The Firestore seed matches the lib exactly (checked programmatically): `team/job-categories-exams-seed.json` — 14 exams, 10 with `rulesConfig: null`, 4 with the same figures (Bank `(100, 60, null, prov 0.25, not_verified)`; BCS `(200, 120, 0.5, …)`; Primary `(90, 90, 0.25, …)`; NTRCA `(100, 60, 0.25, …)`). No other rulesConfig source exists in `src/` (grep `rulesConfig` — only `jobExams.ts`, `jobContent.ts`, `jobEngine.ts`, `jobMocks.ts`, `jobQuestions.ts` consume it).
- Nuance, not a violation: Bank's `patternStatus` is `not_verified` even though its subject pattern is verified — because the config as a whole is not authoritative for scoring until the penalty is verified (`jobExams.ts:632-635`). That is the documented Step 5 state.

## (b) Question bank EMPTY, honest empty states, nothing invented — PASS

- Job seed: `team/job-question-seed.json` — `jobQuestions: 0, jobQuestionBundles: 0, jobQuestionKeys: 0`; `_meta.emptyOnPurpose` states the bank is empty on purpose (0 verified teachers). Disk-only, never applied to live.
- NU seed: `team/nu-question-bank-seed-2026-11-22.json` — `questions: 0, bundles: 0, keys: 0, draftKeys: 0`; its `schemaExample` (5 fields) is labelled example-only, "never to be applied" (noteBn/noteEn in the file).
- Content seed: `team/job-content-seed.json` — 23 draft subjects, `jobChapters: 0, jobTopics: 0, jobLessons: 0`.
- Lib states it: `src/lib/jobQuestions.ts:54-56` — "0 verified teachers today — the bank is EMPTY by policy. No question is invented here."
- Rules enforce it: `firestore.rules:4326-4333` — "jobQuestions — the bank record. Students can NEVER read it" (`match /jobQuestions/{questionId}`).
- Honest empty states in the UI (all Bangla, all say "after teacher verification"):
  - `src/pages/JobMockPage.tsx:151` — "এই মকের প্রশ্ন এখনো তৈরি হয়নি — শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।"
  - `src/pages/JobPracticePage.tsx:129,139` — "…এখনো প্রকাশিত হয়নি — শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।" / "এই সেটে এখনো কোনো প্রশ্ন নেই।"
  - `src/pages/JobTopicPage.tsx:120` — "প্রশ্ন তৈরি হলে এখানে অনুশীলন শুরু করা যাবে — এখনো কোনো প্রশ্ন তৈরি হয়নি।"
  - `src/pages/JobsCommonPage.tsx:281,314` — "কমন টপিকের কোনো প্রশ্ন এখনো প্রকাশিত হয়নি।"
  - `src/pages/JobsPage.tsx:191`, `src/components/JobCards.tsx:400`, `src/components/JobPracticeTab.tsx:60` — same "after teacher verification" wording.
- No invented/seeded content found anywhere in `src/` (grep for seeded/sample question content in `job*.ts` — only the empty-seed comments and the honest empty states above).
- **Counts note (O2):** the release-notes brief asked for "library 609 books / 2,307 chapters". The 609 books figure IS verified in code (`src/lib/ceo.ts:20`, `LAST_VERIFIED_INVENTORY.books: 609`, checked 21 Nov 2026). The 2,307 chapters figure is **not** verified anywhere on disk: `team/hosting-firebase-audit-2026-11-23.md:16,245` records it as "Partially verified — the loader plan on disk (`step2-plan.json`, 20 Nov 2026) counts 609 books, **2,109 chapters, 20,970 questions**. The brief's 2,307 / 23,346 are higher… but **no on-disk count confirms them**. Live Firestore counts need a Console check. Use 609 / 2,109 / 20,970 as the verified floor." The release-notes draft therefore uses **609 books / 2,109 chapters / 20,970 questions** and does NOT print 2,307. Confirming the live counts is a Console check for the owner, not a code fix.

## (c) Bangla-first — English is navigation tab labels ONLY — PASS

- Choke point: `src/i18n/LanguageContext.tsx` — `lang` is the constant `'bn'` (line ~77: `const lang: Lang = 'bn'`); `t()` always returns the Bangla string; `tTab()`/`<TabT>` are the only path that reads the user's selected language (`tabLang`), and the file header states "The complete English surface of the site is therefore the list of `tTab` / `<TabT>` call sites".
- Call-site audit (grep `tTab|<TabT|tabLang` in `src/`): 31 occurrences, all navigation tab labels only —
  `src/components/BottomNav.tsx:128-154` (5 mobile nav labels), `src/components/HeaderNav.tsx:333-400` (top-level nav + Dashboard/Profile/Admin), `src/pages/ClassDashboardPage.tsx:510-512` (class dashboard tab bar). `HeaderNav.tsx:141-157` is the language toggle itself (`EN` / `বাং`). No other file reads `tabLang`.
- No `lang === 'en'` / `lang !== 'bn'` render branch exists in `src/` (grep — only `src/lib/profile.ts:259` validating the stored preference value and `LanguageContext.tsx:87` adopting it, neither renders anything).
- `PageShell` (`src/components/PageShell.tsx:50`) renders `titleEn` only when `lang !== 'bn'` — unreachable, since `lang` is constant `'bn'`; titles always render Bangla.
- `en:` strings still exist in code as the second side of `{bn, en}` pairs (e.g. `src/pages/JobHubPage.tsx:53-74` empty-state `en:` strings, `JobCircularsPage.tsx:54` etc.) — by design, never rendered except through `tTab`/`<TabT>` (tab labels). `t({bn, en})` returns `bn` always.
- Observation (not a violation): Job hub/dashboard tabs use `<T>` (Bangla always) rather than `<TabT>` — e.g. `src/pages/JobHubPage.tsx:383` renders `<T bn={tb.bn} en={tb.en} />`. The i18n report (`team/i18n-tabs-only-english-report.md`, "Follow-ups") asked the Job program to apply the `tTab` treatment to its hub tabs on merge; that was never done. Effect: Job tabs stay Bangla even when the user picks English — *more* Bangla-first than the rule requires, not less. No action required; if the parent wants Job tabs to switch like the other tab bars, that is a one-component change (`T` → `TabT` in the Job tab bars), not a Step 20 gate item.
- Behavioural proof on file: `team/i18n-tabs-only-english-report.md` "Verification" — server-render probe: English mode `t()` → Bangla, `tTab()` → English; BottomNav renders English labels in English mode, Bangla in Bangla mode.

## (d) MCQ-only — no written-exam paths in the Job program — PASS (with a recorded pre-existing exception outside Job scope)

- **Job code: zero written-exam paths.** Grep `written` (case-insensitive) over `src/lib/job*.ts`, `src/pages/Job*.tsx`, `src/components/Job*.tsx` returns only the word "written" as ordinary English ("is written", "written by", "written to Firestore") plus **descriptive pattern text** about the real-world exam stages — not app functionality:
  - `src/lib/jobExams.ts:80,97,114,131,148,165,182,199` — `stepsEn: 'Preliminary → Written → Viva'` etc. in `EXAM_PATTERNS` (factual description of the real exam's stages, shown as information on hub pages).
  - `src/lib/jobExams.ts:391,410,446` — `noteEn` pattern notes ("Written: 900 (general cadre)…", "Written (subject-based): 100 marks…"). These describe the official pattern; they do not let a student take, submit, or be marked on a written exam.
  - `src/lib/jobContent.ts:30` — "MCQ-only (no written-exam architecture anywhere here)" (the rule itself, in a comment).
- NU enforces MCQ in code: `src/lib/nuExamConfig.ts:175` — `questionMode must be MCQ — no written exam exists`; the unit test (`src/lib/__tests__/nuAdmission.test.ts:48`) rejects `questionMode: 'WRITTEN'`.
- **(O1) Pre-existing exception, outside the Job program — recorded, not hidden:** the legacy academic exam engine DOES have written-exam paths, predating the Job program: `src/lib/exams.ts:74,105,134,147,193,532` (`kind: 'mcq' | 'written'`, written attempts created scored, `kind: 'written'` default), `src/pages/ExamPage.tsx:268` (written answer input), `src/pages/QuizPage.tsx:202` (written rendering), `src/pages/QuizResultPage.tsx:87` (moderator marking of written attempts, `attempt.kind === 'written'`). These serve the **204 existing live academic written exams**. Per `team/job-program-status.md` (standing rules), hiding/removing those is "a separate removal-of-published-content decision still owed by the owner; do not touch them", and the Job ban covers Job steps building written paths. Verdict on the Step 20 gate (Job program): **PASS**. The academic written paths remain an open owner decision, carried forward — they are not a Step 20 violation and Step 20 must not touch them.

## (e) Backup coverage still covers EVERY Job collection — PASS

Method: parsed `firestore.rules` top-level `match /<name>/{` (4-space indent, the drift test's own method) and diffed against `src/lib/backup.ts`.

- Top-level collections in `firestore.rules`: **88**.
- `BACKUP_COLLECTIONS` (`src/lib/backup.ts:115-232`): **82 entries** (the header comment says 82; a naive quote-count gives 83 because the comment at `:226` quotes `'appVersion'` — the real entries are 82).
- `BACKUP_EXCLUSIONS` (`src/lib/backup.ts:236-259`): **6 entries**, each with a reason — `jobReceipts`, `quizReceipts`, `nuReceipts` (ephemeral 10-min tokens, content duplicated in the attempt doc); `jobExamUserLocks` (transient lock, recreated on demand); `directMessages`, `follows` (owner cannot list-read under the rules — participant/follower-only reads; console/Admin-SDK export only, per Step 18 F-3).
- **82 + 6 = 88. Missing: none.** Every top-level rules collection is backed up or explicitly excluded.
- Every Job collection is in `BACKUP_COLLECTIONS`: `jobQuestions`, `jobQuestionBundles`, `jobQuestionKeys`, `jobReports`, `jobCorrections`, `jobCategories`, `jobExams`, `jobSubjects`, `jobChapters`, `jobTopics`, `jobLessons`, `jobExamDefinitions`, `jobQuestionSetManifests` (`:126-128,179-180,187-194`), plus `circularHistory`, `approvedDomains`, `circulars`, `counters`, `config`.
- Since the Step 18 merge (`edbb210`): `git diff edbb210..HEAD -- firestore.rules` adds exactly **one** new top-level match — `match /config/{docId}` (forced app update, commits `7f6b611`/`7840a3c`, merged `ff68f7b`). `config` IS in `BACKUP_COLLECTIONS` (`backup.ts:223-227`, `CONFIG_DOC_IDS = ['appVersion']` at `:349`) — read doc-by-doc because its read rule is `docId == 'appVersion'` (list/count denied). **No collection added since Step 18 is missed.**
- `settings` has no collection-level rules match (only single-doc `/settings/features` + `/settings/ads`) and is exported doc-by-doc (`DOC_BY_DOC`, `backup.ts:352`) — the drift test explicitly allows this one exception.
- Sub-collections (`users/{uid}/jobAttempts`, `posts/{id}/comments`, `questions/{id}/answers`, …) are excluded by design and listed in the file's metadata — console export is the only route that sees them (`backup.ts:47-52`). That is the documented Step 18 position, unchanged.
- Enforcement: the drift test `src/lib/__tests__/backup.test.ts` (BRT-08) asserts every rules collection is backed up or excluded and every list entry is a real rules collection — a new collection cannot silently fall outside coverage.

## (f) No secrets / API keys / tokens in `src/` — PASS

Checked (grep over `src/`, patterns: `api[_-]?key`, `secret`, `passwd`, `password\s*[:=]\s*['"]…`, `Bearer …`, `ghp_`, `sk-…`, `AKIA…`, `xox…`, `-----BEGIN … PRIVATE KEY`, `process.env`):

- **One hit, by design:** `src/firebase-config.ts:25` — the Firebase **web client config** (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`). The file's own header (`:1-16`) states these client keys are PUBLIC-BY-DESIGN ("Firebase API keys are not secret"; security comes from Firestore rules + Auth) and warns never to commit a service-account key. Verified by byte-shape check (39-char `AIza…` key; value NOT reproduced here). No service-account JSON is in the repo (`.gitignore` covers it; none found).
- No `.env` files anywhere in the worktree. No GitHub/Stripe/AWS/Slack tokens. No private keys. No passwords (only the word "password" in UI labels / auth-flow comments).
- `process.env` appears once in `src/` — `src/lib/__tests__/backup.test.ts:33` (`process.env.HOME`), a test path, not a credential.
- Note on display redaction: tooling redacts token-like values in displayed output (grep shows `'Bearer <redacted>'` where the bytes hold the real value). All findings above were confirmed by byte checks that report shape/booleans only, never the values.
- Outside `src/` (for completeness, not part of the gate): `scripts/apply-job-seed.mjs`, `scripts/apply-job-content-seed.mjs` use `Authorization: 'Bearer ' + 'owner'`-style headers — byte-checked, the token is the 5-char emulator superuser token `owner`, used only against the localhost emulator (see `scripts/apply-job-question-seed.mjs:388-394`, which builds the header by concatenation per the AGENTS.md 22 Nov lesson). No production credential exists in the scripts.

---

## Stale lines in `team/job-program-status.md` (do NOT edit the file — corrections listed here)

The file's header says "Last updated: 22 Nov 2026 ~13:00". Everything below that is frozen at Step 7 core-complete, while Steps 7–19 have since closed, merged, and deployed. Line numbers refer to the 144-line file as read 23 Nov 2026.

### S1 — Header line (line 5)
- **Stale:** "`**Last updated:** 22 Nov 2026 ~13:00 Asia/Dhaka — Step 7 CORE COMPLETE (NOT CLOSED — ChatGPT consultation pending, arranged separately by the parent; build PASS, rules 573/573, unit 205/205, preview 8/8 routes 200, bank EMPTY by policy — 0 verified teachers). Step 6 CLOSED (ChatGPT fold-in: USED 11 / ADAPTED 1 / REJECTED 7 / Step 7 gate 1; build PASS, rules 479/479, unit 130/130, routes 9/9, seed applied in emulator 23/23)."
- **Corrected:** "`**Last updated:** 23 Nov 2026 ~18:15 Asia/Dhaka — Steps 1–19 MERGED to main and deployed live (main `5a3f90e`); Step 7 CLOSED 22 Nov ~13:07 Dhaka (ChatGPT fold-in USED 12 / ADAPTED 3 / REJECTED 1, rules 612/612, unit 217/217). Latest verified counts on main: rules 1162/1162, unit 791/791 (23 Nov deploy logs). Bank EMPTY by policy — 0 verified teachers. Step 20 (Final Integration + Release Preparation) IN PROGRESS — Phase 1 report-only audit filed 23 Nov."

### S2 — "Current step" production-deploy paragraph
- **Stale:** "`**PRODUCTION DEPLOY — LIVE (22 Nov ~11:13 Asia/Dhaka, owner approval 10:25 "koro" + 10:28 reconfirm):** Job Steps 1–5 (branch commit `b260380`) + NU-1–NU-5 (`9a065e4`) merged via `deploy/job-nu-live` (merges `a8b9ee9` + `e73a630` + deploy fix `fcd3db8`) and deployed to production — main now `fcd3db8` on origin. … Step 6 + NU-6 stay staging — separate deploy when done."
- **Corrected:** "`**PRODUCTION DEPLOY — LIVE (latest 23 Nov ~18:08 Asia/Dhaka):** Job Steps 1–19 merged to main (`5a3f90e`) and deployed — rules + hosting, live probe green on eduvelto.web.app + eduvelto.com. Latest deploys: Step 18 (hosting 23 Nov ~17:29), Step 19 (hosting 23 Nov ~17:35), F7 timer fix (hosting 23 Nov ~17:54), forced app update + h1 fix + /install allowlist (hosting 23 Nov ~18:06–18:08). Evidence: `team/*-deploy-hosting-2026-11-23.log` + `team/*-deploy-probe-2026-11-23.log`. Post-Step-19 batches (master quick-wins `682e42e`, SEO 79 pages `98b0f88`, F7 `7840a3c`, forced app update `ff68f7b`, founder message `591827e`, h1 fix `5a3f90e`, /install `fcc382c`) all merged + deployed. No `config/appVersion` doc published yet — the version gate is failing open by design until the owner publishes v0.1.0 (Step 20 Phase 4)."

### S3 — Step 4 entry, closing sentence
- **Stale:** "`… No merge to main, no production deploy, live DB untouched.`" (end of the Step 4 bullet; identical sentence also ends the Step 5, Step 6 and Step 7 bullets)
- **Corrected (Step 4):** "`Merged to main via `e92f458` (Step 9 merge, 22 Nov ~18:54 Dhaka) and deployed live with Steps 1–19. Signed-in browser click-through still not done (no live browser in this session) — owed, see Step 19 §7 / Step 20 R5."
- **Corrected (Step 5):** "`Merged to main via `e92f458` (22 Nov ~18:54 Dhaka) and deployed live with Steps 1–19. Read path still NOT switched to Firestore (hardcoded canonical lib; switch + apply need separate approval) — unchanged."
- **Corrected (Step 6):** "`Merged to main via `e92f458` (22 Nov ~18:54 Dhaka) and deployed live with Steps 1–19. Read path still NOT switched to Firestore — unchanged."
- **Corrected (Step 7):** "`Step 7 CLOSED 22 Nov ~13:07 Dhaka (commit `a126483`; ChatGPT fold-in USED 12 / ADAPTED 3 / REJECTED 1; rules 612/612, unit 217/217). Merged to main via `e92f458` (22 Nov ~18:54 Dhaka) and deployed live with Steps 1–19. Bank EMPTY by policy — 0 verified teachers."

### S4 — Step 7 bullet header
- **Stale:** "`**Step 7 — Question Bank and Verification: CORE COMPLETE, NOT CLOSED** (22 Nov ~13:00; ChatGPT consultation pending — arranged separately by the parent; fold-in + closure after it returns)."
- **Corrected:** "`**Step 7 — Question Bank and Verification: CLOSED** (22 Nov ~13:07 Dhaka; commit `a126483`; ChatGPT fold-in USED 12 / ADAPTED 3 / REJECTED 1; build PASS, rules 612/612, unit 217/217, preview step7-foldin). Report: `team/job-question-bank-step7.md`."

### S5 — "Next after Step 4: Step 5" line
- **Stale:** "`**Next after Step 4: Step 5 — Job Categories and Exam Structure.**"
- **Corrected:** "`**Next: Step 20 — Final Integration and Release Preparation** (Steps 1–19 done; see 'The 20 steps' below)."

### S6 — "NOT done (honest gaps)" section
- **Stale:** "`- Everything in Steps 2–20.`"
- **Corrected:** "`- Steps 2–19 are done (merged + deployed — see 'The 20 steps'). Remaining: Step 20 (in progress); the carried-forward items in the Step 20 scoping note §4 (AQ decisions, borrowed-phone check, live F7 resume check, production backup/export, owner 2FA decision)."
- The two bullets under it ("Firestore DATA export", "Auth users export") are **still true** — keep them, and append: "Step 18 built emulator-tested backup/restore (`docs/restore-runbook.md`, 82-collection coverage); a live export still needs the owner's browser session or explicit Admin-SDK authorisation."

### S7 — "The 20 steps" list, items 6–20
- **Stale item 6:** "`6. ~~Subject, Chapter, Topic and Lesson System — **NEXT**~~ — **CORE COMPLETE** (22 Nov ~11:45; ChatGPT consultation pending before closure; build PASS, rules 444/444, unit 122/122, preview re-deployed, routes 9/9)"
- **Corrected item 6:** "`6. ~~Subject, Chapter, Topic and Lesson System~~ — **CLOSED** (22 Nov ~12:35 Dhaka; ChatGPT fold-in USED 11 / ADAPTED 1 / REJECTED 7; build PASS, rules 479/479, unit 130/130, routes 9/9; merged to main via `e92f458` 22 Nov ~18:54 Dhaka)"
- **Stale item 7:** "`7. Question Bank and Verification — **CORE COMPLETE, NOT CLOSED** (22 Nov ~13:00; ChatGPT consultation pending, arranged separately; build PASS, rules 573/573, unit 205/205, preview 8/8 routes 200; bank EMPTY — 0 verified teachers)"
- **Corrected item 7:** "`7. ~~Question Bank and Verification~~ — **CLOSED** (22 Nov ~13:07 Dhaka, `a126483`; ChatGPT fold-in USED 12 / ADAPTED 3 / REJECTED 1; rules 612/612, unit 217/217; merged via `e92f458`; bank EMPTY — 0 verified teachers)"
- **Stale items 8–19 (bare names, no status):**
  - `8. MCQ Practice Engine` → "`8. ~~MCQ Practice Engine~~ — **CLOSED** (22 Nov; report `team/job-mcq-practice-engine-step8.md` in the step10 worktree; ChatGPT consultation `team/job-step8-chatgpt-consultation-2026-11-22.md`; merged to main via `e92f458` 22 Nov ~18:54 Dhaka)"
  - `9. Full Exam and Model Test Engine` → "`9. ~~Full Exam and Model Test Engine~~ — **CLOSED** (22 Nov; report `team/job-full-exam-model-test-step9.md`; ChatGPT fold-in `team/job-step9-closure-2026-11-22.md`; merged `e92f458` 22 Nov ~18:54 Dhaka)"
  - `10. Result and Performance Analysis` → "`10. ~~Result and Performance Analysis~~ — **CLOSED** (22 Nov ~19:41 Dhaka; merged `1692448`; report `team/job-step10-result-analysis-2026-11-22.md`)"
  - `11. Student Dashboard` → "`11. ~~Student Dashboard~~ — **CLOSED** (23 Nov ~00:20 Dhaka; merged `28bc870`; report `team/job-step11-dashboard-2026-11-22.md`)"
  - `12. Study Planner and Revision` → "`12. ~~Study Planner and Revision~~ — **CLOSED** (23 Nov ~00:56 Dhaka; merged `6df278b`; report `team/job-step12-planner-2026-11-23.md`)"
  - `13. Wrong Answer Notebook and Favorites` → "`13. ~~Wrong Answer Notebook and Favorites~~ — **CLOSED** (23 Nov ~01:41 Dhaka; merged `31e327a`; report `team/job-step13-wrong-answers-2026-11-23.md`)"
  - `14. Job Circular and Exam Calendar` → "`14. ~~Job Circular and Exam Calendar~~ — **CLOSED** (23 Nov ~02:13 Dhaka; landed on main as `1918766`; report `team/job-step14-circulars-2026-11-23.md`)"
  - `15. Admin Dashboard (Job parts only)` → "`15. ~~Admin Dashboard (Job parts only)~~ — **CLOSED** (23 Nov ~02:51 Dhaka; landed on main as `717433a`; report `team/job-step15-admin-2026-11-23.md`)"
  - `16. Viva, Interview and Career Support` → "`16. ~~Viva, Interview and Career Support~~ — **CLOSED** (23 Nov ~15:27 Dhaka; merged `077ff47`; report `team/job-step16-viva-career-2026-11-23.md`)"
  - `17. Security Testing` → "`17. ~~Security Testing~~ — **CLOSED** (23 Nov ~15:59 Dhaka; merged `6797392` via tmp-merge-step17b; report `team/job-step17-security-testing-2026-11-23.md`)"
  - `18. Backup and Recovery Testing` → "`18. ~~Backup and Recovery Testing~~ — **CLOSED** (23 Nov ~17:28 Dhaka; merged `edbb210`; report `team/job-step18-backup-recovery-2026-11-23.md`; 82-collection coverage + drift test, emulator-tested round-trip)"
  - `19. Complete Mobile and Desktop Testing` → "`19. ~~Complete Mobile and Desktop Testing~~ — **CLOSED** (23 Nov ~17:30 Dhaka; merged `46ec4ab`; report `team/job-step19-device-testing-2026-11-23.md`; F7 fixed after it by `7840a3c`, F5/F6/F8 dispositioned in Step 20)"
  - `20. Final Integration and Release Preparation` → "`20. Final Integration and Release Preparation — **IN PROGRESS** (Step 20; scoping `team/job-step20-release-scoping-2026-11-23.md`; Phase 1 report-only audit + F5/F6/F8 dispositions + release-notes draft filed 23 Nov)"

### S8 — "Done and verified" table
- **Stale:** the four rows for Steps 4–7 each end "No merge to main, no production deploy, live DB untouched." — replace with the S3 corrected sentences above.
- **Missing (omission, not a wrong line):** no rows for Steps 8–19. Add one row per step with merge commit + report + headline counts (counts as recorded in each step report — not re-verified here; the merge commits above are verified in git).

### S9 — Standing-rules header (lines 3–7)
- **Stale in effect:** "`Budget ৳0. Staging only — no merge to main, no production deploy, no migration without separate approval (backup + rollback first).`"
- **Corrected:** "`Budget ৳0. Merges to main and production deploys happen ONLY under separate owner approval (backup + rollback first) — Steps 1–19 have each been merged and deployed under such approvals; no migration, no spend, no DNS change.`" (The substance — approval-gated deploys — is unchanged; the old wording reads as if nothing ever merged.)

### Not stale (checked, no change needed)
- Step 1/2/3 entries and the Step 2/3/4/5 consultation records; the "Priority order", "Bangladesh-platforms research", "Written→MCQ conversion — HELD", language (Bangla-only, tabs-only English) and MCQ-only standing rules; the "Firestore DATA export / Auth users export" gap bullets (still true); the Step 5 "Read path NOT switched" note (still true).
