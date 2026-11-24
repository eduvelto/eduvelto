// Eduvelto Firestore security-rules tests — newsletter subscribers
// (homepage redesign, 24 Nov 2026).
//
// Proves the /newsletterSubscribers rules added for the footer
// newsletter signup:
//   create: anyone (signed-out included) with a validated email +
//           fixed fields only (email, source='footer',
//           status='subscribed', createdAt timestamp);
//   read:   owner/admin only — a subscriber's address is never
//           readable by another user or by a signed-out visitor.
//   update/delete: nobody through the client.
//
// Run with `npm run test:rules` (whole emulator-tests/ directory)
// or this file alone under `firebase emulators:exec`. Same
// conventions as rules-opportunities.test.ts: the emulator loads
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
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-newsletter';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}
if (!RULES_TEXT.includes('match /newsletterSubscribers/{subscriberId}')) {
  throw new Error('firestore.rules has no /newsletterSubscribers match block — the footer newsletter needs it.');
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
    await setDoc(doc(db, 'newsletterSubscribers', 'sub-1'), {
      email: 'reader@example.com',
      source: 'footer',
      status: 'subscribed',
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
    const sub = await getDoc(doc(ctx.firestore(), 'newsletterSubscribers', 'sub-1'));
    if (!sub.exists()) throw new Error('seed failed: newsletterSubscribers/sub-1 missing in the emulator');
  });
}, 300000);

afterAll(async () => {
  await env.cleanup();
});

const asStudent = () => env.authenticatedContext('student-1').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asUnauth = () => env.unauthenticatedContext().firestore();

function validPayload(email = 'new-reader@example.com') {
  return {
    email,
    source: 'footer',
    status: 'subscribed',
    createdAt: serverTimestamp(),
  };
}

describe('newsletterSubscribers — create', () => {
  it('(n1) a signed-out visitor can subscribe with a valid email', async () => {
    await assertSucceeds(addDoc(collection(asUnauth(), 'newsletterSubscribers'), validPayload()));
  });

  it('(n2) a signed-in student can subscribe with a valid email', async () => {
    await assertSucceeds(addDoc(collection(asStudent(), 'newsletterSubscribers'), validPayload('student@example.com')));
  });

  it('(n3) an invalid email is denied', async () => {
    await assertFails(addDoc(collection(asUnauth(), 'newsletterSubscribers'), validPayload('not-an-email')));
    await assertFails(addDoc(collection(asUnauth(), 'newsletterSubscribers'), validPayload('a@b')));
    await assertFails(addDoc(collection(asUnauth(), 'newsletterSubscribers'), validPayload('')));
  });

  it('(n4) extra fields are denied', async () => {
    await assertFails(
      addDoc(collection(asUnauth(), 'newsletterSubscribers'), { ...validPayload(), isAdmin: true }),
    );
    await assertFails(
      addDoc(collection(asUnauth(), 'newsletterSubscribers'), { ...validPayload(), userId: 'student-1' }),
    );
  });

  it('(n5) a wrong source or status is denied', async () => {
    await assertFails(
      addDoc(collection(asUnauth(), 'newsletterSubscribers'), { ...validPayload(), source: 'import' }),
    );
    await assertFails(
      addDoc(collection(asUnauth(), 'newsletterSubscribers'), { ...validPayload(), status: 'unsubscribed' }),
    );
  });

  it('(n6) createdAt must be a timestamp', async () => {
    await assertFails(
      addDoc(collection(asUnauth(), 'newsletterSubscribers'), { ...validPayload(), createdAt: '2026-11-24' }),
    );
  });
});

describe('newsletterSubscribers — read / update / delete', () => {
  it('(n7) a signed-out visitor cannot read a subscriber', async () => {
    await assertFails(getDoc(doc(asUnauth(), 'newsletterSubscribers', 'sub-1')));
  });

  it('(n8) a signed-in student cannot read a subscriber', async () => {
    await assertFails(getDoc(doc(asStudent(), 'newsletterSubscribers', 'sub-1')));
  });

  it('(n9) an admin can read a subscriber', async () => {
    const snap = await assertSucceeds(getDoc(doc(asAdmin(), 'newsletterSubscribers', 'sub-1')));
    expect(snap.data()?.email).toBe('reader@example.com');
  });

  it('(n10) nobody can update or delete through the client', async () => {
    await assertFails(updateDoc(doc(asAdmin(), 'newsletterSubscribers', 'sub-1'), { status: 'unsubscribed' }));
    await assertFails(deleteDoc(doc(asAdmin(), 'newsletterSubscribers', 'sub-1')));
    await assertFails(updateDoc(doc(asUnauth(), 'newsletterSubscribers', 'sub-1'), { status: 'unsubscribed' }));
  });
});
