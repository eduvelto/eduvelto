/**
 * Eduvelto Firestore security-rules tests — Job Preparation Step 5
 * (Job Categories and Exam Structure, Step 3 §3.3).
 *
 * jobCategories: public read; Admin-only write; never deleted.
 * jobExams: students read Published only; moderators read drafts and
 * write CONTENT fields only (draft-only create, draft-only update);
 * rulesConfig / rulesConfigHistory / status / authorId are Admin-only
 * (Step 5 closure, P0-1/P0-2/P0-4/P0-6 — a Moderator setting
 * rulesConfig is DENIED, n11); delete is Admin-only. The §3.3 draft's
 * create literal reviewStatus == 'draft' contradicts §2.2's enum
 * ('Not Started' | 'In Progress' | 'Under Review' | 'Published'), so
 * draft-only creation is enforced with isDraftStatus instead (pinned
 * by n7). The seed (team/job-categories-exams-seed.json) is loaded
 * into the emulator here, so read tests run against the real seed
 * shape. Same conventions as rules-step4b-chatgpt-fixes.test.ts.
 * Run with `npm run test:rules` (whole emulator-tests/ directory).
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-step5';
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
 * `updatedAt is timestamp`, so the seed must be converted here —
 * otherwise every update on a seeded doc would fail on the timestamp
 * type instead of the rule under test. */
function withTimestamps(doc: Record<string, unknown>): Record<string, unknown> {
  const out = { ...doc };
  for (const k of ['createdAt', 'updatedAt'] as const) {
    if (typeof out[k] === 'string') out[k] = new Date(out[k] as string);
  }
  return out;
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['admin-1', 'admin'],
      ['owner-1', 'owner'],
      ['moderator-1', 'moderator'],
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
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asSignedOut = () => env.unauthenticatedContext().firestore();

const VALID_CATEGORY = {
  nameBn: 'পরীক্ষামূলক ক্যাটাগরি',
  nameEn: 'Test Category',
  order: 10,
  hubSlugs: ['bcs'],
  accent: '#123456',
  status: 'active',
};

const VALID_EXAM = {
  slug: 'new-exam',
  nameBn: 'নতুন পরীক্ষা',
  nameEn: 'New Exam',
  categoryId: 'bank',
  tier: 2,
  reviewStatus: 'Not Started',
  status: 'draft',
  rulesConfig: null,
  // Step 5 closure: patternStatus is REQUIRED on create (P1-3);
  // scopeStatus defaults to 'defined' in the rules.
  patternStatus: 'not_verified',
  applicableCycle: null,
  scopeStatus: 'defined',
};

const BCS_RULES_CONFIG = {
  questionCount: 200,
  timeMinutes: 120,
  marksPerQuestion: 1,
  negativeMarking: 0.5,
  negativeMarkingVerified: true,
  passMark: null,
  passPercent: null,
  subjects: [{ nameBn: 'বাংলা', nameEn: 'Bangla', marks: 35 }],
  patternSource: 'BPSC বিজ্ঞপ্তি',
  patternVerifiedAt: null,
  patternLabel: 'verified',
};

describe('Step 5 rules — jobCategories', () => {
  it('(m1) student reading a category is ALLOWED (public structure)', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobCategories', 'bank')));
  });
  it('(m2) signed-out visitor reading a category is ALLOWED (public)', async () => {
    await assertSucceeds(getDoc(doc(asSignedOut(), 'jobCategories', 'bank')));
  });
  it('(m3) admin creating a valid category is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asAdmin(), 'jobCategories', 'test-cat'), VALID_CATEGORY),
    );
  });
  it('(m4) student creating a category is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobCategories', 'test-cat-2'), VALID_CATEGORY),
    );
  });
  it('(m5) moderator creating a category is DENIED (Admin only)', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobCategories', 'test-cat-3'), VALID_CATEGORY),
    );
  });
  it('(m6) admin creating a category without nameBn is DENIED', async () => {
    const rest = { ...VALID_CATEGORY } as Record<string, unknown>;
    delete rest.nameBn;
    await assertFails(setDoc(doc(asAdmin(), 'jobCategories', 'test-cat-4'), rest));
  });
  it('(m7) admin creating a category with order 11 is DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'jobCategories', 'test-cat-5'), { ...VALID_CATEGORY, order: 11 }),
    );
  });
  it('(m8) admin creating a category with hubSlugs as a string is DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'jobCategories', 'test-cat-6'), {
        ...VALID_CATEGORY,
        hubSlugs: 'bcs',
      }),
    );
  });
  it('(m9) admin creating a category with status "deleted" is DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'jobCategories', 'test-cat-7'), {
        ...VALID_CATEGORY,
        status: 'deleted',
      }),
    );
  });
  it('(m10) admin deactivating a category (status → inactive) is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'jobCategories', 'bank'), { status: 'inactive' }),
    );
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'jobCategories', 'bank'), { status: 'active' }),
    );
  });
  it('(m11) admin deleting a category is DENIED (never deleted)', async () => {
    await assertFails(deleteDoc(doc(asAdmin(), 'jobCategories', 'bank')));
  });
  it('(m12) student updating a category is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'jobCategories', 'bank'), { status: 'inactive' }),
    );
  });
});

describe('Step 5 rules — jobExams', () => {
  it('(n1) student reading a DRAFT exam is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobExams', 'bcs')));
  });
  it('(n2) student reading a PUBLISHED exam is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobExams', 'published-exam')));
  });
  it('(n3) moderator reading a draft exam is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'jobExams', 'bcs')));
  });
  it('(n4) author reading their own draft is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobExams', 'author-exam')));
  });
  it('(n5) non-author student reading another’s draft is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'jobExams', 'author-exam')));
  });
  it('(n6) moderator creating a valid draft exam is ALLOWED', async () => {
    await assertSucceeds(setDoc(doc(asModerator(), 'jobExams', 'new-exam'), VALID_EXAM));
  });
  it('(n7) moderator creating with reviewStatus "Published" is DENIED (draft-only create)', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobExams', 'new-exam-2'), {
        ...VALID_EXAM,
        slug: 'new-exam-2',
        reviewStatus: 'Published',
      }),
    );
  });
  it('(n8) moderator creating with slug != doc id is DENIED', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobExams', 'slug-test'), {
        ...VALID_EXAM,
        slug: 'other-slug',
      }),
    );
  });
  it('(n9) moderator creating with tier 4 is DENIED', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobExams', 'new-exam-3'), {
        ...VALID_EXAM,
        slug: 'new-exam-3',
        tier: 4,
      }),
    );
  });
  it('(n10) student creating an exam is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobExams', 'new-exam-4'), {
        ...VALID_EXAM,
        slug: 'new-exam-4',
      }),
    );
  });
  it('(n11) moderator setting a valid rulesConfig is DENIED (Step 5 closure, P0-1 — rulesConfig is Admin-only; the Step 5 core version of this test ALLOWED it)', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'bcs'), { rulesConfig: BCS_RULES_CONFIG }),
    );
  });
  it('(n12) moderator setting rulesConfig.questionCount as a string is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'bank'), {
        rulesConfig: { ...BCS_RULES_CONFIG, questionCount: '200' },
      }),
    );
  });
  it('(n13) moderator setting rulesConfig.questionCount 12.5 is DENIED (integer-only)', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'bank'), {
        rulesConfig: { ...BCS_RULES_CONFIG, questionCount: 12.5 },
      }),
    );
  });
  it('(n14) moderator setting rulesConfig as a string is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'bank'), { rulesConfig: 'verified' }),
    );
  });
  it('(n15) moderator setting a bad patternLabel is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'bank'), {
        rulesConfig: { ...BCS_RULES_CONFIG, patternLabel: 'maybe' },
      }),
    );
  });
  it('(n16) moderator setting negativeMarkingVerified as a string is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobExams', 'bank'), {
        rulesConfig: { ...BCS_RULES_CONFIG, negativeMarkingVerified: 'yes' },
      }),
    );
  });
  it('(n17) admin deleting an exam is ALLOWED', async () => {
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'jobExams', 'new-exam')));
  });
  it('(n18) moderator deleting an exam is DENIED', async () => {
    await assertFails(deleteDoc(doc(asModerator(), 'jobExams', 'bank')));
  });
  it('(n19) student updating an exam is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'jobExams', 'bcs'), { rulesConfig: BCS_RULES_CONFIG }),
    );
  });
  it('(n20) moderator changing the slug on update is DENIED', async () => {
    await assertFails(updateDoc(doc(asModerator(), 'jobExams', 'bcs'), { slug: 'other' }));
  });
});
