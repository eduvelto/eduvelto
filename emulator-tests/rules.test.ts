/**
 * Eduvelto Firestore security-rules test suite.
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
 * 20 NOV 2026 — ROOT CAUSE FOUND + FIXED (was misdiagnosed as an
 * emulator bug): the sandbox resolves `localhost` to ::1 (IPv6) FIRST
 * (see /etc/hosts + getaddrinfo order), and the emulator's internal
 * gRPC channel to its own datastore backend fails on IPv6 — every
 * Firestore operation then fails with
 * `{"error":{"code":500,"message":"http2 exception"}}` while plain
 * GET / still returns 200. Ruled out before finding this: proxy vars,
 * firebase 10→11, rules-unit-testing 3→4, grpc-js 1.9→1.14, Java 17
 * vs 21, emulator jar v1.19.8 vs v1.18.2, with/without firestore.rules.
 * FIX: force IPv4 for the emulator JVM —
 *   JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"
 * (baked into the `test:rules` / `emulators` npm scripts). Verified
 * 20 Nov 20:44: plain curl REST write + read against BOTH jars
 * (v1.18.2 on 8087, v1.19.8 on 8088) return HTTP 200 with the flag,
 * and the suite's firestore-debug.log shows zero "http2 exception".
 * The beforeAll hook timeout is 120s because the first Firestore ops
 * on a cold emulator take ~2s each in this sandbox (default 10s was
 * too tight even after the fix). The hard gate stands: rules must pass
 * here BEFORE they are deployed to the live project. Do NOT deploy
 * firestore.rules to production unverified.
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test';
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
    await setDoc(doc(db, 'users', 'owner-1'), {
      displayName: 'Owner',
      email: 'owner@example.com',
      role: 'owner',
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
    await setDoc(doc(db, 'users', 'moderator-1'), {
      displayName: 'Moderator',
      email: 'moderator@example.com',
      role: 'moderator',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'users', 'suspended-1'), {
      displayName: 'Suspended Student',
      email: 'suspended@example.com',
      role: 'student',
      language: 'bn',
      isActive: false,
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
    // --- Step 4 seeds: a Published quiz (projection, NO key) + its key ---
    await setDoc(doc(db, 'quizzes', 'quiz1'), {
      title: 'Test Quiz — MCQ পরীক্ষা',
      bookId: 'book1',
      subject: 'English',
      department: 'English',
      classLevel: '3rd Year',
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
    await setDoc(doc(db, 'quizKeys', 'quiz1'), {
      quizId: 'quiz1',
      answers: [{ n: 1, correctLetter: 'B', correctText: 'Shakespeare' }],
    });
    // --- Health v1 seeds ---
    const medFields = {
      title: 'Paracetamol',
      titleBn: 'প্যারাসিটামল',
      useBn: 'জ্বর ও ব্যথা কমাতে ব্যবহৃত হয়।',
      useEn: 'Used to reduce fever and relieve pain.',
      formBn: 'ট্যাবলেট / সিরাপ',
      formEn: 'Tablet / syrup',
      sideEffectsBn: 'সাধারণত পার্শ্বপ্রতিক্রিয়া হয় না।',
      sideEffectsEn: 'Usually no side effects.',
      warningsBn: 'মাত্রা সম্পর্কে ডাক্তারের পরামর্শ নিন।',
      warningsEn: 'Ask a doctor about the dose.',
      prescriptionOnly: false,
      source: 'WHO',
    };
    await setDoc(doc(db, 'medicines', 'med-published'), { ...medFields, reviewStatus: 'Published' });
    await setDoc(doc(db, 'medicines', 'med-draft'), { ...medFields, title: 'ORS', titleBn: 'ওরস্যালাইন', reviewStatus: 'Under Review' });
    const disFields = {
      title: 'Dengue',
      titleBn: 'ডেঙ্গু',
      symptomsBn: 'হঠাৎ তীব্র জ্বর, মাথা ব্যথা।',
      symptomsEn: 'Sudden high fever, headache.',
      preventionBn: 'মশার কামড় থেকে বাঁচুন।',
      preventionEn: 'Avoid mosquito bites.',
      seeDoctorBn: 'জ্বর ৩ দিনের বেশি থাকলে ডাক্তার দেখান।',
      seeDoctorEn: 'See a doctor if fever lasts more than 3 days.',
      source: 'WHO / DGHS Bangladesh',
    };
    await setDoc(doc(db, 'diseases', 'dis-published'), { ...disFields, reviewStatus: 'Published' });
    await setDoc(doc(db, 'diseases', 'dis-draft'), { ...disFields, title: 'Typhoid', titleBn: 'টাইফয়েড', reviewStatus: 'Under Review' });
    await setDoc(doc(db, 'facilities', 'fac-published'), {
      title: 'Dhaka Medical College Hospital',
      titleBn: 'ঢাকা মেডিকেল কলেজ হাসপাতাল',
      kind: 'hospital',
      areaBn: 'ঢাকা',
      areaEn: 'Dhaka',
      addressBn: 'ঢাকা',
      addressEn: 'Dhaka',
      source: 'DGHS Bangladesh — public hospital list',
      reviewStatus: 'Published',
    });
    const docFields = {
      title: 'Dr Ayesha Rahman',
      titleBn: 'ডা. আয়েশা রহমান',
      qualificationBn: 'এমবিবিএস',
      qualificationEn: 'MBBS',
      specialityBn: 'সাধারণ চিকিৎসা',
      specialityEn: 'General medicine',
      workplaceBn: 'ঢাকা মেডিকেল কলেজ হাসপাতাল',
      workplaceEn: 'Dhaka Medical College Hospital',
      source: 'DGHS Bangladesh',
    };
    await setDoc(doc(db, 'doctors', 'doc-verified-published'), { ...docFields, verificationStatus: 'verified', reviewStatus: 'Published', userId: 'doctor-user' });
    await setDoc(doc(db, 'doctors', 'doc-verified-draft'), { ...docFields, verificationStatus: 'verified', reviewStatus: 'Under Review', userId: 'doctor-user' });
    await setDoc(doc(db, 'doctors', 'doc-pending'), { ...docFields, verificationStatus: 'pending', reviewStatus: 'Under Review', userId: 'doctor-user' });
    await setDoc(doc(db, 'doctors', 'doc-pending-nochecks'), { ...docFields, verificationStatus: 'pending', reviewStatus: 'Under Review', userId: 'doctor-user' });
    await setDoc(doc(db, 'doctors', 'doc-pending-shortreason'), { ...docFields, verificationStatus: 'pending', reviewStatus: 'Under Review', userId: 'doctor-user' });
    await setDoc(doc(db, 'doctors', 'doc-pending-own'), { ...docFields, verificationStatus: 'pending', reviewStatus: 'Under Review', userId: 'admin-1' });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    // NOTE: no `rules:` option — see header comment (loadFirestoreRules
    // fails with "http2 exception" in this environment; the emulator loads
    // firestore.rules from firebase.json at startup instead).
    firestore: {
      host: '127.0.0.1',
      // Alt-port support: defaults are contested by parallel agents;
      // set FIRESTORE_EMULATOR_PORT to the live-picked port (default 8080).
      port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080),
    },
  });
  await seed();
}, 120000); // 120s: first Firestore ops on a cold emulator take ~2s each in this sandbox

afterAll(async () => {
  await env.cleanup();
});

const unauth = () => env.unauthenticatedContext().firestore();
const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asModerator = () => env.authenticatedContext('moderator-1').firestore();
const asSuspended = () => env.authenticatedContext('suspended-1').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asOwner = () => env.authenticatedContext('owner-1').firestore();

describe('Eduvelto security rules', () => {
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

  // (h) Admin approving a teacher verification is ALLOWED — with the
  // mandatory reason (min 10 chars) and the 4-point human checklist.
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
        reason: 'পরিচয়, প্রতিষ্ঠান, বিষয় ও বয়স যাচাই করা হয়েছে',
        checks: { identity: true, institution: true, subject: true, adult: true },
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

  // (i) Owner role (spec §3): owner protection + append-only audit log.
  it('(i1) owner updating any user document is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asOwner(), 'users', 'student-1'), { displayName: 'Renamed by owner' }),
    );
    await assertSucceeds(
      updateDoc(doc(asOwner(), 'users', 'admin-1'), { displayName: 'Renamed by owner' }),
    );
  });
  it('(i2) owner updating their own doc (incl. verificationStatus) is ALLOWED', async () => {
    // The self-update rule alone forbids verificationStatus — only the
    // owner rule can allow this, so it proves the owner rule specifically.
    await assertSucceeds(
      updateDoc(doc(asOwner(), 'users', 'owner-1'), {
        displayName: 'Owner Renamed',
        verificationStatus: 'verified',
      }),
    );
  });
  it('(i3) admin updating the owner’s document is DENIED', async () => {
    const db = asAdmin();
    await assertFails(updateDoc(doc(db, 'users', 'owner-1'), { displayName: 'Sneaky rename' }));
    await assertFails(updateDoc(doc(db, 'users', 'owner-1'), { isActive: false }));
    await assertFails(updateDoc(doc(db, 'users', 'owner-1'), { email: 'taken-over@example.com' }));
  });
  it('(i4) admin changing the owner’s role is DENIED', async () => {
    await assertFails(updateDoc(doc(asAdmin(), 'users', 'owner-1'), { role: 'student' }));
    await assertFails(updateDoc(doc(asAdmin(), 'users', 'owner-1'), { role: 'admin' }));
  });
  it('(i5) student creating adminActions entries is DENIED', async () => {
    await assertFails(
      addDoc(collection(asStudent1(), 'adminActions'), {
        actorId: 'student-2',
        action: 'fake-action',
        createdAt: new Date(),
      }),
    );
    await assertFails(
      addDoc(collection(asStudent1(), 'adminActions'), {
        actorId: 'student-1',
        action: 'fake-action',
        createdAt: new Date(),
      }),
    );
  });
  it('(i6) admin recording their own action in adminActions is ALLOWED', async () => {
    await assertSucceeds(
      addDoc(collection(asAdmin(), 'adminActions'), {
        actorId: 'admin-1',
        action: 'user-suspend',
        createdAt: new Date(),
      }),
    );
  });
  it('(i7) owner creating + reading adminActions is ALLOWED; admin reading is DENIED', async () => {
    const ref = await assertSucceeds(
      addDoc(collection(asOwner(), 'adminActions'), {
        actorId: 'owner-1',
        action: 'teacher-verification-approved',
        createdAt: new Date(),
      }),
    );
    await assertSucceeds(getDoc(doc(asOwner(), 'adminActions', ref.id)));
    await assertFails(getDoc(doc(asAdmin(), 'adminActions', ref.id)));
  });
  it('(i8) NOBODY can update or delete an adminActions entry', async () => {
    const ref = await addDoc(collection(asOwner(), 'adminActions'), {
      actorId: 'owner-1',
      action: 'feature-enabled',
      createdAt: new Date(),
    });
    await assertFails(updateDoc(doc(asOwner(), 'adminActions', ref.id), { action: 'edited' }));
    await assertFails(updateDoc(doc(asAdmin(), 'adminActions', ref.id), { action: 'edited' }));
    await assertFails(deleteDoc(doc(asOwner(), 'adminActions', ref.id)));
    await assertFails(deleteDoc(doc(asAdmin(), 'adminActions', ref.id)));
  });

  // (j) settings rules (owner dashboard, 20 Nov 2026): there was no
  // settings rule at all — feature toggles could not work.
  it('(j1) settings/features: owner write ALLOWED, admin/student DENIED, signed-in read ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asOwner(), 'settings', 'features'), {
        'ai-teacher': false,
        updatedAt: new Date(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(asOwner(), 'settings', 'features'), {
        comments: true,
        updatedAt: new Date(),
      }),
    );
    await assertFails(
      setDoc(doc(asAdmin(), 'settings', 'features'), {
        'ai-teacher': true,
        updatedAt: new Date(),
      }),
    );
    await assertFails(
      setDoc(doc(asStudent1(), 'settings', 'features'), {
        'ai-teacher': true,
        updatedAt: new Date(),
      }),
    );
    await assertSucceeds(getDoc(doc(asStudent1(), 'settings', 'features')));
    await assertFails(getDoc(doc(unauth(), 'settings', 'features')));
  });
  it('(j2) settings/features: non-boolean flag value DENIED; bottom-banner key DENIED', async () => {
    await assertFails(
      setDoc(doc(asOwner(), 'settings', 'features'), {
        'ai-teacher': 'yes',
        updatedAt: new Date(),
      }),
    );
    // The mandatory bottom banner has no field anywhere: it can never
    // be turned off, not even in settings (owner brief 20 Nov 21:52).
    await assertFails(
      setDoc(doc(asOwner(), 'settings', 'features'), {
        'bottom-banner': false,
        updatedAt: new Date(),
      }),
    );
  });
  it('(j3) settings/ads: owner write ALLOWED (in-feed only), admin DENIED, bottom-banner key DENIED', async () => {
    await assertSucceeds(
      setDoc(doc(asOwner(), 'settings', 'ads'), { 'in-feed': true, updatedAt: new Date() }),
    );
    await assertFails(
      setDoc(doc(asAdmin(), 'settings', 'ads'), { 'in-feed': true, updatedAt: new Date() }),
    );
    await assertFails(
      setDoc(doc(asOwner(), 'settings', 'ads'), {
        'bottom-banner': false,
        updatedAt: new Date(),
      }),
    );
  });

  // (k) Owner protection + suspension enforcement + verification hardening.
  it('(k1) NOBODY can create a second owner via the client rules', async () => {
    await assertFails(updateDoc(doc(asAdmin(), 'users', 'admin-1'), { role: 'owner' }));
    await assertFails(updateDoc(doc(asAdmin(), 'users', 'student-1'), { role: 'owner' }));
    await assertFails(updateDoc(doc(asOwner(), 'users', 'student-1'), { role: 'owner' }));
  });
  it('(k2) admin updating a user email / arbitrary field is DENIED (field allowlist)', async () => {
    await assertFails(updateDoc(doc(asAdmin(), 'users', 'student-1'), { email: 'x@example.com' }));
    await assertFails(
      updateDoc(doc(asAdmin(), 'users', 'student-1'), { displayName: 'Renamed by admin' }),
    );
  });
  it('(k3) a suspended user cannot create content (suspension is enforced in the rules)', async () => {
    await assertFails(
      addDoc(collection(asSuspended(), 'posts'), {
        authorId: 'suspended-1',
        authorDisplayName: 'Suspended Student',
        title: 'Should not post',
        body: 'Suspended accounts cannot post.',
        category: 'general',
        reviewStatus: 'Under Review',
      }),
    );
  });
  it('(k4) a moderator cannot approve teachers and cannot read user docs', async () => {
    const ref = await addDoc(collection(asStudent1(), 'teacherVerifications'), {
      userId: 'student-1',
      fullName: 'Student One',
      institution: 'Test College',
      status: 'pending',
    });
    await assertFails(
      updateDoc(doc(asModerator(), 'teacherVerifications', ref.id), {
        status: 'verified',
        checkedBy: 'moderator-1',
        checkedAt: new Date(),
        reason: 'পরিচয়, প্রতিষ্ঠান, বিষয় ও বয়স যাচাই করা হয়েছে',
        checks: { identity: true, institution: true, subject: true, adult: true },
      }),
    );
    await assertFails(getDoc(doc(asModerator(), 'users', 'student-1')));
  });
  it('(k5) an admin cannot decide their OWN teacher application', async () => {
    const ref = await addDoc(collection(asModerator(), 'teacherVerifications'), {
      userId: 'moderator-1',
      fullName: 'Moderator',
      institution: 'Test College',
      status: 'pending',
    });
    await assertFails(
      updateDoc(doc(asModerator(), 'teacherVerifications', ref.id), {
        status: 'verified',
        checkedBy: 'moderator-1',
        checkedAt: new Date(),
        reason: 'পরিচয়, প্রতিষ্ঠান, বিষয় ও বয়স যাচাই করা হয়েছে',
        checks: { identity: true, institution: true, subject: true, adult: true },
      }),
    );
  });
  it('(k6) approve without reason / without checklist / reject without reason is DENIED', async () => {
    const ref = await addDoc(collection(asStudent1(), 'teacherVerifications'), {
      userId: 'student-1',
      fullName: 'Student One',
      institution: 'Test College',
      status: 'pending',
    });
    const db = asAdmin();
    await assertFails(
      updateDoc(doc(db, 'teacherVerifications', ref.id), {
        status: 'verified',
        checkedBy: 'admin-1',
        checkedAt: new Date(),
        checks: { identity: true, institution: true, subject: true, adult: true },
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'teacherVerifications', ref.id), {
        status: 'verified',
        checkedBy: 'admin-1',
        checkedAt: new Date(),
        reason: 'পরিচয়, প্রতিষ্ঠান, বিষয় ও বয়স যাচাই করা হয়েছে',
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'teacherVerifications', ref.id), {
        status: 'rejected',
        checkedBy: 'admin-1',
        checkedAt: new Date(),
      }),
    );
  });
  it('(k7) adminActions: forged action / non-timestamp createdAt DENIED; valid entry ALLOWED', async () => {
    await assertFails(
      addDoc(collection(asAdmin(), 'adminActions'), {
        actorId: 'admin-1',
        action: 'fake-action',
        createdAt: new Date(),
      }),
    );
    await assertFails(
      addDoc(collection(asAdmin(), 'adminActions'), {
        actorId: 'admin-1',
        action: 'user-suspend',
        createdAt: '2026-11-20',
      }),
    );
    await assertSucceeds(
      addDoc(collection(asAdmin(), 'adminActions'), {
        actorId: 'admin-1',
        action: 'user-suspend',
        details: 'Student One',
        targetId: 'student-1',
        before: 'active',
        after: 'suspended',
        reason: 'পরীক্ষার প্রশ্ন ফাঁস করেছে',
        createdAt: new Date(),
      }),
    );
  });
  it('(k8) admin reopening a decided application back to pending is ALLOWED', async () => {
    const ref = await addDoc(collection(asStudent1(), 'teacherVerifications'), {
      userId: 'student-1',
      fullName: 'Student One',
      institution: 'Test College',
      status: 'pending',
    });
    await updateDoc(doc(asAdmin(), 'teacherVerifications', ref.id), {
      status: 'verified',
      checkedBy: 'admin-1',
      checkedAt: new Date(),
      reason: 'পরিচয়, প্রতিষ্ঠান, বিষয় ও বয়স যাচাই করা হয়েছে',
      checks: { identity: true, institution: true, subject: true, adult: true },
    });
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'teacherVerifications', ref.id), {
        status: 'pending',
        checkedBy: 'admin-1',
        checkedAt: new Date(),
        reason: 'আরও যাচাই দরকার — নতুন তথ্য এসেছে',
      }),
    );
  });
  it('(k9) a report without target fields is DENIED; with them ALLOWED', async () => {
    await assertFails(
      addDoc(collection(asStudent1(), 'reports'), {
        reporterId: 'student-1',
        status: 'open',
        reason: 'spam',
        details: 'No target named.',
      }),
    );
    await assertSucceeds(
      addDoc(collection(asStudent1(), 'reports'), {
        reporterId: 'student-1',
        status: 'open',
        reason: 'spam',
        targetType: 'post',
        targetId: 'post-1',
        targetAuthorId: 'student-2',
        details: 'Spam post.',
      }),
    );
  });

  // (l) Messenger (owner decision 20 Nov 23:25): support messaging is
  // live in the rules; direct messages stay DENIED until the six
  // mandatory safeguards exist in code.
  it('(l1) support thread: own thread + text message ALLOWED; others DENIED; non-text DENIED', async () => {
    const ref = await addDoc(collection(asStudent1(), 'supportMessages'), {
      userId: 'student-1',
      status: 'open',
    });
    await assertFails(
      addDoc(collection(asStudent2(), 'supportMessages'), {
        userId: 'student-1',
        status: 'open',
      }),
    );
    await assertSucceeds(
      addDoc(collection(asStudent1(), 'supportMessages', ref.id, 'messages'), {
        senderId: 'student-1',
        kind: 'text',
        body: 'আমার অ্যাকাউন্টে সমস্যা হচ্ছে।',
      }),
    );
    await assertFails(
      addDoc(collection(asStudent1(), 'supportMessages', ref.id, 'messages'), {
        senderId: 'student-1',
        kind: 'voice',
        body: 'voice note',
      }),
    );
    await assertFails(getDoc(doc(asStudent2(), 'supportMessages', ref.id)));
    await assertSucceeds(getDoc(doc(asAdmin(), 'supportMessages', ref.id)));
  });
  it('(l2) direct messages: client create is DENIED for everyone until the safeguards land', async () => {
    await assertFails(
      addDoc(collection(asStudent1(), 'directMessages'), {
        participants: ['student-1', 'student-2'],
        createdAt: new Date(),
      }),
    );
    await assertFails(
      addDoc(collection(asOwner(), 'directMessages'), {
        participants: ['owner-1', 'student-1'],
        createdAt: new Date(),
      }),
    );
  });

  // (m) Health v1 (owner brief 20 Nov 23:51): students read ONLY Published
  // health content; moderators edit drafts but never publish or verify;
  // publishing + doctor verification are ADMIN-only, verification needs
  // the human checklist + a reason, and nobody verifies themself.
  const medCreate = (over: Record<string, unknown> = {}) => ({
    title: 'Test Medicine',
    titleBn: 'পরীক্ষামূলক ঔষধ',
    useBn: 'পরীক্ষার জন্য।',
    useEn: 'For testing.',
    formBn: 'ট্যাবলেট',
    formEn: 'Tablet',
    sideEffectsBn: 'কোনো পার্শ্বপ্রতিক্রিয়া জানা নেই।',
    sideEffectsEn: 'No known side effects.',
    warningsBn: 'ডাক্তারের পরামর্শ নিন।',
    warningsEn: 'Ask a doctor.',
    prescriptionOnly: false,
    source: 'WHO',
    reviewStatus: 'Under Review',
    ...over,
  });
  it('(m1) health reads: Published visible to everyone incl. logged-out; drafts hidden from students', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'medicines', 'med-published')));
    await assertSucceeds(getDoc(doc(unauth(), 'medicines', 'med-published')));
    await assertFails(getDoc(doc(asStudent1(), 'medicines', 'med-draft')));
    await assertFails(getDoc(doc(asStudent1(), 'diseases', 'dis-draft')));
    await assertSucceeds(getDoc(doc(asStudent1(), 'diseases', 'dis-published')));
    await assertSucceeds(getDoc(doc(asStudent1(), 'facilities', 'fac-published')));
    await assertSucceeds(getDoc(doc(asModerator(), 'medicines', 'med-draft')));
  });
  it('(m2) medicine create: student DENIED; moderator draft ALLOWED; moderator Published DENIED; dosage field DENIED', async () => {
    await assertFails(addDoc(collection(asStudent1(), 'medicines'), medCreate()));
    await assertSucceeds(addDoc(collection(asModerator(), 'medicines'), medCreate()));
    await assertFails(addDoc(collection(asModerator(), 'medicines'), medCreate({ reviewStatus: 'Published' })));
    await assertFails(addDoc(collection(asModerator(), 'medicines'), medCreate({ dosage: '500mg' })));
  });
  it('(m3) medicine publish: moderator DENIED; admin ALLOWED', async () => {
    await assertFails(updateDoc(doc(asModerator(), 'medicines', 'med-draft'), { reviewStatus: 'Published' }));
    await assertSucceeds(updateDoc(doc(asAdmin(), 'medicines', 'med-draft'), { reviewStatus: 'Published' }));
  });
  it('(m4) disease + facility create: student DENIED; moderator draft ALLOWED', async () => {
    await assertFails(
      addDoc(collection(asStudent1(), 'diseases'), {
        title: 'Flu', titleBn: 'ফ্লু', symptomsBn: 'জ্বর।', symptomsEn: 'Fever.',
        preventionBn: 'টিকা নিন।', preventionEn: 'Get vaccinated.',
        seeDoctorBn: 'শ্বাসকষ্ট হলে ডাক্তার দেখান।', seeDoctorEn: 'See a doctor for breathing difficulty.',
        source: 'WHO', reviewStatus: 'Under Review',
      }),
    );
    await assertSucceeds(
      addDoc(collection(asModerator(), 'facilities'), {
        title: 'Test Clinic', titleBn: 'পরীক্ষামূলক ক্লিনিক', kind: 'clinic',
        areaBn: 'ঢাকা', areaEn: 'Dhaka', source: 'DGHS Bangladesh', reviewStatus: 'Under Review',
      }),
    );
  });
  it('(m5) doctor visibility: only verified + Published is readable by students', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'doctors', 'doc-verified-published')));
    await assertFails(getDoc(doc(asStudent1(), 'doctors', 'doc-verified-draft')));
    await assertFails(getDoc(doc(asStudent1(), 'doctors', 'doc-pending')));
    await assertSucceeds(getDoc(doc(asModerator(), 'doctors', 'doc-pending')));
  });
  it('(m6) doctor verification: moderator DENIED; admin with checklist + reason ALLOWED; missing checks DENIED; short reason DENIED; self-verification DENIED', async () => {
    const decision = (over: Record<string, unknown> = {}) => ({
      verificationStatus: 'verified',
      verifiedBy: 'admin-1',
      verifiedAt: new Date(),
      reason: 'Identity and qualification checked',
      checks: { identity: true, qualification: true, adult: true },
      updatedAt: new Date(),
      ...over,
    });
    await assertFails(updateDoc(doc(asModerator(), 'doctors', 'doc-pending'), decision({ verifiedBy: 'moderator-1' })));
    await assertSucceeds(updateDoc(doc(asAdmin(), 'doctors', 'doc-pending'), decision()));
    await assertFails(updateDoc(doc(asAdmin(), 'doctors', 'doc-pending-nochecks'), decision({ checks: { identity: true } })));
    await assertFails(updateDoc(doc(asAdmin(), 'doctors', 'doc-pending-shortreason'), decision({ reason: 'ok' })));
    await assertFails(updateDoc(doc(asAdmin(), 'doctors', 'doc-pending-own'), decision()));
  });
  it('(m7) doctor create: student DENIED; verificationStatus must start pending', async () => {
    const docCreate = (over: Record<string, unknown> = {}) => ({
      title: 'Dr Test', titleBn: 'ডা. পরীক্ষা', qualificationBn: 'এমবিবিএস', qualificationEn: 'MBBS',
      specialityBn: 'সাধারণ', specialityEn: 'General', workplaceBn: 'ঢাকা', workplaceEn: 'Dhaka',
      verificationStatus: 'pending', reviewStatus: 'Under Review', ...over,
    });
    await assertFails(addDoc(collection(asStudent1(), 'doctors'), docCreate()));
    await assertFails(addDoc(collection(asModerator(), 'doctors'), docCreate({ verificationStatus: 'verified' })));
    await assertSucceeds(addDoc(collection(asModerator(), 'doctors'), docCreate()));
  });

  // (n) Step 3 — bookmarks + per-subject progress: owner-scoped only.
  it('(n1) bookmark: own create/read/delete ALLOWED; other student read DENIED; spoofed userId DENIED', async () => {
    const id = 'student-1__lesson-published';
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'bookmarks', id), {
        userId: 'student-1',
        lessonId: 'lesson-published',
        bookId: 'book1',
        title: 'Published lesson',
      }),
    );
    await assertSucceeds(getDoc(doc(asStudent1(), 'bookmarks', id)));
    await assertFails(getDoc(doc(asStudent2(), 'bookmarks', id)));
    await assertFails(
      setDoc(doc(asStudent1(), 'bookmarks', 'student-1__lesson-draft'), {
        userId: 'student-2',
        lessonId: 'lesson-draft',
        bookId: 'book1',
        title: 'Draft lesson',
      }),
    );
    await assertSucceeds(deleteDoc(doc(asStudent1(), 'bookmarks', id)));
    await assertFails(deleteDoc(doc(asStudent2(), 'bookmarks', id)));
  });
  it('(n2) progress: own create/update ALLOWED; other student read DENIED; userId cannot be moved', async () => {
    const id = 'student-1__english';
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'progress', id), {
        userId: 'student-1',
        subject: 'English',
        lessonsRead: ['lesson-published'],
        questionsAttempted: 3,
        questionsCorrect: 2,
      }),
    );
    await assertSucceeds(getDoc(doc(asStudent1(), 'progress', id)));
    await assertFails(getDoc(doc(asStudent2(), 'progress', id)));
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'progress', id), { questionsAttempted: 4 }),
    );
    await assertFails(
      updateDoc(doc(asStudent1(), 'progress', id), { userId: 'student-2' }),
    );
    await assertFails(
      updateDoc(doc(asStudent2(), 'progress', id), { questionsAttempted: 99 }),
    );
  });
  it('(n3) unauthenticated read of a bookmark or progress doc is DENIED', async () => {
    await assertFails(getDoc(doc(unauth(), 'bookmarks', 'student-1__lesson-published')));
    await assertFails(getDoc(doc(unauth(), 'progress', 'student-1__english')));
  });
  it('(n4) progressSummaries: own create/read/update ALLOWED; other student read DENIED; spoofed userId DENIED', async () => {
    const id = 'student-1__english__2026-11';
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'progressSummaries', id), {
        userId: 'student-1',
        subject: 'English',
        month: '2026-11',
        attemptsCount: 2,
        averagePercentage: 60,
        bestPercentage: 80,
        weakChapters: ['Shakespeare'],
        strongChapters: ['Marlowe'],
      }),
    );
    await assertSucceeds(getDoc(doc(asStudent1(), 'progressSummaries', id)));
    await assertFails(getDoc(doc(asStudent2(), 'progressSummaries', id)));
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'progressSummaries', id), { attemptsCount: 3 }),
    );
    await assertFails(
      setDoc(doc(asStudent1(), 'progressSummaries', 'student-1__bangla__2026-11'), {
        userId: 'student-2',
        subject: 'Bangla',
        month: '2026-11',
        attemptsCount: 1,
        averagePercentage: 50,
      }),
    );
    await assertFails(getDoc(doc(unauth(), 'progressSummaries', id)));
  });

  // (o) Step 4 — answer-key protection (quizKeys + quizReceipts) + written marking.
  it('(o1) student reading quizKeys WITHOUT a submission receipt is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'quizKeys', 'quiz1')));
  });
  it('(o2) student creating their own receipt, then reading quizKeys, is ALLOWED', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'quizReceipts', 'student-1_quiz1'), {
        userId: 'student-1',
        quizId: 'quiz1',
        attemptId: 'attempt-1',
        createdAt: new Date(),
      }),
    );
    await assertSucceeds(getDoc(doc(asStudent1(), 'quizKeys', 'quiz1')));
    await assertSucceeds(deleteDoc(doc(asStudent1(), 'quizReceipts', 'student-1_quiz1')));
  });
  it('(o3) student reading quizKeys with a STALE receipt (older than 10 minutes) is DENIED', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'quizReceipts', 'student-1_quiz1'), {
        userId: 'student-1',
        quizId: 'quiz1',
        attemptId: 'attempt-1',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      }),
    );
    await assertFails(getDoc(doc(asStudent1(), 'quizKeys', 'quiz1')));
    await assertSucceeds(deleteDoc(doc(asStudent1(), 'quizReceipts', 'student-1_quiz1')));
  });
  it('(o4) student reading another student’s receipt is DENIED; creating a receipt for another uid is DENIED', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'quizReceipts', 'student-1_quiz1'), {
        userId: 'student-1',
        quizId: 'quiz1',
        attemptId: 'attempt-1',
        createdAt: new Date(),
      }),
    );
    await assertFails(getDoc(doc(asStudent2(), 'quizReceipts', 'student-1_quiz1')));
    await assertFails(
      setDoc(doc(asStudent1(), 'quizReceipts', 'student-2_quiz1'), {
        userId: 'student-2',
        quizId: 'quiz1',
        attemptId: 'attempt-1',
        createdAt: new Date(),
      }),
    );
    await assertSucceeds(deleteDoc(doc(asStudent1(), 'quizReceipts', 'student-1_quiz1')));
  });
  it('(o5) moderator reading quizKeys is ALLOWED; student creating a quizKey is DENIED', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'quizKeys', 'quiz1')));
    await assertFails(
      setDoc(doc(asStudent1(), 'quizKeys', 'quiz-evil'), {
        quizId: 'quiz-evil',
        answers: [{ n: 1, correctLetter: 'A', correctText: 'Fake' }],
      }),
    );
  });
  it('(o6) moderator marking a PENDING written attempt (marking fields only) is ALLOWED; rewriting an MCQ attempt or changing quizId is DENIED', async () => {
    const db1 = asStudent1();
    const writtenRef = await addDoc(collection(db1, 'users', 'student-1', 'quizAttempts'), {
      quizId: 'quiz1',
      kind: 'written',
      answers: [{ n: 1, topic: 'Drama', text: 'An essay.', correct: null, marks: null }],
      score: 0,
      totalMarks: 10,
      percentage: 0,
      markingStatus: 'pending',
    });
    const mcqRef = await addDoc(collection(db1, 'users', 'student-1', 'quizAttempts'), {
      quizId: 'quiz1',
      kind: 'mcq',
      answers: [{ n: 1, topic: 'Drama', selected: 'B', correct: true, marks: 1 }],
      score: 1,
      totalMarks: 1,
      percentage: 100,
      markingStatus: 'auto',
    });
    // Moderator marks the pending written attempt: ALLOWED.
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'users', 'student-1', 'quizAttempts', writtenRef.id), {
        marks: [8],
        score: 8,
        percentage: 80,
        markingStatus: 'marked',
        markedBy: 'moderator-1',
      }),
    );
    // Moderator may NOT change quizId of a pending attempt.
    const writtenRef2 = await addDoc(collection(db1, 'users', 'student-1', 'quizAttempts'), {
      quizId: 'quiz1',
      kind: 'written',
      answers: [{ n: 1, topic: 'Drama', text: 'An essay.', correct: null, marks: null }],
      score: 0,
      totalMarks: 10,
      percentage: 0,
      markingStatus: 'pending',
    });
    await assertFails(
      updateDoc(doc(asModerator(), 'users', 'student-1', 'quizAttempts', writtenRef2.id), {
        quizId: 'quiz-other',
      }),
    );
    // Moderator may NOT rewrite an MCQ ('auto') attempt.
    await assertFails(
      updateDoc(doc(asModerator(), 'users', 'student-1', 'quizAttempts', mcqRef.id), {
        score: 0,
        percentage: 0,
      }),
    );
    // The student themselves may NOT update even their own pending attempt.
    await assertFails(updateDoc(doc(db1, 'users', 'student-1', 'quizAttempts', writtenRef2.id), { score: 10 }));
  });
  it('(o7) moderator reading a student’s attempt (to mark it) is ALLOWED', async () => {
    const ref = await addDoc(collection(asStudent1(), 'users', 'student-1', 'quizAttempts'), {
      quizId: 'quiz1',
      kind: 'written',
      answers: [{ n: 1, topic: 'Drama', text: 'An essay.', correct: null, marks: null }],
      score: 0,
      totalMarks: 10,
      percentage: 0,
      markingStatus: 'pending',
    });
    await assertSucceeds(getDoc(doc(asModerator(), 'users', 'student-1', 'quizAttempts', ref.id)));
  });
});
