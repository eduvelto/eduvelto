/**
 * Results Hub — directory of OFFICIAL result portals only.
 *
 * Every URL below was verified on 27 Nov 2026 via web search
 * against the exam bodies' own notices: the education boards'
 * shared result sites, the National University result server, the
 * Technical Education Board result portal, BPSC and NTRCA. No
 * third-party result site is listed — result-aggregator sites that
 * look similar are deliberately left out. If a portal cannot be
 * verified, it is LEFT OUT. SMS formats noted here come from the
 * boards' own 2026 result notices (SSC/HSC to 16140; NU to 16222).
 *
 * Pure data + filter only: no fetch, no network, no storage, no DOM.
 */

export type ResultCategory = 'board' | 'university' | 'technical' | 'job';

export interface ResultLink {
  nameBn: string;
  nameEn: string;
  /** Bare official URL (https:// + domain, no guessed path). */
  url: string;
  category: ResultCategory;
  noteBn: string;
  noteEn: string;
}

export const RESULT_LINKS: readonly ResultLink[] = [
  {
    nameBn: 'শিক্ষা বোর্ড ফলাফল (এসএসসি / এইচএসসি)',
    nameEn: 'Education Board Results (SSC / HSC)',
    url: 'https://educationboardresults.gov.bd',
    category: 'board',
    noteBn: 'সব বোর্ডের এসএসসি ও এইচএসসি ফলাফল — রোল ও রেজিস্ট্রেশন নম্বর লাগে। SMS: SSC/HSC <বোর্ড> <রোল> <বছর> পাঠান 16140 নম্বরে।',
    noteEn: 'SSC and HSC results for all boards — roll and registration numbers needed. SMS: SSC/HSC <board> <roll> <year> to 16140.',
  },
  {
    nameBn: 'শিক্ষা বোর্ড মার্কশিট',
    nameEn: 'Education Board Marksheet',
    url: 'https://eduboardresults.gov.bd',
    category: 'board',
    noteBn: 'বিষয়ভিত্তিক নম্বরসহ পূর্ণ মার্কশিট দেখার সরকারি সাইট।',
    noteEn: 'Official site for the full marksheet with subject-wise marks.',
  },
  {
    nameBn: 'জাতীয় বিশ্ববিদ্যালয় ফলাফল',
    nameEn: 'National University Results',
    url: 'https://results.nu.ac.bd',
    category: 'university',
    noteBn: 'অনার্স, ডিগ্রি ও মাস্টার্স পরীক্ষার ফলাফল — রোল ও রেজিস্ট্রেশন নম্বর লাগে। SMS: 16222।',
    noteEn: 'Honours, Degree and Masters results — roll and registration numbers needed. SMS: 16222.',
  },
  {
    nameBn: 'কারিগরি শিক্ষা বোর্ড ফলাফল',
    nameEn: 'Technical Education Board (BTEB) Results',
    url: 'https://result.bteb.gov.bd',
    category: 'technical',
    noteBn: 'ডিপ্লোমা ও এইচএসসি (বিএমটি/ভোকেশনাল) ফলাফল দেখার সরকারি পোর্টাল।',
    noteEn: 'Official portal for Diploma and HSC (BMT/Vocational) results.',
  },
  {
    nameBn: 'বাংলাদেশ সরকারী কর্ম কমিশন (বিপিএসসি)',
    nameEn: 'Bangladesh Public Service Commission (BPSC)',
    url: 'https://bpsc.gov.bd',
    category: 'job',
    noteBn: 'বিসিএস পরীক্ষার ফলাফল ও নোটিশ।',
    noteEn: 'BCS exam results and notices.',
  },
  {
    nameBn: 'বেসরকারি শিক্ষক নিবন্ধন (NTRCA)',
    nameEn: 'Non-Govt Teachers’ Registration (NTRCA)',
    url: 'https://ntrca.gov.bd',
    category: 'job',
    noteBn: 'শিক্ষক নিবন্ধন পরীক্ষার ফলাফল ও মেধাতালিকা।',
    noteEn: 'Teacher registration exam results and merit lists.',
  },
];

export const RESULT_CATEGORIES: readonly ResultCategory[] = [
  'board',
  'university',
  'technical',
  'job',
];

/** Filter by free-text query and/or category; empty query + 'all' keeps all. */
export function filterResultLinks(
  links: readonly ResultLink[],
  query: string,
  category: ResultCategory | 'all',
): ResultLink[] {
  const q = query.trim().toLowerCase();
  return links.filter((link) => {
    if (category !== 'all' && link.category !== category) return false;
    if (q === '') return true;
    return (
      link.nameBn.toLowerCase().includes(q) ||
      link.nameEn.toLowerCase().includes(q) ||
      link.url.toLowerCase().includes(q)
    );
  });
}
