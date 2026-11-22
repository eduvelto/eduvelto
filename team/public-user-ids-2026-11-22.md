# Public user IDs — implementation report (staging)

Date: 22 Nov 2026 (evening). Branch: `feature/public-user-ids`, HEAD
`bee4ff8`, pushed. Worktree:
`~/workspace/eduorbit/phase2-project-public-id/`. Preview:
https://eduvelto--public-user-ids-ehycmjt8.web.app (expires 29 Nov 15:47 UTC).

Owner order 22 Nov 15:46: "sobar id hobe eduvelto0001 thake" —
everyone's ID runs sequentially from eduvelto0001.

## 1. Design (binding constraints, all met)

- The public ID is a sequential DISPLAY / LOOKUP number only
  (`eduvelto0001`, `eduvelto0002`, ...). It is stored as ONE int
  field, `publicIdNumber`, on `users/{uid}`; the display string is
  derived from it (`formatPublicId`, `eduvelto` + zero-padded
  4 digits, growing past 9999 naturally). Single source of truth —
  no second field that can disagree.
- The Firebase Auth UID stays the real security identity (the
  `users/{uid}` doc ID, `isOwner()`, every permission decision).
  Rules NEVER trust the public ID for permissions.
- Allocation is atomic: a Firestore transaction against the counter
  document `counters/publicUserIds` (`{ next, updatedAt }`) reads the
  counter, creates the profile doc carrying `publicIdNumber = next`,
  and increments the counter to `next + 1`. Two simultaneous signups
  get different numbers (transaction retry on contention). Numbers
  are never reused.
- Fallback: if the counter is missing/invalid, or the transaction
  fails (e.g. the rules change has not deployed yet), the profile is
  created WITHOUT a number and the backfill assigns it later.
  Signup NEVER breaks because of the public ID.
- Display: own Profile page shows the public ID (with "এখনো দেওয়া
  হয়নি" when absent); the existing "Eduvelto ID" (Auth UID) row is
  kept — it is the technical ID the guardian link uses. Admin user
  detail shows it too (AdminUserRow carries `publicIdNumber`).

## 2. Files changed (9 files, +852/−1)

- NEW `src/lib/publicId.ts` — `formatPublicId` / `parsePublicId`
  (round-trip check), counter constants, `createProfileWithPublicId`
  (the transaction), `assignMissingPublicIds` (pure backfill logic).
- `src/lib/profile.ts` — `publicIdNumber?: number` on `UserProfile`;
  `ensureUserProfile` allocates via the transaction, falls back to a
  plain `setDoc` on failure. All signup paths funnel through here
  (email sign-up, email sign-in, Google redirect, RoleSetupPage).
- `src/lib/admin.ts` — `publicIdNumber?` on `AdminUserRow`, mapped
  in `toAdminUserRow` (invalid values dropped).
- `src/i18n/strings.ts` — `publicId` / `publicIdPending` (dashboard).
- `src/pages/ProfilePage.tsx`, `src/pages/AdminUserDetailPage.tsx`
  — display rows.
- NEW `src/lib/__tests__/publicId.test.ts` — 11 tests.
- NEW `scripts/backfill-public-ids.mjs` — owner-token REST backfill
  (dry-run default, `--apply` writes): lists users, assigns missing
  numbers in `createdAt` order (smallest unused integers), seeds /
  updates the counter to max+1. Idempotent. Needs the rules change
  deployed before `--apply` works.
- NEW `emulator-tests/rules-public-id.test.ts` — 15 rules tests.
- NO change to `firestore.rules` in this commit — see §4.

## 3. Verification (staging)

- Build PASS (`tsc -b` clean + `vite build`).
- Unit: 522/522 (was 511, +11 new publicId tests).
- Emulator rules suite (alt ports 8081/9098 — default ports were in
  use by the read-reduction coordinator's emulator): **9/15 pass,
  6 fail — all 6 failures are the missing rules change** (see §4):
  - p1 counter read, p3 counter +1: denied, `false @ L4571`
    (no `counters` match exists yet).
  - p7 create with `publicIdNumber == next`: denied — the create
    allowlist lacks the key (plus emulator 1000-expression noise on
    the denial path, pre-existing for this bloated rule set).
  - p11 owner backfill update: denied — owner update allowlist
    lacks the key.
  - p14 concurrent allocation E2E, p15 missing-counter fallback:
    denied on the counter read.
  - Passing (9): p2/p4/p5/p6 counter denials, p8 wrong-number
    create denied, p9 create WITHOUT a number allowed (the
    fallback works), p10 self-update cannot change the number,
    p12 owner cannot change an existing number, p13 admin cannot
    set the number.
  - Two test bugs found and fixed during the run (creates must be
    signed in AS the new uid — `isOwner`; seed verified loudly in
    `beforeAll` after the first run's misleading trace).
- Preview: 4/4 routes 200 (`/`, `/profile`, `/login`, `/register`);
  main bundle `index-Cy-t9X_T.js` md5 = dist; ProfilePage chunk
  md5 = dist; `publicIdNumber` + `পাবলিক আইডি` present in the
  served bundles; homepage title unchanged. Rendered (Playwright)
  check OWED — sandbox proxy down, not passed.
- Live reads/writes: NONE done tonight (daily quota exhausted,
  429 stop). Backfill dry-run against live is OWED until after the
  quota resets ~14:00 Dhaka tomorrow.

## 4. RULES CHANGE NEEDED — STOP, approval required before writing it

A rules change IS needed; it is NOT in this commit, per the task
brief. Exact diff (5 edits, measured in a /tmp copy only):

1. Users CREATE allowlist: add `'publicIdNumber'` (after
   `'lastActiveAt'`).
2. Users CREATE binding clause (after the `isStr(displayName)`
   clause):
   `(!('publicIdNumber' in request.resource.data) || (int, >= 1,
   == get(counters/publicUserIds).data.next))` — a client may only
   claim the number the counter is offering now. Absent = fallback
   (the clause short-circuits, so a missing counter never blocks a
   plain create).
3. Owner-role UPDATE allowlist: add `'publicIdNumber'`.
4. Owner-role UPDATE clause: set-only-when-absent (int, >= 1, and
   `!('publicIdNumber' in resource.data)` when it is in the
   affected keys) — an existing number is never changed.
5. New `match /counters/{counterId}` block (after the users block):
   read by any signed-in user (only `publicUserIds`); create by
   owner only (`next` int >= 1, keys `next` + `updatedAt`); update
   by any signed-in user ONLY incrementing `next` by exactly 1
   (keys `next` + `updatedAt`).
   NOT added: self-update allowlist (immutable for the owner of
   the doc) and admin update allowlist (admins never assign IDs).

SIZE — the blocking question. Measured on a /tmp copy with the
project's own strip script: stripped source 172,356 → 173,640
bytes (**+1,284 bytes**). The COMPILED margin is only 1,138 bytes
(current compiled 254,862 / limit 256,000) and the compiled size
can only be measured by a deploy attempt. The change will very
likely push the compiled size to ~256,000 or just over it.
Options for the parent:
  (a) approve the rules change AND a small compensating refactor to
      free ~2,000+ compiled bytes first (Step 9 precedent: R1/R2
      freed 8,791 by extracting cores and deleting dead code);
  (b) approve the rules change alone and let the deploy attempt
      measure the compiled size (a size failure is safe — the
      deploy errors out — then do (a));
  (c) ship the client code without the rules change: signups fall
      back to no-number and the backfill assigns numbers later
      (atomic on-signup allocation deferred).
Also: the users create rule is already near the 1000-expression
limit — the binding adds a handful of expressions, evaluated only
when `publicIdNumber` is present (the allow path stays under the
limit: p9 proves the base chain passes).

## 5. Backfill expectations (to confirm at deploy time)

- Existing users: 4 (as of 22 Nov 21:07). Expected order by
  `createdAt` ascending: owner first → `eduvelto0001`, then the
  other three → `eduvelto0002`–`eduvelto0004`; counter seeded to
  `next = 5`. The live `createdAt` order MUST be confirmed by the
  dry-run after the quota resets — the owner being first is
  expected (first registered), not yet verified from live docs.
- Backfill script: `scripts/backfill-public-ids.mjs` (dry-run
  default). Run dry-run first (after ~14:00 tomorrow), then
  `--apply` (needs the rules change deployed). It also seeds the
  counter; re-runnable (assigns only the still-missing).
- Deploy sequence: (1) approve + deploy the rules change (with
  the strip step, and the full rules suite re-run against the
  stripped file); (2) deploy hosting (this branch); (3) run the
  backfill dry-run, then `--apply`; (4) verify: 4 users numbered,
  counter `next = 5`, new signup gets `eduvelto0005`.

## 6. Honest limits

- Rules cannot prove the counter increment and the profile create
  happened in one transaction (they evaluate each write against
  pre-transaction state). A deliberately malicious client could
  claim the current `next` number without incrementing, or
  increment the counter alone and burn numbers. The rules binding
  stops claiming a STALE or FUTURE number; the honest path (the
  transaction in this module) can never produce a duplicate.
  Duplicates are detectable (admin query for a duplicate
  `publicIdNumber`) and fixable by the owner.
- The counter value is not secret (it is only "the next number").

## 7. Deploy-approval summary (one line)

Public IDs are implemented, tested and preview-verified in staging
(branch `feature/public-user-ids` bee4ff8); production deploy is
BLOCKED on the rules-change approval (§4 — likely needs a small
refactor to fit the 256,000-byte compiled limit) and on the
post-quota backfill dry-run.
