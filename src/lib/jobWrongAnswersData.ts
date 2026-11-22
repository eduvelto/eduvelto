// Eduvelto — Job wrong-answer notebook data (Step 13).
//
// Thin Firestore layer for /jobs/wrong-answers. One-shot
// getDoc/getDocs only — NO onSnapshot. Bounded reads: at most
// 50 practice + 50 mock attempts (newest first), plus one
// getDoc per distinct source bundle (usually 1–3) for the
// question texts. The page says so when a list hits its cap,
// so a capped window is never presented as a lifetime total.
//
// NO new collections, NO new rules: attempts come from the
// Step 8/9 collections (owner-read rules already proven by
// the Step 10 r-tests), bundles from the public bundle read,
// keys from the Step 7 practice-key read. A mock bundle's key
// is receipt-gated (Step 9) — the explanation loader therefore
// falls back to the question's TOPIC bundle key when the
// source is a mock bundle, and says so plainly when neither
// key is readable.

import { attemptSummaryFromStored, type JobAttemptSummary } from './jobAnalysis';
import {
  listJobAttempts,
  loadBundleKey,
  loadPracticeBundle,
  type PracticeBundleWithId,
} from './jobPractice';
import { listMockAttempts } from './jobMock';
import type { JobQuestionKey } from './jobQuestions';

/** Practice + mock attempts, newest first. `capped` is true
 * when either list hit its limit — the notebook then covers
 * the most recent attempts only, never a lifetime total. */
export async function loadNotebookAttempts(
  uid: string,
): Promise<{ attempts: JobAttemptSummary[]; capped: boolean }> {
  const [practice, mocks] = await Promise.all([
    listJobAttempts(uid, 50),
    listMockAttempts(uid, 50),
  ]);
  const attempts = [
    ...practice.map((a) => attemptSummaryFromStored(a.docId, a)),
    ...mocks.map((a) => attemptSummaryFromStored(a.docId, a)),
  ].sort((a, b) => (b.submittedAtMillis ?? 0) - (a.submittedAtMillis ?? 0));
  return { attempts, capped: practice.length >= 50 || mocks.length >= 50 };
}

/** Question text + options for one question, from its source
 * bundle. `bundleKind` is the source bundle's kind — a mock
 * bundle's text is the question the student actually saw. */
export interface NotebookQuestionText {
  questionText: string;
  options: Array<{ letter: string; text: string }>;
  bundleId: string;
  bundleKind: string;
}

/** Load the question texts for the notebook's entries: one
 * getDoc per DISTINCT source bundle (the attempt's own
 * bundleId — the text the student actually saw). A bundle
 * that no longer exists is skipped — its questions render
 * with the honest "text not found" note, never a guessed
 * text. */
export async function loadNotebookQuestionTexts(
  attempts: JobAttemptSummary[],
  questionIds: string[],
): Promise<Map<string, NotebookQuestionText>> {
  const wanted = new Set(questionIds);
  const bundleIds = new Set<string>();
  for (const a of attempts) {
    if (a.bundleId) bundleIds.add(a.bundleId);
  }
  const out = new Map<string, NotebookQuestionText>();
  const bundles = await Promise.all(
    [...bundleIds].map((id) => loadPracticeBundle(id).catch(() => null)),
  );
  for (const bundle of bundles) {
    if (!bundle) continue;
    for (const q of bundle.questions) {
      if (!wanted.has(q.questionId) || out.has(q.questionId)) continue;
      out.set(q.questionId, {
        questionText: q.questionText,
        options: q.options.map((o) => ({ letter: o.letter, text: o.text })),
        bundleId: bundle.docId,
        bundleKind: bundle.kind,
      });
    }
  }
  return out;
}

export interface NotebookExplanation {
  /** The key's explanation for this question. */
  explanation: string;
  correctLetter: string;
  correctText: string;
  /** Why the student's picked option was wrong, when the key
   * says so (may be null — the key does not always carry it). */
  whyWrongText: string | null;
  /** Where the explanation came from, in plain words. */
  sourceBn: string;
}

const keyCache = new Map<string, JobQuestionKey | null>();

async function cachedKey(bundleId: string): Promise<JobQuestionKey | null> {
  if (keyCache.has(bundleId)) return keyCache.get(bundleId) ?? null;
  const key = await loadBundleKey(bundleId).catch(() => null);
  keyCache.set(bundleId, key);
  return key;
}

/** The explanation for one notebook question. Tries the
 * SOURCE bundle's key first (practice keys are open to a
 * signed-in student, Step 7); when the source is a mock
 * bundle — whose key is receipt-gated (Step 9) — it falls
 * back to the question's TOPIC bundle key (same bank
 * question, same explanation). Returns null when neither
 * key is readable or the question is not in either key — the
 * card then links to the attempt's result page instead of
 * showing a guessed explanation. */
export async function loadNotebookExplanation(args: {
  questionId: string;
  topicId: string;
  sourceBundleId: string;
  sourceBundleKind: string;
  selectedLetter: string | null;
}): Promise<NotebookExplanation | null> {
  const topicBundleId = `topic__${args.topicId}`;
  const candidates: Array<{ bundleId: string; sourceBn: string }> = [];
  if (args.sourceBundleKind === 'topic' || args.sourceBundleKind === 'previous') {
    candidates.push({ bundleId: args.sourceBundleId, sourceBn: 'এই অনুশীলন সেটের ব্যাখ্যা' });
  }
  if (args.sourceBundleId !== topicBundleId) {
    candidates.push({ bundleId: topicBundleId, sourceBn: 'এই টপিকের অনুশীলন সেটের ব্যাখ্যা' });
  }
  for (const c of candidates) {
    const key = await cachedKey(c.bundleId);
    const a = key?.answers.find((x) => x.questionId === args.questionId);
    if (!a) continue;
    return {
      explanation: a.explanation,
      correctLetter: a.correctLetter,
      correctText: a.correctText,
      whyWrongText:
        args.selectedLetter === null ? null : (a.whyWrong?.[args.selectedLetter] ?? null),
      sourceBn: c.sourceBn,
    };
  }
  return null;
}

/** Re-export for the practice page: the topic bundle + key
 * a re-practice session runs on. */
export type { PracticeBundleWithId };
