/**
 * Job Circular Links Hub — directory of OFFICIAL job portals only.
 *
 * Every URL below is a bare official domain verified on 28 Nov 2026.
 * This page lists ONLY the official portals themselves — never
 * individual circulars or deep links, because circulars go stale
 * and deep paths break. Always check the official portal for the
 * latest circular. If a link cannot be verified, it is LEFT OUT —
 * a missing link is better than a wrong one.
 *
 * Deliberately NOT listed: bankersselection.org.bd (unresolvable,
 * superseded by erecruitment.bb.org.bd) and bangladeshbank.org.bd
 * (unresolvable).
 *
 * Pure data + filter only: no fetch, no network, no storage, no DOM.
 */

export type JobCircularCategory =
  | 'bcs'
  | 'bank'
  | 'teacher'
  | 'primary'
  | 'apply'
  | 'other';

export interface JobCircularLink {
  nameBn: string;
  nameEn: string;
  /** Bare official URL (https:// + domain, no guessed path). */
  url: string;
  category: JobCircularCategory;
  noteBn: string;
  noteEn: string;
}

export const JOB_CIRCULAR_LINKS: readonly JobCircularLink[] = [
  {
    nameBn: 'বাংলাদেশ পাবলিক সার্ভিস কমিশন (BPSC)',
    nameEn: 'Bangladesh Public Service Commission (BPSC)',
    url: 'https://bpsc.gov.bd',
    category: 'bcs',
    noteBn: 'বিসিএস ও নন-ক্যাডার চাকরির বিজ্ঞপ্তি, পরীক্ষা ও ফলাফল।',
    noteEn: 'BCS and non-cadre job circulars, exams and results.',
  },
  {
    nameBn: 'বাংলাদেশ ব্যাংক ই-রিক্রুটমেন্ট (ব্যাংকার্স সিলেকশন কমিটি)',
    nameEn: 'Bangladesh Bank e-Recruitment (Bankers Selection Committee)',
    url: 'https://erecruitment.bb.org.bd',
    category: 'bank',
    noteBn: 'ব্যাংক চাকরির বিজ্ঞপ্তি ও অনলাইন আবেদন।',
    noteEn: 'Bank job circulars and online applications.',
  },
  {
    nameBn: 'বেসরকারি শিক্ষক নিবন্ধন ও প্রত্যয়ন কর্তৃপক্ষ (NTRCA)',
    nameEn: "Non-Government Teachers' Registration & Certification Authority (NTRCA)",
    url: 'https://ntrca.gov.bd',
    category: 'teacher',
    noteBn: 'শিক্ষক নিবন্ধন পরীক্ষা ও নিয়োগ সংক্রান্ত তথ্য।',
    noteEn: 'Teacher registration exams and recruitment information.',
  },
  {
    nameBn: 'প্রাথমিক শিক্ষা অধিদপ্তর (DPE)',
    nameEn: 'Directorate of Primary Education (DPE)',
    url: 'https://dpe.gov.bd',
    category: 'primary',
    noteBn: 'প্রাথমিক বিদ্যালয়ের শিক্ষক নিয়োগের বিজ্ঞপ্তি ও তথ্য।',
    noteEn: 'Primary school teacher recruitment circulars and information.',
  },
  {
    nameBn: 'টেলিটক অল জবস',
    nameEn: 'Teletalk All Jobs',
    url: 'https://alljobs.teletalk.com.bd',
    category: 'apply',
    noteBn: 'সরকারি চাকরির আবেদন করার পোর্টাল।',
    noteEn: 'Portal for applying to government jobs.',
  },
  {
    nameBn: 'জনপ্রশাসন মন্ত্রণালয়',
    nameEn: 'Ministry of Public Administration',
    url: 'https://mopa.gov.bd',
    category: 'other',
    noteBn: 'সরকারি নিয়োগ বিজ্ঞপ্তি ও প্রশাসনিক তথ্য।',
    noteEn: 'Government recruitment notices and administrative information.',
  },
  {
    nameBn: 'বাংলাদেশ জাতীয় তথ্য বাতায়ন',
    nameEn: 'Bangladesh National Portal',
    url: 'https://bangladesh.gov.bd',
    category: 'other',
    noteBn: 'সব সরকারি সেবা ও ওয়েবসাইট খুঁজে পাওয়ার মূল ঠিকানা।',
    noteEn: 'The main gateway for finding every government service and website.',
  },
  {
    nameBn: 'জনশক্তি, কর্মসংস্থান ও প্রশিক্ষণ ব্যুরো (BMET)',
    nameEn: 'Bureau of Manpower, Employment & Training (BMET)',
    url: 'https://bmet.gov.bd',
    category: 'other',
    noteBn: 'বিদেশে কর্মসংস্থান, নিবন্ধন ও প্রশিক্ষণ সংক্রান্ত সেবা।',
    noteEn: 'Overseas employment, registration and training services.',
  },
];

export const JOB_CIRCULAR_CATEGORIES: readonly JobCircularCategory[] = [
  'bcs',
  'bank',
  'teacher',
  'primary',
  'apply',
  'other',
];

/**
 * Filter the directory by category. 'all' keeps the full list.
 */
export function filterJobCircularLinks(
  links: readonly JobCircularLink[],
  category: JobCircularCategory | 'all',
): JobCircularLink[] {
  if (category === 'all') return [...links];
  return links.filter((link) => link.category === category);
}
