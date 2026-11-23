# Step 20 Phase 1 — ChatGPT consultation (release readiness, v0.1.0)

**Date:** 23 Nov 2026 ~19:13 +06 (13:13 UTC) · **Branch:** `jobs/step20-release`
**Conversation:** https://chatgpt.com/c/6b043bcc-cfa4-83ea-aee9-cc3396c979f1

## How this consultation happened — read first

- The Step 20 Phase 1 plan left gate 1.10 (ChatGPT consultation) open for the parent
  because subagents have no live-browser access, and ChatGPT's guest route now requires
  sign-in. The question sat drafted in a browser tab for the owner.
- **The owner signed in to ChatGPT himself** with Google as bindoora23@gmail.com
  (Free plan), and the browser then sent the drafted question **unchanged**.
- **About this file:** ChatGPT's complete answer as received in the parent's browser
  session, transcribed in full below. Nothing is added or paraphrased away.
- The fold-in is in `team/step20-gemini-fold-in-2026-11-23.md` (USED / ADAPTED /
  REJECTED per point, with Phase 1 evidence). Note: the fold-in file keeps its
  original name from the Gemini-only task but covers **both** consultations.

## The question (as drafted, sent unchanged)

Step 20 Phase 1 release-readiness for Eduvelto v0.1.0: is the release ready to ship,
what gaps remain, should the service worker be registered for v0.1.0, and what must
the Bangla release notes say honestly.

## ChatGPT's answer (complete)

### Verdict: Conditional GO

Proceed with v0.1.0, but treat the service worker and production configuration as
explicit release decisions. Do NOT block the release solely on offline support.

### Release readiness

All gates are strong. Before merging, ChatGPT recommends these final checks:

- **Production Firebase configuration** — verify project IDs, authorized domains,
  API keys, rules, and deployment targets.
- **Admin initialization** — publish appVersion "0.1.0" through the admin page
  immediately after deployment, and verify the version gate works with both older
  and current versions.
- **Security** — confirm no admin-only operations are accessible to unauthenticated
  users or ordinary students.
- **Indexes** — confirm all production Firestore query indexes are deployed.
- **AdSense** — verify the production domain and actual ad delivery, not just CSP
  console behavior.
- **Rollback** — have a documented rollback procedure for frontend and Firestore
  rules.
- **Smoke test** — test registration, login, student navigation, teacher publishing,
  exam availability and MCQ submission using real production accounts.
- **Release exposure** — verify that publishing appVersion cannot accidentally expose
  an incomplete release to users.

### Service worker: DEFER

Ship v0.1.0 without registering it (agrees with Gemini). The biggest risk of
registering now is **stale educational content**: a student loads an older version,
a new release changes exam functionality, the browser serves cached JS/assets, and
the student gets inconsistent behavior.

Create a separate **v0.2.0 milestone** for offline. Before implementing, define:

- which pages work offline;
- whether published exams can be accessed offline;
- whether exam answers can be saved locally;
- how answers sync after reconnection;
- how old caches are invalidated;
- how users are notified of new versions.

Do NOT enable offline exam submission until answer persistence, synchronization,
duplicate submission prevention and conflict handling are thoroughly tested.

Keep `dist/sw.js` unused for now, provided the release documentation clearly states
offline support is unavailable.

### Release notes — be transparent about three things

- **(A) Offline:** "Offline support is not currently enabled. An active internet
  connection is required to use Eduvelto."
- **(B) Exam availability:** "Exams currently support multiple-choice questions
  (MCQ) only. The question bank is initially empty. Teachers must publish an exam
  before students can access it."
- **(C) Performance:** "Performance optimization is ongoing. Some pages may take
  longer to load, particularly on slower devices or network connections." Do NOT
  advertise the 3–28 score.

Suggested structure: What's new; Available features; Student and teacher
functionality; Exam limitations (MCQ only); Offline limitations; Known issues and
performance considerations; Future improvements.

### Bottom line

Don't delay the first release for offline. Test coverage is strong. Be honest about
limitations, validate production config, monitor the initial deployment, and release.
The one issue to prioritize after launch is Lighthouse performance (3–28),
especially for low-end Android devices and slower mobile connections in Bangladesh.

## Status

Folded into Phase 1 in `team/step20-gemini-fold-in-2026-11-23.md`. The service-worker
deferral is the recorded decision for Phase 1's open R9 (fix-or-defer), agreed by
both AIs. The release-notes points were merged into
`team/release-notes-v0.1.0-draft-2026-11-23.md` (merged with Gemini's overlapping
wording into single clear lines, not duplicated).
