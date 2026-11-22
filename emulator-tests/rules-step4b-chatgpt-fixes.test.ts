/**
 * Eduvelto Firestore security-rules tests — Job Preparation Step 4
 * closure (ChatGPT consultation fold-in, 22 Nov 2026).
 *
 * P0 fixes under test (conversation
 * https://chatgpt.com/uc/6b02505c-8f94-83ea-bb7d-4784d01ad004):
 *  (1) account CREATION is a separate security boundary — role /
 *      verificationStatus / isActive / unknown fields cannot be
 *      smuggled in at creation (keys allowlist);
 *  (2) category uniqueness (duplicates fail) + integer-only daily
 *      goals (12.5 / "30" / true fail) in create + self-update +
 *      owner-update;
 *  (3) deliberate missing-vs-null handling — all five Job fields are
 *      optional on create, nullable, removable (field delete allowed);
 *      0 is an explicit zero goal and persists.
 * Cross-field category→exam consistency is DELIBERATELY NOT enforced
 * in rules (k27 pins that boundary): the app enforces it; an
 * inconsistent pair is a display-preference issue, not a privilege
 * or data-leak issue.
 * Same conventions as rules-step4-job-profiles.test.ts (j1–j20).
 * Run with `npm run test:rules` (whole emulator-tests/ directory).
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-step4b';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['admin-1', 'admin'],
      ['owner-1', 'owner'],
      ['student-1', 'student'],
      ['student-2', 'student'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
      });
    }
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await seed();
}, 300000);

afterAll(async () => {
  await env.cleanup();
});

const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asOwner = () => env.authenticatedContext('owner-1').firestore();
/** A fresh authenticated context whose uid has no document yet. */
const asFresh = (uid: string) => env.authenticatedContext(uid).firestore();

const VALID_CREATE = {
  displayName: 'New Student',
  email: 'new@example.com',
  role: 'student',
  language: 'bn',
} as const;

describe('Step 4 closure rules — account creation boundary', () => {
  it('(k1) create with role=admin is DENIED', async () => {
    await assertFails(
      setDoc(doc(asFresh('k1-new'), 'users', 'k1-new'), { ...VALID_CREATE, role: 'admin' }),
    );
  });
  it('(k2) create with role=moderator is DENIED', async () => {
    await assertFails(
      setDoc(doc(asFresh('k2-new'), 'users', 'k2-new'), { ...VALID_CREATE, role: 'moderator' }),
    );
  });
  it('(k3) create with role=owner is DENIED', async () => {
    await assertFails(
      setDoc(doc(asFresh('k3-new'), 'users', 'k3-new'), { ...VALID_CREATE, role: 'owner' }),
    );
  });
  it('(k4) create student with verificationStatus=verified is DENIED', async () => {
    await assertFails(
      setDoc(doc(asFresh('k4-new'), 'users', 'k4-new'), {
        ...VALID_CREATE,
        verificationStatus: 'verified',
      }),
    );
  });
  it('(k5) create student with verificationStatus=pending is DENIED (students never carry it)', async () => {
    await assertFails(
      setDoc(doc(asFresh('k5-new'), 'users', 'k5-new'), {
        ...VALID_CREATE,
        verificationStatus: 'pending',
      }),
    );
  });
  it('(k6) create teacher with verificationStatus=pending is ALLOWED (existing behaviour)', async () => {
    await assertSucceeds(
      setDoc(doc(asFresh('k6-new'), 'users', 'k6-new'), {
        ...VALID_CREATE,
        role: 'teacher',
        verificationStatus: 'pending',
      }),
    );
  });
  it('(k7) create teacher with verificationStatus=verified is DENIED', async () => {
    await assertFails(
      setDoc(doc(asFresh('k7-new'), 'users', 'k7-new'), {
        ...VALID_CREATE,
        role: 'teacher',
        verificationStatus: 'verified',
      }),
    );
  });
  it('(k8) create with isActive present is DENIED', async () => {
    await assertFails(
      setDoc(doc(asFresh('k8-new'), 'users', 'k8-new'), { ...VALID_CREATE, isActive: true }),
    );
  });
  it('(k9) create with a privileged-looking unknown field (verifiedBy) is DENIED (keys allowlist)', async () => {
    await assertFails(
      setDoc(doc(asFresh('k9-new'), 'users', 'k9-new'), { ...VALID_CREATE, verifiedBy: 'k9-new' }),
    );
  });
  it('(k10) create with a junk field is DENIED (keys allowlist)', async () => {
    await assertFails(
      setDoc(doc(asFresh('k10-new'), 'users', 'k10-new'), { ...VALID_CREATE, foo: 'bar' }),
    );
  });
  it('(k11) create with valid fields only, incl. valid Job fields, is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asFresh('k11-new'), 'users', 'k11-new'), {
        ...VALID_CREATE,
        enrolledCategories: ['bank'],
        targetExam: 'bank',
        dailyGoalQuestions: 20,
        dailyGoalMinutes: 30,
        jobOnboarded: false,
      }),
    );
  });
  it('(k12) create with no Job fields at all is ALLOWED (missing = undecided)', async () => {
    await assertSucceeds(
      setDoc(doc(asFresh('k12-new'), 'users', 'k12-new'), { ...VALID_CREATE }),
    );
  });
  it('(k13) create with null Job fields is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asFresh('k13-new'), 'users', 'k13-new'), {
        ...VALID_CREATE,
        enrolledCategories: null,
        targetExam: null,
        dailyGoalQuestions: null,
        dailyGoalMinutes: null,
        jobOnboarded: null,
      }),
    );
  });
  it('(k14) create with duplicate categories is DENIED (uniqueness)', async () => {
    await assertFails(
      setDoc(doc(asFresh('k14-new'), 'users', 'k14-new'), {
        ...VALID_CREATE,
        enrolledCategories: ['bank', 'bank'],
      }),
    );
  });
  it('(k15) create with a decimal daily goal is DENIED', async () => {
    await assertFails(
      setDoc(doc(asFresh('k15-new'), 'users', 'k15-new'), {
        ...VALID_CREATE,
        dailyGoalQuestions: 12.5,
      }),
    );
  });
  it('(k16) create with a string daily goal is DENIED', async () => {
    await assertFails(
      setDoc(doc(asFresh('k16-new'), 'users', 'k16-new'), {
        ...VALID_CREATE,
        dailyGoalMinutes: '30',
      }),
    );
  });
});

describe('Step 4 closure rules — Job field validation (update)', () => {
  it('(k17) duplicate categories on update is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        enrolledCategories: ['bank', 'bank', 'bank'],
      }),
    );
  });
  it('(k18) decimal dailyGoalQuestions=12.5 is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalQuestions: 12.5 }),
    );
  });
  it('(k19) decimal dailyGoalMinutes=45.75 is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalMinutes: 45.75 }),
    );
  });
  it('(k20) boolean dailyGoalQuestions=true is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalQuestions: true }),
    );
  });
  it('(k21) boolean dailyGoalMinutes=false is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalMinutes: false }),
    );
  });
  it('(k22) dailyGoalQuestions=0 is ALLOWED and persists (explicit zero, never "unset")', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalQuestions: 0 }),
    );
    const snap = await getDoc(doc(asStudent1(), 'users', 'student-1'));
    if (snap.data()?.dailyGoalQuestions !== 0) {
      throw new Error('explicit zero goal was not stored as 0');
    }
  });
  it('(k23) deleting the targetExam field is ALLOWED (removable)', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { targetExam: deleteField() }),
    );
    const snap = await getDoc(doc(asStudent1(), 'users', 'student-1'));
    if ('targetExam' in (snap.data() ?? {})) {
      throw new Error('targetExam field was not deleted');
    }
  });
  it('(k24) deleting the enrolledCategories field is ALLOWED (removable)', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { enrolledCategories: deleteField() }),
    );
    const snap = await getDoc(doc(asStudent1(), 'users', 'student-1'));
    if ('enrolledCategories' in (snap.data() ?? {})) {
      throw new Error('enrolledCategories field was not deleted');
    }
  });
  it('(k25) an unexpected junk field alongside a valid Job field is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        targetExam: 'bcs',
        foo: 'bar',
      }),
    );
  });
  it('(k26) negative dailyGoalQuestions=-5 is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalQuestions: -5 }),
    );
  });
  it('(k27) inconsistent pair (targetExam outside enrolledCategories) is ALLOWED by rules — the app enforces consistency, not the rules (pinned boundary)', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        enrolledCategories: ['bank'],
        targetExam: 'primary-teacher',
      }),
    );
  });
  it('(k28) owner update with duplicate categories is DENIED (owner rule hardened too)', async () => {
    await assertFails(
      updateDoc(doc(asOwner(), 'users', 'student-1'), {
        enrolledCategories: ['bank', 'bank'],
      }),
    );
  });
});
