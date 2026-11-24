// Eduvelto — Owner 2FA rules tests (23 Nov 2026, staging).
//
// Covers the /ownerSecurity rules delta:
// (o1–o5) ownerSecurity doc — owner CRUD on his OWN doc only, valid
// shape only; cross-uid denied; list denied by design.
// (h1–h5) loginHistory — owner create/read/list/delete on his own
// entries; append-only (update never); invalid shape rejected.
// (b1–b5) backupCodes — owner create/read/delete on his own hashes;
// immutable (update never); invalid shape rejected.
// (g1–g4) role gates — student/admin/moderator/guest cannot touch
// any ownerSecurity doc, even their own UID's.
//
// Run with `npm run test:rules` (whole emulator-tests/ directory), or
// a single file under emulators:exec (see team/2fa-preparation file).
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
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
  query,
  setDoc,
  Timestamp,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-owner-2fa';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('match /ownerSecurity/{ownerId}')) {
  throw new Error('firestore.rules does not contain the ownerSecurity match.');
}
if (!RULES_TEXT.includes('match /loginHistory/{entryId}')) {
  throw new Error('firestore.rules does not contain the loginHistory match.');
}
if (!RULES_TEXT.includes('match /backupCodes/{codeHash}')) {
  throw new Error('firestore.rules does not contain the backupCodes match.');
}

const TS = (ms: number) => Timestamp.fromMillis(ms);
const NOW = Date.UTC(2026, 11, 23, 12, 0, 0);

function securityDoc(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    lastLoginAt: TS(NOW),
    knownDeviceIds: ['d0123456789abcdef'],
    updatedAt: TS(NOW),
    ...overrides,
  };
}

function historyEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    createdAt: TS(NOW),
    deviceId: 'd0123456789abcdef',
    userAgent: 'TestAgent/1.0',
    isNewDevice: true,
    ...overrides,
  };
}

function backupCodeDoc(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    salt: '0123456789abcdef',
    createdAt: TS(NOW),
    ...overrides,
  };
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['student-1', 'student'],
      ['moderator-1', 'moderator'],
      ['admin-1', 'admin'],
      ['owner-1', 'owner'],
      ['owner-2', 'owner'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
      });
    }
    await setDoc(doc(db, 'ownerSecurity', 'owner-1'), securityDoc({}));
    await setDoc(
      doc(db, 'ownerSecurity', 'owner-1', 'loginHistory', 'entry-seed'),
      historyEntry({}),
    );
    await setDoc(
      doc(db, 'ownerSecurity', 'owner-1', 'backupCodes', 'a'.repeat(64)),
      backupCodeDoc({}),
    );
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES_TEXT, host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await seed();
}, 120000);

afterAll(async () => {
  await env?.clearFirestore();
  await env?.cleanup();
});

const asGuest = () => env.unauthenticatedContext().firestore();
const asStudent = (uid = 'student-1') => env.authenticatedContext(uid).firestore();
const asModerator = (uid = 'moderator-1') => env.authenticatedContext(uid).firestore();
const asAdmin = (uid = 'admin-1') => env.authenticatedContext(uid).firestore();
const asOwner = (uid = 'owner-1') => env.authenticatedContext(uid).firestore();

describe('ownerSecurity doc (o1–o5)', () => {
  it('o1: owner reads his own security doc', async () => {
    const snap = await assertSucceeds(getDoc(doc(asOwner(), 'ownerSecurity', 'owner-1')));
    expect(snap.exists()).toBe(true);
  });

  it('o2: owner creates + updates his own doc with a valid shape', async () => {
    await assertSucceeds(
      setDoc(doc(asOwner('owner-2'), 'ownerSecurity', 'owner-2'), securityDoc({})),
    );
    await assertSucceeds(
      updateDoc(doc(asOwner('owner-2'), 'ownerSecurity', 'owner-2'), {
        knownDeviceIds: ['d0123456789abcdef', 'dffffffffffffffff'],
      }),
    );
  });

  it('o3: owner cannot write a doc with an unknown field', async () => {
    await assertFails(
      setDoc(doc(asOwner(), 'ownerSecurity', 'owner-1'), securityDoc({ password: 'x' })),
    );
  });

  it('o4: owner cannot write knownDeviceIds as a non-list', async () => {
    await assertFails(
      setDoc(doc(asOwner(), 'ownerSecurity', 'owner-1'), securityDoc({ knownDeviceIds: 'd0123' })),
    );
  });

  it('o5: list over the top-level collection is denied even for the owner', async () => {
    await assertFails(getDocs(query(collection(asOwner(), 'ownerSecurity'))));
  });
});

describe('loginHistory (h1–h5)', () => {
  it('h1: owner lists his own login history', async () => {
    const snap = await assertSucceeds(
      getDocs(query(collection(asOwner(), 'ownerSecurity', 'owner-1', 'loginHistory'))),
    );
    expect(snap.size).toBeGreaterThanOrEqual(1);
  });

  it('h2: owner creates a valid history entry', async () => {
    await assertSucceeds(
      setDoc(
        doc(asOwner(), 'ownerSecurity', 'owner-1', 'loginHistory', 'entry-new'),
        historyEntry({ isNewDevice: false }),
      ),
    );
  });

  it('h3: history entry with a missing field is rejected', async () => {
    const bad = historyEntry({});
    delete bad.isNewDevice;
    await assertFails(
      setDoc(doc(asOwner(), 'ownerSecurity', 'owner-1', 'loginHistory', 'entry-bad'), bad),
    );
  });

  it('h4: history entries are append-only — update is never allowed', async () => {
    await assertFails(
      updateDoc(doc(asOwner(), 'ownerSecurity', 'owner-1', 'loginHistory', 'entry-seed'), {
        isNewDevice: false,
      }),
    );
  });

  it('h5: owner can delete his own history entry', async () => {
    await assertSucceeds(
      setDoc(doc(asOwner(), 'ownerSecurity', 'owner-1', 'loginHistory', 'entry-del'), historyEntry({})),
    );
    await assertSucceeds(
      deleteDoc(doc(asOwner(), 'ownerSecurity', 'owner-1', 'loginHistory', 'entry-del')),
    );
  });
});

describe('backupCodes (b1–b5)', () => {
  it('b1: owner reads his own backup-code hash', async () => {
    const snap = await assertSucceeds(
      getDoc(doc(asOwner(), 'ownerSecurity', 'owner-1', 'backupCodes', 'a'.repeat(64))),
    );
    expect(snap.exists()).toBe(true);
  });

  it('b2: owner creates a valid hash doc', async () => {
    await assertSucceeds(
      setDoc(
        doc(asOwner(), 'ownerSecurity', 'owner-1', 'backupCodes', 'b'.repeat(64)),
        backupCodeDoc({}),
      ),
    );
  });

  it('b3: hash doc without a salt is rejected', async () => {
    const bad = backupCodeDoc({});
    delete bad.salt;
    await assertFails(
      setDoc(doc(asOwner(), 'ownerSecurity', 'owner-1', 'backupCodes', 'c'.repeat(64)), bad),
    );
  });

  it('b4: hash docs are immutable — update is never allowed', async () => {
    await assertFails(
      updateDoc(doc(asOwner(), 'ownerSecurity', 'owner-1', 'backupCodes', 'a'.repeat(64)), {
        salt: 'ffffffffffffffff',
      }),
    );
  });

  it('b5: owner deletes (consumes) his own hash doc', async () => {
    await assertSucceeds(
      setDoc(
        doc(asOwner(), 'ownerSecurity', 'owner-1', 'backupCodes', 'd'.repeat(64)),
        backupCodeDoc({}),
      ),
    );
    await assertSucceeds(
      deleteDoc(doc(asOwner(), 'ownerSecurity', 'owner-1', 'backupCodes', 'd'.repeat(64))),
    );
  });
});

describe('role gates (g1–g4)', () => {
  it('g1: an owner cannot read or write ANOTHER owner’s security doc', async () => {
    await assertFails(getDoc(doc(asOwner('owner-2'), 'ownerSecurity', 'owner-1')));
    await assertFails(
      setDoc(doc(asOwner('owner-2'), 'ownerSecurity', 'owner-1'), securityDoc({})),
    );
    await assertFails(
      getDocs(query(collection(asOwner('owner-2'), 'ownerSecurity', 'owner-1', 'loginHistory'))),
    );
  });

  it('g2: a student cannot touch ownerSecurity even with his own UID as doc id', async () => {
    await assertFails(getDoc(doc(asStudent(), 'ownerSecurity', 'student-1')));
    await assertFails(
      setDoc(doc(asStudent(), 'ownerSecurity', 'student-1'), securityDoc({})),
    );
  });

  it('g3: admin and moderator cannot read the owner’s security doc', async () => {
    await assertFails(getDoc(doc(asAdmin(), 'ownerSecurity', 'owner-1')));
    await assertFails(getDoc(doc(asModerator(), 'ownerSecurity', 'owner-1')));
    await assertFails(
      setDoc(doc(asAdmin(), 'ownerSecurity', 'owner-1'), securityDoc({})),
    );
  });

  it('g4: a guest cannot read anything under ownerSecurity', async () => {
    await assertFails(getDoc(doc(asGuest(), 'ownerSecurity', 'owner-1')));
    await assertFails(
      getDocs(query(collection(asGuest(), 'ownerSecurity', 'owner-1', 'loginHistory'))),
    );
  });
});
