// Eduvelto — National University admission: verified structure data
// (NU-5, 22 Nov 2026; design doc §2, §5, §10, §15.1, §19.2.1–§19.2.2).
//
// READ-PATH RULE (Job Step 5 precedent, BINDING for NU-5): the hub UI
// renders from THIS module — verified facts from the official circular
// (memo 10(226)জাতী:বি:/রেজি:/অ্যাকা:/2026/3348, dated 20/11/2025) —
// NOT from Firestore. The Firestore documents (nuInstitutions /
// nuGroups / nuExamConfigs / nuCircularConfigs) do not exist live yet;
// the read path switches to Firestore only once an admin has applied
// them through the admin flow (lib/nuAdmin.ts) and the read-back check
// confirms they match these seeds. Until then every count that would
// come from live data (questions, mocks, results) is an honest 0 /
// honest empty state — never a number copied from a seed.
//
// Every date/status claim in the hub goes through the exported copy
// constants below, so the prohibited-wording test
// (nuStructure.test.ts) can prove none of the §15.1 forbidden phrases
// appears anywhere in NU-5's date/status copy:
//   "আবেদন চলছে" / "এখনই আবেদন করুন" / "শেষ তারিখ সামনে" /
//   "২০২৬–২৭ ভর্তি পরীক্ষা নিশ্চিত" / "পরীক্ষার তারিখ ঘোষণা হয়েছে".
// The 2025-26 application window CLOSED 31 Dec 2025; the 2026-27
// circular is NOT verified (Blocker A); the exam date was NEVER
// announced (§3 #1); the group-40 sub-split is NOT verified
// (Blocker B — sections.groupSubjectsDetail stays null).

import {
  nuCircularConfigSeed,
  nuDailyMockConfigSeed,
  nuFullMockConfigSeed,
  NU_CIRCULAR_VERSION,
  type NuCircularConfig,
  type NuExamConfig,
} from './nuExamConfig';
import { NU_GROUPS, type NuGroupSlug } from './nuProfile';

/** NU-5 dashboard-route decision (NU-Q6, FINAL — design §5.10, §16):
 * `/admissions/dashboard`. The roadmap's `/dashboard/admissions`
 * predates the section-scoped dashboard pattern; Job set the
 * precedent with `/jobs/dashboard`, and every NU route lives under
 * `/admissions/*`, so one section prefix covers the hub, the group
 * pages and the dashboard. Recorded in team/nu-admission-status.md. */
export const NU_DASHBOARD_ROUTE = '/admissions/dashboard';

export const NU_HUB_ROUTE = '/admissions/national-university';

/** The 8 hub tabs (design §5.2). Route: hub home = Home tab;
 * `/admissions/national-university/:tab` for the rest. */
export const NU_HUB_TABS = [
  'home',
  'groups',
  'practice',
  'mock-tests',
  'previous-questions',
  'results',
  'progress',
  'notices',
] as const;

export type NuHubTab = (typeof NU_HUB_TABS)[number];

export function isNuHubTab(value: unknown): value is NuHubTab {
  return typeof value === 'string' && (NU_HUB_TABS as readonly string[]).includes(value);
}

export const NU_HUB_TAB_LABELS: Record<NuHubTab, { bn: string; en: string }> = {
  home: { bn: 'হোম', en: 'Home' },
  groups: { bn: 'শাখা', en: 'Groups' },
  practice: { bn: 'অনুশীলন', en: 'Practice' },
  'mock-tests': { bn: 'মক টেস্ট', en: 'Mock Tests' },
  'previous-questions': { bn: 'বিগত প্রশ্ন', en: 'Previous Questions' },
  results: { bn: 'ফলাফল', en: 'Results' },
  progress: { bn: 'অগ্রগতি', en: 'Progress' },
  notices: { bn: 'বিজ্ঞপ্তি', en: 'Notices' },
};

// ---------- institution + group seed payloads ----------

export interface NuInstitutionDoc {
  nameBn: string;
  nameEn: string;
  slug: string;
  type: string;
  status: 'active' | 'inactive';
  officialUrl: string;
  priority: number;
}

export interface NuGroupDoc {
  institutionId: string;
  slug: NuGroupSlug;
  nameBn: string;
  accentColor: string;
  examConfigId: string;
  eligibilitySummary: string;
  circularVersion: string;
  status: 'draft' | 'published';
}

/** Mirrors `team/nu-exam-config-seed-2026-11-22.json`
 * (`nuInstitutions/national-university`). */
export function nuInstitutionSeed(): NuInstitutionDoc {
  return {
    nameBn: 'জাতীয় বিশ্ববিদ্যালয়',
    nameEn: 'National University',
    slug: 'national-university',
    type: 'public-university',
    status: 'active',
    officialUrl: 'https://www.nu.ac.bd/admissions',
    priority: 1,
  };
}

const NU_GROUP_ELIGIBILITY: Record<NuGroupSlug, string> = {
  humanities:
    'SSC ২০২২/২০২৩ GPA ২.০+, HSC ২০২৪/২০২৫ GPA ২.০+, মোট GPA ৪.৫+ (৪র্থ বিষয়সহ) — বিজ্ঞপ্তি ২০/১১/২০২৫ §১।',
  science:
    'SSC ২০২২/২০২৩ GPA ২.২৫+, HSC ২০২৪/২০২৫ GPA ২.০+, মোট GPA ৪.৭৫+ (৪র্থ বিষয়সহ) — বিজ্ঞপ্তি ২০/১১/২০২৫ §১।',
  business:
    'SSC ২০২২/২০২৩ GPA ২.০+, HSC ২০২৪/২০২৫ GPA ২.০+, মোট GPA ৪.৫+ (৪র্থ বিষয়সহ) — বিজ্ঞপ্তি ২০/১১/২০২৫ §১।',
};

/** Mirrors `team/nu-exam-config-seed-2026-11-22.json` (`nuGroups/*`). */
export function nuGroupSeeds(): Record<NuGroupSlug, NuGroupDoc> {
  const out = {} as Record<NuGroupSlug, NuGroupDoc>;
  for (const g of NU_GROUPS) {
    out[g.slug] = {
      institutionId: 'national-university',
      slug: g.slug,
      nameBn: g.bn,
      accentColor: g.accent,
      examConfigId: 'nu-admission-full-2025-26-v1',
      eligibilitySummary: NU_GROUP_ELIGIBILITY[g.slug],
      circularVersion: NU_CIRCULAR_VERSION,
      status: 'published',
    };
  }
  return out;
}

// ---------- client-side validators (mirrors of firestore.rules) ----------

export function validateNuInstitutionDoc(doc: unknown): string[] {
  const problems: string[] = [];
  if (typeof doc !== 'object' || doc === null) return ['institution doc is not an object'];
  const d = doc as Record<string, unknown>;
  if (typeof d.slug !== 'string' || d.slug.length === 0) problems.push('slug must be a non-empty string');
  if (typeof d.officialUrl !== 'string' || d.officialUrl.length === 0) {
    problems.push('officialUrl must be a non-empty string');
  }
  if (typeof d.nameBn !== 'string' || d.nameBn.length === 0) problems.push('nameBn must be a non-empty string');
  if (typeof d.nameEn !== 'string' || d.nameEn.length === 0) problems.push('nameEn must be a non-empty string');
  if (d.status !== 'active' && d.status !== 'inactive') problems.push('status must be active/inactive');
  if (typeof d.priority !== 'number' || !Number.isInteger(d.priority)) {
    problems.push('priority must be an integer');
  }
  return problems;
}

export function validateNuGroupDoc(doc: unknown): string[] {
  const problems: string[] = [];
  if (typeof doc !== 'object' || doc === null) return ['group doc is not an object'];
  const d = doc as Record<string, unknown>;
  if (!['humanities', 'science', 'business'].includes(String(d.slug))) {
    problems.push(`slug must be humanities/science/business, got ${String(d.slug)}`);
  }
  if (typeof d.institutionId !== 'string' || d.institutionId.length === 0) {
    problems.push('institutionId must be a non-empty string');
  }
  if (typeof d.examConfigId !== 'string' || d.examConfigId.length === 0) {
    problems.push('examConfigId must be a non-empty string');
  }
  if (typeof d.circularVersion !== 'string' || d.circularVersion.length === 0) {
    problems.push('circularVersion must be a non-empty string');
  }
  if (typeof d.nameBn !== 'string' || d.nameBn.length === 0) problems.push('nameBn must be a non-empty string');
  if (typeof d.accentColor !== 'string' || d.accentColor.length === 0) {
    problems.push('accentColor must be a non-empty string');
  }
  if (typeof d.eligibilitySummary !== 'string' || d.eligibilitySummary.length === 0) {
    problems.push('eligibilitySummary must be a non-empty string');
  }
  if (d.status !== 'draft' && d.status !== 'published') {
    problems.push(`status must be draft/published, got ${String(d.status)}`);
  }
  return problems;
}

export function validateNuCircularConfigDoc(doc: unknown): string[] {
  const problems: string[] = [];
  if (typeof doc !== 'object' || doc === null) return ['circular config is not an object'];
  const d = doc as Record<string, unknown>;
  if (typeof d.academicSession !== 'string' || d.academicSession.length === 0) {
    problems.push('academicSession must be a non-empty string');
  }
  if (
    !['draft', 'verified', 'published', 'historical', 'superseded'].includes(String(d.status))
  ) {
    problems.push(`status must be draft/verified/published/historical/superseded, got ${String(d.status)}`);
  }
  if (d.sourceType !== 'official_circular') problems.push('sourceType must be official_circular');
  if (typeof d.sourceReference !== 'string' || d.sourceReference.length === 0) {
    problems.push('sourceReference must be a non-empty string');
  }
  // The exam date was never announced (§3 #1) — a circular config
  // carrying an exam date is rejected here, not silently accepted.
  if (d.examDate !== null && d.examDate !== undefined) {
    problems.push('examDate must be null — the exam date was never announced');
  }
  if (typeof d.eligibilityRulesVersion !== 'string' || d.eligibilityRulesVersion.length === 0) {
    problems.push('eligibilityRulesVersion must be a non-empty string');
  }
  if (typeof d.meritRulesVersion !== 'string' || d.meritRulesVersion.length === 0) {
    problems.push('meritRulesVersion must be a non-empty string');
  }
  return problems;
}

// ---------- verified notice + calendar (design §10) ----------

/** The single verified notice (circular 20/11/2025). No other notice
 * exists — the Notices tab shows this one card plus an honest empty
 * note for anything newer. `examDate` is absent by design (§10.1 #10:
 * the row does not exist when the circular has no exam date). */
export interface NuVerifiedNotice {
  institutionBn: string;
  titleBn: string;
  memoNo: string;
  publishedBn: string;
  applicationEndBn: string;
  applicationStatusBn: string;
  feeBn: string;
  eligibilitySummaryBn: string;
  officialUrl: string;
  officialPdfUrl: string;
  verifiedBn: string;
}

export const NU_VERIFIED_NOTICE: NuVerifiedNotice = {
  institutionBn: 'জাতীয় বিশ্ববিদ্যালয় — অনার্স ১ম বর্ষ ভর্তি (২০২৫-২০২৬)',
  titleBn: 'অনার্স ১ম বর্ষ ভর্তি বিজ্ঞপ্তি — সেশন ২০২৫-২০২৬',
  memoNo: 'স্মারক নং: 10(226)জাতী:বি:/রেজি:/অ্যাকা:/2026/3348',
  publishedBn: 'প্রকাশিত: ২০ নভেম্বর ২০২৫',
  applicationEndBn: 'আবেদনের শেষ তারিখ: ৩১ ডিসেম্বর ২০২৫',
  applicationStatusBn: 'আবেদন শেষ',
  feeBn: 'আবেদন ফি: ১,০০০/- টাকা',
  eligibilitySummaryBn:
    'মানবিক/ব্যবসায় শিক্ষা: SSC ২০২২/২৩ GPA ২.০+, HSC ২০২৪/২৫ GPA ২.০+, মোট GPA ৪.৫+। বিজ্ঞান: SSC GPA ২.২৫+, HSC GPA ২.০+, মোট GPA ৪.৭৫+ (৪র্থ বিষয়সহ)। বিস্তারিত বিজ্ঞপ্তিতে দেখুন।',
  officialUrl: 'https://www.nu.ac.bd/admissions',
  officialPdfUrl: 'https://www.nu.ac.bd/uploads/notices/notice_3348_pub_date_23112025.pdf',
  verifiedBn: 'যাচাইকৃত ✓ — অফিসিয়াল বিজ্ঞপ্তি থেকে, ২২ নভেম্বর ২০২৬',
};

/** Calendar dates list (design §10.3 — dates list only in Phase A,
 * no full calendar grid). All events are HISTORY for the 2025-26
 * cycle (all dates have passed). The 25 Apr 2026 exam date is
 * VERIFIED history (exam notice memo 2026/3456, 07/04/2026 + press
 * release 24/04/2026 — §3.1, NU-6). There is NO 2026-27 exam-date
 * event — that date has never been announced. */
export interface NuCalendarEvent {
  labelBn: string;
  dateBn: string;
  stateBn: string;
}

export const NU_CALENDAR_EVENTS: NuCalendarEvent[] = [
  {
    labelBn: 'আবেদনের শেষ তারিখ (২০২৫-২৬)',
    dateBn: '৩১ ডিসেম্বর ২০২৫',
    stateBn: 'ইতিহাস — পেরিয়ে গেছে, আবেদন শেষ',
  },
  {
    labelBn: 'আবেদন ফি জমার শেষ তারিখ (২০২৫-২৬)',
    dateBn: '০৪ জানুয়ারি ২০২৬',
    stateBn: 'ইতিহাস — পেরিয়ে গেছে',
  },
  {
    labelBn: 'ভর্তি পরীক্ষা (২০২৫-২৬)',
    dateBn: '২৫ এপ্রিল ২০২৬',
    stateBn: 'ইতিহাস — পরীক্ষা সম্পন্ন হয়েছে',
  },
];

// ---------- date/status copy (prohibited-wording guarded) ----------

/** Hub hero chip — the closed 2025-26 window, stated plainly (§5.2,
 * §18 correction). */
export const NU_WINDOW_STATUS_BN =
  '২০২৫-২০২৬ আবেদন শেষ: ৩১ ডিসেম্বর ২০২৫ — ২০২৬-২০২৭ বিজ্ঞপ্তি এখনো যাচাই হয়নি';

/** Exam-date line (2026-27 cycle) — that date was never announced
 * (§3 #1). The 2025-26 exam (25 Apr 2026) is history — see
 * NU_CALENDAR_EVENTS. */
export const NU_EXAM_DATE_BN = 'পরীক্ষার তারিখ এখনো ঘোষণা হয়নি — পৃথক বিজ্ঞপ্তিতে আসবে';

/** Phase A wording for the next cycle (§15.1). */
export const NU_NEXT_CYCLE_BN =
  'সর্বশেষ যাচাইকৃত বিজ্ঞপ্তি ২০২৫–২০২৬ শিক্ষাবর্ষের। নতুন বিজ্ঞপ্তি এখনো যাচাই করা হয়নি — পরবর্তী বিজ্ঞপ্তি প্রকাশিত হলে তথ্য হালনাগাদ করা হবে।';

/** Forbidden phrases (§15.1, §18) — must never appear in NU copy
 * until a new circular is verified. The unit test scans every
 * exported copy constant in this module against this list. */
export const NU_PROHIBITED_WORDINGS: readonly string[] = [
  'আবেদন চলছে',
  'এখনই আবেদন করুন',
  'শেষ তারিখ সামনে',
  '২০২৬–২৭ ভর্তি পরীক্ষা নিশ্চিত',
  'পরীক্ষার তারিখ ঘোষণা হয়েছে',
];

/** All date/status copy in this module, in one place for the
 * prohibited-wording test. */
export function nuAllCopyStrings(): string[] {
  return [
    NU_WINDOW_STATUS_BN,
    NU_EXAM_DATE_BN,
    NU_NEXT_CYCLE_BN,
    NU_VERIFIED_NOTICE.institutionBn,
    NU_VERIFIED_NOTICE.titleBn,
    NU_VERIFIED_NOTICE.memoNo,
    NU_VERIFIED_NOTICE.publishedBn,
    NU_VERIFIED_NOTICE.applicationEndBn,
    NU_VERIFIED_NOTICE.applicationStatusBn,
    NU_VERIFIED_NOTICE.feeBn,
    NU_VERIFIED_NOTICE.eligibilitySummaryBn,
    NU_VERIFIED_NOTICE.verifiedBn,
    ...NU_CALENDAR_EVENTS.map((e) => `${e.labelBn} ${e.dateBn} ${e.stateBn}`),
    ...Object.values(NU_GROUP_ELIGIBILITY),
  ];
}

// ---------- exam pattern + group subjects (from verified config) ----------

/** The verified exam pattern, read from the seed config — one source
 * of truth, no duplicated numbers in the pages. */
export function nuExamPattern(): {
  totalQuestions: number;
  durationMinutes: number;
  passMark: number;
  sections: { bn: string; en: string; marks: number }[];
} {
  const cfg = nuFullMockConfigSeed();
  return {
    totalQuestions: cfg.totalQuestions,
    durationMinutes: cfg.durationSeconds / 60,
    passMark: cfg.passMark.value,
    sections: [
      { bn: 'বাংলা', en: 'Bangla', marks: cfg.sections.bangla },
      { bn: 'ইংরেজি', en: 'English', marks: cfg.sections.english },
      { bn: 'সাধারণ জ্ঞান', en: 'General Knowledge', marks: cfg.sections.generalKnowledge },
      { bn: 'শাখা-ভিত্তিক', en: 'Group subjects', marks: cfg.sections.groupSubjects },
    ],
  };
}

/** Subjects per group (design §5.3). Common to all three groups:
 * Bangla, English, General Knowledge. The group-40 block is ONE
 * block — its inner split is unverified until the Guideline arrives
 * (Blocker B), so no subject list is invented for it. */
export interface NuGroupSubject {
  nameBn: string;
  detailBn: string;
  isGroupBlock: boolean;
}

export function nuGroupSubjects(group: NuGroupSlug): NuGroupSubject[] {
  const common: NuGroupSubject[] = [
    { nameBn: 'বাংলা', detailBn: '২০ নম্বর — বিজ্ঞপ্তি থেকে যাচাইকৃত', isGroupBlock: false },
    { nameBn: 'ইংরেজি', detailBn: '২০ নম্বর — বিজ্ঞপ্তি থেকে যাচাইকৃত', isGroupBlock: false },
    { nameBn: 'সাধারণ জ্ঞান', detailBn: '২০ নম্বর — বিজ্ঞপ্তি থেকে যাচাইকৃত', isGroupBlock: false },
  ];
  const block: NuGroupSubject =
    group === 'science'
      ? {
          nameBn: 'শাখা-ভিত্তিক প্রশ্ন (৪০)',
          detailBn:
            'বিজ্ঞান শাখার ৪০ নম্বর একটি ব্লক হিসেবে — ভেতরের বিভাজন (পদার্থবিজ্ঞান/রসায়ন/গণিত/জীববিজ্ঞান) Guideline-এ নিশ্চিত হলে এখানে আসবে।',
          isGroupBlock: true,
        }
      : group === 'humanities'
        ? {
            nameBn: 'শাখা-ভিত্তিক প্রশ্ন (৪০)',
            detailBn:
              'মানবিক শাখার ৪০ নম্বর একটি ব্লক হিসেবে — কোন চারটি HSC বিষয় থেকে আসবে, তা Guideline-এ নিশ্চিত হলে এখানে আসবে।',
            isGroupBlock: true,
          }
        : {
            nameBn: 'শাখা-ভিত্তিক প্রশ্ন (৪০)',
            detailBn:
              'ব্যবসায় শিক্ষা শাখার ৪০ নম্বর একটি ব্লক হিসেবে — ভেতরের বিভাজন Guideline-এ নিশ্চিত হলে এখানে আসবে।',
            isGroupBlock: true,
          };
  return [...common, block];
}

// ---------- seed-doc set (for the admin flow, lib/nuAdmin.ts) ----------

export interface NuSeedDoc {
  collection: 'nuInstitutions' | 'nuGroups' | 'nuExamConfigs' | 'nuCircularConfigs';
  docId: string;
  /** JSON-plain payload (timestamps as ISO strings — the admin flow
   * converts date fields to Firestore Timestamps on write). */
  payload: Record<string, unknown>;
}

export function nuSeedDocs(): NuSeedDoc[] {
  const groups = nuGroupSeeds();
  const docs: NuSeedDoc[] = [
    { collection: 'nuInstitutions', docId: 'national-university', payload: nuInstitutionSeed() as unknown as Record<string, unknown> },
    { collection: 'nuGroups', docId: 'humanities', payload: groups.humanities as unknown as Record<string, unknown> },
    { collection: 'nuGroups', docId: 'science', payload: groups.science as unknown as Record<string, unknown> },
    { collection: 'nuGroups', docId: 'business', payload: groups.business as unknown as Record<string, unknown> },
    { collection: 'nuExamConfigs', docId: 'nu-admission-full-2025-26-v1', payload: nuFullMockConfigSeed() as unknown as Record<string, unknown> },
    { collection: 'nuExamConfigs', docId: 'nu-daily-2025-26-v1', payload: nuDailyMockConfigSeed() as unknown as Record<string, unknown> },
    { collection: 'nuCircularConfigs', docId: 'nu-2025-26', payload: nuCircularConfigSeed() as unknown as Record<string, unknown> },
  ];
  return docs;
}

/** Re-export the seed builders the admin flow validates against. */
export { nuCircularConfigSeed, nuDailyMockConfigSeed, nuFullMockConfigSeed };
export type { NuCircularConfig, NuExamConfig };
