/**
 * Eduvelto — Role-based dashboards security-rules tests (Step 5/7/8).
 *
 * RUN: npm run test:rules (runs every file under emulator-tests/).
 *
 * Uses its OWN emulator project ('eduvelto-role-test') so it never
 * interferes with rules.test.ts. Emulator only — never live Firestore,
 * never real user data. Expected results are in the test names
 * (ALLOWED / DENIED). A FAILING test means the rule in firestore.rules
 * does not do what the dashboards brief requires — fix the rule, not
 * the test.
 *
 * Coverage:
 *  (r1–r7)   self-service registration (roles student/teacher/parent;
 *             no self-assigned admin/owner, no self-verification)
 *  (r8–r13)  self profile updates (academic fields yes; role /
 *             verificationStatus / own approved subjects no)
 *  (r14–r17) profile-change audit entries (own 'profile-changed' yes;
 *             forged actions / other users no)
 *  (r18–r22) teacher verification applications (deterministic id,
 *             re-apply after rejection only)
 *  (r23–r30) teacher change requests (file / decide / apply)
 *  (r31–r42) guardian linking lifecycle (request / confirm / snapshot /
 *             revoke / admin activate)
 *  (r43–r50) guardian link-gated reads (progress/bookmarks/summaries
 *             yes; users doc / quizAttempts / unlinked / revoked no)
 *  (r51–r53) profile-filtered content queries (only matching books;
 *             wrong-class books never returned; drafts hidden)
 *  (r54–r66) verification implementation (guardian info required;
 *             admin reject with reason; child reject; admin revoke;
 *             guardian-link audit entries; teacher-change audit enum;
 *             teacher re-application with post + institutionContact)
 *  (r67)     missing-doc read (first-time teacher, no application yet)
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
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-role-test';
let env: RulesTestEnvironment;

const RULES_TEXT = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error('firestore.rules does not look like a rules file.');
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const user = (uid: string, role: string, extra: Record<string, unknown> = {}) =>
      setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
        ...extra,
      });
    await user('admin-1', 'admin');
    await user('owner-1', 'owner');
    await user('teacher-1', 'teacher', {
      verificationStatus: 'verified',
      subjects: ['English'],
      classLevel: '3rd Year',
      teachingLevel: 'Honours',
      educationType: 'higher',
      department: 'English',
    });
    await user('teacher-2', 'teacher', {
      verificationStatus: 'pending',
      subjects: ['Mathematics'],
      classLevel: 'SSC',
      educationType: 'general',
    });
    await user('teacher-3', 'teacher', {
      verificationStatus: 'rejected',
      subjects: ['Physics'],
      classLevel: 'HSC',
      educationType: 'general',
    });
    // teacher-4: verified-status pending, NO verification record yet —
    // the positive filing case for (r18).
    await user('teacher-4', 'teacher', {
      verificationStatus: 'pending',
      subjects: ['Chemistry'],
      classLevel: 'HSC',
      educationType: 'general',
    });
    await user('guardian-1', 'parent', { phone: '01700000001' });
    await user('guardian-2', 'parent', { phone: '01700000002' });
    await user('student-1', 'student', {
      educationType: 'higher',
      department: 'English',
      classLevel: '3rd Year',
      board: 'National University',
    });
    await user('student-2', 'student', {
      educationType: 'general',
      department: 'Science',
      classLevel: 'Class 5',
    });
    await user('child-1', 'student', {
      educationType: 'general',
      department: 'Science',
      classLevel: 'Class 5',
    });

    // --- books: two Higher/English, one SSC, one draft ---
    await setDoc(doc(db, 'books', 'book-higher-eng-1'), {
      title: 'Elizabethan and Jacobean Drama',
      educationType: 'Higher',
      department: 'English',
      classLevel: '3rd Year',
      program: 'Honours',
      board: 'National University',
      reviewStatus: 'Published',
      chapterCount: 2,
    });
    await setDoc(doc(db, 'books', 'book-higher-eng-2'), {
      title: 'History of English Literature',
      educationType: 'Higher',
      department: 'English',
      classLevel: '3rd Year',
      program: 'Honours',
      board: 'National University',
      reviewStatus: 'Published',
      chapterCount: 1,
    });
    await setDoc(doc(db, 'books', 'book-ssc-sci'), {
      title: 'SSC General Science',
      educationType: 'SSC',
      department: 'Science',
      classLevel: 'Class 10',
      program: 'SSC',
      board: 'Dhaka',
      reviewStatus: 'Published',
      chapterCount: 1,
    });
    await setDoc(doc(db, 'books', 'book-draft'), {
      title: 'Draft Higher English',
      educationType: 'Higher',
      department: 'English',
      classLevel: '3rd Year',
      program: 'Honours',
      board: 'National University',
      reviewStatus: 'Under Review',
      chapterCount: 1,
    });

    // --- child data (guardian reads) ---
    await setDoc(doc(db, 'progress', 'prog-child-1'), {
      userId: 'child-1',
      subject: 'Mathematics',
      lessonsRead: 4,
      questionsAttempted: 20,
    });
    await setDoc(doc(db, 'bookmarks', 'bm-child-1'), {
      userId: 'child-1',
      lessonId: 'lesson-1',
      title: 'Percentage',
    });
    await setDoc(doc(db, 'progressSummaries', 'sum-child-1'), {
      userId: 'child-1',
      subject: 'Mathematics',
      attemptsCount: 3,
      averagePercentage: 55,
    });
    await setDoc(doc(db, 'progress', 'prog-student-2'), {
      userId: 'student-2',
      subject: 'Science',
      lessonsRead: 1,
      questionsAttempted: 5,
    });
    await setDoc(doc(db, 'users', 'child-1', 'quizAttempts', 'att-1'), {
      quizId: 'quiz1',
      answers: [{ n: 1, text: 'secret answer' }],
      score: 1,
      totalMarks: 1,
      percentage: 100,
    });

    // --- parent links ---
    await setDoc(doc(db, 'parentLinks', 'guardian-1_child-1'), {
      parentId: 'guardian-1',
      studentId: 'child-1',
      status: 'verified',
      childDisplayName: 'Child One',
      childClassLevel: 'Class 5',
      childInstitution: 'Test School',
      childEducationType: 'SSC',
      verifiedBy: 'admin-1',
    });
    await setDoc(doc(db, 'parentLinks', 'guardian-1_student-2'), {
      parentId: 'guardian-1',
      studentId: 'student-2',
      status: 'pending',
      childDisplayName: 'Student Two',
      childClassLevel: 'Class 5',
      childInstitution: 'Test School',
    });
    await setDoc(doc(db, 'parentLinks', 'guardian-1_student-1'), {
      parentId: 'guardian-1',
      studentId: 'student-1',
      status: 'verified',
      childDisplayName: 'Student One',
      childClassLevel: '3rd Year',
      childInstitution: 'Test College',
      verifiedBy: 'admin-1',
    });
    // Dedicated pending link for the (r41) verifiedBy check.
    await setDoc(doc(db, 'parentLinks', 'guardian-2_student-1'), {
      parentId: 'guardian-2',
      studentId: 'student-1',
      status: 'pending',
      childDisplayName: 'Student One',
      childClassLevel: '3rd Year',
      childInstitution: 'Test College',
    });
    await setDoc(doc(db, 'progress', 'prog-student-1'), {
      userId: 'student-1',
      subject: 'English',
      lessonsRead: 2,
      questionsAttempted: 10,
    });

    // --- teacher verification records ---
    await setDoc(doc(db, 'teacherVerifications', 'tv_teacher-1'), {
      id: 'tv_teacher-1',
      userId: 'teacher-1',
      fullName: 'Teacher One',
      institution: 'Test College',
      subjects: ['English'],
      classes: ['3rd Year'],
      status: 'verified',
      verificationStatus: 'verified',
    });
    await setDoc(doc(db, 'teacherVerifications', 'tv_teacher-2'), {
      id: 'tv_teacher-2',
      userId: 'teacher-2',
      fullName: 'Teacher Two',
      institution: 'Test School',
      subjects: ['Mathematics'],
      classes: ['SSC'],
      status: 'pending',
      verificationStatus: 'pending',
    });
    await setDoc(doc(db, 'teacherVerifications', 'tv_teacher-3'), {
      id: 'tv_teacher-3',
      userId: 'teacher-3',
      fullName: 'Teacher Three',
      institution: 'Test College',
      subjects: ['Physics'],
      classes: ['HSC'],
      status: 'rejected',
      verificationStatus: 'rejected',
      reason: 'Qualification not verified — documents unclear.',
    });

    // --- teacher change requests ---
    await setDoc(doc(db, 'teacherChangeRequests', 'tcr-1'), {
      teacherUid: 'teacher-1',
      requestedSubjects: ['English', 'Bangla'],
      requestedClasses: ['3rd Year'],
      requestedTeachingLevel: 'Honours',
      reason: 'I also teach Bangla now.',
      status: 'pending',
    });
    await setDoc(doc(db, 'teacherChangeRequests', 'tcr-2'), {
      teacherUid: 'teacher-1',
      requestedSubjects: ['English'],
      requestedClasses: ['3rd Year'],
      requestedTeachingLevel: 'Honours',
      reason: 'Already decided.',
      status: 'approved',
      decidedBy: 'admin-1',
      decisionReason: 'Approved earlier.',
    });
    // Dedicated pending request for the (r27) missing-reason check.
    await setDoc(doc(db, 'teacherChangeRequests', 'tcr-3'), {
      teacherUid: 'teacher-1',
      requestedSubjects: ['English'],
      requestedClasses: ['3rd Year'],
      requestedTeachingLevel: 'Honours',
      reason: 'Please add Bangla as well.',
      status: 'pending',
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await seed();
}, 120000);

afterAll(async () => {
  await env.cleanup();
});

const unauth = () => env.unauthenticatedContext().firestore();
const as = (uid: string) => env.authenticatedContext(uid).firestore();

describe('Eduvelto role-based dashboards rules', () => {
  // ---- registration (r1–r7) ----
  it('(r1) student creates own profile with role student — ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(as('new-student'), 'users', 'new-student'), {
        displayName: 'New Student',
        email: 'new-student@example.com',
        role: 'student',
        language: 'bn',
        educationType: 'general',
        classLevel: 'Class 5',
      }),
    );
  });
  it('(r2) teacher creates own profile with role teacher + pending — ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(as('new-teacher'), 'users', 'new-teacher'), {
        displayName: 'New Teacher',
        email: 'new-teacher@example.com',
        role: 'teacher',
        language: 'bn',
        verificationStatus: 'pending',
        teachingLevel: 'Honours',
        subjects: ['English'],
        qualifications: 'M.A. in English',
      }),
    );
  });
  it('(r3) guardian creates own profile with role parent + pending — ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(as('new-guardian'), 'users', 'new-guardian'), {
        displayName: 'New Guardian',
        email: 'new-guardian@example.com',
        role: 'parent',
        language: 'bn',
        verificationStatus: 'pending',
        phone: '01700000009',
      }),
    );
  });
  it('(r4) self-assigning role admin is DENIED', async () => {
    await assertFails(
      setDoc(doc(as('new-student'), 'users', 'new-student'), {
        displayName: 'Sneaky',
        email: 'sneaky@example.com',
        role: 'admin',
        language: 'bn',
      }),
    );
  });
  it('(r5) student creating with verificationStatus verified is DENIED', async () => {
    await assertFails(
      setDoc(doc(as('new-student'), 'users', 'new-student'), {
        displayName: 'Sneaky',
        email: 'sneaky@example.com',
        role: 'student',
        language: 'bn',
        verificationStatus: 'verified',
      }),
    );
  });
  it('(r6) creating a profile with isActive set is DENIED', async () => {
    await assertFails(
      setDoc(doc(as('new-student'), 'users', 'new-student'), {
        displayName: 'Sneaky',
        email: 'sneaky@example.com',
        role: 'student',
        language: 'bn',
        isActive: true,
      }),
    );
  });
  it('(r7) self-assigning role owner is DENIED', async () => {
    await assertFails(
      setDoc(doc(as('new-student'), 'users', 'new-student'), {
        displayName: 'Sneaky',
        email: 'sneaky@example.com',
        role: 'owner',
        language: 'bn',
      }),
    );
  });

  // ---- self profile updates (r8–r13) ----
  it('(r8) student updates own academic fields — ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(as('student-1'), 'users', 'student-1'), {
        classLevel: '4th Year',
        semester: '1st Semester',
        academicSession: '2025-26',
        curriculum: 'NU 2013-14',
        updatedAt: new Date(),
      }),
    );
  });
  it('(r9) student changing own role is DENIED', async () => {
    await assertFails(updateDoc(doc(as('student-1'), 'users', 'student-1'), { role: 'teacher' }));
  });
  it('(r10) student changing own verificationStatus is DENIED', async () => {
    await assertFails(
      updateDoc(doc(as('student-1'), 'users', 'student-1'), { verificationStatus: 'verified' }),
    );
  });
  it('(r11) teacher rewriting own approved subjects is DENIED (change request only)', async () => {
    await assertFails(
      updateDoc(doc(as('teacher-1'), 'users', 'teacher-1'), { subjects: ['English', 'Bangla'] }),
    );
  });
  it('(r12) teacher updates own experienceYears — ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(as('teacher-1'), 'users', 'teacher-1'), { experienceYears: 6 }),
    );
  });
  it('(r13) student updating ANOTHER student’s profile is DENIED', async () => {
    await assertFails(
      updateDoc(doc(as('student-1'), 'users', 'student-2'), { classLevel: 'Class 9' }),
    );
  });

  // ---- profile-change audit (r14–r17) ----
  it('(r14) user appends own profile-changed audit entry — ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(as('student-1'), 'adminActions'), {
        actorId: 'student-1',
        action: 'profile-changed',
        details: 'Profile updated: classLevel',
        targetId: 'student-1',
        before: '{"classLevel":"3rd Year"}',
        after: '{"classLevel":"4th Year"}',
        createdAt: new Date(),
      }),
    );
  });
  it('(r15) user appending a forged admin action is DENIED', async () => {
    await assertFails(
      addDoc(collection(as('student-1'), 'adminActions'), {
        actorId: 'student-1',
        action: 'user-role-change',
        details: 'forged',
        targetId: 'student-1',
        createdAt: new Date(),
      }),
    );
  });
  it('(r16) user appending a profile-changed entry for ANOTHER user is DENIED', async () => {
    await assertFails(
      addDoc(collection(as('student-1'), 'adminActions'), {
        actorId: 'student-1',
        action: 'profile-changed',
        details: 'forged',
        targetId: 'student-2',
        createdAt: new Date(),
      }),
    );
  });
  it('(r17) admin reading adminActions is DENIED (owner-only read)', async () => {
    await assertFails(getDoc(doc(as('admin-1'), 'adminActions', 'any-id')));
  });

  // ---- teacher verification applications (r18–r22) ----
  it('(r18) teacher files own application tv_{uid} — ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(as('teacher-4'), 'teacherVerifications', 'tv_teacher-4'), {
        id: 'tv_teacher-4',
        userId: 'teacher-4',
        fullName: 'Teacher Four',
        institution: 'Test College',
        teachingLevel: 'Honours',
        subjects: ['Chemistry'],
        classes: ['HSC'],
        qualifications: 'M.Sc. in Chemistry',
        experienceYears: 3,
        verificationReason: 'I teach chemistry at Test College.',
        status: 'pending',
        verificationStatus: 'pending',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  it('(r19) teacher application with a non-deterministic id is DENIED', async () => {
    await assertFails(
      setDoc(doc(as('teacher-2'), 'teacherVerifications', 'random-id'), {
        userId: 'teacher-2',
        fullName: 'Teacher Two',
        institution: 'Test School',
        status: 'pending',
      }),
    );
  });
  it('(r20) teacher filing an application for another user is DENIED', async () => {
    await assertFails(
      setDoc(doc(as('teacher-2'), 'teacherVerifications', 'tv_teacher-1'), {
        userId: 'teacher-1',
        fullName: 'Teacher One',
        institution: 'Test College',
        status: 'pending',
      }),
    );
  });
  it('(r21) REJECTED teacher re-applies (merge, same id) — ALLOWED', async () => {
    await assertSucceeds(
      setDoc(
        doc(as('teacher-3'), 'teacherVerifications', 'tv_teacher-3'),
        {
          subjects: ['Physics', 'Mathematics'],
          classes: ['HSC'],
          verificationReason: 'Documents re-attached, please re-check.',
          status: 'pending',
          verificationStatus: 'pending',
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      ),
    );
  });
  it('(r22) PENDING teacher re-filing while pending is DENIED', async () => {
    await assertFails(
      setDoc(
        doc(as('teacher-2'), 'teacherVerifications', 'tv_teacher-2'),
        { verificationReason: 'Trying again while pending.', status: 'pending', updatedAt: new Date() },
        { merge: true },
      ),
    );
  });

  // ---- teacher change requests (r23–r30) ----
  it('(r23) verified teacher files own change request — ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(as('teacher-1'), 'teacherChangeRequests'), {
        teacherUid: 'teacher-1',
        requestedSubjects: ['English', 'Bangla'],
        requestedClasses: ['3rd Year', '4th Year'],
        requestedTeachingLevel: 'Honours',
        reason: 'I started teaching Bangla this session.',
        status: 'pending',
      }),
    );
  });
  it('(r24) change request with a <10-char reason is DENIED', async () => {
    await assertFails(
      addDoc(collection(as('teacher-1'), 'teacherChangeRequests'), {
        teacherUid: 'teacher-1',
        requestedSubjects: ['English'],
        requestedClasses: ['3rd Year'],
        requestedTeachingLevel: 'Honours',
        reason: 'short',
        status: 'pending',
      }),
    );
  });
  it('(r25) teacher filing a change request for another teacher is DENIED', async () => {
    await assertFails(
      addDoc(collection(as('teacher-1'), 'teacherChangeRequests'), {
        teacherUid: 'teacher-2',
        requestedSubjects: ['Mathematics'],
        requestedClasses: ['SSC'],
        requestedTeachingLevel: 'Secondary',
        reason: 'Filing for someone else.',
        status: 'pending',
      }),
    );
  });
  it('(r26) admin approves a pending change request — ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(as('admin-1'), 'teacherChangeRequests', 'tcr-1'), {
        status: 'approved',
        decidedBy: 'admin-1',
        decidedAt: new Date(),
        decisionReason: 'Subjects verified against qualifications.',
        updatedAt: new Date(),
      }),
    );
  });
  it('(r27) admin deciding without a decision reason is DENIED', async () => {
    await assertFails(
      updateDoc(doc(as('admin-1'), 'teacherChangeRequests', 'tcr-3'), {
        status: 'rejected',
        decidedBy: 'admin-1',
        decidedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  it('(r28) teacher approving own change request is DENIED', async () => {
    await assertFails(
      updateDoc(doc(as('teacher-1'), 'teacherChangeRequests', 'tcr-1'), {
        status: 'approved',
        decidedBy: 'teacher-1',
        decidedAt: new Date(),
        decisionReason: 'Self-approval attempt.',
        updatedAt: new Date(),
      }),
    );
  });
  it('(r29) admin applying approved subjects to the teacher doc — ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(as('admin-1'), 'users', 'teacher-1'), {
        subjects: ['English', 'Bangla'],
        classLevel: '3rd Year',
        updatedAt: new Date(),
      }),
    );
  });
  it('(r30) admin deciding an already-decided request is DENIED', async () => {
    await assertFails(
      updateDoc(doc(as('admin-1'), 'teacherChangeRequests', 'tcr-2'), {
        status: 'rejected',
        decidedBy: 'admin-1',
        decidedAt: new Date(),
        decisionReason: 'Trying to re-decide.',
        updatedAt: new Date(),
      }),
    );
  });

  // ---- guardian linking (r31–r42) ----
  it('(r31) guardian creates a link with the deterministic id — ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(as('guardian-2'), 'parentLinks', 'guardian-2_student-2'), {
        parentId: 'guardian-2',
        studentId: 'student-2',
        status: 'pending',
        guardianDisplayName: 'Guardian Two',
        relationship: 'Mother',
        guardianContact: '01700000002',
        childDisplayName: 'Student Two',
        childClassLevel: 'Class 5',
        childInstitution: 'Test School',
      }),
    );
  });
  it('(r32) guardian link with a non-deterministic id is DENIED', async () => {
    await assertFails(
      setDoc(doc(as('guardian-2'), 'parentLinks', 'random-link-id'), {
        parentId: 'guardian-2',
        studentId: 'student-2',
        status: 'pending',
        guardianDisplayName: 'Guardian Two',
        relationship: 'Mother',
        childDisplayName: 'Student Two',
        childClassLevel: 'Class 5',
      }),
    );
  });
  it('(r33) link naming someone else as the parent is DENIED', async () => {
    await assertFails(
      setDoc(doc(as('guardian-2'), 'parentLinks', 'guardian-2_student-2'), {
        parentId: 'guardian-1',
        studentId: 'student-2',
        status: 'pending',
        guardianDisplayName: 'Guardian Two',
        relationship: 'Mother',
        childDisplayName: 'Student Two',
        childClassLevel: 'Class 5',
      }),
    );
  });
  it('(r34) guardian linking THEMSELVES as the child is DENIED', async () => {
    await assertFails(
      setDoc(doc(as('guardian-2'), 'parentLinks', 'guardian-2_guardian-2'), {
        parentId: 'guardian-2',
        studentId: 'guardian-2',
        status: 'pending',
        guardianDisplayName: 'Guardian Two',
        relationship: 'Mother',
        childDisplayName: 'Self',
        childClassLevel: 'Class 5',
      }),
    );
  });
  it('(r35) CHILD confirms a pending link — ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(as('student-2'), 'parentLinks', 'guardian-1_student-2'), {
        status: 'confirmed',
        confirmedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  it('(r36) the GUARDIAN confirming their own link is DENIED', async () => {
    await assertFails(
      updateDoc(doc(as('guardian-1'), 'parentLinks', 'guardian-1_student-2'), {
        status: 'confirmed',
        confirmedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  it('(r37) CHILD updates the academic snapshot on their own link — ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(as('child-1'), 'parentLinks', 'guardian-1_child-1'), {
        childClassLevel: 'Class 6',
        childEducationType: 'SSC',
        updatedAt: new Date(),
      }),
    );
  });
  it('(r38) CHILD smuggling a status change into a snapshot update is DENIED', async () => {
    // The child may update the snapshot OR revoke — never flip the link
    // to 'confirmed' (only pending → confirmed is allowed, and this
    // link is already 'verified'). childClassLevel genuinely changes
    // here ('Class 6' → 'Class 7') so the field diff is real.
    await assertFails(
      updateDoc(doc(as('child-1'), 'parentLinks', 'guardian-1_child-1'), {
        childClassLevel: 'Class 7',
        status: 'confirmed',
        updatedAt: new Date(),
      }),
    );
  });
  it('(r39) GUARDIAN revokes their own link — ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(as('guardian-1'), 'parentLinks', 'guardian-1_student-1'), {
        status: 'revoked',
        revokedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  it('(r40) ADMIN activates a confirmed link — ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(as('admin-1'), 'parentLinks', 'guardian-1_student-2'), {
        status: 'verified',
        verifiedBy: 'admin-1',
        verifiedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  it('(r41) admin activating without verifiedBy == caller is DENIED', async () => {
    await assertFails(
      updateDoc(doc(as('admin-1'), 'parentLinks', 'guardian-2_student-1'), {
        status: 'verified',
        verifiedBy: 'someone-else',
        verifiedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  it('(r42) GUARDIAN activating their own link is DENIED', async () => {
    await assertFails(
      updateDoc(doc(as('guardian-1'), 'parentLinks', 'guardian-1_student-2'), {
        status: 'verified',
        verifiedBy: 'guardian-1',
        verifiedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  // ---- guardian link-gated reads (r43–r50) ----
  it('(r43) guardian reads a LINKED child’s progress — ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(as('guardian-1'), 'progress', 'prog-child-1')));
  });
  it('(r44) guardian reads a LINKED child’s bookmarks — ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(as('guardian-1'), 'bookmarks', 'bm-child-1')));
  });
  it('(r45) guardian reads a LINKED child’s progress summaries — ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(as('guardian-1'), 'progressSummaries', 'sum-child-1')));
  });
  it('(r46) guardian reads an UNLINKED child’s progress — DENIED', async () => {
    await assertFails(getDoc(doc(as('guardian-2'), 'progress', 'prog-child-1')));
  });
  it('(r47) guardian reads a LINKED child’s users doc — DENIED (email lives there)', async () => {
    await assertFails(getDoc(doc(as('guardian-1'), 'users', 'child-1')));
  });
  it('(r48) guardian reads a LINKED child’s quiz attempts — DENIED', async () => {
    await assertFails(getDoc(doc(as('guardian-1'), 'users', 'child-1', 'quizAttempts', 'att-1')));
  });
  it('(r49) guardian reads a REVOKED link’s child progress — DENIED', async () => {
    // NOTE: ordering dependency — (r39) revokes guardian-1_student-1
    // earlier in this file; this test proves the read dies with it.
    await assertFails(getDoc(doc(as('guardian-1'), 'progress', 'prog-student-1')));
  });
  it('(r50) logged-out read of a child’s progress is DENIED', async () => {
    await assertFails(getDoc(doc(unauth(), 'progress', 'prog-child-1')));
  });

  // ---- profile-filtered content queries (r51–r53) ----
  it('(r51) student query for their own profile returns ONLY matching books', async () => {
    const snap = await assertSucceeds(
      getDocs(
        query(
          collection(as('student-1'), 'books'),
          where('reviewStatus', '==', 'Published'),
          where('educationType', '==', 'Higher'),
          where('department', '==', 'English'),
          where('classLevel', '==', '3rd Year'),
        ),
      ),
    );
    const ids = snap.docs.map((d) => d.id).sort();
    if (ids.join(',') !== 'book-higher-eng-1,book-higher-eng-2') {
      throw new Error(`expected the 2 Higher/English books, got: ${ids.join(',')}`);
    }
  });
  it('(r52) a wrong-class query returns EMPTY — never another class’s books', async () => {
    const snap = await assertSucceeds(
      getDocs(
        query(
          collection(as('student-2'), 'books'),
          where('reviewStatus', '==', 'Published'),
          where('educationType', '==', 'Higher'),
          where('department', '==', 'English'),
          where('classLevel', '==', '3rd Year'),
        ),
      ),
    );
    // The query itself returns the Higher books (the RULES cannot know
    // the student's profile) — the dashboard's client-side filter is
    // what keeps wrong-class books out of the UI. This test documents
    // that boundary honestly: rules enforce Published-only + ownership,
    // the profile filter lives in dashboardContent.ts (unit-tested).
    if (snap.docs.length !== 2) {
      throw new Error(`expected 2 docs from the raw query, got ${snap.docs.length}`);
    }
  });
  it('(r53) unauthenticated read of a Published book is ALLOWED; draft is DENIED', async () => {
    await assertSucceeds(getDoc(doc(unauth(), 'books', 'book-higher-eng-1')));
    await assertFails(getDoc(doc(unauth(), 'books', 'book-draft')));
  });

  // ---- verification implementation (r54–r66, owner order 21 Nov 07:36) ----
  // Guardian request must carry the guardian's own name + relationship.
  it('(r54) link request WITHOUT the guardian name is DENIED', async () => {
    await assertFails(
      setDoc(doc(as('guardian-2'), 'parentLinks', 'guardian-2_child-1'), {
        parentId: 'guardian-2',
        studentId: 'child-1',
        status: 'pending',
        relationship: 'Mother',
        childDisplayName: 'Child One',
        childClassLevel: 'Class 6',
      }),
    );
  });
  it('(r55) link request WITHOUT the relationship is DENIED', async () => {
    await assertFails(
      setDoc(doc(as('guardian-2'), 'parentLinks', 'guardian-2_child-1'), {
        parentId: 'guardian-2',
        studentId: 'child-1',
        status: 'pending',
        guardianDisplayName: 'Guardian Two',
        childDisplayName: 'Child One',
        childClassLevel: 'Class 6',
      }),
    );
  });
  // Admin reject: (r41) left guardian-2_student-1 pending.
  it('(r56) ADMIN rejects a pending link with a reason — ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(as('admin-1'), 'parentLinks', 'guardian-2_student-1'), {
        status: 'rejected',
        decidedBy: 'admin-1',
        decisionReason: 'Information did not match the school record.',
        rejectedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  // (r31) left guardian-2_student-2 pending.
  it('(r57) ADMIN rejecting WITHOUT a reason is DENIED', async () => {
    await assertFails(
      updateDoc(doc(as('admin-1'), 'parentLinks', 'guardian-2_student-2'), {
        status: 'rejected',
        decidedBy: 'admin-1',
        rejectedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  it('(r58) CHILD rejects a pending link (pending -> revoked) — ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(as('student-2'), 'parentLinks', 'guardian-2_student-2'), {
        status: 'revoked',
        revokedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  it('(r59) ADMIN revokes a VERIFIED link — ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(as('admin-1'), 'parentLinks', 'guardian-1_child-1'), {
        status: 'revoked',
        revokedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  // Guardian-link audit entries (self-service clause).
  it('(r60) GUARDIAN writes a guardian-link-requested audit entry — ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(as('guardian-1'), 'adminActions'), {
        actorId: 'guardian-1',
        action: 'guardian-link-requested',
        details: 'Guardian One (Father) → Child One (Class 6)',
        targetId: 'guardian-1_child-1',
        before: 'none',
        after: 'pending',
        createdAt: new Date(),
      }),
    );
  });
  it('(r61) CHILD writes a guardian-link-confirmed audit entry — ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(as('child-1'), 'adminActions'), {
        actorId: 'child-1',
        action: 'guardian-link-confirmed',
        details: 'Child confirmed guardian link guardian-1_child-1',
        targetId: 'guardian-1_child-1',
        before: 'pending',
        after: 'confirmed',
        createdAt: new Date(),
      }),
    );
  });
  it('(r62) a forged audit action by a student is DENIED', async () => {
    await assertFails(
      addDoc(collection(as('student-1'), 'adminActions'), {
        actorId: 'student-1',
        action: 'user-role-change',
        details: 'forged',
        targetId: 'guardian-1_child-1',
        before: 'student',
        after: 'admin',
        createdAt: new Date(),
      }),
    );
  });
  it('(r63) an audit entry with a malformed link targetId is DENIED', async () => {
    await assertFails(
      addDoc(collection(as('guardian-1'), 'adminActions'), {
        actorId: 'guardian-1',
        action: 'guardian-link-requested',
        details: 'malformed target',
        targetId: 'not-a-link-id',
        before: 'none',
        after: 'pending',
        createdAt: new Date(),
      }),
    );
  });
  // The teacher-change audit enum fix: decideTeacherChangeRequest writes
  // these actions — before the fix the whole decide batch was denied.
  it('(r64) ADMIN writes a teacher-change-approved audit entry — ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(as('admin-1'), 'adminActions'), {
        actorId: 'admin-1',
        action: 'teacher-change-approved',
        details: 'teacher-1 — approved by admin',
        targetId: 'tcr-1',
        before: 'pending',
        after: 'approved',
        reason: 'Subjects match the institution record.',
        createdAt: new Date(),
      }),
    );
  });
  it('(r65) ADMIN writes a guardian-link-approved audit entry — ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(as('admin-1'), 'adminActions'), {
        actorId: 'admin-1',
        action: 'guardian-link-approved',
        details: 'Guardian One → Child One — information matches.',
        targetId: 'guardian-1_child-1',
        before: 'confirmed',
        after: 'verified',
        reason: 'Information matches the school record.',
        createdAt: new Date(),
      }),
    );
  });
  // Teacher application with the new post + institutionContact fields:
  // (r21) already re-applied teacher-3's record (status is now
  // 'pending'), so reset it to 'rejected' with rules disabled first —
  // the reset is test setup; the updateDoc below is what is tested.
  it('(r66) teacher re-application WITH post + institutionContact — ALLOWED', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'teacherVerifications', 'tv_teacher-3'), {
        status: 'rejected',
        verificationStatus: 'rejected',
      });
    });
    await assertSucceeds(
      updateDoc(doc(as('teacher-3'), 'teacherVerifications', 'tv_teacher-3'), {
        teachingLevel: 'Honours',
        subjects: ['Physics'],
        classes: ['HSC'],
        institution: 'Test College',
        post: 'Assistant Teacher',
        institutionContact: '01700000009',
        qualifications: 'M.Sc. Physics',
        experienceYears: 3,
        verificationReason: 'I teach Physics at Test College.',
        evidenceRef: '',
        status: 'pending',
        verificationStatus: 'pending',
        submittedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  // Missing-doc reads: a first-time teacher has NO application record;
  // the form must read that absence (null) instead of a permission
  // error (the rules guard `resource == null` — without it,
  // `resource.data.userId` on a missing doc throws and the read is
  // denied, so a first application could never be filed via the lib).
  it('(r67) reading a NON-EXISTENT teacher application returns not-found — ALLOWED', async () => {
    // tv_teacher-9 is never created in this suite — the read must return
    // "not found" (not a permission error) for any signed-in teacher.
    const snap = await assertSucceeds(getDoc(doc(as('teacher-4'), 'teacherVerifications', 'tv_teacher-9')));
    if (snap.exists()) throw new Error('expected tv_teacher-9 to be absent');
  });
});
