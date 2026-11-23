# Job Step 17 — Security Testing (23 Nov 2026)

**Branch:** `jobs/step17-security-testing` · **Base:** main `1918766` (+ the Step 15 rules delta, ported verbatim) · **Status: STAGING ONLY — NOT deployed, NOT Completed.** The rules in this branch cannot deploy yet (compiled 265,148 bytes vs the 256,000 limit — over by 9,148; see §6). No user-facing code changed, so no preview channel was deployed (see §7).

**What this step is:** a permanent, repeatable Firestore security regression suite for the Job section — not a collection of manual penetration tests. Every invariant is tested as a **pair**: the attack is DENIED *and* the honest path is ALLOWED (a denied-only suite can pass while the honest workflow is broken). Fixtures are seeded exclusively with rules disabled; every assertion runs through a normal authenticated (or unauthenticated) client context — never the privileged context.

**What this step found:** 5 real holes (M2, L1, L2, L3, L4) + 2 Step 15 gaps (k15a, k15b), all fixed minimally in staging and proven by tests that **failed before the fix and pass after it**. 2 further gaps (k15c, k15d) are documented limitations that rules cannot fix within the size budget — they are recorded, not hidden.

## 1. Results

| Suite | Result |
|---|---|
| New Step 17 rules tests (`emulator-tests/rules-step17-security.test.ts`) | **60/60 pass** (pre-fix probe: 15 failed / 45 passed — the 15 failures were exactly the fix-targeted attack tests, proving each hole was real) |
| New Step 17 unit tests (`src/lib/__tests__/security-step17.test.ts`) | **7/7 pass** |
| Full unit suite (`npm run test:unit`) | **673/673 pass** |
| Full rules suite (`npm run test:rules`) | **1,104/1,104 pass (exit 0)** — after fixing the regressions the M2 fix itself caused (see §5) |

## 2. Test list (new tests only — 60 rules + 7 unit)

Existing suites already prove M1 (e13–e27), the question-bank standing rules (q1–q60, a1–a33), Step 14 circulars (r1–r8, i15), Step 15 admin (s/k/h/d/x/a, i16), the Step 13 subset fix (r4–r6) and the C1/H1/H2 base proofs (p1–p11, n55a–c). This file adds **new ground only**; the full-suite green run re-verifies the old ground.

### C1 receipt-gating variants (audit fix re-test)
| Test | Attack attempted | Expected | Actual |
|---|---|---|---|
| c1a | Receipt create with `createdAt` 6 min old | DENIED (5-min create window) | DENIED ✓ |
| c1b | Receipt create with a FUTURE `createdAt` | DENIED | DENIED ✓ |
| c1c | Receipt for an attempt naming a DIFFERENT quiz (quiz2 attempt, quiz1 receipt) | DENIED | DENIED ✓ |
| c1d | Key read anchored to ANOTHER student's submitted attempt (+ seeded receipt pointing at it) | DENIED | DENIED ✓ |
| c1e | Key read with a receipt seeded 11 min old | DENIED (10-min read window) | DENIED ✓ |
| i17 | HONEST E2E: unscored submitted attempt → receipt → key read → scored update | ALLOWED | ALLOWED ✓ |

### C2 deadline-immutability variants (audit fix re-test)
| Test | Attack attempted | Expected | Actual |
|---|---|---|---|
| c2a | Partial update sneaking `deadlineAt` in alongside allowed fields | DENIED | DENIED ✓ |
| c2b | Changing `questionIds` mid-attempt | DENIED | DENIED ✓ |
| c2c | ANY update after the deadline has passed | DENIED | DENIED ✓ |
| c2d | HONEST: answers autosave before the deadline | ALLOWED | ALLOWED ✓ |

### H1 score-bound boundaries (audit fix re-test)
| Test | Attack attempted | Expected | Actual |
|---|---|---|---|
| h1a | HONEST boundaries: score == totalMarks, percentage == 100 | ALLOWED | ALLOWED ✓ |
| h1b | score −1 | DENIED | DENIED ✓ |
| h1c | percentage 100.01 | DENIED | DENIED ✓ |
| h1d | totalMarks 0 | DENIED | DENIED ✓ |

### H2 community-answer variants (audit fix re-test)
| Test | Attack attempted | Expected | Actual |
|---|---|---|---|
| h2a | Question author changing `reviewStatus` on their answer | DENIED | DENIED ✓ |
| h2b | Question author changing `authorId` on their answer | DENIED | DENIED ✓ |
| h2c | HONEST: author setting `isAccepted` | ALLOWED | ALLOWED ✓ |

### M2 pending-teacher authoring — FIXED (see §3)
| Test | Attack attempted | Expected | Actual (pre-fix → post-fix) |
|---|---|---|---|
| m2a | PENDING teacher creating a book draft | DENIED | SUCCEEDED → DENIED ✓ |
| m2b | PENDING teacher creating an educationDirectory entry | DENIED | DENIED* → DENIED ✓ |
| m2c | PENDING teacher creating a careerPath draft | DENIED | DENIED* → DENIED ✓ |
| m2d | PENDING teacher creating a jobChapter draft | DENIED | SUCCEEDED → DENIED ✓ |
| m2e | REJECTED teacher creating a book draft | DENIED | DENIED* → DENIED ✓ |
| m2f | HONEST: VERIFIED teacher creating a book draft | ALLOWED | (fixture fix) → ALLOWED ✓ |
| m2g | HONEST: owner creating a book draft (never locked out) | ALLOWED | (fixture fix) → ALLOWED ✓ |
| m2h | HONEST: pending teacher still READS their own draft book | ALLOWED | ALLOWED ✓ |
| m2i | HONEST: VERIFIED teacher creating a jobChapter draft | ALLOWED | ALLOWED ✓ |

\* m2b/m2c/m2e passed pre-fix for the wrong reason (the test fixture used `reviewStatus: 'draft'`, which `isDraftStatus()` rejects — the creates were denied by the fixture, not the role). The fixtures were corrected to `'Not Started'` (the real draft value) so the tests now prove the role gate. m2f/m2g failed pre-fix for the same fixture reason and pass after the correction.

### L1 teacherVerifications key allowlist — FIXED
| Test | Attack attempted | Expected | Actual (pre-fix → post-fix) |
|---|---|---|---|
| l1a | Forged application smuggling `checks` | DENIED | SUCCEEDED → DENIED ✓ |
| l1b | Forged application smuggling `verifiedAt` | DENIED | DENIED† → DENIED ✓ |
| l1c | Forged application smuggling `decision` | DENIED | DENIED† → DENIED ✓ |
| l1d | HONEST: clean application with exactly the client keys | ALLOWED | (cascade, see note) → ALLOWED ✓ |

† l1b/l1c passed pre-fix only because the pre-fix create rule's other conditions happened to reject those exact payloads — no allowlist existed, so a differently-shaped forgery would have passed. The allowlist now denies all three by construction. l1d failed pre-fix as a cascade artifact (l1a's forged create succeeded and left the doc in place, turning l1d's create into a denied update); the attack tests now clean up after themselves.

### L2 nuReceipts — FIXED
| Test | Attack attempted | Expected | Actual (pre-fix → post-fix) |
|---|---|---|---|
| l2a | Receipt create for an UNSUBMITTED attempt | DENIED | SUCCEEDED → DENIED ✓ |
| l2b | Receipt create for a NON-EXISTENT attempt | DENIED | SUCCEEDED → DENIED ✓ |
| l2c | Receipt create with `createdAt` 6 min old | DENIED | DENIED ✓ |
| l2d | HONEST E2E: fresh receipt for the submitted mock attempt, then key read | ALLOWED | (cascade) → ALLOWED ✓ |
| l2e | FUTURE-dated seeded receipt (30 days ahead) opening the key | DENIED | SUCCEEDED → DENIED ✓ |

### L3 nuSessions field restrictions — FIXED
| Test | Attack attempted | Expected | Actual (pre-fix → post-fix) |
|---|---|---|---|
| l3a | Session create smuggling `score` | DENIED | SUCCEEDED → DENIED ✓ |
| l3b | Session update SNEAKING a `deadlineAt` change | DENIED | SUCCEEDED → DENIED ✓ |
| l3c | Session update changing `attemptId` | DENIED | SUCCEEDED → DENIED ✓ |
| l3d | HONEST: autosave update (answers + lastSavedAt) | ALLOWED | ALLOWED ✓ |
| l3e | HONEST: session create with exactly the design-doc fields | ALLOWED | ALLOWED ✓ |

### L4 admin-to-admin protection — FIXED
| Test | Attack attempted | Expected | Actual (pre-fix → post-fix) |
|---|---|---|---|
| l4a | Admin DEMOTING a fellow admin | DENIED | SUCCEEDED → DENIED ✓ |
| l4b | Admin SUSPENDING a fellow admin | DENIED | SUCCEEDED → DENIED ✓ |
| l4c | HONEST: owner demoting an admin | ALLOWED | ALLOWED ✓ |

### Step 15 admin gaps (k15)
| Test | Attack attempted | Expected | Actual (pre-fix → post-fix) |
|---|---|---|---|
| k15a | Moderator deciding a report while rewriting `reporterId` / `targetId` | DENIED | SUCCEEDED → DENIED ✓ |
| k15b | Moderator deciding a correction while rewriting `whatsWrong` / `proposedFix` | DENIED | SUCCEEDED → DENIED ✓ |
| k15c | Report filed against a DRAFT circular | DOCUMENTED-LIMITATION (allowed) | ALLOWED ✓ (see §4) |
| k15d | Moderator publishing their OWN draft circular | DOCUMENTED-LIMITATION (allowed) | ALLOWED ✓ (see §4) |

### Guest / auth boundaries (g)
| Test | Attempt | Expected | Actual |
|---|---|---|---|
| g1 | Guest reading a signed-in-only quiz | DENIED | DENIED ✓ |
| g2 | Guest reading a PREVIEW chapter | ALLOWED | ALLOWED ✓ |
| g3 | Guest reading a NON-preview chapter | DENIED | DENIED ✓ |
| g4 | Guest reading a PUBLISHED circular | ALLOWED | ALLOWED ✓ |
| g5 | Guest reading a DRAFT circular | DENIED | DENIED ✓ |
| g6 | Guest reading a users doc | DENIED | DENIED ✓ |
| g7 | Student LISTING another student's attempts | DENIED | DENIED ✓ |
| g8 | Student reading another student's users doc | DENIED | DENIED ✓ |
| g9 | Student writing to the settings doc (owner-only) | DENIED | DENIED ✓ |
| g10 | Student reading an adminAction log (owner-only) | DENIED | DENIED ✓ |
| g11 | SUSPENDED student creating an attempt | DENIED | DENIED ✓ |

### Step 13 subset-session membership, multi-key variant (r7–r8)
| Test | Attempt | Expected | Actual |
|---|---|---|---|
| r7 | 2-question SUBSET session (refs n=1, n=3) with currentQuestion=3 creates | ALLOWED | ALLOWED ✓ |
| r8 | Same subset with currentQuestion=2 | DENIED (2 is not in the answers map) | DENIED ✓ |

### Unit tests (`src/lib/__tests__/security-step17.test.ts`, 7/7)
- BACKUP_COLLECTIONS includes the Step 15 admin collections (jobReports, jobCorrections, circularHistory, approvedDomains) — the src fix in §3.
- BACKUP_COLLECTIONS includes `circulars` (Step 14) and the Job bank + keys.
- BACKUP_COLLECTIONS has no duplicates.
- LoginPage and RegisterPage never call `signInWithGoogle` (and no `GoogleSignIn`).
- `firebase.json` CSP style-src allows `fonts.googleapis.com` (L5).
- ClassDashboardPage loads books + quizzes through `listBooksForClass(` / `listQuizzesForClass(` and contains no unscoped whole-collection read of books/quizzes (H3 tripwire).

## 3. Fixes made (staging only)

All fixes are in `firestore.rules` except the backup list (`src/lib/backup.ts`). No client code changed — no honest path needed a client change.

**M2 — pending teachers could author drafts.** `contentCreate()` used `isTeacher()`, which admits ANY teacher-role user including one whose verification is still pending; the same `isTeacher()` gate sat on the direct creates for educationDirectory, careerPaths, jobChapters, jobTopics and jobLessons. Fixed by reusing the question bank's gate `isVerifiedJobBankAuthor()` (staff, or a teacher whose `verificationStatus` is `'verified'`) — same semantics, zero new helpers. Note: `contentCreate()` is shared by books, chapters, lessons, quizzes and games — the same hole existed in each, and the fix applies uniformly. The author-UPDATE branches (a teacher editing their own draft) were deliberately left at `isTeacher()`: a pending teacher can keep editing a draft they already hold, but cannot create new ones and cannot publish. Gating the update branches too is a post-refactor follow-up (it needs the Step 6/7 author fixtures migrated first).

**L1 — `teacherVerifications` create had no key allowlist.** A forged application could smuggle `checks`, `verifiedAt` or `decision`. Added `keys().hasOnly([...])` with exactly the 18 keys `admin.ts submitTeacherApplication` writes (id, userId, fullName, teachingLevel, subjects, classes, institution, post, institutionContact, qualifications, experienceYears, verificationReason, evidenceRef, status, verificationStatus, submittedAt, updatedAt, createdAt). The decision fields (checkedBy, reason, checks) are written only by the admin update path.

**L2 — `nuReceipts` create was the weak copy.** No signedIn/callerActive, no key allowlist, no `createdAt` bounds, no attempt check at all. Rewrote it to mirror `jobReceipts`: the anchor attempt must exist, be `submitted`, and match this bundle; `createdAt` within 5 minutes and never in the future; single-use id kept. Also fixed the READ gate `hasFreshNuReceipt`, which had no `createdAt <= request.time` lower bound — a future-dated receipt opened the key for a year (proven by l2e). One deliberate economy: no separate `attempt.userId == uid()` check — the attempt is fetched from the caller's own subcollection (`/users/$(uid())/nuAttempts/...`), so the path itself enforces ownership.

**L3 — `nuSessions` had no field restrictions at all.** Create now allows exactly the NU design-doc §19.2.9 fields (attemptId, status, startedAt, deadlineAt, lastSavedAt, answers, deviceInfo, updatedAt) with a status enum and timestamp types; updates may touch only the autosave fields (status, lastSavedAt, answers, deviceInfo, updatedAt) — attemptId, startedAt and deadlineAt are frozen. The session is NOT tied to an existing attempt: no client writes nuSessions yet (NU-8 engine not built) and the create order is undecided — that linkage is a post-NU-8 follow-up, not a silent break.

**L4 — an admin could modify another admin's doc.** The users admin-update branch only excluded `role == 'owner'` targets, so admin-1 could demote or suspend admin-2. Added one condition — `(!(resource.data.role in ['admin', 'moderator']) || isOwnerRole())` — so staff docs are owner-only while admins keep managing students/teachers/parents. (First attempt used `not in`, which does not exist in the rules language — the rules failed to compile; fixed to `!(... in ...)` and re-probed.)

**k15a/k15b — Step 15 decide updates had no `affectedKeys`.** A moderator deciding a report could rewrite `reporterId`/`targetId`/`targetAuthorId`; deciding a correction could rewrite `whatsWrong`/`proposedFix`/`source`. Both updates now carry an `affectedKeys().hasOnly([...])` allowlist of exactly the decide fields (report: status, priority, resolvedBy, resolvedAt, resolutionNote, updatedAt; correction: status, decidedBy, decidedAt, decisionReason, updatedAt). The field sets were taken from the Step 15 test file's decide payloads — there is no `decideJobReport`/`decideJobCorrection` client function in this branch (no client code references `jobReports`/`jobCorrections` at all; the Step 15 UI was not ported with the rules delta).

**Backup list — Step 15 collections were missing from every backup.** Added `jobReports`, `jobCorrections`, `circularHistory`, `approvedDomains` to `BACKUP_COLLECTIONS` in `src/lib/backup.ts` (same class of silent omission the 22 Nov pre-export check already caught for the question bank, keys, bookmarks and health collections).

**Single-get refactor of `isVerifiedJobBankAuthor()` (forced by §5).** The original form called `callerActive()` + `callerRole()` + `callerRole()` + `callerVerificationStatus()` — 4 separate fetches of the users doc — which pushed the jobTopics/jobLessons creates over Firestore's 1000-expression evaluation limit. The gate now fetches the users doc once and passes its data to a pure helper `isVerifiedJobBankAuthorFor(d)`. It is cheaper than the old `isTeacher()` gate (1 fetch vs 2) and costs +273 compiled bytes for the extra function definition.

## 4. Deferred / documented limitations (not fixed, on purpose)

- **k15c — a report can be filed against a DRAFT circular** (and against a nonexistent target): the report create rule has no target-exists/published check. Impact is queue pollution only (low). The client must not surface drafts as reportable targets. A rules-side target check is a post-refactor follow-up.
- **k15d — no-self-approval for circulars is CLIENT-ENFORCED, not rules-enforced.** A moderator CAN publish their own draft circular by direct write (proven: the test asserts the operation succeeds). The guard lives in `canApproveCircular` in the client. The question bank DOES enforce second-eye in rules. Rules-side no-self-approval for circulars is a post-refactor follow-up; this test must become `assertFails` once it lands.
- **M2 residual — the author-update branches** still use `isTeacher()` (see §3). A pending teacher can edit a draft they already hold, but cannot create new ones.
- **L3 residual — nuSessions are not tied to an existing attempt** (see §3). Post-NU-8 follow-up.
- **Score correctness is NOT verifiable by rules** — see `team/SECURITY_LIMITATIONS.md`. A student who answers everything wrong can still submit a client-computed 20/20; H1 bounds the claim, it does not verify it. Client-computed scores must never be displayed as independently verified examination results.
- **Owner 2FA, email verification, sessions, CAPTCHA, quota alerting** — see §8.

## 5. Regressions the fix itself caused (all fixed in staging)

The M2 gate change broke 9 previously-passing tests in the first full-suite run (9 failed / 1,095 passed). Each was a fixture that encoded the OLD gate, not a real regression — the honest path moved from "any teacher" to "verified teacher":

1. **Step 6 (`rules-step6-job-content.test.ts`, 6 tests: c9, c10, c11, t2, t4, t12).** Two causes stacked: (a) the seed's `teacher-1`/`teacher-2` were `verificationStatus: 'pending'`, so the new gate denied their honest-path creates; (b) the 4-fetch form of the gate pushed the jobTopics/jobLessons creates over the 1000-expression evaluation limit. Fixed by the single-get refactor (§3) + flipping both fixtures to `'verified'` with a comment pointing at m2a–m2e. 156/156 pass.
2. **Step 2 (`rules-step2.test.ts`, 2 tests).** `teacher-1` had no `verificationStatus` at all. Same fix: the seed now sets `verificationStatus: 'verified'` for teacher-1.
3. **NU-4 (`rules-nu4-admission-profiles.test.ts`, n45).** The test asserted a receipt for an IN-PROGRESS attempt could be created — that assertion WAS the L2 hole (the old field-only create). Flipped to DENIED with a comment pointing at l2d; the receipt id is used nowhere else in the file.

Second full run after these fixes: 3 failed / 1,101 passed (only the Step 2 + NU-4 items remained); third full run: **1,104/1,104, exit 0.**

## 6. Rules size — the deploy blocker (measured, not assumed)

Probe: `~/workspace/eduorbit/step17-rules-size-probe.mjs` (throwaway release `step17-size-probe`; live `cloud.firestore` never touched; `rulesets.create` does not enforce the limit, only release-create does).

| State | Stripped bytes | Compiled bytes | vs 256,000 limit |
|---|---|---|---|
| Branch baseline (main 1918766 + Step 15 delta) | 176,707 | 260,991 | **OVER by 4,991** |
| + Step 17 fixes (first pass) | 179,401 | 265,117 | OVER by 9,117 |
| + drop redundant attempt.userId check (L2) | 179,269 | 264,875 | OVER by 8,875 |
| + single-get refactor (§3) | 179,461 | **265,148** | **OVER by 9,148** |

Step 17 delta: **+2,754 stripped / +4,157 compiled.** Post-cron projection: the public-ID refactor (23 Nov 14:30 cron) frees ~4,992 bytes → 265,148 − 4,992 = **260,156, still OVER by ~4,156**. So these fixes cannot deploy even immediately after the cron: they need the refactor PLUS ~4.2 KB more rules savings (a second refactor pass, or the Step 15 + Step 17 rules landing after additional size work). **Nothing was weakened to shrink the rules** — the fixes are held in staging, fully tested, with this note. The temporary rules-size policy is recorded in `team/SECURITY_LIMITATIONS.md`: no new production rules logic unless it addresses a demonstrated critical vulnerability AND its compiled size has been measured first.

## 7. Preview / deploy checklist

- **Preview channel: NOT deployed — no user-facing code changed.** The only `src/` change is 4 strings in `BACKUP_COLLECTIONS` (a data list, no route/component). The rules + tests are staging-only. (Per the step brief: preview + verify by content only if user-facing code changed; it did not.)
- **Deploy needed? YES — eventually, rules only.** The fixes must reach live rules to close M2/L1/L2/L3/L4/k15a/k15b. The backup-list change ships with the next hosting deploy (no user-visible effect).
- **Deploy MUST wait for:** (1) the 23 Nov 14:30 cron's public-ID refactor on main; (2) rebase this branch onto that main; (3) re-run the release-create probe; (4) a further ~4.2 KB of rules savings beyond the refactor (see §6); (5) re-run `npm run test:rules` + `npm run test:unit` after the rebase; (6) deploy rules + hosting TOGETHER (never hosting-only — the Step 15 admin UI writes would otherwise be denied by live rules).
- **Do NOT deploy inside 14:00–15:30 on 23 Nov** (quota-reset cron window).
- **Live Firestore: never touched** (emulator only; live quota was exhausted until ~14:00). No live reads/writes were made by this step.
- **Rendered (Playwright) check: OWED, not passed** — the sandbox proxy is down. This step changed no rendered UI, so there is nothing new to render-check; the owed checks for Steps 11–16 remain owed.
- **Merge discipline:** real merge in a scratch worktree (never `git merge-tree` — it is unreliable); deploy-main rebuild AFTER fast-forwarding and BEFORE any hosting deploy.

## 8. 22 Nov audit — open items status

| Item | Status after Step 17 |
|---|---|
| C1 answer-key read via one-sided receipt freshness | FIXED in the 22 Nov audit round; re-tested here with variants (c1a–c1e, i17). The NU twin of the same bug (future-dated receipt) was found and fixed here (L2/l2e). |
| C2 NU mock deadlineAt/startedAt rewritable | FIXED in the audit round; re-tested with variants (c2a–c2d). |
| H1 unbounded self-asserted scores | FIXED in the audit round; re-tested at the boundaries (h1a–h1d). Score *correctness* remains unverifiable without a trusted backend — documented, not hidden (see §4 + SECURITY_LIMITATIONS.md). |
| H2 community answers rewritable by author | FIXED in the audit round; re-tested with variants (h2a–h2c). |
| H3 dashboard read burn | Read-reduction deployed live 22 Nov (dormant until the 14:30 cron activates the stats docs). Step 17 adds a static tripwire (dashboard uses the class-scoped listers) + the existing `read-usage-measure` numeric regression test. No new emulator read-count test — see reconciliation 4 (§9). |
| H4 no production backup | NOT fixed here — belongs to Step 18 (Backup/Recovery). Step 17 only adds the 4 missing Step 15 collections to BACKUP_COLLECTIONS. The actual export runs in the 14:30 cron; the restore test is Step 18's. Note: the backup tool does NOT include subcollections (`subcollectionsIncluded: false`) — user subcollections (quizAttempts, jobSessions, nuAttempts) are not in a JSON backup. |
| M1 (exam timing: endsAt/submittedAt) | FIXED in Step 9 (e13–e27); re-verified by the full-suite green run. |
| M2 pending teacher can author drafts | **FIXED here** (see §3). |
| M3 no email verification / 6-char password min / no CAPTCHA | **Owner decisions — unchanged.** No policy exists, so there is no invariant to test: the rules carry no `email_verified` condition, and writing a test that asserts unverified users are blocked would fail against the current (deliberate) behaviour. If the owner sets the policy, the enforcing rule is `request.auth.token.email_verified == true` on sensitive writes, testable with verified/unverified tokens in the emulator. Password minimum is an Auth-config decision (raising it can affect existing users; 6 chars is Firebase's default). CAPTCHA is a UX/abuse trade-off, not authorization — App Check is the lighter option if abuse appears. |
| M5 owner no 2FA + sessions never expire | **Owner action — unchanged, highest priority.** Both AIs agree: securing the owner account is more urgent than CAPTCHA. The owner account holds the highest privileges on the platform. Sessions: Firebase ID tokens are short-lived and refresh via refresh tokens — a React inactivity timer does not change refresh-token validity, so do not describe client-side logout as server-enforced expiration. Revocation (disable account / revoke refresh tokens) is the real control. |
| M6 no server-side quota alerting | **Operational — unchanged.** No Cloud Functions on Spark, so no server-side alert triggers exist. Control is operational: H3 read-budget discipline + scheduled manual Console usage checks + the backup/export runbook. Do not build a client-side quota monitor (a malicious client can tamper with it). |
| L1 teacherVerifications smuggled fields | **FIXED here.** |
| L2 nuReceipts weak copy | **FIXED here.** |
| L3 nuSessions no field restrictions | **FIXED here.** |
| L4 admin can modify another admin | **FIXED here.** |
| L5 CSP fonts | FIXED live 22 Nov; tripwire test added here (firebase.json contains fonts.googleapis.com). |
| L6 isVerifiedTeacher divergence | Reconciled at merge (22 Nov). |
| L7 phone auth enabled in console but unwired | Owner console hygiene — unchanged. |

Prioritised open list (both AIs agree): **1. Owner 2FA — critical, first, owner action. 2. Email-verification policy — high, owner decision, then rules + tests. 3. Session/revocation procedure — high, document + test sign-out/revoked behaviour. 4. Quota monitoring routine — high, operational. 5. CAPTCHA/App Check — medium, only if abuse appears. 6. Password minimum — medium, Auth-config decision.**

## 9. Multi-AI consultation — Gemini + ChatGPT, folded in

Both consultations were received before closing (Gemini: https://gemini.google.com/app/eeb39a554355d43c; ChatGPT: https://chatgpt.com/uc/6b035b46-a034-83ea-9296-b1d0aee49f85). One combined table; the five required reconciliations follow it.

### Reconciliations (explicit — neither side silently picked)

1. **Test organisation.** Gemini: 8 numbered files (01-auth-and-roles … 08-read-budget-h3). ChatGPT: an invariant-grouped tree (setup / boundaries / exams / roles / questions / circulars / approvals / regression). **Reconciled:** ONE file, `emulator-tests/rules-step17-security.test.ts`, with `describe` blocks per invariant. Reason: the repo runs the whole `emulator-tests/` directory per step and each file pays its own emulator environment; 8 files would multiply startup cost and break the established per-step convention. The invariant grouping is preserved as the describe blocks.
2. **Test order.** Gemini Phase 0–5 vs ChatGPT's 9-step order. **Reconciled:** they agree in substance (baseline → guests → keys/scores → deadlines → roles/lifecycle → circulars → approval → ops). The file's describe order is: guest/auth boundaries → C1 → H1 → C2 → role escalation (M2/L4) → question lifecycle (re-verified by the existing suites, not duplicated) → circulars + Step 15 gaps → self-approval (documented limitation) → read-budget/backup (unit tests). Phase 0 (baseline + rules-budget gate) lives in this report (§6), not in a test.
3. **Open items.** Gemini's table vs ChatGPT's prioritisation. **Reconciled:** the single prioritised list in §8 (owner 2FA critical/first; email verification high; sessions high; quota high operationally; CAPTCHA medium; passwords medium), with "testable now vs owner decision" stated per item.
4. **H3/H4.** Gemini: Phase 5 query-shape regression checks. ChatGPT: a dashboard read-budget regression test + backup execution/restore verification as permanent items. **Reconciled:** H3 is covered by the unit tripwire + the existing `read-usage-measure` numeric test — Step 17 adds no new emulator read-count test (the numeric regression already exists). H4's backup execution + restore test belongs to Step 18; Step 17 covers only BACKUP_COLLECTIONS completeness.
5. **Rules-size policy.** Both agree: measure first, no new rules logic unless critical + measured. **Reconciled:** adopt ChatGPT's temporary policy verbatim (no additional production rules logic unless it addresses a demonstrated critical vulnerability AND its compiled size has been measured) + the `team/SECURITY_LIMITATIONS.md` file ChatGPT asked for, which also carries Gemini's "rules are the primary boundary, not a grading engine" point.

### Combined USED / ADAPTED / REJECTED table

| # | Advice | Source | Verdict | What happened |
|---|---|---|---|---|
| 1 | Every invariant tested as a pair: attack DENIED + honest ALLOWED | Gemini + ChatGPT | **USED** | All 60 rules tests are written as pairs (incl. the honest-path tests m2f/g/h/i, l1d, l2d, l3d/e, l4c, h1a, h2c, c2d, i17, g2, g4, r7). |
| 2 | Seed only via `withSecurityRulesDisabled`; assert only through normal contexts | Gemini + ChatGPT | **USED** | The file's `seed()` is the only rules-disabled use (plus cleanup deletes and the k15d restore); every `assertFails`/`assertSucceeds` runs as guest/student/teacher/moderator/admin/owner. |
| 3 | Boundary values in every test (reason 9 vs 10 chars, createdAt now−10m±1s, score 0 and == totalMarks) | Gemini + ChatGPT | **USED** | h1a (score == totalMarks, percentage == 100), h1b–h1d; c1a (6 min), c1e (11 min); the 9-vs-10-char reason boundary is covered by the existing Step 15 tests (s/d-series), not duplicated. |
| 4 | Exact-hostname domain checks, never substring | Gemini + ChatGPT | **USED** | Re-verified by the existing Step 15 domain tests (x-series); not duplicated here. |
| 5 | Phase 0 rules-budget gate: measure compiled size before/after any rule edit | Gemini | **USED** | §6 — stripped + release-create probe before the fixes (260,991) and after every edit (265,148 final). |
| 6 | Invariant-explaining test names | ChatGPT | **USED** | m2a, l1a, k15a, c1a… — every name states the invariant; no test1/should-work. |
| 7 | Test the COMPLETE operation (receipt = existence + ownership + attempt + submission + quiz + freshness + bounds) | ChatGPT | **USED** | i17 and l2d run the full honest sequence end-to-end; c1a–c1e each break exactly one condition. |
| 8 | `SECURITY_LIMITATIONS.md` documenting what rules enforce vs cannot | ChatGPT | **USED** | Written at `team/SECURITY_LIMITATIONS.md` (incl. the score-correctness limit, the client-enforced self-approval, session/CAPTCHA/MFA/quota limits, the subcollection backup gap). |
| 9 | Temporary rules-size policy (no new rules logic unless critical + measured) | ChatGPT | **USED** | Adopted; recorded in SECURITY_LIMITATIONS.md and §6. |
| 10 | M3/M5/M6 are owner decisions, not code changes | Gemini + ChatGPT | **USED** | §8 — no account-security settings touched, no CAPTCHA added, no policy invented. |
| 11 | Do NOT treat rules as a server-side grading engine | Gemini + ChatGPT | **USED** | Documented in SECURITY_LIMITATIONS.md + §4; H1 is described as bounding claims, never verifying them. |
| 12 | 3-gate deployment checklist (code change / rules change / pre-production) | ChatGPT | **USED** | Adapted into the deploy checklist in §7 (rebase → re-probe → full suites → rules+hosting together). |
| 13 | Denied-write state check (confirm the protected doc is unchanged after a denial) | ChatGPT | **USED** | `assertFails` already proves the operation did not land; state is additionally verified where it matters (k15d restores + re-reads the circular; l2e deletes the seeded receipt; m2h reads the untouched draft). |
| 14 | 8 numbered test files (Gemini) / invariant tree (ChatGPT) | Gemini + ChatGPT | **ADAPTED** | One file with describe blocks — see reconciliation 1. |
| 15 | Phase 5 query-shape read-budget checks / dashboard read-budget regression test | Gemini + ChatGPT | **ADAPTED** | Unit tripwire + existing `read-usage-measure` test; no new emulator read-count test — see reconciliation 4. |
| 16 | Backup execution + restore verification as Step 17 items | ChatGPT | **ADAPTED** | Moved to Step 18 (H4); Step 17 covers BACKUP_COLLECTIONS completeness only — see reconciliation 4. |
| 17 | Owner override requires ≥10-char reason + audit record (test both sides: state change AND audit record present) | Gemini + ChatGPT | **ADAPTED** | Cannot be a rules test: the override is client-enforced (k15d proves the rules allow it). Recorded as a documented limitation + post-refactor follow-up instead of a false denial test. |
| 18 | Email-verification tests (unverified cannot access / verified can / cannot self-set verified) | ChatGPT (+ Gemini) | **ADAPTED** | Not written: no verification policy exists, so there is no invariant to test. Recorded in §8 with the exact enforcing rule for when the owner decides. |
| 19 | CI rules-size guard script | Gemini | **ADAPTED** | The probe script already exists (`step17-rules-size-probe.mjs`) and is referenced in the deploy checklist; wiring it into CI is a repo-wide change, out of Step 17 scope. |
| 20 | Revocation test (demoted moderator's next privileged write denied) | ChatGPT | **USED via existing** | Covered by the existing Step 6 test o14 (author demoted to student loses the edit right) — not duplicated. |
| 21 | "No helper bloat" (~80-byte headroom) | Gemini | **ADAPTED** | A helper WAS added (`isVerifiedJobBankAuthorFor`) — because the 1000-expression evaluation limit required it (§5). Trade-off documented: +273 compiled bytes to fix a real evaluation failure. The compiled-size cost is in §6. |
| 22 | Self-approval denied by rules (ChatGPT scenario G tests 1–9; Gemini scenario G) | Gemini + ChatGPT | **REJECTED as a test assertion** | The rules do NOT enforce it for circulars — k15d proves the operation succeeds. Writing `assertFails` would fail. Documented as a post-refactor follow-up, not hidden. (The question bank DOES enforce it in rules — q40.) |
| 23 | Receipt-creation retry / attempt-subsequently-changed edge cases as separate tests | ChatGPT | **REJECTED (covered)** | Covered by c1e (stale receipt) + the single-use id (i17/l2d create-then-delete exercises the retry path). Separate tests would duplicate the same condition. |
| 24 | "Do NOT add speculative validation / duplicate ownership checks / complex hostname parsing in rules" | ChatGPT | **USED** | The one economy applied: the L2 create drops the redundant `attempt.userId` check (path-enforced ownership) — §3. No other speculative conditions were added. |

### ChatGPT 31-item completion criteria — honest accounting
- **Emulator foundation (5/5):** dedicated demo project id (`eduvelto-rules-test-step17-security`); actual production rules file loaded (file-level guard asserts the Step 15 delta + M2 fix are present); 11 test identities; fixtures seeded independently of assertions; no production DB/credentials used.
- **Critical invariants (9/11):** unpublished key denied without valid receipt ✓; receipt requires matching submitted attempt ✓; expired + future receipts rejected ✓; score bounds + totalMarks ✓; mock startedAt/deadlineAt immutable ✓; student role escalation denied ✓; author + last-editor self-approval denied — **partial** (question bank ✓, circulars ✗ — k15d); only eligible second reviewer can publish ✓ (bank; circulars client-only); unpublished circulars inaccessible ✓; reports cannot modify published records ✓; owner override requires reason + audit — **✗ rules-side** (client-only).
- **Positive-path verification (7/7, with the honest moderator-review and circular-verification paths covered by the Step 15/14 suites, not duplicated here):** honest attempt + submission ✓ (i17); legitimate key access ✓; legitimate scoring ✓; legitimate moderator review ✓ (Step 15 s-series); legitimate question publication ✓ (Step 6/7); legitimate circular verification ✓ (Step 14); legitimate owner override ✓ (l4c owner path; the audit-record half is client-side).
- **Operational readiness (4/8):** dashboard read regression test ✓; backup export completed ✗ (14:30 cron); backup restore verified ✗ (Step 18); owner 2FA enabled ✗ (owner action); email-verification policy documented — partial (decision documented, policy itself undecided); session limitations documented ✓; quota monitoring procedure documented ✓; rules compiled size measured ✓.

## 10. Files changed

| File | Change |
|---|---|
| `firestore.rules` | M2 (contentCreate + 5 direct creates → `isVerifiedJobBankAuthor()`), single-get refactor of that gate, L1 allowlist, L2 nuReceipts create rewrite + `hasFreshNuReceipt` lower bound, L3 nuSessions create/update, L4 staff-docs owner-only, k15a/k15b `affectedKeys` |
| `emulator-tests/rules-step17-security.test.ts` | NEW — 60 tests (§2) |
| `src/lib/__tests__/security-step17.test.ts` | NEW — 7 unit tests (§2) |
| `src/lib/backup.ts` | +4 collections (`jobReports`, `jobCorrections`, `circularHistory`, `approvedDomains`) |
| `emulator-tests/rules-step6-job-content.test.ts` | Seed only: teacher-1/teacher-2 `pending` → `verified` (§5) |
| `emulator-tests/rules-step2.test.ts` | Seed only: teacher-1 gets `verificationStatus: 'verified'` (§5) |
| `emulator-tests/rules-nu4-admission-profiles.test.ts` | n45 flipped ALLOWED → DENIED (§5) |
| `team/SECURITY_LIMITATIONS.md` | NEW — what the rules enforce vs cannot (§9 #8) |
| `team/job-step17-security-testing-2026-11-23.md` | This report |

## 11. Standing rule adopted (from the ChatGPT consultation)

**Never weaken a proven security invariant merely to make a new feature easier to implement.**
