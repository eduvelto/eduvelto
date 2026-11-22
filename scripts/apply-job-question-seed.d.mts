// Types for apply-job-question-seed.mjs (the Step 7 question-bank seed importer).
// The importer is plain JavaScript so it can run under node without a
// build step; this sibling declaration lets the unit tests import its
// pure functions with types. Keep the signatures in sync with the .mjs.
// It is listed in tsconfig.json `include` so the build loads it.
export declare const JOB_QUESTION_CONFIG_VERSION: string;
export declare const SYLLABUS_READY_EXAMS: string[];
export declare const CANONICAL_JOB_SUBJECT_IDS: string[];
export declare const DRAFT_REVIEW_STATES: string[];
export declare const JOB_QUESTION_COLLECTIONS: string[];
export declare const JOB_BUNDLE_KINDS: string[];
export declare function validateQuestionSeed(seed: unknown): string[];
export interface QuestionSeedPlanEntry {
  collection: string;
  id: string;
  doc: Record<string, unknown>;
}
export interface QuestionSeedPlan {
  toCreate: QuestionSeedPlanEntry[];
  toUpdate: (QuestionSeedPlanEntry & { existing: Record<string, unknown> })[];
  unchanged: { collection: string; id: string }[];
  problems: string[];
}
export declare function planQuestionSeedApply(
  existing: Record<string, Record<string, Record<string, unknown>>>,
  seed: {
    jobQuestions?: Record<string, Record<string, unknown>>;
    jobQuestionBundles?: Record<string, Record<string, unknown>>;
    jobQuestionKeys?: Record<string, Record<string, unknown>>;
  },
): QuestionSeedPlan;
