/**
 * SSC/HSC GPA Calculator — pure logic (Tool #41).
 *
 * Bangladesh GPA scale (SSC/HSC): A+ 5.0, A 4.0, A- 3.5, B 3.0, C 2.0,
 * D 1.0, F 0.0.
 *
 * GPA = (sum of the 6 main-subject grade points
 *        + max(0, 4th-subject grade point - 2)) / 6, capped at 5.0.
 * The 4th-subject extra points are capped at 3.0 (so a 4th-subject A+
 * contributes 3.0, not 3.0+ — i.e. 5.0 - 2 = 3.0 is the cap itself).
 * If ANY main subject is F (0.0), the student fails and GPA = 0.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

/** Grade point for each letter grade on the SSC/HSC scale. */
export const SSC_HSC_GRADE_POINTS = {
  'A+': 5.0,
  A: 4.0,
  'A-': 3.5,
  B: 3.0,
  C: 2.0,
  D: 1.0,
  F: 0.0,
} as const;

export type SscHscGradeLetter = keyof typeof SSC_HSC_GRADE_POINTS;

/** The only grade points that exist on the SSC/HSC scale. */
const VALID_GRADE_POINTS = new Set([5.0, 4.0, 3.5, 3.0, 2.0, 1.0, 0.0]);

export const SSC_HSC_MAIN_SUBJECT_COUNT = 6;

/** Maximum extra points a 4th subject can contribute. */
export const SSC_HSC_FOURTH_SUBJECT_MAX_EXTRA = 3.0;

export interface SscHscGpaResult {
  /** GPA on the 5.0 scale, rounded to 2 decimals (0 when failed). */
  gpa: number;
  /** False when any main subject is F. */
  passed: boolean;
  /** Letter grade for the GPA (F when failed). */
  gradeLetter: SscHscGradeLetter;
}

/** Letter grade for a GPA value (5.0 scale). */
export function sscHscGradeLetterForGpa(gpa: number): SscHscGradeLetter {
  if (gpa >= 5.0) return 'A+';
  if (gpa >= 4.0) return 'A';
  if (gpa >= 3.5) return 'A-';
  if (gpa >= 3.0) return 'B';
  if (gpa >= 2.0) return 'C';
  if (gpa >= 1.0) return 'D';
  return 'F';
}

function validateGradePoint(point: number, label: string): void {
  if (!Number.isFinite(point) || !VALID_GRADE_POINTS.has(point)) {
    throw new Error(
      `${label} must be a valid SSC/HSC grade point (5.0, 4.0, 3.5, 3.0, 2.0, 1.0 or 0.0), got ${point}`,
    );
  }
}

/**
 * Calculate the SSC/HSC GPA.
 *
 * @param mainGradePoints grade points of exactly 6 main subjects.
 * @param fourthSubjectGradePoint optional 4th-subject grade point.
 * @returns `{ gpa, passed, gradeLetter }`.
 *
 * Hand-check: [5, 5, 4, 4, 3.5, 3] with 4th subject 5.0 ->
 * (24.5 + min(3, 5-2)) / 6 = 27.5 / 6 = 4.58, grade A.
 */
export function calculateSscHscGpa(
  mainGradePoints: number[],
  fourthSubjectGradePoint?: number,
): SscHscGpaResult {
  if (!Array.isArray(mainGradePoints) || mainGradePoints.length !== SSC_HSC_MAIN_SUBJECT_COUNT) {
    throw new Error(
      `Exactly ${SSC_HSC_MAIN_SUBJECT_COUNT} main-subject grade points are required, got ${mainGradePoints?.length}`,
    );
  }
  mainGradePoints.forEach((point, i) => validateGradePoint(point, `Main subject ${i + 1}`));
  if (fourthSubjectGradePoint !== undefined) {
    validateGradePoint(fourthSubjectGradePoint, '4th subject');
  }

  if (mainGradePoints.includes(0.0)) {
    return { gpa: 0, passed: false, gradeLetter: 'F' };
  }

  const mainSum = mainGradePoints.reduce((sum, point) => sum + point, 0);
  const fourthExtra =
    fourthSubjectGradePoint === undefined
      ? 0
      : Math.min(
          SSC_HSC_FOURTH_SUBJECT_MAX_EXTRA,
          Math.max(0, fourthSubjectGradePoint - 2),
        );
  const rawGpa = (mainSum + fourthExtra) / SSC_HSC_MAIN_SUBJECT_COUNT;
  const gpa = Math.min(5.0, Math.round(rawGpa * 100) / 100);
  return { gpa, passed: true, gradeLetter: sscHscGradeLetterForGpa(gpa) };
}
