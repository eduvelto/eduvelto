/**
 * Eduvelto Firestore security-rules tests — Job Preparation Step 4
 * (Authentication and Student Profiles, Job section only).
 *
 * Covers the five new `users/{uid}` Job fields (Step 3 §2.25, §3.1):
 * enrolledCategories, targetExam, dailyGoalQuestions, dailyGoalMinutes,
 * jobOnboarded. Valid values pass; out-of-enum / out-of-range values
 * fail; role escalation (even bundled with a valid Job field) fails.
 * Same conventions as rules.test.ts / rules-step2.test.ts: the emulator
 * loads firestore.rules from firebase.json at startup; this file only
 * sanity-checks the file exists. Run with `npm run test:rules` (runs
 * the whole emulator-tests/ directory). Uses its own project id so it
 * never shares data with the other suites when vitest runs files in
 * parallel.
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-step4';
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

describe('Step 4 rules — Job profile fields (users/{uid})', () => {
  // enrolledCategories
  it('(j1) student setting own enrolledCategories to valid slugs is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        enrolledCategories: ['bcs-bpsc', 'bank', 'primary-teacher'],
      }),
    );
  });
  it('(j2) student setting own enrolledCategories with an out-of-enum slug is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        enrolledCategories: ['bcs-bpsc', 'nasa'],
      }),
    );
  });
  it('(j3) student setting own enrolledCategories to 11 categories is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        enrolledCategories: [
          'bcs-bpsc', 'govt', 'bank', 'primary-teacher', 'ntrca-teacher',
          'defence-police', 'autonomous', 'ngo-private', 'it-professional',
          'other-competitive', 'bank',
        ],
      }),
    );
  });
  it('(j4) student setting own enrolledCategories to all 10 valid slugs is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        enrolledCategories: [
          'bcs-bpsc', 'govt', 'bank', 'primary-teacher', 'ntrca-teacher',
          'defence-police', 'autonomous', 'ngo-private', 'it-professional',
          'other-competitive',
        ],
      }),
    );
  });
  it('(j5) student clearing own enrolledCategories is ALLOWED (removing a category never deletes progress)', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { enrolledCategories: [] }),
    );
  });

  // targetExam
  it('(j6) student setting own targetExam to a hub slug is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { targetExam: 'bcs' }),
    );
  });
  it('(j7) student setting own targetExam to an unknown slug is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { targetExam: 'nasa-exam' }),
    );
  });
  it('(j8) student setting own targetExam to null (undecided) is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { targetExam: null }),
    );
  });

  // dailyGoalQuestions
  it('(j9) student setting own dailyGoalQuestions=30 is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalQuestions: 30 }),
    );
  });
  it('(j10) student setting own dailyGoalQuestions=501 is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalQuestions: 501 }),
    );
  });
  it('(j11) student setting own dailyGoalQuestions to null is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalQuestions: null }),
    );
  });
  it('(j12) student setting own dailyGoalQuestions to a string is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalQuestions: 'thirty' }),
    );
  });

  // dailyGoalMinutes
  it('(j13) student setting own dailyGoalMinutes=45 is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalMinutes: 45 }),
    );
  });
  it('(j14) student setting own dailyGoalMinutes=601 is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { dailyGoalMinutes: 601 }),
    );
  });

  // jobOnboarded
  it('(j15) student setting own jobOnboarded=true is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { jobOnboarded: true }),
    );
  });
  it('(j16) student setting own jobOnboarded to a string is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { jobOnboarded: 'yes' }),
    );
  });

  // All five at once, and the escalation guard.
  it('(j17) student setting all five Job fields to valid values at once is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        enrolledCategories: ['bcs-bpsc', 'bank'],
        targetExam: 'bank',
        dailyGoalQuestions: 20,
        dailyGoalMinutes: 30,
        jobOnboarded: true,
      }),
    );
    const snap = await getDoc(doc(asStudent1(), 'users', 'student-1'));
    const data = snap.data();
    if (!data || data.targetExam !== 'bank' || data.dailyGoalQuestions !== 20) {
      throw new Error('valid Job fields were not stored');
    }
  });
  it('(j18) student bundling a role escalation with a valid Job field is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        targetExam: 'bcs',
        role: 'admin',
      }),
    );
  });
  it('(j19) student setting another student’s Job fields is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-2'), { targetExam: 'bcs' }),
    );
  });
  it('(j20) student setting own isActive alongside a Job field is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        targetExam: 'bcs',
        isActive: false,
      }),
    );
  });
});
