// Eduvelto — Job Preparation section (master plan workstream B, P0;
// design + navigation plan team/job-preparation-design-plan-2026-11-21.md).
//
// B-1.3 — STRUCTURE ONLY. This file is the section's data: exam
// definitions, the 8 hub tabs, the 7 "100% preparation" elements, the
// common-topic map (preliminary) and the regular-mock system design.
// NO question content, NO syllabus tables, NO mock exams live here —
// those come in B-2.1 / B-2.2 / B-10.2 after teacher review. Every
// content area on the pages renders an honest empty / Coming Soon
// state until then (0 verified teachers today).
//
// HONESTY: exam names (BCS / Bank / NTRCA …) are never translated.
// Marks, times, age limits and fees are NEVER hard-coded here — they
// change with every circular, so each hub links to the official site
// and says "see the latest circular" instead. The BCS viva marks
// (200 vs 100) are disputed and NTRCA 19th pattern is contradictory —
// neither is written anywhere. The common-topic map is a PRELIMINARY
// estimate from the job analysis (B-10.1 finalises it against the four
// official syllabuses); no topic is called "confirmed common" yet.
// No "you will pass / you will get the job" claim anywhere.
//
// Accent colours: white text on each accent passes WCAG AA normal
// (measured 21 Nov 2026): teal-deep 5.47, blue 6.70, green 5.02,
// purple 6.98, orange 5.18, pink 7.88, amber 7.09, blue-800 8.72,
// stone 7.63, amber-deep 5.54.

export interface JobExamDef {
  /** URL slug: /jobs/<slug>. */
  slug: string;
  /** Bangla display name, e.g. 'বিসিএস'. Never translated — exam names stay as-is. */
  bn: string;
  /** English display name, e.g. 'BCS'. */
  en: string;
  /** Full Bangla name, e.g. 'বাংলাদেশ সিভিল সার্ভিস'. */
  fullBn: string;
  /** Full English name. */
  fullEn: string;
  /** Recruiting body, Bangla. */
  orgBn: string;
  /** Recruiting body, English. */
  orgEn: string;
  /** Exam stages, Bangla, e.g. 'প্রিলি → লিখিত → ভাইভা'. */
  stepsBn: string;
  /** Exam stages, English. */
  stepsEn: string;
  /** Official site — every hub links here for the latest circular.
      null when no single official site exists (Private & NGO jobs). */
  officialUrl: string | null;
  /** Optional link-label override — used when the URL is a generic
      portal (bangladesh.gov.bd), not the exam's own circular page,
      so the link never promises "the latest circular". */
  officialLinkBn?: string;
  officialLinkEn?: string;
  /** Tier from the job analysis: 1 = main exams, 2 = DGFood/NTRCA/non-cadre, 3 = CAG/BFSA/others + the expanded categories (ministries, defence, autonomous, private & NGO). */
  tier: 1 | 2 | 3;
  /** Readiness of this exam's scope (Step 5 closure, P1-5): 'defined'
   * means the exam's scope is settled and Step 6 may build its
   * subject structure; 'scope_pending' means the scope is UNDECIDED
   * (owner decision 13.8 — only it-professional today) and Step 6
   * must NOT generate any syllabus for it. */
  scopeStatus: 'defined' | 'scope_pending';
  /** Card/header background (white text on it is AA). */
  accent: string;
  /** Soft tint for chips/tiles on light surfaces. */
  accentSoft: string;
  /** Deep tone for text/links on light surfaces. */
  accentDeep: string;
}

export const JOB_EXAMS: JobExamDef[] = [
  {
    slug: 'bcs',
    bn: 'বিসিএস',
    en: 'BCS',
    fullBn: 'বাংলাদেশ সিভিল সার্ভিস',
    fullEn: 'Bangladesh Civil Service',
    orgBn: 'বাংলাদেশ পাবলিক সার্ভিস কমিশন (BPSC)',
    orgEn: 'Bangladesh Public Service Commission (BPSC)',
    stepsBn: 'প্রিলি → লিখিত → ভাইভা',
    stepsEn: 'Preliminary → Written → Viva',
    officialUrl: 'https://bpsc.gov.bd',
    tier: 1,
    scopeStatus: 'defined',
    accent: '#12766E',
    accentSoft: '#E3F2F0',
    accentDeep: '#0F5E57',
  },
  {
    slug: 'bank',
    bn: 'ব্যাংক',
    en: 'Bank',
    fullBn: 'ব্যাংক নিয়োগ পরীক্ষা',
    fullEn: 'Bank Recruitment Exam',
    orgBn: 'ব্যাংকার্স সিলেকশন কমিটি (BSCS), বাংলাদেশ ব্যাংক',
    orgEn: 'Bankers Selection Committee (BSCS), Bangladesh Bank',
    stepsBn: 'প্রিলি → লিখিত → ভাইভা',
    stepsEn: 'Preliminary → Written → Viva',
    officialUrl: 'https://erecruitment.bb.org.bd',
    tier: 1,
    scopeStatus: 'defined',
    accent: '#1D4ED8',
    accentSoft: '#E7EDFC',
    accentDeep: '#1E3A8A',
  },
  {
    slug: 'primary-teacher',
    bn: 'প্রাথমিক শিক্ষক',
    en: 'Primary Teacher',
    fullBn: 'সরকারি প্রাথমিক বিদ্যালয় সহকারী শিক্ষক',
    fullEn: 'Assistant Teacher, Government Primary School',
    orgBn: 'প্রাথমিক শিক্ষা অধিদপ্তর (DPE)',
    orgEn: 'Directorate of Primary Education (DPE)',
    stepsBn: 'লিখিত (MCQ) → ভাইভা',
    stepsEn: 'Written (MCQ) → Viva',
    officialUrl: 'https://dpe.gov.bd',
    tier: 1,
    scopeStatus: 'defined',
    accent: '#15803D',
    accentSoft: '#E7F4EB',
    accentDeep: '#14532D',
  },
  {
    slug: 'ntrca',
    bn: 'NTRCA',
    en: 'NTRCA',
    fullBn: 'বেসরকারি শিক্ষক নিবন্ধন পরীক্ষা',
    fullEn: 'Non-Government Teachers Registration Exam',
    orgBn: 'বেসরকারি শিক্ষক নিবন্ধন ও প্রত্যয়ন কর্তৃপক্ষ (NTRCA)',
    orgEn: 'Non-Government Teachers Registration & Certification Authority (NTRCA)',
    stepsBn: 'প্রিলি → লিখিত → ভাইভা',
    stepsEn: 'Preliminary → Written → Viva',
    officialUrl: 'https://ntrca.gov.bd',
    tier: 2,
    scopeStatus: 'defined',
    accent: '#7E22CE',
    accentSoft: '#F3E8FB',
    accentDeep: '#581C87',
  },
  {
    slug: 'dgfood',
    bn: 'খাদ্য অধিদপ্তর',
    en: 'DGFood',
    fullBn: 'খাদ্য অধিদপ্তর নিয়োগ পরীক্ষা',
    fullEn: 'Directorate General of Food Recruitment Exam',
    orgBn: 'খাদ্য অধিদপ্তর (DGFood)',
    orgEn: 'Directorate General of Food (DGFood)',
    stepsBn: 'MCQ → লিখিত → ভাইভা',
    stepsEn: 'MCQ → Written → Viva',
    officialUrl: 'https://dgfood.gov.bd',
    tier: 2,
    scopeStatus: 'defined',
    accent: '#C2410C',
    accentSoft: '#FBEDE7',
    accentDeep: '#7C2D12',
  },
  {
    slug: 'bpsc-non-cadre',
    bn: 'BPSC নন-ক্যাডার',
    en: 'BPSC Non-Cadre',
    fullBn: 'BPSC নন-ক্যাডার নিয়োগ পরীক্ষা',
    fullEn: 'BPSC Non-Cadre Recruitment Exam',
    orgBn: 'বাংলাদেশ পাবলিক সার্ভিস কমিশন (BPSC)',
    orgEn: 'Bangladesh Public Service Commission (BPSC)',
    stepsBn: 'আবেদন যাচাই → লিখিত/ব্যবহারিক → ভাইভা',
    stepsEn: 'Application screening → Written/Practical → Viva',
    officialUrl: 'https://bpsc.gov.bd',
    tier: 2,
    scopeStatus: 'defined',
    accent: '#9D174D',
    accentSoft: '#FBE8F0',
    accentDeep: '#831843',
  },
  {
    slug: 'cag',
    bn: 'CAG',
    en: 'CAG',
    fullBn: 'মহাহিসাব নিরীক্ষক ও নিয়ন্ত্রকের কার্যালয়',
    fullEn: 'Office of the Comptroller and Auditor General',
    orgBn: 'মহাহিসাব নিরীক্ষক ও নিয়ন্ত্রকের কার্যালয় (CAG)',
    orgEn: 'Office of the Comptroller and Auditor General (CAG)',
    stepsBn: 'লিখিত/MCQ → টাইপিং/ব্যবহারিক → ভাইভা',
    stepsEn: 'Written/MCQ → Typing/Practical → Viva',
    officialUrl: 'https://cag.gov.bd',
    tier: 3,
    scopeStatus: 'defined',
    accent: '#92400E',
    accentSoft: '#FBF0E2',
    accentDeep: '#78350F',
  },
  {
    slug: 'bfsa',
    bn: 'BFSA',
    en: 'BFSA',
    fullBn: 'বাংলাদেশ নিরাপদ খাদ্য কর্তৃপক্ষ',
    fullEn: 'Bangladesh Food Safety Authority',
    orgBn: 'বাংলাদেশ নিরাপদ খাদ্য কর্তৃপক্ষ (BFSA)',
    orgEn: 'Bangladesh Food Safety Authority (BFSA)',
    stepsBn: 'MCQ → লিখিত → ভাইভা',
    stepsEn: 'MCQ → Written → Viva',
    officialUrl: 'https://bfsa.gov.bd',
    tier: 3,
    scopeStatus: 'defined',
    accent: '#1E40AF',
    accentSoft: '#E7EBFB',
    accentDeep: '#1E3A8A',
  },
  {
    slug: 'others',
    bn: 'অন্যান্য সরকারি চাকরি',
    en: 'Other Govt Jobs',
    fullBn: 'অন্যান্য সরকারি চাকরির পরীক্ষা',
    fullEn: 'Other Government Job Exams',
    orgBn: 'বিভিন্ন অধিদপ্তর ও সংস্থা',
    orgEn: 'Various departments and organisations',
    stepsBn: 'বিজ্ঞপ্তি অনুযায়ী',
    stepsEn: 'As per circular',
    officialUrl: 'https://bangladesh.gov.bd',
    officialLinkBn: 'সরকারি পোর্টাল দেখুন →',
    officialLinkEn: 'See the government portal →',
    tier: 3,
    scopeStatus: 'defined',
    accent: '#57534E',
    accentSoft: '#F0EFEA',
    accentDeep: '#44403C',
  },
  // Expanded categories (owner's 19 Nov 2026 four-section brief — Job
  // Preparation = highest priority). All circular-based: no pattern,
  // no posts, no dates are invented for them; each hub is structure
  // with honest Coming Soon states until a circular is verified.
  {
    slug: 'ministries',
    bn: 'মন্ত্রণালয় ও অধিদপ্তর',
    en: 'Ministries & Directorates',
    fullBn: 'মন্ত্রণালয় ও অধিদপ্তরের নিয়োগ পরীক্ষা',
    fullEn: 'Ministries & Directorates Recruitment Exams',
    orgBn: 'বিভিন্ন মন্ত্রণালয় ও অধিদপ্তর',
    orgEn: 'Various ministries and directorates',
    stepsBn: 'বিজ্ঞপ্তি অনুযায়ী',
    stepsEn: 'As per circular',
    officialUrl: 'https://bangladesh.gov.bd',
    officialLinkBn: 'সরকারি পোর্টাল দেখুন →',
    officialLinkEn: 'See the government portal →',
    tier: 3,
    scopeStatus: 'defined',
    accent: '#3730A3',
    accentSoft: '#E8E9FB',
    accentDeep: '#312E81',
  },
  {
    slug: 'defence',
    bn: 'প্রতিরক্ষা',
    en: 'Defence',
    fullBn: 'প্রতিরক্ষা: পুলিশ / সেনা / নৌ / বিমান বাহিনী নিয়োগ পরীক্ষা',
    fullEn: 'Defence: Police / Army / Navy / Air Force Recruitment Exams',
    orgBn: 'বাংলাদেশ পুলিশ, সেনাবাহিনী, নৌবাহিনী ও বিমান বাহিনী',
    orgEn: 'Bangladesh Police, Army, Navy and Air Force',
    stepsBn: 'বিজ্ঞপ্তি অনুযায়ী',
    stepsEn: 'As per circular',
    officialUrl: 'https://bangladesh.gov.bd',
    officialLinkBn: 'সরকারি পোর্টাল দেখুন →',
    officialLinkEn: 'See the government portal →',
    tier: 3,
    scopeStatus: 'defined',
    accent: '#B91C1C',
    accentSoft: '#FDECEC',
    accentDeep: '#7F1D1D',
  },
  {
    slug: 'autonomous',
    bn: 'স্বায়ত্তশাসিত প্রতিষ্ঠান',
    en: 'Autonomous Institutions',
    fullBn: 'স্বায়ত্তশাসিত প্রতিষ্ঠান ও কর্পোরেশনের নিয়োগ পরীক্ষা',
    fullEn: 'Autonomous Institutions & Corporations Recruitment Exams',
    orgBn: 'বিভিন্ন স্বায়ত্তশাসিত প্রতিষ্ঠান ও কর্পোরেশন',
    orgEn: 'Various autonomous institutions and corporations',
    stepsBn: 'বিজ্ঞপ্তি অনুযায়ী',
    stepsEn: 'As per circular',
    officialUrl: 'https://bangladesh.gov.bd',
    officialLinkBn: 'সরকারি পোর্টাল দেখুন →',
    officialLinkEn: 'See the government portal →',
    tier: 3,
    scopeStatus: 'defined',
    accent: '#0E7490',
    accentSoft: '#E2F2F5',
    accentDeep: '#155E75',
  },
  {
    slug: 'private-ngo',
    bn: 'বেসরকারি ও এনজিও',
    en: 'Private & NGO Jobs',
    fullBn: 'বেসরকারি প্রতিষ্ঠান ও এনজিওর চাকরির প্রস্তুতি',
    fullEn: 'Private & NGO Job Preparation',
    orgBn: 'বেসরকারি প্রতিষ্ঠান ও এনজিও',
    orgEn: 'Private organisations and NGOs',
    stepsBn: 'প্রতিষ্ঠান অনুযায়ী',
    stepsEn: 'As per organisation',
    officialUrl: null,
    tier: 3,
    scopeStatus: 'defined',
    accent: '#A21CAF',
    accentSoft: '#FBE9F7',
    accentDeep: '#701A75',
  },
  // Step 5 — IT & Professional Jobs (Step 2 §2.9, owner brief category 9).
  // Scope UNDECIDED (Step 2 §13.8 — owner decision): which posts/exams
  // belong here (government IT posts? private IT jobs? professional
  // certificates?) is not decided, so this hub is STRUCTURE + honest
  // empty state only — no pattern, no marks, no post counts guessed.
  // Accent #1E3A5F (Step 2 §2.9 proposal, §13.10 — AA verified, white
  // text 11.6:1, same triple as the category in jobProfile.ts).
  // officialUrl null: no single official site (like private-ngo).
  {
    slug: 'it-professional',
    bn: 'IT ও পেশাগত চাকরি',
    en: 'IT & Professional Jobs',
    fullBn: 'IT ও পেশাগত চাকরির প্রস্তুতি',
    fullEn: 'IT & Professional Job Preparation',
    orgBn: 'বিভিন্ন IT ও পেশাগত প্রতিষ্ঠান',
    orgEn: 'Various IT and professional organisations',
    stepsBn: 'বিজ্ঞপ্তি অনুযায়ী',
    stepsEn: 'As per circular',
    officialUrl: null,
    tier: 3,
    scopeStatus: 'scope_pending',
    accent: '#1E3A5F',
    accentSoft: '#E8EDF3',
    accentDeep: '#152A45',
  },
];

export function jobExamBySlug(slug: string): JobExamDef | undefined {
  return JOB_EXAMS.find((e) => e.slug === slug);
}

/**
 * Verified exam pattern for the 4 main exams — job analysis §8.1
 * (read 21 Nov 2026) / design plan §2. ONLY these figures are written:
 * the MCQ-stage subject breakdown, total, time and negative marking.
 * Age limits, fees and exam dates are NEVER written (they change with
 * every circular). BCS viva marks are NEVER written (200 vs 100
 * disputed). NTRCA is labelled "last verified pattern (18th)" — the
 * 19th pattern is NOT written (contradictory claims). Every pattern
 * carries the "verify against the latest circular" caveat on the page.
 * Exams without a verified pattern are circular-based: their hubs show
 * an honest "circular-based" state instead of a table.
 */
export interface ExamPatternRow {
  subjectBn: string;
  subjectEn: string;
  marks: string;
}

export interface ExamPattern {
  /** e.g. 'প্রিলিমিনারি — যাচাইকৃত ধরন'. */
  titleBn: string;
  titleEn: string;
  rows: ExamPatternRow[];
  totalBn: string;
  totalEn: string;
  timeBn: string;
  timeEn: string;
  negativeBn: string;
  negativeEn: string;
  noteBn?: string;
  noteEn?: string;
}

export const EXAM_PATTERNS: Partial<Record<string, ExamPattern>> = {
  bcs: {
    titleBn: 'প্রিলিমিনারি — ৫০তম BCS সিলেবাস (৯ ডিসেম্বর ২০২৫)',
    titleEn: 'Preliminary — 50th BCS syllabus (9 December 2025)',
    rows: [
      { subjectBn: 'বাংলা ভাষা ও সাহিত্য', subjectEn: 'Bangla Language & Literature', marks: '৩০' },
      { subjectBn: 'ইংরেজি ভাষা ও সাহিত্য', subjectEn: 'English Language & Literature', marks: '৩০' },
      { subjectBn: 'বাংলাদেশ বিষয়াবলি', subjectEn: 'Bangladesh Affairs', marks: '২৫' },
      { subjectBn: 'আন্তর্জাতিক বিষয়াবলি', subjectEn: 'International Affairs', marks: '২৫' },
      { subjectBn: 'ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা', subjectEn: 'Geography, Environment & Disaster Management', marks: '১০' },
      { subjectBn: 'সাধারণ বিজ্ঞান', subjectEn: 'General Science', marks: '১৫' },
      { subjectBn: 'কম্পিউটার ও তথ্যপ্রযুক্তি', subjectEn: 'Computer & ICT', marks: '১৫' },
      { subjectBn: 'গাণিতিক যুক্তি', subjectEn: 'Mathematical Reasoning', marks: '২০' },
      { subjectBn: 'মানসিক দক্ষতা', subjectEn: 'Mental Ability', marks: '১৫' },
      { subjectBn: 'নৈতিকতা, মূল্যবোধ ও সুশাসন', subjectEn: 'Ethics, Values & Good Governance', marks: '১৫' },
    ],
    totalBn: 'মোট ২০০ নম্বর',
    totalEn: 'Total 200 marks',
    timeBn: '২ ঘণ্টা',
    timeEn: '2 hours',
    negativeBn: 'ভুল উত্তরে ০.৫০ নম্বর কাটা যায়',
    negativeEn: '0.50 deducted per wrong answer',
    noteBn: 'প্রিলিমিনারি শুধু বাছাই — এর নম্বর চূড়ান্ত নম্বরে যোগ হয় না। লিখিত: সাধারণ ক্যাডার ৯০০, টেকনিক্যাল/প্রফেশনাল ক্যাডার ১,১০০ নম্বর। ভাইভার নম্বর এখানে লেখা হয়নি — সূত্রে দ্বন্দ্ব আছে (২০০ বনাম ১০০); সর্বশেষ BPSC বিজ্ঞপ্তি দিয়ে যাচাই করে লেখা হবে। ধরন: ৫০তম BCS প্রিলিমিনারি সিলেবাস, BPSC, ৯ ডিসেম্বর ২০২৫ — BPSC-র অফিসিয়াল PDF সরাসরি যাচাইকৃত (২৪ নভেম্বর ২০২৬)।',
    noteEn: 'Preliminary is screening only — its marks do not count toward the final total. Written: 900 (general cadre), 1,100 (technical/professional cadre). Viva marks are not written here — sources disagree (200 vs 100); they will be written after verification from the latest BPSC circular. Pattern: 50th BCS preliminary syllabus, BPSC, 9 December 2025 — verified directly from the official BPSC PDF (24 November 2026).',
  },
  bank: {
    titleBn: 'প্রিলিমিনারি — যাচাইকৃত বিষয়বণ্টন (অফিসার, ক্যাশ) · নেগেটিভ মার্কিং −০.২৫ যাচাইকৃত',
    titleEn: 'Preliminary — verified subject split (Officer, Cash) · negative marking −0.25 verified',
    rows: [
      { subjectBn: 'বাংলা', subjectEn: 'Bangla', marks: '২৫' },
      { subjectBn: 'ইংরেজি', subjectEn: 'English', marks: '২৫' },
      { subjectBn: 'সাধারণ গণিত ও পরিমাণগত দক্ষতা', subjectEn: 'General Math & Quantitative Aptitude', marks: '২০' },
      { subjectBn: 'সাধারণ জ্ঞান', subjectEn: 'General Knowledge', marks: '২০' },
      { subjectBn: 'কম্পিউটারের মৌলিক জ্ঞান', subjectEn: 'Basic Computer Knowledge', marks: '১০' },
    ],
    totalBn: 'মোট ১০০ নম্বর',
    totalEn: 'Total 100 marks',
    timeBn: '১ ঘণ্টা',
    timeEn: '1 hour',
    negativeBn: 'ভুল উত্তরে ০.২৫ নম্বর কাটা যায় (২০২৫–২৬ সালের বিজ্ঞপ্তি অনুযায়ী যাচাইকৃত; হার বিজ্ঞপ্তি/প্রবেশপত্রে নির্ধারিত হয়)',
    negativeEn: '0.25 deducted per wrong answer (verified for the 2025–26 circulars; the rate is set in each circular / admit card)',
    noteBn: 'পদভেদে ধরন ভিন্ন — অফিসার/ক্যাশ: বাংলা ২৫, ইংরেজি ২৫, গণিত ২০, সাধারণ জ্ঞান ২০, কম্পিউটার ১০। সিনিয়র অফিসার ও সহকারী পরিচালক (বাংলাদেশ ব্যাংক): ইংরেজি ২০, বাংলা ২০, গণিত ২০, ব্যাংকিং জ্ঞান ১০, বিশ্লেষণী দক্ষতা ২০, আইসিটি ১০। লিখিত: ২০০ নম্বর, ২ ঘণ্টা। ভাইভা: সাধারণত ২৫ নম্বর — বিজ্ঞপ্তি দিয়ে যাচাই করতে হবে। নেগেটিভ মার্কিং −০.২৫ — ২০২৫–২৬ সালের বিজ্ঞপ্তি (Combined 11 Bank Officer Circular 115/2025; Bangladesh Bank AD Notice HRD-1 No. 38/2026, ৪ মে ২০২৬) দিয়ে যাচাইকৃত; প্রতিটি বিজ্ঞপ্তির হারই চূড়ান্ত।',
    noteEn: 'The pattern differs by post — Officer/Cash: Bangla 25, English 25, Math 20, GK 20, Computer 10. Senior Officer and Assistant Director (Bangladesh Bank): English 20, Bangla 20, Math 20, Financial & Banking Knowledge 10, Analytical Skills 20, ICT 10. Written: 200 marks, 2 hours. Viva: usually 25 marks — to be verified per circular. Negative marking −0.25 — verified for the 2025–26 circulars (Combined 11 Bank Officer Circular 115/2025; Bangladesh Bank AD Notice HRD-1 No. 38/2026, 4 May 2026); each circular’s rate is final.',
  },
  'bank-senior-officer': {
    titleBn: 'প্রিলিমিনারি — যাচাইকৃত ধরন (সিনিয়র অফিসার)',
    titleEn: 'Preliminary — verified pattern (Senior Officer)',
    rows: [
      { subjectBn: 'ইংরেজি (ব্যাকরণ ও ভাষা)', subjectEn: 'English (Grammar & Language)', marks: '২০' },
      { subjectBn: 'বাংলা (ব্যাকরণ ও ভাষা)', subjectEn: 'Bangla (Grammar & Language)', marks: '২০' },
      { subjectBn: 'সাধারণ গণিত', subjectEn: 'General Mathematics', marks: '২০' },
      { subjectBn: 'আর্থিক ও ব্যাংকিং জ্ঞান', subjectEn: 'Financial and Banking Knowledge', marks: '১০' },
      { subjectBn: 'বিশ্লেষণী দক্ষতা', subjectEn: 'Analytical Skills', marks: '২০' },
      { subjectBn: 'তথ্য ও যোগাযোগ প্রযুক্তির মৌলিক জ্ঞান', subjectEn: 'Basic Knowledge of ICT', marks: '১০' },
    ],
    totalBn: 'মোট ১০০ নম্বর',
    totalEn: 'Total 100 marks',
    timeBn: '১ ঘণ্টা',
    timeEn: '1 hour',
    negativeBn: 'ভুল উত্তরে ০.২৫ নম্বর কাটা যায় (২০২৫–২৬ সালের বিজ্ঞপ্তি অনুযায়ী যাচাইকৃত; হার বিজ্ঞপ্তি/প্রবেশপত্রে নির্ধারিত হয়)',
    negativeEn: '0.25 deducted per wrong answer (verified for the 2025–26 circulars; the rate is set in each circular / admit card)',
    noteBn: 'উৎস: BSCS Circulars 109/2025 + 348/2026; পরীক্ষা ৫ ডিসেম্বর ২০২৫ ও ১৩ নভেম্বর ২০২৬। লিখিত: ২০০ নম্বর, ২ ঘণ্টা। ভাইভা: সাধারণত ২৫ নম্বর — বিজ্ঞপ্তি দিয়ে যাচাই করতে হবে।',
    noteEn: 'Source: BSCS Circulars 109/2025 + 348/2026; exams 5 December 2025 and 13 November 2026. Written: 200 marks, 2 hours. Viva: usually 25 marks — to be verified per circular.',
  },
  'bank-assistant-director': {
    titleBn: 'প্রিলিমিনারি — যাচাইকৃত ধরন (সহকারী পরিচালক, বাংলাদেশ ব্যাংক)',
    titleEn: 'Preliminary — verified pattern (Assistant Director, Bangladesh Bank)',
    rows: [
      { subjectBn: 'ইংরেজি (ব্যাকরণ ও ভাষা)', subjectEn: 'English (Grammar & Language)', marks: '২০' },
      { subjectBn: 'বাংলা (ব্যাকরণ ও ভাষা)', subjectEn: 'Bangla (Grammar & Language)', marks: '২০' },
      { subjectBn: 'সাধারণ গণিত', subjectEn: 'General Mathematics', marks: '২০' },
      { subjectBn: 'আর্থিক ও ব্যাংকিং জ্ঞান', subjectEn: 'Financial and Banking Knowledge', marks: '১০' },
      { subjectBn: 'বিশ্লেষণী দক্ষতা', subjectEn: 'Analytical Skill', marks: '২০' },
      { subjectBn: 'আইসিটির মৌলিক জ্ঞান', subjectEn: 'Basic Knowledge on ICT', marks: '১০' },
    ],
    totalBn: 'মোট ১০০ নম্বর',
    totalEn: 'Total 100 marks',
    timeBn: '১ ঘণ্টা',
    timeEn: '1 hour',
    negativeBn: 'ভুল উত্তরে ০.২৫ নম্বর কাটা যায় (২০২৫–২৬ সালের বিজ্ঞপ্তি অনুযায়ী যাচাইকৃত; হার বিজ্ঞপ্তি/প্রবেশপত্রে নির্ধারিত হয়)',
    negativeEn: '0.25 deducted per wrong answer (verified for the 2025–26 circulars; the rate is set in each circular / admit card)',
    noteBn: 'উৎস: বাংলাদেশ ব্যাংক HRD-1 নোটিশ নং ৩৮/২০২৬, ৪ মে ২০২৬; পরীক্ষা ১৭ জুলাই ২০২৬। লিখিত: ২০০ নম্বর, ২ ঘণ্টা। ভাইভা: বিজ্ঞপ্তি অনুযায়ী।',
    noteEn: 'Source: Bangladesh Bank HRD-1 Notice No. 38/2026, 4 May 2026; exam 17 July 2026. Written: 200 marks, 2 hours. Viva: per circular.',
  },
  'primary-teacher': {
    titleBn: 'লিখিত (MCQ) — বর্তমান ধরন (DPE ২০২৫ বিধি)',
    titleEn: 'Written (MCQ) — current pattern (DPE 2025 Rules)',
    rows: [
      { subjectBn: 'বাংলা', subjectEn: 'Bangla', marks: '২৫' },
      { subjectBn: 'ইংরেজি', subjectEn: 'English', marks: '২৫' },
      { subjectBn: 'গণিত ও দৈনন্দিন বিজ্ঞান', subjectEn: 'Math & Everyday Science', marks: '২০' },
      { subjectBn: 'সাধারণ জ্ঞান (বাংলাদেশ ও আন্তর্জাতিক)', subjectEn: 'General Knowledge (Bangladesh & International)', marks: '২০' },
    ],
    totalBn: 'মোট ৯০ নম্বর',
    totalEn: 'Total 90 marks',
    timeBn: '৯০ মিনিট',
    timeEn: '90 minutes',
    negativeBn: 'ভুল উত্তরে ০.২৫ নম্বর কাটা যায়',
    negativeEn: '0.25 deducted per wrong answer',
    noteBn: 'পাস নম্বর ৫০% (৪৫)। ভাইভা ১০ নম্বর, পাস ৫০% (৫)। পুরোনো ধরন (৮০ MCQ + ২০ ভাইভা) বাতিল — এখন ৯০+১০ ধরনই বর্তমান। উৎস: সরকারি প্রাথমিক বিদ্যালয় শিক্ষক নিয়োগ বিধিমালা ২০২৫, ২৮ আগস্ট ২০২৫। −০.২৫ নেগেটিভ মার্কিং বিধিমালায় লেখা নেই — ২০২৬ সালের জানুয়ারির পরীক্ষার নোটিশ/প্রবেশপত্রের নির্দেশনায় আছে।',
    noteEn: 'Pass mark 50% (45). Viva 10 marks, pass 50% (5). The old pattern (80 MCQ + 20 viva) is retired — the 90+10 pattern is current. Source: Government Primary School Teacher Recruitment Rules 2025, 28 August 2025. The −0.25 negative marking is not in the Rules — it comes from the January 2026 exam notice / admit-card instructions.',
  },
  ntrca: {
    titleBn: 'শেষ যাচাইকৃত ধরন (১৮তম পরীক্ষা) — "বর্তমান ধরন" নয়',
    titleEn: 'Last verified pattern (18th exam) — not "current pattern"',
    rows: [
      { subjectBn: 'বাংলা', subjectEn: 'Bangla', marks: '২৫' },
      { subjectBn: 'ইংরেজি', subjectEn: 'English', marks: '২৫' },
      { subjectBn: 'সাধারণ গণিত', subjectEn: 'General Math', marks: '২৫' },
      { subjectBn: 'সাধারণ জ্ঞান', subjectEn: 'General Knowledge', marks: '২৫' },
    ],
    totalBn: 'মোট ১০০ নম্বর',
    totalEn: 'Total 100 marks',
    timeBn: '১ ঘণ্টা',
    timeEn: '1 hour',
    negativeBn: 'ভুল উত্তরে ০.২৫ নম্বর কাটা যায়',
    negativeEn: '0.25 deducted per wrong answer',
    noteBn: 'প্রিলিমিনারি পাস নম্বর ৪০। লিখিত (বিষয়ভিত্তিক): ১০০ নম্বর, ৩ ঘণ্টা, পাস ৪০। ভাইভা: ২০ নম্বর (শিক্ষাগত ফল ১২ + মৌখিক ৮), পাস ৮। ১৯তম পরীক্ষার ধরন এখানে লেখা হয়নি — পরস্পরবিরোধী দাবি আছে; ১৯তম বিজ্ঞপ্তি না আসা পর্যন্ত কিছু লেখা হবে না।',
    noteEn: 'Preliminary pass mark 40. Written (subject-based): 100 marks, 3 hours, pass 40. Viva: 20 marks (academic results 12 + oral 8), pass 8. The 19th exam’s pattern is not written here — claims conflict; nothing will be written until the 19th circular arrives.',
  },
};

/**
 * Machine-readable exam rules (Step 5 — Step 3 §2.2 `jobExams.rulesConfig`).
 * ONLY the 4 verified exams have a config; every other exam returns
 * null from jobRulesConfig() ("unknown — verify against the circular").
 * Figures are the Step 3 §2.2 verified values, copied from
 * EXAM_PATTERNS above (subject marks converted from Bangla digits to
 * numbers; the unit test asserts each subject list sums to
 * questionCount, so a transcription slip is caught). Nothing here is a
 * new claim: BCS 200/2h/−0.50 in the 50th syllabus split
 * (30/30/25/25/10/15/15/20/15/15, BPSC 9 Dec 2025, official PDF read
 * directly 24 Nov 2026; scoringConfigVersion v2), Bank 100/1h with
 * −0.25 VERIFIED for the 2025–26 circulars (Combined 11 Bank Officer
 * Circular 115/2025 + Bangladesh Bank AD Notice HRD-1 No. 38/2026,
 * 4 May 2026; scoringConfigVersion v1 — the per-circular caveat
 * stays: the rate is set in each circular / admit card), Primary
 * 90/90min/−0.25/pass 50% (45) DPE 2025 (the −0.25 itself comes
 * from the Jan 2026 exam notice, not the Rules), NTRCA 18th
 * 100/1h/−0.25/pass 40. Bank also has post-level configs
 * ('bank-senior-officer', 'bank-assistant-director') — machine
 * patterns for future post-level mocks/pages; the 'bank' hub still
 * shows Officer/Cash. BCS viva marks are NEVER written; NTRCA 19th
 * is NEVER written. The same shape is the Firestore seed
 * (team/job-categories-exams-seed.json) and the rules' type checks.
 */
export interface JobRulesSubject {
  nameBn: string;
  nameEn: string;
  marks: number;
}

export interface JobRulesConfig {
  questionCount: number | null;
  timeMinutes: number | null;
  marksPerQuestion: number | null;
  /** Verified penalty (marks deducted per wrong answer), or null when
   * there is no verified penalty. An UNVERIFIED penalty must NEVER sit
   * here — it lives in `provisionalNegativeMarking` (Bank) so no
   * score computed from this config can look official (Step 5
   * closure, P1-4). */
  negativeMarking: number | null;
  /** Provisional (circular-dependent) penalty, kept SEPARATE from the
   * verified scoring config. Display must label it provisional; the
   * exam engine must never score from it. */
  provisionalNegativeMarking: number | null;
  negativeMarkingVerified: boolean;
  /** Scoring-config version (Step 8 fold-in, ChatGPT finding 9):
   * identifies the exact marking scheme an attempt was scored
   * under — the attempt stores this version, so a later config
   * change can never silently reinterpret an old result.
   * 'v1' = first verified config; 'v0-provisional' = no verified
   * config yet (kept for snapshots of unverified configs — no live
   * exam uses it since 24 Nov 2026, when Bank became v1);
   * '18th-v1' = NTRCA 18th-cycle config. */
  scoringConfigVersion: string;
  passMark: number | null;
  passPercent: number | null;
  subjects: JobRulesSubject[];
  patternSource: string;
  /** ISO date string when the pattern was verified, or null (none recorded yet). */
  patternVerifiedAt: string | null;
  patternLabel: 'verified' | 'last-verified-18th' | 'circular-based';
  /** Verification state of the machine config as a whole (Step 5
   * closure, P1-3 — null used to mean five different things):
   * 'verified' = the whole config may drive scored exams;
   * 'last_verified' = verified for a past cycle, not automatically
   * current (see applicableCycle); 'not_verified' = no verified
   * config; 'not_applicable' = the exam has no conventional MCQ
   * pattern; 'scope_pending' = the exam's scope is undecided. */
  patternStatus: JobPatternStatus;
  /** The exam cycle this pattern applies to (e.g. NTRCA '18th'), or
   * null when the pattern is not tied to a numbered cycle (Step 5
   * closure, P1-8). A historical pattern is never presented as
   * automatically current. */
  applicableCycle: string | null;
}

/** Pattern-verification states (Step 5 closure, P1-3). */
export type JobPatternStatus =
  | 'verified'
  | 'last_verified'
  | 'not_verified'
  | 'not_applicable'
  | 'scope_pending';

/** Pattern status for the 10 exams with NO machine config
 * (jobRulesConfig() returns null for them): the null is explained
 * here instead of silently meaning "unknown". IT is 'scope_pending'
 * (owner decision 13.8); the other 9 are 'not_verified'. */
export const JOB_PATTERN_STATUS: Record<string, { patternStatus: JobPatternStatus; applicableCycle: string | null }> = {
  dgfood: { patternStatus: 'not_verified', applicableCycle: null },
  'bpsc-non-cadre': { patternStatus: 'not_verified', applicableCycle: null },
  cag: { patternStatus: 'not_verified', applicableCycle: null },
  bfsa: { patternStatus: 'not_verified', applicableCycle: null },
  others: { patternStatus: 'not_verified', applicableCycle: null },
  ministries: { patternStatus: 'not_verified', applicableCycle: null },
  defence: { patternStatus: 'not_verified', applicableCycle: null },
  autonomous: { patternStatus: 'not_verified', applicableCycle: null },
  'private-ngo': { patternStatus: 'not_verified', applicableCycle: null },
  'it-professional': { patternStatus: 'scope_pending', applicableCycle: null },
};

/** Pattern-verification status of any exam hub (config first, then the
 * no-config map; unknown slugs are 'not_verified' — never 'verified'
 * by default). */
export function jobPatternStatus(slug: string): JobPatternStatus {
  return JOB_RULES_CONFIGS[slug]?.patternStatus
    ?? JOB_PATTERN_STATUS[slug]?.patternStatus
    ?? 'not_verified';
}

/** The exam cycle a hub's pattern applies to (NTRCA '18th'), or null. */
export function jobApplicableCycle(slug: string): string | null {
  return JOB_RULES_CONFIGS[slug]?.applicableCycle
    ?? JOB_PATTERN_STATUS[slug]?.applicableCycle
    ?? null;
}

/** Review-workflow states (Step 3 §2.2). `status` is the publication
 * state ('draft' | 'published', Admin-owned); `reviewStatus` is the
 * review workflow. The two are NOT the same field — a doc is a draft
 * when reviewStatus is one of these three AND status is 'draft'
 * (firestore.rules enforces published ⟺ reviewStatus 'Published').
 * Mirrors firestore.rules isDraftStatus; the rules are authoritative.
 * Note the §3.3 draft's literal 'draft' is NOT a review state — it is
 * rejected here and by the rules. */
export const JOB_DRAFT_REVIEW_STATES = ['Not Started', 'In Progress', 'Under Review'] as const;
export const JOB_REVIEW_STATES = [...JOB_DRAFT_REVIEW_STATES, 'Published'] as const;

export function isDraftJobReviewStatus(value: unknown): value is (typeof JOB_DRAFT_REVIEW_STATES)[number] {
  return (
    typeof value === 'string' &&
    (JOB_DRAFT_REVIEW_STATES as readonly string[]).includes(value)
  );
}

/** Step 6 guard (P1-5 / Step 6 handover #4): only exams whose scope
 * is defined may get a subject/chapter/topic/lesson structure. */
export function jobExamSyllabusReady(slug: string): boolean {
  return jobExamBySlug(slug)?.scopeStatus === 'defined';
}

export const JOB_RULES_CONFIGS: Record<string, JobRulesConfig> = {
  bcs: {
    questionCount: 200,
    timeMinutes: 120,
    marksPerQuestion: 1,
    negativeMarking: 0.5,
    provisionalNegativeMarking: null,
    negativeMarkingVerified: true,
    // 50th BCS syllabus (BPSC, 9 Dec 2025) — official PDF read
    // directly 24 Nov 2026; v1 was the pre-50th split.
    scoringConfigVersion: 'v2',
    passMark: null,
    passPercent: null,
    subjects: [
      { nameBn: 'বাংলা ভাষা ও সাহিত্য', nameEn: 'Bangla Language & Literature', marks: 30 },
      { nameBn: 'ইংরেজি ভাষা ও সাহিত্য', nameEn: 'English Language & Literature', marks: 30 },
      { nameBn: 'বাংলাদেশ বিষয়াবলি', nameEn: 'Bangladesh Affairs', marks: 25 },
      { nameBn: 'আন্তর্জাতিক বিষয়াবলি', nameEn: 'International Affairs', marks: 25 },
      { nameBn: 'ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা', nameEn: 'Geography, Environment & Disaster Management', marks: 10 },
      { nameBn: 'সাধারণ বিজ্ঞান', nameEn: 'General Science', marks: 15 },
      { nameBn: 'কম্পিউটার ও তথ্যপ্রযুক্তি', nameEn: 'Computer & ICT', marks: 15 },
      { nameBn: 'গাণিতিক যুক্তি', nameEn: 'Mathematical Reasoning', marks: 20 },
      { nameBn: 'মানসিক দক্ষতা', nameEn: 'Mental Ability', marks: 15 },
      { nameBn: 'নৈতিকতা, মূল্যবোধ ও সুশাসন', nameEn: 'Ethics, Values & Good Governance', marks: 15 },
    ],
    patternSource: 'BPSC ৫০তম BCS প্রিলিমিনারি সিলেবাস, ৯ ডিসেম্বর ২০২৫ (সরাসরি PDF যাচাইকৃত)',
    patternVerifiedAt: '2026-11-24',
    patternLabel: 'verified',
    patternStatus: 'verified',
    applicableCycle: null,
  },
  bank: {
    questionCount: 100,
    timeMinutes: 60,
    marksPerQuestion: 1,
    // −0.25 VERIFIED 24 Nov 2026 for the 2025–26 circulars
    // (Combined 11 Bank Officer Circular 115/2025 + Bangladesh Bank
    // AD Notice HRD-1 No. 38/2026, 4 May 2026). It now drives
    // scoring (v1); the provisional field is empty. The per-circular
    // caveat stays: the rate is set in each circular / admit card,
    // so a future circular must be checked before its exam is scored.
    negativeMarking: 0.25,
    provisionalNegativeMarking: null,
    negativeMarkingVerified: true,
    scoringConfigVersion: 'v1',
    passMark: null,
    passPercent: null,
    subjects: [
      { nameBn: 'বাংলা', nameEn: 'Bangla', marks: 25 },
      { nameBn: 'ইংরেজি', nameEn: 'English', marks: 25 },
      { nameBn: 'সাধারণ গণিত ও পরিমাণগত দক্ষতা', nameEn: 'General Math & Quantitative Aptitude', marks: 20 },
      { nameBn: 'সাধারণ জ্ঞান', nameEn: 'General Knowledge', marks: 20 },
      { nameBn: 'কম্পিউটারের মৌলিক জ্ঞান', nameEn: 'Basic Computer Knowledge', marks: 10 },
    ],
    patternSource: 'BSCS Combined 11 Bank Officer (General) Circular 115/2025',
    patternVerifiedAt: '2026-11-24',
    patternLabel: 'verified',
    patternStatus: 'verified',
    applicableCycle: null,
  },
  // Post-level Bank patterns (24 Nov 2026 audit): one 'bank' config
  // cannot hold three post patterns. These are machine-readable
  // configs for future post-level mocks/pages — NOT exam hubs
  // (JOB_EXAMS has no such slugs, so no hub renders them yet).
  'bank-senior-officer': {
    questionCount: 100,
    timeMinutes: 60,
    marksPerQuestion: 1,
    negativeMarking: 0.25,
    provisionalNegativeMarking: null,
    negativeMarkingVerified: true,
    scoringConfigVersion: 'v1',
    passMark: null,
    passPercent: null,
    subjects: [
      { nameBn: 'ইংরেজি (ব্যাকরণ ও ভাষা)', nameEn: 'English (Grammar & Language)', marks: 20 },
      { nameBn: 'বাংলা (ব্যাকরণ ও ভাষা)', nameEn: 'Bangla (Grammar & Language)', marks: 20 },
      { nameBn: 'সাধারণ গণিত', nameEn: 'General Mathematics', marks: 20 },
      { nameBn: 'আর্থিক ও ব্যাংকিং জ্ঞান', nameEn: 'Financial and Banking Knowledge', marks: 10 },
      { nameBn: 'বিশ্লেষণী দক্ষতা', nameEn: 'Analytical Skills', marks: 20 },
      { nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তির মৌলিক জ্ঞান', nameEn: 'Basic Knowledge of ICT', marks: 10 },
    ],
    patternSource: 'BSCS Circulars 109/2025 + 348/2026',
    patternVerifiedAt: '2026-11-24',
    patternLabel: 'verified',
    patternStatus: 'verified',
    applicableCycle: null,
  },
  'bank-assistant-director': {
    questionCount: 100,
    timeMinutes: 60,
    marksPerQuestion: 1,
    negativeMarking: 0.25,
    provisionalNegativeMarking: null,
    negativeMarkingVerified: true,
    scoringConfigVersion: 'v1',
    passMark: null,
    passPercent: null,
    subjects: [
      { nameBn: 'ইংরেজি (ব্যাকরণ ও ভাষা)', nameEn: 'English (Grammar & Language)', marks: 20 },
      { nameBn: 'বাংলা (ব্যাকরণ ও ভাষা)', nameEn: 'Bangla (Grammar & Language)', marks: 20 },
      { nameBn: 'সাধারণ গণিত', nameEn: 'General Mathematics', marks: 20 },
      { nameBn: 'আর্থিক ও ব্যাংকিং জ্ঞান', nameEn: 'Financial and Banking Knowledge', marks: 10 },
      { nameBn: 'বিশ্লেষণী দক্ষতা', nameEn: 'Analytical Skill', marks: 20 },
      { nameBn: 'আইসিটির মৌলিক জ্ঞান', nameEn: 'Basic Knowledge on ICT', marks: 10 },
    ],
    patternSource: 'Bangladesh Bank HRD-1 Notice No. 38/2026, 4 May 2026',
    patternVerifiedAt: '2026-11-24',
    patternLabel: 'verified',
    patternStatus: 'verified',
    applicableCycle: null,
  },
  'primary-teacher': {
    questionCount: 90,
    timeMinutes: 90,
    marksPerQuestion: 1,
    negativeMarking: 0.25,
    provisionalNegativeMarking: null,
    negativeMarkingVerified: true,
    scoringConfigVersion: 'v1',
    passMark: 45,
    passPercent: 50,
    subjects: [
      { nameBn: 'বাংলা', nameEn: 'Bangla', marks: 25 },
      { nameBn: 'ইংরেজি', nameEn: 'English', marks: 25 },
      { nameBn: 'গণিত ও দৈনন্দিন বিজ্ঞান', nameEn: 'Math & Everyday Science', marks: 20 },
      { nameBn: 'সাধারণ জ্ঞান (বাংলাদেশ ও আন্তর্জাতিক)', nameEn: 'General Knowledge (Bangladesh & International)', marks: 20 },
    ],
    // −0.25: NOT in the Rules (Schedule 2 is silent on the rate) —
    // it comes from the Jan 2026 exam notice / admit-card
    // instructions, verified 24 Nov 2026.
    patternSource: 'সরকারি প্রাথমিক বিদ্যালয় শিক্ষক নিয়োগ বিধিমালা ২০২৫, ২৮ আগস্ট ২০২৫ (ধরন); −০.২৫ — ২০২৬ সালের জানুয়ারির পরীক্ষার নোটিশ/প্রবেশপত্র',
    patternVerifiedAt: '2026-11-24',
    patternLabel: 'verified',
    patternStatus: 'verified',
    applicableCycle: null,
  },
  ntrca: {
    questionCount: 100,
    timeMinutes: 60,
    marksPerQuestion: 1,
    negativeMarking: 0.25,
    provisionalNegativeMarking: null,
    negativeMarkingVerified: true,
    scoringConfigVersion: '18th-v1',
    passMark: 40,
    passPercent: 40,
    subjects: [
      { nameBn: 'বাংলা', nameEn: 'Bangla', marks: 25 },
      { nameBn: 'ইংরেজি', nameEn: 'English', marks: 25 },
      { nameBn: 'সাধারণ গণিত', nameEn: 'General Math', marks: 25 },
      { nameBn: 'সাধারণ জ্ঞান', nameEn: 'General Knowledge', marks: 25 },
    ],
    patternSource: 'NTRCA ১৮তম পরীক্ষার বিজ্ঞপ্তি',
    patternVerifiedAt: null,
    patternLabel: 'last-verified-18th',
    patternStatus: 'last_verified',
    applicableCycle: '18th',
  },
};

/** The verified rules config for an exam, or null (unverified — "unknown, verify against the circular"). */
export function jobRulesConfig(slug: string): JobRulesConfig | null {
  return JOB_RULES_CONFIGS[slug] ?? null;
}

/** The 8 hub tabs (design plan §1.4 — same pattern as class dashboards). */
export const JOB_TABS = [
  { slug: 'home', bn: 'হোম', en: 'Home' },
  { slug: 'subjects', bn: 'বিষয়', en: 'Subjects' },
  { slug: 'practice', bn: 'অনুশীলন', en: 'Practice' },
  { slug: 'mocks', bn: 'মক টেস্ট', en: 'Mock Tests' },
  { slug: 'previous', bn: 'বিগত প্রশ্ন', en: 'Previous Questions' },
  { slug: 'results', bn: 'ফলাফল', en: 'Results' },
  { slug: 'progress', bn: 'অগ্রগতি', en: 'Progress' },
  { slug: 'current-affairs', bn: 'সাম্প্রতিক ঘটনা', en: 'Current Affairs' },
] as const;

export type JobTabSlug = (typeof JOB_TABS)[number]['slug'];

export function isJobTabSlug(s: string | undefined): s is JobTabSlug {
  return !!s && (JOB_TABS as readonly { slug: string }[]).some((t) => t.slug === s);
}

/** The 7 "100% preparation" elements (design plan §1.5). */
export const JOB_ELEMENTS: Array<{ bn: string; en: string; descBn: string; descEn: string }> = [
  {
    bn: 'সিলেবাস কভারেজ',
    en: 'Syllabus Coverage',
    descBn: 'অফিসিয়াল সিলেবাস/বিজ্ঞপ্তি থেকে বিষয় ও টপিকের তালিকা',
    descEn: 'Topic list for every subject, from the official syllabus / circular',
  },
  {
    bn: 'টপিকভিত্তিক MCQ ব্যাংক',
    en: 'Topic-wise MCQ Bank',
    descBn: 'প্রতিটি টপিকে MCQ — উত্তর ও এক লাইনের ব্যাখ্যাসহ',
    descEn: 'MCQs per topic, with answer and a one-line explanation',
  },
  {
    bn: 'পূর্ণাঙ্গ মক টেস্ট',
    en: 'Full Mock Tests',
    descBn: 'আসল ধরনে — নম্বর, সময়, নেগেটিভ মার্কিং, টাইমারসহ',
    descEn: 'In the real pattern — marks, time, negative marking, with timer',
  },
  {
    bn: 'বিগত প্রশ্নের অনুশীলন',
    en: 'Previous Questions Practice',
    descBn: 'শুধু যাচাইকৃত বিগত প্রশ্ন — বছর ও পরীক্ষার নামসহ',
    descEn: 'Verified previous questions only — with year and exam name',
  },
  {
    bn: 'ফলাফল + দুর্বল টপিক বিশ্লেষণ',
    en: 'Results + Weak-Topic Analysis',
    descBn: 'মকের পর কোন টপিক দুর্বল, কী আবার পড়তে হবে',
    descEn: 'After a mock: which topics are weak, what to revise',
  },
  {
    bn: 'সাম্প্রতিক ঘটনা (GK)',
    en: 'Current Affairs (GK)',
    descBn: 'মাসিক আপডেট — তারিখসহ, পুরোনো GK কখনো "সাম্প্রতিক" নয়',
    descEn: 'Monthly updates, dated — old GK is never shown as "current"',
  },
  {
    bn: 'ভাইভা প্রস্তুতি',
    en: 'Viva Preparation',
    descBn: 'সাধারণ প্রশ্ন, নিজের পরিচয়, কাগজপত্রের চেকলিস্ট — পড়ার উপকরণ মাত্র',
    descEn: 'Common questions, self-introduction, document checklist — study material only',
  },
];

/**
 * Common topics (design plan §3, B-10.1) — PRELIMINARY estimate from the
 * job analysis, NOT final. "Common" means the topic appears in at least
 * 3 of the 4 main exams (BCS, Bank, Primary Teacher, NTRCA). B-10.1
 * finalises this against the four official syllabuses; until then no
 * topic is shown as "confirmed common" and no question counts exist —
 * the ~50 per topic is a TARGET (design plan §7.5 proposed default),
 * not a count of existing questions.
 */
export interface CommonTopic {
  bn: string;
  en: string;
  /** How many of the 4 main exams the topic appears in (per the preliminary map). */
  exams: string;
  /** Preliminary note, e.g. "সাহিত্যের মৌলিক অংশ মাত্র". */
  noteBn?: string;
  noteEn?: string;
}

export const COMMON_TOPICS: CommonTopic[] = [
  { bn: 'বাংলা ভাষা ও ব্যাকরণ', en: 'Bangla Language & Grammar', exams: '৪/৪' },
  {
    bn: 'বাংলা সাহিত্যের মৌলিক অংশ',
    en: 'Bangla Literature — Basics',
    exams: '১ পূর্ণ + ৩ আংশিক',
    noteBn: 'সাহিত্যের মৌলিক অংশ মাত্র — সীমা সিলেবাস দিয়ে ঠিক হবে',
    noteEn: 'Basics only — scope to be fixed from the syllabuses',
  },
  { bn: 'English Grammar', en: 'English Grammar', exams: '৪/৪' },
  { bn: 'English Vocabulary', en: 'English Vocabulary', exams: '৪/৪' },
  { bn: 'গণিত — পাটিগণিত', en: 'Math — Arithmetic', exams: '৪/৪' },
  { bn: 'গণিত — বীজগণিত ও জ্যামিতি', en: 'Math — Algebra & Geometry', exams: '৪/৪' },
  { bn: 'সাধারণ জ্ঞান — বাংলাদেশ', en: 'General Knowledge — Bangladesh', exams: '৪/৪' },
  { bn: 'সাধারণ জ্ঞান — আন্তর্জাতিক', en: 'General Knowledge — International', exams: '৪/৪' },
  { bn: 'সাম্প্রতিক ঘটনা', en: 'Current Affairs', exams: '৪/৪', noteBn: 'সময়-সংবেদনশীল — মাসিক আপডেট লাগবে', noteEn: 'Time-sensitive — needs monthly updates' },
];

/** Target questions per common topic (design plan §7.5 proposed default — a target, not a count). */
export const COMMON_TOPIC_QUESTION_TARGET = 50;

/** The 4 main exams the common bank serves (design plan §3). */
export const COMMON_EXAMS = ['bcs', 'bank', 'primary-teacher', 'ntrca'] as const;

/** Weekly full-mock cycle (design plan §4.2): BCS → Bank → Primary → NTRCA. */
export const WEEKLY_MOCK_CYCLE = ['bcs', 'bank', 'primary-teacher', 'ntrca'] as const;

/** Daily short mock design (design plan §4.1): 20–30 MCQ, 20–30 minutes. */
export const DAILY_MOCK = {
  sizeBn: '২০–৩০টি MCQ',
  sizeEn: '20–30 MCQs',
  timeBn: '২০–৩০ মিনিট',
  timeEn: '20–30 minutes',
} as const;
