// Types for apply-job-seed.mjs (the Step 5 seed importer).
// The importer is plain JavaScript so it can run under node without a
// build step; this sibling declaration lets the unit tests import its
// pure functions with types. Keep the signatures in sync with the .mjs.
// It is listed in tsconfig.json `include` so the build loads it.
export declare const JOB_CATEGORY_SLUGS: string[];
export declare const JOB_EXAM_SLUGS: string[];
export declare const DRAFT_REVIEW_STATES: string[];
export declare const PATTERN_STATUSES: string[];
export declare function validateRulesConfig(cfg: unknown, label: string): string[];
export declare function validateSeed(seed: unknown): string[];
export declare function canon(v: unknown): string;
export declare function compareDoc(
  existing: Record<string, unknown>,
  seedDoc: Record<string, unknown>,
): 'unchanged' | 'modified';
export interface SeedPlanEntry {
  collection: string;
  id: string;
  doc: Record<string, unknown>;
}
export interface SeedPlan {
  toCreate: SeedPlanEntry[];
  toUpdate: (SeedPlanEntry & { existing: Record<string, unknown> })[];
  unchanged: { collection: string; id: string }[];
  problems: string[];
}
export declare function planSeedApply(
  existing: Record<string, Record<string, Record<string, unknown>>>,
  seed: {
    jobCategories: Record<string, Record<string, unknown>>;
    jobExams: Record<string, Record<string, unknown>>;
  },
): SeedPlan;
export declare function seedDocFields(
  doc: Record<string, unknown>,
  now: Date,
): Record<string, unknown>;
export declare function seedHistoryEntry(args: {
  before: unknown;
  after: unknown;
  now: Date;
}): Record<string, unknown>;
