/**
 * Eduvelto Job Preparation — Central Bank selection core
 * (design-central-bank.md §3.3–§3.6).
 *
 * Pure, testable core the live-exam engine (design doc B) calls:
 * per-exam selection rules (weights copied from the VERIFIED
 * `JOB_RULES_CONFIGS` — the code source of truth stays there),
 * precomputed `examQuestionPools` (IDs only), exposure scoring, and
 * weighted sampling without replacement with the small-bank
 * fallback. NO Firestore in this file.
 *
 * Reuse / exception (§11): the selection-rules SHAPE and the
 * sampling algorithm are SHARED (R-8); the weights/totals/durations
 * are SEPARATE per exam (E-1 — BCS 200/−0.50 vs Bank 100/−0.25
 * would produce WRONG mocks if shared); Bank SO vs AD share the
 * shape but NEVER share a question SET (E-3); exposure history is
 * per student+exam, never global (E-9).
 */

import { JOB_RULES_CONFIGS, VERIFIED_EXAM_KEYS, type ExamKey } from './jobExams';
import { JOB_SUBJECTS, canonicalSubjectFor, type JobBankSubject } from './jobContent';
import { BCS_SYLLABUS_VERSION, type CentralBankQuestion } from './jobCentralBank';

/* ------------------------------------------------------------------ */
/* Selection rules (§3.3)                                              */
/* ------------------------------------------------------------------ */

export interface SubjectWeight {
  /** Canonical cross-exam subject key. */
  subjectId: JobBankSubject;
  questions: number;
  marks: number;
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

/** Default difficulty mix (batch target §1.1: ≈30/55/15 — the live
 * bank's actual mix is 29/54/17). §3.3's "30/50/20" is an example,
 * not a pinned value; the batch target is the pinned one. */
export const DEFAULT_DIFFICULTY_DISTRIBUTION: DifficultyDistribution = {
  easy: 30,
  medium: 55,
  hard: 15,
};

export type SelectionRulesVerificationStatus = 'verified' | 'last-verified' | 'draft';

export interface JobExamSelectionRule {
  examId: string;
  totalQuestions: number | null;
  durationMinutes: number | null;
  marksPerQuestion: number | null;
  negativeMarking: number | null;
  negativeMarkingVerified: boolean;
  passPercent: number | null;
  subjectWeights: SubjectWeight[];
  difficultyDistribution: DifficultyDistribution;
  topicQuotas?: Array<{ topicId: string; questions: number }>;
  syllabusVersion: string;
  patternSource: string;
  verificationStatus: SelectionRulesVerificationStatus;
  /** Rules-doc version (1 = first publication of this shape). */
  version: number;
  /** Scoring-config version the weights were copied from. */
  scoringConfigVersion: string;
}

/** Syllabus-version labels for the selection-rules docs, each cited
 * from the verified pattern source in jobExams.ts (JOB_RULES_CONFIGS
 * patternSource / EXAM_PATTERNS notes). These are version LABELS for
 * the rules docs, not syllabus content. */
const SYLLABUS_VERSION_FOR_EXAM: Record<string, string> = {
  bcs: BCS_SYLLABUS_VERSION,
  bank: 'bscs-115/2025',
  'bank-senior-officer': 'bscs-109-348/2025-2026',
  'bank-assistant-director': 'bb-hrd1-38/2026',
  'primary-teacher': 'dpe-rules-2025',
  ntrca: 'ntrca-18th',
};

/**
 * Canonical subject slugs for the post-level Bank configs, in
 * rulesConfig subject-list order. JOB_SUBJECTS defines slugs only
 * for the 4 hub exams — the SO/AD configs (English 20, Bangla 20,
 * Math 20, Financial & Banking Knowledge 10, Analytical Skills 20,
 * ICT 10) are mapped here by position from their verified pattern
 * names. No subject is invented: every key already exists in
 * JOB_BANK_SUBJECTS.
 */
const POST_LEVEL_SUBJECT_SLUGS: Record<string, JobBankSubject[]> = {
  'bank-senior-officer': ['english', 'bangla', 'math', 'financial-banking', 'analytical-skills', 'ict'],
  'bank-assistant-director': ['english', 'bangla', 'math', 'financial-banking', 'analytical-skills', 'ict'],
};

/** Canonical subject keys for one exam's rulesConfig subjects, in
 * order. Returns null when the exam has no verified config and no
 * post-level slug table (unknown / unverified exam). */
export function canonicalSubjectsForExam(examKey: string): JobBankSubject[] | null {
  const config = JOB_RULES_CONFIGS[examKey];
  if (!config) return null;
  const postLevel = POST_LEVEL_SUBJECT_SLUGS[examKey];
  if (postLevel) {
    if (postLevel.length !== config.subjects.length) return null;
    return [...postLevel];
  }
  const subjects = JOB_SUBJECTS[examKey];
  if (!subjects || subjects.length !== config.subjects.length) return null;
  const mapped = subjects.map((s) => canonicalSubjectFor(`${examKey}__${s.slug}`));
  if (mapped.some((m) => m === null)) return null;
  return mapped as JobBankSubject[];
}

/**
 * The selection-rules doc for an exam, copied from the verified
 * `JOB_RULES_CONFIGS` (b90d697). Asserts the subject weights sum to
 * `totalQuestions` (the same double-check the pattern-fix branch
 * uses) — a rules doc that disagrees with `JOB_RULES_CONFIGS` is
 * rejected. Returns null for unknown keys. `grade_11_20` returns a
 * DRAFT doc (no verified pattern — doc C's area): no totals, no
 * weights, nothing selectable under it.
 */
export function jobExamSelectionRulesFor(examKey: string): JobExamSelectionRule | null {
  if (examKey === 'grade_11_20') {
    return {
      examId: 'grade_11_20',
      totalQuestions: null,
      durationMinutes: null,
      marksPerQuestion: null,
      negativeMarking: null,
      negativeMarkingVerified: false,
      passPercent: null,
      subjectWeights: [],
      difficultyDistribution: { ...DEFAULT_DIFFICULTY_DISTRIBUTION },
      syllabusVersion: 'unverified',
      patternSource: 'No verified pattern — the 2026 draft standardisation proposal must NOT be implemented until the final gazette is confirmed.',
      verificationStatus: 'draft',
      version: 1,
      scoringConfigVersion: 'unverified',
    };
  }
  const config = JOB_RULES_CONFIGS[examKey];
  if (!config) return null;
  const subjects = canonicalSubjectsForExam(examKey);
  if (!subjects) return null;
  const subjectWeights: SubjectWeight[] = config.subjects.map((s, i) => ({
    subjectId: subjects[i],
    questions: s.marks,
    marks: s.marks,
  }));
  const sum = subjectWeights.reduce((acc, w) => acc + w.questions, 0);
  if (config.questionCount !== null && sum !== config.questionCount) {
    throw new Error(
      `jobExamSelectionRulesFor: subject weights sum (${sum}) != questionCount (${config.questionCount}) for '${examKey}'`,
    );
  }
  return {
    examId: examKey,
    totalQuestions: config.questionCount,
    durationMinutes: config.timeMinutes,
    marksPerQuestion: config.marksPerQuestion,
    negativeMarking: config.negativeMarking,
    negativeMarkingVerified: config.negativeMarkingVerified,
    passPercent: config.passPercent,
    subjectWeights,
    difficultyDistribution: { ...DEFAULT_DIFFICULTY_DISTRIBUTION },
    syllabusVersion: SYLLABUS_VERSION_FOR_EXAM[examKey] ?? 'unverified',
    patternSource: config.patternSource,
    verificationStatus:
      config.patternStatus === 'verified'
        ? 'verified'
        : config.patternStatus === 'last_verified'
          ? 'last-verified'
          : 'draft',
    version: 1,
    scoringConfigVersion: config.scoringConfigVersion,
  };
}

/** Selection-rules docs for every verified exam + the grade_11_20 draft. */
export function allJobExamSelectionRules(): JobExamSelectionRule[] {
  const rules: JobExamSelectionRule[] = [];
  for (const key of VERIFIED_EXAM_KEYS as readonly string[]) {
    const rule = jobExamSelectionRulesFor(key);
    if (rule) rules.push(rule);
  }
  const draft = jobExamSelectionRulesFor('grade_11_20');
  if (draft) rules.push(draft);
  return rules;
}

/* ------------------------------------------------------------------ */
/* examQuestionPools (§3.5)                                            */
/* ------------------------------------------------------------------ */

export type PoolKind = 'scored' | 'practice';

/** Max IDs per pool doc (100–200 per §3.5). */
export const POOL_CHUNK_SIZE = 200;

export interface ExamQuestionPool {
  poolId: string;
  examId: string;
  subjectId: string;
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  poolKind: PoolKind;
  questionIds: string[];
  chunkIndex: number;
  chunkCount: number;
  generatedAt: string;
  bankVersion: string;
  selectionRulesVersion: string;
  eligibleCount: number;
}

/** Is this question eligible for a pool? Scored pools: active +
 * verified + exam mapped + that exam's syllabus mapping verified +
 * not disputed. Practice pools: active + reviewed-or-verified +
 * exam mapped (unverified mappings feed practice only, labelled). */
export function isPoolEligible(
  question: CentralBankQuestion,
  examKey: string,
  poolKind: PoolKind,
): boolean {
  if (!question.isActive) return false;
  if (!question.examMappings.includes(examKey)) return false;
  if (question.tags.includes('disputed')) return false;
  if (poolKind === 'scored') {
    if (question.verificationStatus !== 'verified') return false;
    if (question.syllabusMappings[examKey]?.verified !== true) return false;
    return true;
  }
  return question.verificationStatus === 'verified' || question.verificationStatus === 'reviewed';
}

function poolIdFor(
  examId: string,
  poolKind: PoolKind,
  subjectId: string,
  topicId: string,
  difficulty: string,
  chunkIndex: number,
): string {
  return `pool__${examId}__${poolKind}__${subjectId}__${topicId}__${difficulty}__${chunkIndex}`;
}

/**
 * Build the pool docs for one exam from the bank. Pure function of
 * (bank + mappings + selection rules): one pool per (subject, topic,
 * difficulty, kind), chunked at ≤200 IDs per doc. Pools are a
 * selection AID, not the source of truth — before a pool is used to
 * publish a mock, the builder re-verifies every ID with
 * `verifyPoolIds`. Deterministic: IDs sorted within a pool.
 */
export function buildExamQuestionPools(
  questions: CentralBankQuestion[],
  rules: JobExamSelectionRule,
  opts?: { generatedAt?: string; bankVersion?: string },
): ExamQuestionPool[] {
  const generatedAt = opts?.generatedAt ?? new Date().toISOString();
  const bankVersion = opts?.bankVersion ?? '2026-11-24.1';
  const pools: ExamQuestionPool[] = [];
  const groups = new Map<string, { subjectId: string; topicId: string; difficulty: 'easy' | 'medium' | 'hard'; kind: PoolKind; ids: string[] }>();
  for (const q of questions) {
    for (const kind of ['scored', 'practice'] as const) {
      if (!isPoolEligible(q, rules.examId, kind)) continue;
      const key = `${q.subjectId}|${q.topicId}|${q.difficulty}|${kind}`;
      let group = groups.get(key);
      if (!group) {
        group = { subjectId: q.subjectId, topicId: q.topicId, difficulty: q.difficulty, kind, ids: [] };
        groups.set(key, group);
      }
      group.ids.push(q.questionId);
    }
  }
  for (const group of [...groups.values()].sort((a, b) =>
    `${a.subjectId}|${a.topicId}|${a.difficulty}|${a.kind}`.localeCompare(
      `${b.subjectId}|${b.topicId}|${b.difficulty}|${b.kind}`,
    ),
  )) {
    const ids = [...group.ids].sort();
    const chunkCount = Math.max(1, Math.ceil(ids.length / POOL_CHUNK_SIZE));
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
      const chunk = ids.slice(chunkIndex * POOL_CHUNK_SIZE, (chunkIndex + 1) * POOL_CHUNK_SIZE);
      pools.push({
        poolId: poolIdFor(rules.examId, group.kind, group.subjectId, group.topicId, group.difficulty, chunkIndex),
        examId: rules.examId,
        subjectId: group.subjectId,
        topicId: group.topicId,
        difficulty: group.difficulty,
        poolKind: group.kind,
        questionIds: chunk,
        chunkIndex,
        chunkCount,
        generatedAt,
        bankVersion,
        selectionRulesVersion: rules.scoringConfigVersion,
        eligibleCount: ids.length,
      });
    }
  }
  return pools;
}

/**
 * Pre-publish re-check (§3.5): every chosen ID must still exist,
 * still be active, still be verified, and still carry a verified
 * syllabus mapping for the exam. Returns problem strings; empty =
 * the set is safe to publish. A stale pool (question withdrawn
 * after generation) can therefore never publish a withdrawn
 * question.
 */
export function verifyPoolIds(
  ids: string[],
  bankById: Record<string, CentralBankQuestion>,
  examKey: string,
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      problems.push(`pool: duplicate id '${id}' in the chosen set`);
      continue;
    }
    seen.add(id);
    const q = bankById[id];
    if (!q) {
      problems.push(`pool: question '${id}' no longer exists`);
      continue;
    }
    if (!q.isActive) problems.push(`pool: question '${id}' is withdrawn (isActive false)`);
    if (q.verificationStatus !== 'verified') {
      problems.push(`pool: question '${id}' is not verified (status '${q.verificationStatus}')`);
    }
    if (!q.examMappings.includes(examKey)) {
      problems.push(`pool: question '${id}' is not mapped to '${examKey}'`);
    }
    if (q.syllabusMappings[examKey]?.verified !== true) {
      problems.push(`pool: question '${id}' has no verified syllabus mapping for '${examKey}'`);
    }
    if (q.tags.includes('disputed')) problems.push(`pool: question '${id}' is disputed`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Repetition control — bank-side contracts (§3.6)                     */
/* ------------------------------------------------------------------ */

/**
 * Per-student, per-exam exposure history (`users/{uid}/examHistory/{examId}`).
 * `recentQuestionIds` is bounded (last 300–500 distinct exposures,
 * most-recent-first). Scoped to studentId + examId — a question seen
 * in a BCS mock CAN still appear in a Bank mock (never a global
 * exclusion, E-9). Updated only when an attempt actually starts.
 */
export interface ExposureHistory {
  examId: string;
  /** Most-recent-first. */
  recentQuestionIds: string[];
  lastAttemptNo: number;
  updatedAt?: unknown;
}

/** History bound (§3.6): last 300–500 exposures per exam. */
export const EXPOSURE_HISTORY_MIN = 300;
export const EXPOSURE_HISTORY_MAX = 500;

/** Candidate scoring table (§3.6, consultation values — the engine
 * validates them against real attempt data before freezing):
 * never seen 10; seen >10 attempts ago 6; 6–10 ago 4; 2–5 ago 2;
 * previous attempt 0.5.
 *
 * The history doc stores exposures most-recent-first WITHOUT
 * per-question attempt numbers, so the bank-side contract scores by
 * RECENCY RANK as the proxy for attempts-ago: rank 0 (most recently
 * seen) → 0.5; ranks 1–4 → 2; ranks 5–9 → 4; rank 10+ → 6; unseen
 * → 10. Doc B's engine may refine this if attempt numbers are
 * recorded per exposure — the table VALUES stay the same.
 */
export function exposureScore(attemptsAgo: number | null): number {
  if (attemptsAgo === null) return 10;
  if (attemptsAgo <= 1) return 0.5;
  if (attemptsAgo <= 5) return 2;
  if (attemptsAgo <= 10) return 4;
  return 6;
}

export function exposureScoreByRank(rank: number | null): number {
  if (rank === null) return 10;
  if (rank === 0) return 0.5;
  if (rank <= 4) return 2;
  if (rank <= 9) return 4;
  return 6;
}

/**
 * Weighted random sampling WITHOUT replacement (roulette-wheel
 * picks; picked IDs are removed from the candidate set). `random`
 * is injectable for deterministic tests (default Math.random).
 * Within-attempt uniqueness is NEVER violated by this function.
 */
export function selectWeightedWithoutReplacement<T>(
  items: Array<{ id: string; weight: number; value: T }>,
  count: number,
  random: () => number = Math.random,
): T[] {
  const remaining = items.filter((i) => i.weight > 0).map((i) => ({ ...i }));
  const picked: T[] = [];
  const target = Math.min(count, remaining.length);
  while (picked.length < target && remaining.length > 0) {
    const total = remaining.reduce((acc, i) => acc + i.weight, 0);
    if (total <= 0) break;
    let roll = random() * total;
    let idx = 0;
    while (idx < remaining.length - 1 && roll >= remaining[idx].weight) {
      roll -= remaining[idx].weight;
      idx += 1;
    }
    picked.push(remaining[idx].value);
    remaining.splice(idx, 1);
  }
  return picked;
}

/** Small-bank notice (Bangla) — shown when the eligible pool
 * cannot fill a quota without repeats (§3.6). */
export const SMALL_BANK_NOTICE_BN =
  'প্রশ্নব্যাংক এখনো ছোট — আগের কিছু প্রশ্ন আবার আসতে পারে।';

export interface QuotaSelection {
  selected: string[];
  /** Selected IDs the student has already seen in this exam. */
  repeatedCount: number;
  /** True when repeats were UNAVOIDABLE (unseen < quota). */
  needsSmallBankNotice: boolean;
  /** Shortfall when even all eligible IDs cannot fill the quota. */
  shortfall: number;
}

/**
 * Select one blueprint quota from a pool with repetition control.
 * Order: unseen first, then oldest-seen, then recently seen — NEVER
 * relax within-attempt uniqueness, NEVER silently violate the
 * blueprint to achieve zero repetition (repetition preferences are
 * relaxed before subject/syllabus requirements). When the eligible
 * pool cannot fill the quota without repeats, `needsSmallBankNotice`
 * is true and the UI shows SMALL_BANK_NOTICE_BN.
 */
export function selectForQuota(
  eligibleIds: string[],
  history: ExposureHistory,
  quota: number,
  random: () => number = Math.random,
): QuotaSelection {
  const rankById = new Map<string, number>();
  history.recentQuestionIds.forEach((id, i) => {
    if (!rankById.has(id)) rankById.set(id, i);
  });
  const unseen = eligibleIds.filter((id) => !rankById.has(id));
  const needsNotice = unseen.length < quota;
  const candidates = eligibleIds.map((id) => {
    const rank = rankById.get(id) ?? null;
    return { id, weight: exposureScoreByRank(rank), value: id };
  });
  const selected = selectWeightedWithoutReplacement(candidates, quota, random);
  const repeatedCount = selected.filter((id) => rankById.has(id)).length;
  return {
    selected,
    repeatedCount,
    needsSmallBankNotice: needsNotice,
    shortfall: Math.max(0, quota - eligibleIds.length),
  };
}

/** Merge newly selected IDs into an exposure history (bounded,
 * most-recent-first, distinct). The write happens only when an
 * attempt actually starts, in a transaction (doc B). */
export function mergeExposureHistory(
  history: ExposureHistory,
  selectedIds: string[],
  bound: number = EXPOSURE_HISTORY_MAX,
): ExposureHistory {
  const merged = [...selectedIds, ...history.recentQuestionIds];
  const distinct: string[] = [];
  const seen = new Set<string>();
  for (const id of merged) {
    if (!seen.has(id)) {
      seen.add(id);
      distinct.push(id);
    }
  }
  return {
    ...history,
    recentQuestionIds: distinct.slice(0, bound),
    lastAttemptNo: history.lastAttemptNo + 1,
  };
}

/** Is this exam key usable for selection (verified rules + totals)? */
export function isSelectableExamKey(examKey: string): boolean {
  if (examKey === 'grade_11_20') return false;
  const rules = jobExamSelectionRulesFor(examKey);
  return rules !== null && rules.totalQuestions !== null && rules.verificationStatus !== 'draft';
}

export type { ExamKey };
