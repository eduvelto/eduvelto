/**
 * Eduvelto Job Preparation — Grades 11–20 hub data
 * (design-grades-written-previous-admin.md §1).
 *
 * One hub slug ('grade-11-20'), six post-family pages under it —
 * NOT six exam slugs (Step 6 taxonomy is closed). Post-family
 * defs are code data in release 1: the directory is 6 families, so
 * filtering is client-side, zero Firestore reads.
 *
 * HARD RULES:
 * - Grade does NOT determine the exam pattern; the recruiting
 *   authority, the recruitment rules, the nature of the post and
 *   the specific circular do. No stage, mark, duration or practical
 *   requirement is shown as fact for a family until a verified
 *   config exists for it (GRADE_11_20_CONFIGS in jobExams.ts —
 *   empty in release 1).
 * - The 2026 draft standardisation figures are PROHIBITED: no
 *   default pattern, no mark split, no duration from the draft
 *   proposal may appear here, in a config, or in UI copy.
 * - A post whose grade the source never states is never forced
 *   into a grade band (E-9) — it sits under "গ্রেড উল্লেখ নেই".
 */

import type { Grade1120VerificationStatus } from './jobExams';

export type PracticalSkill = 'typing' | 'computer' | 'shorthand' | 'accounting' | 'none';

export type GradeBand = '11-12' | '13-16' | '17-20' | 'unstated';

export interface Grade1120PostFamily {
  slug: string;
  nameBn: string;
  nameEn: string;
  /** Category-level stage possibilities from the consultation — NOT
   * rules. A circular can prescribe otherwise. Shown only with the
   * family's verification label attached. */
  possibleStagesBn: string;
  possibleStagesEn: string;
  practicalSkill: PracticalSkill;
  practicalBn: string;
  practicalEn: string;
  /** Recruiting authorities known to hire for this post family, as
   * named in the consultation — general, never a per-circular claim. */
  authoritiesBn: string[];
  authoritiesEn: string[];
  /** Which of the four preparation kinds the page offers today. */
  offers: {
    mcq: boolean;
    modelTest: boolean;
    previous: boolean;
    written: boolean;
  };
  /** Verification state of the family's exam pattern. Release 1:
   * every family is 'not-verified' — no gazette/circular has been
   * opened and checked yet. */
  verificationStatus: Grade1120VerificationStatus;
  keywords: string[];
}

/** The 6 first-release post families, in priority order (§1.3). */
export const GRADE_11_20_POST_FAMILIES: Grade1120PostFamily[] = [
  {
    slug: 'office-assistant-typist',
    nameBn: 'অফিস সহকারী-কাম-কম্পিউটার মুদ্রাক্ষরিক',
    nameEn: 'Office Assistant-cum-Computer Typist',
    possibleStagesBn: 'লিখিত → টাইপিং/ব্যবহারিক → ভাইভা',
    possibleStagesEn: 'Written → Typing/practical → Viva',
    practicalSkill: 'typing',
    practicalBn: 'বাংলা + ইংরেজি টাইপিং',
    practicalEn: 'Bangla + English typing',
    authoritiesBn: ['বিভিন্ন মন্ত্রণালয় ও অধিদপ্তর'],
    authoritiesEn: ['Various ministries and departments'],
    offers: { mcq: true, modelTest: true, previous: true, written: true },
    verificationStatus: 'not-verified',
    keywords: ['office assistant', 'typist', 'মুদ্রাক্ষরিক', 'অফিস সহকারী', 'computer typist', 'oa'],
  },
  {
    slug: 'computer-operator',
    nameBn: 'কম্পিউটার অপারেটর',
    nameEn: 'Computer Operator',
    possibleStagesBn: 'লিখিত → কম্পিউটার ব্যবহারিক → ভাইভা',
    possibleStagesEn: 'Written → Computer practical → Viva',
    practicalSkill: 'computer',
    practicalBn: 'কম্পিউটার দক্ষতা (Word/Excel/PowerPoint, ফাইল ব্যবস্থাপনা)',
    practicalEn: 'Computer skills (Word/Excel/PowerPoint, file management)',
    authoritiesBn: ['বিভিন্ন মন্ত্রণালয় ও অধিদপ্তর'],
    authoritiesEn: ['Various ministries and departments'],
    offers: { mcq: true, modelTest: true, previous: true, written: true },
    verificationStatus: 'not-verified',
    keywords: ['computer operator', 'কম্পিউটার অপারেটর', 'computer'],
  },
  {
    slug: 'data-entry-operator',
    nameBn: 'ডেটা এন্ট্রি অপারেটর',
    nameEn: 'Data Entry Operator',
    possibleStagesBn: 'লিখিত/যোগ্যতা → টাইপিং/ব্যবহারিক → ভাইভা',
    possibleStagesEn: 'Written/aptitude → Typing/practical → Viva',
    practicalSkill: 'typing',
    practicalBn: 'টাইপিং + ডেটা এন্ট্রির নির্ভুলতা',
    practicalEn: 'Typing + data-entry accuracy',
    authoritiesBn: ['বিভিন্ন মন্ত্রণালয় ও অধিদপ্তর'],
    authoritiesEn: ['Various ministries and departments'],
    offers: { mcq: true, modelTest: true, previous: true, written: false },
    verificationStatus: 'not-verified',
    keywords: ['data entry', 'ডেটা এন্ট্রি', 'data entry operator'],
  },
  {
    slug: 'office-support-staff',
    nameBn: 'অফিস সহায়ক',
    nameEn: 'Office Support Staff',
    possibleStagesBn: 'লিখিত → ভাইভা (অথবা বিজ্ঞপ্তি অনুযায়ী)',
    possibleStagesEn: 'Written → Viva (or as specified)',
    practicalSkill: 'none',
    practicalBn: '—',
    practicalEn: '—',
    authoritiesBn: ['বিভিন্ন মন্ত্রণালয় ও অধিদপ্তর'],
    authoritiesEn: ['Various ministries and departments'],
    offers: { mcq: true, modelTest: true, previous: true, written: false },
    verificationStatus: 'not-verified',
    keywords: ['office support', 'অফিস সহায়ক', 'office sohayok', 'peon', 'office assistant support'],
  },
  {
    slug: 'accounts-assistant',
    nameBn: 'হিসাব সহকারী / ক্যাশিয়ার',
    nameEn: 'Accounts Assistant / Cashier',
    possibleStagesBn: 'লিখিত → ভাইভা (অথবা বিজ্ঞপ্তি অনুযায়ী)',
    possibleStagesEn: 'Written → Viva (or as specified)',
    practicalSkill: 'accounting',
    practicalBn: 'মৌলিক হিসাববিজ্ঞান (ডেবিট/ক্রেডিট, খতিয়ান, নগদান বই)',
    practicalEn: 'Basic accounting (debit/credit, ledger, cash book)',
    authoritiesBn: ['বিভিন্ন মন্ত্রণালয় ও অধিদপ্তর'],
    authoritiesEn: ['Various ministries and departments'],
    offers: { mcq: true, modelTest: true, previous: true, written: true },
    verificationStatus: 'not-verified',
    keywords: ['accounts', 'cashier', 'হিসাব সহকারী', 'ক্যাশিয়ার', 'accountant'],
  },
  {
    slug: 'stenographer',
    nameBn: 'সাঁটলিপিকার-কাম-কম্পিউটার অপারেটর',
    nameEn: 'Stenographer-cum-Computer Operator',
    possibleStagesBn: 'লিখিত → সাঁটলিপি/টাইপিং → ভাইভা',
    possibleStagesEn: 'Written → Shorthand/typing → Viva',
    practicalSkill: 'shorthand',
    practicalBn: 'সাঁটলিপি + প্রতিলিপি (ট্রান্সক্রিপশন)',
    practicalEn: 'Shorthand + transcription',
    authoritiesBn: ['বিভিন্ন মন্ত্রণালয় ও অধিদপ্তর'],
    authoritiesEn: ['Various ministries and departments'],
    offers: { mcq: true, modelTest: true, previous: true, written: true },
    verificationStatus: 'not-verified',
    keywords: ['stenographer', 'সাঁটলিপিকার', 'shorthand', 'steno'],
  },
];

export function grade1120FamilyBySlug(slug: string): Grade1120PostFamily | undefined {
  return GRADE_11_20_POST_FAMILIES.find((f) => f.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Verification labelling — exact wording (§1.5)                       */
/* ------------------------------------------------------------------ */

export const GRADE_11_20_VERIFICATION_LABELS: Record<
  Grade1120VerificationStatus,
  { chipBn: string; chipEn: string; meaningBn: string; meaningEn: string }
> = {
  verified: {
    chipBn: 'যাচাইকৃত',
    chipEn: 'Verified',
    meaningBn: 'অফিসিয়াল গেজেট / বিধিমালা / বিজ্ঞপ্তি দিয়ে যাচাই করা হয়েছে। নম্বর, বিষয়, সময় ও ধাপ নিচে উৎসসহ দেওয়া আছে।',
    meaningEn: 'Checked against an official gazette / regulation / circular. Marks, subjects, time and stages are shown below with the source.',
  },
  'partially-verified': {
    chipBn: 'আংশিক যাচাইকৃত',
    chipEn: 'Partially verified',
    meaningBn: 'কিছু তথ্য যাচাই হয়েছে, কিছু হয়নি — যেমন লিখিত পরীক্ষা নিশ্চিত, কিন্তু ব্যবহারিক পরীক্ষার নম্বর/সময় প্রকাশিত হয়নি। যাচাই হয়নি এমন কিছু এখানে লেখা হয়নি।',
    meaningEn: 'Some details are confirmed, others are not — e.g. the written exam is confirmed but the practical test’s marks/time are unpublished. Nothing unverified is written here.',
  },
  'not-verified': {
    chipBn: 'এখনো যাচাই হয়নি',
    chipEn: 'Not yet verified',
    meaningBn: 'এই পদের পরীক্ষার ধরন সম্পর্কে কোনো নির্ভরযোগ্য সরকারি সূত্র এখনো পাওয়া যায়নি। এখানে শুধু সাধারণ প্রস্তুতির উপকরণ আছে — কোনো নম্বর, সময় বা ধাপ অনুমান করে লেখা হয়নি।',
    meaningEn: 'No authoritative government source for this post’s exam pattern has been found yet. Only general preparation material is here — no marks, time or stages are assumed.',
  },
};

export function grade1120VerificationLabel(status: Grade1120VerificationStatus) {
  return GRADE_11_20_VERIFICATION_LABELS[status];
}

/** Stages line for a 'not-verified' family (§1.3): stages follow the circular. */
export const GRADE_11_20_STAGES_NOT_VERIFIED = {
  bn: 'ধাপ বিজ্ঞপ্তি অনুযায়ী — এখনো যাচাই হয়নি',
  en: 'Stages follow the circular — not yet verified',
} as const;

/* ------------------------------------------------------------------ */
/* Post directory — search + filters (§1.6)                            */
/* ------------------------------------------------------------------ */

export interface Grade1120DirectoryFilters {
  /** Free text over post name (Bn + En), authority name, keywords. */
  query: string;
  /** Post family slug, or 'all'. */
  family: string;
  /** Grade band — only where the source states a grade. Release 1:
   * no family has a stated grade, so every family is 'unstated'. */
  gradeBand: GradeBand | 'all';
  /** Recruiting authority (free text in release 1 — the filter lists
   * only values that actually occur in verified configs, and there
   * are none yet). */
  authority: string;
  /** Exam type derived from configs; 'not-verified' posts appear
   * under every exam-type filter with their label, never excluded. */
  examType: 'written-only' | 'written-practical' | 'written-viva' | 'all';
  /** Required practical skill. */
  skill: PracticalSkill | 'all';
}

export const GRADE_11_20_EMPTY_FILTERS: Grade1120DirectoryFilters = {
  query: '',
  family: 'all',
  gradeBand: 'all',
  authority: '',
  examType: 'all',
  skill: 'all',
};

/** Grade band of a family today: release 1 has no stated grades, so
 * every family is 'unstated' (E-9 — never forced into a band). */
export function grade1120GradeBandOf(_family: Grade1120PostFamily): GradeBand {
  return 'unstated';
}

function fold(s: string): string {
  return s.toLowerCase().trim();
}

export function filterGrade1120Directory(
  families: Grade1120PostFamily[],
  filters: Grade1120DirectoryFilters,
): Grade1120PostFamily[] {
  const q = fold(filters.query);
  const authority = fold(filters.authority);
  return families.filter((f) => {
    if (filters.family !== 'all' && f.slug !== filters.family) return false;
    if (filters.gradeBand !== 'all' && grade1120GradeBandOf(f) !== filters.gradeBand) return false;
    if (filters.skill !== 'all' && f.practicalSkill !== filters.skill) return false;
    // Exam-type filter: configs do not exist yet, so a 'not-verified'
    // family appears under EVERY exam-type filter with its label —
    // never excluded silently (§1.6).
    if (q !== '') {
      const haystack = fold(
        [f.nameBn, f.nameEn, ...f.authoritiesBn, ...f.authoritiesEn, ...f.keywords].join(' '),
      );
      if (!haystack.includes(q)) return false;
    }
    if (authority !== '') {
      const haystack = fold([...f.authoritiesBn, ...f.authoritiesEn].join(' '));
      if (!haystack.includes(authority)) return false;
    }
    return true;
  });
}

/** Filter values that actually occur in verified configs (§1.6):
 * an empty filter value can never appear. Release 1: no verified
 * configs exist, so every value list is empty except the families. */
export function grade1120AvailableFilterValues(): {
  gradeBands: GradeBand[];
  authorities: string[];
  skills: PracticalSkill[];
} {
  return { gradeBands: [], authorities: [], skills: [] };
}

export const GRADE_11_20_EMPTY_RESULTS = {
  bn: 'এই খোঁজে কোনো পদ পাওয়া যায়নি — ফিল্টার কমিয়ে আবার চেষ্টা করুন।',
  en: 'No post matches this search — loosen the filters and try again.',
} as const;

/** The four preparation kinds, with their hub-relative links. */
export function grade1120PreparationLinks(family: Grade1120PostFamily): Array<{
  key: 'mcq' | 'modelTest' | 'previous' | 'written';
  bn: string;
  en: string;
  href: string | null;
}> {
  const base = `/jobs/grade-11-20/posts/${family.slug}`;
  return [
    { key: 'mcq', bn: 'MCQ অনুশীলন', en: 'MCQ Practice', href: family.offers.mcq ? '/jobs/common' : null },
    { key: 'modelTest', bn: 'মডেল টেস্ট', en: 'Model Test', href: family.offers.modelTest ? `${base}#model-test` : null },
    { key: 'previous', bn: 'বিগত প্রশ্ন', en: 'Previous Questions', href: family.offers.previous ? `${base}#previous` : null },
    { key: 'written', bn: 'লিখিত প্রস্তুতি', en: 'Written Preparation', href: family.offers.written ? '/jobs/grade-11-20/written' : null },
  ];
}
