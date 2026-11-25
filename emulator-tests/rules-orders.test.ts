// Eduvelto Firestore security-rules tests — orders
// (Phase 3, 25 Nov 2026, ৳149 suggestion PDF).
//
// Proves the /orders rules added for the suggestion-PDF card:
//   create: signed-in, ACTIVE buyer only, userId == uid, exactly
//           {userId, productId, amount, trxId, status, createdAt}
//           with productId ALWAYS 'suggestion-pdf', amount ALWAYS
//           149, status ALWAYS 'pending', TrxID 1–50 chars,
//           createdAt a timestamp; no extra field accepted;
//   read:   NO public read — owner/admin read all; a buyer reads
//           only their own orders (single-doc), never a list;
//   update/delete: nobody through the client.
//
// Run with `npm run test:rules` (whole emulator-tests/ directory)
// or this file alone under `firebase emulators:exec`. Same
// conventions as rules-donations.test.ts: the emulator loads
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

const PROJECT_ID = 'eduvelto-rules-test-orders';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}
if (!RULES_TEXT.includes('match /orders/{orderId}')) {
  throw new Error('firestore.rules has no /orders match block — the suggestion-PDF card needs it.');
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role, extra] of [
      ['admin-1', 'admin', {}],
      ['student-1', 'student', {}],
      ['suspended-1', 'student', { isActive: false }],
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
    await setDoc(doc(db, 'orders', 'ord-1'), {
      userId: 'student-1',
      productId: 'suggestion-pdf',
      amount: 149,
      trxId: '9HX7K2M4P1',
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'orders', 'ord-2'), {
      userId: 'other-1',
      productId: 'suggestion-pdf',
      amount: 149,
      trxId: 'ABC1234567',
      status: 'pending',
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
    const ord = await getDoc(doc(ctx.firestore(), 'orders', 'ord-1'));
    if (!ord.exists()) throw new Error('seed failed: orders/ord-1 missing in the emulator');
  });
}, 300000);

afterAll(async () => {
  await env.cleanup();
});

const asStudent = () => env.authenticatedContext('student-1').firestore();
const asSuspended = () => env.authenticatedContext('suspended-1').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asUnauth = () => env.unauthenticatedContext().firestore();

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'student-1',
    productId: 'suggestion-pdf',
    amount: 149,
    trxId: '9HX7K2M4P1',
    status: 'pending',
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

describe('orders — create', () => {
  it('(o1) a signed-in student can order their own ৳149 PDF', async () => {
    await assertSucceeds(addDoc(collection(asStudent(), 'orders'), validPayload()));
  });

  it('(o2) a signed-out visitor cannot order', async () => {
    await assertFails(addDoc(collection(asUnauth(), 'orders'), validPayload()));
  });

  it('(o3) userId must be the caller', async () => {
    await assertFails(addDoc(collection(asStudent(), 'orders'), validPayload({ userId: 'admin-1' })));
    await assertFails(addDoc(collection(asStudent(), 'orders'), validPayload({ userId: 'other-1' })));
  });

  it('(o4) productId must be suggestion-pdf, amount must be 149, status must be pending', async () => {
    await assertFails(addDoc(collection(asStudent(), 'orders'), validPayload({ productId: 'other-pdf' })));
    await assertFails(addDoc(collection(asStudent(), 'orders'), validPayload({ amount: 100 })));
    await assertFails(addDoc(collection(asStudent(), 'orders'), validPayload({ amount: 150 })));
    await assertFails(addDoc(collection(asStudent(), 'orders'), validPayload({ status: 'paid' })));
  });

  it('(o5) an empty or over-long TrxID is denied; createdAt must be a timestamp', async () => {
    await assertFails(addDoc(collection(asStudent(), 'orders'), validPayload({ trxId: '' })));
    await assertFails(addDoc(collection(asStudent(), 'orders'), validPayload({ trxId: 'X'.repeat(51) })));
    await assertFails(
      addDoc(collection(asStudent(), 'orders'), validPayload({ createdAt: '2026-11-25' })),
    );
  });

  it('(o6) extra fields are denied', async () => {
    await assertFails(addDoc(collection(asStudent(), 'orders'), validPayload({ phone: '+8801700000000' })));
    await assertFails(addDoc(collection(asStudent(), 'orders'), validPayload({ note: 'urgent' })));
  });

  it('(o7) a suspended buyer cannot order', async () => {
    await assertFails(
      addDoc(collection(asSuspended(), 'orders'), validPayload({ userId: 'suspended-1' })),
    );
  });
});

describe('orders — read / update / delete', () => {
  it('(o8) an admin can read a single order and list orders', async () => {
    const snap = await assertSucceeds(getDoc(doc(asAdmin(), 'orders', 'ord-1')));
    expect(snap.data()?.userId).toBe('student-1');
    const list = await assertSucceeds(getDocs(collection(asAdmin(), 'orders')));
    expect(list.docs.length).toBeGreaterThanOrEqual(2);
  });

  it('(o9) a buyer reads only their own order — never another buyer’s, never a list', async () => {
    const own = await assertSucceeds(getDoc(doc(asStudent(), 'orders', 'ord-1')));
    expect(own.data()?.amount).toBe(149);
    await assertFails(getDoc(doc(asStudent(), 'orders', 'ord-2')));
    await assertFails(getDocs(collection(asStudent(), 'orders')));
  });

  it('(o10) a signed-out visitor cannot read any order', async () => {
    await assertFails(getDoc(doc(asUnauth(), 'orders', 'ord-1')));
    await assertFails(getDocs(collection(asUnauth(), 'orders')));
  });

  it('(o11) nobody can update or delete through the client', async () => {
    await assertFails(updateDoc(doc(asAdmin(), 'orders', 'ord-1'), { status: 'paid' }));
    await assertFails(deleteDoc(doc(asAdmin(), 'orders', 'ord-1')));
    await assertFails(updateDoc(doc(asStudent(), 'orders', 'ord-1'), { trxId: 'CHANGED' }));
  });
});
