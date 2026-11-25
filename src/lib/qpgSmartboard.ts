// Eduvelto — Question Paper Generator Phase 2: Smartboard model.
//
// Own Canvas 2D implementation — explicitly NO Excalidraw (spec §2).
// A board turns a saved/generated paper into slides: each question is
// a slide (separate-slides mode, default) or the whole paper is one
// slide (whole-paper mode). The teacher draws/writes over the
// question, reveals the answer, runs a timer, and shares the board.
//
// Pure TypeScript — no Firestore, no DOM. The page renders slides on
// <canvas> and persists the board doc to the `qpgBoards` collection
// (see ./qpgFirestore; rules in firestore.rules — branch only, not
// deployed). Annotations are strokes/shapes/text as JSON; no images
// in Phase 2, so board docs stay small. Questions on slides are
// rendered from the paper's own verified data (the paper snapshot
// rides the board document — never re-fetched per slide).

import type { QpgPaper, QpgQuestion } from './questionPaper';

/** Drawing tools on the board toolbar (own Canvas 2D — no library). */
export type QpgBoardTool =
  | 'pen'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'text'
  | 'eraser';

export interface QpgBoardPoint {
  x: number;
  y: number;
}

export type QpgBoardAnnotation =
  | {
      kind: 'stroke';
      id: string;
      points: QpgBoardPoint[];
      color: string;
      width: number;
    }
  | {
      kind: 'shape';
      id: string;
      shape: 'rectangle' | 'ellipse' | 'line' | 'arrow';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      width: number;
    }
  | {
      kind: 'text';
      id: string;
      x: number;
      y: number;
      text: string;
      color: string;
      fontSize: number;
    };

export interface QpgBoardSlide {
  id: string;
  /** Question id, or null for a blank slide / the whole-paper slide. */
  questionId: string | null;
  /** Read-only question text (teachers edit questions in the
   *  generator, never on the board). */
  questionText: string;
  options: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }>;
  correctLetter: 'A' | 'B' | 'C' | 'D' | null;
  /** Answer + explanation — hidden until "উত্তর দেখান" is toggled. */
  explanation: string;
  showAnswer: boolean;
  annotations: QpgBoardAnnotation[];
}

export type QpgBoardLayout = 'separate' | 'whole-paper';

/** Slide layout choices (spec §2 user flow step 2). */
export const QPG_BOARD_LAYOUTS: Array<{
  id: QpgBoardLayout;
  nameBn: string;
  nameEn: string;
}> = [
  { id: 'separate', nameBn: 'প্রতিটি প্রশ্ন আলাদা স্লাইডে', nameEn: 'Each question on its own slide' },
  { id: 'whole-paper', nameBn: 'পুরো পেপার এক স্লাইডে', nameEn: 'Whole paper on one slide' },
];

/** Timer durations (minutes) — 10:00 default (spec §2). */
export const QPG_BOARD_TIMER_OPTIONS = [5, 10, 15, 30] as const;
export const QPG_BOARD_DEFAULT_TIMER_MINUTES = 10;

/** "10:00" from 600 seconds; clamps at 0. */
export function formatBoardTimer(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function boardTimerSeconds(minutes: number): number {
  return Math.max(0, Math.floor(minutes)) * 60;
}

/** Guard: a board holds at most one slide per question (the OMR cap
 *  is 100 questions) plus blank slides the teacher adds. */
export const QPG_BOARD_MAX_SLIDES = 120;
/** Guard: annotations per slide (keeps the board doc small). */
export const QPG_BOARD_MAX_ANNOTATIONS_PER_SLIDE = 500;

function slideId(n: number): string {
  return `slide-${n}`;
}

function slideFromQuestion(q: QpgQuestion, n: number): QpgBoardSlide {
  return {
    id: slideId(n),
    questionId: q.id,
    questionText: q.questionText,
    options: q.options,
    correctLetter: q.correctLetter,
    explanation: q.explanation,
    showAnswer: false,
    annotations: [],
  };
}

/** Build slides from a paper. Separate-slides (default): one slide
 *  per question, in paper order. Whole-paper: a single slide carrying
 *  the full paper text; its "answer" is the full answer key. */
export function buildBoardSlides(paper: QpgPaper, layout: QpgBoardLayout): QpgBoardSlide[] {
  if (layout === 'whole-paper') {
    const text = paper.questions
      .map((q, i) => `${i + 1}. ${q.questionText}`)
      .join('\n');
    const key = paper.questions
      .map((q, i) => `${i + 1}. ${q.correctLetter}`)
      .join('  ');
    return [
      {
        id: 'slide-whole',
        questionId: null,
        questionText: text,
        options: [],
        correctLetter: null,
        explanation: key ? `উত্তরমালা: ${key}` : '',
        showAnswer: false,
        annotations: [],
      },
    ];
  }
  return paper.questions.map((q, i) => slideFromQuestion(q, i + 1));
}

/** Session handoff: the generator page stores the just-built paper
 *  here and the Smartboard page reads it on mount (sessionStorage —
 *  the paper never touches Firestore unless the teacher saves the
 *  board). readPaperForSmartboard consumes the entry (one read). */
export const QPG_SMARTBOARD_PAPER_SESSION_KEY = 'eduvelto-qpg-smartboard-paper-v1';

export function savePaperForSmartboard(paper: QpgPaper): boolean {
  try {
    sessionStorage.setItem(QPG_SMARTBOARD_PAPER_SESSION_KEY, JSON.stringify(paper));
    return true;
  } catch {
    return false;
  }
}

export function readPaperForSmartboard(): QpgPaper | null {
  try {
    const raw = sessionStorage.getItem(QPG_SMARTBOARD_PAPER_SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(QPG_SMARTBOARD_PAPER_SESSION_KEY);
    const parsed = JSON.parse(raw) as QpgPaper;
    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** A blank slide (teacher-added, no question). */
export function blankBoardSlide(n: number): QpgBoardSlide {
  return {
    id: `slide-blank-${n}-${Date.now().toString(36)}`,
    questionId: null,
    questionText: '',
    options: [],
    correctLetter: null,
    explanation: '',
    showAnswer: false,
    annotations: [],
  };
}

/** Toggle "উত্তর দেখান" on one slide (answer + explanation shown /
 *  hidden). Pure — returns a new slide. */
export function toggleBoardAnswer(slide: QpgBoardSlide): QpgBoardSlide {
  return { ...slide, showAnswer: !slide.showAnswer };
}

export function addBoardAnnotation(
  slide: QpgBoardSlide,
  annotation: QpgBoardAnnotation,
): QpgBoardSlide {
  if (slide.annotations.length >= QPG_BOARD_MAX_ANNOTATIONS_PER_SLIDE) return slide;
  return { ...slide, annotations: [...slide.annotations, annotation] };
}

export function removeBoardAnnotation(slide: QpgBoardSlide, annotationId: string): QpgBoardSlide {
  return { ...slide, annotations: slide.annotations.filter((a) => a.id !== annotationId) };
}

/** Undo = drop the most recent annotation. Pure. */
export function undoBoardAnnotation(slide: QpgBoardSlide): QpgBoardSlide {
  if (slide.annotations.length === 0) return slide;
  return { ...slide, annotations: slide.annotations.slice(0, -1) };
}

export function clearBoardAnnotations(slide: QpgBoardSlide): QpgBoardSlide {
  return slide.annotations.length === 0 ? slide : { ...slide, annotations: [] };
}

/** Annotation ids are client-generated (never a Firestore id). */
export function newBoardAnnotationId(): string {
  return `ann-${Date.now().toString(36)}-${Math.floor(Math.random() * 1296).toString(36)}`;
}

// ---------------------------------------------------------------------
// Firestore document — qpgBoards (four-places rule: BACKUP_COLLECTIONS
// + firestore.rules + export script + preflight total).
// ---------------------------------------------------------------------

export interface QpgBoardDoc {
  ownerUid: string;
  ownerName?: string;
  title: string;
  subject: string;
  classLabel: string;
  setCode: string;
  layout: QpgBoardLayout;
  /** Paper snapshot: id + the question ids it was built from. The
   *  question text/answers ride inside slides[] — never re-fetched. */
  paperRef: { paperId: string; questionIds: string[] };
  slides: QpgBoardSlide[];
  /** Share link (read-only view for students) — PRO-gated per the
   *  spec §8.13 proposal (board use free; PDF export + share link
   *  are Pro). The page enforces the gate; the rules enforce that
   *  only the owner (or a moderator) may flip it. */
  shareEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function validateQpgBoard(doc: Partial<QpgBoardDoc>): string[] {
  const problems: string[] = [];
  if (!doc.ownerUid || typeof doc.ownerUid !== 'string') problems.push('ownerUid is required');
  if (!doc.title || typeof doc.title !== 'string' || doc.title.trim().length === 0) {
    problems.push('title is required');
  }
  if (doc.layout !== 'separate' && doc.layout !== 'whole-paper') {
    problems.push('layout must be separate or whole-paper');
  }
  if (!doc.paperRef || typeof doc.paperRef.paperId !== 'string' || !Array.isArray(doc.paperRef.questionIds)) {
    problems.push('paperRef.paperId + questionIds are required');
  }
  if (!Array.isArray(doc.slides) || doc.slides.length === 0) {
    problems.push('slides must be a non-empty array');
  } else if (doc.slides.length > QPG_BOARD_MAX_SLIDES) {
    problems.push(`at most ${QPG_BOARD_MAX_SLIDES} slides`);
  }
  for (const s of doc.slides ?? []) {
    if (s.annotations.length > QPG_BOARD_MAX_ANNOTATIONS_PER_SLIDE) {
      problems.push(`slide ${s.id} has too many annotations`);
      break;
    }
  }
  if (typeof doc.shareEnabled !== 'boolean') problems.push('shareEnabled must be a boolean');
  return problems;
}

// ---------------------------------------------------------------------
// Debounced autosave (spec §2: annotations autosave 2s after the last
// stroke — no per-stroke writes). The page schedules on every stroke;
// the saver fires once, 2s after the last schedule. flush() forces
// an immediate save (e.g. on unmount / explicit Save).
// ---------------------------------------------------------------------

export interface DebouncedBoardSaver {
  schedule: (doc: QpgBoardDoc) => void;
  flush: () => void;
  cancel: () => void;
  /** For tests: how many saves have fired. */
  savesFired: () => number;
}

export function createDebouncedBoardSaver(
  save: (doc: QpgBoardDoc) => void | Promise<void>,
  delayMs = 2000,
): DebouncedBoardSaver {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: QpgBoardDoc | null = null;
  let fired = 0;
  const fire = () => {
    timer = null;
    if (pending === null) return;
    const doc = pending;
    pending = null;
    fired += 1;
    void save(doc);
  };
  return {
    schedule(doc: QpgBoardDoc) {
      pending = doc;
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(fire, delayMs);
    },
    flush() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      fire();
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      pending = null;
    },
    savesFired() {
      return fired;
    },
  };
}
