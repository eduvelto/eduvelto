/**
 * NU (National University) CGPA Calculator — pure logic (Tool #42).
 *
 * 4.00 scale, credit-weighted:
 * A+ 4.00, A 3.75, A- 3.50, B+ 3.25, B 3.00, B- 2.75,
 * C+ 2.50, C 2.25, D 2.00, F 0.00.
 *
 * CGPA = sum(gradePoint x credit) / sum(credit).
 *
 * Pure functions only: no network, no storage, no DOM.
 */

/** Grade point for each letter grade on the NU 4.00 scale. */
export const NU_GRADE_POINTS = {
  'A+': 4.0,
  A: 3.75,
  'A-': 3.5,
  'B+': 3.25,
  B: 3.0,
  'B-': 2.75,
  'C+': 2.5,
  C: 2.25,
  D: 2.0,
  F: 0.0,
} as const;

export type NuGradeLetter = keyof typeof NU_GRADE_POINTS;

/** The only grade points that exist on the NU scale. */
const VALID_GRADE_POINTS = new Set([4.0, 3.75, 3.5, 3.25, 3.0, 2.75, 2.5, 2.25, 2.0, 0.0]);

export interface NuCourseResult {
  /** Grade point earned in the course (NU 4.00 scale). */
  gradePoint: number;
  /** Credit hours of the course. */
  credit: number;
}

export interface NuCgpaResult {
  /** CGPA on the 4.00 scale, rounded to 2 decimals. */
  cgpa: number;
  /** Total credit hours. */
  totalCredits: number;
}

/**
 * Calculate the credit-weighted NU CGPA.
 *
 * @param courses list of `{ gradePoint, credit }` (at least one course,
 *   every credit must be > 0).
 * @returns `{ cgpa, totalCredits }`.
 *
 * Hand-check: [{3.75, 3}, {4.00, 3}, {3.50, 2}] ->
 * (11.25 + 12.00 + 7.00) / 8 = 30.25 / 8 = 3.78, totalCredits 8.
 */
export function calculateNuCgpa(courses: NuCourseResult[]): NuCgpaResult {
  if (!Array.isArray(courses) || courses.length === 0) {
    throw new Error('At least one course result is required to calculate a CGPA');
  }
  let weightedSum = 0;
  let totalCredits = 0;
  courses.forEach((course, i) => {
    if (!Number.isFinite(course.gradePoint) || !VALID_GRADE_POINTS.has(course.gradePoint)) {
      throw new Error(
        `Course ${i + 1} grade point must be a valid NU grade point ` +
          `(4.00, 3.75, 3.50, 3.25, 3.00, 2.75, 2.50, 2.25, 2.00 or 0.00), got ${course.gradePoint}`,
      );
    }
    if (!Number.isFinite(course.credit) || course.credit <= 0) {
      throw new Error(`Course ${i + 1} credit must be a positive number, got ${course.credit}`);
    }
    weightedSum += course.gradePoint * course.credit;
    totalCredits += course.credit;
  });
  const cgpa = Math.round((weightedSum / totalCredits) * 100) / 100;
  return { cgpa, totalCredits };
}
