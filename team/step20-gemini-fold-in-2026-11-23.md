# Step 20 Phase 1 — Gemini + ChatGPT fold-in (release readiness, v0.1.0)

**Date:** 23 Nov 2026 ~19:13 +06 · **Branch:** `jobs/step20-release`
**Inputs:**
- Gemini: `team/step20-gemini-consultation-2026-11-23.md`
  (https://gemini.google.com/app/9f028172a31800e4 — signed-in-sidebar session, not a
  clean guest session; answer saved as a recorded substance summary, not a verbatim
  transcript — see that file's provenance note)
- ChatGPT: `team/step20-chatgpt-consultation-2026-11-23.md`
  (https://chatgpt.com/c/6b043bcc-cfa4-83ea-aee9-cc3396c979f1 — owner signed in
  himself as bindoora23, Free plan; drafted question sent unchanged; complete answer
  transcribed in full)

**Method:** repo facts win. Every point below is judged against what Phase 1
already verified (gates 1.1–1.10 in `team/job-step20-phase1-report-2026-11-23.md`,
rules 1196/1196, unit 791/791, preview 49/49 routes 200, Lighthouse gate 1.9).
Verdicts: **USED** (adopted as stated), **ADAPTED** (adopted with a change, or
already covered in a different form), **REJECTED** (not adopted, with the reason).
Nothing is claimed that was not verified. This file keeps the name from the
Gemini-only task but covers **both** consultations.

**Tally:** 21 points judged — **USED 15, ADAPTED 6, REJECTED 0.**

## Consensus — both AIs agree (recorded explicitly)

1. **DEFER the service worker; ship v0.1.0 without registering it.** Gemini: defer
   to v0.1.1/v0.2.0. ChatGPT: defer, separate v0.2.0 milestone. This **decides**
   Phase 1's open R9 (fix-or-defer): **DEFER**. `dist/sw.js` stays built but unused.

   **OWNER OVERRIDE 23 Nov 19:34 — offline CANCELLED ('offline dite hobe na', 'sob online'): no offline support at all; everything online-only. The v0.2.0 offline milestone is cancelled, not deferred. Do NOT register the service worker.**
2. **Conditional GO / proceed** — do not block the release solely on offline support.
   Phase 1's own conclusion agrees (nothing failed; Phase 2/3 proceed subject to the
   owner's approvals).
3. **Be honest in the release notes** about offline, the empty question bank, and
   mobile-load performance.
4. **The appVersion publish + gate check is a Phase 4 owner step** (publish after
   deploy, verify the gate) — not a Phase 1 item.
5. **Lighthouse performance (3–28) is the top post-launch priority**, especially for
   low-end Android devices and slower mobile connections in Bangladesh.

## Gemini — verdicts

| # | Point | Verdict | Judgement (evidence) |
|---|---|---|---|
| G1 | Spark quota guardrails | **ADAPTED** | The hosting audit (23 Nov ~09:10) already established the binding quota is Firestore egress (~150 MAU scenario B / ~610 MAU scenario C), not Hosting transfer — and that no budget alerts exist. On Spark free there is no billing account, so Cloud budget alerts **cannot** be set; that needs Blaze + a payment method, and the owner has no card (expired Jun 2026). So the guardrail as imagined cannot be built on Spark. Adopted as a documented owner decision instead: Blaze + budget alert before ~100 MAU (hosting audit §3.2). Not a v0.1.0 blocker. |
| G2 | Deployed indexes (`firestore.indexes.json`) | **USED — verified in this run** | **Verified by direct comparison in this fold-in run:** `firebase firestore:indexes --project eduvelto` returns 29 live indexes; the local file has 29; the two sets are **identical** (same collection groups, fields, order — set difference empty both ways). The point is closed for v0.1.0: the indexes ARE deployed. (Note: the hosting audit counted 19 at ~09:10; the file has since grown to 29 — the live list matches the current file, so there is no drift.) |
| G3 | `config/appVersion` publish-flow smoke test + publish right after deploy | **USED** | Already the plan: scoping note Phase 4 (§4.1–4.2) — owner publishes latest = min = 0.1.0 at `/admin/app-version`, agent verifies the gate reads `current`. The gate logic itself is already unit-tested (`checkAppVersion`: blocks when bundled < minVersion, update-available, current) and emulator-tested (g1/g2) inside the 791/1196 suites. The live smoke test can only happen at Phase 4, with the owner publishing — it stays owner-gated. |
| G4 | Lighthouse perf 3–28 (Bangla font / bundle weight, lazy-load) | **USED** (as a recorded limitation) | Phase 1 gate 1.9 already measured it (perf 3–28, CLS 0.57–0.80, LCP 3.1–14.2 s; `team/step20-lighthouse-2026-11-23.md`). No numeric target exists in the scoping note, so no pass/fail was claimed. Lazy-load / font work is NOT in Step 20 scope — it is a roadmap item, and (with ChatGPT C13) the top post-launch priority. The release notes now carry the honest mobile-load limitation line (no score advertised). |
| G5 | Auth / teacher-publishing / AdSense live verification | **ADAPTED** | Auth: covered by the rules suite 1196/1196 (role-escalation verdict re-verified 23 Nov — a student cannot self-assign Admin/Moderator/verified Teacher). Teacher publishing: **cannot** be verified live — no verified teacher exists and the bank is empty by design; stays owed (owner one-liners). AdSense: master flag OFF, no ad renders; F6 CSP fixed in the branch (`a67591e`), 0 console errors on preview; actual ad delivery can only be verified after Google's review completes and the flag is turned on — a post-launch item, not a v0.1.0 gate. Signed-in flows overall remain OWED (needs owner login), as the Phase 1 report already records. |
| G6 | Git / deploy hygiene (dist not committed, .env, rollback plan) | **USED — verified** | Verified in this run: `.gitignore` excludes `dist/`, `.env` / `.env.*`, service-account keys and backup files; no `.env` file exists in the worktree. Rollback is documented in the scoping note §3.6 (`firebase hosting:rollback` to the previous release, or republish the previous rules version from the console version list; verify the live site after any rollback). No action needed. |
| G7 | Service worker: DEFER for v0.1.0, schedule v0.1.1/v0.2.0 | **USED — DECISION** | This decides R9. Ship v0.1.0 without registering `sw.js`; `dist/sw.js` stays unused. Rationale accepted: an untested SW could cause stale-cache bugs, especially with CSP/AdSense + version gating. The accepted risks of no offline (unreliable BD mobile connections, higher data usage / slower repeat visits, higher Firestore read pressure) are stated in the release notes. |
| G8 | Release-notes §3 (offline future, empty bank by design, gate activation, mobile-load note) | **USED** | Applied to `team/release-notes-v0.1.0-draft-2026-11-23.md` — see "Release-notes changes" below. (Empty-bank and MCQ-only lines were already in the draft; no duplication added.) |

## ChatGPT — verdicts

| # | Point | Verdict | Judgement (evidence) |
|---|---|---|---|
| C1 | Verdict: Conditional GO | **USED** | Agrees with Phase 1's own conclusion. The conditions (SW + production config as explicit decisions) are recorded in this file. |
| C2 | Production Firebase config final checks (project IDs, authorized domains, API keys, rules, deployment targets) | **ADAPTED** | Mostly verified: rules 1196/1196 on the branch; deploy target is project `eduvelto` (781355434811), used all day; API keys are the public-by-design Firebase web config (no secret). **Authorized domains were NOT re-verified in Phase 1** — added as a Phase 3 pre-deploy check (console read-only: eduvelto.com + eduvelto.web.app + preview domains authorized). Not a Phase 1 failure. |
| C3 | Admin initialization — publish appVersion 0.1.0 right after deploy; verify gate with older and current versions | **USED** | Same as G3: already Phase 4 (§4.1–4.2); gate covered by unit + emulator tests (g1 minVersion above bundled → blocked; g2 latest newer but min met → update-available). |
| C4 | Security — no admin-only ops accessible to unauthenticated users or ordinary students | **USED** | Covered by the rules suite 1196/1196 (admin-only operations denied to guests/students; role-escalation verdict re-verified 23 Nov). No new check needed. |
| C5 | Confirm all production Firestore query indexes deployed | **USED — verified in this run** | Same verification as G2: live 29/29 identical to the local file (set difference empty both ways). Closed for v0.1.0. |
| C6 | AdSense — verify production domain + actual ad delivery, not just CSP console behavior | **ADAPTED** | Same as the AdSense part of G5: actual delivery is unverifiable until Google's review completes and the flag is turned on. Post-launch item. The CSP side (F6) is fixed in the branch and console-clean on preview. |
| C7 | Documented rollback procedure for frontend and Firestore rules | **USED** | Exists in the scoping note §3.6 (hosting rollback; republish the previous rules version from the console; verify live after). Recorded here as the standing procedure; no new document needed. Phase 3 runbook detail (not invented as done): name the current live ruleset id when rolling back. |
| C8 | Smoke test registration, login, student navigation, teacher publishing, exam availability, MCQ submission with real production accounts | **ADAPTED** | Agrees with Phase 1's owed signed-in flows — but it **cannot** be done in staging (needs owner login + real accounts + published content that does not exist yet: no published mock, empty bank). Stays owed for Phase 3/4 with real accounts. Not a Phase 1 gap. |
| C9 | Verify publishing appVersion cannot accidentally expose an incomplete release | **USED** | Already in the plan: minVersion must never exceed the live bundled version (0.1.0); Phase 4 values are latest = min = 0.1.0; the gate fails open with no doc (by design); escape hatches (`/install`, `/login`, `/admin/*`) are never blocked. The guard is the Phase 4 values themselves plus the agent's verification step (§4.2). |
| C10 | Service worker: DEFER; v0.2.0 milestone; pre-implementation questions; no offline exam submission until persistence/sync/duplicate-prevention/conflict handling tested | **USED — DECISION** | Consensus with Gemini (see above). ChatGPT's extra rationale — stale educational content (cached JS/assets serving inconsistent behavior across a release) — strengthens the defer. The v0.2.0 milestone and its six pre-implementation questions are recorded here as the future scope. The "no offline exam submission until…" rule is recorded as a **hard constraint** for that milestone. |
| C11 | Release-notes transparency: (A) offline, (B) MCQ-only + empty bank + teachers publish, (C) performance — do NOT advertise the 3–28 score | **USED** | Merged into the draft (see "Release-notes changes"). The score is **not** in the release notes. |
| C12 | Suggested 7-section release-notes structure | **ADAPTED** | Not adopted verbatim. The draft keeps its two-section Bangla form (এই ভার্সনে যা আছে / যা নেই), which already carries the same substance; the structure suggestion is stylistic and the content is what matters. |
| C13 | Bottom line — don't delay for offline; prioritize Lighthouse perf after launch | **USED** | Agrees with Phase 1's disposition (perf = roadmap item, not a gate) and with the release-notes limitation line. |

## Decisions recorded by this fold-in

1. **Service worker: DEFERRED for v0.1.0** (both AIs agree). Ship without registering
   `sw.js`; offline support is a v0.2.0 milestone (Gemini's range: v0.1.1/v0.2.0).
   `dist/sw.js` stays built but unused. This closes Phase 1's R9 fix-or-defer
   question. Future scope must first answer ChatGPT's six questions (which pages
   offline; exams offline; local answer saving; sync after reconnection; cache
   invalidation; version notices), and offline exam submission is forbidden until
   persistence, sync, duplicate-prevention and conflict handling are thoroughly
   tested.
2. **Production indexes: VERIFIED DEPLOYED** (live 29/29 identical to the local
   file — verified in this run, 23 Nov ~19:13 +06).
3. **Quota guardrails: NOT settable on Spark** (no billing account; needs Blaze +
   a payment method the owner does not have). Owner decision: Blaze + budget alert
   before ~100 MAU. Not a v0.1.0 blocker.
4. **Phase 1 gate 1.10 is now CLOSED** by this fold-in (both consultations in).
   The Phase 1 report itself is **not** amended — it was true when written (the
   slot was open at that time); this file is the record that closes it.
5. **Phase 3 pre-deploy checklist gains one item** (from C2): re-verify authorized
   domains in the Firebase console (read-only) before deploying.

## Release-notes changes (applied in this run)

Applied to `team/release-notes-v0.1.0-draft-2026-11-23.md` — the two consultations'
overlapping wording merged into single clear lines, **not duplicated**:

1. **Offline line** ("যা নেই" section): was "অফলাইনে ব্যবহার এখনো চালু হয়নি —
   ইন্টারনেট ছাড়া অ্যাপ খুলবে না।" → now adds "অফলাইন সুবিধা ভবিষ্যৎ ভার্সনে
   আসবে।" (Gemini §3 + ChatGPT A: not available + planned for a future release;
   active connection required — already stated.)
2. **Update-gate paragraph** ("এই ভার্সনে যা আছে"): sharpened to name the
   activation — the gate activates once the admin publishes the first version
   (0.1.0); until then no block or notice appears. (Gemini §3 + ChatGPT C3/C9.)
3. **Performance limitation line added** to "যা নেই": "ধীরগতির মোবাইল বা
   ইন্টারনেটে কিছু পাতা খুলতে বেশি সময় লাগতে পারে — পারফরম্যান্স উন্নয়নের কাজ
   চলছে।" (Gemini §3 + ChatGPT C; the 3–28 score is **not** advertised, per
   ChatGPT.)
4. **No change needed** (already in the draft, recorded here so it is not
   duplicated): empty question bank by design ("প্রশ্নব্যাংক এখনো খালি —
   ইচ্ছাকৃতভাবে। … ০টি প্রশ্ন, ০ জন যাচাইকৃত শিক্ষক") and MCQ-only
   ("সব পরীক্ষা MCQ — কোনো লিখিত পরীক্ষা নেই।"), including the teacher-publishes-
   first wording ("প্রশ্ন প্রকাশিত হবে তখনই, যখন যাচাইকৃত শিক্ষক লিখবেন এবং
   দ্বিতীয় একজন যাচাই করবেন।").

## What this fold-in does NOT change

- Phase 1 gate results stand: rules 1196/1196, unit 791/791, build PASS, preview
  49/49 routes 200, Lighthouse perf 3–28 recorded as a roadmap item.
- Still owed after Phase 1 (unchanged): signed-in rendered checks, F7 browser
  click-through, R10 Bangla offline message (depends on the deferred SW work),
  WebKit, `apis.google.com` console-error re-check live after deploy,
  `job-program-status.md` update, owner-gated items (first-version publish,
  deploy approval "koro", real-device check, 2FA decision, teacher one-liners,
  AQ-7 threshold, live export for snapshot).
- No deploy, no merge, no tag, no version bump, $0 spent in this run.
