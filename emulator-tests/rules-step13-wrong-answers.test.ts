// Eduvelto — Job wrong-answer notebook (Step 13) rules tests.
//
// (r1–r3) READ-PATH PROOF, no new collection: the notebook
// reads only collections whose owner-read rules already exist
// (Step 8/9 attempts, published bundles). The bar from Step 10
// holds — "only add a rule if a needed list query is actually
// denied" — and nothing here is denied, so NO new collection
// and NO new allow rule ships with Step 13.
// (r4–r6) THE RULES FIX (Step 13): a subset session's first
// bundle n can EXCEED the subset size (a 1-question subset of
// bundle n=9), so the old `currentQuestion <= refs.size()`
// proxy denied it at create AND on every navigation/autosave.
// The bound is now MEMBERSHIP in the answers keys (the keys
// ARE the refs' n values — see validJobSessionCreate). r4
// creates a 1-question subset starting at n=3; r5 autosaves
// it with currentQuestion=3; r6 proves a bogus
// currentQuestion=2 is still rejected.
// (i14) REAL-CONTENT E2E — the Step 9 i10 / Step 10 i11 /
// Step 11 i12 / Step 12 i13 fixture (3 VERBATIM BCS English
// questions bcs-eng-001/002/003): 3 tense practice attempts
// (D/D/D — Q3 correct, Q1+Q2 wrong) today / yesterday /
// 3 days ago, 2 voice practice attempts (B/B/B — all wrong)
// 4 + 5 days ago, plus 1 mock (C/A/D — all correct) today;
// then the Step 13 notebook lib derives over the STORED
// attempts read back from the emulator, and TWO real subset
// sessions (Q1+Q2, answers C/A — both correct) are written
// through the RULES-CHECKED create + submit path, proving
// the full 0→1→2 clearing loop. No number here is invented —
// every expected value is computed from the verbatim fixture
// + the submitted answers.
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
  setDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
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
  buildSubsetBundle,
  buildSubsetKey,
  deriveNotebook,
  planWrongAnswersSession,
  type PlannedSessionItem,
} from '../src/lib/jobWrongAnswers';
import type { PublishedBundleRef } from '../src/lib/jobDashboard';

const PROJECT_ID = 'eduvelto-rules-test-step13-wrong-answers';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobExamAttempts')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 9 jobExamAttempts match.`);
}
if (!RULES_TEXT.includes('jobQuestionBundles')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the jobQuestionBundles match.`);
}
if (!RULES_TEXT.includes("in d.get('answers', {}).keys()")) {
  throw new Error('firestore.rules does not contain the Step 13 currentQuestion membership bound.');
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

/** The notebook's own list queries, in the exact shape
 * loadNotebookAttempts runs them (50 + 50, newest first). */
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
      limit(50),
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

/** Read both attempt collections back and derive the
 * notebook — the same shape the page loads. */
async function readNotebook() {
  const practiceSnap = await assertSucceeds(listAttemptsAs('student-1', 'student-1', 'jobAttempts'));
  const mockSnap = await assertSucceeds(listAttemptsAs('student-1', 'student-1', 'jobExamAttempts'));
  const attempts: JobAttemptSummary[] = [
    ...practiceSnap.docs.map((d) => attemptSummaryFromStored(d.id, d.data() as Record<string, unknown>)),
    ...mockSnap.docs.map((d) => attemptSummaryFromStored(d.id, d.data() as Record<string, unknown>)),
  ];
  return { attempts, entries: deriveNotebook(attempts) };
}

/** Submit one wrong-answers subset session through the
 * RULES-CHECKED path — the exact write sequence
 * submitPracticeAttempt runs (session create, then the
 * session→submitted + attempt batch). The subset bundle/key
 * are the in-memory narrowed pair; the stored attempt
 * anchors to the REAL topic bundle. */
async function submitSubsetSession(args: {
  sessionId: string;
  bundleId: string;
  topicId: string;
  bundleTitleBn: string;
  items: PlannedSessionItem[];
  answers: Array<'A' | 'B' | 'C' | 'D'>;
}) {
  const db = asStudent('student-1');
  const topicBundleDoc = topicBundle(args.topicId, args.bundleTitleBn, 'published');
  const subsetBundle = buildSubsetBundle(topicBundleDoc, args.items);
  const subsetKey = buildSubsetKey(topicKey(args.bundleId), args.items);
  const questionRefs = args.items.map((i) => ({
    bundleId: args.bundleId, n: i.question.n, questionId: i.question.questionId,
  }));
  const session = createPracticeSession({
    sessionId: args.sessionId,
    bundleId: args.bundleId,
    examSlug: 'bcs',
    questionRefs,
  });
  await assertSucceeds(
    setDoc(doc(db, 'users', 'student-1', 'jobSessions', args.sessionId), session as unknown as Record<string, unknown>),
  );
  const pattern = jobExamPattern('bcs');
  if (!pattern) throw new Error('no BCS pattern');
  const result: JobAttemptResult = scorePracticeAttempt({
    bundle: subsetBundle,
    key: subsetKey,
    answers: subsetBundle.questions.map((q, i) => ({
      n: q.n, questionId: q.questionId, selected: args.answers[i], timeSpentSeconds: 45,
    })),
    pattern,
    startedAtMillis: NOW_MS,
    submittedAtMillis: NOW_MS,
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
  const sessionSnap = await getDoc(doc(db, 'users', 'student-1', 'jobSessions', args.sessionId));
  const stored = sessionSnap.data() as Record<string, unknown>;
  const storedRevision = typeof stored.revision === 'number' && stored.revision >= 1 ? stored.revision : 1;
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', 'student-1', 'jobSessions', args.sessionId), {
    status: 'submitted',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    revision: storedRevision + 1,
  });
  batch.set(doc(db, 'users', 'student-1', 'jobAttempts', args.sessionId), attemptDoc as unknown as Record<string, unknown>);
  await assertSucceeds(batch.commit());
  // The stored subset attempt anchors to the REAL topic
  // bundle (never a fake bundle).
  const storedAttempt = await getDoc(doc(db, 'users', 'student-1', 'jobAttempts', args.sessionId));
  const storedData = storedAttempt.data() as Record<string, unknown>;
  expect(storedData.bundleId).toBe(args.bundleId);
  expect(storedData.bundleVersion).toBe(1);
  expect((storedData.answers as Array<unknown>).length).toBe(args.items.length);
}

describe('Step 13 notebook read paths (no rule change)', () => {
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

describe('Step 13 subset-session rule fix (r4–r6)', () => {
  it('r4: a 1-question subset starting at bundle n=3 creates', async () => {
    const db = asStudent('student-1');
    const session = createPracticeSession({
      sessionId: 'wrong-single-q3',
      bundleId: TENSE_ID,
      examSlug: 'bcs',
      questionRefs: [{ bundleId: TENSE_ID, n: 3, questionId: 'bcs-eng-003' }],
    });
    // Under the old `currentQuestion <= refs.size()` proxy
    // this create was denied (3 <= 1 is false) — the
    // membership bound is what allows it.
    await assertSucceeds(
      setDoc(doc(db, 'users', 'student-1', 'jobSessions', 'wrong-single-q3'), session as unknown as Record<string, unknown>),
    );
  });

  it('r5: autosave-shape update on it with currentQuestion=3 succeeds', async () => {
    const db = asStudent('student-1');
    const snap = await getDoc(doc(db, 'users', 'student-1', 'jobSessions', 'wrong-single-q3'));
    const stored = snap.data() as Record<string, unknown>;
    const answers = stored.answers as Record<string, unknown>;
    await assertSucceeds(
      updateDoc(doc(db, 'users', 'student-1', 'jobSessions', 'wrong-single-q3'), {
        answers,
        currentQuestion: 3,
        lastSyncedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        revision: (stored.revision as number) + 1,
      }),
    );
  });

  it('r6: the same update with a bogus currentQuestion=2 is still rejected', async () => {
    const db = asStudent('student-1');
    const snap = await getDoc(doc(db, 'users', 'student-1', 'jobSessions', 'wrong-single-q3'));
    const stored = snap.data() as Record<string, unknown>;
    const answers = stored.answers as Record<string, unknown>;
    await assertFails(
      updateDoc(doc(db, 'users', 'student-1', 'jobSessions', 'wrong-single-q3'), {
        answers,
        currentQuestion: 2,
        lastSyncedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        revision: (stored.revision as number) + 1,
      }),
    );
  });
});

describe('i14: notebook derived over stored attempts + 0→1→2 loop', () => {
  it('derives Q1+Q2 active (streak 0, wrong 5) and Q3 learned (cleared at tense-1d)', async () => {
    const { attempts, entries } = await readNotebook();
    expect(attempts).toHaveLength(6);
    expect(entries).toHaveLength(3);

    // Chronological per question (oldest → newest):
    // Q1/Q2: voice-5d W, voice-4d W, tense-3d W, tense-1d W,
    // mock C (streak 1), tense-today W → reset to 0, wrong 5.
    // NOTE — entry topic: the fixture reuses the same 3
    // verbatim questions retagged into EVERY topic bundle, so
    // one questionId appears under several topics. The entry
    // keeps its OLDEST answer's topic (voice, from the
    // voice-5d attempt). In production each questionId belongs
    // to exactly one topic, so this never diverges there.
    for (const qid of ['bcs-eng-001', 'bcs-eng-002']) {
      const e = entries.find((x) => x.questionId === qid)!;
      expect(e.topicId).toBe('bcs__english__grammar__voice');
      expect(e.status).toBe('active');
      expect(e.learningState).toBe('new');
      expect(e.consecutiveCorrect).toBe(0);
      expect(e.wrongCount).toBe(5);
      expect(e.lastWrongAtMillis).toBe(NOW_MS);
      expect(e.lastOutcome).toBe('wrong');
      expect(e.clearedAtMillis).toBeNull();
      expect(e.examSlugs).toEqual(['bcs']);
      expect(e.sources).toEqual(['mock', 'practice']);
    }

    // Q3: voice-5d W, voice-4d W, tense-3d C (streak 1),
    // tense-1d C (streak 2 → cleared), mock C, tense-today C.
    const q3 = entries.find((x) => x.questionId === 'bcs-eng-003')!;
    expect(q3.topicId).toBe('bcs__english__grammar__voice');
    expect(q3.status).toBe('learned');
    expect(q3.learningState).toBe('learned');
    expect(q3.consecutiveCorrect).toBe(4);
    expect(q3.wrongCount).toBe(2);
    expect(q3.clearedAtMillis).toBe(NOW_MS - DAY);
  });

  it('first subset session (C/A) moves Q1+Q2 to streak 1, still active', async () => {
    const { attempts, entries } = await readNotebook();
    // The entries group under their oldest answer's topic
    // (voice — see the note in the test above), so the page
    // re-practices them through the VOICE bundle, which
    // contains the same verbatim questions.
    const voiceEntries = entries.filter(
      (e) => e.topicId === 'bcs__english__grammar__voice' && e.status === 'active',
    );
    expect(voiceEntries.map((e) => e.questionId).sort()).toEqual(['bcs-eng-001', 'bcs-eng-002']);
    const voiceBundle = topicBundle('bcs__english__grammar__voice', 'বিসিএস English — Grammar — Voice', 'published');
    const answeredIds = new Set(attempts.flatMap((a) => a.answers.map((x) => x.questionId)));
    const planned = planWrongAnswersSession({ topicEntries: voiceEntries, bundle: voiceBundle, answeredQuestionIds: answeredIds });
    // All 3 fixture questions were attempted, so no fresh
    // transfer question exists — the session is review-only,
    // and the page must say so honestly (noFreshLeft).
    expect(planned.items).toHaveLength(2);
    expect(planned.items.every((i) => i.isReview)).toBe(true);
    expect(planned.noFreshLeft).toBe(true);
    expect(planned.droppedMissing).toEqual([]);
    expect(planned.droppedCap).toEqual([]);
    // The plan shuffles the review order — assert as a set.
    expect(planned.items.map((i) => i.question.questionId).sort()).toEqual(['bcs-eng-001', 'bcs-eng-002']);

    // The subset answers must follow the PLANNED order: map
    // each planned question to its correct letter.
    const correctById = new Map([['bcs-eng-001', 'C' as const], ['bcs-eng-002', 'A' as const]]);
    await submitSubsetSession({
      sessionId: 'wrong-subset-1',
      bundleId: VOICE_ID,
      topicId: 'bcs__english__grammar__voice',
      bundleTitleBn: 'বিসিএস English — Grammar — Voice',
      items: planned.items,
      answers: planned.items.map((i) => correctById.get(i.question.questionId)!),
    });

    const after = await readNotebook();
    for (const qid of ['bcs-eng-001', 'bcs-eng-002']) {
      const e = after.entries.find((x) => x.questionId === qid)!;
      expect(e.status).toBe('active');
      expect(e.learningState).toBe('practising');
      expect(e.consecutiveCorrect).toBe(1);
      expect(e.wrongCount).toBe(5);
      expect(e.clearedAtMillis).toBeNull();
    }
    // Q3 is untouched by the subset session.
    const q3 = after.entries.find((x) => x.questionId === 'bcs-eng-003')!;
    expect(q3.status).toBe('learned');
    expect(q3.consecutiveCorrect).toBe(4);
  });

  it('second subset session (C/A) clears Q1+Q2 — streak 2, learned', async () => {
    const { attempts, entries } = await readNotebook();
    const voiceEntries = entries.filter(
      (e) => e.topicId === 'bcs__english__grammar__voice' && e.status === 'active',
    );
    expect(voiceEntries.map((e) => e.questionId).sort()).toEqual(['bcs-eng-001', 'bcs-eng-002']);
    const voiceBundle = topicBundle('bcs__english__grammar__voice', 'বিসিএস English — Grammar — Voice', 'published');
    const answeredIds = new Set(attempts.flatMap((a) => a.answers.map((x) => x.questionId)));
    const planned = planWrongAnswersSession({ topicEntries: voiceEntries, bundle: voiceBundle, answeredQuestionIds: answeredIds });
    expect(planned.items).toHaveLength(2);
    const correctById = new Map([['bcs-eng-001', 'C' as const], ['bcs-eng-002', 'A' as const]]);
    await submitSubsetSession({
      sessionId: 'wrong-subset-2',
      bundleId: VOICE_ID,
      topicId: 'bcs__english__grammar__voice',
      bundleTitleBn: 'বিসিএস English — Grammar — Voice',
      items: planned.items,
      answers: planned.items.map((i) => correctById.get(i.question.questionId)!),
    });

    const after = await readNotebook();
    for (const qid of ['bcs-eng-001', 'bcs-eng-002']) {
      const e = after.entries.find((x) => x.questionId === qid)!;
      expect(e.status).toBe('learned');
      expect(e.learningState).toBe('learned');
      expect(e.consecutiveCorrect).toBe(2);
      expect(e.wrongCount).toBe(5);
      // The 2nd consecutive correct was submitted just now
      // (emulator server time) — after every seeded attempt.
      expect(e.clearedAtMillis).not.toBeNull();
      expect(e.clearedAtMillis!).toBeGreaterThan(NOW_MS);
    }
    // Nothing active is left to plan in this topic.
    const stillActive = after.entries.filter(
      (e) => e.topicId === 'bcs__english__grammar__voice' && e.status === 'active',
    );
    expect(stillActive).toHaveLength(0);
    const plannedAgain = planWrongAnswersSession({
      topicEntries: stillActive,
      bundle: voiceBundle,
      answeredQuestionIds: new Set(after.attempts.flatMap((a) => a.answers.map((x) => x.questionId))),
    });
    expect(plannedAgain.items).toHaveLength(0);
  });
});
