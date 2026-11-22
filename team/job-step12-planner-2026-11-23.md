# Job Preparation — Step 12: Planner — Closure Report (staging)

- Date: 2026-11-23
- Branch: `jobs/step12-planner` — worktree `~/workspace/eduorbit/phase2-project-step12/`
- Base: main `28bc870` (Step 11 deploy)
- Status: **CLOSED IN STAGING — NOT deployed to live, NOT merged to main**
- Preview: https://eduvelto--step12-planner-psgjd19h.web.app (expires 2026-11-29 18:53:45 UTC)
- Consultations folded in: Gemini (chat https://gemini.google.com/app/c18018a1367ab64d) +
  ChatGPT (chat https://chatgpt.com/uc/6b0333c7-c1c8-83ea-8541-8757a3046c54) — see
  §6 for the single combined USED / ADAPTED / REJECTED table and §5 for the four
  reconciliations.

## 1. Scope (from the design docs + Step 11)

A study planner at `/jobs/planner`, built only on the student's REAL attempts and
the REAL published content catalog:

- **Today** — today's actionable plan per effort mode (হালকা দিন / সাধারণ দিন /
  গভীর প্রস্তুতি), the daily-mock row, daily-goal progress.
- **This Week** — 7 day cards (today first): revision assignment, new-practice
  rotation, daily mock, done marks from real attempts, goal-met mark for today.
- **Revision schedule** — weak-topic revision queue, grouped আজ / আগামীকাল /
  এই সপ্তাহে / পরে, with the interval rule stated on the card.
- **Daily goal** — the profile goal + today's real progress + a neutral
  suggestion line when the goal is far above recent reality; "লক্ষ্য বদলান →"
  goes to /profile.
- Step 11's dashboard P4 cards (Planner / Revision schedule / Daily goal) are
  now WIRED to the real planner — the "Step 12-এ আসছে" placeholders are gone
  (0 occurrences in source and in the preview bundles).
- The planner is ADVISORY, never a mandatory timetable (design §3.3 #15, §3.9).
  Copy says so on the page: "প্ল্যানার পরামর্শমূলক — বাধ্যতামূলক সময়সূচি নয়".

### 1b. Step 11 engine follow-up — active-time pause (included)

`flushTime()` in the practice/mock engines used wall-clock elapsed time with no
`visibilitychange` pause, so stored `timeSpentSeconds` included idle-tab time.
Fixed going forward with a real active-time clock (`src/lib/activeStudyTime.ts`):

- Pauses immediately on `document.visibilitychange` → hidden and on window
  blur; resumes on visible / focus.
- Interaction (pointerdown / keydown / scroll / touchstart) resumes an
  idle-paused clock only — an interaction while hidden does NOT resume it.
- Idle timeout **90 seconds** (see reconciliation R1).
- A segment is capped at last-interaction + 90 s (a suspended laptop adds at
  most 90 s to one question); deltas < 0 are discarded; `flush()` returns
  whole active seconds since the last flush and restarts the clock.
- The clock writes NOTHING itself — pages keep calling `flushTime()` on
  navigation / submit, and the existing 1200 ms debounced session autosave is
  the checkpoint mechanism.
- **The mock EXAM DEADLINE never pauses** — only the informational
  per-question clock does. The deadline stays server-authoritative
  (design §3.5 flow 7); this is stated in a comment on JobMockPage.
- Historical stored values are UNTOUCHED — only recording going forward is
  fixed. The dashboard shows sessions + questions, never invented minutes
  (unchanged from Step 11).

## 2. Files changed (11 modified/added + 1 test file)

| File | What |
| --- | --- |
| `src/lib/activeStudyTime.ts` (NEW) | `createActiveClock()` (pure, testable) + `useActiveClock()` hook; `ACTIVE_IDLE_TIMEOUT_MS = 90_000` |
| `src/lib/__tests__/activeStudyTime.test.ts` (NEW) | 12 tests |
| `src/lib/jobPlanner.ts` (NEW) | Pure helpers: `topicHealth()`, `revisionIntervalDays()`, `revisionQueue()`, `weeklyPlan()`, `todaysPlan()`, `goalSuggestion()`; `MAX_REVISION_PER_DAY = 2` |
| `src/lib/__tests__/jobPlanner.test.ts` (NEW) | 19 tests |
| `src/lib/jobPlannerData.ts` (NEW) | Thin module re-exporting `loadDashboardAttempts` + `loadPublishedBundlesForExams` from jobDashboardData; documents the read budget (≤20 practice + 20 mock attempts + one bundle query per touched exam) and the deferred-collections decision |
| `src/pages/JobPlannerPage.tsx` (NEW) | Route `/jobs/planner`: Today / This Week / Revision (`id="revision"`) / Daily goal; signed-out login card; load-error retry card |
| `src/App.tsx` | Lazy import + `<Route path="/jobs/planner">` before `/jobs/:exam/:tab` (next to `/jobs/analysis`), with the routing-order comment |
| `src/pages/JobSeekerDashboardPage.tsx` | P4 cards wired: `plannerHealth` / `plannerQueue` / `plannerWeek` memos reuse the already-loaded attempts + bundles (no extra reads); Revision card → `/jobs/planner#revision`; Planner card → `/jobs/planner` |
| `src/lib/jobDashboard.ts` | `PublishedBundleRef` gains optional `titleBn` (planner's new-practice labels; fallback is the topic label) |
| `src/lib/jobDashboardData.ts` | `loadPublishedBundlesForExams` now populates `titleBn` |
| `src/pages/JobPracticePage.tsx`, `src/pages/JobMockPage.tsx` | Engine wiring: `timeRef` replaced by `questionRef` + `useActiveClock()`; `flushTime()` now returns `activeClock.flush(Date.now())`; `goTo()` flushes then sets the question |
| `emulator-tests/rules-step12-planner.test.ts` (NEW) | r1–r3 read-path proof + i13 real-content E2E (see §4) |
| `firestore.rules` | **UNCHANGED — zero diff vs main** |

## 3. Planner rules (the deterministic core)

- **Mastery bands** (reused from Step 11's weak rule so dashboard and planner
  never disagree): weak <50% with ≥5 answered; moderate 50–80%; strong 80%+;
  retained = 80%+ with ≥10 answered across ≥2 distinct days. Topics with <5
  answered are "not enough data" — never scheduled as revision. Labels:
  দুর্বল / মাঝারি / ভালো / ধরে আছে.
- **Revision intervals** (see R2): weak → 1 day; moderate → 4 days;
  strong → 14 days; retained → 30 days. Overdue items slide to today
  WITHOUT penalty — never "Failed", never piled on.
- **Daily cap:** at most 2 weak-topic revisions per day; the queue is grouped
  আজ / আগামীকাল / এই সপ্তাহে / পরে.
- **New practice** rotates through never-attempted published sets for the
  target exam, one per day, cycling; every link is guarded (status ==
  'published' + questionCount > 0) and prefers the target exam.
- **Daily mock row:** today links to the live mock when published, else the
  honest not-yet state; future days link to `/jobs/common`.
- **Effort modes:** light = 1 item; standard = revisions ≤2 + new practice;
  deep = standard + 1 extra from the coming days. The deep extra is never a
  duplicate of an item already in today's plan (found + fixed during
  verification — see §7).
- **Goal suggestion:** a neutral one-line suggestion ONLY when the set goal is
  >1.5× the 7-day average with ≥3 active days. The goal is never auto-changed.
- **Done marks:** per-item `done` flags are transient by construction — a
  revision/new-practice item done today reschedules or leaves the rotation on
  the next load, so the flags are effectively always false except the
  daily-mock row (a mock attempt today DOES mark the mock row done).
  Day-level done state lives in questionsDone / sessionsDone / goalMet.
- **Honesty:** no readiness % / pass probability / peer comparison / ranks /
  streaks; practice never shown as verified; no exam countdown (deferred —
  see §8); truthful empty states throughout.

## 4. Verification

### Build — PASS
- `npm run build` (tsc -b + vite): PASS.
- Planner chunk `JobPlannerPage-BqQHLNS7.js` md5 `0ec0af15be893530b601a35d20ff2a18`;
  main bundle `index-BGOMBZR1.js` md5 `b419c3ec70eb4c15531d2ee1aa24c65e`.

### Unit — 585/585 PASS (24 files)
- Was 554 after Step 11; +31 new (12 active-time + 19 planner).

### Rules suite — 1024/1024 PASS (27 files)
- Full suite run 2026-11-23 (emulator, default ports, sequential, JRE
  `~/workspace/.jdk/jdk-17.0.21.1+2-jre/bin` on PATH;
  `JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"`).
- New file `rules-step12-planner.test.ts`: **4/4 PASS** (r1 owner lists own
  practice attempts; r2 another student denied; r3 published-bundle query
  excludes the draft + mock-kind bundle; i13 real-content E2E).
- i13 fixture (verbatim Step 9/10/11 questions bcs-eng-001/002/003): 3 tense
  practice attempts D/D/D (today / yesterday / 3 days ago), 2 voice practice
  attempts B/B/B (4 + 5 days ago), 1 mock C/A/D today. Verified end to end
  from the STORED attempts read back from the emulator: tense 12 answered /
  6 correct → 50% moderate, next revision 2026-11-26; voice 6 answered /
  0 correct → 0% weak, next revision 2026-11-19 (overdue); queue
  [voice today, tense this-week]; week today = voice revision (slid) +
  articles new-practice + daily-mock row, 6 questions / 2 sessions, goal NOT
  met (goal 10), carriedOver true; tense revision lands 2026-11-26; standard
  plan 2 items + mock row (done), total 3, done 1; light 1 item (revision);
  deep extra = next due revision (tense, 11-26), NOT a duplicate of today's
  articles item; goal suggestion (goal 30): avg ~2.6/day, 5 active days.
- No rules change ships with Step 12. The Step 10 bar held: "only add a rule
  if a needed list query is actually denied" — nothing here is denied.
  Stripped rules size measured on this branch: 172,356 bytes (same as main —
  no rules change). Compiled margin on main stays 1,138 bytes.

### Preview deploy + verification BY CONTENT — PASS
- Channel: `firebase hosting:channel:deploy step12-planner`
  → https://eduvelto--step12-planner-psgjd19h.web.app
  (expires 2026-11-29 18:53:45 UTC).
- Routes 200 (9/9): `/`, `/jobs`, `/jobs/dashboard`, `/jobs/planner`,
  `/jobs/analysis`, `/jobs/bcs`, `/jobs/practice`, `/privacy`, `/founder`.
- Bundle md5 = dist: main `index-BGOMBZR1.js` ✓, planner chunk
  `JobPlannerPage-BqQHLNS7.js` ✓, dashboard chunk
  `JobSeekerDashboardPage-*.js` ✓.
- New Step 12 strings present in preview bundles: "পূর্ণ প্ল্যানার দেখুন" ×1,
  "রিভিশন দেখুন" ×1, "আজকের পরিকল্পনা" ×1, "রিভিশন সময়সূচি" ×2,
  "হালকা দিন" ×2, "গভীর প্রস্তুতি" ×2, "লক্ষ্য বদলান" ×6,
  "প্ল্যানার পরামর্শমূলক" ×1, "এই সপ্তাহ" ×4, "দৈনিক লক্ষ্য" ×6.
- Old strings: "Step 12-এ আসছে" ×0. "শীঘ্রই আসছে" ×18 in the fetched
  bundles — all three dashboard-chunk occurrences verified by context as
  honest coming-soon states on OTHER cards (Favourites → Step 13, Calendar
  → Step 14, Notifications → Step 14); planner chunk ×0.
- Prohibited NU phrasing ×0: "আবেদন চলছে", "এখনই আবেদন করুন",
  "শেষ তারিখ সামনে", "২০২৬–২৭ ভর্তি পরীক্ষা নিশ্চিত",
  "পরীক্ষার তারিখ ঘোষণা হয়েছে".
- **Rendered (Playwright) check OWED, never passed** — sandbox proxy still
  down (curl 000 via 127.0.0.1:18080). Owed when it recovers: planner page
  render, dashboard P4 cards render, practice/mock active-clock behaviour
  in a real tab.

## 5. Reconciliations (explicit — neither side was silently picked)

### R1. Idle timeout → 90 seconds
- Gemini: 3–5 min. ChatGPT: 2 min (with a reading nuance). Step 11 finding:
  60–90 s. **Chosen: 90 s — the top of the Step 11 range.**
- Reason: a 3–5 min window would credit up to 5 idle minutes per question
  as study time, which is exactly the dishonesty Step 12 was asked to fix;
  2 min is only 30 s away from 90 s, and 90 s is inside the Step 11
  finding's own range. ChatGPT's reading-without-interacting nuance is
  addressed by the mechanism, not by a longer timeout: the clock credits
  time up to lastInteraction + 90 s, and scrolling counts as interaction,
  so genuine reading rarely goes 90 s quiet; visibility pause handles idle
  tabs exactly with zero grace. ChatGPT's "I'm reading" mode is a
  follow-up, NOT built (needs an explicit session state + rules; deferred).

### R2. Revision intervals → weak 1d, moderate 4d, strong 14d, retained 30d
- Gemini: weak 1–2d, moderate 4–7d, strong 12–21d. ChatGPT: incorrect
  same/next day, weak 1d, moderate 3d, good 7d, strong 14d, retained 30d.
- **Chosen:** weak <50% → **1d** (both AIs agree); moderate 50–80% →
  **4d** (inside Gemini's 4–7d, 1 day past ChatGPT's 3d — the extra day
  keeps the weekly rotation from bunching revisions on consecutive days);
  strong 80%+ → **14d** (both agree); retained = 80%+ with ≥10 answered
  across ≥2 distinct days → **30d** (ChatGPT's "consistently retained").
- ChatGPT's "good → 7d" step is folded into the moderate/strong boundary
  (the Step 11 weak rule already defines the bands, and dashboard and
  planner must never disagree). Incorrect-QUESTION revision (same/next day)
  is Step 13's wrong-answer notebook, NOT this topic-level queue.
- Mastery bands reuse the Step 11 weak rule (<50% with ≥5 answered;
  5–9 early, 10+ signal); topics with <5 answered are "not enough data".

### R3. New collections → REUSED existing structures; no rules change
- Gemini proposed `users/{uid}/studyDays/{YYYY-MM-DD}` (rules-bounded
  deltas); ChatGPT proposed `studyPlans`, `dailyGoals`, `revisionItems`,
  `studySessions`, `weeklyPlans` + preferences under `users/{uid}`.
- **All DEFERRED.** The planner derives everything client-side from
  attempts (`jobAttempts` / `jobExamAttempts`) + published bundles +
  profile (`targetExam`, `dailyGoalQuestions` / `dailyGoalMinutes`) — all
  readable under existing rules. Each new collection would need a rules
  match block against the 1,138-byte compiled margin on main, plus a writer
  and a backfill, for data the existing attempts already carry. The existing
  1200 ms debounced session autosave is the checkpoint mechanism — no new
  session collection. Rules size re-measured on this branch: stripped
  172,356 bytes, identical to main.

### R4. Cloud Functions / trusted backend → NOT available; ADAPTED
- Both AIs assume a trusted server for aggregates / bounded writes. Spark
  free has no Cloud Functions without billing.
- **Adapted to the Step 9 client-attested precedent:** rules bound claimed
  values; practice is never shown as Verified; the active clock is a
  client-side measurement with hard caps (90 s idle, 60 s per-tick clamp in
  the reference design, negative deltas discarded), and the dashboard shows
  sessions + questions, never invented minutes. A server-side recompute
  remains a Blaze-gated follow-up, not a Step 12 blocker.

## 6. Combined USED / ADAPTED / REJECTED — Gemini + ChatGPT

| # | Advice | Verdict | Reason / where it landed |
| --- | --- | --- | --- |
| G1 | Planner as a calm, honest prioritization layer, not a gamified dashboard or rigid timetable | USED | Whole page: advisory copy, effort modes, sliding catch-up, no hourly timetable |
| G2 | Selected-exam context mapped to PUBLISHED sets only | USED | `weeklyPlan` / `todaysPlan` take the target exam; bundle guard (published + questionCount > 0); target exam from profile |
| G3 | Today's Actionable Plan: 2–3 items (weak-topic revision + new/continuing practice + optional catch-up only if the student pulls it forward) | USED | Standard mode = revisions ≤2 + new practice; deep extra comes from the coming days; no auto-piled catch-up |
| G4 | Weak-Topic Revision Queue with direct launch links | USED | `revisionQueue()` + Revision section; every item links to the real practice set in one tap |
| G5 | Simple weekly plan per selected exam (7-day breakdown) | USED | `weeklyPlan()` — 7 day cards, revision assignment + new-practice rotation + daily mock |
| G6 | Honest daily/weekly progress from real completed sets | USED | questionsDone / sessionsDone / goalMet from stored attempts only; truthful empty states |
| G7 | Optional personal exam date — countdown ONLY if explicitly entered | ADAPTED | Countdown DEFERRED to Step 14 (real dates from verified circulars, not student guesses — and a `targetExamDate` profile field would itself need a rules change against the 1,138-byte margin). Page shows no date at all today |
| G8 | No peer comparison / ranks / fake numbers / streaks / readiness % / "Verified" claims / unprompted countdowns | USED | None present; no streak counter added (Step 11 streak stays as-is, own-view only) |
| G9 | No heavy bandwidth / always-on polling / bloated calendar libs | USED | One-shot loaders (≤20+20 attempts + one bundle query per exam); no listeners, no chart lib |
| G10 | Performance-weighted interval + sliding catch-up, NOT rigid 1/3/7/14/30 | USED | Intervals weak 1d / moderate 4d / strong 14d / retained 30d (see R2); overdue slides to today, never "Failed" |
| G11 | Cap daily weak-topic revision at 1–2 | USED | `MAX_REVISION_PER_DAY = 2` |
| G12 | Daily goals: small achievable floors (default 1 set or 25–30 active min), effort modes Light / Standard / Deep | USED | Effort modes হালকা দিন / সাধারণ দিন / গভীর প্রস্তুতি; goal is task-based (sets / questions), not time-based |
| G13 | Neutral continuations, never shame copy | USED | No "missed" language; carried-over items are shown as slid, not failed; suggestion line is neutral |
| G14 | Celebrate completion, not perfection; no fragile all-or-nothing streaks | USED | Day counts as complete when the chosen baseline goal is met; no new streak counters |
| G15 | Don't over-schedule hourly timetables | USED | Sessions/topics, never minute blocks |
| G16 | Don't treat unstarted items as overdue | USED | Unattempted sets live in the new-practice rotation ("Available/Upcoming"), never in the overdue queue |
| G17 | Don't hide the real practice action behind extra clicks | USED | Every Today/Queue item is one tap to the real set |
| G18 | Active-time: Page Visibility + idle detection + capped delta heartbeats; pause immediately on hidden/blur; flush on hidden/pagehide | USED | `createActiveClock()` — visibility + blur pause, 90 s idle (R1), flush-on-navigation; pagehide flush rides the existing autosave |
| G19 | Reference `useActiveStudyTimer` hook (3-min idle, 5 s tick, 30 s flush) | ADAPTED | Used as the design starting point, not a drop-in: 90 s idle (R1), no 5 s tick (flush-on-navigation + debounced autosave instead — no new timer/writes), no 30 s flush threshold |
| G20 | BroadcastChannel multi-tab guard | REJECTED (known limitation) | Needs cross-tab coordination the engines don't have; the session autosave revision guard already prevents concurrent double-writes. Recorded as a known limitation, not silently assumed |
| G21 | Firebase guard: `studyDays/{YYYY-MM-DD}` with rules-bounded per-write increase (≤120 s) + daily caps | REJECTED (deferred) | New collection + rules change against the 1,138-byte margin (see R3). Revisit when the public-ID refactor frees ~6,130 bytes or a rules slot opens |
| C1 | Planner tells the student what to do next — today's next action most prominent | USED | Today section first, effort modes at the top |
| C2 | Six features as ONE simple planner; four sections Today / My Week / Revision / Progress | ADAPTED | Today / This Week / Revision / Daily goal on the planner page; Progress lives on `/jobs/analysis` + the dashboard and is LINKED, not duplicated (building a second analytics view would duplicate Step 10/11) |
| C3 | Revision combines spaced repetition + weak-topic detection + incorrect-question revision | ADAPTED | Spaced repetition + weak-topic detection built (topic-level). Incorrect-QUESTION revision is Step 13's wrong-answer notebook (hook `buildWrongAnswerList` already exists from Step 10); not duplicated here |
| C4 | Thresholds <5 insufficient evidence, 5–9 preliminary, 10+ useful; consider RECENCY | USED | Mastery bands reuse Step 11's rule; `topicHealth` weights recent attempts; retained needs ≥2 distinct days |
| C5 | Adaptive intervals (incorrect same/next day, weak 1d, moderate 3d, good 7d, strong 14d, retained 30d) | ADAPTED | See R2 — one interval table (1/4/14/30d); "good 7d" folded into the moderate/strong boundary |
| C6 | Three revision types: weak-topic / incorrect-question / retention | ADAPTED | Weak-topic + retention (retained band) built; incorrect-question deferred to Step 13 |
| C7 | Don't repeat the exact same question endlessly; prefer new questions from the same topic; if no suitable published content exists, SAY SO | USED | New-practice rotation draws never-attempted sets; revision links go to the topic's practice set (new questions from the same topic); empty states say plainly when no set exists (`targetHasNoSets`, `noNewSetsLeft`) |
| C8 | Daily goals from availability + recent history + published content; workload adapts to recent behaviour | USED | `goalSuggestion()` — goal >1.5× the 7-day average (≥3 active days) triggers a neutral suggestion; goals are task-based, never time-based |
| C9 | Task-based goals, NOT "Study English for 2 hours" | USED | Goal = practice sets / questions; the minutes-goal honesty line from the dashboard is kept unchanged |
| C10 | Skip without punishment; missed Monday → preserve, reassess, redistribute only when appropriate; NEVER auto-pile Monday into Tuesday | USED | Sliding catch-up with the 2-per-day cap; carried-over items flagged, never piled |
| C11 | Weekly plan: allocate by weakness / due dates / preferences / content availability / time; NEVER schedule 5h into 2h availability | USED | Allocation is by due revision + rotation + published availability only; no time-quantified scheduling exists to overfill |
| C12 | Weekly review (completed / needs attention / postponed / next-week priorities), editable days, flexible rest days, rescheduling | ADAPTED | Review content is derivable from the week cards (done marks + goalMet + carried-over); explicit rest-day picker NOT built — it needs a stored preference + a rules change (deferred with R3). Rescheduling is the effort-mode + sliding mechanism, not a calendar editor |
| C13 | Active-time: foreground + interaction-aware; pause on hidden; 2-min pause rule; small paused indicator + explicit resume; "I'm reading" mode for long reading | ADAPTED | Visibility + interaction pause built (R1, 90 s). No paused-indicator UI — a banner on the timed mock page would mislead, because the exam deadline never pauses. No "I'm reading" mode — follow-up (needs explicit session state + rules) |
| C14 | Firestore `studySessions/{sessionId}` with checkpoints every 30 s, server timestamps, rules on ownership + state transitions | REJECTED (deferred) | New collection + rules change (R3); the existing debounced session autosave is the checkpoint. Never rely on a continuously running JS timer — the clock is delta-based, not interval-incremented |
| C15 | DO NOT INCLUDE (13): leaderboards, peer comparisons, fake progress %, invented questions, fake countdown, unsubstantiated AI recommendations, punishing streak resets, excessive notifications, mandatory targets, too many charts, arbitrary scores, unverified predictions, automatic backlog accumulation | USED | None present |
| C16 | MISTAKES (7): dashboard-instead-of-planner; scheduling without content availability; every wrong answer = weak topic; overloading revision (30 overdue ≠ 30 compulsory tasks); rigid weekly schedules; streaks as success; visual complexity | USED | All avoided: planner-first layout; Recommendation = need + available content; weak needs ≥5 answered + <50%; 2-per-day cap + grouped queue; sliding week; no new streaks; plain cards, no charts/gradients/heavy illustrations |
| C17 | Five services (Goal, Revision Engine, Weekly Scheduler, Progress Analytics, Session Tracker) | ADAPTED | Implemented as pure lib functions in one module (`jobPlanner.ts`) + the existing dashboard/analysis libs — no service layer or new collections on Spark free |
| C18 | Low-bandwidth + Bangla-first; no heavy charting libs; lazy-load analytics; cache today's plan; pagination; large touch targets; simple cards; short labels; minimal modals; no horizontal scrolling | ADAPTED | Bangla-first, plain cards, one-shot loads, no chart lib, no heavy listeners. Offline cache NOT built — a load-error retry card (dashboard pattern) instead; caching today's plan locally is a follow-up |
| C19 | Priority phases P1 essentials → P2 intelligent revision → P3 honest analytics → P4 personalization | USED | P1 + P2 + P3 (honest time) delivered in this step; P4 (adaptive workload suggestions, editable preferences, rescheduling, multi-exam plans) partially — goal suggestion + effort modes now, stored preferences later |
| C20 | 11 product rules: real history only; real content only; no invented statistics; no peer comparison; no forced schedule; no punishment; adaptive revision; honest time; exam date optional; Bangla-first; mobile-first | USED | All eleven hold in the implementation |
| C21 | Success metrics (goal completion rate, % revisions completed, % returning to weak topics, repeated-topic improvement, weekly planner usage, % recommendations linked to available content, % plans adjusted, session-recording accuracy) | NOTED | No analytics exists on the site (Master Project gap #4). These are measurement definitions for when analytics lands — not built, not faked |
| C22 | Do NOT make AI the foundation: history-based recommendations + deterministic scheduling first; AI later only to explain recommendations in natural Bangla | USED | Everything is deterministic from attempts + catalog; no AI generation anywhere in the planner |

## 7. Things found and fixed during verification (honest record)

1. **Deep-mode duplicate (found while the rules suite ran).** With only one
   never-attempted set, Deep mode's extra item was the SAME set as today's
   new-practice item. Fixed: the extra is now the next practice item from
   the coming days whose link is NOT already in today's plan (prefer a new
   topic, else the next due revision). Unit test (19/19) and i13 updated to
   match; the extra in i13 is the tense revision due 2026-11-26.
2. **Two `tsc` errors in the emulator test file (vitest does not typecheck,
   so the rules run passed while `npm run build` failed).** `topicBundle`'s
   `bundleId` parameter was unused (the doc ID comes from the setDoc path)
   — removed, 4 call sites updated. The `pattern` narrowing was lost
   inside the hoisted `seedPractice` function declaration — `pattern` is
   now passed as an argument, with `JobExamPattern` imported as a type.
   Build green after the fix; the step12 rules file re-run 4/4.
3. **My own miscount in i13 (first rules run: 1023/1024).** The goal
   suggestion's `activeDays` is 5, not 4 — I forgot the 5-days-ago attempt
   (11-17). Expectation corrected; full suite then 1024/1024.

## 8. Deferred / not built (explicit)

- Exam-date countdown → Step 14 (real dates from verified circulars; a
  `targetExamDate` profile field would need a rules change).
- New collections (`studyDays`, `studyPlans`, `dailyGoals`, `revisionItems`,
  `studySessions`, `weeklyPlans`) + rules-bounded time guards → deferred
  (R3/R4); revisit when the public-ID refactor's ~6,130-byte margin lands
  or a rules slot opens.
- Incorrect-question revision → Step 13 (wrong-answer notebook; hook
  `buildWrongAnswerList` already exists from Step 10).
- Rest-day picker, stored planner preferences, offline plan cache,
  "I'm reading" mode, multi-tab BroadcastChannel guard, paused-indicator UI.
- Result-page time values are NOT relabelled — pre-fix stored values cannot
  be distinguished from post-fix ones, so no honest label exists for them.

## 9. What is left for deploy (parent / deploy coordinator)

1. Real merge in a scratch worktree (never `git merge-tree`): branch
   `jobs/step12-planner` onto main (base `28bc870`; main may have moved —
   the 23:02 deploy sweep may have landed first — rebase/merge against the
   CURRENT main and re-run build + unit + rules in the merge worktree).
2. `firebase deploy --only hosting` (no rules/Firestore/DNS change).
3. Live verify BY CONTENT both domains: routes 200 incl. `/jobs/planner`;
   live bundle md5 = dist; new Step 12 strings present; "Step 12-এ আসছে" 0;
   0 prohibited NU phrasing; robots.txt + ads.txt intact.
4. Rendered (Playwright) check still OWED (proxy down) — planner page,
   dashboard P4 cards, practice/mock clock behaviour in a real tab.
5. Note: live still has NO published mock definition/manifest — a real
   student cannot take a FULL MOCK until a Moderator publishes one (data
   task from Step 9/10/11, unchanged by Step 12).

## 10. Honest limits

- The active clock measures client-side foreground + interaction time with
  hard caps; it cannot prove a student was actually studying (reading
  without interacting for >90 s is not credited — the "I'm reading" mode
  would close that gap).
- The planner derives from at most the last 20 practice + 20 mock attempts
  (the Step 11 read budget); a student with a longer history sees the
  recent window only.
- No new streaks, no readiness %, no peer data — by design.
- Multi-AI consultation skipped for the deploy itself (mechanical deploy,
  same as the 22 Nov evening deploys) — recorded transparently.
