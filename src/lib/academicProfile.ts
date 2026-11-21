// Eduvelto — academic profiles & role-based content filtering (Step 5/7/8).
//
// A user's ACADEMIC PROFILE is the set of fields on `users/{uid}` that
// decides which books/subjects/chapters they see:
//   student: educationType, classLevel, group/department, board,
//            institution, curriculum, academicSession, semester
//            (Honours: university -> department -> year/semester ->
//            course/paper, as separate fields)
//   teacher: teachingLevel, class, subject, group/department,
//            board/curriculum, institution, qualification
//   guardian: no academic profile of their own — they see each linked
//            child's profile (parentLinks), never another family's child.
//
// FILTERING (the invariant): every dashboard query filters by the
// academic profile FIRST, then paginates (limit 50, startAfter). The
// filter uses EQUALITY constraints only (reviewStatus + educationType +
// classLevel + department/program as applicable) and NO orderBy, so it
// needs NO composite index — equality-only queries run on Firestore's
// single-field indexes. Client-side sort happens within the page
// (<=50 docs). When a profile matches no content, the dashboard shows
// the honest empty state — it NEVER shows another class's books.
//
// FIELD-VALUE MAPPING (grounded in scripts/load-library-content.mjs,
// which writes the books collection):
//   books.educationType: 'Higher' | 'Madrasa' | 'SSC' | 'HSC' |
//     'Technical' | (Class 1-5 generic folders — not in the 609)
//   books.board: 'National University' | 'Board of Intermediate and
//     Secondary Education' | 'Bangladesh Madrasa Education Board' |
//     'Bangladesh Technical Education Board'
//   books.program: 'Honours' | stream ('Science', ...) | madrasa level
//     ('Alim', ...) | trade
//   books.classLevel: '1st Year'..'4th Year' | 'SSC' | 'HSC' | level/trade
//   books.department: 'English' | 'Science' | ... (Honours: DEPT_NAMES)
// The profile stores the same human values (free text in the UI), and
// this module maps the profile's lowercase educationType enum to the
// book values. Board is matched only when it exactly equals a known
// board value — a mistyped board must NOT silently hide all content;
// it is ignored and the other constraints still apply (documented in
// the test report).

import type { UserProfile } from './profile';

/** Book `educationType` values present in the books collection. */
export const BOOK_EDUCATION_TYPES = ['Higher', 'Madrasa', 'SSC', 'HSC', 'Technical'] as const;

/** Known board values in the books collection (exact match only). */
export const KNOWN_BOARDS = [
  'National University',
  'Board of Intermediate and Secondary Education',
  'Bangladesh Madrasa Education Board',
  'Bangladesh Technical Education Board',
] as const;

export type ProfileEducationType = 'general' | 'madrasa' | 'technical' | 'higher' | 'other';

/**
 * Map a profile educationType to the book educationType values it can
 * match. 'general' covers school + college (SSC/HSC); the other values
 * map 1:1. 'other' matches nothing — the dashboard shows the empty
 * state instead of guessing.
 */
export function bookTypesForProfile(educationType: ProfileEducationType | null | undefined): string[] {
  switch (educationType) {
    case 'general':
      return ['SSC', 'HSC'];
    case 'madrasa':
      return ['Madrasa'];
    case 'technical':
      return ['Technical'];
    case 'higher':
      return ['Higher'];
    default:
      return [];
  }
}

export interface BookConstraint {
  field: 'educationType' | 'classLevel' | 'department' | 'program' | 'board';
  op: '==' | 'in';
  value: string | string[];
}

/**
 * Equality constraints for "books for this profile", in the order the
 * query builder applies them. Empty array = profile has no usable
 * academic fields yet (new account) — the caller must show the
 * "complete your academic profile" state, not an unfiltered list.
 * Honours: program 'Honours' + department + classLevel year; the
 * semester lives on the profile only (books carry no semester field —
 * recorded as a known gap in the test report).
 */
export function bookConstraintsForProfile(profile: UserProfile): BookConstraint[] {
  const constraints: BookConstraint[] = [];
  const types = bookTypesForProfile(profile.educationType ?? null);
  if (types.length === 1) {
    constraints.push({ field: 'educationType', op: '==', value: types[0] });
  } else if (types.length > 1) {
    constraints.push({ field: 'educationType', op: 'in', value: types });
  } else {
    return [];
  }
  const classLevel = (profile.classLevel ?? '').trim();
  if (classLevel) constraints.push({ field: 'classLevel', op: '==', value: classLevel });
  const department = (profile.department ?? '').trim();
  if (department) constraints.push({ field: 'department', op: '==', value: department });
  const program = (profile.program ?? '').trim();
  if (program) constraints.push({ field: 'program', op: '==', value: program });
  const board = (profile.board ?? '').trim();
  if (board && (KNOWN_BOARDS as readonly string[]).includes(board)) {
    constraints.push({ field: 'board', op: '==', value: board });
  }
  return constraints;
}

/**
 * Teacher constraints: only the teacher's own APPROVED (verified)
 * subjects/classes. An unverified teacher has no approved subjects —
 * this returns [] and the dashboard shows the pending banner, never
 * content. `approvedSubjects` / `approvedClasses` come from the
 * teacher's verified record (admin decision), not from self-typed
 * profile fields — the profile fields are the REQUEST, the verified
 * record is the APPROVAL.
 */
export function bookConstraintsForTeacher(
  approvedSubjects: string[],
  approvedClasses: string[],
  educationType: ProfileEducationType | null | undefined,
): BookConstraint[] {
  const constraints: BookConstraint[] = [];
  const types = bookTypesForProfile(educationType);
  if (types.length === 1) {
    constraints.push({ field: 'educationType', op: '==', value: types[0] });
  } else if (types.length > 1) {
    constraints.push({ field: 'educationType', op: 'in', value: types });
  } else {
    return [];
  }
  if (approvedClasses.length === 1) {
    constraints.push({ field: 'classLevel', op: '==', value: approvedClasses[0] });
  } else if (approvedClasses.length > 1) {
    constraints.push({ field: 'classLevel', op: 'in', value: approvedClasses });
  } else {
    return [];
  }
  if (approvedSubjects.length === 1) {
    constraints.push({ field: 'department', op: '==', value: approvedSubjects[0] });
  } else if (approvedSubjects.length > 1) {
    constraints.push({ field: 'department', op: 'in', value: approvedSubjects });
  } else {
    return [];
  }
  return constraints;
}

export interface BookLike {
  educationType: string;
  classLevel: string;
  department: string;
  program: string;
  board: string;
}

/**
 * Client-side predicate: does this book belong to this profile?
 * Used for (a) filtering already-fetched data in tests, and (b) as a
 * second defence in the UI — the server query is the enforcement, this
 * is a belt-and-braces check so a wrong-class book can never render.
 * Board is compared only when the profile board is a known board value.
 */
export function profileMatchesBook(profile: UserProfile, book: BookLike): boolean {
  const types = bookTypesForProfile(profile.educationType ?? null);
  if (types.length === 0) return false;
  if (!types.includes(book.educationType)) return false;
  const classLevel = (profile.classLevel ?? '').trim();
  if (classLevel && book.classLevel !== classLevel) return false;
  const department = (profile.department ?? '').trim();
  if (department && book.department !== department) return false;
  const program = (profile.program ?? '').trim();
  if (program && book.program !== program) return false;
  const board = (profile.board ?? '').trim();
  if (board && (KNOWN_BOARDS as readonly string[]).includes(board) && book.board !== board) return false;
  return true;
}

/** Human summary of a profile for dashboard headers. */
export function academicProfileSummary(profile: UserProfile): string {
  const parts = [
    profile.educationType ?? '',
    profile.classLevel ?? '',
    profile.department ?? '',
    profile.program ?? '',
    profile.board ?? '',
    profile.institution ?? '',
  ].filter(Boolean);
  return parts.join(' · ');
}

/** Empty states — never show another class's books. */
export const EMPTY_STATES = {
  noProfile: {
    bn: 'আপনার একাডেমিক প্রোফাইল এখনো সম্পূর্ণ হয়নি। প্রোফাইল সেটিংস থেকে শ্রেণি, বিভাগ ও বোর্ড বাছাই করুন।',
    en: 'Your academic profile is not complete yet. Choose your class, department and board in Profile Settings.',
  },
  noContent: {
    bn: 'এই শ্রেণির কনটেন্ট এখনো প্রস্তুত নয়। অন্য শ্রেণির বই এখানে দেখানো হয় না।',
    en: 'Content for this class is not ready yet. Books from other classes are never shown here.',
  },
  teacherPending: {
    bn: 'আপনার শিক্ষক ভেরিফিকেশন এখনো অনুমোদিত হয়নি। অনুমোদনের পর আপনার বিষয় ও শ্রেণির উপকরণ এখানে দেখা যাবে।',
    en: 'Your teacher verification is not approved yet. Your subjects and classes will appear here after approval.',
  },
  guardianNoChildren: {
    bn: 'এখনো কোনো সন্তান যুক্ত হয়নি। নিচে সন্তান যুক্ত করুন — যাচাই হওয়ার পর তার পড়াশোনা এখানে দেখা যাবে।',
    en: 'No child linked yet. Link a child below — their studies will appear here after verification.',
  },
} as const;
