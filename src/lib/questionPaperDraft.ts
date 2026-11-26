// Eduvelto — Question Paper Generator: draft autosave.
//
// Comparison fixes, 26 Nov 2026 (D — Proshnobanai claims autosave):
// the wizard's setup + selections are persisted to localStorage on
// every change (debounced by the caller) and restored on load, so a
// refresh or tab-close does not lose the teacher's work. The paper
// itself is NOT saved — only the wizard state; the teacher
// regenerates the paper from the restored selections.
//
// Local only — never sent anywhere, never a Firestore write. A
// version key invalidates drafts from older shapes. The draft is
// cleared explicitly (the UI offers "ড্রাফট মুছে ফেলুন") and never
// auto-cleared, so a teacher who returns days later still finds it.

import type {
  QpgCognitiveLevel,
  QpgPaperSetup,
  QpgPrimaryTerm,
  QpgQuestionNature,
  QpgQuestionSource,
  QpgSecondaryExamKind,
  QpgSecondaryQKind,
  QpgSetCode,
  QpgStream,
} from './questionPaper';

export const QPG_DRAFT_VERSION = 'v1';
export const QPG_DRAFT_KEY = `eduvelto-qpg-draft:${QPG_DRAFT_VERSION}`;

/** Wizard state worth restoring. Everything is a plain JSON value —
 *  no functions, no dates-as-Date. */
export interface QpgDraft {
  version: typeof QPG_DRAFT_VERSION;
  stream: QpgStream;
  classId: string;
  subjectId: string;
  chapterIds: string[];
  topicIds: string[];
  exerciseIds: string[];
  term: QpgPrimaryTerm;
  examKind: QpgSecondaryExamKind;
  qKind: QpgSecondaryQKind;
  sourceFilter: QpgQuestionSource | 'any';
  cognitiveFilter: QpgCognitiveLevel | 'any';
  natureFilter: QpgQuestionNature | 'any';
  selectedIds: string[];
  /** Paper-setup overrides (the free editable fields). */
  overrides: Partial<QpgPaperSetup>;
  templateId: string;
  setCode: '' | QpgSetCode;
  seed: number;
  includeOmrSheet: boolean;
  /** When the draft was last saved (ISO string). */
  savedAt: string;
}

const STREAMS: QpgStream[] = ['general', 'madrasah', 'job_admission'];
const TERMS: QpgPrimaryTerm[] = ['first', 'second', 'third'];
const EXAM_KINDS: QpgSecondaryExamKind[] = ['half-yearly', 'annual'];
const Q_KINDS: QpgSecondaryQKind[] = ['mcq', 'creative', 'combined', 'written'];
const SET_CODES: Array<'' | QpgSetCode> = ['', 'ক', 'খ', 'গ', 'ঘ'];

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validate a parsed draft — returns the draft or null. Never
 *  throws; a corrupt / old / wrong-shaped value is just "no draft". */
export function validateQpgDraft(parsed: unknown): QpgDraft | null {
  if (!isPlainObject(parsed)) return null;
  if (parsed.version !== QPG_DRAFT_VERSION) return null;
  if (!STREAMS.includes(parsed.stream as QpgStream)) return null;
  if (typeof parsed.classId !== 'string' || typeof parsed.subjectId !== 'string') return null;
  if (!isStringArray(parsed.chapterIds) || !isStringArray(parsed.topicIds)) return null;
  if (!isStringArray(parsed.exerciseIds) || !isStringArray(parsed.selectedIds)) return null;
  if (!TERMS.includes(parsed.term as QpgPrimaryTerm)) return null;
  if (!EXAM_KINDS.includes(parsed.examKind as QpgSecondaryExamKind)) return null;
  if (!Q_KINDS.includes(parsed.qKind as QpgSecondaryQKind)) return null;
  if (typeof parsed.sourceFilter !== 'string') return null;
  if (typeof parsed.cognitiveFilter !== 'string') return null;
  if (typeof parsed.natureFilter !== 'string') return null;
  if (!isPlainObject(parsed.overrides)) return null;
  if (typeof parsed.templateId !== 'string') return null;
  if (!SET_CODES.includes(parsed.setCode as '' | QpgSetCode)) return null;
  if (typeof parsed.seed !== 'number' || !Number.isFinite(parsed.seed)) return null;
  if (typeof parsed.includeOmrSheet !== 'boolean') return null;
  if (typeof parsed.savedAt !== 'string') return null;
  return parsed as unknown as QpgDraft;
}

export function saveQpgDraft(draft: QpgDraft): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(QPG_DRAFT_KEY, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

export function loadQpgDraft(): QpgDraft | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(QPG_DRAFT_KEY);
    if (!raw) return null;
    return validateQpgDraft(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function clearQpgDraft(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(QPG_DRAFT_KEY);
  } catch {
    // ignore
  }
}
