/**
 * Eduvelto — National Live Exam merit list (sprint Day 5).
 *
 * REAL-TIME NATIONAL MERIT LIST, reusing `leaderboardSnapshots`
 * (zero rules change — the classStats precedent, classStats.ts):
 * one doc per live exam, `liveMerit-{examId}`, `kind: 'liveMerit'`,
 * public read + moderator-only write (firestore.rules ~line 2822:
 * `allow read: if true; allow write: if isModerator();`). The doc
 * carries ONLY aggregates a public list needs — rank inputs
 * (display name, score, total marks, time) — never questions,
 * never answer keys, never emails or uids beyond the display
 * name the student chose. Merit docs are written by a moderator
 * (Admin SDK / moderator console) from the submitted attempts —
 * the client NEVER writes them (the rules deny it).
 *
 * WHY A SNAPSHOT, NOT A CLIENT-SIDE RANKING OF ATTEMPTS: a
 * student can read only their OWN attempts
 * (`users/{uid}/jobAttempts` is owner-only), so no client can
 * ever assemble the national ranking from attempt docs. Any
 * "rank from attempts" here is therefore only ever a ranking of
 * the attempts the CALLER is already allowed to read (their own,
 * or a list a moderator handed over) — see `rankLiveExamEntries`.
 * The national list itself always comes from the snapshot.
 *
 * FRESHNESS: the list is live — the loader re-reads the snapshot
 * doc at most once per 30s per exam (module TTL cache) so a
 * re-render never costs a read, while the page's 60s refresh
 * still sees new scores. No sessionStorage: a stale cached merit
 * list is worse than one extra doc read.
 */

import { doc, getDoc } from 'firebase/firestore';
import type { Lang } from '../i18n/strings';
import { db } from '../firebase';

/** The reused collection (public-read, moderator-write). */
export const LIVE_MERIT_COLLECTION = 'leaderboardSnapshots';

/** Kind tag inside the doc — a `classStats-*` doc must never be
 * mistaken for a merit list (both live in the same collection). */
export const LIVE_MERIT_KIND = 'liveMerit';

/** Snapshot doc id for an exam. Throws on an unsafe id — the id
 * goes straight into a doc path, so only [A-Za-z0-9_-] is allowed. */
export function liveMeritDocId(examId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(examId)) {
    throw new Error(`live-merit: unsafe examId '${examId}' (only letters, digits, _ and -)`);
  }
  return `liveMerit-${examId}`;
}

/** One merit row as stored in the snapshot (rank is NOT trusted
 * from storage — it is recomputed by `rankLiveExamEntries`). */
export interface LiveMeritEntryInput {
  /** Display name only — never an email, phone or uid. */
  name: string;
  score: number;
  totalMarks?: number | null;
  /** Seconds taken; null when the attempt has no recorded time. */
  timeSeconds?: number | null;
}

export interface LiveMeritEntry extends LiveMeritEntryInput {
  /** Competition rank ("1224"): equal score + equal time share
   * a rank, and the next rank skips ahead. */
  rank: number;
  score: number;
  totalMarks: number | null;
  timeSeconds: number | null;
}

export interface LiveMeritList {
  examId: string;
  entries: LiveMeritEntry[];
  updatedAtMillis: number | null;
}

/** Is this a usable merit row? Bad rows are dropped, never shown
 * as a zero — a corrupt row must not push a real student down. */
export function isUsableMeritEntry(value: unknown): value is LiveMeritEntryInput {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Record<string, unknown>;
  if (typeof e.name !== 'string' || e.name.trim().length === 0) return false;
  if (typeof e.score !== 'number' || !Number.isFinite(e.score) || e.score < 0) return false;
  if (e.totalMarks !== undefined && e.totalMarks !== null) {
    if (typeof e.totalMarks !== 'number' || !Number.isFinite(e.totalMarks) || e.totalMarks <= 0) {
      return false;
    }
  }
  if (e.timeSeconds !== undefined && e.timeSeconds !== null) {
    if (typeof e.timeSeconds !== 'number' || !Number.isFinite(e.timeSeconds) || e.timeSeconds < 0) {
      return false;
    }
  }
  return true;
}

function normaliseEntry(e: LiveMeritEntryInput): Omit<LiveMeritEntry, 'rank'> {
  return {
    name: e.name.trim(),
    score: e.score,
    totalMarks: e.totalMarks ?? null,
    timeSeconds: e.timeSeconds ?? null,
  };
}

/** "Strictly better": higher score wins; on equal scores the
 * faster time wins; an entry with no recorded time loses to any
 * recorded time on equal scores. */
function isStrictlyBetter(a: Omit<LiveMeritEntry, 'rank'>, b: Omit<LiveMeritEntry, 'rank'>): boolean {
  if (a.score !== b.score) return a.score > b.score;
  if (a.timeSeconds === null && b.timeSeconds === null) return false;
  if (a.timeSeconds === null) return false;
  if (b.timeSeconds === null) return true;
  return a.timeSeconds < b.timeSeconds;
}

/**
 * Rank a list of entries (pure). Sort: score desc, time asc
 * (unrecorded time last), name asc as the final deterministic
 * tiebreak for display only. Rank is competition rank: entries
 * with equal score AND equal time share a rank. Invalid rows are
 * dropped. Use for the snapshot's entries AND for any attempt
 * list the caller is allowed to read — never as a claim about
 * the whole nation unless the input IS the whole nation.
 */
export function rankLiveExamEntries(entries: unknown[]): LiveMeritEntry[] {
  const usable = (entries as unknown[]).filter(isUsableMeritEntry).map(normaliseEntry);
  usable.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.timeSeconds === null && b.timeSeconds === null) return a.name.localeCompare(b.name, 'bn');
    if (a.timeSeconds === null) return 1;
    if (b.timeSeconds === null) return -1;
    if (a.timeSeconds !== b.timeSeconds) return a.timeSeconds - b.timeSeconds;
    return a.name.localeCompare(b.name, 'bn');
  });
  return usable.map((entry) => ({
    ...entry,
    // Competition rank: 1 + the number of strictly-better entries.
    rank: 1 + usable.filter((other) => isStrictlyBetter(other, entry)).length,
  }));
}

function timestampToMillis(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'object') {
    const v = value as { toDate?: () => Date; seconds?: number };
    if (typeof v.toDate === 'function') {
      try {
        return v.toDate().getTime();
      } catch {
        return null;
      }
    }
    if (typeof v.seconds === 'number') return v.seconds * 1000;
  }
  return null;
}

/**
 * Parse a `leaderboardSnapshots/liveMerit-{examId}` doc (pure).
 * Null when the doc is missing, is not a merit doc
 * (kind !== 'liveMerit'), or holds no usable entries — the page
 * then shows the honest "merit list not published yet" state,
 * never an empty table presented as a result.
 */
export function parseLiveMeritSnapshot(
  examId: string,
  data: unknown,
): LiveMeritList | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.kind !== LIVE_MERIT_KIND) return null;
  if (!Array.isArray(d.entries)) return null;
  const entries = rankLiveExamEntries(d.entries);
  if (entries.length === 0) return null;
  return {
    examId,
    entries,
    updatedAtMillis: timestampToMillis(d.updatedAt ?? d.updatedAtMillis ?? null),
  };
}

/** "১২:৩৪" / "12:34" (mm:ss) — "—" when no time was recorded. */
export function formatMeritTime(timeSeconds: number | null, lang: Lang = 'bn'): string {
  if (timeSeconds === null || timeSeconds === undefined) return '—';
  const total = Math.max(0, Math.floor(timeSeconds));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  if (lang !== 'bn') return `${mm}:${ss}`;
  const bn = (s: string): string => s.replace(/[0-9]/g, (c) => '০১২৩৪৫৬৭৮৯'[Number(c)]);
  return `${bn(mm)}:${bn(ss)}`;
}

// Short TTL cache (30s): the merit list is live, so a re-render
// reuses the last read but a refresh after 30s sees new scores.
const MERIT_TTL_MILLIS = 30_000;
const meritCache = new Map<string, { at: number; promise: Promise<LiveMeritList | null> }>();

/** Test-only reset for the TTL cache. */
export function clearLiveMeritCache(): void {
  meritCache.clear();
}

/**
 * Load one merit snapshot doc (1 Firestore read per exam per
 * 30s at most). Null when Firebase is not configured, the doc
 * does not exist yet, or it is not a merit doc.
 */
export function getLiveMeritSnapshot(
  examId: string,
  opts?: { forceRefresh?: boolean; nowMillis?: number },
): Promise<LiveMeritList | null> {
  const now = opts?.nowMillis ?? Date.now();
  if (!opts?.forceRefresh) {
    const hit = meritCache.get(examId);
    if (hit && now - hit.at < MERIT_TTL_MILLIS) return hit.promise;
  }
  const p = (async (): Promise<LiveMeritList | null> => {
    if (!db) return null;
    const snap = await getDoc(doc(db, LIVE_MERIT_COLLECTION, liveMeritDocId(examId)));
    if (!snap.exists()) return null;
    return parseLiveMeritSnapshot(examId, snap.data());
  })();
  meritCache.set(examId, { at: now, promise: p });
  return p;
}
