/**
 * Eduvelto Job Preparation — question-pool loader + verifier
 * (design-live-exam-dashboard.md §3.7).
 *
 * Pool docs live in `examQuestionPools` — the collection agent A
 * already landed (rules + backup coverage + migration builder).
 * This module does NOT create a parallel `jobQuestionPools`
 * collection: the design §3.7 name predates agent A's build,
 * and the reuse principle (§7) forbids two collections meaning
 * the same thing. Pool IDs follow agent A's scheme
 * (`pool__{exam}__{kind}__{subject}__{topic}__{difficulty}__{n}`)
 * — see `examQuestionPoolIdFor` in `./jobBankSelection`.
 *
 * READ PERMISSION (rules): `examQuestionPools` is
 * Moderator-read ONLY — a student client CANNOT read pool docs
 * (that is what makes the §3.8 gate-1 verdict what it is: the
 * client-side selector cannot read the pools at start time).
 * `loadPoolsForExam()` is therefore an ADMIN/DEBUG loader, not
 * a student-path loader — the Live Exam client path reads
 * published MANIFESTS (student-readable when published), never
 * pools. Do not call this from a student-facing page.
 *
 * Pools carry IDs ONLY (§4.3): `verifyPoolDocsContainIdsOnly()`
 * asserts no pool doc carries question text, options, or
 * answers — a pool doc that did would be a leak surface.
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import {
  examQuestionPoolIdFor,
  type ExamQuestionPool,
  type PoolKind,
} from './jobBankSelection';

export { examQuestionPoolIdFor };
export type { ExamQuestionPool, PoolKind };

/** The only keys a pool doc may carry (agent A's shape). */
export const POOL_DOC_KEYS = [
  'poolId',
  'examId',
  'subjectId',
  'topicId',
  'difficulty',
  'poolKind',
  'questionIds',
  'chunkIndex',
  'chunkCount',
  'generatedAt',
  'bankVersion',
  'selectionRulesVersion',
  'eligibleCount',
] as const;

/**
 * Load an exam's pool docs (Moderator-only read — see the
 * header). One `examId ==` filter + client-side kind filter
 * (no composite index). Sorted by poolId. Malformed docs are
 * skipped, never thrown — a bad pool must never break an admin
 * tool. Returns [] when Firestore is not configured.
 */
export async function loadPoolsForExam(
  examId: string,
  poolKind?: PoolKind,
): Promise<ExamQuestionPool[]> {
  const firestore = db;
  if (!firestore) return [];
  const snap = await getDocs(
    query(collection(firestore, 'examQuestionPools'), where('examId', '==', examId)),
  );
  const out: ExamQuestionPool[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    if (
      typeof data.poolId !== 'string'
      || typeof data.subjectId !== 'string'
      || typeof data.topicId !== 'string'
      || !['easy', 'medium', 'hard'].includes(String(data.difficulty))
      || !['scored', 'practice'].includes(String(data.poolKind))
      || !Array.isArray(data.questionIds)
      || !data.questionIds.every((id) => typeof id === 'string')
    ) {
      continue;
    }
    const pool = data as unknown as ExamQuestionPool;
    if (poolKind && pool.poolKind !== poolKind) continue;
    out.push(pool);
  }
  out.sort((a, b) => (a.poolId < b.poolId ? -1 : a.poolId > b.poolId ? 1 : 0));
  return out;
}

/**
 * Assert pool docs carry IDs ONLY (§4.3 — no question text,
 * options, or answers). Returns problem strings; empty = the
 * pools are safe to publish. A pool doc that carried answers
 * would leak them to every Moderator read — and, if the read
 * rule ever widened, to students.
 */
export function verifyPoolDocsContainIdsOnly(pools: unknown): string[] {
  const problems: string[] = [];
  if (!Array.isArray(pools)) return ['pools: must be a list'];
  pools.forEach((p, i) => {
    const label = `pools[${i}]`;
    if (typeof p !== 'object' || p === null || Array.isArray(p)) {
      problems.push(`${label}: must be an object`);
      return;
    }
    const d = p as Record<string, unknown>;
    for (const k of Object.keys(d)) {
      if (!(POOL_DOC_KEYS as readonly string[]).includes(k)) {
        problems.push(`${label}: forbidden field '${k}' (pools carry IDs only)`);
      }
    }
    for (const leak of ['questionText', 'question', 'options', 'correctLetter', 'correctText', 'correctAnswer', 'explanation', 'whyWrong']) {
      if (leak in d) problems.push(`${label}: leak field '${leak}' must never be in a pool doc`);
    }
    if (!Array.isArray(d.questionIds)) {
      problems.push(`${label}: questionIds must be a list`);
    } else {
      if (d.questionIds.length > 200) {
        problems.push(`${label}: questionIds has ${d.questionIds.length} IDs (max 200 per chunk)`);
      }
      if (d.questionIds.some((id) => typeof id !== 'string')) {
        problems.push(`${label}: questionIds must all be strings`);
      }
      if (new Set(d.questionIds as string[]).size !== (d.questionIds as string[]).length) {
        problems.push(`${label}: questionIds contains duplicates`);
      }
    }
  });
  return problems;
}
