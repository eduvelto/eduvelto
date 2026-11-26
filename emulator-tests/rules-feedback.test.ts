// Eduvelto — feedback rules tests (Day 3, unified 26 Nov 2026).
//
// Covers the feedback match in firestore.rules (type 'question-error' here;
// (q1–q8) student create (signed-in, own uid, status pending,
// five-type enum, 200-char snapshot, description ≤1000,
// createdAt timestamp, exact key set), guest cannot create.
// (q9–q11) read is moderator-only (reporter cannot read their
// own report, student cannot list, moderator can).
// (q12–q15) moderator decide: pending → valid (flaggedForCorrection
// true) / pending → invalid (flagged false); a decided report
// cannot be decided again; a student cannot update; delete never.
// (q16) the decide never touches a question doc — the update
// changes only report fields (enforced by changedKeys).
//
// Run with `npm run test:rules` (whole emulator-tests/ directory).
//
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
  limit,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-feedback';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('match /feedback/{feedbackId}')) {
  throw new Error('firestore.rules does not contain the feedback match.');
}

const TS = (ms: number) => Timestamp.fromMillis(ms);
const NOW = Date.UTC(2026, 11, 26, 6, 0, 0);

function reportDoc(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'question-error',
    questionId: 'bank-q-123',
    questionText: 'বাংলাদেশের রাজধানী কোনটি?',
    errorType: 'wrong-answer',
    description: 'সঠিক উত্তর ঢাকা, কিন্তু (খ) দেওয়া আছে।',
    reporterUid: 'student-1',
    status: 'pending',
    flaggedForCorrection: false,
    decidedBy: null,
    decidedAt: null,
    decisionNote: null,
    createdAt: TS(NOW),
    updatedAt: TS(NOW),
    ...overrides,
  };
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['student-1', 'student'],
      ['student-2', 'student'],
      ['moderator-1', 'moderator'],
      ['admin-1', 'admin'],
      ['owner-1', 'owner'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
      });
    }
    await setDoc(doc(db, 'feedback', 'rep-seed'), reportDoc({}));
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

describe('feedback rules — question-error create (q1–q8)', () => {
  it('q1: a signed-in student creates a valid pending report', async () => {
    await assertSucceeds(setDoc(doc(asStudent(), 'feedback', 'rep-q1'), reportDoc({})));
  });

  it('q2: a guest cannot create a report', async () => {
    await assertFails(setDoc(doc(asGuest(), 'feedback', 'rep-q2'), reportDoc({})));
  });

  it('q3: a student cannot create a report for someone else', async () => {
    await assertFails(
      setDoc(doc(asStudent(), 'feedback', 'rep-q3'), reportDoc({ reporterUid: 'student-2' })),
    );
  });

  it('q4: a student cannot create a report with a non-pending status', async () => {
    await assertFails(setDoc(doc(asStudent(), 'feedback', 'rep-q4'), reportDoc({ status: 'valid' })));
  });

  it('q5: a student cannot create a report with an unknown error type', async () => {
    await assertFails(setDoc(doc(asStudent(), 'feedback', 'rep-q5'), reportDoc({ errorType: 'made-up' })));
  });

  it('q6: a student cannot create a report with a questionText over 200 chars', async () => {
    await assertFails(
      setDoc(doc(asStudent(), 'feedback', 'rep-q6'), reportDoc({ questionText: 'অ'.repeat(201) })),
    );
  });

  it('q7: a student cannot create a report with a description over 1000 chars', async () => {
    await assertFails(
      setDoc(doc(asStudent(), 'feedback', 'rep-q7'), reportDoc({ description: 'x'.repeat(1001) })),
    );
  });

  it('q8: a student cannot create a report with an unexpected key (no reward fields)', async () => {
    await assertFails(
      setDoc(doc(asStudent(), 'feedback', 'rep-q8'), reportDoc({ rewardDays: 7 })),
    );
  });
});

describe('feedback rules — question-error read (q9–q11)', () => {
  it('q9: a moderator reads a report and lists pending reports', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'feedback', 'rep-seed')));
    const snap = await assertSucceeds(
      getDocs(query(collection(asModerator(), 'feedback'), where('status', '==', 'pending'), limit(25))),
    );
    expect(snap.docs.length).toBeGreaterThanOrEqual(1);
  });

  it('q10: the reporter cannot read their own report (admin-only read)', async () => {
    await assertFails(getDoc(doc(asStudent('student-1'), 'feedback', 'rep-seed')));
  });

  it('q11: a student cannot list reports', async () => {
    await assertFails(getDocs(query(collection(asStudent(), 'feedback'), limit(25))));
  });
});

describe('feedback rules — question-error decide (q12–q16)', () => {
  it('q12: a moderator approves (pending → valid, flagged for correction)', async () => {
    await assertSucceeds(setDoc(doc(asStudent(), 'feedback', 'rep-q12'), reportDoc({})));
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'feedback', 'rep-q12'), {
        status: 'valid',
        flaggedForCorrection: true,
        decidedBy: 'moderator-1',
        decidedAt: TS(NOW),
        decisionNote: 'যাচাই করে দেখা গেছে উত্তর ভুল।',
      }),
    );
    const after = await getDoc(doc(asModerator(), 'feedback', 'rep-q12'));
    expect(after.data()?.status).toBe('valid');
    expect(after.data()?.flaggedForCorrection).toBe(true);
  });

  it('q13: a moderator rejects (pending → invalid, not flagged)', async () => {
    await assertSucceeds(setDoc(doc(asStudent(), 'feedback', 'rep-q13'), reportDoc({})));
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'feedback', 'rep-q13'), {
        status: 'invalid',
        flaggedForCorrection: false,
        decidedBy: 'moderator-1',
        decidedAt: TS(NOW),
      }),
    );
  });

  it('q14: approve without flagging is denied (valid must flag the question)', async () => {
    await assertSucceeds(setDoc(doc(asStudent(), 'feedback', 'rep-q14'), reportDoc({})));
    await assertFails(
      updateDoc(doc(asModerator(), 'feedback', 'rep-q14'), {
        status: 'valid',
        flaggedForCorrection: false,
        decidedBy: 'moderator-1',
        decidedAt: TS(NOW),
      }),
    );
  });

  it('q15: a student cannot update and nobody can delete a report', async () => {
    await assertFails(updateDoc(doc(asStudent(), 'feedback', 'rep-seed'), { status: 'valid' }));
    await assertFails(deleteDoc(doc(asStudent(), 'feedback', 'rep-seed')));
    await assertFails(deleteDoc(doc(asModerator(), 'feedback', 'rep-seed')));
  });

  it('q16: a decided report cannot be decided again', async () => {
    // rep-q12 is already valid from q12.
    await assertFails(
      updateDoc(doc(asModerator(), 'feedback', 'rep-q12'), {
        status: 'invalid',
        flaggedForCorrection: false,
        decidedBy: 'moderator-1',
        decidedAt: TS(NOW),
      }),
    );
  });
});

describe('feedback rules — contact + report types (c1–c8)', () => {
  const contactDoc = (overrides: Record<string, unknown> = {}) => ({
    type: 'contact',
    reporterUid: 'student-1',
    status: 'pending',
    name: 'Student One',
    email: 'student1@example.com',
    message: 'Hello, I need help.',
    createdAt: TS(NOW),
    updatedAt: TS(NOW),
    ...overrides,
  });
  const genReportDoc = (overrides: Record<string, unknown> = {}) => ({
    type: 'report',
    reporterUid: 'student-1',
    status: 'open',
    reason: 'spam',
    targetType: 'post',
    targetId: 'post-1',
    targetAuthorId: 'student-2',
    details: 'It looks like spam.',
    createdAt: TS(NOW),
    updatedAt: TS(NOW),
    ...overrides,
  });
  it('c1 — signed-in student creating their own contact message is ALLOWED', async () => {
    await assertSucceeds(setDoc(doc(asStudent(), 'feedback', 'fb-c1'), contactDoc({})));
  });
  it('c2 — contact create with the wrong reporterUid is DENIED', async () => {
    await assertFails(setDoc(doc(asStudent(), 'feedback', 'fb-c2'), contactDoc({ reporterUid: 'student-2' })));
  });
  it('c3 — contact create with a non-pending status is DENIED', async () => {
    await assertFails(setDoc(doc(asStudent(), 'feedback', 'fb-c3'), contactDoc({ status: 'open' })));
  });
  it('c4 — moderator can read a contact message', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'feedback', 'fb-c1')));
  });
  it('c5 — a contact message can never be updated (append-only)', async () => {
    await assertFails(updateDoc(doc(asModerator(), 'feedback', 'fb-c1'), { message: 'Edited.' }));
  });
  it('c6 — signed-in student creating a report with target fields is ALLOWED', async () => {
    await assertSucceeds(setDoc(doc(asStudent(), 'feedback', 'fb-c6'), genReportDoc({})));
  });
  it('c7 — report create without target fields is DENIED', async () => {
    const { targetId, targetType, targetAuthorId, ...noTarget } = genReportDoc({});
    await assertFails(setDoc(doc(asStudent(), 'feedback', 'fb-c7'), noTarget));
  });
  it('c8 — the reporter CAN read their own report, but not another student’s', async () => {
    await assertSucceeds(getDoc(doc(asStudent('student-1'), 'feedback', 'fb-c6')));
    await assertFails(getDoc(doc(asStudent('student-2'), 'feedback', 'fb-c6')));
  });
});
