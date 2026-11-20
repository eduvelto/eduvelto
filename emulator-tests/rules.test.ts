/**
 * EduOrbit Firestore security-rules test suite.
 *
 * RUN IT (needs Java 17+ for the Firestore emulator):
 *   npm run test:rules
 *   — or manually —
 *   npx firebase emulators:exec --only firestore,auth "npx vitest run emulator-tests/rules.test.ts"
 *
 * SETUP ON A MACHINE WITHOUT JAVA:
 *   Ubuntu/Debian (needs sudo):  sudo apt-get update && sudo apt-get install -y default-jre-headless
 *   No sudo: download Eclipse Temurin JRE 17 tarball from
 *   https://adoptium.net/temurin/releases/ , extract, and put its bin/ on PATH:
 *     tar xzf OpenJDK17U-jre_x64_linux_hotspot_*.tar.gz
 *     export PATH="$PWD/jdk-17/bin:$PATH" && java -version
 *   Then re-run `npm run test:rules`.
 *
 * These tests use @firebase/rules-unit-testing against the LOCAL emulator
 * only. They never touch a live project. Expected results are in the test
 * names (ALLOWED / DENIED). A test that FAILS means the rule in
 * firestore.rules does not do what database-schema.md §5 requires — fix the
 * rule, not the test.
 *
 * HOW RULES GET LOADED:
 *   The Firestore emulator loads `firestore.rules` itself at startup from
 *   `firebase.json` — the suite relies on that and does NOT pass the
 *   `rules:` option to initializeTestEnvironment (which would call
 *   loadFirestoreRules). Reason: @firebase/rules-unit-testing v3 +
 *   cloud-firestore-emulator v1.19.8 fail that call in this environment with
 *   `{"error":{"code":500,"message":"http2 exception","status":"INTERNAL"}}`
 *   (emulator log: "Exception when handling request: INTERNAL: http2
 *   exception"), even with proxy variables cleared. The emulator itself
 *   starts fine and serves the rules from firebase.json. The suite only
 *   sanity-checks that the rules file exists and contains `rules_version`.
 *   If the emulator is ever started without firebase.json (no rules loaded),
 *   the tests would run against open rules — so always start it from this
 *   project directory (`npm run test:rules` / `npm run emulators`).
 *
 * 20 NOV 2026 UPDATE — emulator-side bug PROVEN, not a client problem:
 *   Upgraded firebase 10.14.1 → 11.10.0, @firebase/rules-unit-testing
 *   3.0.4 → 4.0.1, @grpc/grpc-js 1.9.16 → 1.14.7 (npm override) and
 *   re-ran with ALL proxy vars cleared: seed writes STILL fail
 *   (now "14 UNAVAILABLE ... Protocol error"). Decisive test: a plain
 *   curl HTTP/1.1 REST write against the running emulator ALSO fails with
 *   `{"error":{"code":500,"message":"http2 exception"}}`, and the emulator
 *   log shows "Detected non-HTTP/2 connection" followed by
 *   "Exception when handling request: INTERNAL: http2 exception".
 *   So the emulator's own HTTP handler rejects EVERY request in this
 *   sandbox, whatever the client. The suite can only go green on a
 *   machine where the emulator serves traffic (try Temurin JRE 17, or an
 *   older cloud-firestore-emulator jar) — the hard gate stands: rules
 *   must pass here (or there) BEFORE they are deployed to the live
 *   project. Do NOT deploy firestore.rules to production unverified.
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduorbit-rules-test';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');

// Sanity check only (see header comment): the emulator loads the rules
// from firebase.json; this just proves the file exists and is a rules file.
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}

async function seed() {
  // Admin + student user docs, written with rules DISABLED (admin context).
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'admin-1'), {
      displayName: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'users', 'student-1'), {
      displayName: 'Student One',
      email: 'student1@example.com',
      role: 'student',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'users', 'student-2'), {
      displayName: 'Student Two',
      email: 'student2@example.com',
      role: 'student',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'lessons', 'lesson-published'), {
      chapterId: 'ch1',
      bookId: 'book1',
      educationDirectoryId: 'dir1',
      lessonNumber: 1,
      title: 'Published lesson',
      body: 'Original explanation.',
      language: 'bn',
      authorId: 'admin-1',
      reviewStatus: 'Published',
    });
    await setDoc(doc(db, 'lessons', 'lesson-draft'), {
      chapterId: 'ch1',
      bookId: 'book1',
      educationDirectoryId: 'dir1',
      lessonNumber: 2,
      title: 'Draft lesson',
      body: 'Draft text.',
      language: 'bn',
      authorId: 'admin-1',
      reviewStatus: 'In Progress',
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    // NOTE: no `rules:` option — see header comment (loadFirestoreRules
    // fails with "http2 exception" in this environment; the emulator loads
    // firestore.rules from firebase.json at startup instead).
    firestore: { host: '127.0.0.1', port: 8080 },
  });
  await seed();
});

afterAll(async () => {
  await env.cleanup();
});

const unauth = () => env.unauthenticatedContext().firestore();
const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();

describe('EduOrbit security rules', () => {
  // (a) Public reads: Published lesson ALLOWED, draft lesson DENIED.
  it('(a1) unauthenticated read of a Published lesson is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(unauth(), 'lessons', 'lesson-published')));
  });
  it('(a2) unauthenticated read of a draft lesson is DENIED', async () => {
    await assertFails(getDoc(doc(unauth(), 'lessons', 'lesson-draft')));
  });

  // (b) A student may not set their own role to admin.
  it('(b) student setting own role=admin is DENIED', async () => {
    const db = asStudent1();
    await assertFails(
      updateDoc(doc(db, 'users', 'student-1'), { role: 'admin' }),
    );
    await assertFails(
      setDoc(doc(db, 'users', 'student-1'), {
        displayName: 'Student One',
        email: 'student1@example.com',
        role: 'admin',
        language: 'bn',
      }),
    );
  });

  // (c) A student may not set verificationStatus on their own doc.
  it('(c) student setting own verificationStatus=verified is DENIED', async () => {
    const db = asStudent1();
    await assertFails(
      updateDoc(doc(db, 'users', 'student-1'), { verificationStatus: 'verified' }),
    );
  });

  // (d) Cross-user reads denied; own doc allowed.
  it('(d1) student reading another student’s users doc is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'users', 'student-2')));
  });
  it('(d2) student reading their own users doc is ALLOWED', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'users', 'student-1')));
  });
  it('(d3) student updating only their own allowed fields is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1'), { displayName: 'Student One Renamed' }),
    );
  });

  // (e) quizAttempts: create own ALLOWED, update after submit DENIED.
  it('(e1) student creating their own quizAttempt is ALLOWED', async () => {
    const db = asStudent1();
    await assertSucceeds(
      addDoc(collection(db, 'users', 'student-1', 'quizAttempts'), {
        quizId: 'quiz1',
        answers: [0, 1],
        score: 1,
        totalMarks: 2,
        percentage: 50,
        startedAt: new Date(),
        submittedAt: new Date(),
      }),
    );
  });
  it('(e2) student updating their quizAttempt after submit is DENIED', async () => {
    const db = asStudent1();
    const ref = await addDoc(collection(db, 'users', 'student-1', 'quizAttempts'), {
      quizId: 'quiz1',
      answers: [0, 1],
      score: 1,
      totalMarks: 2,
      percentage: 50,
      startedAt: new Date(),
      submittedAt: new Date(),
    });
    await assertFails(updateDoc(ref, { score: 2, percentage: 100 }));
  });
  it('(e3) student reading another student’s quizAttempt is DENIED', async () => {
    const db1 = asStudent1();
    const ref = await addDoc(collection(db1, 'users', 'student-1', 'quizAttempts'), {
      quizId: 'quiz1',
      answers: [0],
      score: 0,
      totalMarks: 1,
      percentage: 0,
      startedAt: new Date(),
      submittedAt: new Date(),
    });
    await assertFails(getDoc(doc(asStudent2(), 'users', 'student-1', 'quizAttempts', ref.id)));
  });

  // (f) A student may not publish a post directly.
  it('(f1) student creating a post with reviewStatus=Published is DENIED', async () => {
    await assertFails(
      addDoc(collection(asStudent1(), 'posts'), {
        authorId: 'student-1',
        authorDisplayName: 'Student One',
        title: 'Sneaky publish',
        body: 'Trying to publish directly.',
        category: 'general',
        reviewStatus: 'Published',
      }),
    );
  });
  it('(f2) student creating a post with reviewStatus=Under Review is ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(asStudent1(), 'posts'), {
        authorId: 'student-1',
        authorDisplayName: 'Student One',
        title: 'Honest post',
        body: 'Waiting for review.',
        category: 'general',
        reviewStatus: 'Under Review',
      }),
    );
  });

  // (g) Unauthenticated writes denied.
  it('(g) unauthenticated write is DENIED', async () => {
    await assertFails(
      addDoc(collection(unauth(), 'posts'), {
        authorId: 'nobody',
        authorDisplayName: 'Nobody',
        title: 'x',
        body: 'x',
        category: 'general',
        reviewStatus: 'Under Review',
      }),
    );
  });

  // (h) Admin approving a teacher verification is ALLOWED.
  it('(h1) admin approving a teacher verification is ALLOWED', async () => {
    // The applicant creates their own pending record; the admin approves it.
    const ref = await addDoc(collection(asStudent1(), 'teacherVerifications'), {
      userId: 'student-1',
      fullName: 'Student One',
      institution: 'Test College',
      idType: 'nid',
      idReference: 'checked in person by admin',
      status: 'pending',
    });
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'teacherVerifications', ref.id), {
        status: 'verified',
        checkedBy: 'admin-1',
        checkedAt: new Date(),
      }),
    );
  });
  it('(h2) student changing their own verification status is DENIED', async () => {
    const db = asStudent1();
    const ref = await addDoc(collection(db, 'teacherVerifications'), {
      userId: 'student-1',
      fullName: 'Student One',
      institution: 'Test College',
      idType: 'nid',
      idReference: 'self',
      status: 'pending',
    });
    await assertFails(updateDoc(ref, { status: 'verified', checkedBy: 'student-1' }));
  });
});
