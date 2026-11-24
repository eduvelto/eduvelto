/**
 * Eduvelto Job Preparation — Historical questions + analytics
 * (design-central-bank.md §6.3).
 *
 * The historical-question DB is SEPARATE from the central bank: a
 * historical record LINKS to the bank (`questionId`) instead of
 * duplicating it (reuse R-12; exception E-12 — a historical
 * appearance is metadata ABOUT a question, not the question).
 *
 * Hard rules (§6.3):
 * - Only `Verified` records feed official frequency statistics.
 *   Partially verified records are shown separately, with
 *   disclosure, and never silently influence rankings. Unverified
 *   records are not shown to students at all.
 * - No duplicate counting: one historical record per
 *   (exam, year, phase, question).
 * - NO numerical appearance probabilities in the initial release.
 * - 0 previous-year questions exist today — this collection starts
 *   EMPTY by design; nothing here invents one.
 */

export type HistoricalVerificationStatus = 'Verified' | 'Partially verified' | 'Unverified';

export interface HistoricalAuditEntry {
  action: string;
  by: string;
  at: unknown;
  note: string;
}

export interface HistoricalQuestion {
  historicalQuestionId: string;
  /** Link to the central bank — the central record is created
   * FIRST if the historical question is new to the bank. */
  questionId: string;
  examId: string;
  examYear: number;
  examPhase: string;
  subjectId: string;
  topicId: string;
  sourceType: string;
  sourceReference: string;
  verificationStatus: HistoricalVerificationStatus;
  verifiedAt?: unknown;
  verifiedBy?: string | null;
  /** Pattern-level grouping (§4.2 level 5): a teacher/admin
   * judgement recorded on the record (e.g. 'samash-identify-type'),
   * NOT an algorithmic claim. An auto-suggested tag is a suggestion
   * the verifier confirms or rejects. */
  patternTag?: string | null;
  auditTrail: HistoricalAuditEntry[];
}

export interface TopicAnalytics {
  examId: string;
  subjectId: string;
  topicId: string;
  totalOccurrences: number;
  yearsCovered: number;
  verifiedPaperCount: number;
  frequencyScore: number;
  recurrenceScore: number;
  syllabusScore: number;
  preparationPriority: number;
  evidenceLevel: 'A' | 'B' | 'C';
  calculatedAt: string;
  analyticsVersion: string;
}

export type ModelTestType =
  | 'previous-question-practice'
  | 'high-priority-topic-practice'
  | 'probable-pattern-model-test';

export interface ModelTest {
  modelTestId: string;
  examId: string;
  title: string;
  testType: ModelTestType;
  questionIds: string[];
  blueprintVersion: string;
  analyticsVersion: string;
  /** Explicit disclaimer: practice, not prediction. */
  disclaimer: string;
  publishedAt?: unknown;
}

/** Historical record ID: `H_<EXAM>_<YEAR>_<NNN>` (exam uppercased). */
export function historicalIdFor(exam: string, year: number, n: number): string {
  if (!/^[a-z0-9-]+$/.test(exam)) {
    throw new Error(`historicalIdFor: exam '${exam}' must be a lowercase slug`);
  }
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error(`historicalIdFor: year must be 1900–2100, got ${String(year)}`);
  }
  if (!Number.isInteger(n) || n < 1 || n > 999) {
    throw new Error(`historicalIdFor: n must be an integer 1–999, got ${String(n)}`);
  }
  return `H_${exam.toUpperCase().replace(/-/g, '_')}_${year}_${String(n).padStart(3, '0')}`;
}

/**
 * Uniqueness check for (examId, examYear, examPhase, questionId).
 * A second source for the same appearance is added to
 * `sourceReference`, not as a second record. Returns problem
 * strings; empty = unique.
 */
export function checkHistoricalUniqueness(
  existing: HistoricalQuestion[],
  candidate: Pick<HistoricalQuestion, 'examId' | 'examYear' | 'examPhase' | 'questionId' | 'historicalQuestionId'>,
): string[] {
  const problems: string[] = [];
  if (existing.some((r) => r.historicalQuestionId === candidate.historicalQuestionId)) {
    problems.push(`historicalQuestions: id '${candidate.historicalQuestionId}' already exists`);
  }
  if (
    existing.some(
      (r) =>
        r.examId === candidate.examId &&
        r.examYear === candidate.examYear &&
        r.examPhase === candidate.examPhase &&
        r.questionId === candidate.questionId,
    )
  ) {
    problems.push(
      `historicalQuestions: a record already exists for (${candidate.examId}, ${candidate.examYear}, ${candidate.examPhase}, ${candidate.questionId}) — add the source to sourceReference instead`,
    );
  }
  return problems;
}

/**
 * Append an audit entry (immutable style — returns a new record).
 * Changes to a VERIFIED record are logged; a wrong source triggers
 * re-calculation of the analytics that used it. The trail only
 * grows, never shrinks (enforced in the rules too).
 */
export function appendHistoricalAuditTrail(
  record: HistoricalQuestion,
  entry: { action: string; by: string; note: string; at?: unknown },
): HistoricalQuestion {
  return {
    ...record,
    auditTrail: [
      ...record.auditTrail,
      {
        action: entry.action,
        by: entry.by,
        at: entry.at ?? new Date().toISOString(),
        note: entry.note,
      },
    ],
  };
}

/** Validate a historical-question doc. Returns problem strings. */
export function validateHistoricalQuestion(doc: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const label = 'historicalQuestions';
  if (typeof doc.historicalQuestionId !== 'string' || !/^H_[A-Z0-9_]+_[0-9]{4}_[0-9]{3}$/.test(doc.historicalQuestionId)) {
    problems.push(`${label}: historicalQuestionId must look like H_<EXAM>_<YEAR>_<NNN>`);
  }
  if (typeof doc.questionId !== 'string' || doc.questionId.length === 0) {
    problems.push(`${label}: questionId (central-bank link) is required`);
  }
  if (typeof doc.examId !== 'string' || doc.examId.length === 0) {
    problems.push(`${label}: examId is required`);
  }
  if (!Number.isInteger(doc.examYear) || (doc.examYear as number) < 1900 || (doc.examYear as number) > 2100) {
    problems.push(`${label}: examYear must be 1900–2100`);
  }
  if (typeof doc.examPhase !== 'string' || doc.examPhase.length === 0) {
    problems.push(`${label}: examPhase is required`);
  }
  if (typeof doc.subjectId !== 'string' || doc.subjectId.length === 0) {
    problems.push(`${label}: subjectId is required`);
  }
  if (typeof doc.topicId !== 'string' || doc.topicId.length === 0) {
    problems.push(`${label}: topicId is required`);
  }
  if (typeof doc.sourceType !== 'string' || doc.sourceType.length === 0) {
    problems.push(`${label}: sourceType is required`);
  }
  if (typeof doc.sourceReference !== 'string' || doc.sourceReference.length === 0 || (doc.sourceReference as string).length > 2000) {
    problems.push(`${label}: sourceReference is required (≤2000 chars)`);
  }
  if (!['Verified', 'Partially verified', 'Unverified'].includes(String(doc.verificationStatus))) {
    problems.push(`${label}: verificationStatus must be Verified / Partially verified / Unverified`);
  }
  if (doc.verificationStatus === 'Verified') {
    if (typeof doc.verifiedBy !== 'string' || doc.verifiedBy.length === 0) {
      problems.push(`${label}: Verified records need verifiedBy`);
    }
    if (doc.verifiedAt === null || doc.verifiedAt === undefined) {
      problems.push(`${label}: Verified records need verifiedAt`);
    }
  }
  if (!Array.isArray(doc.auditTrail)) {
    problems.push(`${label}: auditTrail must be a list`);
  }
  if (doc.patternTag !== undefined && doc.patternTag !== null && typeof doc.patternTag !== 'string') {
    problems.push(`${label}: patternTag must be a string or null`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Import wizard (§3.3) — six-step gate                               */
/* ------------------------------------------------------------------ */

/**
 * The six import steps, in order. The wizard BLOCKS Publish until
 * the verifier step passes (second-eye rule: verifier ≠ author).
 */
export type HistoricalImportStep =
  | 'source'
  | 'transcribe'
  | 'historical-record'
  | 'verify'
  | 'link-publish'
  | 'correction';

export const HISTORICAL_IMPORT_STEPS: HistoricalImportStep[] = [
  'source',
  'transcribe',
  'historical-record',
  'verify',
  'link-publish',
  'correction',
];

export interface HistoricalImportState {
  /** Step completion, in HISTORICAL_IMPORT_STEPS order. */
  completed: Partial<Record<HistoricalImportStep, boolean>>;
  /** Who authored the transcription (never the verifier). */
  authorUid: string | null;
  /** Who verified it (never the author). */
  verifierUid: string | null;
  /** The duplicate decision (§3.2): same question in a different
   * year is recurrence data, not a duplicate — the admin decides
   * explicitly. */
  duplicateDecision: 'distinct' | 'same-question-different-year' | 'duplicate' | null;
}

/** May this import publish? All steps through 'verify' must be
 * complete, the verifier must differ from the author, and the
 * duplicate decision must be made. Returns problem strings. */
export function historicalImportPublishGate(state: HistoricalImportState): string[] {
  const problems: string[] = [];
  for (const step of ['source', 'transcribe', 'historical-record', 'verify'] as const) {
    if (!state.completed[step]) {
      problems.push(`historical import: step '${step}' is not complete — Publish is blocked`);
    }
  }
  if (state.authorUid !== null && state.verifierUid !== null && state.authorUid === state.verifierUid) {
    problems.push('historical import: verifier must not be the author (second-eye rule)');
  }
  if (state.verifierUid === null) {
    problems.push('historical import: no verifier — the verify step needs a verifier');
  }
  if (state.duplicateDecision === null) {
    problems.push('historical import: the duplicate decision is required (duplicate / same-question-different-year / distinct)');
  }
  return problems;
}

/** The wizard's current step: the first incomplete step. */
export function historicalImportCurrentStep(state: HistoricalImportState): HistoricalImportStep {
  for (const step of HISTORICAL_IMPORT_STEPS) {
    if (!state.completed[step]) return step;
  }
  return 'correction';
}
