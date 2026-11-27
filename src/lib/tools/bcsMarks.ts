/**
 * BCS Marks Calculator — pure logic.
 *
 * Structure as EDITABLE DATA with source + date (BPSC published
 * structure, noted 27 Nov 2026 — verify against the current BPSC
 * circular; the viva mark has differed across sources, so it is
 * shown as 100 here with that warning in the UI): Preliminary 200
 * MCQ (1 mark each, negative 0.5 per wrong answer), Written 900
 * (Bangla 200, English 200, Bangladesh Affairs 200, International
 * Affairs 100, Mathematical Reasoning & Mental Ability 100,
 * General Science & Technology 100), Viva 100. Total 1200.
 * Pure functions only: no network, no storage, no DOM.
 */

export const BCS_STRUCTURE = {
  prelimTotal: 200,
  negativePerWrong: 0.5,
  writtenSubjects: [
    { key: 'bangla', bn: 'বাংলা', en: 'Bangla', max: 200 },
    { key: 'english', bn: 'ইংরেজি', en: 'English', max: 200 },
    { key: 'bangladeshAffairs', bn: 'বাংলাদেশ বিষয়াবলি', en: 'Bangladesh Affairs', max: 200 },
    { key: 'internationalAffairs', bn: 'আন্তর্জাতিক বিষয়াবলি', en: 'International Affairs', max: 100 },
    { key: 'mathMental', bn: 'গাণিতিক যুক্তি ও মানসিক দক্ষতা', en: 'Mathematical Reasoning & Mental Ability', max: 100 },
    { key: 'scienceTech', bn: 'সাধারণ বিজ্ঞান ও প্রযুক্তি', en: 'General Science & Technology', max: 100 },
  ],
  writtenTotal: 900,
  vivaTotal: 100,
  grandTotal: 1200,
  sourceBn: 'বিপিএসসির প্রকাশিত বিসিএস পরীক্ষার কাঠামো — ২৭ নভেম্বর ২০২৬ তারিখে লেখা; বর্তমান বিজ্ঞপ্তি দেখে যাচাই করুন। ভাইভার নম্বর বিভিন্ন সূত্রে ভিন্ন দেখা গেছে।',
  sourceEn: 'BPSC published BCS examination structure — noted 27 Nov 2026; verify against the current BPSC circular. The viva mark has differed across sources.',
  notedDate: '2026-11-27',
} as const;

export interface BcsMarksInput {
  prelimCorrect: number;
  prelimWrong: number;
  written: Record<string, number>;
  viva: number;
}

export interface BcsMarksResult {
  prelimScore: number;
  writtenTotal: number;
  viva: number;
  grandTotal: number;
  prelimPct: number;
  writtenPct: number;
  overallPct: number;
}

/**
 * Hand-check: prelim 150 correct, 30 wrong -> 150 - 15 = 135;
 * written all max -> 900; viva 80 -> grand 1115/1200 = 92.92%.
 */
export function calculateBcsMarks(input: BcsMarksInput): BcsMarksResult {
  const { prelimCorrect, prelimWrong, written, viva } = input;
  if (!Number.isInteger(prelimCorrect) || prelimCorrect < 0 || prelimCorrect > 200) {
    throw new Error('Preliminary correct answers must be 0–200');
  }
  if (!Number.isInteger(prelimWrong) || prelimWrong < 0 || prelimWrong + prelimCorrect > 200) {
    throw new Error('Preliminary wrong answers must fit within 200 questions');
  }
  if (!Number.isFinite(viva) || viva < 0 || viva > BCS_STRUCTURE.vivaTotal) {
    throw new Error(`Viva marks must be 0–${BCS_STRUCTURE.vivaTotal}`);
  }
  let writtenTotal = 0;
  for (const subject of BCS_STRUCTURE.writtenSubjects) {
    const m = written[subject.key] ?? 0;
    if (!Number.isFinite(m) || m < 0 || m > subject.max) {
      throw new Error(`${subject.en} marks must be 0–${subject.max}`);
    }
    writtenTotal += m;
  }
  const prelimScore = Math.round((prelimCorrect - prelimWrong * BCS_STRUCTURE.negativePerWrong) * 100) / 100;
  const grandTotal = Math.round((prelimScore + writtenTotal + viva) * 100) / 100;
  return {
    prelimScore,
    writtenTotal,
    viva,
    grandTotal,
    prelimPct: Math.round((prelimScore / 200) * 1000) / 10,
    writtenPct: Math.round((writtenTotal / 900) * 1000) / 10,
    overallPct: Math.round((grandTotal / 1200) * 1000) / 10,
  };
}
