/**
 * Eduvelto Job Preparation — Live Exam config
 * (design-live-exam-dashboard.md §1.6, §2.3, §3.8, §6 item 6).
 *
 * Pure config for the per-exam Live Exam: pattern resolution
 * (including the Bank post selector), the scheduled-window type
 * + validation, the set kind, and the honest eligibility ladder
 * (full / partial / no mock — NEVER a fake full mock).
 *
 * WHAT IS STORED vs WHAT IS DERIVED (rules-shaped, 24 Nov 2026):
 * - `windowStartAt` / `windowEndAt` / `setKind` / `variantId`
 *   are NOT stored fields on `jobExamDefinitions`: the rules'
 *   `onlyKeys` for that collection forbids them, and the lib
 *   validator (`validateJobMock`) rejects unknown fields — a doc
 *   carrying them would fail validation on READ and vanish from
 *   every mock list. The window type + validation ship here so
 *   the rules-size reduction pass can land the fields later
 *   without a code change; today every Live Exam is on-demand
 *   (`liveExamWindowForMock()` returns null) and the page says
 *   so honestly.
 * - `variantId` is DERIVED from the mock's doc-ID
 *   (`full__{exam}__{n}` → variant n): variants are ordinary
 *   numbered full mocks, so no stored field is needed.
 * - `setKind` is DERIVED too: every shippable Live Exam set is
 *   a shared (variant) set — personalised sets cannot start
 *   until the §3.8 gates pass (see `PERSONALISED_SELECTION_GATES`).
 */

import type { Lang } from '../i18n/strings';
import {
  jobExamPattern,
  type JobExamPattern,
} from './jobEngine';
import { jobExamSelectionRulesFor } from './jobBankSelection';
import { SMALL_BANK_NOTICE_BN } from './jobBankSelection';
import type { JobMockWithId } from './jobMocks';

export { SMALL_BANK_NOTICE_BN };

/* ------------------------------------------------------------------ */
/* Bank post selector (§0.1 decision — recorded)                       */
/* ------------------------------------------------------------------ */

/**
 * DECISION (§6 item 0, recorded 24 Nov 2026): a POST SELECTOR
 * on the Bank Live Exam page — NOT new hub slugs. The three
 * Bank patterns are config choices (`JOB_RULES_CONFIGS`
 * entries), not exams: `JOB_EXAMS` has no post slugs, so no hub
 * renders them, and inventing hub slugs would fork the hub,
 * the dashboard target list, and the rules' exam allowlist.
 * The selector lives on `/jobs/live-exam/bank?post=...` and the
 * pattern resolves below.
 */
export const BANK_POST_SLUGS = ['bank', 'bank-senior-officer', 'bank-assistant-director'] as const;
export type BankPostSlug = (typeof BANK_POST_SLUGS)[number];

export const BANK_POST_OPTIONS: Array<{ slug: BankPostSlug; labelBn: string; labelEn: string }> = [
  { slug: 'bank', labelBn: 'অফিসার / ক্যাশ (সমন্বিত ১১ ব্যাংক)', labelEn: 'Officer / Cash (Combined 11 Banks)' },
  { slug: 'bank-senior-officer', labelBn: 'সিনিয়র অফিসার', labelEn: 'Senior Officer' },
  { slug: 'bank-assistant-director', labelBn: 'সহকারী পরিচালক (বাংলাদেশ ব্যাংক)', labelEn: 'Assistant Director (Bangladesh Bank)' },
];

/** Is this slug a Bank post choice (hub 'bank' + post slugs)? */
export function isBankPostSlug(slug: string): slug is BankPostSlug {
  return (BANK_POST_SLUGS as readonly string[]).includes(slug);
}

/**
 * Resolve the Live Exam pattern for an exam (+ Bank post).
 * For 'bank' the post slug selects the pattern; for every other
 * exam the post is ignored. Returns null when the exam/post has
 * no verified pattern — never a guessed pattern.
 */
export function resolveLiveExamPattern(
  examSlug: string,
  postSlug?: string | null,
): JobExamPattern | null {
  if (examSlug === 'bank' && postSlug && isBankPostSlug(postSlug)) {
    return jobExamPattern(postSlug);
  }
  return jobExamPattern(examSlug);
}

/** One-line pattern summary from a resolved pattern (Bangla). */
export function liveExamPatternLineBn(pattern: JobExamPattern): string {
  const neg = pattern.negativeMarking === 0
    ? 'নেগেটিভ মার্কিং বন্ধ'
    : `ভুলে −${pattern.negativeMarking === 0.5 ? '০.৫০' : '০.২৫'}`;
  return `${pattern.questionCount}টি MCQ · ${pattern.timeMinutes} মিনিট · ${neg}`;
}

/** Practice pass-mark line, ONLY where the pattern defines one
 * (Primary 50%, NTRCA 40% — "practice pass mark", never an
 * official result; BCS/Bank show none). */
export function liveExamPassMarkLine(
  pattern: JobExamPattern,
): { percent: number; labelBn: string; labelEn: string } | null {
  if (pattern.passPercent === null) return null;
  return {
    percent: pattern.passPercent,
    labelBn: `পাস নম্বর ${pattern.passPercent}% (অনুশীলন হিসাব — অফিসিয়াল পাস নয়)`,
    labelEn: `Pass mark ${pattern.passPercent}% (practice calculation — not an official pass)`,
  };
}

/* ------------------------------------------------------------------ */
/* Scheduled window (§1.6) — type + validation; NOT storable yet     */
/* ------------------------------------------------------------------ */

/** A Live Exam start window. Null = on-demand, as today. The
 * window gates START only — it never shortens a started exam
 * (a student starting 10 min before `endAt` on a 60-min exam
 * still gets 60 min of `endsAt`). */
export interface LiveExamWindow {
  startAtMillis: number;
  endAtMillis: number;
}

export type LiveExamWindowState = 'on-demand' | 'not-started' | 'open' | 'ended';

/** Validation: both set or both null (never one); end > start. */
export function validateLiveExamWindow(window: LiveExamWindow | null): string[] {
  if (window === null) return [];
  const problems: string[] = [];
  if (!Number.isFinite(window.startAtMillis) || !Number.isFinite(window.endAtMillis)) {
    problems.push('live-exam window: startAtMillis/endAtMillis must be finite numbers');
    return problems;
  }
  if (window.endAtMillis <= window.startAtMillis) {
    problems.push('live-exam window: endAt must be after startAt');
  }
  return problems;
}

/** Window state at a moment (Dhaka millis). Null window =
 * on-demand (the only state shippable today). */
export function liveExamWindowState(
  window: LiveExamWindow | null,
  nowMillis: number = Date.now(),
): LiveExamWindowState {
  if (window === null) return 'on-demand';
  if (nowMillis < window.startAtMillis) return 'not-started';
  if (nowMillis > window.endAtMillis) return 'ended';
  return 'open';
}

/** Bangla window state line for the Live Exam page. */
export function liveExamWindowLabelBn(
  state: LiveExamWindowState,
  window: LiveExamWindow | null,
): string {
  if (state === 'on-demand') return 'যেকোনো সময় দেওয়া যাবে';
  if (!window) return 'যেকোনো সময় দেওয়া যাবে';
  const fmt = (ms: number): string =>
    new Intl.DateTimeFormat('bn-BD', {
      timeZone: 'Asia/Dhaka',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(ms));
  if (state === 'not-started') return `শুরু হয়নি — ${fmt(window.startAtMillis)} থেকে`;
  if (state === 'ended') return 'সময় শেষ — এই লাইভ পরীক্ষার সময় শেষ হয়েছে';
  return `চলছে — শেষ ${fmt(window.endAtMillis)}`;
}

/**
 * The window for a mock doc. TODAY always null: no mock doc can
 * carry window fields under the committed rules (see the header)
 * — the function exists so the page reads the window from ONE
 * place when the fields land. The return type is the honest
 * contract: a window the rules cannot store is null, never
 * invented from another field.
 */
export function liveExamWindowForMock(_mock: JobMockWithId): LiveExamWindow | null {
  return null;
}

/* ------------------------------------------------------------------ */
/* Eligibility ladder (§2.3) — full / partial / no mock              */
/* ------------------------------------------------------------------ */

export type LiveExamEligibilityLevel = 'full' | 'partial' | 'none';

export interface LiveExamSubjectEligibility {
  subjectId: string;
  quota: number;
  eligible: number;
  met: boolean;
}

export interface LiveExamEligibility {
  level: LiveExamEligibilityLevel;
  examSlug: string;
  /** Full-exam question total (the verified pattern). */
  fullTotal: number;
  eligibleTotal: number;
  perSubject: LiveExamSubjectEligibility[];
  labelBn: string;
  labelEn: string;
}

/**
 * The honest fallback ladder, decided per exam from the eligible
 * bank (Level 1 Verified / published questions only — the
 * caller counts eligible questions; this function only applies
 * the thresholds):
 *   full    — 100% of every subject quota;
 *   partial — ≥50% of the total quota AND every subject has ≥1
 *             eligible question (same blueprint proportions,
 *             scaled down; the result is out of the PARTIAL
 *             total only);
 *   none    — <50% of the total, or any subject has 0 eligible
 *             (no mock card; practice sets + daily mocks only).
 * NEVER a fake full mock, never a duplicate-padded set.
 */
export function liveExamEligibility(args: {
  examSlug: string;
  /** Eligible (scored) question count per canonical subject. */
  eligibleBySubject: Map<string, number>;
}): LiveExamEligibility | null {
  const rules = jobExamSelectionRulesFor(args.examSlug);
  if (!rules || rules.totalQuestions === null) return null;
  const perSubject: LiveExamSubjectEligibility[] = rules.subjectWeights.map((w) => {
    const eligible = args.eligibleBySubject.get(w.subjectId) ?? 0;
    return { subjectId: w.subjectId, quota: w.questions, eligible, met: eligible >= w.questions };
  });
  const eligibleTotal = perSubject.reduce((s, p) => s + p.eligible, 0);
  const fullTotal = rules.totalQuestions;
  const everySubjectHasOne = perSubject.every((p) => p.eligible >= 1);
  let level: LiveExamEligibilityLevel;
  if (perSubject.every((p) => p.met)) level = 'full';
  else if (eligibleTotal * 2 >= fullTotal && everySubjectHasOne) level = 'partial';
  else level = 'none';
  const labelBn =
    level === 'full'
      ? `পূর্ণাঙ্গ মক — ${fullTotal} প্রশ্ন`
      : level === 'partial'
        ? `আংশিক মক — ${eligibleTotal}/${fullTotal} প্রশ্ন (ব্যাংকে প্রশ্ন কম)`
        : `এই পরীক্ষার মক এখনো তৈরি হয়নি — ব্যাংকে ${eligibleTotal}/${fullTotal} প্রশ্ন আছে`;
  const labelEn =
    level === 'full'
      ? `Full mock — ${fullTotal} questions`
      : level === 'partial'
        ? `Partial mock — ${eligibleTotal}/${fullTotal} questions (question bank is still small)`
        : `No mock for this exam yet — the bank has ${eligibleTotal}/${fullTotal} questions`;
  return { level, examSlug: args.examSlug, fullTotal, eligibleTotal, perSubject, labelBn, labelEn };
}

/** Partial-mock label (exact numbers — never "full", never shown
 * with a 200-mark total). */
export function partialMockLabelBn(eligible: number, fullTotal: number): string {
  return `আংশিক মক — ${eligible}/${fullTotal} প্রশ্ন (ব্যাংকে প্রশ্ন কম)`;
}

/** Honest gap line for the no-mock state. */
export function liveExamHonestGapBn(eligible: number, fullTotal: number): string {
  return `এই পরীক্ষার মক এখনো তৈরি হয়নি — ব্যাংকে ${eligible}/${fullTotal} প্রশ্ন আছে`;
}

/* ------------------------------------------------------------------ */
/* Set kind + variant derivation (no stored fields)                    */
/* ------------------------------------------------------------------ */

export type LiveExamSetKind = 'shared' | 'personalised';

/** A mock is a Live Exam candidate when it is a published full
 * mock (kind 'full'). Daily/weekly mocks are not Live Exams. */
export function isLiveExamMock(mock: JobMockWithId): boolean {
  return mock.kind === 'full';
}

/**
 * Variant number, DERIVED from the mock doc-ID
 * (`full__{exam}__{n}` → n). Null when the doc-ID does not
 * match the full-mock shape. Variants are ordinary numbered
 * full mocks — that is why no stored `variantId` field is
 * needed (and none can be stored under the rules).
 */
export function variantIdFromMock(mock: JobMockWithId): number | null {
  if (mock.kind !== 'full') return null;
  const m = /^full__[^_]+__([0-9]+)$/.exec(mock.docId);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

/** Set-kind label (Bangla-first). Every shippable Live Exam set
 * is shared (variant); 'personalised' is defined but never
 * offered until the gates below pass. */
export function liveExamSetKindLabel(kind: LiveExamSetKind, lang: Lang = 'bn'): string {
  if (kind === 'personalised') {
    return lang === 'bn' ? 'ব্যক্তিগত সেট — আপনার জন্য আলাদা প্রশ্ন' : 'Personalised set — questions picked for you';
  }
  return lang === 'bn'
    ? 'সাধারণ সেট — সব শিক্ষার্থীর জন্য একই সেট'
    : 'Shared set — the same set for every student';
}

/* ------------------------------------------------------------------ */
/* §3.8 verification gates — the verdict (measured, not assumed)     */
/* ------------------------------------------------------------------ */

/**
 * The three §3.8 gates, VERIFIED against the committed
 * `firestore.rules` + the engine (24 Nov 2026). ALL THREE FAIL
 * for per-student selection — so the variant pool (§3.9) ships
 * and personalised sets do not. The reasons cite the exact rule
 * text; re-run the gates if the rules ever change.
 */
export const PERSONALISED_SELECTION_GATES = [
  {
    gate: 1 as const,
    name: 'question text without the key',
    verdict: 'fail' as const,
    reason:
      'Students can never read jobQuestions (no student read rule), so text comes only via published jobQuestionBundles — but a session/attempt binds to exactly ONE bundleId (session create: bundle.mockId == mockId and bundleVersion == bundleVersion; attempt create: answers.size() <= bundle.questionCount and bundleVersion == attempt bundleVersion). A personalised set spanning many source bundles has no single bundle to run through the engine, and bundle create is Moderator-only, so the client cannot build a per-attempt bundle.',
  },
  {
    gate: 2 as const,
    name: 'key assembly at submit',
    verdict: 'fail' as const,
    reason:
      'scoreMockAttempt takes ONE bundle + ONE key. A multi-receipt assembly (option a) cannot anchor: validJobExamSessionAnchor / validJobExamAttemptAnchor require the submitted session/attempt bundleId to EQUAL the receipt bundleId, and the session carries one bundleId — receipts for other source bundles can never anchor, so their keys stay unreadable. Option (b) (client-written key) is forbidden; option (c) (per-bundle scoring) breaks the single-bundleVersion attempt binding.',
  },
  {
    gate: 3 as const,
    name: 'manifest equality',
    verdict: 'fail' as const,
    reason:
      'Session create requires manifest.questionRefs == session.questionRefs (whole-equality) AND def.questionSetId == session.questionSetId (the definition’s CURRENT manifest), and the session hasOnly list forbids setKind/selectionReport. A per-student manifest (option a) cannot be created by the student client — jobQuestionSetManifests create is Moderator-only. Option (b) (relax the rule) needs a rules change the compiled-rules budget cannot afford (stripped size already ~181.5k; the last measured compiled margin was ~100 bytes).',
  },
] as const;

/** Per-student selection is NOT available in this build. */
export function isPersonalisedSelectionAvailable(): boolean {
  return false;
}

/** The selection path that ships. */
export const LIVE_EXAM_SELECTION_PATH = 'variant-pool' as const;
