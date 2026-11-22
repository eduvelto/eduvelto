// Eduvelto — Job wrong-answer notebook (Step 13).
//
// PURE derivation over STORED attempts (users/{uid}/jobAttempts
// for practice, users/{uid}/jobExamAttempts for mocks). Nothing
// here touches Firestore or writes — the notebook is READ-ONLY
// over data the Step 8/9 engines already stored, exactly like
// the Step 10 analysis and the Step 12 planner.
//
// THE REMOVAL RULE (design §2.8 + §3.7, binding): a question
// leaves the active notebook automatically after 2 CONSECUTIVE
// correct answers. The streak is derived from the chronological
// answer history of that questionId:
//   - a wrong answer resets the streak to 0 immediately
//     (a lucky guess + a real mistake must never clear an
//     ungrasped concept);
//   - a correct answer advances it 0 → 1 → 2 (cleared);
//   - an UNANSWERED entry is neutral: it neither advances nor
//     resets the streak (a skip proves neither learning nor
//     forgetting).
// Because one attempt holds each question at most once, two
// consecutive correct answers necessarily come from TWO
// DISTINCT attempts — an immediate same-session repeat can
// never count twice (ChatGPT's qualifying-attempt rule, by
// construction, not by convention).
//
// RECONCILIATION (Step 13 multi-AI consultation — Gemini +
// ChatGPT, see team/job-step13-wrong-answers-2026-11-23.md):
// Gemini counts per-questionId 0→1→2 on same-question
// re-practice; ChatGPT counts ONLY fresh concept questions
// or sufficiently separated repeats, ideally in separate
// sessions. ONE RULE, from the real bank: the two qualifying
// corrects must be correct answers to THE ORIGINAL question
// in two distinct real attempts (practice or mock) — the
// derivation above enforces the separation structurally.
// Fresh same-topic questions are offered alongside the
// original in every re-practice session (transfer check), but
// a correct answer on a NEW question does NOT clear the
// original: the bank has no conceptId / variationGroupId, so
// no mapping exists to prove the new question tests the same
// concept. Concept-level qualifying is Moderator content work
// (curated concept IDs), not Step 13 code — exactly like the
// Step 10 micro-drill answer (Step 10 open question 1).
// "শেখা হয়েছে" is a learning status, never permanent
// mastery: a later wrong answer on the same question
// re-opens it (streak resets to 0, the entry returns to the
// active list with its full history).
//
// DEDUPE (ChatGPT): one entry per questionId, however many
// exams/attempts it appears in — the same question wrong in
// BCS and in Bank is ONE entry with two exam contexts, never
// two entries.
//
// HONESTY (Steps 7–12, binding): no invented numbers, no
// readiness % / pass probability / peer comparison / ranks,
// no "verified" claims, practice never shown as verified.
// Every practice link is guarded against a published bundle
// (status == 'published' + questionCount > 0). The notebook
// covers the LOADED attempt window only (50 practice + 50
// mock, newest first) — the page says so when the window is
// capped, so a capped window is never presented as a
// lifetime total.

import { jobTopicLabelBn } from './jobEngine';
import type { JobAttemptSummary } from './jobAnalysis';
import type {
  JobBundleQuestion,
  JobQuestionBundle,
  JobQuestionKey,
} from './jobQuestions';

/** Learning state of one notebook entry (ChatGPT's three
 * states, no mastery % / confidence score — the student
 * needs to know what to do next, not interpret a dashboard). */
export type NotebookLearningState = 'new' | 'practising' | 'learned';

export const NOTEBOOK_LEARNING_STATE_BN: Record<NotebookLearningState, string> = {
  new: 'নতুন ভুল',
  practising: 'আবার শিখছি',
  learned: 'শেখা হয়েছে',
};

export type NotebookOutcome = 'wrong' | 'correct' | 'unanswered';
export type NotebookSource = 'practice' | 'mock';

/** One notebook entry — one questionId, however many
 * attempts/exams it appears in. */
export interface NotebookEntry {
  questionId: string;
  topicId: string;
  subjectId: string;
  /** Distinct exam slugs whose attempts touched this question
   * (dedupe across exams — one entry, many contexts). */
  examSlugs: string[];
  /** Distinct sources (practice / mock) that touched it. */
  sources: NotebookSource[];
  /** How many times it was answered wrong, ever (loaded window). */
  wrongCount: number;
  /** First / latest wrong answer (millis, null when unknown). */
  firstWrongAtMillis: number | null;
  lastWrongAtMillis: number | null;
  lastWrongAttemptId: string;
  /** Kind of the attempt where it was last wrong. */
  lastWrongKind: NotebookSource;
  /** Outcome of the chronologically latest answer (any kind). */
  lastOutcome: NotebookOutcome;
  /** Trailing run of correct answers (unanswered ignored). */
  consecutiveCorrect: number;
  /** When the streak first reached 2 in the current cycle
   * (submittedAt of that attempt); null while active. */
  clearedAtMillis: number | null;
  /** The student's selected letter on the latest wrong answer
   * (null when the latest wrong entry has none — defensive). */
  lastSelected: string | null;
  /** Stored correct-answer text from the latest wrong answer. */
  lastCorrectText: string | null;
  status: 'active' | 'learned';
  learningState: NotebookLearningState;
}

function outcomeOf(selected: string | null, correct: boolean): NotebookOutcome {
  if (selected === null) return 'unanswered';
  return correct ? 'correct' : 'wrong';
}

/** Derive the notebook from stored attempts. Attempts may
 * arrive in any order (the loaders return newest first); the
 * walk is oldest → newest so streaks, first/last dates and
 * the cleared moment are all deterministic. A question that
 * was never answered wrong is NOT an entry — an unanswered
 * question alone never enters the notebook (it is a different
 * weakness: time / skipping, not a misconception). */
export function deriveNotebook(attempts: JobAttemptSummary[]): NotebookEntry[] {
  const ordered = [...attempts].sort(
    (a, b) => (a.submittedAtMillis ?? 0) - (b.submittedAtMillis ?? 0),
  );
  const map = new Map<
    string,
    {
      topicId: string;
      subjectId: string;
      examSlugs: Set<string>;
      sources: Set<NotebookSource>;
      wrongCount: number;
      firstWrongAtMillis: number | null;
      lastWrongAtMillis: number | null;
      lastWrongAttemptId: string;
      lastWrongKind: NotebookSource;
      lastOutcome: NotebookOutcome;
      streak: number;
      clearedAtMillis: number | null;
      lastSelected: string | null;
      lastCorrectText: string | null;
    }
  >();
  for (const attempt of ordered) {
    const source: NotebookSource = attempt.kind === 'mock' ? 'mock' : 'practice';
    const at = attempt.submittedAtMillis;
    for (const a of attempt.answers) {
      if (!a.questionId) continue;
      const s = map.get(a.questionId) ?? {
        topicId: a.topicId,
        subjectId: a.subjectId,
        examSlugs: new Set<string>(),
        sources: new Set<NotebookSource>(),
        wrongCount: 0,
        firstWrongAtMillis: null,
        lastWrongAtMillis: null,
        lastWrongAttemptId: '',
        lastWrongKind: source,
        lastOutcome: 'unanswered' as NotebookOutcome,
        streak: 0,
        clearedAtMillis: null,
        lastSelected: null,
        lastCorrectText: null,
      };
      s.examSlugs.add(attempt.examSlug);
      s.sources.add(source);
      const outcome = outcomeOf(a.selected, a.correct);
      s.lastOutcome = outcome;
      if (outcome === 'wrong') {
        s.wrongCount += 1;
        if (s.firstWrongAtMillis === null) s.firstWrongAtMillis = at;
        s.lastWrongAtMillis = at;
        s.lastWrongAttemptId = attempt.docId;
        s.lastWrongKind = source;
        s.lastSelected = a.selected;
        s.lastCorrectText = a.correctText;
        // A wrong answer resets the streak immediately — and
        // re-opens a previously learned question.
        s.streak = 0;
        s.clearedAtMillis = null;
      } else if (outcome === 'correct') {
        s.streak += 1;
        if (s.streak === 2 && s.clearedAtMillis === null) {
          s.clearedAtMillis = at;
        }
      }
      // Unanswered: neutral — streak, clearedAt and the wrong
      // counters are untouched.
      map.set(a.questionId, s);
    }
  }
  const entries: NotebookEntry[] = [];
  for (const [questionId, s] of map.entries()) {
    if (s.wrongCount === 0) continue;
    const learned = s.streak >= 2;
    entries.push({
      questionId,
      topicId: s.topicId,
      subjectId: s.subjectId,
      examSlugs: [...s.examSlugs].sort(),
      sources: [...s.sources].sort(),
      wrongCount: s.wrongCount,
      firstWrongAtMillis: s.firstWrongAtMillis,
      lastWrongAtMillis: s.lastWrongAtMillis,
      lastWrongAttemptId: s.lastWrongAttemptId,
      lastWrongKind: s.lastWrongKind,
      lastOutcome: s.lastOutcome,
      consecutiveCorrect: s.streak,
      clearedAtMillis: learned ? s.clearedAtMillis : null,
      lastSelected: s.lastSelected,
      lastCorrectText: s.lastCorrectText,
      status: learned ? 'learned' : 'active',
      learningState: learned ? 'learned' : s.streak === 1 ? 'practising' : 'new',
    });
  }
  return entries;
}

/** Active entries first (most-recent wrong first, then most
 * wrong, then questionId); learned entries after (most
 * recently cleared first). The page renders the two groups
 * in separate sections — this order is the within-group
 * order. */
export function sortNotebookEntries(entries: NotebookEntry[]): NotebookEntry[] {
  const active = entries
    .filter((e) => e.status === 'active')
    .sort(
      (a, b) =>
        (b.lastWrongAtMillis ?? 0) - (a.lastWrongAtMillis ?? 0)
        || b.wrongCount - a.wrongCount
        || (a.questionId < b.questionId ? -1 : 1),
    );
  const learned = entries
    .filter((e) => e.status === 'learned')
    .sort(
      (a, b) =>
        (b.clearedAtMillis ?? 0) - (a.clearedAtMillis ?? 0)
        || (a.questionId < b.questionId ? -1 : 1),
    );
  return [...active, ...learned];
}

export interface NotebookFilters {
  examSlug: string;
  subjectId: string;
  topicId: string;
  /** Streak quick filter (Gemini): 0/2 vs 1/2. */
  streak: 'all' | '0' | '1';
  /** Source of the latest wrong answer. */
  source: 'all' | NotebookSource;
  /** Outcome of the latest answer. */
  status: 'all' | 'wrong' | 'unanswered';
  /** Free text — matched against the question text (when
   * loaded), the topic label and the questionId. */
  query: string;
}

export const EMPTY_NOTEBOOK_FILTERS: NotebookFilters = {
  examSlug: 'all',
  subjectId: 'all',
  topicId: 'all',
  streak: 'all',
  source: 'all',
  status: 'all',
  query: '',
};

/** Client-side filtering (Gemini: filter client-side when the
 * list is small — no heavy Firestore reads per filter click).
 * Applies to the ACTIVE list; the learned list is rendered
 * separately and is not filtered (it is history, not a queue).
 * `texts` maps questionId → question text for the search box;
 * without a text the search falls back to topic label +
 * questionId. */
export function filterNotebook(
  entries: NotebookEntry[],
  filters: NotebookFilters,
  texts?: Map<string, string>,
): NotebookEntry[] {
  const q = filters.query.trim().toLowerCase();
  return entries.filter((e) => {
    if (e.status !== 'active') return false;
    if (filters.examSlug !== 'all' && !e.examSlugs.includes(filters.examSlug)) return false;
    if (filters.subjectId !== 'all' && e.subjectId !== filters.subjectId) return false;
    if (filters.topicId !== 'all' && e.topicId !== filters.topicId) return false;
    if (filters.streak === '0' && e.consecutiveCorrect !== 0) return false;
    if (filters.streak === '1' && e.consecutiveCorrect !== 1) return false;
    if (filters.source !== 'all' && e.lastWrongKind !== filters.source) return false;
    if (filters.status === 'wrong' && e.lastOutcome !== 'wrong') return false;
    if (filters.status === 'unanswered' && e.lastOutcome !== 'unanswered') return false;
    if (q) {
      const text = (texts?.get(e.questionId) ?? '').toLowerCase();
      const hay = `${text} ${jobTopicLabelBn(e.topicId).toLowerCase()} ${e.questionId.toLowerCase()}`;
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export interface NotebookTopicGroup {
  topicId: string;
  label: string;
  subjectId: string;
  examSlugs: string[];
  entries: NotebookEntry[];
}

/** Group active entries by topic, in the order the entries
 * arrive (most-recent wrong first — the caller passes the
 * sorted active list). */
export function groupNotebookByTopic(entries: NotebookEntry[]): NotebookTopicGroup[] {
  const groups = new Map<string, NotebookTopicGroup>();
  for (const e of entries) {
    const g = groups.get(e.topicId) ?? {
      topicId: e.topicId,
      label: jobTopicLabelBn(e.topicId),
      subjectId: e.subjectId,
      examSlugs: [],
      entries: [],
    };
    if (!g.examSlugs.includes(e.examSlugs[0] ?? '')) {
      for (const s of e.examSlugs) {
        if (s && !g.examSlugs.includes(s)) g.examSlugs.push(s);
      }
    }
    g.entries.push(e);
    groups.set(e.topicId, g);
  }
  return [...groups.values()];
}

/* ------------------------------------------------------------------ */
/* Re-practice session planning                                        */
/* ------------------------------------------------------------------ */

/** One question inside a planned re-practice session.
 * `isReview` — the original wrong question (recall check);
 * `isReview: false` — a FRESH question from the same topic
 * (transfer check: same topic, unseen stem). The two are
 * shown with different chips in the session, and the review
 * questions always come first (ChatGPT's sequence: revisit
 * the original, then assess on new questions). */
export interface PlannedSessionItem {
  question: JobBundleQuestion;
  isReview: boolean;
}

export interface PlannedSession {
  items: PlannedSessionItem[];
  /** Selected wrong questions the current bundle no longer
   * contains (removed / republished away) — dropped honestly. */
  droppedMissing: string[];
  /** Wrong questions dropped by the session-size cap. */
  droppedCap: string[];
  /** True when the bundle has no never-attempted question left
   * to add as a fresh transfer check. */
  noFreshLeft: boolean;
}

export const WRONG_ANSWERS_SESSION_MAX_TOTAL = 20;
export const WRONG_ANSWERS_SESSION_MAX_FRESH = 2;

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Plan one topic's re-practice session (pure — the page
 * supplies the bundle + key, the session create/submit live
 * in jobPractice.ts).
 *  - wrong questions: the selected entries of this topic that
 *    still exist in the CURRENT bundle (a republished bundle
 *    may have dropped one — it is reported, never faked in);
 *    shuffled, most-wrong first is NOT preserved after the
 *    shuffle — the shuffle itself is the point (letter /
 *    position memory must not mask a gap);
 *  - fresh questions: up to MAX_FRESH never-attempted
 *    questions from the same bundle, in bundle order, AFTER
 *    the review questions (ChatGPT's Step 2);
 *  - the session is capped at MAX_TOTAL; excess wrong
 *    questions are dropped (lowest priority first) and
 *    reported, so the cap is never silent.
 * A correct answer on a FRESH question does not clear the
 * original (no concept mapping exists — see the file header);
 * it only teaches. The original clears only by its own two
 * consecutive corrects, derived from the stored attempts. */
export function planWrongAnswersSession(args: {
  topicEntries: NotebookEntry[];
  bundle: JobQuestionBundle;
  answeredQuestionIds: Set<string>;
  maxTotal?: number;
  maxFresh?: number;
}): PlannedSession {
  const maxTotal = args.maxTotal ?? WRONG_ANSWERS_SESSION_MAX_TOTAL;
  const maxFresh = args.maxFresh ?? WRONG_ANSWERS_SESSION_MAX_FRESH;
  const byId = new Map(args.bundle.questions.map((q) => [q.questionId, q]));
  const wrongQuestions: JobBundleQuestion[] = [];
  const droppedMissing: string[] = [];
  for (const e of args.topicEntries) {
    const q = byId.get(e.questionId);
    if (q) wrongQuestions.push(q);
    else droppedMissing.push(e.questionId);
  }
  const droppedCap: string[] = [];
  const taken = shuffleInPlace([...wrongQuestions]);
  while (taken.length > maxTotal) {
    const dropped = taken.pop();
    if (dropped) droppedCap.push(dropped.questionId);
  }
  const takenIds = new Set(taken.map((q) => q.questionId));
  const freshPool = args.bundle.questions.filter(
    (q) => !takenIds.has(q.questionId) && !args.answeredQuestionIds.has(q.questionId),
  );
  const noFreshLeft = freshPool.length === 0;
  const fresh = freshPool.slice(0, Math.max(0, Math.min(maxFresh, maxTotal - taken.length)));
  return {
    items: [
      ...taken.map((question) => ({ question, isReview: true })),
      ...fresh.map((question) => ({ question, isReview: false })),
    ],
    droppedMissing,
    droppedCap,
    noFreshLeft,
  };
}

/** The in-memory bundle a re-practice session is scored
 * against: the REAL topic bundle narrowed to the planned
 * questions, keeping their ORIGINAL bundle `n` values (the
 * session refs, the key and the attempt all key by `n`, and
 * the rules bind the session's refs size to the attempt's
 * answers size — never by `n` correspondence, but keeping
 * the real `n` keeps every layer consistent). The stored
 * attempt still references the REAL bundleId + bundleVersion,
 * so the rules see a normal published-bundle practice
 * attempt — only the question set is the wrong subset. */
export function buildSubsetBundle(
  bundle: JobQuestionBundle,
  items: PlannedSessionItem[],
): JobQuestionBundle {
  const questions = items.map((i) => i.question);
  return { ...bundle, questions, questionCount: questions.length };
}

/** The matching in-memory key: exactly the planned
 * questions' key answers (original `n`), in the same order.
 * Throws when the key does not cover a planned question —
 * scoring must never guess (the page shows the honest error
 * instead). */
export function buildSubsetKey(
  key: JobQuestionKey,
  items: PlannedSessionItem[],
): JobQuestionKey {
  const answers = items.map((i) => {
    const a = key.answers.find((x) => x.questionId === i.question.questionId);
    if (!a) {
      throw new Error(
        `buildSubsetKey: the answer key has no entry for ${i.question.questionId} — scoring refuses to guess`,
      );
    }
    return a;
  });
  return { ...key, answers };
}
