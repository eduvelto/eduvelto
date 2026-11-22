// Eduvelto — Job planner (Step 12) rules tests.
//
// (r1–r3) READ-PATH PROOF, no rule change: the planner reads
// only collections whose owner-read rules already exist (Step
// 8/9 attempts, published bundles). The bar from Step 10 holds
// — "only add a rule if a needed list query is actually
// denied" — and nothing here is denied, so NO rule change
// ships with Step 12.
// (i13) REAL-CONTENT E2E — the Step 9 i10 / Step 10 i11 /
// Step 11 i12 fixture (3 VERBATIM BCS English questions
// bcs-eng-001/002/003): 3 tense practice attempts (D/D/D —
// Q3 correct, Q1+Q2 wrong) today / yesterday / 3 days ago, 2
// voice practice attempts (B/B/B — all wrong) 4 + 5 days ago,
// plus 1 mock (C/A/D — all correct) today; then the Step 12
// planner lib runs over the STORED attempts read back from
// the emulator: topic health, revision queue, weekly plan,
// today's plan per effort mode, goal suggestion. No number
// here is invented — every expected value is computed from
// the verbatim fixture + the submitted answers.
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
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
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
  type JobExamPattern,
} from '../src/lib/jobEngine';
import type { JobQuestionBundle, JobQuestionKey } from '../src/lib/jobQuestions';
import {
  goalSuggestion,
  revisionQueue,
  todaysPlan,
  topicHealth,
  weeklyPlan,
} from '../src/lib/jobPlanner';
import type { PublishedBundleRef } from '../src/lib/jobDashboard';

const PROJECT_ID = 'eduvelto-rules-test-step12-planner';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobExamAttempts')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 9 jobExamAttempts match.`);
}
if (!RULES_TEXT.includes('jobQuestionBundles')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the jobQuestionBundles match.`);
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

/** A topic bundle built from the same 3 verbatim questions,
 * retagged to the given topic (the attempt's answers carry
 * the bundle questions' topicId). The bundle's document ID
 * comes from the setDoc path, not the object. */
function topicBundle(topicId: string, titleBn: string, status: 'published' | 'draft'): JobQuestionBundle {
  return {
    ...REAL_BUNDLE,
    kind: 'topic',
    topicId,
    mockId: null,
    titleBn,
    titleEn: titleBn,
    questions: REAL_BUNDLE.questions.map((q) => ({ ...q, topicId })),
    status,
    reviewStatus: status === 'published' ? 'Published' : 'Not Started',
  };
}
function topicKey(bundleId: string): JobQuestionKey {
  return { ...REAL_KEY, bundleId };
}

const TENSE_ID = 'topic__bcs__english__grammar__tense';
const VOICE_ID = 'topic__bcs__english__grammar__voice';
const ARTICLES_ID = 'topic__bcs__english__grammar__articles';
const NARRATION_ID = 'topic__bcs__english__grammar__narration';

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
    const bundles: Array<[string, JobQuestionBundle]> = [
      [REAL_BUNDLE_ID, REAL_BUNDLE],
      [TENSE_ID, topicBundle('bcs__english__grammar__tense', 'বিসিএস English — Grammar — Tense', 'published')],
      [VOICE_ID, topicBundle('bcs__english__grammar__voice', 'বিসিএস English — Grammar — Voice', 'published')],
      [ARTICLES_ID, topicBundle('bcs__english__grammar__articles', 'বিসিএস English — Grammar — Articles', 'published')],
      [NARRATION_ID, topicBundle('bcs__english__grammar__narration', 'বিসিএস English — Grammar — Narration (খসড়া)', 'draft')],
    ];
    for (const [id, bundle] of bundles) {
      await setDoc(doc(db, 'jobQuestionBundles', id), { ...bundle });
      if (bundle.status === 'published') {
        await setDoc(doc(db, 'jobQuestionKeys', id), { ...topicKey(id) });
      }
    }

    const pattern = jobExamPattern('bcs');
    if (!pattern) throw new Error('no BCS pattern');

    async function seedPractice(args: {
      sessionId: string;
      bundleId: string;
      bundle: JobQuestionBundle;
      key: JobQuestionKey;
      pattern: JobExamPattern;
      topicId: string;
      answers: Array<'A' | 'B' | 'C' | 'D'>;
      submittedAtMillis: number;
    }) {
      const session = createPracticeSession({
        sessionId: args.sessionId,
        bundleId: args.bundleId,
        examSlug: 'bcs',
        questionRefs: REAL_REFS.map((r) => ({ ...r, bundleId: args.bundleId })),
      });
      const result: JobAttemptResult = scorePracticeAttempt({
        bundle: args.bundle,
        key: args.key,
        answers: args.bundle.questions.map((q, i) => ({
          n: q.n, questionId: q.questionId, selected: args.answers[i], timeSpentSeconds: 45,
        })),
        pattern: args.pattern,
        startedAtMillis: args.submittedAtMillis - 135 * 1000,
        submittedAtMillis: args.submittedAtMillis,
      });
      const attemptDoc = buildJobAttemptDoc({
        sessionId: args.sessionId,
        session,
        result,
        bundleId: args.bundleId,
        examSlug: 'bcs',
        subjectId: 'bcs__english',
        topicId: args.topicId,
        kind: 'practice',
        bundleVersion: 1,
        userId: 'student-1',
      });
      const problems = validateAttemptResult(attemptDoc);
      if (problems.length > 0) throw new Error(`lib validator rejected its own doc: ${problems.join('; ')}`);
      attemptDoc.submittedAt = Timestamp.fromMillis(args.submittedAtMillis);
      await setDoc(doc(db, 'users', 'student-1', 'jobAttempts', args.sessionId), attemptDoc);
    }

    const tenseBundle = bundles[1][1];
    const voiceBundle = bundles[2][1];

    // 3 tense practice attempts, D/D/D (Q3 correct, Q1+Q2
    // wrong): today, yesterday, 3 days ago.
    const tenseDates = [NOW_MS, NOW_MS - DAY, NOW_MS - 3 * DAY];
    for (let i = 0; i < 3; i += 1) {
      await seedPractice({
        sessionId: `practice-tense-${i + 1}`,
        bundleId: TENSE_ID,
        bundle: tenseBundle,
        key: topicKey(TENSE_ID),
        pattern,
        topicId: 'bcs__english__grammar__tense',
        answers: ['D', 'D', 'D'],
        submittedAtMillis: tenseDates[i],
      });
    }
    // 2 voice practice attempts, B/B/B (all wrong): 4 + 5
    // days ago.
    const voiceDates = [NOW_MS - 4 * DAY, NOW_MS - 5 * DAY];
    for (let i = 0; i < 2; i += 1) {
      await seedPractice({
        sessionId: `practice-voice-${i + 1}`,
        bundleId: VOICE_ID,
        bundle: voiceBundle,
        key: topicKey(VOICE_ID),
        pattern,
        topicId: 'bcs__english__grammar__voice',
        answers: ['B', 'B', 'B'],
        submittedAtMillis: voiceDates[i],
      });
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

/** The planner's own list queries, in the exact shape the
 * data module runs them. */
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

/** The published-practice-bundle query, in the exact shape
 * listPublishedPracticeBundles runs it (kind filtered
 * client-side, as in the loader). */
async function listPublishedBundlesAs(asUid: string, examSlug: string): Promise<PublishedBundleRef[]> {
  const db = asStudent(asUid);
  const snap = await getDocs(
    query(
      collection(db, 'jobQuestionBundles'),
      where('examSlug', '==', examSlug),
      where('status', '==', 'published'),
    ),
  );
  return snap.docs
    .map((d) => ({ ...(d.data() as Record<string, unknown>), docId: d.id }) as unknown as PublishedBundleRef & { kind: string })
    .filter((b) => b.kind === 'topic' || b.kind === 'previous')
    .map((b) => ({ docId: b.docId, topicId: b.topicId ?? null, questionCount: b.questionCount, titleBn: b.titleBn as string | undefined }));
}

describe('Step 12 planner read paths (no rule change)', () => {
  it('r1: owner lists own practice attempts (5)', async () => {
    const snap = await assertSucceeds(listAttemptsAs('student-1', 'student-1', 'jobAttempts'));
    expect(snap.docs).toHaveLength(5);
  });

  it('r2: another student cannot list them', async () => {
    await assertFails(listAttemptsAs('student-2', 'student-1', 'jobAttempts'));
  });

  it('r3: published bundles list excludes the draft and the mock-kind bundle', async () => {
    const bundles = await assertSucceeds(listPublishedBundlesAs('student-1', 'bcs'));
    expect(bundles.map((b) => b.docId).sort()).toEqual([ARTICLES_ID, TENSE_ID, VOICE_ID].sort());
  });
});

describe('i13: planner computed over stored attempts', () => {
  it('derives topic health, revision queue, weekly plan, today plan, goal suggestion', async () => {
    const practiceSnap = await assertSucceeds(listAttemptsAs('student-1', 'student-1', 'jobAttempts'));
    const mockSnap = await assertSucceeds(listAttemptsAs('student-1', 'student-1', 'jobExamAttempts'));
    const attempts: JobAttemptSummary[] = [
      ...practiceSnap.docs.map((d) => attemptSummaryFromStored(d.id, d.data() as Record<string, unknown>)),
      ...mockSnap.docs.map((d) => attemptSummaryFromStored(d.id, d.data() as Record<string, unknown>)),
    ].sort((a, b) => (b.submittedAtMillis ?? 0) - (a.submittedAtMillis ?? 0));
    expect(attempts).toHaveLength(6);

    const publishedByExam = new Map([['bcs', await listPublishedBundlesAs('student-1', 'bcs')]]);

    // Topic health: tense 12 answered (9 practice + 3 mock),
    // 6 correct → 50% moderate; voice 6 answered, 0 correct
    // → 0% weak.
    const health = topicHealth(attempts, NOW_MS);
    expect(health.map((h) => h.topicId)).toEqual([
      'bcs__english__grammar__voice',
      'bcs__english__grammar__tense',
    ]);
    const tense = health.find((h) => h.topicId === 'bcs__english__grammar__tense')!;
    expect(tense.accuracy).toBe(50);
    expect(tense.mastery).toBe('moderate');
    expect(tense.reviseInDays).toBe(4);
    expect(tense.nextRevisionDay).toBe('2026-11-26');
    const voice = health.find((h) => h.topicId === 'bcs__english__grammar__voice')!;
    expect(voice.accuracy).toBe(0);
    expect(voice.mastery).toBe('weak');
    expect(voice.reviseInDays).toBe(1);
    expect(voice.nextRevisionDay).toBe('2026-11-19');

    // Revision queue: overdue voice first (today, with its
    // published bundle), then tense (this week).
    const queue = revisionQueue({ health, publishedByExam, targetExamSlug: 'bcs', nowMs: NOW_MS });
    expect(queue).toHaveLength(2);
    expect(queue[0].topicId).toBe('bcs__english__grammar__voice');
    expect(queue[0].dueBucket).toBe('today');
    expect(queue[0].bundleDocId).toBe(VOICE_ID);
    expect(queue[1].topicId).toBe('bcs__english__grammar__tense');
    expect(queue[1].dueBucket).toBe('this-week');
    expect(queue[1].bundleDocId).toBe(TENSE_ID);

    // Weekly plan (goal 10 questions/day, today's mock live):
    // today has the slid voice revision + the never-attempted
    // articles set + the daily-mock row; 6 questions done
    // today (3 practice + 3 mock) → goal not met.
    const week = weeklyPlan({
      attempts,
      health,
      queue,
      publishedByExam,
      targetExamSlug: 'bcs',
      dailyGoalQuestions: 10,
      dailyMockDocId: 'daily__2026-11-22',
      nowMs: NOW_MS,
    });
    expect(week.days).toHaveLength(7);
    expect(week.days[0].dayKey).toBe('2026-11-22');
    const todayItems = week.days[0].items;
    expect(todayItems.filter((i) => i.kind === 'revision')).toHaveLength(1);
    expect(todayItems.find((i) => i.kind === 'revision')?.topicId).toBe('bcs__english__grammar__voice');
    expect(todayItems.find((i) => i.kind === 'revision')?.slid).toBe(true);
    expect(todayItems.find((i) => i.kind === 'new-practice')?.topicId).toBe('bcs__english__grammar__articles');
    expect(todayItems.find((i) => i.kind === 'daily-mock')?.to).toBe('/jobs/mock/daily__2026-11-22');
    expect(week.days[0].questionsDone).toBe(6);
    expect(week.days[0].sessionsDone).toBe(2);
    expect(week.days[0].goalMet).toBe(false);
    expect(week.carriedOver).toBe(true);
    expect(week.noNewSetsLeft).toBe(false);
    expect(week.targetHasNoSets).toBe(false);
    // The tense revision lands on its due day (11-26).
    const dueDay = week.days.find((d) => d.dayKey === '2026-11-26')!;
    expect(dueDay.items.filter((i) => i.kind === 'revision')).toHaveLength(1);
    expect(dueDay.items.find((i) => i.kind === 'revision')?.topicId).toBe('bcs__english__grammar__tense');

    // Today's plan: standard = revision + new practice (+ the
    // mock row); light = 1 item; deep adds one extra.
    const standard = todaysPlan(week, 'standard');
    expect(standard.items).toHaveLength(2);
    expect(standard.mockItem?.kind).toBe('daily-mock');
    expect(standard.mockItem?.done).toBe(true);
    expect(standard.totalCount).toBe(3);
    expect(standard.doneCount).toBe(1);
    const light = todaysPlan(week, 'light');
    expect(light.items).toHaveLength(1);
    expect(light.items[0].kind).toBe('revision');
    const deep = todaysPlan(week, 'deep');
    // Only one never-attempted set exists (articles), so the
    // extra cannot be another new topic — it is the next due
    // revision (tense, due 11-26), not a duplicate of today's
    // articles item.
    expect(deep.extraItem?.kind).toBe('revision');
    expect(deep.extraItem?.topicId).toBe('bcs__english__grammar__tense');

    // Goal suggestion: 18 questions over 7 days (~2.6/day)
    // across 5 active days — goal 30 is far above it.
    const suggestion = goalSuggestion({ attempts, dailyGoalQuestions: 30, nowMs: NOW_MS });
    expect(suggestion).not.toBeNull();
    expect(suggestion!.goal).toBe(30);
    expect(suggestion!.activeDays).toBe(5);
    expect(suggestion!.avgQuestionsPerDay).toBeCloseTo(2.6, 1);
  });
});
