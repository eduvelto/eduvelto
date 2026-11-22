# Eduvelto Security Audit — 22 Nov 2026 (read-only)

**Scope:** live production code, main `de22fae` in `phase2-project-deploy-main/`
(2,425-line `firestore.rules`), plus the Job/Admission surface in
`phase2-project-jobs/` (3,029-line `firestore.rules`, HEAD `8625bb8`,
Step 9 in progress — `jobMocks` rules reviewed as committed; untracked
`src/lib/jobMocks.ts` not reviewed).
**Method:** static review of rules + app code, live header checks via curl.
No fixes, no commits, no deploys, no Firestore/console writes, no emulator
test suites (Step 9 build was using the ports).
**Date/time of checks:** 22 Nov 2026, ~15:35–15:55 Asia/Dhaka.

**Headline:** no privilege-escalation hole was found in the user/role system
(the role and verification gates are genuinely well built), but there are
**two live exam-integrity holes a single signed-in student can exploit
today** (academic answer keys readable on demand; NU mock deadlines
extendable forever), plus a quota-exhaustion vector that costs ~1,600 reads
per dashboard visit, and no production backup. Details below.

**What this audit could NOT verify from code:** Firebase console settings
("Link accounts that use the same email", email-enumeration protection,
phone-auth provider state, MFA enrollment, OAuth client state) — these are
console-side; the app contains no account-linking code
(no `linkWithCredential` / `fetchSignInMethodsForEmail` in `src/`), so the
console setting is irrelevant to the app either way. Whether the owner has
ever run a Firestore export is not recorded in the repo.

---

## CRITICAL

### C1. Any signed-in student can read ANY academic exam's answer key before answering
**Files:** `firestore.rules:778-782` (`hasFreshReceipt`), `firestore.rules:791-798`
(`quizReceipts` create), `src/lib/exams.ts:294-306` (`submitMcqAttempt`).

**The mechanics (traced, not assumed).** The answer key lives in
`quizKeys/{quizId}`; read is gated by `hasFreshReceipt(quizId)`
(`firestore.rules:783-784`). That function checks exactly one thing:

```js
get(.../quizReceipts/$(uid() + '_' + quizId)).data.createdAt
  > request.time - duration.value(10, 'm')
```

It is **one-sided**: there is no `createdAt <= request.time` check, no
attempt-exists check, no submitted check. The create rule for the receipt
is equally open — it requires only the id shape (`uid_quizId`), `userId ==
uid()`, `quizId`/`attemptId` strings, and `createdAt` a timestamp. It does
**not** require the named attempt to exist, does not bound `createdAt`, and
has no `keys().hasOnly()` allowlist.

**The exploit (3 calls from the browser console, no special tools).**
1. `setDoc(doc(db,'quizReceipts', uid+'_'+quizId), {userId: uid, quizId,
   attemptId: 'anything', createdAt: <now + 30 days>})` — succeeds.
2. `getDoc(doc(db,'quizKeys', quizId))` — succeeds, because `createdAt`
   (30 days in the future) is still `> now − 10m`. The "10-minute window"
   stretches to 30 days. A receipt with `createdAt` one year out opens the
   key for a year.
3. The student reads every correct answer, then takes the exam with the
   answers in hand. The receipt is owner-deletable (`firestore.rules:800`)
   and re-creatable, so the window is renewable indefinitely. No attempt
   ever needs to exist.

**Impact:** every academic MCQ exam on the live site can be answered with
the key open. The academic attempt itself is then scored client-side
(see H1), so a 100% is trivially manufactured. This is the single most
serious finding: exam integrity for the whole academic section is
unenforced at the rules layer.

**Fix (mirror the Job pattern, which is already correct — see "Verified
solid").**
1. `firestore.rules` — `quizReceipts` create: add `keys().hasOnly(
   ['userId','quizId','attemptId','createdAt'])`, `createdAt <=
   request.time`, `createdAt > request.time - duration.value(5, 'm')`,
   and `exists(/databases/$(database)/documents/users/$(uid())
   /quizAttempts/$(request.resource.data.attemptId))` — exactly the
   `jobReceipts` create rule (`phase2-project-jobs/firestore.rules:2958-2976`).
2. `firestore.rules` — `hasFreshReceipt`: add `createdAt <= request.time`
   AND require the attempt to exist with `status == 'submitted'` and
   matching `quizId` — exactly `hasFreshJobReceipt`
   (`phase2-project-jobs/firestore.rules:696-705`).
3. **App-flow change required** (`src/lib/exams.ts:294-306`): the current
   flow creates the receipt *before* the attempt exists, so step 1 would
   break it. Reorder to: write the attempt first (status `submitted`,
   answers, score empty) → create receipt → read key → one rules-allowed
   update to fill score/percentage/answers. That needs a narrow new
   owner-update clause on `quizAttempts` (unscored → scored only,
   `affectedKeys().hasOnly(['answers','score','percentage',
   'markingStatus','updatedAt'])`). Do not ship the rules change without
   the app change, or submits break.
4. **Interim mitigation (one line, deployable alone):** add `createdAt <=
   request.time` to `hasFreshReceipt` now. It does not close the hole — a
   student can still create a receipt and read the key within a real
   10-minute window before submitting — but it kills the 30-day stretch.

### C2. NU mock deadline can be extended forever by the student
**File:** `firestore.rules:2253` (`nuAttempts`), update rule at `:2293-2299`.

```js
allow update: if isOwner(uid)
  && resource.data.status != 'submitted'
  && request.time <= resource.data.deadlineAt
  && request.resource.data.questionIds == resource.data.questionIds
  && request.resource.data.configSnapshot == resource.data.configSnapshot
  && (request.resource.data.status != 'submitted'
      || request.resource.data.submittedAt == request.time);
```

There is **no `affectedKeys()` restriction**. The create rule correctly
bounds `deadlineAt` (`> request.time`, `<= request.time + 3600s` for a
mock), but the update rule never pins it: the only time check is against
the *old* `deadlineAt`. A student updates their own attempt with
`deadlineAt = now + 1h`, repeats forever, and a 60-minute mock becomes
untimed. `startedAt` can be rewritten the same way.

**Impact:** every timed NU mock (100 questions / 60 min) can be taken with
unlimited time; mock scores and timing are meaningless.

**Fix:** add to the update rule
`request.resource.data.diff(resource.data).affectedKeys().hasOnly(
['answers','score','percentage','correctCount','wrongCount',
'unansweredCount','status','submittedAt','updatedAt'])` — `deadlineAt`,
`startedAt`, `questionIds`, `configSnapshot` excluded. (The existing
`questionIds`/`configSnapshot` equality checks then become redundant but
harmless; keep them.)

---

## HIGH

### H1. Academic attempt scores are unbounded, self-asserted numbers
**File:** `firestore.rules:756-765` (`users/{uid}/quizAttempts` create).

```js
allow create: if isOwner(userId) && callerActive()
  && request.resource.data.quizId is string
  && request.resource.data.answers is list
  && request.resource.data.score is number
  && request.resource.data.totalMarks is number
  && request.resource.data.percentage is number;
```

`score`, `totalMarks`, `percentage` are bare `is number` — no ranges.
`answers` is a bare list — no per-answer validation of `marks`/`correct`.
`src/lib/exams.ts:315-340` computes the score client-side and writes it.
The attempt is then immutable (`update: if isModerator()` and only while
`markingStatus == 'pending'`, `:766-769`), so a forged 100% is permanent.

**What a student can actually fake:** `score: 999999`, `percentage: 500`,
every answer `correct: true, marks: 100`. It lands in their own history,
in `progressSummaries` (see M4), and in admin analytics.

**What it does NOT affect (checked):** there is no leaderboard, no
certificate, no public profile showing scores. The blast radius is the
student's own record + a linked guardian being shown fake progress +
polluted admin analytics. That is why this is HIGH, not CRITICAL — but it
is the same hole C1 feeds (key + self-score = manufactured 100%).

**Fix:** in the create rule, add `score >= 0 && score <= totalMarks`,
`percentage >= 0 && percentage <= 100`, `totalMarks > 0`, and
`totalMarks == get(.../quizzes/$(quizId)).data.totalMarks` plus
`answers.size() <= <quiz question count>`. The Job attempt rule already
does all of this (`phase2-project-jobs/firestore.rules:812-844`: score
bounded by totalMarks, percentage −100..100, counts sum to answers size,
`negativeDeduction == wrongCount × penalty`, `resultLabel == 'practice'`,
`trustLevel == 'unverified'`, `serverVerifiedScore` must be null). Copy
that shape. Honest limit to state plainly: on Spark (no server) the rules
can bound the *numbers* but cannot recompute the score from the answers —
true server-side scoring needs a Cloud Function / Blaze, which the owner
has ruled out. So: bound the numbers in rules **and** label academic
results "practice" in the UI (the Job side already labels
`resultLabel: 'practice'`, `trustLevel: 'unverified'`).

### H2. Community answers can be rewritten by the question author
**File:** `firestore.rules:990-1001` (`questions/{id}/answers/{id}` update).

```js
// isAccepted may be set only by the question author or a moderator.
allow update: if isModerator()
  || (signedIn() && callerActive() && get(.../questions/$(questionId)).data.authorId == uid());
```

The comment states the intent (`isAccepted` only), but the rule has **no
`affectedKeys()` restriction**. The question author can change *any* field
of *any* answer on their question: rewrite someone else's answer `body`,
flip `reviewStatus` to `Published` on an unreviewed answer, or change
`authorId`.

**Fix:** add `request.resource.data.diff(resource.data).affectedKeys()
.hasOnly(['isAccepted', 'updatedAt'])` to the author branch (moderator
branch unchanged).

### H3. Class dashboard costs ~1,600 Firestore reads per visit — trivial quota exhaustion
**Files:** `src/pages/ClassDashboardPage.tsx:159`,
`src/lib/content.ts:412` (`listPublishedBooks`, unbounded),
`src/lib/exams.ts:158` (`listPublishedQuizzes`, unbounded — its own
comment warns "loads every Published quiz WITH its full questions array
(live: 212 quizzes, ~0.91 MiB)").

Every signed-in visit to the class dashboard runs
`Promise.all([listPublishedBooks(), listPublishedQuizzes()])` — all 609
books + all 994 quizzes with full question arrays, ~1 MiB transfer.
~31 such visits exhaust the entire 50,000 reads/day Spark quota for
*everyone*. The same unbounded `listPublishedBooks()` is called by
`ClassSubjectPage.tsx:28` and `ClassIndexPage.tsx:26`. The paginated
alternatives already exist (`listPublishedBooksPage`,
`listPublishedQuizzesPage`, 50/page) and the library/directory/exam list
pages already use them — the class dashboard is the leftover.

**Exploit:** any signed-in user (registration is free, no email
verification, no CAPTCHA — see M3) reloads the dashboard ~35 times, or
scripts it, and the site's Firestore reads are gone for the day. No
privilege needed.

**Fix:** (1) replace the dashboard's full-list calls with the paginated
listers or a metadata-only list (books without chapters, quizzes without
questions); keep the full-list cache (`content.ts:452`,
`getAllPublishedBooksCached`) for the search path only — it already
exists for that purpose. (2) There is no rules-side rate limit possible
on Spark; the defence is fewer reads per visit + monitoring (see M6).

### H4. No production backup of Firestore data or Auth users; restore never tested
**File:** `src/lib/backup.ts:1-65` (the whole backup story, stated honestly
in its own header).

What exists: a client-side, owner-only JSON export (paginated 500/page,
pre-flight count, downloads to the owner's device). What does **not**
exist: any automated backup (none possible on Spark without a server),
any record in the repo of a completed export, any restore test, any Auth
user backup. Sub-collections are explicitly **not** included in the
export (`users/{uid}/quizAttempts`, `posts/{id}/comments`,
`questions/{id}/answers`, …). Client-side restore cannot recreate deleted
documents (create rules refuse them) — the only full restore path is a
Firebase console export/import or an Admin-SDK script, neither of which
has been run.

**Impact:** a bad rules deploy, an admin bulk action, or a quota incident
that corrupts/deletes live data has no recovery path. This is a
data-loss risk, not an attacker hole — but on a site the owner expects to
promote, it is the highest-severity non-attacker finding.

**Fix (owner action, no code):** (1) run a Firebase console Firestore
export now and monthly; export Auth users from the console too.
(2) Test restore on disposable data before promoting (export → delete
test data → restore → verify counts), exactly as `backup.ts` prescribes.
(3) Record the date + location of each export in `team/` so the next
audit can verify it instead of assuming.

---

## MEDIUM

### M1. Job timed mocks are untimed in practice (endsAt never enforced at submit)
**Files:** `phase2-project-jobs/firestore.rules:875-889`
(`validJobAttemptCreate` session gate), `:951-978`
(`validJobSessionUpdate`), `:890-910` (`validJobSessionCreate`).

The session machinery is otherwise excellent: `endsAt` is set once
(`:975-978` — once non-null it must equal the old value; practice must
have `endsAt == null`), autosaves require `revision == old.revision + 1`,
the attempt requires the session to exist and be `submitted` with matching
bundle/kind/exam/mock and `questionRefs.size() == answers.size()`.
But two things are missing: (a) the *value* of `endsAt` is never bounded
when first set — any timestamp passes (`is timestamp`), so a student can
set it hours out; (b) the attempt create never compares `submittedAt` to
the session's `endsAt`. A student can submit hours after the mock's
duration and the rules accept it. The client timer is the only enforcement.

**Fix:** in `validJobAttemptCreate`, add for mocks
`d.submittedAt <= jobSessionDataAfter(userId, attemptId).endsAt`
(practice has `endsAt == null`, so gate on kind). And in
`validJobSessionUpdate`, bound the first `endsAt` to `startedAt +
duration` taken from the mock's `rulesSnapshot` (or the exam config) via
`get()`. Both halves are needed — the submit check alone is toothless if
`endsAt` itself can be set to next week.

### M2. Unverified (pending) teachers can author draft content
**File:** `firestore.rules:874-878` (`contentCreate`), `:930` (quiz create).

```js
function contentCreate() {
  return isTeacher()
    && isDraftStatus(request.resource.data.reviewStatus)
    && isStr(request.resource.data.title, 200);
}
```

`isTeacher()` is role-only (`role in ['teacher','admin','moderator',
'owner']`, `:62-64`) — it does **not** check `verificationStatus`.
A self-registered teacher whose verification is still `pending` can
create draft books, chapters, lessons and quizzes (`:902`, `:1430` use
the same gate). Drafts are invisible to students and need a moderator to
publish, so nothing reaches learners — the impact is queue pollution and
wasted moderator review, plus a fake-teacher account can stockpile drafts
that look legitimate in the review queue.

**Fix:** change `contentCreate()` (and the quiz/lesson create rules that
call the same pattern) to require `isVerifiedTeacher()` instead of
`isTeacher()` — the function already exists (`:70-73`). Moderators keep
their path via `isModerator()` in `contentUpdate`.

### M3. No email verification; 6-character minimum password; no CAPTCHA on registration
**Files:** `src/lib/auth.tsx:286` (`createUserWithEmailAndPassword`),
`src/pages/RegisterPage.tsx:111` (`password.length < 6`), and a repo-wide
grep: **zero** occurrences of `sendEmailVerification` / `emailVerified` /
`isEmailVerified` in `src/`.

Anyone can register with *anyone else's* email address and use the account
immediately. There is no proof of email ownership before a teacher files a
verification application (M2), before a guardian links a child, or before
an account can be used to hammer the quota (H3). Passwords only need 6
characters (Firebase's minimum); there is no strength check in the UI.

**Fix:** call `sendEmailVerification` on sign-up; gate the teacher
application + guardian linking + (later) any sensitive action on
`user.emailVerified`. Enforce 8+ characters with a mix in the UI. This
does **not** conflict with the owner's 21 Nov decision to remove *student
identity (NID) verification* — Firebase email verification is a different,
free, standard step. Consider Firebase App Check (free, reCAPTCHA-based)
on registration when abuse appears; do not add it pre-emptively without
testing the login flow it would touch.

### M4. Progress summaries are unbounded client numbers (guardian deception)
**File:** `firestore.rules:810-819` (`progressSummaries`).

```js
allow create, update: if signedIn() && callerActive()
  && request.resource.data.userId == uid()
  && request.resource.data.attemptsCount is number
  && request.resource.data.averagePercentage is number;
```

`src/lib/progress.ts:296-354` computes these client-side from the
student's own attempts and writes them. A student can write
`attemptsCount: 999999, averagePercentage: 100` into their own summary.
Readers: the student, admins, and a **linked guardian**
(`isLinkedGuardian`, `:813`) — a child can show a guardian fake progress.
Same root cause as H1, narrower blast radius.

**Fix:** bound in rules — `attemptsCount` int `0..10000`,
`averagePercentage` `0..100`. (True server-side derivation is impossible
on Spark; state the self-reported nature in the guardian UI.)

### M5. Owner account: no 2FA, sessions never expire
**Files:** repo-wide grep — zero occurrences of `multiFactor`,
`setPersistence`, `browserSessionPersistence` in `src/`. Auth wired is
email/password + Google redirect only (`src/lib/auth.tsx:42-48, 99`).

Firebase defaults to local persistence: the owner's browser session
persists indefinitely until sign-out. There is no second factor anywhere
in the code, and no session-expiry or forced re-authentication before
sensitive admin actions. The owner role is a single password (or a single
Google account) away from full control — and the rules correctly give the
owner the highest authority (admin updates can never touch an
`owner`-role doc, `firestore.rules:651`), which makes the owner account
the highest-value target on the platform.

**Fix (owner + console, no code):** enable Firebase multi-factor auth on
the owner account; use a strong unique password + a hardware/passkey
second factor; sign out of any shared device. Code cannot enforce this —
record it as an owner action, not a code fix. Note for the record: Google
sign-in is currently broken (`auth/internal-error`, retest failed 14:57)
and removal was approved 22 Nov 15:41 ("soraw pore abar add korba") —
removal is temporary and the provider stays enabled in console; the
one Google-only user (`mdalifhossain56746@gmail.com`) recovers by
password reset. While Google sign-in is broken it cannot be abused.

### M6. No server-side quota alerting — an incident is found only when the app breaks
**File:** `src/lib/usage.ts:1-50` (states its own honest limit: counters
are localStorage estimates in one browser, "NOT the quota"; the
authoritative numbers live only in the Firebase console). `getCountFromServer`
already fails on live Firestore (`resource-exhausted`, documented in
`src/lib/exams.ts:219-224` and `team/pagination-test-report.md §5`).

**Fix:** owner checks console Usage weekly (reads/writes/deletes,
hosting transfer, egress) and records it; treat any unexplained read
spike as an incident (see H3). No code change can read the real quota
from the client.

---

## LOW

### L1. `teacherVerifications` create has no key allowlist
**File:** `firestore.rules:1053-1072`. Create checks `userId == uid()`,
`status == 'pending'`, and the types of four fields — but no
`keys().hasOnly()`. An applicant can smuggle extra fields (`checks`,
`verifiedAt`, junk) into their own record. Impact is junk only: the admin
decision overwrites the authoritative fields, and verification requires
the admin update (`:1085-1099`: `checkedBy == uid()`, `reason >= 10`,
all four `checks` true, never self) plus the `users` mirror
(`verifiedBy == uid()`, `:665-666`). **Fix:** add
`keys().hasOnly([...])` + type checks for the remaining fields.

### L2. `nuReceipts` create is the weak copy of the Job receipt
**File:** `firestore.rules:2235-2245`. No `signedIn()`/`callerActive()`,
no `keys().hasOnly()`, no `createdAt` field at all, no attempt-exists
check. The *read* side is strong (`hasFreshNuReceipt`, `:1968-1976`:
attempt must exist, `status == 'submitted'`, bundle match, 10-minute
window), so the practical impact is narrow: a suspended user could create
receipts, and a future-dated receipt re-opens the key after submission —
but the result page already shows the answers then. **Fix:** mirror
`jobReceipts` create exactly.

### L3. `nuSessions` has no field restrictions at all
**File:** `firestore.rules:2305-2308` — `allow read, create, update: if
isOwner(uid)`. A student can write anything into their own running-exam
session doc. It only affects their own exam (the attempt rules are the
real enforcement), so this is hygiene. **Fix:** add `affectedKeys()` +
bounds when NU work next touches it.

### L4. An admin can modify another admin's doc
**File:** `firestore.rules:650-666` (admin users update). The rule protects
the owner (`resource.data.role != 'owner'`) and pins `verifiedBy == uid()`
on verification changes, but an admin can change *another admin's* role /
`isActive` / `verificationStatus` (e.g. demote a fellow admin). Requires
an already-admin account. **Fix:** require `isOwnerRole()` for
role/`isActive` changes where the target's role is `admin`/`moderator`.

### L5. Live CSP still blocks Google Fonts (known bug, fix staged)
**Live headers, both domains (curl, 22 Nov ~15:50):** `style-src 'self'
'unsafe-inline' https://*.gstatic.com` — no `fonts.googleapis.com`, so
the stylesheet linked in `index.html:18-21` is blocked and headings render
in fallback serif. Fix is staged on `fix/csp-google-fonts` (`fd8dbac`),
held for deploy approval. `unsafe-inline` in `style-src` is needed for the
inline `<style>` block and inline styles; moving to nonces is a later
hardening step, not urgent. Everything else in the header set is good —
see §Headers below.

### L6. `isVerifiedTeacher` diverges between the two rules files
Deploy-main (`firestore.rules:70-73`): role `teacher` **and**
`verificationStatus == 'verified'`. Jobs worktree
(`firestore.rules:79-83`): admin/moderator/owner **or** verified teacher.
Reconcile at merge; no hole either way (staff already hold moderator
powers everywhere it matters).

### L7. Phone auth is enabled in console but not wired in the UI
Repo-wide grep: zero occurrences of `signInWithPhoneNumber` /
`RecaptchaVerifier` in `src/`. The provider is dormant — nobody can use
a UI that does not exist. **Fix (console hygiene):** disable the Phone
provider until it is actually built, so it cannot be enabled by accident
later.

### L8. Password minimum is Firebase's 6 characters (see M3)
Covered by M3; listed separately because the fix is a one-line UI change
(`RegisterPage.tsx:111`) independent of email verification.

---

## Verified solid (checked, no action)

These were traced to the line and hold up. Recorded so the next audit
does not re-litigate them.

- **No self privilege escalation on `users`.** Create (`firestore.rules`
  users block): role pinned to `student/teacher/parent`;
  `verificationStatus` only `pending` for teacher/parent; `isActive`
  cannot be set at create; full `keys().hasOnly()` allowlist. Self-update
  (`:allow update: if isOwner(userId)`): `affectedKeys` excludes `role`,
  `verificationStatus`, `isActive` entirely. Admin update (`:650-666`):
  cannot touch an `owner` doc, role allowlist excludes `owner`,
  `verifiedBy == uid()` enforced, `validVerificationTransition()` pins the
  four legal transitions (`:422-432`). Users delete is `if false` (`:301`).
- **Teacher verification flow.** Applicant creates only their own
  `tv_{uid}` record as `pending` (`:1053`); re-apply only from `rejected`
  (`:1073`); admin verify requires all four checks true + reason ≥ 10
  chars + `checkedBy == uid()` + never self (`:1085-1099`); revoke and
  reopen paths are separate and reasoned. `isVerifiedTeacher` reads the
  live `users.verificationStatus`, so a revoked teacher loses powers
  immediately.
- **Job receipts/keys/attempts are the gold standard.** `jobReceipts`
  create (`jobs firestore.rules:2958-2976`): key allowlist, `createdAt`
  ≤ now and > now−5m, attempt must exist. `hasFreshJobReceipt`
  (`:696-705`): receipt fresh (10m), attempt exists, `status ==
  'submitted'`, bundle + user match. `jobQuestionKeys` read needs that
  receipt or a practice bundle (`:2922-2929`); mock keys are never readable
  before submission. `jobQuestions`: no student read at all; author reads
  only own; moderator second-eye + transition guard + version pinning.
  `jobAttempts`: bounded scores, counts sum to answers, practice labelling
  (`resultLabel`/`trustLevel`/`serverVerifiedScore == null`).
- **Admin/CEO gates.** Every `/admin/*` and `/ceo/*` route is nested under
  `<AdminGuard>` (`src/App.tsx:242-281`); the guard is owner-only, shows a
  loading state first (no content flash), and denies signed-out and
  non-owner users (`src/components/AdminGuard.tsx`). The NU question
  workbench adds a second guard (`NuQuestionWorkbenchGuard.tsx`:
  owner/admin/verified-teacher only). The guard is UX only by design —
  the rules are the real enforcement — and the rules back it up.
- **Content reads are signed-in-only where they must be.** Quizzes:
  `contentRead && signedIn()` (`:929`) — the doc embeds questions, so no
  anonymous read of any kind. Chapters: guest reads only Published +
  `isPreview` books. `jobQuestionBundles`: published-only for students,
  and the bundle create/update rules refuse any key material
  (`correctLetter`/`explanation`/`correctText`) outright.
- **No raw-HTML XSS surface.** Zero occurrences of
  `dangerouslySetInnerHTML` / `.innerHTML =` in `src/` — React escaping
  holds throughout.
- **Secrets scan clean.** Grepped both worktrees (`src`, `team`,
  `scripts`, config) for service-account keys, private keys, tokens,
  passwords, Bearer values. Only hits are emulator-only test credentials
  (`scripts/emu-registration-walkthrough.mjs`: `secret123` for
  `@example.com` emulator accounts; `scripts/seed-dashboard-screenshots.mjs`:
  `shot1234`, header-marked "DEV/STAGING ONLY — never run against live
  Firebase", emulator ports + demo key). No `.env` files, no
  `firebase-adminsdk-*` files. The Firebase web `apiKey` in
  `src/firebase-config.ts` is public-by-design (the file itself documents
  this) and is **not** a leak.
- **Settings/feature flags are owner-only writes.**
  `settings/features` and `settings/ads` (`:1633-1700`): reads signed-in,
  writes `isOwnerRole()` with boolean-typed keys; delete is `false`.
- **Suspension is enforced server-side.** `callerActive()` reads
  `isActive != false` from the caller's own users doc and gates
  `isTeacher` / `isVerifiedTeacher` / `isAdmin` paths, so a suspended
  account loses Firestore powers, not just the UI.

## Live HTTP headers (curl, 22 Nov ~15:50)

Identical on `https://eduvelto.web.app/` and `https://eduvelto.com/`
(same ETag — same deploy, last modified 22 Nov 09:25:57 GMT):

| Header | Value | Verdict |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' https://*.googleapis.com https://*.gstatic.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://googleads.g.doubleclick.net; style-src 'self' 'unsafe-inline' https://*.gstatic.com; img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; font-src 'self' data: https://*.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://*.gstatic.com https://pagead2.googlesyndication.com https://*.googlesyndication.com; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests` | Good, except **L5**: `style-src` lacks `fonts.googleapis.com` (Google Fonts blocked — known bug, fix staged). `object-src 'none'`, `frame-ancestors 'self'`, `base-uri 'self'` all correct. Ad hosts are allow-listed deliberately (AdSense). |
| `Strict-Transport-Security` | `max-age=31556926; includeSubDomains; preload` | Good |
| `X-Content-Type-Options` | `nosniff` | Good |
| `X-Frame-Options` | `SAMEORIGIN` | Good (plus `frame-ancestors 'self'`) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Good |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()` | Good |
| `Cache-Control` | `max-age=3600` (HTML) | Fine |

`ads.txt` is correct on both domains:
`google.com, pub-6571267788512484, DIRECT, f08c47fec0942fa0`.
`index.html` contains nothing sensitive (AdSense pub ID and the Google
Fonts link are public by design). No `X-XSS-Protection` header — correct
to omit (deprecated). No `Cross-Origin-Opener-Policy` /
`Cross-Origin-Embedder-Policy` — not required for this app (no cross-origin
isolation need); optional hardening only.

---

## Top 5 fixes, in order

1. **C1 — Academic answer keys.** Add `createdAt <= request.time` to
   `hasFreshReceipt` immediately (one line); then do the full fix — receipt
   create requires an existing attempt + 5-minute window, `hasFreshReceipt`
   requires a *submitted* attempt, and reorder `submitMcqAttempt` so the
   attempt is written before the key is read. Until this ships, every
   academic MCQ result on the live site is untrustworthy.
2. **C2 — NU deadline.** Add the `affectedKeys().hasOnly([...])` allowlist
   (excluding `deadlineAt`/`startedAt`) to the `nuAttempts` update rule.
   One clause, no app change.
3. **H2 — Community answers.** Add `affectedKeys().hasOnly(
   ['isAccepted','updatedAt'])` to the question-author update branch. One
   clause, no app change.
4. **H1 + M4 — Bound the self-asserted numbers.** `quizAttempts` create:
   `0 <= score <= totalMarks`, `0 <= percentage <= 100`,
   `totalMarks == quiz.totalMarks`; `progressSummaries`: `attemptsCount`
   int `0..10000`, `averagePercentage 0..100`. Copy the Job attempt rule
   shape. Label academic results "practice" in the UI.
5. **H3 + H4 — Stop the bleed, then back up.** Replace the class
   dashboard's unbounded list calls with the paginated listers (already
   built); and the owner runs a console Firestore + Auth export now and
   monthly, with a restore test on disposable data before promotion.

After those five: M1 (Job `endsAt` enforcement), M2 (verified-teacher-only
draft creation), M3 (email verification), M5 (owner MFA) — in that order.

---

## Growth note (what changes as traffic grows on Spark)

Firebase/Google already absorb the network layer — SSL termination, edge
DDoS mitigation, and global CDN caching come with Hosting, so a traffic
spike alone does not take the site down. What remains *our* job scales
with users: every read/write is metered (50k reads/day, 20k writes/day,
360 MB/day transfer), so one unpaginated list (H3) or one abusive account
can exhaust a day's budget for everyone — pagination and monitoring are
the rate limit. Rules are the only server: there is no backend to add
rate limiting, CAPTCHA enforcement, or true score recomputation, so each
new feature must be designed so its worst case is bounded *in the rules*.
And more users means more valuable targets — the owner account, teacher
verification, and answer keys — which is why C1/C2/M5 outrank new
features. Popularity does not create new classes of hole here; it turns
the existing ones from theoretical into exercised.

---

## Fixes applied — 22 Nov 2026 (branch `fix/security-audit-2026-11-22`, from main `de22fae`)

All five audit fixes built, verified, and staged on a preview channel.
NOT merged to main, NOT deployed to production. Parent merges + deploys.

### C1 — academic answer keys readable on demand (CRITICAL) — FIXED

**`firestore.rules`:**
- `hasFreshReceipt(quizId)` — now mirrors `hasFreshJobReceipt`: receipt must
  exist, `createdAt` within the last 10 min AND `<= request.time`, `attemptId`
  a string, and the named attempt must exist with `status == 'submitted'`,
  matching `quizId`, and `userId == uid()`. (New helpers `quizReceiptData` /
  `quizReceiptAttemptData`.)
- `quizReceipts` create — `keys().hasOnly(['userId','quizId','attemptId','createdAt'])`,
  `createdAt <= request.time`, `createdAt > request.time - 5m`, the named attempt
  must exist with `status == 'submitted'`, matching `quizId`, `userId == uid()`,
  and the quiz must exist. Size bounds on `quizId`/`attemptId` (≤ 200).
- `quizAttempts` create — now requires `userId == uid()`, `status == 'submitted'`,
  `markingStatus in ['auto','pending']`, `scored is bool` with the coupling
  (`auto` ⇒ `scored == false`; `pending` ⇒ `scored == true`), plus the H1
  bounds (see below).
- `quizAttempts` update — NEW owner clause: the owner may update ONLY the
  unscored → scored transition of their own MCQ attempt
  (`markingStatus == 'auto'`, `scored == false`, affected keys only
  `['answers','score','percentage','scored','updatedAt']`, new `scored == true`,
  new score `0..totalMarks`, percentage `0..100`, answers length unchanged).
  Moderator clause unchanged.

**`src/lib/exams.ts` — `submitMcqAttempt` reordered:**
- The attempt is now WRITTEN FIRST, unscored (`score 0`, answers carry only the
  student's picks, `scored: false`, `status: 'submitted'`, `userId`), THEN the
  receipt is created (the rules now require a submitted attempt to exist),
  THEN the key is read, scored client-side, and the attempt is updated to
  scored via `updateDoc` (the only owner update the rules allow). Receipt
  deleted in `finally` as before. If the scoring update fails, the attempt
  stays unscored (score 0) in the student's history.
- `submitWrittenAttempt` now writes `scored: true`, `status: 'submitted'`,
  `userId` (required by the create rule).
- `QuizAttempt` type gains `scored?: boolean; status?: string; userId?: string`;
  `toAttempt` maps `scored` with `?? true` (old attempts carry no field and
  were written with their final score).

**Tests:** (o2)/(o3)/(o4) reworked to the new flow (submitted attempt first;
stale receipt now seeded with rules disabled, since a stale receipt can no
longer be created). New: (p1) future-dated receipt create DENIED, (p2) receipt
with no existing attempt DENIED, (p3) receipt for an unsubmitted attempt
DENIED + key read with a seeded receipt for it DENIED.

### C2 — NU mock deadline extendable forever (CRITICAL) — FIXED

**`firestore.rules` `nuAttempts` update:** added
`diff().affectedKeys().hasOnly(['answers','score','percentage','correctCount',
'wrongCount','unansweredCount','status','submittedAt','updatedAt'])` — an
update can NEVER change `deadlineAt` or `startedAt` (or `questionIds` /
`configSnapshot`, already pinned). All other update conditions unchanged.
No app code writes `nuAttempts` yet (NU-8 engine not built), so no client
flow is affected.

**Tests:** (n55a) `deadlineAt` rewrite DENIED, (n55b) `startedAt` rewrite
DENIED, (n55c) submit update (status + `submittedAt` + score/percentage/
counts) ALLOWED. Existing (n51) autosave and (n55) question-set tests still pass.

### H2 — community answers rewritable by the author (HIGH) — FIXED

**`firestore.rules` `questions/{id}/answers/{id}` update:** the author branch
now requires `diff().affectedKeys().hasOnly(['isAccepted','updatedAt'])` —
the body, upvotes and every other field are immutable for the author.
Moderator branch unchanged (may rewrite anything).

**Tests:** new (p10) author `isAccepted` update ALLOWED, body rewrite DENIED,
upvotes DENIED; (p11) moderator body rewrite ALLOWED, other student update
DENIED. (No community-answers rules tests existed before.)

### H1 + M4 — bound self-asserted scores (HIGH) — FIXED

**`firestore.rules` `quizAttempts` create:** `0 <= score <= totalMarks`,
`0 <= percentage <= 100`, `totalMarks > 0`, `answers.size() <= quiz questions
count`, `totalMarks == quiz.totalMarks` (with a fallback for quiz docs that
carry no `totalMarks`: `totalMarks <= answers.size() * 10` — both loaders
write `totalMarks`, so the fallback only covers app-created quizzes).
**`progressSummaries` create/update:** `attemptsCount is int`, `0..10000`,
`averagePercentage 0..100`.

**UI (label only, no redesign): `src/pages/QuizResultPage.tsx`** — both score
displays (MCQ and teacher-marked written) now carry
"অনুশীলন ফলাফল — এটি যাচাইকৃত বা সরকারি ফল নয়।" /
"Practice result — this is not a verified or official result." An MCQ
attempt that is still unscored (`scored == false`, e.g. the scoring update
failed) now shows an honest "scoring did not finish — refresh, or retake"
message instead of a misleading 0.

**Tests:** (e1)/(e2)/(e3)/(o6)/(o7)/(sv1) fixtures reworked to valid data
(quiz1: 1 question, `totalMarks` 1) + the new required fields; (e2) now
proves the unscored → scored owner update ALLOWED and any further owner
update DENIED. New: (p4) score > totalMarks DENIED, (p5) percentage > 100
DENIED, (p6) totalMarks ≠ quiz totalMarks DENIED, (p7) answers longer than
quiz questions DENIED, (p8) owner scoring update with score > totalMarks
DENIED, (p9) `progressSummaries` attemptsCount −1 / 10001 / averagePercentage
101 DENIED, in-bounds ALLOWED. (ag-e7) in `rules-auth-gating.test.ts` carries
the new fields.

**Honest limit (unchanged from the audit):** the rules bound the *claimed*
score to the quiz's real totals, but they cannot recompute it from the key —
a student who guesses the answers still gets the marks for the guesses.
True recomputation needs a backend (out of scope on Spark).

### H3 — class dashboard burns ~1,600 reads/visit (HIGH) — FIXED

**New helpers** (same index-safe shape as the Library/Directory paginators —
equality filters + `orderBy(documentId())`, no composite index):
- `src/lib/content.ts` — `listBooksForClass(educationType, classLevels)`:
  pages `listPublishedBooksPage` per classLevel, concatenates, sorts with
  `compareBooks`.
- `src/lib/exams.ts` — `listQuizzesForClass(educationType, classLevels)`:
  same pattern over `listPublishedQuizzesPage`, sorts with `compareQuizzes`.
- Both return `[]` with no query when `educationType` is null (Classes 1–5 /
  6–8 have no books/quizzes).

**`src/pages/ClassDashboardPage.tsx` `load()`** now fetches
`listBooksForClass(def.educationType, def.classLevels)` +
`listQuizzesForClass(...)` instead of the unbounded `listPublishedBooks()` /
`listPublishedQuizzes()`. All downstream counts/sections are unchanged
(they filter the already class-scoped lists). One-line guard added:
`if (!def) return;` at the top of `load()` (the `!def` guard previously sat
below it; `tsc` flagged the possibly-undefined `def`).

**Read cost per dashboard visit (live counts):** SSC 26 books + 55 quizzes =
81 reads; HSC 37 + 47 = 84; Honours 439 + 199 = 638; Classes 1–5 / 6–8 = 0.
Was ~1,603 (609 books + 994 quizzes) on every visit.

**Honest limit:** Honours quizzes still download with their full question
arrays (~0.9 MiB for 199 quizzes); only the *read count* is fixed. A
metadata-only quiz lister would cut transfer too — a data-model change for
the owner to approve, not built here.

### Verification (22 Nov 2026, this branch)

- `npm run build` — PASS (`tsc -b && vite build`, dist `index-DF8kuhOV.js`).
- `npm run test:unit` — PASS: **175/175**.
- `npm run test:rules` (sequential, default ports 8080/9099 — verified free
  before the run; bundled JRE `tools/jdk-17.0.21.1+2-jre/bin` on PATH) —
  PASS: **16 files, 554 tests, 0 failed** (baseline 540 + 14 new: p1–p11,
  n55a–c). Note: the suite's stderr shows pre-existing "maximum of 1000
  expressions" evaluation noise on Step 4 profile tests; those tests pass.
- Preview deploy — plain `hosting:channel:deploy security-audit-2026-11-22`:
  **https://eduvelto--security-audit-2026-11-22-07ww7oqi.web.app**
  (expires 29 Nov 09:58). NOTE: the first deploy attempt failed with HTTP
  429 "channel quota reached" — the site had accumulated ~18+ preview
  channels. The oldest superseded one, `step7-core` (Step 7 is CLOSED;
  superseded by `step7-foldin`), was deleted to free a slot; all other
  channels untouched.
- Preview content checks (HTTP + bundle identity; the sandbox proxy is down
  since 22 Nov ~14:26, so no Playwright rendered check was possible):
  `/`, `/login`, `/library`, `/exam`, `/class`, `/jobs`, `/admissions` — all
  **200**. Served `index-DF8kuhOV.js` and `QuizResultPage-BYfrc_WZ.js` are
  byte-identical (md5) to local dist; the served result chunk contains the
  new "অনুশীলন ফলাফল" label.

### Open items (not done here — owner / parent follow-ups from the audit)

- H4 (production backup): owner action — console Firestore + Auth export now
  and monthly, restore test on disposable data before promotion.
- M1 (Job `endsAt` never enforced at submit), M2 (pending teachers can author
  drafts), M3 (email verification / 6-char password / no CAPTCHA), M5 (owner
  2FA, sessions never expire), M6 (no quota alerting) — separate follow-ups,
  explicitly NOT built here per the brief.
- Rendered (Playwright) verification of the preview dashboard + result page
  is still owed — blocked on the sandbox proxy being down; re-check when it
  recovers, before the parent merges.
- The Google-login removal coordinator works in a different worktree; the
  Step 9 coordinator in the jobs worktree. Neither was touched.
