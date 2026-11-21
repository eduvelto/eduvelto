/**
 * Minimal repro for the (r43) guardian-read evaluation error.
 * Seeds ONLY the linked-guardian scenario and reads the child's
 * progress. Run against the already-running emulator:
 *   FIRESTORE_EMULATOR_PORT=8081 npx vitest run emulator-tests/repro-guardian.test.ts
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'eduvelto-repro',
    firestore: { host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'guardian-1'), {
      displayName: 'Guardian',
      email: 'g@example.com',
      role: 'parent',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'users', 'child-1'), {
      displayName: 'Child',
      email: 'c@example.com',
      role: 'student',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'parentLinks', 'guardian-1_child-1'), {
      parentId: 'guardian-1',
      studentId: 'child-1',
      status: 'verified',
      childDisplayName: 'Child',
      childClassLevel: 'Class 5',
    });
    await setDoc(doc(db, 'progress', 'prog-child-1'), {
      userId: 'child-1',
      subject: 'Mathematics',
      lessonsRead: 4,
      questionsAttempted: 20,
    });
  });
}, 120000);

afterAll(async () => {
  await env.cleanup();
});

describe('repro: guardian reads linked child progress', () => {
  it('guardian-1 reads prog-child-1 — ALLOWED', async () => {
    const db = env.authenticatedContext('guardian-1').firestore();
    const snap = await assertSucceeds(getDoc(doc(db, 'progress', 'prog-child-1')));
    console.log('READ OK, subject =', snap.data()?.subject);
  });
});
