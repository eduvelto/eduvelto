/**
 * Seed the Firestore + Auth emulators with screenshot accounts for the
 * role dashboards (DEV/STAGING ONLY — never run against live Firebase).
 *
 * Creates, in the emulator project `eduvelto`:
 *   student@shot.eduvelto  / shot1234  — Class 5 student
 *   ssc@shot.eduvelto      / shot1234  — SSC student (the POPULATED student case)
 *   teacher@shot.eduvelto  / shot1234  — verified English teacher (3rd Year)
 *   guardian@shot.eduvelto / shot1234  — parent, verified link to the student
 *   owner@shot.eduvelto    / shot1234  — owner (AdminGuard is owner-only)
 *   admin@shot.eduvelto    / shot1234  — admin (correctly DENIED /admin/*)
 *   child2@shot.eduvelto   / shot1234  — second child, PENDING link
 * plus Published books, the verified + pending parentLinks,
 * progress/bookmarks/summaries for the student, and the teacher's
 * verified teacherVerifications record.
 *
 * BOOK MATCHING (why the Class 5 student sees NO books — correct):
 * bookTypesForProfile('general') = ['SSC', 'HSC'] and the Class 5
 * fixtures carry educationType 'general' (a profile enum value, never
 * a real book value), so no Class 5 book can match yet — the empty
 * state is the honest outcome until real Class 1–5 books exist with a
 * mapped book educationType (open decision, see the test report §5).
 * The SSC student + SSC books are the positive control: they DO match
 * (educationType 'SSC', classLevel 'SSC') and prove the student path
 * renders matching books and nothing else.
 *
 * RUN: FIRESTORE_EMULATOR_PORT=8083 AUTH_EMULATOR_PORT=9099 node scripts/seed-dashboard-screenshots.mjs
 * (ports must match the running emulator; the script does NOT start one.)
 * Firestore writes use withSecurityRulesDisabled (the harness seeding
 * its own emulator data); Auth users are created through the Auth
 * emulator REST API.
 */
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FS_PORT = Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080);
const AUTH_PORT = Number(process.env.AUTH_EMULATOR_PORT ?? 9099);
const RULES = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../firestore.rules'), 'utf8');
const PASSWORD = 'shot1234';

async function createAuthUser(email) {
  const res = await fetch(
    `http://127.0.0.1:${AUTH_PORT}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true }),
    },
  );
  const body = await res.json();
  if (!res.ok) throw new Error(`signUp ${email} failed: ${JSON.stringify(body)}`);
  return body.localId;
}

const env = await initializeTestEnvironment({
  projectId: 'eduvelto',
  firestore: { host: '127.0.0.1', port: FS_PORT },
});
await env.clearFirestore();

const uid = {};
for (const name of ['student', 'ssc', 'teacher', 'guardian', 'owner', 'admin', 'child2', 'teacher2']) {
  uid[name] = await createAuthUser(`${name}@shot.eduvelto`);
  console.log(`${name}: ${uid[name]}`);
}

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  const user = (id, role, extra = {}) =>
    setDoc(doc(db, 'users', id), {
      displayName: id,
      email: '',
      role,
      language: 'bn',
      isActive: true,
      ...extra,
    });
  await user(uid.student, 'student', {
    displayName: 'Shot Student',
    email: 'student@shot.eduvelto',
    educationType: 'general',
    board: 'Dhaka',
    institution: 'Test School',
    classLevel: 'Class 5',
  });
  await user(uid.ssc, 'student', {
    displayName: 'Shot SSC Student',
    email: 'ssc@shot.eduvelto',
    educationType: 'general',
    board: 'Dhaka',
    institution: 'Test School',
    classLevel: 'SSC',
  });
  await user(uid.owner, 'owner', { displayName: 'Shot Owner', email: 'owner@shot.eduvelto' });
  await user(uid.teacher, 'teacher', {
    displayName: 'Shot Teacher',
    email: 'teacher@shot.eduvelto',
    verificationStatus: 'verified',
    subjects: ['English'],
    classLevel: '3rd Year',
    teachingLevel: 'Honours',
    educationType: 'higher',
    department: 'English',
    institution: 'Test College',
    qualifications: 'M.A. English',
  });
  await user(uid.guardian, 'parent', {
    displayName: 'Shot Guardian',
    email: 'guardian@shot.eduvelto',
    phone: '01700000001',
  });
  await user(uid.admin, 'admin', { displayName: 'Shot Admin', email: 'admin@shot.eduvelto' });
  await user(uid.child2, 'student', {
    displayName: 'Shot Child Two',
    email: 'child2@shot.eduvelto',
    educationType: 'general',
    board: 'Dhaka',
    institution: 'Test School',
    classLevel: 'Class 6',
  });
  await user(uid.teacher2, 'teacher', {
    displayName: 'Shot Teacher Two',
    email: 'teacher2@shot.eduvelto',
    verificationStatus: 'pending',
    subjects: ['Mathematics'],
    classLevel: 'SSC',
    teachingLevel: 'Secondary',
    educationType: 'general',
    institution: 'Test School',
    qualifications: 'B.Sc. Mathematics',
  });

  // Books: 2 Class 5 fixtures (correctly UNMATCHABLE — see header),
  // 2 matching the teacher, 1 wrong-class, 2 matching the SSC student.
  const book = (id, extra) =>
    setDoc(doc(db, 'books', id), {
      title: id,
      paperCode: 'SHOT',
      reviewStatus: 'Published',
      educationType: 'general',
      classLevel: 'Class 5',
      department: '',
      ...extra,
    });
  await book('shot-book-class5-math', { title: 'Class 5 Mathematics', department: 'Mathematics' });
  await book('shot-book-class5-eng', { title: 'Class 5 English', department: 'English' });
  await book('shot-book-ssc-math', {
    title: 'SSC General Mathematics',
    educationType: 'SSC',
    classLevel: 'SSC',
    department: 'Mathematics',
  });
  await book('shot-book-ssc-eng', {
    title: 'SSC English',
    educationType: 'SSC',
    classLevel: 'SSC',
    department: 'English',
  });
  await book('shot-book-hons-eng', {
    title: 'Elizabethan and Jacobean Drama',
    paperCode: '231101',
    educationType: 'Higher',
    department: 'English',
    classLevel: '3rd Year',
  });
  await book('shot-book-hons-poetry', {
    title: '17th and 18th Century Poetry',
    paperCode: '231103',
    educationType: 'Higher',
    department: 'English',
    classLevel: '3rd Year',
  });
  await book('shot-book-wrong-class', {
    title: 'Class 9 Physics (must never appear on the Class 5 dashboard)',
    educationType: 'general',
    classLevel: 'Class 9',
    department: 'Physics',
  });

  // Guardian links: verified to the student, pending to child2.
  await setDoc(doc(db, 'parentLinks', `${uid.guardian}_${uid.student}`), {
    parentId: uid.guardian,
    studentId: uid.student,
    status: 'verified',
    guardianDisplayName: 'Shot Guardian',
    relationship: 'Father',
    guardianContact: '01700000001',
    childDisplayName: 'Shot Student',
    childClassLevel: 'Class 5',
    childInstitution: 'Test School',
    childEducationType: 'general',
    childBoard: 'Dhaka',
    verifiedBy: uid.admin,
  });
  await setDoc(doc(db, 'parentLinks', `${uid.guardian}_${uid.child2}`), {
    parentId: uid.guardian,
    studentId: uid.child2,
    status: 'pending',
    guardianDisplayName: 'Shot Guardian',
    relationship: 'Father',
    guardianContact: '01700000001',
    childDisplayName: 'Shot Child Two',
    childClassLevel: 'Class 6',
    childInstitution: 'Test School',
    childEducationType: 'general',
    childBoard: 'Dhaka',
  });

  // Student progress / bookmarks / summaries.
  await setDoc(doc(db, 'progress', 'shot-prog-1'), {
    userId: uid.student,
    subject: 'Mathematics',
    lessonsRead: 3,
    questionsAttempted: 12,
  });
  await setDoc(doc(db, 'progress', 'shot-prog-2'), {
    userId: uid.student,
    subject: 'English',
    lessonsRead: 1,
    questionsAttempted: 4,
  });
  await setDoc(doc(db, 'bookmarks', 'shot-bm-1'), { userId: uid.student, bookId: 'shot-book-class5-math' });
  await setDoc(doc(db, 'progressSummaries', 'shot-sum-math'), {
    userId: uid.student,
    subject: 'Mathematics',
    averagePercentage: 45,
  });
  await setDoc(doc(db, 'progressSummaries', 'shot-sum-eng'), {
    userId: uid.student,
    subject: 'English',
    averagePercentage: 85,
  });

  // Teacher's verified application record.
  await setDoc(doc(db, 'teacherVerifications', `tv_${uid.teacher}`), {
    id: `tv_${uid.teacher}`,
    userId: uid.teacher,
    fullName: 'Shot Teacher',
    teachingLevel: 'Honours',
    subjects: ['English'],
    classes: ['3rd Year'],
    institution: 'Test College',
    post: 'Assistant Teacher',
    institutionContact: '01700000009',
    qualifications: 'M.A. English',
    experienceYears: 4,
    verificationReason: 'I teach English at Test College.',
    evidenceRef: '',
    status: 'verified',
    verificationStatus: 'verified',
    checkedBy: uid.admin,
    reason: 'Institution confirmed by phone.',
    checks: { identity: true, institution: true, subject: true, adult: true },
  });

  // One audit entry so /admin/audit is not empty.
  await addDoc(collection(db, 'adminActions'), {
    actorId: uid.admin,
    action: 'guardian-link-approved',
    details: 'Shot Guardian → Shot Student — information matches.',
    targetId: `${uid.guardian}_${uid.student}`,
    before: 'confirmed',
    after: 'verified',
    reason: 'Information matches the school record.',
    createdAt: new Date(),
  });
});

console.log('Seed done. Log in as student@shot.eduvelto / teacher@shot.eduvelto / guardian@shot.eduvelto / admin@shot.eduvelto (password shot1234).');
await env.cleanup();
process.exit(0);
