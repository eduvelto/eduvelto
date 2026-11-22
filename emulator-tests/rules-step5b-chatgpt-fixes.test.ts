/**
 * Eduvelto Firestore security-rules tests — Job Preparation Step 5
 * closure (ChatGPT consultation fold-in, 22 Nov 2026).
 *
 * The Step 5 core rules (rules-step5-job-categories-exams.test.ts)
 * type-checked rulesConfig but let ANY Moderator rewrite it, publish,
 * wipe the history and change authorId with a direct write. These
 * tests demonstrate the closure fixes against the ACTUAL rules:
 *
 *  P0-1  rulesConfig is Admin-only (Moderator = content fields only);
 *  P0-2  rulesConfigHistory is append-only in the rules (config
 *        change ⇒ exactly one appended entry, before→after linked,
 *        actor == caller); history is never edited in place;
 *  P0-3  role escalation is impossible by direct write (student
 *        cannot become author/Moderator/Admin/Verified Teacher;
 *        teacher cannot self-approve; Moderator cannot grant Admin;
 *        no second owner);
 *  P0-4  publication is Admin-only (Moderator and Verified Teacher
 *        cannot publish; status ⟺ reviewStatus 'Published' is
 *        enforced, so a Published exam's config cannot be silently
 *        changed and a Published exam cannot be touched by a
 *        Moderator at all);
 *  P0-5  student draft isolation — direct reads AND collection
 *        queries cannot expose unpublished exams; a student cannot
 *        create an author identity to read drafts;
 *  P0-6  author ownership — authorId / createdBy / createdAt are
 *        immutable, even for Admin;
 *  P1-1  status vs reviewStatus — status is the publication state,
 *        reviewStatus the review workflow; creation enforces the
 *        initial draft state; the §3.3 literal 'draft' reviewStatus
 *        is rejected (no such enum value);
 *  P2-2  anonymous access — signed-out users can read public content
 *        only; no anonymous writes.
 *
 * Same conventions as rules-step5-job-categories-exams.test.ts.
 * Run with `npm run test:rules` (whole emulator-tests/ directory).
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
  where,
  getDocs,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-step5b';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}

const SEED = JSON.parse(
  readFileSync(resolve(__dirname, '../team/job-categories-exams-seed.json'), 'utf8'),
) as {
  jobCategories: Record<string, Record<string, unknown>>;
  jobExams: Record<string, Record<string, unknown>>;
};

/** The seed JSON carries ISO-string timestamps; real docs carry
 * Firestore Timestamps (the importer converts them, the app writes
 * serverTimestamp()). The jobExams update rules check
 * `updatedAt is timestamp`, so the seed must be converted here. */
function withTimestamps(docData: Record<string, unknown>): Record<string, unknown> {
  const out = { ...docData };
  for (const k of ['createdAt', 'updatedAt'] as const) {
    if (typeof out[k] === 'string') out[k] = new Date(out[k] as string);
  }
  return out;
}

const VALID_EXAM = {
  slug: 'new-exam',
  nameBn: 'নতুন পরীক্ষা',
  nameEn: 'New Exam',
  categoryId: 'bank',
  tier: 2,
  reviewStatus: 'Not Started',
  status: 'draft',
  rulesConfig: null,
  patternStatus: 'not_verified',
  applicableCycle: null,
  scopeStatus: 'defined',
};

const BCS_CONFIG = {
  questionCount: 200,
  timeMinutes: 120,
  marksPerQuestion: 1,
  negativeMarking: 0.5,
  provisionalNegativeMarking: null,
  negativeMarkingVerified: true,
  passMark: null,
  passPercent: null,
  subjects: [{ nameBn: 'বাংলা', nameEn: 'Bangla', marks: 35 }],
  patternSource: 'BPSC বিজ্ঞপ্তি',
  patternVerifiedAt: null,
  patternLabel: 'verified',
  patternStatus: 'verified',
  applicableCycle: null,
};

const HISTORY_AT = new Date('2026-11-22T10:00:00.000Z');

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role, extra] of [
      ['admin-1', 'admin', {}],
      ['owner-1', 'owner', {}],
      ['moderator-1', 'moderator', {}],
      ['student-1', 'student', {}],
      ['student-2', 'student', {}],
      ['student-3', 'student', {}],
      // A teacher awaiting verification (NOT verified yet).
      ['teacher-1', 'teacher', { verificationStatus: 'pending' }],
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
    for (const [id, data] of Object.entries(SEED.jobCategories)) {
      await setDoc(doc(db, 'jobCategories', id), withTimestamps(data));
    }
    for (const [id, data] of Object.entries(SEED.jobExams)) {
      await setDoc(doc(db, 'jobExams', id), withTimestamps(data));
    }
    // A Published exam (student-readable) and an author-owned draft.
    await setDoc(doc(db, 'jobExams', 'published-exam'), {
      slug: 'published-exam',
      nameBn: 'প্রকাশিত পরীক্ষা',
      nameEn: 'Published Exam',
      categoryId: 'bank',
      tier: 1,
      reviewStatus: 'Published',
      status: 'published',
      rulesConfig: null,
      rulesConfigHistory: [],
      patternStatus: 'not_verified',
      applicableCycle: null,
      scopeStatus: 'defined',
      createdAt: new Date('2026-11-22T08:00:00.000Z'),
      updatedAt: new Date('2026-11-22T08:00:00.000Z'),
    });
    await setDoc(doc(db, 'jobExams', 'author-exam'), {
      slug: 'author-exam',
      nameBn: 'লেখকের খসড়া',
      nameEn: 'Author Draft',
      categoryId: 'bank',
      tier: 1,
      reviewStatus: 'Not Started',
      status: 'draft',
      authorId: 'student-1',
      rulesConfig: null,
      rulesConfigHistory: [],
      patternStatus: 'not_verified',
      applicableCycle: null,
      scopeStatus: 'defined',
      createdAt: new Date('2026-11-22T08:00:00.000Z'),
      updatedAt: new Date('2026-11-22T08:00:00.000Z'),
    });
    // A draft WITH a verified config and one history entry — the
    // append-only tests need pre-existing history to protect.
    await setDoc(doc(db, 'jobExams', 'history-exam'), {
      slug: 'history-exam',
      nameBn: 'ইতিহাসসহ খসড়া',
      nameEn: 'Draft With History',
      categoryId: 'bank',
      tier: 1,
      reviewStatus: 'In Progress',
      status: 'draft',
      rulesConfig: BCS_CONFIG,
      rulesConfigHistory: [
        {
          changedAt: new Date('2026-11-22T08:30:00.000Z'),
          changedBy: 'admin-1',
          reason: 'Initial verified pattern',
          before: null,
          after: BCS_CONFIG,
          sourceCircular: 'BPSC বিজ্ঞপ্তি',
        },
      ],
      patternStatus: 'verified',
      applicableCycle: null,
      scopeStatus: 'defined',
      createdAt: new Date('2026-11-22T08:00:00.000Z'),
      updatedAt: new Date('2026-11-22T08:30:00.000Z'),
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
const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asTeacher = () => env.authenticatedContext('teacher-1').firestore();
const asSignedOut = () => env.unauthenticatedContext().firestore();

/** Build a rulesConfig-change payload for an Admin write: read the
 * doc fresh, append exactly one history entry linking before→after.
 * `entryOverrides` lets a test forge one field of the entry. */
async function historyAppendPayload(
  db: ReturnType<typeof asAdmin>,
  id: string,
  newConfig: Record<string, unknown>,
  entryOverrides: Record<string, unknown> = {},
) {
  const snap = await getDoc(doc(db, 'jobExams', id));
  const old = snap.data()!;
  const entry = {
    changedAt: HISTORY_AT,
    changedBy: 'admin-1',
    reason: 'Step 5 closure test',
    before: old.rulesConfig ?? null,
    after: newConfig,
    sourceCircular: null,
    ...entryOverrides,
  };
  return {
    rulesConfig: newConfig,
    rulesConfigHistory: [...((old.rulesConfigHistory as unknown[]) ?? []), entry],
  };
}

describe('P0-1 — rulesConfig is Admin-only', () => {
  it('(a1) moderator setting rulesConfig on a draft is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'bcs'), { rulesConfig: BCS_CONFIG }),
    );
  });
  it('(a2) moderator setting rulesConfig TOGETHER with a content field is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'bcs'), {
        rulesConfig: BCS_CONFIG,
        nameBn: 'বিসিএস (সংশোধিত)',
      }),
    );
  });
  it('(a7) student setting rulesConfig is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'jobExams', 'bcs'), { rulesConfig: BCS_CONFIG }),
    );
  });
  it('(a4) admin setting rulesConfig WITHOUT the history entry is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobExams', 'bank'), { rulesConfig: BCS_CONFIG }),
    );
  });
  it('(a5) admin setting an UNVERIFIED penalty inside negativeMarking is DENIED (P1-4)', async () => {
    const payload = await historyAppendPayload(asAdmin(), 'bank', {
      ...BCS_CONFIG,
      negativeMarking: 0.25,
      negativeMarkingVerified: false,
    });
    await assertFails(updateDoc(doc(asAdmin(), 'jobExams', 'bank'), payload));
  });
  it('(a6) admin setting patternStatus verified with an unverified penalty is DENIED', async () => {
    const payload = await historyAppendPayload(asAdmin(), 'bank', {
      ...BCS_CONFIG,
      negativeMarkingVerified: false,
    });
    await assertFails(updateDoc(doc(asAdmin(), 'jobExams', 'bank'), payload));
  });
  it('(a3) admin setting a valid rulesConfig WITH the history entry is ALLOWED', async () => {
    const payload = await historyAppendPayload(asAdmin(), 'bank', BCS_CONFIG);
    await assertSucceeds(updateDoc(doc(asAdmin(), 'jobExams', 'bank'), payload));
  });
  it('(a8) moderator updating a CONTENT field on a draft is ALLOWED (control)', async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobExams', 'bcs'), {
        nameBn: 'বিসিএস (সংশোধিত)',
      }),
    );
  });
  it('(a9) moderator updating a content field on a PUBLISHED exam is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'published-exam'), {
        nameBn: 'প্রকাশিত (সংশোধিত)',
      }),
    );
  });
});

describe('P0-2 — rulesConfigHistory is append-only in the rules', () => {
  it('(b1) admin DELETING the history while changing the config is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobExams', 'history-exam'), {
        rulesConfig: { ...BCS_CONFIG, timeMinutes: 180 },
        rulesConfigHistory: [],
      }),
    );
  });
  it('(b2) admin EDITING an existing history entry in place is DENIED', async () => {
    const snap = await getDoc(doc(asAdmin(), 'jobExams', 'history-exam'));
    const old = snap.data()!;
    const tampered = [{ ...(old.rulesConfigHistory as Record<string, unknown>[])[0], reason: 'tampered' }];
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobExams', 'history-exam'), {
        rulesConfig: { ...BCS_CONFIG, timeMinutes: 180 },
        rulesConfigHistory: tampered,
      }),
    );
  });
  it('(b3) admin REPLACING the history with a different same-size list is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobExams', 'history-exam'), {
        rulesConfig: { ...BCS_CONFIG, timeMinutes: 180 },
        rulesConfigHistory: [
          {
            changedAt: HISTORY_AT,
            changedBy: 'admin-1',
            reason: 'forged',
            before: null,
            after: { ...BCS_CONFIG, timeMinutes: 180 },
            sourceCircular: null,
          },
        ],
      }),
    );
  });
  it('(b4) admin appending an entry with a WRONG before is DENIED', async () => {
    const payload = await historyAppendPayload(
      asAdmin(),
      'history-exam',
      { ...BCS_CONFIG, timeMinutes: 180 },
      { before: null },
    );
    await assertFails(updateDoc(doc(asAdmin(), 'jobExams', 'history-exam'), payload));
  });
  it('(b5) admin appending an entry with changedBy != caller is DENIED', async () => {
    const payload = await historyAppendPayload(
      asAdmin(),
      'history-exam',
      { ...BCS_CONFIG, timeMinutes: 180 },
      { changedBy: 'moderator-1' },
    );
    await assertFails(updateDoc(doc(asAdmin(), 'jobExams', 'history-exam'), payload));
  });
  it('(b7) moderator appending a history entry is DENIED', async () => {
    const snap = await getDoc(doc(asAdmin(), 'jobExams', 'history-exam'));
    const old = snap.data()!;
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'history-exam'), {
        rulesConfigHistory: [
          ...((old.rulesConfigHistory as unknown[]) ?? []),
          {
            changedAt: HISTORY_AT,
            changedBy: 'moderator-1',
            reason: 'moderator append',
            before: old.rulesConfig ?? null,
            after: old.rulesConfig ?? null,
            sourceCircular: null,
          },
        ],
      }),
    );
  });
  it('(b6) admin appending a valid second entry while changing the config is ALLOWED', async () => {
    const payload = await historyAppendPayload(asAdmin(), 'history-exam', {
      ...BCS_CONFIG,
      timeMinutes: 180,
    });
    await assertSucceeds(updateDoc(doc(asAdmin(), 'jobExams', 'history-exam'), payload));
  });
});

describe('P0-3 — role escalation is impossible by direct write', () => {
  it('(c1) a new user creating their own doc with role admin is DENIED; role student is ALLOWED', async () => {
    const asStudent9 = () => env.authenticatedContext('student-9').firestore();
    await assertFails(
      setDoc(doc(asStudent9(), 'users', 'student-9'), {
        displayName: 'New Student',
        email: 'student-9@example.com',
        role: 'admin',
        language: 'bn',
      }),
    );
    await assertSucceeds(
      setDoc(doc(asStudent9(), 'users', 'student-9'), {
        displayName: 'New Student',
        email: 'student-9@example.com',
        role: 'student',
        language: 'bn',
      }),
    );
  });
  it('(c9) a new teacher creating their own doc already verified is DENIED', async () => {
    const asStudent10 = () => env.authenticatedContext('student-10').firestore();
    await assertFails(
      setDoc(doc(asStudent10(), 'users', 'student-10'), {
        displayName: 'New Teacher',
        email: 'student-10@example.com',
        role: 'teacher',
        verificationStatus: 'verified',
        language: 'bn',
      }),
    );
  });
  it('(c2) student changing their own role to admin is DENIED', async () => {
    await assertFails(updateDoc(doc(asStudent1(), 'users', 'student-1'), { role: 'admin' }));
  });
  it('(c3) student changing their own role to moderator is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { role: 'moderator' }),
    );
  });
  it('(c4) teacher self-approving (verificationStatus pending → verified) is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacher(), 'users', 'teacher-1'), { verificationStatus: 'verified' }),
    );
  });
  it('(c5) moderator granting admin to another user is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'users', 'student-1'), { role: 'admin' }),
    );
  });
  it('(c6) moderator granting admin to themselves is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'users', 'moderator-1'), { role: 'admin' }),
    );
  });
  it('(c7) admin granting moderator to a student is ALLOWED (control)', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'users', 'student-3'), { role: 'moderator' }),
    );
  });
  it('(c8) admin creating a second owner is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'users', 'student-3'), { role: 'owner' }),
    );
  });
});

describe('P1-1 — status vs reviewStatus: creation enforces the initial draft state', () => {
  it('(h1) moderator creating with reviewStatus Not Started is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asModerator(), 'jobExams', 'p11-not-started'), {
        ...VALID_EXAM,
        slug: 'p11-not-started',
        reviewStatus: 'Not Started',
      }),
    );
  });
  it('(h2) moderator creating with reviewStatus In Progress is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asModerator(), 'jobExams', 'p11-in-progress'), {
        ...VALID_EXAM,
        slug: 'p11-in-progress',
        reviewStatus: 'In Progress',
      }),
    );
  });
  it('(h3) moderator creating with reviewStatus Under Review is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asModerator(), 'jobExams', 'p11-under-review'), {
        ...VALID_EXAM,
        slug: 'p11-under-review',
        reviewStatus: 'Under Review',
      }),
    );
  });
  it('(h4) moderator creating with reviewStatus Published is DENIED (draft-only create)', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobExams', 'p11-published'), {
        ...VALID_EXAM,
        slug: 'p11-published',
        reviewStatus: 'Published',
      }),
    );
  });
  it("(h5) moderator creating with the §3.3 literal reviewStatus 'draft' is DENIED (no such enum value)", async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobExams', 'p11-literal-draft'), {
        ...VALID_EXAM,
        slug: 'p11-literal-draft',
        reviewStatus: 'draft',
      }),
    );
  });
  it('(h6) moderator creating with an empty reviewStatus is DENIED', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobExams', 'p11-empty'), {
        ...VALID_EXAM,
        slug: 'p11-empty',
        reviewStatus: '',
      }),
    );
  });
  it('(h7) moderator creating with reviewStatus MISSING is DENIED', async () => {
    const noReview = { ...VALID_EXAM } as Record<string, unknown>;
    delete noReview.reviewStatus;
    await assertFails(
      setDoc(doc(asModerator(), 'jobExams', 'p11-missing'), {
        ...noReview,
        slug: 'p11-missing',
      }),
    );
  });
  it('(h8) moderator creating with status published is DENIED (create is draft-only)', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobExams', 'p11-published-status'), {
        ...VALID_EXAM,
        slug: 'p11-published-status',
        reviewStatus: 'Published',
        status: 'published',
      }),
    );
  });
  it('(h9) moderator creating with status MISSING is DENIED', async () => {
    const noStatus = { ...VALID_EXAM } as Record<string, unknown>;
    delete noStatus.status;
    await assertFails(
      setDoc(doc(asModerator(), 'jobExams', 'p11-missing-status'), {
        ...noStatus,
        slug: 'p11-missing-status',
      }),
    );
  });
});

describe('P0-5 — student draft isolation (reads AND queries)', () => {
  it('(e1) student direct-reading a draft is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobExams', 'bank')));
  });
  it('(e2) signed-out direct-reading a draft is DENIED', async () => {
    await assertFails(getDoc(doc(asSignedOut(), 'jobExams', 'bank')));
  });
  it('(e3) signed-out direct-reading a PUBLISHED exam is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asSignedOut(), 'jobExams', 'published-exam')));
  });
  it('(e4) student QUERYING for drafts is DENIED', async () => {
    await assertFails(
      getDocs(
        query(collection(asStudent1(), 'jobExams'), where('status', '==', 'draft')),
      ),
    );
  });
  it('(e5) student QUERYING for published exams is ALLOWED', async () => {
    await assertSucceeds(
      getDocs(
        query(collection(asStudent1(), 'jobExams'), where('status', '==', 'published')),
      ),
    );
  });
  it('(e6) student creating an exam with authorId = themselves is DENIED (no self-made author identity)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobExams', 'student-exam'), {
        ...VALID_EXAM,
        slug: 'student-exam',
        authorId: 'student-1',
      }),
    );
  });
  it('(e7) moderator creating a draft with authorId = SOMEONE ELSE is DENIED', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobExams', 'mod-author-exam'), {
        ...VALID_EXAM,
        slug: 'mod-author-exam',
        authorId: 'student-1',
      }),
    );
  });
  it('(e8) moderator creating a draft with authorId = themselves is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asModerator(), 'jobExams', 'mod-own-exam'), {
        ...VALID_EXAM,
        slug: 'mod-own-exam',
        authorId: 'moderator-1',
      }),
    );
  });
});

describe('P0-6 — author ownership: provenance is immutable, even for Admin', () => {
  it('(f1) admin changing authorId is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobExams', 'dgfood'), { authorId: 'moderator-1' }),
    );
  });
  it('(f2) moderator changing authorId is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'dgfood'), { authorId: 'moderator-1' }),
    );
  });
  it('(f3) admin changing createdBy is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobExams', 'dgfood'), { createdBy: 'someone-else' }),
    );
  });
  it('(f4) admin changing createdAt is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobExams', 'dgfood'), {
        createdAt: new Date('2026-11-23T00:00:00.000Z'),
      }),
    );
  });
});

describe('P0-4 — publication-state enforcement', () => {
  it('(d9) the author updating their own draft is DENIED (author = read-only; writes are Moderator/Admin)', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'jobExams', 'author-exam'), {
        nameBn: 'লেখকের খসড়া (সংশোধিত)',
      }),
    );
  });
  it('(d1) moderator publishing a draft is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'dgfood'), {
        status: 'published',
        reviewStatus: 'Published',
      }),
    );
  });
  it('(d2) moderator setting reviewStatus Published alone is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'dgfood'), { reviewStatus: 'Published' }),
    );
  });
  it('(d3) verified teacher publishing a draft is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacher(), 'jobExams', 'dgfood'), {
        status: 'published',
        reviewStatus: 'Published',
      }),
    );
  });
  it('(d4) admin publishing a draft (status + reviewStatus together) is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'jobExams', 'author-exam'), {
        status: 'published',
        reviewStatus: 'Published',
      }),
    );
  });
  it('(d5) admin setting status published WITHOUT reviewStatus is DENIED (states must agree)', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobExams', 'cag'), { status: 'published' }),
    );
  });
  it('(d6) admin setting reviewStatus Published WITHOUT status is DENIED (states must agree)', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobExams', 'cag'), { reviewStatus: 'Published' }),
    );
  });
  it('(d8) moderator setting rulesConfig on a PUBLISHED exam is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'published-exam'), {
        rulesConfig: BCS_CONFIG,
      }),
    );
  });
  it('(d7) admin unpublishing a published exam (both fields together) is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'jobExams', 'published-exam'), {
        status: 'draft',
        reviewStatus: 'Under Review',
      }),
    );
  });
});

describe('P2-2 — anonymous access', () => {
  it('(g1) signed-out creating a category is DENIED', async () => {
    await assertFails(
      setDoc(doc(asSignedOut(), 'jobCategories', 'anon-cat'), {
        nameBn: 'বেনামি',
        nameEn: 'Anonymous',
        order: 10,
        hubSlugs: ['bcs'],
        accent: '#123456',
        status: 'active',
      }),
    );
  });
  it('(g2) signed-out creating an exam is DENIED', async () => {
    await assertFails(
      setDoc(doc(asSignedOut(), 'jobExams', 'anon-exam'), {
        ...VALID_EXAM,
        slug: 'anon-exam',
      }),
    );
  });
  it('(g3) signed-out updating a category is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asSignedOut(), 'jobCategories', 'bank'), { status: 'inactive' }),
    );
  });
  it('(g5) signed-out updating an exam is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asSignedOut(), 'jobExams', 'bank'), { nameBn: 'বেনামি' }),
    );
  });
  it('(g6) signed-out deleting a category is DENIED', async () => {
    await assertFails(deleteDoc(doc(asSignedOut(), 'jobCategories', 'bank')));
  });
  it('(g4) signed-out reading a category is ALLOWED (public structure)', async () => {
    await assertSucceeds(getDoc(doc(asSignedOut(), 'jobCategories', 'bank')));
  });
});
