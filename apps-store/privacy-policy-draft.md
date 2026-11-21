# Privacy Policy — Eduvelto (DRAFT for owner review, NOT legal advice)

**Status:** DRAFT — 21 November 2026. For the owner's review.
**A lawyer must review this before public launch.** It is written in plain
language on purpose.
**Effective date:** [TO BE SET AT LAUNCH — fill in before publishing.]
**Version:** 1.0 (draft)

Sections marked **[PLANNED]** describe features that are NOT live yet
(private messaging, guardian progress access, profile pictures,
advertising). Those sections apply only when the feature launches; they
must be re-checked — and this policy updated — before each launch. Do not
publish this policy as if those features already exist.

## Correction log — 21 November 2026 (accuracy pass against the live platform)

Re-checked against the code and Firestore rules on branch `apps/twa-prep`:

- **CORRECTED — §2 "Account".** Registration collects ONLY name, email
  and password (role defaults to student). Education details (class,
  board, institution, subjects) are NOT collected at registration
  today — academic profiles are in development (staging), not live.
  The policy now says so.
- **CORRECTED — §2 "Learning" visibility.** Your learning records are
  visible ONLY to you and to Admin/Owner. Teachers and guardians
  CANNOT read your progress today (the rules allow read only to the
  owner of the record or an Admin). Guardian access to a linked child's
  progress is [PLANNED], not live. The old wording ("your verified
  teachers (your own class)") was wrong and is removed.
- **CORRECTED — §2 "Guardian" phone.** A guardian phone number is
  optional contact information, NOT required. Guardian verification is
  a free manual process (written information + child confirmation +
  admin-activated link); no NID, face or biometric verification is
  used, and no verification fee is charged to anyone.
- **CORRECTED — §2 "Usage counters".** They are client-side estimates
  kept in this browser's localStorage only — they are NOT server-side
  quota monitoring and cannot see other users.
- **CORRECTED — §7 "download their learning records".** No download
  button exists in the app today. Marked [PLANNED].
- **CORRECTED — §3 deletion.** Deletion is a manual admin process:
  you email ahmmizan23@gmail.com and an Admin deletes the account and
  its learning records within 30 days. There is no in-app delete
  button today.

---

## 1. Who we are

Eduvelto is a free education platform for Bangladesh.
Owner: Ali Hasan Mohammed Mizan, Founder & CEO, Eduvelto.
Contact for privacy questions: ahmmizan23@gmail.com.

## 2. What we collect and why

**Account** — name, email, password (stored hashed by Firebase — Eduvelto
never sees your password), language, role (student by default). Used to
run your account. Education details (class, board, institution, subjects)
are NOT collected at registration today — academic profiles are in
development and will be added only when they launch.

**Learning** — lessons read, exam attempts, results, progress, bookmarks.
Used to show your results, weak areas and study plans. Visible ONLY to
you and to Admin/Owner. Teachers and guardians cannot read your learning
records today.

**[PLANNED] Guardian** — a guardian account links to a child only after
a free manual verification (written information, the child's
confirmation, and Admin activation) — no NID, face or biometric
verification, and no verification fee. A guardian phone number is
optional contact information, not required. [PLANNED] Once linking and
guardian progress access launch, a guardian will see only learning
progress, results, routines and notices for a verified-linked child —
never messages, never contact details.

**[PLANNED] Messages** — private messages are stored so the participants
can read them. Nobody else reads them — not guardians, not teachers, not
administrators, not the Owner — except through the exceptional safety
process described in §6.

**Reports and moderation** — reports, blocks and moderation decisions.
Used for safety.

**Usage counters** — client-side estimates kept in this browser's
localStorage only, for rough quota awareness. They are NOT server-side
monitoring, they cannot see other users, and they reset if localStorage
is cleared. No advertising tracking.

**What we NEVER collect:** precise location, your contacts, photos of other
people, payment details (no payments are taken inside Eduvelto).
**What we NEVER do:** sell student data, show personalised/targeted ads to
children, or share data with advertisers.

## 3. Children's data (under 18)

- A child's date of birth, phone, email and profile are **"Only me" by
  default** — invisible to everyone except the child themself.
- A guardian sees only learning progress, results, routines and notices for
  a verified-linked child — never messages, never contact details.
  (Guardian linking and guardian progress access are [PLANNED] — see §2.
  Today, only the child themself and Admin/Owner can read learning
  records.)
- No unrestricted direct messaging for children.
- A child (or their guardian, or an Admin) can ask for their data to be
  deleted at any time by contacting ahmmizan23@gmail.com. Deletion is a
  manual admin process: an Admin deletes the account and its learning
  records within 30 days. There is no in-app delete button today. Audit
  logs keep only the fact that an account existed, never its content.

## 4. Advertising

**[PLANNED]** General ads only (AdSense/AdMob, non-personalised,
child-safe). No personal data is sent to ad networks. Ads never appear over
lessons, quizzes, exam controls or essential navigation. No ads are shown
in the app today; this section takes effect only when advertising is
enabled, and this policy will be updated first.

## 5. Data storage and security

Data lives in Firebase (Google infrastructure) in the `eduvelto` project,
region asia-south1. Access is controlled by Firestore security rules — not
by hiding buttons. Passwords are handled by Firebase Auth; Eduvelto staff
never see them. Backups are JSON exports held by the Admin; they are never
shared. The Owner account is protected by two-step verification.

## 6. Who can see your messages — and the exceptional process

**[PLANNED]** Private messages are visible only to their participants.
No routine access exists for anyone, including the Owner, guardians,
teachers, administrators and moderators.

Access to message content is possible ONLY in a serious safety incident
(child-safety abuse, a credible threat of harm, illegal activity, or a
lawful request), and ONLY through this process: an Admin requests access
with a written reason; the Owner alone approves it; access is scoped to
named conversations, read-only, and expires after 72 hours; every read is
recorded in a tamper-resistant audit log; the users involved are told
afterwards unless telling them would endanger someone or harm an
investigation (the reason is recorded). The Owner reviews these logs every
three months.

## 7. Your rights

Every user can: see their own data; correct their profile; change
visibility settings; block and report any user; [PLANNED] download their
learning records (no download button exists in the app today); ask for
deletion (§3). Questions or complaints: ahmmizan23@gmail.com.

## 8. Third-party services

- **Firebase (Google)** — authentication, database and hosting. Google
  processes data under its own terms as our service provider.
- **[PLANNED] AdSense / AdMob (Google)** — only if advertising is enabled
  (see §4). No personal data is sent to ad networks.

No other third party receives your data.

## 9. Changes

If this policy changes, users are told in-app before the change takes
effect. The version and date are shown at the bottom of the policy page.

---

## Review checklist (owner — before launch)

- [ ] Lawyer review completed.
- [ ] Effective date + version filled in.
- [ ] Every [PLANNED] section re-checked against what is actually live.
- [ ] Data Safety form in Play Console matches this policy exactly
      (data collected, purposes, sharing, security practices).
- [ ] Deletion flow tested end-to-end (request → deletion within 30 days).
- [ ] Policy published at a public URL and linked from the Play listing
      AND inside the app (required by Google Play).
