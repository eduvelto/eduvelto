# Job Step 13 — Wrong-Answer Notebook — Closure Report (staging)

**Branch:** `jobs/step13-wrong-answers` (base main `6df278b`, Step 12 merge)
**Worktree:** `~/workspace/eduorbit/phase2-project-step13/`
**Date:** 23 Nov 2026
**Status:** STAGING COMPLETE — verified, preview-verified. **NOT deployed to live, NOT merged to main.**
**Preview:** https://eduvelto--step13-wrong-answers-lzo6skzk.web.app (expires 29 Nov 2026 19:39 UTC)

## 1. Scope — what Step 13 built

The design doc's §2.8 (wrong-answers) + §3.7 (wrong-answer re-practice flow), wired
from Step 10's prepared hook (`buildWrongAnswerList`) and Step 11's dashboard card:

- **`/jobs/wrong-answers`** — the notebook page.
  - Wrong-question cards: question text, exam/subject/topic chips, wrong count,
    last-wrong date, the student's picked option + the correct option, learning
    state chip (নতুন ভুল / আবার শিখছি / শেখা হয়েছে), "পরপর সঠিক: ০/২" / "১/২" chip,
    "যেখানে ভুল হয়েছিল →" link to the attempt's result page.
  - Filters (client-side, no extra reads): exam / subject / topic (cascading),
    streak ০/২ vs ১/২, source (practice / mock), latest outcome (wrong /
    unanswered), free-text search by question text.
  - "Practice only the wrong ones": practice-all-filtered or selected-questions
    buttons; per-topic-group practice buttons; a per-topic "new questions from
    this topic" link to the real published topic bundle (guarded: published +
    questionCount > 0, else the honest "এই টপিকের অনুশীলন সেট এখনো তৈরি হয়নি।").
  - Removal rule: a question leaves the active list automatically after
    **2 consecutive correct answers**; the result page shows a banner naming
    how many just cleared; cleared questions move to a separate
    **শেখা হয়েছে** section (never deleted — full history kept).
  - Truthful empty state (exact design wording):
    "এখনো কোনো ভুল উত্তর নেই — মক বা অনুশীলন শুরু করলে ভুলগুলো এখানে জমা হবে।"
  - Wrong answers are derived from REAL stored attempts only — never invented.
    The page says when the loaded window is capped (50 practice + 50 mock,
    newest first), so a capped window is never presented as a lifetime total.
- **`/jobs/wrong-answers/practice/:topicId`** — the re-practice session.
  - A REAL practice session anchored to the real published topic bundle
    (its docId + bundleVersion); its questionRefs are the PLANNED SUBSET only
    (review questions first, then up to 2 fresh never-attempted same-topic
    questions). Scoring uses the matching in-memory subset bundle + subset key
    (same original `n` values); the stored attempt carries the real bundleId.
  - One question at a time, immediate correct/wrong + explanation after
    answering (never before the retry), mark-for-review, palette, active clock,
    debounced autosave (same revision discipline as normal practice), submit
    with confirm → result page with the cleared banner.
  - NO resume (a fresh session each start); an unfinished session is ABANDONED
    on unmount / on the explicit exit button, so a leftover subset can never be
    resumed as a full-bundle session for the same bundleId.
- **Wiring:** dashboard P4 card now links to the notebook (the old
  "Step 13-এ আসছে" chip is gone); result page "পরবর্তী পদক্ষেপ" card links to
  the notebook; `jobAnalysis.ts` §7 hook comment updated (PREPARE ONLY → WIRED);
  stale "re-runs the whole bundle / needs a Moderator-built bundle" comments in
  `JobPracticePage` / `JobResultPage` corrected.
- **Favourites NOT built.** The design-doc row groups "notebook + favourites"
  under Step 13, but the task scope for this step was the notebook only.
  Favourites needs its own storage/rules decision and its own step. The
  dashboard Favourites card copy was corrected from "Step 13-এ আসছে" (now
  false) to neutral "শীঘ্রই আসছে".

## 2. The removal rule — ONE rule (reconciliation of the key divergence)

Gemini counts per-questionId 0→1→2 on same-question re-practice (shuffled
options). ChatGPT says immediate same-question repeats must NOT count —
only fresh concept questions or sufficiently separated repeats, ideally in
separate sessions. **ONE RULE, from the real bank:** the two qualifying
corrects must be correct answers to THE ORIGINAL question in two distinct
real attempts (practice or mock). The derivation enforces the separation
structurally: one attempt holds each question at most once, so two corrects
necessarily come from two distinct sessions — an immediate same-session
repeat can never count twice.

Fresh same-topic questions are offered alongside the original in every
re-practice session (transfer check), but a correct answer on a NEW question
does NOT clear the original: the bank has no conceptId / variationGroupId, so
no mapping exists to prove the new question tests the same concept.
Concept-level qualifying is Moderator content work (curated concept IDs), not
Step 13 code. "শেখা হয়েছে" is a learning status, never permanent mastery:
a later wrong answer re-opens the question (streak resets to 0 immediately).

Derivation (pure, `src/lib/jobWrongAnswers.ts:deriveNotebook`): walks stored
attempts oldest→newest per questionId. Wrong resets the streak to 0 at once;
correct advances 0→1→2; unanswered is NEUTRAL (neither advances nor resets);
an entry exists only if wrongCount ≥ 1 (an unanswered-only question never
enters); dedupe by questionId across exams (examSlugs + sources sets).

## 3. Files changed

| File | Change |
|---|---|
| `src/lib/jobWrongAnswers.ts` (NEW) | Pure lib: `deriveNotebook`, `sortNotebookEntries`, `filterNotebook`, `groupNotebookByTopic`, `planWrongAnswersSession` (cap 20 total / 2 fresh), `buildSubsetBundle`, `buildSubsetKey`, types + Bangla state labels. Header carries the reconciliation + honesty rules. |
| `src/lib/__tests__/jobWrongAnswers.test.ts` (NEW) | 17 unit tests (see §5). |
| `src/lib/jobWrongAnswersData.ts` (NEW) | Thin loaders: `loadNotebookAttempts` (50+50, newest first), `loadNotebookQuestionTexts` (one getDoc per distinct source bundle), `loadNotebookExplanation` (source key first, topic-key fallback; returns why-wrong text in the same pass). |
| `src/lib/jobPractice.ts` | `startWrongAnswersSession` (subset refs, no resume) + `abandonPracticeSession` (fresh-read revision, in-progress → abandoned). |
| `src/pages/JobWrongAnswersPage.tsx` (NEW) | Route `/jobs/wrong-answers` (see §1). |
| `src/pages/JobWrongAnswersPracticePage.tsx` (NEW) | Route `/jobs/wrong-answers/practice/:topicId` (see §1). |
| `src/App.tsx` | Lazy imports + both routes BEFORE `/jobs/:exam/:tab`. |
| `src/pages/JobSeekerDashboardPage.tsx` | P4 card: chip → LinkButton to the notebook; favourites copy corrected; stale comments fixed. |
| `src/pages/JobResultPage.tsx` | `useLocation` cleared-banner (fromWrongAnswers + clearedCount) + notebook link in Next Steps; stale Step 13 comment fixed. |
| `src/pages/JobPracticePage.tsx` | Stale "needs a Moderator-built bundle" comment fixed. |
| `src/lib/jobAnalysis.ts` | §7 hook comment: PREPARE ONLY → WIRED. |
| `src/lib/jobDashboard.ts` | Notebook comments updated (card now links to the notebook). |
| `firestore.rules` | **THE RULES FIX — see §4.** Two lines changed (create + update core). |
| `emulator-tests/rules-step13-wrong-answers.test.ts` (NEW) | r1–r3 + r4–r6 + i14 (see §5). |

**No new collection. No new allow rule. No live Firestore reads/writes at any
point in this step** (emulator only; quota untouched).

## 4. THE RULES FIX — a real blocker found by testing, not by review

**Finding:** `validJobSessionCreate` and `validJobSessionUpdateCore` bounded
`currentQuestion <= questionRefs.size()`. That proxy only holds for FULL
bundles (refs = all questions 1..N). A subset session's first bundle `n` can
exceed the subset size — e.g. a 1-question subset of bundle n=9 (3 ≤ 1 is
false) — so the rules DENIED the session create, and denied every
navigation/autosave afterwards. Without the fix, most wrong-answers subset
sessions could not be created at all. (The Step 13 lib + pages were already
correct; only the rules were wrong.)

**Fix (minimal, behaviour-preserving for full bundles):** the bound is now
MEMBERSHIP in the answers-map keys —
`string(d.get('currentQuestion', 0)) in d.get('answers', {}).keys()`.
The answers keys ARE the refs' `n` values (the create rule already enforces
`answers.size() == refs.size()` with keys = refs' n), so membership is
exactly "currentQuestion is inside the stored order" — which is what the
original comment already claimed. Changed in two places only:
`validJobSessionCreate` and `validJobSessionUpdateCore` (shared by practice +
exam sessions; for full exam sets membership is equivalent to the old bound).
The exam-session CREATE bound (line ~1350, full sets only) was left untouched.

**Size gate (measured, not guessed):** stripped source via
`scripts/strip-firestore-rules-comments.mjs`: **172,356 → 172,360 bytes (+4)**.
At the observed compiled/stripped ratio (~1.479: main 172,356 → 254,862;
public-ID branch 168,954 → ~249,870), compiled ≈ **254,868, margin ~1,132
bytes** — well inside the 256,000 limit. Honest limit: the EXACT compiled
size is confirmed only at deploy time (a size failure is safe — the deploy
errors out). No refactor was needed; the change is 4 bytes.

**Proof in the rules suite:** r4 creates a 1-question subset starting at
bundle n=3 (denied under the old bound); r5 autosaves it with
currentQuestion=3; r6 proves a bogus currentQuestion=2 is still rejected
(the membership check still binds).

## 5. Verification

| Check | Result |
|---|---|
| Build (`npm run build` = `tsc -b && vite build`) | PASS |
| Unit (`npm run test:unit`) | **602/602 PASS** (25 files; 585 after Step 12 + 17 new) |
| Rules (`npm run test:rules`, emulator, default ports, sequential) | **1033/1033 PASS** (28 files; 1024 after Step 12 + 9 new: r1–r3, r4–r6, i14) |
| Preview deploy (channel `step13-wrong-answers`) | exit 0 — https://eduvelto--step13-wrong-answers-lzo6skzk.web.app (expires 29 Nov 19:39 UTC) |
| Preview verify BY CONTENT (`~/workspace/eduorbit/verify-step13-preview.mjs`) | **26/26 PASS**: 7/7 routes 200; main bundle md5 == dist (`index--K9Nn1hg.js`); 4 page chunks md5 == dist; 6 new Step 13 strings present; old dashboard chip string absent; 0 prohibited NU phrasing; robots.txt 200; ads.txt exact |
| Rendered (Playwright) check | **OWED, not passed** (sandbox proxy down — same as all recent steps) |

**i14 (real-content E2E, the Step 9 i10 / Step 10 i11 / Step 11 i12 / Step 12
i13 fixture — 3 verbatim BCS English questions):** seeded 3 tense practice
(D/D/D) + 2 voice practice (B/B/B) + 1 mock (C/A/D). Derived: Q1+Q2 active,
streak 0, wrongCount 5; Q3 learned, streak 4, clearedAt = tense-1d. Two real
subset sessions (Q1+Q2, answers C/A) written through the RULES-CHECKED create
+ submit path: after session 1, streak 1 (আবার শিখছি, still active); after
session 2, streak 2 → learned. Both stored attempts anchor to the real topic
bundle (bundleId + bundleVersion 1 verified on read-back).

**Test-correction note (honest):** the first i14 run failed 2/9 — my TEST
expected the entries under topic `tense`, but the fixture reuses the same 3
verbatim questions retagged into every topic bundle, so each entry keeps its
OLDEST answer's topic (`voice`, from the voice-5d attempt). The lib was
right; the test was wrong. Fixed the test (assert the voice topic explicitly;
plan against the voice bundle — the bundle the page would actually use).
In production each questionId belongs to exactly one topic, so this never
diverges there. Second run: 9/9 PASS.

## 6. Multi-AI consultation — ONE combined USED / ADAPTED / REJECTED table

Gemini: https://gemini.google.com/app/50894fa36a7c696f (23 Nov 01:07).
ChatGPT: https://chatgpt.com/uc/6b033d1e-9bec-83ea-84b5-0e1034caf799 (23 Nov 01:09).
Technical questions only; no owner private info shared.

| # | Advice (source) | Verdict | Reason / where it landed |
|---|---|---|---|
| 1 | Diagnostic error log + concept-repair loop, NOT a trophy case / rote deck (Gemini) | USED | The page is built around diagnosis (picked vs correct option, why-wrong) + repair (re-practice), with no scores, ranks or gamified counters anywhere. |
| 2 | Lightweight cards, no heavy media (Gemini, ChatGPT mobile-first) | USED | Text-only cards; no images/video/widgets; explanations lazy-loaded per card. |
| 3 | Filters: Exam / Subject / Topic + streak 0/2 vs 1/2 + source Practice vs Mock (Gemini) | USED | All five filters on the page (`filterNotebook`); streak + source are the quick filters Gemini asked for. |
| 4 | Exam / Subject / Topic combinable, dedupe by questionId across exams (ChatGPT) | USED | `deriveNotebook` dedupes by questionId (examSlugs + sources sets); filters combine. |
| 5 | Exact question + picked option (marked as past attempt) + correct option (Gemini) | USED | Every card shows "আপনার উত্তর: {letter} — {text} · সঠিক উত্তর: {text} ({letter})". |
| 6 | Concise Bangla explanation + concept rule + why the distractor was tempting (Gemini); why-correct + why-yours-was-wrong + concept/rule, never just "Correct answer: B" (ChatGPT) | USED | Lazy "ব্যাখ্যা দেখুন" toggle loads the key's explanation + `whyWrong[selectedLetter]`; the practice page shows the explanation + why-wrong immediately after answering. |
| 7 | Consecutive Mastery Progress 0/2 → 1/2 → Cleared as a literal indicator (Gemini); three learning states only, no mastery % (ChatGPT) | USED | Chips "পরপর সঠিক: ০/২ / ১/২" + states নতুন ভুল / আবার শিখছি / শেখা হয়েছে. No percentages anywhere. |
| 8 | Topic Re-Practice + Related-Question triggers (Gemini); "practise similar questions" per entry (ChatGPT) | USED | Per-group practice buttons + per-topic "new questions" link to the real published topic bundle. |
| 9 | Two-stage repair loop: Stage 1 diagnose + anchor the rule; Stage 2 mix same-question recall + same-topic transfer (Gemini); re-practice sequence revisit → new concept question → practise later (ChatGPT) | USED | Session order is review questions first, then fresh same-topic questions; each review card carries the explanation; fresh questions are the transfer check. |
| 10 | Shuffle option order A/B/C/D on every re-practice (Gemini) | ADAPTED (deferred) | NOT built: the attempt stores the selected LETTER; shuffling options without storing the permutation would make the stored letter uninterpretable on the result page. Needs an engine change + a stored permutation map — follow-up, not Step 13. Question ORDER within the review group IS shuffled; fresh questions come after review questions. |
| 11 | 2-consecutive state machine: wrong → 0 + lastWrongAt (+wrongCount); wrong at 1 → reset to 0; correct 0→1 keep, 1→2 remove/archive (Gemini); same rule in any later practice/mock (Gemini); wrong again → reset, don't delete history, re-enters (ChatGPT) | USED | `deriveNotebook` implements exactly this; a later wrong re-opens a learned question with full history. |
| 12 | Gentle feedback on clear + view recently cleared without clutter (Gemini); do NOT delete after two correct — move to a separate শেখা হয়েছে section, keep original wrong question/answer/date/streak/cleared date (ChatGPT) | USED | Result-page banner ("নোটবুক থেকে সরানো হয়েছে — Nটি প্রশ্ন…") + the separate learned section (first 5 + count). |
| 13 | Distinguish answered-incorrectly vs skipped/unanswered — separate filters (Gemini); "wrong" and "unanswered" stay separate (ChatGPT) | USED | Latest-outcome filter (wrong / unanswered); unanswered is neutral in the streak (neither advances nor resets). |
| 14 | Offline-resilient / low-data: cache active items locally, sync later (Gemini); cache recently opened questions, resume interrupted sessions, clear offline/syncing states (ChatGPT) | ADAPTED (deferred) | No new IndexedDB/local-sync layer in Step 13: the notebook is read-only over one-shot loaders (same as dashboard/analysis) and needs connectivity to load attempts. A local cache is a follow-up. |
| 15 | Offline/double-tap guards: guard Submit, idempotent attempt IDs, deterministic consecutiveCorrect updates (Gemini); idempotent backend processing (ChatGPT) | ADAPTED | No Cloud Functions on Spark free — ADAPTED to the Step 9 client-attested precedent: the attempt doc-ID (= session ID) is the idempotency key (a second submit returns the existing attempt); the submit button disables while submitting; the notebook is a learning aid, never a verified record. |
| 16 | No peer comparison / ranks / percentiles; no fake numbers or gamified fluff (no accuracy %, "AI mastery scores", fake streaks, artificial urgency); no "Verified" claims without a genuine workflow (Gemini); no peer comparison, rankings, fake mastery %, fake improvement stats, unsubstantiated verified badges, streak pressure, public profiles, unnecessary gamification, random motivational messages, complicated analytics (ChatGPT) | USED | None of these exist in the step. The only numbers are real counts from real attempts (wrong count, streak 0/1/2). Practice is never shown as verified (binding label on the result page). |
| 17 | No heavy rich media by default (Gemini); no AI-generated explanations presented as guaranteed correct (ChatGPT) | USED | Text only; explanations come from the question bank's key, labelled "যাচাইকৃত শিক্ষকের ব্যাখ্যা নয়, প্রশ্ন-ব্যাংকের ব্যাখ্যা।" |
| 18 | No unfiltered dump of every skipped question (Gemini); don't auto-delete old questions; no artificial deadlines (ChatGPT) | USED | Unanswered-only questions never enter the notebook; nothing is ever auto-deleted or deadline-pressured. |
| 19 | Cross-exam overlap: tag subjects/topics cleanly, filter smoothly by exam (Gemini); separate notebooks per exam are to be avoided (ChatGPT) | USED | One notebook, deduped across exams, with an exam filter. |
| 20 | Heavy Firestore reads per filter click — paginate/cache, filter client-side when small (Gemini); load questions individually, pagination, fetch explanations only when needed (ChatGPT) | USED | One-shot loaders (50+50), all filtering client-side, explanations lazy per card. |
| 21 | Over-engineering before launch — rock-solid core first (Gemini); MVP phases P1–P7 (ChatGPT) | USED | Step 13 ships P1–P6 (automatic collection, filters + UI, explanations + original review, concept re-practice, two-correct removal, learned history + reopening). P7 (concept-level recommendations) is later. |
| 22 | Automatic collection only — enters ONLY on a real incorrect attempt with a valid subject/topic; never require manual saving; manual bookmarking is SEPARATE (ChatGPT) | USED | The notebook is derived from stored attempts only; there is no manual add. (Favourites/bookmarking stays a separate feature — not built here.) |
| 23 | Two correct answers does NOT mean never forgetting — communicate learning progress, not permanent mastery (ChatGPT) | USED | The rule info box says exactly this; a later wrong re-opens the question. |
| 24 | Qualifying-correct rule: fresh concept questions or sufficiently separated repeats, ideally in separate sessions; do NOT count immediate repeats; for MVP use two distinct unseen question IDs when available, else a delayed repeat of the original, clearly distinguished as recall (ChatGPT) vs per-questionId 0→1→2 on same-question re-practice (Gemini) | RECONCILED — see §2 | ONE RULE: the two qualifying corrects must be the ORIGINAL question in two distinct real attempts (structurally enforced). Fresh same-topic questions are offered as the transfer check but do NOT clear the original (no concept mapping exists in the bank). |
| 25 | Trusted backend / Cloud Functions: never trust isCorrect/correctStreak/status from the client; backend validates + enforces transitions; attempt + notebook updates atomically via transaction (ChatGPT) | ADAPTED | NOT available on Spark free. ADAPTED to the Step 9 client-attested precedent (rules bound claimed values; practice never shown as Verified), as with Step 12. The notebook is derived client-side from stored attempts, so there is no client-supplied streak to trust at all — the streak is computed from the attempts, not asserted. |
| 26 | New subcollection `users/{uid}/wrongNotebook` + rules (ChatGPT) | REJECTED (deferred) | Derive client-side from existing attempts instead. No new collection, no new allow rule; the only rules change is the §4 bound fix (+4 stripped bytes). A stored notebook subcollection would have needed a rules change against the 1,138-byte margin and adds a second source of truth. |
| 27 | Concept variations must test different aspects (math changes numbers/same formula; grammar different sentences/same rule; GK another angle); superficial variations ≠ meaningful assessment; curated concept IDs, manually reviewed mappings, never auto-generated tags (ChatGPT) | ADAPTED | The bank has no conceptId/variationGroupId, so Step 13 cannot prove a fresh question tests the same concept — fresh questions are offered as same-TOPIC transfer, never as qualifying assessments. Curated concept mapping is Moderator content work (see §7). |

## 7. Step 10 open question 1 — ANSWERED: who builds per-topic 10-question micro-drill bundles?

**Moderator content work — Step 13 does NOT build bundles.** Per-topic
10-question drill bundles need a Moderator to curate + publish them (the
notebook's "new questions from the same topic" path links to the existing
published topic bundle, real and guarded — that is the honest substitute).
Recorded in `src/lib/jobAnalysis.ts` (§7 hook comment) and in
`src/lib/jobWrongAnswers.ts` (header). Step 13 builds no fake bundles.

Step 10 open question 3 (17px vs 18–22px headings) is untouched by this step
(no heading-size change made).

## 8. Honest limits / known issues

- **Rendered (Playwright) check OWED** — sandbox proxy down (same as all
  recent steps). Never passed, never claimed.
- **Refresh / tab-close during a subset session** leaves an in-progress subset
  session (the unmount-abandon cleanup cannot run). It is harmless data-wise
  (no attempt is written) and recoverable via the dashboard's discard flow
  ("আগেরটি বাতিল করে নতুন শুরু করুন"); it is documented in the page header
  comment. The normal practice page would offer to resume it — that is the
  known edge, not a corruption: resuming a subset re-runs the same subset.
- **Option-order shuffle deferred** (table row 10) — needs an engine change +
  a stored permutation map.
- **Offline cache deferred** (row 14) — the notebook needs connectivity to load.
- **Concept-level qualifying needs curated concept IDs** (row 27) — Moderator
  content work, not code.
- **Notebook covers the loaded 50+50 attempt window only** — the page says so
  when capped; older wrong answers outside the window are not shown.
- **Live has no published mock definition/manifest** (jobExamDefinitions 0,
  jobQuestionSetManifests 0) — unchanged data task, not a Step 13 gap.
  Practice works; a full mock still needs a Moderator-published definition.
- **Entry topic = oldest answer's topic.** In production each questionId
  belongs to one topic, so this is exact there. The emulator fixture reuses
  the same questions across topic bundles (see §5 test note).
- **Exact compiled rules size is confirmed only at deploy time** (§4) — the
  deploy fails safely if over the limit; the measured stripped delta (+4
  bytes, ≈ +6 compiled) leaves ~1,132 bytes of margin.

## 9. What is left for deploy (parent decides — staging only)

1. **Merge** `jobs/step13-wrong-answers` into main (real merge in a scratch
   worktree; never `git merge-tree`).
2. **Deploy rules FIRST** (strip step mandatory:
   `node scripts/strip-firestore-rules-comments.mjs firestore.rules <out>`,
   then `firebase deploy --only firestore:rules`) — this branch DOES change
   `firestore.rules` (§4), so the deploy is NOT hosting-only. Confirm the
   compiled size at deploy time (safe failure if over).
3. **Deploy hosting** (`firebase deploy --only hosting`).
4. **Verify live BY CONTENT on both domains**: new bundle md5 == dist;
   `/jobs/wrong-answers` 200 + new strings present; old dashboard chip string
   absent; 0 prohibited NU phrasing; robots.txt + ads.txt intact.
5. **Rendered check** when the proxy recovers (owed).
6. **Scheduling note:** do NOT deploy inside the 23 Nov 14:00–15:30 window
   (the quota-reset cron owns deploy-main then), and do not touch deploy-main
   from this branch — the deploy goes through the normal merge → deploy-main
   flow.
7. No migration, no backfill, no data task. No spending. No account changes.
