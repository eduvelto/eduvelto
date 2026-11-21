/**
 * Eduvelto Firestore security-rules tests — Phase 2 Step 2 (library).
 *
 * Covers: books / chapters / lessons / educationDirectory (Published-only
 * public reads; teacher creates drafts only; only Moderator/Admin can
 * publish) and contactMessages (signed-in create only, owner/admin read
 * only, append-only). Same conventions as rules.test.ts: the emulator
 * loads firestore.rules from firebase.json at startup; this file only
 * sanity-checks the file exists. Run with `npm run test:rules` (runs the
 * whole emulator-tests/ directory). Uses its own project id so it never
 * shares data with rules.test.ts when vitest runs files in parallel.
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-step2';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['admin-1', 'admin'],
      ['owner-1', 'owner'],
      ['moderator-1', 'moderator'],
      ['teacher-1', 'teacher'],
      ['student-1', 'student'],
      ['student-2', 'student'],
      ['suspended-1', 'student'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: uid !== 'suspended-1',
      });
    }
    const published = { title: 'Published item', reviewStatus: 'Published' };
    const draft = { title: 'Draft item', reviewStatus: 'Under Review', authorId: 'teacher-1', createdBy: 'teacher-1' };
    await setDoc(doc(db, 'books', 'book-published'), { ...published, sourceUrl: 'https://example.com' });
    await setDoc(doc(db, 'books', 'book-draft'), { ...draft, sourceUrl: 'https://example.com' });
    await setDoc(doc(db, 'chapters', 'chapter-published'), { ...published, bookId: 'book-published' });
    await setDoc(doc(db, 'chapters', 'chapter-draft'), { ...draft, bookId: 'book-published' });
    await setDoc(doc(db, 'lessons', 'lesson-published'), { ...published, bookId: 'book-published', chapterId: 'chapter-published', body: 'Body.' });
    await setDoc(doc(db, 'lessons', 'lesson-draft'), { ...draft, bookId: 'book-published', chapterId: 'chapter-draft', body: 'Draft body.' });
    await setDoc(doc(db, 'educationDirectory', 'dir-published'), { ...published, bookId: 'book-published' });
    await setDoc(doc(db, 'educationDirectory', 'dir-draft'), { ...draft, bookId: 'book-published' });
    await setDoc(doc(db, 'contactMessages', 'msg-1'), {
      userId: 'student-1',
      name: 'Student One',
      email: 'student1@example.com',
      message: 'Hello, I need help.',
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

const unauth = () => env.unauthenticatedContext().firestore();
const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asTeacher = () => env.authenticatedContext('teacher-1').firestore();
const asModerator = () => env.authenticatedContext('moderator-1').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asOwner = () => env.authenticatedContext('owner-1').firestore();
const asSuspended = () => env.authenticatedContext('suspended-1').firestore();

describe('Step 2 rules — books / chapters / lessons / directory', () => {
  it('unauthenticated read of a Published book is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(unauth(), 'books', 'book-published')));
  });
  it('unauthenticated read of a draft book is DENIED', async () => {
    await assertFails(getDoc(doc(unauth(), 'books', 'book-draft')));
  });
  it('student read of a Published book is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'books', 'book-published')));
  });
  it('student create of a book is DENIED (not a teacher)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'books', 'book-student'), {
        title: 'Student book',
        reviewStatus: 'Under Review',
        sourceUrl: 'https://example.com',
      }),
    );
  });
  it('teacher create of a book as a draft is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacher(), 'books', 'book-teacher-draft'), {
        title: 'Teacher book',
        reviewStatus: 'Under Review',
        sourceUrl: 'https://example.com',
      }),
    );
  });
  it('teacher create of a book as Published is DENIED (drafts only)', async () => {
    await assertFails(
      setDoc(doc(asTeacher(), 'books', 'book-teacher-pub'), {
        title: 'Teacher book',
        reviewStatus: 'Published',
        sourceUrl: 'https://example.com',
      }),
    );
  });
  it('teacher publishing their own draft book is DENIED', async () => {
    await assertFails(updateDoc(doc(asTeacher(), 'books', 'book-draft'), { reviewStatus: 'Published' }));
  });
  it('moderator publishing a draft book is ALLOWED', async () => {
    await assertSucceeds(updateDoc(doc(asModerator(), 'books', 'book-draft'), { reviewStatus: 'Published' }));
  });
  it('admin delete of a book is ALLOWED', async () => {
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'books', 'book-published')));
  });
  it('unauthenticated read of a Published chapter is ALLOWED, draft DENIED', async () => {
    await assertSucceeds(getDoc(doc(unauth(), 'chapters', 'chapter-published')));
    await assertFails(getDoc(doc(unauth(), 'chapters', 'chapter-draft')));
  });
  it('unauthenticated read of a Published lesson is ALLOWED, draft DENIED', async () => {
    await assertSucceeds(getDoc(doc(unauth(), 'lessons', 'lesson-published')));
    await assertFails(getDoc(doc(unauth(), 'lessons', 'lesson-draft')));
  });
  it('student create of a lesson is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'lessons', 'lesson-student'), {
        title: 'Student lesson',
        body: 'Body.',
        reviewStatus: 'Under Review',
      }),
    );
  });
  it('teacher create of a lesson draft is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacher(), 'lessons', 'lesson-teacher-draft'), {
        title: 'Teacher lesson',
        body: 'Body.',
        reviewStatus: 'Under Review',
      }),
    );
  });
  it('unauthenticated read of a Published directory row is ALLOWED, draft DENIED', async () => {
    await assertSucceeds(getDoc(doc(unauth(), 'educationDirectory', 'dir-published')));
    await assertFails(getDoc(doc(unauth(), 'educationDirectory', 'dir-draft')));
  });
  it('student create of a directory row is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'educationDirectory', 'dir-student'), {
        title: 'Student row',
        reviewStatus: 'Under Review',
      }),
    );
  });
});

describe('Step 2 rules — contactMessages', () => {
  it('signed-in student creating their own message is ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(asStudent2(), 'contactMessages'), {
        userId: 'student-2',
        name: 'Student Two',
        email: 'student2@example.com',
        message: 'I have a question about the library.',
      }),
    );
  });
  it('student creating a message with someone else’s userId is DENIED', async () => {
    await assertFails(
      addDoc(collection(asStudent1(), 'contactMessages'), {
        userId: 'student-2',
        name: 'Student One',
        message: 'Impersonation attempt.',
      }),
    );
  });
  it('student creating a message with an empty message is DENIED', async () => {
    await assertFails(
      addDoc(collection(asStudent1(), 'contactMessages'), {
        userId: 'student-1',
        name: 'Student One',
        message: '',
      }),
    );
  });
  it('unauthenticated create of a message is DENIED', async () => {
    await assertFails(
      addDoc(collection(unauth(), 'contactMessages'), {
        userId: 'student-1',
        name: 'Nobody',
        message: 'Anonymous message.',
      }),
    );
  });
  it('suspended student creating a message is DENIED', async () => {
    await assertFails(
      addDoc(collection(asSuspended(), 'contactMessages'), {
        userId: 'suspended-1',
        name: 'Suspended',
        message: 'I am suspended.',
      }),
    );
  });
  it('student reading a message is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'contactMessages', 'msg-1')));
  });
  it('admin reading a message is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asAdmin(), 'contactMessages', 'msg-1')));
  });
  it('owner reading a message is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asOwner(), 'contactMessages', 'msg-1')));
  });
  it('student updating a message is DENIED', async () => {
    await assertFails(updateDoc(doc(asStudent1(), 'contactMessages', 'msg-1'), { message: 'Edited.' }));
  });
  it('admin deleting a message is DENIED (append-only)', async () => {
    await assertFails(deleteDoc(doc(asAdmin(), 'contactMessages', 'msg-1')));
  });
});
