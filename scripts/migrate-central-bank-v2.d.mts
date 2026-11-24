// Types for migrate-central-bank-v2.mjs (the central-bank migration script).
// The script is plain JavaScript so it can run under node without a
// build step; this sibling declaration lets the unit tests import its
// pure functions with types. Keep the signatures in sync with the .mjs.
// It is listed in tsconfig.json `include` so the build loads it.
export declare const MIGRATION_CONFIG_VERSION: string;
export declare const MIGRATION_SCHEMA_VERSION: number;
export declare const BCS_SYLLABUS_VERSION: string;
export declare const READING_QUESTION_IDS: string[];
export declare const READING_PASSAGE_ID: string;
export declare const READING_PASSAGE_TEXT: string;
export declare const OWNER_VERIFIER_UID: string;
export declare const VERIFIED_ENGLISH_TOPICS: string[];
export declare const CANONICAL_SUBJECT_FOR_EXAM_SCOPED: Record<string, string>;
export declare const CENTRAL_BANK_EXAM_KEYS: string[];
export declare const V2_ONLY_FIELDS: string[];
export declare const V1_ONLY_FIELDS: string[];
export declare function cyrb53Hex(str: string): string;
export declare function foldBanglaDigits(text: string): string;
export declare function normalizeCentralBankText(text: string): string;
export declare function stemHashFor(stem: string): string;
export declare function correctTextFor(question: {
  options: Array<{ letter: string; text: string }>;
  correctAnswer: string;
}): string;
export declare function duplicateHashV2For(args: {
  question: string;
  subjectId: string;
  options: Array<{ letter: string; text: string }>;
  correctAnswer: string;
}): string;
export declare function extractPassageStem(questionText: string, passageText: string): string | null;
export declare function canonicalTopicIdFor(examScopedTopicId: string): string | null;
export interface MigratedQuestionResult {
  doc: Record<string, unknown> | null;
  problems: string[];
}
export declare function migrateLegacyQuestionToV2(
  legacy: Record<string, unknown>,
  opts?: { passageText?: string },
): MigratedQuestionResult;
export declare function validateMigratedQuestion(doc: Record<string, unknown>): string[];
export declare function buildExamQuestionPoolsJs(
  questions: Array<Record<string, unknown>>,
  examId: string,
  scoringConfigVersion: string,
  generatedAt: string,
): Array<Record<string, unknown>>;
export declare function computeBankStatsJs(
  questions: Array<Record<string, unknown>>,
  opts?: { calculatedAt?: string; bankVersion?: string },
): Record<string, unknown>;
export declare function computeCoverageJs(
  questions: Array<Record<string, unknown>>,
  rules: Record<string, unknown>,
  verifiedTopics: Record<string, string[]>,
  opts?: { lastCalculated?: string },
): Array<Record<string, unknown>>;
export interface MigrationPlanResult {
  plan: Record<string, unknown>;
  report: Record<string, unknown>;
  problems: string[];
}
export declare function buildMigrationPlan(
  backup: Record<string, unknown>,
  seed: Record<string, unknown>,
  opts?: { generatedAt?: string; backupFile?: string },
): MigrationPlanResult;
export declare function backupTimestampToDate(v: unknown): Date | null;
export declare function toFirestoreFields(doc: Record<string, unknown>): Record<string, unknown>;
