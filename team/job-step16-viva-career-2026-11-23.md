# Job Step 16 — Viva, Interview and Career Support (staging closure)

- Date: 23 Nov 2026 (~03:00–03:30 Asia/Dhaka).
- Branch: `jobs/step16-viva-career`, commit `7a0bd02`, base main `1918766` (Step 14 live).
- Worktree: `~/workspace/eduorbit/phase2-project-step16/`.
- Status: **CLOSED IN STAGING. Deployable independently — see §7.**
- Preview: https://eduvelto--step16-viva-career-1vqa9cfv.web.app (expires 29 Nov 21:10:58 UTC).
- Verification script: `team/verify-step16-preview.mjs` (36/36 PASS).

## 1. Scope (design docs)

From `team/job-ui-ux-design-step2.md` §2.11/§8 and
`team/job-architecture-schema-step3.md` §2.6:

- `/jobs/viva` — viva/interview preparation reading material.
- `/jobs/career` — career guidance reading material.
- `/jobs/cv` — CV/resume preparation reading material.
- 10–15 reading items total. **Reading material ONLY** — no engine, no
  quiz, no mock, no scoring, no "viva simulator", no AI interviewer.
- `/jobs/current-affairs` is listed under Step 16 in the architecture
  doc but was NOT in the brief — **deferred** (needs a monthly content
  pipeline; the three pages are the Step 16 deliverable).

## 2. What was built

### Content — `src/lib/jobVivaCareer.ts` (new, 15 items, ~3,140 Bangla words, 60 min total)

| Page | Items | Titles |
|---|---|---|
| `/jobs/viva` | 6 | board-mindset; self-introduction; common-questions (+ recruitment-context section); body-language; final-prep; after-viva |
| `/jobs/career` | 5 | choosing-track; long-wait; parallel-skills; switching-tracks; job-search |
| `/jobs/cv` | 4 | cv-structure; writing-experience (+ 2 fictional sample structures, placeholder info only); before-submission; cv-mistakes |

Each item: slug, type, titleBn/titleEn, introBn, 3–4 sections (heading +
bullets), summaryBn ("মনে রাখুন"), readMinutes 3–5. Body is Bangla-only;
titles carry short English for chrome.

**Content is code, not Firestore** (zero reads/writes). The module is
shaped 1:1 on the jobLessons schema (same lessonType values, same fields)
so a future loader can swap the source without rewriting the pages.
`JOB_STEP16_LESSON_TYPES` + `isJobGuideLessonType` added to
`src/lib/jobContent.ts`. Reason for code over Firestore (recorded):
firestore.rules still allows only `lessonType == 'lesson'` on create,
there is no admin UI that creates guide lessons, and 0 verified teachers
exist so no Firestore content could honestly be Published today.
Extending the rules allowlist is a named post-refactor follow-up
(it needs rules room — see §6).

### Pages — `src/pages/JobGuidePage.tsx` (new, one shared renderer)

- Top switcher across ভাইভা / ক্যারিয়ার / সিভি.
- ChatGPT's reusable general-guidance disclaimer at the top of all three
  pages (full text), plus the binding viva label "প্রস্তুতির উপকরণ —
  অনলাইন ভাইভা নয়" and the career note "এই পাতার কোনো পরামর্শ চাকরির
  নিশ্চয়তা দেয় না।" (design §8.4).
- Numbered item list (title + minutes + "পড়া শুরু করুন" anchor), items
  with per-item Previous/Next anchor links, related-links bar, footer
  "Eduvelto · শেখার জন্য তৈরি, পরীক্ষার প্যাটার্নের নিশ্চয়তা নয়".
- Typography per both AIs: Bangla body 16px, line-height 1.75, headings
  20px, stacked cards / simple bullet lists, no multi-column tables.
- **Viva page only — local-only tools** (design doc): document checklist
  (6 items, localStorage `eduvelto:job:viva-checklist`) and a
  self-introduction draft (localStorage `eduvelto:job:viva-intro-draft`,
  auto-saved, clear button). Nothing leaves the device. The checklist is
  framed as general preparation — "কোন কাগজপত্র লাগবে, সেটা প্রতিটি
  বিজ্ঞপ্তিতে লেখা থাকে; বিজ্ঞপ্তি দিয়েই মিলিয়ে নিন" — no item claims
  to be compulsory.

### Wiring

- `src/App.tsx`: routes `/jobs/viva`, `/jobs/career`, `/jobs/cv` BEFORE
  `/jobs/:exam/:tab` (otherwise 'viva' matches `:exam='viva'`).
- `src/pages/JobHubPage.tsx`: the 7-element "ভাইভা প্রস্তুতি" card now
  links to `/jobs/viva` ("ভাইভা প্রস্তুতি পড়ুন →") instead of the
  "শীঘ্রই আসছে" chip; section heading drops "(তৈরি হচ্ছে)" (6 elements
  still coming soon). The "প্রস্তুতির উপকরণ — অনলাইন পরীক্ষা নয়।" note
  is kept.
- `src/pages/JobsPage.tsx`: new "ভাইভা, ক্যারিয়ার ও CV" section after
  `CommonPrepCard` (3 cards, 6/5/4 পাঠ) + honesty line underneath.
- No SEO/sitemap additions (Steps 12–15 added none; sitemap has no
  /jobs/circulars etc.).

## 3. Honesty guardrails (tests + wording)

`src/lib/__tests__/jobVivaCareer.test.ts` (10 tests) guards the content:

- Count/shape: 15 items (6/5/4), unique slugs, valid lessonType values,
  3–4 sections each, readMinutes 3–5, non-empty intro/summary.
- **Prohibited-claim denylist** (any match = content bug): viva/exam
  marks, specific exam cycles (১৯তম/19th…), "যাচাইকৃত"/Verified,
  pass/job guarantees ("নিশ্চিত"/গ্যারান্টি), "will definitely appear"
  phrasing ("অবশ্যই…আসে"/"আসবেই"), simulator/AI-interviewer promises,
  year claims.
- The age/fee/deadline patterns are **value-based, not concept-based**:
  telling a student to check the circular's age limit / fee / deadline
  is guidance ("বিজ্ঞপ্তিতে দেখে নিন"), stating a value as fact is
  forbidden. So "বয়সসীমা" alone passes, "বয়সসীমা ৩০ বছর" fails;
  "শেষ তারিখ দেখে নিন" passes, "শেষ তারিখ ১৫ ডিসেম্বর" fails.
  Month names are matched word-boundary-aware ("জুন" inside "খুঁজুন"
  and "মে" inside "মেনেছেন" are NOT matches — caught by a test failure
  during the build and fixed).
- Two real wording bugs caught by the tests during the build and fixed:
  (1) viva item 1 "অনুমানকে নিশ্চিত তথ্য হিসেবে বলবেন না" → "সত্যি তথ্য";
  (2) career item "শুধু যাচাইকৃত বিজ্ঞপ্তির তথ্য থাকে" was also
  INACCURATE (the circulars page lists unverified circulars too,
  labelled) → "প্রতিটি বিজ্ঞপ্তির যাচাইয়ের অবস্থা লেখা থাকে".

## 4. Verification

- **Build: PASS** (`tsc -b && vite build`). One fix during the build:
  `T` is a component in LanguageContext, not a type — the bilingual type
  is `LangEntry`.
- **Unit: 676/676 PASS** (29 files, +10 new Step 16 tests).
- **Rules: 1044/1044 PASS** (29 files, emulator, fresh run, default
  ports). Baseline unchanged — see §6.
- **Preview: 36/36 content checks PASS**
  (`team/verify-step16-preview.mjs`): 7/7 routes 200 (/, /jobs,
  /jobs/viva, /jobs/career, /jobs/cv, /jobs/bcs, /jobs/circulars);
  main bundle `index-CNIaT1Q7.js` md5 = dist; guide chunk
  `JobGuidePage-C79Ws2MU.js` md5 = dist; hub chunk + jobs chunk md5 =
  dist; 12/12 new strings present across the live chunks; 0 prohibited
  NU phrasing; sameAs exactly 3 URLs; 0 prohibited Step 16 claims in
  the guide chunk.
- **Rendered (Playwright) check: OWED** — sandbox proxy still down.
  Recorded as owed, never as passed.
- **$0 spent. No live Firestore reads/writes** (emulator only).

### Verification notes (so the next reader doesn't re-chase these)

- The Step 16 strings live in the lazy-loaded guide chunk, NOT the main
  bundle — a first version of the verify script checked the main bundle
  and "failed" 9 strings that were never there. The script now checks
  the union of main + guide + hub + jobs chunks.
- The main bundle legitimately contains "ভাইভার নম্বর" and "১৯তম" as
  pre-existing honesty NEGATIONS in `jobExams.ts:390,445` ("ভাইভার নম্বর
  এখানে লেখা হয়নি", "১৯তম পরীক্ষার ধরন এখানে লেখা হয়নি") — the
  bad-claim check is therefore scoped to the guide chunk.
- sameAs in the minified bundle has an unquoted key
  (`sameAs:[...]`), not `"sameAs":[...]`.

## 5. Multi-AI fold-in — ONE combined table

Sources: Gemini https://gemini.google.com/app/c3b932e1914ccc28
(`team/step16-gemini-consultation-2026-11-23.md`) and ChatGPT
https://chatgpt.com/uc/6b035612-f1d4-83ea-b6aa-9cc0df047b4c
(`team/step16-chatgpt-consultation-2026-11-23.md`).

| # | Advice | Source | Decision | Reason / where it landed |
|---|---|---|---|---|
| 1 | Static/lightly cached reading lessons, reuse existing lesson renderer, no extra Firestore reads | Gemini | USED | Code content module shaped 1:1 on jobLessons; zero reads/writes |
| 2 | Transferable habits, communication, document readiness, realistic career planning; zero invented rules/marks/dates/ages | Gemini | USED | All 15 items; denylist tests enforce it |
| 3 | Viva 5 items (board mindset; self-intro + core basics; current affairs/local context; body language; post-viva debrief + notebook loop) | Gemini | ADAPTED | Became 6 viva items (see R1): final-prep split out; recruitment-context section added to common-questions |
| 4 | Career 4 items (choosing/balancing tracks; long timelines/burnout; parallel skills; switching tracks) | Gemini | ADAPTED | Became 5 career items (see R1): job-search/application item added |
| 5 | CV 3 items packaged, 4 topic areas (CV vs biodata vs form; education/projects/teaching; tailoring + no inflated claims; layout/file hygiene/pre-submission) | Gemini | ADAPTED | Became 4 CV items (see R1): mistakes/correction item added; the 2 fictional sample structures landed in CV item 2 |
| 6 | Honesty phrasing ("সাধারণত প্রার্থীদের…", "বোর্ডে প্রায়ই দেখা যায়…", "প্রস্তুতির একটি কার্যকর উপায় হলো…", "প্রতিটি নিয়োগ বা প্রতিষ্ঠানের নির্দেশিকা আলাদা হতে পারে…") | Gemini | USED | Used throughout the items; see also #14 |
| 7 | Top-of-page note: general reading guidance, not official syllabus/verified pattern/circular; never a "Verified" badge unless tied to a held official source | Gemini | USED | Disclaimer on all 3 pages; no Verified badge anywhere; denylist bans "যাচাইকৃত" |
| 8 | Leave out fixed BCS viva marks, board scoring formulas, pass/fail thresholds, any NTRCA cycle's marks/structure/stages/pattern, age limits, fees, dates, circular details, any viva simulator/AI interviewer/scoring widget/quiz | Gemini | USED | Denylist tests; nothing of the kind exists in the pages |
| 9 | 12 items is the sweet spot in 10–15; each ~500–900 words / 3–5 min; 3–4 short subheadings + bullets + summary box | Gemini | ADAPTED | 15 items, not 12 (see R1). Structure USED (intro + 3–4 sections + summary). Word count ADAPTED: items run 170–360 words (see R5) |
| 10 | Cross-links: viva → Wrong-Answer Notebook, Planner, MCQ Practice; career → Planner, Dashboard, Job Circulars (reminder to check official notices); cv → career + viva | Gemini | USED | Related-links bars per page; career job-search item links /jobs/circulars in text |
| 11 | Reading experience: 16–18px Bangla body, line-height 1.65–1.75, short paragraphs, stacked cards/simple bullets (no cramped multi-column tables), minimal/optional images (text-first), top switcher, item list + prev-next bar, explicit links to related /jobs sections | Gemini | USED | 16px / 1.75 / stacked cards; no images at all (text-first); switcher + list + prev/next + related links |
| 12 | Progress/bookmarking only if it reuses an existing lightweight pattern with zero extra writes per tap; otherwise skip — clean fast reading with zero extra writes is a win | Gemini | USED | Skipped in v1 (see R2) |
| 13 | No invented/unverified exam facts, fake circulars/unearned Verified tags, feature creep/fake engines, over-engineering on Spark, generic filler clichés without concrete steps | Gemini | USED | Denylist + content review; no engines, no Cloud Functions, no AI APIs |
| 14 | Build a small structured Bangla-first career library, not another examination feature; teach transferable skills, not supposedly fixed rules | ChatGPT | USED | The whole step is this |
| 15 | 15 reading items — 6 Viva, 5 Career, 4 CV | ChatGPT | USED | Exactly the shipped count (see R1) |
| 16 | Viva 6 items incl. (5) dress/punctuality/professional conduct and (6) final prep + common mistakes; recruitment-specific context section inside the six articles (BCS/Bank/Primary/NTRCA general suggestions, "may be useful to review" framing) | ChatGPT | USED | Dress/behaviour folded into body-language + final-prep; recruitment-context section added as 4th section of common-questions with the "কাজে দিতে পারে" framing |
| 17 | Career 5 items incl. (4) BCS/Bank/Primary/NTRCA path choice as the CENTRAL connecting article, and (5) job search/application/long-term planning; do NOT create separate long articles per recruitment category | ChatGPT | USED | choosing-track is the single track-comparison article (no per-category articles); job-search is item 5 |
| 18 | CV 4 items incl. (2) two fictional sample structures (fresh graduate + inexperienced job seeker, placeholder info only) | ChatGPT | USED | Sample structures in CV item 2, labelled "উদাহরণ মাত্র", placeholder "আপনার নাম / আপনার প্রকৃত তথ্য" |
| 19 | Honesty — three content types (general guidance / illustrative example / official information); reusable disclaimer (top or bottom of all three pages); content verification policy (no recruitment-specific claim without a traceable official source; "Verified" ≠ moderator-reviewed) | ChatGPT | USED | Disclaimer verbatim-adapted at the top of all 3 pages; all content is general guidance + labelled examples; zero official-info claims; denylist enforces the policy in code |
| 20 | Standard structure per item (পরিচিতি / মূল আলোচনা / উদাহরণ / সাধারণ ভুল / মনে রাখুন) + read time + "Reading material" label | ChatGPT | ADAPTED | See R3: intro + 3–4 sections + summary covers all five elements without forcing five rigid sections; read time + label shown per item |
| 21 | Cross-links: Career → CV → Viva → Job Circulars; Career Art. 4 → MCQ + mocks; Career Art. 5 → circulars; CV Art. 4 → CV checklist + interview prep; Viva Art. 2 → CV Art. 2; Viva Art. 3 → existing GK lessons | ChatGPT | ADAPTED | Career → CV → Viva → Circulars chain USED via related bars + in-text links. Viva Art. 2 → CV is an in-text link to /jobs/cv. Viva Art. 3 → GK lessons ADAPTED to /jobs/common (the Job section's GK/common prep — there is no per-lesson GK link target to point at) |
| 22 | Mobile reading page: breadcrumb → title → intro → item list (title, minutes, পড়া শুরু করুন) → individual article → Previous/Next → related links; footer "Eduvelto · শেখার জন্য তৈরি, পরীক্ষার প্যাটার্নের নিশ্চয়তা নয়" | ChatGPT | ADAPTED | Single page per guide with anchor-based prev/next, not per-item routes (see R6). Breadcrumb/back link, list, footer USED verbatim |
| 23 | Typography: Noto Sans Bengali or Hind Siliguri; body 16–18px; line-height 1.7–1.9; headings 20–24px; metadata ≥12–13px; no justified text, decorative fonts, excessive bold | ChatGPT | USED | 16px / 1.75 / headings 20px / metadata 13px; existing Hind Siliguri stack |
| 24 | Reading progress: simple completion tracking (users/{uid}/readingProgress/{contentId}), bookmark optional, last-read optional; NO streak/XP/points/leaderboard/timer/certificate | ChatGPT | REJECTED for v1 | See R2 — no existing schema fits, rules margin is ~80 bytes, and Phase 3 is the right home (ChatGPT's own roadmap puts it in Phase 3) |
| 25 | Firebase: use existing content/lesson collection; contentType "reading", subcategory viva/career/cv, order, language "bn", estimatedReadMinutes, status; editorial fields reviewedBy/reviewedAt/contentVersion must not imply official verification | ChatGPT | ADAPTED | See R4 — schema confirmed and mirrored in code; Firestore-backed loading deferred (no loader, no admin UI, no rules room) |
| 26 | Security: public read published only; only owner/moderator publish/edit; enforce in rules, not hidden buttons; users modify only their own progress docs | ChatGPT | USED (in principle) | No new public data and no new write path ship in this step, so nothing new is exposed; the checklist/draft are local-only by design |
| 27 | What NOT to include: (A) exam engine; (B) unmaintainable info system (per-category viva dashboards, pattern databases, unverified question banks, separate circular verification, career recommendation engine, job-market analytics, external CV service); (C) misleading claims ("আসবেই" → "অনুশীলন করতে পারেন" etc.); (D) overcomplicated reading experience (banners, galleries, autoplay, PDF downloads, nested tabs, animations, progress dashboards, mandatory registration, notifications) | ChatGPT | USED | None of it is built; the "আসবেই" rewording is in the denylist tests |
| 28 | Navigation/product: hub connects … → Step 16 Career Support Reading (ভাইভা ৬ পাঠ, ক্যারিয়ার ৫ পাঠ, CV ৪ পাঠ) | ChatGPT | USED | Hub card + /jobs section wired exactly so |
| 29 | Roadmap: Phase 1 pages + nav; Phase 2 write + publish 15 items; Phase 3 bookmarks + completion; Phase 4 connect articles | ChatGPT | USED | Phase 1+2 ship together here; Phase 3 deferred (R2); Phase 4 cross-links done now (R3/R6) |
| 30 | Final decisions: 3 pages; 15 items; Bangla-first; reading only; no quiz/scoring; no AI; existing Firestore; no Cloud Functions; official facts source-required; initial content general guidance | ChatGPT | USED | All hold, except "existing Firestore" is code content for v1 (see R4) |

## 6. Explicit reconciliations

**R1 — COUNT: Gemini 12 (5/4/3) vs ChatGPT 15 (6/5/4), design doc 10–15.
Shipped: 15 (6/5/4).** ChatGPT's count wins because its three extra
items are real gaps, not padding: viva gets its dedicated final-prep item
(Gemini's "before-after" item mixed final prep with post-viva review —
split into `final-prep` + `after-viva`); career gets the job-search /
application item (Gemini's four items never say where to find or apply
for a job); CV gets the dedicated mistakes/correction item (Gemini folds
it into the layout item). No content was duplicated to reach 15 — the
split reused the old item's sections, and the two new items are mostly
new writing. Gemini's "12 is the sweet spot" concern (lightweight,
scannable) is honoured by keeping every item short (R5).

**R2 — READING PROGRESS: Gemini "skip unless zero extra writes" vs
ChatGPT "simple completion tracking (users/{uid}/readingProgress/{contentId})".
Shipped: SKIP in v1 (Gemini's side, with ChatGPT's Phase 3 as the home).**
Three reasons: (a) no existing schema fits — the academic `progress` /
`bookmarks` collections are for lessons/quizzes, and a new
`readingProgress` collection needs a rules block; (b) the compiled rules
margin is ~80 bytes, so a new rules block cannot ship at all right now;
(c) reading works fully without sign-in, and the design doc's own
progress-like state (viva checklist + intro draft) is already delivered
as local-only state, which is the zero-write version of the same idea.
Deferred to a post-refactor step; when it returns, use ChatGPT's
explicit-actions-only rule (write on complete/bookmark, never on scroll)
and a clear anonymous→signed-in merge policy.

**R3 — CONTENT STRUCTURE: Gemini 3–4 subheadings + summary box vs
ChatGPT 5-section standard (পরিচিতি / মূল আলোচনা / উদাহরণ / সাধারণ ভুল /
মনে রাখুন). Shipped: intro + 3–4 headed sections + summary box.**
ChatGPT's five elements are all covered without five rigid sections:
intro = পরিচিতি; sections = মূল আলোচনা with examples embedded in the
bullets (sample questions, sample CV structures); mistake-avoidance
sections ("সাধারণ ভুল", "যা এড়িয়ে চলবেন", "অতিরঞ্জন এড়ানো") =
সাধারণ ভুল; summary box = মনে রাখুন. Forcing five sections on every
item would have padded short items with filler — which both AIs warn
against.

**R4 — CONTENT STORAGE: both AIs say reuse the existing lesson/content
schema. Confirmed against the actual codebase; ADAPTED to code content
for v1.** The schema is real: Step 3 §2.6 defines `jobLessons` with
`lessonType`, and `JOB_STEP16_LESSON_TYPES` (`viva-guide`,
`viva-question`, `career-guide`, `cv-guide`) is now named in
`jobContent.ts` exactly where a future loader will read it. But
Firestore-backed loading is deferred because: (a) rules still allow
only `lessonType == 'lesson'` on create — extending the allowlist needs
rules room that doesn't exist (~80 bytes); (b) no client loader and no
admin UI exist for guide lessons; (c) 0 verified teachers exist, so no
Firestore content could honestly be Published today. The code module is
shaped 1:1 on the jobLessons schema, so the swap is a loader change, not
a rewrite. Follow-up after the public-ID refactor: extend the rules
allowlist + build the loader + admin create UI.

**R5 — WORD LENGTH: Gemini 500–900 / ChatGPT 500–1,000 words per item.
Shipped items run 170–360 words each (~3,140 total), readMinutes 3–5.**
Recorded as an honest deviation, not hidden: the items are shorter than
both AIs suggested. Deliberate — Gemini's own "short, scannable,
lightweight for mobile data" principle and the design doc's mobile-first
stance outweigh word-count targets, and padding to 500 words would have
meant filler (both AIs forbid it). Read time is labelled 3–5 min per
item (60 min total), which is a generous upper estimate including
thinking time at a comfortable Bangla pace. A later content pass can
deepen items where real material exists.

**R6 — PAGE NAVIGATION: ChatGPT's list → individual article → Previous/
Next vs Gemini's item list + prev-next bar. Shipped: one page per guide
with an anchor-based item list + prev/next anchors within the page.**
The list → read → prev/next → related flow is kept, but as anchors on a
single page instead of 15 separate routes. Reasons: three routes instead
of eighteen, zero extra reads, no new route-shadowing surface, and the
whole guide stays searchable/scrollable on a phone. Per-item routes are
a follow-up if sharing/deep-linking per item is wanted (anchors already
deep-link: `/jobs/viva#common-questions`).

## 7. Deploy checklist (for the deploy coordinator)

- [ ] **Timing: Step 16 needs NO cron dependency.** Zero firestore.rules
      change (`git diff 1918766 -- firestore.rules` = 0 lines), so the
      compiled-rules margin (~80 bytes) is untouched and this is a
      **hosting-only deploy**. It can go any time — but simplest sequencing
      is AFTER the 23 Nov 14:30 cron completes, so it doesn't interleave
      with the cron's public-IDs rules deploy + backfill. Do NOT deploy
      inside the 14:00–15:30 cron window.
- [ ] Rebase `jobs/step16-viva-career` onto post-cron main (real merge in
      a scratch worktree — never `git merge-tree`; Step 15's deploy will
      have moved main). Re-run build + unit in the merge worktree.
- [ ] Confirm `git diff -- firestore.rules` is still empty in the merge.
      If any rules change has crept in, STOP and re-measure with a
      release-create probe before deploying.
- [ ] Deploy hosting from deploy-main (rebuild deploy-main from the merge
      commit FIRST + dist-freshness check — Step 13 lesson).
- [ ] Live verify BY CONTENT both domains with
      `team/verify-step16-preview.mjs` pointed at the live URL
      (routes 200, bundle md5 = dist, strings, sameAs 3, 0 prohibited).
- [ ] Delete the preview channel `step16-viva-career` after deploy.
- [ ] Rendered (Playwright) check still OWED — run it when the sandbox
      proxy recovers (routes /jobs/viva, /jobs/career, /jobs/cv + the
      /jobs/bcs hub card + the /jobs section).

## 8. Deferred / follow-ups (not in this step)

- `/jobs/current-affairs` (architecture doc lists it under Step 16) —
  needs a monthly content pipeline; not built.
- Reading progress / bookmarks (Phase 3) — see R2.
- Rules allowlist extension for the four new lessonType values + a
  Firestore loader + admin create UI for guide lessons — see R4
  (post-public-ID-refactor, when rules room exists).
- Per-item routes / deep-link sharing beyond anchors — see R6.
- Content deepening pass (R5) — only where real material exists, never
  filler.
- Rendered Playwright check — owed (proxy down).

## 9. Files changed

- `src/lib/jobVivaCareer.ts` (new) — 15 items.
- `src/lib/__tests__/jobVivaCareer.test.ts` (new) — 10 tests.
- `src/pages/JobGuidePage.tsx` (new) — shared renderer + viva tools.
- `src/lib/jobContent.ts` — `JOB_STEP16_LESSON_TYPES` + `isJobGuideLessonType`.
- `src/App.tsx` — 3 routes + lazy import.
- `src/pages/JobHubPage.tsx` — viva card links live.
- `src/pages/JobsPage.tsx` — "ভাইভা, ক্যারিয়ার ও CV" section.
- `team/step16-gemini-consultation-2026-11-23.md` — Gemini notes.
- `team/step16-chatgpt-consultation-2026-11-23.md` — ChatGPT notes.
- `team/verify-step16-preview.mjs` — preview verification (36/36).
- `firestore.rules` — **unchanged**.
