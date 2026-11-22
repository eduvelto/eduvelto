/**
 * Eduvelto Job Preparation — Practice + Mock Engine (Step 8).
 *
 * Step 8 builds PRACTICE on this engine; Step 9 adds MOCK on the same
 * engine (same session shape, same scoring, same attempt doc — only
 * `kind` + the timer differ). The UI agent builds against the exports
 * of this file; do not rename them.
 *
 * TRUST BOUNDARY (Step 7 fold-in, ChatGPT P0-01/P0-02 — read before
 * touching scores or attempts):
 *   (1) A receipt is a TEN-MINUTE, ATTEMPT-BOUND AUTHORIZATION
 *       WINDOW, not one-use. Never claim one-use.
 *   (2) A "submitted" attempt is CLIENT-ATTESTED, not verified.
 *       Every score computed here is CLIENT-CALCULATED (the result
 *       type carries `clientCalculatedScore`, never "verified") and
 *       every result page must show JOB_PRACTICE_RESULT_LABEL —
 *       "অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়". A determined
 *       student can forge an attempt in the console; Spark has no
 *       trusted backend to stop that (Blaze — no approval, ৳০
 *       বাজেট). The rules + tests document this limitation instead
 *       of pretending it away.
 *
 * Practice runs UNTIMED (Step 2 §3.4): a practice session has
 * `endsAt: null` and `clientEndsAtMillis: null`, and no timer is
 * wired into it. The timer helpers (`remainingMillis`,
 * `timerWarning`) exist at engine level for MOCK (Step 9) only.
 *
 * Exam patterns are DERIVED from the verified Step 5 rulesConfig
 * (`JOB_RULES_CONFIGS` in jobExams.ts) — never re-typed here — so a
 * transcription slip is impossible by construction. Only the four
 * verified exams exist (BCS, Bank, Primary Teacher, NTRCA 18th);
 * `jobContent.ts` has NO shared exam pattern (its COMMON_TOPICS map
 * is preliminary topics only, no numbers), so there is no 'common'
 * pattern. Unknown slugs return null — never a guessed pattern.
 *
 * BANK PENALTY — DISABLED (Step 8 fold-in, ChatGPT findings 2 + 9,
 * preferred option): the Bank `negativeMarking` in the rulesConfig
 * is null (NOT verified — circular-dependent), so Bank practice
 * scores with NO negative marking at all (`negativeMarking: 0`,
 * `negativeMarkingVerified: false`, label 'নেগেটিভ মার্কিং বন্ধ —
 * বিজ্ঞপ্তি যাচাই বাকি'). The provisional 0.25 in
 * `provisionalNegativeMarking` is NEVER used for scoring — an
 * unverified marking scheme must never drive an authoritative-looking
 * score, and a disclaimer does not fix a wrong deduction. The UI
 * must say explicitly that Bank scoring awaits verification
 * (practice page before the session, result page with the result).
 * The attempt stores the marking actually applied
 * (`negativeMarkingUsed` + `markingSchemeVersion`) so a later
 * config change can never silently reinterpret an old result.
 * When the Bank circular is verified, set `negativeMarking: 0.25`
 * in the rulesConfig (and bump `scoringConfigVersion`) — this file
 * needs no other change.
 *
 * MARKING-SCHEME VERSIONING (Step 8 fold-in): every pattern carries
 * `scoringConfigVersion` (from the rulesConfig); every scored
 * result and every attempt doc stores `negativeMarkingUsed` +
 * `markingSchemeVersion`. The rules enforce
 * `negativeDeduction == wrongCount * negativeMarkingUsed` with
 * `negativeMarkingUsed` in {0, 0.25, 0.5} — so the deduction a
 * student claims is always tied to a declared marking scheme.
 *
 * RULES NOTE (Step 8 fold-in — re-checked against the committed
 * rules in this worktree): the Step 8 rules replace the Step 7
 * minimal attempt anchor with the full §2.11 attempt (create-once
 * as 'submitted', no updates) and add a `jobSessions` match block.
 * This lib was checked field-by-field against those rules: the
 * attempt doc's keys match its `hasOnly` list exactly (now 33 keys:
 * the 30 Step 8 keys + `negativeMarkingUsed` +
 * `markingSchemeVersion` + `bundleVersion`), its score bounds
 * (score ±totalMarks, deduction = wrong × negativeMarkingUsed,
 * percentage −100..100, counts sum) hold for every score this
 * engine produces, and the autosave patch's fields are exactly the
 * session-update `affectedKeys` subset for autosave (five fields:
 * the four Step 8 fields + `revision` — the revision is bumped by
 * exactly 1 per write and the rules reject a stale one). ONE
 * deliberate alignment: the session doc carries NO
 * `subjectId`/`topicId` (§2.12 has none; the rules allowlist has
 * none). If the rules change, the coordinator re-checks this lib
 * against the committed rules — do not assume this note is still
 * true then. The UI flow the rules require: the session and the
 * attempt are written in ONE batched write (session → submitted +
 * attempt create) and the attempt rule validates the POST-write
 * session state with getAfter() — the batch is for ATOMICITY
 * (either both land or neither does), not for the gate:
 * getAfter() reads the stored doc when the session is NOT in the
 * batch, so the old sequential flow (submit session, then create
 * attempt) still passes. The attempt is created once as
 * 'submitted' (no in-progress attempt doc).
 */

import { serverTimestamp } from 'firebase/firestore';
import { JOB_RULES_CONFIGS } from './jobExams';
import {
  type JobQuestionBundle,
  type JobQuestionDifficulty,
  type JobQuestionKey,
} from './jobQuestions';

/** BINDING (Step 7 fold-in, P0-02): every result page shows this
 * label. Never 'verified', never 'নিয়োগ পরীক্ষার ফল'. */
export const JOB_PRACTICE_RESULT_LABEL =
  'অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়';

/* ------------------------------------------------------------------ */
/* Exam patterns (derived from JOB_RULES_CONFIGS — never re-typed)    */
/* ------------------------------------------------------------------ */

export interface JobExamPattern {
  examSlug: string;
  questionCount: number;
  timeMinutes: number;
  /** Always 1 in the four verified patterns (1 mark per MCQ). */
  marksPerQuestion: 1;
  /** 0 = no negative marking (Bank — unverified penalty disabled,
   * Step 8 fold-in). 0.25 / 0.5 = the verified penalty. */
  negativeMarking: 0 | 0.25 | 0.5;
  /** False ONLY for Bank (penalty unverified — disabled, not
   * provisional-scored; see the header note). */
  negativeMarkingVerified: boolean;
  /** The scoring-config version this pattern was built from
   * (Step 8 fold-in, finding 9) — stored on every attempt. */
  scoringConfigVersion: string;
  /** Null when the exam has no fixed pass percent (BCS: cutoff
   * varies; Bank: no verified pass percent). */
  passPercent: number | null;
  patternLabel: string;
}

/** Bangla pattern labels — one per verified exam. Bank's label says
 * negative marking is OFF until the circular verifies it (Step 8
 * fold-in — the provisional 0.25 is never scored); NTRCA's says
 * 18th is the LAST verified pattern, not the current one. */
const JOB_EXAM_PATTERN_LABELS: Record<string, string> = {
  bcs: 'যাচাইকৃত ধরন',
  bank: 'নেগেটিভ মার্কিং বন্ধ — বিজ্ঞপ্তি যাচাই বাকি',
  'primary-teacher': 'যাচাইকৃত ধরন',
  ntrca: '১৮তম ধরন — শেষ যাচাইকৃত ধরন',
};

/** The four verified exam slugs, in syllabus order. */
export const JOB_EXAM_PATTERN_SLUGS = [
  'bcs',
  'bank',
  'primary-teacher',
  'ntrca',
] as const;

function buildJobExamPattern(examSlug: string): JobExamPattern | null {
  const cfg = JOB_RULES_CONFIGS[examSlug];
  if (!cfg) return null;
  if (
    cfg.questionCount === null
    || cfg.timeMinutes === null
    || cfg.marksPerQuestion !== 1
  ) {
    return null;
  }
  // Bank: verified penalty is null — negative marking is DISABLED
  // (0), never the provisional 0.25 (Step 8 fold-in, ChatGPT
  // findings 2 + 9: an unverified scheme must never drive a score).
  const rawNegative = cfg.negativeMarking ?? 0;
  if (rawNegative !== 0 && rawNegative !== 0.25 && rawNegative !== 0.5) return null;
  const negative: 0 | 0.25 | 0.5 = rawNegative;
  const label = JOB_EXAM_PATTERN_LABELS[examSlug];
  if (!label) return null;
  return {
    examSlug,
    questionCount: cfg.questionCount,
    timeMinutes: cfg.timeMinutes,
    marksPerQuestion: 1,
    negativeMarking: negative,
    negativeMarkingVerified: cfg.negativeMarkingVerified,
    scoringConfigVersion: cfg.scoringConfigVersion,
    passPercent: cfg.passPercent,
    patternLabel: label,
  };
}

/** Verified exam patterns, keyed by exam slug. Only the four
 * verified exams — no 'common', no invented exams. */
const JOB_EXAM_PATTERN_ENTRIES: Array<[string, JobExamPattern]> = [];
for (const slug of JOB_EXAM_PATTERN_SLUGS) {
  const pattern = buildJobExamPattern(slug);
  if (pattern !== null) JOB_EXAM_PATTERN_ENTRIES.push([slug, pattern]);
}
export const JOB_EXAM_PATTERNS: Record<string, JobExamPattern> =
  Object.fromEntries(JOB_EXAM_PATTERN_ENTRIES);

/** The verified pattern for one exam, or null (unknown slug, or the
 * exam has no verified pattern — never a guessed pattern). */
export function jobExamPattern(examSlug: string): JobExamPattern | null {
  return JOB_EXAM_PATTERNS[examSlug] ?? null;
}

/** Build an exam pattern from a mock's rulesSnapshot (Step 9).
 * The snapshot is the AUTHORITY for this mock — a later
 * rulesConfig change never re-scores it. The snapshot's
 * negativeMarking may be null (Bank — unverified): the pattern
 * then carries 0 (disabled), exactly like the live config path
 * (buildJobExamPattern). Throws unless the snapshot is a complete,
 * well-formed pattern (never guess a penalty or a duration). */
export function patternFromRulesSnapshot(
  examSlug: string,
  snapshot: {
    questionCount: number;
    timeMinutes: number;
    marksPerQuestion: number;
    negativeMarking: number | null;
    negativeMarkingVerified: boolean;
    passPercent: number | null;
    scoringConfigVersion: string;
  },
): JobExamPattern {
  if (!Number.isInteger(snapshot.questionCount) || snapshot.questionCount < 1 || snapshot.questionCount > 200) {
    throw new Error(`patternFromRulesSnapshot: snapshot questionCount ${String(snapshot.questionCount)} must be 1–200`);
  }
  if (!Number.isInteger(snapshot.timeMinutes) || snapshot.timeMinutes < 1 || snapshot.timeMinutes > 600) {
    throw new Error(`patternFromRulesSnapshot: snapshot timeMinutes ${String(snapshot.timeMinutes)} must be 1–600`);
  }
  if (snapshot.marksPerQuestion !== 1) {
    throw new Error('patternFromRulesSnapshot: snapshot marksPerQuestion must be 1');
  }
  const rawNegative = snapshot.negativeMarking ?? 0;
  if (rawNegative !== 0 && rawNegative !== 0.25 && rawNegative !== 0.5) {
    throw new Error(`patternFromRulesSnapshot: snapshot negativeMarking ${String(rawNegative)} must be 0, 0.25 or 0.5`);
  }
  if (typeof snapshot.scoringConfigVersion !== 'string' || snapshot.scoringConfigVersion.length === 0) {
    throw new Error('patternFromRulesSnapshot: snapshot scoringConfigVersion is required');
  }
  const label = JOB_EXAM_PATTERN_LABELS[examSlug] ?? 'যাচাইকৃত ধরন';
  return {
    examSlug,
    questionCount: snapshot.questionCount,
    timeMinutes: snapshot.timeMinutes,
    marksPerQuestion: 1,
    negativeMarking: rawNegative,
    negativeMarkingVerified: snapshot.negativeMarkingVerified,
    scoringConfigVersion: snapshot.scoringConfigVersion,
    passPercent: snapshot.passPercent,
    patternLabel: label,
  };
}

/* ------------------------------------------------------------------ */
/* Practice session (Step 3 §2.12 — jobSessions doc shape)            */
/* ------------------------------------------------------------------ */

export type JobSessionAnswerSelection = 'A' | 'B' | 'C' | 'D' | null;

/** One question's live state inside a session (Step 3 §2.12
 * `answers` map entry). */
export interface JobSessionAnswer {
  selected: JobSessionAnswerSelection;
  markedForReview: boolean;
  timeSpentSeconds: number;
}

/** A practice session doc (`users/{uid}/jobSessions/{sessionId}`).
 * Practice is UNTIMED: `endsAt` and `clientEndsAtMillis` are always
 * `endsAt` and `clientEndsAtMillis` are always
 * null. NO scope fields: Step 3 §2.12 lists no `subjectId`/
 * `topicId` on the session — the practice scope lives on the
 * attempt doc (§2.11) and on the bundle, and the Step 8 rules'
 * session-create allowlist has no scope fields (a session doc
 * carrying them is rejected). `mockId` is always null for
 * practice. Timestamps are `unknown` — `serverTimestamp()` sentinels
 * at creation, real timestamps after read-back (jobQuestions.ts
 * style). */
export interface JobPracticeSessionDoc {
  kind: 'practice';
  mockId: null;
  bundleId: string;
  examSlug: string;
  status: 'in-progress' | 'submitted' | 'abandoned';
  startedAt: unknown;
  endsAt: null;
  questionRefs: Array<{ bundleId: string; n: number; questionId: string }>;
  answers: Record<number, JobSessionAnswer>;
  currentQuestion: number;
  lastSyncedAt: unknown;
  clientEndsAtMillis: null;
  submittedAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
  /** Monotonic write counter (Step 8 fold-in, finding 6): 1 at
   * create, +1 on EVERY write (autosave and submit alike). The
   * rules reject a write that does not carry exactly stored + 1,
   * so a stale tab/device cannot silently overwrite newer
   * answers — the client reloads from the stored revision. */
  revision: number;
}

export interface CreatePracticeSessionInput {
  /** Doc ID — the caller uses this as the jobSessions doc ID (and
   * later as the jobAttempts doc ID); it is NOT a field inside the
   * doc (Step 3 §2.12 has no sessionId field). */
  sessionId: string;
  bundleId: string;
  examSlug: string;
  questionRefs: Array<{ bundleId: string; n: number; questionId: string }>;
}

/** Create a practice session doc (pure — no Firestore write here;
 * the caller writes it with setDoc). Every question starts
 * unanswered, unmarked, 0 seconds. Practice is untimed. */
export function createPracticeSession(
  input: CreatePracticeSessionInput,
): JobPracticeSessionDoc {
  const answers: Record<number, JobSessionAnswer> = {};
  for (const ref of input.questionRefs) {
    answers[ref.n] = { selected: null, markedForReview: false, timeSpentSeconds: 0 };
  }
  return {
    kind: 'practice',
    mockId: null,
    bundleId: input.bundleId,
    examSlug: input.examSlug,
    status: 'in-progress',
    startedAt: serverTimestamp(),
    endsAt: null,
    questionRefs: input.questionRefs.map((r) => ({
      bundleId: r.bundleId,
      n: r.n,
      questionId: r.questionId,
    })),
    answers,
    // Step 8 fold-in (finding 3): the FIRST question is the first
    // ref of the stored (mode-ordered) sequence, not bundle n=1 —
    // advanced mode starts on a medium question.
    currentQuestion: input.questionRefs[0]?.n ?? 1,
    lastSyncedAt: serverTimestamp(),
    clientEndsAtMillis: null,
    submittedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    revision: 1,
  };
}

/* ------------------------------------------------------------------ */
/* Mock session (Step 9 — Step 3 §2.12, kind 'mock')                  */
/* ------------------------------------------------------------------ */

/** A mock session doc (`users/{uid}/jobSessions/{sessionId}`).
 * Same shape as practice, except: `kind` is 'mock', `mockId` is
 * the bare mock key (never null), `endsAt` starts null and is set
 * ONCE after read-back (Step 3 §5.3 — the stored deadline, never
 * reset), and `clientEndsAtMillis` is the client-computed deadline
 * (set at creation, so the timer runs even before the read-back
 * lands or while offline). The questionRefs order is ALWAYS the
 * bundle order for a mock — a timed mock runs in its published
 * order, never in a mode order (Beginner/Advanced ordering is
 * practice-only). Timestamps are `unknown` (sentinels at build
 * time, real timestamps after read-back). */
export interface JobMockSessionDoc {
  kind: 'mock';
  mockId: string;
  bundleId: string;
  examSlug: string;
  /** The exam definition this session runs
   * (jobExamDefinitions doc-ID — Step 9 fold-in, H.2). */
  definitionId: string;
  /** The frozen question-set manifest this session runs
   * (jobQuestionSetManifests doc-ID — ChatGPT §1(f)). Resume
   * reads THIS manifest, never the definition's current one. */
  questionSetId: string;
  /** The bundle generation this session runs (must equal the
   * bundle's bundleVersion at create; the attempt is bound to
   * it — a republished bundle cannot reinterpret this session). */
  bundleVersion: number;
  status: 'in-progress' | 'submitted' | 'abandoned';
  startedAt: unknown;
  endsAt: unknown;
  questionRefs: Array<{ bundleId: string; n: number; questionId: string }>;
  answers: Record<number, JobSessionAnswer>;
  currentQuestion: number;
  lastSyncedAt: unknown;
  clientEndsAtMillis: number | null;
  submittedAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
  revision: number;
}

export interface CreateMockSessionInput {
  /** Doc ID — the caller uses this as the jobExamSessions doc ID
   * (and later as the jobExamAttempts doc ID); it is NOT a field
   * inside the doc (Step 3 §2.12 has no sessionId field). */
  sessionId: string;
  /** Bare mock key (daily: YYYY-MM-DD; weekly: YYYY-Www; full:
   * full__{examSlug}__{n}) — must equal the bundle's mockId. */
  mockId: string;
  bundleId: string;
  examSlug: string;
  /** The exam definition this session runs (jobExamDefinitions
   * doc-ID — the mock doc's own ID). */
  definitionId: string;
  /** The frozen manifest this session runs
   * (jobQuestionSetManifests doc-ID — the mock doc's
   * questionSetId). The session's questionRefs MUST equal the
   * manifest's refs (whole-equality in the rules). */
  questionSetId: string;
  /** The bundle generation this session runs (the bundle's
   * bundleVersion at create — the attempt is bound to it). */
  bundleVersion: number;
  /** Bundle order (NOT mode order — see the type comment). */
  questionRefs: Array<{ bundleId: string; n: number; questionId: string }>;
  /** Mock duration in minutes (from the mock's rulesSnapshot —
   * the snapshot is the authority, never the live config). */
  timeMinutes: number;
  /** Client clock at creation (Date.now()) — the offline timer's
   * base. The server deadline (endsAt) is set after read-back. */
  clientNowMillis: number;
}

/** Create a mock session doc (pure — no Firestore write here; the
 * caller writes it with setDoc). Every question starts unanswered,
 * unmarked, 0 seconds. The deadline is stored, never reset: endsAt
 * is null here and set ONCE after read-back (see
 * buildMockDeadlineUpdate); clientEndsAtMillis is set NOW so the
 * timer never waits on the network. */
export function createMockSession(input: CreateMockSessionInput): JobMockSessionDoc {
  const answers: Record<number, JobSessionAnswer> = {};
  for (const ref of input.questionRefs) {
    answers[ref.n] = { selected: null, markedForReview: false, timeSpentSeconds: 0 };
  }
  return {
    kind: 'mock',
    mockId: input.mockId,
    bundleId: input.bundleId,
    examSlug: input.examSlug,
    definitionId: input.definitionId,
    questionSetId: input.questionSetId,
    bundleVersion: input.bundleVersion,
    status: 'in-progress',
    startedAt: serverTimestamp(),
    endsAt: null,
    questionRefs: input.questionRefs.map((r) => ({
      bundleId: r.bundleId,
      n: r.n,
      questionId: r.questionId,
    })),
    answers,
    // Mock order is the bundle order: the first question is the
    // first ref, never a mode-ordered one.
    currentQuestion: input.questionRefs[0]?.n ?? 1,
    lastSyncedAt: serverTimestamp(),
    clientEndsAtMillis: input.clientNowMillis + input.timeMinutes * 60 * 1000,
    submittedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    revision: 1,
  };
}

/** Best-effort millis from a Firestore timestamp value (a real
 * Timestamp after read-back, a Date, or {seconds}). A
 * serverTimestamp() sentinel (plain object, no toMillis/seconds)
 * returns null — the caller falls back to clientEndsAtMillis. */
function timestampToMillis(t: unknown): number | null {
  if (t === null || t === undefined) return null;
  const v = t as { toMillis?: unknown; seconds?: unknown };
  if (typeof v.toMillis === 'function') return (v.toMillis as () => number)();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  if (t instanceof Date) return t.getTime();
  return null;
}

/** The stored deadline of a mock session in millis (Step 9 timer
 * rule, ChatGPT finding #10): the SERVER endsAt when it exists
 * (after read-back), else the client-computed clientEndsAtMillis.
 * Returns null when neither exists (a mock session always sets
 * clientEndsAtMillis at creation — null means a malformed doc). */
export function mockDeadlineMillis(session: JobMockSessionDoc): number | null {
  const endsAtMillis = timestampToMillis(session.endsAt);
  if (endsAtMillis !== null) return endsAtMillis;
  if (typeof session.clientEndsAtMillis === 'number' && Number.isFinite(session.clientEndsAtMillis)) {
    return session.clientEndsAtMillis;
  }
  return null;
}

/** Milliseconds left on a mock session (null when no deadline is
 * stored). Raw difference (negative when expired — callers must
 * not clamp it to 0, or the expired state is lost). */
export function mockRemainingMillis(session: JobMockSessionDoc, nowMillis: number): number | null {
  const deadline = mockDeadlineMillis(session);
  if (deadline === null) return null;
  return deadline - nowMillis;
}

/** True when the stored deadline has passed (Step 9: the page
 * auto-submits exactly once when this flips true). */
export function isMockExpired(session: JobMockSessionDoc, nowMillis: number): boolean {
  const remaining = mockRemainingMillis(session, nowMillis);
  return remaining !== null && remaining <= 0;
}

/** The exact Firestore update payload for the ONCE-only endsAt
 * write (Step 3 §5.3): endsAt (server deadline) + the matching
 * clientEndsAtMillis + sync timestamps + revision exactly
 * stored + 1. The rules allow endsAt to move null → timestamp
 * exactly once; a second write is denied. The caller passes the
 * STORED revision (fresh-read, never local state) and the endsAt
 * Timestamp (startedAt + timeMinutes, from the read-back). */
export function buildMockDeadlineUpdate(
  storedRevision: number,
  endsAt: unknown,
  clientEndsAtMillis: number | null,
): {
  endsAt: unknown;
  clientEndsAtMillis: number | null;
  lastSyncedAt: unknown;
  updatedAt: unknown;
  revision: number;
} {
  return {
    endsAt,
    clientEndsAtMillis,
    lastSyncedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    revision: storedRevision + 1,
  };
}

/** The exact Firestore update payload for mock autosave — the
 * same five fields as practice (answers, currentQuestion,
 * lastSyncedAt, updatedAt, revision exactly stored + 1). Never
 * status, never endsAt, never the question list. The caller
 * throttles the writes (Step 2 §4.6); this function only builds
 * the payload. */
export function buildMockAutosavePatch(session: JobMockSessionDoc): {
  answers: Record<number, JobSessionAnswer>;
  currentQuestion: number;
  lastSyncedAt: unknown;
  updatedAt: unknown;
  revision: number;
} {
  return {
    answers: session.answers,
    currentQuestion: session.currentQuestion,
    lastSyncedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    revision: session.revision + 1,
  };
}

/** The exact Firestore update payload for the mock SUBMIT
 * transition (Step 9, Design G step 2): session → 'submitted'
 * as a STANDALONE update — NOT batched with the attempt, because
 * the receipt (step 3) can only be created once the session is
 * already submitted (the Step 7 receipt gate anchors to a
 * submitted record). The caller passes the STORED revision
 * (fresh-read, never local state); the rules require exactly
 * stored + 1 and a submittedAt timestamp. `lastSyncedAt` is NOT
 * touched — the merged doc keeps the stored value, which the
 * rules accept (it is already a timestamp). */
export function buildMockSessionSubmitUpdate(storedRevision: number): {
  status: 'submitted';
  submittedAt: unknown;
  updatedAt: unknown;
  revision: number;
} {
  return {
    status: 'submitted',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    revision: storedRevision + 1,
  };
}

/** The exact Firestore update payload for the mock ABANDON
 * transition (time expired, or the student quits): session →
 * 'abandoned' as a standalone update. submittedAt stays null
 * (the rules deny abandoning WITH a submittedAt); the doc is
 * then frozen — the audit trail of an unfinished mock. */
export function buildMockSessionAbandonUpdate(storedRevision: number): {
  status: 'abandoned';
  updatedAt: unknown;
  revision: number;
} {
  return {
    status: 'abandoned',
    updatedAt: serverTimestamp(),
    revision: storedRevision + 1,
  };
}

/** The server deadline for a mock session (pure): startedAt
 * (server time, millis) + the mock's duration in minutes. The
 * Firestore layer (jobMock.ts) uses this to set endsAt ONCE
 * after read-back; the RULES bound the stored value to exactly
 * this (audit M1 — endsAt may never exceed startedAt + the
 * mock's rulesSnapshot.timeMinutes). Throws on bad inputs —
 * never guess a deadline. */
export function mockDeadlineForSession(startedAtMillis: number, timeMinutes: number): number {
  if (!Number.isFinite(startedAtMillis) || startedAtMillis <= 0) {
    throw new Error('mockDeadlineForSession: startedAtMillis must be a positive number');
  }
  if (!Number.isInteger(timeMinutes) || timeMinutes < 1 || timeMinutes > 600) {
    throw new Error(`mockDeadlineForSession: timeMinutes ${String(timeMinutes)} must be 1–600`);
  }
  return startedAtMillis + timeMinutes * 60 * 1000;
}

function sessionQuestionCount(session: JobPracticeSessionDoc): number {
  return session.questionRefs.length;
}

function assertSessionQuestion(
  session: JobPracticeSessionDoc,
  n: number,
): void {
  if (!Number.isInteger(n) || n < 1 || n > sessionQuestionCount(session)) {
    throw new Error(
      `jobEngine: question ${String(n)} is out of range (1–${sessionQuestionCount(session)})`,
    );
  }
  if (!(n in session.answers)) {
    throw new Error(`jobEngine: question ${String(n)} has no answers entry`);
  }
}

/** Answer (or clear) one question — pure, returns a NEW session.
 * Selecting an answer NEVER clears markedForReview (Step 2 rule:
 * the mark survives answering). */
export function answerSessionQuestion(
  session: JobPracticeSessionDoc,
  n: number,
  selected: JobSessionAnswerSelection,
): JobPracticeSessionDoc {
  assertSessionQuestion(session, n);
  if (selected !== null && !['A', 'B', 'C', 'D'].includes(selected)) {
    throw new Error(`jobEngine: selected '${String(selected)}' is not A/B/C/D/null`);
  }
  return {
    ...session,
    answers: {
      ...session.answers,
      [n]: { ...session.answers[n], selected },
    },
  };
}

/** Toggle "marked for review" on one question — pure, returns a NEW
 * session. Marking NEVER clears the selected answer (Step 2 rule:
 * the palette "পরে দেখব" mark keeps the answer). */
export function toggleMarkForReview(
  session: JobPracticeSessionDoc,
  n: number,
): JobPracticeSessionDoc {
  assertSessionQuestion(session, n);
  return {
    ...session,
    answers: {
      ...session.answers,
      [n]: {
        ...session.answers[n],
        markedForReview: !session.answers[n].markedForReview,
      },
    },
  };
}

/** Move the current-question pointer — pure, returns a NEW session.
 * Throws out of range (1..total); the palette only ever offers
 * real question numbers. */
export function goToQuestion(
  session: JobPracticeSessionDoc,
  n: number,
): JobPracticeSessionDoc {
  assertSessionQuestion(session, n);
  return { ...session, currentQuestion: n };
}

/** Session progress for the palette / progress bar. `answered` =
 * questions with a selected answer; `marked` = marked for review
 * (independent of answered — a question can be both). */
export function sessionProgress(session: JobPracticeSessionDoc): {
  answered: number;
  marked: number;
  total: number;
  current: number;
} {
  let answered = 0;
  let marked = 0;
  for (const ref of session.questionRefs) {
    const a = session.answers[ref.n];
    if (!a) continue;
    if (a.selected !== null) answered += 1;
    if (a.markedForReview) marked += 1;
  }
  return {
    answered,
    marked,
    total: session.questionRefs.length,
    current: session.currentQuestion,
  };
}

/** The exact Firestore update payload for autosave (Step 2 §4.6 /
 * Step 3 §2.12): ONLY the fields that may change while a session is
 * in-progress — `answers`, `currentQuestion`, `lastSyncedAt`,
 * `updatedAt`, plus `revision` (Step 8 fold-in, finding 6: exactly
 * session.revision + 1 — the rules reject a stale patch, so the
 * caller must track the last WRITTEN revision, not the last edit:
 * see JobPracticePage's writtenRevisionRef). Nothing else (never
 * status, never endsAt, never the question list). The caller
 * throttles the writes (Step 2 §4.6: 30s / 5 changes / page-hide /
 * submit); this function only builds the payload. */
export function buildAutosavePatch(session: JobPracticeSessionDoc): {
  answers: Record<number, JobSessionAnswer>;
  currentQuestion: number;
  lastSyncedAt: unknown;
  updatedAt: unknown;
  revision: number;
} {
  return {
    answers: session.answers,
    currentQuestion: session.currentQuestion,
    lastSyncedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    revision: session.revision + 1,
  };
}

/* ------------------------------------------------------------------ */
/* Scoring (client-calculated — NEVER verified)                        */
/* ------------------------------------------------------------------ */

export interface JobAttemptAnswer {
  n: number;
  questionId: string;
  topicId: string;
  subjectId: string;
  selected: JobSessionAnswerSelection;
  correct: boolean;
  /** +marksPerQuestion if correct, −negativeMarking if wrong, 0 if
   * unanswered. */
  marks: number;
  correctText: string | null;
  timeSpentSeconds: number;
}

export interface JobWeakTopic {
  topicId: string;
  /** Wrong answers in this topic (unanswered do NOT count as
   * wrong — they are a different weakness). */
  wrong: number;
  total: number;
}

/** The scoring result. The field `clientCalculatedScore` IS the
 * score — its name is the honesty mechanism (Step 3 §4.4): this
 * number was computed in the browser from a receipt-gated key and
 * is NEVER a verified score. `percentage` keeps the REAL number
 * (it may be negative under negative marking — the UI clamps the
 * DISPLAY at 0, never the stored value). `accuracy` divides by
 * ANSWERED questions only (unanswered are not "wrong answers"). */
export interface JobAttemptResult {
  score: number;
  clientCalculatedScore: number;
  totalMarks: number;
  negativeDeduction: number;
  /** The penalty actually applied per wrong answer (0 for Bank —
   * disabled until verified). The rules enforce
   * negativeDeduction == wrongCount * negativeMarkingUsed. */
  negativeMarkingUsed: number;
  /** The scoring-config version the score was computed under
   * (pattern.scoringConfigVersion) — stored on the attempt doc. */
  markingSchemeVersion: string;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  /** 0–100: correct ÷ answered × 100 (0 when nothing answered). */
  accuracy: number;
  /** score ÷ totalMarks × 100 — may be negative; stored as-is. */
  percentage: number;
  timeSpentSeconds: number;
  answers: JobAttemptAnswer[];
  wrongQuestionIds: string[];
  /** Sorted by wrong count desc (then total desc, then topicId asc
   * for a deterministic order). */
  weakTopics: JobWeakTopic[];
}

export interface ScorePracticeAttemptInput {
  bundle: JobQuestionBundle;
  /** The answer key. NULL IS AN ERROR — practice needs the key for
   * immediate feedback; a missing key must never be guessed around
   * (throw, do not score). */
  key: JobQuestionKey | null;
  answers: Array<{
    n: number;
    questionId: string;
    selected: JobSessionAnswerSelection;
    /** Per-question time from the session (default 0 when the
     * caller does not track it). */
    timeSpentSeconds?: number;
  }>;
  pattern: JobExamPattern;
  startedAtMillis: number;
  submittedAtMillis: number;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Score a practice attempt against its key (pure). Rules: correct
 * × marksPerQuestion − wrong × negativeMarking; unanswered = 0.
 * Throws when the key is null, when the key does not match the
 * bundle (answer count or question IDs), when the bundle is empty,
 * or when an answer refers to a question outside the bundle. */
export function scorePracticeAttempt(
  input: ScorePracticeAttemptInput,
): JobAttemptResult {
  const { bundle, key, pattern } = input;
  if (key === null) {
    throw new Error(
      'scorePracticeAttempt: key is null — practice needs the answer key for immediate feedback; refusing to guess',
    );
  }
  if (bundle.questions.length === 0) {
    throw new Error('scorePracticeAttempt: bundle has no questions');
  }
  if (key.answers.length !== bundle.questions.length) {
    throw new Error(
      `scorePracticeAttempt: key answers (${key.answers.length}) != bundle questions (${bundle.questions.length})`,
    );
  }
  const keyByN = new Map(key.answers.map((a) => [a.n, a]));
  const givenByN = new Map(input.answers.map((a) => [a.n, a]));
  for (const given of input.answers) {
    if (!bundle.questions.some((q) => q.n === given.n && q.questionId === given.questionId)) {
      throw new Error(
        `scorePracticeAttempt: answer n=${given.n} (${given.questionId}) is not in the bundle`,
      );
    }
  }

  const answers: JobAttemptAnswer[] = [];
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  const wrongQuestionIds: string[] = [];

  for (const q of bundle.questions) {
    const keyAnswer = keyByN.get(q.n);
    if (!keyAnswer || keyAnswer.questionId !== q.questionId) {
      throw new Error(
        `scorePracticeAttempt: key has no matching answer for bundle question n=${q.n} (${q.questionId})`,
      );
    }
    const given = givenByN.get(q.n);
    const selected = given?.selected ?? null;
    if (selected !== null && !['A', 'B', 'C', 'D'].includes(selected)) {
      throw new Error(`scorePracticeAttempt: selected '${String(selected)}' is not A/B/C/D/null`);
    }
    const answered = selected !== null;
    const correct = answered && selected === keyAnswer.correctLetter;
    const marks = !answered
      ? 0
      : correct
        ? pattern.marksPerQuestion
        : -pattern.negativeMarking;
    if (correct) correctCount += 1;
    else if (answered) {
      wrongCount += 1;
      wrongQuestionIds.push(q.questionId);
    } else unansweredCount += 1;
    answers.push({
      n: q.n,
      questionId: q.questionId,
      topicId: q.topicId,
      subjectId: q.subjectId,
      selected,
      correct,
      marks,
      correctText: keyAnswer.correctText,
      timeSpentSeconds: given?.timeSpentSeconds ?? 0,
    });
  }

  const negativeDeduction = round2(wrongCount * pattern.negativeMarking);
  const score = round2(correctCount * pattern.marksPerQuestion - negativeDeduction);
  const totalMarks = bundle.questions.length * pattern.marksPerQuestion;
  const answeredCount = correctCount + wrongCount;
  const accuracy = answeredCount === 0 ? 0 : round2((correctCount / answeredCount) * 100);
  const percentage = round2((score / totalMarks) * 100);
  const timeSpentSeconds = Math.max(
    0,
    Math.round((input.submittedAtMillis - input.startedAtMillis) / 1000),
  );
  const weakTopics = weakTopicsFromAttemptAnswers(answers);

  return {
    score,
    clientCalculatedScore: score,
    totalMarks,
    negativeDeduction,
    negativeMarkingUsed: pattern.negativeMarking,
    markingSchemeVersion: pattern.scoringConfigVersion,
    correctCount,
    wrongCount,
    unansweredCount,
    accuracy,
    percentage,
    timeSpentSeconds,
    answers,
    wrongQuestionIds,
    weakTopics,
  };
}

/** Weak-topic analysis from scored answers (shared by the
 * scorer and by the result rebuild from a stored attempt):
 * per topic, wrong answers (unanswered do NOT count as wrong)
 * over total questions; sorted by wrong desc, then total desc,
 * then topicId asc (deterministic). */
export function weakTopicsFromAttemptAnswers(answers: JobAttemptAnswer[]): JobWeakTopic[] {
  const stats = new Map<string, { wrong: number; total: number }>();
  for (const a of answers) {
    const stat = stats.get(a.topicId) ?? { wrong: 0, total: 0 };
    stat.total += 1;
    if (a.selected !== null && !a.correct) stat.wrong += 1;
    stats.set(a.topicId, stat);
  }
  return [...stats.entries()]
    .map(([topicId, s]) => ({ topicId, wrong: s.wrong, total: s.total }))
    .sort((a, b) => b.wrong - a.wrong || b.total - a.total || (a.topicId < b.topicId ? -1 : 1));
}

/** Human-readable label for a job topic ID (Step 9 closure, D7).
 * Topic IDs are segmented keys (`{exam}__{subject}__{chapter}__{leaf}`,
 * e.g. `bcs__english__grammar__tense`) — rendering one verbatim on a
 * result page is a raw slug, not a label. The subject, chapter and
 * leaf are humanized (`right-form-of-verbs` → `Right Form of Verbs`)
 * and joined so two exams' same-named topics stay distinct in
 * context. There is no jobTopics name source to read instead (Step 6
 * seeded 0 topic docs — only 23 draft subjects); when
 * Moderator-built topic docs with Bangla names exist, this should
 * read them. Malformed IDs fall back to the humanized last segment,
 * never to the raw slug; an empty ID is labelled unknown. */
export function jobTopicLabelBn(topicId: string): string {
  const humanize = (s: string): string =>
    s
      .split('-')
      .filter((w) => w.length > 0)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  const parts = topicId
    .split('__')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length >= 4) return `${humanize(parts[1])} — ${humanize(parts[2])} — ${humanize(parts[3])}`;
  if (parts.length === 3) return `${humanize(parts[1])} — ${humanize(parts[2])}`;
  if (parts.length === 2) return humanize(parts[1]);
  if (parts.length === 1) return humanize(parts[0]);
  return 'অজানা টপিক';
}

export interface ScoreMockAttemptInput {
  bundle: JobQuestionBundle;
  /** The answer key — read through the session-anchored receipt
   * (Design G). NULL IS AN ERROR, exactly like practice: a mock
   * is never scored by guessing. */
  key: JobQuestionKey | null;
  answers: Array<{
    n: number;
    questionId: string;
    selected: JobSessionAnswerSelection;
    timeSpentSeconds?: number;
  }>;
  /** The mock's rulesSnapshot — the AUTHORITY for this mock's
   * pattern (never the live rulesConfig). */
  rulesSnapshot: {
    questionCount: number;
    timeMinutes: number;
    marksPerQuestion: number;
    negativeMarking: number | null;
    negativeMarkingVerified: boolean;
    passPercent: number | null;
    scoringConfigVersion: string;
  };
  examSlug: string;
  startedAtMillis: number;
  submittedAtMillis: number;
}

/** Score a mock attempt (Step 9): the pattern comes from the
 * mock's rulesSnapshot via patternFromRulesSnapshot, then the
 * scoring is exactly scorePracticeAttempt (same marks, same
 * negative marking, same weak-topic analysis). The snapshot —
 * not the live config — is what the attempt records as its
 * markingSchemeVersion, so a later config change can never
 * silently re-score an old mock. Throws when the key is null
 * or the snapshot is not a complete pattern. */
export function scoreMockAttempt(input: ScoreMockAttemptInput): JobAttemptResult {
  const pattern = patternFromRulesSnapshot(input.examSlug, input.rulesSnapshot);
  // Step 9 closure (open question 3 — timeSpentSeconds bound):
  // per-answer time is analytics only — the TOTAL comes from the
  // wall clock (submittedAt − startedAt) and time never changes the
  // score — but an inflated per-answer value would poison time
  // analytics. A mock is deadline-bounded, so one question can never
  // honestly take longer than the whole mock (+60s skew grace):
  // clamp, never throw — a clamp can never block a submit. (Practice
  // has no deadline, so no clamp applies there; the rules keep ≥ 0
  // only, which is the documented residual limit.)
  const maxPerAnswer = input.rulesSnapshot.timeMinutes * 60 + 60;
  const answers = input.answers.map((a) => ({
    ...a,
    timeSpentSeconds: Math.min(Math.max(0, a.timeSpentSeconds ?? 0), maxPerAnswer),
  }));
  return scorePracticeAttempt({
    bundle: input.bundle,
    key: input.key,
    answers,
    pattern,
    startedAtMillis: input.startedAtMillis,
    submittedAtMillis: input.submittedAtMillis,
  });
}

/* ------------------------------------------------------------------ */
/* Attempt doc (Step 3 §2.11 — users/{uid}/jobAttempts/{sessionId})   */
/* ------------------------------------------------------------------ */

/**
 * Build the jobAttempts doc for a submitted practice or mock
 * attempt.
 *
 * Step 3 §2.11 field table (pasted verbatim — this function must
 * match it; any deviation is listed below the table):
 *
 * | ফিল্ড | ধরন | আবশ্যিক | নোট |
 * | `kind` | string | হ্যাঁ | `'practice'` (টপিকভিত্তিক, টাইমার ছাড়া) \| `'mock'` — অনুশীলন ও মকের ফলাফল আলাদা রাখা হয় এই ফিল্ড দিয়ে |
 * | `mockId` | string \| null | — | `kind: 'mock'` হলে আবশ্যিক; অনুশীলনে `null` |
 * | `bundleId` | string | হ্যাঁ | কোন বান্ডেলের প্রশ্নে দেওয়া হয়েছে |
 * | `examSlug` | string | হ্যাঁ | কোন পরীক্ষার |
 * | `subjectId`, `topicId` | string \| null | — | অনুশীলনের পরিসর (টপিক/বিষয়); মকে `null` হতে পারে |
 * | `answers` | array | হ্যাঁ | `[{n, questionId, topicId, subjectId, selected: 'A' \| 'B' \| 'C' \| 'D' \| null, correct: boolean, marks: number, correctText: string \| null, timeSpentSeconds: number}]` — প্রতি উত্তরে `topic` + `correct` বাধ্যতামূলক; `correctText` সংরক্ষণ করা হয় যাতে ফলাফল-পাতা কি আর পড়তে না হয় |
 * | `score` | number | হ্যাঁ | মোট নম্বর = (সঠিক × প্রতি প্রশ্নের নম্বর) − (ভুল × নেগেটিভ মার্কিং); উত্তর দেওয়া হয়নি = ০ |
 * | `totalMarks` | number | হ্যাঁ | পূর্ণ নম্বর |
 * | `negativeDeduction` | number | হ্যাঁ | নেগেটিভ মার্কিংয়ে মোট কত কাটা গেছে |
 * | `correctCount`, `wrongCount`, `unansweredCount` | number | হ্যাঁ | সঠিক/ভুল/অনুত্তরিত সংখ্যা |
 * | `accuracy` | number | হ্যাঁ | নির্ভুলতা = সঠিক ÷ উত্তর দেওয়া প্রশ্ন (০–১০০, শতাংশ) |
 * | `percentage` | number | হ্যাঁ | `score ÷ totalMarks × 100` (ঋণাত্মক হতে পারে — আসল সংখ্যাই সংরক্ষণ) |
 * | `timeSpentSeconds` | number | হ্যাঁ | মোট ব্যয়িত সময় |
 * | `startedAt`, `submittedAt` | timestamp | হ্যাঁ | `submittedAt` = `serverTimestamp()` |
 * | `status` | string | হ্যাঁ | `'submitted'` (একমাত্র মান — জমা হওয়া attempt-ই থাকে) |
 * | `markingStatus` | string | হ্যাঁ | `'auto'` (MCQ — স্বয়ংক্রিয় হিসাব) |
 * | `resultLabel` | string | হ্যাঁ | `'practice'` — UI-তে সব ফলাফলে লেবেল: "অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়"; কখনো `'verified'` নয় |
 * | `clientCalculatedScore` | number | হ্যাঁ | `score`-এর সৎ নাম — ক্লায়েন্টে হিসাব করা নম্বর; `score` ক্ষেত্রটি একই মান বহন করে |
 * | `serverVerifiedScore` | number \| null | না | এই রিলিজে অনুপস্থিত — সার্ভার-যাচাই নেই; ছাত্র কখনো লিখতে পারে না |
 * | `trustLevel` | string | হ্যাঁ | `'unverified'` (এই রিলিজে সবসময়) |
 * | `resultType` | string | হ্যাঁ | `'practice'` \| `'verified'` — এই রিলিজে সবসময় `'practice'` |
 * | `audit` | map \| null | না | প্রস্তাব: `{userAgent, ipHash}` — IP কখনো সরাসরি নয়, হ্যাশ মাত্র |
 * | `answerHashes` | array \| null | না | প্রস্তাব: প্রতি উত্তরে SHA-256 — যাচাই নয়, অডিট-মাত্র |
 * | `anomalyFlags` | string[] \| null | না | প্রস্তাব (AQ-13): `['too-fast']` / `['too-fast-per-question']` — Admin-পর্যালোচনার চিহ্ন মাত্র; নম্বর বদলায় না |
 * | `sessionId` | string | হ্যাঁ | সেশন-ID (= ডক-ID) |
 *
 * DEVIATIONS from the table (all deliberate, all recorded):
 *   (a) `userId` is ADDED (not in the §2.11 table): Step 7's receipt
 *       gate requires the attempt to carry `userId == uid()` (the
 *       receipt anchor reads `attempt.userId`), and the Step 7 rules
 *       require it on create. The UI MUST pass the signed-in uid;
 *       without it the doc fails validation and the rules reject it.
 *   (b) `audit` is null and `answerHashes` is null: the audit
 *       fields need a user-agent/IP-hash and a salt design that do
 *       not exist in Step 8 scope — inventing them here would be
 *       fake audit data. A later step may fill them; null is the
 *       honest value today.
 *   (c) `anomalyFlags` is COMPUTED here (not null): the AQ-13 flags
 *       from the result's counts + time (audit-only, never change
 *       the score).
 *   (d) `startedAt` is copied from the session (the session's
 *       `serverTimestamp()` sentinel, resolved by Firestore at
 *       write); `submittedAt` is a fresh `serverTimestamp()`.
 *   (e) `negativeMarkingUsed`, `markingSchemeVersion` and
 *       `bundleVersion` are ADDED (Step 8 fold-in, findings 2/5/9):
 *       the attempt records the penalty actually applied, the
 *       scoring-config version it was scored under, and the exact
 *       bundle generation — so a later config change can never
 *       silently reinterpret an old result, and the rules can bind
 *       the deduction to the declared marking scheme.
 *   (f) Step 9 (mock): `kind` may be 'mock' with `mockId` the bare
 *       mock key (never null for a mock; null for practice) and
 *       `subjectId`/`topicId` null (a mock covers the whole exam).
 *       The attempt is scored from the mock's rulesSnapshot
 *       pattern, never the live config.
 *   (g) Step 9 fold-in (ChatGPT H.3): `submissionIntegrity` is
 *       ALWAYS `'client_calculated'` (both kinds) — immutable does
 *       not mean truthful; the attempt says so explicitly. The
 *       practice validator requires it too (added by the same
 *       fold-in) — a doc without it is denied by the rules.
 *   (h) Step 9 (mock, H.2): a mock attempt carries
 *       `questionSetId` (the manifest version it ran); a practice
 *       attempt carries NO `questionSetId` field at all (the
 *       practice validator's hasOnly list excludes it).
 *
 * RULES NOTE: the Step 8 rules draft (rules agent's uncommitted
 * working copy, checked 22 Nov) replaces the Step 7 minimal
 * anchor with this full doc — the 30 keys above match its
 * `hasOnly` list exactly, and its bounds hold for every score
 * this engine produces. The committed rules are still the Step 7
 * anchor until the rules agent commits; do not write this doc
 * against the committed rules.
 */
export function buildJobAttemptDoc(input: {
  sessionId: string;
  session: JobPracticeSessionDoc | JobMockSessionDoc;
  result: JobAttemptResult;
  bundleId: string;
  examSlug: string;
  subjectId: string | null;
  topicId: string | null;
  kind: 'practice' | 'mock';
  /** Bare mock key for kind 'mock' (daily: YYYY-MM-DD; weekly:
   * YYYY-Www; full: full__{examSlug}__{n}); null for practice. */
  mockId?: string | null;
  /** The question-set manifest version the mock ran
   * (jobQuestionSetManifests doc-ID) — REQUIRED for kind 'mock',
   * FORBIDDEN for kind 'practice' (the practice validator's
   * hasOnly list has no such field). */
  questionSetId?: string | null;
  /** The bundle's version (Step 8 fold-in, finding 5): the attempt
   * is bound to the exact bundle generation it was scored against
   * (rules: attempt.bundleVersion == bundle.bundleVersion). */
  bundleVersion: number;
  /** Signed-in uid — REQUIRED in practice (see deviation (a)
   * above); optional in the type only so unit tests can build a
   * doc without a user. Never omit it in production code. */
  userId?: string;
}): Record<string, unknown> {
  if (input.kind === 'mock' && !input.questionSetId) {
    throw new Error('buildJobAttemptDoc: a mock attempt needs questionSetId (the manifest version it ran)');
  }
  if (input.kind === 'practice' && input.questionSetId) {
    throw new Error('buildJobAttemptDoc: a practice attempt must not carry questionSetId');
  }
  const doc: Record<string, unknown> = {
    kind: input.kind,
    mockId: input.mockId ?? null,
    bundleId: input.bundleId,
    examSlug: input.examSlug,
    subjectId: input.subjectId,
    topicId: input.topicId,
    answers: input.result.answers,
    score: input.result.score,
    totalMarks: input.result.totalMarks,
    negativeDeduction: input.result.negativeDeduction,
    negativeMarkingUsed: input.result.negativeMarkingUsed,
    markingSchemeVersion: input.result.markingSchemeVersion,
    bundleVersion: input.bundleVersion,
    correctCount: input.result.correctCount,
    wrongCount: input.result.wrongCount,
    unansweredCount: input.result.unansweredCount,
    accuracy: input.result.accuracy,
    percentage: input.result.percentage,
    timeSpentSeconds: input.result.timeSpentSeconds,
    startedAt: input.session.startedAt,
    submittedAt: serverTimestamp(),
    status: 'submitted',
    markingStatus: 'auto',
    resultLabel: 'practice',
    clientCalculatedScore: input.result.clientCalculatedScore,
    serverVerifiedScore: null,
    trustLevel: 'unverified',
    resultType: 'practice',
    audit: null,
    answerHashes: null,
    anomalyFlags: anomalyFlags({
      correctCount: input.result.correctCount,
      totalQuestions: input.result.answers.length,
      timeSpentSeconds: input.result.timeSpentSeconds,
    }),
    sessionId: input.sessionId,
    userId: input.userId ?? null,
    // Step 9 fold-in (H.3): the score is client-calculated and
    // the attempt says so explicitly — both kinds.
    submissionIntegrity: 'client_calculated',
  };
  // Step 9 (H.2): mock attempts carry the manifest version;
  // practice attempts carry no such field at all.
  if (input.kind === 'mock') {
    doc.questionSetId = input.questionSetId;
  }
  return doc;
}

/** Rebuild a JobAttemptResult from a STORED attempt doc (the
 * shape buildJobAttemptDoc produces). Used by the mock submit's
 * idempotent recovery (the attempt already exists — return the
 * STORED result, never a freshly computed one that could come
 * from a republished bundle) and by the result page. weakTopics
 * and wrongQuestionIds are NOT stored on the attempt — they are
 * re-derived from the stored answers (same derivation as the
 * scorer). Returns null when the doc is malformed (missing or
 * mistyped result fields, or answers that fail validation) —
 * the caller shows the honest error instead of a guessed
 * result. */
export function jobAttemptResultFromStoredDoc(doc: unknown): JobAttemptResult | null {
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) return null;
  const d = doc as Record<string, unknown>;
  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;
  const score = num(d.score);
  const totalMarks = num(d.totalMarks);
  const negativeDeduction = num(d.negativeDeduction);
  const negativeMarkingUsed = num(d.negativeMarkingUsed);
  const correctCount = num(d.correctCount);
  const wrongCount = num(d.wrongCount);
  const unansweredCount = num(d.unansweredCount);
  const accuracy = num(d.accuracy);
  const percentage = num(d.percentage);
  const timeSpentSeconds = num(d.timeSpentSeconds);
  if (
    score === null || totalMarks === null || negativeDeduction === null
    || negativeMarkingUsed === null || correctCount === null || wrongCount === null
    || unansweredCount === null || accuracy === null || percentage === null
    || timeSpentSeconds === null
    || typeof d.markingSchemeVersion !== 'string'
    || !Array.isArray(d.answers) || d.answers.length === 0
  ) {
    return null;
  }
  const answers = d.answers as JobAttemptAnswer[];
  // The stored answers must be well-formed — reuse the attempt
  // validator's per-answer checks by validating a rebuilt doc
  // shape (validateAttemptResult needs the full doc; here the
  // cheap structural check is enough — malformed answers fail
  // the counts check below or the field checks).
  for (const a of answers) {
    if (
      typeof a !== 'object' || a === null
      || !Number.isInteger(a.n)
      || typeof a.questionId !== 'string'
      || typeof a.topicId !== 'string'
      || typeof a.subjectId !== 'string'
      || (a.selected !== null && !['A', 'B', 'C', 'D'].includes(a.selected))
      || typeof a.correct !== 'boolean'
      || typeof a.marks !== 'number' || !Number.isFinite(a.marks)
      || (a.correctText !== null && typeof a.correctText !== 'string')
      || typeof a.timeSpentSeconds !== 'number' || !Number.isFinite(a.timeSpentSeconds)
    ) {
      return null;
    }
  }
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  const wrongQuestionIds: string[] = [];
  for (const a of answers) {
    if (a.selected === null) unanswered += 1;
    else if (a.correct) correct += 1;
    else {
      wrong += 1;
      wrongQuestionIds.push(a.questionId);
    }
  }
  if (correct !== correctCount || wrong !== wrongCount || unanswered !== unansweredCount) {
    return null;
  }
  return {
    score,
    clientCalculatedScore: score,
    totalMarks,
    negativeDeduction,
    negativeMarkingUsed,
    markingSchemeVersion: d.markingSchemeVersion,
    correctCount,
    wrongCount,
    unansweredCount,
    accuracy,
    percentage,
    timeSpentSeconds,
    answers,
    wrongQuestionIds,
    weakTopics: weakTopicsFromAttemptAnswers(answers),
  };
}

/* ------------------------------------------------------------------ */
/* Timer (engine-level — for MOCK in Step 9; practice is untimed)     */
/* ------------------------------------------------------------------ */

/** Default warning threshold: last 5 minutes (Step 2 §2.6 — amber).
 * Configurable per exam via `timerWarning` options; never hardcoded
 * in the UI. */
export const JOB_TIMER_WARNING_MILLIS = 5 * 60 * 1000;
/** Default critical threshold: last 1 minute (Step 2 §2.6 — red). */
export const JOB_TIMER_CRITICAL_MILLIS = 60 * 1000;

export type JobTimerWarning =
  | 'untimed'
  | 'ok'
  | 'warning'
  | 'critical'
  | 'expired';

/** Milliseconds left until `endsAtMillis` (server time). Returns
 * null when untimed (`endsAtMillis` null — always the case for
 * practice). The raw difference is returned (negative when expired
 * — `timerWarning` maps ≤0 to 'expired'; callers must not clamp
 * it to 0, or the expired state is lost). */
export function remainingMillis(
  endsAtMillis: number | null,
  nowMillis: number,
): number | null {
  if (endsAtMillis === null) return null;
  return endsAtMillis - nowMillis;
}

/** Timer state from the remaining time. Thresholds are configurable
 * via options (Step 2 §2.6: defaults 5 min warning / 1 min
 * critical — per-exam configurable, never hardcoded in the UI). */
export function timerWarning(
  remaining: number | null,
  options?: { warningMillis?: number; criticalMillis?: number },
): JobTimerWarning {
  if (remaining === null) return 'untimed';
  const warningMillis = options?.warningMillis ?? JOB_TIMER_WARNING_MILLIS;
  const criticalMillis = options?.criticalMillis ?? JOB_TIMER_CRITICAL_MILLIS;
  if (remaining <= 0) return 'expired';
  if (remaining <= criticalMillis) return 'critical';
  if (remaining <= warningMillis) return 'warning';
  return 'ok';
}

/* ------------------------------------------------------------------ */
/* Anomaly flags (AQ-13 — audit-only, NEVER change the score)         */
/* ------------------------------------------------------------------ */

/** Audit-only flags for Admin review (Step 3 §2.11 / AQ-13). Both
 * flags can apply at once. Returns [] for ordinary attempts.
 * 'too-fast': 100% correct in under 2 minutes.
 * 'too-fast-per-question': under 10 seconds per question on
 * average. These NEVER change the score — they only mark the
 * attempt for a human to look at. */
export function anomalyFlags(input: {
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
}): string[] {
  const flags: string[] = [];
  const { correctCount, totalQuestions, timeSpentSeconds } = input;
  if (totalQuestions <= 0) return flags;
  if (correctCount === totalQuestions && timeSpentSeconds < 120) {
    flags.push('too-fast');
  }
  if (timeSpentSeconds / totalQuestions < 10) {
    flags.push('too-fast-per-question');
  }
  return flags;
}

/* ------------------------------------------------------------------ */
/* Question ordering (practice modes)                                  */
/* ------------------------------------------------------------------ */

/** Order questions for a practice mode (pure, stable within equal
 * difficulty — the input order is preserved inside each band).
 * Beginner: Easy → Medium (Hard last). Advanced: Medium → Hard
 * (Easy last). The bundle order itself is never mutated. */
export function orderQuestionsForMode<
  T extends { difficulty: JobQuestionDifficulty },
>(questions: readonly T[], mode: 'beginner' | 'advanced'): T[] {
  const rank =
    mode === 'beginner'
      ? { easy: 0, medium: 1, hard: 2 }
      : { medium: 0, hard: 1, easy: 2 };
  return questions
    .map((q, i) => ({ q, i }))
    .sort((a, b) => rank[a.q.difficulty] - rank[b.q.difficulty] || a.i - b.i)
    .map(({ q }) => q);
}

/* ------------------------------------------------------------------ */
/* Validation (mirrors the rules — lib-side, UI fails fast)           */
/* ------------------------------------------------------------------ */

function isNonEmptyString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}

function isOptString(v: unknown, max: number): boolean {
  return v === null || (typeof v === 'string' && v.length <= max);
}

/** A Firestore timestamp value as the lib sees it: a
 * `serverTimestamp()` sentinel (plain object) at build time, a real
 * Timestamp/Date after read-back. Strings and numbers are NOT
 * timestamps. */
function isTimestampLike(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (v instanceof Date) return true;
  return typeof v === 'object';
}

const JOB_PRACTICE_SESSION_KEYS = [
  'kind',
  'mockId',
  'bundleId',
  'examSlug',
  'status',
  'startedAt',
  'endsAt',
  'questionRefs',
  'answers',
  'currentQuestion',
  'lastSyncedAt',
  'clientEndsAtMillis',
  'submittedAt',
  'createdAt',
  'updatedAt',
  'revision',
] as const;

/** Validate a practice session doc. Returns problem strings; empty
 * = valid. Mirrors the Step 3 §2.12 shape + the Step 2 rules
 * (practice is untimed — `endsAt`/`clientEndsAtMillis` must be
 * null; `mockId` must be null). */
export function validatePracticeSession(doc: unknown): string[] {
  const problems: string[] = [];
  const label = 'jobSessions(practice)';
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    return [`${label}: doc must be an object`];
  }
  const d = doc as Record<string, unknown>;
  for (const k of Object.keys(d)) {
    if (!(JOB_PRACTICE_SESSION_KEYS as readonly string[]).includes(k)) {
      problems.push(`${label}: unknown field '${k}'`);
    }
  }
  if (d.kind !== 'practice') problems.push(`${label}: kind must be 'practice'`);
  if (d.mockId !== null) problems.push(`${label}: mockId must be null for practice`);
  // Step 8 fold-in (finding 6): the monotonic write counter — 1 at
  // create, +1 per write. The validator checks the shape only;
  // staleness (stored revision vs patch revision) is a rules check.
  if (!Number.isInteger(d.revision) || (d.revision as number) < 1) {
    problems.push(`${label}: revision must be an integer ≥1`);
  }
  if (!isNonEmptyString(d.bundleId, 200)) {
    problems.push(`${label}: bundleId must be a non-empty string ≤200 chars`);
  }
  if (!isNonEmptyString(d.examSlug, 100)) {
    problems.push(`${label}: examSlug must be a non-empty string ≤100 chars`);
  }
  if (!['in-progress', 'submitted', 'abandoned'].includes(String(d.status))) {
    problems.push(`${label}: status must be in-progress/submitted/abandoned`);
  }
  for (const f of ['startedAt', 'createdAt', 'updatedAt', 'lastSyncedAt']) {
    if (!isTimestampLike(d[f])) problems.push(`${label}: ${f} must be a timestamp`);
  }
  // Practice is untimed — a real endsAt here would mean a timed
  // session smuggled into the practice shape.
  if (d.endsAt !== null) problems.push(`${label}: endsAt must be null for practice (untimed)`);
  if (d.clientEndsAtMillis !== null) {
    problems.push(`${label}: clientEndsAtMillis must be null for practice (untimed)`);
  }
  if (d.status === 'submitted') {
    if (!isTimestampLike(d.submittedAt)) {
      problems.push(`${label}: submittedAt must be a timestamp when status is submitted`);
    }
  } else if (d.submittedAt !== null) {
    problems.push(`${label}: submittedAt must be null unless status is submitted`);
  }
  if (!Array.isArray(d.questionRefs) || d.questionRefs.length === 0) {
    problems.push(`${label}: questionRefs must be a non-empty list`);
    return problems;
  }
  const ns: number[] = [];
  d.questionRefs.forEach((r, i) => {
    const ref = r as Record<string, unknown>;
    if (typeof ref !== 'object' || ref === null
      || !isNonEmptyString(ref.bundleId, 200)
      || !Number.isInteger(ref.n) || (ref.n as number) < 1
      || !isNonEmptyString(ref.questionId, 200)) {
      problems.push(`${label}: questionRefs[${i}] is malformed (bundleId/n/questionId required)`);
    } else {
      ns.push(ref.n as number);
    }
  });
  const sorted = [...ns].sort((a, b) => a - b);
  if (sorted.join(',') !== Array.from({ length: ns.length }, (_, i) => i + 1).join(',')) {
    problems.push(`${label}: questionRefs n values must be exactly 1..${ns.length}`);
  }
  if (!Number.isInteger(d.currentQuestion)
    || (d.currentQuestion as number) < 1
    || (d.currentQuestion as number) > d.questionRefs.length) {
    problems.push(`${label}: currentQuestion must be 1..${d.questionRefs.length}`);
  }
  if (typeof d.answers !== 'object' || d.answers === null || Array.isArray(d.answers)) {
    problems.push(`${label}: answers must be a map`);
    return problems;
  }
  const answers = d.answers as Record<string, unknown>;
  const answerKeys = Object.keys(answers).map(Number).sort((a, b) => a - b);
  if (answerKeys.join(',') !== sorted.join(',')) {
    problems.push(`${label}: answers keys must match questionRefs n values exactly`);
  }
  for (const [k, v] of Object.entries(answers)) {
    const a = v as Record<string, unknown>;
    if (typeof a !== 'object' || a === null) {
      problems.push(`${label}: answers[${k}] must be an object`);
      continue;
    }
    if (a.selected !== null && !['A', 'B', 'C', 'D'].includes(String(a.selected))) {
      problems.push(`${label}: answers[${k}].selected must be A/B/C/D or null`);
    }
    if (typeof a.markedForReview !== 'boolean') {
      problems.push(`${label}: answers[${k}].markedForReview must be a boolean`);
    }
    if (typeof a.timeSpentSeconds !== 'number' || !Number.isFinite(a.timeSpentSeconds) || a.timeSpentSeconds < 0) {
      problems.push(`${label}: answers[${k}].timeSpentSeconds must be a number ≥0`);
    }
  }
  return problems;
}

const JOB_MOCK_SESSION_KEYS = [
  'kind',
  'mockId',
  'bundleId',
  'examSlug',
  'definitionId',
  'questionSetId',
  'bundleVersion',
  'status',
  'startedAt',
  'endsAt',
  'questionRefs',
  'answers',
  'currentQuestion',
  'lastSyncedAt',
  'clientEndsAtMillis',
  'submittedAt',
  'createdAt',
  'updatedAt',
  'revision',
] as const;

/** Validate a mock session doc. Returns problem strings; empty =
 * valid. Mirrors the Step 3 §2.12 shape + the Step 8 rules
 * (kind 'mock', mockId the bare key, endsAt null-or-timestamp —
 * set ONCE after read-back, never reset — clientEndsAtMillis a
 * number-or-null). The deadline itself is checked by
 * mockDeadlineMillis / isMockExpired, not here: a session whose
 * endsAt is still null is VALID (the read-back has not landed
 * yet) and runs on clientEndsAtMillis. */
export function validateMockSession(doc: unknown): string[] {
  const problems: string[] = [];
  const label = 'jobExamSessions(mock)';
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    return [`${label}: doc must be an object`];
  }
  const d = doc as Record<string, unknown>;
  for (const k of Object.keys(d)) {
    if (!(JOB_MOCK_SESSION_KEYS as readonly string[]).includes(k)) {
      problems.push(`${label}: unknown field '${k}'`);
    }
  }
  if (d.kind !== 'mock') problems.push(`${label}: kind must be 'mock'`);
  if (!isNonEmptyString(d.mockId, 200)) {
    problems.push(`${label}: mockId must be a non-empty string ≤200 chars`);
  }
  if (!Number.isInteger(d.revision) || (d.revision as number) < 1) {
    problems.push(`${label}: revision must be an integer ≥1`);
  }
  if (!isNonEmptyString(d.bundleId, 200)) {
    problems.push(`${label}: bundleId must be a non-empty string ≤200 chars`);
  }
  if (!isNonEmptyString(d.examSlug, 100)) {
    problems.push(`${label}: examSlug must be a non-empty string ≤100 chars`);
  }
  if (!isNonEmptyString(d.definitionId, 200)) {
    problems.push(`${label}: definitionId must be a non-empty string ≤200 chars`);
  }
  if (!isNonEmptyString(d.questionSetId, 200)) {
    problems.push(`${label}: questionSetId must be a non-empty string ≤200 chars`);
  }
  if (!Number.isInteger(d.bundleVersion) || (d.bundleVersion as number) < 1) {
    problems.push(`${label}: bundleVersion must be an integer ≥1`);
  }
  if (!['in-progress', 'submitted', 'abandoned'].includes(String(d.status))) {
    problems.push(`${label}: status must be in-progress/submitted/abandoned`);
  }
  for (const f of ['startedAt', 'createdAt', 'updatedAt', 'lastSyncedAt']) {
    if (!isTimestampLike(d[f])) problems.push(`${label}: ${f} must be a timestamp`);
  }
  // The stored deadline: null until the read-back sets it once,
  // then a timestamp forever (the rules freeze it — a second
  // write is denied, so a reset is impossible server-side too).
  if (d.endsAt !== null && !isTimestampLike(d.endsAt)) {
    problems.push(`${label}: endsAt must be null or a timestamp`);
  }
  if (d.clientEndsAtMillis !== null
    && (typeof d.clientEndsAtMillis !== 'number' || !Number.isFinite(d.clientEndsAtMillis))) {
    problems.push(`${label}: clientEndsAtMillis must be null or a finite number`);
  }
  if (d.status === 'submitted') {
    if (!isTimestampLike(d.submittedAt)) {
      problems.push(`${label}: submittedAt must be a timestamp when status is submitted`);
    }
  } else if (d.submittedAt !== null) {
    problems.push(`${label}: submittedAt must be null unless status is submitted`);
  }
  if (!Array.isArray(d.questionRefs) || d.questionRefs.length === 0) {
    problems.push(`${label}: questionRefs must be a non-empty list`);
    return problems;
  }
  const ns: number[] = [];
  d.questionRefs.forEach((r, i) => {
    const ref = r as Record<string, unknown>;
    if (typeof ref !== 'object' || ref === null
      || !isNonEmptyString(ref.bundleId, 200)
      || !Number.isInteger(ref.n) || (ref.n as number) < 1
      || !isNonEmptyString(ref.questionId, 200)) {
      problems.push(`${label}: questionRefs[${i}] is malformed (bundleId/n/questionId required)`);
    } else {
      ns.push(ref.n as number);
    }
  });
  const sorted = [...ns].sort((a, b) => a - b);
  if (sorted.join(',') !== Array.from({ length: ns.length }, (_, i) => i + 1).join(',')) {
    problems.push(`${label}: questionRefs n values must be exactly 1..${ns.length}`);
  }
  if (!Number.isInteger(d.currentQuestion)
    || (d.currentQuestion as number) < 1
    || (d.currentQuestion as number) > d.questionRefs.length) {
    problems.push(`${label}: currentQuestion must be 1..${d.questionRefs.length}`);
  }
  if (typeof d.answers !== 'object' || d.answers === null || Array.isArray(d.answers)) {
    problems.push(`${label}: answers must be a map`);
    return problems;
  }
  const answers = d.answers as Record<string, unknown>;
  const answerKeys = Object.keys(answers).map(Number).sort((a, b) => a - b);
  if (answerKeys.join(',') !== sorted.join(',')) {
    problems.push(`${label}: answers keys must match questionRefs n values exactly`);
  }
  for (const [k, v] of Object.entries(answers)) {
    const a = v as Record<string, unknown>;
    if (typeof a !== 'object' || a === null) {
      problems.push(`${label}: answers[${k}] must be an object`);
      continue;
    }
    if (a.selected !== null && !['A', 'B', 'C', 'D'].includes(String(a.selected))) {
      problems.push(`${label}: answers[${k}].selected must be A/B/C/D or null`);
    }
    if (typeof a.markedForReview !== 'boolean') {
      problems.push(`${label}: answers[${k}].markedForReview must be a boolean`);
    }
    if (typeof a.timeSpentSeconds !== 'number' || !Number.isFinite(a.timeSpentSeconds) || a.timeSpentSeconds < 0) {
      problems.push(`${label}: answers[${k}].timeSpentSeconds must be a number ≥0`);
    }
  }
  return problems;
}

const JOB_ATTEMPT_RESULT_KEYS = [
  'kind',
  'mockId',
  'bundleId',
  'examSlug',
  'subjectId',
  'topicId',
  'answers',
  'score',
  'totalMarks',
  'negativeDeduction',
  'negativeMarkingUsed',
  'markingSchemeVersion',
  'bundleVersion',
  'correctCount',
  'wrongCount',
  'unansweredCount',
  'accuracy',
  'percentage',
  'timeSpentSeconds',
  'startedAt',
  'submittedAt',
  'status',
  'markingStatus',
  'resultLabel',
  'clientCalculatedScore',
  'serverVerifiedScore',
  'trustLevel',
  'resultType',
  'audit',
  'answerHashes',
  'anomalyFlags',
  'sessionId',
  'userId',
  // Step 9 fold-in (H.3): every attempt declares its integrity
  // ('client_calculated'); mock attempts also carry the manifest
  // version they ran (questionSetId — forbidden on practice).
  'submissionIntegrity',
  'questionSetId',
] as const;

/** Validate a jobAttempts doc (the shape `buildJobAttemptDoc`
 * produces). Returns problem strings; empty = valid. Mirrors the
 * Step 3 §2.11 table + the Step 7 receipt-gate requirement that the
 * attempt carry `userId`. Forced values are checked exactly:
 * status 'submitted', markingStatus 'auto', resultLabel 'practice',
 * trustLevel 'unverified', resultType 'practice',
 * serverVerifiedScore null, clientCalculatedScore == score. */
export function validateAttemptResult(result: unknown): string[] {
  const problems: string[] = [];
  const label = 'jobAttempts';
  if (typeof result !== 'object' || result === null || Array.isArray(result)) {
    return [`${label}: result must be an object`];
  }
  const d = result as Record<string, unknown>;
  for (const k of Object.keys(d)) {
    if (!(JOB_ATTEMPT_RESULT_KEYS as readonly string[]).includes(k)) {
      problems.push(`${label}: unknown field '${k}'`);
    }
  }
  if (d.kind !== 'practice' && d.kind !== 'mock') {
    problems.push(`${label}: kind must be practice/mock`);
  }
  if (d.kind === 'practice' && d.mockId !== null) {
    problems.push(`${label}: mockId must be null for practice`);
  }
  if (d.kind === 'mock' && !isNonEmptyString(d.mockId, 200)) {
    problems.push(`${label}: mockId must be a non-empty string ≤200 chars for mock`);
  }
  // Step 9 fold-in (H.2/H.3): mock attempts carry the manifest
  // version (questionSetId, required); practice attempts carry
  // none. Every attempt declares submissionIntegrity ==
  // 'client_calculated' (immutable does not mean truthful).
  if (d.kind === 'mock' && !isNonEmptyString(d.questionSetId, 200)) {
    problems.push(`${label}: questionSetId must be a non-empty string ≤200 chars for mock`);
  }
  if (d.kind === 'practice' && d.questionSetId !== undefined) {
    problems.push(`${label}: questionSetId must be absent for practice`);
  }
  if (d.submissionIntegrity !== 'client_calculated') {
    problems.push(`${label}: submissionIntegrity must be 'client_calculated'`);
  }
  if (!isNonEmptyString(d.bundleId, 200)) {
    problems.push(`${label}: bundleId must be a non-empty string ≤200 chars`);
  }
  if (!isNonEmptyString(d.examSlug, 100)) {
    problems.push(`${label}: examSlug must be a non-empty string ≤100 chars`);
  }
  if (!isOptString(d.subjectId, 200)) {
    problems.push(`${label}: subjectId must be a string ≤200 or null`);
  }
  if (!isOptString(d.topicId, 200)) {
    problems.push(`${label}: topicId must be a string ≤200 or null`);
  }
  if (!isNonEmptyString(d.sessionId, 200)) {
    problems.push(`${label}: sessionId must be a non-empty string ≤200 chars`);
  }
  if (!isNonEmptyString(d.userId, 200)) {
    problems.push(`${label}: userId is required (Step 7 receipt gate: attempt.userId == uid())`);
  }
  if (d.status !== 'submitted') problems.push(`${label}: status must be 'submitted'`);
  if (d.markingStatus !== 'auto') problems.push(`${label}: markingStatus must be 'auto'`);
  if (d.resultLabel !== 'practice') problems.push(`${label}: resultLabel must be 'practice'`);
  if (d.trustLevel !== 'unverified') problems.push(`${label}: trustLevel must be 'unverified'`);
  if (d.resultType !== 'practice') problems.push(`${label}: resultType must be 'practice'`);
  if (d.serverVerifiedScore !== null) {
    problems.push(`${label}: serverVerifiedScore must be null (no server verification in this release)`);
  }
  if (typeof d.score !== 'number' || !Number.isFinite(d.score)) {
    problems.push(`${label}: score must be a finite number`);
  }
  if (d.clientCalculatedScore !== d.score) {
    problems.push(`${label}: clientCalculatedScore (${String(d.clientCalculatedScore)}) != score (${String(d.score)})`);
  }
  if (typeof d.totalMarks !== 'number' || !Number.isFinite(d.totalMarks) || d.totalMarks <= 0) {
    problems.push(`${label}: totalMarks must be a number > 0`);
  }
  if (typeof d.negativeDeduction !== 'number' || !Number.isFinite(d.negativeDeduction) || d.negativeDeduction < 0) {
    problems.push(`${label}: negativeDeduction must be a number ≥0`);
  }
  // Step 8 fold-in (findings 2/5/9): the deduction is tied to the
  // DECLARED marking scheme — a wrong answer deducts exactly the
  // penalty the attempt says was applied (0 for Bank, whose
  // penalty is unverified and disabled). markingSchemeVersion pins
  // the config generation; bundleVersion pins the bundle.
  if (d.negativeMarkingUsed !== 0 && d.negativeMarkingUsed !== 0.25 && d.negativeMarkingUsed !== 0.5) {
    problems.push(`${label}: negativeMarkingUsed must be 0, 0.25 or 0.5`);
  }
  if (!isNonEmptyString(d.markingSchemeVersion, 100)) {
    problems.push(`${label}: markingSchemeVersion must be a non-empty string ≤100 chars`);
  }
  if (!Number.isInteger(d.bundleVersion) || (d.bundleVersion as number) < 1) {
    problems.push(`${label}: bundleVersion must be an integer ≥1`);
  }
  for (const f of ['correctCount', 'wrongCount', 'unansweredCount']) {
    if (!Number.isInteger(d[f]) || (d[f] as number) < 0) {
      problems.push(`${label}: ${f} must be an integer ≥0`);
    }
  }
  if (typeof d.accuracy !== 'number' || !Number.isFinite(d.accuracy) || d.accuracy < 0 || d.accuracy > 100) {
    problems.push(`${label}: accuracy must be 0–100`);
  }
  // percentage may be NEGATIVE (negative marking) — stored as-is;
  // only the upper bound is checked (score can never exceed total).
  if (typeof d.percentage !== 'number' || !Number.isFinite(d.percentage) || d.percentage > 100) {
    problems.push(`${label}: percentage must be a finite number ≤100 (negative allowed)`);
  }
  if (typeof d.timeSpentSeconds !== 'number' || !Number.isFinite(d.timeSpentSeconds) || d.timeSpentSeconds < 0) {
    problems.push(`${label}: timeSpentSeconds must be a number ≥0`);
  }
  if (!isTimestampLike(d.startedAt)) problems.push(`${label}: startedAt must be a timestamp`);
  if (!isTimestampLike(d.submittedAt)) problems.push(`${label}: submittedAt must be a timestamp`);
  if (d.anomalyFlags !== null && !Array.isArray(d.anomalyFlags)) {
    problems.push(`${label}: anomalyFlags must be a list or null`);
  } else if (Array.isArray(d.anomalyFlags)) {
    for (const f of d.anomalyFlags) {
      if (f !== 'too-fast' && f !== 'too-fast-per-question') {
        problems.push(`${label}: anomalyFlags contains unknown flag '${String(f)}'`);
      }
    }
  }
  if (!Array.isArray(d.answers) || d.answers.length === 0) {
    problems.push(`${label}: answers must be a non-empty list`);
    return problems;
  }
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let marksSum = 0;
  d.answers.forEach((entry, i) => {
    const a = entry as Record<string, unknown>;
    if (typeof a !== 'object' || a === null
      || !Number.isInteger(a.n)
      || !isNonEmptyString(a.questionId, 200)
      || !isNonEmptyString(a.topicId, 200)
      || !isNonEmptyString(a.subjectId, 200)) {
      problems.push(`${label}: answers[${i}] is malformed (n/questionId/topicId/subjectId required)`);
      return;
    }
    if (a.selected !== null && !['A', 'B', 'C', 'D'].includes(String(a.selected))) {
      problems.push(`${label}: answers[${i}].selected must be A/B/C/D or null`);
    }
    if (typeof a.correct !== 'boolean') {
      problems.push(`${label}: answers[${i}].correct must be a boolean`);
    }
    if (typeof a.marks !== 'number' || !Number.isFinite(a.marks)) {
      problems.push(`${label}: answers[${i}].marks must be a finite number`);
    } else {
      marksSum += a.marks;
      if (a.selected === null && (a.correct !== false || a.marks !== 0)) {
        problems.push(`${label}: answers[${i}] unanswered must have correct=false and marks=0`);
      }
      // marksPerQuestion is always 1 in the four verified patterns,
      // so a correct answer is worth exactly 1; a wrong answer
      // deducts exactly the declared penalty (0 when negative
      // marking is disabled, e.g. Bank).
      if (a.selected !== null && a.correct === true && a.marks !== 1) {
        problems.push(`${label}: answers[${i}] correct must have marks == 1`);
      }
      if (a.selected !== null && a.correct === false && a.marks !== -(d.negativeMarkingUsed as number)) {
        problems.push(`${label}: answers[${i}] wrong must have marks == -negativeMarkingUsed`);
      }
    }
    if (a.correctText !== null && typeof a.correctText !== 'string') {
      problems.push(`${label}: answers[${i}].correctText must be a string or null`);
    }
    if (typeof a.timeSpentSeconds !== 'number' || !Number.isFinite(a.timeSpentSeconds) || a.timeSpentSeconds < 0) {
      problems.push(`${label}: answers[${i}].timeSpentSeconds must be a number ≥0`);
    }
    if (a.selected === null) unanswered += 1;
    else if (a.correct === true) correct += 1;
    else if (a.correct === false) wrong += 1;
  });
  if (d.correctCount !== correct) {
    problems.push(`${label}: correctCount (${String(d.correctCount)}) != answers correct (${correct})`);
  }
  if (d.wrongCount !== wrong) {
    problems.push(`${label}: wrongCount (${String(d.wrongCount)}) != answers wrong (${wrong})`);
  }
  if (d.unansweredCount !== unanswered) {
    problems.push(`${label}: unansweredCount (${String(d.unansweredCount)}) != answers unanswered (${unanswered})`);
  }
  if ((d.correctCount as number) + (d.wrongCount as number) + (d.unansweredCount as number) !== d.answers.length) {
    problems.push(`${label}: correct+wrong+unanswered != answers.length`);
  }
  if (typeof d.negativeDeduction === 'number' && typeof d.negativeMarkingUsed === 'number'
    && Math.abs(round2((d.wrongCount as number) * d.negativeMarkingUsed) - d.negativeDeduction) > 0.001) {
    problems.push(`${label}: negativeDeduction (${String(d.negativeDeduction)}) != wrongCount * negativeMarkingUsed`);
  }
  if (typeof d.score === 'number' && Math.abs(round2(marksSum) - d.score) > 0.001) {
    problems.push(`${label}: score (${String(d.score)}) != sum of answer marks (${round2(marksSum)})`);
  }
  return problems;
}
