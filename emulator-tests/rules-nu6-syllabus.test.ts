/**
 * Eduvelto — Firestore Rules tests: NU syllabus structure (NU-6;
 * design §19.3.4, §19.2.3). Mirrors emulator-tests/rules-nu5.test.ts:
 * own project id, beforeAll with a 300s timeout, NO `rules:` option —
 * the emulator loads the rules from firebase.json. Runs against
 * firestore.rules in the project root (sanity-checked below).
 *
 * Covered: read (Published for everyone; a verified teacher may read
 * a draft they created), write (Owner/Admin or verified teacher, own
 * Draft only; publish is Owner/Admin only), published docs never
 * edited in place, delete never, and the field validators that mirror
 * lib/nuSyllabus.ts (marks 20 common / 40 block, groupIds 1–3 valid
 * slugs, block slugs group-*, common slugs only
 * bangla/english/general-knowledge, order int ≥ 1, syllabusSource /
 * circularVersion / createdBy non-empty strings, syllabusVerified
 * bool, status draft/published).
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
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';

const PROJECT_ID = 'eduvelto-rules-test-nu6';

function toFirestoreDb(context: RulesTestContext): Firestore {
  return context.firestore() as unknown as Firestore;
}

let env: RulesTestEnvironment;
let admin: RulesTestContext;
let student: RulesTestContext;
let teacherVerified: RulesTestContext;
let teacherPending: RulesTestContext;
let anonymous: RulesTestContext;

function subjectDoc(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    slug: 'bangla',
    nameBn: 'বাংলা',
    syllabusSource: 'NCTB সাহিত্যপাঠ',
    status: 'draft',
    circularVersion: '2025-26',
    createdBy: 'teacher-verified',
    groupIds: ['humanities', 'science', 'business'],
    marks: 20,
    isGroupBlock: false,
    ...overrides,
  };
}

function chapterDoc(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    subjectId: 'nu-sub-bangla',
    slug: 'goddo',
    nameBn: 'গদ্য',
    order: 1,
    syllabusSource: 'NCTB সাহিত্যপাঠ',
    syllabusVerified: false,
    status: 'draft',
    circularVersion: '2025-26',
    createdBy: 'teacher-verified',
    ...overrides,
  };
}

function topicDoc(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    subjectId: 'nu-sub-bangla',
    chapterId: 'nu-ch-bangla-prose-pub',
    slug: 'oporichita',
    nameBn: 'অপরিচিতা',
    detailBn: 'রবীন্দ্রনাথ ঠাকুর',
    order: 1,
    syllabusSource: 'NCTB সাহিত্যপাঠ',
    syllabusVerified: false,
    status: 'draft',
    circularVersion: '2025-26',
    createdBy: 'teacher-verified',
    ...overrides,
  };
}

function lessonDoc(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    subjectId: 'nu-sub-bangla',
    chapterId: 'nu-ch-bangla-prose-pub',
    topicId: 'nu-tp-prose-01-pub',
    slug: 'oporichita',
    titleBn: 'অপরিচিতা',
    bodyBn: 'পাঠ তৈরি হচ্ছে।',
    order: 1,
    status: 'draft',
    circularVersion: '2025-26',
    createdBy: 'teacher-verified',
    ...overrides,
  };
}

describe('NU-6 syllabus rules (design §19.3.4)', () => {
  beforeAll(async () => {
    // Sanity: the emulator really loads THIS repo's rules file.
    const rules = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8');
    expect(rules).toContain('match /nuSubjects/{subjectId}');
    expect(rules).toContain('match /nuLessons/{lessonId}');
    expect(rules).toContain('isValidNuSubject');

    env = await initializeTestEnvironment({ projectId: PROJECT_ID });
    await env.withSecurityRulesDisabled(async (context) => {
      const db = toFirestoreDb(context);
      const users = [
        { uid: 'admin-1', role: 'admin', isActive: true },
        { uid: 'owner-1', role: 'owner', isActive: true },
        { uid: 'student-1', role: 'student', isActive: true },
        { uid: 'teacher-verified', role: 'teacher', verificationStatus: 'verified', isActive: true },
        { uid: 'teacher-pending', role: 'teacher', verificationStatus: 'pending', isActive: true },
      ];
      for (const u of users) {
        await setDoc(doc(db, 'users', u.uid), u);
      }
      // Published + draft seeds across the four collections.
      await setDoc(doc(db, 'nuSubjects', 'nu-sub-bangla-pub'),
        subjectDoc('nu-sub-bangla-pub', { status: 'published', createdBy: 'nu-syllabus-seed' }));
      await setDoc(doc(db, 'nuSubjects', 'nu-sub-bangla-draft-teacher'),
        subjectDoc('nu-sub-bangla-draft-teacher'));
      await setDoc(doc(db, 'nuSubjects', 'nu-sub-group-science-draft'),
        subjectDoc('nu-sub-group-science-draft', {
          slug: 'group-science', groupIds: ['science'], marks: 40, isGroupBlock: true,
          createdBy: 'nu-syllabus-seed',
        }));
      await setDoc(doc(db, 'nuSubjects', 'nu-sub-gk-pub'),
        subjectDoc('nu-sub-gk-pub', {
          slug: 'general-knowledge', nameBn: 'সাধারণ জ্ঞান',
          syllabusSource: 'সাধারণ জ্ঞান — ভর্তি প্রস্তুতি', status: 'published',
          createdBy: 'nu-syllabus-seed',
        }));
      await setDoc(doc(db, 'nuSubjects', 'nu-sub-gk-draft-seed'),
        subjectDoc('nu-sub-gk-draft-seed', {
          slug: 'general-knowledge', nameBn: 'সাধারণ জ্ঞান',
          syllabusSource: 'সাধারণ জ্ঞান — ভর্তি প্রস্তুতি', createdBy: 'nu-syllabus-seed',
        }));
      await setDoc(doc(db, 'nuChapters', 'nu-ch-bangla-prose-pub'),
        chapterDoc('nu-ch-bangla-prose-pub', { status: 'published', createdBy: 'nu-syllabus-seed' }));
      await setDoc(doc(db, 'nuChapters', 'nu-ch-bangla-poetry-draft'),
        chapterDoc('nu-ch-bangla-poetry-draft', { slug: 'poddo', nameBn: 'পদ্য', order: 2 }));
      await setDoc(doc(db, 'nuChapters', 'nu-ch-bangla-grammar-draft-seed'),
        chapterDoc('nu-ch-bangla-grammar-draft-seed', {
          slug: 'byakoron', nameBn: 'ব্যাকরণ', order: 4, createdBy: 'nu-syllabus-seed',
        }));
      await setDoc(doc(db, 'nuTopics', 'nu-tp-prose-01-pub'),
        topicDoc('nu-tp-prose-01-pub', { status: 'published', createdBy: 'nu-syllabus-seed' }));
      await setDoc(doc(db, 'nuTopics', 'nu-tp-prose-02-draft'),
        topicDoc('nu-tp-prose-02-draft', {
          slug: 'bilasi', nameBn: 'বিলাসী', detailBn: 'শরৎচন্দ্র চট্টোপাধ্যায়', order: 2,
        }));
      await setDoc(doc(db, 'nuLessons', 'nu-ls-prose-01-pub'),
        lessonDoc('nu-ls-prose-01-pub', { status: 'published', createdBy: 'nu-syllabus-seed' }));
      await setDoc(doc(db, 'nuLessons', 'nu-ls-prose-02-draft'),
        lessonDoc('nu-ls-prose-02-draft', {
          topicId: 'nu-tp-prose-02-draft', slug: 'bilasi', titleBn: 'বিলাসী',
        }));
    });

    admin = env.authenticatedContext('admin-1');
    student = env.authenticatedContext('student-1');
    teacherVerified = env.authenticatedContext('teacher-verified');
    teacherPending = env.authenticatedContext('teacher-pending');
    anonymous = env.unauthenticatedContext();
  }, 300000);

  afterAll(async () => {
    await env.cleanup();
  });

  it('n1: a student cannot create a subject', async () => {
    await assertFails(setDoc(
      doc(toFirestoreDb(student), 'nuSubjects', 'nu-sub-english-new'),
      subjectDoc('nu-sub-english-new', { slug: 'english', nameBn: 'English', createdBy: 'student-1' }),
    ));
  });

  it('n2: a student cannot create a chapter', async () => {
    await assertFails(setDoc(
      doc(toFirestoreDb(student), 'nuChapters', 'nu-ch-new'),
      chapterDoc('nu-ch-new', { createdBy: 'student-1' }),
    ));
  });

  it('n3: a student cannot create a topic', async () => {
    await assertFails(setDoc(
      doc(toFirestoreDb(student), 'nuTopics', 'nu-tp-new'),
      topicDoc('nu-tp-new', { createdBy: 'student-1' }),
    ));
  });

  it('n4: a student cannot create a lesson', async () => {
    await assertFails(setDoc(
      doc(toFirestoreDb(student), 'nuLessons', 'nu-ls-new'),
      lessonDoc('nu-ls-new', { createdBy: 'student-1' }),
    ));
  });

  it('n5: a pending (unverified) teacher cannot create a subject', async () => {
    await assertFails(setDoc(
      doc(toFirestoreDb(teacherPending), 'nuSubjects', 'nu-sub-english-new2'),
      subjectDoc('nu-sub-english-new2', { slug: 'english', nameBn: 'English', createdBy: 'teacher-pending' }),
    ));
  });

  it('n6: a student cannot update a published subject', async () => {
    await assertFails(updateDoc(
      doc(toFirestoreDb(student), 'nuSubjects', 'nu-sub-bangla-pub'),
      { nameBn: 'বাংলা (বদল)' },
    ));
  });

  it('n7: a student cannot delete a published subject', async () => {
    await assertFails(deleteDoc(doc(toFirestoreDb(student), 'nuSubjects', 'nu-sub-bangla-pub')));
  });

  it('n8: a verified teacher creates their own draft subject', async () => {
    await assertSucceeds(setDoc(
      doc(toFirestoreDb(teacherVerified), 'nuSubjects', 'nu-sub-english-t'),
      subjectDoc('nu-sub-english-t', { slug: 'english', nameBn: 'English' }),
    ));
  });

  it('n9: a verified teacher creates their own draft chapter', async () => {
    await assertSucceeds(setDoc(
      doc(toFirestoreDb(teacherVerified), 'nuChapters', 'nu-ch-bangla-grammar-t'),
      chapterDoc('nu-ch-bangla-grammar-t', { slug: 'byakoron', nameBn: 'ব্যাকরণ', order: 4 }),
    ));
  });

  it('n10: a verified teacher creates their own draft topic', async () => {
    await assertSucceeds(setDoc(
      doc(toFirestoreDb(teacherVerified), 'nuTopics', 'nu-tp-prose-03-t'),
      topicDoc('nu-tp-prose-03-t', {
        slug: 'hajar-bochor-dhore', nameBn: 'হাজার বছর ধরে',
        detailBn: 'জহির রায়হান', order: 3,
      }),
    ));
  });

  it('n11: a verified teacher creates their own draft lesson', async () => {
    await assertSucceeds(setDoc(
      doc(toFirestoreDb(teacherVerified), 'nuLessons', 'nu-ls-prose-03-t'),
      lessonDoc('nu-ls-prose-03-t', {
        topicId: 'nu-tp-prose-02-draft', slug: 'bilasi', titleBn: 'বিলাসী', order: 2,
      }),
    ));
  });

  it('n12: a verified teacher cannot create with status published', async () => {
    await assertFails(setDoc(
      doc(toFirestoreDb(teacherVerified), 'nuSubjects', 'nu-sub-english-pub-t'),
      subjectDoc('nu-sub-english-pub-t', { slug: 'english', nameBn: 'English', status: 'published' }),
    ));
  });

  it('n13: a verified teacher cannot create a common subject with marks 30', async () => {
    await assertFails(setDoc(
      doc(toFirestoreDb(teacherVerified), 'nuSubjects', 'nu-sub-bad-marks'),
      subjectDoc('nu-sub-bad-marks', { marks: 30 }),
    ));
  });

  it('n14: a verified teacher cannot create a block subject with marks 20', async () => {
    await assertFails(setDoc(
      doc(toFirestoreDb(teacherVerified), 'nuSubjects', 'nu-sub-bad-block'),
      subjectDoc('nu-sub-bad-block', {
        slug: 'group-science', groupIds: ['science'], marks: 20, isGroupBlock: true,
      }),
    ));
  });

  it('n15: a verified teacher cannot create a chapter with order 0', async () => {
    await assertFails(setDoc(
      doc(toFirestoreDb(teacherVerified), 'nuChapters', 'nu-ch-bad-order'),
      chapterDoc('nu-ch-bad-order', { order: 0 }),
    ));
  });

  it('n16: a verified teacher cannot create a topic without detailBn', async () => {
    const bad = topicDoc('nu-tp-bad-detail', { slug: 'notun', nameBn: 'নতুন' });
    delete (bad as Record<string, unknown>).detailBn;
    await assertFails(setDoc(doc(toFirestoreDb(teacherVerified), 'nuTopics', 'nu-tp-bad-detail'), bad));
  });

  it('n17: a verified teacher updates their own draft subject', async () => {
    await assertSucceeds(updateDoc(
      doc(toFirestoreDb(teacherVerified), 'nuSubjects', 'nu-sub-bangla-draft-teacher'),
      { nameBn: 'বাংলা (সংশোধিত)' },
    ));
  });

  it('n18: a verified teacher cannot update another creator’s draft subject', async () => {
    await assertFails(updateDoc(
      doc(toFirestoreDb(teacherVerified), 'nuSubjects', 'nu-sub-group-science-draft'),
      { nameBn: 'বিজ্ঞান (বদল)' },
    ));
  });

  it('n19: a verified teacher cannot publish their own draft', async () => {
    await assertFails(updateDoc(
      doc(toFirestoreDb(teacherVerified), 'nuSubjects', 'nu-sub-bangla-draft-teacher'),
      { status: 'published' },
    ));
  });

  it('n20: an admin creates a valid subject', async () => {
    await assertSucceeds(setDoc(
      doc(toFirestoreDb(admin), 'nuSubjects', 'nu-sub-english-a'),
      subjectDoc('nu-sub-english-a', { slug: 'english', nameBn: 'English', createdBy: 'admin-1' }),
    ));
  });

  it('n21: an admin creates a valid chapter', async () => {
    await assertSucceeds(setDoc(
      doc(toFirestoreDb(admin), 'nuChapters', 'nu-ch-bangla-grammar-a'),
      chapterDoc('nu-ch-bangla-grammar-a', {
        slug: 'byakoron', nameBn: 'ব্যাকরণ', order: 4, createdBy: 'admin-1',
      }),
    ));
  });

  it('n22: an admin creates a valid topic', async () => {
    await assertSucceeds(setDoc(
      doc(toFirestoreDb(admin), 'nuTopics', 'nu-tp-prose-03-a'),
      topicDoc('nu-tp-prose-03-a', {
        slug: 'hajar-bochor-dhore', nameBn: 'হাজার বছর ধরে',
        detailBn: 'জহির রায়হান', order: 3, createdBy: 'admin-1',
      }),
    ));
  });

  it('n23: an admin creates a valid lesson', async () => {
    await assertSucceeds(setDoc(
      doc(toFirestoreDb(admin), 'nuLessons', 'nu-ls-prose-03-a'),
      lessonDoc('nu-ls-prose-03-a', {
        topicId: 'nu-tp-prose-02-draft', slug: 'bilasi', titleBn: 'বিলাসী',
        order: 2, createdBy: 'admin-1',
      }),
    ));
  });

  it('n24: an admin cannot create a subject with an unknown slug', async () => {
    await assertFails(setDoc(
      doc(toFirestoreDb(admin), 'nuSubjects', 'nu-sub-bad-slug'),
      subjectDoc('nu-sub-bad-slug', { slug: 'math', createdBy: 'admin-1' }),
    ));
  });

  it('n25: an admin cannot create a subject with a bad groupIds entry', async () => {
    await assertFails(setDoc(
      doc(toFirestoreDb(admin), 'nuSubjects', 'nu-sub-bad-group'),
      subjectDoc('nu-sub-bad-group', { groupIds: ['humanities', 'medical'], createdBy: 'admin-1' }),
    ));
  });

  it('n26: an admin publishes a draft subject', async () => {
    await assertSucceeds(updateDoc(
      doc(toFirestoreDb(admin), 'nuSubjects', 'nu-sub-gk-draft-seed'),
      { status: 'published' },
    ));
  });

  it('n27: an admin cannot update a published subject in place', async () => {
    await assertFails(updateDoc(
      doc(toFirestoreDb(admin), 'nuSubjects', 'nu-sub-bangla-pub'),
      { nameBn: 'বাংলা (বদল)' },
    ));
  });

  it('n28: a student reads a published subject', async () => {
    await assertSucceeds(getDoc(doc(toFirestoreDb(student), 'nuSubjects', 'nu-sub-bangla-pub')));
  });

  it('n29: a student cannot read a draft subject', async () => {
    await assertFails(getDoc(doc(toFirestoreDb(student), 'nuSubjects', 'nu-sub-bangla-draft-teacher')));
  });

  it('n30: a signed-out visitor reads a published topic', async () => {
    await assertSucceeds(getDoc(doc(toFirestoreDb(anonymous), 'nuTopics', 'nu-tp-prose-01-pub')));
  });

  it('n31: a signed-out visitor cannot read a draft topic', async () => {
    await assertFails(getDoc(doc(toFirestoreDb(anonymous), 'nuTopics', 'nu-tp-prose-02-draft')));
  });

  it('n32: a verified teacher reads their own draft chapter', async () => {
    await assertSucceeds(getDoc(doc(toFirestoreDb(teacherVerified), 'nuChapters', 'nu-ch-bangla-poetry-draft')));
  });

  it('n33: a verified teacher cannot read another creator’s draft chapter', async () => {
    await assertFails(getDoc(doc(toFirestoreDb(teacherVerified), 'nuChapters', 'nu-ch-bangla-grammar-draft-seed')));
  });

  it('n34: an admin reads a draft lesson', async () => {
    await assertSucceeds(getDoc(doc(toFirestoreDb(admin), 'nuLessons', 'nu-ls-prose-02-draft')));
  });

  it('n35: an admin cannot delete a draft lesson', async () => {
    await assertFails(deleteDoc(doc(toFirestoreDb(admin), 'nuLessons', 'nu-ls-prose-02-draft')));
  });

  it('n36: a student cannot delete a draft lesson', async () => {
    await assertFails(deleteDoc(doc(toFirestoreDb(student), 'nuLessons', 'nu-ls-prose-02-draft')));
  });
});
