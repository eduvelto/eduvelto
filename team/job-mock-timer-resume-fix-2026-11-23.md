# Job mock timer-resume fix (F7) + F8 + F6 — 23 Nov 2026

**Branch:** `fix/job-mock-timer-resume` · **Base:** main `1918766` · **Worktree:** `~/workspace/eduorbit/phase2-project-step19-f7/`
**Status: CLOSED IN STAGING.** Staging only — no live changes, no deploy, no merge. $0 spent.
**Deploys with the post-cron batch** (see §7) — after rebase + re-probe.

## 1. The bug (F7, MAJOR — found by Step 19 code review, not a live run)

`src/pages/JobMockPage.tsx:171` — `enterExam` measured the client↔server clock offset as
`offset = startedAt − Date.now()` on **both** fresh start and resume. On resume, `startedAt`
is the stored **original** start time read back from the session doc, so the offset became
−(elapsed time) and the displayed remaining time became the **full duration again**:

- 60-min mock, refresh at 20 min → displayed **60 min**, true remaining **40 min**.
- The stored deadline (`endsAt`) was always restored correctly — only the displayed countdown
  was wrong, which also made auto-submit fire late (and the late submit was then denied by
  the rules, so the student lost the attempt).

Related gap: the session `in_progress` → `submitted` transition was **not deadline-checked** —
a late client could flip the session to `submitted` while the attempt create was denied by
M1-b, leaving an orphan submitted session with no attempt.

## 2. The fix

### 2a. Client — deadline-based resume (Worker A)

New pure helper module `src/lib/mockTimer.ts` (no Firestore, no React, no `Date.now()` inside):

| Function | Contract |
|---|---|
| `resolveExamClockOffsetMillis({ startedAtMillis, nowMillis, isResume })` | `0` when `isResume` is true; `startedAtMillis − nowMillis` when false |
| `computeRemainingMillis(deadlineMillis \| null, nowMillis, offsetMillis)` | `deadlineMillis − (nowMillis + offsetMillis)`, or `null` when deadline is null |

`enterExam` gained an `isResume` param: `doStart` passes `false`, `doResume` passes `true`.
`setStartedAtMillis(serverStarted)` is unchanged (the result page uses the stored start for
time-taken). `remaining` is computed via `computeRemainingMillis`; the `doSubmit` catch path
uses the same helper for `remainingNow`.

Also in this slice:
- `submittingRef` in-flight guard in `doSubmit` (early-return if already submitting; set
  `true` before the call; reset to `false` first thing in `catch` so auto-submit can retry).
  Lib-level idempotency untouched.
- `visibilitychange`/`focus` handler (~19 lines) forces an immediate `setNow(Date.now())`
  tick on return-from-background, so a throttled/suspended tab catches up at once instead of
  waiting for the next `setInterval` tick.
- Worked example: 60-min mock, refresh at 20 min → offset 0 → remaining **40 min** (was 60).

### 2b. Rules — deadline-checked submit transition (Worker B)

In `validJobExamSessionUpdate` (`firestore.rules` ~L1449), the answers clause changed from:

```
&& (d.get('answers', {}) == old.get('answers', {})
    || old.get('endsAt', null) == null
    || request.time < old.get('endsAt', null))
```

to:

```
&& ((d.get('status', '') != 'submitted' && d.get('answers', {}) == old.get('answers', {}))
    || old.get('endsAt', null) == null
    || request.time < old.get('endsAt', null))
```

One added condition, folded into the existing answers clause (no new top-level condition —
that is what kept it to **+40 stripped bytes**). A comment block above
`jobExamEndsAtIsExact` documents the gate, the boundary, the no-grace decision, and the
residual below.

**New behaviour:**
- `in_progress` → `submitted` is allowed **only while `request.time <` the stored `endsAt`**
  (strict `<`). The orphan-submitted-session gap is closed for every session whose deadline
  was stored.
- **Abandon after the deadline still works** (status `abandoned`, no answer changes → first
  disjunct true, no deadline check). **Autosave still works** exactly as before (answer
  changes gated by the deadline as before; no-change autosaves pass at any time).
  **endsAt-setting update still works** (status stays `in-progress`, answers unchanged).
- **On-time submit is unaffected:** the batch (session flip + lock → terminal + attempt
  create) still passes when `request.time < endsAt`; M1-b (`submittedAt <= sessAfter.endsAt`)
  also passes.
- **Orphan recovery is unaffected:** session already submitted + attempt missing → attempt
  create alone, still governed only by M1-b (unchanged).
- **No lock-out risk from a denied late submit:** the denied batch leaves the lock
  `in_progress`, but `jobExamUserLockIsReleasable` releases it 15 min after the deadline
  (`createdAt + duration + 900s`), and abandon still releases it immediately.
- **Boundary decision (one decision, applied everywhere):** strict `< endsAt` for the
  session transition, matching the answer-write gate in the same function. M1-b uses `<=`
  on the attempt's server timestamp — a different quantity; in the batched submit the
  session gate binds first, so the effective boundary for the whole submit is strict `<`.
  The NU system's `request.time <= deadlineAt` differs (different system, client-set
  bounded deadline) and was deliberately NOT aligned — out of scope, would cost bytes and
  change NU behaviour.

**Documented residual:** a submit with `endsAt` still unset is still allowed at the session
(second disjunct). The attempt create then denies it via M1-b, so **no late attempt can
ever be created** — the residual is only orphan-session UX in the never-stored-deadline
path (the `ensureMockDeadline` write would have to fail persistently through entry +
autosave retries). Closing it would have cost ~+110 stripped bytes and blown the size
budget.

**Size gate (measured first, before editing):**

| State | Stripped bytes | Compiled probe |
|---|---|---|
| Baseline main `1918766` | 173,071 | PASS (under 256,000) |
| + rules change | **173,111 (+40)** | **PASS** — release-create succeeded, probe release + ruleset deleted (HTTP 200) |

Probe: `~/workspace/eduorbit/step17-rules-size-probe.mjs` (throwaway release
`step17-size-probe`; live `cloud.firestore` never touched). **Only ~20 compiled bytes of
margin are estimated to remain — the next rules change will almost certainly NOT fit
without a size-saving refactor first.**

### 2c. F8 — ad-placeholder strip white in dark mode (Worker B) — FIXED

Root cause (from the Step 19 screenshots): the white strip is NOT the `.ev-ad` CSS
placeholder (that already had a dark override at `index.css:3666`). It is the **AdSlot
preview placeholder** — `placeholderStyle()` in `src/components/AdSlot.tsx` uses inline
styles with hard-coded light values (`linear-gradient(135deg, #fdf9ef, #eff7f6)`, `#c9cfcb`
border, `#68747b` text). Inline styles beat the CSS override. On live AdSlot renders
nothing (`getAdRenderState` → `'none'`), so this only ever showed on preview hosts — but
preview is where verification happens.

Fix (`src/index.css`, dark-mode overrides block, next to the `.ev-ad` rule — CSS-only, no
TSX change):

```css
html[data-theme="dark"] [data-ad-preview="placeholder"] {
  background: linear-gradient(135deg, #1c2a20, #12292b) !important;
  border-color: var(--line-strong) !important;
  color: var(--muted) !important;
}
```

Scoped to `[data-ad-preview="placeholder"]` so it can never touch a real ad (real units
carry no such attribute); `!important` is required because only `!important` beats an
inline style. Values mirror the existing `.ev-ad` dark gradient. Verified in built CSS
(`dist/assets/index-Tvc75Lai.css` contains the exact minified rule).

### 2d. F6 — AdSense CSP console error (Worker B) — CAUSE FOUND + FIXED

**Cause (exact):** the AdSense verification script loaded on every page (`index.html`:
`pagead2.googlesyndication.com/...adsbygoogle.js`, owner-approved 22 Nov) fetches its
config from **`https://ep1.adtrafficquality.google/getconfig/sodar?...`** (Google's Ad
Traffic Quality endpoint). The live CSP's `connect-src` — verified from real response
headers on `https://eduvelto.com/` — is `'self' https://*.googleapis.com
https://*.firebaseapp.com https://*.gstatic.com https://pagead2.googlesyndication.com
https://*.googlesyndication.com`. `ep1.adtrafficquality.google` matches none of those
(`*.googleapis.com` ≠ `adtrafficquality.google`; `*.googlesyndication.com` ≠ it either),
so the fetch is CSP-blocked on every page. No CSP `<meta>` exists in `index.html`/src —
`firebase.json` headers are the only CSP source.

**Fix** (`firebase.json`, one line): added `https://*.adtrafficquality.google` to
`connect-src`. Clear-cut and low-risk: it only widens (nothing currently allowed becomes
blocked), the host is Google-owned and used by the AdSense script the site already loads,
and it unblocks the verification config fetch while the site is in AdSense review. JSON
validated after edit.

**Follow-up (not done):** `https://googleads.g.doubleclick.net` is in `script-src` /
`img-src` / `frame-src` but NOT in `connect-src`. No violation for it has been observed
yet (ads are not live — master switch OFF, no units rendered), so it was left out
deliberately; add it when real ads activate if the console shows a `doubleclick.net`
connect violation.

## 3. Tests — before / after (Worker C)

New files: `src/lib/__tests__/mockTimer.test.ts` (15 unit tests),
`emulator-tests/rules-job-mock-timer-resume.test.ts` (17 emulator tests, 60-min BCS mock
fixture, all 11 of B's cases covered). Modified (test file only):
`emulator-tests/rules-step9-full-exam.test.ts` — **e18 expectation flipped** (see below).
Logs: `~/workspace/eduorbit/step19/f7-emulator-run2.log`,
`f7-rules-full-run1.log`, `f7-rules-full-run2.log`.

**Before/after evidence (F7 regression):**
- **BEFORE:** a scratch test with the OLD formula (`startedAt − now` on resume) against the
  same 40-min expectation **FAILED**: `expected 3600000 to be 2400000` — displayed 60 min,
  true 40. (Scratch file deleted after the run; the regression tests also pin the old value
  in-test: `buggyRemaining === 60 min` asserted alongside the fixed `40 min`.)
- **AFTER:** new unit tests 15/15 pass; emulator resume tests pass with remaining in
  (39, 40] min at 20-min refresh and (14, 15] min at 45-min refresh, buggy math exactly
  60 min in both.

**Final suite results (run after A and B reported):**

| Gate | Result |
|---|---|
| `npm run build` | **PASS** — `tsc -b` + vite, 70 modules, PWA precache 136 entries (1944.32 KiB). Coordinator re-ran it independently: PASS. |
| `npm run test:unit` (full) | **29 files, 681/681 PASS** (666 at Step 19 + 15 new). Coordinator re-ran it independently: 681/681 PASS. |
| `npm run test:rules` run 1 | 1060/1061 — 1 failure, **not a flake**: pre-existing e18 in `rules-step9-full-exam.test.ts` asserted the OLD behaviour ("timeout submit after deadline with unchanged answers SUCCEEDS"), which B's rules change deliberately removed. B never saw this — B had no Java on PATH and could not run the emulator. |
| e18 fix + isolated re-run | Flipped e18 to `assertFails` + read-back that the session stays `in-progress`; isolated `rules-step9-full-exam.test.ts` run **exit 0**. |
| `npm run test:rules` run 2 | **30 files, 1061/1061 PASS, exit 0** (1044 at Step 19 + 17 new). New file 17/17 in the full run. No parallel-load flakes in either run. |

Coordinator verification: diffs read on disk (rules clause + comment, `firebase.json`
one-liner, F8 CSS, `JobMockPage.tsx` 68 lines, new `mockTimer.ts` header/API); stripped
rules re-measured by the coordinator: **173,111 bytes** (matches B); build + full unit
suite re-run by the coordinator (PASS / 681/681). The full rules suite was run by Worker
C (run 2, exit 0) after all A+B changes had landed and no file has changed since.

**B's 11 cases — all asserted in the new emulator file** (60-min mock, started 10:00,
`endsAt` 11:00):

1. Submit 10:59 → session + attempt ALLOWED (f7-e2).
2–3. Submit after deadline (incl. exact-boundary note) → session DENIED, attempt DENIED,
no orphan, session stays `in-progress` (f7-e3; exact `request.time == endsAt`
millisecond equality is **not hittable in the emulator** — boundary-by-code + B's report).
4. Autosave answer-change before ALLOWED / after DENIED, stored answers unchanged (f7-e4).
5. Autosave no-answer-change after deadline ALLOWED (f7-e5).
6. Abandon after deadline ALLOWED (f7-e6).
7. endsAt-setting null→exact ALLOWED (f7-e7a).
8. Orphan recovery → attempt create ALLOWED, M1-b only (f7-e8).
9. Submit with endsAt null → session flip ALLOWED (documented residual), attempt DENIED
by M1-b (f7-e9).
10. Double submit → exactly one session-submit winner, one attempt winner, one attempt
doc, both racers resolve to the same attempt (f7-e10, incl. full-flow race).
11. Clock games → future `submittedAt` forgery DENIED, future `startedAt` DENIED, honest
late submit DENIED (f7-e11).

**Test-hygiene lesson recorded in-file:** the lock rules never re-arm a LIVE
`in-progress` lock — tests that create sessions must abandon/submit earlier sessions
first (C's first isolated run failed 6 tests on this before `abandonSessionWithLock` /
`releaseLock` hygiene was added; the Step 9 integration test never hit it because it
always released the lock).

## 4. NEW FINDING — known gap, probe-verified (f7-e11c)

A **hand-crafted attempt create with a literal past `submittedAt`** (1 min before `endsAt`,
on a session submitted on time, after the deadline passed) **SUCCEEDS** — M1-b checks
`submittedAt <= endsAt` and `<= request.time`, and a backdated literal satisfies both;
nothing binds the attempt's `submittedAt` to the session's server `submittedAt`. The
honest path (serverTimestamp) is DENIED as expected. The real app flow cannot exploit
this (`buildJobAttemptDoc` always uses `serverTimestamp()`), and a late session can no
longer become submitted via the client — so this needs a hand-crafted write against an
on-time-submitted session. It is asserted in the suite as **current behaviour** with a
KNOWN-GAP comment, so a future hardening (bind attempt `submittedAt` to the session's)
lands as a visible test change. **Follow-up (open):** bind attempt `submittedAt` to the
session's server `submittedAt` in M1-b. This makes ChatGPT checklist item 10 only
partially met (see §5).

## 5. AI fold-in — USED / ADAPTED / REJECTED

Consultations: Gemini — new chat, signed in as bindoora23@gmail.com,
https://gemini.google.com/app/5a079a733752676f ("Secure Exam App Timer & Submission
Pattern"). ChatGPT — new chat, no sign-in,
https://chatgpt.com/uc/6b038d8e-2d4c-83ea-a003-f2d8c1fdc136. Both answers were forwarded
to all three workers before they finished; each worker folded in its own slice (A =
client, B = rules/F8/F6, C = tests).

### 5a. Gemini

| # | Item | Disposition | Reason / evidence |
|---|---|---|---|
| G-A1 | Deadline-based resume: `remainingMs = max(0, deadlineAtMs − nowMs)`, offset 0 on resume, recompute from deadline every tick AND on resume | USED (A) | Core of the fix: `computeRemainingMillis` + `isResume` param. |
| G-A2 | `submittingRef` single-flight submit | USED (A) | In-flight guard in `doSubmit`. |
| G-A3 | `visibilitychange`/`focus` immediate catch-up | USED (A) | Handler added (~19 lines). |
| G-A4 | `clockSkewMs` heartbeat (server-timestamp write per resume) | REJECTED (A) | Extra write per resume + complexity, display-only benefit, rules already enforce. Weighed against the 20k/day write quota. |
| G-A5 | Scheduled Cloud Function auto-close fallback | REJECTED — unavailable (A, B) | Not available on Spark free. Recorded as documented limitation/follow-up; not built. |
| G-B1 | Rules cutoff `request.time <= deadlineAt` | ADAPTED (B) | Implemented as strict `request.time < endsAt` to match the existing answer-write gate in the same function; effective batched-submit boundary is strict `<` (session gate binds before M1-b's `<=`). |
| G-B2 | 5s grace window | REJECTED (B) | (1) Size — a grace term costs compiled bytes we don't have (~20 left). (2) Double-counts the client's existing 10s auto-submit latency budget. (3) Weakens the exact-deadline guarantee from the M1 audit. Recorded in the rules comment. |
| G-C1 | Mid-exam refresh (20 min → 40) | USED — RAN (C) | Unit (fake timers) + emulator resume test; old math pinned at 60. |
| G-C2 | Refresh at 45 min → 15 | USED — RAN (C) | Unit + emulator (f7-e1b). |
| G-C3 | Tab/lock catch-up | ADAPTED — math RAN, browser OWED (C) | Advancing `now` deducts elapsed time from the absolute deadline (unit); A's `visibilitychange`/`focus` handler is the browser half, but a real throttled/suspended tab is unprovable here. |
| G-C4 | Offline/reconnect | ADAPTED — rules half RAN, choreography OWED (C) | Late autosave/attempt denied + stored docs byte-unchanged after expiry (f7-e13); offline queue/reconnect itself not provable in the emulator. |
| G-C5 | Double-tap submit | USED — RAN (C) | Exactly one attempt (f7-e10); A's `submittingRef` adds a UI layer on top of the lib/rules idempotency already proven. |
| G-C6 | Clock change | ADAPTED — server half RAN, device OWED (C) | Server decides via `request.time`/serverTimestamp (f7-e11); real device-clock change OWED. Unit test proves the helper honestly follows the client clock (display-only, cannot enforce). |

### 5b. ChatGPT

| # | Item | Disposition | Reason / evidence |
|---|---|---|---|
| C-A1 | `deadlineAt` is the source of truth (not startedAt, not stored remainingSeconds, not the browser clock) | USED (A) | `computeRemainingMillis` derives from the stored deadline every call. |
| C-A2 | Resume: do NOT reconstruct the original clock offset | USED (A) | Offset 0 on resume — the bug itself. |
| C-A3 | Tick + mount recompute from deadline | USED (A) | Remaining recomputed per tick from the deadline. |
| C-A4 | Display `max(0)` / `ceil` to seconds | ADAPTED (A) | Helper API kept as raw ms per the brief; call-site `formatRemaining` already clamps `max(0)` and floors to seconds — ceil not adopted, shifts display ≤1s. |
| C-A5 | `submittedRef` guard | USED (A) | Kept ≤10s auto-submit + autoSubmittedRef; `submittingRef` added. |
| C-A6 | Continuous autosave (persist during exam, not only at submit) | ALREADY-MET (A) / ADAPTED (C) | Debounced 1200ms autosave + 2 retries at 5s already present; C verified it (autosave-before-deadline succeeds, f7-e4) rather than assuming it. |
| C-A7 | `setInterval` drift pitfall | ALREADY-MET (A) / ADAPTED (C) | Helper is pure/stateless — proven by the purity test; no interval to drift. |
| C-A8 | Storing remaining seconds | ALREADY-MET (A) / ADAPTED (C) | By construction — helper derives from the deadline every call. |
| C-A9 | `startedAt − Date.now()` | USED (A) | Removed — the bug. |
| C-A10 | Trusting `Date.now()` | ADAPTED (A) | Display trusts the client clock (offset 0 on resume); enforcement is server-side via rules (`request.time`). |
| C-A11 | Auto-submit only in React | UNAVAILABLE (A) | No Cloud Functions on Spark free; no backend expiry. Documented limitation. |
| C-A12 | Boundary consistency (`<` vs `<=`) | COORDINATED (A, B, C) | One decision: strict `< endsAt` for session writes; M1-b's `<=` differs by quantity, documented, session gate binds first. |
| C-A13 | `in_progress → finalizing → submitted` + result doc keyed by attemptId | REJECTED for now (A, B) | Needs schema + lib changes and rules bytes we don't have. Existing idempotency (attempt doc-ID = session ID, `allow update: false`, `revision + 1`) already guarantees one attempt; a `finalizing` state adds nothing enforceable without a backend. |
| C-B1 | Two responsibilities — client displays/triggers, server enforces; rules + trusted backend = actual enforcement | USED (B) | The rules change is exactly this: the deadline is now enforced server-side on the session transition, not only at attempt create. |
| C-B2 | Ideal rules model (client-supplied `deadlineAt`, client never updates status/submittedAt, backend finalizes) | ADAPTED (core) / REJECTED (status half) (B) | **Reality check:** the repo has NO `deadlineAt` field and the deadline is NOT client-supplied — `endsAt` is server-anchored (create requires `startedAt == request.time`, `endsAt == null`; set once to exactly `startedAt + duration` via `jobExamEndsAtIsExact`). Stronger than ChatGPT assumes. The `request.time < stored deadline` core is adopted in the minimal form fitting the existing flow; "client never flips status" is NOT adoptable without a backend finalizer that doesn't exist on Spark free. |
| C-B3 | Backend-created attempt / backend finalizes | REJECTED for now (B) | Not adoptable without a backend (Spark free). Client-created flow stays, rules are the enforcement boundary — same class as Step 17's score-correctness limit. Documented limitation. |
| C-B4 | Boundary examples (save 10:30 OK; submit 10:59 OK; submit 11:00:01 rejected; clock-back 11:05 still rejected; clock-forward 10:30 still rejected) | USED (B, C) | Adopted as test cases §3 (cases 1–4, 11). One consistent boundary: strict `< endsAt` for session writes; M1-b's `<=` differs by quantity, documented, session gate binds first. |
| C-B5 | Late manual submit (accept only before deadline) vs late auto-expiry (backend finalizes persisted answers) | USED as documentation (B) | Manual late submit now denied at the session. Auto-expiry/finalization does NOT exist — no backend; rules reject late writes only. Lock staleness (15 min past deadline) is the existing crash backstop, not a finalizer. |
| C-B6 | Rules cannot run auto-submit or schedule a write — a Cloud Function/trusted backend must handle expiry/finalization | USED (B) | Recorded honestly: rules reject late writes only; they cannot finalize or sweep. No scheduled sweep exists on Spark free. Same limitation as C-B3 / G-A5. |
| C-C1 | React unit + rules + integration three layers | USED (C) | Repo's `npm run test:rules` setup (default ports via `firebase emulators:exec --only firestore,auth`), not ChatGPT's port list. |
| C-C2 | Fake-timers regression test | USED (C) | `vi.useFakeTimers` + `advanceTimersByTime`. |
| C-C3 | Injectable-`nowMillis` helper shape | USED (C) | As contracted. |
| C-C4 | "Client status change fails" (ChatGPT's stricter model) | REJECTED as stated (C) | The repo HAS a client-driven submit transition; the assertion follows B's actual landed rule (deadline-checked submit), not ChatGPT's ideal model. |
| C-C5 | "Relying on beforeunload" | REJECTED as a test target (C) | No such handler is the design; nothing to test. |

**ChatGPT 15-item checklist — RAN vs OWED (Worker C):**

| # | Item | Status |
|---|---|---|
| 1 | Refresh 20 min → ~40 | RAN (unit + emulator) |
| 2 | Refresh 45 min → ~15 (not 60) | RAN (unit + emulator) |
| 3 | Tab switch 2 min → deducted | Math RAN; real tab OWED |
| 4 | Minimize 5 min → catch-up | Math RAN; real minimize OWED |
| 5 | Screen lock 5 min → deadline reflected | Math RAN; real device OWED |
| 6 | Disconnect 20 min, wait 5, reconnect → server rejects after deadline | Rules half RAN (f7-e4/e3); disconnect choreography OWED |
| 7 | Offline answer changes not falsely reported saved/submitted | OWED — no offline queue in emulator; page SaveState UI not emulator-provable |
| 8 | Double-tap → one finalization | RAN (f7-e10) |
| 9 | Submit after deadline → backend rejects | RAN (f7-e3 session + attempt; f7-e9 M1-b) |
| 10 | Clock back → server rejects late writes | **PARTIAL** — honest serverTimestamp path DENIED (RAN); hand-crafted backdated `submittedAt` SUCCEEDS (f7-e11c known gap, §4) |
| 11 | Clock forward → no extension/incorrect finalize | RAN (future `submittedAt`/`startedAt` forgeries DENIED; submit-before-deadline ALLOWED) |
| 12 | Change deadline from client → rules reject | RAN (longer/shorter/second-set/startedAt all DENIED; exact-set ALLOWED; re-setting the IDENTICAL endsAt value is an idempotent no-op the rules allow — recorded in-test) |
| 13 | Modify another student's attempt → rules reject | RAN (read/autosave/attempt-create all DENIED, f7-e12) |
| 14 | Auto-expiry while closed → backend finalizes | N/A — no Cloud Functions on Spark free; never claimed |
| 15 | Reconnect after expiry → queued writes must not extend/modify | Rules half RAN (f7-e13: denied + stored docs unchanged); queue choreography OWED |

**Facts that won over AI suggestions (per the brief):** (i) callable Cloud Function
submit + scheduled expiry sweep are NOT available on Spark free — rules-based enforcement
+ client auto-submit is what ships now; the backend-finalization gap is a documented
limitation (same class as Step 17's score-correctness limit). (ii) "Backend-created
attempt" conflicts with the actual repo flow — attempts are client-created; `endsAt` is
server-anchored, not client-supplied (stronger than ChatGPT assumes on create). (iii)
Boundary is ONE decision: strict `< endsAt` for session writes. (iv) `finalizing` state
+ attemptId-keyed result doc evaluated, not adopted (schema + rules bytes). (v) Emulator
`request.time` runs against the emulator/host clock — noted honestly wherever emulator
proof differs from production (§6).

## 6. Verified vs owed

**Verified (staging, emulator):** display-fix math (unit + emulator), stored-deadline
restoration on resume, all 11 rules cases, double-submit idempotency, cross-user
isolation, deadline immutability, no-orphan late submit, null-deadline residual, full
suites green (build PASS, unit 681/681, rules 1061/1061). F8 fix present in built CSS.
F6 cause pinned to the exact host/directive with live CSP headers fetched via curl;
`firebase.json` still valid JSON.

**Owed (not verifiable in this sandbox):**
- **Any live behaviour** — no signed-in live session exists and live has NO published mock
  definition/manifest, so a real timed mock cannot run on live at all. Live verification
  stays owed until a mock exists.
- Real-browser tab/lock/minimize catch-up; real device-clock change; offline
  disconnect/reconnect choreography; exact-equality boundary (`request.time == endsAt`)
  to the millisecond (not hittable in the emulator).
- F6 live verification — the CSP change ships with the next hosting deploy; confirm the
  console error is gone on the deployed site (preview-channel headers would also prove it).
- F8 rendered dark-mode check — verified in built CSS only; needs a preview deploy +
  Playwright render (the 127.0.0.1:18081 egress relay was restored 23 Nov 07:15 for the
  SEO preview check and can be reused).
- Follow-ups: backdated-`submittedAt` hardening (§4); `googleads.g.doubleclick.net` in
  `connect-src` when real ads activate (§2d).

## 7. Deploy notes

- **Deploys with the post-cron batch, NOT before** — owner instruction 23 Nov ~07:05:
  "ready rakho sob aksate live a jabe" (keep everything ready so it all goes live
  together). Batch runbook: `team/deploy-batch-post-cron-2026-11-23.md` (deploy-main
  worktree). Order: Step 15 (rules+hosting) → 16 (hosting) → 17 (rules+hosting) → 18
  (hosting) → 19 (hosting) → quick-wins (hosting, incl. 41 rewrites + /terms) → SEO pages
  → **F7 fix** → forced app update (rebase + re-probe) → www→apex console redirect
  (needs the owner's explicit go-ahead at deploy time).
- **Rebase + re-probe mandatory:** this branch is based on main `1918766`. Before deploy,
  rebase onto post-cron main (the public-IDs rules refactor lands in the 14:30 cron and
  changes the rules-size picture) and **re-probe the compiled rules** — the margin after
  this change is only ~20 compiled bytes, so the rebased total must be measured again;
  if it does not fit, the rules half must be deferred and only the client fix + tests
  deploy (the client fix is safe on its own — display-only, rules remain the enforcer).
- **Deploy order within this item:** rules FIRST (with the strip step), then hosting —
  the branch also touches `firebase.json` (CSP), which ships with the hosting deploy.
- **Merge caution:** the e18 flip (§3) means the Step 9 test file on this branch asserts
  the NEW behaviour; a real merge in a scratch worktree (never `git merge-tree`) must
  confirm no other branch re-introduces the old e18 expectation.
- **No preview channel was deployed for this fix** (emulator + build verification only);
  a preview deploy + Playwright render is the owed F8 check (§6).

## 8. Files changed

| File | Change |
|---|---|
| `src/lib/mockTimer.ts` | NEW — pure resume/remaining helpers (contracted API) |
| `src/pages/JobMockPage.tsx` | +68/− (enterExam `isResume`, `computeRemainingMillis`, `submittingRef`, `visibilitychange`/`focus` tick) |
| `firestore.rules` | +26/−4 — deadline-checked submit transition + documenting comment |
| `src/index.css` | +15 — F8 dark-mode override for AdSlot preview placeholder |
| `firebase.json` | 1 line — F6: `https://*.adtrafficquality.google` in `connect-src` |
| `src/lib/__tests__/mockTimer.test.ts` | NEW — 15 unit tests |
| `emulator-tests/rules-job-mock-timer-resume.test.ts` | NEW — 17 emulator tests (all 11 B cases) |
| `emulator-tests/rules-step9-full-exam.test.ts` | e18 flipped to DENIED + read-back (old behaviour deliberately removed) |

Workers: A (client fix) `76c74237`, B (rules + F8 + F6) `f095de05`, C (tests + final
verification) `a626f1b8`. Coordinator verified on disk, committed once, pushed branch
`fix/job-mock-timer-resume`.
