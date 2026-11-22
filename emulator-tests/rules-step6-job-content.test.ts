/**
 * Eduvelto Firestore security-rules tests — Job Preparation Step 6
 * (Subject / Chapter / Topic / Lesson system, 22 Nov 2026).
 *
 * Rules under test (firestore.rules, Step 6): jobSubjects, jobChapters,
 * jobTopics, jobLessons. Shared pattern, following the Step 5 jobExams
 * conventions (status + reviewStatus two-field model, read gated on
 * `status == 'published'`, Admin update split where the budget needs
 * it):
 *
 *  READ — status 'published' OR the author OR a Moderator. Students
 *    read Published only; anonymous reads Published only.
 *  CREATE — isTeacher() only; draft-only (status 'draft' +
 *    reviewStatus 'Not Started'); authorId pinned to the caller or
 *    absent; no verifier yet; doc ID must extend the parent slug
 *    (subjects `{examSlug}__{subjectSlug}` etc.; lessons auto-ID).
 *  UPDATE, author — own draft only, reviewStatus moves only within
 *    draft states; never publish, never touch a Published doc.
 *  UPDATE, Moderator/Admin — content + status/reviewStatus
 *    (publish/return/reject) under the SECOND-EYE rule: verifiedBy is
 *    never the author, and publishing requires a real verifier plus a
 *    verification timestamp. A Moderator may return/unpublish a
 *    Published doc but may NOT silently edit its content; an Admin
 *    may. Provenance (authorId / createdBy / createdAt) is immutable,
 *    even for Admin. Parent refs and lessonType are pinned.
 *  DELETE — Admin only.
 *  Step 6 gates — topics: isCommon == true needs >= 3 DISTINCT
 *    commonExams (common = in at least 3 of the 4 Tier-1 exams);
 *    lessons: create allows ONLY lessonType 'lesson' (viva / career /
 *    CV content is Step 16); body <= 100000.
 *  'it-professional' is excluded (scope pending, Step 5 P1-5 +
 *    Step 6 handover constraint 4): no syllabus may be built from it.
 *
 * Same conventions as rules-step5b-chatgpt-fixes.test.ts (numbered
 * cases, VALID_* fixtures, seed via withSecurityRulesDisabled).
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

const PROJECT_ID = 'eduvelto-rules-test-step6';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobSubjects')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 6 collections.`);
}

const TS = new Date('2026-11-22T08:00:00.000Z');
const VERIFY_TS = new Date('2026-11-22T09:00:00.000Z');

const VALID_SUBJECT = {
  examSlug: 'bcs',
  nameBn: 'বাংলা',
  nameEn: 'Bangla',
  order: 1,
  marks: 35,
  syllabusSource: 'BPSC বিজ্ঞপ্তি',
  reviewStatus: 'Not Started',
  status: 'draft',
  authorId: 'teacher-1',
  verifiedBy: null,
  verifiedAt: null,
  createdAt: TS,
  updatedAt: TS,
};

const VALID_CHAPTER = {
  examSlug: 'bcs',
  subjectId: 'bcs__bangla',
  nameBn: 'ব্যাকরণ',
  nameEn: 'Grammar',
  descriptionBn: 'ব্যাকরণের অধ্যায়',
  descriptionEn: 'Grammar chapter',
  order: 1,
  reviewStatus: 'Not Started',
  status: 'draft',
  authorId: 'teacher-1',
  verifiedBy: null,
  verifiedAt: null,
  createdAt: TS,
  updatedAt: TS,
};

const VALID_TOPIC = {
  examSlug: 'bcs',
  subjectId: 'bcs__bangla',
  chapterId: 'bcs__bangla__grammar',
  nameBn: 'সন্ধি',
  nameEn: 'Sandhi',
  order: 1,
  isCommon: false,
  commonExams: null,
  commonStatus: 'preliminary',
  questionTarget: 50,
  publishedQuestionCount: 0,
  reviewStatus: 'Not Started',
  status: 'draft',
  authorId: 'teacher-1',
  verifiedBy: null,
  verifiedAt: null,
  createdAt: TS,
  updatedAt: TS,
};

const VALID_LESSON = {
  examSlug: 'bcs',
  subjectId: 'bcs__bangla',
  chapterId: 'bcs__bangla__grammar',
  topicId: 'bcs__bangla__sandhi',
  lessonType: 'lesson',
  titleBn: 'সন্ধির নিয়ম',
  titleEn: 'Rules of Sandhi',
  body: 'সন্ধি হলো দুটি ধ্বনির মিলন।',
  bodyEn: null,
  order: 1,
  reviewStatus: 'Not Started',
  status: 'draft',
  authorId: 'teacher-1',
  verifiedBy: null,
  verifiedAt: null,
  createdAt: TS,
  updatedAt: TS,
};

/** Payload for a publish write by `verifier` (second eye). */
const publishPayload = (verifier: string) => ({
  status: 'published',
  reviewStatus: 'Published',
  verifiedBy: verifier,
  verifiedAt: VERIFY_TS,
});

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role, extra] of [
      ['admin-1', 'admin', {}],
      ['owner-1', 'owner', {}],
      ['moderator-1', 'moderator', {}],
      ['teacher-1', 'teacher', { verificationStatus: 'pending' }],
      ['teacher-2', 'teacher', { verificationStatus: 'pending' }],
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
    // ---- jobSubjects ----
    const subjects: Array<[string, Record<string, unknown>]> = [
      ['bcs__bangla', {
        ...VALID_SUBJECT,
        reviewStatus: 'Published',
        status: 'published',
        verifiedBy: 'moderator-1',
        verifiedAt: VERIFY_TS,
      }],
      ['bcs__english', { ...VALID_SUBJECT, nameBn: 'ইংরেজি', nameEn: 'English', order: 2, marks: 35, reviewStatus: 'In Progress' }],
      // Draft authored BY the moderator (second-eye: they may not publish it).
      ['bcs__math', { ...VALID_SUBJECT, nameBn: 'গণিত', nameEn: 'Mathematics', order: 3, marks: 30, authorId: 'moderator-1' }],
      ['bank__bangla', { ...VALID_SUBJECT, examSlug: 'bank', nameBn: 'বাংলা', nameEn: 'Bangla', order: 1, marks: null, authorId: 'teacher-2' }],
      // Draft authored BY the admin, never verified.
      ['bcs__admin-subject', { ...VALID_SUBJECT, nameBn: 'অ্যাডমিনের বিষয়', nameEn: 'Admin Subject', order: 4, marks: null, authorId: 'admin-1', reviewStatus: 'Under Review' }],
      // Draft authored by the admin but ALREADY verified by a moderator.
      ['bcs__verified-subject', { ...VALID_SUBJECT, nameBn: 'যাচাইকৃত বিষয়', nameEn: 'Verified Subject', order: 5, marks: null, authorId: 'admin-1', reviewStatus: 'Under Review', verifiedBy: 'moderator-1', verifiedAt: VERIFY_TS }],
      ['bcs__gk', { ...VALID_SUBJECT, nameBn: 'সাধারণ জ্ঞান', nameEn: 'General Knowledge', order: 6, marks: 50 }],
      ['bcs__other-author', { ...VALID_SUBJECT, nameBn: 'অন্য লেখকের বিষয়', nameEn: 'Other Author Subject', order: 7, marks: null, authorId: 'teacher-2' }],
      ['bcs__author-edit', { ...VALID_SUBJECT, nameBn: 'লেখকের সম্পাদনা', nameEn: 'Author Edit', order: 8, marks: null }],
      ['bcs__mod-edit', { ...VALID_SUBJECT, nameBn: 'মডারেটরের সম্পাদনা', nameEn: 'Moderator Edit', order: 9, marks: null }],
      ['bcs__delete-me', { ...VALID_SUBJECT, nameBn: 'মুছে ফেলার বিষয়', nameEn: 'Delete Me', order: 10, marks: null }],
    ];
    for (const [id, data] of subjects) {
      await setDoc(doc(db, 'jobSubjects', id), data);
    }
    // ---- jobChapters ----
    const chapters: Array<[string, Record<string, unknown>]> = [
      ['bcs__bangla__grammar', {
        ...VALID_CHAPTER,
        reviewStatus: 'Published',
        status: 'published',
        verifiedBy: 'moderator-1',
        verifiedAt: VERIFY_TS,
      }],
      ['bcs__bangla__vocabulary', { ...VALID_CHAPTER, nameBn: 'শব্দভাণ্ডার', nameEn: 'Vocabulary', order: 2, reviewStatus: 'In Progress' }],
      ['bcs__bangla__composition', { ...VALID_CHAPTER, nameBn: 'রচনা', nameEn: 'Composition', order: 3, authorId: 'moderator-1' }],
      ['bcs__bangla__delete-me', { ...VALID_CHAPTER, nameBn: 'মুছে ফেলার অধ্যায়', nameEn: 'Delete Me Chapter', order: 4 }],
    ];
    for (const [id, data] of chapters) {
      await setDoc(doc(db, 'jobChapters', id), data);
    }
    // ---- jobTopics ----
    const topics: Array<[string, Record<string, unknown>]> = [
      ['bcs__bangla__sandhi', {
        ...VALID_TOPIC,
        reviewStatus: 'Published',
        status: 'published',
        isCommon: true,
        commonExams: ['bcs', 'bank', 'primary-teacher'],
        commonStatus: 'verified',
        publishedQuestionCount: 12,
        verifiedBy: 'moderator-1',
        verifiedAt: VERIFY_TS,
      }],
      ['bcs__bangla__samash', { ...VALID_TOPIC, nameBn: 'সমাস', nameEn: 'Samash', order: 2, reviewStatus: 'In Progress' }],
      ['bcs__bangla__karok', { ...VALID_TOPIC, nameBn: 'কারক', nameEn: 'Karok', order: 3, chapterId: 'bcs__bangla__grammar', authorId: 'moderator-1' }],
      ['bcs__bangla__delete-me', { ...VALID_TOPIC, nameBn: 'মুছে ফেলার টপিক', nameEn: 'Delete Me Topic', order: 4 }],
    ];
    for (const [id, data] of topics) {
      await setDoc(doc(db, 'jobTopics', id), data);
    }
    // ---- jobLessons (auto-ID in production; fixed IDs here for tests) ----
    const lessons: Array<[string, Record<string, unknown>]> = [
      ['lesson-published-1', {
        ...VALID_LESSON,
        reviewStatus: 'Published',
        status: 'published',
        verifiedBy: 'moderator-1',
        verifiedAt: VERIFY_TS,
      }],
      ['lesson-draft-1', { ...VALID_LESSON, titleBn: 'খসড়া লেসন', titleEn: 'Draft Lesson', order: 2, reviewStatus: 'In Progress' }],
      ['lesson-mod-own', { ...VALID_LESSON, titleBn: 'মডারেটরের লেসন', titleEn: 'Moderator Lesson', order: 3, authorId: 'moderator-1' }],
      ['lesson-author-edit', { ...VALID_LESSON, titleBn: 'লেখকের লেসন', titleEn: 'Author Lesson', order: 4 }],
      ['lesson-delete-me', { ...VALID_LESSON, titleBn: 'মুছে ফেলার লেসন', titleEn: 'Delete Me Lesson', order: 5 }],
    ];
    for (const [id, data] of lessons) {
      await setDoc(doc(db, 'jobLessons', id), data);
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
const asTeacher1 = () => env.authenticatedContext('teacher-1').firestore();
const asTeacher2 = () => env.authenticatedContext('teacher-2').firestore();
const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asSignedOut = () => env.unauthenticatedContext().firestore();

describe('Create by role', () => {
  it('(c1) student creating a subject is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobSubjects', 'bcs__c1-subject'), VALID_SUBJECT),
    );
  });
  it('(c2) signed-out creating a subject is DENIED', async () => {
    await assertFails(
      setDoc(doc(asSignedOut(), 'jobSubjects', 'bcs__c2-subject'), VALID_SUBJECT),
    );
  });
  it('(c3) teacher creating a draft subject is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__c3-subject'), VALID_SUBJECT),
    );
  });
  it('(c4) teacher creating with status published is DENIED (draft-only create)', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__c4-subject'), {
        ...VALID_SUBJECT,
        status: 'published',
      }),
    );
  });
  it('(c5) teacher creating with reviewStatus Published is DENIED (states must agree)', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__c5-subject'), {
        ...VALID_SUBJECT,
        reviewStatus: 'Published',
      }),
    );
  });
  it("(c6) teacher creating with the §3.3 literal reviewStatus 'draft' is DENIED (no such enum value)", async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__c6-subject'), {
        ...VALID_SUBJECT,
        reviewStatus: 'draft',
      }),
    );
  });
  it('(c7) moderator creating a draft subject is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asModerator(), 'jobSubjects', 'bcs__c7-subject'), {
        ...VALID_SUBJECT,
        authorId: 'moderator-1',
      }),
    );
  });
  it('(c8) admin creating a draft subject is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asAdmin(), 'jobSubjects', 'bcs__c8-subject'), {
        ...VALID_SUBJECT,
        authorId: 'admin-1',
      }),
    );
  });
  it('(c9) teacher creating a draft chapter is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacher1(), 'jobChapters', 'bcs__bangla__c9-chapter'), VALID_CHAPTER),
    );
  });
  it('(c10) teacher creating a draft topic is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__c10-topic'), VALID_TOPIC),
    );
  });
  it('(c11) teacher creating a draft lesson is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacher1(), 'jobLessons', 'c11-lesson'), VALID_LESSON),
    );
  });
  it('(c12) teacher creating with authorId = SOMEONE ELSE is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__c12-subject'), {
        ...VALID_SUBJECT,
        authorId: 'teacher-2',
      }),
    );
  });
  it('(c13) teacher creating with authorId ABSENT is ALLOWED', async () => {
    const noAuthor = { ...VALID_SUBJECT } as Record<string, unknown>;
    delete noAuthor.authorId;
    await assertSucceeds(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__c13-subject'), noAuthor),
    );
  });
  it('(c14) teacher creating with verifiedBy already set is DENIED (no baked-in self-verification)', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__c14-subject'), {
        ...VALID_SUBJECT,
        verifiedBy: 'moderator-1',
        verifiedAt: VERIFY_TS,
      }),
    );
  });
  it('(c15) teacher creating a subject under an UNKNOWN exam is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'unknown-exam__c15-subject'), {
        ...VALID_SUBJECT,
        examSlug: 'unknown-exam',
      }),
    );
  });
  it('(c16) teacher creating a subject under it-professional is DENIED (scope pending, handover constraint 4)', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'it-professional__c16-subject'), {
        ...VALID_SUBJECT,
        examSlug: 'it-professional',
      }),
    );
  });
  it('(c17) teacher creating a subject whose doc ID does not start with the exam slug is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bank__c17-subject'), VALID_SUBJECT),
    );
  });
  it('(c18) teacher creating a chapter whose doc ID does not extend its subjectId is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobChapters', 'bcs__english__c18-chapter'), VALID_CHAPTER),
    );
  });
  it('(c19) teacher creating a topic whose doc ID does not extend its chapterId is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__c19-topic'), {
        ...VALID_TOPIC,
        chapterId: 'bcs__bangla__vocabulary',
      }),
    );
  });
  it('(c20) teacher creating a subject in the exact SEED shape (slug + createdBy + applicableCycle) is ALLOWED', async () => {
    // Coordinator-added (22 Nov 2026): the Step 6 seed carries three
    // fields beyond the schema list — slug, createdBy 'seed' and
    // applicableCycle. The rules validate named fields only (no
    // whole-doc allowlist), so a seed-shaped doc must pass create.
    // This pins seed↔rules compatibility. NOTE: the doc ID must NOT
    // collide with the beforeAll seed (bcs__bangla etc.) — a setDoc
    // on an existing doc is evaluated as an UPDATE, not a create.
    await assertSucceeds(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__c20-seed-shape'), {
        ...VALID_SUBJECT,
        authorId: null,
        slug: 'c20-seed-shape',
        createdBy: 'seed',
        applicableCycle: null,
      }),
    );
  });
});

describe('Field validations', () => {
  it('(v1) subject order 0 is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__v1-subject'), { ...VALID_SUBJECT, order: 0 }),
    );
  });
  it('(v2) subject order 1.5 (non-int) is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__v2-subject'), { ...VALID_SUBJECT, order: 1.5 }),
    );
  });
  it('(v3) subject marks -1 is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__v3-subject'), { ...VALID_SUBJECT, marks: -1 }),
    );
  });
  it('(v4) subject marks null is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__v4-subject'), { ...VALID_SUBJECT, marks: null }),
    );
  });
  it('(v5) subject nameBn of 101 chars is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__v5-subject'), {
        ...VALID_SUBJECT,
        nameBn: 'x'.repeat(101),
      }),
    );
  });
  it('(v6) subject nameEn MISSING is DENIED', async () => {
    const noNameEn = { ...VALID_SUBJECT } as Record<string, unknown>;
    delete noNameEn.nameEn;
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__v6-subject'), noNameEn),
    );
  });
  it('(v7) chapter descriptionBn of 1001 chars is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobChapters', 'bcs__bangla__v7-chapter'), {
        ...VALID_CHAPTER,
        descriptionBn: 'x'.repeat(1001),
      }),
    );
  });
  it('(v8) topic commonStatus outside the enum is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__v8-topic'), {
        ...VALID_TOPIC,
        commonStatus: 'draft',
      }),
    );
  });
  it('(v9) topic questionTarget -1 is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__v9-topic'), {
        ...VALID_TOPIC,
        questionTarget: -1,
      }),
    );
  });
  it('(v10) topic publishedQuestionCount -1 is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__v10-topic'), {
        ...VALID_TOPIC,
        publishedQuestionCount: -1,
      }),
    );
  });
  it('(v11) topic publishedQuestionCount MISSING is DENIED', async () => {
    const noCount = { ...VALID_TOPIC } as Record<string, unknown>;
    delete noCount.publishedQuestionCount;
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__v11-topic'), noCount),
    );
  });
  it('(v12) lesson titleBn of 201 chars is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobLessons', 'v12-lesson'), {
        ...VALID_LESSON,
        titleBn: 'x'.repeat(201),
      }),
    );
  });
  it('(v13) lesson body MISSING is DENIED', async () => {
    const noBody = { ...VALID_LESSON } as Record<string, unknown>;
    delete noBody.body;
    await assertFails(setDoc(doc(asTeacher1(), 'jobLessons', 'v13-lesson'), noBody));
  });
  it("(v14) lessonType 'lesson' with topicId null is DENIED (all three parents required)", async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobLessons', 'v14-lesson'), { ...VALID_LESSON, topicId: null }),
    );
  });
  it("(v15) lessonType 'lesson' with subjectId null is DENIED", async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobLessons', 'v15-lesson'), { ...VALID_LESSON, subjectId: null }),
    );
  });
  it("(v16) chapter with subjectId 'not-a-doc-id' is DENIED (parent must look like a subject doc ID)", async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobChapters', 'bcs__not-a-doc-id__v16-chapter'), {
        ...VALID_CHAPTER,
        subjectId: 'not-a-doc-id',
      }),
    );
  });
  it("(v17) topic with chapterId 'bcs__bangla' is DENIED (chapter ID needs three segments)", async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__v17-topic'), {
        ...VALID_TOPIC,
        chapterId: 'bcs__bangla',
      }),
    );
  });
});

describe('isCommon rule, lessonType gate, body limit', () => {
  it('(t1) topic isCommon true + only 2 commonExams is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__t1-topic'), {
        ...VALID_TOPIC,
        isCommon: true,
        commonExams: ['bcs', 'bank'],
      }),
    );
  });
  it('(t2) topic isCommon true + 3 commonExams is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__t2-topic'), {
        ...VALID_TOPIC,
        isCommon: true,
        commonExams: ['bcs', 'bank', 'primary-teacher'],
      }),
    );
  });
  it('(t3) topic isCommon true + commonExams ABSENT is DENIED', async () => {
    const noCommon = { ...VALID_TOPIC, isCommon: true } as Record<string, unknown>;
    delete noCommon.commonExams;
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__t3-topic'), noCommon),
    );
  });
  it('(t4) topic isCommon false + commonExams ABSENT is ALLOWED', async () => {
    const noCommon = { ...VALID_TOPIC } as Record<string, unknown>;
    delete noCommon.commonExams;
    await assertSucceeds(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__t4-topic'), noCommon),
    );
  });
  it("(t5) topic isCommon true + 3 DUPLICATE slugs is DENIED (distinct exams counted)", async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__t5-topic'), {
        ...VALID_TOPIC,
        isCommon: true,
        commonExams: ['bcs', 'bcs', 'bcs'],
      }),
    );
  });
  it('(t6) topic isCommon true + an UNKNOWN exam in commonExams is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__t6-topic'), {
        ...VALID_TOPIC,
        isCommon: true,
        commonExams: ['bcs', 'bank', 'nope'],
      }),
    );
  });
  it("(t7) lesson lessonType 'viva-question' create is DENIED in Step 6", async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobLessons', 't7-lesson'), {
        ...VALID_LESSON,
        lessonType: 'viva-question',
        topicId: null,
      }),
    );
  });
  it("(t8) lesson lessonType 'viva-guide' create is DENIED in Step 6", async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobLessons', 't8-lesson'), {
        ...VALID_LESSON,
        lessonType: 'viva-guide',
        topicId: null,
      }),
    );
  });
  it("(t9) lesson lessonType 'career-guide' create is DENIED in Step 6", async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobLessons', 't9-lesson'), {
        ...VALID_LESSON,
        lessonType: 'career-guide',
        topicId: null,
      }),
    );
  });
  it("(t10) lesson lessonType 'cv-guide' create is DENIED in Step 6", async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobLessons', 't10-lesson'), {
        ...VALID_LESSON,
        lessonType: 'cv-guide',
        topicId: null,
      }),
    );
  });
  it('(t11) lesson body of 100001 chars is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobLessons', 't11-lesson'), {
        ...VALID_LESSON,
        body: 'x'.repeat(100001),
      }),
    );
  });
  it('(t12) lesson body of exactly 100000 chars is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacher1(), 'jobLessons', 't12-lesson'), {
        ...VALID_LESSON,
        body: 'x'.repeat(100000),
      }),
    );
  });
  it('(t13) author updating own draft topic to isCommon true with 2 exams is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__samash'), {
        isCommon: true,
        commonExams: ['bcs', 'bank'],
      }),
    );
  });
  it('(t14) moderator updating a draft topic publishedQuestionCount (counter) is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobTopics', 'bcs__bangla__samash'), {
        publishedQuestionCount: 5,
      }),
    );
  });
});

describe('Draft isolation — reads AND queries', () => {
  it('(e1) student direct-reading a draft subject is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobSubjects', 'bcs__gk')));
  });
  it('(e2) student direct-reading a PUBLISHED subject is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobSubjects', 'bcs__bangla')));
  });
  it('(e3) signed-out direct-reading a PUBLISHED subject is DENIED (auth-gating, owner 22 Nov ~10:33)', async () => {
    await assertFails(getDoc(doc(asSignedOut(), 'jobSubjects', 'bcs__bangla')));
  });
  it('(e4) signed-out direct-reading a draft subject is DENIED', async () => {
    await assertFails(getDoc(doc(asSignedOut(), 'jobSubjects', 'bcs__gk')));
  });
  it('(e5) student QUERYING for draft subjects is DENIED', async () => {
    await assertFails(
      getDocs(
        query(collection(asStudent1(), 'jobSubjects'), where('status', '==', 'draft')),
      ),
    );
  });
  it('(e6) student QUERYING for published subjects is ALLOWED', async () => {
    await assertSucceeds(
      getDocs(
        query(collection(asStudent1(), 'jobSubjects'), where('status', '==', 'published')),
      ),
    );
  });
  it('(e7) signed-out QUERYING for published subjects is DENIED (auth-gating, owner 22 Nov ~10:33)', async () => {
    await assertFails(
      getDocs(
        query(collection(asSignedOut(), 'jobSubjects'), where('status', '==', 'published')),
      ),
    );
  });
  it('(e8) moderator reading a draft subject is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'jobSubjects', 'bcs__gk')));
  });
  it('(e9) author reading their own draft subject is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__gk')));
  });
  it("(e10) another teacher reading someone else's draft is DENIED", async () => {
    await assertFails(getDoc(doc(asTeacher2(), 'jobSubjects', 'bcs__gk')));
  });
  it('(e11) student direct-reading a PUBLISHED lesson is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobLessons', 'lesson-published-1')));
  });
  it('(e12) student direct-reading a draft lesson is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobLessons', 'lesson-draft-1')));
  });
  it('(e13) student QUERYING for published chapters is ALLOWED', async () => {
    await assertSucceeds(
      getDocs(
        query(collection(asStudent1(), 'jobChapters'), where('status', '==', 'published')),
      ),
    );
  });
  it('(e14) student QUERYING for draft topics is DENIED', async () => {
    await assertFails(
      getDocs(
        query(collection(asStudent1(), 'jobTopics'), where('status', '==', 'draft')),
      ),
    );
  });
  // Auth-gating (owner instruction 22 Nov 2026 ~10:33, BINDING):
  // anonymous reads NOTHING in these four collections — not even
  // Published docs. e3/e7 (subjects) were flipped above; e15–e20
  // pin the same for chapters, topics and lessons (direct + query).
  it('(e15) signed-out direct-reading a PUBLISHED chapter is DENIED', async () => {
    await assertFails(getDoc(doc(asSignedOut(), 'jobChapters', 'bcs__bangla__grammar')));
  });
  it('(e16) signed-out direct-reading a PUBLISHED topic is DENIED', async () => {
    await assertFails(getDoc(doc(asSignedOut(), 'jobTopics', 'bcs__bangla__sandhi')));
  });
  it('(e17) signed-out direct-reading a PUBLISHED lesson is DENIED', async () => {
    await assertFails(getDoc(doc(asSignedOut(), 'jobLessons', 'lesson-published-1')));
  });
  it('(e18) signed-out QUERYING for published chapters is DENIED', async () => {
    await assertFails(
      getDocs(
        query(collection(asSignedOut(), 'jobChapters'), where('status', '==', 'published')),
      ),
    );
  });
  it('(e19) signed-out QUERYING for published topics is DENIED', async () => {
    await assertFails(
      getDocs(
        query(collection(asSignedOut(), 'jobTopics'), where('status', '==', 'published')),
      ),
    );
  });
  it('(e20) signed-out QUERYING for published lessons is DENIED', async () => {
    await assertFails(
      getDocs(
        query(collection(asSignedOut(), 'jobLessons'), where('status', '==', 'published')),
      ),
    );
  });
});

describe('Author ownership', () => {
  it('(o1) author editing their own draft subject is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__author-edit'), {
        nameBn: 'লেখকের সম্পাদনা (সংশোধিত)',
      }),
    );
  });
  it('(o2) author advancing their own draft reviewStatus Not Started → In Progress is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__author-edit'), {
        reviewStatus: 'In Progress',
      }),
    );
  });
  it("(o3) author editing ANOTHER teacher's draft is DENIED", async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__other-author'), {
        nameBn: 'অন্যের খসড়া (সংশোধিত)',
      }),
    );
  });
  it('(o4) author editing their own PUBLISHED subject is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__bangla'), {
        nameBn: 'বাংলা (সংশোধিত)',
      }),
    );
  });
  it('(o5) author changing their own authorId is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__gk'), { authorId: 'teacher-2' }),
    );
  });
  it('(o6) author setting verifiedBy on their own draft is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__gk'), { verifiedBy: 'moderator-1' }),
    );
  });
  it('(o7) admin changing authorId is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobSubjects', 'bcs__gk'), { authorId: 'moderator-1' }),
    );
  });
  it('(o8) moderator changing authorId is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobSubjects', 'bcs__gk'), { authorId: 'moderator-1' }),
    );
  });
  it('(o9) admin changing createdAt is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobSubjects', 'bcs__gk'), {
        createdAt: new Date('2026-11-23T00:00:00.000Z'),
      }),
    );
  });
  it('(o10) admin changing createdBy is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobSubjects', 'bcs__gk'), { createdBy: 'someone-else' }),
    );
  });
  it('(o11) author changing examSlug on their own draft is DENIED (parent refs pinned)', async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__gk'), { examSlug: 'bank' }),
    );
  });
  it('(o12) author changing lessonType on their own draft lesson is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'jobLessons', 'lesson-author-edit'), {
        lessonType: 'viva-question',
      }),
    );
  });
  it('(o13) author changing publishedQuestionCount on their own draft topic is DENIED (counter, not author content)', async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__samash'), {
        publishedQuestionCount: 9,
      }),
    );
  });
  it('(o14) author DEMOTED to student can no longer edit their own draft (role checked live)', async () => {
    // Coordinator-added (22 Nov 2026): the author rule checks
    // isTeacher(), not just authorId + active — a teacher whose role
    // was revoked to student loses the author-edit right. Demote
    // teacher-2 (author of bcs__other-author), assert the edit fails,
    // then restore the role so later tests are unaffected.
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'users', 'teacher-2'), { role: 'student' }),
    );
    await assertFails(
      updateDoc(doc(asTeacher2(), 'jobSubjects', 'bcs__other-author'), {
        nameBn: 'বদলানো নাম',
      }),
    );
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'users', 'teacher-2'), { role: 'teacher' }),
    );
  });
});

describe('Publish gates — the second-eye rule', () => {
  it('(p1) moderator publishing a doc THEY authored is DENIED (second-eye)', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobSubjects', 'bcs__math'), publishPayload('moderator-1')),
    );
  });
  it("(p2) moderator publishing ANOTHER teacher's draft is ALLOWED", async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobSubjects', 'bcs__english'), publishPayload('moderator-1')),
    );
  });
  it("(p3) admin publishing a teacher's draft is ALLOWED", async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'jobSubjects', 'bank__bangla'), publishPayload('admin-1')),
    );
  });
  it('(p4) admin publishing a doc THEY authored is DENIED (second-eye)', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobSubjects', 'bcs__admin-subject'), publishPayload('admin-1')),
    );
  });
  it('(p5) admin publishing their own doc that a MODERATOR already verified is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'jobSubjects', 'bcs__verified-subject'), {
        status: 'published',
        reviewStatus: 'Published',
      }),
    );
  });
  it('(p6) author publishing their own draft is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__gk'), publishPayload('teacher-1')),
    );
  });
  it('(p7) moderator setting status published WITHOUT reviewStatus is DENIED (states must agree)', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobSubjects', 'bcs__gk'), { status: 'published' }),
    );
  });
  it('(p8) admin setting reviewStatus Published WITHOUT status is DENIED (states must agree)', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobSubjects', 'bcs__gk'), { reviewStatus: 'Published' }),
    );
  });
  it('(p9) moderator setting verifiedBy to THE AUTHOR is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobSubjects', 'bcs__gk'), { verifiedBy: 'teacher-1' }),
    );
  });
  it('(p10) moderator setting verifiedBy to SOMEONE ELSE (not the caller) is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobSubjects', 'bcs__gk'), { verifiedBy: 'admin-1' }),
    );
  });
  it('(p11) a teacher (non-author, non-moderator) publishing a draft is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacher2(), 'jobSubjects', 'bcs__gk'), publishPayload('teacher-2')),
    );
  });
  it("(p12) moderator publishing another teacher's chapter is ALLOWED", async () => {
    await assertSucceeds(
      updateDoc(
        doc(asModerator(), 'jobChapters', 'bcs__bangla__vocabulary'),
        publishPayload('moderator-1'),
      ),
    );
  });
  it('(p13) moderator publishing their OWN chapter is DENIED', async () => {
    await assertFails(
      updateDoc(
        doc(asModerator(), 'jobChapters', 'bcs__bangla__composition'),
        publishPayload('moderator-1'),
      ),
    );
  });
  it("(p14) moderator publishing another teacher's topic is ALLOWED", async () => {
    await assertSucceeds(
      updateDoc(
        doc(asModerator(), 'jobTopics', 'bcs__bangla__samash'),
        publishPayload('moderator-1'),
      ),
    );
  });
  it('(p15) moderator publishing their OWN topic is DENIED', async () => {
    await assertFails(
      updateDoc(
        doc(asModerator(), 'jobTopics', 'bcs__bangla__karok'),
        publishPayload('moderator-1'),
      ),
    );
  });
  it("(p16) moderator publishing another teacher's lesson is ALLOWED", async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobLessons', 'lesson-draft-1'), publishPayload('moderator-1')),
    );
  });
  it('(p17) moderator publishing their OWN lesson is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobLessons', 'lesson-mod-own'), publishPayload('moderator-1')),
    );
  });
  it('(p18) admin publishing a draft WITHOUT any verifier is DENIED (nothing Published without a second eye)', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobSubjects', 'bcs__gk'), {
        status: 'published',
        reviewStatus: 'Published',
      }),
    );
  });
  it('(p19) moderator editing a PUBLISHED subject content field is DENIED (no silent edits to published content)', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobSubjects', 'bcs__bangla'), {
        nameBn: 'বাংলা (সংশোধিত)',
      }),
    );
  });
  it('(p20) admin editing a PUBLISHED subject content field is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'jobSubjects', 'bcs__bangla'), {
        nameBn: 'বাংলা (সংশোধিত)',
      }),
    );
  });
  it('(p21) moderator editing a PUBLISHED lesson content field is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobLessons', 'lesson-published-1'), {
        titleBn: 'সংশোধিত শিরোনাম',
      }),
    );
  });
  it('(p22) moderator unpublishing a published subject is ALLOWED (return)', async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobSubjects', 'bcs__bangla'), {
        status: 'draft',
        reviewStatus: 'Under Review',
      }),
    );
  });
});

describe('Moderator/Admin content updates, student/anonymous writes', () => {
  it("(u1) moderator editing a draft subject's content is ALLOWED", async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobSubjects', 'bcs__mod-edit'), {
        nameBn: 'মডারেটরের সম্পাদনা (সংশোধিত)',
      }),
    );
  });
  it("(u2) admin editing a draft subject's content is ALLOWED", async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'jobSubjects', 'bcs__gk'), { order: 2 }),
    );
  });
  it('(u3) student updating a draft subject is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'jobSubjects', 'bcs__gk'), { nameBn: 'ছাত্রের সম্পাদনা' }),
    );
  });
  it('(u4) signed-out updating a draft subject is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asSignedOut(), 'jobSubjects', 'bcs__gk'), { nameBn: 'বেনামি সম্পাদনা' }),
    );
  });
  it('(u5) student updating a published subject is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'jobSubjects', 'bcs__bangla'), { nameBn: 'ছাত্রের সম্পাদনা' }),
    );
  });
  it("(u6) teacher (non-author) updating a draft is DENIED", async () => {
    await assertFails(
      updateDoc(doc(asTeacher2(), 'jobSubjects', 'bcs__gk'), { nameBn: 'অন্য শিক্ষকের সম্পাদনা' }),
    );
  });
});

describe('Delete', () => {
  it('(d1) student deleting a subject is DENIED', async () => {
    await assertFails(deleteDoc(doc(asStudent1(), 'jobSubjects', 'bcs__gk')));
  });
  it('(d2) teacher deleting a subject is DENIED', async () => {
    await assertFails(deleteDoc(doc(asTeacher1(), 'jobSubjects', 'bcs__gk')));
  });
  it('(d3) moderator deleting a subject is DENIED', async () => {
    await assertFails(deleteDoc(doc(asModerator(), 'jobSubjects', 'bcs__gk')));
  });
  it('(d4) admin deleting a subject is ALLOWED', async () => {
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'jobSubjects', 'bcs__delete-me')));
  });
  it('(d5) moderator deleting a chapter is DENIED', async () => {
    await assertFails(deleteDoc(doc(asModerator(), 'jobChapters', 'bcs__bangla__delete-me')));
  });
  it('(d6) admin deleting a chapter is ALLOWED', async () => {
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'jobChapters', 'bcs__bangla__delete-me')));
  });
  it('(d7) admin deleting a topic is ALLOWED', async () => {
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'jobTopics', 'bcs__bangla__delete-me')));
  });
  it('(d8) admin deleting a lesson is ALLOWED', async () => {
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'jobLessons', 'lesson-delete-me')));
  });
  it('(d9) signed-out deleting a subject is DENIED', async () => {
    await assertFails(deleteDoc(doc(asSignedOut(), 'jobSubjects', 'bcs__gk')));
  });
});

describe('status / reviewStatus consistency', () => {
  it('(s1) create chapter with status draft + reviewStatus Published is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobChapters', 'bcs__bangla__s1-chapter'), {
        ...VALID_CHAPTER,
        reviewStatus: 'Published',
      }),
    );
  });
  it('(s2) create topic with status MISSING is DENIED', async () => {
    const noStatus = { ...VALID_TOPIC } as Record<string, unknown>;
    delete noStatus.status;
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobTopics', 'bcs__bangla__grammar__s2-topic'), noStatus),
    );
  });
  it('(s3) create lesson with reviewStatus MISSING is DENIED', async () => {
    const noReview = { ...VALID_LESSON } as Record<string, unknown>;
    delete noReview.reviewStatus;
    await assertFails(setDoc(doc(asTeacher1(), 'jobLessons', 's3-lesson'), noReview));
  });
  it("(s4) admin setting reviewStatus to an unknown value ('archived') is DENIED", async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'jobSubjects', 'bcs__gk'), { reviewStatus: 'archived' }),
    );
  });
  it("(s5) moderator advancing a draft subject's reviewStatus within draft states is ALLOWED (control)", async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobSubjects', 'bcs__gk'), {
        reviewStatus: 'Under Review',
      }),
    );
  });
});
