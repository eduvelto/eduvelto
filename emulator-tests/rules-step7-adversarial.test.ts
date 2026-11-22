/**
 * Eduvelto Firestore security-rules tests — Job Step 7 ADVERSARIAL
 * checklist (ChatGPT consultation §6, 22 Nov 2026).
 *
 * Every item of ChatGPT's 33-item adversarial checklist gets a test
 * here (a1–a33), run against the REAL firestore.rules in the
 * emulator. Items already covered by the q-tests in
 * rules-step7-job-questions.test.ts are re-proven here so this file
 * is the single auditable checklist; the Step 7 report maps each
 * item to its q-test and a-test evidence.
 *
 * TWO tests in this file assert that an attack SUCCEEDS — they are
 * DOCUMENTED LIMITATIONS, not security passes, and are labelled as
 * such in their names:
 *   (a5) a fabricated submitted attempt: a student can create an
 *        in-progress attempt, submit it without answering, mint a
 *        receipt and read a mock key. The rules CANNOT distinguish
 *        that from a genuine attempt (no trusted server on Spark).
 *        Accepted because scores are client-computed practice
 *        results, NEVER shown as "Verified" (Step 3 §4.4).
 *   (a9) receipt reuse inside the window: a fresh receipt opens a
 *        key on repeat reads (same browser, another session). The
 *        receipt is a 10-minute authorization WINDOW, not one-use
 *        (P0-01 Option A) — rules cannot consume a receipt on read.
 *
 * Run with `npm run test:rules` (whole emulator-tests/ directory,
 * sequential). Same conventions as
 * rules-step7-job-questions.test.ts.
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
  collection,
  query,
  getDocs,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-step7-adv';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobQuestions')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 7 collections.`);
}

const TS = new Date('2026-11-22T08:00:00.000Z');
const VERIFY_TS = new Date('2026-11-22T09:00:00.000Z');
const FRESH_TS = new Date();
const STALE_TS = new Date(Date.now() - 20 * 60 * 1000);
const FUTURE_TS = new Date(Date.now() + 60 * 60 * 1000);

const OPTIONS = [
  { letter: 'A', text: 'দুটি স্বরের মিলন' },
  { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
  { letter: 'C', text: 'দুটি শব্দের মিলন' },
  { letter: 'D', text: 'দুটি বাক্যের মিলন' },
];

const VALID_QUESTION = {
  examSlug: 'bcs',
  subjectId: 'bcs__bangla',
  chapterId: 'bcs__bangla__grammar',
  topicId: 'bcs__bangla__grammar__sandhi',
  questionText: 'সন্ধি কাকে বলে?',
  options: OPTIONS,
  correctLetter: 'B',
  explanation: 'সন্ধি হলো দুটি ধ্বনির মিলন।',
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

const BUNDLE_QUESTIONS = [
  {
    n: 1,
    questionId: 'q-published-b',
    topicId: 'bcs__bangla__grammar__sandhi',
    subjectId: 'bcs__bangla',
    questionText: 'সন্ধি কাকে বলে?',
    options: OPTIONS,
  },
];

const VALID_BUNDLE = {
  kind: 'topic',
  examSlug: 'bcs',
  topicId: 'bcs__bangla__grammar__sandhi',
  mockId: null,
  year: null,
  titleBn: 'সন্ধি — অনুশীলন',
  titleEn: 'Sandhi — Practice',
  questions: BUNDLE_QUESTIONS,
  questionCount: 1,
  status: 'published',
  reviewStatus: 'Published',
  sourceQuestionIds: ['q-published-b'],
  configVersion: '2026-11-22.1',
  createdAt: TS,
  updatedAt: TS,
};

const VALID_KEY = {
  bundleId: 'topic__bcs__bangla__grammar__sandhi',
  answers: [
    {
      n: 1,
      questionId: 'q-published-b',
      correctLetter: 'B',
      correctText: 'দুটি ধ্বনির মিলন',
      explanation: 'সন্ধি হলো দুটি ধ্বনির মিলন।',
      whyWrong: null,
    },
  ],
  configVersion: '2026-11-22.1',
  createdAt: TS,
  updatedAt: TS,
};

const publishPayload = (verifier: string) => ({
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
      // teacher-r: verification REVOKED — was verified, no longer.
      ['teacher-r', 'teacher', { verificationStatus: 'revoked' }],
      ['student-1', 'student', {}],
      ['student-2', 'student', {}],
      ['student-3', 'student', {}],
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
    const questions: Array<[string, Record<string, unknown>]> = [
      ['q-published-a', {
        ...VALID_QUESTION,
        reviewStatus: 'Published', status: 'published',
        verifiedBy: 'moderator-1', verifiedAt: VERIFY_TS,
      }],
      ['q-published-b', {
        ...VALID_QUESTION,
        reviewStatus: 'Published', status: 'published',
        verifiedBy: 'moderator-1', verifiedAt: VERIFY_TS,
      }],
      ['q-draft-v', { ...VALID_QUESTION }],
      ['q-draft-revoked', {
        ...VALID_QUESTION, authorId: 'teacher-r', createdBy: 'teacher-r',
        questionText: 'বাতিল শিক্ষকের প্রশ্ন?',
      }],
      ['q-under-review', { ...VALID_QUESTION, reviewStatus: 'Under Review', questionText: 'যাচাইয়ের প্রশ্ন?' }],
      ['q-under-review-verified', {
        ...VALID_QUESTION, reviewStatus: 'Under Review',
        verifiedBy: 'moderator-1', verifiedAt: VERIFY_TS,
        questionText: 'যাচাইকৃত প্রশ্ন?',
      }],
      ['q-mod-authored', {
        ...VALID_QUESTION, reviewStatus: 'Under Review',
        authorId: 'moderator-1', createdBy: 'moderator-1',
        questionText: 'মডারেটরের নিজের প্রশ্ন?',
      }],
      ['q-rejected', {
        ...VALID_QUESTION, reviewStatus: 'Rejected',
        rejectionReason: 'ব্যাখ্যা ভুল, উৎস নেই।',
        questionText: 'বাতিল হওয়া প্রশ্ন?',
      }],
      ['q-archived', { ...VALID_QUESTION, reviewStatus: 'Archived', questionText: 'সংরক্ষিত প্রশ্ন?' }],
    ];
    for (const [id, data] of questions) {
      await setDoc(doc(db, 'jobQuestions', id), data);
    }
    const bundles: Array<[string, Record<string, unknown>]> = [
      ['topic__bcs__bangla__grammar__sandhi', { ...VALID_BUNDLE }],
      ['mock__bcs-mock-01', {
        ...VALID_BUNDLE,
        kind: 'mock', topicId: null, mockId: 'bcs-mock-01',
        titleBn: 'বিসিএস মডেল টেস্ট ১', titleEn: 'BCS Model Test 1',
      }],
      ['mock__bcs-mock-02', {
        ...VALID_BUNDLE,
        kind: 'mock', topicId: null, mockId: 'bcs-mock-02',
        titleBn: 'বিসিএস মডেল টেস্ট ২', titleEn: 'BCS Model Test 2',
      }],
      ['mock__bcs-mock-03', {
        ...VALID_BUNDLE,
        kind: 'mock', topicId: null, mockId: 'bcs-mock-03',
        titleBn: 'বিসিএস মডেল টেস্ট ৩', titleEn: 'BCS Model Test 3',
      }],
      ['topic__bcs__bangla__grammar__samash', {
        ...VALID_BUNDLE,
        topicId: 'bcs__bangla__grammar__samash',
        titleBn: 'সমাস — খসড়া', titleEn: 'Samash — Draft',
        status: 'draft', reviewStatus: 'Not Started',
      }],
    ];
    for (const [id, data] of bundles) {
      await setDoc(doc(db, 'jobQuestionBundles', id), data);
    }
    const keys: Array<[string, Record<string, unknown>]> = [
      ['topic__bcs__bangla__grammar__sandhi', { ...VALID_KEY }],
      ['mock__bcs-mock-01', { ...VALID_KEY, bundleId: 'mock__bcs-mock-01' }],
      ['mock__bcs-mock-02', { ...VALID_KEY, bundleId: 'mock__bcs-mock-02' }],
    ];
    for (const [id, data] of keys) {
      await setDoc(doc(db, 'jobQuestionKeys', id), data);
    }
    const attempts: Array<[string, string, Record<string, unknown>]> = [
      ['student-1', 'attempt-submitted', {
        userId: 'student-1', bundleId: 'mock__bcs-mock-01', kind: 'mock',
        status: 'submitted', startedAt: TS, submittedAt: VERIFY_TS,
      }],
      ['student-1', 'attempt-submitted-2', {
        userId: 'student-1', bundleId: 'mock__bcs-mock-02', kind: 'mock',
        status: 'submitted', startedAt: TS, submittedAt: VERIFY_TS,
      }],
      ['student-1', 'attempt-inprogress', {
        userId: 'student-1', bundleId: 'mock__bcs-mock-01', kind: 'mock',
        status: 'in-progress', startedAt: TS, submittedAt: null,
      }],
      ['student-2', 'attempt-submitted', {
        userId: 'student-2', bundleId: 'mock__bcs-mock-01', kind: 'mock',
        status: 'submitted', startedAt: TS, submittedAt: VERIFY_TS,
      }],
      ['student-2', 'attempt-submitted-3', {
        userId: 'student-2', bundleId: 'mock__bcs-mock-03', kind: 'mock',
        status: 'submitted', startedAt: TS, submittedAt: VERIFY_TS,
      }],
      ['student-2', 'attempt-inprogress-2b', {
        userId: 'student-2', bundleId: 'mock__bcs-mock-02', kind: 'mock',
        status: 'in-progress', startedAt: TS, submittedAt: null,
      }],
      // student-3 has a submitted attempt on mock-02 but NO receipt
      // for it (used by a10: a future-dated receipt creation).
      ['student-3', 'attempt-submitted-mock02', {
        userId: 'student-3', bundleId: 'mock__bcs-mock-02', kind: 'mock',
        status: 'submitted', startedAt: TS, submittedAt: VERIFY_TS,
      }],
    ];
    for (const [uid, id, data] of attempts) {
      await setDoc(doc(db, 'users', uid, 'jobAttempts', id), data);
    }
    const receipts: Array<[string, Record<string, unknown>]> = [
      ['student-1_mock__bcs-mock-01', {
        userId: 'student-1', bundleId: 'mock__bcs-mock-01',
        attemptId: 'attempt-submitted', createdAt: FRESH_TS,
      }],
      ['student-2_mock__bcs-mock-01', {
        userId: 'student-2', bundleId: 'mock__bcs-mock-01',
        attemptId: 'attempt-submitted', createdAt: STALE_TS,
      }],
      ['student-2_mock__bcs-mock-02', {
        userId: 'student-2', bundleId: 'mock__bcs-mock-02',
        attemptId: 'attempt-inprogress-2b', createdAt: FRESH_TS,
      }],
      ['student-2_mock__bcs-mock-03', {
        userId: 'student-2', bundleId: 'mock__bcs-mock-03',
        attemptId: 'attempt-submitted-3', createdAt: FRESH_TS,
      }],
      // Future-dated receipt (a10b): created 1 hour from now, on a
      // real submitted attempt — must NOT open its key.
      ['student-1_mock__bcs-mock-02', {
        userId: 'student-1', bundleId: 'mock__bcs-mock-02',
        attemptId: 'attempt-submitted-2', createdAt: FUTURE_TS,
      }],
    ];
    for (const [id, data] of receipts) {
      await setDoc(doc(db, 'jobReceipts', id), data);
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

const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asModerator = () => env.authenticatedContext('moderator-1').firestore();
const asTeacherV = () => env.authenticatedContext('teacher-v').firestore();
const asTeacher1 = () => env.authenticatedContext('teacher-1').firestore();
const asTeacherR = () => env.authenticatedContext('teacher-r').firestore();
const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asStudent3 = () => env.authenticatedContext('student-3').firestore();

describe('Adversarial checklist — creation paths (a1–a4)', () => {
  it('(a1) Student creates a question directly — DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobQuestions', 'a1-new'), VALID_QUESTION),
    );
  });
  it('(a2) Student creates a bundle directly — DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__a2'), {
        ...VALID_BUNDLE, topicId: 'bcs__bangla__grammar__a2',
      }),
    );
  });
  it('(a3) Student creates an answer key directly — DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobQuestionKeys', 'mock__bcs-mock-03'), {
        ...VALID_KEY, bundleId: 'mock__bcs-mock-03',
      }),
    );
  });
  it('(a4) Student creates a receipt without an attempt — DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobReceipts', 'student-1_mock__bcs-mock-03'), {
        userId: 'student-1', bundleId: 'mock__bcs-mock-03',
        attemptId: 'no-such-attempt', createdAt: new Date(),
      }),
    );
  });
});

describe('Adversarial checklist — fabricated attempt (a5, DOCUMENTED LIMITATION)', () => {
  it('(a5-DOCUMENTED-LIMITATION) Student fabricates a submitted attempt, mints a receipt and reads a mock key — SUCCEEDS (proves the client-trust limit; NOT a security pass — submitted is client-attested, scores are never Verified)', async () => {
    // 1. Create an in-progress attempt on a Published bundle.
    await assertSucceeds(
      setDoc(doc(asStudent3(), 'users', 'student-3', 'jobAttempts', 'attempt-fabricated'), {
        userId: 'student-3', bundleId: 'mock__bcs-mock-01', kind: 'mock',
        status: 'in-progress', startedAt: new Date(), submittedAt: null,
      }),
    );
    // 2. Submit it WITHOUT answering anything.
    await assertSucceeds(
      updateDoc(doc(asStudent3(), 'users', 'student-3', 'jobAttempts', 'attempt-fabricated'), {
        status: 'submitted', submittedAt: new Date(),
      }),
    );
    // 3. Mint a receipt on the fabricated submission.
    await assertSucceeds(
      setDoc(doc(asStudent3(), 'jobReceipts', 'student-3_mock__bcs-mock-01'), {
        userId: 'student-3', bundleId: 'mock__bcs-mock-01',
        attemptId: 'attempt-fabricated', createdAt: new Date(),
      }),
    );
    // 4. Read the mock key — the rules cannot tell this apart
    // from a genuine attempt. This is the accepted limitation.
    await assertSucceeds(getDoc(doc(asStudent3(), 'jobQuestionKeys', 'mock__bcs-mock-01')));
  });
});

describe('Adversarial checklist — receipt misuse (a6–a12)', () => {
  it('(a6) Student uses another user\'s receipt — DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobReceipts', 'student-2_mock__bcs-mock-03'), {
        userId: 'student-2', bundleId: 'mock__bcs-mock-03',
        attemptId: 'attempt-submitted-3', createdAt: new Date(),
      }),
    );
  });
  it('(a6b) Student reads a key only another student has a fresh receipt for — DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobQuestionKeys', 'mock__bcs-mock-03')));
  });
  it('(a7) Student uses another user\'s attempt — DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobReceipts', 'student-1_mock__bcs-mock-03'), {
        userId: 'student-1', bundleId: 'mock__bcs-mock-03',
        attemptId: 'attempt-submitted-3', createdAt: new Date(),
      }),
    );
  });
  it('(a8) Student reads a key with an expired receipt — DENIED', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'jobQuestionKeys', 'mock__bcs-mock-01')));
  });
  it('(a9-DOCUMENTED-LIMITATION) Student reuses a valid receipt (second read inside the window) — SUCCEEDS (proves Option A: the receipt is a 10-minute window, not one-use)', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobQuestionKeys', 'mock__bcs-mock-01')));
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobQuestionKeys', 'mock__bcs-mock-01')));
  });
  it('(a10) Student creates a receipt with a future creation timestamp — DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent3(), 'jobReceipts', 'student-3_mock__bcs-mock-02'), {
        userId: 'student-3', bundleId: 'mock__bcs-mock-02',
        attemptId: 'attempt-submitted-mock02', createdAt: FUTURE_TS,
      }),
    );
  });
  it('(a10b) A future-dated receipt (seeded) does NOT open its key — DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobQuestionKeys', 'mock__bcs-mock-02')));
  });
  it('(a11) Student modifies an existing receipt — DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'jobReceipts', 'student-1_mock__bcs-mock-01'), {
        attemptId: 'attempt-inprogress',
      }),
    );
  });
  it('(a12) Student deletes a receipt — DENIED (no delete + recreate refresh)', async () => {
    await assertFails(deleteDoc(doc(asStudent1(), 'jobReceipts', 'student-1_mock__bcs-mock-01')));
  });
  it('(a12b) Admin deleting a receipt SUCCEEDS (cleanup)', async () => {
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'jobReceipts', 'student-1_mock__bcs-mock-01')));
  });
});

describe('Adversarial checklist — attempts (a13, a28, a29)', () => {
  it('(a13) Student reads another student\'s attempts — DENIED', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'users', 'student-1', 'jobAttempts', 'attempt-submitted')));
  });
  it('(a28) Attempt is modified after submission — DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'attempt-submitted'), {
        bundleId: 'mock__bcs-mock-02',
      }),
    );
  });
  it('(a29) Attempt is deleted after submission — DENIED (student and admin)', async () => {
    await assertFails(deleteDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'attempt-submitted')));
    await assertFails(deleteDoc(doc(asAdmin(), 'users', 'student-1', 'jobAttempts', 'attempt-submitted')));
  });
});

describe('Adversarial checklist — privilege escalation (a14–a20)', () => {
  it('(a14) Teacher publishes their own question — DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacherV(), 'jobQuestions', 'q-draft-v'), publishPayload('teacher-v')),
    );
  });
  it('(a15) Teacher changes their own verification status — DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'users', 'teacher-1'), { verificationStatus: 'verified' }),
    );
  });
  it('(a16) Teacher modifies authorId before publication — DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacherV(), 'jobQuestions', 'q-draft-v'), {
        authorId: 'moderator-1',
      }),
    );
  });
  it('(a17) Moderator promotes themself to Admin — DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'users', 'moderator-1'), { role: 'admin' }),
    );
  });
  it('(a18-ADAPTED) Teacher creates an answer key — DENIED (a Moderator creating a key is BY DESIGN — the trusted publisher role — so the checklist item as written does not apply; see the Step 7 report)', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestionKeys', 'mock__bcs-mock-03'), {
        ...VALID_KEY, bundleId: 'mock__bcs-mock-03',
      }),
    );
  });
  it('(a19) Unverified teacher publishes a question — DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'jobQuestions', 'q-under-review'), publishPayload('teacher-1')),
    );
  });
  it('(a20) Revoked teacher publishes / creates / edits a question — DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherR(), 'jobQuestions', 'a20-new'), {
        ...VALID_QUESTION, authorId: 'teacher-r', createdBy: 'teacher-r',
      }),
    );
    await assertFails(
      updateDoc(doc(asTeacherR(), 'jobQuestions', 'q-draft-revoked'), {
        questionText: 'বাতিল শিক্ষকের সম্পাদনা?',
      }),
    );
    await assertFails(
      updateDoc(doc(asTeacherR(), 'jobQuestions', 'q-under-review'), publishPayload('teacher-r')),
    );
  });
});

describe('Adversarial checklist — state machine (a21–a24)', () => {
  it('(a21) Author publishes directly from draft — DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-draft-v'), publishPayload('moderator-1')),
    );
  });
  it('(a22) Rejected question is published directly — DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-rejected'), publishPayload('moderator-1')),
    );
  });
  it('(a23) Published question returns to draft without version increment — DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-published-a'), {
        status: 'draft', reviewStatus: 'Not Started',
      }),
    );
  });
  it('(a24) Published question returns to draft with an increment of two — DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-published-b'), {
        status: 'draft', reviewStatus: 'Not Started', version: 3,
      }),
    );
  });
});

describe('Adversarial checklist — field validation (a25–a27)', () => {
  it('(a25) Question contains an unexpected privileged field — DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'a25-new'), {
        ...VALID_QUESTION, adminNote: 'smuggled',
      }),
    );
  });
  it('(a26) Required field is missing — DENIED', async () => {
    const { questionText: _dropped, ...withoutText } = VALID_QUESTION;
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'a26-new'), withoutText),
    );
  });
  it('(a27) Required field is explicitly null — DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'a27-new'), {
        ...VALID_QUESTION, questionText: null,
      }),
    );
  });
});

describe('Adversarial checklist — version consistency + reads (a30–a33)', () => {
  it('(a30) Bundle and key reference different versions — DENIED (stale configVersion)', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobQuestionKeys', 'mock__bcs-mock-03'), {
        ...VALID_KEY, bundleId: 'mock__bcs-mock-03', configVersion: '1999-01-01.1',
      }),
    );
  });
  it('(a30b) Bundle and key reference different versions — DENIED (answer count != bundle questionCount)', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobQuestionKeys', 'mock__bcs-mock-03'), {
        ...VALID_KEY,
        bundleId: 'mock__bcs-mock-03',
        answers: [...VALID_KEY.answers, { ...VALID_KEY.answers[0], n: 2 }],
      }),
    );
  });
  it('(a31) Question is read directly by a student — DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobQuestions', 'q-published-a')));
  });
  it('(a32) Question key is queried as a collection by a student — DENIED', async () => {
    await assertFails(getDocs(query(collection(asStudent1(), 'jobQuestionKeys'))));
  });
  it('(a32b) Question key is queried as a collection by a moderator — SUCCEEDS', async () => {
    await assertSucceeds(getDocs(query(collection(asModerator(), 'jobQuestionKeys'))));
  });
  it('(a33) Unmatched collection path is accessed — DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobQuestionsX', 'q1')));
    await assertFails(setDoc(doc(asModerator(), 'unknownCollection', 'doc'), { x: 1 }));
    await assertFails(getDoc(doc(asModerator(), 'jobQuestions', 'q-draft-v', 'notes', 'n1')));
  });
});
