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
  /** Official site — every hub links here for the latest circular. */
  officialUrl: string;
  /** Tier from the job analysis: 1 = main exams, 2 = DGFood/NTRCA/non-cadre, 3 = CAG/BFSA/others. */
  tier: 1 | 2 | 3;
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
    tier: 3,
    accent: '#57534E',
    accentSoft: '#F0EFEA',
    accentDeep: '#44403C',
  },
];

export function jobExamBySlug(slug: string): JobExamDef | undefined {
  return JOB_EXAMS.find((e) => e.slug === slug);
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
