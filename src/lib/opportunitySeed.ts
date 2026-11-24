// Eduvelto — Global Opportunity Hub: verified seed listings (23 Nov 2026).
//
// Every listing below was verified from its official source on
// 23 Nov 2026 (research report: team/opportunity-hub-seed-report —
// see team/opportunity-hub-2026-11-23.md for the method + the
// rejected candidates). NOTHING here is invented: a date that the
// official page did not show is null, a vacancy total that two
// summaries disagree on is NOT published, and a listing whose
// official page did not fully render is marked 'official-indexed'
// with its caveat in verificationNote — never presented as a
// full official-page read.
//
// The seed is the v1 source of truth for the public hub: the hub
// page renders these listings when the Firestore `opportunities`
// collection is empty (see opportunitiesData.ts). Moderators later
// publish listings to Firestore with the same docIds; Firestore
// docs then take precedence and the seed becomes the fallback.
// The seed script (scripts/seed-opportunities.mjs) writes exactly
// these docs to the EMULATOR only — never to production from here.

import type { Opportunity } from './opportunities';
import { opportunityFromStored } from './opportunities';

/** Seed rows use millis (not Firestore Timestamps) — the loader
 * and the seed script both accept them. */
export type OpportunitySeedRow = Omit<
  Opportunity,
  'publishedDateMillis' | 'deadlineMillis' | 'verifiedAtMillis' | 'createdAtMillis' | 'updatedAtMillis'
> & {
  publishedDateMillis: number | null;
  deadlineMillis: number | null;
  verifiedAtMillis: number | null;
  createdAtMillis: number | null;
  updatedAtMillis: number | null;
};

const VERIFIED_AT = Date.UTC(2026, 10, 23, 10, 0, 0); // 23 Nov 2026, verification day
const SEED_AUTHOR = 'seed-verification-2026-11-23';

export const OPPORTUNITY_SEED: OpportunitySeedRow[] = [
  {
    docId: 'bpsc-non-cadre-2026',
    type: 'job',
    titleBn: 'বিপিএসসি নন-ক্যাডার নিয়োগ ২০২৬ — সার্কুলার (৭৮–৮২) ও (৮৩–৯৬)/২০২৬',
    titleEn: 'BPSC Non-Cadre Recruitment 2026 — Circulars (78–82)/2026 and (83–96)/2026',
    organizationBn: 'বাংলাদেশ পাবলিক সার্ভিস কমিশন (BPSC)',
    organizationEn: 'Bangladesh Public Service Commission (BPSC)',
    countryBn: 'বাংলাদেশ',
    countryEn: 'Bangladesh',
    eligibilityBn: 'বাংলাদেশি নাগরিক; পদভেদে শিক্ষাগত যোগ্যতা ও বয়স ভিন্ন — বিস্তারিত মূল বিজ্ঞপ্তিতে দেখুন।',
    eligibilityEn: 'Bangladeshi citizens; age and qualifications vary by post — see the original circular for details.',
    descriptionBn:
      'গ্রেড ৫–১২-এর ১৯ ধরনের পদে মোট ১৪৭টি পদে নন-ক্যাডার সরাসরি নিয়োগ (সিস্টেম অ্যানালিস্ট, মেইনটেন্যান্স ইঞ্জিনিয়ার, সহকারী প্রধান স্থপতি, প্রোগ্রামার, জুনিয়র কনসালট্যান্ট (মেডিসিন), আইন কর্মকর্তা, নার্স মিডওয়াইফসহ আরও পদ)। অনলাইনে BPSC ফরম-৫এ-তে আবেদন, ফি টেলিটক SMS-এ।',
    descriptionEn:
      'Non-cadre direct recruitment for 147 posts across 19 post categories in Grades 5–12 (System Analyst, Maintenance Engineer, Assistant Chief Architect, Programmer, Junior Consultant (Medicine), Law Officer, Nurse Midwife and others). Apply online via BPSC Form-5A; fee by Teletalk SMS.',
    sourceName: 'বাংলাদেশ পাবলিক সার্ভিস কমিশন (BPSC)',
    sourceUrl: 'https://www.bpsc.gov.bd',
    applyUrl: 'http://bpsc.teletalk.com.bd',
    publishedDateMillis: null,
    deadlineMillis: Date.UTC(2026, 10, 30, 12, 0, 0), // 30 Nov 2026, 6:00 PM Dhaka
    deadlinePrecision: 'datetime',
    isPlatform: false,
    verificationLevel: 'official-indexed',
    verificationNoteBn:
      'মূল বিজ্ঞপ্তির PDF এই যাচাইয়ে পুরো পড়া যায়নি; শেষ তারিখ ও আবেদন লিংক বিপিএসসির অফিসিয়াল হোমপেজের "চলমান নিয়োগ বিজ্ঞপ্তিসমূহ" ও বিজ্ঞপ্তির উদ্ধৃতি থেকে মিলিয়ে নেওয়া হয়েছে। পদসংখ্যা ১৪৭টি — অফিসিয়াল বিজ্ঞপ্তি সার্কুলার (৭৮–৮২) ও (৮৩–৯৬)/২০২৬ থেকে যাচাই করা।',
    verificationNoteEn:
      'The original circular PDF could not be fully read in this verification; the deadline and application link were corroborated from the BPSC official homepage ("ongoing recruitment notices") and citations of the circular. The vacancy total is 147 posts, verified from official circulars (78–82)/2026 and (83–96)/2026.',
    verifiedBy: SEED_AUTHOR,
    verifiedAtMillis: VERIFIED_AT,
    reviewStatus: 'Published',
    authorId: SEED_AUTHOR,
    createdAtMillis: VERIFIED_AT,
    updatedAtMillis: VERIFIED_AT,
  },
  {
    docId: 'unicef-writer-editor-2026',
    type: 'remote',
    titleBn: 'রাইটার/এডিটর (কনসালট্যান্ট, রিমোট, ৫ মাস) — ইউনিসেফ বাংলাদেশ',
    titleEn: 'Writer/Editor for UNICEF Bangladesh Country Office (Consultant), International, Remote, 5 months',
    organizationBn: 'ইউনিসেফ বাংলাদেশ কান্ট্রি অফিস',
    organizationEn: 'UNICEF Bangladesh Country Office',
    countryBn: 'বাংলাদেশ / আন্তর্জাতিক (রিমোট)',
    countryEn: 'Bangladesh / International (remote)',
    eligibilityBn:
      'স্নাতকোত্তর ডিগ্রি ও অন্তত ১০ বছরের প্রাসঙ্গিক অভিজ্ঞতা (সিনিয়র পদ)। ইউনিসেফ নিয়োগের কোনো ধাপে ফি নেয় না।',
    eligibilityEn:
      'Master\u2019s degree and at least 10 years\u2019 relevant experience (senior role). UNICEF does not charge a fee at any stage of recruitment.',
    descriptionBn:
      '৫ মাসের রিমোট কনসালট্যান্সি — দাতা প্রতিবেদন, প্রস্তাবনা, কনসেপ্ট নোট ও ব্রিফিং উপকরণ তৈরি এবং ২০২৬ কান্ট্রি অফিস বার্ষিক প্রতিবেদনে সহায়তা। আবেদনে CV, কভার লেটার, আর্থিক প্রস্তাব ও লেখার নমুনাসহ কারিগরি প্রস্তাব লাগে।',
    descriptionEn:
      'A 5-month remote consultancy supporting UNICEF Bangladesh with donor reports, proposals, concept notes and briefing materials, and with the 2026 Country Office Annual Report. Applications need a CV, cover letter, financial proposal and a technical proposal including a writing sample.',
    sourceName: 'UNICEF Careers',
    sourceUrl:
      'https://careers.pageuppeople.com/mob/671/ci/en-us/job/597004/writereditor-for-unicef-bangladesh-country-office-consultant-international-remote-5-months-dhaka-bangladesh',
    applyUrl:
      'https://careers.pageuppeople.com/mob/671/ci/en-us/job/597004/writereditor-for-unicef-bangladesh-country-office-consultant-international-remote-5-months-dhaka-bangladesh',
    publishedDateMillis: Date.UTC(2026, 10, 16, 0, 0, 0), // 16 Nov 2026
    deadlineMillis: Date.UTC(2026, 10, 25, 0, 0, 0), // 25 Nov 2026 (date-only, BST)
    deadlinePrecision: 'date_only',
    isPlatform: false,
    verificationLevel: 'official',
    verificationNoteBn: null,
    verificationNoteEn: null,
    verifiedBy: SEED_AUTHOR,
    verifiedAtMillis: VERIFIED_AT,
    reviewStatus: 'Published',
    authorId: SEED_AUTHOR,
    createdAtMillis: VERIFIED_AT,
    updatedAtMillis: VERIFIED_AT,
  },
  {
    docId: 'undrr-intern-pm-2026',
    type: 'internship',
    titleBn: 'ইন্টার্ন — প্রজেক্ট ম্যানেজমেন্ট (জব আইডি ২৮৮০৩৫) — UNDRR, জেনেভা',
    titleEn: 'Intern — Project Management, Job Opening ID 288035 — UNDRR, Geneva',
    organizationBn: 'জাতিসংঘ দুর্যোগ ঝুঁকি হ্রাস কার্যালয় (UNDRR)',
    organizationEn: 'United Nations Office for Disaster Risk Reduction (UNDRR)',
    countryBn: 'বিশ্বব্যাপী (জেনেভা; রিমোট বা সরাসরি)',
    countryEn: 'Global (Geneva; remote or in-person)',
    eligibilityBn:
      'বিশ্ববিদ্যালয়ে ভর্তি বা সদ্য স্নাতক; সাধারণত অভিজ্ঞতা আবশ্যক নয়। জাতিসংঘ নিয়োগের কোনো ধাপে ফি নেয় না।',
    eligibilityEn:
      'Enrolled in or recently graduated from a university programme; no work experience is generally required. The UN does not charge a fee at any stage of recruitment.',
    descriptionBn:
      'পূর্ণকালীন অবৈতনিক ইন্টার্নশিপ, কমপক্ষে ৬ মাস, জানুয়ারি ২০২৭ থেকে — ইনফ্রাস্ট্রাকচার অ্যান্ড ফাইন্যান্সিং ফর রেজিলিয়েন্স ইউনিটে প্রতিবেদন, ইস্যু ব্রিফ, উপস্থাপনা, সভার কার্যবিবরণী ও সভা/ওয়েবিনার সহায়তা।',
    descriptionEn:
      'Full-time, unpaid internship of at least 6 months starting January 2027, assisting the Infrastructure and Financing for Resilience Unit with reports, issue briefs, presentations, meeting minutes and meeting/webinar support.',
    sourceName: 'UN Careers',
    sourceUrl: 'https://careers.un.org/jobSearchDescription/288035?language=en',
    applyUrl: 'https://careers.un.org/jobSearchDescription/288035?language=en',
    publishedDateMillis: Date.UTC(2026, 10, 15, 0, 0, 0), // 15 Nov 2026
    deadlineMillis: Date.UTC(2026, 10, 30, 0, 0, 0), // 30 Nov 2026
    deadlinePrecision: 'date_only',
    isPlatform: false,
    verificationLevel: 'official-indexed',
    verificationNoteBn:
      'UN Careers পাতাটি এই যাচাইয়ে শুধু জাভাস্ক্রিপ্ট শেল দেখিয়েছে; শিরোনাম, কর্মস্থল, প্রকাশের তারিখ ও শেষ তারিখ careers.un.org-এর অফিসিয়াল ইনডেক্স রেকর্ড (জব আইডি ২৮৮০৩৫) থেকে যাচাই করা।',
    verificationNoteEn:
      'The UN Careers page returned only a JavaScript shell in this verification; the title, duty station, published date and deadline are verified from the official careers.un.org indexed record for Job Opening ID 288035.',
    verifiedBy: SEED_AUTHOR,
    verifiedAtMillis: VERIFIED_AT,
    reviewStatus: 'Published',
    authorId: SEED_AUTHOR,
    createdAtMillis: VERIFIED_AT,
    updatedAtMillis: VERIFIED_AT,
  },
  {
    docId: 'commonwealth-shared-2027',
    type: 'scholarship',
    titleBn: 'কমনওয়েলথ শেয়ার্ড স্কলারশিপ ২০২৭/২৮ — যুক্তরাজ্যে এক বছরের মাস্টার্স',
    titleEn: 'Commonwealth Shared Scholarships 2027/28 — one-year taught Master\u2019s in the UK',
    organizationBn: 'কমনওয়েলথ স্কলারশিপ কমিশন, যুক্তরাজ্য (CSC)',
    organizationEn: 'Commonwealth Scholarship Commission in the UK (CSC)',
    countryBn: 'বাংলাদেশসহ যোগ্য কমনওয়েলথ দেশ (যুক্তরাজ্য)',
    countryEn: 'Bangladesh and other eligible Commonwealth countries (UK)',
    eligibilityBn:
      'যোগ্য কমনওয়েলথ দেশের নাগরিক ও স্থায়ী বাসিন্দা; ২০২৭ সালের সেপ্টেম্বরের মধ্যে অন্তত আপার সেকেন্ড-ক্লাস (২:১) স্নাতক ডিগ্রি (বা প্রাসঙ্গিক স্নাতকোত্তরসহ লোয়ার সেকেন্ড-ক্লাস); নিজ খরচে যুক্তরাজ্যে পড়া সম্ভব নয় এমন প্রার্থী।',
    eligibilityEn:
      'Citizen of and permanently resident in an eligible Commonwealth country; a first degree of at least upper second-class (2:1) honours standard (or a lower second-class degree plus a relevant postgraduate qualification) by September 2027; unable to afford UK study without the scholarship.',
    descriptionBn:
      '২০২৭ সালের সেপ্টেম্বর/অক্টোবর থেকে যুক্তরাজ্যে সম্পূর্ণ অর্থায়নে মাস্টার্স — অনুমোদিত টিউশন ফি, যাতায়াত ভাড়া ও জীবনযাপন ভাতা। আবেদন করতে কোনো ফি লাগে না। CSC পোর্টালে আবেদনের পাশাপাশি অংশগ্রহণকারী বিশ্ববিদ্যালয়ে মাস্টার্স কোর্সে আলাদাভাবে ভর্তির আবেদন করতে হয়।',
    descriptionEn:
      'Fully funded Master\u2019s study in the UK beginning September/October 2027, covering approved tuition fees, return airfare and a living stipend. The CSC does not charge to apply. Applicants must also apply separately for admission to an approved Master\u2019s course at a participating UK university.',
    sourceName: 'Commonwealth Scholarship Commission in the UK (CSC)',
    sourceUrl: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships-applications/',
    applyUrl: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships-applications/',
    publishedDateMillis: null,
    deadlineMillis: Date.UTC(2026, 11, 8, 16, 0, 0), // 8 Dec 2026, 16:00 GMT
    deadlinePrecision: 'datetime',
    isPlatform: false,
    verificationLevel: 'official',
    verificationNoteBn: null,
    verificationNoteEn: null,
    verifiedBy: SEED_AUTHOR,
    verifiedAtMillis: VERIFIED_AT,
    reviewStatus: 'Published',
    authorId: SEED_AUTHOR,
    createdAtMillis: VERIFIED_AT,
    updatedAtMillis: VERIFIED_AT,
  },
  {
    docId: 'kaggle-learn',
    type: 'skill',
    titleBn: 'Kaggle Learn — পাইথন, মেশিন লার্নিং, SQL ও আরও অনেক কিছু (বিনামূল্যে)',
    titleEn: 'Kaggle Learn — free micro-courses in Python, Machine Learning, SQL and more',
    organizationBn: 'Kaggle (Google)',
    organizationEn: 'Kaggle (Google)',
    countryBn: 'বিশ্বব্যাপী (বাংলাদেশসহ)',
    countryEn: 'Global (including Bangladesh)',
    eligibilityBn: 'শুরু করতে কোনো অভিজ্ঞতা লাগে না; অনুশীলন ও সার্টিফিকেটের জন্য বিনামূল্যে Kaggle অ্যাকাউন্ট লাগে।',
    eligibilityEn: 'No prior experience required to start; a free Kaggle account is needed to run exercises and earn certificates.',
    descriptionBn:
      'ব্রাউজারেই কয়েক ঘণ্টায় শেষ করা যায় এমন হাতে-কলমে ছোট কোর্স — পাইথন, মেশিন লার্নিং, Pandas, SQL, ডেটা ভিজ্যুয়ালাইজেশন, ডিপ লার্নিংসহ আরও বিষয়। Kaggle-এর মতে কোর্সগুলো "provided at no cost to you"; কোর্স শেষে সার্টিফিকেট।',
    descriptionEn:
      'Short hands-on courses completable in a few hours in the browser — Python, Machine Learning, Pandas, SQL, Data Visualisation, Deep Learning and more. Kaggle states the courses are "provided at no cost to you", with a completion certificate on finishing a course.',
    sourceName: 'Kaggle Learn',
    sourceUrl: 'https://www.kaggle.com/learn',
    applyUrl: 'https://www.kaggle.com/learn',
    publishedDateMillis: null,
    deadlineMillis: null,
    deadlinePrecision: 'date_only',
    isPlatform: true,
    verificationLevel: 'official',
    verificationNoteBn: null,
    verificationNoteEn: null,
    verifiedBy: SEED_AUTHOR,
    verifiedAtMillis: VERIFIED_AT,
    reviewStatus: 'Published',
    authorId: SEED_AUTHOR,
    createdAtMillis: VERIFIED_AT,
    updatedAtMillis: VERIFIED_AT,
  },
  {
    docId: 'google-skillshop',
    type: 'skill',
    titleBn: 'Google Skillshop — Google Ads, Analytics (GA4) ও অন্যান্য পণ্যের বিনামূল্যে প্রশিক্ষণ ও সার্টিফিকেশন',
    titleEn: 'Google Skillshop — free training and certification for Google Ads, Google Analytics (GA4) and other Google products',
    organizationBn: 'Google',
    organizationEn: 'Google',
    countryBn: 'বিশ্বব্যাপী (বাংলাদেশসহ)',
    countryEn: 'Global (including Bangladesh)',
    eligibilityBn: 'ভর্তির জন্য বিনামূল্যে Google অ্যাকাউন্ট লাগে।',
    eligibilityEn: 'A free Google account is required to enrol.',
    descriptionBn:
      'Google-এর নিজস্ব প্রশিক্ষণ কেন্দ্র — Google-এর পণ্য বিশেষজ্ঞদের তৈরি বিনামূল্যে অনলাইন কোর্সের লাইব্রেরি; Search, Display, Video, Shopping ও Analyticsসহ বিভিন্ন ক্ষেত্রে বিনামূল্যে সার্টিফিকেশন পরীক্ষা।',
    descriptionEn:
      'Google\u2019s own training centre — a library of free online courses designed by Google product experts, with free certification exams in areas including Search, Display, Video, Shopping and Analytics.',
    sourceName: 'Google Skillshop',
    sourceUrl: 'https://skillshop.withgoogle.com/',
    applyUrl: 'https://skillshop.withgoogle.com/',
    publishedDateMillis: null,
    deadlineMillis: null,
    deadlinePrecision: 'date_only',
    isPlatform: true,
    verificationLevel: 'official',
    verificationNoteBn: null,
    verificationNoteEn: null,
    verifiedBy: SEED_AUTHOR,
    verifiedAtMillis: VERIFIED_AT,
    reviewStatus: 'Published',
    authorId: SEED_AUTHOR,
    createdAtMillis: VERIFIED_AT,
    updatedAtMillis: VERIFIED_AT,
  },
  {
    docId: 'upwork',
    type: 'freelance',
    titleBn: 'Upwork — ফ্রিল্যান্স মার্কেটপ্লেস (প্ল্যাটফর্মের বিবরণ, কোনো নির্দিষ্ট কাজ নয়)',
    titleEn: 'Upwork — freelance marketplace (platform description, not a job posting)',
    organizationBn: 'Upwork',
    organizationEn: 'Upwork',
    countryBn: 'বিশ্বব্যাপী (বাংলাদেশসহ)',
    countryEn: 'Global (including Bangladesh)',
    eligibilityBn: 'ফ্রিল্যান্সার হিসেবে প্রোফাইল তৈরি করে পোস্ট করা প্রজেক্টে প্রস্তাব পাঠাতে হয়। অ্যাকাউন্ট খুললেই আয়ের নিশ্চয়তা নেই।',
    eligibilityEn: 'Freelancers create a profile and submit proposals for posted projects. No income is guaranteed by creating an account.',
    descriptionBn:
      'ফ্রিল্যান্স মার্কেটপ্লেস — ক্লায়েন্টরা কাজ পোস্ট করে, ফ্রিল্যান্সাররা ঘণ্টা বা নির্দিষ্ট মূল্যের চুক্তির জন্য প্রস্তাব পাঠায় (সফটওয়্যার, ডিজাইন, লেখালেখি, মার্কেটিং, কাস্টমার সাপোর্টসহ নানা ক্ষেত্রে)। অনুমোদিত কাজের পর প্ল্যাটফর্মের মাধ্যমে অর্থ ছাড় হয়।',
    descriptionEn:
      'A freelance marketplace where clients post jobs and freelancers submit proposals for hourly or fixed-price contracts across categories including software development, design, writing, marketing and customer support, with payments released through the platform after approved work.',
    sourceName: 'Upwork',
    sourceUrl: 'https://www.upwork.com/',
    applyUrl: 'https://www.upwork.com/',
    publishedDateMillis: null,
    deadlineMillis: null,
    deadlinePrecision: 'date_only',
    isPlatform: true,
    verificationLevel: 'official',
    verificationNoteBn: null,
    verificationNoteEn: null,
    verifiedBy: SEED_AUTHOR,
    verifiedAtMillis: VERIFIED_AT,
    reviewStatus: 'Published',
    authorId: SEED_AUTHOR,
    createdAtMillis: VERIFIED_AT,
    updatedAtMillis: VERIFIED_AT,
  },
];

/** The seed as Opportunity objects (validated — a bad row is
 * dropped, never rendered).
 *
 * NOTE (23 Nov 2026, bug found by the unit tests): seed rows
 * carry millis fields (publishedDateMillis, deadlineMillis,
 * verifiedAtMillis, createdAtMillis, updatedAtMillis) but
 * opportunityFromStored validates the STORED shape
 * (publishedDate, applicationDeadline, verifiedAt, createdAt,
 * updatedAt) and rejects unexpected keys — passing a row
 * straight through made every row fail validation and the
 * seed rendered NOTHING. The conversion below is the fix. */
export function seedOpportunities(): Opportunity[] {
  const out: Opportunity[] = [];
  for (const row of OPPORTUNITY_SEED) {
    const { docId, publishedDateMillis, deadlineMillis, verifiedAtMillis, createdAtMillis, updatedAtMillis, ...rest } = row;
    const stored: Record<string, unknown> = {
      ...rest,
      publishedDate: publishedDateMillis,
      applicationDeadline: deadlineMillis,
      verifiedAt: verifiedAtMillis,
      createdAt: createdAtMillis,
      updatedAt: updatedAtMillis,
    };
    const o = opportunityFromStored(docId, stored);
    if (o !== null) out.push(o);
  }
  return out;
}
