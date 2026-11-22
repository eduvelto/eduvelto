/**
 * Eduvelto Job Preparation — Full Exam + Model Tests: mock
 * definitions (Step 9).
 *
 * `jobExamDefinitions/{docId}` is the mock EVENT (Step 3 §2.10,
 * ChatGPT fold-in: renamed from `jobMocks` — the definition is
 * the ADMIN-published exam event): which exam, which bundle,
 * which pattern snapshot, when it runs, whether it may be
 * retaken. The question SET lives in the bundle
 * (`jobQuestionBundles`) and its FROZEN order lives in the
 * manifest (`jobQuestionSetManifests/{questionSetId}`); the
 * definition only points at them.
 *
 * MOCK-ID SCHEME (the bare key a session/attempt carries):
 *   daily  → `YYYY-MM-DD` (the Dhaka date)
 *   weekly → `YYYY-Www`   (the ISO week)
 *   full   → `full__{examSlug}__{n}` (sequential per exam)
 * Doc-IDs: daily `daily__{mockId}`, weekly `weekly__{mockId}`,
 * full = the mockId itself. Bundle doc-IDs follow the same bare
 * key: `daily__{mockId}` / `weekly__{mockId}` / `mock__{mockId}`
 * (jobQuestions.ts helpers). The rules bind bundle.mockId ==
 * attempt.mockId, so the bare key — never the doc-ID — is what
 * sessions and attempts store.
 *
 * DATE-DRIVEN SELECTION (no scheduled job — Spark has none):
 * today's daily mock is `daily__{today}`; this week's weekly mock
 * is `weekly__{this ISO week}`. A mock that was never published
 * simply does not exist — the cards show the honest "not yet"
 * state, never a fabricated mock. The weekly cycle exam for a
 * week is deterministic (ISO week number → BCS → Bank → Primary
 * → NTRCA); the mock doc's own examSlug is authoritative at
 * runtime — the cycle helper only tells the admin / the card
 * whose turn it is.
 *
 * RULES SNAPSHOT: the mock stores a COPY of the exam's
 * rulesConfig taken at creation (questionCount, timeMinutes,
 * marksPerQuestion, negativeMarking, negativeMarkingVerified,
 * passPercent, scoringConfigVersion). A later config change never
 * changes a running mock's rules. The snapshot is a FAITHFUL
 * copy — Bank's negativeMarking stays null (unverified); the
 * engine interprets null as "disabled, 0" (Step 8 fold-in M1),
 * it is never scored as the provisional 0.25.
 *
 * BUDGET: ৳0 — no paid service, no server. All dates use
 * Asia/Dhaka (the students' timezone).
 */

import { WEEKLY_MOCK_CYCLE, jobRulesConfig } from './jobExams';

/** Mock kinds (Step 3 §2.10). 'previous' is NOT a mock kind here:
 * previous-year sets run as PRACTICE (Step 8 decision #4) — a
 * previous-year full mock would need a fold-in decision. */
export const JOB_MOCK_KINDS = ['daily', 'weekly', 'full'] as const;
export type JobMockKind = (typeof JOB_MOCK_KINDS)[number];

/** The rules snapshot stored on a mock doc (Step 3 §2.10) — a
 * faithful copy of the exam's rulesConfig at creation time, plus
 * scoringConfigVersion (Step 8 fold-in, finding 9: every scored
 * result records the config generation it was scored under). */
export interface JobMockRulesSnapshot {
  questionCount: number;
  timeMinutes: number;
  marksPerQuestion: 1;
  /** Null when the penalty is unverified (Bank) — the engine
   * scores it as 0 (disabled), never the provisional value. */
  negativeMarking: number | null;
  negativeMarkingVerified: boolean;
  passPercent: number | null;
  scoringConfigVersion: string;
}

/** A jobExamDefinitions doc (Step 3 §2.10). Timestamps are
 * `unknown` — serverTimestamp() sentinels at creation, real
 * timestamps after read-back (jobQuestions.ts style). */
export interface JobMockDoc {
  examSlug: string;
  titleBn: string;
  titleEn: string;
  kind: JobMockKind;
  bundleId: string;
  /** The CURRENT question-set manifest for this mock
   * (jobQuestionSetManifests doc-ID — ChatGPT §1(f)). Sessions
   * store the questionSetId they started with; a later repoint
   * only affects NEW sessions. */
  questionSetId: string;
  rulesSnapshot: JobMockRulesSnapshot;
  /** Daily: the YYYY-MM-DD date (= the bare mockId). Weekly: the
   * week's start date (Monday, YYYY-MM-DD). Full: null. */
  scheduleDate: string | null;
  /** Weekly only: which exam's turn in the cycle. Daily/full: null. */
  examSlugCycle: string | null;
  status: 'draft' | 'published' | 'archived';
  /** Retake allowed (default true — Step 2 §13.6 proposal: every
   * retake is a NEW attempt; old results stay in history). */
  retakeAllowed: boolean;
  /** Null = no limit (proposal — the owner's decision). */
  maxAttempts: number | null;
  publishedAt: unknown;
  publishedBy: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

/** A mock doc with its Firestore doc ID attached (the page loads
 * by this ID; sessions/attempts reference the bare mockId). */
export type JobMockWithId = JobMockDoc & { docId: string };

/* ------------------------------------------------------------------ */
/* Mock IDs + doc IDs                                                  */
/* ------------------------------------------------------------------ */

/** Bare mockId for a daily mock: the Dhaka date (YYYY-MM-DD). */
export function jobMockIdForDaily(dateYYYYMMDD: string): string {
  return dateYYYYMMDD;
}

/** Bare mockId for a weekly mock: the ISO week ID (YYYY-Www). */
export function jobMockIdForWeekly(weekId: string): string {
  return weekId;
}

/** Bare mockId for a full mock: `full__{examSlug}__{n}`. */
export function jobMockIdForFull(examSlug: string, n: number): string {
  return `full__${examSlug}__${n}`;
}

/** jobExamDefinitions doc-ID for a bare mockId + kind (Step 3
 * §2.10). */
export function jobMockDocId(mockId: string, kind: JobMockKind): string {
  if (kind === 'full') return mockId;
  return `${kind}__${mockId}`;
}

/** Bare mockId from a jobExamDefinitions doc-ID + kind (inverse
 * of jobMockDocId). Returns null when the doc-ID does not match
 * the kind's shape — the caller shows the honest not-found
 * state. */
export function jobMockIdFromDocId(docId: string, kind: JobMockKind): string | null {
  if (kind === 'full') {
    return docId.startsWith('full__') ? docId : null;
  }
  const prefix = `${kind}__`;
  if (!docId.startsWith(prefix)) return null;
  const bare = docId.slice(prefix.length);
  return bare.length > 0 ? bare : null;
}

/** Bundle doc-ID for a mock (Step 3 §2.8 — same bare key as the
 * mockId; jobQuestions.ts has the same builders). */
export function jobMockBundleId(mockId: string, kind: JobMockKind): string {
  if (kind === 'full') return `mock__${mockId}`;
  return `${kind}__${mockId}`;
}

/* ------------------------------------------------------------------ */
/* Dhaka dates + ISO weeks (no scheduled job — derived from the date) */
/* ------------------------------------------------------------------ */

/** Today's date in Asia/Dhaka as YYYY-MM-DD. */
export function jobDhakaDateString(nowMs: number = Date.now()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(nowMs));
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** ISO week of a YYYY-MM-DD date (UTC math — the date is already a
 * calendar date, not a timestamp). Returns the ISO week-year, the
 * week number, the week ID (`YYYY-Www`) and the week's start date
 * (Monday, YYYY-MM-DD). */
export function jobIsoWeekOfDate(dateYYYYMMDD: string): {
  isoYear: number;
  isoWeek: number;
  weekId: string;
  weekStartDate: string;
} {
  const [y, m, d] = dateYYYYMMDD.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7; // Mon=1 .. Sun=7
  // Thursday of this week decides the ISO year.
  const thursday = new Date(date);
  thursday.setUTCDate(thursday.getUTCDate() + (4 - day));
  const isoYear = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const monday = new Date(thursday);
  monday.setUTCDate(monday.getUTCDate() - 3);
  const fmt = (dt: Date): string => dt.toISOString().slice(0, 10);
  return {
    isoYear,
    isoWeek: week,
    weekId: `${isoYear}-W${String(week).padStart(2, '0')}`,
    weekStartDate: fmt(monday),
  };
}

/** Today's daily mockId (the Dhaka date). */
export function jobTodayDailyMockId(nowMs: number = Date.now()): string {
  return jobMockIdForDaily(jobDhakaDateString(nowMs));
}

/** This week's weekly mockId (the ISO week ID). */
export function jobThisWeekWeeklyMockId(nowMs: number = Date.now()): string {
  return jobMockIdForWeekly(jobIsoWeekOfDate(jobDhakaDateString(nowMs)).weekId);
}

/** Which exam's turn it is in the weekly cycle for an ISO week
 * number (Step 2 §3.5 / design plan §4.2: BCS → Bank → Primary →
 * NTRCA, rotating). Deterministic: week 1 → BCS, week 2 → Bank,
 * week 3 → Primary, week 4 → NTRCA, week 5 → BCS again. This is
 * the SCHEDULE (whose turn it is) — the mock doc's own examSlug
 * is authoritative at runtime. */
export function jobWeeklyExamForWeek(isoWeek: number): string {
  const idx = ((isoWeek - 1) % WEEKLY_MOCK_CYCLE.length + WEEKLY_MOCK_CYCLE.length) % WEEKLY_MOCK_CYCLE.length;
  return WEEKLY_MOCK_CYCLE[idx];
}

/** This week's cycle exam (whose turn it is this week). */
export function jobThisWeekCycleExam(nowMs: number = Date.now()): string {
  return jobWeeklyExamForWeek(jobIsoWeekOfDate(jobDhakaDateString(nowMs)).isoWeek);
}

/* ------------------------------------------------------------------ */
/* Rules snapshot (faithful copy of the exam's rulesConfig)            */
/* ------------------------------------------------------------------ */

/** Build a mock's rulesSnapshot from the exam's verified
 * rulesConfig (Step 3 §2.10). Throws for an unknown exam slug.
 * `overrides` is for DAILY mocks only: the daily set is 20–30
 * questions in 20–30 minutes, not the exam's full pattern — the
 * Admin sets the daily questionCount/timeMinutes at creation.
 * The snapshot NEVER invents a penalty: Bank's negativeMarking
 * stays null (unverified) — the engine scores it as 0. */
export function buildJobMockRulesSnapshot(
  examSlug: string,
  overrides?: { questionCount?: number; timeMinutes?: number },
  kind?: JobMockKind,
): JobMockRulesSnapshot {
  const cfg = jobRulesConfig(examSlug);
  if (!cfg) {
    throw new Error(`buildJobMockRulesSnapshot: no rulesConfig for exam '${examSlug}'`);
  }
  if (cfg.questionCount === null || cfg.timeMinutes === null || cfg.marksPerQuestion !== 1) {
    throw new Error(`buildJobMockRulesSnapshot: exam '${examSlug}' has no verified full pattern`);
  }
  const questionCount = overrides?.questionCount ?? cfg.questionCount;
  const timeMinutes = overrides?.timeMinutes ?? cfg.timeMinutes;
  if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 200) {
    throw new Error(`buildJobMockRulesSnapshot: questionCount ${String(questionCount)} must be 1–200`);
  }
  if (!Number.isInteger(timeMinutes) || timeMinutes < 1 || timeMinutes > 600) {
    throw new Error(`buildJobMockRulesSnapshot: timeMinutes ${String(timeMinutes)} must be 1–600`);
  }
  // Daily mocks are short by design (rules: 20–30Q / 20–30min).
  if (kind === 'daily' && (questionCount < 20 || questionCount > 30 || timeMinutes < 20 || timeMinutes > 30)) {
    throw new Error('buildJobMockRulesSnapshot: daily mocks must be 20–30 questions in 20–30 minutes');
  }
  return {
    questionCount,
    timeMinutes,
    marksPerQuestion: 1,
    negativeMarking: cfg.negativeMarking,
    negativeMarkingVerified: cfg.negativeMarkingVerified,
    passPercent: cfg.passPercent,
    scoringConfigVersion: cfg.scoringConfigVersion,
  };
}

/* ------------------------------------------------------------------ */
/* Validation (mirrors the rules — lib-side, for the admin UI + tests)*/
/* ------------------------------------------------------------------ */

function isNonEmptyString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}

function isTimestampLike(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (v instanceof Date) return true;
  return typeof v === 'object';
}

const JOB_MOCK_KEYS = [
  'examSlug',
  'titleBn',
  'titleEn',
  'kind',
  'bundleId',
  'questionSetId',
  'rulesSnapshot',
  'scheduleDate',
  'examSlugCycle',
  'status',
  'retakeAllowed',
  'maxAttempts',
  'publishedAt',
  'publishedBy',
  'createdAt',
  'updatedAt',
] as const;

const JOB_MOCK_CYCLE_EXAMS = ['bcs', 'bank', 'primary-teacher', 'ntrca'] as const;

/** Validate a jobExamDefinitions doc. Returns problem strings;
 * empty = valid. Mirrors `validJobExamDefinition()` in
 * firestore.rules — including the doc-ID patterns (pass the doc
 * ID as `mockId`… the second argument is the DOC ID, not the
 * bare key). */
export function validateJobMock(doc: unknown, docId: string): string[] {
  const problems: string[] = [];
  const label = 'jobExamDefinitions';
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    return [`${label}: doc must be an object`];
  }
  const d = doc as Record<string, unknown>;
  for (const k of Object.keys(d)) {
    if (!(JOB_MOCK_KEYS as readonly string[]).includes(k)) {
      problems.push(`${label}: unknown field '${k}'`);
    }
  }
  if (!isNonEmptyString(d.examSlug, 100)) {
    problems.push(`${label}: examSlug must be a non-empty string ≤100 chars`);
  } else if (d.examSlug === 'it-professional') {
    problems.push(`${label}: it-professional has scope_pending — no mocks yet`);
  }
  if (!isNonEmptyString(d.titleBn, 200) || !isNonEmptyString(d.titleEn, 200)) {
    problems.push(`${label}: titleBn/titleEn required (≤200 chars)`);
  }
  if (d.kind !== 'daily' && d.kind !== 'weekly' && d.kind !== 'full') {
    problems.push(`${label}: kind must be daily/weekly/full`);
  }
  if (!isNonEmptyString(d.bundleId, 200)) {
    problems.push(`${label}: bundleId must be a non-empty string ≤200 chars`);
  }
  if (!isNonEmptyString(d.questionSetId, 200)) {
    problems.push(`${label}: questionSetId must be a non-empty string ≤200 chars (the manifest version)`);
  }
  // Rules snapshot.
  const s = d.rulesSnapshot as Record<string, unknown> | null;
  if (typeof s !== 'object' || s === null || Array.isArray(s)) {
    problems.push(`${label}: rulesSnapshot must be a map`);
  } else {
    if (!Number.isInteger(s.questionCount) || (s.questionCount as number) < 1 || (s.questionCount as number) > 200) {
      problems.push(`${label}: rulesSnapshot.questionCount must be an integer 1–200`);
    }
    if (!Number.isInteger(s.timeMinutes) || (s.timeMinutes as number) < 1 || (s.timeMinutes as number) > 600) {
      problems.push(`${label}: rulesSnapshot.timeMinutes must be an integer 1–600`);
    }
    // Daily mocks are short by design (ChatGPT §1(d) / rules):
    // 20–30 questions in 20–30 minutes (editorial standard
    // 25Q/25min).
    if (d.kind === 'daily'
      && (typeof s.questionCount !== 'number' || s.questionCount < 20 || s.questionCount > 30
        || typeof s.timeMinutes !== 'number' || s.timeMinutes < 20 || s.timeMinutes > 30)) {
      problems.push(`${label}: daily rulesSnapshot must be 20–30 questions in 20–30 minutes`);
    }
    if (s.marksPerQuestion !== 1) {
      problems.push(`${label}: rulesSnapshot.marksPerQuestion must be 1`);
    }
    if (s.negativeMarking !== null && s.negativeMarking !== 0 && s.negativeMarking !== 0.25 && s.negativeMarking !== 0.5) {
      problems.push(`${label}: rulesSnapshot.negativeMarking must be null, 0, 0.25 or 0.5`);
    }
    if (typeof s.negativeMarkingVerified !== 'boolean') {
      problems.push(`${label}: rulesSnapshot.negativeMarkingVerified must be a boolean`);
    }
    if (s.passPercent !== null && (typeof s.passPercent !== 'number' || s.passPercent < 0 || s.passPercent > 100)) {
      problems.push(`${label}: rulesSnapshot.passPercent must be null or 0–100`);
    }
    if (!isNonEmptyString(s.scoringConfigVersion, 100)) {
      problems.push(`${label}: rulesSnapshot.scoringConfigVersion must be a non-empty string ≤100 chars`);
    }
  }
  // Doc-ID patterns (Step 3 §2.10).
  if (d.kind === 'daily') {
    if (typeof d.scheduleDate !== 'string' || d.scheduleDate.length === 0) {
      problems.push(`${label}: kind daily needs scheduleDate (YYYY-MM-DD)`);
    } else if (docId !== `daily__${d.scheduleDate}`) {
      problems.push(`${label}: daily mock doc-ID must be 'daily__' + scheduleDate`);
    }
  } else if (d.kind === 'weekly') {
    if (typeof d.scheduleDate !== 'string' || d.scheduleDate.length === 0) {
      problems.push(`${label}: kind weekly needs scheduleDate (week start date)`);
    }
    if (!/^weekly__[0-9]{4}-W[0-9]{2}$/.test(docId)) {
      problems.push(`${label}: weekly mock doc-ID must look like weekly__YYYY-Www`);
    }
  } else if (d.kind === 'full') {
    if (d.scheduleDate !== null) {
      problems.push(`${label}: kind full must have scheduleDate null`);
    }
    const exam = typeof d.examSlug === 'string' ? d.examSlug : '';
    if (!new RegExp(`^full__${exam}__[0-9]+$`).test(docId)) {
      problems.push(`${label}: full mock doc-ID must look like full__{examSlug}__{n}`);
    }
  }
  // Cycle exam: weekly only, and only one of the 4 cycle exams.
  if (d.kind === 'weekly') {
    if (!(JOB_MOCK_CYCLE_EXAMS as readonly string[]).includes(String(d.examSlugCycle))) {
      problems.push(`${label}: kind weekly needs examSlugCycle (bcs/bank/primary-teacher/ntrca)`);
    }
  } else if (d.examSlugCycle !== null) {
    problems.push(`${label}: examSlugCycle must be null unless kind is weekly`);
  }
  if (d.status !== 'draft' && d.status !== 'published' && d.status !== 'archived') {
    problems.push(`${label}: status must be draft/published/archived`);
  }
  if (typeof d.retakeAllowed !== 'boolean') {
    problems.push(`${label}: retakeAllowed must be a boolean`);
  }
  if (d.maxAttempts !== null && (!Number.isInteger(d.maxAttempts) || (d.maxAttempts as number) < 1)) {
    problems.push(`${label}: maxAttempts must be null or an integer ≥1`);
  }
  for (const f of ['publishedAt', 'createdAt', 'updatedAt']) {
    if (d[f] !== null && d[f] !== undefined && !isTimestampLike(d[f])) {
      problems.push(`${label}: ${f} must be a timestamp or null`);
    }
  }
  if (d.publishedBy !== null && d.publishedBy !== undefined && typeof d.publishedBy !== 'string') {
    problems.push(`${label}: publishedBy must be a string or null`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Display helpers (Bangla-first UI copy)                              */
/* ------------------------------------------------------------------ */

/** Bangla kind label for a mock. */
export function jobMockKindLabelBn(kind: JobMockKind): string {
  if (kind === 'daily') return 'দৈনিক মক';
  if (kind === 'weekly') return 'সাপ্তাহিক পূর্ণ মক';
  return 'পূর্ণ মক';
}

/** One-line pattern summary from a snapshot (for the intro card
 * and the mock list). Bank shows the disabled-penalty note
 * (Step 8 fold-in M1) — never the provisional 0.25 as a rule. */
export function jobMockPatternSummaryBn(snapshot: JobMockRulesSnapshot, questionCountOverride?: number): string {
  // Step 9 closure (N3): the snapshot count is the definition's
  // DECLARED count — the frozen manifest is the authority, and the
  // bundle is what the student actually faces. A caller that
  // already holds the bundle passes its real count so the intro
  // never promises N questions and runs M.
  const count = questionCountOverride ?? snapshot.questionCount;
  const base = `${count}টি MCQ · ${snapshot.timeMinutes} মিনিট`;
  if (snapshot.negativeMarking === null || snapshot.negativeMarking === 0) {
    return `${base} · নেগেটিভ মার্কিং বন্ধ — বিজ্ঞপ্তি যাচাই বাকি`;
  }
  const neg = snapshot.negativeMarking === 0.5 ? '−০.৫০' : '−০.২৫';
  return `${base} · ভুলে ${neg}`;
}
