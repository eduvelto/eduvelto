# Job Step 14 — Circulars + Notifications (CLOSED IN STAGING, 23 Nov 2026)

Branch `jobs/step14-circulars`, base main `31e327a` (Step 13 live).
Worktree `~/workspace/eduorbit/phase2-project-step14/`.
**Staging only — NOT deployed, NOT merged to main, deploy-main untouched.**

## 1. Scope (derived from the design docs)

Sources: `team/job-ui-ux-design-step2.md` §7 (circulars 10 fields §7.1,
list §7.2, calendar §7.3 — confirmed-vs-estimated is BINDING) + §2.10;
`team/job-architecture-schema-step3.md` §2.18 `circulars/{circularId}`
(20 stored fields; `applicationStatus` computed, not stored;
`copyStatus` 'stored'|'link-only' — Spark has no Cloud Storage, so a
"copy" is the official link + `copyTextExcerpt`) + §2.19
`jobCalendarEvents` + §2.20 jobCurrentAffairs + §2.21
jobReports/jobCorrections; Step 11 closure report (jobNotifications
collection + rules DEFERRED to Step 14; dashboard ships the
notifications card with an honest empty state); Step 12 closure
report (exam-date countdown DEFERRED to Step 14 — real dates from
verified circulars, never student guesses); Step 13 closure report.

What shipped:

- **`/jobs/circulars`** — published circulars, newest verified first.
  Exam chips (সব / BCS / Bank / Primary / NTRCA + all 14 Job exams),
  status chips (সব অবস্থা / আবেদন চলছে / শিগগির শেষ হবে / আবেদন শেষ /
  তথ্য পাওয়া যায়নি), "শুধু যাচাইকৃত" toggle, debounced search
  (org / exam / title), compact mobile cards (exam + org, post count,
  published date, deadline + countdown, status badge, verification
  badge, official domain), paginated `limit(15)` + "Load more"
  (startAfter). Filters live in the URL (`?exam=&status=&verified=&q=`)
  so they survive going back from a detail page. Honest empty state
  (exact design copy): "এখনো কোনো সার্কুলার সংরক্ষিত হয়নি —
  অফিসিয়াল বিজ্ঞপ্তি এলে এখানে আসবে।"
- **`/jobs/circulars/:circularId`** — all 10 design fields +
  eligibility summary + copy excerpt (when stored) + verification
  block (verifier + verifiedAt + updatedAt as last-checked) +
  **separate** বিজ্ঞপ্তি দেখুন (official notice) / আবেদন করুন
  (official application portal) actions + closed/archived handling +
  honest not-found state.
- **`/jobs/calendar`** — next-confirmed-date countdown card (the
  Step 12 countdown, now real) + upcoming-events list grouped by
  month + simple month grid (desktop + mobile, tap a day to filter)
  + "শুধু বিজ্ঞপ্তি থেকে নিশ্চিত তারিখ" note. Events come ONLY from
  verified published circulars (deadline / exam date) + published
  daily/weekly mocks. No estimated dates exist anywhere.
- **`/jobs/notifications`** — in-app notification centre: unread
  count + category filters (সব / সার্কুলার / মক টেস্ট / ফলাফল) +
  mark read / mark all as read / dismiss + target-exam hint when no
  exams are enrolled. Signed-out visitors get an honest login prompt
  + a link to the circulars page.
- **Dashboard P5 wired** — Circulars card (latest 3 published +
  link), Calendar card (next confirmed event + countdown + link),
  Notifications card (top 3 unread + count + link). All three share
  ONE `listPublishedCirculars({pageSize: 15})` query.
- **`'circulars'` added to `BACKUP_COLLECTIONS`** (now 46 entries).

Standing honesty rules kept throughout: verification and application
status are two separate dimensions; a missing deadline is "তথ্য পাওয়া
যায়নি" (never guessed, no countdown, no Open badge); the Apply action
appears only for verified circulars with a confirmed apply link and an
open window; closed circulars stay listed (archived, for exam prep /
history); no invented numbers, no readiness % / pass probability /
peer comparison / ranks; practice never shown as verified; every
practice link guarded against a published bundle; truthful empty
states. No circular is ever shown as live/verified without its
official source.

## 2. Rules — measured FIRST, gate PASSED

- Baseline (main, after Step 13): stripped 172,360 bytes, compiled
  ≈254,868, margin ~1,132.
- New `match /circulars/{circularId}` block (after the
  jobQuestionBundles block): `allow read: if
  resource.data.get('reviewStatus', '') == 'published' ||
  isModerator()` (lowercase 'published' — the Job convention; do NOT
  use `isPublished()`, which checks capital-'Published');
  `allow create, update: if isModerator()` + `keys().hasOnly([...22
  keys...])` + reviewStatus enum
  ['draft','in-review','verified','published','rejected']; **NO
  delete rule** (a wrong circular is unpublished via
  reviewStatus='rejected'; delete comes with Step 15 admin); **NO
  copyStatus enum** (UI falls back to 'link-only'); **NO
  lastCheckedAt** (updatedAt is the last-checked display).
- Stripped size after the block: **173,071 bytes (+711)** — source
  limit 262,144, headroom 89,073. Estimated compiled total ≈255,920
  (est. margin ~80) at the observed 1.479 compiled/stripped ratio
  (consistent to 3 decimals across two independent measurements).
- **Release-create probe — GATE PASSED (23 Nov ~20:11).** A
  throwaway release (`step14-size-probe`) was created against a
  probe ruleset built from the stripped file; the release-create
  SUCCEEDED, which proves the ruleset is UNDER the 256,000-byte
  compiled limit (rulesets.create does not enforce the limit; only
  release-create does — verified 22 Nov on the forced-app-update
  probe, 256,292 vs limit). The live `cloud.firestore` release was
  NEVER touched. Probe rulesets
  `8f6d4afd-83dd-4479-bd74-5ddf1d992dc0` (first attempt, rejected on
  a release-name format error, deleted) and
  `a73e7eae-33cc-40a8-aab0-7a3dab0d9787` (success attempt, deleted)
  were both deleted (HTTP 200), as was the probe release (HTTP
  200). Probe script: `~/workspace/eduorbit/step14-rules-size-probe.mjs`.
  Caveat: the exact compiled size is not returned on a successful
  probe — the gate is pass/fail, and it passed. The exact size is
  confirmed again at deploy time (safe failure: an over-limit
  release is rejected and live rules stay unchanged).
- **No `jobNotifications` collection ships.** The margin fits ONE
  minimal block only. Notifications are derived client-side from
  published circulars + mocks (`src/lib/jobNotifications.ts`);
  read/dismissed state is local per device (localStorage). Push is
  deferred (see §5).
- **No composite index needed.** The circulars queries use one/two
  `==` filters (reviewStatus, optional examSlug) + limit + startAfter
  (implicit `__name__` order) — no `orderBy`, no range filter. The
  deploy is rules + hosting, with **no index change**.

## 3. Files changed

| File | Change |
|---|---|
| `firestore.rules` | +32 lines: circulars match block (§2 above) |
| `src/lib/jobCirculars.ts` | NEW: types, `CIRCULAR_ALLOWED_KEYS`, `validateCircular`, `circularFromStored`, `endOfDhakaDayMillis`, `circularEffectiveDeadlineMillis`, `circularApplicationStatus` (computed from dates only; closing-soon = Dhaka calendar daysLeft ≤ 3), `isCircularVerified` (verifiedBy non-empty ONLY — published ≠ verified), `circularDaysLeft`, `CIRCULAR_STATUS_BN/EN`, `circularDeadlineLine` (countdown only for confirmed deadlines), `canShowApply` (verified + applyUrl + open/closing-soon only), `circularDomain`, `sortCirculars` (verified first, then newest publishedDate), `filterCirculars`, `formatDhakaDate` (always WITH year, Asia/Dhaka; time only for datetime), `toBanglaDigits` |
| `src/lib/jobCircularsData.ts` | NEW: `listPublishedCirculars` (reviewStatus=='published' + optional examSlug ==, limit 15+1 for hasMore, startAfter cursor; malformed docs skipped), `loadPublishedCircular` (null when missing/invalid/not published). Public — works signed-out. `CIRCULARS_PAGE_SIZE = 15` |
| `src/lib/jobCalendar.ts` | NEW: `buildCalendarEvents` (from VERIFIED published circulars only: deadline → 'application-deadline', examDate → 'exam-date'; published daily/weekly mocks by scheduleDate → mock events; full mocks with null scheduleDate contribute none; ALL events isConfirmed=true — NO estimated events in v1), `nextConfirmedEvent`, `daysUntilEvent` (day-granular), `groupEventsByMonth`, `eventsOnDay` |
| `src/lib/jobNotifications.ts` | NEW: `deriveJobNotifications` (in-app feed, computed on visit; NO sends): deadline reminders (verified circulars, deadline ≤7d, period started, not passed, exam-scoped; one item per circular, urgency escalates: ≤7d normal, ≤3d high, ≤1d high, today "আজ শেষ দিন"; NO reminders when no target exam set), new-mock items (today's daily + this week's weekly when published), result-ready (latest attempt submitted within 7 days, deep link, NO score in the body). Local read/dismissed state in localStorage per uid (`parseNotificationLocalState`, `markNotificationRead`, `markAllNotificationsRead`, `dismissNotification`, `visibleNotifications`, `unreadNotificationCount`) |
| `src/lib/__tests__/jobCirculars.test.ts` | NEW: 36 tests (ChatGPT timeline: opens 1 Dec 2026, deadline 15 Dec 2026 23:59 Dhaka → 30 Nov upcoming, 1–11 Dec open, 12–15 Dec closing-soon, 16 Dec closed; date-only end-of-day rule; verified logic; canShowApply 6 cases; deadline lines; validateCircular; sort/filter; formatDhakaDate) |
| `src/lib/__tests__/jobCalendar.test.ts` | NEW: 11 tests (verified-only events, mock events, no event for full mocks, sort, next, day-granularity, month grouping, eventsOnDay) |
| `src/lib/__tests__/jobNotifications.test.ts` | NEW: 17 tests (7d/3d/1d/today windows, unverified/closed/other-exam/no-target exclusions, mock + result-ready, local state) |
| `src/pages/JobCircularsPage.tsx` | NEW: list page (§1) |
| `src/pages/JobCircularDetailPage.tsx` | NEW: detail page (§1) |
| `src/pages/JobCalendarPage.tsx` | NEW: calendar page (§1) |
| `src/pages/JobNotificationsPage.tsx` | NEW: notifications page (§1) |
| `src/pages/JobSeekerDashboardPage.tsx` | P5 cards wired (§1); +256/−43 lines |
| `src/App.tsx` | 4 lazy imports + 4 routes before `/jobs/:exam/:tab` |
| `src/lib/backup.ts` | `'circulars'` → BACKUP_COLLECTIONS (46 entries) |
| `emulator-tests/rules-step14-circulars.test.ts` | NEW: r1–r8 + i15 E2E (§4) |

Diff stat: 4 modified files +259/−43, plus 13 new files. No other
file touched. `dist/` is gitignored (not committed).

## 4. Verification

- **Build: PASS** (`npm run build`, 23 Nov ~20:06). Fixed during the
  build: `Chip` tones are only `'blue' | 'gold' | 'navy' | 'outline'`
  (no teal/muted/amber); `PageShell` requires `titleBn` + `titleEn`
  (detail page uses `hideTitle` and keeps its own heading);
  `JobMockWithId` is exported from `jobMocks.ts`, not `jobMock.ts`
  (fixed in `jobCalendar.ts`, `jobNotifications.ts`, both test
  files, and `JobNotificationsPage.tsx`); `dhakaDayKey` takes
  millis, not a `Date`; one Latin-digit bug — Bangla countdown
  strings used `${days}` (Latin digits) — fixed with
  `toBanglaDigits` in `jobCirculars.ts`, `jobNotifications.ts`,
  `JobCalendarPage.tsx`.
- **Unit: 666/666 PASS** (`npm run test:unit`, 28 files) — 602 on
  main + 64 new (36 circulars + 11 calendar + 17 notifications).
- **Rules: 1044/1044 PASS** (`npm run test:rules`, 29 files,
  sequential, default ports, fresh emulator,
  `JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"`, JRE
  `~/workspace/.jdk/jdk-17.0.21.1+2-jre/bin`) — 1033 on main + 11
  new: r1 guest reads published + published list returns only the
  2 published docs; r2 student cannot read a draft + draft list
  query denied; r3 moderator creates a valid draft; r4 student
  create denied; r5 bad reviewStatus denied; r6 extra key denied;
  r7 moderator unpublishes (reviewStatus='rejected') and the guest
  can no longer read it; r8 delete denied for moderator AND student
  (no delete rule by design); **i15 E2E**: seed one published
  verified BCS circular (deadline 15 Dec 2026 18:00 Dhaka) + one
  draft + one published closed Primary circular — read back through
  the rules-checked guest list query (the exact shape
  `listPublishedCirculars` runs), then `deriveJobNotifications`
  yields exactly 1 item (BCS, 5 days out, normal priority) and
  `buildCalendarEvents` yields events only from the verified
  published circulars (never from the draft).
- **Preview: 45/45 PASS** — https://eduvelto--step14-circulars-y06d34t0.web.app
  (expires 29 Nov 2026 20:11:38 UTC). Verifier:
  `~/workspace/eduorbit/verify-step14-preview.mjs` (log:
  `~/workspace/eduorbit/verify-step14-preview.log`). 11/11 routes
  200 (`/`, `/jobs`, `/jobs/circulars`,
  `/jobs/circulars/anything`, `/jobs/calendar`,
  `/jobs/notifications`, `/jobs/dashboard`, `/jobs/planner`,
  `/jobs/wrong-answers`, `/privacy`, `/founder`); 6/6 files md5 ==
  dist (main bundle `index-Zn_GaQjL.js` 9650a47676f4, 4 new page
  chunks, dashboard chunk); 15/15 new strings present; 3/3 old
  strings absent ("Step 14-এ আসছে" 0); 4/4 prohibited NU phrases
  absent; sameAs exactly the 3 URLs; homepage title unchanged;
  robots.txt 200; ads.txt exact.
  - Context check: "আবেদন চলছে" occurs 1x — it is the circulars
    Open-status filter label (computed from real deadlines), NOT an
    NU-admission claim. Legitimate use, recorded, not a violation.
- **Rendered (Playwright) check OWED** — sandbox proxy still down.
  Recorded as owed, never as passed.
- **$0 spent. No live Firestore reads/writes** (quota still
  exhausted until ~14:00; all verification was emulator + preview
  content only). The only live-API calls were the Rules API
  size-probe (§2) — metadata only, no Firestore data touched.

## 5. Multi-AI fold-in — ONE combined table (Gemini + ChatGPT)

Gemini chat: https://gemini.google.com/app/1bb09ed98ced3769
ChatGPT chat: https://chatgpt.com/uc/6b03471f-58c0-83ea-84e2-8404e8c33321

| # | Advice (source) | Decision | Reason |
|---|---|---|---|
| 1 | Exam filter chips first (All/BCS/Bank/Primary/NTRCA) + status toggle, Open/Closing Soon default (Gemini); horizontal scrolling chips, no filter drawer (ChatGPT) | USED | Chips implemented exactly; all 14 Job exams as chips, status chips + verified-only toggle. Default shows all statuses (not Open-only) so closed/archived circulars stay discoverable for prep — see #28. |
| 2 | Compact mobile cards, high-signal fields above the fold: exam + org (Bangla + English acronyms), post count, deadline date+time Asia/Dhaka + countdown, status badge, official Apply link with domain visible (Gemini); most important visible without opening (ChatGPT) | USED | Cards show exactly this; deadline line pairs the exact Dhaka date with the countdown. |
| 3 | Post count exact ONLY when confirmed, else "উল্লেখ নেই"/"যাচাইাধীন" (Gemini); officially stated or unknown (ChatGPT) | USED | `totalPosts === null` renders "উল্লেখ নেই" / "বিজ্ঞপ্তিতে উল্লেখ নেই". |
| 4 | Source provenance + lastCheckedAt (sourceUrl, sourceLabel, verifiedAt, lastCheckedAt) on every record (Gemini); source metadata incl. verified_at, verified_by (ChatGPT) | ADAPTED | `officialUrl` + `verifiedBy` + `verifiedAt` stored and shown; `lastCheckedAt` ADAPTED to `updatedAt` as the last-checked display (rules-margin trim — see §2). `sourceLabel`/`source_type`/`source_organization`/`document_hash`/`source_notes` DEFERRED (needs the §2.21 source/history collections + rules room — the public-ID refactor freeing ~4,992 bytes is the path, after the 23 Nov 14:30 cron). |
| 5 | Paginate limit(15) + "Load more" (startAfter), never hundreds (Gemini); pagination 10–15 (ChatGPT) | USED | `CIRCULARS_PAGE_SIZE = 15`, cursor pagination, hasMore. |
| 6 | Cache-first / offline persistence fallback for spotty 3G/4G (Gemini); cache recently viewed, in-app feed as push fallback (ChatGPT) | ADAPTED | App uses plain `getFirestore` (no persistence configured). No persistence change in Step 14 — a wider app decision; circulars pages are tiny (15 docs/page) and re-fetch cheaply. Recorded as a follow-up, not silently skipped. |
| 7 | No heavy preview images; tap to open the official notice, never download big scanned PDFs on mobile data (Gemini); PDFs only on request, no forced downloads (ChatGPT) | USED | No images, no PDF embedding — links open the official notice/portal in a new tab. |
| 8 | No "Verified" badge without an official source (Gemini); NEVER verified just because an admin added it / Facebook shared it / coaching center published it / another job site lists it / the link works (ChatGPT); three non-negotiables: (1) no official source, no verified badge; (2) no confirmed deadline, no countdown/reminder; (3) no confirmed application link, no Apply Now (ChatGPT) | USED | `isCircularVerified` = `verifiedBy` non-empty ONLY; published ≠ verified. All three non-negotiables are enforced in `canShowApply` + `circularDeadlineLine` + `deriveJobNotifications` and unit-tested. |
| 9 | No inferred/guessed/placeholder numbers, never guess deadlines, never fall back to a generic homepage link as an apply link (Gemini); missing deadline = unknown, never estimated (ChatGPT) | USED | Unknown deadline renders "তথ্য পাওয়া যায়নি" + "সরকারি উৎসে আবেদনের শেষ তারিখ নিশ্চিত করা যায়নি। আবেদন করার আগে মূল বিজ্ঞপ্তিটি দেখুন।" + আবেদনের অবস্থা: অজানা. Verified source without a deadline: "সরকারি বিজ্ঞপ্তিতে আবেদনের শেষ তারিখ উল্লেখ নেই।" (missing data ≠ unverified data). |
| 10 | No auto-play media, heavy heroes, popups; no paid/referral/agent upsells; no silent stale data — never leave Open after the deadline passes (Gemini); no promotional notifications disguised as official, no alarming language, opt-in/relevant/quiet by default (ChatGPT) | USED | No media/heroes/popups/ads in circulars. Status is computed from the official dates on every render, so a passed deadline flips to Closed without any manual edit. No promotional notifications exist. |
| 11 | Deadlines Asia/Dhaka with exact portal times (5/6 PM) (Gemini); server timestamps + explicit timezones; `deadlineTimezone: "Asia/Dhaka"`, `deadlinePrecision: "datetime"\|"date_only"\|"unknown"` (ChatGPT) | USED | `deadlinePrecision` stored; datetime deadlines use the exact stored time; date-only deadlines close at end of day Dhaka (conservative — never invent 11:59 PM); all display via `formatDhakaDate` (Asia/Dhaka, always with year). `'unknown'` precision is represented by a null deadline + "তথ্য পাওয়া যায়নি" (no separate precision value stored — the null IS the unknown). |
| 12 | Status table: verified + >72h → খোলা; within 72h/today → শেষের পথে; passed → বন্ধ (Apply dimmed/relabeled "মূল বিজ্ঞপ্তি দেখুন"); unverified → অযাচাইকৃত; official out but field missing → খোলা/তথ্য অসম্পূর্ণ (Gemini); Open/Closing soon (3 days)/Closed/Upcoming/Unknown, NEVER a manually entered status as source of truth; example timeline opens 1 Dec, deadline 15 Dec 23:59 → 30 Nov Upcoming, 1–11 Dec Open, 12–15 Dec Closing soon, after Closed (ChatGPT) | USED (with reconciliation #R4) | Statuses computed client-side from dates only. The ChatGPT example timeline is unit-tested verbatim (36 tests). "Upcoming" exists as a status (`upcoming`) and is used by `circularApplicationStatus`; the list page's status filter does not yet expose an Upcoming chip (only 5 filters) — the status itself renders on cards/detail. "তথ্য অসম্পূর্ণ" is rendered per-field ("বিজ্ঞপ্তিতে উল্লেখ নেই"), not as a separate status. |
| 13 | Store Timestamp + raw official string/note for conditional phases (Gemini); keep original deadline in audit history, add extension notice, never silently change a deadline (ChatGPT) | ADAPTED | Timestamps stored; extension/correction history is DEFERRED to Phase 3 (needs `circularHistory` collection + rules). Moderator edits update `updatedAt`; the detail page shows "সর্বশেষ হালনাগাদ" so a changed deadline is never silent to the reader, but there is no per-field audit trail yet. |
| 14 | Compute Open/Closing/Closed dynamically client-side + scheduled Cloud Function hourly status update (Gemini); server-side scheduled process OR dynamically calculated status (ChatGPT) | ADAPTED | Client-side computed status ONLY (Gemini's own dynamic-computation pattern). Cloud Functions / Cloud Scheduler are NOT available on Spark free — recorded as ADAPTED with the reason. |
| 15 | "Report outdated/incorrect info" action on cards (Gemini); "তথ্যে ভুল আছে? রিপোর্ট করুন" on every circular, stored for admin review, never auto-changing verified info (ChatGPT) | DEFERRED to Step 15 | No corrections/report UI exists in the Job pages yet (checked 23 Nov); needs the §2.21 jobReports/jobCorrections flow + admin review UI. A button with nowhere to go would be dishonest. |
| 16 | Notifications: user-controlled subscriptions by exam + type; deadline reminders 3d + 24h before a verified open circular closes, only not dismissed/applied (Gemini); reminder schedule 7d (optional) + 3d + 1d + deadline day (optional); only when verified deadline + period started + not passed + opted in/saved + previous reminder not already sent; never for unverified (ChatGPT) | USED (with reconciliation #R3) | One item per circular, urgency escalates in place (≤7d normal, ≤3d high, ≤1d high, today "আজ শেষ দিন"). No sends exist, so duplicates are impossible by construction. "Dismissed/applied" is the local dismiss action; there is no saved/applied tracking yet (savedCirculars is Phase 3). |
| 17 | New mock availability (when a new free mock/practice set for their chosen exam goes live) (Gemini); by exam preferences, don't notify every user about every mock (ChatGPT) | USED | Today's daily + this week's weekly mock, exam-scoped when a target is set, platform-wide otherwise. |
| 18 | Result-ready notices (mock score/analysis ready, or official result officially published — never claimed until verified) (Gemini); test name, completion date, deep link, optional summary, NEVER sensitive scores in lock-screen push previews (ChatGPT) | USED | Result-ready = the student's own latest attempt submitted within 7 days, deep link to `/jobs/result/:id`, NO score in the body. Official-exam results are NOT notified (no verified official-result source exists yet). |
| 19 | In-app Notification Center + optional push (FCM); never force permission prompts — only after "Notify me" (Gemini); center UI: নোটিফিকেশন + unread count, filters সব/সার্কুলার/মক টেস্ট/ফলাফল, mark read/all-read, delete/dismiss, preferences (ChatGPT) | ADAPTED | In-app centre shipped exactly as specified (unread count, 4 filters, mark read/all-read, dismiss). FCM push DEFERRED — Spark free has no Cloud Functions; the in-app centre is the delivery mechanism. No permission prompt exists at all in v1. |
| 20 | Quiet hours + batching in Cloud Functions; data-light payloads (short Bangla + deep link) (Gemini); handle push failures, retain in-app even if push fails; avoid expensive real-time listeners (ChatGPT) | ADAPTED | No sends → no quiet-hours/batching problem in v1; payloads are short Bangla + deep links by construction. No real-time listeners anywhere (one-shot loaders only, the Step 11 pattern). |
| 21 | No spam/engagement nags; no unverified "Result Out!"/"Circular Coming Tomorrow!"; no alerts for closed circulars; no over-granular noise without controls (Gemini); same reminder repeatedly, all exams to all users, notifications without destination, mandatory permission, push for every minor DB update (ChatGPT) | USED | No engagement nags; no unverified alerts; no closed-circular alerts; one item per circular; every item has a deep link; exam-scoped reminders (skipped entirely when no target exam is set). |
| 22 | Mistakes: non-uniform circulars (division-phased BCS/Bank, NTRCA nuances — scannable card + expandable detail) (Gemini); confusing verified with active (two dimensions); date without year; countdowns for uncertain dates; Apply too prominent; hiding the official source; treating all govt recruitment as BCS; English-only terminology; too much info on mobile cards; failing to handle changed circulars; old circulars disappearing (ChatGPT) | USED | Two dimensions kept separate everywhere (verification badge ≠ status badge); dates always with year; countdowns only for verified precise deadlines; Apply shows the domain + a "leaves Eduvelto" note, never a bare redirect; source domain visible on every card; BCS/Bank/Primary/NTRCA are separate exam categories (registration vs institution recruitment distinguished by the exam model); Bangla-first glossary used (চাকরির বিজ্ঞপ্তি, আবেদনের শেষ তারিখ, পদসংখ্যা, সরকারি উৎসে যাচাইকৃত, যাচাই করা হয়নি, আবেদনের সময় শেষের পথে, আবেদন শেষ, সরকারি উৎস, ফলাফল প্রকাশিত); cards essential-only, detail on the page; archived circulars stay searchable and clearly labeled. Changed-circular history is the one item deferred (see #13). |
| 23 | Index by examType/status/deadlineAt; query only what the active filter needs (Gemini); paginate (orderBy/where/limit + load more); avoid expensive real-time listeners (ChatGPT) | ADAPTED | v1 uses one/two `==` filters (reviewStatus, optional examSlug) + client-side sort/filter; NO composite index needed (see §2). Server-side status filtering + a composite index is a follow-up when the collection grows past ~50 docs. |
| 24 | Push permission ≠ delivered (always mirror in-app) (Gemini); push never a dependency, retain in-app (ChatGPT) | USED | In-app IS the delivery; there is no push to fail. |
| 25 | Details page: title, org, exam, publication date, vacancies, eligibility/qualifications if sourced, opening, deadline, fee if officially stated, official PDF, official application website, last verification date, correction/extension notices; two actions বিজ্ঞপ্তি দেখুন + আবেদন করুন — PDF and portal are SEPARATE links (ChatGPT) | USED (with reconciliation #R5) | All except fee (REJECTED — see #R5) and correction/extension notices (deferred, see #13). `applyUrl` is the separate official application-portal link; `officialUrl` is the notice/PDF link. |
| 26 | Verification system: four labels Verified/Unverified/Updated/Archived — labels describe SOURCE VERIFICATION, not application status; combos Verified+Open/Closing/Closed, Unverified+Unknown; never auto-treat unverified as open (ChatGPT); source preference order (recruiting org site → govt portal → govt-hosted PDF → govt notice/correction) (ChatGPT) | ADAPTED | Verified/Unverified implemented as the verification dimension; Archived is expressed by the Closed status + archived handling (closed circulars stay, Apply removed, "মূল বিজ্ঞপ্তি দেখুন"); "Updated" (সংশোধিত) is DEFERRED to Phase 3 (needs circularHistory). Source preference order is documented for Step 15 admin verification (no domain is hardcoded — see #27). |
| 27 | Do NOT hardcode one permanent domain per org — admin-managed approved-domains list (ChatGPT); orgs BPSC (BCS), DPE (Primary), NTRCA, individual govt banks + banking recruitment authority (ChatGPT) | DEFERRED to Step 15 | v1 shows the stored `officialUrl`'s domain visibly on every card/link instead of any hardcoded domain. The approved-domains list belongs to the Step 15 admin work. |
| 28 | Deadline passed: do NOT remove — students need it for previous-question prep/patterns/eligibility/history; no prominent Apply Now — View original circular / View archived link / Browse similar active circulars (ChatGPT) | USED | Closed circulars stay listed and readable; Apply is removed; detail shows the archived note + a link to the same exam's other circulars. |
| 29 | Duplicate detection recommended; admin history mandatory (ChatGPT) | DEFERRED to Step 15 | Dedupe key would be examSlug+circularNumber; needs the admin UI. Admin history needs circularHistory + rules room. |
| 30 | Admin dashboard ESSENTIAL: pending verification queue; verification checklist (org confirmed, original opened, post count checked, opening checked, deadline checked, official apply link checked, corrections checked); Approve/Request review/Reject; roles Super Admin / Circular Editor / Verifier / Notification Admin; audit trail for sensitive changes; no self-approval (ChatGPT) | DEFERRED to Step 15 (see #R2) | The verification CHECKLIST is recorded here for Step 15 to implement (below). Rules already allow moderator writes, so Step 15 adds UI only. |
| 31 | Mobile/low-bandwidth: no thumbnails, PDFs only on request, lightweight Bangla fonts, text-first cards, pagination 10–15, debounced search, client-side filters where loaded, skeletons, Bangla retry messages, cache recently viewed, large touch targets, readable contrast; no big animations/auto-play; preserve filters when navigating back; Bangla+English org names in search (Gemini + ChatGPT) | USED | All of it except the persistence cache (see #6). Filters preserved via URL params; search matches Bangla + English titles; skeletons + Bangla retry messages on every page. |
| 32 | Header: title চাকরির বিজ্ঞপ্তি, description, search, bell with unread count (ChatGPT) | ADAPTED | Title + description + search shipped. The bell is NOT on the circulars page — the unread count lives on the dashboard card + the notifications page, so the circulars page needs no extra reads to render its header. |
| 33 | Default sort newest verified first; default page size 10–15; closing-soon 3 days; timezone Asia/Dhaka; unverified labeled, no Apply Now promotion; expired = archived, searchable; official sources mandatory for verified; notifications opt-in + personalized (ChatGPT product decisions) | USED | Sort = verified first, then newest publishedDate; page size 15; closing-soon 3 Dhaka calendar days; Asia/Dhaka everywhere; unverified labeled with no Apply; expired archived + searchable. Notifications are visit-derived (no opt-in prompt needed — nothing is sent anywhere). |

## 6. Reconciliations (decided explicitly, not silently picked)

- **R1 — Cloud Functions / Cloud Scheduler / FCM: ADAPTED.** Not
  available on Spark free. Client-side computed status (Gemini's own
  dynamic-computation pattern) + in-app notification feed only. The
  in-app centre is the delivery mechanism; scheduled reminders need
  a trusted backend, so deadline reminders are visit-computed; push
  deferred.
- **R2 — Admin verification workflow: Step 15 owns it.** Step 14
  ships the data model + rules + student UI + derived
  notifications; the admin create/edit/verify/archive UI belongs to
  Step 15 (the design doc puts admin in Step 15; rules already allow
  moderator writes, so Step 15 adds UI only). Verification checklist
  for Step 15 to implement (from ChatGPT, adapted to our fields):
  official publishing organisation confirmed; original circular
  opened; post count checked; opening date checked; deadline
  checked; official apply link checked; corrections/extensions
  checked. Roles: Super Admin / Circular Editor / Verifier /
  Notification Admin. Audit trail for sensitive changes (deadlines,
  source links, vacancy counts); no self-approval.
- **R3 — Reminder schedule: reconciled to visit-computed windows.**
  Gemini 3d + 24h vs ChatGPT 7d (optional) + 3d + 1d + deadline day
  (optional). Step 14: ≤7d early (normal), ≤3d closing soon (high),
  ≤1d final (high), deadline day "আজ শেষ দিন" (high); one item per
  circular, urgency escalates in place. No sends exist, so no
  duplicates are possible and no idempotency keys are needed.
- **R4 — Closing-soon threshold: 3 Dhaka calendar days.** Gemini
  72h vs ChatGPT 3 days. Reconciled to day granularity so the badge
  always agrees with the displayed "আর X দিন বাকি". ChatGPT's own
  example proves the 72h instant rule contradicts the example:
  deadline 15 Dec 23:59 is closing-soon on 12 Dec, which is 83h59m
  out. Implementation changed from a millis comparison to
  `daysLeft <= 3` during the build.
- **R5 — Fee field: REJECTED.** Step 2 §7.1 #6 forbids permanently
  writing age/fee numbers; fees live in the official circular, not
  our fields. The detail page says so explicitly.
- **R6 — Report-incorrect-info button: DEFERRED to Step 15.** No
  corrections/report UI exists in the Job pages yet; needs the
  §2.21 jobReports/jobCorrections flow. A button with nowhere to go
  would be dishonest.
- **R7 — Source metadata (source_type, source_organization,
  document_hash, source_notes), circularSources, circularHistory,
  savedCirculars, notifications/notificationEvents/userDevices
  collections: DEFERRED (Phase 2/3).** They need rules room — the
  public-ID refactor freeing ~4,992 bytes is the path, after the
  23 Nov 14:30 cron. `lastCheckedAt` ADAPTED to `updatedAt`.
- **R8 — Offline persistence / cache-first: ADAPTED.** App uses
  plain `getFirestore` (no persistence configured); no persistence
  change in Step 14 (wider app decision); circulars pages are tiny
  (15 docs/page) and re-fetch cheaply.
- **R9 — Server-side exam filtering + composite index: ADAPTED.**
  v1 uses one/two `==` filters + client-side sort/filter; no
  composite index needed; server-side status filtering + composite
  index is a follow-up when the collection grows past ~50 docs.
- **R10 — "Updated" (সংশোধিত) verification label + extension/
  correction history: DEFERRED to Phase 3** (needs circularHistory
  collection + rules); docs are moderator-mutable with `updatedAt`
  tracking changes meanwhile.
- **R11 — Approved-official-domains list: DEFERRED to Step 15
  admin work;** v1 shows the stored officialUrl's domain visibly on
  every card/link instead.
- **R12 — Duplicate detection: DEFERRED to Step 15** (needs admin
  UI; dedupe key would be examSlug+circularNumber).

## 7. What is left for deploy (rules + hosting, NOT hosting-only)

Deploy checklist for the deploy coordinator:

1. Real merge in a scratch worktree (never `git merge-tree`) of
   `jobs/step14-circulars` onto main; build PASS + unit PASS + rules
   suite PASS re-run in the merge worktree.
2. **Rules deploy FIRST, with the mandatory strip step**
   (`scripts/strip-firestore-rules-comments.mjs`) — the stripped file
   must measure 173,071 bytes. The commented `firestore.rules`
   (280,718 bytes) is OVER the 262,144-byte source limit and can
   never be deployed as-is. The release-create probe already
   proved this ruleset is under the 256,000-byte compiled limit (§2);
   the deploy-time release will fail safely if anything changed.
   Restore the commented file after the deploy, as in Step 13.
3. Hosting deploy after the rules deploy. **Rebuild deploy-main
   AFTER fast-forwarding and BEFORE the hosting deploy** (Step 13
   lesson: the first Step 13 hosting deploy uploaded a stale dist —
   caught before verification; verify the new chunk files are in
   dist before deploying).
4. Live verify BY CONTENT on both domains: 11 routes 200; main
   bundle + 4 new page chunks + dashboard chunk md5 == dist; new
   strings present; "Step 14-এ আসছে" 0; sameAs exactly 3 URLs;
   title unchanged; robots/ads.txt intact; 0 prohibited NU phrasing
   (with the "আবেদন চলছে" context note from §4).
5. **No index change. No live Firestore reads/writes needed at
   deploy.** No seed data: the circulars collection is empty on live
   until a Moderator publishes the first circular (Step 15 admin UI
   or a rules-checked manual create). The pages show the honest
   empty state until then.
6. Delete the preview channel `step14-circulars` after the deploy
   (quota management — it expires 29 Nov 2026 20:11:38 UTC anyway).
7. Rendered (Playwright) check still OWED (proxy down) — run when
   the proxy recovers: circulars list + detail + calendar +
   notifications + dashboard P5 cards.

## 8. Known limits / open items

- Exact compiled rules size is known only as "under 256,000"
  (probe §2) + the ~255,920 estimate — the deploy-time release
  confirms it.
- Dashboard circulars query is capped at 15 docs; the calendar
  loads up to 50 published circulars + today's/this week's mocks.
  If the collection grows past ~50 docs, add server-side status
  filtering + a composite index (see R9).
- Notifications are per-device (localStorage): read/dismissed
  state does not sync across the student's devices. No push.
- The list page's status filter has no Upcoming chip yet (the
  `upcoming` status itself exists and renders on cards/detail).
- The circulars page header has no notification bell (see table
  #32) — unread count lives on the dashboard + notifications page.
- Step 15 (Admin) must deliver: verification queue + checklist
  (R2), create/edit/verify/archive UI, delete rule, report-incorrect-
  info + corrections flow (R6), approved-domains list (R11),
  duplicate detection (R12). Phase 3: circularHistory + "Updated"
  label (R10), source metadata collections (R7), saved circulars +
  personalised alerts, offline caching, FCM push.
