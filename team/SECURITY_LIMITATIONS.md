# Eduvelto — Security Limitations (what the rules can and cannot guarantee)

Written in Job Step 17 (Security Testing), 23 Nov 2026. Reconciled from the
Gemini + ChatGPT Step 17 consultations. This file exists so no future
developer assumes a control does more than it actually does.

## Architecture in one line

On the Spark (free) plan there is **no trusted backend**: Firestore Security
Rules are the primary enforcement boundary, the React client is UX only and
cannot be trusted to enforce anything, and there is no Cloud Function to
recompute a score or verify a claim server-side. Every statement below is
about what the *rules* enforce — never about what the *client* displays.

## Enforced by Firestore Rules (emulator-tested, permanent regression suite)

| Control | What the rules guarantee |
|---|---|
| Answer-key access (C1) | A key is readable only with a fresh receipt (≤10 min, never future-dated) tied to a submitted attempt that belongs to the caller and names the same quiz/bundle. Out-of-order, forged, stale, mismatched or cross-user steps are denied. |
| Receipt validity | Receipt creation requires a real submitted attempt, a 5-minute window, no future timestamp, and exactly the allowed keys. Single-use by id. |
| Attempt ownership | Attempts, sessions, notebooks and planner docs are readable/writable only by their owner (or an admin where the rule says so). Cross-user reads/writes are denied. |
| Mock deadline immutability (C2) | `startedAt` / `deadlineAt` / `questionIds` / `configSnapshot` can never change once an attempt exists; updates after the deadline are denied. |
| Score ranges (H1) | Score 0..totalMarks, percentage 0..100, totalMarks must equal the quiz's totalMarks, progress summaries bounded. Unbounded or inconsistent score claims are denied. |
| Community answers (H2) | An answer's author may change only `isAccepted` + `updatedAt` — never the text, the author, or the review status. |
| Question publishing | Only a verified bank author (staff, or a teacher whose verificationStatus is 'verified') may create drafts; publishing requires a second eye (verifier ≠ author) from Under Review, with a ≥10-char rejection reason. |
| Circular visibility | A circular is publicly readable only when `reviewStatus == 'published'`. Drafts are moderator-only. |
| Domain approval | The approved-domains allowlist is exact-hostname equality — never a substring check (`bdjobs.com.evil.example` and `notbdjobs.com` are rejected). |
| Role boundaries | Students can never self-assign admin / moderator / owner / verified-teacher; an admin can never touch another admin's or moderator's doc (owner-only); teacher verification applications cannot smuggle decision fields. |
| Guest boundaries | Guests read only published/public content (published circulars, preview chapters). Everything else is denied. |

## NOT guaranteed — do not build on these assumptions

- **Mathematical score correctness is NOT independently verifiable.** The
  rules bound a score claim (0..totalMarks, consistent percentage) but
  cannot recompute it from a confidential key without a trusted backend.
  A student who answers everything wrong can still submit a
  client-computed score of 20/20 with percentage 100, and the rules
  cannot detect the discrepancy. Treat client-computed scores as
  **bounded, untrusted claims** — never display them as independently
  verified examination results. (H1 solves unbounded/inconsistent
  claims, not score fraud.)
- **No-self-approval for circulars is CLIENT-ENFORCED, not rules-enforced.**
  A moderator can publish their own draft circular by direct write; the
  guard lives in `canApproveCircular` in the client. The question bank
  DOES enforce second-eye in rules. The circular follow-up (rules-side
  no-self-approval) is queued for after the rules-size refactor.
- **Report/correction targets are NOT validated by rules.** A report can
  be filed against a draft circular (or a nonexistent target) — queue
  pollution only. The client must not surface drafts as reportable.
- **Answer keys are confidential only while the rules hold.** An
  authenticated user who legitimately obtains a key can inspect the
  client bundle and the data the rules already permit them to read.
  Rules cannot stop a determined user from reading what they are
  allowed to read.
- **Session expiration is limited without trusted server-side session
  management.** Firebase ID tokens are short-lived and refresh via
  refresh tokens; a React inactivity timer does not change refresh-token
  validity. Do not describe client-side inactivity logout as guaranteed
  server-enforced session expiration. Revocation (disable the account /
  revoke refresh tokens) is the real control and is an owner action.
- **Email verification is NOT enforced by rules today.** There is no
  `request.auth.token.email_verified == true` condition on Job writes.
  Whether unverified accounts may attempt exams / file reports is a
  product policy decision (owner), not a tested invariant.
- **CAPTCHA / App Check is NOT authorization.** It can reduce automated
  abuse of exposed forms, but it does not prove a user may publish a
  question or approve a circular, and it must not block legitimate
  low-bandwidth users.
- **Owner MFA depends on the auth provider, not on Firestore rules.**
  Enabling 2FA on the owner's Google account does not automatically add
  MFA enforcement to the app's email/password login. The owner account
  is the highest-privilege account in the platform — its protection is
  an owner action, not a rules change.
- **Quota monitoring is limited without additional infrastructure.**
  There is no server-side quota alerting on Spark. The control is
  operational: H3 read-budget discipline + scheduled manual checks of
  the Firebase Console usage views + the backup/export runbook.
- **The backup tool does NOT include subcollections**
  (`subcollectionsIncluded: false`). A JSON backup restores top-level
  collections only; user subcollections (quizAttempts, jobSessions,
  nuAttempts, nuSessions, bookmarks under users/…) are not in it.
  A backup that completes without a verified restore is not proven
  recovery (Step 18).

## Temporary rules-size policy (Step 17 — until the refactor lands)

The compiled rules are **264,875 bytes vs the 256,000 limit (over by
8,875)** in this branch. No additional production rules logic unless it
addresses a demonstrated critical vulnerability AND its compiled size has
been measured with the release-create probe first. No speculative
validation, no duplicated ownership checks, no complex hostname parsing
inside rules, no attempt to solve score recomputation with more rules.
The public-ID refactor (23 Nov 14:30 cron) frees ~4,992 bytes; the Step 17
fixes need ~3,883 more beyond that — see
`team/job-step17-security-testing-2026-11-23.md` for the exact projection.
After the refactor, establish a documented rules-size budget with a
deliberate safety margin.

## Standing rule (from the ChatGPT consultation, adopted)

Never weaken a proven security invariant merely to make a new feature
easier to implement.
