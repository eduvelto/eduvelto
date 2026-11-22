// Eduvelto — user profile documents (`users/{uid}`).
//
// Shape: database-schema.md §2.1. Document ID = Firebase Auth UID.
// The Firestore security rules (firestore.rules, `users` match) are the
// enforcement layer, and this module only ever writes what the rules
// allow the owner to write:
//
// - CREATE (first sign-in): displayName (non-empty, <=100), email,
//   role in ['student', 'teacher', 'parent'] (Step 5 role-based
//   accounts — NEVER 'admin'/'moderator'/'owner' at creation; the rules
//   deny those), language in ['bn','en'], createdAt / updatedAt /
//   lastActiveAt, plus the academic fields the user chose at
//   registration (educationType, board, institution, academicYear,
//   program, department, classLevel, semester, academicSession,
//   curriculum, phone, teachingLevel, subjects, qualifications,
//   experienceYears). The rules DENY create when `isActive` or
//   `verificationStatus` is present in the document — so this module does
//   NOT write either of them. (The plan Step 1 text and the schema example
//   show `isActive: true` at creation, but the committed rule forbids it;
//   the rule wins. The app treats a MISSING isActive as active — an
//   account is suspended only when isActive is explicitly `false`.)
// - OWNER DECISION 21 Nov 2026: student identity verification is REMOVED
//   entirely. A student account is NEVER gated on any verification: no
//   NID, no face, no biometric, no manual approval, no wait — the account
//   works the moment it is created. `verificationStatus` below is the
//   mirror of a teacherVerifications record ONLY (teacher verification);
//   it is never a student-verification state, and no student access
//   decision may ever read it (enforced in firestore.rules by
//   validVerificationTransition()).
//   A teacher created here is UNVERIFIED (verificationStatus is set only
//   by the Admin decision in admin.ts, never at registration).
// - UPDATE (owner): only displayName, educationType, board, institution,
//   academicYear, program, department, classLevel, semester,
//   academicSession, curriculum, phone, teachingLevel, subjects,
//   qualifications, experienceYears, jobMode, enrolledCategories,
//   targetExam, dailyGoalQuestions, dailyGoalMinutes, jobOnboarded,
//   language, lastActiveAt, updatedAt. Role, verificationStatus and
//   isActive can never be changed by the owner — only Admin/Owner (see
//   firestore.rules).
//   Changing class/subject NEVER deletes progress, bookmarks, results or
//   learning history: progress is keyed to content IDs (book/chapter/
//   lesson), not to the profile — the profile only decides what is
//   SHOWN, never what is KEPT.

import { FirebaseError } from 'firebase/app';
import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';

export type EducationType = 'general' | 'madrasa' | 'technical' | 'higher' | 'other';

export type UserRole = 'owner' | 'admin' | 'moderator' | 'teacher' | 'student' | 'parent';

/** Verification state of a teacher (admin-set only, mirrored from the
 * teacherVerifications decision). 'pending' = registered, not approved. */
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'revoked';

export interface UserProfile {
  displayName: string;
  email: string;
  role: UserRole;
  educationType?: EducationType | null;
  board?: string | null;
  institution?: string | null;
  academicYear?: string | null;
  program?: string | null;
  department?: string | null;
  classLevel?: string | null;
  /** Honours / semester-based programmes: '1st Semester', '2nd Semester', … */
  semester?: string | null;
  /** Academic session, e.g. '2025-26'. Profile-only: books carry no session. */
  academicSession?: string | null;
  /** Curriculum / syllabus, e.g. 'NCTB 2023', 'NU 2013-14'. */
  curriculum?: string | null;
  /** Guardian-required phone (guardian accounts). Owner-editable by self. */
  phone?: string | null;
  /** Teacher-only: teaching level, e.g. 'SSC', 'HSC', 'Honours'. */
  teachingLevel?: string | null;
  /** Teacher-only: subjects the teacher teaches (the REQUEST — approval
   * lives in the teacherVerifications record, not here). */
  subjects?: string[] | null;
  /** Teacher-only: qualifications, free text. */
  qualifications?: string | null;
  /** Teacher-only: years of teaching experience. */
  experienceYears?: number | null;
  /** Job Preparation mode (owner decision 22 Nov 2026): 'beginner' =
   * brand-new students (easy explanations, basic practice, step by
   * step, no timers); 'advanced' = experienced candidates (hard
   * questions, timed exams, full model tests, competitive prep).
   * Absent = 'beginner'. Owner-editable by self; switchable any time. */
  jobMode?: 'beginner' | 'advanced' | null;
  /** Job Preparation — enrolled categories (10 slugs max, see
   * jobProfile.ts). Removing one never deletes progress. */
  enrolledCategories?: string[] | null;
  /** Job Preparation — target exam hub slug, or null = undecided. */
  targetExam?: string | null;
  /** Job Preparation — daily goal, questions (0–500) or null. */
  dailyGoalQuestions?: number | null;
  /** Job Preparation — daily goal, minutes (0–600) or null. */
  dailyGoalMinutes?: number | null;
  /** Job Preparation — first-time mode-choice screen shown. */
  jobOnboarded?: boolean | null;
  language: 'bn' | 'en';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastActiveAt?: Timestamp | null;
  /** Absent = active. Only an explicit `false` (set by Admin) suspends. */
  isActive?: boolean;
  /** Reason for suspension, shown to the user on the suspended screen. Admin-set only. */
  suspendedReason?: string;
  /**
   * Teacher-verification mirror ONLY (set by admin.ts decide/revoke/reopen).
   * NEVER a student-verification state: students are never required to have
   * it, and no student access decision may read it (owner decision
   * 21 Nov 2026 — student identity verification removed entirely).
   * A student whose teacher application was rejected/reopened may carry
   * 'rejected'/'pending' here; that is teacher-application state, not a
   * gate on the student account.
   */
  verificationStatus?: string;
  /** Admin-set only: uid of the admin who verified this teacher. */
  verifiedBy?: string | null;
  /** Admin-set only: when the teacher was verified. */
  verifiedAt?: Timestamp | null;
}

/** Fields the owner may edit on their own profile (rules allowlist). */
export interface ProfileEdit {
  displayName?: string;
  educationType?: EducationType | '' | null;
  board?: string | null;
  institution?: string | null;
  academicYear?: string | null;
  program?: string | null;
  department?: string | null;
  classLevel?: string | null;
  semester?: string | null;
  academicSession?: string | null;
  curriculum?: string | null;
  phone?: string | null;
  teachingLevel?: string | null;
  subjects?: string[] | null;
  qualifications?: string | null;
  experienceYears?: number | null;
  /** Job Preparation mode — see UserProfile.jobMode. */
  jobMode?: 'beginner' | 'advanced' | null;
  /** Job Preparation — enrolled categories (Step 4, Step 3 §2.25):
   * the 10 category slugs the student is preparing for
   * (jobProfile.ts JOB_CATEGORY_SLUGS). Removing a category NEVER
   * deletes progress — progress is keyed to content IDs, the profile
   * only decides what is SHOWN. Absent/empty = none enrolled yet. */
  enrolledCategories?: string[] | null;
  /** Job Preparation — target exam hub slug (Step 3 §2.25/§3.1), one
   * of the 14 hub slugs (jobProfile.ts TARGET_EXAM_SLUGS).
   * null/absent = undecided. */
  targetExam?: string | null;
  /** Job Preparation — daily goal, questions (0–500). null/absent =
   * undecided — NEVER a fake default goal (Step 3 §12.3 item 5; the
   * Step 2 §13.4 default of 30 is still an open owner decision). */
  dailyGoalQuestions?: number | null;
  /** Job Preparation — daily goal, minutes (0–600). null/absent =
   * undecided (same rule as dailyGoalQuestions). */
  dailyGoalMinutes?: number | null;
  /** Job Preparation — first-time mode-choice screen shown (Step 2
   * §1.8). false/absent = not shown yet. Set to true when the student
   * picks a mode or dismisses the screen ("পরে ঠিক করব"); never
   * forced again after that. */
  jobOnboarded?: boolean | null;
  language?: 'bn' | 'en';
}

const EDITABLE_KEYS: (keyof ProfileEdit)[] = [
  'displayName',
  'educationType',
  'board',
  'institution',
  'academicYear',
  'program',
  'department',
  'classLevel',
  'semester',
  'academicSession',
  'curriculum',
  'phone',
  'teachingLevel',
  'subjects',
  'qualifications',
  'experienceYears',
  'jobMode',
  'enrolledCategories',
  'targetExam',
  'dailyGoalQuestions',
  'dailyGoalMinutes',
  'jobOnboarded',
  'language',
];

function isUserProfile(data: unknown): data is UserProfile {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.displayName === 'string' &&
    d.displayName.length > 0 &&
    typeof d.email === 'string' &&
    typeof d.role === 'string' &&
    (d.language === 'bn' || d.language === 'en')
  );
}

/** Display name to use when the Auth user has none (e.g. Google without a name). */
export function fallbackDisplayName(user: User): string {
  const local = (user.email ?? '').split('@')[0].trim();
  return local.length > 0 ? local : 'শিক্ষার্থী';
}

/**
 * Read the user's profile doc. Returns null when the document does not
 * exist yet (first sign-in — the caller creates it via ensureUserProfile).
 */
export async function getUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!isUserProfile(data)) return null;
  return data;
}

export interface EnsureProfileOptions {
  /** Role chosen at registration. Defaults to 'student'. Admin /
   * moderator / owner are rejected here (and by the rules) — they are
   * never a registration choice. */
  role?: 'student' | 'teacher' | 'parent';
  /** Academic fields chosen at registration (only the rules-allowlisted
   * ones are written; anything else is dropped silently). */
  fields?: Partial<ProfileEdit>;
}

/**
 * Create the `users/{uid}` document on first sign-in, or return the
 * existing one. `preferredDisplayName` (typed at registration) wins over
 * the Auth display name when the document is created.
 *
 * Returns the profile and whether this call created it.
 */
export async function ensureUserProfile(
  db: Firestore,
  user: User,
  preferredDisplayName?: string,
  options?: EnsureProfileOptions,
): Promise<{ profile: UserProfile; created: boolean }> {
  const existing = await getUserProfile(db, user.uid);
  if (existing) return { profile: existing, created: false };

  const displayName = (preferredDisplayName ?? user.displayName ?? '').trim() || fallbackDisplayName(user);
  // NOTE: no `isActive`, no `verificationStatus` — the security rules deny
  // create when either is present (see the module header).
  const role = options?.role ?? 'student';
  const data: Record<string, unknown> = {
    displayName: displayName.slice(0, 100),
    email: user.email ?? '',
    role,
    language: 'bn' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };
  // Registration-time academic fields (allowlisted only).
  const f = options?.fields;
  if (f) {
    for (const key of EDITABLE_KEYS) {
      if (key === 'displayName' || key === 'language') continue;
      const v = f[key];
      if (v === undefined) continue;
      if (key === 'subjects') {
        if (Array.isArray(v)) data[key] = v.slice(0, 20).map((s) => String(s).slice(0, 100));
        continue;
      }
      if (key === 'experienceYears') {
        if (typeof v === 'number' && Number.isFinite(v)) data[key] = Math.max(0, Math.min(60, Math.floor(v)));
        continue;
      }
      data[key] = v === '' ? null : v;
    }
    if (f.language) data.language = f.language;
  }
  await setDoc(doc(db, 'users', user.uid), data);
  const created = await getUserProfile(db, user.uid);
  if (!created) throw new Error('profile-create-failed');
  return { profile: created, created: true };
}

/**
 * Update only the owner's editable profile fields. Sends only keys in the
 * rules allowlist, plus updatedAt. Throws on any rule denial.
 */
export async function updateUserProfile(db: Firestore, uid: string, fields: ProfileEdit): Promise<UserProfile> {
  const clean: Record<string, unknown> = {};
  for (const key of EDITABLE_KEYS) {
    const value = fields[key];
    if (value === undefined) continue;
    // An empty select/text means "not chosen" -> store null, never undefined.
    clean[key] = value === '' ? null : value;
  }
  clean.updatedAt = serverTimestamp();
  // Audit invariant (Step 5): every profile change writes an audit-log
  // entry (adminActions, action 'profile-changed') in the SAME batch as
  // the update — the change and its audit trail succeed or fail
  // together. before/after are JSON strings (same convention as
  // admin.ts auditEntryData). The rules allow a user to append ONLY this
  // action for their own uid; the log stays append-only for everyone.
  const current = await getUserProfile(db, uid);
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  for (const key of Object.keys(clean)) {
    if (key === 'updatedAt') continue;
    before[key] = current ? ((current as unknown as Record<string, unknown>)[key] ?? null) : null;
    after[key] = clean[key];
  }
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid), clean);
  batch.set(doc(collection(db, 'adminActions')), {
    actorId: uid,
    action: 'profile-changed',
    details: `Profile updated: ${Object.keys(after).join(', ')}`.slice(0, 1000),
    targetId: uid,
    before: JSON.stringify(before).slice(0, 500),
    after: JSON.stringify(after).slice(0, 500),
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  const updated = await getUserProfile(db, uid);
  if (!updated) throw new Error('profile-read-failed');
  return updated;
}

/**
 * Friendly Bangla message for Firebase Auth / Firestore errors.
 * The raw code is also logged to the console for debugging, and shown
 * in small text under the message (see authErrorCode) so a failure can
 * be diagnosed from a screenshot alone — a bare code is never shown
 * *instead of* the friendly message.
 *
 * 21 Nov 2026 — Google login fix: the owner tapped "Google দিয়ে লগইন"
 * on his phone and got the generic default message immediately, with
 * no account chooser. That means the code was one of the unmapped
 * ones below (popup never opened: operation-not-supported in the
 * WebView/PWA context, or storage blocked) — previously invisible.
 * Those codes now have their own messages.
 */
export function authErrorCode(error: unknown): string | null {
  if (error instanceof FirebaseError) return error.code;
  if (error instanceof Error && error.message.startsWith('auth/')) return error.message;
  return null;
}

export function friendlyErrorMessage(error: unknown): string {
  const code =
    error instanceof FirebaseError
      ? error.code
      : error instanceof Error
        ? error.message
        : 'unknown';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করুন।';
    case 'auth/invalid-email':
      return 'ইমেইল ঠিকানাটি সঠিক নয়।';
    case 'auth/weak-password':
      return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'ইমেইল বা পাসওয়ার্ড ভুল।';
    case 'auth/user-disabled':
      return 'এই অ্যাকাউন্টটি বন্ধ করা হয়েছে।';
    case 'auth/operation-not-allowed':
      return 'এই সাইন-ইন পদ্ধতি এখনো চালু হয়নি। Firebase console-এ Email/Password বা Google সাইন-ইন চালু করতে হবে।';
    case 'auth/popup-closed-by-user':
      return 'Google সাইন-ইন বন্ধ করা হয়েছে। আবার চেষ্টা করুন।';
    case 'auth/cancelled-popup-request':
    case 'auth/popup-blocked':
      return 'ব্রাউজার পপ-আপ আটকে দিয়েছে। পপ-আপ চালু করে আবার চেষ্টা করুন।';
    case 'auth/redirect-cancelled-by-user':
      return 'Google সাইন-ইন বন্ধ করা হয়েছে। আবার চেষ্টা করুন।';
    case 'auth/operation-not-supported-in-this-environment':
      return 'এই ব্রাউজার/অ্যাপে Google সাইন-ইন খুলছে না। Chrome ব্রাউজারে সাইটটি খুলে আবার চেষ্টা করুন।';
    case 'auth/web-storage-unsupported':
      return 'ব্রাউজারে স্টোরেজ বন্ধ আছে। ব্রাউজার সেটিংসে কুকি ও স্টোরেজ চালু করে আবার চেষ্টা করুন।';
    case 'auth/account-exists-with-different-credential':
      return 'এই ইমেইল দিয়ে ইতিমধ্যে পাসওয়ার্ড-অ্যাকাউন্ট আছে। পাসওয়ার্ড দিয়ে লগইন করুন।';
    case 'auth/unauthorized-domain':
      return 'এই ডোমেইন থেকে সাইন-ইন অনুমোদিত নয়।';
    case 'auth/internal-error':
      // Server-side failure during the Google redirect return (the
      // Firebase/Google OAuth exchange failed, not the app's code).
      // 21 Nov 22:04 follow-up: the owner got this after the redirect
      // fix went live. Tell the user to retry once (it can be
      // transient) and that email/password login still works; the
      // lasting fix is a Firebase console check (OAuth consent
      // screen / Google provider client — see the fix report).
      return 'Google লগইনে সার্ভারের সমস্যা হয়েছে। একবার আবার চেষ্টা করুন — না হলে ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।';
    case 'auth/network-request-failed':
      return 'নেটওয়ার্ক সমস্যা। সংযোগ দেখে আবার চেষ্টা করুন।';
    case 'auth/too-many-requests':
      return 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
    case 'permission-denied':
      return 'ডাটাবেস অনুমতি দেয়নি — Firestore নিয়ম এখনো বসানো হয়নি, অথবা এই কাজের অনুমতি আপনার নেই।';
    case 'not-found':
    case 'failed-precondition':
      return 'Firestore ডাটাবেস এখনো তৈরি হয়নি।';
    case 'unavailable':
      return 'Firebase-এ পৌঁছানো যাচ্ছে না। সংযোগ দেখে আবার চেষ্টা করুন।';
    case 'profile-create-failed':
    case 'profile-read-failed':
      return 'প্রোফাইল পড়া বা তৈরি করা যায়নি। আবার চেষ্টা করুন।';
    default:
      if (typeof console !== 'undefined') console.error('[Eduvelto] error:', code, error);
      return 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।';
  }
}
