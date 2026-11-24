/**
 * Eduvelto Job Preparation — written submissions data layer
 * (design-grades-written-previous-admin.md §2.7).
 *
 * Release 1 (this build): submissions are LOCAL DRAFTS only.
 * The submit button saves a local record and states plainly that
 * server-side saving is not yet on — nothing is silently lost, and
 * nothing is silently sent. The Firestore layer below (loaders +
 * writers) is prepared for Phase 4, when the rules change lands;
 * it is NOT wired to any submit button yet, because the rules are
 * not deployed and a write would fail.
 *
 * Immutability rule (§2.7): `writtenSubmissions` docs are never
 * updated after creation. A resubmission is a NEW doc with
 * version + 1. Privacy: only the owner (and, for teacher review,
 * the assigned reviewer via the admin path) may read a submission.
 * No submission text is ever sent to any AI provider without the
 * student's explicit per-submission consent tap.
 */

import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { countWords } from './jobWritten';
import type { WrittenQuestion } from './jobWrittenContent';

export interface LocalWrittenDraft {
  questionId: string;
  text: string;
  wordCount: number;
  savedAt: string;
  /** Self-check answers: dimension key -> question index -> yes/no. */
  selfCheck: Record<string, Record<string, boolean>>;
  /** Server-side saving is NOT on yet — this draft lives on the device only. */
  serverSaved: false;
}

const DRAFT_KEY_PREFIX = 'eduvelto-written-draft:';

export function localDraftKey(questionId: string): string {
  return `${DRAFT_KEY_PREFIX}${questionId}`;
}

export function loadLocalDraft(questionId: string): LocalWrittenDraft | null {
  try {
    const raw = localStorage.getItem(localDraftKey(questionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalWrittenDraft;
    if (typeof parsed.text !== 'string' || typeof parsed.questionId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalDraft(draft: Omit<LocalWrittenDraft, 'serverSaved'>): LocalWrittenDraft {
  const full: LocalWrittenDraft = { ...draft, serverSaved: false };
  try {
    localStorage.setItem(localDraftKey(draft.questionId), JSON.stringify(full));
  } catch {
    // Storage full / private mode — the draft stays in memory only;
    // the page says so plainly instead of pretending it saved.
  }
  return full;
}

export function clearLocalDraft(questionId: string): void {
  try {
    localStorage.removeItem(localDraftKey(questionId));
  } catch {
    // Ignore — the draft is already gone from the page's view.
  }
}

/** A local "submission": an immutable snapshot kept on the device.
 * Version increments per question on this device; the server-side
 * version (Phase 4) restarts from the Firestore count. */
export interface LocalWrittenSubmission {
  submissionId: string;
  questionId: string;
  version: number;
  submittedText: string;
  wordCount: number;
  submittedAt: string;
  status: 'submitted' | 'self-checked';
  selfCheck: Record<string, Record<string, boolean>>;
  serverSaved: false;
}

const SUBMISSION_KEY_PREFIX = 'eduvelto-written-submission:';

export function localSubmissionKey(questionId: string, version: number): string {
  return `${SUBMISSION_KEY_PREFIX}${questionId}:v${version}`;
}

export function listLocalSubmissions(questionId: string): LocalWrittenSubmission[] {
  const out: LocalWrittenSubmission[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(`${SUBMISSION_KEY_PREFIX}${questionId}:v`)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as LocalWrittenSubmission;
      if (typeof parsed.submittedText === 'string') out.push(parsed);
    }
  } catch {
    return [];
  }
  return out.sort((a, b) => a.version - b.version);
}

export function saveLocalSubmission(args: {
  questionId: string;
  text: string;
  selfCheck: Record<string, Record<string, boolean>>;
}): LocalWrittenSubmission {
  const existing = listLocalSubmissions(args.questionId);
  const version = existing.length + 1;
  const sub: LocalWrittenSubmission = {
    submissionId: `local-${args.questionId}-v${version}`,
    questionId: args.questionId,
    version,
    submittedText: args.text,
    wordCount: countWords(args.text),
    submittedAt: new Date().toISOString(),
    status: Object.keys(args.selfCheck).length > 0 ? 'self-checked' : 'submitted',
    selfCheck: args.selfCheck,
    serverSaved: false,
  };
  try {
    localStorage.setItem(localSubmissionKey(args.questionId, version), JSON.stringify(sub));
  } catch {
    // Storage full — the submission is shown once and the page says so.
  }
  return sub;
}

/* ------------------------------------------------------------------ */
/* Firestore layer — PREPARED for Phase 4 (rules not deployed yet)     */
/* ------------------------------------------------------------------ */

export interface WrittenSubmissionDoc {
  submissionId: string;
  uid: string;
  questionId: string;
  version: number;
  submittedText: string;
  wordCount: number | null;
  submittedAt: unknown;
  status: 'submitted' | 'self-checked' | 'teacher-reviewed' | 'ai-reviewed';
  selfCheck?: Record<string, boolean | string>;
}

export interface WrittenFeedbackDoc {
  feedbackId: string;
  submissionId: string;
  /** Owner of the submission — the rules let the owner read their own feedback. */
  uid: string;
  questionId: string;
  rubricVersion: string;
  evaluationType: 'self' | 'teacher' | 'ai';
  criteria: Array<{ dimension: string; score: number | null; max: number; comment: string; confidence: string }>;
  corrections: Array<{ original: string; improved: string; note: string }>;
  strengths: string[];
  improvements: string[];
  factualWarnings: string[];
  overallFeedback: string;
  generatedAt: unknown;
}

/** Load the published written questions for one exam (Phase 4). */
export async function loadWrittenQuestionsForExam(examSlug: string): Promise<WrittenQuestion[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'writtenQuestions'),
    where('examSlug', '==', examSlug),
    where('status', '==', 'published'),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WrittenQuestion);
}

/** Load one written question doc (Phase 4). */
export async function loadWrittenQuestionDoc(questionId: string): Promise<WrittenQuestion | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'writtenQuestions', questionId));
  if (!snap.exists()) return null;
  return snap.data() as WrittenQuestion;
}

/** Create an immutable submission (Phase 4 — never update after create). */
export async function createWrittenSubmission(args: {
  uid: string;
  questionId: string;
  version: number;
  text: string;
  selfCheck?: Record<string, boolean | string>;
}): Promise<string> {
  if (!db) throw new Error('Firestore is not initialised');
  const submissionId = `${args.uid.slice(0, 8)}-${args.questionId}-v${args.version}-${Date.now()}`;
  const ref = doc(db, 'writtenSubmissions', submissionId);
  const payload: WrittenSubmissionDoc = {
    submissionId,
    uid: args.uid,
    questionId: args.questionId,
    version: args.version,
    submittedText: args.text,
    wordCount: countWords(args.text),
    submittedAt: new Date().toISOString(),
    status: 'submitted',
    selfCheck: args.selfCheck ?? {},
  };
  await setDoc(ref, payload);
  return submissionId;
}
