// Eduvelto — combined verified Academic pool (Classes 6–12, thirty-five subjects).
//
// The SINGLE verified source for both the Question Maker (QPG) and the
// Education Hub chapter practice: a question verified once appears in
// both places. The per-subject arrays live in their own files
// (publicAcademicEnglish.ts, publicAcademicBangla.ts,
// publicAcademicBanglaGrammar.ts, publicAcademicMath.ts,
// publicAcademicMathDepth.ts, publicAcademicScience.ts,
// publicAcademicScienceDepth.ts, publicAcademicBgs.ts,
// publicAcademicIslam.ts, publicAcademicIct.ts,
// publicAcademicAgriculture.ts, publicAcademicHomeScience.ts,
// publicAcademicAccounting.ts, publicAcademicBangla1st.ts,
// publicAcademicBangla2nd.ts, publicAcademicBiology.ts,
// publicAcademicBiologyDepth.ts, publicAcademicBusiness.ts,
// publicAcademicFinance.ts, publicAcademicChemistry.ts,
// publicAcademicChemistryDepth.ts, publicAcademicCivics.ts,
// publicAcademicHistory.ts, publicAcademicEconomics.ts,
// publicAcademicGeography.ts, publicAcademicEnglish1st.ts,
// publicAcademicEnglish2nd.ts, publicAcademicHigherMath.ts,
// publicAcademicHigherMathDepth.ts, publicAcademicPhysics.ts,
// publicAcademicPhysicsDepth.ts, publicAcademicIslamicHistory.ts,
// publicAcademicLogic.ts, publicAcademicPsychology.ts,
// publicAcademicStatistics.ts); this
// file combines them and derives the chapters + lookup helpers from
// the combined array, so a new verified batch adds its chapters,
// counts, practice pages, SEO and sitemap entries automatically — no
// component or route change per batch.
//
// CLASS 9 vs CLASS 10: Classes 9 and 10 share ONE combined draft set
// (class-9-10-*.json — there is NO separate Class 10 set). The pool
// holds each Class 9 question ONCE under classId 'class-9' (the pool
// total counts unique questions once), and the lookup helpers below
// map 'class-10' to the Class 9 pool for these subjects, so both
// classes get practice paths. Class 9 was verified against the
// DAKHIL editions (no general NCTB Class 9-10 book set exists in the
// workspace — owner decision on the audience still owed).
//
// CLASS 11 vs CLASS 12: Classes 11 and 12 share ONE combined draft set
// (class-11-12-*.json — there is NO separate Class 12 set). The pool
// holds each Class 11 question ONCE under classId 'class-11' (the pool
// total counts unique questions once), and the lookup helpers below
// map 'class-12' to the Class 11 pool for these subjects, so both
// classes get practice paths. NO HSC book exists in the workspace —
// VERIFIED for Class 11 means "fact correct per a standard reference +
// topic within the cited HSC syllabus", NOT "confirmed against the book
// lesson"; a teacher with the actual HSC books should spot-check
// before publication, especially the re-cited chapters.
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
// ACAD-C6-ICT-010, ACAD-C6-ICT-012, ACAD-C6-ICT-024, C6S-025,
// ACAD-C7-ICT-010, ACAD-C7-ICT-011, ACAD-C7-ICT-015, ACAD-C7-ICT-024,
// ACAD-C7-ICT-025, ACAD-C7-SCI-005, ACAD-C7-SCI-006, C7S-008,
// C7S-024, C7S-025, C7S-028, C7S-030, ACAD-C8-GRA-009,
// ACAD-C8-BGS-003, ACAD-C8-BGS-005, ACAD-C8-BGS-019, ACAD-C8-BGS-020,
// ACAD-C8-ICT-005, ACAD-C8-ICT-009, ACAD-C8-ICT-013, C8S-015,
// C8S-029, C8S-031, C8S-033, C8S-034, ACAD-5108, ACAD-5096,
// ACAD-0018, ACAD-0052, ACAD-0053, ACAD-5061, ACAD-5068,
// ACAD-3069, ACAD-8069) are NOT
// in this pool and must never be shown to students. (C910P-018 left
// this list 27 Nov 2026 — citation resolved, item now in the pool.
// ACAD-5108 + ACAD-5096 stay out: teacher decision still owed.)

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
import { PUBLIC_ACADEMIC_ACCOUNTING_QUESTIONS } from './publicAcademicAccounting';
import { PUBLIC_ACADEMIC_BANGLA_1ST_QUESTIONS } from './publicAcademicBangla1st';
import { PUBLIC_ACADEMIC_BANGLA_2ND_QUESTIONS } from './publicAcademicBangla2nd';
import { PUBLIC_ACADEMIC_BIOLOGY_QUESTIONS } from './publicAcademicBiology';
import { PUBLIC_ACADEMIC_BIOLOGY_DEPTH_QUESTIONS } from './publicAcademicBiologyDepth';
import { PUBLIC_ACADEMIC_BUSINESS_QUESTIONS } from './publicAcademicBusiness';
import { PUBLIC_ACADEMIC_FINANCE_QUESTIONS } from './publicAcademicFinance';
import { PUBLIC_ACADEMIC_CHEMISTRY_QUESTIONS } from './publicAcademicChemistry';
import { PUBLIC_ACADEMIC_CHEMISTRY_DEPTH_QUESTIONS } from './publicAcademicChemistryDepth';
import { PUBLIC_ACADEMIC_CIVICS_QUESTIONS } from './publicAcademicCivics';
import { PUBLIC_ACADEMIC_HISTORY_QUESTIONS } from './publicAcademicHistory';
import { PUBLIC_ACADEMIC_ECONOMICS_QUESTIONS } from './publicAcademicEconomics';
import { PUBLIC_ACADEMIC_GEOGRAPHY_QUESTIONS } from './publicAcademicGeography';
import { PUBLIC_ACADEMIC_ENGLISH_1ST_QUESTIONS } from './publicAcademicEnglish1st';
import { PUBLIC_ACADEMIC_ENGLISH_2ND_QUESTIONS } from './publicAcademicEnglish2nd';
import { PUBLIC_ACADEMIC_HIGHER_MATH_QUESTIONS } from './publicAcademicHigherMath';
import { PUBLIC_ACADEMIC_HIGHER_MATH_DEPTH_QUESTIONS } from './publicAcademicHigherMathDepth';
import { PUBLIC_ACADEMIC_PHYSICS_QUESTIONS } from './publicAcademicPhysics';
import { PUBLIC_ACADEMIC_PHYSICS_DEPTH_QUESTIONS } from './publicAcademicPhysicsDepth';
import { PUBLIC_ACADEMIC_ISLAMIC_HISTORY_QUESTIONS } from './publicAcademicIslamicHistory';
import { PUBLIC_ACADEMIC_LOGIC_QUESTIONS } from './publicAcademicLogic';
import { PUBLIC_ACADEMIC_PSYCHOLOGY_QUESTIONS } from './publicAcademicPsychology';
import { PUBLIC_ACADEMIC_STATISTICS_QUESTIONS } from './publicAcademicStatistics';

export type PublicAcademicClassId = 'class-6' | 'class-7' | 'class-8' | 'class-9' | 'class-10' | 'class-11' | 'class-12';
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
  | 'home-science'
  | 'accounting'
  | 'bangla-1st'
  | 'bangla-2nd'
  | 'biology'
  | 'biology-depth'
  | 'business'
  | 'finance'
  | 'chemistry'
  | 'chemistry-depth'
  | 'civics'
  | 'history'
  | 'economics'
  | 'geography'
  | 'english-1st'
  | 'english-2nd'
  | 'higher-math'
  | 'higher-math-depth'
  | 'physics'
  | 'physics-depth'
  | 'islamic-history'
  | 'logic'
  | 'psychology'
  | 'statistics';

export interface PublicAcademicQuestion {
  id: string;
  classId: PublicAcademicClassId;
  subjectId: PublicAcademicSubjectId;
  /** NCTB chapter slug, e.g. 'acad-class-6-eng-unit-1' or 'acad-class-6-ban-lesson-1'. One chapter per NCTB unit / lesson. */
  chapterId: string;
  /** NCTB chapter name, e.g. 'Unit 1: Greetings, ...' or 'পাঠ ১: আমাদের কথা'. */
  chapterName: string;
  unitNumber: number;
  /** Topical tag inside the chapter (the draft's 3rd tag for Classes 3–8;
   *  chapter-based for Class 9 — 'chapter-N' for numbered chapters,
   *  'topic-N' for topical chapters — because the Class 9 drafts' tags[2]
   *  slugs are not unique per topic; same for Class 11, plus 'unit-N' for
   *  the English Units and 'chapter-N-p2' for 2nd-paper numbered chapters,
   *  because 1st- and 2nd-paper chapters share numbers with different
   *  titles). */
  topicId: string;
  questionText: string;
  options: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }>;
  correctLetter: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Book citation, e.g. 'English For Today, Class 3 (NCTB 2024), Unit 1: ...'. */
  sourceNote: string;
}

/** All verified Academic questions (Classes 6–12, thirty-five subjects), in
 *  draft order within each subject file (Class 6, then 7, then 8, then 9, then 11).
 *  Class 10 shares the Class 9 questions (same combined draft set) and
 *  Class 12 shares the Class 11 questions (same combined draft set) — the
 *  pool holds each question ONCE; see publicAcademicChaptersFor. */
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
  ...PUBLIC_ACADEMIC_ACCOUNTING_QUESTIONS,
  ...PUBLIC_ACADEMIC_BANGLA_1ST_QUESTIONS,
  ...PUBLIC_ACADEMIC_BANGLA_2ND_QUESTIONS,
  ...PUBLIC_ACADEMIC_BIOLOGY_QUESTIONS,
  ...PUBLIC_ACADEMIC_BIOLOGY_DEPTH_QUESTIONS,
  ...PUBLIC_ACADEMIC_BUSINESS_QUESTIONS,
  ...PUBLIC_ACADEMIC_FINANCE_QUESTIONS,
  ...PUBLIC_ACADEMIC_CHEMISTRY_QUESTIONS,
  ...PUBLIC_ACADEMIC_CHEMISTRY_DEPTH_QUESTIONS,
  ...PUBLIC_ACADEMIC_CIVICS_QUESTIONS,
  ...PUBLIC_ACADEMIC_HISTORY_QUESTIONS,
  ...PUBLIC_ACADEMIC_ECONOMICS_QUESTIONS,
  ...PUBLIC_ACADEMIC_GEOGRAPHY_QUESTIONS,
  ...PUBLIC_ACADEMIC_ENGLISH_1ST_QUESTIONS,
  ...PUBLIC_ACADEMIC_ENGLISH_2ND_QUESTIONS,
  ...PUBLIC_ACADEMIC_HIGHER_MATH_QUESTIONS,
  ...PUBLIC_ACADEMIC_HIGHER_MATH_DEPTH_QUESTIONS,
  ...PUBLIC_ACADEMIC_PHYSICS_QUESTIONS,
  ...PUBLIC_ACADEMIC_PHYSICS_DEPTH_QUESTIONS,
  ...PUBLIC_ACADEMIC_ISLAMIC_HISTORY_QUESTIONS,
  ...PUBLIC_ACADEMIC_LOGIC_QUESTIONS,
  ...PUBLIC_ACADEMIC_PSYCHOLOGY_QUESTIONS,
  ...PUBLIC_ACADEMIC_STATISTICS_QUESTIONS,
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

/** Classes with verified practice questions (class + subject pairs).
 *  Class 10 shares the Class 9 pool (same combined draft set — no
 *  separate Class 10 set) and Class 12 shares the Class 11 pool (same
 *  combined draft set — no separate Class 12 set), so every class-9 row
 *  is repeated here as a class-10 row and every class-11 row as a
 *  class-12 row with the same counts. The pool total counts unique
 *  questions once; these rows are practice paths, not questions. */
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
  // Class 10 = Class 9 pool (same combined class-9-10 draft set).
  for (const row of out.filter((x) => x.classId === 'class-9')) {
    out.push({ ...row, classId: 'class-10' });
  }
  // Class 12 = Class 11 pool (same combined class-11-12 draft set).
  for (const row of out.filter((x) => x.classId === 'class-11')) {
    out.push({ ...row, classId: 'class-12' });
  }
  return out;
}

/** Chapters (units / lessons) with verified questions for one class +
 *  subject. Any other class/subject returns [] — the UI shows the
 *  honest empty state, never filler. Class 10 resolves to the Class 9
 *  pool for these subjects (same combined draft set) and Class 12
 *  resolves to the Class 11 pool (same combined draft set); the returned
 *  chapters carry classId 'class-10' / 'class-12' so links and labels stay
 *  on the requested class. */
export function publicAcademicChaptersFor(
  classId: string,
  subjectId: string,
): PublicAcademicChapter[] {
  const effectiveClassId =
    classId === 'class-10' ? 'class-9' : classId === 'class-12' ? 'class-11' : classId;
  const chapters = PUBLIC_ACADEMIC_CHAPTERS.filter(
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

/** Verified questions for one chapter (unit / lesson), in draft order. */
export function publicAcademicQuestionsForChapter(chapterId: string): PublicAcademicQuestion[] {
  return PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.chapterId === chapterId);
}
