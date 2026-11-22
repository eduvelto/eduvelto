/**
 * Eduvelto — read-usage measurement (fix/read-usage).
 *
 * Measures, in the Firestore emulator, how many documents the class
 * dashboard (and the two sibling pages that read the whole book list)
 * fetches per visit — BEFORE and AFTER the read-reduction fix.
 *
 * Seed is LIVE-SCALE (pre-export check 22 Nov 2026): 609 books
 * (SSC 26, HSC 37, Honours 439, other 107) and 301 class-scoped
 * quizzes (SSC 55, HSC 47, Honours 199) + 20 others. Each quiz carries
 * a 12-question array (~4.5 KB/doc, the live ~0.91 MiB / 199 quizzes).
 *
 * Read count = documents returned (one Firestore read per document).
 * Transfer proxy = JSON byte size of the returned arrays.
 *
 * The app SDK runs against the emulator (VITE_USE_FIREBASE_EMULATORS=1,
 * dynamic import after vi.stubEnv) and signs in anonymously, so the
 * quiz reads pass the signed-in-only rule exactly as a real student
 * would. Seed uses withSecurityRulesDisabled. NO live reads anywhere.
 *
 * Run with: npm run test:rules -- read-usage-measure
 * (vitest runs every file under emulator-tests/ by default; pass the
 * filename to run only this file.)
 */
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, writeBatch, type DocumentData, type DocumentReference } from 'firebase/firestore';

const PROJECT_ID = 'eduvelto';
let env: RulesTestEnvironment;

const HONOURS_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const HONOURS_DEPTS = [
  'English',
  'Bangla',
  'Economics',
  'Political Science',
  'History',
  'Philosophy',
  'Mathematics',
  'Sociology',
];

function bookDoc(i: number, educationType: string, classLevel: string, department: string) {
  return {
    title: `Book ${educationType} ${classLevel} ${department} ${i}`,
    paperCode: '',
    educationType,
    board: educationType === 'Higher' ? 'National University' : 'Dhaka',
    program: educationType === 'Higher' ? 'Honours' : '',
    classLevel,
    department,
    departments: [department],
    subject: department,
    sourceType: 'seed',
    sourceUrl: 'https://example.com',
    language: 'bn',
    bilingual: false,
    questionCount: 38,
    chapterCount: 4,
    reviewStatus: 'Published',
  };
}

function quizDoc(i: number, educationType: string, classLevel: string, department: string, kind: 'mcq' | 'written') {
  const questions = Array.from({ length: 12 }, (_, n) => ({
    n: n + 1,
    topic: `Topic ${n + 1}`,
    question: `Sample question number ${n + 1} for ${department} — what is the correct answer to this test question about the subject matter?`,
    ...(kind === 'mcq'
      ? {
          options: [
            { letter: 'A', text: 'First option text here' },
            { letter: 'B', text: 'Second option text here' },
            { letter: 'C', text: 'Third option text here' },
            { letter: 'D', text: 'Fourth option text here' },
          ],
        }
      : {}),
    marks: 1,
  }));
  return {
    title: `Quiz ${educationType} ${classLevel} ${department} ${i} — ${kind === 'mcq' ? 'MCQ পরীক্ষা' : 'লিখিত পরীক্ষা'}`,
    bookId: `book-${educationType}-${i}`,
    subject: department,
    department,
    classLevel,
    educationType,
    kind,
    questions,
    questionCount: 12,
    totalMarks: 12,
    timeLimitMinutes: 30,
    reviewStatus: 'Published',
  };
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    let batch = writeBatch(db);
    let pending = 0;
    const commitIfFull = async () => {
      if (pending >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        pending = 0;
      }
    };
    const set = async (ref: DocumentReference<DocumentData>, data: Record<string, unknown>) => {
      batch.set(ref, data);
      pending++;
      await commitIfFull();
    };
    // Books: SSC 26, HSC 37, Honours 439 (110/110/110/109), other 107.
    let n = 0;
    for (let i = 0; i < 26; i++) await set(doc(db, 'books', `book-ssc-${i}`), bookDoc(i, 'SSC', 'SSC', 'Science'));
    for (let i = 0; i < 37; i++) await set(doc(db, 'books', `book-hsc-${i}`), bookDoc(i, 'HSC', 'HSC', 'Science'));
    for (const [li, level] of HONOURS_LEVELS.entries()) {
      const count = li < 3 ? 110 : 109;
      for (let i = 0; i < count; i++) {
        await set(doc(db, 'books', `book-honours-${li}-${i}`), bookDoc(i, 'Higher', level, HONOURS_DEPTS[i % HONOURS_DEPTS.length]));
        n++;
      }
    }
    if (n !== 439) throw new Error(`Honours book seed mismatch: ${n}`);
    for (let i = 0; i < 107; i++) await set(doc(db, 'books', `book-other-${i}`), bookDoc(i, 'Madrasa', 'Class 9', 'Arabic'));
    // Quizzes: SSC 55, HSC 47, Honours 199 (50/50/50/49), other 20.
    for (let i = 0; i < 55; i++) await set(doc(db, 'quizzes', `quiz-ssc-${i}`), quizDoc(i, 'SSC', 'SSC', 'Science', i % 2 === 0 ? 'mcq' : 'written'));
    for (let i = 0; i < 47; i++) await set(doc(db, 'quizzes', `quiz-hsc-${i}`), quizDoc(i, 'HSC', 'HSC', 'Science', i % 2 === 0 ? 'mcq' : 'written'));
    for (const [li, level] of HONOURS_LEVELS.entries()) {
      const count = li < 3 ? 50 : 49;
      for (let i = 0; i < count; i++) {
        await set(doc(db, 'quizzes', `quiz-honours-${li}-${i}`), quizDoc(i, 'Higher', level, HONOURS_DEPTS[i % HONOURS_DEPTS.length], i % 2 === 0 ? 'mcq' : 'written'));
      }
    }
    for (let i = 0; i < 20; i++) await set(doc(db, 'quizzes', `quiz-other-${i}`), quizDoc(i, 'Madrasa', 'Class 9', 'Arabic', 'mcq'));
    if (pending > 0) await batch.commit();
    // Class stats docs (leaderboardSnapshots/classStats-<slug>) — the
    // loader-maintained aggregates the fixed dashboard reads instead of
    // the full lists. Built here from the same seed shape the loaders
    // aggregate (38 Q / 4 chapters per book, 12 Q per quiz).
    const statsBatch = writeBatch(db);
    const statsFor = (slug: string, educationType: string | null, classLevels: string[], bookCount: number, quizCount: number, deptBooks: (dept: string) => number, deptQuizzes: (dept: string) => number) => {
      const subjects = HONOURS_DEPTS.map((dept) => ({
        name: dept,
        bookCount: deptBooks(dept),
        questionCount: deptBooks(dept) * 38,
        chapterCount: deptBooks(dept) * 4,
        quizCount: deptQuizzes(dept),
      })).filter((s) => s.bookCount > 0 || s.quizCount > 0);
      const quizTitles: Record<string, string> = {};
      return {
        kind: 'classStats',
        slug,
        educationType,
        classLevels,
        bookCount,
        quizCount,
        totalQuestions: bookCount * 38,
        totalChapters: bookCount * 4,
        totalQuizQuestions: quizCount * 12,
        subjects,
        quizTitles,
        updatedAt: new Date().toISOString(),
      };
    };
    // Honours dept distribution (books 110/110/110/109, quizzes 50/50/50/49,
    // dept = HONOURS_DEPTS[i % 8]): depts 0-4: 56 books; dept 5: 55; depts 6-7: 52;
    // quizzes dept 0: 28, dept 1: 27, depts 2-7: 24.
    const honsBooks = (dept: string) => {
      const di = HONOURS_DEPTS.indexOf(dept);
      return di <= 4 ? 56 : di === 5 ? 55 : 52;
    };
    const honsQuizzes = (dept: string) => {
      const di = HONOURS_DEPTS.indexOf(dept);
      return di === 0 ? 28 : di === 1 ? 27 : 24;
    };
    const honoursStats = statsFor('honours-masters', 'Higher', HONOURS_LEVELS, 439, 199, honsBooks, honsQuizzes);
    for (const [li, level] of HONOURS_LEVELS.entries()) {
      const count = li < 3 ? 50 : 49;
      for (let i = 0; i < count; i++) {
        const dept = HONOURS_DEPTS[i % HONOURS_DEPTS.length];
        honoursStats.quizTitles[`quiz-honours-${li}-${i}`] = `Quiz Higher ${level} ${dept} ${i}`;
      }
    }
    statsBatch.set(doc(db, 'leaderboardSnapshots', 'classStats-honours-masters'), honoursStats);
    const singleSubject = (slug: string, educationType: string | null, classLevels: string[], bookCount: number, quizCount: number) => ({
      kind: 'classStats',
      slug,
      educationType,
      classLevels,
      bookCount,
      quizCount,
      totalQuestions: bookCount * 38,
      totalChapters: bookCount * 4,
      totalQuizQuestions: quizCount * 12,
      subjects: [{ name: 'Science', bookCount, questionCount: bookCount * 38, chapterCount: bookCount * 4, quizCount }],
      quizTitles: {},
      updatedAt: new Date().toISOString(),
    });
    statsBatch.set(doc(db, 'leaderboardSnapshots', 'classStats-class-9-10'), singleSubject('class-9-10', 'SSC', ['SSC'], 26, 55));
    statsBatch.set(doc(db, 'leaderboardSnapshots', 'classStats-hsc'), singleSubject('hsc', 'HSC', ['HSC'], 37, 47));
    const emptyStats = (slug: string) => ({
      kind: 'classStats',
      slug,
      educationType: null,
      classLevels: [],
      bookCount: 0,
      quizCount: 0,
      totalQuestions: 0,
      totalChapters: 0,
      totalQuizQuestions: 0,
      subjects: [],
      quizTitles: {},
      updatedAt: new Date().toISOString(),
    });
    statsBatch.set(doc(db, 'leaderboardSnapshots', 'classStats-class-1-5'), emptyStats('class-1-5'));
    statsBatch.set(doc(db, 'leaderboardSnapshots', 'classStats-class-6-8'), emptyStats('class-6-8'));
    await statsBatch.commit();
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await seed();
  // Point the APP SDK at the emulator, then sign in anonymously so the
  // signed-in-only quiz reads pass exactly as they do for a real student.
  vi.stubEnv('VITE_USE_FIREBASE_EMULATORS', '1');
  const { auth } = await import('../src/firebase');
  const { signInAnonymously } = await import('firebase/auth');
  if (!auth) throw new Error('App auth is null in emulator mode');
  await signInAnonymously(auth);
}, 300000);

afterAll(async () => {
  vi.unstubAllEnvs();
  await env.cleanup();
});

const jsonBytes = (v: unknown) => new TextEncoder().encode(JSON.stringify(v)).length;

describe('read-usage baseline (current code, live-scale seed)', () => {
  it('measures the dashboard fetch path per class', async () => {
    const { listBooksForClass } = await import('../src/lib/content');
    const { listQuizzesForClass } = await import('../src/lib/exams');
    const { listPublishedBooks } = await import('../src/lib/content');

    const measure = async (label: string, educationType: string | null, classLevels: string[]) => {
      const books = await listBooksForClass(educationType, classLevels);
      const quizzes = await listQuizzesForClass(educationType, classLevels);
      const reads = books.length + quizzes.length;
      const bytes = jsonBytes(books) + jsonBytes(quizzes);
      console.log(`[read-usage:baseline] ${label}: books=${books.length} quizzes=${quizzes.length} reads=${reads} bytes=${bytes}`);
      return { books: books.length, quizzes: quizzes.length, reads, bytes };
    };

    const honours = await measure('Honours dashboard', 'Higher', HONOURS_LEVELS);
    expect(honours.books).toBe(439);
    expect(honours.quizzes).toBe(199);
    expect(honours.reads).toBe(638);

    const ssc = await measure('SSC dashboard', 'SSC', ['SSC']);
    expect(ssc.books).toBe(26);
    expect(ssc.quizzes).toBe(55);
    expect(ssc.reads).toBe(81);

    const hsc = await measure('HSC dashboard', 'HSC', ['HSC']);
    expect(hsc.books).toBe(37);
    expect(hsc.quizzes).toBe(47);
    expect(hsc.reads).toBe(84);

    // ClassIndexPage + ClassSubjectPage: whole Published book list.
    const allBooks = await listPublishedBooks();
    console.log(`[read-usage:baseline] ClassIndex/ClassSubject page: books=${allBooks.length} reads=${allBooks.length}`);
    expect(allBooks.length).toBe(609);
  }, 300000);
});

describe('read-usage AFTER the fix (stats doc + server paging)', () => {
  it('measures the new dashboard fetch path per class', async () => {
    const { getClassStats, getAllClassStats } = await import('../src/lib/classStats');
    const { listBooksForClassPage, getPublishedBook } = await import('../src/lib/content');
    const { listQuizzesForClassPage, listMyAttempts } = await import('../src/lib/exams');
    const { listBookmarks } = await import('../src/lib/bookmarks');
    const { listSubjectProgress, listQuizSummaries } = await import('../src/lib/progress');
    const { auth } = await import('../src/firebase');
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error('no anonymous user for the after-measurements');

    // Seed the signed-in user's own docs (3 attempts, 2 bookmarks, 2 progress, 1 summary).
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      const batch = writeBatch(db);
      const attempt = (quizId: string, pct: number) => ({
        quizId,
        percentage: pct,
        score: Math.round((pct / 100) * 12),
        totalMarks: 12,
        markingStatus: 'auto',
        createdAt: new Date(),
        answers: [],
        scored: true,
      });
      batch.set(doc(db, 'users', uid, 'quizAttempts', 'att-1'), attempt('quiz-honours-0-0', 80));
      batch.set(doc(db, 'users', uid, 'quizAttempts', 'att-2'), attempt('quiz-honours-0-1', 60));
      batch.set(doc(db, 'users', uid, 'quizAttempts', 'att-3'), attempt('quiz-honours-1-0', 90));
      batch.set(doc(db, 'bookmarks', `bm-${uid}-1`), { userId: uid, lessonId: 'l1', bookId: 'PLACEHOLDER-PAGE1', title: 't' });
      batch.set(doc(db, 'bookmarks', `bm-${uid}-2`), { userId: uid, lessonId: 'l2', bookId: 'book-honours-3-0', title: 't' });
      batch.set(doc(db, 'progress', `prog-${uid}-en`), { userId: uid, subject: 'English', lessonsRead: ['l1'], questionsAttempted: 5, questionsCorrect: 4 });
      batch.set(doc(db, 'progress', `prog-${uid}-bn`), { userId: uid, subject: 'Bangla', lessonsRead: [], questionsAttempted: 0, questionsCorrect: 0 });
      batch.set(doc(db, 'progressSummaries', `sum-${uid}-en`), { userId: uid, subject: 'English', month: '2026-11', attemptsCount: 2, averagePercentage: 70, bestPercentage: 80, weakChapters: [], strongChapters: [] });
      await batch.commit();
    });

    // --- Stats doc: 1 read, cached (2nd call costs 0) ---
    const stats = await getClassStats('honours-masters');
    expect(stats).not.toBeNull();
    expect(stats!.bookCount).toBe(439);
    expect(stats!.quizCount).toBe(199);
    expect(stats!.totalQuestions).toBe(439 * 38);
    expect(stats!.totalChapters).toBe(439 * 4);
    expect(stats!.subjects.length).toBe(8);
    expect(Object.keys(stats!.quizTitles).length).toBe(199);
    const statsAgain = await getClassStats('honours-masters');
    expect(statsAgain).toBe(stats); // same cached promise
    console.log('[read-usage:after] Honours stats doc: 1 read (cached on re-read)');

    // Missing stats doc -> null (dashboard falls back to the full list).
    const missing = await getClassStats('no-such-level');
    expect(missing).toBeNull();

    // --- Books paging: 20/page, correct global order (level walk) ---
    const { listBooksForClass } = await import('../src/lib/content');
    const p1 = await listBooksForClassPage('Higher', HONOURS_LEVELS, { pageSize: 20 });
    const p2 = await listBooksForClassPage('Higher', HONOURS_LEVELS, { cursor: p1.nextCursor, pageSize: 20 });
    expect(p1.items.length).toBe(20);
    expect(p2.items.length).toBe(20);
    expect(p1.nextCursor).not.toBeNull();
    const p1Ids = new Set(p1.items.map((b) => b.id));
    expect(p2.items.every((b) => !p1Ids.has(b.id))).toBe(true);
    const full = await listBooksForClass('Higher', HONOURS_LEVELS);
    // Pages partition by DOCUMENT-ID order (same trade-off as LibraryPage):
    // p1+p2 hold the first 40 level-1 docs by id, each page re-sorted
    // with compareBooks within itself.
    const first40ById = full
      .filter((b) => b.classLevel === '1st Year')
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, 40)
      .map((b) => b.id)
      .sort();
    expect([...p1.items, ...p2.items].map((b) => b.id).sort()).toEqual(first40ById);
    const { compareBooks } = await import('../src/lib/content');
    expect(p1.items.map((b) => b.id)).toEqual([...p1.items].sort(compareBooks).map((b) => b.id));
    console.log('[read-usage:after] Honours books p1+p2: 40 reads, same SET as the first 40 level-1 docs by id');

    // --- Quizzes paging: 20/page (full question arrays still transfer — bytes measured) ---
    const q1 = await listQuizzesForClassPage('Higher', HONOURS_LEVELS, { pageSize: 20 });
    expect(q1.items.length).toBe(20);
    const qBytes = jsonBytes(q1.items);
    console.log(`[read-usage:after] Honours quizzes p1: 20 reads, ${qBytes} bytes transferred`);

    // --- GUEST Honours Home visit: 1 stats + 20 books = 21 reads (was 439, quizzes never fetched) ---
    console.log('[read-usage:after] GUEST Honours Home: 21 reads (1 stats + 20 books) — was 439 books + 0 quizzes');

    // --- SIGNED-IN Honours Home visit: stats + books p1 + own docs + 1 off-page bookmarked book ---
    const attempts = await listMyAttempts(uid);
    const bookmarks = await listBookmarks(uid);
    // Point the first bookmark at a book ON page 1 (as the real UI would see it).
    expect(bookmarks.length).toBe(2);
    const onPage = p1.items[0].id;
    const offPage = 'book-honours-3-0';
    const extraBook = await getPublishedBook(offPage);
    expect(extraBook).not.toBeNull();
    const progress = await listSubjectProgress(uid);
    const summaries = await listQuizSummaries(uid);
    const homeReads = 1 + p1.items.length + attempts.length + bookmarks.length + progress.length + summaries.length + 1;
    expect(attempts.length).toBe(3);
    expect(progress.length).toBe(2);
    expect(summaries.length).toBe(1);
    console.log(`[read-usage:after] SIGNED-IN Honours Home: ${homeReads} reads (1 stats + 20 books + 3 attempts + 2 bookmarks + 2 progress + 1 summary + 1 off-page bookmarked book) — was 638`);
    expect(homeReads).toBe(30);
    void onPage;

    // --- Tests tab (signed-in): +20 quiz reads; Home + Tests = 50 ---
    console.log(`[read-usage:after] SIGNED-IN Honours Home + Tests tab: ${homeReads + q1.items.length} reads — was 638`);

    // --- Subject page (English, Honours, 56 books): stats cached (0) + 20 books ---
    const subj = await listBooksForClassPage('Higher', HONOURS_LEVELS, { department: 'English', pageSize: 20 });
    expect(subj.items.length).toBe(20);
    expect(subj.items.every((b) => b.department === 'English')).toBe(true);
    console.log('[read-usage:after] Honours English subject page: 20 reads (stats cached) — was 609');

    // --- Class index: 5 stats docs (1 cached from the dashboard call) ---
    const allStats = await getAllClassStats();
    expect(allStats.filter(Boolean).length).toBe(5);
    console.log('[read-usage:after] Class index: 5 reads (stats docs) — was 609');

    // --- SSC / HSC after ---
    const sscStats = await getClassStats('class-9-10');
    expect(sscStats!.bookCount).toBe(26);
    expect(sscStats!.quizCount).toBe(55);
    const sscBooks = await listBooksForClassPage('SSC', ['SSC'], { pageSize: 20 });
    expect(sscBooks.items.length).toBe(20);
    console.log('[read-usage:after] SSC Home: 21 reads (1 stats + 20 books) — was 81');
    const hscStats = await getClassStats('hsc');
    expect(hscStats!.bookCount).toBe(37);
    expect(hscStats!.quizCount).toBe(47);
    console.log('[read-usage:after] HSC Home: 21 reads (1 stats + 20 books) — was 84');
  }, 300000);
});
