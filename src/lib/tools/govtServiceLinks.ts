/**
 * Government Service Links — directory of OFFICIAL links only.
 *
 * Every URL below is a bare official domain verified on 27 Nov 2026
 * against the Bangladesh National Portal (bangladesh.gov.bd) and
 * published lists of official .gov.bd portals (checked via web
 * search: each domain is the service's own official site). No
 * lookalike, aggregator or unofficial site is listed. If a link
 * cannot be verified, it is LEFT OUT — a missing link is better
 * than a wrong one. Official government sites end in .gov.bd
 * (myGov is the one .bd exception, the government's own gateway).
 *
 * Pure data + filter only: no fetch, no network, no storage, no DOM.
 */

export type GovtServiceCategory =
  | 'general'
  | 'identity'
  | 'land'
  | 'tax'
  | 'transport'
  | 'education'
  | 'jobs';

export interface GovtServiceLink {
  nameBn: string;
  nameEn: string;
  /** Bare official URL (https:// + domain, no guessed path). */
  url: string;
  category: GovtServiceCategory;
  noteBn: string;
  noteEn: string;
}

export const GOVT_SERVICE_LINKS: readonly GovtServiceLink[] = [
  {
    nameBn: 'বাংলাদেশ জাতীয় তথ্য বাতায়ন',
    nameEn: 'Bangladesh National Portal',
    url: 'https://bangladesh.gov.bd',
    category: 'general',
    noteBn: 'সব সরকারি সেবা ও ওয়েবসাইট খুঁজে পাওয়ার মূল ঠিকানা।',
    noteEn: 'The main gateway for finding every government service and website.',
  },
  {
    nameBn: 'মাইগভ (myGov)',
    nameEn: 'myGov',
    url: 'https://mygov.bd',
    category: 'general',
    noteBn: 'এক ঠিকানায় অনেক সরকারি সেবায় আবেদন ও আবেদন অনুসরণ।',
    noteEn: 'Apply for many government services and track applications from one place.',
  },
  {
    nameBn: 'জাতীয় পরিচয়পত্র (NID) সেবা',
    nameEn: 'National ID (NID) Services',
    url: 'https://services.nidw.gov.bd',
    category: 'identity',
    noteBn: 'নির্বাচন কমিশনের NID আবেদন, সংশোধন ও যাচাই সেবা।',
    noteEn: 'Election Commission NID applications, corrections and verification.',
  },
  {
    nameBn: 'ই-পাসপোর্ট',
    nameEn: 'e-Passport',
    url: 'https://epassport.gov.bd',
    category: 'identity',
    noteBn: 'ই-পাসপোর্টের অনলাইন আবেদন ও নিবন্ধন।',
    noteEn: 'Online application and registration for e-passports.',
  },
  {
    nameBn: 'ইমিগ্রেশন ও পাসপোর্ট অধিদপ্তর',
    nameEn: 'Department of Immigration & Passports',
    url: 'https://dip.gov.bd',
    category: 'identity',
    noteBn: 'পাসপোর্ট ও ভিসা সংক্রান্ত অধিদপ্তরের ওয়েবসাইট।',
    noteEn: 'The department website for passports and visas.',
  },
  {
    nameBn: 'জন্ম ও মৃত্যু নিবন্ধন',
    nameEn: 'Birth & Death Registration',
    url: 'https://bdris.gov.bd',
    category: 'identity',
    noteBn: 'জন্ম ও মৃত্যু নিবন্ধনের অনলাইন ব্যবস্থা।',
    noteEn: 'Online system for birth and death registration.',
  },
  {
    nameBn: 'ই-নামজারি (জমির মিউটেশন)',
    nameEn: 'e-Mutation (Land)',
    url: 'https://mutation.land.gov.bd',
    category: 'land',
    noteBn: 'জমির নামজারি (মিউটেশন) আবেদনের অনলাইন সেবা।',
    noteEn: 'Online applications for land mutation (namjari).',
  },
  {
    nameBn: 'ভূমি উন্নয়ন কর',
    nameEn: 'Land Development Tax',
    url: 'https://ldtax.gov.bd',
    category: 'land',
    noteBn: 'জমির খাজনা অনলাইনে দেওয়ার সেবা।',
    noteEn: 'Pay land development tax online.',
  },
  {
    nameBn: 'আয়কর ই-রিটার্ন',
    nameEn: 'Income Tax e-Return',
    url: 'https://etaxnbr.gov.bd',
    category: 'tax',
    noteBn: 'জাতীয় রাজস্ব বোর্ডের আয়কর রিটার্ন জমা দেওয়ার ব্যবস্থা।',
    noteEn: 'National Board of Revenue system for filing income tax returns online.',
  },
  {
    nameBn: 'বিআরটিএ সেবা পোর্টাল',
    nameEn: 'BRTA Service Portal',
    url: 'https://bsp.brta.gov.bd',
    category: 'transport',
    noteBn: 'ড্রাইভিং লাইসেন্স ও যানবাহন সংক্রান্ত সেবা।',
    noteEn: 'Driving licence and vehicle-related services.',
  },
  {
    nameBn: 'বাংলাদেশ রেলওয়ে ই-টিকিট',
    nameEn: 'Bangladesh Railway e-Ticket',
    url: 'https://eticket.railway.gov.bd',
    category: 'transport',
    noteBn: 'আন্তঃনগর ট্রেনের টিকিট অনলাইনে কেনার সরকারি সাইট।',
    noteEn: 'Official site for buying intercity train tickets online.',
  },
  {
    nameBn: 'শিক্ষা বোর্ড ফলাফল',
    nameEn: 'Education Board Results',
    url: 'https://educationboardresults.gov.bd',
    category: 'education',
    noteBn: 'এসএসসি ও এইচএসসি ফলাফল দেখার সরকারি সাইট।',
    noteEn: 'Official site for SSC and HSC results.',
  },
  {
    nameBn: 'বাংলাদেশ সরকারী কর্ম কমিশন (বিপিএসসি)',
    nameEn: 'Bangladesh Public Service Commission (BPSC)',
    url: 'https://bpsc.gov.bd',
    category: 'jobs',
    noteBn: 'বিসিএসসহ সরকারি চাকরির পরীক্ষা ও ফলাফল।',
    noteEn: 'BCS and other government job exams and results.',
  },
  {
    nameBn: 'জনশক্তি, কর্মসংস্থান ও প্রশিক্ষণ ব্যুরো (BMET)',
    nameEn: 'Bureau of Manpower, Employment & Training (BMET)',
    url: 'https://bmet.gov.bd',
    category: 'jobs',
    noteBn: 'বিদেশে কর্মসংস্থান, নিবন্ধন ও প্রশিক্ষণ সংক্রান্ত সেবা।',
    noteEn: 'Overseas employment, registration and training services.',
  },
];

export const GOVT_SERVICE_CATEGORIES: readonly GovtServiceCategory[] = [
  'general',
  'identity',
  'land',
  'tax',
  'transport',
  'education',
  'jobs',
];

/**
 * Filter the directory by free-text query (Bangla/English name or
 * URL) and/or category. Empty query + 'all' keeps the full list.
 */
export function filterGovtServiceLinks(
  links: readonly GovtServiceLink[],
  query: string,
  category: GovtServiceCategory | 'all',
): GovtServiceLink[] {
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
