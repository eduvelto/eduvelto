/**
 * Pass-Fail Analyzer — pure logic (wraps the shared grade engine).
 * Pure functions only: no network, no storage, no DOM.
 */
import { analyzeMarks, parseStudentRows, passFailSummary, type MarksAnalysis } from './gradeEngine';

export { analyzeMarks, parseStudentRows, passFailSummary };
export type { MarksAnalysis };

export interface PassFailAnalysis {
  passed: { name: string; total: number; gpa: number }[];
  failed: { name: string; total: number; gpa: number }[];
  summary: { total: number; passed: number; failed: number; passRate: number };
}

export function analyzePassFail(text: string, passMark: number = 33): PassFailAnalysis {
  const rows = parseStudentRows(text);
  const passed: PassFailAnalysis['passed'] = [];
  const failed: PassFailAnalysis['failed'] = [];
  for (const row of rows) {
    const a = analyzeMarks(row.marks, passMark);
    const entry = { name: row.name, total: a.total, gpa: a.gpa };
    if (a.passed) passed.push(entry); else failed.push(entry);
  }
  passed.sort((a, b) => b.total - a.total);
  failed.sort((a, b) => b.total - a.total);
  return {
    passed,
    failed,
    summary: passFailSummary([
      ...passed.map(() => ({ passed: true })),
      ...failed.map(() => ({ passed: false })),
    ]),
  };
}
