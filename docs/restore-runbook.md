# Eduvelto — Backup & Recovery Runbook

> **Status:** Step 18 (23 Nov 2026). Tested in the Firestore emulator only.
> The production backup file is produced by the 23 Nov 14:30 job; validating
> THAT file is a separate follow-up (see §8). Nothing in this runbook has
> been run against production data.
>
> **The one sentence that matters:** a backup is not recovery-tested
> merely because `validateBackup()` succeeds. Backup validity and
> recovery validity are two different statuses — this runbook covers
> both, and §6 proves the difference with a real failing case.

## 1. What a backup is (and is not)

### 1.1 The two export methods

| | In-app export (`/admin/backup`) | Scripted REST export (`backups/export-full-rest.mjs`) |
|---|---|---|
| How it reads | Firebase client SDK, as the signed-in owner | Firestore REST, with the owner CLI token |
| Rules apply? | **Yes** — it can only read what the owner may list-read | **No** — the token bypasses the rules |
| Collections | 76 (see §2) | 78 (the 76 + `follows` + `directMessages`) |
| Format | `BackupFile` JSON, `BACKUP_VERSION = 1` | Identical format (parity-tested, Step 18) |
| Who runs it | The owner, in the browser | Muse, with the owner's approval, from the sandbox |
| Quota cost | Same reads as the script (~1 read/doc + preflight counts) | Same |
| When to use it | Routine weekly export | When the in-app export cannot run, or a complete file is needed |

**The scripted export is the complete one.** The in-app export cannot
see `follows` or `directMessages` (the owner cannot list-read them
under the rules — Step 18 findings F-3). If you need a file that holds
*everything*, use the script.

### 1.2 Format (`BACKUP_VERSION = 1`)

```json
{
  "metadata": {
    "app": "Eduvelto",
    "backupVersion": 1,
    "exportedAt": "2026-11-23T08:30:00.000Z",
    "exportedBy": "<owner UID>",
    "collections": { "notices": 12, "users": 4 },
    "subcollectionsIncluded": false
  },
  "data": { "notices": [{ "id": "n1", "...": "..." }] }
}
```

- Timestamps are `{__type: 'timestamp', millis: <number>}`; GeoPoints are
  `{__type: 'geopoint', latitude, longitude}`. `restoreBackup()` revives
  both. Reference fields, if any ever appear, survive as
  `{__type: 'reference', path}` markers and are **not** revived into
  DocumentReferences (known parity gap, Step 18 — no live doc is known
  to use reference fields).
- One file up to 10,000 docs; above that, one file per collection
  (`eduvelto-backup-<stamp>-<collection>-<n>docs.json`).
- **The custom JSON is NOT a Firebase console export.** Console
  Export/Import uses Firestore's native format. You cannot feed
  `eduvelto-backup-*.json` into console Import, and you cannot feed a
  console export into `restoreBackup()`. They are two different
  mechanisms — never mix them.

### 1.3 What is covered (Step 18 inventory)

- **76 collections** in `BACKUP_COLLECTIONS` (`src/lib/backup.ts`) — the
  in-app export covers these. Proven exportable by the owner in the
  emulator (Step 18 coverage test).
- **+2 collections** only in the scripted export: `follows`,
  `directMessages` (client-unreadable, see §1.1).
- **6 deliberately excluded from the client list**
  (`BACKUP_EXCLUSIONS`, each with a reason in `backup.ts`):
  `jobReceipts`, `quizReceipts`, `nuReceipts` (10-minute authorization
  tokens — worthless after expiry, facts duplicated in the attempt doc),
  `jobExamUserLocks` (transient locks, recreated on demand),
  `directMessages` and `follows` (the owner cannot list-read them —
  the exclusion means "the *client* cannot export them", not "nobody
  can": the scripted export and the console export still cover both).
- **5 pending** (`BACKUP_KNOWN_PENDING`): `jobReports`,
  `jobCorrections`, `circularHistory`, `approvedDomains` (Step 15
  admin — arrive when that branch merges), `counters` (public user IDs
  — arrives with the 23 Nov 14:30 cron merge; holds the ID counter and
  MUST join `BACKUP_COLLECTIONS` at merge time).
- **17 subcollections are NEVER in a JSON backup** (by design):
  `users/{uid}/quizAttempts`, `users/{uid}/jobAttempts`,
  `users/{uid}/jobSessions`, `users/{uid}/jobExamAttempts`,
  `users/{uid}/jobExamSessions`, `users/{uid}/jobExamAuditLogs`,
  `users/{uid}/nuAttempts`, `users/{uid}/nuSessions`,
  `users/{uid}/gameAttempts`, `users/{uid}/userAchievements`,
  `users/{uid}/passportEntries`, `posts/{id}/comments`,
  `questions/{id}/answers`, `socialPosts/{id}/comments`,
  `competitions/{id}/entries`, `supportMessages/{thread}/messages`,
  `directMessages/{thread}/messages`.
  A student's attempts, sessions and answers live ONLY in these
  subcollections. The only complete copy is a console native export.
  The backup file's `subcollectionsIncluded: false` says so, and the
  Backup page says so in Bangla and English. Never describe a JSON
  backup as "the whole database".

## 2. Where backups live, and who may touch them

- The owner downloads the file to their own device from `/admin/backup`.
  The file contains **all student and teacher data** — never send it to
  anyone, never commit it to the public GitHub repo (`.gitignore`
  blocks `eduvelto-backup-*.json` since Step 18), keep a second copy.
- The scripted export writes to `~/workspace/eduorbit/backups/` and is
  delivered to the owner by private link only.
- Only the owner authorizes a restore. Muse never restores on its own
  initiative, never deletes anything as part of a restore, and never
  tests a restore against production data.

## 3. Triage — what broke, and which recovery point

1. **Identify the incident:** deletion (a doc/collection is gone),
   bad write (wrong data written over good data), or a bug (bad code
   wrote bad data). Write one line: what, when (Asia/Dhaka), who saw it.
2. **Freeze:** pause non-essential writes and any pending deploy that
   touches the affected collections. Do not let the app keep writing
   over the damage while you decide.
3. **Pick the recovery point:** the newest backup taken BEFORE the
   incident. Check `metadata.exportedAt` in the file header. If no
   backup predates the incident, say so honestly — there is nothing to
   restore from, and the recovery becomes "rebuild from what survives".
4. **Snapshot the current state FIRST:** run an export of the database
   as it is now (scripted export, owner's approval) and keep that file
   untouched. A restore is a merge (see §5) — without a pre-restore
   snapshot there is no way back from a bad restore.

## 4. Validate before you touch anything

1. `node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"` —
   the file must parse. A truncated download fails here, not halfway
   through a restore.
2. Run `validateBackup()` (Step 18 tests cover the rejections): it
   checks the app marker, the version, a valid `exportedAt`, header
   counts == doc counts, no duplicate ids, no unknown collections.
   **A file that fails validation is never restored.** Fix the file or
   pick another one.
3. **Complete vs incomplete:** the header's per-collection counts must
   equal the arrays in `data`. The preflight count and the export count
   are separate operations — concurrent production writes can make them
   differ slightly. Policy: if the export's own header disagrees with
   its own data, the file is incomplete — do not restore it. If the
   preflight and the export disagree but the file is internally
   consistent, note the difference in the incident log and proceed only
   if the affected collections are not the incident's collections.
4. Check coverage: every collection the incident touches must be in
   `metadata.collections`. If one is missing, the file cannot restore
   it — use the console native export for that collection, or accept
   the loss in writing.

## 5. Restore — the procedures

### 5.1 What restore CAN and CANNOT do (proven, Step 18)

| It can | It cannot |
|---|---|
| Overwrite existing docs with backup values | Delete docs that are absent from the backup — **restore is a merge, never a replacement or a rollback**. A doc created after the backup stays. |
| Recreate a deleted doc **if** its creation satisfies the security rules (drafts, notices, settings docs) | Recreate a deleted **published** content doc (question, lesson, circular) — `set()` on a missing doc is judged as `create`, and create requires draft status + full validation. Proven failing in the emulator (Step 18). |
| Restore the same file repeatedly with identical results (idempotent — proven 3x) | Bring back subcollections (see §1.3) |
| Report per-doc success/failure and stop cleanly on quota errors (`stoppedEarly` + where it stopped) | Recreate a deleted doc whose collection the owner cannot write |

### 5.2 Procedure A — targeted JSON restore (client-SDK path)

Use when: the loss is a small set of docs that satisfy the create
rules (drafts, notices, settings), or an overwrite of existing docs.

1. Complete §3 and §4 first. Keep an untouched copy of the backup file.
2. Run `restoreBackup()` from a trusted script as the owner (Muse runs
   it in the sandbox; it uses the client SDK, so the rules apply).
   Restore only the affected collections — pass the collection list,
   never the whole file, unless the whole database is the incident.
3. Read the `RestoreResult`: per-collection attempted/succeeded/failed
   + errors. Any `failed > 0` means those docs are NOT back — do not
   call the restore done.
4. Verify (§6), then log the incident (§7).

### 5.3 Procedure B — console native export / import

Use when: the loss includes deleted published content, subcollections,
or anything Procedure A reports as failed.

1. Firebase console → Firestore → **Import** — from a native console
   export (a previous native export of the same project), NOT from a
   custom JSON file. If no native export exists, there is nothing to
   import — this is why the owner should take a native export before
   any big change (owner console action; Blaze is NOT required for a
   manual console export, but managed scheduled exports are Blaze-only).
2. Import the affected collections only, if the console allows it.
3. Verify (§6), then log (§7).

### 5.4 Procedure C — Admin-SDK full restore (not built yet)

A privileged script that bypasses the rules deliberately, validates
the file with `validateBackup()`, and writes in 500-doc batches with a
per-doc report — the only path that can recreate deleted published
content from a JSON backup. **It does not exist yet** (Step 18
follow-up). Until it exists and is tested in the emulator, Procedure A
+ B are the only paths. Never improvise an Admin-SDK restore inline:
service-account keys must never enter the web app or the repo, and an
unvalidated privileged write can overwrite the whole database.

## 6. Verify the recovery

For every restored collection:

1. Doc count in Firestore == the backup file's header count for that
   collection (read the counts, do not trust the restore report alone).
2. Spot-check representative docs field-by-field — including a
   timestamp field (compare millis) and, where the collection has one,
   a nested map/array. The Step 18 round-trip test does exactly this
   in the emulator.
3. Open the affected app views (as a signed-in student where the data
   is student-facing) and confirm the content renders.
4. Check relationships: a restored question must still belong to an
   existing bundle/topic; a restored circular must still link to a
   real exam. A restore that breaks references is not a recovery.
5. Record: recovery time, backup file used (name + `exportedAt`),
   collections restored, docs restored/failed, anything still missing.

## 7. Incident log (one entry per restore)

```text
Date/time (Dhaka): 
Incident: <deletion / bad write / bug — one line>
Recovery point: <backup file name + exportedAt>
Pre-restore snapshot: <file name>
Procedure used: <A / B / C>
Collections restored: <name: attempted/succeeded/failed>
Still missing: <what, and why>
Verified by: <counts + spot-checks, §6>
```

## 8. Follow-ups (open after Step 18)

1. **Validate the real production backup** (after the 23 Nov 14:30
   cron produces it): parse it, run `validateBackup()`, compare its
   header counts against the preflight counts the cron printed, and
   spot-check that `circulars`, `jobQuestions` (35), `jobQuestionBundles`
   (13), `jobQuestionKeys` (13) and `quizKeys` (100) are present with
   the right counts. Do NOT re-export production to do this — inspect
   the existing artifact locally.
2. **Build + emulator-test the Admin-SDK restore script** (§5.4) —
   the missing piece for deleted published content.
3. **`counters` merge-time action:** when the public-ID branch merges
   (23 Nov 14:30 cron), add `counters` to `BACKUP_COLLECTIONS` and
   remove it from `BACKUP_KNOWN_PENDING`, or the Step 18 drift test
   goes red. Same for the four Step 15 collections when that branch
   merges.
4. **F-1 `friendlyAdminError`:** match on `error.code`, not
   `error.message` — today a real quota/permission failure shows the
   owner the generic "কিছু একটা ভুল হয়েছে।" instead of the specific
   text. One-line fix, needs a unit test (the Step 18 test documents
   the current behavior).
5. **F-3 `follows`:** the owner decides whether the follows read rule
   gains an `|| isAdmin()` tail. Until then it stays out of the client
   list and in the scripted export only.
6. **Reference fields:** if any live doc ever gains a reference field,
   `reviveValue()` must learn to revive `{__type: 'reference'}` or
   restores will store marker maps instead of references.
7. **Native export cadence:** take a console native export before
   every big change (it is the only copy that includes subcollections).
   It is a manual owner action — put it on the pre-deploy checklist.
```

## 9. Production safety boundary (read before any restore)

NEVER, on production: a full-database restore without a pre-restore
snapshot; delete-all-before-restore; test overwrites/deletions of real
docs; injecting corrupt test docs; destructive restore simulations;
changing production rules for testing; testing Admin-SDK credentials
against production. AVOID: disposable test collections on production,
repeated full exports (one full export is ~7,100+ reads — a handful of
unnecessary ones eats meaningful quota). All restore testing happens in
the emulator, on disposable data. The operational backup schedule is
separate from Step 18 testing and is never mixed with it.
