// Eduvelto Firestore security-rules tests — quiz referrals, admin
// read + delete (28 Nov 2026, /free-quiz share; Worker 2).
//
// Companion to rules-quiz-referrals.test.ts (Worker 1 — public
// create/update, no public read). This file proves the other half:
//   read:   owner/admin CAN read one doc and list by count desc
//           (the leaderboard query); a signed-in student cannot;
//   delete: NOBODY through the client — not even an admin.
//   update: an admin may NOT rewrite a doc either (only the
//           public counter bump is allowed — covered in q2).
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
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-quiz-referrals-admin';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}
if (!RULES_TEXT.includes('match /quizReferrals/{code}')) {
  throw new Error('firestore.rules has no /quizReferrals match block — the referral feature needs it.');
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['admin-1', 'admin'],
      ['owner-1', 'owner'],
      ['student-1', 'student'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
      });
    }
    await setDoc(doc(db, 'quizReferrals', 'ABC123'), {
      code: 'ABC123',
      name: 'Seed User',
      createdAt: serverTimestamp(),
      firstSeen: serverTimestamp(),
      lastSeen: serverTimestamp(),
      count: 3,
    });
    await setDoc(doc(db, 'quizReferrals', 'DEF456'), {
      code: 'DEF456',
      name: 'Second User',
      createdAt: serverTimestamp(),
      firstSeen: serverTimestamp(),
      lastSeen: serverTimestamp(),
      count: 7,
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
    const ref = await getDoc(doc(ctx.firestore(), 'quizReferrals', 'ABC123'));
    if (!ref.exists()) throw new Error('seed failed: quizReferrals/ABC123 missing in the emulator');
  });
}, 300000);

afterAll(async () => {
  await env.cleanup();
});

const asStudent = () => env.authenticatedContext('student-1').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asOwner = () => env.authenticatedContext('owner-1').firestore();

describe('quizReferrals — admin/owner read + delete', () => {
  it('(ra1) an admin can read one referral doc', async () => {
    const snap = await assertSucceeds(getDoc(doc(asAdmin(), 'quizReferrals', 'ABC123')));
    expect(snap.exists()).toBe(true);
    expect(snap.data()?.name).toBe('Seed User');
  });

  it('(ra2) the owner can list by count desc — leaderboard order, highest first', async () => {
    const list = await assertSucceeds(
      getDocs(query(collection(asOwner(), 'quizReferrals'), orderBy('count', 'desc'))),
    );
    expect(list.docs.map((d) => d.id)).toEqual(['DEF456', 'ABC123']);
  });

  it('(ra3) a signed-in student cannot read a referral doc', async () => {
    await assertFails(getDoc(doc(asStudent(), 'quizReferrals', 'ABC123')));
  });

  it('(ra4) delete is denied even for an admin through the client', async () => {
    await assertFails(deleteDoc(doc(asAdmin(), 'quizReferrals', 'ABC123')));
  });

  it('(ra5) delete is denied for the owner through the client too', async () => {
    await assertFails(deleteDoc(doc(asOwner(), 'quizReferrals', 'ABC123')));
  });
});
