// Eduvelto — user profile documents (`users/{uid}`).
//
// Shape: database-schema.md §2.1. Document ID = Firebase Auth UID.
// The Firestore security rules (firestore.rules, `users` match) are the
// enforcement layer, and this module only ever writes what the rules
// allow the owner to write:
//
// - CREATE (first sign-in): displayName (non-empty, <=100), email,
//   role == 'student', language in ['bn','en'], createdAt / updatedAt /
//   lastActiveAt. The rules DENY create when `isActive` or
//   `verificationStatus` is present in the document — so this module does
//   NOT write either of them. (The plan Step 1 text and the schema example
//   show `isActive: true` at creation, but the committed rule forbids it;
//   the rule wins. The app treats a MISSING isActive as active — an
//   account is suspended only when isActive is explicitly `false`.)
// - UPDATE (owner): only displayName, educationType, board, institution,
//   academicYear, program, department, classLevel, language, lastActiveAt,
//   updatedAt. Role, verificationStatus and isActive can never be changed
//   by the owner — only Admin/Owner (see firestore.rules).

import { FirebaseError } from 'firebase/app';
import type { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';

export type EducationType = 'general' | 'madrasa' | 'technical' | 'higher' | 'other';

export type UserRole = 'owner' | 'admin' | 'moderator' | 'teacher' | 'student' | 'parent';

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
  language: 'bn' | 'en';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastActiveAt?: Timestamp | null;
  /** Absent = active. Only an explicit `false` (set by Admin) suspends. */
  isActive?: boolean;
  /** Reason for suspension, shown to the user on the suspended screen. Admin-set only. */
  suspendedReason?: string;
  /** Admin-set only; the client never writes this field. */
  verificationStatus?: string;
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
): Promise<{ profile: UserProfile; created: boolean }> {
  const existing = await getUserProfile(db, user.uid);
  if (existing) return { profile: existing, created: false };

  const displayName = (preferredDisplayName ?? user.displayName ?? '').trim() || fallbackDisplayName(user);
  // NOTE: no `isActive`, no `verificationStatus` — the security rules deny
  // create when either is present (see the module header).
  const data = {
    displayName: displayName.slice(0, 100),
    email: user.email ?? '',
    role: 'student' as const,
    language: 'bn' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };
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
  await updateDoc(doc(db, 'users', uid), clean);
  const updated = await getUserProfile(db, uid);
  if (!updated) throw new Error('profile-read-failed');
  return updated;
}

/**
 * Friendly Bangla message for Firebase Auth / Firestore errors.
 * The raw code is also logged to the console for debugging — the UI
 * never shows a bare error code.
 */
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
    case 'auth/unauthorized-domain':
      return 'এই ডোমেইন থেকে সাইন-ইন অনুমোদিত নয়।';
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
