// Eduvelto — Job & Admission Prep (owner order 28 Nov 2026, 10:23).
//
// HONEST SCOPE: the owner asked for "100%", but the bank state makes
// full content completeness impossible today, so this module builds
// the maximum honest version and says plainly what is missing:
//
//  1. QUIZ COMPETITION — already built (free quiz engine: 10 unique
//     shuffled questions, timer, instant result + explanations —
//     src/lib/freeQuiz.ts + src/pages/FreeQuizPage.tsx). NOT rebuilt
//     here; it is linked from /jobs and /admissions instead.
//  2. STRUCTURE — Job categories already exist in full
//     (src/lib/jobExams.ts: BCS, Bank, Primary, NTRCA, grades 11–20,
//     ministries, defence incl. Police/Army). The gap was ADMISSION:
//     ADMISSION_STRUCTURE below adds DU (Ka/Kha/Ga), Medical &
//     Dental, Engineering (BUET, CKRUET), GST cluster and the
//     Agriculture cluster, unit- and subject-wise. Units + subjects
//     are NAVIGATION LABELS ONLY — no marks, no timing, no questions
//     are invented for them; every unit's patternStatus is
//     'unverified' until checked against the official circular.
//     (NU keeps its own verified hub and is NOT in this structure.)
//  3. RECENT & MOST REPEATED — from the bank ONLY, and only what is
//     already published in the public bundle: the 35 owner-verified
//     BCS English questions (Batch 1, published 22 Nov 2026). The
//     173 verified 46th BCS Preliminary PYQs live in the Firestore
//     bank and are NOT in the public bundle, so they are NOT listed
//     here — the collection page says so plainly instead of faking
//     the count. Nothing is scraped from the web; no unverified
//     question is added. Year is null: the published batch records
//     no exam year, so no year is guessed.
//  4. SYLLABUS-BASED EXAM ENGINE — syllabusMockPlan() derives the
//     pattern ONLY from the verified JOB_RULES_CONFIGS
//     (src/lib/jobExams.ts): BCS 50th (200 marks, 120 min, −0.50),
//     Bank (100, 60 min, −0.25 verified), Primary (90, 90 min,
//     −0.25 verified), NTRCA 18th (100, 60 min, −0.25). The owner's
//     shorthand ("BCS Bangla 35, English 35…") is NEVER used — the
//     real BCS prelim is 200 marks with the verified split. The
//     19th NTRCA pattern is UNRESOLVED, so ntrca resolves to the
//     last-verified 18th config and says so. Unknown slugs return
//     null — never a guessed pattern. The engine serves questions
//     ONLY from the bundled verified pool: BCS English has 35;
//     every other subject has 0, and the UI must say so honestly
//     ("এই বিষয়ে যাচাইকৃত প্রশ্ন এখনো নেই") instead of serving
//     drafts. NO full mock is publishable on verified questions
//     alone — fullMockPossible is false for every exam. The one
//     runnable mock is the BCS English SECTION mock: 30 of the 35
//     verified questions, 18 minutes (official pace 120 min / 200
//     questions = 36 s per question), −0.50 per wrong answer.
//
// BANK STATE (owner brief, 28 Nov 2026 — Firestore bank figures,
// NOT re-counted from the bundle; the bundle holds far less):
// Job VERIFIED 1,208 + 128 fixed, NEEDS-FIX 1,445, NEEDS-REVIEW
// 3,568; Admission 977 reviewed, 0 verified, 0 PYQ.

import { jobRulesConfig, type JobRulesConfig } from './jobExams';
import {
  PUBLIC_BCS_ENGLISH_QUESTIONS,
  PUBLIC_BCS_TOPICS,
  publicBcsQuestionsByTopic,
  type PublicBcsQuestion,
  type PublicBcsTopic,
} from './publicBcsEnglish';

/* ------------------------------------------------------------------ */
/* Admission structure (navigation only — no patterns, no questions)   */
/* ------------------------------------------------------------------ */

export type AdmissionPatternStatus = 'unverified';

export interface AdmissionUnit {
  /** URL slug: /admissions/<institution>/<unit>. */
  slug: string;
  bn: string;
  en: string;
  /** Subject labels for this unit's navigation — names only. */
  subjectsBn: string[];
  subjectsEn: string[];
  patternStatus: AdmissionPatternStatus;
}

export interface AdmissionInstitution {
  slug: string;
  bn: string;
  en: string;
  units: AdmissionUnit[];
}

const UNVERIFIED: AdmissionPatternStatus = 'unverified';

export const ADMISSION_STRUCTURE: AdmissionInstitution[] = [
  {
    slug: 'du',
    bn: 'ঢাকা বিশ্ববিদ্যালয়',
    en: 'University of Dhaka',
    units: [
      {
        slug: 'ka',
        bn: 'ক ইউনিট (বিজ্ঞান)',
        en: 'Ka Unit (Science)',
        subjectsBn: ['পদার্থবিজ্ঞান', 'রসায়ন', 'গণিত', 'জীববিজ্ঞান', 'বাংলা', 'ইংরেজি'],
        subjectsEn: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Bangla', 'English'],
        patternStatus: UNVERIFIED,
      },
      {
        slug: 'kha',
        bn: 'খ ইউনিট (মানবিক)',
        en: 'Kha Unit (Arts & Social Sciences)',
        subjectsBn: ['বাংলা', 'ইংরেজি', 'সাধারণ জ্ঞান'],
        subjectsEn: ['Bangla', 'English', 'General Knowledge'],
        patternStatus: UNVERIFIED,
      },
      {
        slug: 'ga',
        bn: 'গ ইউনিট (ব্যবসায় শিক্ষা)',
        en: 'Ga Unit (Business Studies)',
        subjectsBn: ['বাংলা', 'ইংরেজি', 'হিসাববিজ্ঞান', 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা', 'ফিন্যান্স, ব্যাংকিং ও বীমা', 'মার্কেটিং'],
        subjectsEn: ['Bangla', 'English', 'Accounting', 'Business Organisation & Management', 'Finance, Banking & Insurance', 'Marketing'],
        patternStatus: UNVERIFIED,
      },
    ],
  },
  {
    slug: 'medical',
    bn: 'মেডিকেল ও ডেন্টাল',
    en: 'Medical & Dental',
    units: [
      {
        slug: 'mbbs',
        bn: 'MBBS ভর্তি পরীক্ষা',
        en: 'MBBS Admission Test',
        subjectsBn: ['পদার্থবিজ্ঞান', 'রসায়ন', 'জীববিজ্ঞান', 'ইংরেজি', 'সাধারণ জ্ঞান'],
        subjectsEn: ['Physics', 'Chemistry', 'Biology', 'English', 'General Knowledge'],
        patternStatus: UNVERIFIED,
      },
      {
        slug: 'bds',
        bn: 'BDS (ডেন্টাল) ভর্তি পরীক্ষা',
        en: 'BDS (Dental) Admission Test',
        subjectsBn: ['পদার্থবিজ্ঞান', 'রসায়ন', 'জীববিজ্ঞান', 'ইংরেজি', 'সাধারণ জ্ঞান'],
        subjectsEn: ['Physics', 'Chemistry', 'Biology', 'English', 'General Knowledge'],
        patternStatus: UNVERIFIED,
      },
    ],
  },
  {
    slug: 'engineering',
    bn: 'ইঞ্জিনিয়ারিং',
    en: 'Engineering',
    units: [
      {
        slug: 'buet',
        bn: 'BUET ভর্তি পরীক্ষা',
        en: 'BUET Admission Test',
        subjectsBn: ['পদার্থবিজ্ঞান', 'রসায়ন', 'গণিত'],
        subjectsEn: ['Physics', 'Chemistry', 'Mathematics'],
        patternStatus: UNVERIFIED,
      },
      {
        slug: 'ckruet',
        bn: 'CKRUET ভর্তি পরীক্ষা',
        en: 'CKRUET Admission Test',
        subjectsBn: ['পদার্থবিজ্ঞান', 'রসায়ন', 'গণিত', 'ইংরেজি'],
        subjectsEn: ['Physics', 'Chemistry', 'Mathematics', 'English'],
        patternStatus: UNVERIFIED,
      },
    ],
  },
  {
    slug: 'gst',
    bn: 'GST (গুচ্ছ)',
    en: 'GST (Cluster)',
    units: [
      {
        slug: 'a',
        bn: 'A ইউনিট (বিজ্ঞান)',
        en: 'A Unit (Science)',
        subjectsBn: ['পদার্থবিজ্ঞান', 'রসায়ন', 'গণিত', 'জীববিজ্ঞান', 'বাংলা', 'ইংরেজি'],
        subjectsEn: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Bangla', 'English'],
        patternStatus: UNVERIFIED,
      },
      {
        slug: 'b',
        bn: 'B ইউনিট (মানবিক)',
        en: 'B Unit (Humanities)',
        subjectsBn: ['বাংলা', 'ইংরেজি', 'সাধারণ জ্ঞান'],
        subjectsEn: ['Bangla', 'English', 'General Knowledge'],
        patternStatus: UNVERIFIED,
      },
      {
        slug: 'c',
        bn: 'C ইউনিট (ব্যবসায় শিক্ষা)',
        en: 'C Unit (Business Studies)',
        subjectsBn: ['বাংলা', 'ইংরেজি', 'হিসাববিজ্ঞান', 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা'],
        subjectsEn: ['Bangla', 'English', 'Accounting', 'Business Organisation & Management'],
        patternStatus: UNVERIFIED,
      },
    ],
  },
  {
    slug: 'agriculture',
    bn: 'কৃষি (গুচ্ছ)',
    en: 'Agriculture (Cluster)',
    units: [
      {
        slug: 'agriculture',
        bn: 'কৃষি গুচ্ছ ভর্তি পরীক্ষা',
        en: 'Agriculture Cluster Admission Test',
        subjectsBn: ['পদার্থবিজ্ঞান', 'রসায়ন', 'গণিত', 'জীববিজ্ঞান', 'ইংরেজি'],
        subjectsEn: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'],
        patternStatus: UNVERIFIED,
      },
    ],
  },
];

export function admissionUnitByRoute(
  institution: string,
  unit: string,
): { institution: AdmissionInstitution; unit: AdmissionUnit } | null {
  const inst = ADMISSION_STRUCTURE.find((i) => i.slug === institution);
  if (!inst) return null;
  const u = inst.units.find((x) => x.slug === unit);
  if (!u) return null;
  return { institution: inst, unit: u };
}

/** Render a number with Bengali digits in Bangla copy (site
 *  convention — see the bnDigits helpers in globalSearch/liveExam).
 *  The '.' decimal separator stays, matching the guides ("০.৫০"). */
export function bnDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

/* ------------------------------------------------------------------ */
/* Bundled verified-question availability (the ONLY servable pool)     */
/* ------------------------------------------------------------------ */

/** Verified questions the public bundle can serve, keyed by exam
 *  slug + the rulesConfig subject's English name. Only BCS English
 *  exists (35 owner-verified questions); everything else is 0. */
export const BUNDLED_VERIFIED_BY_SUBJECT: Record<string, Record<string, number>> = {
  bcs: { 'English Language & Literature': PUBLIC_BCS_ENGLISH_QUESTIONS.length },
};

export function bundledVerifiedCount(examSlug: string, subjectNameEn: string): number {
  return BUNDLED_VERIFIED_BY_SUBJECT[examSlug]?.[subjectNameEn] ?? 0;
}

/* ------------------------------------------------------------------ */
/* Syllabus-based exam engine                                          */
/* ------------------------------------------------------------------ */

export interface SyllabusSubjectPlan {
  nameBn: string;
  nameEn: string;
  /** Official marks for this subject (verified pattern). */
  marks: number;
  /** Verified questions the bundle can serve for this subject. */
  verifiedAvailable: number;
  /** True when the subject cannot run at all yet. */
  hasNoVerifiedQuestions: boolean;
}

export interface SectionMockPlan {
  subjectNameEn: string;
  subjectNameBn: string;
  /** Questions served (30 of the 35 verified BCS English). */
  questionCount: number;
  /** Minutes at the official pace (120 min / 200 Q = 36 s/Q). */
  timeMinutes: number;
  negativeMarking: number;
}

export interface SyllabusMockPlan {
  examSlug: string;
  rules: JobRulesConfig;
  subjects: SyllabusSubjectPlan[];
  totalMarks: number;
  questionCount: number;
  timeMinutes: number;
  negativeMarking: number | null;
  negativeMarkingVerified: boolean;
  /** False for every exam today — no exam has all subjects covered
   *  by verified questions, so no full mock is publishable. */
  fullMockPossible: boolean;
  /** The one runnable mock, or null when no subject has questions. */
  sectionMock: SectionMockPlan | null;
  /** e.g. '18th' for NTRCA — the 19th pattern is unresolved. */
  applicableCycle: string | null;
}

/** The verified-pattern mock plan for an exam, or null when the
 *  exam has no verified pattern (unknown slug — never guessed). */
export function syllabusMockPlan(examSlug: string): SyllabusMockPlan | null {
  const rules = jobRulesConfig(examSlug);
  if (!rules) return null;
  const subjects: SyllabusSubjectPlan[] = rules.subjects.map((s) => {
    const verifiedAvailable = bundledVerifiedCount(examSlug, s.nameEn);
    return {
      nameBn: s.nameBn,
      nameEn: s.nameEn,
      marks: s.marks,
      verifiedAvailable,
      hasNoVerifiedQuestions: verifiedAvailable === 0,
    };
  });
  const totalMarks = rules.subjects.reduce((sum, s) => sum + s.marks, 0);
  // The only servable section today: BCS English — 30 of the 35
  // verified questions, at the official pace (36 s/question).
  let sectionMock: SectionMockPlan | null = null;
  if (examSlug === 'bcs') {
    const english = subjects.find((s) => s.nameEn === 'English Language & Literature');
    if (english && english.verifiedAvailable >= 30 && rules.negativeMarking !== null) {
      sectionMock = {
        subjectNameEn: english.nameEn,
        subjectNameBn: english.nameBn,
        questionCount: 30,
        timeMinutes: 18,
        negativeMarking: rules.negativeMarking,
      };
    }
  }
  return {
    examSlug,
    rules,
    subjects,
    totalMarks,
    questionCount: rules.questionCount ?? 0,
    timeMinutes: rules.timeMinutes ?? 0,
    negativeMarking: rules.negativeMarking,
    negativeMarkingVerified: rules.negativeMarkingVerified,
    fullMockPossible: subjects.every((s) => s.verifiedAvailable >= s.marks),
    sectionMock,
    applicableCycle: rules.applicableCycle,
  };
}

/** The four exams with a verified pattern (the engine's scope). */
export const SYLLABUS_MOCK_EXAMS = ['bcs', 'bank', 'primary-teacher', 'ntrca'] as const;

/* ------------------------------------------------------------------ */
/* Recent & Most Repeated — verified pool only                         */
/* ------------------------------------------------------------------ */

export interface RecentRepeatedQuestion {
  question: PublicBcsQuestion;
  topic: PublicBcsTopic;
  topicBn: string;
  topicEn: string;
  examBn: string;
  examEn: string;
  /** Null: the published batch records no exam year — never guessed. */
  year: number | null;
}

/** The whole collection: 35 verified BCS English questions. */
export const RECENT_REPEATED_QUESTIONS: RecentRepeatedQuestion[] =
  PUBLIC_BCS_ENGLISH_QUESTIONS.map((q) => {
    const topic = PUBLIC_BCS_TOPICS.find((t) => t.topic === q.topic)!;
    return {
      question: q,
      topic: q.topic,
      topicBn: topic.nameBn,
      topicEn: topic.nameEn,
      examBn: 'বিসিএস',
      examEn: 'BCS',
      year: null,
    };
  });

export const RECENT_REPEATED_COUNT = RECENT_REPEATED_QUESTIONS.length;

/** Questions of one topic, for the collection's topic filter. */
export function recentRepeatedByTopic(topic: PublicBcsTopic): RecentRepeatedQuestion[] {
  return RECENT_REPEATED_QUESTIONS.filter((r) => r.topic === topic);
}

export { publicBcsQuestionsByTopic };

/* ------------------------------------------------------------------ */
/* Honest coverage table (bank state from the owner brief)             */
/* ------------------------------------------------------------------ */

/** Firestore-bank state as reported in the owner brief (28 Nov
 *  2026) — NOT counted from the bundle. The bundle serves far less
 *  (see BUNDLED_VERIFIED_BY_SUBJECT): that gap is the honest story. */
export const BANK_STATE = {
  jobVerified: 1208,
  jobFixed: 128,
  jobNeedsFix: 1445,
  jobNeedsReview: 3568,
  admissionReviewed: 977,
  admissionVerified: 0,
  admissionPyq: 0,
  /** Verified 46th BCS Preliminary PYQs in the Firestore bank —
   *  not yet published to the public bundle. */
  bcs46thPyqInBank: 173,
} as const;
