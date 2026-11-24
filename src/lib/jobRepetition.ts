/**
 * Eduvelto Job Preparation — Live Exam repetition control
 * (design-live-exam-dashboard.md §3).
 *
 * Pure, testable core for Live Exam question-set selection:
 * stratified weighted sampling without replacement + recent-
 * exposure penalties (ChatGPT consultation, adopted verbatim in
 * structure), the small-bank fallback ladder, and the variant-
 * pool assignment used at start time.
 *
 * SELECTION PATH THAT SHIPS (verified against the committed
 * `firestore.rules`, 24 Nov 2026 — see `jobLiveExam.ts`
 * `PERSONALISED_SELECTION_GATES`): the VARIANT POOL (§3.9).
 * Per-student selection at start FAILS all three §3.8 gates:
 *   1. question text is readable only via published
 *      `jobQuestionBundles`, and a session/attempt binds to
 *      exactly ONE bundleId — a set spanning many source
 *      bundles cannot run through the engine;
 *   2. each `exam_review` receipt must anchor to a submitted
 *      exam session/attempt whose bundleId EQUALS the receipt's
 *      bundleId, so keys for other source bundles stay
 *      unreadable; per-bundle scoring breaks the single
 *      bundleVersion binding;
 *   3. session create requires whole-equality with the
 *      definition's CURRENT manifest, manifest create is
 *      Moderator-only (a student client cannot create a
 *      per-student manifest), and the session `hasOnly` list
 *      forbids `setKind` / `selectionReport`.
 * The §3.3 algorithm below is therefore used in TWO places
 * that the rules DO allow: the admin-side variant builder
 * (neutral history — variants differ by random draw) and the
 * client-side variant assignment (lowest overlap with the
 * student's history). It is also the algorithm that runs
 * unchanged if the gates ever pass after a rules-size
 * reduction pass — nothing here assumes the variant path.
 *
 * HISTORY SHAPE (live): `ExposureHistory` from
 * `./jobBankSelection` — `users/{uid}/examHistory/{examId}`
 * (`recentQuestionIds` most-recent-first, `lastAttemptNo`).
 * The design §3.2 richer shape (`JobExamHistoryDoc` below,
 * per-question `lastSeenAttemptNo`) is NOT writable under the
 * committed rules (`onlyKeys(['recentQuestionIds',
 * 'lastAttemptNo', 'updatedAt'])`), so exposure scoring uses
 * the recency-rank proxy (`exposureScoreByRank`) — the same
 * proxy agent A shipped. `scoreCandidate()` implements the
 * EXACT attempt-number table for when per-question attempt
 * numbers exist; `selectLiveExamSet()` accepts an optional
 * `lastSeenAttemptNoById` map so the exact table applies
 * without rewriting history.
 *
 * NO Firestore in this file. Randomisation uses
 * `crypto.getRandomValues` (never bare `Math.random`) unless
 * the caller injects a `random` function (tests).
 */

import {
  DEFAULT_DIFFICULTY_DISTRIBUTION,
  exposureScore,
  exposureScoreByRank,
  selectForQuota,
  SMALL_BANK_NOTICE_BN,
  jobExamSelectionRulesFor,
  mergeExposureHistory,
  type ExposureHistory,
} from './jobBankSelection';

/** Exposure weights (§3.3 step C — ChatGPT illustrative values,
 * adopted as v1 defaults). ONE place: tuning them is a one-line
 * change with a test update. */
export const JOB_EXPOSURE_WEIGHTS = {
  neverSeen: 10,
  overTenAgo: 6,
  sixToTenAgo: 4,
  twoToFiveAgo: 2,
  previousAttempt: 0.5,
} as const;

/** History bound (§3.1 — ChatGPT's 300–500 range, fixed at 400). */
export const JOB_EXAM_HISTORY_MAX_EXPOSURES = 400;

/** Small-bank notice (Bangla, §2.4) — re-exported from the bank
 * core so the UI has one source for the sentence. */
export { SMALL_BANK_NOTICE_BN };

/** The design §3.2 history doc shape (per-question attempt
 * numbers). NOT writable under the committed rules — kept as the
 * forward-compatible type: `selectLiveExamSet()` accepts its
 * `exposures` as an optional exact-scoring input, and the day the
 * rules allow the shape, `jobExamHistoryData.ts` can store it
 * without changing this algorithm. */
export interface JobExamHistoryDoc {
  examSlug: string;
  attemptCount: number;
  exposures: Array<{
    questionId: string;
    lastSeenAttemptNo: number;
    seenCount: number;
    lastSeenAtMillis: number;
  }>;
  lastMergedAttemptId: string | null;
  updatedAt: unknown;
}

/**
 * Exact candidate weight from the ACTUAL last-seen attempt
 * number (§3.3 step C): `g = attemptCount - lastSeenAttemptNo`
 * (attempts since last seen in THIS exam; null = never seen).
 * Computed at read time, never stored — a future weight-table
 * change applies without rewriting history.
 */
export function scoreCandidate(
  lastSeenAttemptNo: number | null,
  attemptCount: number,
): number {
  if (lastSeenAttemptNo === null) return JOB_EXPOSURE_WEIGHTS.neverSeen;
  return exposureScore(attemptCount - lastSeenAttemptNo);
}

/** Rank-proxy weight for the live history shape (no per-question
 * attempt numbers): rank 0 (most recently seen) → 0.5, ranks
 * 1–4 → 2, ranks 5–9 → 4, rank 10+ → 6, unseen → 10. */
export function scoreCandidateByRank(rank: number | null): number {
  return exposureScoreByRank(rank);
}

/** Crypto-backed random in [0, 1): `crypto.getRandomValues`
 * (§3.3 step D — `Math.random` is predictable enough that a
 * student could in principle reconstruct the draw order).
 * Falls back to `Math.random` only where WebCrypto is
 * unavailable (never in the shipped browsers / Node 20+). */
export function cryptoRandom(): number {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return Math.random();
}

/* ------------------------------------------------------------------ */
/* Stratified selection (§3.3 steps A–F)                               */
/* ------------------------------------------------------------------ */

/** One pool group as the selector sees it: the eligible IDs for
 * one (subject, topic, difficulty) slice. Topic is null only for
 * pools that were built without a topic split. */
export interface SelectionPoolGroup {
  subjectId: string;
  topicId: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  questionIds: string[];
}

/** Per-subject fill, recorded on the set record so the result
 * page can show what was actually tested (§2.1). */
export interface LiveExamSubjectFill {
  subjectId: string;
  quota: number;
  selected: number;
  unseen: number;
  repeated: number;
  shortfall: number;
  difficulty: { easy: number; medium: number; hard: number };
  /** Topic split actually used, when the subject was split by
   * topic (BCS English Language/Literature working split, or the
   * proportional split — topicId → count). */
  topicSplit: Array<{ topicId: string; questions: number }>;
}

export interface LiveExamSetSelection {
  examSlug: string;
  /** Blueprint order: subject order as in the pattern, topic
   * order within a subject — NOT difficulty order. */
  selectedIds: string[];
  perSubject: LiveExamSubjectFill[];
  unseenCount: number;
  repeatedCount: number;
  /** Questions the eligible bank could not supply at all. */
  shortfall: number;
  /** True when repeats were FORCED (unseen pool could not fill
   * the set) — the §2.4 Bangla notice must show. */
  smallBankNotice: boolean;
  difficultyCounts: { easy: number; medium: number; hard: number };
}

function difficultySplitForQuota(
  quota: number,
): { easy: number; medium: number; hard: number } {
  const d = DEFAULT_DIFFICULTY_DISTRIBUTION;
  const total = d.easy + d.medium + d.hard;
  const easy = Math.round((quota * d.easy) / total);
  const medium = Math.round((quota * d.medium) / total);
  const hard = Math.max(0, quota - easy - medium);
  return { easy, medium, hard };
}

/**
 * Exam-level difficulty targets (largest-remainder rounding of
 * the configured mix over the exam's total): for 100Q →
 * 30/55/15, for 200Q → 60/110/30, for 90Q → 27/50/13.
 */
export function examDifficultyTargets(
  totalQuestions: number,
): { easy: number; medium: number; hard: number } {
  const d = DEFAULT_DIFFICULTY_DISTRIBUTION;
  const total = d.easy + d.medium + d.hard;
  const exact = [
    (totalQuestions * d.easy) / total,
    (totalQuestions * d.medium) / total,
    (totalQuestions * d.hard) / total,
  ];
  const floors = exact.map((e) => Math.floor(e));
  let assigned = floors[0] + floors[1] + floors[2];
  const order = [0, 1, 2].sort((a, b) => exact[b] - floors[b] - (exact[a] - floors[a]) || a - b);
  let k = 0;
  while (assigned < totalQuestions) {
    floors[order[k % 3]] += 1;
    assigned += 1;
    k += 1;
  }
  return { easy: floors[0], medium: floors[1], hard: floors[2] };
}

/**
 * Per-subject proportional rounding drifts the exam-level
 * totals by ±2 (a 10Q subject rounds hard 1.5 → 1). Move single
 * questions between bands INSIDE one subject (its quota never
 * changes) until the exam totals match the configured mix
 * exactly. Deterministic: largest surplus subject first,
 * pattern order on ties; the receiving band is the largest
 * deficit. A subject's band never drops below 0.
 */
export function adjustDifficultySplits(
  splits: Array<{ easy: number; medium: number; hard: number }>,
  targets: { easy: number; medium: number; hard: number },
): Array<{ easy: number; medium: number; hard: number }> {
  const out = splits.map((s) => ({ ...s }));
  const bands = ['easy', 'medium', 'hard'] as const;
  const sum = (band: (typeof bands)[number]): number => out.reduce((s, x) => s + x[band], 0);
  for (let guard = 0; guard < 1000; guard += 1) {
    const surplus = bands.find((b) => sum(b) > targets[b]);
    if (!surplus) return out;
    const deficit = bands
      .filter((b) => b !== surplus && sum(b) < targets[b])
      .sort((a, b) => (targets[b] - sum(b)) - (targets[a] - sum(a)))[0];
    if (!deficit) return out;
    let donor = -1;
    let donorCount = -1;
    out.forEach((s, i) => {
      if (s[surplus] > donorCount) {
        donor = i;
        donorCount = s[surplus];
      }
    });
    if (donor < 0 || donorCount <= 0) return out;
    out[donor][surplus] -= 1;
    out[donor][deficit] += 1;
  }
  return out;
}

/**
 * Split a (subject, difficulty) quota across topics
 * proportionally to each topic's share of the subject's
 * eligible bank (§2.1), largest-remainder rounding. Returns
 * topicId → count. Topics with no eligible IDs get 0.
 */
export function proportionalTopicSplit(
  topicEligibleCounts: Array<{ topicId: string; eligible: number }>,
  quota: number,
): Array<{ topicId: string; questions: number }> {
  const total = topicEligibleCounts.reduce((s, t) => s + t.eligible, 0);
  if (total <= 0 || quota <= 0) {
    return topicEligibleCounts.map((t) => ({ topicId: t.topicId, questions: 0 }));
  }
  const raw = topicEligibleCounts.map((t) => ({
    topicId: t.topicId,
    exact: (quota * t.eligible) / total,
  }));
  const floors = raw.map((r) => ({ topicId: r.topicId, base: Math.floor(r.exact), frac: r.exact - Math.floor(r.exact) }));
  let assigned = floors.reduce((s, f) => s + f.base, 0);
  const order = [...floors].sort((a, b) => b.frac - a.frac || (a.topicId < b.topicId ? -1 : 1));
  const out = new Map(floors.map((f) => [f.topicId, f.base]));
  let i = 0;
  while (assigned < quota && order.length > 0) {
    const topicId = order[i % order.length].topicId;
    out.set(topicId, (out.get(topicId) ?? 0) + 1);
    assigned += 1;
    i += 1;
  }
  return topicEligibleCounts.map((t) => ({ topicId: t.topicId, questions: out.get(t.topicId) ?? 0 }));
}

/**
 * Build one Live Exam set from the pool groups + the student's
 * exposure history (pure — no Firestore).
 *
 * Blueprint-strict (§3.1 rule 4): subject quotas + difficulty
 * mix are NEVER silently violated to achieve zero repetition.
 * A subject's shortfall is filled from that subject's
 * oldest-seen questions and sets `smallBankNotice`; the
 * shortfall is NEVER borrowed from another subject, and
 * within-attempt uniqueness is NEVER violated (§3.1 rule 1 —
 * if the eligible pool itself is smaller than the quota, the
 * set is SHORT and `shortfall` reports it; the caller applies
 * the §2.3 ladder — partial mock or no mock — never pads with
 * duplicates).
 *
 * `topicQuotas` (optional): where the syllabus requires a topic
 * split inside a subject — today exactly BCS English Language
 * 15 / Literature 15 (a WORKING split, not published; re-cut
 * if the real sub-split differs). A topic quota is filled ONLY
 * from that topic's pools; a missing topic reports a shortfall,
 * never silently fills from another topic.
 *
 * `lastSeenAttemptNoById` (optional): the exact-scoring input
 * (§3.2 shape) — when present, weights come from
 * `scoreCandidate()`; otherwise the recency-rank proxy applies.
 */
export function selectLiveExamSet(args: {
  examSlug: string;
  poolGroups: SelectionPoolGroup[];
  history: ExposureHistory | null;
  topicQuotas?: Array<{ subjectId: string; topicId: string; questions: number }>;
  lastSeenAttemptNoById?: Map<string, number>;
  random?: () => number;
}): LiveExamSetSelection {
  const { examSlug, poolGroups, history, topicQuotas, lastSeenAttemptNoById, random } = args;
  const rules = jobExamSelectionRulesFor(examSlug);
  if (!rules || rules.totalQuestions === null) {
    throw new Error(`selectLiveExamSet: exam '${examSlug}' has no verified selection rules`);
  }
  const rnd = random ?? cryptoRandom;
  const hist: ExposureHistory = history ?? { examId: examSlug, recentQuestionIds: [], lastAttemptNo: 0 };
  const selectedIds: string[] = [];
  const selectedSet = new Set<string>();
  const perSubject: LiveExamSubjectFill[] = [];
  let unseenCount = 0;
  let repeatedCount = 0;
  let shortfall = 0;
  // True when ANY slice could not be filled from unseen
  // questions alone (§3.3 E step 6) — the §2.4 notice means
  // "forced", not "any repeat".
  let forcedNotice = false;
  const difficultyCounts = { easy: 0, medium: 0, hard: 0 };

  // Exact-scoring view: when per-question attempt numbers are
  // supplied, build a rank-free history view for selectForQuota
  // by ordering IDs by attempts-ago (oldest-seen first = highest
  // rank). The weight VALUES are identical either way; only the
  // ordering input differs.
  const effectiveHistory: ExposureHistory = lastSeenAttemptNoById
    ? exactHistoryView(hist, lastSeenAttemptNoById)
    : hist;

  // Difficulty splits are computed for ALL subjects first and
  // adjusted to the exam-level mix (§8 item 4: the mix matches
  // the configured default exactly, not within rounding drift).
  const diffSplits = adjustDifficultySplits(
    rules.subjectWeights.map((w) => difficultySplitForQuota(w.questions)),
    examDifficultyTargets(rules.totalQuestions),
  );

  for (let si = 0; si < rules.subjectWeights.length; si += 1) {
    const weight = rules.subjectWeights[si];
    const subjectId = weight.subjectId;
    const quota = weight.questions;
    const diffSplit = diffSplits[si];
    const subjectGroups = poolGroups.filter((g) => g.subjectId === subjectId);
    const subjectTopicQuotas = (topicQuotas ?? []).filter((t) => t.subjectId === subjectId);
    const fill: LiveExamSubjectFill = {
      subjectId,
      quota,
      selected: 0,
      unseen: 0,
      repeated: 0,
      shortfall: 0,
      difficulty: { easy: 0, medium: 0, hard: 0 },
      topicSplit: [],
    };
    // (subject, difficulty) slices to fill, in difficulty order.
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const want = diffSplit[difficulty];
      if (want <= 0) continue;
      const diffGroups = subjectGroups.filter((g) => g.difficulty === difficulty);
      if (subjectTopicQuotas.length > 0) {
        // Topic-split subject: each topic quota is scaled to this
        // difficulty band proportionally, then filled from that
        // topic's pool only.
        const totalTopicQuota = subjectTopicQuotas.reduce((s, t) => s + t.questions, 0);
        for (const tq of subjectTopicQuotas) {
          const bandQuota = totalTopicQuota > 0 ? Math.round((want * tq.questions) / totalTopicQuota) : 0;
          const ids = diffGroups.filter((g) => g.topicId === tq.topicId).flatMap((g) => g.questionIds);
          const picked = pickFromPool(ids, bandQuota, effectiveHistory, rnd, selectedSet);
          fill.topicSplit.push({ topicId: tq.topicId, questions: picked.selected.length });
          accountPick(fill, picked, difficulty);
        }
      } else {
        // Proportional topic split (§2.1): allocate the band
        // quota across the subject's topics by eligible share.
        const byTopic = new Map<string, string[]>();
        for (const g of diffGroups) {
          const key = g.topicId ?? '__no-topic__';
          const list = byTopic.get(key) ?? [];
          list.push(...g.questionIds);
          byTopic.set(key, list);
        }
        const split = proportionalTopicSplit(
          [...byTopic.entries()].map(([topicId, ids]) => ({ topicId, eligible: ids.length })),
          want,
        );
        for (const s of split) {
          if (s.questions <= 0) continue;
          const picked = pickFromPool(byTopic.get(s.topicId) ?? [], s.questions, effectiveHistory, rnd, selectedSet);
          fill.topicSplit.push({ topicId: s.topicId, questions: picked.selected.length });
          accountPick(fill, picked, difficulty);
        }
      }
    }
    // Shortfall: the subject's eligible bank could not fill its
    // quota (after the small-bank fallback). Recorded, never
    // borrowed from another subject.
    fill.shortfall = Math.max(0, quota - fill.selected);
    shortfall += fill.shortfall;
    perSubject.push(fill);
    for (const k of ['easy', 'medium', 'hard'] as const) difficultyCounts[k] += fill.difficulty[k];
    unseenCount += fill.unseen;
    repeatedCount += fill.repeated;
  }

  // Blueprint order: subjects in pattern order; within a subject
  // the selection order is already topic-then-difficulty, which
  // preserves the pattern's subject order (the exact intra-
  // subject order is the manifest order, frozen at publish).
  // A shortfall also forces the notice: the eligible bank could
  // not even supply the quota, so every repeat in the set was
  // unavoidable.
  const smallBankNotice = forcedNotice || shortfall > 0;
  return {
    examSlug,
    selectedIds,
    perSubject,
    unseenCount,
    repeatedCount,
    shortfall,
    smallBankNotice,
    difficultyCounts,
  };

  function accountPick(
    fill: LiveExamSubjectFill,
    picked: { selected: string[]; repeatedCount: number; needsSmallBankNotice: boolean; shortfall: number },
    difficulty: 'easy' | 'medium' | 'hard',
  ): void {
    if (picked.needsSmallBankNotice) forcedNotice = true;
    for (const id of picked.selected) {
      if (selectedSet.has(id)) continue; // within-attempt uniqueness guard
      selectedSet.add(id);
      selectedIds.push(id);
    }
    fill.selected += picked.selected.length;
    fill.repeated += picked.repeatedCount;
    fill.unseen += picked.selected.length - picked.repeatedCount;
    fill.difficulty[difficulty] += picked.selected.length;
  }
}

/** Pick from one pool slice, honouring the already-selected set
 * (a picked ID can never be drawn again in this attempt). */
function pickFromPool(
  eligibleIds: string[],
  quota: number,
  history: ExposureHistory,
  random: () => number,
  selectedSet: Set<string>,
): { selected: string[]; repeatedCount: number; needsSmallBankNotice: boolean; shortfall: number } {
  const available = eligibleIds.filter((id) => !selectedSet.has(id));
  if (available.length === 0 || quota <= 0) {
    return { selected: [], repeatedCount: 0, needsSmallBankNotice: available.length < quota, shortfall: Math.max(0, quota - available.length) };
  }
  return selectForQuota(available, history, quota, random);
}

/**
 * Build a recency-ordered history view from exact per-question
 * attempt numbers: IDs sorted by attempts-ago ascending
 * (previous attempt first, oldest-seen last) so the rank proxy
 * reproduces the exact table's ORDER. Unseen IDs are absent
 * (they score 10 either way). Used only when the §3.2 shape is
 * available — the weight VALUES never change.
 */
export function exactHistoryView(
  history: ExposureHistory,
  lastSeenAttemptNoById: Map<string, number>,
): ExposureHistory {
  const entries = [...lastSeenAttemptNoById.entries()].map(([id, lastSeen]) => ({
    id,
    ago: history.lastAttemptNo - lastSeen,
  }));
  entries.sort((a, b) => a.ago - b.ago || (a.id < b.id ? -1 : 1));
  const seen = new Set(entries.map((e) => e.id));
  return {
    ...history,
    recentQuestionIds: [...entries.map((e) => e.id), ...history.recentQuestionIds.filter((id) => !seen.has(id))],
  };
}

/* ------------------------------------------------------------------ */
/* Variant-pool assignment (§3.9) — the path that ships              */
/* ------------------------------------------------------------------ */

/** One pre-built variant (a normal shared set: manifest +
 * bundle + key). `questionIds` are the manifest's refs in order
 * (IDs only — no answers, safe to read). */
export interface LiveExamVariant {
  mockId: string;
  docId: string;
  /** Variant number (1–5 within a generation; the doc-ID's
   * trailing `__{n}`). */
  variantNo: number;
  questionIds: string[];
}

/** Overlap of one variant's set with the student's exposure
 * history (how many of its questions the student has already
 * seen in THIS exam). */
export function variantOverlap(
  questionIds: string[],
  history: ExposureHistory | null,
): number {
  if (!history) return 0;
  const seen = new Set(history.recentQuestionIds);
  let overlap = 0;
  for (const id of questionIds) if (seen.has(id)) overlap += 1;
  return overlap;
}

/**
 * Choose the variant with the SMALLEST overlap with the
 * student's history (ties → lowest variant number). A student
 * who just ran variant 2 will not be offered variant 2 again
 * unless all 5 overlap equally. Cross-exam reuse is
 * unaffected (history is per student+exam).
 */
export function chooseLiveExamVariant(
  variants: LiveExamVariant[],
  history: ExposureHistory | null,
): { variant: LiveExamVariant; overlap: number; overlaps: Array<{ variantNo: number; overlap: number }> } | null {
  if (variants.length === 0) return null;
  const overlaps = variants.map((v) => ({ variantNo: v.variantNo, overlap: variantOverlap(v.questionIds, history) }));
  let best = variants[0];
  let bestOverlap = overlaps[0].overlap;
  for (let i = 1; i < variants.length; i += 1) {
    if (overlaps[i].overlap < bestOverlap
      || (overlaps[i].overlap === bestOverlap && variants[i].variantNo < best.variantNo)) {
      best = variants[i];
      bestOverlap = overlaps[i].overlap;
    }
  }
  return { variant: best, overlap: bestOverlap, overlaps };
}

/**
 * The §2.4 small-bank notice is FORCED when every variant
 * overlaps the student's history (no overlap-free variant
 * exists) — the repeats are unavoidable, not a choice.
 */
export function forcedRepeatNotice(overlaps: number[]): boolean {
  return overlaps.length > 0 && overlaps.every((o) => o > 0);
}

/** Merge helper re-export (the write side lives in
 * `jobExamHistoryData.ts`; the pure merge is here for tests). */
export { mergeExposureHistory };
export type { ExposureHistory };
