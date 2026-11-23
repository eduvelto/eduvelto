// Eduvelto — Backup / recovery (Step 18) emulator tests.
//
// Round-trip, pagination, idempotency, merge semantics, subcollection
// boundary, authorization, and the settings list-query probe.
//
// ALL tests run against the Firestore emulator with disposable data.
// NOTHING here touches production. The live-backup validation is a
// separate follow-up after the 23 Nov 14:30 cron produces a real file.
//
// Run with `npm run test:rules` (whole emulator-tests/ directory).
//
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  setDoc,
  writeBatch,
  Timestamp,
  GeoPoint,
  type Firestore,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BACKUP_COLLECTIONS,
  buildBackup,
  getBackupPreflight,
  restoreBackup,
  validateBackup,
  type BackupFile,
} from '../src/lib/backup';

const PROJECT_ID = 'eduvelto-rules-test-step18-backup';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('match /circulars/{circularId}')) {
  throw new Error('firestore.rules does not contain the Step 14 circulars match.');
}

const OWNER_UID = 'owner-uid';
const STUDENT_UID = 'student-uid';
const TS = (ms: number) => Timestamp.fromMillis(ms);

async function asAdmin<T>(fn: (db: Firestore) => Promise<T>): Promise<T> {
  // withSecurityRulesDisabled does NOT return the callback's value —
  // capture it through a closure. The cast is needed because
  // rules-unit-testing's firestore() returns the compat Firestore
  // type while the app code uses the modular one; at runtime they are
  // the same emulator-backed instance.
  let out!: T;
  await env.withSecurityRulesDisabled(async (ctx) => {
    out = await fn(ctx.firestore() as unknown as Firestore);
  });
  return out;
}

async function seedUsers(): Promise<void> {
  await asAdmin(async (db) => {
    await setDoc(doc(db, 'users', OWNER_UID), {
      displayName: 'Owner',
      email: 'owner@example.com',
      role: 'owner',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'users', STUDENT_UID), {
      displayName: 'Student',
      email: 'student@example.com',
      role: 'student',
      language: 'bn',
      isActive: true,
    });
  });
}

function ownerDb(): Firestore {
  return env.authenticatedContext(OWNER_UID).firestore() as unknown as Firestore;
}
function studentDb(): Firestore {
  return env.authenticatedContext(STUDENT_UID).firestore() as unknown as Firestore;
}
function guestDb(): Firestore {
  return env.unauthenticatedContext().firestore() as unknown as Firestore;
}

/** Seed one minimal doc per collection (rules-disabled). */
async function seedOnePerCollection(): Promise<void> {
  await asAdmin(async (db) => {
    const batch = writeBatch(db);
    for (const path of BACKUP_COLLECTIONS) {
      if (path === 'settings') continue; // single-doc matches — see below
      if (path === 'counters') {
        // The rules let anyone list-read ONLY counters/publicUserIds
        // (counterId == 'publicUserIds'); a seed doc under any other id
        // would make the owner's count/list on counters deny. Seed the
        // real counter doc — the only counters doc that exists live.
        batch.set(doc(db, 'counters', 'publicUserIds'), { next: 5, updatedAt: TS(0) });
        continue;
      }
      batch.set(doc(db, path, 'step18-seed'), { seededBy: 'step18-coverage', n: 1 });
    }
    batch.set(doc(db, 'settings', 'features'), { 'ai-teacher': false, updatedAt: TS(0) });
    batch.set(doc(db, 'settings', 'ads'), { 'in-feed': true, 'in-feed-2': true });
    await batch.commit();
  });
}

async function wipeCollection(path: string): Promise<void> {
  await asAdmin(async (db) => {
    const snap = await getDocs(collection(db, path));
    let batch = writeBatch(db);
    let n = 0;
    for (const d of snap.docs) {
      batch.delete(d.ref);
      if (++n % 400 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    if (n % 400 !== 0) await batch.commit();
  });
}

async function readAllAdmin(path: string): Promise<Array<Record<string, unknown>>> {
  return asAdmin(async (db) => {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
}

/** Timestamp/GeoPoint-aware normalisation for deep comparison. */
function norm(v: unknown): unknown {
  if (v instanceof Timestamp) return { __millis: v.toMillis() };
  if (v instanceof GeoPoint) return { __lat: v.latitude, __lng: v.longitude };
  if (Array.isArray(v)) return v.map(norm);
  if (typeof v === 'object' && v !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = norm(val);
    return out;
  }
  return v;
}

function circularDoc(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    examSlug: 'bcs',
    postTitleBn: '৪৭তম বিসিএস — সাধারণ ক্যাডার',
    postTitleEn: '47th BCS — General Cadre',
    circularNumber: '47',
    publishedDate: TS(Date.UTC(2026, 11, 1, 6, 0, 0)),
    applicationDeadline: TS(Date.UTC(2026, 11, 15, 12, 0, 0)),
    deadlinePrecision: 'datetime',
    totalPosts: 100,
    eligibilitySummaryBn: 'স্নাতক ডিগ্রি; বয়স ও বিস্তারিত যোগ্যতা মূল বিজ্ঞপ্তিতে দেখুন।',
    eligibilitySummaryEn: 'Bachelor degree; see the original circular for age and full eligibility.',
    officialUrl: 'https://bpsc.gov.bd/circular/47',
    applyUrl: 'https://bpsc.teletalk.com.bd',
    copyStatus: 'link-only',
    copyTextExcerpt: null,
    reviewStatus: 'draft',
    verifiedBy: null,
    verifiedAt: null,
    examDate: TS(Date.UTC(2027, 0, 10, 6, 0, 0)),
    applicationStartDate: TS(Date.UTC(2026, 11, 1, 6, 0, 0)),
    authorId: OWNER_UID,
    createdAt: TS(Date.UTC(2026, 11, 1, 6, 0, 0)),
    updatedAt: TS(Date.UTC(2026, 11, 5, 6, 0, 0)),
    ...overrides,
  };
}

describe('Step 18 — backup / recovery (emulator)', () => {
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: RULES_TEXT,
        host: '127.0.0.1',
        port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080),
      },
    });
  }, 120_000);

  afterAll(async () => {
    if (env) await env.cleanup();
  });

  beforeEach(async () => {
    await env.clearFirestore();
    await seedUsers();
  });

  it('settings: a collection list/count query is denied for the owner, single-doc reads work (F-2 probe)', async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, 'settings', 'features'), { 'ai-teacher': false, updatedAt: TS(0) });
      await setDoc(doc(db, 'settings', 'ads'), { 'in-feed': true, 'in-feed-2': true });
    });
    const db = ownerDb();
    // settings has only single-doc matches (/settings/features,
    // /settings/ads) — no collection-level match. A bare list query
    // over the collection cannot be proven safe, so it is denied.
    await assertFails(getDocs(collection(db, 'settings')));
    await assertFails(getCountFromServer(collection(db, 'settings')));
    // The single-doc reads the rules DO allow keep working.
    await assertSucceeds(getDoc(doc(db, 'settings', 'features')));
    await assertSucceeds(getDoc(doc(db, 'settings', 'ads')));
  });

  it('owner can export every BACKUP_COLLECTIONS entry — coverage proof (BRT-01)', async () => {
    await seedOnePerCollection();
    const db = ownerDb();
    const preflight = await getBackupPreflight(db);
    // 80 collections x 1 doc (81 minus settings) + users x 3 (owner +
    // student + the coverage seed doc) + settings x 2 (features + ads)
    // = 84 docs. (Staging: 79 — the list grew by 5 at the merge:
    // counters + the four Step 15 admin collections.)
    expect(preflight.total).toBe(84);
    expect(preflight.perCollection).toHaveLength(BACKUP_COLLECTIONS.length);
    expect(preflight.readsPercent).toBeCloseTo(84 / 500, 5);
    const backup = await buildBackup(db, OWNER_UID);
    expect(validateBackup(backup).ok).toBe(true);
    expect(Object.keys(backup.data).sort()).toEqual([...BACKUP_COLLECTIONS].sort());
    for (const path of BACKUP_COLLECTIONS) {
      const expected = path === 'users' ? 3 : path === 'settings' ? 2 : 1;
      expect(backup.data[path], `${path} should export ${expected} doc(s)`).toHaveLength(expected);
    }
    expect(backup.metadata.collections.users).toBe(3);
    expect(backup.metadata.collections.settings).toBe(2);
    expect(backup.metadata.subcollectionsIncluded).toBe(false);
  }, 180_000);

  it('round-trip restores notices + circulars exactly, types intact (BRT-01/02/03)', async () => {
    const db = ownerDb();
    const notices = [
      {
        id: 'rt-1',
        title: 'Notice one',
        body: 'Body one',
        reviewStatus: 'Under Review',
        createdAt: TS(Date.UTC(2026, 11, 20, 6, 0, 0)),
        location: new GeoPoint(21.43, 92.01),
        meta: { priority: 2, tags: ['a', 'b'], flag: true, note: null, score: 4.5 },
      },
      {
        id: 'rt-2',
        title: 'Notice two',
        body: 'Body two',
        reviewStatus: 'Under Review',
        createdAt: TS(Date.UTC(2026, 11, 21, 6, 0, 0)),
        location: new GeoPoint(23.81, 90.41),
        meta: { priority: 1, tags: [], flag: false, note: 'x', score: 0 },
      },
      {
        id: 'rt-3',
        title: 'Notice three',
        body: 'Body three',
        reviewStatus: 'Under Review',
      },
    ];
    const circulars = [
      { id: 'rt-circ-1', ...circularDoc({}) },
      { id: 'rt-circ-2', ...circularDoc({ examSlug: 'bank', circularNumber: '48' }) },
    ];
    await asAdmin(async (adb) => {
      const batch = writeBatch(adb);
      for (const n of notices) {
        const { id, ...fields } = n;
        batch.set(doc(adb, 'notices', id), fields);
      }
      for (const c of circulars) {
        const { id, ...fields } = c;
        batch.set(doc(adb, 'circulars', id), fields);
      }
      await batch.commit();
    });
    const backup = await buildBackup(db, OWNER_UID, ['notices', 'circulars']);
    expect(validateBackup(backup).ok).toBe(true);
    expect(backup.metadata.collections).toEqual({ notices: 3, circulars: 2 });

    await wipeCollection('notices');
    await wipeCollection('circulars');
    expect(await readAllAdmin('notices')).toHaveLength(0);
    expect(await readAllAdmin('circulars')).toHaveLength(0);

    const result = await restoreBackup(db, backup);
    expect(result.stoppedEarly).toBe(false);
    expect(result.skippedUnknownCollections).toEqual([]);
    const byCollection = new Map(result.reports.map((r) => [r.collection, r]));
    expect(byCollection.get('notices')).toMatchObject({ attempted: 3, succeeded: 3, failed: 0 });
    expect(byCollection.get('circulars')).toMatchObject({ attempted: 2, succeeded: 2, failed: 0 });

    const restoredNotices = await readAllAdmin('notices');
    const restoredCirculars = await readAllAdmin('circulars');
    expect(restoredNotices.map((d) => d.id).sort()).toEqual(['rt-1', 'rt-2', 'rt-3']);
    expect(restoredCirculars.map((d) => d.id).sort()).toEqual(['rt-circ-1', 'rt-circ-2']);
    const n1 = restoredNotices.find((d) => d.id === 'rt-1') as Record<string, unknown>;
    expect(norm(n1.createdAt)).toEqual({ __millis: Date.UTC(2026, 11, 20, 6, 0, 0) });
    expect(norm(n1.location)).toEqual({ __lat: 21.43, __lng: 92.01 });
    expect(norm(n1.meta)).toEqual({
      priority: 2,
      tags: ['a', 'b'],
      flag: true,
      note: null,
      score: 4.5,
    });
    const c1 = restoredCirculars.find((d) => d.id === 'rt-circ-1') as Record<string, unknown>;
    expect(c1.examSlug).toBe('bcs');
    expect(norm(c1.applicationDeadline)).toEqual({ __millis: Date.UTC(2026, 11, 15, 12, 0, 0) });
  }, 120_000);

  it('pagination: 1,250 notices export whole, 500/501 boundaries exact (BRT-02)', async () => {
    const db = ownerDb();
    await asAdmin(async (adb) => {
      for (let start = 0; start < 1250; start += 500) {
        const batch = writeBatch(adb);
        for (let i = start; i < Math.min(start + 500, 1250); i++) {
          batch.set(doc(adb, 'notices', `pg-${i}`), {
            title: `Notice ${i}`,
            body: 'paged',
            reviewStatus: 'Under Review',
          });
        }
        await batch.commit();
      }
      for (let start = 0; start < 500; start += 500) {
        const batch = writeBatch(adb);
        for (let i = start; i < Math.min(start + 500, 500); i++) {
          batch.set(doc(adb, 'games', `b500-${i}`), { seededBy: 'step18' });
        }
        await batch.commit();
      }
      for (let start = 0; start < 501; start += 500) {
        const batch = writeBatch(adb);
        for (let i = start; i < Math.min(start + 500, 501); i++) {
          batch.set(doc(adb, 'circulars', `b501-${i}`), circularDoc({ examSlug: 'bcs' }));
        }
        await batch.commit();
      }
    });
    const backup = await buildBackup(db, OWNER_UID, ['notices', 'games', 'circulars']);
    expect(backup.data.notices).toHaveLength(1250);
    expect(new Set(backup.data.notices.map((d) => d.id)).size).toBe(1250);
    expect(backup.data.games).toHaveLength(500);
    expect(backup.data.circulars).toHaveLength(501);
    const preflight = await getBackupPreflight(db, ['notices', 'games', 'circulars']);
    expect(preflight.perCollection.find((c) => c.path === 'notices')?.count).toBe(1250);
    expect(preflight.perCollection.find((c) => c.path === 'games')?.count).toBe(500);
    expect(preflight.perCollection.find((c) => c.path === 'circulars')?.count).toBe(501);
  }, 180_000);

  it('idempotency: restoring the same backup 3x is stable, stale edits are overwritten (BRT-05)', async () => {
    const db = ownerDb();
    await asAdmin(async (adb) => {
      await setDoc(doc(adb, 'notices', 'idem-1'), {
        title: 'Original',
        body: 'v1',
        reviewStatus: 'Under Review',
      });
    });
    const backup = await buildBackup(db, OWNER_UID, ['notices']);
    for (let round = 0; round < 3; round++) {
      const r = await restoreBackup(db, backup);
      expect(r.stoppedEarly).toBe(false);
      expect(r.reports[0]).toMatchObject({ attempted: 1, succeeded: 1, failed: 0 });
      expect(await readAllAdmin('notices')).toHaveLength(1);
    }
    await asAdmin(async (adb) => {
      await setDoc(
        doc(adb, 'notices', 'idem-1'),
        { title: 'STALE EDIT', body: 'v2', reviewStatus: 'Under Review' },
        { merge: true },
      );
    });
    await restoreBackup(db, backup);
    const after = await readAllAdmin('notices');
    expect(after[0].title).toBe('Original');
    expect(after[0].body).toBe('v1');
  }, 120_000);

  it('merge semantics: restore leaves docs absent from the backup alone', async () => {
    const db = ownerDb();
    await asAdmin(async (adb) => {
      const batch = writeBatch(adb);
      for (const id of ['m-a', 'm-b', 'm-c']) {
        batch.set(doc(adb, 'notices', id), { title: id, body: 'live', reviewStatus: 'Under Review' });
      }
      await batch.commit();
    });
    const file: BackupFile = {
      metadata: {
        app: 'Eduvelto',
        backupVersion: 1,
        exportedAt: new Date().toISOString(),
        exportedBy: OWNER_UID,
        collections: { notices: 3 },
        subcollectionsIncluded: false,
      },
      data: {
        notices: [
          { id: 'm-a', title: 'm-a', body: 'live', reviewStatus: 'Under Review' },
          { id: 'm-b', title: 'm-b', body: 'live', reviewStatus: 'Under Review' },
          { id: 'm-d', title: 'm-d', body: 'from-backup', reviewStatus: 'Under Review' },
        ],
      },
    };
    const r = await restoreBackup(db, file);
    expect(r.reports[0]).toMatchObject({ attempted: 3, succeeded: 3, failed: 0 });
    const after = (await readAllAdmin('notices')).map((d) => d.id as string).sort();
    // m-c was never in the backup and is NOT deleted: restore is a
    // merge, never a replacement or a rollback.
    expect(after).toEqual(['m-a', 'm-b', 'm-c', 'm-d']);
  }, 60_000);

  it('subcollections are excluded by design (BRT-04)', async () => {
    await asAdmin(async (adb) => {
      const batch = writeBatch(adb);
      batch.set(doc(adb, 'users', 'u1'), { displayName: 'U1', role: 'student' });
      batch.set(doc(adb, 'users', 'u1', 'jobAttempts', 'a1'), { bundleId: 'b1', status: 'submitted' });
      batch.set(doc(adb, 'posts', 'p1'), { title: 'Post', reviewStatus: 'Published' });
      batch.set(doc(adb, 'posts', 'p1', 'comments', 'c1'), { body: 'hello' });
      await batch.commit();
    });
    const backup = await buildBackup(ownerDb(), OWNER_UID, ['users', 'posts']);
    expect(Object.keys(backup.data).sort()).toEqual(['posts', 'users']);
    expect(backup.data.users.map((d) => d.id)).toContain('u1');
    expect(backup.data.posts.map((d) => d.id)).toContain('p1');
    // No subcollection payload exists anywhere in the file.
    expect(JSON.stringify(backup)).not.toContain('jobAttempts');
    expect(JSON.stringify(backup)).not.toContain('"a1"');
    expect(JSON.stringify(backup)).not.toContain('"c1"');
  }, 60_000);

  it('export authorization: guest + student denied, owner allowed (BRT-09)', async () => {
    await seedOnePerCollection();
    await expect(buildBackup(guestDb(), 'nobody')).rejects.toThrow();
    await expect(buildBackup(studentDb(), STUDENT_UID)).rejects.toThrow();
    await expect(getBackupPreflight(studentDb())).rejects.toThrow();
    const ok = await buildBackup(ownerDb(), OWNER_UID, ['notices']);
    expect(ok.data.notices).toHaveLength(1);
  }, 120_000);

  it('restore authorization: a student restore fails per-doc and writes nothing (BRT-09/10)', async () => {
    const file: BackupFile = {
      metadata: {
        app: 'Eduvelto',
        backupVersion: 1,
        exportedAt: new Date().toISOString(),
        exportedBy: OWNER_UID,
        collections: { notices: 1 },
        subcollectionsIncluded: false,
      },
      data: {
        notices: [{ id: 'auth-1', title: 'Nope', body: 'x', reviewStatus: 'Under Review' }],
      },
    };
    const r = await restoreBackup(studentDb(), file);
    expect(r.stoppedEarly).toBe(false);
    expect(r.reports[0]).toMatchObject({ attempted: 1, succeeded: 0, failed: 1 });
    expect(r.reports[0].errors.length).toBeGreaterThan(0);
    expect(await readAllAdmin('notices')).toHaveLength(0);
  }, 60_000);

  it('a deleted published jobQuestion cannot be restored by the client (documented limit)', async () => {
    const file: BackupFile = {
      metadata: {
        app: 'Eduvelto',
        backupVersion: 1,
        exportedAt: new Date().toISOString(),
        exportedBy: OWNER_UID,
        collections: { jobQuestions: 1 },
        subcollectionsIncluded: false,
      },
      data: {
        jobQuestions: [
          {
            id: 'q-step18',
            examSlug: 'bcs',
            subjectSlug: 'english',
            topicSlug: 'tense',
            questionBn: 'He ___ to school every day.',
            options: ['go', 'goes', 'going', 'gone'],
            answerIndex: 1,
            explanationBn: 'Third person singular.',
            difficulty: 'medium',
            status: 'published',
            reviewStatus: 'Published',
            authorId: OWNER_UID,
          },
        ],
      },
    };
    expect(validateBackup(file).ok).toBe(true);
    const r = await restoreBackup(ownerDb(), file);
    // set() on the missing doc is judged as CREATE, and create
    // requires a draft + the full bank validation — a published doc
    // fails it. The failure is reported per-doc; nothing is written.
    expect(r.reports[0]).toMatchObject({ attempted: 1, succeeded: 0, failed: 1 });
    expect(r.reports[0].errors.length).toBeGreaterThan(0);
    expect(await readAllAdmin('jobQuestions')).toHaveLength(0);
  }, 60_000);

  it('directMessages cannot be list-read by the owner (exclusion proof)', async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, 'directMessages', 'dm-1'), {
        participants: [STUDENT_UID, 'other-uid'],
        createdAt: TS(0),
      });
    });
    await assertFails(getDocs(collection(ownerDb(), 'directMessages')));
  }, 60_000);

  it('an invalid file is rejected before any write happens', async () => {
    await asAdmin(async (db) => {
      await setDoc(doc(db, 'notices', 'keep-1'), {
        title: 'Keep me',
        body: 'x',
        reviewStatus: 'Under Review',
      });
    });
    const bad = {
      metadata: {
        app: 'Eduvelto',
        backupVersion: 1,
        exportedAt: new Date().toISOString(),
        exportedBy: OWNER_UID,
        collections: { notices: 2 },
        subcollectionsIncluded: false,
      },
      data: { notices: [{ id: 'keep-1', title: 'Keep me', body: 'x', reviewStatus: 'Under Review' }] },
    };
    await expect(restoreBackup(ownerDb(), bad as unknown as BackupFile)).rejects.toThrow(
      /invalid-backup/,
    );
    // Nothing was written or deleted: the pre-existing doc is untouched.
    const after = await readAllAdmin('notices');
    expect(after).toHaveLength(1);
    expect(after[0].title).toBe('Keep me');
  }, 60_000);
});
