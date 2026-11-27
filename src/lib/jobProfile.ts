// Eduvelto — Job Preparation student-profile fields (Step 4, 22 Nov 2026;
// ChatGPT-review fold-in, Step 4 closure, 22 Nov 2026).
//
// The five Job fields on `users/{uid}` (Step 3 §2.25, §3.1):
//   enrolledCategories, targetExam, dailyGoalQuestions, dailyGoalMinutes,
//   jobOnboarded. Defaults are null / absent = undecided — NEVER a fake
//   default goal (Step 3 §12.3 item 5; the Step 2 §13.4 default — 30
//   questions / 30 minutes — is still an open owner decision, so the
//   code stores null until the student picks a goal).
//
// NULL-vs-0 (ChatGPT review — BINDING semantics, rules + UI agree):
//   * dailyGoalQuestions / dailyGoalMinutes: null/absent = NOT
//     configured; 0 = the student EXPLICITLY set a zero goal; a positive
//     integer = the daily target. The form and the dashboard must never
//     turn a 0 into "undecided" or a null into a fake goal.
//   * targetExam: null/absent = undecided; a slug = the student's
//     PRIMARY target exam (single target accepted temporarily — it does
//     NOT represent every category's target; Step 5 must not assume so).
//   * enrolledCategories: absent or [] = none enrolled yet; removing a
//     category NEVER deletes progress (progress is keyed to content IDs,
//     not to the profile — the profile only decides what is SHOWN).
//   * jobOnboarded: absent/false = the mode-choice screen has not been
//     handled yet; true = handled (picked a mode OR "decide later").
//     It says NOTHING about profile completion or learning progress.
//
// LOCAL STORAGE — ACCOUNT ISOLATION (ChatGPT review P0 — the old global
// keys `eduvelto-job-categories` / `eduvelto-job-target-exam` /
// `eduvelto-job-daily-goal` let one student's saved values prefill
// ANOTHER student's ProfilePage on a shared browser; that bug is fixed
// here and must never come back):
//   * ANONYMOUS drafts only: `eduvelto-job-anonymous-*` — written and
//     read ONLY while signed out. A signed-in student's profile is the
//     ONLY source of truth; nothing is ever written to localStorage
//     from a signed-in save, and the anonymous draft is NEVER read over
//     a signed-in profile.
//   * NO authenticated localStorage cache at all (the simpler arrangement
//     ChatGPT favoured): signed-in students use the Firestore profile.
//   * An anonymous draft becomes profile data ONLY through an EXPLICIT
//     import decision (draftImportCandidates + the ProfilePage prompt):
//     the student reviews the draft values and saves them through the
//     normal profile flow, or declines — the draft is cleared after
//     either resolution. Never auto-merge, never auto-restore stale
//     drafts. The import offer appears ONLY for profile fields that
//     are ABSENT from the document (field presence, not truthiness —
//     an explicitly-cleared [] or null still wins and is never offered
//     an import for that field).
//   * The same isolation applies to the mode fallback (jobMode.ts):
//     anonymous key `eduvelto-job-anonymous-mode` only; the legacy
//     global key `eduvelto-job-mode` is no longer read or written
//     (signed-out visitors see Beginner once, until they pick a mode;
//     every signed-in user's real choice still lives on the profile).

import type { UserProfile } from './profile';
import { JOB_EXAMS, type JobExamDef } from './jobExams';

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

/**
 * CANONICAL CATEGORY → HUB MAPPING (ChatGPT review P1 — Step 5
 * taxonomy centralization). This is the ONE place that says which hubs
 * belong to which category (Step 2 §0.4). Checkboxes, dropdowns,
 * dashboard labels, filtering and validation must all derive from
 * here (jobCategoryOfExam / jobCategoryHubs) — never from a second
 * hand-maintained list. firestore.rules keeps its own allowlists
 * (rules cannot import TypeScript) — that is a deliberate sync
 * responsibility, pinned by the taxonomy unit test
 * (src/lib/__tests__/jobTaxonomy.test.ts).
 *
 * Accents are copied from the category's primary hub (jobExams.ts);
 * white text on each accent passes WCAG AA (measured 21 Nov 2026 —
 * the IT accent #1E3A5F is pinned by the same unit test).
 */
export interface JobCategoryDef {
  slug: JobCategorySlug;
  bn: string;
  en: string;
  /** Hub slugs in this category (Step 2 §0.4). */
  hubSlugs: string[];
  accent: string;
  accentSoft: string;
  accentDeep: string;
  descriptionBn: string;
  descriptionEn: string;
}

export const JOB_CATEGORIES: JobCategoryDef[] = [
  {
    slug: 'bcs-bpsc',
    bn: 'BCS ও BPSC',
    en: 'BCS & BPSC',
    hubSlugs: ['bcs', 'bpsc-non-cadre'],
    accent: '#12766E',
    accentSoft: '#E3F2F0',
    accentDeep: '#0F5E57',
    descriptionBn: 'বিসিএস ও BPSC-র অন্যান্য নিয়োগ পরীক্ষা।',
    descriptionEn: 'BCS and other BPSC recruitment exams.',
  },
  {
    slug: 'govt',
    bn: 'সরকারি চাকরি',
    en: 'Government Jobs',
    hubSlugs: ['ministries', 'dgfood', 'cag', 'bfsa', 'grade-11-20'],
    accent: '#3730A3',
    accentSoft: '#E8E9FB',
    accentDeep: '#312E81',
    descriptionBn: 'মন্ত্রণালয়, অধিদপ্তর ও সরকারি সংস্থার নিয়োগ পরীক্ষা।',
    descriptionEn: 'Recruitment exams for ministries, directorates and government bodies.',
  },
  {
    slug: 'bank',
    bn: 'ব্যাংক',
    en: 'Bank',
    hubSlugs: ['bank'],
    accent: '#1D4ED8',
    accentSoft: '#E7EDFC',
    accentDeep: '#1E3A8A',
    descriptionBn: 'বাংলাদেশ ব্যাংক ও অন্যান্য ব্যাংকের নিয়োগ পরীক্ষা।',
    descriptionEn: 'Recruitment exams for Bangladesh Bank and other banks.',
  },
  {
    slug: 'primary-teacher',
    bn: 'প্রাথমিক শিক্ষক',
    en: 'Primary Teacher',
    hubSlugs: ['primary-teacher'],
    accent: '#15803D',
    accentSoft: '#E7F4EB',
    accentDeep: '#14532D',
    descriptionBn: 'সরকারি প্রাথমিক বিদ্যালয়ের সহকারী শিক্ষক নিয়োগ।',
    descriptionEn: 'Government primary school assistant teacher recruitment.',
  },
  {
    slug: 'ntrca-teacher',
    bn: 'NTRCA ও শিক্ষক নিয়োগ',
    en: 'NTRCA & Teacher Recruitment',
    hubSlugs: ['ntrca'],
    accent: '#7E22CE',
    accentSoft: '#F3E8FB',
    accentDeep: '#581C87',
    descriptionBn: 'বেসরকারি শিক্ষক নিবন্ধন ও অন্যান্য শিক্ষক নিয়োগ।',
    descriptionEn: 'Non-government teacher registration and other teacher recruitment.',
  },
  {
    slug: 'defence-police',
    bn: 'সেনা/নৌ/বিমান বাহিনী ও পুলিশ',
    en: 'Defence & Police',
    hubSlugs: ['defence'],
    accent: '#B91C1C',
    accentSoft: '#FDECEC',
    accentDeep: '#7F1D1D',
    descriptionBn: 'সশস্ত্র বাহিনী ও পুলিশের নিয়োগ পরীক্ষা।',
    descriptionEn: 'Recruitment exams for the armed forces and police.',
  },
  {
    slug: 'autonomous',
    bn: 'স্বায়ত্তশাসিত ও বিশেষায়িত প্রতিষ্ঠান',
    en: 'Autonomous & Specialised Institutions',
    hubSlugs: ['autonomous'],
    accent: '#0E7490',
    accentSoft: '#E2F2F5',
    accentDeep: '#155E75',
    descriptionBn: 'স্বায়ত্তশাসিত ও বিশেষায়িত প্রতিষ্ঠানের নিয়োগ পরীক্ষা।',
    descriptionEn: 'Recruitment exams for autonomous and specialised institutions.',
  },
  {
    slug: 'ngo-private',
    bn: 'NGO ও বেসরকারি',
    en: 'NGO & Private',
    hubSlugs: ['private-ngo'],
    accent: '#A21CAF',
    accentSoft: '#FBE9F7',
    accentDeep: '#701A75',
    descriptionBn: 'NGO ও বেসরকারি প্রতিষ্ঠানের চাকরির পরীক্ষা।',
    descriptionEn: 'Job exams for NGOs and private organisations.',
  },
  {
    slug: 'it-professional',
    bn: 'IT ও পেশাগত চাকরি',
    en: 'IT & Professional Jobs',
    hubSlugs: ['it-professional'],
    accent: '#1E3A5F',
    accentSoft: '#E8EDF3',
    accentDeep: '#152A45',
    descriptionBn: 'IT ও পেশাগত চাকরির প্রস্তুতি — পরিসর ঠিক হচ্ছে (Step 5)।',
    descriptionEn: 'IT and professional job preparation — scope being decided (Step 5).',
  },
  {
    slug: 'other-competitive',
    bn: 'অন্যান্য প্রতিযোগিতামূলক নিয়োগ পরীক্ষা',
    en: 'Other Competitive Exams',
    hubSlugs: ['others'],
    accent: '#57534E',
    accentSoft: '#F0EFEA',
    accentDeep: '#44403C',
    descriptionBn: 'উপরের ক্যাটাগরির বাইরের অন্যান্য নিয়োগ পরীক্ষা।',
    descriptionEn: 'Other recruitment exams outside the categories above.',
  },
];

/** The 15 hub slugs `targetExam` may hold as a KNOWN exam (Step 3
 * §3.1 — includes 'it-professional', whose hub exists since Step 5,
 * and 'grade-11-20', the Grades 11–20 hub added 24 Nov 2026).
 * Being a known hub is NOT the same as being selectable: see
 * SELECTABLE_TARGET_EXAMS. */
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
  'grade-11-20',
] as const;

export type TargetExamSlug = (typeof TARGET_EXAM_SLUGS)[number];

/**
 * Exams the student may actually PICK as a target today: 14 of the 15
 * hubs. 'it-professional' is EXCLUDED (Step 5 closure, P1-5 — ChatGPT
 * review): its scope is undecided (owner decision 13.8), so selecting
 * it as a target would imply a learning pathway Eduvelto cannot map
 * yet. The hub stays discoverable (it-professional remains in
 * TARGET_EXAM_SLUGS and JOB_EXAMS); only target selection is off
 * until the owner defines the scope. firestore.rules enforces the
 * same exclusion on targetExam writes, so a direct write cannot
 * re-select it either. A profile that already holds it-professional
 * reads back as undecided (profileJobPreferences) until the student
 * picks a selectable target.
 */
export const SELECTABLE_TARGET_EXAMS: readonly string[] = TARGET_EXAM_SLUGS.filter(
  (s) => s !== 'it-professional',
);

/** Is this slug a target the student may pick today (13, not 14)? */
export function isSelectableTargetExamSlug(value: unknown): value is TargetExamSlug {
  return (
    typeof value === 'string' &&
    (SELECTABLE_TARGET_EXAMS as readonly string[]).includes(value)
  );
}

export function isJobCategorySlug(value: unknown): value is JobCategorySlug {
  return typeof value === 'string' && (JOB_CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function isTargetExamSlug(value: unknown): value is TargetExamSlug {
  return typeof value === 'string' && (TARGET_EXAM_SLUGS as readonly string[]).includes(value);
}

/** Which category does this exam belong to? Derived from the canonical
 * JOB_CATEGORIES.hubSlugs — never a second list. */
export function jobCategoryOfExam(examSlug: string): JobCategorySlug | undefined {
  const found = JOB_CATEGORIES.find((c) => c.hubSlugs.includes(examSlug));
  return found?.slug;
}

/** Hub slugs of one category, in display order. */
export function jobCategoryHubs(categorySlug: string): string[] {
  const found = JOB_CATEGORIES.find((c) => c.slug === categorySlug);
  return found ? [...found.hubSlugs] : [];
}

/**
 * The 10 category groups for /jobs + the homepage Jobs section
 * (Step 5 — Step 2 §0.4/§2.1: the section is grouped BY CATEGORY,
 * not by tier). One entry per category, in order 1–10, each with its
 * hubs in hubSlugs order. Every exam appears in exactly one group
 * (pinned by the Step 5 unit test). Tier is NOT a grouping here —
 * the cards carry no "coming soon" chip (28 Nov 2026 completeness
 * audit) — every card just says "View structure".
 */
export interface JobCategoryGroup {
  category: JobCategoryDef;
  exams: JobExamDef[];
}

export function jobCategoryGroups(): JobCategoryGroup[] {
  return JOB_CATEGORIES.map((category) => ({
    category,
    // In the category's hubSlugs order (the canonical display order),
    // not JOB_EXAMS order — e.g. govt shows ministries first.
    exams: category.hubSlugs.flatMap((slug) => {
      const def = JOB_EXAMS.find((exam) => exam.slug === slug);
      return def ? [def] : [];
    }),
  }));
}

/**
 * Taxonomy self-check (ChatGPT review P1 — one source of truth).
 * Parameterized so tampered taxonomies can be tested directly: the
 * checks fail on an unknown category, a missing category, an exam in
 * two categories, an omitted exam, an unknown hub, a duplicate slug,
 * an invalid category order, a selectable target that is not a known
 * exam, and it-professional being selectable while its scope is
 * undecided (Step 5 closure, P1-5). Returns every inconsistency —
 * empty means the taxonomy is consistent.
 */
export interface JobTaxonomyInput {
  categories: Pick<JobCategoryDef, 'slug' | 'hubSlugs'>[];
  examSlugs: string[];
  targetExamSlugs: readonly string[];
  selectableTargetExams: readonly string[];
}

export function validateJobTaxonomyAgainst(input: JobTaxonomyInput): string[] {
  const problems: string[] = [];
  const { categories, examSlugs, targetExamSlugs, selectableTargetExams } = input;
  // Category order IS the display order 1–10: it must match the
  // canonical JOB_CATEGORY_SLUGS sequence exactly.
  if (categories.map((c) => c.slug).join(',') !== JOB_CATEGORY_SLUGS.join(',')) {
    problems.push('category order differs from the canonical JOB_CATEGORY_SLUGS order');
  }
  const catSlugs = categories.map((c) => c.slug);
  if (new Set(catSlugs).size !== catSlugs.length) problems.push('duplicate category slug');
  for (const slug of JOB_CATEGORY_SLUGS) {
    if (!catSlugs.includes(slug)) {
      problems.push(`category '${slug}' has no definition in JOB_CATEGORIES`);
    }
  }
  for (const cat of categories) {
    if (cat.hubSlugs.length === 0) problems.push(`category '${cat.slug}' lists no hubs`);
    for (const hub of cat.hubSlugs) {
      if (!(targetExamSlugs as readonly string[]).includes(hub)) {
        problems.push(`category '${cat.slug}' lists unknown hub '${hub}'`);
      }
    }
  }
  for (const slug of targetExamSlugs) {
    const owners = categories.filter((c) => c.hubSlugs.includes(slug));
    if (owners.length === 0) problems.push(`exam '${slug}' belongs to no category`);
    if (owners.length > 1) problems.push(`exam '${slug}' belongs to ${owners.length} categories`);
    if (!examSlugs.includes(slug)) problems.push(`exam '${slug}' has no hub in JOB_EXAMS`);
  }
  for (const slug of examSlugs) {
    if (!(targetExamSlugs as readonly string[]).includes(slug)) {
      problems.push(`hub '${slug}' is not in TARGET_EXAM_SLUGS`);
    }
  }
  if (new Set(examSlugs).size !== examSlugs.length) problems.push('duplicate exam hub slug');
  for (const slug of selectableTargetExams) {
    if (!(targetExamSlugs as readonly string[]).includes(slug)) {
      problems.push(`selectable target '${slug}' is not a known exam`);
    }
  }
  // Step 5 closure, P1-5: it-professional must NOT be selectable
  // until the owner defines its scope (decision 13.8).
  if ((selectableTargetExams as readonly string[]).includes('it-professional')) {
    problems.push(
      `'it-professional' is selectable as a target exam but its scope is undecided (13.8)`,
    );
  }
  return problems;
}

/** Self-check of the canonical taxonomy (empty = consistent). */
export function validateJobTaxonomy(): string[] {
  return validateJobTaxonomyAgainst({
    categories: JOB_CATEGORIES,
    examSlugs: JOB_EXAMS.map((e) => e.slug),
    targetExamSlugs: TARGET_EXAM_SLUGS,
    selectableTargetExams: SELECTABLE_TARGET_EXAMS,
  });
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

/**
 * Daily-goal bounds (Step 3 §3.1): questions 0–500, minutes 0–600.
 * INTEGERS ONLY (ChatGPT review P0 — the old version floored 12.5 to
 * 12; a non-integer, a string, a boolean or an out-of-range value now
 * reads as null = undecided, never silently clamped or floored into a
 * fake goal). 0 stays 0 — an explicit zero goal, never "unset".
 */
export function clampDailyGoalQuestions(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  return value >= 0 && value <= 500 ? value : null;
}

export function clampDailyGoalMinutes(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  return value >= 0 && value <= 600 ? value : null;
}

/** Whether the first-time mode-choice screen should show (ChatGPT
 * review (e)4 — the mode/onboarding matrix, pinned by unit test):
 *   jobMode missing + jobOnboarded missing → show (default Beginner)
 *   jobMode missing + jobOnboarded true   → hide (default Beginner)
 *   Beginner + true → hide, Beginner selected
 *   Advanced + true → hide, Advanced selected
 *   Advanced + false → SHOW, with the existing Advanced preference
 *     intact — reopening must NEVER silently reset the mode.
 * forceOpen (the "show again" button) always shows. Signed-out
 * visitors never see it (profile null → false). */
export function shouldShowJobOnboarding(
  profile: { jobMode?: 'beginner' | 'advanced' | null; jobOnboarded?: boolean | null } | null,
  forceOpen: boolean,
): boolean {
  if (!profile) return false;
  if (forceOpen) return true;
  return profile.jobOnboarded !== true;
}

// ---------- anonymous local draft (signed-out visitors only) ----------

const ANON_CATEGORIES_KEY = 'eduvelto-job-anonymous-categories';
const ANON_TARGET_EXAM_KEY = 'eduvelto-job-anonymous-target-exam';
const ANON_DAILY_GOAL_KEY = 'eduvelto-job-anonymous-daily-goal';

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

/** Read the ANONYMOUS draft (signed-out visitors only). Every value is
 * re-validated on read, so a hand-edited or stale localStorage entry
 * can never inject a bad slug or an out-of-range goal. */
export function readAnonymousJobDraft(): JobLocalDraft {
  try {
    const categories = sanitizeEnrolledCategories(
      JSON.parse(window.localStorage.getItem(ANON_CATEGORIES_KEY) ?? '[]'),
    );
    const targetRaw = window.localStorage.getItem(ANON_TARGET_EXAM_KEY);
    // Selectable only (Step 5 closure, P1-5): an anonymous draft must
    // never offer it-professional as a target — saving it would fail
    // the rules, so it is dropped here, not at save time.
    const targetExam = isSelectableTargetExamSlug(targetRaw) ? targetRaw : null;
    let dailyGoalQuestions: number | null = null;
    let dailyGoalMinutes: number | null = null;
    try {
      const goal = JSON.parse(window.localStorage.getItem(ANON_DAILY_GOAL_KEY) ?? 'null');
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

/** Write the ANONYMOUS draft. Callers must ensure this runs ONLY while
 * signed out (ProfilePage never calls it while signed in). Invalid
 * values are dropped, never stored. */
export function writeAnonymousJobDraft(draft: Partial<JobLocalDraft>): void {
  try {
    if (draft.enrolledCategories !== undefined) {
      window.localStorage.setItem(
        ANON_CATEGORIES_KEY,
        JSON.stringify(sanitizeEnrolledCategories(draft.enrolledCategories)),
      );
    }
    if (draft.targetExam !== undefined) {
      if (isSelectableTargetExamSlug(draft.targetExam)) {
        window.localStorage.setItem(ANON_TARGET_EXAM_KEY, draft.targetExam);
      } else {
        window.localStorage.removeItem(ANON_TARGET_EXAM_KEY);
      }
    }
    if (draft.dailyGoalQuestions !== undefined || draft.dailyGoalMinutes !== undefined) {
      const current = readAnonymousJobDraft();
      const questions = clampDailyGoalQuestions(
        draft.dailyGoalQuestions !== undefined ? draft.dailyGoalQuestions : current.dailyGoalQuestions,
      );
      const minutes = clampDailyGoalMinutes(
        draft.dailyGoalMinutes !== undefined ? draft.dailyGoalMinutes : current.dailyGoalMinutes,
      );
      window.localStorage.setItem(ANON_DAILY_GOAL_KEY, JSON.stringify({ questions, minutes }));
    }
  } catch {
    // Storage unavailable — the anonymous draft is a convenience only.
  }
}

/** Clear the anonymous draft — after an import is saved, or after the
 * student declines the import. Never leave a resolved draft behind. */
export function clearAnonymousJobDraft(): void {
  try {
    window.localStorage.removeItem(ANON_CATEGORIES_KEY);
    window.localStorage.removeItem(ANON_TARGET_EXAM_KEY);
    window.localStorage.removeItem(ANON_DAILY_GOAL_KEY);
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

/** The signed-in profile's Job values, sanitized. NO draft is ever
 * mixed in here — the profile is the only source of truth for a
 * signed-in student. */
export function profileJobPreferences(profile: UserProfile | null): JobLocalDraft {
  if (!profile) return { ...EMPTY_JOB_DRAFT };
  return {
    enrolledCategories: sanitizeEnrolledCategories(profile.enrolledCategories ?? []),
    // Selectable only (Step 5 closure, P1-5): a profile that still
    // holds it-professional (written before the exclusion) reads back
    // as undecided until the student picks a selectable target.
    targetExam:
      profile.targetExam != null && isSelectableTargetExamSlug(profile.targetExam)
        ? profile.targetExam
        : null,
    dailyGoalQuestions: clampDailyGoalQuestions(profile.dailyGoalQuestions),
    dailyGoalMinutes: clampDailyGoalMinutes(profile.dailyGoalMinutes),
  };
}

/**
 * Explicit draft-import candidates (ChatGPT review P0). For each Job
 * field that is ABSENT from the signed-in profile document AND has a
 * value in the anonymous draft, the draft value is a candidate for
 * import. A field that is PRESENT in the profile — even as [] or null
 * (an explicit "none yet" / "cleared") — is never a candidate: the
 * profile wins, and the student is never offered a stale value for a
 * field they already decided. Returns null when there is nothing to
 * import. The ProfilePage prompt shows these values for review; the
 * import itself goes through the normal profile save flow.
 */
export function draftImportCandidates(
  profile: UserProfile | null,
  draft: JobLocalDraft,
): JobLocalDraft | null {
  if (!profile) return null;
  const out: JobLocalDraft = { ...EMPTY_JOB_DRAFT };
  let any = false;
  if (!('enrolledCategories' in profile) && draft.enrolledCategories.length > 0) {
    out.enrolledCategories = [...draft.enrolledCategories];
    any = true;
  }
  if (!('targetExam' in profile) && draft.targetExam != null) {
    out.targetExam = draft.targetExam;
    any = true;
  }
  if (!('dailyGoalQuestions' in profile) && draft.dailyGoalQuestions != null) {
    out.dailyGoalQuestions = draft.dailyGoalQuestions;
    any = true;
  }
  if (!('dailyGoalMinutes' in profile) && draft.dailyGoalMinutes != null) {
    out.dailyGoalMinutes = draft.dailyGoalMinutes;
    any = true;
  }
  return any ? out : null;
}
