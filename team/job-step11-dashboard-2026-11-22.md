# Job Preparation — Step 11: Dashboard (closure report)

**Date:** 2026-11-22 · **Branch:** `jobs/step11-dashboard` · **Base:** main `918558f`
**Worktree:** `~/workspace/eduorbit/phase2-project-step11/`
**Status:** CLOSED IN STAGING — build + unit + rules + emulator E2E + preview verified.
**NOT deployed to live. NOT merged to main. No deploy-main touched.**

## Scope

The Job dashboard (`/jobs/dashboard`, `JobSeekerDashboardPage`) — a personal
study companion, not an analytics platform or leaderboard. All 17 items from
`team/job-ui-ux-design-step2.md` §5, in P1–P5 order:

- **P1 — Today's preparation:** Next practice (recommendation or honest
  fallback), Continue learning (latest attempt + verified retry link),
  Daily goal (profile goal + today's real progress, static bar, no
  punishment), Daily mock + Weekly mock cards (existing live cards kept).
- **P2 — Summary numbers:** per-exam progress ("আমার অগ্রগতি — সাম্প্রতিক
  কার্যকলাপ", 4-number summary + per-exam rows + cap footnote), Recent
  practice (last 5, each linking to its result), My results (per-exam
  best vs latest for mocks via `attemptTrend`, never mixed/averaged).
- **P3 — Weak topics:** rule stated on the card (≥5 answered, accuracy
  <50%); practice link ONLY when a published bundle exists for that
  exact topic, else "এই টপিকের অনুশীলন সেট এখনো তৈরি হয়নি".
- **P4 — Quick entry:** Wrong-answer notebook (count + recent 3 to result
  pages; re-practice flow = Step 13), Favourites (Step 13), Revision
  schedule (Step 12, anchor to #weak-topics), Planner (Step 12),
  Achievements (rule shown per badge, "কোনো সার্টিফিকেট নয়"); supporting
  Profile card, Mode switch, Target exam, Enrolled categories.
- **P5 — Upcoming exams:** Circulars (Step 14; target exam's `officialUrl`
  link until then), Calendar (Step 14, no guessed dates), Notifications
  (honest empty state, Step 14).

**Hard honesty rules kept:** no invented numbers; accuracy is `null`
(never 0%) when nothing is answered; no readiness %, pass probability,
peer comparison, ranks, cut-off predictions, or "verified" claims;
practice results are NEVER shown as verified; every practice link is
guarded against a published bundle (`status == 'published'` and
`questionCount > 0`); a recommendation is omitted (truthful empty state)
when no live set exists. Load errors show a retry card — an error is
never shown as fake "no data".

## Files changed

| File | Change |
|---|---|
| `src/lib/jobDashboard.ts` (new) | Pure helpers, no Firestore: `accuracyOrNull`, Dhaka day keys/labels, `computeStreakDays`, `todayStats`, `weekActivity`, `perExamProgress`, `recentAttempts`, `dashboardWeakTopics`, `pickRecommendation`, `dashboardAchievements` + `JOB_ACHIEVEMENT_BN`, `wrongAnswerSummary` |
| `src/lib/jobDashboardData.ts` (new) | Firestore loaders: `loadDashboardAttempts` (listJobAttempts 20 + listMockAttempts 20, merged newest-first, capped flag), `loadPublishedBundlesForExams`, `verifyPracticeBundle`, `verifyMockRetry` (tries `[mockId, daily__mockId, weekly__mockId]`), `listUserAchievementKeys` + `awardMissingJobAchievements` (existing `userAchievements` collection). One-shot getDoc/getDocs only, NO onSnapshot |
| `src/pages/JobSeekerDashboardPage.tsx` (rewritten, ~71 KB) | All 17 items in P1–P5 order (see Scope) |
| `src/lib/jobAnalysis.ts` | `JobAttemptSummary` gains `mockId: string \| null` (bare mock key; retry verification); `attemptSummaryFromStored` populates it |
| `src/lib/__tests__/jobAnalysis.test.ts` | Fixture updated (`mockId: 'full__bcs__1'`) |
| `src/lib/__tests__/jobDashboard.test.ts` (new) | 18 unit tests |
| `emulator-tests/rules-step11-dashboard.test.ts` (new) | r1–r6 read-path proof + i12 real-content E2E |
| `firestore.rules` | **NO CHANGE** (see Rules size below) |

## Verification

- **Build:** `npm run build` (tsc -b && vite build) — PASS. Fixed during
  the build: duplicate `JobMockWithId` import, unused `dayLabelBn`
  import, test type import moved to `jobAnalysis`.
- **Unit:** `npm run test:unit` — **554/554 PASS (22 files)**.
  New: `jobDashboard.test.ts` 18/18 (accuracy null, Dhaka day keys,
  streak incl. yesterday-alive + gap break, today/week stats, per-exam
  progress incl. only-still-published sets + accuracy null, weak-topic
  thresholds incl. single-wrong-answer never weak, recommendation
  prefers published bundle + target exam, achievements, wrong-answer
  dedupe).
- **Rules:** `npm run test:rules` — **1020/1020 PASS (26 files)**,
  sequential, default ports, fresh emulator.
  New file 7/7: r1 owner lists own practice attempts; r2 another student
  denied; r3 signed-out denied; r4 owner lists own mock attempts /
  other denied; r5 owner can create + read own achievement doc, update
  denied, other student create denied; r6 signed-in student lists
  published bundles only (draft excluded by the rule).
  i12 real-content E2E: the verbatim Step 9/10 fixture (3 BCS English
  questions bcs-eng-001/002/003, REAL_KEY, REAL_SNAPSHOT) — 4 practice
  attempts (D/D/D → Q3 correct, Q1+Q2 wrong) on today ×2, yesterday ×1,
  3 days ago ×1, plus 1 mock (C/A/D, all correct) today, seeded with
  controlled `submittedAt` (fixed Dhaka midday anchor
  2026-11-22 14:00, never `Date.now()` — a midnight-boundary bug in the
  first run proved the anchor necessary). Dashboard lib run over the
  STORED attempts read back: per-exam BCS 5 attempts / 15 questions /
  7 correct / 46.7% / topics [tense] / sets completed 2 / sets available
  2 (draft excluded); streak 2; week today 3 sessions, yesterday 1;
  weak topic tense 15 answered, 7 correct, 46.7%, sample `signal`;
  recommendation = tense practice bundle; achievements first-practice +
  first-mock, NO 7-day-streak; wrong answers distinct 2 (bcs-eng-001,
  bcs-eng-002).
- **Rules size — NO change shipped:** `git log e365201..918558f --
  firestore.rules` = no rules changes on main since Step 9; stripped
  source on this branch = 172,356 bytes, compiled = 254,862 (Step 9
  deploy measurement), **margin on THIS branch = 1,138 bytes**.
  The "~6,130 bytes" figure is the POST-public-ID-refactor state
  (staged branch `feature/public-user-ids`, NOT merged on main) — do not
  use it for this branch. Consequence: a `jobNotifications` match block
  would almost certainly breach → **jobNotifications collection + rules
  DEFERRED to Step 14** (with circulars, its main source); Step 11
  ships the notifications card with an honest empty state and NO rules
  change. `userAchievements` rules already exist (owner create/read,
  update/delete false) — no new rule needed.
- **Preview:** https://eduvelto--step11-dashboard-qmvqiumv.web.app
  (expires 2026-11-29 18:17:50 UTC). Verified BY CONTENT: 8/8 routes
  200 (`/`, `/jobs`, `/jobs/dashboard`, `/jobs/analysis`,
  `/jobs/result/x`, `/admissions`, `/privacy`, `/founder`); main bundle
  `index-CxbF1Q1Q.js` md5 = dist; dashboard chunk
  `JobSeekerDashboardPage-BRbYbBL7.js` md5 = dist; new Step 11 strings
  present in the preview chunk ("আমার অগ্রগতি", "সাম্প্রতিক অনুশীলন",
  "পরবর্তী অনুশীলন", "দুর্বল টপিক" ×6, "ভুল উত্তর" ×2,
  "প্রাথমিক ইঙ্গিত" ×3, "দুর্বলতার সংকেত" ×2, "৫–৯টি প্রশ্নে" ×2,
  "কোনো সার্টিফিকেট নয়", "আপনি এখনো কোনো অনুশীলন করেননি");
  **0 prohibited NU phrasing** in main bundle + dashboard chunk.
  Preview-channel quota was 45/50 — no deletion needed.
- **Rendered (Playwright) check: OWED, not passed** — sandbox proxy
  still down. Never reported as passed.

## Time-tracking finding (verified in code)

`flushTime()` in `JobPracticePage.tsx:284` / `JobMockPage.tsx:477`
computes elapsed from wall-clock `Date.now() - startedAt` with NO
`visibilitychange` pause (no `visibilitychange`/`document.hidden` in
`src/lib/job*.ts` or the Job pages) — stored `timeSpentSeconds`
includes idle-tab time. Decision: the dashboard shows completed
sessions + questions, never invented "study minutes". A real
active-time pause (60–90s inactivity) is an engine follow-up for
Step 12, not Step 11.

## Multi-AI consultation — combined USED / ADAPTED / REJECTED

Gemini: https://gemini.google.com/app/a505818aff0ebe4c (22 Nov ~23:53).
ChatGPT: https://chatgpt.com/uc/6b032be9-d020-83ea-9046-f05d0e4cf1f4
(22 Nov ~23:55). Both folded in before closing.

| # | Advice | Verdict | Reason |
|---|---|---|---|
| G1 | Next Recommended Practice hero — one primary CTA, why picked from real data ONLY if a matching published practice item exists; never "AI-curated"/"Verified exam predictor"; never construct `/practice/:topicId` unless verified; fall back to a general hub link or omit | USED | `pickRecommendation` + `verifyPracticeBundle`; fallback = daily mock / start card; no invented badges |
| G2 | Per-Exam Progress, only exams selected/practiced; X of Y sets completed, Z questions attempted, last activity; NEVER readiness %, pass probability, "syllabus 100% covered", peer averages, cut-off predictions, pass/fail, ranks, fake baseline | USED | `perExamProgress` — per-exam metrics only, sets completed of still-published sets, accuracy null when unanswered; section named "Practice activity" in spirit (no combined %) |
| G3 | Weakest Topics — only topics with a real sample + lower accuracy, own accuracy + attempt count, links ONLY to real existing practice sets for that exact topic; never label zero-attempt topics weak; no scare copy, no unverified exam-weight claims; no heavy charts | USED | `dashboardWeakTopics`: total ≥5 AND accuracy <50, sample `early` (5–9) / `signal` (10+); rule stated on the card; link only when a published bundle exists |
| G4 | Recent Attempts & Scores — last 5–10, name/exam tag/score e.g. 18/25/when, tap to breakdown or retry that exact set; NEVER percentile/rank/average-student/"above average"/fabricated placeholder rows when empty | USED | `recentAttempts` (last 5) + verified retry links; clean empty state in Bangla |
| G5 | Time Spent lower on mobile — total active practice time today + last 7 days, with a clear note on what counts; NEVER inflated idle-tab numbers, made-up streaks, comparisons | ADAPTED | Time shown as **completed sessions + questions, never minutes** — the engine has no inactivity pause (see Time-tracking finding), so minutes would be inflated idle-tab numbers; streak shown is own-view-only, computed from real attempt dates |
| G6 | ONE per-user summary doc (`userProgress/{uid}`) updated when an attempt finishes; fetch only last N attempts `.limit(5)`/`.limit(8)` | ADAPTED / REJECTED (summary doc) | Fetch limits ADAPTED: 20+20, not 5/8 — needed for per-exam stats + 7-day activity + streak, still one-shot, cap footnote when hit. Summary doc REJECTED: reuse existing `jobAttempts`/`jobExamAttempts` + `jobAnalysis` (bounded one-shot reads already meet the goal); a new summary doc needs a writer + backfill + rules against a 1,138-byte margin |
| G7 | One-shot getDoc/getDocs over onSnapshot | USED | All dashboard loaders are one-shot; no listeners |
| G8 | Route-split dashboard (React.lazy + Suspense), no heavy charting libs — CSS bars / text tables | USED (already satisfied) | `App.tsx` already lazy-loads the page; daily goal uses a plain static div bar, no charting lib |
| G9 | Guard every practice link against an explicit map of published sets (`published === true` and `questionCount > 0`); skip a recommendation if no live set exists | USED | `verifyPracticeBundle` / `pickRecommendation` guard; `loadPublishedBundlesForExams` |
| G10 | No stress machine: no red danger gauges, countdown timers, implied rankings; single-column mobile-first, large tap targets, concise Bangla labels | USED | No gauges/timers/rankings; single-column flow; static (non-animating) daily-goal bar |
| C1 | Guiding question "Am I getting better at my target exam, what should I work on next, and where can I practice it?"; dashboard = personal study companion, NOT analytics/leaderboard; progress personal + exam-specific | USED | Drives the whole page order (P1→P5) and the per-exam separation |
| C2 | Welcome + today's study summary — Bangla greeting + display name + selected exam/track + "আপনার প্রস্তুতি চালিয়ে যান" + primary action Continue studying; today's activity ONLY if real; NEVER fake daily goals, unevidenced motivational stats, random congratulations, exam countdown timers unless the student selected an actual exam date | USED | Profile card + daily-goal card (goal from profile, today's real progress); no fake goals, no countdowns |
| C3 | My exam progress — per exam separately (attempts, topics practiced, questions attempted, last activity, link to detail); NEVER one combined % across exams, progress from the platform's total question count, readiness %, progress bars that move on page-open, rankings/peers; accuracy = correct ÷ answered; without a defensible completion formula call it "Practice activity" | USED | `perExamProgress` per exam; accuracy null when unanswered; static bar only; no combined % |
| C4 | Continue learning — last opened set/material, last exam+topic, resume button, real completion state, link to original content; store a content ID and verify the content still exists + is published before rendering the resume link; NEVER resume to deleted content, invented positions, or a generic link to the same page | USED | Latest attempt + `verifyMockRetry` / `verifyPracticeBundle`; "set no longer published" note when verification fails |
| C5 | Recent practice attempts — compact cards (title, exam, topic, date, correct/total, accuracy, time if reliably recorded, link to review); NEVER unsubmitted attempts, scores without denominators, reconstructed scores after content changes, or other students' scores | USED | Only submitted attempts (list queries filter `kind` + order by `submittedAt`); scores always with denominators; time omitted (unreliable — see G5) |
| C6 | Topics to improve — low-accuracy WITH sample size + incorrect count + time window + link to real practice; thresholds <5 "Not enough practice data", 5–9 "Early indication", 10+ eligible weakness signal; NEVER weakest from one wrong answer, zero-practice topics as weak, low accuracy without sample size, recommendations for unavailable content, permanent weakness labels ignoring improvement | USED | Thresholds used exactly (5/9/10, stricter than the design doc's 3+); sample label shown; rule stated on the card |
| C7 | Study activity/time — total active practice time, this week, completed sessions, by-day activity, by-exam split, simple weekly chart; track ONLY active sessions (60–90s inactivity pause); NEVER page-open/tab-open time, fake streaks, shame messages, meaningless productivity scores; if time tracking is unreliable, show completed sessions instead of invented time | ADAPTED | Sessions instead of minutes (engine has no inactivity pause — Step 12 follow-up); week activity = by-day sessions + questions; no shame copy; no streaks except the own-view consecutive-days count from real dates |
| C8 | Recommended next practice — priority: low-accuracy topics first → check published content exists → prefer not recently completed → prefer selected exam → fallback to another existing set → truthful empty state if nothing eligible; NEVER a broken route/unpublished/empty set | USED | `pickRecommendation` implements exactly this priority order |
| C9 | Hierarchy: 1 Welcome+Continue, 2 exam progress, 3 recent attempts, 4 topics to improve, 5 recommended next practice, 6 study activity, 7 detailed analytics; on mobile, recommended practice right after recent attempts if a relevant published set exists | ADAPTED | Page order is P1 (Next practice + Continue) → P2 (exam progress, recent, results) → P3 (weak topics) → P4 (wrong answers, favourites, planner, achievements) → P5 (circulars, calendar, notifications); the design-doc P1–P5 order governs because it is the standing plan, and it already places the recommendation first |
| C10 | Mobile rules: single column, full-width primary actions, cards sparingly, readable Bangla type, 44–48px touch targets, no horizontal scrolling for essentials, simple charts with text alternatives, skeleton only for real loading, no large images/animations/autoplay, detailed analytics on demand | USED | Single-column flow; `ProgressBar` animation avoided (static div bar); skeleton only while loading |
| C11 | Empty states explicitly: new student, no selected exam, no attempts, no weak topics, no recent attempts, no time records, no recommendation, deleted practice set, offline, loading, data error; data-freshness indicators | USED | Every section has an explicit Bangla empty state; load-error card with retry; deleted-set note via verification |
| C12 | Bangla labels (আমার অগ্রগতি, আমার পরীক্ষাসমূহ, সাম্প্রতিক অনুশীলন, যেসব বিষয়ে আরও অনুশীলন প্রয়োজন, পড়াশোনার সময়, আপনার জন্য অনুশীলন, পড়াশোনা চালিয়ে যান, অনুশীলন করা প্রশ্ন, সঠিক উত্তর, সঠিক উত্তরের হার, সব দেখুন); keep BCS, NTRCA, MCQ, Bank Job in English | USED | Labels used throughout (exact headings: আমার অগ্রগতি, সাম্প্রতিক অনুশীলন, পরবর্তী অনুশীলন, দুর্বল টপিক, ভুল উত্তর); exam names kept in English |
| C13 | Suggested Firestore structure: `users/{uid}/examProgress/{examId}`, `users/{uid}/attempts/{attemptId}`, `users/{uid}/studySessions/{sessionId}`, `users/{uid}/topicStats/{topicId}`, `practiceSets/{practiceSetId}` | REJECTED | Reuse existing Step 9/10 structures (`jobAttempts`, `jobExamAttempts`, `progressSummaries`, `jobAnalysis`) wherever they cover the need — do not duplicate aggregates; new subcollections need rules against a 1,138-byte margin + a writer + backfill |
| C14 | Cloud Functions / trusted backend for score aggregation | ADAPTED | Not available on Spark free without billing. Step 9 precedent kept: "submitted" = client-attested, practice NEVER shown as Verified; rules bound the claimed values (security audit H1/M4 pattern) |
| C15 | React structure: DashboardPage + components + hooks + services + utils; calculation logic outside UI; `calculateAccuracy` returns null (not 0%) when no data | USED | `jobDashboard.ts` (pure helpers, outside UI) + `jobDashboardData.ts` (services); `accuracyOrNull` returns null |
| C16 | Performance: fetch profile + selected exams first, small summary per exam, latest 5 attempts initially, topic details on demand, analytics on demand, paginate older attempts, offline persistence, never download whole question banks, no unnecessary listeners, consolidated summary doc | ADAPTED | 20+20 one-shot reads (not 5) for the stats the page actually shows; no question banks downloaded; no listeners; summary doc rejected (see G6) |
| C17 | Phased priority: Phase 1 essentials (welcome, selected exams, exam progress, recent attempts, continue learning, real links); Phase 2 insights (topic accuracy, weak topics, time tracking, weekly summary); Phase 3 recommendations | USED | Phase 1 + 2 shipped (weak topics + week activity included); Phase 3 recommendation is in (guarded), trends deferred |
| C18 | Success metrics: dashboard-to-practice conversion, recommendation click-through + availability (% resolving to published content), practice completion, return usage, data accuracy, slow-connection performance | NOTED | No analytics exists on the site (Master audit finding); metrics are a follow-up once analytics lands, not a Step 11 build item |

## Commits

- `0a01e43` feat(step11): Job dashboard — 17-item expansion (P1–P5)
  (core + page + unit tests; build PASS)
- (this report + emulator test) — to be committed as the closure commit.

## What is left for deploy

1. **Real merge in a scratch worktree** (never `git merge-tree`) —
   main has moved since this branch's base (`918558f`; the 23:02 deploy
   sweep was deploying held items). Merge, re-run build + unit + rules
   in the merge worktree, then fast-forward main.
2. **Hosting deploy only** — NO rules deploy, NO Firestore/index
   deploy (rules untouched; no new index — the dashboard queries use
   the Step 8/9/10 composites already live).
3. Live verify BY CONTENT both domains (bundle md5 = dist, Step 11
   strings present, 0 prohibited NU phrasing, routes 200).
4. **Rendered (Playwright) check OWED** — proxy down at build time.
5. Live still has NO published mock definition/manifest
   (`jobExamDefinitions` 0, `jobQuestionSetManifests` 0) — a real
   student cannot take a FULL MOCK until a Moderator publishes one
   (data task, unchanged by Step 11). The dashboard's mock cards and
   retry links handle the unpublished state honestly.
6. Step 12 follow-ups (not Step 11): real active-time pause
   (60–90s inactivity) in the practice/mock engines; micro-drill
   bundle builder (Step 10 open question — who builds per-topic
   10-question bundles); `jobNotifications` collection + rules
   (Step 14, with circulars).
