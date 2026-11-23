# Step 20 Phase 1 — Gemini consultation (release readiness, v0.1.0)

**Date:** 23 Nov 2026 ~19:11 +06 (13:11 UTC) · **Branch:** `jobs/step20-release`
**Conversation:** https://gemini.google.com/app/9f028172a31800e4

## How this consultation happened — read first

- The Step 20 Phase 1 plan left gate 1.10 (ChatGPT consultation) open for the parent
  because subagents have no live-browser access, and ChatGPT's guest route now requires
  sign-in. The question sat drafted in a browser tab for the owner. **Gemini answered
  instead**, in the parent's browser session.
- **Session caveat (honest):** the browser profile already showed a signed-in Google
  account in Gemini's sidebar — this was **not a clean guest session**. No sign-in step
  was performed by the parent in this run, but the account was already signed in
  (earlier Gemini sessions the same day ran as bindoora23@gmail.com). Nothing about the
  account or its contents was shared with Gemini beyond the question itself.
- **About this file:** Gemini's answer was received in the parent's browser and forwarded
  to this fold-in run as a **recorded substance summary** (the three points below, as
  logged in `~/memory/2026-11-23.md` 19:11). The full verbatim transcript was **not**
  saved to disk, so this file is a faithful record of the answer's content, **not a
  word-for-word transcript**. Nothing below is invented or expanded beyond what was
  received. The fold-in (`team/step20-gemini-fold-in-2026-11-23.md`) judges each point
  against Phase 1 evidence.

## The question (as drafted for ChatGPT, put to Gemini instead)

Step 20 Phase 1 release-readiness for Eduvelto v0.1.0: is the release ready to ship,
what gaps remain, should the service worker be registered for v0.1.0, and what must
the Bangla release notes say honestly.

## Gemini's answer (recorded substance)

### 1. Release-readiness gaps

Before merging/deploying, Gemini flagged these checks:

- **Spark quota guardrails** — make sure the free-tier quotas cannot silently stop
  the site (reads / writes / egress / hosting transfer).
- **Deployed indexes** — confirm the indexes in `firestore.indexes.json` are actually
  deployed to production, not just present in the repo.
- **`config/appVersion` publish-flow smoke test** — publish the first version through
  the admin flow right after deploy and verify the version gate works.
- **Lighthouse performance 3–28** — the measured mobile performance scores are poor;
  Gemini named Bangla font loading and bundle weight, and lazy-loading, as the levers.
- **Auth / teacher-publishing / AdSense live verification** — verify these on the live
  site, not only in tests or staging.
- **Git / deploy hygiene** — `dist/` not committed, no `.env` in the repo, and a
  rollback plan in place.

### 2. Service worker: DEFER for v0.1.0

- **Ship v0.1.0 WITHOUT registering `sw.js`.** Schedule offline support as a
  v0.1.1 / v0.2.0 item.
- **Risks of shipping without offline (accepted, to be stated):** unreliable mobile
  connections in Bangladesh, higher data usage and slower repeat visits, higher
  Firestore read pressure (every visit re-reads).
- **Rationale for deferring:** an untested service worker could cause stale-cache
  bugs — especially with the CSP/AdSense setup and the version gate in play. A
  wrongly-cached release is worse than no offline support.

### 3. Release notes — what to state

- State that **offline is not available** in v0.1.0 and is **planned for a future
  release**.
- State that the **question bank is empty by design** until teachers publish — and
  that exams are **MCQ only**.
- **Clarify the update-gate activation:** the gate activates once the admin publishes
  v0.1.0 (it is not active before that first publish).
- Add a **known-limitation note on slow mobile load performance**.

## Status

Folded into Phase 1 in `team/step20-gemini-fold-in-2026-11-23.md` (USED / ADAPTED /
REJECTED per point, with Phase 1 evidence). The service-worker deferral is the
recorded decision for Phase 1's open R9 (fix-or-defer). The release-notes points
were applied to `team/release-notes-v0.1.0-draft-2026-11-23.md`.
