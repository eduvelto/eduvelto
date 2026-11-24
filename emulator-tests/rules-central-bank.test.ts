/**
 * Eduvelto Firestore security-rules tests — Central Bank
 * (design-central-bank.md §10 step 17, §6.4).
 *
 * Rules under test (firestore.rules, Central Bank): the v2
 * jobQuestions shape (dispatch on 'questionId', legacy branch
 * rejects v2 markers, mixed shapes validate under NEITHER
 * branch), the duplicateCandidates publish gate, the new
 * collections (jobPassages, jobExamSelectionRules,
 * examQuestionPools, jobQuestionBankStats, jobBankCoverage,
 * topicAnalytics, historicalQuestions) and the per-student
 * exposure history (users/{uid}/examHistory/{examId}, bounded
 * to 500 IDs, lastAttemptNo only increases).
 *
 *  READ jobQuestions (v2) — students NEVER read the bank (no
 *    student read rule at all — same as v1). A verified teacher
 *    reads only their OWN questions; Moderator/Admin read all.
 *  CREATE jobQuestions (v2) — verified teacher only, draft
 *    only; verificationStatus must agree with status/reviewStatus
 *    (verified ⟺ published); questionId must match the v2
 *    pattern; a mixed-shape doc (questionId + examSlug) is
 *    refused; duplicateHashV2 must be 16 hex chars.
 *  UPDATE, author — own v2 draft only, content fields only
 *    (question/correctAnswer/examMappings/syllabusMappings/
 *    origin/tags/passageId/hashes/candidates); verificationStatus
 *    is moderator-only.
 *  UPDATE, Moderator — second eye + transition guard + the
 *    duplicateCandidates publish gate: publish with a non-empty
 *    candidates list is DENIED; clearing the list (the review
 *    decision lives in duplicateReview) then publishing SUCCEEDS.
 *  LEGACY (v1) — a v1 doc still publishes through the same
 *    transition guard (migration window: both shapes live side
 *    by side); a v1 field cannot be smuggled into a v2 doc.
 *  examQuestionPools — NO client write ever (script-only via
 *    the Admin SDK); Moderators may read for debugging.
 *  jobQuestionBankStats / jobBankCoverage / topicAnalytics —
 *    script-only writes; any signed-in user may read.
 *  historicalQuestions — a student reads ONLY a Verified
 *    record; Moderators read all and write.
 *  jobExamSelectionRules — readable by any signed-in user;
 *    Moderators write (the weights-sum check is lib-only).
 *  jobPassages — readable by any signed-in user; Moderators
 *    write.
 *  examHistory — owner-only, ≤500 IDs, lastAttemptNo only
 *    increases; Moderators read.
 *
 * Same conventions as rules-step7-job-questions.test.ts
 * (numbered cases, VALID_* fixtures, seed via
 * withSecurityRulesDisabled). Run with `npm run test:rules`.
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-central-bank';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobPassages')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Central Bank collections.`);
}

const TS = new Date('2026-11-24T08:00:00.000Z');

const OPTIONS = [
  { letter: 'A', text: 'He go to school every day.' },
  { letter: 'B', text: 'He going to school every day.' },
  { letter: 'C', text: 'He goes to school every day.' },
  { letter: 'D', text: 'He gone to school every day.' },
];

const V2_SYLLABUS_MAPPINGS = {
  bcs: {
    subjectId: 'bcs__english',
    chapterId: 'bcs__english__grammar',
    topicId: 'bcs__english__grammar__tense',
    syllabusVersion: '50th-bcs-2025-12-09',
    syllabusTopicId: 'english__grammar__tense',
    verified: true,
  },
};

/** A valid v2 draft, as a verified teacher would create it. */
const VALID_V2_DRAFT = {
  questionId: 'q_english_0001',
  subjectId: 'english',
  topicId: 'english__grammar__tense',
  subtopicId: null,
  difficulty: 'medium',
  questionType: 'mcq',
  question: 'Choose the correct sentence.',
  options: OPTIONS,
  correctAnswer: 'C',
  explanation: 'ব্যাখ্যা।',
  whyWrong: null,
  examMappings: ['bcs'],
  syllabusMappings: V2_SYLLABUS_MAPPINGS,
  verificationStatus: 'draft',
  isActive: true,
  origin: 'admin-practice',
  source: { type: 'original-practice', reference: 'Batch 1', url: null },
  examYear: null,
  tags: ['english', 'english__grammar__tense', 'bcs'],
  passageId: null,
  duplicateHash: 'abcdef0123456789',
  duplicateHashV2: '0123456789abcdef',
  stemHash: '0123456789abcdef',
  duplicateOf: null,
  duplicateCandidates: null,
  duplicateReview: null,
  authorId: 'teacher-v',
  verifiedBy: null,
  verifiedAt: null,
  reviewerId: null,
  version: 1,
  configVersion: '2026-11-22.1',
  schemaVersion: 2,
  legacyId: null,
  status: 'draft',
  reviewStatus: 'Not Started',
  createdBy: 'teacher-v',
  createdAt: TS,
  updatedAt: TS,
};

/** A valid v1 draft (legacy shape, pre-migration). */
const VALID_V1_DRAFT = {
  examSlug: 'bcs',
  subjectId: 'bcs__bangla',
  chapterId: 'bcs__bangla__grammar',
  topicId: 'bcs__bangla__grammar__sandhi',
  questionText: 'সন্ধি কাকে বলে?',
  options: [
    { letter: 'A', text: 'দুটি স্বরের মিলন' },
    { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
    { letter: 'C', text: 'দুটি শব্দের মিলন' },
    { letter: 'D', text: 'দুটি বাক্যের মিলন' },
  ],
  correctLetter: 'B',
  explanation: 'সন্ধি হলো দুটি ধনির মিলন।',
  whyWrong: null,
  difficulty: 'medium',
  isPreviousYear: false,
  examYear: null,
  source: 'BCS প্রিলিমিনারি সিলেবাস',
  sourceUrl: null,
  status: 'draft',
  reviewStatus: 'Not Started',
  reviewerId: null,
  verifiedBy: null,
  verifiedAt: null,
  rejectionReason: null,
  duplicateHash: 'abcdef0123456789',
  duplicateOf: null,
  bundleId: null,
  version: 1,
  configVersion: '2026-11-22.1',
  authorId: 'teacher-v',
  createdBy: 'teacher-v',
  createdAt: TS,
  updatedAt: TS,
};

/** Publish write by `verifier` (second eye): verifiedAt is
 * stamped at write time (a verification timestamp must be no
 * later than now and no older than 5 minutes when it changes). */
const publishPayloadV2 = (verifier: string) => ({
  status: 'published',
  reviewStatus: 'Published',
  verificationStatus: 'verified',
  verifiedBy: verifier,
  verifiedAt: new Date(),
});
const publishPayloadV1 = (verifier: string) => ({
  status: 'published',
  reviewStatus: 'Published',
  verifiedBy: verifier,
  verifiedAt: new Date(),
});

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role, extra] of [
      ['admin-1', 'admin', {}],
      ['owner-1', 'owner', {}],
      ['moderator-1', 'moderator', {}],
      ['teacher-v', 'teacher', { verificationStatus: 'verified' }],
      ['teacher-1', 'teacher', { verificationStatus: 'pending' }],
      ['student-1', 'student', {}],
      ['student-2', 'student', {}],
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
    // ---- jobQuestions (v2) ----
    const v2: Array<[string, Record<string, unknown>]> = [
      ['bcs-eng-001', {
        ...VALID_V2_DRAFT,
        questionId: 'bcs-eng-001',
        reviewStatus: 'Published', status: 'published',
        verificationStatus: 'verified',
        verifiedBy: 'moderator-1', verifiedAt: TS,
      }],
      ['q_english_0002', { ...VALID_V2_DRAFT, questionId: 'q_english_0002' }],
      ['q_english_0003', {
        ...VALID_V2_DRAFT,
        questionId: 'q_english_0003',
        reviewStatus: 'Under Review',
        verificationStatus: 'reviewed',
      }],
      ['q_english_0004', {
        ...VALID_V2_DRAFT,
        questionId: 'q_english_0004',
        reviewStatus: 'Under Review',
        verificationStatus: 'reviewed',
        duplicateCandidates: [
          { questionId: 'bcs-eng-026', class: 'near-stem', score: 0.9 },
        ],
      }],
      ['q_english_0005', {
        ...VALID_V2_DRAFT,
        questionId: 'q_english_0005',
        reviewStatus: 'Under Review',
        verificationStatus: 'reviewed',
        duplicateCandidates: [
          { questionId: 'bcs-eng-026', class: 'near-stem', score: 0.9 },
        ],
        duplicateReview: {
          decision: 'keep',
          reason: 'Different words tested (receive vs accommodation).',
          reviewerId: 'moderator-1',
        },
      }],
    ];
    for (const [id, data] of v2) {
      await setDoc(doc(db, 'jobQuestions', id), data);
    }
    // ---- jobQuestions (v1, migration window) ----
    await setDoc(doc(db, 'jobQuestions', 'q-legacy-001'), {
      ...VALID_V1_DRAFT,
      reviewStatus: 'Under Review',
      questionText: 'পুরোনো আকৃতির প্রশ্ন?',
    });
    // ---- jobPassages ----
    await setDoc(doc(db, 'jobPassages', 'bcs-eng-passage-01'), {
      text: 'Rahim is a school teacher in a small village.',
      questionIds: ['bcs-eng-033', 'bcs-eng-034', 'bcs-eng-035'],
      createdAt: TS,
      updatedAt: TS,
    });
    // ---- jobExamSelectionRules ----
    await setDoc(doc(db, 'jobExamSelectionRules', 'bcs'), {
      totalQuestions: 200,
      durationMinutes: 120,
      negativeMarking: 0.5,
      subjectWeights: [{ subjectId: 'english', questions: 30 }],
      verificationStatus: 'verified',
      syllabusVersion: '50th-bcs-2025-12-09',
      scoringConfigVersion: '50th-bcs-v1',
    });
    await setDoc(doc(db, 'jobExamSelectionRules', 'grade_11_20'), {
      totalQuestions: null,
      durationMinutes: 0,
      negativeMarking: 0,
      subjectWeights: [],
      verificationStatus: 'draft',
      syllabusVersion: 'unverified',
      scoringConfigVersion: 'unverified',
    });
    // ---- examQuestionPools ----
    await setDoc(doc(db, 'examQuestionPools', 'pool__bcs__scored__english__grammar__tense__medium__0'), {
      examId: 'bcs',
      poolKind: 'scored',
      subjectId: 'english',
      topicId: 'english__grammar__tense',
      difficulty: 'medium',
      questionIds: ['bcs-eng-001'],
      eligibleCount: 1,
      chunkIndex: 0,
      chunkCount: 1,
      generatedAt: TS,
    });
    // ---- stats / coverage / analytics ----
    await setDoc(doc(db, 'jobQuestionBankStats', 'global'), {
      total: 35, verified: 35, reviewed: 0, draft: 0,
      calculatedAt: TS,
    });
    await setDoc(doc(db, 'jobBankCoverage', 'bcs__english'), {
      examId: 'bcs', subjectId: 'english', target: 30,
      verified: 35, coveragePct: 100, lastCalculated: TS,
    });
    await setDoc(doc(db, 'topicAnalytics', 'bcs__english__grammar__tense'), {
      examId: 'bcs', subjectId: 'english',
      topicId: 'english__grammar__tense',
      preparationPriority: 80, evidenceLevel: 'C',
      calculatedAt: TS,
    });
    // ---- historicalQuestions ----
    await setDoc(doc(db, 'historicalQuestions', 'H_BCS_2023_001'), {
      historicalQuestionId: 'H_BCS_2023_001',
      questionId: 'bcs-eng-001',
      examId: 'bcs', examYear: 2023, examPhase: 'preliminary',
      subjectId: 'english', topicId: 'english__grammar__tense',
      sourceType: 'official-paper',
      sourceReference: 'BCS 2023 preliminary paper',
      verificationStatus: 'Verified',
      verifiedAt: TS, verifiedBy: 'moderator-1',
      auditTrail: [],
    });
    await setDoc(doc(db, 'historicalQuestions', 'H_BCS_2023_002'), {
      historicalQuestionId: 'H_BCS_2023_002',
      questionId: 'bcs-eng-002',
      examId: 'bcs', examYear: 2023, examPhase: 'preliminary',
      subjectId: 'english', topicId: 'english__grammar__tense',
      sourceType: 'secondary-source',
      sourceReference: 'Guide book, page 12',
      verificationStatus: 'Unverified',
      verifiedAt: null, verifiedBy: null,
      auditTrail: [],
    });
    // ---- examHistory ----
    await setDoc(doc(db, 'users', 'student-1', 'examHistory', 'bcs'), {
      recentQuestionIds: ['bcs-eng-001'],
      lastAttemptNo: 1,
      updatedAt: TS,
    });
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

const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asModerator = () => env.authenticatedContext('moderator-1').firestore();
const asTeacherV = () => env.authenticatedContext('teacher-v').firestore();
const asTeacher1 = () => env.authenticatedContext('teacher-1').firestore();
const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asSignedOut = () => env.unauthenticatedContext().firestore();

describe('Read jobQuestions (v2) — the bank is never student-readable', () => {
  it('(cb-r1) student reading a Published v2 question is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobQuestions', 'bcs-eng-001')));
  });
  it('(cb-r2) student reading a v2 draft is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobQuestions', 'q_english_0002')));
  });
  it('(cb-r3) moderator reads any v2 question; the author reads their own draft; another teacher is DENIED', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'jobQuestions', 'bcs-eng-001')));
    await assertSucceeds(getDoc(doc(asTeacherV(), 'jobQuestions', 'q_english_0002')));
    await assertFails(getDoc(doc(asTeacher1(), 'jobQuestions', 'q_english_0002')));
  });
});

describe('Create jobQuestions (v2)', () => {
  it('(cb-r4) a verified teacher creates a valid v2 draft', async () => {
    await assertSucceeds(setDoc(
      doc(asTeacherV(), 'jobQuestions', 'q_english_0010'),
      { ...VALID_V2_DRAFT, questionId: 'q_english_0010' },
    ));
  });
  it('(cb-r5) a mixed-shape doc (questionId + examSlug) is DENIED', async () => {
    await assertFails(setDoc(
      doc(asTeacherV(), 'jobQuestions', 'q_english_0011'),
      { ...VALID_V2_DRAFT, questionId: 'q_english_0011', examSlug: 'bcs' },
    ));
  });
  it('(cb-r6) the questionId pattern is NOT rules-checked (lib-enforced) — a bad pattern passes the rules', async () => {
    // TRIMMED 24 Nov 2026: the ID regexes blew the 1000-expression
    // limit (see validJobQuestionV2). The lib validator
    // (jobCentralBank.ts, cb1–cb5) enforces the pattern; the rules
    // keep only the is-string + schemaVersion checks.
    await assertSucceeds(setDoc(
      doc(asTeacherV(), 'jobQuestions', 'q_english_0012'),
      { ...VALID_V2_DRAFT, questionId: 'bad-id' },
    ));
    await deleteDoc(doc(asAdmin(), 'jobQuestions', 'q_english_0012'));
  });
  it('(cb-r7) verificationStatus disagreeing with status is DENIED (verified + draft)', async () => {
    await assertFails(setDoc(
      doc(asTeacherV(), 'jobQuestions', 'q_english_0013'),
      { ...VALID_V2_DRAFT, questionId: 'q_english_0013', verificationStatus: 'verified' },
    ));
  });
  it('(cb-r8) a bad v2 hash is DENIED', async () => {
    await assertFails(setDoc(
      doc(asTeacherV(), 'jobQuestions', 'q_english_0014'),
      { ...VALID_V2_DRAFT, questionId: 'q_english_0014', duplicateHashV2: 'not-a-hash' },
    ));
  });
  it('(cb-r9) a pending teacher cannot create a v2 question', async () => {
    await assertFails(setDoc(
      doc(asTeacher1(), 'jobQuestions', 'q_english_0015'),
      { ...VALID_V2_DRAFT, questionId: 'q_english_0015', authorId: 'teacher-1', createdBy: 'teacher-1' },
    ));
  });
});

describe('Update jobQuestions (v2) — author and moderator', () => {
  it('(cb-r10) the author edits their own v2 draft content', async () => {
    await assertSucceeds(updateDoc(
      doc(asTeacherV(), 'jobQuestions', 'q_english_0002'),
      { question: 'Choose the correctly spelt word.', duplicateHashV2: 'fedcba9876543210' },
    ));
  });
  it('(cb-r11) the author may NOT set verificationStatus on their own draft', async () => {
    await assertFails(updateDoc(
      doc(asTeacherV(), 'jobQuestions', 'q_english_0002'),
      { verificationStatus: 'verified' },
    ));
  });
  it('(cb-r12) the moderator publishes an Under Review v2 doc', async () => {
    await assertSucceeds(updateDoc(
      doc(asModerator(), 'jobQuestions', 'q_english_0003'),
      publishPayloadV2('moderator-1'),
    ));
  });
  it('(cb-r13) publish with a non-empty duplicateCandidates list is DENIED', async () => {
    await assertFails(updateDoc(
      doc(asModerator(), 'jobQuestions', 'q_english_0004'),
      publishPayloadV2('moderator-1'),
    ));
  });
  it('(cb-r14) clearing the candidates list (review recorded in duplicateReview) then publishing SUCCEEDS', async () => {
    await assertSucceeds(updateDoc(
      doc(asModerator(), 'jobQuestions', 'q_english_0005'),
      { duplicateCandidates: [] },
    ));
    await assertSucceeds(updateDoc(
      doc(asModerator(), 'jobQuestions', 'q_english_0005'),
      publishPayloadV2('moderator-1'),
    ));
  });
});

describe('Legacy v1 docs in the migration window', () => {
  it('(cb-r15) a v1 doc still publishes through the same transition guard', async () => {
    await assertSucceeds(updateDoc(
      doc(asModerator(), 'jobQuestions', 'q-legacy-001'),
      publishPayloadV1('moderator-1'),
    ));
  });
  it('(cb-r16) a v1 field cannot be smuggled into a v2 doc', async () => {
    await assertFails(updateDoc(
      doc(asModerator(), 'jobQuestions', 'bcs-eng-001'),
      { examSlug: 'bcs' },
    ));
  });
});

describe('examQuestionPools — no client write, ever', () => {
  const POOL = 'pool__bcs__scored__english__grammar__tense__medium__0';
  it('(cb-r17) student create and moderator create are both DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'examQuestionPools', 'pool__x'),
      { examId: 'bcs', questionIds: ['bcs-eng-001'] },
    ));
    await assertFails(setDoc(
      doc(asModerator(), 'examQuestionPools', 'pool__x'),
      { examId: 'bcs', questionIds: ['bcs-eng-001'] },
    ));
  });
  it('(cb-r18) moderator reads a pool; a student cannot', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'examQuestionPools', POOL)));
    await assertFails(getDoc(doc(asStudent1(), 'examQuestionPools', POOL)));
  });
});

describe('Stats / coverage / analytics — script-only writes', () => {
  it('(cb-r19) any signed-in user reads stats, coverage and analytics', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobQuestionBankStats', 'global')));
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobBankCoverage', 'bcs__english')));
    await assertSucceeds(getDoc(doc(asStudent1(), 'topicAnalytics', 'bcs__english__grammar__tense')));
  });
  it('(cb-r20) no client writes stats, coverage or analytics — not even a moderator', async () => {
    await assertFails(setDoc(doc(asStudent1(), 'jobQuestionBankStats', 'x'), { total: 1 }));
    await assertFails(setDoc(doc(asModerator(), 'jobBankCoverage', 'x'), { examId: 'bcs' }));
    await assertFails(setDoc(doc(asModerator(), 'topicAnalytics', 'x'), { examId: 'bcs' }));
  });
});

describe('historicalQuestions — verified-only student read', () => {
  it('(cb-r21) a student reads a Verified record but not an Unverified one', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'historicalQuestions', 'H_BCS_2023_001')));
    await assertFails(getDoc(doc(asStudent1(), 'historicalQuestions', 'H_BCS_2023_002')));
  });
  it('(cb-r22) a moderator reads Unverified records and creates a new one', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'historicalQuestions', 'H_BCS_2023_002')));
    await assertSucceeds(setDoc(
      doc(asModerator(), 'historicalQuestions', 'H_BCS_2023_003'),
      {
        historicalQuestionId: 'H_BCS_2023_003',
        questionId: 'bcs-eng-003',
        examId: 'bcs', examYear: 2023, examPhase: 'preliminary',
        subjectId: 'english', topicId: 'english__grammar__tense',
        sourceType: 'official-paper',
        sourceReference: 'BCS 2023 preliminary paper',
        verificationStatus: 'Verified',
        verifiedAt: TS, verifiedBy: 'moderator-1',
        auditTrail: [],
      },
    ));
  });
  it('(cb-r23) a student cannot create a historical record', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'historicalQuestions', 'H_BCS_2023_004'),
      { verificationStatus: 'Verified', sourceReference: 'x' },
    ));
  });
});

describe('jobExamSelectionRules — public read, moderator write', () => {
  it('(cb-r24) any signed-in user reads the rules, including the grade_11_20 draft', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobExamSelectionRules', 'bcs')));
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobExamSelectionRules', 'grade_11_20')));
  });
  it('(cb-r25) a student cannot write rules; a moderator can', async () => {
    await assertFails(setDoc(doc(asStudent1(), 'jobExamSelectionRules', 'x'), {
      totalQuestions: 1, durationMinutes: 1, negativeMarking: 0,
      subjectWeights: [], verificationStatus: 'draft',
      syllabusVersion: 'x', scoringConfigVersion: 'x',
    }));
    await assertSucceeds(setDoc(doc(asModerator(), 'jobExamSelectionRules', 'bank'), {
      totalQuestions: 100, durationMinutes: 60, negativeMarking: 0.25,
      subjectWeights: [{ subjectId: 'english', questions: 25 }],
      verificationStatus: 'verified',
      syllabusVersion: 'bscs-115/2025', scoringConfigVersion: 'bscs-115/2025',
    }));
  });
});

describe('jobPassages — shared content', () => {
  it('(cb-r26) any signed-in user reads a passage; a signed-out user cannot', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobPassages', 'bcs-eng-passage-01')));
    await assertFails(getDoc(doc(asSignedOut(), 'jobPassages', 'bcs-eng-passage-01')));
  });
  it('(cb-r27) a moderator updates a passage; a student cannot', async () => {
    await assertSucceeds(updateDoc(
      doc(asModerator(), 'jobPassages', 'bcs-eng-passage-01'),
      { text: 'Rahim is a school teacher in a small village. Every morning he walks.' },
    ));
    await assertFails(updateDoc(
      doc(asStudent1(), 'jobPassages', 'bcs-eng-passage-01'),
      { text: 'tampered' },
    ));
  });
});

describe('examHistory — owner-only, bounded, lastAttemptNo only increases', () => {
  it('(cb-r28) the owner creates their own history; another student cannot read it', async () => {
    await assertSucceeds(setDoc(
      doc(asStudent2(), 'users', 'student-2', 'examHistory', 'bank'),
      { recentQuestionIds: ['bcs-eng-001'], lastAttemptNo: 1, updatedAt: TS },
    ));
    await assertFails(getDoc(doc(asStudent1(), 'users', 'student-2', 'examHistory', 'bank')));
  });
  it('(cb-r29) the owner reads their history; a moderator reads it for support', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'users', 'student-1', 'examHistory', 'bcs')));
    await assertSucceeds(getDoc(doc(asModerator(), 'users', 'student-1', 'examHistory', 'bcs')));
  });
  it('(cb-r30) a 501st ID is rejected (bound is 500)', async () => {
    await assertFails(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'examHistory', 'bcs'),
      { recentQuestionIds: Array.from({ length: 501 }, (_, i) => `q${i}`), lastAttemptNo: 2 },
    ));
  });
  it('(cb-r31) lastAttemptNo may increase but never decrease', async () => {
    await assertSucceeds(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'examHistory', 'bcs'),
      { recentQuestionIds: ['bcs-eng-001', 'bcs-eng-002'], lastAttemptNo: 2 },
    ));
    await assertFails(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'examHistory', 'bcs'),
      { recentQuestionIds: ['bcs-eng-001'], lastAttemptNo: 1 },
    ));
  });
  it('(cb-r32) history is never deleted — not even by the owner', async () => {
    await assertFails(deleteDoc(doc(asStudent1(), 'users', 'student-1', 'examHistory', 'bcs')));
    await assertFails(deleteDoc(doc(asAdmin(), 'users', 'student-1', 'examHistory', 'bcs')));
  });
});
