// Eduvelto — Job Preparation student-profile fields (Step 4, 22 Nov 2026).
//
// The five Job fields on `users/{uid}` (Step 3 §2.25, §3.1):
//   enrolledCategories, targetExam, dailyGoalQuestions, dailyGoalMinutes,
//   jobOnboarded. Defaults are null / absent = undecided — NEVER a fake
//   default goal (Step 3 §12.3 item 5; the Step 2 §13.4 default — 30
//   questions / 30 minutes — is still an open owner decision, so the
//   code stores null until the student picks a goal).
//
// Removing a category NEVER deletes progress: progress is keyed to
// content IDs, not to the profile — the profile only decides what is
// SHOWN, never what is KEPT (same invariant as profile.ts).
//
// SIGNED-OUT LOCAL FALLBACK (Step 3 §12.3 item 4 — Step 4 decision,
// recorded in team/job-auth-profiles-step4.md):
//   * jobMode: already local (jobMode.ts) — unchanged.
//   * enrolledCategories / targetExam / dailyGoalQuestions /
//     dailyGoalMinutes: kept as a LOCAL DRAFT in localStorage while
//     signed out (same pattern as jobMode.ts: the profile wins on
//     sign-in, the local value is never read over it, and the local
//     draft is never auto-uploaded to the profile).
//   * jobOnboarded: NO local fallback — it records that the signed-in
//     onboarding screen was shown; signed-out visitors never see that
//     screen, so there is nothing to record locally.
//   * While signed in, ProfilePage also writes the saved job values to
//     the local draft, so this browser's fallback stays in sync (again
//     the jobMode.ts pattern) for a later signed-out visit.

import type { UserProfile } from './profile';

/** The 10 Job categories (Step 2 §0.4) — the only values
 * `enrolledCategories` may hold (enforced in firestore.rules §3.1). */
export const JOB_CATEGORY_SLUGS = [
  'bcs-bpsc',
  'govt',
  'bank',
  'primary-teacher',
  'ntrca-teacher',
  'defence-police',
  'autonomous',
  'ngo-private',
  'it-professional',
  'other-competitive',
] as const;

export type JobCategorySlug = (typeof JOB_CATEGORY_SLUGS)[number];

export const JOB_CATEGORIES: { slug: JobCategorySlug; bn: string; en: string }[] = [
  { slug: 'bcs-bpsc', bn: 'BCS ও BPSC', en: 'BCS & BPSC' },
  { slug: 'govt', bn: 'সরকারি চাকরি', en: 'Government Jobs' },
  { slug: 'bank', bn: 'ব্যাংক', en: 'Bank' },
  { slug: 'primary-teacher', bn: 'প্রাথমিক শিক্ষক', en: 'Primary Teacher' },
  { slug: 'ntrca-teacher', bn: 'NTRCA ও শিক্ষক নিয়োগ', en: 'NTRCA & Teacher Recruitment' },
  { slug: 'defence-police', bn: 'সেনা/নৌ/বিমান বাহিনী ও পুলিশ', en: 'Defence & Police' },
  { slug: 'autonomous', bn: 'স্বায়ত্তশাসিত ও বিশেষায়িত প্রতিষ্ঠান', en: 'Autonomous & Specialised Institutions' },
  { slug: 'ngo-private', bn: 'NGO ও বেসরকারি', en: 'NGO & Private' },
  { slug: 'it-professional', bn: 'IT ও পেশাগত চাকরি', en: 'IT & Professional Jobs' },
  { slug: 'other-competitive', bn: 'অন্যান্য প্রতিযোগিতামূলক নিয়োগ পরীক্ষা', en: 'Other Competitive Exams' },
];

/** The 14 hub slugs `targetExam` may hold (Step 3 §3.1 — includes
 * 'it-professional', whose hub arrives in Step 5; the rules accept it
 * already, the UI lists it once the hub exists). */
export const TARGET_EXAM_SLUGS = [
  'bcs',
  'bank',
  'primary-teacher',
  'ntrca',
  'dgfood',
  'bpsc-non-cadre',
  'cag',
  'bfsa',
  'others',
  'ministries',
  'defence',
  'autonomous',
  'private-ngo',
  'it-professional',
] as const;

export type TargetExamSlug = (typeof TARGET_EXAM_SLUGS)[number];

export function isJobCategorySlug(value: unknown): value is JobCategorySlug {
  return typeof value === 'string' && (JOB_CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function isTargetExamSlug(value: unknown): value is TargetExamSlug {
  return typeof value === 'string' && (TARGET_EXAM_SLUGS as readonly string[]).includes(value);
}

/** Keep only valid category slugs, de-duplicated, at most 10. */
export function sanitizeEnrolledCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const v of value) {
    if (isJobCategorySlug(v) && !seen.has(v)) seen.add(v);
  }
  return [...seen].slice(0, 10);
}

/** Daily-goal bounds (Step 3 §3.1): questions 0–500, minutes 0–600.
 * Anything outside the range or not a finite number reads as null
 * (undecided) — never silently clamped into a fake goal. */
export function clampDailyGoalQuestions(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const n = Math.floor(value);
  return n >= 0 && n <= 500 ? n : null;
}

export function clampDailyGoalMinutes(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const n = Math.floor(value);
  return n >= 0 && n <= 600 ? n : null;
}

// ---------- signed-out local draft (Step 3 §12.3 item 4) ----------

const LOCAL_CATEGORIES_KEY = 'eduvelto-job-categories';
const LOCAL_TARGET_EXAM_KEY = 'eduvelto-job-target-exam';
const LOCAL_DAILY_GOAL_KEY = 'eduvelto-job-daily-goal';

export interface JobLocalDraft {
  enrolledCategories: string[];
  targetExam: string | null;
  dailyGoalQuestions: number | null;
  dailyGoalMinutes: number | null;
}

export const EMPTY_JOB_DRAFT: JobLocalDraft = {
  enrolledCategories: [],
  targetExam: null,
  dailyGoalQuestions: null,
  dailyGoalMinutes: null,
};

/** Read the signed-out draft. Every value is re-validated on read, so
 * a hand-edited or stale localStorage entry can never inject a bad
 * slug or an out-of-range goal. */
export function readLocalJobDraft(): JobLocalDraft {
  try {
    const categories = sanitizeEnrolledCategories(
      JSON.parse(window.localStorage.getItem(LOCAL_CATEGORIES_KEY) ?? '[]'),
    );
    const targetRaw = window.localStorage.getItem(LOCAL_TARGET_EXAM_KEY);
    const targetExam = isTargetExamSlug(targetRaw) ? targetRaw : null;
    let dailyGoalQuestions: number | null = null;
    let dailyGoalMinutes: number | null = null;
    try {
      const goal = JSON.parse(window.localStorage.getItem(LOCAL_DAILY_GOAL_KEY) ?? 'null');
      if (goal && typeof goal === 'object') {
        dailyGoalQuestions = clampDailyGoalQuestions(goal.questions);
        dailyGoalMinutes = clampDailyGoalMinutes(goal.minutes);
      }
    } catch {
      // Corrupt goal entry — treated as undecided.
    }
    return { enrolledCategories: categories, targetExam, dailyGoalQuestions, dailyGoalMinutes };
  } catch {
    return { ...EMPTY_JOB_DRAFT };
  }
}

/** Write the signed-out draft (or the signed-in fallback sync — see
 * the module header). Invalid values are dropped, never stored. */
export function writeLocalJobDraft(draft: Partial<JobLocalDraft>): void {
  try {
    if (draft.enrolledCategories !== undefined) {
      window.localStorage.setItem(
        LOCAL_CATEGORIES_KEY,
        JSON.stringify(sanitizeEnrolledCategories(draft.enrolledCategories)),
      );
    }
    if (draft.targetExam !== undefined) {
      if (isTargetExamSlug(draft.targetExam)) {
        window.localStorage.setItem(LOCAL_TARGET_EXAM_KEY, draft.targetExam);
      } else {
        window.localStorage.removeItem(LOCAL_TARGET_EXAM_KEY);
      }
    }
    if (draft.dailyGoalQuestions !== undefined || draft.dailyGoalMinutes !== undefined) {
      const current = readLocalJobDraft();
      const questions = clampDailyGoalQuestions(
        draft.dailyGoalQuestions !== undefined ? draft.dailyGoalQuestions : current.dailyGoalQuestions,
      );
      const minutes = clampDailyGoalMinutes(
        draft.dailyGoalMinutes !== undefined ? draft.dailyGoalMinutes : current.dailyGoalMinutes,
      );
      window.localStorage.setItem(
        LOCAL_DAILY_GOAL_KEY,
        JSON.stringify({ questions, minutes }),
      );
    }
  } catch {
    // Storage unavailable — the profile (when signed in) still holds
    // the choice; the local draft is a fallback only.
  }
}

/** Effective Job preferences for this browser: the signed-in profile
 * wins; signed-out visitors get their local draft. Used by the
 * ProfilePage Job section to prefill empty profile fields from a
 * draft made on this browser. */
export function effectiveJobPreferences(profile: UserProfile | null): JobLocalDraft {
  if (!profile) return readLocalJobDraft();
  const draft = readLocalJobDraft();
  return {
    enrolledCategories:
      Array.isArray(profile.enrolledCategories) && profile.enrolledCategories.length > 0
        ? sanitizeEnrolledCategories(profile.enrolledCategories)
        : draft.enrolledCategories,
    targetExam:
      profile.targetExam != null && isTargetExamSlug(profile.targetExam)
        ? profile.targetExam
        : draft.targetExam,
    dailyGoalQuestions:
      profile.dailyGoalQuestions != null
        ? clampDailyGoalQuestions(profile.dailyGoalQuestions)
        : draft.dailyGoalQuestions,
    dailyGoalMinutes:
      profile.dailyGoalMinutes != null
        ? clampDailyGoalMinutes(profile.dailyGoalMinutes)
        : draft.dailyGoalMinutes,
  };
}
