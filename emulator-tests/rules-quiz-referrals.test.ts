// Eduvelto — quizReferrals rules tests (owner order 28 Nov 2026,
// 12:53; Worker 1 — share-and-win).
//
// Covers the quizReferrals match in firestore.rules (public
// create/update only, NO public read):
// (q1) unauthenticated create of a referral doc succeeds.
// (q2) unauthenticated update (count +1, lastSeen) on an existing
//      doc succeeds.
// (q3) unauthenticated read of a referral doc fails.
// (q4) recordReferralVisit (src/lib/referrals) increments once and
//      is blocked the second time the same day (localStorage guard —
//      in-memory fallback under vitest).
// (q5) recordReferralVisit on an unknown code fails silently —
//      no doc is created, no error thrown.
//
// SKIPPED until the quizReferrals match lands in firestore.rules
// (Worker 2 owns the rules). Run with `npm run test:rules`.
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { recordReferralVisit } from '../src/lib/referrals';

const PROJECT_ID = 'eduvelto-rules-test-quiz-referrals';

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
const HAS_MATCH = RULES_TEXT.includes('match /quizReferrals/{code}');

const describeOrSkip = HAS_MATCH ? describe : describe.skip;

let env: RulesTestEnvironment;

// Emulator host/port: emulators:exec sets FIRESTORE_EMULATOR_HOST
// (host:port); fall back to the standard 127.0.0.1:8080. Passed
// explicitly — initializeTestEnvironment's default host lookup is
// slow to fail when the emulator is cold.
const [EMULATOR_HOST, EMULATOR_PORT] = (
  process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
).split(':');

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

describeOrSkip('quizReferrals rules (public create/update, no read)', () => {
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: RULES_TEXT,
        host: EMULATOR_HOST,
        port: Number(EMULATOR_PORT),
      },
    });
    // Cold-emulator rules calls can take ~2s each; the 10s default
    // hook timeout is too tight (see vitest.config.ts).
  }, 60000);

  afterAll(async () => {
    await env?.cleanup();
  });

  const guestDb = () =>
    env.unauthenticatedContext().firestore() as unknown as Firestore;

  const TS = (ms: number) => Timestamp.fromMillis(ms);
  const NOW = Date.UTC(2026, 11, 28, 6, 0, 0);

  it('q1: unauthenticated create of a referral doc succeeds', async () => {
    const db = guestDb();
    await assertSucceeds(
      setDoc(doc(db, 'quizReferrals', 'aK3xQ9'), {
        code: 'aK3xQ9',
        name: 'Rahim',
        createdAt: TS(NOW),
        firstSeen: TS(NOW),
        lastSeen: TS(NOW),
        count: 0,
      }),
    );
  });

  it('q2: unauthenticated update (count +1, lastSeen) succeeds', async () => {
    const db = guestDb();
    await assertSucceeds(
      updateDoc(doc(db, 'quizReferrals', 'aK3xQ9'), {
        count: 1,
        lastSeen: TS(NOW + 1000),
      }),
    );
  });

  it('q3: unauthenticated read of a referral doc fails', async () => {
    const db = guestDb();
    await assertFails(getDoc(doc(db, 'quizReferrals', 'aK3xQ9')));
  });

  it('q4: recordReferralVisit increments once, blocked the second time the same day', async () => {
    const db = guestDb();
    await asAdmin(async (admin) => {
      await setDoc(doc(admin, 'quizReferrals', 'bM7qW2'), {
        code: 'bM7qW2',
        name: 'Karim',
        createdAt: TS(NOW),
        firstSeen: TS(NOW),
        lastSeen: TS(NOW),
        count: 0,
      });
    });
    await recordReferralVisit('bM7qW2', db);
    const afterFirst = await asAdmin((admin) =>
      getDoc(doc(admin, 'quizReferrals', 'bM7qW2')),
    );
    expect(afterFirst.data()?.count).toBe(1);
    // Same day, same process — the guard blocks the second write.
    await recordReferralVisit('bM7qW2', db);
    const afterSecond = await asAdmin((admin) =>
      getDoc(doc(admin, 'quizReferrals', 'bM7qW2')),
    );
    expect(afterSecond.data()?.count).toBe(1);
  });

  it('q5: recordReferralVisit on an unknown code creates nothing and never throws', async () => {
    const db = guestDb();
    await expect(recordReferralVisit('zZ9zZ9', db)).resolves.toBeUndefined();
    const snap = await asAdmin((admin) =>
      getDoc(doc(admin, 'quizReferrals', 'zZ9zZ9')),
    );
    expect(snap.exists()).toBe(false);
  });
});
