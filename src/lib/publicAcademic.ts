// Eduvelto — combined verified Academic pool (Classes 3–6, twelve subjects).
//
// The SINGLE verified source for both the Question Maker (QPG) and the
// Education Hub chapter practice: a question verified once appears in
// both places. The per-subject arrays live in their own files
// (publicAcademicEnglish.ts, publicAcademicBangla.ts,
// publicAcademicBanglaGrammar.ts, publicAcademicMath.ts,
// publicAcademicMathDepth.ts, publicAcademicScience.ts,
// publicAcademicScienceDepth.ts, publicAcademicBgs.ts,
// publicAcademicIslam.ts, publicAcademicIct.ts,
// publicAcademicAgriculture.ts, publicAcademicHomeScience.ts); this
// file combines them and derives the chapters + lookup helpers from
// the combined array, so a new verified batch adds its chapters,
// counts, practice pages, SEO and sitemap entries automatically — no
// component or route change per batch.
//
// HONESTY: these are ORIGINAL practice questions written for the NCTB
// lessons — NOT board / university / previous-year questions. Every
// question was checked against its cited NCTB book lesson (review
// 26 Nov 2026; see the per-subject pool files for the verdict
// references). The draft files' `status` field still says
// NEEDS-REVIEW — the verdict files are the review record, and this
// pool contains ONLY the verified questions (VERIFIED as-is +
// NEEDS-FIX / REJECTED items with their fixes applied). The REJECTED
// items with no complete replacement recorded (ACAD-C4-BAN-019
// "লাল জামা", ACAD-C5-BGS-011 tea gardens, ACAD-C6-ICT-009,
// ACAD-C6-ICT-010, ACAD-C6-ICT-012, ACAD-C6-ICT-024, C6S-025) are NOT
// in this pool and must never be shown to students.

import { PUBLIC_ACADEMIC_ENGLISH_QUESTIONS } from './publicAcademicEnglish';
import { PUBLIC_ACADEMIC_BANGLA_QUESTIONS } from './publicAcademicBangla';
import { PUBLIC_ACADEMIC_BANGLA_GRAMMAR_QUESTIONS } from './publicAcademicBanglaGrammar';
import { PUBLIC_ACADEMIC_MATH_QUESTIONS } from './publicAcademicMath';
import { PUBLIC_ACADEMIC_MATH_DEPTH_QUESTIONS } from './publicAcademicMathDepth';
import { PUBLIC_ACADEMIC_SCIENCE_QUESTIONS } from './publicAcademicScience';
import { PUBLIC_ACADEMIC_SCIENCE_DEPTH_QUESTIONS } from './publicAcademicScienceDepth';
import { PUBLIC_ACADEMIC_BGS_QUESTIONS } from './publicAcademicBgs';
import { PUBLIC_ACADEMIC_ISLAM_QUESTIONS } from './publicAcademicIslam';
import { PUBLIC_ACADEMIC_ICT_QUESTIONS } from './publicAcademicIct';
import { PUBLIC_ACADEMIC_AGRICULTURE_QUESTIONS } from './publicAcademicAgriculture';
import { PUBLIC_ACADEMIC_HOME_SCIENCE_QUESTIONS } from './publicAcademicHomeScience';

export type PublicAcademicClassId = 'class-3' | 'class-4' | 'class-5' | 'class-6';
export type PublicAcademicSubjectId =
  | 'english'
  | 'bangla'
  | 'bangla-grammar'
  | 'math'
  | 'math-depth'
  | 'science'
  | 'science-depth'
  | 'bgs'
  | 'islam'
  | 'ict'
  | 'agriculture'
  | 'home-science';

export interface PublicAcademicQuestion {
  id: string;
  classId: PublicAcademicClassId;
  subjectId: PublicAcademicSubjectId;
  /** NCTB chapter slug, e.g. 'acad-class-3-eng-unit-1' or 'acad-class-3-ban-lesson-1'. One chapter per NCTB unit / lesson. */
  chapterId: string;
  /** NCTB chapter name, e.g. 'Unit 1: Greetings, ...' or 'পাঠ ১: আমাদের কথা'. */
  chapterName: string;
  unitNumber: number;
  /** Topical tag inside the chapter (the draft's 3rd tag), e.g. 'greetings' / 'place-value'. */
  topicId: string;
  questionText: string;
  options: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }>;
  correctLetter: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Book citation, e.g. 'English For Today, Class 3 (NCTB 2024), Unit 1: ...'. */
  sourceNote: string;
}

/** All verified Academic questions (Classes 3–6, twelve subjects), in
 *  draft order within each subject file (Class 3, then 4, then 5, then 6). */
export const PUBLIC_ACADEMIC_QUESTIONS: PublicAcademicQuestion[] = [
  ...PUBLIC_ACADEMIC_ENGLISH_QUESTIONS,
  ...PUBLIC_ACADEMIC_BANGLA_QUESTIONS,
  ...PUBLIC_ACADEMIC_BANGLA_GRAMMAR_QUESTIONS,
  ...PUBLIC_ACADEMIC_MATH_QUESTIONS,
  ...PUBLIC_ACADEMIC_MATH_DEPTH_QUESTIONS,
  ...PUBLIC_ACADEMIC_SCIENCE_QUESTIONS,
  ...PUBLIC_ACADEMIC_SCIENCE_DEPTH_QUESTIONS,
  ...PUBLIC_ACADEMIC_BGS_QUESTIONS,
  ...PUBLIC_ACADEMIC_ISLAM_QUESTIONS,
  ...PUBLIC_ACADEMIC_ICT_QUESTIONS,
  ...PUBLIC_ACADEMIC_AGRICULTURE_QUESTIONS,
  ...PUBLIC_ACADEMIC_HOME_SCIENCE_QUESTIONS,
];

export interface PublicAcademicChapter {
  id: string;
  classId: PublicAcademicClassId;
  subjectId: PublicAcademicSubjectId;
  name: string;
  unitNumber: number;
  questionCount: number;
  topics: Array<{ id: string; count: number }>;
}

/** Chapters (NCTB units / lessons) derived from the questions — a
 *  chapter exists only when it holds at least one verified question,
 *  so a future batch adds its chapters here automatically. */
export const PUBLIC_ACADEMIC_CHAPTERS: PublicAcademicChapter[] = (() => {
  const byId = new Map<string, PublicAcademicChapter>();
  for (const q of PUBLIC_ACADEMIC_QUESTIONS) {
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

/** Classes with verified practice questions (class + subject pairs). */
export function publicAcademicClassSubjects(): Array<{
  classId: PublicAcademicClassId;
  subjectId: PublicAcademicSubjectId;
  questionCount: number;
  chapterCount: number;
}> {
  const out: Array<{
    classId: PublicAcademicClassId;
    subjectId: PublicAcademicSubjectId;
    questionCount: number;
    chapterCount: number;
  }> = [];
  for (const ch of PUBLIC_ACADEMIC_CHAPTERS) {
    const row = out.find((x) => x.classId === ch.classId && x.subjectId === ch.subjectId);
    if (row) {
      row.questionCount += ch.questionCount;
      row.chapterCount += 1;
    } else {
      out.push({
        classId: ch.classId,
        subjectId: ch.subjectId,
        questionCount: ch.questionCount,
        chapterCount: 1,
      });
    }
  }
  return out;
}

/** Chapters (units / lessons) with verified questions for one class +
 *  subject. Any other class/subject returns [] — the UI shows the
 *  honest empty state, never filler. */
export function publicAcademicChaptersFor(
  classId: string,
  subjectId: string,
): PublicAcademicChapter[] {
  return PUBLIC_ACADEMIC_CHAPTERS.filter(
    (c) => c.classId === classId && c.subjectId === subjectId,
  );
}

/** Verified questions for one chapter (unit / lesson), in draft order. */
export function publicAcademicQuestionsForChapter(chapterId: string): PublicAcademicQuestion[] {
  return PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.chapterId === chapterId);
}
