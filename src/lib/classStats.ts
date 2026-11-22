// Eduvelto — loader-maintained class stats (fix/read-usage, 22 Nov 2026).
//
// One stats doc per class level replaces the dashboard's full-list
// reads: the dashboard reads 1 doc for every count/total instead of
// 439 books + 199 quizzes (Honours). Stats docs are written by the
// loaders (scripts/load-library-content.mjs, scripts/load-quizzes.mjs)
// and by scripts/write-class-stats.mjs — never by the client.
//
// PLACEMENT (zero rules change): docs live in `leaderboardSnapshots`
// as `classStats-<slug>` with `kind: 'classStats'` (see
// scripts/build-class-stats.mjs for why: that collection is already
// public-read + moderator-write with no client listers). A stats doc
// carries ONLY aggregates + quiz titles — no questions, no answer keys
// — so public read is safe. Guests see the quiz COUNT; the quiz LIST
// stays signed-in-only.
//
// SESSION CACHE: a stats doc is read at most once per session per slug
// (module-level cache, same pattern as the search-path caches in
// lib/content.ts). Navigating away and back costs 0 extra reads.
//
// FALLBACK: getClassStats returns null when the doc does not exist yet
// (before the first loader run that writes stats). Callers MUST fall
// back to the full-list listers in that case — never show a zero.
// Stale stats (content changed outside the loaders) self-heal on the
// next loader run.

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CLASS_LEVELS } from './classLevels';

export const CLASS_STATS_COLLECTION = 'leaderboardSnapshots';

export function classStatsDocId(slug: string): string {
  return `classStats-${slug}`;
}

export interface ClassSubjectStats {
  name: string;
  bookCount: number;
  questionCount: number;
  chapterCount: number;
  quizCount: number;
}

export interface ClassStats {
  slug: string;
  educationType: string | null;
  classLevels: string[];
  bookCount: number;
  quizCount: number;
  totalQuestions: number;
  totalChapters: number;
  totalQuizQuestions: number;
  subjects: ClassSubjectStats[];
  /** quizId -> display title (suffix stripped), for the Results tab. */
  quizTitles: Record<string, string>;
  updatedAt: string | null;
}

function toClassStats(id: string, data: Record<string, unknown>): ClassStats {
  const subjects = Array.isArray(data.subjects)
    ? (data.subjects as Array<Record<string, unknown>>).map((s) => ({
        name: String(s.name ?? ''),
        bookCount: Number(s.bookCount ?? 0),
        questionCount: Number(s.questionCount ?? 0),
        chapterCount: Number(s.chapterCount ?? 0),
        quizCount: Number(s.quizCount ?? 0),
      }))
    : [];
  return {
    slug: String(data.slug ?? id.replace(/^classStats-/, '')),
    educationType: (data.educationType as string | null) ?? null,
    classLevels: Array.isArray(data.classLevels)
      ? (data.classLevels as string[])
      : [],
    bookCount: Number(data.bookCount ?? 0),
    quizCount: Number(data.quizCount ?? 0),
    totalQuestions: Number(data.totalQuestions ?? 0),
    totalChapters: Number(data.totalChapters ?? 0),
    totalQuizQuestions: Number(data.totalQuizQuestions ?? 0),
    subjects,
    quizTitles: (data.quizTitles as Record<string, string>) ?? {},
    updatedAt:
      typeof data.updatedAt === 'string'
        ? data.updatedAt
        : (data.updatedAt as { toDate?: () => Date } | null)?.toDate?.().toISOString() ?? null,
  };
}

const statsCache = new Map<string, Promise<ClassStats | null>>();

/** One stats doc (1 read, cached per session). Null when not written yet. */
export function getClassStats(slug: string): Promise<ClassStats | null> {
  const cached = statsCache.get(slug);
  if (cached) return cached;
  const p = (async (): Promise<ClassStats | null> => {
    if (!db) return null;
    const snap = await getDoc(doc(db, CLASS_STATS_COLLECTION, classStatsDocId(slug)));
    if (!snap.exists()) return null;
    return toClassStats(snap.id, snap.data() as Record<string, unknown>);
  })();
  statsCache.set(slug, p);
  return p;
}

/** All five level stats docs (5 reads, cached per session). */
export function getAllClassStats(): Promise<Array<ClassStats | null>> {
  return Promise.all(CLASS_LEVELS.map((def) => getClassStats(def.slug)));
}
