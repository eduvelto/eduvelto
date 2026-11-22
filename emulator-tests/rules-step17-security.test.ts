// Eduvelto — Job Step 17 (Security Testing) rules tests.
//
// SCOPE: a permanent security regression suite for the Job section.
// Every invariant is tested as a PAIR: the attack is DENIED and the
// honest path is ALLOWED (a denied-only suite can pass while the
// honest workflow is broken). Fixtures are seeded EXCLUSIVELY with
// rules disabled; every assertion runs through a normal authenticated
// (or unauthenticated) client context — never the privileged context.
//
// WHAT THIS FILE COVERS (new ground only — it does NOT duplicate the
// suites that already prove an invariant):
// - (c1) C1 receipt-gating VARIANTS beyond p1–p3 (stale create,
//   future create, mismatched quizId, another student's attempt,
//   plus the full honest E2E i17).
// - (c2) C2 deadline-immutability VARIANTS beyond n55a–c (sneaked
//   deadlineAt in a partial update, questionIds change, update
//   after the deadline passed).
// - (h1) H1 score-bound BOUNDARIES beyond p4–p8 (score == totalMarks,
//   percentage == 100 allowed; score -1, percentage 100.01,
//   totalMarks 0 denied).
// - (h2) H2 community-answer VARIANTS beyond p10–p11 (author
//   changing reviewStatus / authorId).
// - (m2) M2 — pending teachers can author drafts (audit open item).
//   FIXED in this step: contentCreate() + the direct isTeacher()
//   creates now require isVerifiedJobBankAuthor() (staff, or a
//   teacher whose verificationStatus is 'verified'). The bank's
//   gate is reused (same semantics, zero new helpers — the compiled
//   rules margin is ~80 bytes; see the report).
// - (l1) L1 — teacherVerifications create had no key allowlist.
//   FIXED: keys().hasOnly() matching exactly what admin.ts
//   submitTeacherApplication writes.
// - (l2) L2 — nuReceipts create was the weak copy (no signedIn /
//   callerActive / allowlist / createdAt / attempt check).
//   FIXED: mirrors jobReceipts (allowlist, createdAt <= now and
//   > now-5m, anchor attempt must exist + be submitted + match
//   bundle/user). The read gate hasFreshNuReceipt ALSO gains the
//   missing `createdAt <= request.time` bound — without it a
//   future-dated receipt opened the key for a year.
// - (l3) L3 — nuSessions had no field restrictions at all.
//   FIXED: create allowlist + bounds (status enum, startedAt ==
//   request.time, deadlineAt a timestamp); update allowlist
//   (status/lastSavedAt/answers/deviceInfo/updatedAt only —
//   attemptId/startedAt/deadlineAt frozen). Field set per the
//   NU design doc §19.2.9 (attemptId, status, startedAt,
//   deadlineAt, lastSavedAt, answers, deviceInfo).
// - (l4) L4 — an admin could modify another admin's doc (demote a
//   fellow admin, suspend them). FIXED: the admin users-update
//   branch now allows admin/moderator targets ONLY to the owner.
// - (k15) Step 15 admin gaps NOT covered by rules-step15-admin
//   (s1–s9/k1–k5/h1–h4/d1–d5/x1–x5/a1–a2/i16): report update
//   rewriting reporterId/targetId, correction decide rewriting
//   whatsWrong, a report filed against a DRAFT circular
//   (DOCUMENTED-LIMITATION — no target check, low), and the
//   no-self-approval RULES gap (DOCUMENTED-LIMITATION — the
//   guard is client-side until the post-refactor rules
//   follow-up; the rules allow a moderator to publish their
//   own draft circular).
// - (g) Guest / auth boundaries NOT covered elsewhere: guest quiz
//   read, guest chapter read (preview vs non-preview), cross-user
//   attempt + users-doc reads, settings/adminActions writes/reads,
//   suspended-student writes, guest users-doc read.
// - (r7–r8) Step 13 subset-session membership, MULTI-KEY variant
//   beyond r4–r6: a 2-question subset (refs n=1, n=3) with
//   currentQuestion=3 creates; currentQuestion=2 is denied.
//
// DELIBERATELY NOT DUPLICATED HERE (re-verified by the full suite
// run — see the Step 17 report): M1 (e13–e27), the question-bank
// standing rules (q1–q60, a1–a33), the Step 14 circulars rules
// (r1–r8, i15), the Step 15 admin rules (s/k/h/d/x/a, i16), the
// Step 13 subset fix (r4–r6), the C1/H1/H2 base proofs (p1–p11,
// n55a–c). H3 (read budget) is a unit-level tripwire in
// src/lib/__tests__/security-step17.test.ts + the existing
// read-usage-measure test; H4 (backup export + restore test)
// belongs to Step 18. M3/M5/M6/L7 are owner decisions — see
// team/SECURITY_LIMITATIONS.md.
//
// RULES-SIZE BASELINE (Gemini Phase 0 gate): this branch's
// firestore.rules = main 1918766 + the Step 15 delta (ported
// verbatim, commit 39ab523) + the Step 17 fixes. Stripped
// 176,707 bytes before the fixes; release-create probe measured
// compiled 260,991 (OVER by 4,991) — the rules in this branch
// CANNOT deploy until the public-ID refactor (23 Nov 14:30 cron)
// frees ~4,992 bytes. Re-measure after any edit with
// ~/workspace/eduorbit/step17-rules-size-probe.mjs.
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
  addDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPracticeSession } from '../src/lib/jobEngine';
import type { JobQuestionBundle } from '../src/lib/jobQuestions';

const PROJECT_ID = 'eduvelto-rules-test-step17-security';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('match /jobReports/{reportId}')) {
  throw new Error('firestore.rules does not contain the Step 15 jobReports match (Step 15 delta not ported).');
}
if (!RULES_TEXT.includes('isVerifiedJobBankAuthor()')) {
  throw new Error('firestore.rules does not contain isVerifiedJobBankAuthor (M2 fix not applied).');
}
if (!RULES_TEXT.includes("match /users/{uid}/nuSessions/{sessionId}")) {
  throw new Error('firestore.rules does not contain the nuSessions match.');
}

const NOW = Date.now();
const TS = (ms: number) => Timestamp.fromMillis(ms);
// Receipt windows use the REAL clock (request.time is the emulator's
// server time): 6 minutes ago is outside the 5-minute create window,
// 11 minutes ago is outside the 10-minute read window.
const SIX_MIN_AGO = TS(NOW - 6 * 60 * 1000);
const ELEVEN_MIN_AGO = TS(NOW - 11 * 60 * 1000);
const FIVE_MIN_FUTURE = TS(NOW + 5 * 60 * 1000);
const THIRTY_DAYS_FUTURE = TS(NOW + 30 * 24 * 60 * 60 * 1000);
const NOW_TS = TS(NOW);

const VALID_SUBJECT = {
  examSlug: 'bcs',
  nameBn: 'বাংলা',
  nameEn: 'Bangla',
  order: 1,
  marks: 35,
  syllabusSource: 'BPSC বিজ্ঞপ্তি',
  reviewStatus: 'Not Started',
  status: 'draft',
  authorId: 'teacher-1',
  verifiedBy: null,
  verifiedAt: null,
  createdAt: NOW_TS,
  updatedAt: NOW_TS,
};
const VALID_CHAPTER = {
  examSlug: 'bcs',
  subjectId: 'bcs__bangla',
  nameBn: 'ব্যাকরণ',
  nameEn: 'Grammar',
  descriptionBn: 'ব্যাকরণের অধ্যায়',
  descriptionEn: 'Grammar chapter',
  order: 1,
  reviewStatus: 'Not Started',
  status: 'draft',
  authorId: 'teacher-1',
  verifiedBy: null,
  verifiedAt: null,
  createdAt: NOW_TS,
  updatedAt: NOW_TS,
};

/** Minimal 3-question topic bundle (same shape as the Step 13 fixture). */
const TENSE_BUNDLE: JobQuestionBundle = {
  kind: 'topic',
  examSlug: 'bcs',
  topicId: 'bcs__english__grammar__tense',
  mockId: null,
  titleBn: 'বিসিএস English — Grammar — Tense',
  titleEn: 'BCS English — Grammar — Tense',
  questions: [1, 2, 3].map((n) => ({
    n,
    questionId: `bcs-eng-00${n}`,
    topicId: 'bcs__english__grammar__tense',
    subjectId: 'bcs__english',
    questionText: `Question ${n}.`,
    options: [
      { letter: 'A', text: 'Option A' },
      { letter: 'B', text: 'Option B' },
      { letter: 'C', text: 'Option C' },
      { letter: 'D', text: 'Option D' },
    ],
    difficulty: 'easy' as const,
  })),
  questionCount: 3,
  bundleVersion: 1,
  status: 'published',
  reviewStatus: 'Published',
  sourceQuestionIds: ['bcs-eng-001', 'bcs-eng-002', 'bcs-eng-003'],
  configVersion: '1',
  createdAt: NOW_TS,
  updatedAt: NOW_TS,
};
const TENSE_ID = 'topic__bcs__english__grammar__tense';

function validBook(authorId: string): Record<string, unknown> {
  return {
    title: 'Step 17 test book',
    titleBn: 'পরীক্ষার বই',
    descriptionBn: 'বিবরণ',
    descriptionEn: 'Description',
    educationType: 'honours',
    classLevels: ['3rd Year'],
    subject: 'English',
    reviewStatus: 'Not Started',
    status: 'draft',
    authorId,
    sourceUrl: 'https://example.com/book',
    createdAt: NOW_TS,
    updatedAt: NOW_TS,
  };
}
function validQuizAttempt(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    quizId: 'quiz1',
    kind: 'mcq',
    answers: [{ n: 1, topic: 'Drama', text: 'Shakespeare', correct: true, marks: 1 }],
    score: 1,
    totalMarks: 1,
    percentage: 100,
    markingStatus: 'auto',
    scored: false,
    status: 'submitted',
    userId: 'student-1',
    ...overrides,
  };
}
function validCircular(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    examSlug: 'bcs',
    postTitleBn: '৪৭তম বিসিএস — সাধারণ ক্যাডার',
    postTitleEn: '47th BCS — General Cadre',
    circularNumber: '47',
    publishedDate: NOW_TS,
    applicationDeadline: TS(NOW + 5 * 24 * 60 * 60 * 1000),
    deadlinePrecision: 'datetime',
    totalPosts: 100,
    eligibilitySummaryBn: 'স্নাতক ডিগ্রি।',
    eligibilitySummaryEn: 'Bachelor degree.',
    officialUrl: 'https://bpsc.gov.bd/circular/47',
    applyUrl: 'https://bpsc.teletalk.com.bd',
    copyStatus: 'link-only',
    copyTextExcerpt: null,
    reviewStatus: 'published',
    verifiedBy: 'moderator-1',
    verifiedAt: NOW_TS,
    examDate: TS(NOW + 30 * 24 * 60 * 60 * 1000),
    applicationStartDate: NOW_TS,
    authorId: 'moderator-1',
    createdAt: NOW_TS,
    updatedAt: NOW_TS,
    ...overrides,
  };
}
function validReport(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    reporterId: 'student-1',
    targetType: 'jobCircular',
    targetId: 'circ-pub',
    targetAuthorId: 'moderator-1',
    reason: 'wrong-deadline',
    details: 'The deadline on the page does not match the circular.',
    suggestedValue: '2026-12-20',
    evidenceUrl: 'https://bpsc.gov.bd/circular/47',
    status: 'open',
    priority: 'normal',
    resolvedBy: null,
    resolvedAt: null,
    resolutionNote: null,
    createdAt: NOW_TS,
    updatedAt: NOW_TS,
    ...overrides,
  };
}
function validCorrection(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    requesterId: 'student-1',
    targetType: 'jobCircular',
    targetId: 'circ-pub',
    whatsWrong: 'The deadline is wrong.',
    proposedFix: 'Change the deadline to 20 Dec 2026.',
    source: 'https://bpsc.gov.bd/circular/47',
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    createdAt: NOW_TS,
    updatedAt: NOW_TS,
    ...overrides,
  };
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role, extra] of [
      ['owner-1', 'owner', {}],
      ['admin-1', 'admin', {}],
      ['admin-2', 'admin', {}],
      ['moderator-1', 'moderator', {}],
      ['moderator-2', 'moderator', {}],
      ['student-1', 'student', {}],
      ['student-2', 'student', {}],
      ['teacher-verified', 'teacher', { verificationStatus: 'verified' }],
      ['teacher-pending', 'teacher', { verificationStatus: 'pending' }],
      ['teacher-rejected', 'teacher', { verificationStatus: 'rejected' }],
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
    // Academic quiz + key (quiz1: 1 question, totalMarks 1).
    await setDoc(doc(db, 'quizzes', 'quiz1'), {
      title: 'Test Quiz — MCQ পরীক্ষা',
      bookId: 'book1',
      subject: 'English',
      department: 'English',
      classLevel: '3rd Year',
      educationType: 'honours',
      kind: 'mcq',
      questions: [
        { n: 1, topic: 'Drama', question: 'Who wrote Macbeth?', options: [{ letter: 'A', text: 'Marlowe' }, { letter: 'B', text: 'Shakespeare' }], marks: 1 },
      ],
      questionCount: 1,
      totalMarks: 1,
      timeLimitMinutes: 30,
      reviewStatus: 'Published',
    });
    await setDoc(doc(db, 'quizKeys', 'quiz1'), {
      quizId: 'quiz1',
      answers: [{ n: 1, correctLetter: 'B', correctText: 'Shakespeare' }],
    });
    // Second quiz (same shape) so a receipt can name a real attempt
    // that belongs to a DIFFERENT quiz (c1c).
    await setDoc(doc(db, 'quizzes', 'quiz2'), {
      title: 'Second Test Quiz',
      bookId: 'book1',
      subject: 'English',
      department: 'English',
      classLevel: '3rd Year',
      educationType: 'honours',
      kind: 'mcq',
      questions: [
        { n: 1, topic: 'Drama', question: 'Who wrote Hamlet?', options: [{ letter: 'A', text: 'Marlowe' }, { letter: 'B', text: 'Shakespeare' }], marks: 1 },
      ],
      questionCount: 1,
      totalMarks: 1,
      timeLimitMinutes: 30,
      reviewStatus: 'Published',
    });
    await setDoc(doc(db, 'quizKeys', 'quiz2'), {
      quizId: 'quiz2',
      answers: [{ n: 1, correctLetter: 'B', correctText: 'Shakespeare' }],
    });
    // Books + chapters for the M2 / guest-read tests.
    await setDoc(doc(db, 'books', 'book-draft-pending'), validBook('teacher-pending'));
    await setDoc(doc(db, 'books', 'book-pub'), { ...validBook('owner-1'), reviewStatus: 'Published', status: 'published' });
    await setDoc(doc(db, 'chapters', 'ch-preview'), {
      title: 'Preview chapter', body: 'Preview text.', language: 'bn',
      bookId: 'book-pub', reviewStatus: 'Published', status: 'published',
      isPreview: true, authorId: 'owner-1', createdAt: NOW_TS, updatedAt: NOW_TS,
    });
    await setDoc(doc(db, 'chapters', 'ch-nopreview'), {
      title: 'Full chapter', body: 'Full text.', language: 'bn',
      bookId: 'book-pub', reviewStatus: 'Published', status: 'published',
      authorId: 'owner-1', createdAt: NOW_TS, updatedAt: NOW_TS,
    });
    // Community Q&A fixture (H2 variants).
    await setDoc(doc(db, 'questions', 'q-comm-1'), {
      authorId: 'student-1', title: 'Why is the sky blue?',
      body: 'Explain Rayleigh scattering.', reviewStatus: 'Under Review',
    });
    await setDoc(doc(db, 'questions', 'q-comm-1', 'answers', 'a-comm-1'), {
      authorId: 'student-1', body: 'Because air scatters blue light more.',
      reviewStatus: 'Under Review', isAccepted: false,
    });
    // Circulars (Step 14/15 shapes).
    await setDoc(doc(db, 'circulars', 'circ-pub'), validCircular({}));
    await setDoc(doc(db, 'circulars', 'circ-draft'), validCircular({
      postTitleBn: 'খসড়া বিজ্ঞপ্তি', postTitleEn: 'Draft circular',
      reviewStatus: 'draft', verifiedBy: null, verifiedAt: null,
    }));
    // Job subject parent for the M2 jobChapters test.
    await setDoc(doc(db, 'jobSubjects', 'bcs__bangla'), VALID_SUBJECT);
    // NU attempts: one submitted (anchor for L2), one in-progress,
    // one with a deadline already past (C2 variant).
    await setDoc(doc(db, 'users', 'student-1', 'nuAttempts', 'att-sub'), {
      userId: 'student-1', status: 'submitted', kind: 'mock',
      bundleId: 'nu-bundle-1', questionIds: Array.from({ length: 100 }, (_, i) => `q${i + 1}`),
      startedAt: TS(NOW - 60 * 60 * 1000), deadlineAt: TS(NOW + 60 * 60 * 1000),
      submittedAt: TS(NOW - 30 * 60 * 1000),
      configSnapshot: { totalQuestions: 100, durationSeconds: 3600 },
      answers: {}, score: 50, percentage: 50, correctCount: 50, wrongCount: 50, unansweredCount: 0,
    });
    await setDoc(doc(db, 'users', 'student-1', 'nuAttempts', 'att-prog'), {
      userId: 'student-1', status: 'not_started', kind: 'mock',
      bundleId: 'nu-bundle-1', questionIds: Array.from({ length: 100 }, (_, i) => `q${i + 1}`),
      startedAt: TS(NOW), deadlineAt: TS(NOW + 3600 * 1000),
      configSnapshot: { totalQuestions: 100, durationSeconds: 3600 },
      answers: {},
    });
    await setDoc(doc(db, 'users', 'student-1', 'nuAttempts', 'att-past'), {
      userId: 'student-1', status: 'not_started', kind: 'mock',
      bundleId: 'nu-bundle-1', questionIds: Array.from({ length: 100 }, (_, i) => `q${i + 1}`),
      startedAt: TS(NOW - 2 * 60 * 60 * 1000), deadlineAt: TS(NOW - 60 * 60 * 1000),
      configSnapshot: { totalQuestions: 100, durationSeconds: 3600 },
      answers: {},
    });
    // NU bundle + key for the L2 honest-path read.
    await setDoc(doc(db, 'nuQuestionBundles', 'nu-bundle-1'), {
      bundleId: 'nu-bundle-1', status: 'published', kind: 'mock',
      titleBn: 'NU mock bundle', questions: [{ n: 1, question: 'Q1?', options: ['A', 'B'] }],
    });
    await setDoc(doc(db, 'nuQuestionKeys', 'nu-bundle-1'), {
      bundleId: 'nu-bundle-1', answers: [{ n: 1, correctLetter: 'A' }],
    });
    // NU session (§19.2.9 shape) for the L3 tests.
    await setDoc(doc(db, 'users', 'student-1', 'nuSessions', 'sess-nu-1'), {
      attemptId: 'att-prog', status: 'in_progress', startedAt: TS(NOW),
      deadlineAt: TS(NOW + 3600 * 1000), lastSavedAt: TS(NOW),
      answers: { '1': 'A' }, deviceInfo: 'test-device',
      updatedAt: NOW_TS,
    });
    // Step 15 fixtures: one open report + one pending correction.
    await setDoc(doc(db, 'jobReports', 'rep-1'), validReport({}));
    await setDoc(doc(db, 'jobCorrections', 'cor-1'), validCorrection({}));
    // Step 13 subset fixture: the published tense topic bundle.
    await setDoc(doc(db, 'jobQuestionBundles', TENSE_ID), { ...TENSE_BUNDLE });
    // A submitted academic attempt for the C1 honest-path E2E (i17)
    // is created by the test itself through the rules-checked path.
  });
}

const asGuest = () => env.unauthenticatedContext().firestore();
const asUser = (uid: string) => env.authenticatedContext(uid).firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: PROJECT_ID });
  await seed();
}, 120000);

afterAll(async () => {
  await env.cleanup();
});

describe('Step 17 — C1 receipt-gating variants (audit fix re-test)', () => {
  it('(c1a) receipt create with createdAt 6 minutes old is DENIED (5-minute create window)', async () => {
    // First create the anchor attempt through the rules-checked path.
    const attemptRef = await addDoc(
      collection(asUser('student-1'), 'users', 'student-1', 'quizAttempts'),
      validQuizAttempt({}),
    );
    await assertFails(
      setDoc(doc(asUser('student-1'), 'quizReceipts', 'student-1_quiz1'), {
        userId: 'student-1', quizId: 'quiz1', attemptId: attemptRef.id, createdAt: SIX_MIN_AGO,
      }),
    );
  });

  it('(c1b) receipt create with a FUTURE createdAt is DENIED', async () => {
    const attemptRef = await addDoc(
      collection(asUser('student-1'), 'users', 'student-1', 'quizAttempts'),
      validQuizAttempt({}),
    );
    await assertFails(
      setDoc(doc(asUser('student-1'), 'quizReceipts', 'student-1_quiz1'), {
        userId: 'student-1', quizId: 'quiz1', attemptId: attemptRef.id, createdAt: FIVE_MIN_FUTURE,
      }),
    );
  });

  it('(c1c) receipt create for an attempt naming a DIFFERENT quiz is DENIED', async () => {
    const attemptRef = await addDoc(
      collection(asUser('student-1'), 'users', 'student-1', 'quizAttempts'),
      validQuizAttempt({ quizId: 'quiz2' }),
    );
    // The create rule requires the attempt's quizId to match the receipt's.
    await assertFails(
      setDoc(doc(asUser('student-1'), 'quizReceipts', 'student-1_quiz1'), {
        userId: 'student-1', quizId: 'quiz1', attemptId: attemptRef.id, createdAt: NOW_TS,
      }),
    );
  });

  it('(c1d) a key read anchored to ANOTHER student\'s submitted attempt is DENIED', async () => {
    // student-2 files a submitted attempt, then student-1 tries to use it.
    const attemptRef = await addDoc(
      collection(asUser('student-2'), 'users', 'student-2', 'quizAttempts'),
      validQuizAttempt({ userId: 'student-2' }),
    );
    await assertFails(
      setDoc(doc(asUser('student-1'), 'quizReceipts', 'student-1_quiz1'), {
        userId: 'student-1', quizId: 'quiz1', attemptId: attemptRef.id, createdAt: NOW_TS,
      }),
    );
    // Even a seeded receipt pointing at student-2's attempt opens nothing.
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'quizReceipts', 'student-1_quiz1'), {
        userId: 'student-1', quizId: 'quiz1', attemptId: attemptRef.id, createdAt: NOW_TS,
      });
    });
    await assertFails(getDoc(doc(asUser('student-1'), 'quizKeys', 'quiz1')));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'quizReceipts', 'student-1_quiz1'));
    });
  });

  it('(i17) HONEST E2E: unscored submitted attempt → receipt → key read → scored update SUCCEEDS', async () => {
    const db = asUser('student-1');
    const attemptRef = await addDoc(
      collection(db, 'users', 'student-1', 'quizAttempts'),
      validQuizAttempt({}),
    );
    await assertSucceeds(
      setDoc(doc(db, 'quizReceipts', 'student-1_quiz1'), {
        userId: 'student-1', quizId: 'quiz1', attemptId: attemptRef.id, createdAt: NOW_TS,
      }),
    );
    const key = await assertSucceeds(getDoc(doc(db, 'quizKeys', 'quiz1')));
    expect((key.data() as { answers: unknown[] }).answers).toHaveLength(1);
    await assertSucceeds(
      updateDoc(doc(db, 'users', 'student-1', 'quizAttempts', attemptRef.id), {
        score: 1, percentage: 100, scored: true, updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(deleteDoc(doc(db, 'quizReceipts', 'student-1_quiz1')));
  });

  it('(c1e) a receipt seeded 11 minutes old does NOT open the key', async () => {
    const attemptRef = await addDoc(
      collection(asUser('student-1'), 'users', 'student-1', 'quizAttempts'),
      validQuizAttempt({}),
    );
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'quizReceipts', 'student-1_quiz1'), {
        userId: 'student-1', quizId: 'quiz1', attemptId: attemptRef.id, createdAt: ELEVEN_MIN_AGO,
      });
    });
    await assertFails(getDoc(doc(asUser('student-1'), 'quizKeys', 'quiz1')));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'quizReceipts', 'student-1_quiz1'));
    });
  });
});

describe('Step 17 — C2 deadline-immutability variants (audit fix re-test)', () => {
  it('(c2a) a partial update SNEAKING deadlineAt in alongside allowed fields is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asUser('student-1'), 'users', 'student-1', 'nuAttempts', 'att-prog'), {
        answers: { '1': 'B' },
        deadlineAt: TS(NOW + 5 * 3600 * 1000),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('(c2b) changing questionIds mid-attempt is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asUser('student-1'), 'users', 'student-1', 'nuAttempts', 'att-prog'), {
        questionIds: ['only-one'],
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('(c2c) ANY update after the deadline has passed is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asUser('student-1'), 'users', 'student-1', 'nuAttempts', 'att-past'), {
        answers: { '1': 'B' },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('(c2d) HONEST: an answers autosave before the deadline SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asUser('student-1'), 'users', 'student-1', 'nuAttempts', 'att-prog'), {
        answers: { '1': 'B' },
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe('Step 17 — H1 score-bound boundaries (audit fix re-test)', () => {
  it('(h1a) HONEST boundaries: score == totalMarks and percentage == 100 SUCCEED', async () => {
    await assertSucceeds(
      addDoc(collection(asUser('student-1'), 'users', 'student-1', 'quizAttempts'),
        validQuizAttempt({ score: 1, totalMarks: 1, percentage: 100 })),
    );
  });

  it('(h1b) score -1 is DENIED', async () => {
    await assertFails(
      addDoc(collection(asUser('student-1'), 'users', 'student-1', 'quizAttempts'),
        validQuizAttempt({ score: -1, percentage: 0 })),
    );
  });

  it('(h1c) percentage 100.01 is DENIED', async () => {
    await assertFails(
      addDoc(collection(asUser('student-1'), 'users', 'student-1', 'quizAttempts'),
        validQuizAttempt({ score: 1, percentage: 100.01 })),
    );
  });

  it('(h1d) totalMarks 0 is DENIED', async () => {
    await assertFails(
      addDoc(collection(asUser('student-1'), 'users', 'student-1', 'quizAttempts'),
        validQuizAttempt({ score: 0, totalMarks: 0, percentage: 0 })),
    );
  });
});

describe('Step 17 — H2 community-answer variants (audit fix re-test)', () => {
  it('(h2a) the question author changing reviewStatus is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asUser('student-1'), 'questions', 'q-comm-1', 'answers', 'a-comm-1'), {
        reviewStatus: 'Published',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('(h2b) the question author changing authorId is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asUser('student-1'), 'questions', 'q-comm-1', 'answers', 'a-comm-1'), {
        authorId: 'student-2',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('(h2c) HONEST: the author setting isAccepted still SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asUser('student-1'), 'questions', 'q-comm-1', 'answers', 'a-comm-1'), {
        isAccepted: true,
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe('Step 17 — M2 pending-teacher authoring (audit open item, FIXED here)', () => {
  it('(m2a) a PENDING teacher creating a book draft is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('teacher-pending'), 'books', 'book-pending-new'), validBook('teacher-pending')),
    );
  });

  it('(m2b) a PENDING teacher creating an educationDirectory entry is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('teacher-pending'), 'educationDirectory', 'dir-pending-new'), {
        nameBn: 'টেস্ট কলেজ', nameEn: 'Test College', type: 'college', district: 'Dhaka',
        address: 'Dhaka', phone: '01700000000', website: 'https://example.com',
        reviewStatus: 'Not Started', status: 'draft', authorId: 'teacher-pending',
        createdAt: NOW_TS, updatedAt: NOW_TS,
      }),
    );
  });

  it('(m2c) a PENDING teacher creating a careerPath draft is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('teacher-pending'), 'careerPaths', 'cp-pending-new'), {
        titleBn: 'ক্যারিয়ার', titleEn: 'Career', descriptionBn: 'বিবরণ', descriptionEn: 'Description',
        reviewStatus: 'Not Started', status: 'draft', authorId: 'teacher-pending',
        createdAt: NOW_TS, updatedAt: NOW_TS,
      }),
    );
  });

  it('(m2d) a PENDING teacher creating a jobChapter draft is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('teacher-pending'), 'jobChapters', 'bcs__bangla__pending'), {
        ...VALID_CHAPTER, authorId: 'teacher-pending',
      }),
    );
  });

  it('(m2e) a REJECTED teacher creating a book draft is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('teacher-rejected'), 'books', 'book-rejected-new'), validBook('teacher-rejected')),
    );
  });

  it('(m2f) HONEST: a VERIFIED teacher creating a book draft SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asUser('teacher-verified'), 'books', 'book-verified-new'), validBook('teacher-verified')),
    );
  });

  it('(m2g) HONEST: the owner creating a book draft SUCCEEDS (owner is never locked out)', async () => {
    await assertSucceeds(
      setDoc(doc(asUser('owner-1'), 'books', 'book-owner-new'), validBook('owner-1')),
    );
  });

  it('(m2h) HONEST: a pending teacher still READS their own draft book', async () => {
    const book = await assertSucceeds(getDoc(doc(asUser('teacher-pending'), 'books', 'book-draft-pending')));
    expect((book.data() as { authorId: string }).authorId).toBe('teacher-pending');
  });

  it('(m2i) HONEST: a VERIFIED teacher creating a jobChapter draft SUCCEEDS (direct isTeacher() create)', async () => {
    await assertSucceeds(
      setDoc(doc(asUser('teacher-verified'), 'jobChapters', 'bcs__bangla__verified'), {
        ...VALID_CHAPTER, authorId: 'teacher-verified',
      }),
    );
  });
});

describe('Step 17 — L1 teacherVerifications key allowlist (audit open item, FIXED here)', () => {
  // The applicant is a user with role 'teacher' (verificationStatus
  // 'pending') — the create rule requires isTeacher(); the doc id is
  // tv_<uid> and userId must equal the caller (see admin.ts
  // submitTeacherApplication and role.test.ts:484).
  const validApplication = {
    id: 'tv_teacher-pending', userId: 'teacher-pending', fullName: 'Test Teacher', teachingLevel: 'HSC',
    subjects: ['English'], classes: ['11', '12'], institution: 'Test College', post: 'Lecturer',
    institutionContact: '01700000000', qualifications: 'MA English', experienceYears: 3,
    verificationReason: 'I teach English.', evidenceRef: 'https://example.com/evidence',
    status: 'pending', verificationStatus: 'pending', submittedAt: NOW_TS,
    updatedAt: NOW_TS, createdAt: NOW_TS,
  };

  it('(l1a) a forged application smuggling `checks` is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('teacher-pending'), 'teacherVerifications', 'tv_teacher-pending'), {
        ...validApplication, checks: [{ field: 'institution', passed: true }],
      }),
    );
    // Cleanup: on unfixed rules the forged create SUCCEEDS and would
    // pollute l1d (the doc would exist, turning its create into an
    // update). Post-fix nothing was created and this is a no-op.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'teacherVerifications', 'tv_teacher-pending'));
    });
  });

  it('(l1b) a forged application smuggling `verifiedAt` is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('teacher-pending'), 'teacherVerifications', 'tv_teacher-pending'), {
        ...validApplication, verifiedAt: NOW_TS,
      }),
    );
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'teacherVerifications', 'tv_teacher-pending'));
    });
  });

  it('(l1c) a forged application smuggling `decision` is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('teacher-pending'), 'teacherVerifications', 'tv_teacher-pending'), {
        ...validApplication, decision: 'approved',
      }),
    );
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'teacherVerifications', 'tv_teacher-pending'));
    });
  });

  it('(l1d) HONEST: a clean application with exactly the client keys SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asUser('teacher-pending'), 'teacherVerifications', 'tv_teacher-pending'), validApplication),
    );
  });
});

describe('Step 17 — L2 nuReceipts (audit open item, FIXED here)', () => {
  const freshReceipt = (overrides: Record<string, unknown>) => ({
    userId: 'student-1', bundleId: 'nu-bundle-1', attemptId: 'att-sub', createdAt: NOW_TS,
    ...overrides,
  });

  it('(l2a) a receipt create for an UNSUBMITTED attempt is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('student-1'), 'nuReceipts', 'student-1_nu-bundle-1'), freshReceipt({ attemptId: 'att-prog' })),
    );
    // Cleanup (see l1a): on unfixed rules the receipt IS created and
    // would turn l2d's create into a denied update.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'nuReceipts', 'student-1_nu-bundle-1'));
    });
  });

  it('(l2b) a receipt create for a NON-EXISTENT attempt is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('student-1'), 'nuReceipts', 'student-1_nu-bundle-1'), freshReceipt({ attemptId: 'att-missing' })),
    );
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'nuReceipts', 'student-1_nu-bundle-1'));
    });
  });

  it('(l2c) a receipt create with createdAt 6 minutes old is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('student-1'), 'nuReceipts', 'student-1_nu-bundle-1'), freshReceipt({ createdAt: SIX_MIN_AGO })),
    );
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'nuReceipts', 'student-1_nu-bundle-1'));
    });
  });

  it('(l2d) HONEST E2E: fresh receipt for the submitted mock attempt SUCCEEDS and opens the key', async () => {
    const db = asUser('student-1');
    await assertSucceeds(
      setDoc(doc(db, 'nuReceipts', 'student-1_nu-bundle-1'), freshReceipt({})),
    );
    const key = await assertSucceeds(getDoc(doc(db, 'nuQuestionKeys', 'nu-bundle-1')));
    expect((key.data() as { answers: unknown[] }).answers).toHaveLength(1);
    await assertSucceeds(deleteDoc(doc(db, 'nuReceipts', 'student-1_nu-bundle-1')));
  });

  it('(l2e) a FUTURE-dated seeded receipt does NOT open the key (read gate now bounds createdAt)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'nuReceipts', 'student-1_nu-bundle-1'), {
        userId: 'student-1', bundleId: 'nu-bundle-1', attemptId: 'att-sub',
        createdAt: THIRTY_DAYS_FUTURE,
      });
    });
    await assertFails(getDoc(doc(asUser('student-1'), 'nuQuestionKeys', 'nu-bundle-1')));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'nuReceipts', 'student-1_nu-bundle-1'));
    });
  });
});

describe('Step 17 — L3 nuSessions field restrictions (audit open item, FIXED here)', () => {
  it('(l3a) a session create smuggling `score` is DENIED', async () => {
    await assertFails(
      setDoc(doc(asUser('student-1'), 'users', 'student-1', 'nuSessions', 'sess-new'), {
        attemptId: 'att-prog', status: 'in_progress', startedAt: NOW_TS,
        deadlineAt: TS(NOW + 3600 * 1000), lastSavedAt: NOW_TS, answers: {}, deviceInfo: 'd',
        score: 99, updatedAt: NOW_TS,
      }),
    );
  });

  it('(l3b) a session update SNEAKING a deadlineAt change is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asUser('student-1'), 'users', 'student-1', 'nuSessions', 'sess-nu-1'), {
        lastSavedAt: NOW_TS, deadlineAt: TS(NOW + 5 * 3600 * 1000), updatedAt: NOW_TS,
      }),
    );
  });

  it('(l3c) a session update changing attemptId is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asUser('student-1'), 'users', 'student-1', 'nuSessions', 'sess-nu-1'), {
        attemptId: 'att-other', updatedAt: NOW_TS,
      }),
    );
  });

  it('(l3d) HONEST: an autosave update (answers + lastSavedAt) SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asUser('student-1'), 'users', 'student-1', 'nuSessions', 'sess-nu-1'), {
        answers: { '1': 'B' }, lastSavedAt: NOW_TS, updatedAt: NOW_TS,
      }),
    );
  });

  it('(l3e) HONEST: a session create with exactly the design-doc fields SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asUser('student-1'), 'users', 'student-1', 'nuSessions', 'sess-new'), {
        attemptId: 'att-prog', status: 'in_progress', startedAt: NOW_TS,
        deadlineAt: TS(NOW + 3600 * 1000), lastSavedAt: NOW_TS, answers: {}, deviceInfo: 'd',
        updatedAt: NOW_TS,
      }),
    );
  });
});

describe('Step 17 — L4 admin-to-admin protection (audit open item, FIXED here)', () => {
  it('(l4a) an admin DEMOTING a fellow admin is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asUser('admin-1'), 'users', 'admin-2'), {
        role: 'student',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('(l4b) an admin SUSPENDING a fellow admin is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asUser('admin-1'), 'users', 'admin-2'), {
        isActive: false,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('(l4c) HONEST: the owner demoting an admin SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asUser('owner-1'), 'users', 'admin-2'), {
        role: 'moderator',
        updatedAt: serverTimestamp(),
      }),
    );
    // Restore the fixture for the rest of the suite.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'admin-2'), {
        displayName: 'admin-2', email: 'admin-2@example.com', role: 'admin',
        language: 'bn', isActive: true,
      });
    });
  });
});

describe('Step 17 — Step 15 admin gaps (k15, FIXED where rules can)', () => {
  it('(k15a) a moderator deciding a report CANNOT rewrite reporterId or targetId', async () => {
    await assertFails(
      updateDoc(doc(asUser('moderator-1'), 'jobReports', 'rep-1'), {
        status: 'resolved', reporterId: 'student-2', resolvedBy: 'moderator-1',
        resolvedAt: NOW_TS, resolutionNote: 'Fixed the deadline.', updatedAt: NOW_TS,
      }),
    );
    await assertFails(
      updateDoc(doc(asUser('moderator-1'), 'jobReports', 'rep-1'), {
        status: 'resolved', targetId: 'circ-other', resolvedBy: 'moderator-1',
        resolvedAt: NOW_TS, resolutionNote: 'Fixed the deadline.', updatedAt: NOW_TS,
      }),
    );
  });

  it('(k15b) a moderator deciding a correction CANNOT rewrite whatsWrong or proposedFix', async () => {
    await assertFails(
      updateDoc(doc(asUser('moderator-1'), 'jobCorrections', 'cor-1'), {
        status: 'accepted', whatsWrong: 'Rewritten by the decider.', decidedBy: 'moderator-1',
        decidedAt: NOW_TS, decisionReason: 'Verified against the official notice.', updatedAt: NOW_TS,
      }),
    );
    await assertFails(
      updateDoc(doc(asUser('moderator-1'), 'jobCorrections', 'cor-1'), {
        status: 'accepted', proposedFix: 'Rewritten by the decider.', decidedBy: 'moderator-1',
        decidedAt: NOW_TS, decisionReason: 'Verified against the official notice.', updatedAt: NOW_TS,
      }),
    );
  });

  it('(k15c) DOCUMENTED-LIMITATION: a report filed against a DRAFT circular is ALLOWED by rules (no target-exists/published check — queue pollution only, low). The client must not surface drafts as reportable targets.', async () => {
    await assertSucceeds(
      addDoc(collection(asUser('student-1'), 'jobReports'), validReport({ targetId: 'circ-draft' })),
    );
  });

  it('(k15d) DOCUMENTED-LIMITATION: a moderator CAN publish their own draft circular by rules (no-self-approval is client-enforced via canApproveCircular until the post-refactor rules follow-up). This test records the behaviour — it must become assertFails once that follow-up lands.', async () => {
    // moderator-1 authored circ-draft; the rules allow a moderator to
    // flip its reviewStatus to published. The client refuses.
    await assertSucceeds(
      updateDoc(doc(asUser('moderator-1'), 'circulars', 'circ-draft'), {
        reviewStatus: 'published', verifiedBy: 'moderator-1', verifiedAt: NOW_TS, updatedAt: NOW_TS,
      }),
    );
    // Restore the draft state for the rest of the suite.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'circulars', 'circ-draft'), {
        reviewStatus: 'draft', verifiedBy: null, verifiedAt: null,
      });
    });
  });
});

describe('Step 17 — guest / auth boundaries (g)', () => {
  it('(g1) a GUEST reading a signed-in-only quiz is DENIED', async () => {
    await assertFails(getDoc(doc(asGuest(), 'quizzes', 'quiz1')));
  });

  it('(g2) a GUEST reading a PREVIEW chapter is ALLOWED', async () => {
    const ch = await assertSucceeds(getDoc(doc(asGuest(), 'chapters', 'ch-preview')));
    expect((ch.data() as { isPreview: boolean }).isPreview).toBe(true);
  });

  it('(g3) a GUEST reading a NON-preview chapter is DENIED', async () => {
    await assertFails(getDoc(doc(asGuest(), 'chapters', 'ch-nopreview')));
  });

  it('(g4) a GUEST reading a PUBLISHED circular is ALLOWED', async () => {
    const circ = await assertSucceeds(getDoc(doc(asGuest(), 'circulars', 'circ-pub')));
    expect((circ.data() as { reviewStatus: string }).reviewStatus).toBe('published');
  });

  it('(g5) a GUEST reading a DRAFT circular is DENIED', async () => {
    await assertFails(getDoc(doc(asGuest(), 'circulars', 'circ-draft')));
  });

  it('(g6) a GUEST reading a users doc is DENIED', async () => {
    await assertFails(getDoc(doc(asGuest(), 'users', 'student-1')));
  });

  it('(g7) a student LISTING another student\'s attempts is DENIED', async () => {
    await assertFails(
      getDocs(query(collection(asUser('student-2'), 'users', 'student-1', 'quizAttempts'), limit(1))),
    );
  });

  it('(g8) a student reading ANOTHER student\'s users doc is DENIED', async () => {
    await assertFails(getDoc(doc(asUser('student-2'), 'users', 'student-1')));
  });

  it('(g9) a student writing to the settings doc is DENIED (owner-only)', async () => {
    await assertFails(
      setDoc(doc(asUser('student-1'), 'settings', 'ads'), {
        'in-feed': false, 'in-feed-2': false, updatedAt: NOW_TS,
      }),
    );
  });

  it('(g10) a student reading an adminAction log is DENIED', async () => {
    await assertFails(getDoc(doc(asUser('student-1'), 'adminActions', 'act-1')));
  });

  it('(g11) a SUSPENDED student creating an attempt is DENIED', async () => {
    await assertFails(
      addDoc(collection(asUser('suspended-1'), 'users', 'suspended-1', 'quizAttempts'),
        validQuizAttempt({ userId: 'suspended-1' })),
    );
  });
});

describe('Step 17 — Step 13 subset-session membership, multi-key variant (r7–r8)', () => {
  it('(r7) a 2-question SUBSET session (refs n=1, n=3) with currentQuestion=3 creates', async () => {
    const session = createPracticeSession({
      sessionId: 'sess-subset-2q', bundleId: TENSE_ID, examSlug: 'bcs',
      questionRefs: [
        { bundleId: TENSE_ID, n: 1, questionId: 'bcs-eng-001' },
        { bundleId: TENSE_ID, n: 3, questionId: 'bcs-eng-003' },
      ],
    });
    await assertSucceeds(
      setDoc(doc(asUser('student-1'), 'users', 'student-1', 'jobSessions', 'sess-subset-2q'), session),
    );
  });

  it('(r8) the same subset session with currentQuestion=2 is DENIED (2 is not in the answers map)', async () => {
    const session = createPracticeSession({
      sessionId: 'sess-subset-2q-bad', bundleId: TENSE_ID, examSlug: 'bcs',
      questionRefs: [
        { bundleId: TENSE_ID, n: 1, questionId: 'bcs-eng-001' },
        { bundleId: TENSE_ID, n: 3, questionId: 'bcs-eng-003' },
      ],
    });
    await assertFails(
      setDoc(doc(asUser('student-1'), 'users', 'student-1', 'jobSessions', 'sess-subset-2q-bad'), {
        ...session, currentQuestion: 2,
      }),
    );
  });
});
