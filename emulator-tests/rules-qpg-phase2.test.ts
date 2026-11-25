// Eduvelto Firestore security-rules tests — Question Paper Generator
// Phase 2 (25 Nov 2026, spec §2/§3/§4/§6).
//
// Proves the rules added for the four new collections + the
// qpgProOrders extensions:
//   qpgBoards: owner-only write (create with shareEnabled false);
//     read by the owner, a moderator, or any signed-in user when
//     the board is shared (shareEnabled) — guests never;
//   qpgContributions: create as pending_review only (no admin fields
//     at create); read by the contributor or a moderator; only a
//     moderator may decide (approve, or reject with a valid reason);
//     delete: nobody;
//   qpgContributorStats: create on first submit (totalSubmitted 1,
//     everything else 0, level নবীন); the contributor only ever
//     increments their own totalSubmitted by 1; the moderator updates
//     approved/points/level/rejected at decision time;
//   qpgCustomOrders: buyer creates pending_payment at fixed ৳49;
//     only a moderator moves the status forward, one step at a time;
//   qpgProOrders (extensions): create requires senderLast3 (exactly
//     3 chars) + source; proStart/proEnd/remainingUses are NOT
//     creatable; a moderator approval MUST carry the unlock window
//     (and one credit for a per-paper order); the buyer may decrement
//     remainingUses on their own approved single-paper order by
//     exactly 1, only while > 0 and unexpired.
//
// Run with `npm run test:rules` (whole emulator-tests/ directory)
// or this file alone under `firebase emulators:exec`. Same
// conventions as rules-donations.test.ts: the emulator loads
// firestore.rules from firebase.json at startup; own project id
// so it never shares data with the other suites.

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-qpg-phase2';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}
for (const block of ['match /qpgBoards/{boardId}', 'match /qpgContributions/{contributionId}', 'match /qpgContributorStats/{statsUid}', 'match /qpgCustomOrders/{orderId}']) {
  if (!RULES_TEXT.includes(block)) {
    throw new Error(`firestore.rules has no ${block} match block — Phase 2 needs it.`);
  }
}

const futureTs = () => Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 3600 * 1000));
const pastTs = () => Timestamp.fromDate(new Date(Date.now() - 24 * 3600 * 1000));

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['admin-1', 'admin'],
      ['teacher-1', 'teacher'],
      ['student-1', 'student'],
      ['student-2', 'student'],
      ['student-3', 'student'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
      });
    }
    await setDoc(doc(db, 'qpgBoards', 'board-1'), {
      ownerUid: 'teacher-1',
      ownerName: 'Rahim',
      title: 'Tense Board',
      subject: 'English',
      classLabel: 'Honours',
      setCode: '',
      layout: 'separate',
      paperRef: { paperId: 'p1', questionIds: ['q1'] },
      slides: [{ id: 's1', questionId: 'q1', questionText: 'Which is correct?', options: [], correctLetter: 'A', explanation: '', showAnswer: false, annotations: [] }],
      shareEnabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'qpgBoards', 'board-shared'), {
      ownerUid: 'teacher-1',
      title: 'Shared Board',
      subject: 'English',
      classLabel: 'Honours',
      setCode: '',
      layout: 'separate',
      paperRef: { paperId: 'p1', questionIds: ['q1'] },
      slides: [{ id: 's1', questionId: 'q1', questionText: 'Which is correct?', options: [], correctLetter: 'A', explanation: '', showAnswer: false, annotations: [] }],
      shareEnabled: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'qpgContributions', 'contrib-1'), {
      contributorUid: 'teacher-1',
      contributorName: 'Rahim',
      institution: 'Test College',
      stream: 'general',
      classId: 'honours',
      subjectId: 'english',
      chapterId: 'bcs-english-batch1',
      topic: 'Tense',
      type: 'mcq',
      questionText: 'Which sentence is correct?',
      options: ['He go', 'He goes', 'He going', 'He gone'],
      correctAnswer: 1,
      explanation: 'Third person singular takes -s.',
      source: '',
      difficulty: 'medium',
      cognitiveLevel: 'unspecified',
      nature: 'unspecified',
      ownWordingConfirmed: true,
      status: 'pending_review',
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'qpgContributions', 'contrib-decided'), {
      contributorUid: 'teacher-1',
      contributorName: 'Rahim',
      institution: 'Test College',
      stream: 'general',
      classId: 'honours',
      subjectId: 'english',
      chapterId: 'bcs-english-batch1',
      topic: 'Tense',
      type: 'mcq',
      questionText: 'Which sentence is correct? (already decided)',
      options: ['He go', 'He goes', 'He going', 'He gone'],
      correctAnswer: 1,
      explanation: 'Third person singular takes -s.',
      source: '',
      difficulty: 'medium',
      cognitiveLevel: 'unspecified',
      nature: 'unspecified',
      ownWordingConfirmed: true,
      status: 'approved',
      reviewedByUid: 'admin-1',
      reviewedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'qpgContributions', 'contrib-reject'), {
      contributorUid: 'teacher-1',
      contributorName: 'Rahim',
      institution: 'Test College',
      stream: 'general',
      classId: 'honours',
      subjectId: 'english',
      chapterId: 'bcs-english-batch1',
      topic: 'Tense',
      type: 'mcq',
      questionText: 'Which sentence is wrong?',
      options: ['He go', 'He goes', 'He going', 'He gone'],
      correctAnswer: 0,
      explanation: 'Third person singular takes -s.',
      source: '',
      difficulty: 'medium',
      cognitiveLevel: 'unspecified',
      nature: 'unspecified',
      ownWordingConfirmed: true,
      status: 'pending_review',
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'qpgContributorStats', 'teacher-1'), {
      uid: 'teacher-1',
      displayName: 'Rahim',
      institution: 'Test College',
      totalSubmitted: 1,
      approved: 0,
      rejected: 0,
      points: 0,
      level: 'নবীন',
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'qpgCustomOrders', 'custom-1'), {
      uid: 'student-1',
      buyerName: 'Karim',
      className: 'Class 9',
      subject: 'Math',
      chapters: 'Ch 2',
      questionTypes: 'MCQ 20',
      totalMarks: 100,
      markDistribution: '',
      examTitle: 'Test',
      institutionName: 'Test School',
      dateNeeded: '28 Nov',
      instructions: '',
      priceBdt: 49,
      status: 'pending_payment',
      source: 'onsite',
      submittedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'qpgCustomOrders', 'custom-paid'), {
      uid: 'student-1',
      buyerName: 'Karim',
      className: 'Class 9',
      subject: 'Math',
      chapters: 'Ch 2',
      questionTypes: 'MCQ 20',
      totalMarks: 100,
      markDistribution: '',
      examTitle: 'Test',
      institutionName: 'Test School',
      dateNeeded: '28 Nov',
      instructions: '',
      priceBdt: 49,
      status: 'paid',
      source: 'onsite',
      submittedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'qpgProOrders', 'order-pending'), {
      uid: 'student-1',
      plan: 'monthly',
      amountBdt: 199,
      paymentMethod: 'bkash',
      trxId: 'PENDING1234',
      senderLast3: '123',
      status: 'pending-review',
      source: 'onsite',
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'qpgProOrders', 'order-pending2'), {
      uid: 'student-1',
      plan: 'monthly',
      amountBdt: 199,
      paymentMethod: 'bkash',
      trxId: 'PENDING5678',
      senderLast3: '456',
      status: 'pending-review',
      source: 'onsite',
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'qpgProOrders', 'order-credit'), {
      uid: 'student-1',
      plan: 'per-paper',
      amountBdt: 49,
      paymentMethod: 'bkash',
      trxId: 'CREDIT12345',
      senderLast3: '789',
      status: 'approved',
      source: 'onsite',
      createdAt: serverTimestamp(),
      decidedBy: 'admin-1',
      decidedAt: serverTimestamp(),
      proStart: pastTs(),
      proEnd: futureTs(),
      remainingUses: 1,
    });
  });
}

beforeAll(async () => {
  const hostVar = process.env.FIRESTORE_EMULATOR_HOST ?? '';
  const port = hostVar.includes(':')
    ? Number(hostVar.split(':').pop())
    : Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080);
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port },
  });
  await seed();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore(), 'users', 'admin-1'));
    if (!snap.exists()) throw new Error('seed failed: users/admin-1 missing in the emulator');
    const board = await getDoc(doc(ctx.firestore(), 'qpgBoards', 'board-1'));
    if (!board.exists()) throw new Error('seed failed: qpgBoards/board-1 missing in the emulator');
  });
}, 300000);

afterAll(async () => {
  await env.cleanup();
});

const asTeacher = () => env.authenticatedContext('teacher-1').firestore();
const asStudent = () => env.authenticatedContext('student-1').firestore();
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asStudent3 = () => env.authenticatedContext('student-3').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asUnauth = () => env.unauthenticatedContext().firestore();

function validBoard(overrides: Record<string, unknown> = {}) {
  return {
    ownerUid: 'teacher-1',
    ownerName: 'Rahim',
    title: 'New Board',
    subject: 'English',
    classLabel: 'Honours',
    setCode: '',
    layout: 'separate',
    paperRef: { paperId: 'p1', questionIds: ['q1'] },
    slides: [{ id: 's1', questionId: 'q1', questionText: 'Which is correct?', options: [], correctLetter: 'A', explanation: '', showAnswer: false, annotations: [] }],
    shareEnabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function validContribution(overrides: Record<string, unknown> = {}) {
  return {
    contributorUid: 'teacher-1',
    contributorName: 'Rahim',
    institution: 'Test College',
    stream: 'general',
    classId: 'honours',
    subjectId: 'english',
    chapterId: 'bcs-english-batch1',
    topic: 'Tense',
    type: 'mcq',
    questionText: 'Which sentence is correct? (new)',
    options: ['He go', 'He goes', 'He going', 'He gone'],
    correctAnswer: 1,
    explanation: 'Third person singular takes -s.',
    source: '',
    difficulty: 'medium',
    cognitiveLevel: 'unspecified',
    nature: 'unspecified',
    ownWordingConfirmed: true,
    status: 'pending_review',
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

function validCustomOrder(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'student-1',
    buyerName: 'Karim',
    className: 'Class 9',
    subject: 'Math',
    chapters: 'Ch 2',
    questionTypes: 'MCQ 20',
    totalMarks: 100,
    markDistribution: '',
    examTitle: 'Test',
    institutionName: 'Test School',
    dateNeeded: '28 Nov',
    instructions: '',
    priceBdt: 49,
    status: 'pending_payment',
    source: 'onsite',
    submittedAt: serverTimestamp(),
    ...overrides,
  };
}

function validProOrder(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'student-1',
    plan: 'monthly',
    amountBdt: 199,
    paymentMethod: 'bkash',
    trxId: 'NEWTRX1234',
    senderLast3: '123',
    status: 'pending-review',
    source: 'onsite',
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

describe('qpgBoards', () => {
  it('(b1) the owner can create a valid board', async () => {
    await assertSucceeds(addDoc(collection(asTeacher(), 'qpgBoards'), validBoard()));
  });

  it('(b2) guests and other users cannot create a board for someone else', async () => {
    await assertFails(addDoc(collection(asUnauth(), 'qpgBoards'), validBoard()));
    await assertFails(
      addDoc(collection(asStudent(), 'qpgBoards'), validBoard({ ownerUid: 'teacher-1' })),
    );
  });

  it('(b3) a board must be created unshared', async () => {
    await assertFails(addDoc(collection(asTeacher(), 'qpgBoards'), validBoard({ shareEnabled: true })));
  });

  it('(b4) the owner can update their own board; others cannot', async () => {
    await assertSucceeds(updateDoc(doc(asTeacher(), 'qpgBoards', 'board-1'), { title: 'Renamed', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(asStudent(), 'qpgBoards', 'board-1'), { title: 'Hijacked' }));
  });

  it('(b5) an unshared board is unreadable to other students; a shared board is readable', async () => {
    await assertFails(getDoc(doc(asStudent(), 'qpgBoards', 'board-1')));
    const shared = await assertSucceeds(getDoc(doc(asStudent(), 'qpgBoards', 'board-shared')));
    expect(shared.data()?.title).toBe('Shared Board');
    const own = await assertSucceeds(getDoc(doc(asTeacher(), 'qpgBoards', 'board-1')));
    expect(own.data()?.title).toBeDefined();
    await assertFails(getDoc(doc(asUnauth(), 'qpgBoards', 'board-shared')));
  });

  it('(b6) the owner can delete their own board', async () => {
    await assertSucceeds(deleteDoc(doc(asTeacher(), 'qpgBoards', 'board-shared')));
  });
});

describe('qpgContributions', () => {
  it('(c1) a teacher can submit a valid pending_review contribution', async () => {
    await assertSucceeds(addDoc(collection(asTeacher(), 'qpgContributions'), validContribution()));
  });

  it('(c2) a submission cannot start approved, and cannot carry admin fields', async () => {
    await assertFails(addDoc(collection(asTeacher(), 'qpgContributions'), validContribution({ status: 'approved' })));
    await assertFails(addDoc(collection(asTeacher(), 'qpgContributions'), validContribution({ pointsAwarded: 10 })));
    await assertFails(addDoc(collection(asTeacher(), 'qpgContributions'), validContribution({ couponCode: 'EDU-XXXX' })));
  });

  it('(c3) only the contributor or a moderator can read a submission', async () => {
    await assertSucceeds(getDoc(doc(asTeacher(), 'qpgContributions', 'contrib-1')));
    await assertSucceeds(getDoc(doc(asAdmin(), 'qpgContributions', 'contrib-1')));
    await assertFails(getDoc(doc(asStudent(), 'qpgContributions', 'contrib-1')));
  });

  it('(c4) a moderator can approve a pending submission', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'qpgContributions', 'contrib-1'), {
        status: 'approved',
        reviewedByUid: 'admin-1',
        reviewedAt: serverTimestamp(),
        pointsAwarded: 10,
        couponCode: 'EDU-TESTCOUPON1',
        couponExpiresAt: futureTs(),
      }),
    );
  });

  it('(c5) an already-decided submission cannot be decided again', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'qpgContributions', 'contrib-decided'), {
        status: 'rejected',
        reviewedByUid: 'admin-1',
        reviewedAt: serverTimestamp(),
        rejectReason: 'low-quality',
      }),
    );
  });

  it('(c6) a rejection needs a valid reason', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'qpgContributions', 'contrib-reject'), {
        status: 'rejected',
        reviewedByUid: 'admin-1',
        reviewedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(asAdmin(), 'qpgContributions', 'contrib-reject'), {
        status: 'rejected',
        reviewedByUid: 'admin-1',
        reviewedAt: serverTimestamp(),
        rejectReason: 'not-a-reason',
      }),
    );
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'qpgContributions', 'contrib-reject'), {
        status: 'rejected',
        reviewedByUid: 'admin-1',
        reviewedAt: serverTimestamp(),
        rejectReason: 'low-quality',
        rejectNote: 'Too short to use.',
      }),
    );
  });

  it('(c7) nobody can delete a submission through the client', async () => {
    await assertFails(deleteDoc(doc(asAdmin(), 'qpgContributions', 'contrib-1')));
    await assertFails(deleteDoc(doc(asTeacher(), 'qpgContributions', 'contrib-1')));
  });
});

describe('qpgContributorStats', () => {
  it('(s1) a contributor can create their own stats doc on first submit', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent2(), 'qpgContributorStats', 'student-2'), {
        uid: 'student-2',
        displayName: 'Student Two',
        institution: '',
        totalSubmitted: 1,
        approved: 0,
        rejected: 0,
        points: 0,
        level: 'নবীন',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('(s2) a stats doc cannot start with inflated counters', async () => {
    await assertFails(
      setDoc(doc(asStudent3(), 'qpgContributorStats', 'student-3'), {
        uid: 'student-3',
        displayName: 'Student Three',
        institution: '',
        totalSubmitted: 5,
        approved: 0,
        rejected: 0,
        points: 0,
        level: 'নবীন',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('(s3) the contributor only ever increments their own totalSubmitted by 1', async () => {
    await assertSucceeds(
      updateDoc(doc(asTeacher(), 'qpgContributorStats', 'teacher-1'), {
        totalSubmitted: 2,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(asTeacher(), 'qpgContributorStats', 'teacher-1'), {
        points: 100,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(asStudent(), 'qpgContributorStats', 'teacher-1'), {
        totalSubmitted: 3,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('(s4) a moderator can update approved/points/level at decision time', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'qpgContributorStats', 'teacher-1'), {
        approved: 1,
        points: 10,
        level: 'নবীন',
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe('qpgCustomOrders', () => {
  it('(o1) a buyer can create a pending_payment order at fixed ৳49', async () => {
    await assertSucceeds(addDoc(collection(asStudent(), 'qpgCustomOrders'), validCustomOrder()));
  });

  it('(o2) the price is fixed and the order must start pending_payment', async () => {
    await assertFails(addDoc(collection(asStudent(), 'qpgCustomOrders'), validCustomOrder({ priceBdt: 50 })));
    await assertFails(addDoc(collection(asStudent(), 'qpgCustomOrders'), validCustomOrder({ status: 'paid' })));
  });

  it('(o3) only the buyer or a moderator can read an order', async () => {
    await assertSucceeds(getDoc(doc(asStudent(), 'qpgCustomOrders', 'custom-1')));
    await assertSucceeds(getDoc(doc(asAdmin(), 'qpgCustomOrders', 'custom-1')));
    await assertFails(getDoc(doc(asStudent2(), 'qpgCustomOrders', 'custom-1')));
  });

  it('(o4) a moderator moves the status forward one step; never backwards', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'qpgCustomOrders', 'custom-1'), {
        status: 'paid',
        updatedByUid: 'admin-1',
        paidAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(asAdmin(), 'qpgCustomOrders', 'custom-paid'), {
        status: 'pending_payment',
        updatedByUid: 'admin-1',
      }),
    );
    await assertFails(
      updateDoc(doc(asAdmin(), 'qpgCustomOrders', 'custom-paid'), {
        status: 'delivered',
        updatedByUid: 'admin-1',
      }),
    );
  });

  it('(o5) the buyer cannot change their own order status', async () => {
    await assertFails(
      updateDoc(doc(asStudent(), 'qpgCustomOrders', 'custom-1'), { status: 'delivered' }),
    );
  });
});

describe('qpgProOrders — Phase 2 extensions', () => {
  it('(p1) a create with senderLast3 + source succeeds', async () => {
    await assertSucceeds(addDoc(collection(asStudent(), 'qpgProOrders'), validProOrder()));
  });

  it('(p2) senderLast3 is required and exactly 3 chars', async () => {
    const { senderLast3: _omit, ...noLast3 } = validProOrder();
    await assertFails(addDoc(collection(asStudent(), 'qpgProOrders'), noLast3));
    await assertFails(addDoc(collection(asStudent(), 'qpgProOrders'), validProOrder({ senderLast3: '12' })));
    await assertFails(addDoc(collection(asStudent(), 'qpgProOrders'), validProOrder({ senderLast3: '1234' })));
  });

  it('(p3) unlock fields cannot be set at create', async () => {
    await assertFails(addDoc(collection(asStudent(), 'qpgProOrders'), validProOrder({ proStart: pastTs() })));
    await assertFails(addDoc(collection(asStudent(), 'qpgProOrders'), validProOrder({ remainingUses: 1 })));
  });

  it('(p4) a moderator approval must carry the unlock window', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'qpgProOrders', 'order-pending'), {
        status: 'approved',
        decidedBy: 'admin-1',
        decidedAt: serverTimestamp(),
        proStart: pastTs(),
        proEnd: futureTs(),
      }),
    );
    await assertFails(
      updateDoc(doc(asAdmin(), 'qpgProOrders', 'order-pending2'), {
        status: 'approved',
        decidedBy: 'admin-1',
        decidedAt: serverTimestamp(),
      }),
    );
  });

  it('(p5) the buyer decrements their own single-paper credit by exactly 1', async () => {
    await assertSucceeds(updateDoc(doc(asStudent(), 'qpgProOrders', 'order-credit'), { remainingUses: 0 }));
    // Now spent: a second decrement (or any other value) is denied.
    await assertFails(updateDoc(doc(asStudent(), 'qpgProOrders', 'order-credit'), { remainingUses: -1 }));
    await assertFails(updateDoc(doc(asStudent2(), 'qpgProOrders', 'order-credit'), { remainingUses: 0 }));
  });
});
