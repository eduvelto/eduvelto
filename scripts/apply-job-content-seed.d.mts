// Types for apply-job-content-seed.mjs (the Step 6 content seed importer).
// The importer is plain JavaScript so it can run under node without a
// build step; this sibling declaration lets the unit tests import its
// pure functions with types. Keep the signatures in sync with the .mjs.
// It is listed in tsconfig.json `include` so the build loads it.
export declare const SYLLABUS_READY_EXAMS: string[];
export declare const JOB_CONTENT_QUESTION_COUNTS: Record<string, number>;
export declare const DRAFT_REVIEW_STATES: string[];
export declare const JOB_CONTENT_COLLECTIONS: string[];
export declare function validateContentSeed(seed: unknown): string[];
export interface ContentSeedPlanEntry {
  collection: string;
  id: string;
  doc: Record<string, unknown>;
}
export interface ContentSeedPlan {
  toCreate: ContentSeedPlanEntry[];
  toUpdate: (ContentSeedPlanEntry & { existing: Record<string, unknown> })[];
  unchanged: { collection: string; id: string }[];
  problems: string[];
}
export declare function planContentSeedApply(
  existing: Record<string, Record<string, Record<string, unknown>>>,
  seed: {
    jobSubjects?: Record<string, Record<string, unknown>>;
    jobChapters?: unknown[] | Record<string, Record<string, unknown>>;
    jobTopics?: unknown[] | Record<string, Record<string, unknown>>;
    jobLessons?: unknown[] | Record<string, Record<string, unknown>>;
  },
): ContentSeedPlan;
