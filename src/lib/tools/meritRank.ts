/**
 * Merit Rank & Result Sheet — pure logic (wraps the shared grade
 * engine's parser + ranking). Pure functions only.
 */
import { parseStudentRows, passFailSummary, rankStudents, type RankedStudent, type StudentRow } from './gradeEngine';

export { parseStudentRows, passFailSummary, rankStudents };
export type { RankedStudent, StudentRow };

export interface MeritSheet {
  ranked: RankedStudent[];
  summary: { total: number; passed: number; failed: number; passRate: number };
  topper: RankedStudent | null;
}

export function buildMeritSheet(text: string, passMark: number = 33): MeritSheet {
  const rows = parseStudentRows(text);
  const ranked = rankStudents(rows, passMark);
  return { ranked, summary: passFailSummary(ranked), topper: ranked[0] ?? null };
}
