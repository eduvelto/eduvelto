/**
 * CGPA to Percentage Converter — pure logic.
 * Three clearly-labelled formulas (the user picks one; none is
 * presented as universal): proportional (CGPA/scale x 100), x9.5
 * (the common 10-point Indian formula) and x10. Pure functions only.
 */

export type PercentageFormula = 'proportional' | 'x9.5' | 'x10';

export const PERCENTAGE_FORMULAS: Record<PercentageFormula, { bn: string; en: string }> = {
  proportional: { bn: 'আনুপাতিক (সিজিপিএ ÷ স্কেল × ১০০)', en: 'Proportional (CGPA ÷ scale × 100)' },
  'x9.5': { bn: '× ৯.৫ (১০-পয়েন্ট স্কেলের সাধারণ সূত্র)', en: '× 9.5 (common 10-point formula)' },
  x10: { bn: '× ১০ (সরল)', en: '× 10 (simple)' },
};

export interface CgpaPercentageResult {
  percentage: number;
  formula: PercentageFormula;
  scale: number;
}

/**
 * Hand-check: CGPA 3.5 on 4.0 proportional -> 87.5%; x9.5 -> 33.25%.
 */
export function convertCgpaToPercentage(cgpa: number, scale: number, formula: PercentageFormula): CgpaPercentageResult {
  if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > scale) {
    throw new Error(`CGPA must be between 0 and ${scale}, got ${cgpa}`);
  }
  if (!Number.isFinite(scale) || scale <= 0) throw new Error(`Scale must be positive, got ${scale}`);
  let percentage: number;
  switch (formula) {
    case 'proportional': percentage = (cgpa / scale) * 100; break;
    case 'x9.5': percentage = cgpa * 9.5; break;
    case 'x10': percentage = cgpa * 10; break;
    default: throw new Error(`Unknown formula: ${formula as string}`);
  }
  return { percentage: Math.min(100, Math.round(percentage * 100) / 100), formula, scale };
}
