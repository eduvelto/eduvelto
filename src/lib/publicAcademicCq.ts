// Eduvelto — combined verified Academic CQ pool (Classes 9-12).
//
// The SINGLE verified source for Creative (CQ) questions in the
// Question Paper Generator: a CQ verified once appears in the QPG
// pool (see ./questionPaper.ts). The per-band arrays live in their
// own files (publicAcademicCq910.ts, publicAcademicCq1112.ts); this
// file combines them and derives the chapters + lookup helpers from
// the combined array, so a new verified batch adds its chapters and
// counts automatically — no component or route change per batch.
//
// CLASS 9 vs CLASS 10 / CLASS 11 vs CLASS 12: the pool holds each
// CQ ONCE under classId 'class-9' / 'class-11' (the pool total counts
// unique questions once), and the lookup helpers below map
// 'class-10' to the Class 9 pool and 'class-12' to the Class 11 pool,
// so both classes get QPG paths. There is NO separate Class 10 or
// Class 12 CQ set.
//
// This file does NOT touch the MCQ pool (publicAcademic.ts) — CQ
// lives alongside it. The QPG pool (QPG_VERIFIED_POOL) is MCQ +
// CQ; the Education Hub chapter practice stays MCQ-only until a
// CQ practice path is built (separate task).

import { PUBLIC_ACADEMIC_CQ_910_QUESTIONS } from './publicAcademicCq910';
import { PUBLIC_ACADEMIC_CQ_1112_QUESTIONS } from './publicAcademicCq1112';
import type { PublicAcademicClassId, PublicAcademicSubjectId } from './publicAcademic';

/** One part of a Creative Question: ক (1 mark), খ (2), গ (3), ঘ (4). */
export interface PublicAcademicCqPart {
  label: 'ক' | 'খ' | 'গ' | 'ঘ';
  marks: 1 | 2 | 3 | 4;
  question: string;
  /** Marking outline for the teacher — NOT a model answer to print. */
  answer_outline: string;
}

export interface PublicAcademicCqQuestion {
  id: string;
  classId: PublicAcademicClassId;
  subjectId: PublicAcademicSubjectId;
  /** NCTB chapter slug — shared with the MCQ chapter when the cited
   *  chapter matches one, else a CQ-only chapter
   *  (`acad-class-{9|11}-<subject>-cq-<n>`). */
  chapterId: string;
  /** NCTB chapter name (the MCQ chapter's name when shared, else the
   *  CQ's cited chapter). */
  chapterName: string;
  unitNumber: number;
  /** CQ is chapter-level, not a sub-topic: every CQ carries 'cq'. */
  topicId: 'cq';
  /** Stimulus (passage / poem / problem / situation). */
  stimulus: string;
  /** Four parts, marks 1/2/3/4 = 10. */
  parts: [PublicAcademicCqPart, PublicAcademicCqPart, PublicAcademicCqPart, PublicAcademicCqPart];
  difficulty: 'easy' | 'medium' | 'hard';
  /** Book citation, e.g. 'NCTB পদার্থবিজ্ঞান, নবম-দশম শ্রেণি — অধ্যায় ২: গতি'. */
  sourceNote: string;
}

/** All usable Academic Creative Questions (Classes 9-12), in draft
 *  order within each band file (Class 9-10, then Class 11-12).
 *  Class 10 shares the Class 9 questions and Class 12 shares the
 *  Class 11 questions — the pool holds each question ONCE. */
export const PUBLIC_ACADEMIC_CQ_QUESTIONS: PublicAcademicCqQuestion[] = [
  ...PUBLIC_ACADEMIC_CQ_910_QUESTIONS,
  ...PUBLIC_ACADEMIC_CQ_1112_QUESTIONS,
];

export interface PublicAcademicCqChapter {
  id: string;
  classId: PublicAcademicClassId;
  subjectId: PublicAcademicSubjectId;
  name: string;
  unitNumber: number;
  questionCount: number;
  topics: Array<{ id: string; count: number }>;
}

/** Chapters (NCTB units / lessons) derived from the CQ questions — a
 *  chapter exists only when it holds at least one usable CQ, so a
 *  future batch adds its chapters here automatically. */
export const PUBLIC_ACADEMIC_CQ_CHAPTERS: PublicAcademicCqChapter[] = (() => {
  const byId = new Map<string, PublicAcademicCqChapter>();
  for (const q of PUBLIC_ACADEMIC_CQ_QUESTIONS) {
    let ch = byId.get(q.chapterId);
    if (!ch) {
      ch = {
        id: q.chapterId,
        classId: q.classId,
        subjectId: q.subjectId,
        name: q.chapterName,
        unitNumber: q.unitNumber,
        questionCount: 0,
        topics: [],
      };
      byId.set(q.chapterId, ch);
    }
    ch.questionCount += 1;
    const t = ch.topics.find((x) => x.id === q.topicId);
    if (t) t.count += 1;
    else ch.topics.push({ id: q.topicId, count: 1 });
  }
  return [...byId.values()].sort(
    (a, b) =>
      a.classId.localeCompare(b.classId) ||
      a.subjectId.localeCompare(b.subjectId) ||
      a.unitNumber - b.unitNumber ||
      a.id.localeCompare(b.id),
  );
})();

/** CQ count for one chapter (0 when the chapter holds no CQ). */
export function publicAcademicCqCountForChapter(chapterId: string): number {
  return PUBLIC_ACADEMIC_CQ_CHAPTERS.find((c) => c.id === chapterId)?.questionCount ?? 0;
}

/** CQ chapters for one class + subject. Class 10 resolves to the
 *  Class 9 pool and Class 12 to the Class 11 pool (same combined
 *  draft sets); the returned chapters carry classId 'class-10' /
 *  'class-12' so labels stay on the requested class. */
export function publicAcademicCqChaptersFor(
  classId: string,
  subjectId: string,
): PublicAcademicCqChapter[] {
  const effectiveClassId =
    classId === 'class-10' ? 'class-9' : classId === 'class-12' ? 'class-11' : classId;
  const chapters = PUBLIC_ACADEMIC_CQ_CHAPTERS.filter(
    (c) => c.classId === effectiveClassId && c.subjectId === subjectId,
  );
  if (classId === 'class-10') {
    return chapters.map((c) => ({ ...c, classId: 'class-10' as PublicAcademicClassId }));
  }
  if (classId === 'class-12') {
    return chapters.map((c) => ({ ...c, classId: 'class-12' as PublicAcademicClassId }));
  }
  return chapters;
}

/** Usable CQ for one chapter, in draft order. */
export function publicAcademicCqQuestionsForChapter(chapterId: string): PublicAcademicCqQuestion[] {
  return PUBLIC_ACADEMIC_CQ_QUESTIONS.filter((q) => q.chapterId === chapterId);
}
