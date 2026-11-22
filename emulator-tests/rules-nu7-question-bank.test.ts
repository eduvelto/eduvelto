/**
 * Eduvelto — Firestore Rules tests: NU question bank + verification
 * (NU-7; design §11, §15 NU-7, §19.2.4–§19.2.6, §19.3.2–§19.3.3,
 * §19.6, §19.10 NU-T3–T8/T16–T24 subset). Same conventions as
 * rules-nu6-syllabus.test.ts: own project id, beforeAll with a 300s
 * timeout, NO `rules:` option — the emulator loads the rules from
 * firebase.json. Runs against firestore.rules in the project root
 * (sanity-checked below).
 *
 * Covered: question create shape (§11.2 — 4 distinct options,
 * explanation, syllabus references, no correct answer in the bank
 * doc, examYear rules, group-* subjects rejected per Blocker B);
 * draft keys (create/update only while draft, version-locked,
 * author-or-Admin reads); the publication state machine (§19.6.1 —
 * graph edges, actor per edge, draft-key requirement on submit,
 * publish gate); review records (version + under_review + 4 checks
 * + reviewedAt == request.time, no self-review); publication
 * records (actor + time + version + matching state); bundle/key
 * shape (§19.2.5 — mock 100Q/3600s/pass 35, marking 1/0/0/no
 * negative); signed-in-only reads for bundles, keys and the
 * syllabus (owner 22 Nov 10:33 addendum).
 *
 * Order matters: transition tests mutate their question docs, so
 * each test uses the doc named in its title and the file runs
 * top to bottom (vitest runs `it` blocks in order).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
  type RulesTestContext,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';

const PROJECT_ID = 'eduvelto-rules-test-nu7';

function toFirestoreDb(context: RulesTestContext): Firestore {
  return context.firestore() as unknown as Firestore;
}

let env: RulesTestEnvironment;
let admin: RulesTestContext;
let student: RulesTestContext;
let teacherVerified: RulesTestContext;
let teacherVerified2: RulesTestContext;
let teacherVerified3: RulesTestContext;
let teacherPending: RulesTestContext;
let anonymous: RulesTestContext;

const MOCK_SNAPSHOT = {
  totalQuestions: 100,
  durationSeconds: 3600,
  marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: false },
  passMark: 35,
  circularVersion: 'nu-2025-26-v1',
  configVersion: 1,
};
const TOPIC_SNAPSHOT = {
  totalQuestions: 1,
  durationSeconds: null,
  marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: false },
  passMark: null,
  circularVersion: 'nu-2025-26-v1',
  configVersion: 1,
};

function questionDoc(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    status: 'draft',
    sourceType: 'original_practice',
    provenance: 'NU-7 test — HSC সিলেবাসভিত্তিক মূল প্রশ্ন',
    groupIds: ['humanities', 'science', 'business'],
    subjectId: 'bangla',
    chapterId: 'nu-ch-bangla-prose',
    topicId: 'nu-tp-bangla-prose-01',
    questionText: 'অপরিচিতা গল্পের লেখক কে?',
    questionLang: 'bn',
    options: ['রবীন্দ্রনাথ ঠাকুর', 'কাজী নজরুল ইসলাম', 'শরৎচন্দ্র চট্টোপাধ্যায়', 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়'],
    difficulty: 'easy',
    explanation: 'অপরিচিতা রবীন্দ্রনাথ ঠাকুরের লেখা ছোটগল্প।',
    createdBy: 'teacher-verified',
    circularVersion: 'nu-2025-26-v1',
    createdAt: new Date('2026-11-22T05:00:00Z'),
    updatedAt: new Date('2026-11-22T05:00:00Z'),
    ...overrides,
  };
}

function mockBundleQuestions(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    questionId: `q-mock-${i + 1}`,
    version: 1,
    questionText: `মক প্রশ্ন ${i + 1}`,
    options: ['ক', 'খ', 'গ', 'ঘ'],
  }));
}

describe('NU-7 question bank rules (design §19.6, §19.2.4–§19.2.6)', () => {
  beforeAll(async () => {
    const rules = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8');
    expect(rules).toContain('match /nuQuestions/{questionId}');
    expect(rules).toContain('match /nuQuestionDraftKeys/{questionId}');
    expect(rules).toContain('isValidNuQuestion');
    expect(rules).toContain('isNuQuestionTransitionAllowed');
    expect(rules).toContain('nu-question-published');

    env = await initializeTestEnvironment({ projectId: PROJECT_ID });
    await env.withSecurityRulesDisabled(async (context) => {
      const db = toFirestoreDb(context);
      for (const u of [
        { uid: 'admin-1', role: 'admin', isActive: true },
        { uid: 'owner-1', role: 'owner', isActive: true },
        { uid: 'student-1', role: 'student', isActive: true },
        { uid: 'student-2', role: 'student', isActive: true },
        { uid: 'teacher-verified', role: 'teacher', verificationStatus: 'verified', isActive: true },
        { uid: 'teacher-verified-2', role: 'teacher', verificationStatus: 'verified', isActive: true },
        { uid: 'teacher-verified-3', role: 'teacher', verificationStatus: 'verified', isActive: true },
        { uid: 'teacher-pending', role: 'teacher', verificationStatus: 'pending', isActive: true },
      ]) {
        await setDoc(doc(db, 'users', u.uid), u);
      }
      // Questions in every state the machine tests need.
      await setDoc(doc(db, 'nuQuestions', 'q-draft-teacher'), questionDoc({}));
      await setDoc(doc(db, 'nuQuestions', 'q-draft-teacher-2'), questionDoc({ createdBy: 'teacher-verified-2' }));
      await setDoc(doc(db, 'nuQuestions', 'q-draft-nokey'), questionDoc({}));
      await setDoc(doc(db, 'nuQuestions', 'q-submitted'), questionDoc({ status: 'submitted_for_review' }));
      await setDoc(doc(db, 'nuQuestions', 'q-submitted-2'), questionDoc({ status: 'submitted_for_review' }));
      await setDoc(doc(db, 'nuQuestions', 'q-under-review'), questionDoc({
        status: 'under_review', reviewedBy: 'teacher-verified-2', reviewedAt: new Date('2026-11-22T05:10:00Z'),
      }));
      await setDoc(doc(db, 'nuQuestions', 'q-under-review-2'), questionDoc({
        status: 'under_review', reviewedBy: 'teacher-verified-2', reviewedAt: new Date('2026-11-22T05:10:00Z'),
      }));
      await setDoc(doc(db, 'nuQuestions', 'q-approved'), questionDoc({
        status: 'approved', reviewedBy: 'teacher-verified-2', reviewedAt: new Date('2026-11-22T05:10:00Z'),
      }));
      await setDoc(doc(db, 'nuQuestions', 'q-approved-noreview'), questionDoc({ status: 'approved' }));
      await setDoc(doc(db, 'nuQuestions', 'q-published'), questionDoc({
        status: 'published', reviewedBy: 'teacher-verified-2',
        reviewedAt: new Date('2026-11-22T05:10:00Z'), publishedAt: new Date('2026-11-22T05:20:00Z'),
      }));
      await setDoc(doc(db, 'nuQuestions', 'q-changes'), questionDoc({ status: 'changes_requested' }));
      await setDoc(doc(db, 'nuQuestions', 'q-changes-keyed'), questionDoc({ status: 'changes_requested' }));
      await setDoc(doc(db, 'nuQuestions', 'q-rejected'), questionDoc({ status: 'rejected' }));
      // Draft keys — deliberately NONE for q-draft-nokey, q-changes,
      // q-draft-teacher-2 (key-create tests use the last one).
      for (const qid of ['q-draft-teacher', 'q-submitted', 'q-approved', 'q-published', 'q-changes-keyed', 'q-under-review-2']) {
        await setDoc(doc(db, 'nuQuestionDraftKeys', qid), {
          questionId: qid,
          version: 1,
          correctOptionIndex: 0,
          createdBy: 'teacher-verified',
          subjectId: 'bangla',
          groupIds: ['humanities', 'science', 'business'],
        });
      }
      // Bundles + keys.
      await setDoc(doc(db, 'nuQuestionBundles', 'bundle-topic-1'), {
        bundleId: 'bundle-topic-1',
        kind: 'topic',
        groupId: 'humanities',
        subjectId: 'bangla',
        topicId: 'nu-tp-bangla-prose-01',
        questions: [{ questionId: 'q-published', version: 1, questionText: 'অপরিচিতা গল্পের লেখক কে?', options: ['ক', 'খ', 'গ', 'ঘ'] }],
        questionCount: 1,
        configSnapshot: TOPIC_SNAPSHOT,
        sourceQuestionIds: ['q-published'],
        status: 'published',
        version: 1,
        publishedBy: 'admin-1',
      });
      await setDoc(doc(db, 'nuQuestionBundles', 'bundle-topic-draft'), {
        bundleId: 'bundle-topic-draft',
        kind: 'topic',
        groupId: 'humanities',
        subjectId: 'bangla',
        topicId: 'nu-tp-bangla-prose-01',
        questions: [{ questionId: 'q-published', version: 1, questionText: 'অপরিচিতা গল্পের লেখক কে?', options: ['ক', 'খ', 'গ', 'ঘ'] }],
        questionCount: 1,
        configSnapshot: TOPIC_SNAPSHOT,
        sourceQuestionIds: ['q-published'],
        status: 'draft',
        version: 1,
        publishedBy: 'admin-1',
      });
      await setDoc(doc(db, 'nuQuestionBundles', 'bundle-mock-1'), {
        bundleId: 'bundle-mock-1',
        kind: 'mock',
        groupId: 'humanities',
        mockId: 'mock-1',
        questions: mockBundleQuestions(100),
        questionCount: 100,
        configSnapshot: MOCK_SNAPSHOT,
        sourceQuestionIds: mockBundleQuestions(100).map((q) => q.questionId),
        status: 'published',
        version: 1,
        publishedBy: 'admin-1',
      });
      await setDoc(doc(db, 'nuQuestionKeys', 'bundle-topic-1'), {
        bundleId: 'bundle-topic-1',
        keys: [{ questionId: 'q-published', version: 1, correctOptionIndex: 0, explanation: 'অপরিচিতা রবীন্দ্রনাথের লেখা।' }],
        questionVersion: 1,
      });
      await setDoc(doc(db, 'nuQuestionKeys', 'bundle-mock-1'), {
        bundleId: 'bundle-mock-1',
        keys: mockBundleQuestions(100).map((q) => ({ ...q, correctOptionIndex: 0, explanation: 'ব্যাখ্যা।' })),
        questionVersion: 1,
      });
      // One published topic for the signed-in syllabus-read tests.
      await setDoc(doc(db, 'nuTopics', 'nu-tp-pub-1'), {
        id: 'nu-tp-pub-1',
        subjectId: 'nu-sub-bangla',
        chapterId: 'nu-ch-bangla-prose',
        slug: 'oporichita',
        nameBn: 'অপরিচিতা',
        detailBn: 'রবীন্দ্রনাথ ঠাকুর',
        order: 1,
        syllabusSource: 'NCTB সাহিত্যপাঠ',
        syllabusVerified: false,
        status: 'published',
        circularVersion: '2025-26',
        createdBy: 'nu-syllabus-seed',
      });
    });

    admin = env.authenticatedContext('admin-1');
    student = env.authenticatedContext('student-1');
    teacherVerified = env.authenticatedContext('teacher-verified');
    teacherVerified2 = env.authenticatedContext('teacher-verified-2');
    teacherVerified3 = env.authenticatedContext('teacher-verified-3');
    teacherPending = env.authenticatedContext('teacher-pending');
    anonymous = env.unauthenticatedContext();
  }, 300000);

  afterAll(async () => {
    await env.cleanup();
  });

  // ---------- question create shape (§11.2) ----------
  it('n1: verified teacher creates a valid draft: ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-new-1'), {
        ...questionDoc({ createdBy: 'teacher-verified' }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n2: create with a group-40 block subject (Blocker B): DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-new-2'), {
        ...questionDoc({ subjectId: 'group-science', createdBy: 'teacher-verified' }),
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n3: create with 3 options: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-new-3'), {
        ...questionDoc({ options: ['ক', 'খ', 'গ'], createdBy: 'teacher-verified' }),
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n4: create with duplicate options: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-new-4'), {
        ...questionDoc({ options: ['ক', 'ক', 'গ', 'ঘ'], createdBy: 'teacher-verified' }),
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n5: create without an explanation: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-new-5'), {
        ...questionDoc({ explanation: '', createdBy: 'teacher-verified' }),
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n6: create without a chapterId: DENIED', async () => {
    const { chapterId: _omit, ...noChapter } = questionDoc({ createdBy: 'teacher-verified' });
    void _omit;
    await assertFails(
      setDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-new-6'), {
        ...noChapter,
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n7: previous-year question without examYear: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-new-7'), {
        ...questionDoc({ sourceType: 'official_previous_year', createdBy: 'teacher-verified' }),
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n8: original-practice question WITH examYear: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-new-8'), {
        ...questionDoc({ examYear: 2025, createdBy: 'teacher-verified' }),
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n9: create with a correct-answer field in the bank doc: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-new-9'), {
        ...questionDoc({ createdBy: 'teacher-verified' }),
        correctOptionIndex: 0,
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n10 (NU-T16): student creates a question: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(student), 'nuQuestions', 'q-new-10'), {
        ...questionDoc({ createdBy: 'student-1' }),
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n11: unverified (pending) teacher creates a question: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(teacherPending), 'nuQuestions', 'q-new-11'), {
        ...questionDoc({ createdBy: 'teacher-pending' }),
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n12: create with a client timestamp instead of server time: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-new-12'), {
        ...questionDoc({ createdBy: 'teacher-verified' }),
        createdAt: new Date(),
      }),
    );
  });

  // ---------- draft keys (§19.2.6) ----------
  it('n13: author creates a draft key for their own draft: ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(toFirestoreDb(teacherVerified2), 'nuQuestionDraftKeys', 'q-draft-teacher-2'), {
        questionId: 'q-draft-teacher-2',
        version: 1,
        correctOptionIndex: 0,
        createdBy: 'teacher-verified-2',
        subjectId: 'bangla',
        groupIds: ['humanities', 'science', 'business'],
      }),
    );
  });
  it('n14: draft key for a published question: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(admin), 'nuQuestionDraftKeys', 'q-published'), {
        questionId: 'q-published',
        version: 1,
        correctOptionIndex: 1,
        createdBy: 'admin-1',
        subjectId: 'bangla',
        groupIds: ['humanities'],
      }),
    );
  });
  it('n15: draft key with correctOptionIndex 4: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestionDraftKeys', 'q-draft-nokey'), {
        questionId: 'q-draft-nokey',
        version: 1,
        correctOptionIndex: 4,
        createdBy: 'teacher-verified',
        subjectId: 'bangla',
        groupIds: ['humanities'],
      }),
    );
  });
  it('n16: student reads a draft key: DENIED', async () => {
    await assertFails(getDoc(doc(toFirestoreDb(student), 'nuQuestionDraftKeys', 'q-draft-teacher')));
  });
  it('n17: another verified teacher reads the author’s draft key: DENIED', async () => {
    await assertFails(getDoc(doc(toFirestoreDb(teacherVerified2), 'nuQuestionDraftKeys', 'q-draft-teacher')));
  });
  it('n18: author updates their own draft key: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestionDraftKeys', 'q-draft-teacher'), {
        correctOptionIndex: 2,
      }),
    );
  });
  it('n19: draft key update changing the version: DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestionDraftKeys', 'q-draft-teacher'), {
        version: 2,
      }),
    );
  });

  // ---------- content edit — Rule A (§19.6.1) ----------
  it('n20: author edits their own draft’s difficulty: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-draft-teacher'), {
        difficulty: 'hard',
      }),
    );
  });
  it('n21: author changes their own draft’s version: DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-draft-teacher'), {
        version: 2,
      }),
    );
  });
  it('n22: admin edits a changes_requested question: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(toFirestoreDb(admin), 'nuQuestions', 'q-changes'), {
        difficulty: 'medium',
      }),
    );
  });
  it('n23: author edits a submitted question’s content: DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-submitted'), {
        difficulty: 'hard',
      }),
    );
  });

  // ---------- state machine — Rule B (§19.6.1) ----------
  it('n24: author submits their own draft for review (key exists): ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-draft-teacher'), {
        status: 'submitted_for_review',
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n25: submit a draft with NO draft key: DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-draft-nokey'), {
        status: 'submitted_for_review',
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n26: author submits ANOTHER teacher’s draft: DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-draft-teacher-2'), {
        status: 'submitted_for_review',
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n27: reviewer claims a submitted question: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(toFirestoreDb(teacherVerified2), 'nuQuestions', 'q-submitted'), {
        status: 'under_review',
        reviewedBy: 'teacher-verified-2',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n28: author claims their own submitted question (self-review): DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-submitted-2'), {
        status: 'under_review',
        reviewedBy: 'teacher-verified',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n29: student claims a submitted question: DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(student), 'nuQuestions', 'q-submitted-2'), {
        status: 'under_review',
        reviewedBy: 'student-1',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n30: the claiming reviewer approves: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(toFirestoreDb(teacherVerified2), 'nuQuestions', 'q-under-review'), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n31: a DIFFERENT reviewer approves: DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-under-review-2'), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n32: skip transition draft → approved: DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(admin), 'nuQuestions', 'q-draft-teacher-2'), {
        status: 'approved',
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n33: teacher publishes an approved question: DENIED (Admin-only)', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(teacherVerified2), 'nuQuestions', 'q-approved'), {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n34: publish a question with NO review fields (publish gate): DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(admin), 'nuQuestions', 'q-approved-noreview'), {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n35: admin publishes an approved question: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(toFirestoreDb(admin), 'nuQuestions', 'q-approved'), {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n36: admin withdraws a published question: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(toFirestoreDb(admin), 'nuQuestions', 'q-published'), {
        status: 'withdrawn',
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n37: rejected is terminal: DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(admin), 'nuQuestions', 'q-rejected'), {
        status: 'submitted_for_review',
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n38: withdrawn is terminal: DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(admin), 'nuQuestions', 'q-published'), {
        status: 'draft',
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n39: changes_requested → submitted without a draft key: DENIED', async () => {
    await assertFails(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-changes'), {
        status: 'submitted_for_review',
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('n40: changes_requested → submitted with a draft key: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(toFirestoreDb(teacherVerified), 'nuQuestions', 'q-changes-keyed'), {
        status: 'submitted_for_review',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  // ---------- review records (§19.2.11) ----------
  const reviewChecks = {
    questionCorrect: true,
    correctAnswerCorrect: true,
    explanationCorrect: true,
    sourceCorrect: true,
  };
  it('n41: the claiming reviewer submits a review: ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(toFirestoreDb(teacherVerified2), 'nuReviews'), {
        questionId: 'q-under-review-2',
        questionVersion: 1,
        reviewerId: 'teacher-verified-2',
        decision: 'approved',
        checks: reviewChecks,
        reviewedAt: serverTimestamp(),
      }),
    );
  });
  it('n42: self-review record (author reviews own question): DENIED', async () => {
    await assertFails(
      addDoc(collection(toFirestoreDb(teacherVerified), 'nuReviews'), {
        questionId: 'q-under-review-2',
        questionVersion: 1,
        reviewerId: 'teacher-verified',
        decision: 'approved',
        checks: reviewChecks,
        reviewedAt: serverTimestamp(),
      }),
    );
  });
  it('n43: review with the wrong questionVersion: DENIED', async () => {
    await assertFails(
      addDoc(collection(toFirestoreDb(teacherVerified2), 'nuReviews'), {
        questionId: 'q-under-review-2',
        questionVersion: 2,
        reviewerId: 'teacher-verified-2',
        decision: 'approved',
        checks: reviewChecks,
        reviewedAt: serverTimestamp(),
      }),
    );
  });
  it('n44: review for a question that is NOT under_review: DENIED', async () => {
    await assertFails(
      addDoc(collection(toFirestoreDb(teacherVerified2), 'nuReviews'), {
        questionId: 'q-draft-teacher-2',
        questionVersion: 1,
        reviewerId: 'teacher-verified-2',
        decision: 'approved',
        checks: reviewChecks,
        reviewedAt: serverTimestamp(),
      }),
    );
  });
  it('n45: review with a missing check: DENIED', async () => {
    await assertFails(
      addDoc(collection(toFirestoreDb(teacherVerified2), 'nuReviews'), {
        questionId: 'q-under-review-2',
        questionVersion: 1,
        reviewerId: 'teacher-verified-2',
        decision: 'approved',
        checks: { questionCorrect: true, correctAnswerCorrect: true, explanationCorrect: true },
        reviewedAt: serverTimestamp(),
      }),
    );
  });
  it('n46: rejection without a reason: DENIED', async () => {
    await assertFails(
      addDoc(collection(toFirestoreDb(teacherVerified2), 'nuReviews'), {
        questionId: 'q-under-review-2',
        questionVersion: 1,
        reviewerId: 'teacher-verified-2',
        decision: 'rejected',
        checks: reviewChecks,
        reviewedAt: serverTimestamp(),
      }),
    );
  });
  it('n47: rejection with a short reason: DENIED', async () => {
    await assertFails(
      addDoc(collection(toFirestoreDb(teacherVerified2), 'nuReviews'), {
        questionId: 'q-under-review-2',
        questionVersion: 1,
        reviewerId: 'teacher-verified-2',
        decision: 'rejected',
        reason: 'ভুল',
        checks: reviewChecks,
        reviewedAt: serverTimestamp(),
      }),
    );
  });
  it('n48: rejection with a full reason: ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(toFirestoreDb(teacherVerified2), 'nuReviews'), {
        questionId: 'q-under-review-2',
        questionVersion: 1,
        reviewerId: 'teacher-verified-2',
        decision: 'rejected',
        reason: 'উত্তরটি ভুল উৎস থেকে নেওয়া হয়েছে',
        checks: reviewChecks,
        reviewedAt: serverTimestamp(),
      }),
    );
  });

  // ---------- publication records (§19.2.11) ----------
  it('n49: admin records a publication for the now-published question: ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(toFirestoreDb(admin), 'nuPublications'), {
        questionId: 'q-approved',
        questionVersion: 1,
        action: 'published',
        actorId: 'admin-1',
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n50: publication record with the wrong actorId: DENIED', async () => {
    await assertFails(
      addDoc(collection(toFirestoreDb(admin), 'nuPublications'), {
        questionId: 'q-approved',
        questionVersion: 1,
        action: 'published',
        actorId: 'teacher-verified',
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n51: publication record for a draft question: DENIED', async () => {
    await assertFails(
      addDoc(collection(toFirestoreDb(admin), 'nuPublications'), {
        questionId: 'q-draft-teacher-2',
        questionVersion: 1,
        action: 'published',
        actorId: 'admin-1',
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n52: student creates a publication record: DENIED', async () => {
    await assertFails(
      addDoc(collection(toFirestoreDb(student), 'nuPublications'), {
        questionId: 'q-approved',
        questionVersion: 1,
        action: 'published',
        actorId: 'student-1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  // ---------- bundles + keys (§19.2.5, §19.3.3) ----------
  it('n53: admin creates a valid topic bundle: ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(toFirestoreDb(admin), 'nuQuestionBundles', 'bundle-topic-new'), {
        bundleId: 'bundle-topic-new',
        kind: 'topic',
        groupId: 'humanities',
        subjectId: 'bangla',
        topicId: 'nu-tp-bangla-prose-01',
        questions: [{ questionId: 'q-published', version: 1, questionText: 'অপরিচিতা গল্পের লেখক কে?', options: ['ক', 'খ', 'গ', 'ঘ'] }],
        questionCount: 1,
        configSnapshot: TOPIC_SNAPSHOT,
        sourceQuestionIds: ['q-published'],
        status: 'draft',
        version: 1,
        publishedBy: 'admin-1',
      }),
    );
  });
  it('n54: mock bundle with 99 questions (not 100): DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(admin), 'nuQuestionBundles', 'bundle-mock-99'), {
        bundleId: 'bundle-mock-99',
        kind: 'mock',
        groupId: 'humanities',
        mockId: 'mock-99',
        questions: mockBundleQuestions(99),
        questionCount: 99,
        configSnapshot: { ...MOCK_SNAPSHOT, totalQuestions: 99 },
        sourceQuestionIds: mockBundleQuestions(99).map((q) => q.questionId),
        status: 'draft',
        version: 1,
        publishedBy: 'admin-1',
      }),
    );
  });
  it('n55: bundle with questionCount ≠ questions.length: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(admin), 'nuQuestionBundles', 'bundle-count-bad'), {
        bundleId: 'bundle-count-bad',
        kind: 'topic',
        groupId: 'humanities',
        subjectId: 'bangla',
        topicId: 'nu-tp-bangla-prose-01',
        questions: [{ questionId: 'q-published', version: 1, questionText: 'অপরিচিতা গল্পের লেখক কে?', options: ['ক', 'খ', 'গ', 'ঘ'] }],
        questionCount: 2,
        configSnapshot: TOPIC_SNAPSHOT,
        sourceQuestionIds: ['q-published'],
        status: 'draft',
        version: 1,
        publishedBy: 'admin-1',
      }),
    );
  });
  it('n56: bundle with negative marking: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(admin), 'nuQuestionBundles', 'bundle-neg'), {
        bundleId: 'bundle-neg',
        kind: 'topic',
        groupId: 'humanities',
        subjectId: 'bangla',
        topicId: 'nu-tp-bangla-prose-01',
        questions: [{ questionId: 'q-published', version: 1, questionText: 'অপরিচিতা গল্পের লেখক কে?', options: ['ক', 'খ', 'গ', 'ঘ'] }],
        questionCount: 1,
        configSnapshot: {
          ...TOPIC_SNAPSHOT,
          marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: true },
        },
        sourceQuestionIds: ['q-published'],
        status: 'draft',
        version: 1,
        publishedBy: 'admin-1',
      }),
    );
  });
  it('n57: student creates a bundle: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(student), 'nuQuestionBundles', 'bundle-student'), {
        bundleId: 'bundle-student',
        kind: 'topic',
        groupId: 'humanities',
        subjectId: 'bangla',
        topicId: 'nu-tp-bangla-prose-01',
        questions: [{ questionId: 'q-published', version: 1, questionText: 'x', options: ['ক', 'খ', 'গ', 'ঘ'] }],
        questionCount: 1,
        configSnapshot: TOPIC_SNAPSHOT,
        sourceQuestionIds: ['q-published'],
        status: 'draft',
        version: 1,
        publishedBy: 'student-1',
      }),
    );
  });
  it('n58: anonymous reads a published bundle: DENIED (signed-in-only)', async () => {
    await assertFails(getDoc(doc(toFirestoreDb(anonymous), 'nuQuestionBundles', 'bundle-topic-1')));
  });
  it('n59: student reads a published bundle: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(toFirestoreDb(student), 'nuQuestionBundles', 'bundle-topic-1')));
  });
  it('n60: anonymous reads a practice key: DENIED (signed-in-only)', async () => {
    await assertFails(getDoc(doc(toFirestoreDb(anonymous), 'nuQuestionKeys', 'bundle-topic-1')));
  });
  it('n61: student reads a practice key without a receipt: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(toFirestoreDb(student), 'nuQuestionKeys', 'bundle-topic-1')));
  });
  it('n62: keys with questionVersion ≠ bundle version: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(admin), 'nuQuestionKeys', 'bundle-topic-1'), {
        bundleId: 'bundle-topic-1',
        keys: [{ questionId: 'q-published', version: 1, correctOptionIndex: 0, explanation: 'ব্যাখ্যা।' }],
        questionVersion: 2,
      }),
    );
  });
  it('n63: keys for a nonexistent bundle: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(admin), 'nuQuestionKeys', 'bundle-ghost'), {
        bundleId: 'bundle-ghost',
        keys: [{ questionId: 'q-published', version: 1, correctOptionIndex: 0, explanation: 'ব্যাখ্যা।' }],
        questionVersion: 1,
      }),
    );
  });
  it('n64: admin creates valid keys for a draft bundle: ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(toFirestoreDb(admin), 'nuQuestionKeys', 'bundle-topic-draft'), {
        bundleId: 'bundle-topic-draft',
        keys: [{ questionId: 'q-published', version: 1, correctOptionIndex: 0, explanation: 'ব্যাখ্যা।' }],
        questionVersion: 1,
      }),
    );
  });
  it('n65: student creates keys: DENIED', async () => {
    await assertFails(
      setDoc(doc(toFirestoreDb(student), 'nuQuestionKeys', 'bundle-topic-draft'), {
        bundleId: 'bundle-topic-draft',
        keys: [{ questionId: 'q-published', version: 1, correctOptionIndex: 0, explanation: 'ব্যাখ্যা।' }],
        questionVersion: 1,
      }),
    );
  });

  // ---------- audit enum + syllabus signed-in reads (10:33 addendum) ----------
  it('n66: admin writes the nu-question-published audit action: ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(toFirestoreDb(admin), 'adminActions'), {
        actorId: 'admin-1',
        action: 'nu-question-published',
        details: 'NU প্রশ্ন q-approved (v1) প্রকাশিত',
        targetId: 'q-approved',
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('n67: student reads a published topic: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(toFirestoreDb(student), 'nuTopics', 'nu-tp-pub-1')));
  });
  it('n68: anonymous reads a published topic: DENIED (signed-in-only)', async () => {
    await assertFails(getDoc(doc(toFirestoreDb(anonymous), 'nuTopics', 'nu-tp-pub-1')));
  });
  it('n69: the claiming reviewer reads the draft key: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(toFirestoreDb(teacherVerified2), 'nuQuestionDraftKeys', 'q-under-review-2')));
  });
  it('n70: a NON-claiming reviewer reads the draft key: DENIED', async () => {
    await assertFails(getDoc(doc(toFirestoreDb(teacherVerified3), 'nuQuestionDraftKeys', 'q-under-review-2')));
  });
});
