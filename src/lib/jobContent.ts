// Eduvelto — Job Preparation subject / chapter / topic / lesson system
// (Step 6 — LIBRARY + SEED, 22 Nov 2026).
//
// Step 6 defines SUBJECTS ONLY — for the 4 exams with a verified
// rulesConfig (BCS, Bank, Primary Teacher, NTRCA 18th). NO chapters,
// NO topics, NO lessons are defined here: no verified chapter/topic
// lists exist on disk and there are 0 verified teachers, so inventing
// any would violate the Step 6 handover (#2 — no invented syllabuses).
// The common-topic map stays PRELIMINARY (Step 2 §2.4 / jobExams.ts
// COMMON_TOPICS): only the `JobCommonStatus` TYPE is defined here, no
// common-topic data, and no topic is called "confirmed common".
//
// SINGLE SOURCE OF TRUTH: the subject lists are DERIVED from the
// verified Step 5 rulesConfig (jobExams.ts JOB_RULES_CONFIGS) —
// nameBn / nameEn / marks / syllabusSource are copied verbatim from
// there, never re-typed. Only the subject SLUGS live here (a per-exam
// slug table, zipped onto the config's subject lists in order), so a
// transcription slip in a name or a mark is impossible by
// construction; the unit test asserts the derived lists against the
// canonical expectations (counts, sums, exact names) anyway.
//
// Step 6 handover (team/job-categories-exams-step5.md, P2-6) — the
// constraints this file enforces:
//   #1 canonical taxonomy only (14 hubs, no new exams/categories);
//   #2 no invented syllabuses (every subject carries syllabusSource);
//   #3 null rulesConfig stays missing (the other 10 exams + IT get
//      NO subjects — jobSubjectsForExam returns [] for them, never
//      throws, and jobSubjectSyllabusReady is false);
//   #4 IT is out of syllabus generation (scope_pending, owner 13.8);
//   #5 MCQ-only (no written-exam architecture anywhere here);
//   #6 progress is preserved — stable slug IDs ({examSlug}__
//      {subjectSlug}); display names are never identifiers;
//   #9 stable doc IDs (see jobSubjectId);
//   #10 source/verification metadata on every subject
//      (syllabusSource; verifiedAt/verifiedBy live on the seed docs,
//      null until a teacher verifies — 0 verified teachers today).
//
// The app still reads the hardcoded canonical config; the seed
// (team/job-content-seed.json) is the Firestore-ready form, disk only
// — the read path is NOT switched in this step.

import {
  JOB_REVIEW_STATES,
  JOB_RULES_CONFIGS,
  isDraftJobReviewStatus,
  jobExamBySlug,
  jobRulesConfig,
} from './jobExams';

/** One subject of one exam's verified syllabus (Step 3 §2.3
 * `jobSubjects`). Doc ID in Firestore is `{examSlug}__{subjectSlug}`
 * (jobSubjectId). `marks` is null only for a subject whose marks are
 * not verified — every Step 6 subject is verified, so all 23 carry a
 * number; the null stays in the type for the future unverified case
 * (which must then also carry syllabusSource null and never be shown
 * as verified). */
export interface JobSubjectDef {
  slug: string;
  examSlug: string;
  nameBn: string;
  nameEn: string;
  marks: number | null;
  order: number;
  syllabusSource: string | null;
}

/**
 * Subject slugs, per exam, in the rulesConfig subject-list order
 * (1-based `order` = position in this list). Slugs are lowercase
 * kebab of the English name, shortened where the full kebab would
 * be unwieldy ('bangla' for 'Bangla Language & Literature', 'math'
 * for 'General Math' / 'General Math & Quantitative Aptitude').
 * These are the ONLY subjects Step 6 defines — the other 10 exams
 * and it-professional have NO entry here.
 */
const JOB_SUBJECT_SLUGS: Record<string, string[]> = {
  bcs: [
    'bangla',
    'english',
    'bangladesh-affairs',
    'international-affairs',
    'geography',
    'general-science',
    'computer-ict',
    'mathematical-reasoning',
    'mental-ability',
    'ethics',
  ],
  bank: ['bangla', 'english', 'math', 'general-knowledge', 'computer'],
  'primary-teacher': ['bangla', 'english', 'math-science', 'general-knowledge'],
  ntrca: ['bangla', 'english', 'math', 'general-knowledge'],
};

/** Build one exam's subject list from its verified rulesConfig. */
function buildSubjects(examSlug: string): JobSubjectDef[] {
  const config = JOB_RULES_CONFIGS[examSlug];
  const slugs = JOB_SUBJECT_SLUGS[examSlug];
  if (!config || !slugs) return [];
  return config.subjects.map((s, i) => ({
    slug: slugs[i],
    examSlug,
    nameBn: s.nameBn,
    nameEn: s.nameEn,
    marks: s.marks,
    order: i + 1,
    syllabusSource: config.patternSource,
  }));
}

/**
 * The canonical subject lists (Step 6). Keyed by exam slug; ONLY the
 * 4 verified exams have entries — the other 10 exams and
 * it-professional are absent (their rulesConfig is null / their scope
 * is undecided, so Step 6 defines no subjects for them).
 */

/**
 * Config version (Step 6 fold-in, ChatGPT P2-02): the version of the
 * verified JOB_RULES_CONFIGS this subject list was derived from.
 * Bump it whenever a verified exam pattern changes and the subjects
 * are re-derived. The seed JSON's `_meta.version` and every subject
 * doc's `configVersion` must equal this value (pinned by unit test);
 * the importer rejects any mismatch, so a stale seed can never be
 * applied against a newer config.
 */
export const JOB_CONTENT_CONFIG_VERSION = '2026-11-24.1';
export const JOB_SUBJECTS: Record<string, JobSubjectDef[]> = Object.fromEntries(
  Object.keys(JOB_SUBJECT_SLUGS).map((examSlug) => [examSlug, buildSubjects(examSlug)]),
);

/** Subjects of one exam, in syllabus order. Empty array — never a
 * throw — for exams with no subjects (null-config exams,
 * it-professional, unknown slugs). Returns a copy of the list. */
export function jobSubjectsForExam(examSlug: string): JobSubjectDef[] {
  return [...(JOB_SUBJECTS[examSlug] ?? [])];
}

/** Stable Firestore doc ID for a subject (Step 3 §2.3, handover #9). */
export function jobSubjectId(examSlug: string, subjectSlug: string): string {
  return `${examSlug}__${subjectSlug}`;
}

/**
 * Find one subject by its doc ID (`{examSlug}__{subjectSlug}`), or
 * null when the ID is malformed, the exam has no subjects, or the
 * subject does not belong to that exam (e.g. 'bank__ethics' — Ethics
 * is a BCS subject, not a Bank one).
 */
export function jobSubjectById(subjectId: string): JobSubjectDef | null {
  const sep = subjectId.indexOf('__');
  if (sep <= 0) return null;
  const examSlug = subjectId.slice(0, sep);
  const subjectSlug = subjectId.slice(sep + 2);
  if (subjectSlug.length === 0 || subjectSlug.includes('__')) return null;
  return JOB_SUBJECTS[examSlug]?.find((s) => s.slug === subjectSlug) ?? null;
}

/**
 * Step 6 guard (handover #4; cf. jobExamSyllabusReady in jobExams.ts):
 * true only when the exam has a defined scope AND a verified subject
 * list. True for the 4 verified exams (BCS, Bank, Primary Teacher,
 * NTRCA — Bank's penalty is verified 0.25 since 24 Nov 2026, so its
 * patternStatus is 'verified' like the others). False for
 * it-professional (scope_pending, owner decision 13.8), for the 9
 * other null-config exams (defined scope but no verified subjects),
 * and for unknown slugs. The UI must show an honest empty state
 * wherever this is false — never an invented syllabus.
 */
export function jobSubjectSyllabusReady(examSlug: string): boolean {
  return (
    jobExamBySlug(examSlug)?.scopeStatus === 'defined' &&
    jobRulesConfig(examSlug) !== null &&
    (JOB_SUBJECTS[examSlug]?.length ?? 0) > 0
  );
}

/** The four content collections (Step 3 §2.3–§2.6). Only
 * `jobSubjects` has docs in Step 6; jobChapters / jobTopics /
 * jobLessons stay empty until verified lists exist. */
export const JOB_CONTENT_COLLECTIONS = [
  'jobSubjects',
  'jobChapters',
  'jobTopics',
  'jobLessons',
] as const;

/**
 * Review-workflow states for Job content (Step 3 §2.2 — the same
 * enum as the exam review states; the two are NOT the publication
 * state `status`, which is 'draft' | 'published'). Reuses the
 * canonical lists from jobExams.ts (Step 5 P1-1) so the enum cannot
 * drift between exams and content.
 */
export type JobContentReviewState = (typeof JOB_REVIEW_STATES)[number];
export const JOB_CONTENT_REVIEW_STATES = JOB_REVIEW_STATES;

/** Is this one of the 4 review states (3 draft states + Published)? */
export function isJobContentReviewState(s: unknown): boolean {
  return (
    typeof s === 'string' &&
    (JOB_CONTENT_REVIEW_STATES as readonly string[]).includes(s)
  );
}

/** The 3 draft review states (Step 5 P1-1). Rejects 'Published',
 * the literal 'draft' (not a review state), empty and missing. */
export function isDraftJobContentReviewState(s: unknown): boolean {
  return isDraftJobReviewStatus(s);
}

/**
 * Common-topic verification status (Step 2 §2.4). TYPE ONLY — Step 6
 * defines no common-topic data: the map stays 'preliminary' until
 * B-10.1 finalises it against the four official syllabuses, and no
 * topic is called 'verified' / "confirmed common" today.
 */
export type JobCommonStatus = 'preliminary' | 'verified';

/**
 * Lesson types (Step 3 §2.6). Only 'lesson' is creatable in Step 6;
 * the viva / career / CV types arrive in Step 16 (viva preparation)
 * — they are named here so the type exists, but
 * JOB_STEP6_LESSON_TYPES is the Step 6 allowlist.
 */
export type JobLessonType =
  | 'lesson'
  | 'viva-question'
  | 'viva-guide'
  | 'career-guide'
  | 'cv-guide';

/** Lesson types creatable in Step 6: 'lesson' only. */
export const JOB_STEP6_LESSON_TYPES = ['lesson'] as const;

/**
 * Lesson types that arrive in Step 16 (viva preparation — Step 3
 * §2.6): the four guide types. CODE-LEVEL allowlist only: the
 * Firestore rules still allow only lessonType 'lesson' on create
 * (firestore.rules, jobLessons match), so no guide lesson can be
 * created in Firestore until the rules allowlist is extended — a
 * named post-refactor follow-up (compiled-rules margin is ~80 bytes
 * on main; see the Step 16 report). The Step 16 pages render their
 * guidance from src/lib/jobVivaCareer.ts, shaped 1:1 on the
 * jobLessons schema, so a future loader can swap the source
 * without rewriting the pages.
 */
export const JOB_STEP16_LESSON_TYPES = [
  'viva-question',
  'viva-guide',
  'career-guide',
  'cv-guide',
] as const;

/** Is this one of the four Step 16 guide lesson types? */
export function isJobGuideLessonType(s: unknown): s is (typeof JOB_STEP16_LESSON_TYPES)[number] {
  return (
    typeof s === 'string' &&
    (JOB_STEP16_LESSON_TYPES as readonly string[]).includes(s)
  );
}

/* ------------------------------------------------------------------ */
/* Taxonomy validation (Step 5 P1-6 pattern, parameterized so        */
/* tampered taxonomies can be tested directly)                        */
/* ------------------------------------------------------------------ */

export interface JobContentTaxonomyInput {
  subjects: Record<string, JobSubjectDef[]>;
}

/**
 * Self-check of the subject taxonomy. Returns every inconsistency —
 * empty means consistent. Fails on: an unknown exam slug; a subject
 * in an exam with a null rulesConfig; a subject in it-professional
 * (scope undecided, 13.8); a duplicate slug within an exam; a marks
 * sum that differs from the exam's questionCount; an order that is
 * not 1..N contiguous; a missing syllabusSource on a verified
 * subject; an empty nameBn / nameEn; a subject whose examSlug does
 * not match its key; a marks value that is not a positive integer.
 */
export function validateJobContentTaxonomyAgainst(
  input: JobContentTaxonomyInput,
): string[] {
  const problems: string[] = [];
  const { subjects } = input;
  for (const [examSlug, list] of Object.entries(subjects)) {
    const exam = jobExamBySlug(examSlug);
    if (!exam) {
      problems.push(`subject list for unknown exam '${examSlug}'`);
      continue;
    }
    const config = jobRulesConfig(examSlug);
    if (examSlug === 'it-professional') {
      problems.push(
        `'it-professional' has subjects but its scope is undecided (13.8)`,
      );
    }
    if (config === null) {
      problems.push(
        `exam '${examSlug}' has subjects but its rulesConfig is null (nothing verified)`,
      );
      continue;
    }
    if (!Array.isArray(list)) {
      problems.push(`exam '${examSlug}': subjects is not a list`);
      continue;
    }
    const seen = new Set<string>();
    let sum = 0;
    const orders: number[] = [];
    for (const s of list) {
      if (s.examSlug !== examSlug) {
        problems.push(
          `exam '${examSlug}': subject '${s.slug}' carries examSlug '${s.examSlug}'`,
        );
      }
      if (seen.has(s.slug)) {
        problems.push(`exam '${examSlug}': duplicate subject slug '${s.slug}'`);
      }
      seen.add(s.slug);
      if (typeof s.nameBn !== 'string' || s.nameBn.length === 0) {
        problems.push(`exam '${examSlug}': subject '${s.slug}' has an empty nameBn`);
      }
      if (typeof s.nameEn !== 'string' || s.nameEn.length === 0) {
        problems.push(`exam '${examSlug}': subject '${s.slug}' has an empty nameEn`);
      }
      if (!Number.isInteger(s.marks) || (s.marks as number) < 1) {
        problems.push(
          `exam '${examSlug}': subject '${s.slug}' marks must be a positive integer`,
        );
      } else {
        sum += s.marks as number;
      }
      if (typeof s.syllabusSource !== 'string' || s.syllabusSource.length === 0) {
        problems.push(
          `exam '${examSlug}': subject '${s.slug}' is missing syllabusSource`,
        );
      }
      orders.push(s.order);
    }
    if (Number.isInteger(config.questionCount) && sum !== config.questionCount) {
      problems.push(
        `exam '${examSlug}': subject marks sum (${sum}) != questionCount (${config.questionCount})`,
      );
    }
    const sorted = [...orders].sort((a, b) => a - b);
    if (sorted.join(',') !== Array.from({ length: list.length }, (_, i) => i + 1).join(',')) {
      problems.push(`exam '${examSlug}': orders are not exactly 1..${list.length}`);
    }
  }
  return problems;
}

/** Self-check of the canonical subject taxonomy (empty = consistent). */
export function validateJobContentTaxonomy(): string[] {
  return validateJobContentTaxonomyAgainst({ subjects: JOB_SUBJECTS });
}
