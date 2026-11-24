// Bilingual lesson answers — which answer text a LessonReader shows.
//
// Owner report, 24 Nov 2026: on the Class 9 English 1st Paper lesson
// "10 Short Questions", every English question showed ONLY its Bangla
// answer. The data carries BOTH (`answer` in English + `answerBn` in
// Bangla — verified in the 24 Nov backup: ssc-english-1st-paper--part-b
// has 10/10 questions with both fields), but the reader picked
// `answerBn || answer` and never displayed the English one.
//
// Rule: the primary answer is the question's own language (`answer`,
// falling back to `answerBn` for Bangla-only packs, then `correctText`).
// The Bangla text is shown as a second line only when it exists and
// differs from the primary — so English packs show English first +
// Bangla below, Bangla-only packs show Bangla once, and nothing is
// ever duplicated.
import type { LessonQuestion } from './content';

export function pickLessonAnswers(q: LessonQuestion): { primary: string; bangla: string } {
  const primary = q.answer || q.answerBn || q.correctText;
  const bangla = q.answerBn && q.answerBn !== primary ? q.answerBn : '';
  return { primary, bangla };
}
