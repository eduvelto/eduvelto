/**
 * Eduvelto Firestore security-rules tests — NU admission, NU-4
 * (Authentication and Student Profiles + §19.3 rules spec).
 *
 * Covers the four new `users/{uid}` NU fields (admissionTarget-
 * Institution, admissionTargetGroup, admissionMode, admissionOnboarded),
 * the versioned nuExamConfigs / nuCircularConfigs documents, the
 * question bank / bundle / key / receipt / attempt rules, and the
 * adversarial cases NU-T1…NU-T24 from design §19.10 that NU-4 can
 * test (the rest need the NU-7 question flow / NU-16 suite).
 * Same conventions as rules.test.ts / rules-step4-job-profiles.test.ts:
 * the emulator loads firestore.rules from firebase.json at startup;
 * this file only sanity-checks the file exists. Run with
 * `npm run test:rules` (runs the whole emulator-tests/ directory).
 * Uses its own project id so it never shares data with the other
 * suites when vitest runs files in parallel.
 *
 * NOTE: timestamps in these tests are real wall-clock values
 * (Timestamp.fromMillis(Date.now() ± …)) — the emulator's request.time
 * is the same clock, so "fresh receipt" / "expired receipt" /
 * "deadline in the past" are meaningful here.
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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-nu4';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}

const now = () => Date.now();
const q100 = Array.from({ length: 100 }, (_, i) => `q${i + 1}`);
const q80 = Array.from({ length: 80 }, (_, i) => `q${i + 1}`);
const MOCK_SNAPSHOT = {
  totalQuestions: 100,
  durationSeconds: 3600,
  marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: false },
  passMark: 35,
  circularVersion: 'nu-2025-26-v1',
  configVersion: 1,
};

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role, extra] of [
      ['admin-1', 'admin', {}],
      ['owner-1', 'owner', {}],
      ['student-1', 'student', {}],
      ['student-2', 'student', {}],
      ['teacher-verified', 'teacher', { verificationStatus: 'verified' }],
      ['teacher-unverified', 'teacher', { verificationStatus: 'pending' }],
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
    // Exam configs + circular configs.
    await setDoc(doc(db, 'nuExamConfigs', 'nu-full-pub'), {
      examType: 'NU_ADMISSION',
      questionMode: 'MCQ',
      totalQuestions: 100,
      durationSeconds: 3600,
      marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: false },
      passMark: { value: 35, displayOnly: true },
      sections: { bangla: 20, english: 20, generalKnowledge: 20, groupSubjects: 40, groupSubjectsDetail: null },
      meritCalculationEnabled: true,
      officialRankEnabled: false,
      vivaEnabled: false,
      circularVersion: 'nu-2025-26-v1',
      configVersion: 1,
      status: 'published',
    });
    await setDoc(doc(db, 'nuExamConfigs', 'nu-full-draft'), {
      examType: 'NU_ADMISSION',
      questionMode: 'MCQ',
      totalQuestions: 100,
      durationSeconds: 3600,
      marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: false },
      passMark: { value: 35, displayOnly: true },
      sections: { bangla: 20, english: 20, generalKnowledge: 20, groupSubjects: 40, groupSubjectsDetail: null },
      meritCalculationEnabled: true,
      officialRankEnabled: false,
      vivaEnabled: false,
      circularVersion: 'nu-2025-26-v1',
      configVersion: 1,
      status: 'draft',
    });
    await setDoc(doc(db, 'nuCircularConfigs', 'nu-2025-26'), {
      academicSession: '2025-26',
      status: 'historical',
      sourceType: 'official_circular',
      sourceReference: 'memo 10(226)জাতী:বি:/রেজি:/অ্যাকা:/2026/3348',
      applicationStart: Timestamp.fromMillis(now() - 86400000 * 300),
      applicationEnd: Timestamp.fromMillis(now() - 86400000 * 200),
      examDate: null,
      eligibilityRulesVersion: 'v1',
      meritRulesVersion: 'v1',
    });
    await setDoc(doc(db, 'nuCircularConfigs', 'nu-draft'), {
      academicSession: '2026-27',
      status: 'draft',
      sourceType: 'official_circular',
      sourceReference: 'not yet verified',
      applicationStart: null,
      applicationEnd: null,
      examDate: null,
      eligibilityRulesVersion: 'v1',
      meritRulesVersion: 'v1',
    });
    await setDoc(doc(db, 'nuInstitutions', 'national-university'), {
      nameBn: 'জাতীয় বিশ্ববিদ্যালয়',
      nameEn: 'National University',
      slug: 'national-university',
      type: 'public-university',
      status: 'active',
      officialUrl: 'https://www.nu.ac.bd/admissions',
      priority: 1,
    });
    await setDoc(doc(db, 'nuGroups', 'humanities'), {
      institutionId: 'national-university',
      slug: 'humanities',
      nameBn: 'মানবিক শাখা',
      accentColor: '#7E22CE',
      examConfigId: 'nu-full-pub',
      eligibilitySummary: 'verified summary',
      circularVersion: 'nu-2025-26-v1',
      status: 'published',
    });
    // Questions: one draft by the verified teacher, one draft + one
    // published by the admin.
    const questionBase = {
      version: 1,
      sourceType: 'original_practice',
      provenance: 'test seed',
      groupIds: ['humanities'],
      subjectId: 'bangla',
      questionText: 'Test question?',
      questionLang: 'bn',
      options: ['ক', 'খ', 'গ', 'ঘ'],
      difficulty: 'easy',
      explanation: 'Because.',
      circularVersion: 'nu-2025-26-v1',
    };
    await setDoc(doc(db, 'nuQuestions', 'q-teacher-1'), {
      ...questionBase,
      status: 'draft',
      createdBy: 'teacher-verified',
    });
    await setDoc(doc(db, 'nuQuestions', 'q-admin-1'), {
      ...questionBase,
      status: 'draft',
      createdBy: 'admin-1',
    });
    await setDoc(doc(db, 'nuQuestions', 'q-pub-1'), {
      ...questionBase,
      status: 'published',
      createdBy: 'admin-1',
    });
    // Bundles + keys: topic (practice), mock, draft mock, mock-2/3 for
    // the receipt cases.
    for (const [id, kind, status] of [
      ['bundle-topic-1', 'topic', 'published'],
      ['bundle-mock-1', 'mock', 'published'],
      ['bundle-mock-2', 'mock', 'published'],
      ['bundle-mock-3', 'mock', 'published'],
      ['bundle-mock-draft', 'mock', 'draft'],
    ] as const) {
      await setDoc(doc(db, 'nuQuestionBundles', id), {
        bundleId: id,
        kind,
        groupId: 'humanities',
        questions: [{ questionId: 'q-teacher-1', version: 1, questionText: 'Test?', options: ['ক', 'খ', 'গ', 'ঘ'] }],
        questionCount: kind === 'mock' ? 100 : 1,
        configSnapshot: MOCK_SNAPSHOT,
        sourceQuestionIds: ['q-teacher-1'],
        status,
        publishedBy: 'admin-1',
      });
      await setDoc(doc(db, 'nuQuestionKeys', id), {
        bundleId: id,
        keys: [{ questionId: 'q-teacher-1', version: 1, correctOptionIndex: 0, explanation: 'Because.' }],
        questionVersion: 1,
      });
    }
    // Attempts for student-1: one submitted (mock-1), one in-progress
    // with a live deadline, one in-progress with a past deadline.
    const attemptBase = {
      userId: 'student-1',
      kind: 'mock',
      mockId: 'mock-1',
      groupId: 'humanities',
      questionIds: q100,
      questionVersions: q100.map(() => 1),
      configSnapshot: MOCK_SNAPSHOT,
      answers: [],
      resultClass: 'mock',
      calculationVersion: 'nu-merit-v1',
      idempotencyKey: 'idem-1',
    };
    await setDoc(doc(db, 'users', 'student-1', 'nuAttempts', 'attempt-submitted-1'), {
      ...attemptBase,
      bundleId: 'bundle-mock-1',
      startedAt: Timestamp.fromMillis(now() - 3600000),
      deadlineAt: Timestamp.fromMillis(now() - 1000),
      status: 'submitted',
      submittedAt: Timestamp.fromMillis(now() - 1800000),
      score: 72,
    });
    await setDoc(doc(db, 'users', 'student-1', 'nuAttempts', 'attempt-inprogress-1'), {
      ...attemptBase,
      bundleId: 'bundle-mock-1',
      startedAt: Timestamp.fromMillis(now() - 60000),
      deadlineAt: Timestamp.fromMillis(now() + 3600000),
      status: 'in_progress',
    });
    await setDoc(doc(db, 'users', 'student-1', 'nuAttempts', 'attempt-expired-1'), {
      ...attemptBase,
      bundleId: 'bundle-mock-1',
      startedAt: Timestamp.fromMillis(now() - 7200000),
      deadlineAt: Timestamp.fromMillis(now() - 3600000),
      status: 'in_progress',
    });
    await setDoc(doc(db, 'users', 'student-1', 'nuAttempts', 'attempt-submitted-3'), {
      ...attemptBase,
      bundleId: 'bundle-mock-3',
      startedAt: Timestamp.fromMillis(now() - 3600000),
      deadlineAt: Timestamp.fromMillis(now() - 1000),
      status: 'submitted',
      submittedAt: Timestamp.fromMillis(now() - 1800000),
      score: 65,
    });
    // Receipts: fresh (mock-1, valid), fake-attempt (mock-2), expired (mock-3).
    await setDoc(doc(db, 'nuReceipts', 'student-1_bundle-mock-1'), {
      userId: 'student-1',
      bundleId: 'bundle-mock-1',
      attemptId: 'attempt-submitted-1',
      createdAt: Timestamp.fromMillis(now()),
    });
    await setDoc(doc(db, 'nuReceipts', 'student-1_bundle-mock-2'), {
      userId: 'student-1',
      bundleId: 'bundle-mock-2',
      attemptId: 'attempt-nonexistent',
      createdAt: Timestamp.fromMillis(now()),
    });
    await setDoc(doc(db, 'nuReceipts', 'student-1_bundle-mock-3'), {
      userId: 'student-1',
      bundleId: 'bundle-mock-3',
      attemptId: 'attempt-submitted-3',
      createdAt: Timestamp.fromMillis(now() - 20 * 60000),
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

const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asTeacherVerified = () => env.authenticatedContext('teacher-verified').firestore();
const asTeacherUnverified = () => env.authenticatedContext('teacher-unverified').firestore();
const asSignedOut = () => env.unauthenticatedContext().firestore();

describe('NU-4 rules — users/{uid} NU profile fields', () => {
  it('(n1) student sets own admissionTargetInstitution to national-university: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        admissionTargetInstitution: 'national-university',
      }),
    );
  });
  it('(n2) student sets own admissionTargetGroup to science: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { admissionTargetGroup: 'science' }),
    );
  });
  it('(n3) student sets own admissionMode to advanced: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { admissionMode: 'advanced' }),
    );
  });
  it('(n4) student sets own admissionOnboarded true: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { admissionOnboarded: true }),
    );
  });
  it('(n5) student sets an out-of-enum group (engineering): DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { admissionTargetGroup: 'engineering' }),
    );
  });
  it('(n6) student sets an out-of-enum institution (dhaka-university): DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        admissionTargetInstitution: 'dhaka-university',
      }),
    );
  });
  it('(n7) student sets an invalid mode (expert): DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { admissionMode: 'expert' }),
    );
  });
  it('(n8) NU-T1: role escalation bundled with a valid NU field: DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        admissionTargetGroup: 'business',
        role: 'admin',
      }),
    );
  });
  it('(n9) NU-T2: verificationStatus escalation bundled with a valid NU field: DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), {
        admissionMode: 'beginner',
        verificationStatus: 'verified',
      }),
    );
  });
  it('(n10) student-2 writes student-1 NU fields: DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent2(), 'users', 'student-1'), { admissionTargetGroup: 'science' }),
    );
  });
  it('(n11) create with valid NU fields: ALLOWED', async () => {
    // A new uid creates its OWN doc (isOwner) — a doc under another
    // uid is correctly denied, so this uses a fresh context.
    const asStudent3 = () => env.authenticatedContext('student-3').firestore();
    await assertSucceeds(
      setDoc(doc(asStudent3(), 'users', 'student-3'), {
        displayName: 'new student',
        email: 'new@example.com',
        role: 'student',
        language: 'bn',
        admissionTargetInstitution: 'national-university',
        admissionTargetGroup: 'humanities',
        admissionMode: 'beginner',
        admissionOnboarded: false,
      }),
    );
  });
  it('(n12) create with an invalid NU group: DENIED', async () => {
    const asStudent4 = () => env.authenticatedContext('student-4').firestore();
    await assertFails(
      setDoc(doc(asStudent4(), 'users', 'student-4'), {
        displayName: 'bad student',
        email: 'bad@example.com',
        role: 'student',
        language: 'bn',
        admissionTargetGroup: 'engineering',
      }),
    );
  });
  it('(n13) student clears the group back to null: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { admissionTargetGroup: null }),
    );
  });
});

describe('NU-4 rules — nuExamConfigs (versioned, rules-validated)', () => {
  it('(n14) student reads a published exam config: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'nuExamConfigs', 'nu-full-pub')));
  });
  it('(n15) student reads a draft exam config: DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'nuExamConfigs', 'nu-full-draft')));
  });
  it('(n16) signed-out visitor reads a published exam config: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asSignedOut(), 'nuExamConfigs', 'nu-full-pub')));
  });
  it('(n17) student creates an exam config: DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'nuExamConfigs', 'nu-bad'), {
        examType: 'NU_ADMISSION',
        questionMode: 'MCQ',
        totalQuestions: 100,
        durationSeconds: 3600,
        marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: false },
        passMark: { value: 35, displayOnly: true },
        sections: { bangla: 20, english: 20, generalKnowledge: 20, groupSubjects: 40, groupSubjectsDetail: null },
        meritCalculationEnabled: true,
        officialRankEnabled: false,
        vivaEnabled: false,
        circularVersion: 'nu-2025-26-v1',
        configVersion: 1,
        status: 'draft',
      }),
    );
  });
  const validAdminConfig = {
    examType: 'NU_ADMISSION',
    questionMode: 'MCQ',
    totalQuestions: 100,
    durationSeconds: 3600,
    marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: false },
    passMark: { value: 35, displayOnly: true },
    sections: { bangla: 20, english: 20, generalKnowledge: 20, groupSubjects: 40, groupSubjectsDetail: null },
    meritCalculationEnabled: true,
    officialRankEnabled: false,
    vivaEnabled: false,
    circularVersion: 'nu-2025-26-v1',
    configVersion: 2,
    status: 'draft',
  };
  it('(n18) admin creates a valid NU_ADMISSION config: ALLOWED', async () => {
    await assertSucceeds(setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-admin-ok'), validAdminConfig));
  });
  it('(n19) admin creates a config with negative marking: DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-admin-neg'), {
        ...validAdminConfig,
        marking: { correct: 1, incorrect: -0.25, unanswered: 0, negativeMarking: true },
      }),
    );
  });
  it('(n20) admin creates an 80-question mock config: DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-admin-80'), {
        ...validAdminConfig,
        totalQuestions: 80,
      }),
    );
  });
  it('(n21) admin creates a config with viva enabled: DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-admin-viva'), {
        ...validAdminConfig,
        vivaEnabled: true,
      }),
    );
  });
  it('(n22) admin creates a config with a verified sub-split: DENIED (Blocker B)', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-admin-split'), {
        ...validAdminConfig,
        sections: { bangla: 20, english: 20, generalKnowledge: 20, groupSubjects: 40, groupSubjectsDetail: { physics: 17 } },
      }),
    );
  });
});

describe('NU-4 rules — circular configs, institutions, groups', () => {
  it('(n23) student reads the historical 2025-26 circular config: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'nuCircularConfigs', 'nu-2025-26')));
  });
  it('(n24) student reads a draft circular config: DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'nuCircularConfigs', 'nu-draft')));
  });
  it('(n25) student creates a circular config: DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'nuCircularConfigs', 'nu-fake'), {
        academicSession: '2026-27',
        status: 'published',
        sourceType: 'official_circular',
      }),
    );
  });
  it('(n26) student reads a published group: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'nuGroups', 'humanities')));
  });
  it('(n27) student reads the active institution: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'nuInstitutions', 'national-university')));
  });
  it('(n28) student writes a group: DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'nuGroups', 'engineering'), {
        institutionId: 'national-university',
        slug: 'engineering',
        examConfigId: 'nu-full-pub',
        circularVersion: 'nu-2025-26-v1',
        status: 'published',
      }),
    );
  });
});

describe('NU-4 rules — question bank, bundles, keys (NU-T3…T6, T16, T17)', () => {
  it('(n29) NU-T3: student reads nuQuestions: DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'nuQuestions', 'q-teacher-1')));
  });
  it('(n30) NU-T4: student reads a draft bundle: DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'nuQuestionBundles', 'bundle-mock-draft')));
  });
  it('(n31) student reads a published mock bundle: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'nuQuestionBundles', 'bundle-mock-1')));
  });
  it('(n32) NU-T6: student reads a practice bundle key without a receipt: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'nuQuestionKeys', 'bundle-topic-1')));
  });
  it('(n33) NU-T5: student reads a mock bundle key without a receipt: DENIED', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'nuQuestionKeys', 'bundle-mock-1')));
  });
  it('(n34) verified teacher creates a draft question: ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacherVerified(), 'nuQuestions', 'q-teacher-2'), {
        status: 'draft',
        version: 1,
        sourceType: 'original_practice',
        provenance: 'test',
        groupIds: ['science'],
        subjectId: 'physics',
        questionText: 'New?',
        questionLang: 'bn',
        options: ['ক', 'খ', 'গ', 'ঘ'],
        difficulty: 'medium',
        explanation: 'Because.',
        circularVersion: 'nu-2025-26-v1',
        createdBy: 'teacher-verified',
      }),
    );
  });
  it('(n35) unverified teacher creates a question: DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherUnverified(), 'nuQuestions', 'q-teacher-3'), {
        status: 'draft',
        version: 1,
        sourceType: 'original_practice',
        provenance: 'test',
        groupIds: ['science'],
        subjectId: 'physics',
        questionText: 'New?',
        questionLang: 'bn',
        options: ['ক', 'খ', 'গ', 'ঘ'],
        difficulty: 'medium',
        explanation: 'Because.',
        circularVersion: 'nu-2025-26-v1',
        createdBy: 'teacher-unverified',
      }),
    );
  });
  it('(n36) NU-T16: student creates a question: DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'nuQuestions', 'q-student-1'), {
        status: 'draft',
        version: 1,
        sourceType: 'original_practice',
        provenance: 'test',
        groupIds: ['science'],
        subjectId: 'physics',
        questionText: 'New?',
        questionLang: 'bn',
        options: ['ক', 'খ', 'গ', 'ঘ'],
        difficulty: 'medium',
        explanation: 'Because.',
        circularVersion: 'nu-2025-26-v1',
        createdBy: 'student-1',
      }),
    );
  });
  it('(n37) question create with a correct-answer field in the bank doc: DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuQuestions', 'q-admin-key'), {
        status: 'draft',
        version: 1,
        sourceType: 'original_practice',
        provenance: 'test',
        groupIds: ['science'],
        subjectId: 'physics',
        questionText: 'New?',
        questionLang: 'bn',
        options: ['ক', 'খ', 'গ', 'ঘ'],
        correctOptionIndex: 0,
        difficulty: 'medium',
        explanation: 'Because.',
        circularVersion: 'nu-2025-26-v1',
        createdBy: 'admin-1',
      }),
    );
  });
  it('(n38) verified teacher edits own draft question: ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asTeacherVerified(), 'nuQuestions', 'q-teacher-1'), {
        difficulty: 'hard',
      }),
    );
  });
  it('(n39) published question cannot be edited in place: DENIED', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'nuQuestions', 'q-pub-1'), { difficulty: 'hard' }),
    );
  });
  it('(n40) NU-T17: student publishes a question: DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'nuQuestions', 'q-teacher-1'), { status: 'published' }),
    );
  });
});

describe('NU-4 rules — receipts and keys (NU-T7, T8)', () => {
  it('(n41) mock key read with a fresh valid receipt: ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'nuQuestionKeys', 'bundle-mock-1')));
  });
  it('(n42) NU-T7: mock key read with a receipt for a nonexistent attempt: DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'nuQuestionKeys', 'bundle-mock-2')));
  });
  it('(n43) mock key read with an expired receipt: DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'nuQuestionKeys', 'bundle-mock-3')));
  });
  it('(n44) NU-T8: submitted receipt cannot be changed: DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'nuReceipts', 'student-1_bundle-mock-1'), {
        attemptId: 'attempt-inprogress-1',
      }),
    );
  });
  it('(n45) student creates a receipt for their own new attempt id: ALLOWED (create is field-checked; key read still enforces the 7 conditions)', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'nuReceipts', 'student-1_bundle-mock-draft'), {
        userId: 'student-1',
        bundleId: 'bundle-mock-draft',
        attemptId: 'attempt-inprogress-1',
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('(n46) student creates a receipt under another student id: DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'nuReceipts', 'student-2_bundle-mock-1'), {
        userId: 'student-2',
        bundleId: 'bundle-mock-1',
        attemptId: 'attempt-submitted-1',
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe('NU-4 rules — attempts (NU-T9, T11…T14)', () => {
  it('(n47) student creates a valid 100-question mock attempt: ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'nuAttempts', 'attempt-new-1'), {
        userId: 'student-1',
        kind: 'mock',
        mockId: 'mock-1',
        bundleId: 'bundle-mock-1',
        groupId: 'humanities',
        questionIds: q100,
        questionVersions: q100.map(() => 1),
        configSnapshot: MOCK_SNAPSHOT,
        startedAt: serverTimestamp(),
        deadlineAt: Timestamp.fromMillis(now() + 3600000),
        answers: [],
        status: 'not_started',
        resultClass: 'mock',
        calculationVersion: 'nu-merit-v1',
        idempotencyKey: 'idem-new-1',
      }),
    );
  });
  it('(n48) NU-T13: student creates an 80-question mock attempt: DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'nuAttempts', 'attempt-new-80'), {
        userId: 'student-1',
        kind: 'mock',
        mockId: 'mock-1',
        bundleId: 'bundle-mock-1',
        groupId: 'humanities',
        questionIds: q80,
        questionVersions: q80.map(() => 1),
        configSnapshot: MOCK_SNAPSHOT,
        startedAt: serverTimestamp(),
        deadlineAt: Timestamp.fromMillis(now() + 3600000),
        answers: [],
        status: 'not_started',
        resultClass: 'mock',
        calculationVersion: 'nu-merit-v1',
        idempotencyKey: 'idem-new-80',
      }),
    );
  });
  it('(n49) NU-T14: student creates an attempt with a past client timestamp: DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'nuAttempts', 'attempt-new-past'), {
        userId: 'student-1',
        kind: 'mock',
        mockId: 'mock-1',
        bundleId: 'bundle-mock-1',
        groupId: 'humanities',
        questionIds: q100,
        questionVersions: q100.map(() => 1),
        configSnapshot: MOCK_SNAPSHOT,
        startedAt: Timestamp.fromMillis(now() - 600000),
        deadlineAt: Timestamp.fromMillis(now() + 3600000),
        answers: [],
        status: 'not_started',
        resultClass: 'mock',
        calculationVersion: 'nu-merit-v1',
        idempotencyKey: 'idem-new-past',
      }),
    );
  });
  it('(n50) NU-T9: student-2 reads student-1 attempt: DENIED', async () => {
    await assertFails(
      getDoc(doc(asStudent2(), 'users', 'student-1', 'nuAttempts', 'attempt-submitted-1')),
    );
  });
  it('(n51) student updates own in-progress attempt before the deadline: ALLOWED', async () => {
    // serverTimestamp() is not supported inside arrays — use an
    // explicit timestamp for the answer's answeredAt.
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'nuAttempts', 'attempt-inprogress-1'), {
        answers: [{ questionId: 'q1', selectedOptionIndex: 0, answeredAt: Timestamp.fromMillis(now()), markedForReview: false }],
      }),
    );
  });
  it('(n52) NU-T11: student changes a submitted attempt: DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'nuAttempts', 'attempt-submitted-1'), {
        score: 100,
      }),
    );
  });
  it('(n53) NU-T12: student writes after the deadline: DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'nuAttempts', 'attempt-expired-1'), {
        answers: [{ questionId: 'q1', selectedOptionIndex: 0, answeredAt: Timestamp.fromMillis(now()), markedForReview: false }],
      }),
    );
  });
  it('(n54) student deletes an attempt (history cannot be erased): DENIED', async () => {
    await assertFails(
      deleteDoc(doc(asStudent1(), 'users', 'student-1', 'nuAttempts', 'attempt-submitted-1')),
    );
  });
  it('(n55) student changes the question set mid-attempt: DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'nuAttempts', 'attempt-inprogress-1'), {
        questionIds: q80,
      }),
    );
  });
});

describe('NU-4 rules — reviews and publications', () => {
  it('(n56) NU-T18: verified teacher reviews their OWN question: DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherVerified(), 'nuReviews', 'review-self'), {
        questionId: 'q-teacher-1',
        questionVersion: 1,
        reviewerId: 'teacher-verified',
        decision: 'approved',
        checks: { questionOk: true, answerOk: true, explanationOk: true, sourceOk: true },
        reviewedAt: serverTimestamp(),
      }),
    );
  });
  it('(n57) verified teacher reviews another teacher/admin question: ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacherVerified(), 'nuReviews', 'review-other'), {
        questionId: 'q-admin-1',
        questionVersion: 1,
        reviewerId: 'teacher-verified',
        decision: 'approved',
        checks: { questionOk: true, answerOk: true, explanationOk: true, sourceOk: true },
        reviewedAt: serverTimestamp(),
      }),
    );
  });
  it('(n58) rejection without a reason (under 10 chars): DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherVerified(), 'nuReviews', 'review-noreason'), {
        questionId: 'q-admin-1',
        questionVersion: 1,
        reviewerId: 'teacher-verified',
        decision: 'rejected',
        reason: 'bad',
        checks: { questionOk: false, answerOk: false, explanationOk: false, sourceOk: false },
        reviewedAt: serverTimestamp(),
      }),
    );
  });
  it('(n59) student creates a review: DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'nuReviews', 'review-student'), {
        questionId: 'q-admin-1',
        questionVersion: 1,
        reviewerId: 'student-1',
        decision: 'approved',
        checks: { questionOk: true, answerOk: true, explanationOk: true, sourceOk: true },
        reviewedAt: serverTimestamp(),
      }),
    );
  });
  it('(n60) a review can never be changed: DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacherVerified(), 'nuReviews', 'review-other'), { decision: 'rejected' }),
    );
  });
});
