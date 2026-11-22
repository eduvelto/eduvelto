/**
 * Eduvelto Firestore security-rules tests — AUTH GATING (owner
 * instruction 22 Nov 2026 ~10:33, BINDING).
 *
 * What this suite proves (expected results are in the test names):
 *   - A signed-out visitor (anonymous) CANNOT read exam questions:
 *     no single-quiz read, no quiz list query, no attempt create.
 *   - A signed-out visitor CAN read a Published book (metadata stays
 *     public) and CAN read a preview chapter/lesson (isPreview == true).
 *   - A signed-out visitor CANNOT read a non-preview chapter/lesson —
 *     including one whose isPreview field is simply ABSENT (every live
 *     chapter/lesson today), and including a DRAFT chapter/lesson even
 *     when it is flagged isPreview.
 *   - A signed-in student CAN read Published quizzes, non-preview
 *     chapters/lessons, and CAN create their own attempts (and nobody
 *     else's).
 *   - The guest chapter-list query (bookId + reviewStatus + isPreview)
 *     succeeds and returns ONLY the preview chapter; the unfiltered
 *     guest query fails outright (rules never filter — they allow or
 *     deny the whole query).
 *
 * RUN IT: `npm run test:rules` (emulator, never live). Same setup notes
 * as rules.test.ts — the emulator loads firestore.rules from
 * firebase.json; do NOT pass the `rules:` option to
 * initializeTestEnvironment (http2 exception in this environment).
 * All doc ids use the `ag-` prefix so this file never collides with the
 * other suites sharing the emulator project.
 */
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
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
  getDocs,
  collection,
  query,
  where,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'ag-student-1'), {
      displayName: 'AG Student One',
      email: 'ag-student1@example.com',
      role: 'student',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'users', 'ag-student-2'), {
      displayName: 'AG Student Two',
      email: 'ag-student2@example.com',
      role: 'student',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'users', 'ag-admin-1'), {
      displayName: 'AG Admin',
      email: 'ag-admin@example.com',
      role: 'admin',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'users', 'ag-moderator-1'), {
      displayName: 'AG Moderator',
      email: 'ag-moderator@example.com',
      role: 'moderator',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'books', 'ag-book1'), {
      title: 'AG Test Book',
      paperCode: 'AG-101',
      educationType: 'honours',
      board: '',
      program: 'Honours',
      classLevel: '1st Year',
      department: 'English',
      departments: ['English'],
      subject: 'English',
      sourceType: 'original-eduvelto',
      sourceUrl: '',
      language: 'bn',
      bilingual: true,
      questionCount: 10,
      chapterCount: 3,
      reviewStatus: 'Published',
    });
    // Preview chapter: the book's first chapter (isPreview == true).
    await setDoc(doc(db, 'chapters', 'ag-ch-preview'), {
      bookId: 'ag-book1',
      title: 'AG Preview Chapter',
      part: 'A',
      set: 1,
      order: 1,
      questionCount: 4,
      reviewStatus: 'Published',
      isPreview: true,
    });
    // Non-preview chapter: NO isPreview field — exactly like every
    // live chapter today (missing must mean NOT a preview).
    await setDoc(doc(db, 'chapters', 'ag-ch-full'), {
      bookId: 'ag-book1',
      title: 'AG Full Chapter',
      part: 'B',
      set: 1,
      order: 2,
      questionCount: 6,
      reviewStatus: 'Published',
    });
    // Draft chapter flagged preview: preview must never open a draft.
    await setDoc(doc(db, 'chapters', 'ag-ch-draft-preview'), {
      bookId: 'ag-book1',
      title: 'AG Draft Preview Chapter',
      part: 'C',
      set: 1,
      order: 3,
      questionCount: 0,
      reviewStatus: 'Under Review',
      isPreview: true,
    });
    await setDoc(doc(db, 'lessons', 'ag-ch-preview'), {
      bookId: 'ag-book1',
      chapterId: 'ag-ch-preview',
      title: 'AG Preview Chapter',
      part: 'A',
      set: 1,
      body: 'AG preview lesson body.',
      questions: [],
      questionCount: 4,
      reviewStatus: 'Published',
      isPreview: true,
    });
    await setDoc(doc(db, 'lessons', 'ag-ch-full'), {
      bookId: 'ag-book1',
      chapterId: 'ag-ch-full',
      title: 'AG Full Chapter',
      part: 'B',
      set: 1,
      body: 'AG full lesson body.',
      questions: [],
      questionCount: 6,
      reviewStatus: 'Published',
    });
    await setDoc(doc(db, 'lessons', 'ag-ch-draft-preview'), {
      bookId: 'ag-book1',
      chapterId: 'ag-ch-draft-preview',
      title: 'AG Draft Preview Chapter',
      part: 'C',
      set: 1,
      body: 'AG draft lesson body.',
      questions: [],
      questionCount: 0,
      reviewStatus: 'Under Review',
      isPreview: true,
    });
    await setDoc(doc(db, 'quizzes', 'ag-quiz1'), {
      title: 'AG Test Quiz — MCQ পরীক্ষা',
      bookId: 'ag-book1',
      subject: 'English',
      department: 'English',
      classLevel: '1st Year',
      educationType: 'honours',
      kind: 'mcq',
      questions: [
        { n: 1, topic: 'Drama', question: 'Who wrote Macbeth?', options: [{ letter: 'A', text: 'Marlowe' }, { letter: 'B', text: 'Shakespeare' }], marks: 1 },
      ],
      questionCount: 1,
      totalMarks: 1,
      timeLimitMinutes: 30,
      reviewStatus: 'Published',
    });
    await setDoc(doc(db, 'quizzes', 'ag-quiz-draft'), {
      title: 'AG Draft Quiz',
      bookId: 'ag-book1',
      subject: 'English',
      department: 'English',
      classLevel: '1st Year',
      educationType: 'honours',
      kind: 'mcq',
      questions: [],
      questionCount: 0,
      totalMarks: 0,
      timeLimitMinutes: 30,
      reviewStatus: 'Under Review',
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    // NOTE: no `rules:` option — see the header comment of rules.test.ts.
    firestore: { host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await seed();
}, 300000); // 300s: first Firestore ops on a cold emulator take ~2s each in this sandbox

afterAll(async () => {
  await env.cleanup();
});

const unauth = () => env.unauthenticatedContext().firestore();
const asStudent1 = () => env.authenticatedContext('ag-student-1').firestore();
const asModerator = () => env.authenticatedContext('ag-moderator-1').firestore();

describe('auth gating — exams (owner instruction 22 Nov 2026)', () => {
  it('ag-e1 DENIED: anonymous CANNOT read a Published quiz (questions must never reach a signed-out browser)', async () => {
    await assertFails(getDoc(doc(unauth(), 'quizzes', 'ag-quiz1')));
  });

  it('ag-e2 DENIED: anonymous CANNOT list Published quizzes', async () => {
    await assertFails(
      getDocs(query(collection(unauth(), 'quizzes'), where('reviewStatus', '==', 'Published'))),
    );
  });

  it('ag-e3 ALLOWED: signed-in student CAN read a Published quiz', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'quizzes', 'ag-quiz1')));
  });

  it('ag-e4 ALLOWED: signed-in student CAN list Published quizzes', async () => {
    const snap = await assertSucceeds(
      getDocs(query(collection(asStudent1(), 'quizzes'), where('reviewStatus', '==', 'Published'))),
    );
    expect(snap.docs.some((d) => d.id === 'ag-quiz1')).toBe(true);
  });

  it('ag-e5 ALLOWED: moderator CAN read a Published quiz (staff path intact)', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'quizzes', 'ag-quiz1')));
  });

  it('ag-e6 DENIED: anonymous CANNOT create a quiz attempt', async () => {
    await assertFails(
      setDoc(doc(unauth(), 'users', 'ag-student-1', 'quizAttempts', 'ag-attempt-1'), {
        quizId: 'ag-quiz1',
        answers: [],
        score: 0,
        totalMarks: 1,
        percentage: 0,
      }),
    );
  });

  it('ag-e7 ALLOWED: signed-in student CAN create their OWN quiz attempt', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'ag-student-1', 'quizAttempts', 'ag-attempt-1'), {
        quizId: 'ag-quiz1',
        kind: 'mcq',
        answers: [],
        score: 0,
        totalMarks: 1,
        percentage: 0,
        markingStatus: 'auto',
        scored: false,
        status: 'submitted',
        userId: 'ag-student-1',
      }),
    );
  });

  it('ag-e8 DENIED: signed-in student CANNOT create another student’s attempt', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'ag-student-2', 'quizAttempts', 'ag-attempt-2'), {
        quizId: 'ag-quiz1',
        answers: [],
        score: 0,
        totalMarks: 1,
        percentage: 0,
      }),
    );
  });
});

describe('auth gating — reading: preview chapters/lessons', () => {
  it('ag-r1 ALLOWED: anonymous CAN read a preview chapter (isPreview == true)', async () => {
    await assertSucceeds(getDoc(doc(unauth(), 'chapters', 'ag-ch-preview')));
  });

  it('ag-r2 DENIED: anonymous CANNOT read a non-preview chapter (isPreview field ABSENT — the live case)', async () => {
    await assertFails(getDoc(doc(unauth(), 'chapters', 'ag-ch-full')));
  });

  it('ag-r3 DENIED: anonymous CANNOT read a DRAFT chapter even when it is flagged isPreview', async () => {
    await assertFails(getDoc(doc(unauth(), 'chapters', 'ag-ch-draft-preview')));
  });

  it('ag-r4 ALLOWED: anonymous CAN read a preview lesson', async () => {
    await assertSucceeds(getDoc(doc(unauth(), 'lessons', 'ag-ch-preview')));
  });

  it('ag-r5 DENIED: anonymous CANNOT read a non-preview lesson', async () => {
    await assertFails(getDoc(doc(unauth(), 'lessons', 'ag-ch-full')));
  });

  it('ag-r6 DENIED: anonymous CANNOT read a DRAFT lesson even when it is flagged isPreview', async () => {
    await assertFails(getDoc(doc(unauth(), 'lessons', 'ag-ch-draft-preview')));
  });

  it('ag-r7 ALLOWED: signed-in student CAN read a non-preview chapter AND lesson', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'chapters', 'ag-ch-full')));
    await assertSucceeds(getDoc(doc(asStudent1(), 'lessons', 'ag-ch-full')));
  });

  it('ag-r8 ALLOWED: anonymous CAN read a Published book (metadata stays public)', async () => {
    await assertSucceeds(getDoc(doc(unauth(), 'books', 'ag-book1')));
  });

  it('ag-r9 ALLOWED: guest preview-only chapter query returns ONLY the preview chapter', async () => {
    const snap = await assertSucceeds(
      getDocs(
        query(
          collection(unauth(), 'chapters'),
          where('bookId', '==', 'ag-book1'),
          where('reviewStatus', '==', 'Published'),
          where('isPreview', '==', true),
        ),
      ),
    );
    expect(snap.docs.map((d) => d.id)).toEqual(['ag-ch-preview']);
  });

  it('ag-r10 DENIED: guest chapter query WITHOUT the isPreview filter fails outright (rules never filter)', async () => {
    await assertFails(
      getDocs(
        query(
          collection(unauth(), 'chapters'),
          where('bookId', '==', 'ag-book1'),
          where('reviewStatus', '==', 'Published'),
        ),
      ),
    );
  });

  it('ag-r11 ALLOWED: signed-in student chapter query returns both Published chapters', async () => {
    const snap = await assertSucceeds(
      getDocs(
        query(
          collection(asStudent1(), 'chapters'),
          where('bookId', '==', 'ag-book1'),
          where('reviewStatus', '==', 'Published'),
        ),
      ),
    );
    expect(snap.docs.map((d) => d.id).sort()).toEqual(['ag-ch-full', 'ag-ch-preview']);
  });
});
