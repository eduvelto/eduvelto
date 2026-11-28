/**
 * Eduvelto — GENERAL National Live Exam hub (sprint Day 5).
 *
 * The hub at /:lang/live-exam lists SCHEDULED national live exams
 * (Job / Admission / Academic) with a Dhaka-time window, a live
 * countdown, a strict entry gate, and a real-time merit list.
 *
 * WHERE THE SCHEDULE COMES FROM — no invented dates (jobCalendar
 * rule: "with no source there is no event at all"):
 * - DERIVED: a published daily/weekly mock in `jobExamDefinitions`
 *   carries a real `scheduleDate` (Dhaka date). Its national-live
 *   window is that whole Dhaka day (00:00–23:59:59.999 Asia/Dhaka)
 *   — the only window derivable from the stored data, because no
 *   clock time is stored for any mock. Full mocks have
 *   `scheduleDate: null` by validator rule, so they are on-demand
 *   (jobLiveExam.liveExamWindowForMock() returns null) and NEVER
 *   appear as "scheduled" here; they stay on the Job track page
 *   (/jobs/live-exam/:exam), which this hub deep-links to.
 * - CONFIGURED: `NATIONAL_LIVE_EXAM_SCHEDULE` below — dated
 *   entries the owner announces (title, category, Dhaka start/end,
 *   entry path, bundle). It ships EMPTY on purpose: a national
 *   live exam date must come from the owner, never from a guess.
 *   Admission / Academic have no live-exam engine yet, so their
 *   sections honestly show "nothing scheduled yet".
 *
 * NO NEW COLLECTION, NO RULES CHANGE (verified 26 Nov 2026):
 * - schedule: derived from `jobExamDefinitions` (published read)
 *   + the code config above — both already readable.
 * - questions: ONE `jobQuestionBundles` doc per exam (the single
 *   compressed document — 1 read per student, sessionStorage
 *   cached); the bundle rules already forbid any key material in
 *   the doc, and this lib re-checks every question before use.
 * - answer key: `jobQuestionKeys`, receipt-gated exactly like the
 *   Job mock (fresh exam_review receipt anchored to a SUBMITTED
 *   attempt/session, 10-minute window) — see
 *   `loadLiveExamKeyAfterSubmit()`. The key is NEVER bundled with
 *   the questions and NEVER loaded before submit.
 * - merit list: `leaderboardSnapshots` docs `liveMerit-{examId}`
 *   (kind 'liveMerit') — public read, moderator-only write, the
 *   same zero-rules-change placement as classStats
 *   (classStats.ts). No client ever writes a merit doc.
 * - rules size measured 26 Nov 2026 in this worktree:
 *   firestore.rules source 322,954 bytes, comment-stripped
 *   188,348 bytes (limit 262,144) — headroom exists, but no new
 *   rule is needed, so none is added. Do NOT add a `liveExams`
 *   collection/rules entry without re-measuring the strip.
 *
 * WINDOW ENFORCEMENT — honest scope: the hub gate below is
 * client-side (`canEnterLiveExam`). The server-side backstop is
 * the EXISTING mock session/attempt rules (a session enforces its
 * stored endsAt; a submit after endsAt is denied; the key stays
 * receipt-gated) — the hub never weakens any of those rules, and
 * it adds no server-side window check of its own, because no new
 * collection/rule was created to carry one. A student who opens
 * the entry URL directly still hits the same session rules.
 *
 * LOGIN: entering any exam requires sign-in (standing rule); the
 * hub itself is public so students can see the schedule and the
 * countdown, but the entry button sends a signed-out student to
 * /login with a return state.
 */

import type { Lang } from '../i18n/strings';
import { loadBundleKey, loadPracticeBundle, type PracticeBundleWithId } from './jobPractice';
import { jobExamBySlug } from './jobExams';
import {
  liveExamWindowState,
  validateLiveExamWindow,
  type LiveExamWindow,
} from './jobLiveExam';
import type { JobMockWithId } from './jobMocks';
import type { JobQuestionKey } from './jobQuestions';

/* ------------------------------------------------------------------ */
/* Schedule types                                                      */
/* ------------------------------------------------------------------ */

export const LIVE_EXAM_CATEGORIES = ['job', 'admission', 'academic'] as const;
export type LiveExamCategory = (typeof LIVE_EXAM_CATEGORIES)[number];

export const LIVE_EXAM_CATEGORY_BN: Record<LiveExamCategory, string> = {
  job: 'চাকরি',
  admission: 'ভর্তি',
  academic: 'একাডেমিক',
};

export const LIVE_EXAM_CATEGORY_EN: Record<LiveExamCategory, string> = {
  job: 'Job',
  admission: 'Admission',
  academic: 'Academic',
};

export function isLiveExamCategory(value: string): value is LiveExamCategory {
  return (LIVE_EXAM_CATEGORIES as readonly string[]).includes(value);
}

/** Hub status — the words the student sees. */
export type NationalLiveExamStatus = 'upcoming' | 'live' | 'ended';

/** One scheduled national live exam on the hub. */
export interface NationalLiveExam {
  /** Stable id: mock docId for derived entries, config id otherwise. */
  id: string;
  titleBn: string;
  titleEn: string;
  category: LiveExamCategory;
  /** 'job' | 'admission' | 'academic' — which track runs it. */
  track: LiveExamCategory;
  window: LiveExamWindow;
  /** Where the entry button goes inside the window. */
  entryPath: string;
  /** Job exam slug for the deep-link to /jobs/live-exam/:exam. */
  jobExamSlug: string | null;
  /** Single compressed bundle doc (jobQuestionBundles/{bundleId}). */
  bundleId: string;
  /** Merit snapshot exam id (leaderboardSnapshots/liveMerit-{id}). */
  meritExamId: string;
  /** Provenance — never shown as a scheduled date without a source. */
  source: 'published-mock' | 'scheduled-config';
}

/**
 * An owner-announced national live exam. Start/end are ISO
 * instants WITH an explicit Dhaka offset, e.g.
 * '2026-12-05T10:00:00+06:00'. A date without an offset is
 * rejected — a bare date would silently mean UTC somewhere.
 */
export interface NationalLiveExamConfig {
  id: string;
  titleBn: string;
  titleEn: string;
  category: LiveExamCategory;
  startAtDhakaISO: string;
  endAtDhakaISO: string;
  entryPath: string;
  bundleId: string;
  jobExamSlug?: string | null;
}

/**
 * Owner-announced national live exams. EMPTY by design (see the
 * header): the owner adds a dated entry here when a national live
 * exam is actually announced. Never seed a guessed date.
 */
export const NATIONAL_LIVE_EXAM_SCHEDULE: NationalLiveExamConfig[] = [];

/* ------------------------------------------------------------------ */
/* Dhaka windows + status + countdown (pure)                           */
/* ------------------------------------------------------------------ */

/** Whole-Dhaka-day window for a 'YYYY-MM-DD' scheduleDate:
 * 00:00:00.000+06:00 up to (not including) the next midnight.
 * Null for a malformed / impossible date — never a guessed day. */
export function dhakaDayWindowMillis(dateYYYYMMDD: string): LiveExamWindow | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYYYYMMDD)) return null;
  const startAtMillis = Date.parse(`${dateYYYYMMDD}T00:00:00.000+06:00`);
  const endAtMillis = Date.parse(`${dateYYYYMMDD}T23:59:59.999+06:00`);
  if (!Number.isFinite(startAtMillis) || !Number.isFinite(endAtMillis)) return null;
  // Guard against an impossible date normalising (e.g. 2026-02-30
  // parses as 2026-03-02 in some engines): the round-trip must
  // reproduce the input date in Dhaka time.
  const roundTrip = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(startAtMillis));
  if (roundTrip !== dateYYYYMMDD) return null;
  return { startAtMillis, endAtMillis };
}

/** Hub status for a (non-null) window at a moment. Reuses the Job
 * window state machine so the two tracks can never disagree:
 * not-started → upcoming, open → live, ended → ended. The window
 * end is inclusive (a student at exactly endAt is still inside,
 * matching liveExamWindowState). */
export function nationalLiveExamStatus(
  window: LiveExamWindow,
  nowMillis: number = Date.now(),
): NationalLiveExamStatus {
  const state = liveExamWindowState(window, nowMillis);
  if (state === 'not-started') return 'upcoming';
  if (state === 'ended') return 'ended';
  return 'live';
}

export const NATIONAL_LIVE_EXAM_STATUS_BN: Record<NationalLiveExamStatus, string> = {
  upcoming: 'আসছে',
  live: 'এখন চলছে',
  ended: 'শেষ হয়েছে',
};

export const NATIONAL_LIVE_EXAM_STATUS_EN: Record<NationalLiveExamStatus, string> = {
  upcoming: 'Upcoming',
  live: 'Live now',
  ended: 'Ended',
};

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Remaining millis, clamped at 0. */
  totalMillis: number;
  /** True when the target has passed. */
  expired: boolean;
}

/** Split a target instant into d/h/m/s parts (pure, clamped). */
export function countdownParts(targetMillis: number, nowMillis: number = Date.now()): CountdownParts {
  const totalMillis = Math.max(0, targetMillis - nowMillis);
  const totalSeconds = Math.floor(totalMillis / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMillis,
    expired: targetMillis <= nowMillis,
  };
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

/** Latin digits → Bangla digits, keeping leading zeros ("04" → "০৪"). */
function toBnDigits(text: string): string {
  return text.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

function bnDigits(n: number): string {
  return new Intl.NumberFormat('bn-BD').format(n);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** "২ দিন ০৪:১২:৩৩" / "2d 04:12:33" — days shown only when > 0. */
export function formatLiveExamCountdown(
  parts: CountdownParts,
  lang: Lang = 'bn',
): string {
  const clock =
    lang === 'bn'
      ? toBnDigits(`${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`)
      : `${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`;
  if (parts.days <= 0) return clock;
  return lang === 'bn' ? `${bnDigits(parts.days)} দিন ${clock}` : `${parts.days}d ${clock}`;
}

/** One instant in Dhaka time, e.g. "২৬ নভে, ২০২৬, সকাল ১০:০০". */
export function formatLiveExamInstant(millis: number, lang: Lang = 'bn'): string {
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(millis));
}

/* ------------------------------------------------------------------ */
/* Entry gate (client-side; server rules are the backstop)             */
/* ------------------------------------------------------------------ */

export type LiveExamEntryReason = 'ok' | 'login-required' | 'not-started' | 'ended';

export interface LiveExamEntryDecision {
  allowed: boolean;
  reason: LiveExamEntryReason;
}

/**
 * May this student enter right now? Login first (standing rule),
 * then the strict window. The page shows the countdown before the
 * window and the merit list after it — entry is never offered
 * outside the window.
 */
export function canEnterLiveExam(
  exam: NationalLiveExam,
  nowMillis: number = Date.now(),
  isSignedIn: boolean = false,
): LiveExamEntryDecision {
  if (!isSignedIn) return { allowed: false, reason: 'login-required' };
  const status = nationalLiveExamStatus(exam.window, nowMillis);
  if (status === 'upcoming') return { allowed: false, reason: 'not-started' };
  if (status === 'ended') return { allowed: false, reason: 'ended' };
  return { allowed: true, reason: 'ok' };
}

/** Deep-link to the existing Job live-exam track (reused, never rebuilt). */
export function jobLiveExamEntryPath(examSlug: string): string {
  return `/jobs/live-exam/${examSlug}`;
}

/* ------------------------------------------------------------------ */
/* Building the hub list: derived mocks + configured exams             */
/* ------------------------------------------------------------------ */

/**
 * A published daily/weekly mock becomes a scheduled national live
 * exam. Full mocks return null (on-demand — no scheduleDate), as
 * do daily/weekly mocks with no (or an impossible) scheduleDate.
 * Entry goes to the mock itself; the Job track page stays one
 * link away via jobExamSlug.
 */
export function nationalLiveExamFromMock(mock: JobMockWithId): NationalLiveExam | null {
  if (mock.kind !== 'daily' && mock.kind !== 'weekly') return null;
  if (typeof mock.scheduleDate !== 'string' || mock.scheduleDate.length === 0) return null;
  const window = dhakaDayWindowMillis(mock.scheduleDate);
  if (!window) return null;
  if (typeof mock.bundleId !== 'string' || mock.bundleId.length === 0) return null;
  return {
    id: mock.docId,
    titleBn: mock.titleBn,
    titleEn: mock.titleEn,
    category: 'job',
    track: 'job',
    window,
    entryPath: `/jobs/mock/${mock.docId}`,
    jobExamSlug: mock.examSlug,
    bundleId: mock.bundleId,
    meritExamId: mock.docId,
    source: 'published-mock',
  };
}

/** Validate one owner-announced config entry (pure). */
export function validateNationalLiveExamConfig(cfg: NationalLiveExamConfig): string[] {
  const problems: string[] = [];
  const label = `live-exam config '${cfg.id || '?'}'`;
  if (typeof cfg.id !== 'string' || cfg.id.trim().length === 0) {
    problems.push(`${label}: id must be a non-empty string`);
  }
  if (typeof cfg.titleBn !== 'string' || cfg.titleBn.trim().length === 0) {
    problems.push(`${label}: titleBn must be a non-empty string`);
  }
  if (typeof cfg.titleEn !== 'string' || cfg.titleEn.trim().length === 0) {
    problems.push(`${label}: titleEn must be a non-empty string`);
  }
  if (!isLiveExamCategory(cfg.category)) {
    problems.push(`${label}: category must be job | admission | academic`);
  }
  const startAtMillis = Date.parse(cfg.startAtDhakaISO);
  const endAtMillis = Date.parse(cfg.endAtDhakaISO);
  if (!Number.isFinite(startAtMillis)) {
    problems.push(`${label}: startAtDhakaISO is not a parseable ISO instant`);
  }
  if (!Number.isFinite(endAtMillis)) {
    problems.push(`${label}: endAtDhakaISO is not a parseable ISO instant`);
  }
  if (!/[+-]\d{2}:\d{2}$/.test(cfg.startAtDhakaISO) || !cfg.startAtDhakaISO.includes('+06:00')) {
    problems.push(`${label}: startAtDhakaISO must carry the explicit Dhaka offset +06:00`);
  }
  if (!/[+-]\d{2}:\d{2}$/.test(cfg.endAtDhakaISO) || !cfg.endAtDhakaISO.includes('+06:00')) {
    problems.push(`${label}: endAtDhakaISO must carry the explicit Dhaka offset +06:00`);
  }
  if (Number.isFinite(startAtMillis) && Number.isFinite(endAtMillis)) {
    problems.push(...validateLiveExamWindow({ startAtMillis, endAtMillis }).map((p) => `${label}: ${p}`));
  }
  if (typeof cfg.entryPath !== 'string' || !cfg.entryPath.startsWith('/')) {
    problems.push(`${label}: entryPath must be an absolute app path starting with '/'`);
  }
  if (typeof cfg.bundleId !== 'string' || cfg.bundleId.trim().length === 0) {
    problems.push(`${label}: bundleId must be a non-empty string`);
  }
  if (cfg.jobExamSlug !== undefined && cfg.jobExamSlug !== null) {
    if (typeof cfg.jobExamSlug !== 'string' || !jobExamBySlug(cfg.jobExamSlug)) {
      problems.push(`${label}: jobExamSlug '${cfg.jobExamSlug}' is not a known Job exam`);
    }
  }
  return problems;
}

/** A validated config entry becomes a hub exam; null when invalid
 * (the caller logs/skips it — an invalid entry never renders as
 * a scheduled exam). */
export function nationalLiveExamFromConfig(cfg: NationalLiveExamConfig): NationalLiveExam | null {
  if (validateNationalLiveExamConfig(cfg).length > 0) return null;
  return {
    id: cfg.id,
    titleBn: cfg.titleBn,
    titleEn: cfg.titleEn,
    category: cfg.category,
    track: cfg.category,
    window: {
      startAtMillis: Date.parse(cfg.startAtDhakaISO),
      endAtMillis: Date.parse(cfg.endAtDhakaISO),
    },
    entryPath: cfg.entryPath,
    jobExamSlug: cfg.jobExamSlug ?? null,
    bundleId: cfg.bundleId,
    meritExamId: cfg.id,
    source: 'scheduled-config',
  };
}

/**
 * The hub list: derived dated mocks + configured exams, earliest
 * start first. Invalid entries are skipped silently here — the
 * page only ever renders validated exams; use
 * `validateNationalLiveExamConfig` to surface config problems to
 * the owner instead of showing a broken card.
 */
export function buildNationalLiveExamList(args: {
  mocks: JobMockWithId[];
  configs?: NationalLiveExamConfig[];
}): NationalLiveExam[] {
  const out: NationalLiveExam[] = [];
  for (const mock of args.mocks) {
    const exam = nationalLiveExamFromMock(mock);
    if (exam) out.push(exam);
  }
  for (const cfg of args.configs ?? NATIONAL_LIVE_EXAM_SCHEDULE) {
    const exam = nationalLiveExamFromConfig(cfg);
    if (exam) out.push(exam);
  }
  out.sort(
    (a, b) => a.window.startAtMillis - b.window.startAtMillis || a.id.localeCompare(b.id),
  );
  return out;
}

/* ------------------------------------------------------------------ */
/* SINGLE COMPRESSED BUNDLE — 1 Firestore read per student             */
/* ------------------------------------------------------------------ */

export const LIVE_EXAM_BUNDLE_COLLECTION = 'jobQuestionBundles';

/** sessionStorage key for one bundle (versioned — bump on any
 * cache-shape change so a stale session never serves old bytes). */
export function liveExamBundleCacheKey(bundleId: string): string {
  return `eduvelto:live-exam-bundle:v1:${bundleId}`;
}

const KEY_MATERIAL_FIELDS = ['correctLetter', 'explanation', 'correctText'] as const;

/**
 * A bundle is usable as a live-exam question set only when it
 * holds questions + options and NOTHING key-like — neither at the
 * top level (the rules already forbid it there) nor inside any
 * question (defense in depth: a key smuggled into a question
 * would be readable before submit). Returns the problems; []
 * means usable.
 */
export function validateLiveExamBundle(data: unknown): string[] {
  const problems: string[] = [];
  if (typeof data !== 'object' || data === null) {
    return ['live-exam bundle: not an object'];
  }
  const d = data as Record<string, unknown>;
  for (const field of KEY_MATERIAL_FIELDS) {
    if (field in d) problems.push(`live-exam bundle: key field '${field}' must never be in the bundle doc`);
  }
  if (!Array.isArray(d.questions) || d.questions.length === 0) {
    problems.push('live-exam bundle: questions must be a non-empty list');
    return problems;
  }
  if (typeof d.questionCount !== 'number' || d.questionCount !== d.questions.length) {
    problems.push(
      `live-exam bundle: questionCount (${String(d.questionCount)}) must equal questions.length (${d.questions.length})`,
    );
  }
  if (d.questions.length > 200) {
    problems.push('live-exam bundle: more than 200 questions in one bundle');
  }
  d.questions.forEach((q, i) => {
    if (typeof q !== 'object' || q === null) {
      problems.push(`live-exam bundle: question ${i + 1} is not an object`);
      return;
    }
    const qq = q as Record<string, unknown>;
    for (const field of KEY_MATERIAL_FIELDS) {
      if (field in qq) {
        problems.push(`live-exam bundle: question ${i + 1} carries key field '${field}'`);
      }
    }
    if (typeof qq.questionId !== 'string' || qq.questionId.length === 0) {
      problems.push(`live-exam bundle: question ${i + 1} has no questionId`);
    }
    if (typeof qq.questionText !== 'string' || qq.questionText.trim().length === 0) {
      problems.push(`live-exam bundle: question ${i + 1} has no question text`);
    }
    if (!Array.isArray(qq.options) || qq.options.length < 2) {
      problems.push(`live-exam bundle: question ${i + 1} needs at least 2 options`);
    }
  });
  return problems;
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

/** The cached bundle for this session, or null (missing /
 * corrupt / failed validation — the loader re-reads instead). */
export function readLiveExamBundleCache(bundleId: string): PracticeBundleWithId | null {
  const store = getSessionStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(liveExamBundleCacheKey(bundleId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (validateLiveExamBundle(parsed).length > 0) return null;
    return parsed as PracticeBundleWithId;
  } catch {
    return null;
  }
}

/** Cache one bundle for the session (best-effort — a full or
 * unavailable sessionStorage must never break the exam). */
export function writeLiveExamBundleCache(bundleId: string, bundle: PracticeBundleWithId): void {
  const store = getSessionStorage();
  if (!store) return;
  try {
    store.setItem(liveExamBundleCacheKey(bundleId), JSON.stringify(bundle));
  } catch {
    // Quota / private mode: the exam still works, it just re-reads.
  }
}

export function clearLiveExamBundleCache(bundleId?: string): void {
  const store = getSessionStorage();
  if (!store) return;
  try {
    if (bundleId) {
      store.removeItem(liveExamBundleCacheKey(bundleId));
      return;
    }
    const keys: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && key.startsWith('eduvelto:live-exam-bundle:')) keys.push(key);
    }
    keys.forEach((key) => store.removeItem(key));
  } catch {
    // Best-effort only.
  }
}

// In-memory promise cache: a re-render (or a second caller in the
// same session) never triggers a second Firestore read.
const bundlePromiseCache = new Map<string, Promise<PracticeBundleWithId | null>>();

/** Test-only reset for the in-memory promise cache. */
export function clearLiveExamBundleMemoryCache(): void {
  bundlePromiseCache.clear();
}

/**
 * Load ONE bundle doc — the single compressed document holding
 * the exam's questions (1 Firestore read per student per
 * session; sessionStorage + in-memory caches absorb re-renders).
 * Returns null when the bundle is missing, unpublished, or fails
 * the key-material validation — the caller shows the honest
 * "not yet" state. NEVER loads the answer key: use
 * `loadLiveExamKeyAfterSubmit()` after submit only.
 */
export function loadLiveExamBundle(
  bundleId: string,
  opts?: { forceRefresh?: boolean },
): Promise<PracticeBundleWithId | null> {
  if (!opts?.forceRefresh) {
    const cached = bundlePromiseCache.get(bundleId);
    if (cached) return cached;
  }
  const p = (async (): Promise<PracticeBundleWithId | null> => {
    if (!opts?.forceRefresh) {
      const fromSession = readLiveExamBundleCache(bundleId);
      if (fromSession) return fromSession;
    }
    const bundle = await loadPracticeBundle(bundleId);
    if (!bundle) return null;
    if (validateLiveExamBundle(bundle).length > 0) return null;
    writeLiveExamBundleCache(bundleId, bundle);
    return bundle;
  })();
  bundlePromiseCache.set(bundleId, p);
  return p;
}

/**
 * The answer key for a bundle — ONLY after submit. The caller
 * MUST pass `submitted: true` only when the student has a
 * SUBMITTED attempt/session for this bundle; the Firestore rule
 * then additionally requires a fresh exam_review receipt
 * (10-minute window, jobReceipts/{uid}_{bundleId}) anchored to
 * that submission. Calling with `submitted: false` throws
 * instead of attempting the read — a pre-submit key read must
 * fail loudly in code, not silently return null. (Same gate as
 * the Job mock: jobMock.submitMockAttempt → receipt →
 * loadMockKey.)
 */
export async function loadLiveExamKeyAfterSubmit(
  bundleId: string,
  submitted: boolean,
): Promise<JobQuestionKey | null> {
  if (!submitted) {
    throw new Error(
      'live-exam key: refused — the answer key is readable only after submit (fresh exam_review receipt)',
    );
  }
  return loadBundleKey(bundleId);
}
