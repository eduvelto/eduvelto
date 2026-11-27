/**
 * Shared grade engine — ONE marks parser + grade/GPA engine for
 * grade-analyzer, pass-fail-analyzer and merit-rank-result-sheet.
 * Bangladesh SSC/HSC marks->grade scale: 80+ A+ (5.0), 70+ A (4.0),
 * 60+ A- (3.5), 50+ B (3.0), 40+ C (2.0), 33+ D (1.0), below 33 F (0).
 * Pure functions only: no network, no storage, no DOM.
 */

export const BD_PASS_MARK = 33;

export interface SubjectGrade {
  marks: number;
  gradeLetter: string;
  gradePoint: number;
  passed: boolean;
}

export function gradeLetterForMarks(marks: number, passMark: number = BD_PASS_MARK): string {
  if (marks >= 80) return 'A+';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'A-';
  if (marks >= 50) return 'B';
  if (marks >= 40) return 'C';
  if (marks >= passMark) return 'D';
  return 'F';
}

export function gradePointForLetter(letter: string): number {
  switch (letter) {
    case 'A+': return 5.0;
    case 'A': return 4.0;
    case 'A-': return 3.5;
    case 'B': return 3.0;
    case 'C': return 2.0;
    case 'D': return 1.0;
    default: return 0.0;
  }
}

export function gradeForMarks(marks: number, passMark: number = BD_PASS_MARK): SubjectGrade {
  if (!Number.isFinite(marks) || marks < 0 || marks > 100) {
    throw new Error(`Marks must be between 0 and 100, got ${marks}`);
  }
  const gradeLetter = gradeLetterForMarks(marks, passMark);
  return { marks, gradeLetter, gradePoint: gradePointForLetter(gradeLetter), passed: gradeLetter !== 'F' };
}

export interface MarksAnalysis {
  subjects: SubjectGrade[];
  total: number;
  average: number;
  gpa: number;
  passed: boolean;
}

/**
 * Analyse a list of subject marks. GPA is the mean grade point
 * (rounded to 2 decimals); any F fails the whole set.
 * Hand-check: [85, 72, 65] -> points 5+4+3.5=12.5, GPA 4.17, pass.
 */
export function analyzeMarks(marksList: number[], passMark: number = BD_PASS_MARK): MarksAnalysis {
  if (!Array.isArray(marksList) || marksList.length === 0) {
    throw new Error('At least one subject mark is required');
  }
  const subjects = marksList.map((m) => gradeForMarks(m, passMark));
  const total = subjects.reduce((s, g) => s + g.marks, 0);
  const average = Math.round((total / subjects.length) * 100) / 100;
  const gpa = Math.round((subjects.reduce((s, g) => s + g.gradePoint, 0) / subjects.length) * 100) / 100;
  return { subjects, total, average, gpa, passed: subjects.every((g) => g.passed) };
}

export interface StudentRow {
  name: string;
  marks: number[];
}

export interface RankedStudent extends StudentRow {
  total: number;
  average: number;
  gpa: number;
  passed: boolean;
  rank: number;
}

/**
 * Parse pasted student rows. One student per line:
 * "Rahim, 85, 72, 65" or "Rahim: 85 72 65" (comma / tab / space
 * separated; the first token is the name, the rest are marks 0-100).
 * Lines with no valid marks are skipped; throws when nothing parses.
 */
export function parseStudentRows(text: string): StudentRow[] {
  const rows: StudentRow[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split(/[,;\t]+/).flatMap((p) => p.trim().split(/\s+/)).filter(Boolean);
    if (parts.length < 2) continue;
    const name = parts[0].replace(/:$/, '');
    const marks: number[] = [];
    let valid = true;
    for (const token of parts.slice(1)) {
      const n = Number(token);
      if (!Number.isFinite(n) || n < 0 || n > 100) { valid = false; break; }
      marks.push(n);
    }
    if (valid && marks.length > 0) rows.push({ name, marks });
  }
  if (rows.length === 0) throw new Error('No valid student rows found — use one line per student, e.g. "Rahim, 85, 72, 65"');
  return rows;
}

/**
 * Rank students by total marks (highest first). Equal totals share a
 * rank (standard competition ranking: 1, 2, 2, 4).
 * Hand-check: totals 250, 200, 200, 150 -> ranks 1, 2, 2, 4.
 */
export function rankStudents(rows: StudentRow[], passMark: number = BD_PASS_MARK): RankedStudent[] {
  const analysed: RankedStudent[] = rows.map((row) => {
    const a = analyzeMarks(row.marks, passMark);
    return { ...row, total: a.total, average: a.average, gpa: a.gpa, passed: a.passed, rank: 0 };
  });
  analysed.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  let currentRank = 0;
  let prevTotal: number | null = null;
  analysed.forEach((s, i) => {
    if (prevTotal === null || s.total !== prevTotal) currentRank = i + 1;
    s.rank = currentRank;
    prevTotal = s.total;
  });
  return analysed;
}

export interface PassFailSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

/** Pass/fail counts for a ranked (or unranked) student list. */
export function passFailSummary(students: { passed: boolean }[]): PassFailSummary {
  const total = students.length;
  const passed = students.filter((s) => s.passed).length;
  const failed = total - passed;
  return { total, passed, failed, passRate: total === 0 ? 0 : Math.round((passed / total) * 1000) / 10 };
}
