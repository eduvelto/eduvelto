// Eduvelto — Job Preparation dashboard (Step 11) rules tests.
//
// (r1–r6) READ-PATH PROOF, no rule change: the dashboard reads
// only collections whose owner-read rules already exist (Step
// 8/9 attempts, published bundles, the student's own
// userAchievements). The bar from Step 10 holds — "only add a
// rule if a needed list query is actually denied" — and nothing
// here is denied, so NO rule change ships with Step 11.
// (i12) REAL-CONTENT E2E — the Step 9 i10 / Step 10 i11 fixture
// (3 VERBATIM BCS English questions bcs-eng-001/002/003):
// 4 practice attempts (D/D/D — Q3 correct, Q1+Q2 wrong) on
// today ×2, yesterday ×1, 3 days ago ×1, plus 1 mock (C/A/D —
// all correct) today; then the Step 11 dashboard lib runs over
// the STORED attempts read back from the emulator: per-exam
// progress, streak, week activity, weak topics, recommendation,
// achievements, wrong-answer summary. No number here is
// invented — every expected value is computed from the verbatim
// fixture + the submitted answers.
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
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  attemptSummaryFromStored,
  type JobAttemptSummary,
} from '../src/lib/jobAnalysis';
import {
  buildJobAttemptDoc,
  createMockSession,
  createPracticeSession,
  jobExamPattern,
  scoreMockAttempt,
  scorePracticeAttempt,
  validateAttemptResult,
  type JobAttemptResult,
} from '../src/lib/jobEngine';
import type { JobQuestionBundle, JobQuestionKey } from '../src/lib/jobQuestions';
import {
  computeStreakDays,
  dashboardAchievements,
  dashboardWeakTopics,
  perExamProgress,
  pickRecommendation,
  weekActivity,
  wrongAnswerSummary,
} from '../src/lib/jobDashboard';

const PROJECT_ID = 'eduvelto-rules-test-step11-dashboard';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobExamAttempts')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 9 jobExamAttempts match.`);
}
if (!RULES_TEXT.includes('userAchievements')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the userAchievements match.`);
}

const TS = new Date('2026-11-22T08:00:00.000Z');

/* The REAL fixture — verbatim from the Step 9 i10 E2E (itself
 * verbatim from the live BCS English batch 1 draft,
 * team/job-questions-bcs-english-draft-2026-11-22.json).
 * Nothing is invented here. */
const REAL_BUNDLE_ID = 'mock__full__bcs__e2e';
const REAL_BUNDLE: JobQuestionBundle = {
  kind: 'mock',
  examSlug: 'bcs',
  topicId: null,
  mockId: 'full__bcs__e2e',
  titleBn: 'বিসিএস পূর্ণ মক (বাস্তব প্রশ্ন)',
  titleEn: 'BCS Full Mock (real questions)',
  questions: [
    {
      n: 1, questionId: 'bcs-eng-001', topicId: 'bcs__english__grammar__tense',
      subjectId: 'bcs__english', questionText: 'Choose the correct sentence.',
      options: [
        { letter: 'A', text: 'He go to school every day.' },
        { letter: 'B', text: 'He going to school every day.' },
        { letter: 'C', text: 'He goes to school every day.' },
        { letter: 'D', text: 'He gone to school every day.' },
      ],
      difficulty: 'easy',
    },
    {
      n: 2, questionId: 'bcs-eng-002', topicId: 'bcs__english__grammar__tense',
      subjectId: 'bcs__english', questionText: 'By the time you arrive, I ___ my homework.',
      options: [
        { letter: 'A', text: 'will have finished' },
        { letter: 'B', text: 'will finish' },
        { letter: 'C', text: 'finish' },
        { letter: 'D', text: 'have finished' },
      ],
      difficulty: 'medium',
    },
    {
      n: 3, questionId: 'bcs-eng-003', topicId: 'bcs__english__grammar__tense',
      subjectId: 'bcs__english', questionText: 'She ___ in Dhaka since 2015.',
      options: [
        { letter: 'A', text: 'lives' },
        { letter: 'B', text: 'is living' },
        { letter: 'C', text: 'lived' },
        { letter: 'D', text: 'has been living' },
      ],
      difficulty: 'medium',
    },
  ],
  questionCount: 3,
  bundleVersion: 1,
  status: 'published',
  reviewStatus: 'Published',
  sourceQuestionIds: ['bcs-eng-001', 'bcs-eng-002', 'bcs-eng-003'],
  configVersion: '1',
  createdAt: TS,
  updatedAt: TS,
};
const REAL_KEY: JobQuestionKey = {
  bundleId: REAL_BUNDLE_ID,
  answers: [
    { n: 1, questionId: 'bcs-eng-001', correctLetter: 'C', correctText: 'He goes to school every day.', explanation: 'he third person singular, তাই present simple-এ verb-এর শেষে -s/-es বসে — goes সঠিক।', whyWrong: null },
    { n: 2, questionId: 'bcs-eng-002', correctLetter: 'A', correctText: 'will have finished', explanation: "'By the time you arrive' — ভবিষ্যতের একটা সময়ের আগেই কাজ শেষ হয়ে যাবে, তাই future perfect (will have + past participle) হয়।", whyWrong: null },
    { n: 3, questionId: 'bcs-eng-003', correctLetter: 'D', correctText: 'has been living', explanation: "'since 2015' — অতীত থেকে এখন পর্যন্ত চলছে, তাই present perfect continuous (has/have been + verb-ing) হয়।", whyWrong: null },
  ],
  configVersion: '1',
  createdAt: TS,
  updatedAt: TS,
};
const REAL_SNAPSHOT = {
  questionCount: 3, timeMinutes: 120, marksPerQuestion: 1,
  negativeMarking: 0.5, negativeMarkingVerified: true,
  passPercent: null, scoringConfigVersion: 'v1',
};
const REAL_REFS = [1, 2, 3].map((n) => ({ bundleId: REAL_BUNDLE_ID, n, questionId: `bcs-eng-00${n}` }));

/* The same 3 verbatim questions as a PRACTICE (topic) bundle. */
const PRACTICE_BUNDLE_ID = 'topic__bcs__english__grammar__tense';
const PRACTICE_BUNDLE: JobQuestionBundle = {
  ...REAL_BUNDLE,
  kind: 'topic',
  topicId: 'bcs__english__grammar__tense',
  mockId: null,
  titleBn: 'বিসিএস English — Grammar — Tense',
  titleEn: 'BCS English — Grammar — Tense',
};
const PRACTICE_KEY: JobQuestionKey = { ...REAL_KEY, bundleId: PRACTICE_BUNDLE_ID };

/* A DRAFT bundle for the same exam — the dashboard's "sets
 * available" must never count it. */
const DRAFT_BUNDLE: JobQuestionBundle = {
  ...PRACTICE_BUNDLE,
  titleBn: 'বিসিএস English — Grammar — Voice (খসড়া)',
  titleEn: 'BCS English — Grammar — Voice (draft)',
  topicId: 'bcs__english__grammar__voice',
  status: 'draft',
  reviewStatus: 'Not Started',
};

const DAY = 24 * 60 * 60 * 1000;
/** Seeded attempt dates, anchored to a FIXED Dhaka midday
 * (2026-11-22 14:00 Asia/Dhaka) — never Date.now(), so the
 * day-boundary math is stable no matter when the suite runs. */
const NOW_MS = Date.UTC(2026, 10, 22, 8, 0, 0);

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
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
    await setDoc(doc(db, 'jobQuestionBundles', REAL_BUNDLE_ID), { ...REAL_BUNDLE });
    await setDoc(doc(db, 'jobQuestionKeys', REAL_BUNDLE_ID), { ...REAL_KEY });
    await setDoc(doc(db, 'jobQuestionBundles', PRACTICE_BUNDLE_ID), { ...PRACTICE_BUNDLE });
    await setDoc(doc(db, 'jobQuestionKeys', PRACTICE_BUNDLE_ID), { ...PRACTICE_KEY });
    await setDoc(doc(db, 'jobQuestionBundles', 'topic__bcs__english__grammar__voice'), { ...DRAFT_BUNDLE });

    const pattern = jobExamPattern('bcs');
    if (!pattern) throw new Error('no BCS pattern');
    // 4 practice attempts, D/D/D (Q1+Q2 wrong, Q3 correct):
    // today ×2, yesterday ×1, 3 days ago ×1.
    const practiceDates = [NOW_MS, NOW_MS - 60 * 60 * 1000, NOW_MS - DAY, NOW_MS - 3 * DAY];
    for (let i = 0; i < 4; i += 1) {
      const sessionId = `practice-seed-${i + 1}`;
      const session = createPracticeSession({
        sessionId,
        bundleId: PRACTICE_BUNDLE_ID,
        examSlug: 'bcs',
        questionRefs: REAL_REFS.map((r) => ({ ...r, bundleId: PRACTICE_BUNDLE_ID })),
      });
      const result: JobAttemptResult = scorePracticeAttempt({
        bundle: PRACTICE_BUNDLE,
        key: PRACTICE_KEY,
        answers: PRACTICE_BUNDLE.questions.map((q) => ({
          n: q.n, questionId: q.questionId, selected: 'D' as const, timeSpentSeconds: 45,
        })),
        pattern,
        startedAtMillis: practiceDates[i] - 135 * 1000,
        submittedAtMillis: practiceDates[i],
      });
      const attemptDoc = buildJobAttemptDoc({
        sessionId,
        session,
        result,
        bundleId: PRACTICE_BUNDLE_ID,
        examSlug: 'bcs',
        subjectId: 'bcs__english',
        topicId: 'bcs__english__grammar__tense',
        kind: 'practice',
        bundleVersion: 1,
        userId: 'student-1',
      });
      const problems = validateAttemptResult(attemptDoc);
      if (problems.length > 0) throw new Error(`lib validator rejected its own doc: ${problems.join('; ')}`);
      // Controlled date: the builder stamps serverTimestamp().
      attemptDoc.submittedAt = Timestamp.fromMillis(practiceDates[i]);
      await setDoc(doc(db, 'users', 'student-1', 'jobAttempts', sessionId), attemptDoc);
    }
    // 1 mock attempt, C/A/D (all correct), today.
    const mockSessionId = 'mock-seed-1';
    const mockSession = createMockSession({
      sessionId: mockSessionId,
      mockId: 'full__bcs__e2e',
      bundleId: REAL_BUNDLE_ID,
      examSlug: 'bcs',
      definitionId: 'full__bcs__e2e',
      questionSetId: 'full__bcs__e2e_v1',
      bundleVersion: 1,
      questionRefs: REAL_REFS,
      timeMinutes: 120,
      clientNowMillis: NOW_MS,
    });
    const mockResult: JobAttemptResult = scoreMockAttempt({
      bundle: REAL_BUNDLE,
      key: REAL_KEY,
      answers: REAL_BUNDLE.questions.map((q, i) => ({
        n: q.n,
        questionId: q.questionId,
        selected: (['C', 'A', 'D'] as const)[i],
        timeSpentSeconds: 45,
      })),
      rulesSnapshot: REAL_SNAPSHOT,
      examSlug: 'bcs',
      startedAtMillis: NOW_MS - 135 * 1000,
      submittedAtMillis: NOW_MS,
    });
    const mockAttemptDoc = buildJobAttemptDoc({
      sessionId: mockSessionId,
      session: mockSession,
      result: mockResult,
      bundleId: REAL_BUNDLE_ID,
      examSlug: 'bcs',
      subjectId: null,
      topicId: null,
      kind: 'mock',
      mockId: 'full__bcs__e2e',
      questionSetId: 'full__bcs__e2e_v1',
      bundleVersion: 1,
      userId: 'student-1',
    });
    const mockProblems = validateAttemptResult(mockAttemptDoc);
    if (mockProblems.length > 0) throw new Error(`lib validator rejected its own doc: ${mockProblems.join('; ')}`);
    mockAttemptDoc.submittedAt = Timestamp.fromMillis(NOW_MS - 30 * 60 * 1000);
    await setDoc(doc(db, 'users', 'student-1', 'jobExamAttempts', mockSessionId), mockAttemptDoc);
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

const asStudent = (uid = 'student-1') => env.authenticatedContext(uid).firestore();
const asSignedOut = () => env.unauthenticatedContext().firestore();

/** The dashboard's own list queries, in the exact shape the
 * data module runs them (listJobAttempts / listMockAttempts).
 * `asUid` is the caller, `ownerUid` the collection owner. */
async function listAttemptsAs(
  asUid: string,
  ownerUid: string,
  collectionName: 'jobAttempts' | 'jobExamAttempts',
) {
  const db = asStudent(asUid);
  return getDocs(
    query(
      collection(db, 'users', ownerUid, collectionName),
      where('kind', '==', collectionName === 'jobAttempts' ? 'practice' : 'mock'),
      orderBy('submittedAt', 'desc'),
      limit(20),
    ),
  );
}

describe('Step 11 dashboard read paths (no rule change)', () => {
  it('r1: owner lists own practice attempts', async () => {
    const snap = await assertSucceeds(listAttemptsAs('student-1', 'student-1', 'jobAttempts'));
    expect(snap.docs).toHaveLength(4);
  });

  it('r2: another student cannot list them', async () => {
    await assertFails(listAttemptsAs('student-2', 'student-1', 'jobAttempts'));
  });

  it('r3: signed-out cannot list them', async () => {
    const db = asSignedOut();
    await assertFails(
      getDocs(
        query(
          collection(db, 'users', 'student-1', 'jobAttempts'),
          where('kind', '==', 'practice'),
          orderBy('submittedAt', 'desc'),
          limit(20),
        ),
      ),
    );
  });

  it('r4: owner lists own mock attempts; another student cannot', async () => {
    const snap = await assertSucceeds(listAttemptsAs('student-1', 'student-1', 'jobExamAttempts'));
    expect(snap.docs).toHaveLength(1);
    await assertFails(listAttemptsAs('student-2', 'student-1', 'jobExamAttempts'));
  });

  it('r5: owner can create + read own achievement doc; update and others denied', async () => {
    const db = asStudent('student-1');
    const ref = doc(db, 'users', 'student-1', 'userAchievements', 'job_first-mock');
    await assertSucceeds(setDoc(ref, { key: 'job_first-mock', earnedAt: serverTimestamp() }));
    const readBack = await assertSucceeds(getDoc(ref));
    expect(readBack.exists()).toBe(true);
    await assertFails(updateDoc(ref, { key: 'job_first-mock' }));
    const other = asStudent('student-2');
    await assertFails(
      setDoc(doc(other, 'users', 'student-1', 'userAchievements', 'job_first-practice'), {
        key: 'job_first-practice',
        earnedAt: serverTimestamp(),
      }),
    );
  });

  it('r6: signed-in student lists published bundles only (draft excluded by the rule)', async () => {
    const db = asStudent('student-1');
    const snap = await assertSucceeds(
      getDocs(
        query(
          collection(db, 'jobQuestionBundles'),
          where('examSlug', '==', 'bcs'),
          where('status', '==', 'published'),
        ),
      ),
    );
    expect(snap.docs.map((d) => d.id).sort()).toEqual([PRACTICE_BUNDLE_ID, REAL_BUNDLE_ID].sort());
  });
});

describe('i12: dashboard computed over stored attempts', () => {
  it('derives per-exam progress, streak, week, weak topics, recommendation, achievements, wrong answers', async () => {
    const practiceSnap = await assertSucceeds(listAttemptsAs('student-1', 'student-1', 'jobAttempts'));
    const mockSnap = await assertSucceeds(listAttemptsAs('student-1', 'student-1', 'jobExamAttempts'));
    const attempts: JobAttemptSummary[] = [
      ...practiceSnap.docs.map((d) => attemptSummaryFromStored(d.id, d.data() as Record<string, unknown>)),
      ...mockSnap.docs.map((d) => attemptSummaryFromStored(d.id, d.data() as Record<string, unknown>)),
    ].sort((a, b) => (b.submittedAtMillis ?? 0) - (a.submittedAtMillis ?? 0));
    expect(attempts).toHaveLength(5);

    // Per-exam progress (BCS): 5 attempts, 15 questions,
    // 7 correct (4 practice + 3 mock) → 46.7%; the draft bundle
    // is not counted in "sets available".
    const publishedByExam = new Map([
      ['bcs', [
        { docId: PRACTICE_BUNDLE_ID, topicId: 'bcs__english__grammar__tense', questionCount: 3 },
        { docId: REAL_BUNDLE_ID, topicId: null, questionCount: 3 },
      ]],
    ]);
    const progress = perExamProgress(attempts, publishedByExam);
    expect(progress).toHaveLength(1);
    expect(progress[0].examSlug).toBe('bcs');
    expect(progress[0].attempts).toBe(5);
    expect(progress[0].questions).toBe(15);
    expect(progress[0].correct).toBe(7);
    expect(progress[0].accuracy).toBe(46.7);
    expect(progress[0].topicsPracticed).toEqual(['bcs__english__grammar__tense']);
    expect(progress[0].setsCompleted).toBe(2);
    expect(progress[0].setsAvailable).toBe(2);

    // Streak: today + yesterday, then a gap → 2.
    expect(computeStreakDays(attempts, NOW_MS)).toBe(2);

    // Week: today 3 sessions, yesterday 1, 3 days ago 1.
    const week = weekActivity(attempts, NOW_MS);
    expect(week.totalSessions).toBe(5);
    expect(week.totalQuestions).toBe(15);
    expect(week.days[0].sessions).toBe(3);
    expect(week.days[1].sessions).toBe(1);

    // Weak topic: tense, 15 answered, 7 correct → 46.7%,
    // a signal (10+ answered).
    const weak = dashboardWeakTopics(attempts);
    expect(weak).toHaveLength(1);
    expect(weak[0].topicId).toBe('bcs__english__grammar__tense');
    expect(weak[0].accuracy).toBe(46.7);
    expect(weak[0].sample).toBe('signal');

    // Recommendation: the tense topic's published bundle.
    const rec = pickRecommendation({ weakTopics: weak, publishedByExam, targetExamSlug: 'bcs' });
    expect(rec).not.toBeNull();
    expect(rec!.bundleDocId).toBe(PRACTICE_BUNDLE_ID);

    // Achievements: first practice + first mock; no 7-day streak.
    const earned = dashboardAchievements(attempts, 2).map((a) => a.key);
    expect(earned).toContain('job_first-practice');
    expect(earned).toContain('job_first-mock');
    expect(earned).not.toContain('job_7-day-streak');

    // Wrong answers: Q1 + Q2 only (the mock was all correct).
    const wrong = wrongAnswerSummary(attempts);
    expect(wrong.distinctWrongQuestions).toBe(2);
    expect(wrong.recent.map((r) => r.questionId).sort()).toEqual(['bcs-eng-001', 'bcs-eng-002']);
  });
});
