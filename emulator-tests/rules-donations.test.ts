// Eduvelto Firestore security-rules tests — donations
// (Phase 3, 25 Nov 2026, "Support Eduvelto").
//
// Proves the /donations rules added for the Support page:
//   create: anyone (signed-out included) with exactly
//           {name, amount, trxId, createdAt} — name 1–100 chars,
//           amount a positive number up to ৳10,000,000,
//           TrxID 1–50 chars, createdAt a timestamp; no phone /
//           email / extra field is accepted;
//   read:   PUBLIC — the Supporters Wall (name + amount only;
//           the UI never renders the TrxID);
//   update/delete: nobody through the client.
//
// Run with `npm run test:rules` (whole emulator-tests/ directory)
// or this file alone under `firebase emulators:exec`. Same
// conventions as rules-newsletter.test.ts: the emulator loads
// firestore.rules from firebase.json at startup; own project id
// so it never shares data with the other suites.

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-donations';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}
if (!RULES_TEXT.includes('match /donations/{donationId}')) {
  throw new Error('firestore.rules has no /donations match block — the Support page needs it.');
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role, extra] of [
      ['admin-1', 'admin', {}],
      ['student-1', 'student', {}],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
        ...extra,
      });
    }
    await setDoc(doc(db, 'donations', 'don-1'), {
      name: 'First Supporter',
      amount: 500,
      trxId: '9HX7K2M4P1',
      createdAt: serverTimestamp(),
    });
  });
}

beforeAll(async () => {
  const hostVar = process.env.FIRESTORE_EMULATOR_HOST ?? '';
  const port = hostVar.includes(':')
    ? Number(hostVar.split(':').pop())
    : Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080);
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port },
  });
  await seed();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore(), 'users', 'admin-1'));
    if (!snap.exists()) throw new Error('seed failed: users/admin-1 missing in the emulator');
    const don = await getDoc(doc(ctx.firestore(), 'donations', 'don-1'));
    if (!don.exists()) throw new Error('seed failed: donations/don-1 missing in the emulator');
  });
}, 300000);

afterAll(async () => {
  await env.cleanup();
});

const asStudent = () => env.authenticatedContext('student-1').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asUnauth = () => env.unauthenticatedContext().firestore();

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Rahim Uddin',
    amount: 500,
    trxId: '9HX7K2M4P1',
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

describe('donations — create', () => {
  it('(d1) a signed-out visitor can record a valid donation', async () => {
    await assertSucceeds(addDoc(collection(asUnauth(), 'donations'), validPayload()));
  });

  it('(d2) a signed-in student can record a valid donation', async () => {
    await assertSucceeds(
      addDoc(collection(asStudent(), 'donations'), validPayload({ name: 'Karim', trxId: 'ABC1234567' })),
    );
  });

  it('(d3) an empty or over-long name is denied', async () => {
    await assertFails(addDoc(collection(asUnauth(), 'donations'), validPayload({ name: '' })));
    await assertFails(addDoc(collection(asUnauth(), 'donations'), validPayload({ name: 'ক'.repeat(101) })));
  });

  it('(d4) a non-positive, non-numeric or over-limit amount is denied', async () => {
    await assertFails(addDoc(collection(asUnauth(), 'donations'), validPayload({ amount: 0 })));
    await assertFails(addDoc(collection(asUnauth(), 'donations'), validPayload({ amount: -100 })));
    await assertFails(addDoc(collection(asUnauth(), 'donations'), validPayload({ amount: '500' })));
    await assertFails(addDoc(collection(asUnauth(), 'donations'), validPayload({ amount: 10_000_001 })));
  });

  it('(d5) an empty or over-long TrxID is denied', async () => {
    await assertFails(addDoc(collection(asUnauth(), 'donations'), validPayload({ trxId: '' })));
    await assertFails(addDoc(collection(asUnauth(), 'donations'), validPayload({ trxId: 'X'.repeat(51) })));
  });

  it('(d6) createdAt must be a timestamp', async () => {
    await assertFails(
      addDoc(collection(asUnauth(), 'donations'), validPayload({ createdAt: '2026-11-25' })),
    );
  });

  it('(d7) extra fields are denied — no phone, no email, no role', async () => {
    await assertFails(
      addDoc(collection(asUnauth(), 'donations'), validPayload({ phone: '+8801700000000' })),
    );
    await assertFails(
      addDoc(collection(asUnauth(), 'donations'), validPayload({ email: 'donor@example.com' })),
    );
    await assertFails(addDoc(collection(asUnauth(), 'donations'), validPayload({ isAdmin: true })));
  });
});

describe('donations — read / update / delete', () => {
  it('(d8) a signed-out visitor can read the wall (single doc + list)', async () => {
    const snap = await assertSucceeds(getDoc(doc(asUnauth(), 'donations', 'don-1')));
    expect(snap.data()?.name).toBe('First Supporter');
    const list = await assertSucceeds(getDocs(collection(asUnauth(), 'donations')));
    expect(list.docs.length).toBeGreaterThanOrEqual(1);
  });

  it('(d9) a signed-in student can read the wall', async () => {
    const snap = await assertSucceeds(getDoc(doc(asStudent(), 'donations', 'don-1')));
    expect(snap.data()?.amount).toBe(500);
  });

  it('(d10) nobody can update or delete through the client', async () => {
    await assertFails(updateDoc(doc(asAdmin(), 'donations', 'don-1'), { amount: 1 }));
    await assertFails(deleteDoc(doc(asAdmin(), 'donations', 'don-1')));
    await assertFails(updateDoc(doc(asUnauth(), 'donations', 'don-1'), { amount: 1 }));
    await assertFails(deleteDoc(doc(asUnauth(), 'donations', 'don-1')));
  });
});
