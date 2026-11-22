# NU-7 — Question Bank + Verification Flow — Report

**Date:** 22 Nov 2026 · **Branch:** `admissions/nu-auth-profiles` · **Worktree:** `phase2-project-nu-auth/`
**Scope:** National University admission preparation ONLY (Job runs in parallel under a separate coordinator)
**Design:** `team/nu-admission-audit-design-2026-11-22.md` §5.5 + §15 (NU-7) and §19 (esp. §19.3.2 two-tier bank, §19.2.4–§19.2.6, §19.6 state machine)
**Status: COMPLETE (staging only)** — no merge to main, no production deploy, no live-DB touch.

## Branch base

- Forked from main `0b9fe0d`; merge-base with main `e895180` (before the AdSense commits `654f9ab`/`0b9fe0d`).
- Main has since moved: Job Steps 1–5 + NU-1–NU-5 deployed to production 22 Nov ~11:13 (main now `fcd3db8`). **Rebase decision is the parent's — not done in NU-7.**
- Commits (5): `41fa168` lib+flow+seed · `48fd318` rules+indexes · `ea18c73` rules tests · `6135008` workbench UI · `REPORT` this report + review-record hardening (see §4).

## 1. What was built

### 1.1 Library — `src/lib/nuQuestions.ts` (33,325 bytes) + `src/lib/nuQuestionFlow.ts`

- **Types:** `NuQuestionDoc`, `NuQuestionDraftKeyDoc`, `NuQuestionBundleDoc`, `NuQuestionKeyDoc`, `NuReviewDoc`, `NuPublicationDoc`.
- **State machine:** `draft → submitted_for_review → under_review → approved → published`; `under_review → rejected / changes_requested`; `changes_requested → submitted_for_review`; `published → withdrawn`; `draft → withdrawn` (Admin only); `rejected`/`withdrawn` terminal. `canTransitionQuestion` + `nuQuestionTransitionActor` encode the graph and the actor per edge.
- **Validators:** `validateNuQuestionDoc` (syllabus-reference deep checks — chapter belongs to subject, topic belongs to chapter — against the code-backed syllabus; options exactly 4 distinct non-empty), `validateNuQuestionDraftKey`, `validateNuReviewDoc`, `validateNuQuestionBundleDoc`, `validateNuQuestionKeyDoc`, `publishGateCheck` (Bangla labels).
- **Builders:** `buildNuQuestionBundle` (Published questions only; throws on unpublished input or leaked correct answers; throws `nu-mixed-versions` if question versions differ — a bundle carries ONE `questionVersion` for all its questions), `buildNuQuestionKeys`, `nuTopicBundleConfigSnapshot`, `nuMockBundleConfigSnapshot` (mock 100Q/3600s, pass 35; topic 20–30Q/1200–1800s; marking correct 1 / incorrect 0 / unanswered 0 / no negative).
- **Duplicate detection:** `normalizeNuQuestionText`, `nuQuestionSimilarity` (Jaccard), `findNuDuplicateCandidates` (≥0.8) — warning only, never auto-block.
- **Versioning:** `newNuQuestionVersion` (correction = NEW doc, version+1, `previousQuestionId` links back, review fields cleared; old doc stays until the new version publishes, then Admin withdraws it).
- **Flow (`nuQuestionFlow.ts`):** create draft → draft key, save-key retry, submit, claim, submit review, publish, withdraw, new version, review queue, bank summary. Audit writes `nu-question-published` / `nu-question-withdrawn` to `adminActions`.

### 1.2 Firestore rules — `firestore.rules`

- **NEW `nuQuestionDraftKeys` collection** (§19.6.5): the draft correct answer has to live somewhere a reviewer can read before publish; §19.2.4 forbids it in `nuQuestions`, and §19.2.6 keys are per-bundle while a draft has no bundle. One doc per question (`id == questionId`), version-locked (`version == question.version`). Read: Admin, author, or the CLAIMING reviewer (question `under_review` + `reviewedBy == uid`). Create/update: author only while the question is draft. Delete: never.
- **Question update split into Rule A / Rule B** (Job Step 5 pattern, for the 1000-expression budget): (A) content edit — author-or-admin, only in `draft`/`changes_requested`, status/version/createdBy unchanged, full shape valid, no `correctOptionIndex`; (B) transition — graph edges only, actor per edge (submit = author-or-admin; claim/approve/reject/changes = reviewer-or-admin = Admin or verified teacher ≠ author, and the decider must be the claimer `reviewedBy == uid`; publish/withdraw = Admin only), only status + review/publish bookkeeping keys may change, submit requires a draft key to exist (1 rules `get`), approve requires `reviewedBy == uid` + `reviewedAt == request.time`, publish requires the full §19.6.1 gate.
- **Question create tightened to full shape** (§11.2/§19.2.4): subjectId/chapterId/topicId/groupIds/difficulty/sourceType/provenance/questionLang/explanation/circularVersion/createdBy + `createdAt == request.time` + options exactly 4 distinct non-empty + no `correctOptionIndex` + `examYear` only when `sourceType == 'official_previous_year'` (found by test n8).
- **Bundles/keys signed-in-only** (owner 22 Nov 10:33 addendum): `nuQuestionBundles` published-only read now requires `signedIn()`; `nuQuestionKeys` receipt-gated reads now also require `signedIn()`. Bundle create/update Admin-only + shape validation (kind, questions list, `questionCount == questions.length`, per-kind configSnapshot). Key create/update Admin-only + `questionVersion` must equal the bundle's `version` (write-time get check — NOT on the read path).
- **Syllabus reads signed-in-only** (10:33 addendum's NU-6 mandate, applied in NU-7): `nuSubjects`/`nuChapters`/`nuTopics`/`nuLessons` now require `signedIn()`. `nuExamConfigs`/`nuCircularConfigs`/`nuInstitutions`/`nuGroups`/`nuNotices`/`nuCalendarEvents`/`nuFacts` stay public (information, not questions/lessons).
- **Reviews/publications tightened:** review create now requires question `under_review` + `reviewedBy == uid` (the reviewer must be the claimed reviewer — closes the review-without-claiming hole) + `questionVersion == question.version` + all 4 canonical checks (`questionCorrect`, `correctAnswerCorrect`, `explanationCorrect`, `sourceCorrect`) + `reviewedAt == request.time`. Publication create: `actorId == uid` + `createdAt == request.time` + a `'published'` record requires the question to BE `published` (corrected — the record is written AFTER the transition, not while `approved`) + version match.
- **Questions may ONLY use the 3 common subjects** (`bangla`/`english`/`general-knowledge`); `group-*` subjectIds rejected (Blocker B — group-40 has no chapters).
- **Source types:** exactly the five §19.2.4 values — `official_previous_year | original_practice | adapted_hsc | unverified_source | imported_academic`. `board_question` / `textbook_based` were invented and removed everywhere.

### 1.3 Indexes — `firestore.indexes.json` (8 new composites)

§19.9 #1 (`nuQuestions` status+groupId+subjectId), #2 (status+createdAt), #3 (`nuQuestionBundles` kind+groupId+status), #8 (`nuReviews` questionId+reviewedAt desc), #9 (status+subjectId+createdAt), #10 (topicId+status), #11 (groupIds array-contains+status), #12 (subjectId+topicId).

### 1.4 Admin workbench — route `/admin/admissions/questions`

- `src/components/NuQuestionWorkbenchGuard.tsx` (NEW guard: owner/admin/verified-teacher — the existing `AdminGuard` is owner-only in UI while rules allow admin writes, so the workbench could not reuse it), `src/pages/AdminNuQuestionsPage.tsx` (bank summary + composer + review queue + detail + draft-key view + approve/reject/changes/publish/withdraw/new-version + duplicate warning + bundle preview + draft edit via Rule A), App.tsx route, AdminPage card, TeacherDashboard card (verified teachers only).
- Publish flow (single question): status → published + `nuPublications` record + audit. **No bundle is created at question-publish time** — bundles assemble at NU-8/NU-9 from published questions (builders implemented + unit-tested in NU-7, exercised by the bundle preview in the admin page).

### 1.5 Seed — `team/nu-question-bank-seed-2026-11-22.json`

Disk-only, never applied live. **Empty arrays + one schema example marked `example`.** The bank starts EMPTY: 0 questions, 0 verified teachers (NU-Q4). Nothing invented.

## 2. Verification evidence

| Check | Result |
|---|---|
| Build (`npm run build`) | **PASS** |
| Unit tests (full suite, 5 files) | **104/104** — 75 NU-6 + 29 new `nuQuestions` |
| Rules — NU-7 file | **70/70** (`emulator-tests/rules-nu7-question-bank.test.ts`) |
| Rules — NU-4 file | **60/60** (after n57 update, see §4) |
| Rules — NU-6 file | **36/36** |
| Rules — full suite (11 files) | **378/378 PASS, exit 0** (final run `/tmp/nu7-rules-full4.log`, alt ports 8087/9097) |
| Preview channel | https://eduvelto--nu-7-question-bank-4xn1k6p2.web.app (expires 2026-11-29 05:29:10) — routes **6/6 → 200**: `/`, `/admissions`, `/admissions/national-university`, `/admissions/dashboard`, `/admin/admissions/questions`, `/admissions/national-university/humanities` |
| Signed-in browser click-through | **NOT verified** — no live browser in this session; record honestly, never claim it |

Emulator ports for the rules runs: Firestore 8087, Auth 9097, Hub 4408, UI 4508 (temp config `firebase.nu7.json`, untracked — **delete after the final run**). Env must set `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST` **and** `FIRESTORE_EMULATOR_PORT` — see §4.3.

## 3. What the tests caught (fixes made during NU-7)

1. **examYear on a non-previous-year question was ALLOWED** (n8) — rules now forbid `examYear` unless `sourceType == 'official_previous_year'`.
2. **A claiming reviewer could NOT read the draft key** they must verify (n69/n70) — read allowed while the question is `under_review` AND `reviewedBy == uid`.
3. **Publication-record semantics wrong** — original design said a `'published'` record requires the question to be `approved`; the flow writes the record AFTER the transition, so it must be `published`.
4. **`sourceType` list contained two invented values** (`board_question`, `textbook_based`) — removed everywhere; five §19.2.4 values only.
5. **Review without claiming was possible** (NU-4 n57, §4.1) — review create now requires `reviewedBy == uid`.
6. **NU-4 test n57 was written against the looser NU-4 rule** (draft question, old check names) — updated to an under-review question + canonical checks.
7. **NU-6 test n30** (anonymous reads a published topic → ALLOWED) flipped to DENIED per the 10:33 addendum; NU-4 test payloads n34–n37 updated with chapterId/topicId/createdAt, subject `'physics'` (invalid) → `'bangla'`.

## 4. Final hardening (this commit)

### 4.1 Review records: reviewer must be the claimed reviewer
`nuReviews` create now requires the question's `reviewedBy == uid()`. A verified teacher can no longer write a review record for a question someone else claimed. NU-4's seed gains `q-admin-under-review` (admin's question, `under_review`, `reviewedBy: teacher-verified`) and n57 reviews it with the canonical checks. NU-7's review tests already matched this (n41's claimer is the reviewer; n42 self-review still DENIED).

### 4.2 n70: a third verified teacher
The "non-claiming reviewer" test used `teacher-verified`, who is the AUTHOR of `q-under-review-2` and therefore may read its draft key. The seed now has `teacher-verified-3` (verified, neither author nor claimer) and n70 uses them.

### 4.3 Rules-test environment quirk (recorded for future coordinators)
The first full-suite run failed 7 files with 259 tests skipped — `ECONNREFUSED 127.0.0.1:8080`. Cause: the older test files (NU-4, NU-5, role, rules, rules-step2, guardian) pass an EXPLICIT `firestore: { host, port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) }` to `initializeTestEnvironment`, so they ignore `FIRESTORE_EMULATOR_HOST` and default to port 8080. NU-6/NU-7 pass only `{ projectId }` and read the HOST variable. **Always set `FIRESTORE_EMULATOR_PORT` alongside the HOST variables on alt-port runs.** The second full run (with the port set) passed 376/378; the 2 failures were the §4.1/§4.2 issues above.

## 5. Honest limits (what NU-7 does NOT do)

- **Rules CANNOT verify a review record exists before a status transition** — review docs have random ids and rules cannot query collections. The flow code enforces it; `nuReviews`/`nuPublications` append-only + `adminActions` audit are the second layer. Recorded in the design doc as §19.3.8 (see §7).
- **Subject scoping is UI-level only** — teacher `subjects` on the `users` doc are free-text while NU subjectIds are slugs, and rules have no string-case functions, so subject-scoped key reads cannot be enforced in rules. A normalised `approvedNuSubjects` field is deferred to NU-15.
- **Previous-author exclusion is code-level only** — the original author of v1 must not review v2; rules enforce reviewer ≠ current `createdBy` only.
- **Signed-in browser click-through NOT verified** (no live browser in this session).
- **Bank is empty** (0 questions, 0 verified teachers — NU-Q4 is THE content blocker). No questions or teachers invented; no seed applied; read path NOT switched to Firestore (code-backed syllabus still serves the hub).
- **No merge, no deploy, no live-DB touch.** Staging only.

## 6. Full rules suite — final run

**DONE — 378/378 PASS, 11/11 files, exit 0** (final run `/tmp/nu7-rules-full4.log`, alt ports 8087/9097 with `FIRESTORE_EMULATOR_PORT=8087` set). Per-file: NU-7 70/70, NU-4 60/60, NU-6 36/36, NU-5 32/32, plus role/guardian/rules/rules-step2/dashboard-filter/progress-summary files (240/240 at NU-4 → 378 total now). Targeted re-run after the §4 fixes: NU-4 + NU-7 files 130/130 PASS (60 + 70).

## 7. Design-doc updates

- `team/nu-admission-audit-design-2026-11-22.md`: new **§19.6.5 NU-7 implementation note** (draft-keys collection, Rule A/B transition split, signed-in changes, subject-scoping deferral, review-record limit, publication-record correction, sourceType five values, bundle/key builders, bank starts empty). Doc now 1,319 lines (was 1,307).
- `team/nu-admission-status.md`: NU-7 row added (see below); NU-6 row's "Next: NU-7" superseded.

## 8. Next — NU-8 (MCQ practice engine)

Assemble bundles from published questions (builders already exist), topic practice + mock test flows per §19.5, receipt-gated key delivery, attempt lifecycle with server-timestamp-anchored deadlines. Blocked on content, not architecture: the bank is empty until verified teachers exist (NU-Q4) and the 2026-27 circular lands (Blocker A).
