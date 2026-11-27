/**
 * International GPA Calculator — pure logic.
 * 4.0 scale (US, with +/-): A 4.0, A- 3.7, B+ 3.3, B 3.0, B- 2.7,
 * C+ 2.3, C 2.0, C- 1.7, D+ 1.3, D 1.0, F 0. 5.0 scale (weighted):
 * A 5.0, B 4.0, C 3.0, D 2.0, F 0. Credit-weighted GPA.
 * Pure functions only: no network, no storage, no DOM.
 */

export type GpaScale = '4.0' | '5.0';

export const GPA_4_SCALE: Record<string, number> = {
  A: 4.0, 'A-': 3.7, 'B+': 3.3, B: 3.0, 'B-': 2.7, 'C+': 2.3, C: 2.0, 'C-': 1.7, 'D+': 1.3, D: 1.0, F: 0,
};

export const GPA_5_SCALE: Record<string, number> = { A: 5.0, B: 4.0, C: 3.0, D: 2.0, F: 0 };

export function gradePointsForScale(scale: GpaScale): Record<string, number> {
  return scale === '4.0' ? GPA_4_SCALE : GPA_5_SCALE;
}

export interface GpaCourse {
  gradePoint: number;
  credit: number;
}

export interface InternationalGpaResult {
  gpa: number;
  totalCredits: number;
  scale: GpaScale;
}

/**
 * Credit-weighted GPA on the chosen scale.
 * Hand-check: [{4.0,3},{3.0,3},{3.7,2}] on 4.0 -> (12+9+7.4)/8 = 3.55.
 */
export function calculateInternationalGpa(courses: GpaCourse[], scale: GpaScale): InternationalGpaResult {
  if (!Array.isArray(courses) || courses.length === 0) {
    throw new Error('At least one course is required');
  }
  const valid = new Set(Object.values(gradePointsForScale(scale)));
  let weighted = 0;
  let credits = 0;
  courses.forEach((c, i) => {
    if (!valid.has(c.gradePoint)) throw new Error(`Course ${i + 1} grade point is not on the ${scale} scale`);
    if (!Number.isFinite(c.credit) || c.credit <= 0) throw new Error(`Course ${i + 1} credit must be positive`);
    weighted += c.gradePoint * c.credit;
    credits += c.credit;
  });
  return { gpa: Math.round((weighted / credits) * 100) / 100, totalCredits: credits, scale };
}

/** Convert a GPA between scales by proportion (e.g. 4.0 -> 5.0). */
export function convertGpaScale(gpa: number, from: GpaScale, to: GpaScale): number {
  if (from === to) return gpa;
  const fromMax = Number(from);
  const toMax = Number(to);
  return Math.round((gpa / fromMax) * toMax * 100) / 100;
}
