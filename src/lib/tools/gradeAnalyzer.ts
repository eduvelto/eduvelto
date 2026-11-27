/**
 * Grade Analyzer — pure logic (wraps the shared grade engine).
 * Pure functions only: no network, no storage, no DOM.
 */
import { analyzeMarks, gradeForMarks, type MarksAnalysis, type SubjectGrade } from './gradeEngine';

export { analyzeMarks, gradeForMarks };
export type { MarksAnalysis, SubjectGrade };

/** Parse a pasted list of marks ("85, 72, 65" or one per line). */
export function parseMarksList(text: string): number[] {
  const marks: number[] = [];
  for (const token of text.split(/[\s,;]+/).filter(Boolean)) {
    const n = Number(token);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      throw new Error(`"${token}" is not a mark between 0 and 100`);
    }
    marks.push(n);
  }
  if (marks.length === 0) throw new Error('Enter at least one mark');
  return marks;
}
