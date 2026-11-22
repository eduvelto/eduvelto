# NU-6 — Subjects / Chapters / Topics / Lessons — Report

**Date:** 22 Nov 2026 · **Branch:** `admissions/nu-auth-profiles` (worktree `phase2-project-nu-auth/`, from main `0b9fe0d`) · **Design doc:** `team/nu-admission-audit-design-2026-11-22.md` §5.4 + §15 (NU-6) + §19 (1,307 lines) · **Status note:** `team/nu-admission-status.md`

**Staging only.** NOT merged to main, NOT deployed to production, NOT applied to any live database, NOT published. Signed-in browser click-through NOT verified (no live browser in this session) — recorded as not verified, never claimed.

## What was built (5 commits)

| Commit | Contents |
|---|---|
| `d827d68` (1/5, previous coordinator) | Syllabus data + admin seed flow: `src/lib/nuSyllabus.ts` (6 subjects, 11 chapters, 80 topics, 80 lesson stubs, all draft, `syllabusVerified: false`), `applyNuSyllabusSeedDocs` + `checkNuSyllabusSeedStatus` in `src/lib/nuAdmin.ts`, audit action `nu-syllabus-applied` in `firestore.rules` + `src/lib/admin.ts`. Set validation clean. |
| `14675ab` (2/5) | The three site-check follow-ups (see below). |
| `517b9ec` (3/5) | `NuSubjectPage.tsx` (was untracked — reviewed coherent, finished, committed) + new `NuTopicPage.tsx`; routes in `App.tsx`; group-page subject links; `nuSyllabus.test.ts` (11 tests). |
| `aa49734` (4/5) | Firestore rules + rules tests for `nuSubjects` / `nuChapters` / `nuTopics` / `nuLessons`. |
| `070efaf` (5/5) | `AdminNuSyllabusPage.tsx` (`/admin/admissions/syllabus`) + route + AdminPage card. |

**Total diff vs NU-5 (`9a065e4`): 15 files, +2,145 / −23.**

### Pages (design §5.4)

- **Subject page** `/admissions/national-university/:group/subjects/:subject` — breadcrumb (hub ← group), draft banner, per-chapter topic lists with links, honest "এই বিষয়ে এখনো ০টি প্রশ্ন" empty state, 20-mark line with the circular as source. The group-40 block page is a draft note (no chapters, no topics — the block stays ONE doc).
- **Topic page** `.../:subject/:topic` — breadcrumb (hub ← group ← subject ← topic), draft banner, topic name/detail + chapter/subject, lesson-stub card, honest "এই টপিকের প্রশ্ন তৈরি হচ্ছে — ০টি প্রশ্ন" empty state. Practice (NU-8), favorites (NU-13) and progress (NU-10/11) appear as plain-text notes that they arrive in later steps — **never as buttons that do nothing**.
- **Unknown slugs** (wrong group/subject/topic) show an honest "not found" card — the design §5.2 wrong-slug pattern.
- **Group pages** now link their 3 common subjects to the subject pages (`slug` added to `NuGroupSubject`; the group-40 block stays unlinked). The stale "টপিকের তালিকা এখনো তৈরি হয়নি" empty state is now a draft note.
- **Routes** are 5-segment paths placed after the static group routes and before the hub's `:tab` route, so they never collide with it.

### Syllabus data (from 1/5, unchanged by 2/5–5/5)

3 common subjects (Bangla / English / General Knowledge, 20 marks each, verified from the circular) + 3 group-40 block docs (`isGroupBlock: true`, 40 marks, no chapters). 11 chapters, 80 topics, 80 lesson stubs (`NU_LESSON_STUB_BODY_BN` — an honest "being prepared" note, no fabricated content). All `status: 'draft'`, `syllabusVerified: false`, `NU_SYLLABUS_READ_FROM_FIRESTORE = false` with 3 switch criteria in the module header. Sources: Bangla from NCTB সাহিত্যপাঠ 2024-25 session syllabus; English Reading from NCTB English for Today Classes 11-12 (2015, 15 units); grammar/writing standard HSC 2nd-paper items; GK standard admission domains, no single textbook.

### Rules (design §19.3.4) — 4 new match blocks + 4 validators

- **Read:** Published for everyone; a verified teacher may also read a draft they created.
- **Write:** Owner/Admin, or a verified teacher (own Draft only, and `createdBy` must be their own uid). **Publish (draft → published): Owner/Admin only.** Published docs are **never edited in place** (a correction is a new version — NU-7); **delete: never**.
- **Field checks mirror `lib/nuSyllabus.ts`:** marks 20 common / 40 block; `groupIds` 1–3 valid slugs; block slugs only `group-*`; common slugs only `bangla`/`english`/`general-knowledge`; `order` int ≥ 1; `syllabusSource` / `circularVersion` / `createdBy` non-empty strings; `syllabusVerified` bool; `status` draft/published; subjects carry no `order` field.

### Admin page — `/admin/admissions/syllabus` (AdminGuard)

Per-collection summary counts (nuSubjects 6 / nuChapters 11 / nuTopics 80 / nuLessons 80 = **177 docs**) + grouped tables with matches / differs / missing / unreadable per doc, via the 1/5 seed flow (validate-all-first → dependency-order writes → one audit entry `nu-syllabus-applied` → read-back check). **Applying the seed does NOT switch the pages' read path** — the subject/topic pages still render the code-backed syllabus until a live seed exists and matches.

## Site-check follow-ups (commit 2/5) — all three DONE

**(a) Eligibility per-exam minimums — tests added, NO code change.** NU-4's `validateAdmissionEligibility()` already encoded them (`sscMinimum()` 2.25 Science / 2.0 else; HSC < 2.0 check). 3 unit tests added to `nuAdmission.test.ts`: humanities does-not-meet when SSC < 2.0 (combined 6.9 still passes), humanities does-not-meet when HSC < 2.0 (combined 6.9 still passes), humanities meets at exact minimums SSC 2.0 + HSC 2.5 = 4.50. Recorded honestly in design doc §3.1 — the follow-up was pinning tests, not a code fix.

**(b) Memo reconciliation — RESOLVED from the PDF itself.** `browser.open` on `https://www.nu.ac.bd/uploads/notices/notice_3348_pub_date_23112025.pdf` (crawled 22 Nov 04:15 UTC) shows header line 9: "স্মারক নং: 10(226)জাতী:বি:/রেজি:/অ্যাকা:/2026/3348, তারিখ: 20/11/2025". **Doc/code "2026/3348" were CORRECT; the 10:04–10:11 browser check's "2025/3048" was a misreading** (it appeared in Bangla digits "২০২৫/৩০৪৮" in design doc §3.1 line 167 — that's why ASCII grep missed it). Corrected: design doc §3.1 line 167 + status note. Memo pinned by a unit test (`NU_VERIFIED_NOTICE.memoNo` contains '2026/3348', PDF URL is `notice_3348`). No code value changed. The PDF also re-confirms clause ১(ক) minimums, application 23 Nov–31 Dec 2025, fee ৳1,000 by 04 Jan 2026, 100 MCQ / 1 hour / no negative marking, pass 35, merit 200 = exam 100 + SSC GPA×8 (40%) + HSC GPA×12 (60%).

**(c) 25 Apr 2026 as history — DONE.** Added to `NU_CALENDAR_EVENTS` as a 3rd event: "ভর্তি পরীক্ষা (২০২৫-২৬)", "২৫ এপ্রিল ২০২৬", "ইতিহাস — পরীক্ষা সম্পন্ন হয়েছে". Stale comments corrected (2026-27 date still has no event — not announced). Design doc §10.3 + §5.2 updated.

## Verification evidence

- **Build: PASS** (`tsc -b && vite build`; precache 80 entries). One fix on the way: an unused `BASE_URL` constant in the new rules test file failed `tsc` (`TS6133`) — removed; the build then passed.
- **Unit tests: 75/75 PASS** (NU files only: `nuAdmission` 27 + `nuStructure` 23 + `nuProfile` 14 + `nuSyllabus` 11). The 11 new syllabus tests cover: set validation clean, 6/11/80/80 counts, 20+20+20+40 = 100 per group, group-40 block isolation (no chapter/topic references a block subject), every topic has exactly one lesson stub, all docs draft + unverified, 177 seed docs with unique ids, validators catch bad docs, route helpers, lookups, group-page/syllabus slug agreement, prohibited wording.
- **Rules NU-6: 36/36 PASS** (`emulator-tests/rules-nu6-syllabus.test.ts`, n1–n36: student/pending-teacher writes denied, verified-teacher own-draft create/update allowed, publish-by-teacher denied, bad values denied, admin create/publish allowed, published-doc update denied, read matrix incl. signed-out, delete never).
- **Full rules suite: 308/308 PASS** (10 files: NU-6 36 + NU-5 32 + NU-4 60 + rules 66 + role 67 + rules-step2 25 + dashboard-filter 10 + progress-summary 3 + guardian-e2e 8 + repro-guardian 1). NU-5's baseline was 272; 272 + 36 = 308 — no regressions.
- **Preview: 15/15 routes → 200** — https://eduvelto--nu-6-subjects-th1auoje.web.app (channel `nu-6-subjects`, expires 29 Nov 04:45 UTC). Routes: `/`, `/admissions`, `/admissions/national-university`, 3 group pages, 3 subject pages (science/bangla, science/english, science/general-knowledge), 2 topic pages (`.../bangla/oporichita` for humanities + science), `/admissions/dashboard`, `/admin/admissions/syllabus`, `/admin/admissions/structure`. **Honest limit:** these are hosting-level 200s (the SPA shell serves every path). Rendered content per slug is covered by unit tests (route helpers + lookups) only. One checked URL (`/business/subjects/english/reading-comprehension`) is NOT a real topic slug (English reading topics are `eft-unit-01…15`) — it would show the honest not-found card client-side; it is not counted as a verified topic route.

### Two verification incidents (recorded, not hidden)

1. **Wrong emulator (first full-run attempt).** A bare `npx vitest run` connected to OTHER agents' emulators already listening on this shared VM (deploy worktree on 8080, jobs worktree on 8081) — which load THEIR rules files, not this worktree's. It failed 3 tests (NU-4 n11, rules.test a1, repro-guardian) and 3 files at setup (incl. rules-nu6). Those failures were contamination, not regressions: the clean rerun below passed everything. Lesson: on this VM, never run `vitest run` bare for emulator tests — always start a fresh emulator with this worktree's rules (or alt ports).
2. **Port race (first clean full-run attempt).** The alt-ports run on firestore 8084 failed with `BindException: Address already in use` — the app-update agent's emulator had grabbed 8084 at the same moment. Retried on 8085/9095/4406/4506 — clean pass, 308/308. The temp config (`firebase.alt-ports-nu6.json`) was deleted after the run.

## Still unverified / not done (honest list)

- **Signed-in browser click-through NOT verified** (no live browser in this session) — the admin seed-apply button, the subject/topic pages rendering, and the AdminPage card have never been clicked in a signed-in browser.
- **Seed NOT applied to any database** (disk-only, as in NU-4/NU-5). No live Firestore docs exist for `nuSubjects`/`nuChapters`/`nuTopics`/`nuLessons`.
- **Read path NOT switched** — subject/topic pages render the code-backed syllabus; `NU_SYLLABUS_READ_FROM_FIRESTORE` stays `false` until a seed apply exists and matches (3 switch criteria in `nuSyllabus.ts`).
- **0 verified teachers** — nothing can be Published until a teacher is verified (launch gate, not a build blocker). All 177 seed docs are draft.
- **Blocker A stands:** no 2026-27 Honours 1st year circular issued yet. **Blocker B stands:** group-40 sub-split still unverified for the current 20/20/20/40 structure.
- **Published docs are immutable in place** (same rule as `nuQuestions`) — a correction to a published syllabus doc needs a new version; NU-7 defines that flow.
- **Design doc §19 vs rules — 2 honest deviations carried from NU-4/NU-5:** rules have no `String.split` (userId field + id equality instead); `deadlineAt` bounded, not exact-equal (NU-4's corrections; unchanged by NU-6).

## Next — NU-7 Question Bank + verification

Per design §15: the two-tier bank (`nuQuestions` + `nuQuestionKeys`, receipt-gated — the NU-4/NU-5 rules already carry the `nuQuestions` match block from §19.3.2), teacher review workflow, and the publication state machine (draft → verify → publish). Depends on NU-6's syllabus structure (topics are the bank's parents) and on Job Steps 8/9 only for the shared engine interface (§13 #20). **The content blocker is unchanged: 0 verified teachers (NU-Q4).**

## Files changed (NU-6, vs NU-5 `9a065e4`)

New: `src/lib/nuSyllabus.ts`, `src/lib/__tests__/nuSyllabus.test.ts`, `src/pages/NuSubjectPage.tsx`, `src/pages/NuTopicPage.tsx`, `src/pages/AdminNuSyllabusPage.tsx`, `emulator-tests/rules-nu6-syllabus.test.ts`, `team/nu-6-subjects-report-2026-11-22.md` (this file). Edited: `src/lib/nuStructure.ts` (calendar history event, group-subject slugs), `src/lib/__tests__/nuAdmission.test.ts` (3 eligibility-minimum tests), `src/lib/__tests__/nuStructure.test.ts` (memo pin + calendar tests), `src/pages/NuGroupPage.tsx`, routes in `src/App.tsx`, `src/pages/AdminPage.tsx`, `src/lib/nuAdmin.ts`, `src/lib/admin.ts`, `firestore.rules`, design doc (1,289 → 1,307 lines), status note. `src/lib/nuAdmission.ts` itself was NOT changed (the minimums were already encoded — tests only). Backups: `backups/nu-admission-nu6-followups-2026-11-22.tar.gz` (commit 2/5), `backups/nu-admission-nu6-complete-2026-11-22.tar.gz` (final).
