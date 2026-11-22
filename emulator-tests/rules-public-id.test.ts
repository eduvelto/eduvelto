/**
 * Eduvelto Firestore security-rules tests — public user IDs
 * (owner order 22 Nov 2026: sequential from eduvelto0001).
 *
 * Covers the rules change the feature needs (see
 * team/public-user-ids-2026-11-22.md §Rules): the counter document
 * `counters/publicUserIds`, the `publicIdNumber` key on users create
 * (bound to the counter's current `next`), its immutability for the
 * owner of the doc, and the owner-only backfill update. Plus the
 * end-to-end allocation: two simultaneous signups get different
 * numbers (the real createProfileWithPublicId transaction).
 *
 * These tests FAIL until the rules change is deployed to the emulator
 * (firestore.rules in this worktree does not yet contain it — the
 * change needs its own approval, see the team report). Run with
 * `npm run test:rules` (whole emulator-tests/ directory) or this file
 * alone under `firebase emulators:exec`. Same conventions as
 * rules-step4-job-profiles.test.ts: the emulator loads
 * firestore.rules from firebase.json at startup; own project id so
 * it never shares data with the other suites.
 */
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createProfileWithPublicId } from '../src/lib/publicId';

const PROJECT_ID = 'eduvelto-rules-test-public-id';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}

const COUNTER = { next: 5 };

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['admin-1', 'admin'],
      ['owner-1', 'owner'],
      ['student-1', 'student'],
      ['student-2', 'student'],
      ['student-3', 'student'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
      });
    }
    await setDoc(doc(db, 'counters', 'publicUserIds'), {
      next: COUNTER.next,
      updatedAt: serverTimestamp(),
    });
  });
}

/** Reset the counter to a known value (rules-disabled, test setup). */
async function resetCounter(next: number) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'counters', 'publicUserIds'), {
      next,
      updatedAt: serverTimestamp(),
    });
  });
}

beforeAll(async () => {
  // Port: prefer the CLI-set FIRESTORE_EMULATOR_HOST (emulators:exec
  // sets it to host:port of the running emulator, whatever config was
  // used), else FIRESTORE_EMULATOR_PORT, else the default 8080.
  const hostVar = process.env.FIRESTORE_EMULATOR_HOST ?? '';
  const port = hostVar.includes(':')
    ? Number(hostVar.split(':').pop())
    : Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080);
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port },
  });
  await seed();
  // Loud seed check: a missing seed must fail here, not masquerade as
  // rules denials later (callerRole() errors when the caller's users
  // doc is missing, which looks like a rules failure).
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore(), 'users', 'owner-1'));
    if (!snap.exists()) throw new Error('seed failed: users/owner-1 missing in the emulator');
    const counter = await getDoc(doc(ctx.firestore(), 'counters', 'publicUserIds'));
    if (!counter.exists()) throw new Error('seed failed: counters/publicUserIds missing in the emulator');
  });
}, 300000);

afterAll(async () => {
  await env.cleanup();
});

const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asOwner = () => env.authenticatedContext('owner-1').firestore();
const asUnauth = () => env.unauthenticatedContext().firestore();

/** Minimal valid profile-create payload (rules allowlist). */
function newProfilePayload(uid: string, extra: Record<string, unknown> = {}) {
  return {
    displayName: uid,
    email: `${uid}@example.com`,
    role: 'student',
    language: 'bn',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
    ...extra,
  };
}

describe('Public IDs — counter document', () => {
  it('(p1) a signed-in user can READ the counter', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'counters', 'publicUserIds')));
  });
  it('(p2) a signed-out user can NOT read the counter', async () => {
    await assertFails(getDoc(doc(asUnauth(), 'counters', 'publicUserIds')));
  });
  it('(p3) incrementing the counter by exactly 1 is ALLOWED', async () => {
    await resetCounter(5);
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'counters', 'publicUserIds'), { next: 6 }),
    );
  });
  it('(p4) incrementing the counter by 2 is DENIED', async () => {
    await resetCounter(5);
    await assertFails(
      updateDoc(doc(asStudent1(), 'counters', 'publicUserIds'), { next: 7 }),
    );
  });
  it('(p5) decrementing the counter is DENIED', async () => {
    await resetCounter(5);
    await assertFails(
      updateDoc(doc(asStudent1(), 'counters', 'publicUserIds'), { next: 4 }),
    );
  });
  it('(p6) a signed-in user can NOT create the counter doc', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'counters', 'other-counter'), { next: 1 }),
    );
  });
});

describe('Public IDs — allocation at signup', () => {
  // The creator must be the doc's own uid (the create rule requires
  // isOwner(userId)) — each test signs in AS the new user.
  it('(p7) creating a profile with publicIdNumber == counter next is ALLOWED', async () => {
    await resetCounter(5);
    const asNew1 = () => env.authenticatedContext('new-user-1').firestore();
    await assertSucceeds(
      setDoc(doc(asNew1(), 'users', 'new-user-1'), newProfilePayload('new-user-1', { publicIdNumber: 5 })),
    );
  });
  it('(p8) creating a profile with publicIdNumber != counter next is DENIED', async () => {
    await resetCounter(5);
    const asNew2 = () => env.authenticatedContext('new-user-2').firestore();
    const asNew3 = () => env.authenticatedContext('new-user-3').firestore();
    await assertFails(
      setDoc(doc(asNew2(), 'users', 'new-user-2'), newProfilePayload('new-user-2', { publicIdNumber: 1 })),
    );
    await assertFails(
      setDoc(doc(asNew3(), 'users', 'new-user-3'), newProfilePayload('new-user-3', { publicIdNumber: 99 })),
    );
  });
  it('(p9) creating a profile WITHOUT a publicIdNumber is still ALLOWED (fallback)', async () => {
    const asNew4 = () => env.authenticatedContext('new-user-4').firestore();
    await assertSucceeds(
      setDoc(doc(asNew4(), 'users', 'new-user-4'), newProfilePayload('new-user-4')),
    );
  });
  it('(p10) a user can NOT change their own publicIdNumber (self-update)', async () => {
    await resetCounter(5);
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'student-1'), {
        displayName: 'student-1',
        email: 'student-1@example.com',
        role: 'student',
        language: 'bn',
        isActive: true,
        publicIdNumber: 1,
      });
    });
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { publicIdNumber: 2 }),
    );
  });
});

describe('Public IDs — owner backfill', () => {
  it('(p11) the OWNER can set publicIdNumber on a user that lacks it', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'student-2'), {
        displayName: 'student-2',
        email: 'student-2@example.com',
        role: 'student',
        language: 'bn',
        isActive: true,
      });
    });
    await assertSucceeds(
      updateDoc(doc(asOwner(), 'users', 'student-2'), { publicIdNumber: 2 }),
    );
  });
  it('(p12) the OWNER can NOT change an existing publicIdNumber', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'student-3'), {
        displayName: 'student-3',
        email: 'student-3@example.com',
        role: 'student',
        language: 'bn',
        isActive: true,
        publicIdNumber: 3,
      });
    });
    await assertFails(
      updateDoc(doc(asOwner(), 'users', 'student-3'), { publicIdNumber: 9 }),
    );
  });
  it('(p13) an ADMIN can NOT set publicIdNumber', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'users', 'student-2'), { publicIdNumber: 8 }),
    );
  });
});

describe('Public IDs — end-to-end allocation', () => {
  it('(p14) two simultaneous signups get DIFFERENT numbers', async () => {
    await resetCounter(5);
    // Each signup signs in AS the new user (create rule: isOwner).
    const db1 = env.authenticatedContext('e2e-user-1').firestore();
    const db2 = env.authenticatedContext('e2e-user-2').firestore();
    const payload = (uid: string) => ({
      displayName: uid,
      email: `${uid}@example.com`,
      role: 'student',
      language: 'bn',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });
    const [n1, n2] = await Promise.all([
      // rules-unit-testing's firestore() is the compat Firestore; the
      // modular transaction accepts it at runtime (same as doc/setDoc
      // in the other suites) — the cast is type-level only.
      createProfileWithPublicId(db1 as unknown as Firestore, 'e2e-user-1', payload('e2e-user-1')),
      createProfileWithPublicId(db2 as unknown as Firestore, 'e2e-user-2', payload('e2e-user-2')),
    ]);
    expect(n1).not.toBeNull();
    expect(n2).not.toBeNull();
    expect(n1).not.toBe(n2);
    expect([n1, n2].sort()).toEqual([5, 6]);
    // The counter moved past both allocations.
    const counter = await getDoc(doc(db1, 'counters', 'publicUserIds'));
    expect(counter.data()?.next).toBe(7);
    // Each profile doc carries its own number.
    const d1 = await getDoc(doc(db1, 'users', 'e2e-user-1'));
    const d2 = await getDoc(doc(db2, 'users', 'e2e-user-2'));
    expect(d1.data()?.publicIdNumber).toBe(n1);
    expect(d2.data()?.publicIdNumber).toBe(n2);
  });

  it('(p15) allocation returns null when the counter doc is missing (fallback path)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'counters', 'publicUserIds'));
    });
    const n = await createProfileWithPublicId(
      env.authenticatedContext('e2e-user-3').firestore() as unknown as Firestore,
      'e2e-user-3',
      {
      displayName: 'e2e-user-3',
      email: 'e2e-user-3@example.com',
      role: 'student',
      language: 'bn',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });
    expect(n).toBeNull();
    await resetCounter(5);
  });
});
