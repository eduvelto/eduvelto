// Eduvelto — Question Paper Generator (Milestone 2.5, MVP 25 Nov 2026).
//
// Data model + verified-only pool + selection logic. Pure TypeScript —
// no Firestore reads, no network. The generator draws ONLY from
// already-verified questions (see VERIFIED POOL below); anything
// unverified is recorded UNVERIFIED and NEVER enters the pool.
//
// CHAPTER-FIRST (owner 25 Nov 08:36): chapter is the primary selection
// unit and a first-class field — every question carries `chapterId`.
// Teachers pick single OR multiple chapters; topic filters live INSIDE
// the chapter. Topics are NEVER relabelled as chapters.
//
// VERIFIED-PATTERN RULE (Track 3, owner 25 Nov 08:40): model tests use
// the verified real exam patterns ONLY. Patterns are REUSED from the
// repo — JOB_RULES_CONFIGS (./jobExams) for BCS / Bank / Primary /
// NTRCA and nuFullMockConfigSeed() (./nuExamConfig) for NU Admission —
// never re-derived from memory. The owner's "80-mark Primary" example
// is a CUSTOM-VARIANT request, NOT the default: a Primary paper
// defaults to the verified 90. A paper whose counts differ from the
// verified pattern is labelled a custom variant, never a real exam
// pattern.
//
// HONEST LIMITS (stated in the UI too, never hidden):
// - The job bank today holds ONLY 35 verified BCS English questions
//   (7.1% of one full mock per main exam; 455+ missing). Full-mock
//   generation is therefore GATED — the UI shows availability per
//   exam/subject and refuses to invent questions to fill gaps.
//   Academic Classes 3–12 add 2,318 verified questions (26 Nov 2026) —
//   thirty-five subjects (Classes 3–8: Bangla, Bangla Grammar, English,
//   Math, Math-depth, Science, Science-depth, BGS, Islam, ICT,
//   Agriculture, Home Science; Class 9: Accounting, Bangla 1st/2nd,
//   Biology (+depth), Business, Finance, Chemistry (+depth), Civics,
//   History, Economics, Geography, English 1st/2nd, Higher Math
//   (+depth), Islam, Math (+depth), Physics (+depth), BGS, ICT;
//   Class 11: Accounting, Bangla, Biology, Chemistry, Civics,
//   Economics, English, Finance, Geography, Higher Math, History,
//   ICT, Islamic History, Logic, Physics, Psychology, Statistics).
//   Academic Creative Questions (CQ) add 359 verified questions
//   (26 Nov 2026) — Classes 9–12, the same thirty-five subjects
//   (190 Class 9-10 + 169 Class 11-12; CQ-1112-020 HELD, excluded).
//   Each CQ is one stimulus + 4 parts ক/খ/গ/ঘ (marks 1/2/3/4 = 10).
//   Class 10 shares the Class 9 pool (same combined draft set) and
//   Class 12 shares the Class 11 pool (same combined draft set).
//   They count ONLY under their NCTB units, never under any job exam (see
//   verifiedAvailableFor).
// - The Class 9 corrected MCQ packs (nctb-mcq-rebuild-evidence) were
//   reviewed + fixed 26 Nov 2026 and ARE in this pool now (557 verified
//   questions). Class 9 was verified against the DAKHIL editions (no
//   general NCTB Class 9-10 book set exists in the workspace).
// - The Class 11-12 MCQ packs were reviewed + fixed 26 Nov 2026 and ARE
//   in this pool now (374 verified questions). NO HSC book exists in the
//   workspace — VERIFIED for Class 11 means "fact correct per a standard
//   reference + topic within the cited HSC syllabus", NOT "confirmed
//   against the book lesson". A teacher with the actual HSC books should
//   spot-check before publication, especially the re-cited chapters.
// - "Published" reviewStatus is NOT verification (the all-books audit
//   found 506 wrong books). Only `verified: true` questions are shown,
//   by default and always in the MVP pool.

import {
  PUBLIC_BCS_ENGLISH_QUESTIONS,
  PUBLIC_BCS_TOPICS,
  type PublicBcsQuestion,
  type PublicBcsTopic,
} from './publicBcsEnglish';
import {
  PUBLIC_ACADEMIC_CHAPTERS,
  PUBLIC_ACADEMIC_QUESTIONS,
  type PublicAcademicQuestion,
} from './publicAcademic';
import {
  PUBLIC_ACADEMIC_CQ_CHAPTERS,
  PUBLIC_ACADEMIC_CQ_QUESTIONS,
  type PublicAcademicCqQuestion,
} from './publicAcademicCq';
import { JOB_RULES_CONFIGS } from './jobExams';
import { nuFullMockConfigSeed } from './nuExamConfig';

/** Streams: General (NCTB Class 3–12 & Honours), Madrasah, Job & Admission Coaching. */
export type QpgStream = 'general' | 'madrasah' | 'job_admission';

/** Question types a teacher picks per chapter. */
export type QpgQuestionType =
  | 'mcq'
  | 'cq'
  | 'short'
  /** বহুপদী (Multiple Completion) — no verified questions yet. */
  | 'multi-completion'
  /** অভিন্ন তথ্যভিত্তিক (Situation Set) — no verified questions yet. */
  | 'situation-set'
  /** ছবিভিত্তিক প্রশ্ন — no verified questions yet. */
  | 'picture-based'
  /** রচনামূলক / লিখিত প্রশ্ন (written/essay) — no verified questions yet. */
  | 'written';

/** Section types for the multi-section builder (comparison fixes,
 *  26 Nov 2026 — Proshnobanai primary papers are multi-section:
 *  MCQ + short + essay + fill-in + যুক্তবর্ণ + শব্দার্থ). A section's
 *  type is the question type its questions come from; 'fill-in-blanks'
 *  / 'juktoborno' / 'shobdartho' have no verified questions yet, so
 *  such sections honestly show 0 until packs are verified. */
export type QpgSectionType =
  | 'mcq'
  | 'cq'
  | 'short'
  | 'fill-in-blanks'
  | 'juktoborno'
  | 'shobdartho'
  | 'written';

export const QPG_SECTION_TYPES: Array<{
  id: QpgSectionType;
  nameBn: string;
  nameEn: string;
  /** The question type this section draws from. */
  questionType: QpgQuestionType;
}> = [
  { id: 'mcq', nameBn: 'বহুনির্বাচনি (MCQ)', nameEn: 'MCQ', questionType: 'mcq' },
  { id: 'cq', nameBn: 'সৃজনশীল (CQ)', nameEn: 'Creative (CQ)', questionType: 'cq' },
  { id: 'short', nameBn: 'সংক্ষিপ্ত প্রশ্ন', nameEn: 'Short Answer', questionType: 'short' },
  { id: 'fill-in-blanks', nameBn: 'শূন্যস্থান পূরণ', nameEn: 'Fill in the Blanks', questionType: 'short' },
  { id: 'juktoborno', nameBn: 'যুক্তবর্ণ', nameEn: 'Conjunct Letters', questionType: 'short' },
  { id: 'shobdartho', nameBn: 'শব্দার্থ', nameEn: 'Word Meaning', questionType: 'short' },
  { id: 'written', nameBn: 'রচনামূলক (লিখিত)', nameEn: 'Written / Essay', questionType: 'written' },
];

export function qpgSectionTypeById(id: QpgSectionType): (typeof QPG_SECTION_TYPES)[number] | undefined {
  return QPG_SECTION_TYPES.find((t) => t.id === id);
}

/** Default heading for a new section of a given type. */
export function qpgDefaultSectionHeading(type: QpgSectionType, index: number): string {
  const label = qpgSectionTypeById(type)?.nameBn ?? 'বিভাগ';
  const letter = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'][index] ?? '';
  return letter ? `${letter}-বিভাগ: ${label}` : label;
}

/** Question source. HONESTY RULE (owner Turn 32 + 25 Nov 09:19): the
 *  Board Question / Repeated Board Question / Multiple Schools filters
 *  stay DISABLED until verified questions from those sources actually
 *  exist — the bank holds 0 today. Never label an invented question
 *  as a board question. */
export type QpgQuestionSource =
  | 'verified-batch'
  | 'board'
  | 'test-exam'
  | 'repeated-board'
  | 'multiple-schools'
  | 'textbook'
  | 'guide';

/** Cognitive level (Bloom-style, Bangla-first). */
export type QpgCognitiveLevel =
  | 'unspecified'
  | 'knowledge' // জ্ঞান
  | 'comprehension' // অনুধাবন
  | 'application' // প্রয়োগ
  | 'higher' // উচ্চতর দক্ষতা
  ;

/** Question nature. */
export type QpgQuestionNature = 'unspecified' | 'mathematical' | 'theoretical';

/** Difficulty is a filter AND a paper-level label. The verified pool
 *  carries no difficulty tags yet, so a specific difficulty filter
 *  honestly returns zero (see selectQuestions). */
export type QpgDifficulty = 'all' | 'easy' | 'medium' | 'hard';

/** Freemium — PRICING FINAL (owner 25 Nov 09:34 — SUPERSEDES the
 *  09:19 50% table ENTIRELY, and all earlier tiers incl. the
 *  ৳999/year + ৳799-proposed + ৳1,499 coaching tiers, which were
 *  Gemini proposals).
 *
 *  RULE: every Eduvelto generator price = 30% of the equivalent
 *  service's listed price — i.e. 70% OFF — rounded to the nearest
 *  ৳10. (Price basis, recorded internally only: the reference figures
 *  come from the competitor's published list; the competitor's name
 *  is NEVER shown — see DISPLAY RULE.) Free tier stays for now: ৳0,
 *  3 papers/month, watermarked — the free trial IS the marketing
 *  (owner 25 Nov 09:38; SUPERSEDES the Turn 32 figure of 5/month).
 *  There is NO single all-in-one yearly tier — the per-class /
 *  bundle / coaching table below IS the pricing. Single Paper ৳49
 *  and Teacher Monthly ৳199 have no reference price, so they show
 *  plain with no reference price.
 *
 *  DISPLAY RULE (owner 25 Nov 17:28 — "onno kono jaigar nam likba
 *  na", SUPERSEDES the 09:34 naming rule): NEVER name another
 *  website/competitor anywhere on the site — not in the ticker, the
 *  landing page, the pricing table, the SEO descriptions, or the
 *  WhatsApp order text. Each tier shows the reference price as the
 *  main/original price (struck through), LABELED generically as
 *  "বাজার মূল্য" (market price of an equivalent service), then
 *  "৭০% ছাড়ে", then OUR price — e.g. "৳৯৯৯ → ৭০% ছাড়ে → ৳৩০০".
 *  The reference price MUST be labeled as market price — NEVER
 *  presented as our own former price. NEVER use "৬ গুণ কম দামে". */
export const QPG_FREE_MONTHLY_LIMIT = 3;
export const QPG_PRO_PER_PAPER_BDT = 49;
export const QPG_PRO_MONTHLY_BDT = 199;
/** Done-for-you custom paper service (owner 25 Nov 10:50, "koro"):
 *  the buyer orders on WhatsApp (mark distribution + requirements), a
 *  HUMAN (owner/team) builds the paper — never automated — and the PDF
 *  is delivered via WhatsApp at ৳49/paper. Price basis (70%-rule):
 *  theirs ৳150–200/paper → 30% = ৳45–60, set at ৳49 to match the
 *  single-paper price. PRICE HISTORY: the owner briefly overrode the
 *  PDF price to ৳29 at 10:52, then REVERSED at 10:53 ("tahole 49
 *  rhako") — ৳49 stands and the ৳29 override is cancelled; ৳29 must
 *  NOT appear anywhere. Display follows the standard rule: market
 *  price struck through, labelled "বাজার মূল্য", → "৭০% ছাড়ে" → ৳49. */
export const QPG_CUSTOM_PAPER_BDT = 49;
export const QPG_CUSTOM_PAPER_THEIR_MIN_BDT = 150;
export const QPG_CUSTOM_PAPER_THEIR_MAX_BDT = 200;
/** The only honest price claim: "৭০% ছাড়ে" (70% off the market
 *  price of an equivalent service). Never names another website. */
export const QPG_PRICE_CLAIM_BN = 'সব প্রশ্নপত্রে ৭০% ছাড়ে';
export const QPG_PRICE_CLAIM_EN = '70% off all question papers';

/** One annual tier. `eduveltoBdt` is 30% of `marketBdt` —
 *  the owner table is authoritative (brief 25 Nov 09:34). NOTE: the
 *  brief says "nearest ৳10", but 249×0.3 = 74.7 → ৳75 in the table,
 *  so the table effectively follows nearest ৳5; the table value ৳75
 *  stands and the wording gap is flagged in the MVP report.
 *  Enforced pair-by-pair by test (see questionPaper.test.ts). */
export interface QpgPriceTier {
  id: string;
  group: 'per-class' | 'per-subject' | 'bundle' | 'coaching';
  nameBn: string;
  nameEn: string;
  eduveltoBdt: number;
  marketBdt: number;
}

export const QPG_PRICE_TIERS: QpgPriceTier[] = [
  // Per-class annual, all subjects (1 yr).
  { id: 'class-3', group: 'per-class', nameBn: '৩য় শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Class 3 — annual, all subjects', eduveltoBdt: 150, marketBdt: 499 },
  { id: 'class-4', group: 'per-class', nameBn: '৪র্থ শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Class 4 — annual, all subjects', eduveltoBdt: 180, marketBdt: 599 },
  { id: 'class-5', group: 'per-class', nameBn: '৫ম শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Class 5 — annual, all subjects', eduveltoBdt: 210, marketBdt: 699 },
  { id: 'class-6-8', group: 'per-class', nameBn: '৬ষ্ঠ / ৭ম / ৮ম শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Class 6 / 7 / 8 — annual, all subjects', eduveltoBdt: 300, marketBdt: 999 },
  { id: 'class-9-10', group: 'per-class', nameBn: '৯ম / ১০ম শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Class 9 / 10 — annual, all subjects', eduveltoBdt: 450, marketBdt: 1499 },
  { id: 'class-11-12', group: 'per-class', nameBn: '১১শ / ১২শ শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Class 11 / 12 — annual, all subjects', eduveltoBdt: 390, marketBdt: 1299 },
  // Per subject (Class 6+) + subject-wise teacher (Class 6–10).
  { id: 'per-subject', group: 'per-subject', nameBn: 'প্রতি বিষয় (৬ষ্ঠ শ্রেণি+)', nameEn: 'Per subject (Class 6+)', eduveltoBdt: 75, marketBdt: 249 },
  { id: 'subject-teacher', group: 'per-subject', nameBn: 'বিষয়ভিত্তিক শিক্ষক (৬ষ্ঠ–১০ম শ্রেণি, প্রতি বিষয়)', nameEn: 'Subject-wise teacher (Class 6–10, per subject)', eduveltoBdt: 210, marketBdt: 699 },
  // Bundles, all subjects (1 yr).
  { id: 'bundle-3-5', group: 'bundle', nameBn: '৩য়–৫ম শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Class 3–5 bundle — annual, all subjects', eduveltoBdt: 450, marketBdt: 1499 },
  { id: 'bundle-6-8', group: 'bundle', nameBn: '৬ষ্ঠ–৮ম শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Class 6–8 bundle — annual, all subjects', eduveltoBdt: 750, marketBdt: 2499 },
  { id: 'bundle-3-8', group: 'bundle', nameBn: '৩য়–৮ম শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Class 3–8 bundle — annual, all subjects', eduveltoBdt: 900, marketBdt: 2999 },
  { id: 'bundle-6-10', group: 'bundle', nameBn: '৬ষ্ঠ–১০ম শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Class 6–10 bundle — annual, all subjects', eduveltoBdt: 1050, marketBdt: 3499 },
  { id: 'bundle-3-10', group: 'bundle', nameBn: '৩য়–১০ম শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Class 3–10 bundle — annual, all subjects', eduveltoBdt: 1200, marketBdt: 3999 },
  // Coaching / institution, all subjects (1 yr).
  { id: 'coaching-5-8', group: 'coaching', nameBn: 'কোচিং / প্রতিষ্ঠান ৫ম–৮ম শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Coaching / institution Class 5–8 — annual, all subjects', eduveltoBdt: 810, marketBdt: 2699 },
  { id: 'coaching-5-10', group: 'coaching', nameBn: 'কোচিং / প্রতিষ্ঠান ৫ম–১০ম শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Coaching / institution Class 5–10 — annual, all subjects', eduveltoBdt: 1110, marketBdt: 3699 },
  { id: 'coaching-3-10', group: 'coaching', nameBn: 'কোচিং / প্রতিষ্ঠান ৩য়–১০ম শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Coaching / institution Class 3–10 — annual, all subjects', eduveltoBdt: 1200, marketBdt: 3999 },
  { id: 'coaching-6-12', group: 'coaching', nameBn: 'কোচিং / প্রতিষ্ঠান ৬ষ্ঠ–১২শ শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Coaching / institution Class 6–12 — annual, all subjects', eduveltoBdt: 1350, marketBdt: 4499 },
  { id: 'coaching-3-12', group: 'coaching', nameBn: 'কোচিং / প্রতিষ্ঠান ৩য়–১২শ শ্রেণি — বার্ষিক, সব বিষয়', nameEn: 'Coaching / institution Class 3–12 — annual, all subjects', eduveltoBdt: 1500, marketBdt: 4999 },
];

/** Pro plan ids: per-paper + monthly + every annual tier id. */
export type QpgProPlan = 'per-paper' | 'monthly' | QpgPriceTier['id'];

/** Exact amount per plan — the validator + rules enforce these. */
export const QPG_PRO_PLAN_AMOUNTS: Record<QpgProPlan, number> = {
  'per-paper': QPG_PRO_PER_PAPER_BDT,
  monthly: QPG_PRO_MONTHLY_BDT,
  ...Object.fromEntries(QPG_PRICE_TIERS.map((t) => [t.id, t.eduveltoBdt])),
} as Record<QpgProPlan, number>;

export function qpgPriceTierById(id: string): QpgPriceTier | undefined {
  return QPG_PRICE_TIERS.find((t) => t.id === id);
}

/** Cheapest annual tier — used by the download dialog's Pro summary.
 *  (Per-subject ৳125 is not annual, so it is excluded.) */
export const QPG_CHEAPEST_ANNUAL_BDT = Math.min(
  ...QPG_PRICE_TIERS.filter((t) => t.group !== 'per-subject').map((t) => t.eduveltoBdt),
);
/** Shown ONLY in the payment step of the download dialog. */
export const QPG_PAYMENT_NUMBER = '+8801754267001';
/** Payment-confirmation WhatsApp — BRANDED REDIRECT (owner 25 Nov
 *  10:19, FINAL — SUPERSEDES the 10:17 wa.me/eduvelto instruction:
 *  the owner reports messages do NOT come through with the username
 *  link, so the username link is NOT used).
 *
 *  Visitors see and click ONLY https://eduvelto.com/whatsapp — the
 *  raw number never appears in any link text or button. The redirect
 *  (firebase.json hosting redirect + the /whatsapp SPA route as a
 *  dev/preview fallback) points at the number link below. The hosting
 *  redirect is a 302, not a 301: the target will change to the
 *  wa.me/message/... short link when the owner sends it, and a 301
 *  would be cached permanently by browsers.
 *
 *  Buyers message after paying with the TrxID + the last 3 digits of
 *  the sender's bKash/Nagad number; also the support contact for any
 *  problem. The on-site TrxID form stays the record of the order;
 *  WhatsApp is the confirmation/support channel. */
export const QPG_WHATSAPP_URL = 'https://eduvelto.com/whatsapp';
/** Redirect destination for eduvelto.com/whatsapp (the number link). */
export const QPG_WHATSAPP_TARGET_URL = 'https://wa.me/8801975225751';
/** PREFERRED short link (owner 25 Nov 10:19): the WhatsApp Business
 *  short link (wa.me/message/...) from his app — it hides the number
 *  completely. PENDING — the owner will send it when he has it; THEN
 *  this becomes the redirect target instead of the number link.
 *  null until then. Do NOT invent one. */
export const QPG_WHATSAPP_SHORT_LINK: string | null = null;
export const QPG_WHATSAPP_USERNAME = '@eduvelto';
/** Eduvelto WhatsApp account's NUMBER (owner 25 Nov 10:17):
 *  +8801975225751 — https://wa.me/8801975225751 resolves to the
 *  Eduvelto account (book logo, display name "Eduvelto"). Recorded
 *  here as a fact and as the redirect target: MOST LIKELY the same
 *  account as @eduvelto, NOT strictly proven from the page alone.
 *  Never displayed to visitors — the branded redirect hides it. */
export const QPG_WHATSAPP_NUMBER = '+8801975225751';
/** Single centered watermark on every free page + preview overlay
 *  (owner 25 Nov 19:03 — one big mark in the middle, no diagonal grid). */
export const QPG_WATERMARK_TEXT = 'eduvelto.com';
/** FINAL border wording (owner 25 Nov 08:38 — SUPERSEDES the earlier
 *  free-PDF border phrase; that old phrase must appear NOWHERE in
 *  code, UI or PDF). */
export const QPG_BORDER_CREDIT = 'Powered by Eduvelto.com';
/** Book Reader Security: NO specs exist yet (owner 25 Nov 08:38) —
 *  checklist item only. Do NOT invent specs for it here. */
export const QPG_BOOK_READER_SECURITY_SPEC: null = null;

// ---------------------------------------------------------------------
// Catalogue: stream → class/level → subject → chapter
// ---------------------------------------------------------------------

export interface QpgClassLevel {
  id: string;
  nameBn: string;
  nameEn: string;
}

export interface QpgSubject {
  id: string;
  nameBn: string;
  nameEn: string;
}

export interface QpgChapterTopic {
  id: string;
  nameBn: string;
  nameEn: string;
  /** Verified questions in this topic, inside this chapter. */
  verifiedCount: number;
}

export interface QpgChapter {
  id: string;
  stream: QpgStream;
  classId: string;
  subjectId: string;
  nameBn: string;
  nameEn: string;
  /** Why this chapter exists in the pool (audit/batch reference). */
  sourceNoteBn: string;
  sourceNoteEn: string;
  topics: QpgChapterTopic[];
  /** Verified questions in the whole chapter (MCQ count — the
   *  long-standing meaning; see cqVerifiedCount for CQ). */
  verifiedCount: number;
  /** Verified Creative (CQ) questions in this chapter (0 when the
   *  chapter holds no CQ). The chapter picker shows MCQ and CQ
   *  counts separately — a chapter with 5 MCQ + 1 CQ is NOT "6
   *  questions" for either kind. */
  cqVerifiedCount?: number;
}

export const QPG_STREAMS: Array<{ id: QpgStream; nameBn: string; nameEn: string }> = [
  { id: 'general', nameBn: 'সাধারণ (NCTB)', nameEn: 'General (NCTB)' },
  { id: 'madrasah', nameBn: 'মাদ্রাসা', nameEn: 'Madrasah' },
  { id: 'job_admission', nameBn: 'চাকরি ও ভর্তি কোচিং', nameEn: 'Job & Admission Coaching' },
];

export const QPG_GENERAL_CLASSES: QpgClassLevel[] = [
  { id: 'class-3', nameBn: '৩য় শ্রেণি', nameEn: 'Class 3' },
  { id: 'class-4', nameBn: '৪র্থ শ্রেণি', nameEn: 'Class 4' },
  { id: 'class-5', nameBn: '৫ম শ্রেণি', nameEn: 'Class 5' },
  { id: 'class-6', nameBn: '৬ষ্ঠ শ্রেণি', nameEn: 'Class 6' },
  { id: 'class-7', nameBn: '৭ম শ্রেণি', nameEn: 'Class 7' },
  { id: 'class-8', nameBn: '৮ম শ্রেণি', nameEn: 'Class 8' },
  { id: 'class-9', nameBn: '৯ম শ্রেণি', nameEn: 'Class 9' },
  { id: 'class-10', nameBn: '১০ম শ্রেণি', nameEn: 'Class 10' },
  { id: 'class-11', nameBn: 'একাদশ শ্রেণি', nameEn: 'Class 11' },
  { id: 'class-12', nameBn: 'দ্বাদশ শ্রেণি', nameEn: 'Class 12' },
  { id: 'honours', nameBn: 'অনার্স', nameEn: 'Honours' },
];

export const QPG_MADRASAH_LEVELS: QpgClassLevel[] = [
  { id: 'ebtedayi', nameBn: 'ইবতেদায়ী', nameEn: 'Ebtedayi' },
  { id: 'dakhil', nameBn: 'দাখিল', nameEn: 'Dakhil' },
  { id: 'alim', nameBn: 'আলিম', nameEn: 'Alim' },
];

/** Standard NCTB subject names per class band. These are subject
 *  NAMES only — listing a subject never implies verified questions
 *  exist for it; chaptersFor() is the source of truth for coverage. */
const GENERAL_SUBJECTS_BY_BAND: Record<string, QpgSubject[]> = {
  '3-5': [
    { id: 'bangla', nameBn: 'বাংলা', nameEn: 'Bangla' },
    { id: 'english', nameBn: 'English', nameEn: 'English' },
    { id: 'math', nameBn: 'গণিত', nameEn: 'Mathematics' },
    { id: 'science', nameBn: 'বিজ্ঞান', nameEn: 'Science' },
    { id: 'bgs', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', nameEn: 'Bangladesh & Global Studies' },
    { id: 'islam', nameBn: 'ইসলাম শিক্ষা', nameEn: 'Islam' },
  ],
  '6-8': [
    { id: 'bangla', nameBn: 'বাংলা', nameEn: 'Bangla' },
    { id: 'english', nameBn: 'English', nameEn: 'English' },
    { id: 'math', nameBn: 'গণিত', nameEn: 'Mathematics' },
    { id: 'science', nameBn: 'বিজ্ঞান', nameEn: 'Science' },
    { id: 'bgs', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', nameEn: 'Bangladesh & Global Studies' },
    { id: 'ict', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', nameEn: 'ICT' },
    { id: 'religion', nameBn: 'ধর্ম ও নৈতিক শিক্ষা', nameEn: 'Religion & Moral Education' },
    // Classes 6–8 verified subjects (26 Nov 2026) — the pool holds
    // verified questions for these in Classes 6–8; the shared ones
    // (math, math-depth, bgs, ict, islam) also hold Class 9 questions
    // (see the '9-10' band). Listing a subject never implies coverage
    // for a class — chaptersFor() is the source of truth.
    { id: 'islam', nameBn: 'ইসলাম শিক্ষা', nameEn: 'Islam' },
    { id: 'bangla-grammar', nameBn: 'বাংলা ব্যাকরণ', nameEn: 'Bangla Grammar' },
    { id: 'math-depth', nameBn: 'গণিত (গভীর অনুশীলন)', nameEn: 'Mathematics (Depth)' },
    { id: 'science-depth', nameBn: 'বিজ্ঞান (গভীর অনুশীলন)', nameEn: 'Science (Depth)' },
    { id: 'agriculture', nameBn: 'কৃষিশিক্ষা', nameEn: 'Agriculture' },
    { id: 'home-science', nameBn: 'গার্হস্থ্য বিজ্ঞান', nameEn: 'Home Science' },
  ],
  '9-10': [
    // Class 9 verified subjects (26 Nov 2026) — 557 questions, 323
    // chapters. Bangla and English are two papers each at SSC level,
    // so the band lists the papers, not the single subjects. 'science'
    // and 'religion' stay listed but hold no Class 9 questions (the
    // real subjects are physics/chemistry/biology and islam) — listing
    // a subject never implies coverage; chaptersFor() is the source
    // of truth. Class 10 shares the Class 9 pool (same combined
    // draft set — no separate Class 10 set).
    { id: 'bangla-1st', nameBn: 'বাংলা ১ম পত্র', nameEn: 'Bangla 1st Paper' },
    { id: 'bangla-2nd', nameBn: 'বাংলা ২য় পত্র', nameEn: 'Bangla 2nd Paper' },
    { id: 'english-1st', nameBn: 'English ১ম পত্র', nameEn: 'English 1st Paper' },
    { id: 'english-2nd', nameBn: 'English ২য় পত্র', nameEn: 'English 2nd Paper' },
    { id: 'math', nameBn: 'গণিত', nameEn: 'Mathematics' },
    { id: 'math-depth', nameBn: 'গণিত (গভীর অনুশীলন)', nameEn: 'Mathematics (Depth)' },
    { id: 'higher-math', nameBn: 'উচ্চতর গণিত', nameEn: 'Higher Mathematics' },
    { id: 'higher-math-depth', nameBn: 'উচ্চতর গণিত (গভীর অনুশীলন)', nameEn: 'Higher Mathematics (Depth)' },
    { id: 'physics', nameBn: 'পদার্থবিজ্ঞান', nameEn: 'Physics' },
    { id: 'physics-depth', nameBn: 'পদার্থবিজ্ঞান (গভীর অনুশীলন)', nameEn: 'Physics (Depth)' },
    { id: 'chemistry', nameBn: 'রসায়ন', nameEn: 'Chemistry' },
    { id: 'chemistry-depth', nameBn: 'রসায়ন (গভীর অনুশীলন)', nameEn: 'Chemistry (Depth)' },
    { id: 'biology', nameBn: 'জীববিজ্ঞান', nameEn: 'Biology' },
    { id: 'biology-depth', nameBn: 'জীববিজ্ঞান (গভীর অনুশীলন)', nameEn: 'Biology (Depth)' },
    { id: 'science', nameBn: 'বিজ্ঞান', nameEn: 'Science' },
    { id: 'bgs', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', nameEn: 'Bangladesh & Global Studies' },
    { id: 'ict', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', nameEn: 'ICT' },
    { id: 'islam', nameBn: 'ইসলাম শিক্ষা', nameEn: 'Islam' },
    { id: 'religion', nameBn: 'ধর্ম ও নৈতিক শিক্ষা', nameEn: 'Religion & Moral Education' },
    { id: 'accounting', nameBn: 'হিসাববিজ্ঞান', nameEn: 'Accounting' },
    { id: 'business', nameBn: 'ব্যবসায় উদ্যোগ', nameEn: 'Business Entrepreneurship' },
    { id: 'finance', nameBn: 'ফিন্যান্স ও ব্যাংকিং', nameEn: 'Finance and Banking' },
    { id: 'civics', nameBn: 'পৌরনীতি ও নাগরিকতা', nameEn: 'Civics and Citizenship' },
    { id: 'history', nameBn: 'ইতিহাস', nameEn: 'History' },
    { id: 'economics', nameBn: 'অর্থনীতি', nameEn: 'Economics' },
    { id: 'geography', nameBn: 'ভূগোল ও পরিবেশ', nameEn: 'Geography and Environment' },
  ],
  '11-12': [
    // Class 11 verified subjects (26 Nov 2026) — 374 questions, 210
    // chapters. Bangla and English are single subjects covering both
    // papers at HSC level (unlike the SSC 1st/2nd-paper split). 'math'
    // stays listed but holds no Class 11 questions (the real subject
    // is higher-math) — listing a subject never implies coverage;
    // chaptersFor() is the source of truth. Class 12 shares the
    // Class 11 pool (same combined draft set — no separate Class 12 set).
    { id: 'bangla', nameBn: 'বাংলা', nameEn: 'Bangla' },
    { id: 'english', nameBn: 'English', nameEn: 'English' },
    { id: 'ict', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', nameEn: 'ICT' },
    { id: 'math', nameBn: 'গণিত', nameEn: 'Mathematics' },
    { id: 'higher-math', nameBn: 'উচ্চতর গণিত', nameEn: 'Higher Mathematics' },
    { id: 'physics', nameBn: 'পদার্থবিজ্ঞান', nameEn: 'Physics' },
    { id: 'chemistry', nameBn: 'রসায়ন', nameEn: 'Chemistry' },
    { id: 'biology', nameBn: 'জীববিজ্ঞান', nameEn: 'Biology' },
    { id: 'accounting', nameBn: 'হিসাববিজ্ঞান', nameEn: 'Accounting' },
    { id: 'economics', nameBn: 'অর্থনীতি', nameEn: 'Economics' },
    { id: 'geography', nameBn: 'ভূগোল ও পরিবেশ', nameEn: 'Geography and Environment' },
    { id: 'history', nameBn: 'ইতিহাস', nameEn: 'History' },
    { id: 'civics', nameBn: 'পৌরনীতি ও সুশাসন', nameEn: 'Civics and Good Governance' },
    { id: 'finance', nameBn: 'ফিন্যান্স, ব্যাংকিং ও বীমা', nameEn: 'Finance, Banking and Insurance' },
    { id: 'islamic-history', nameBn: 'ইসলামের ইতিহাস ও সংস্কৃতি', nameEn: 'Islamic History and Culture' },
    { id: 'logic', nameBn: 'যুক্তিবিদ্যা', nameEn: 'Logic' },
    { id: 'psychology', nameBn: 'মনোবিজ্ঞান', nameEn: 'Psychology' },
    { id: 'statistics', nameBn: 'পরিসংখ্যান', nameEn: 'Statistics' },
  ],
  honours: [
    { id: 'english', nameBn: 'English', nameEn: 'English' },
    { id: 'bangla', nameBn: 'বাংলা', nameEn: 'Bangla' },
    { id: 'math', nameBn: 'গণিত', nameEn: 'Mathematics' },
  ],
};

const MADRASAH_SUBJECTS: QpgSubject[] = [
  { id: 'quran', nameBn: 'কুরআন মাজিদ', nameEn: 'Quran Majid' },
  { id: 'arabic', nameBn: 'আরবি', nameEn: 'Arabic' },
  { id: 'bangla', nameBn: 'বাংলা', nameEn: 'Bangla' },
  { id: 'english', nameBn: 'English', nameEn: 'English' },
  { id: 'math', nameBn: 'গণিত', nameEn: 'Mathematics' },
  { id: 'fiqh', nameBn: 'ফিকহ', nameEn: 'Fiqh' },
];

function generalBand(classId: string): string {
  if (classId === 'honours') return 'honours';
  const n = Number(classId.replace('class-', ''));
  if (n >= 3 && n <= 5) return '3-5';
  if (n >= 6 && n <= 8) return '6-8';
  if (n >= 9 && n <= 10) return '9-10';
  return '11-12';
}

/** Level-aware step 2 (pattern 3, sprint 26 Nov 2026 — the
 *  competitor's /create step 2 differs by level):
 *  - primary (Class 3–5, Ebtedayi): term choice only — প্রথম /
 *    দ্বিতীয় / তৃতীয় প্রান্তিক; no question-type choice.
 *  - secondary (Class 6–12, Dakhil, Alim): exam kind (অর্ধবার্ষিক /
 *    বার্ষিক) + question kind (MCQ / সৃজনশীল / সমন্বিত).
 *  - tertiary (Honours): question kind only — Honours exams are
 *    neither প্রান্তিক nor অর্ধবার্ষিক/বার্ষিক, so no exam-kind or
 *    term choice is invented for them.
 *  - job: the Job & Admission track has its own exam-preset flow. */
export type QpgLevel = 'primary' | 'secondary' | 'tertiary' | 'job';

export function qpgLevelFor(stream: QpgStream, classId: string): QpgLevel {
  if (stream === 'job_admission') return 'job';
  if (stream === 'madrasah') {
    return classId === 'ebtedayi' ? 'primary' : 'secondary';
  }
  if (classId === 'honours') return 'tertiary';
  const n = Number(classId.replace('class-', ''));
  return n >= 3 && n <= 5 ? 'primary' : 'secondary';
}

export type QpgPrimaryTerm = 'first' | 'second' | 'third';
export const QPG_PRIMARY_TERMS: Array<{ id: QpgPrimaryTerm; nameBn: string; nameEn: string }> = [
  { id: 'first', nameBn: 'প্রথম প্রান্তিক', nameEn: 'First Term' },
  { id: 'second', nameBn: 'দ্বিতীয় প্রান্তিক', nameEn: 'Second Term' },
  { id: 'third', nameBn: 'তৃতীয় প্রান্তিক', nameEn: 'Third Term' },
];

export type QpgSecondaryExamKind = 'half-yearly' | 'annual';
export const QPG_SECONDARY_EXAM_KINDS: Array<{ id: QpgSecondaryExamKind; nameBn: string; nameEn: string }> = [
  { id: 'half-yearly', nameBn: 'অর্ধবার্ষিক পরীক্ষা', nameEn: 'Half-Yearly Exam' },
  { id: 'annual', nameBn: 'বার্ষিক পরীক্ষা', nameEn: 'Annual Exam' },
];

export type QpgSecondaryQKind = 'mcq' | 'creative' | 'combined' | 'written';
export const QPG_SECONDARY_Q_KINDS: Array<{ id: QpgSecondaryQKind; nameBn: string; nameEn: string }> = [
  { id: 'mcq', nameBn: 'বহুনির্বাচনি (MCQ)', nameEn: 'MCQ' },
  { id: 'creative', nameBn: 'সৃজনশীল (Creative)', nameEn: 'Creative (CQ)' },
  { id: 'combined', nameBn: 'সমন্বিত প্রশ্ন (সৃজনশীল + বহুনির্বাচনি)', nameEn: 'Combined (Creative + MCQ)' },
];

/** Subject-adaptive question kinds (comparison fixes, 26 Nov 2026 —
 *  Proshnobanai's Q-kind list changes per subject). Language subjects
 *  (Bangla / English, Class 6+) also offer রচনামূলক (written/essay):
 *  Bangla 2nd paper and English 2nd paper (writing) are written
 *  exams, so a teacher building those papers needs the written kind.
 *  Every other subject keeps the standard three. The verified pool
 *  holds MCQs + 359 verified CQ (Classes 9–12); 'written' honestly
 *  yields 0 verified questions until written packs are verified —
 *  the UI says so, and never invents written questions. */
export const QPG_WRITTEN_Q_KIND: { id: 'written'; nameBn: string; nameEn: string } = {
  id: 'written',
  nameBn: 'রচনামূলক (লিখিত)',
  nameEn: 'Written / Essay',
};

export function qpgSecondaryQKindsFor(subjectId: string): Array<{ id: QpgSecondaryQKind; nameBn: string; nameEn: string }> {
  if (subjectId === 'bangla' || subjectId === 'english') {
    return [...QPG_SECONDARY_Q_KINDS, QPG_WRITTEN_Q_KIND];
  }
  return QPG_SECONDARY_Q_KINDS;
}

/** Map a level-aware question kind to the selection type filter.
 *  'combined' means no type filter ('all') — the paper mixes MCQ
 *  and CQ from the verified pool (359 verified CQ, Classes 9–12,
 *  since 26 Nov 2026). 'written' maps to the 'written' type, which
 *  has no verified questions yet — the selection honestly returns 0
 *  with a reason. */
export function qpgTypeForQKind(kind: QpgSecondaryQKind): QpgQuestionType | 'all' {
  if (kind === 'creative') return 'cq';
  if (kind === 'combined') return 'all';
  if (kind === 'written') return 'written';
  return 'mcq';
}

export function qpgClassesFor(stream: QpgStream): QpgClassLevel[] {
  if (stream === 'general') return QPG_GENERAL_CLASSES;
  if (stream === 'madrasah') return QPG_MADRASAH_LEVELS;
  return []; // job_admission uses exam presets, not classes.
}

export function qpgSubjectsFor(stream: QpgStream, classId: string): QpgSubject[] {
  if (stream === 'general') return GENERAL_SUBJECTS_BY_BAND[generalBand(classId)] ?? [];
  if (stream === 'madrasah') return MADRASAH_SUBJECTS;
  return [];
}

// ---------------------------------------------------------------------
// Verified pool — ONLY already-verified/reviewed questions.
// ---------------------------------------------------------------------

export interface QpgQuestion {
  id: string;
  /** First-class chapter link (never a relabelled topic). */
  chapterId: string;
  chapterNameBn: string;
  /** Topic filter INSIDE the chapter. */
  topicId: string;
  topicNameBn: string;
  topicNameEn: string;
  type: QpgQuestionType;
  /** 'unspecified' — the verified batch carries no difficulty tags. */
  difficulty: 'unspecified';
  /** Only verified, error-free questions are ever in this pool. */
  verified: true;
  /** Source — the BCS batch is a verified practice batch, NOT a board
   *  question (see QpgQuestionSource honesty rule). */
  source: QpgQuestionSource;
  /** Cognitive level — the verified batch carries no tags yet. */
  cognitiveLevel: QpgCognitiveLevel;
  /** Nature — the verified batch carries no tags yet. */
  nature: QpgQuestionNature;
  /** True when the teacher edited the text inline before export
   *  (paper creation — free). The paper renders the edited text. */
  edited?: boolean;
  /** Exercise this question is mapped to (Phase B, see
   *  ./qpgExercises). Set when a verified pack is mapped to its
   *  exercises; undefined for unmapped questions (today: all 35 BCS
   *  English MCQs). The exercise filter only matches questions that
   *  carry the exercise's id — never guessed. */
  exerciseId?: string;
  questionText: string;
  /** MCQ options — MCQ only. CQ questions carry NO options (written
   *  work, never OMR): `options` is undefined for them, never an
   *  empty placeholder. Read sites must use isCqQuestion() / the
   *  `?? []` guard, never assume 4 options. */
  options?: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }>;
  /** MCQ correct letter — MCQ only. Undefined for CQ (a CQ has no
   *  correct letter); the paper Answer Key covers the MCQ section
   *  only (see buildQpgPaper / qpgMcqAnswerKey). */
  correctLetter?: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  sourceNote: string;
  /** CQ stimulus (passage / poem / problem / situation) — CQ only.
   *  For CQ, questionText IS the stimulus (so search / list / report
   *  flows that read questionText keep working); `stimulus` is kept
   *  as the explicit field renderers use. */
  stimulus?: string;
  /** CQ parts — CQ only. Four parts, marks 1/2/3/4 = 10. */
  parts?: QpgCqPart[];
  /** Total marks of this question: MCQ = 1, CQ = 10 (its parts'
   *  marks summed). Use qpgQuestionMarks() — never guess. */
  marks?: number;
}

/** One part of a Creative Question: ক (1 mark), খ (2), গ (3), ঘ (4).
 *  `answerOutline` is a marking outline for the teacher — NOT a model
 *  answer to print on the paper. */
export interface QpgCqPart {
  label: 'ক' | 'খ' | 'গ' | 'ঘ';
  marks: number;
  question: string;
  answerOutline: string;
}

/** True when the question is a Creative (CQ) question. */
export function isCqQuestion(q: QpgQuestion): boolean {
  return q.type === 'cq';
}

/** Marks one question carries: MCQ = 1, CQ = 10 (its parts summed). */
export function qpgQuestionMarks(q: QpgQuestion): number {
  if (q.type === 'cq') return q.marks ?? 10;
  return 1;
}

/** Total marks of a question list (MCQ × 1 + CQ × 10). */
export function qpgQuestionsTotalMarks(questions: readonly QpgQuestion[]): number {
  return questions.reduce((sum, q) => sum + qpgQuestionMarks(q), 0);
}

/** Suggested time (minutes) for a question list: MCQ ≈ 1 min each,
 *  CQ ≈ 20 min each (a real HSC/SSC creative section gives ~20 min
 *  per 10-mark CQ). A suggestion only — the teacher edits the paper's
 *  time freely. */
export function qpgQuestionsTimeMinutes(questions: readonly QpgQuestion[]): number {
  let minutes = 0;
  for (const q of questions) minutes += q.type === 'cq' ? 20 : 1;
  return minutes;
}

/** MCQ questions of a list, in order. */
export function qpgMcqQuestions(questions: readonly QpgQuestion[]): QpgQuestion[] {
  return questions.filter((q) => q.type === 'mcq');
}

/** CQ questions of a list, in order. */
export function qpgCqQuestions(questions: readonly QpgQuestion[]): QpgQuestion[] {
  return questions.filter((q) => q.type === 'cq');
}

/** Answer Key for a question list — the MCQ section's correct
 *  letters, in MCQ order. CQ has no key (written work, never OMR),
 *  so a CQ-only paper's key is []. The OMR evaluator consumes this
 *  key as the MCQ section's key. */
export function qpgMcqAnswerKey(questions: readonly QpgQuestion[]): Array<'A' | 'B' | 'C' | 'D'> {
  return questions
    .filter((q) => q.type === 'mcq' && q.correctLetter !== undefined)
    .map((q) => q.correctLetter as 'A' | 'B' | 'C' | 'D');
}

/** The single verified chapter in the MVP pool. The 35 BCS English
 *  questions (owner-verified Batch 1, published 22 Nov 2026 — see
 *  src/lib/publicBcsEnglish.ts) form ONE chapter unit; the 13 topics
 *  stay topics (filters inside the chapter), never chapters. */
export const QPG_VERIFIED_CHAPTER_ID = 'bcs-english-batch1';

function topicLabel(topic: PublicBcsTopic): { nameBn: string; nameEn: string } {
  const t = PUBLIC_BCS_TOPICS.find((x) => x.topic === topic);
  return { nameBn: t?.nameBn ?? topic, nameEn: t?.nameEn ?? topic };
}

function toQpgQuestion(q: PublicBcsQuestion): QpgQuestion {
  const label = topicLabel(q.topic);
  return {
    id: q.id,
    chapterId: QPG_VERIFIED_CHAPTER_ID,
    chapterNameBn: 'BCS ইংরেজি — যাচাইকৃত ব্যাচ ১',
    topicId: q.topic,
    topicNameBn: label.nameBn,
    topicNameEn: label.nameEn,
    type: 'mcq',
    difficulty: 'unspecified',
    verified: true,
    source: 'verified-batch',
    cognitiveLevel: 'unspecified',
    nature: 'unspecified',
    questionText: q.questionText,
    options: q.options,
    correctLetter: q.correctLetter,
    explanation: q.explanation,
    sourceNote: 'BCS English Batch 1 (owner-verified, 22 Nov 2026)',
  };
}

/** Map one verified Academic question (NCTB unit) to the pool shape.
 *  The Academic easy/medium difficulty lives in the Academic pool file
 *  (the practice UI shows it); the QPG pool type carries 'unspecified'
 *  until verified questions carry difficulty tags the QPG filters on. */
function toQpgAcademicQuestion(q: PublicAcademicQuestion): QpgQuestion {
  return {
    id: q.id,
    chapterId: q.chapterId,
    chapterNameBn: q.chapterName,
    topicId: q.topicId,
    topicNameBn: q.topicId,
    topicNameEn: q.topicId,
    type: 'mcq',
    difficulty: 'unspecified',
    verified: true,
    source: 'verified-batch',
    cognitiveLevel: 'unspecified',
    nature: 'unspecified',
    questionText: q.questionText,
    options: q.options,
    correctLetter: q.correctLetter,
    explanation: q.explanation,
    sourceNote: q.sourceNote,
  };
}

/** Map one verified Academic CQ (NCTB unit) to the pool shape.
 *  CQ is chapter-level (topicId 'cq') with a stimulus + 4 parts
 *  (marks 1/2/3/4 = 10). questionText IS the stimulus so search /
 *  list / report flows keep working; options / correctLetter stay
 *  undefined (a CQ has neither). The Academic easy/medium difficulty
 *  lives in the CQ pool file; the QPG pool type carries 'unspecified'
 *  until verified questions carry difficulty tags the QPG filters on. */
function toQpgCqQuestion(q: PublicAcademicCqQuestion): QpgQuestion {
  return {
    id: q.id,
    chapterId: q.chapterId,
    chapterNameBn: q.chapterName,
    topicId: q.topicId,
    topicNameBn: 'সৃজনশীল (CQ)',
    topicNameEn: 'Creative (CQ)',
    type: 'cq',
    difficulty: 'unspecified',
    verified: true,
    source: 'verified-batch',
    cognitiveLevel: 'unspecified',
    nature: 'unspecified',
    questionText: q.stimulus,
    stimulus: q.stimulus,
    parts: q.parts.map((p) => ({
      label: p.label,
      marks: p.marks,
      question: p.question,
      answerOutline: p.answer_outline,
    })),
    marks: 10,
    explanation: '',
    sourceNote: q.sourceNote,
  };
}

/** The whole verified pool: 35 BCS English MCQs + 2,318 Academic
 *  (Classes 3–12, thirty-five subjects) MCQs + 359 Academic CQs
 *  (Classes 9–12, thirty-five subjects — 190 Class 9-10 + 169 Class
 *  11-12; CQ-1112-020 HELD, excluded) = 2,712. One bank — the Question
 *  Maker and the Education Hub chapter practice draw from this same
 *  pool, so a question verified once appears in both places. BCS
 *  exam accounting counts ONLY the BCS chapter (see
 *  verifiedAvailableFor / qpgModelSectionQuestions). */
export const QPG_VERIFIED_POOL: QpgQuestion[] = [
  ...PUBLIC_BCS_ENGLISH_QUESTIONS.map(toQpgQuestion),
  ...PUBLIC_ACADEMIC_QUESTIONS.map(toQpgAcademicQuestion),
  ...PUBLIC_ACADEMIC_CQ_QUESTIONS.map(toQpgCqQuestion),
];

export function qpgVerifiedChapter(): QpgChapter {
  const topics: QpgChapterTopic[] = PUBLIC_BCS_TOPICS.map((t) => ({
    id: t.topic,
    nameBn: t.nameBn,
    nameEn: t.nameEn,
    verifiedCount: QPG_VERIFIED_POOL.filter(
      (q) => q.chapterId === QPG_VERIFIED_CHAPTER_ID && q.topicId === t.topic,
    ).length,
  }));
  return {
    id: QPG_VERIFIED_CHAPTER_ID,
    stream: 'general',
    classId: 'honours',
    subjectId: 'english',
    nameBn: 'BCS ইংরেজি — যাচাইকৃত ব্যাচ ১',
    nameEn: 'BCS English — Verified Batch 1',
    sourceNoteBn:
      'মালিক-যাচাইকৃত BCS ইংরেজি ব্যাচ ১ (৩৫টি প্রশ্ন, ২২ নভেম্বর ২০২৬)। NCTB অধ্যায়ভিত্তিক প্রশ্ন যাচাই শেষে এলে এখানে যোগ হবে।',
    sourceNoteEn:
      'Owner-verified BCS English Batch 1 (35 questions, 22 Nov 2026). NCTB chapter packs join here once verified.',
    topics,
    verifiedCount: QPG_VERIFIED_POOL.filter(
      (q) => q.chapterId === QPG_VERIFIED_CHAPTER_ID,
    ).length,
  };
}

/** Chapters with verified questions for a class/subject. Every other
 *  class/subject returns [] — the UI shows the honest empty state
 *  ("এই অধ্যায়ের যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি"), never filler. */
export function qpgChaptersFor(stream: QpgStream, classId: string, subjectId: string): QpgChapter[] {
  if (stream === 'general' && classId === 'honours' && subjectId === 'english') {
    return [qpgVerifiedChapter()];
  }
  if (stream === 'general') {
    return qpgAcademicChaptersFor(classId, subjectId);
  }
  return [];
}

/** Academic chapters (NCTB units / lessons) with verified questions,
 *  built from the Academic pool — one QpgChapter per unit / lesson,
 *  for one class + subject. A class/subject with no verified
 *  questions returns [] (honest empty state). As more Academic
 *  batches are verified and appended to the per-subject pool files,
 *  their units appear here automatically — no code change per batch.
 *  Class 10 resolves to the Class 9 pool (same combined draft set —
 *  no separate Class 10 set) and Class 12 resolves to the Class 11
 *  pool (same combined draft set — no separate Class 12 set); the
 *  returned chapters carry classId 'class-10' / 'class-12'.
 *
 *  CQ MERGE (26 Nov 2026): a chapter that holds verified CQ shows
 *  them as `cqVerifiedCount` + a 'cq' topic (so the topic picker can
 *  select CQ alone); a chapter that holds ONLY CQ (no MCQ — the
 *  CQ's cited chapter matches no MCQ chapter) appears here as its
 *  own entry with verifiedCount 0. `verifiedCount` itself stays the
 *  MCQ count — the picker shows the two counts separately. */
export function qpgAcademicChaptersFor(classId: string, subjectId: string): QpgChapter[] {
  const subj = qpgSubjectsFor('general', classId).find((x) => x.id === subjectId);
  const subjBn = subj?.nameBn ?? subjectId;
  const subjEn = subj?.nameEn ?? subjectId;
  const effectiveClassId =
    classId === 'class-10' ? 'class-9' : classId === 'class-12' ? 'class-11' : classId;
  const cqById = new Map(
    PUBLIC_ACADEMIC_CQ_CHAPTERS.filter(
      (c) => c.classId === effectiveClassId && c.subjectId === subjectId,
    ).map((c) => [c.id, c]),
  );
  const chapters: QpgChapter[] = PUBLIC_ACADEMIC_CHAPTERS.filter(
    (c) => c.classId === effectiveClassId && c.subjectId === subjectId,
  ).map((c) => {
    const cq = cqById.get(c.id);
    const topics: QpgChapterTopic[] = c.topics.map((t) => ({
      id: t.id,
      nameBn: t.id,
      nameEn: t.id,
      verifiedCount: t.count,
    }));
    if (cq) {
      topics.push({
        id: 'cq',
        nameBn: 'সৃজনশীল (CQ)',
        nameEn: 'Creative (CQ)',
        verifiedCount: cq.questionCount,
      });
    }
    return {
      id: c.id,
      stream: 'general' as const,
      classId: classId,
      subjectId: c.subjectId,
      nameBn: c.name,
      nameEn: c.name,
      sourceNoteBn: `NCTB ${subjBn} — যাচাইকৃত অনুশীলন প্রশ্ন (মূল পাঠভিত্তিক, বোর্ড প্রশ্ন নয়)।`,
      sourceNoteEn: `NCTB ${subjEn} — verified practice questions (lesson-based, not board questions).`,
      topics,
      verifiedCount: c.questionCount,
      cqVerifiedCount: cq?.questionCount ?? 0,
    };
  });
  // CQ-only chapters (no MCQ chapter with this id) — their own entry.
  const mcqIds = new Set(chapters.map((c) => c.id));
  for (const cq of cqById.values()) {
    if (mcqIds.has(cq.id)) continue;
    chapters.push({
      id: cq.id,
      stream: 'general' as const,
      classId: classId,
      subjectId: cq.subjectId,
      nameBn: cq.name,
      nameEn: cq.name,
      sourceNoteBn: `NCTB ${subjBn} — যাচাইকৃত সৃজনশীল (CQ) প্রশ্ন (মূল পাঠভিত্তিক, বোর্ড প্রশ্ন নয়)।`,
      sourceNoteEn: `NCTB ${subjEn} — verified Creative (CQ) questions (lesson-based, not board questions).`,
      topics: [
        {
          id: 'cq',
          nameBn: 'সৃজনশীল (CQ)',
          nameEn: 'Creative (CQ)',
          verifiedCount: cq.questionCount,
        },
      ],
      verifiedCount: 0,
      cqVerifiedCount: cq.questionCount,
    });
  }
  const unitById = new Map<string, number>();
  for (const c of PUBLIC_ACADEMIC_CHAPTERS) unitById.set(c.id, c.unitNumber);
  for (const c of PUBLIC_ACADEMIC_CQ_CHAPTERS) {
    if (!unitById.has(c.id)) unitById.set(c.id, c.unitNumber);
  }
  chapters.sort(
    (a, b) =>
      a.classId.localeCompare(b.classId) ||
      a.subjectId.localeCompare(b.subjectId) ||
      (unitById.get(a.id) ?? 0) - (unitById.get(b.id) ?? 0) ||
      a.id.localeCompare(b.id),
  );
  return chapters;
}

// ---------------------------------------------------------------------
// Selection — chapter(s) → topics → type/count
//
// Pattern 3 (sprint 26 Nov 2026): NO pre-generation marks / count /
// difficulty controls — the teacher picks the level-aware exam +
// question kind (step 2), then picks questions from the verified
// pool. `count` here is only the pool-size request (the page asks
// for everything the chapters hold and lets the teacher tick
// questions on/off); `difficulty` stays 'all' until verified
// questions actually carry difficulty tags.
// ---------------------------------------------------------------------

export interface QpgSelection {
  chapterIds: string[];
  topicIds: string[];
  /** Exercise sub-selection (comparison fixes, 26 Nov 2026 —
   *  Proshnobanai lets teachers pick individual অনুশীলনী inside a
   *  chapter). Empty = no exercise filter (whole chapter). When set,
   *  only questions mapped to one of these exercises are included —
   *  no verified question carries an exerciseId today, so the result
   *  is honestly 0 with a reason until Phase B mapping lands. */
  exerciseIds?: string[];
  /** 'all' = combined paper (MCQ + CQ, no type filter). */
  type: QpgQuestionType | 'all';
  difficulty: QpgDifficulty;
  /** Requested question count. */
  count: number;
  /** Smart filters (Turn 32) — all optional; 'any' means no filter.
   *  Filters whose pool value is 'unspecified' honestly return zero
   *  with a reason (same rule as difficulty): never guess metadata. */
  source?: QpgQuestionSource | 'any';
  cognitiveLevel?: QpgCognitiveLevel | 'any';
  nature?: QpgQuestionNature | 'any';
}

export const QPG_SOURCE_OPTIONS: Array<{
  id: QpgQuestionSource | 'any';
  nameBn: string;
  nameEn: string;
  /** Board / Repeated Board stay DISABLED — 0 verified board
   *  questions exist today (honesty rule, Turn 32). */
  disabled: boolean;
  disabledReasonBn: string;
}> = [
  { id: 'any', nameBn: 'সব উৎস', nameEn: 'All sources', disabled: false, disabledReasonBn: '' },
  {
    id: 'verified-batch',
    nameBn: 'যাচাইকৃত ব্যাচ',
    nameEn: 'Verified batch',
    disabled: false,
    disabledReasonBn: '',
  },
  {
    id: 'board',
    nameBn: 'বোর্ড প্রশ্ন',
    nameEn: 'Board Question',
    disabled: true,
    disabledReasonBn: 'যাচাইকৃত বোর্ড প্রশ্ন এখনো নেই (০টি)',
  },
  {
    id: 'test-exam',
    nameBn: 'টেস্ট পরীক্ষা',
    nameEn: 'Test Exam',
    disabled: true,
    disabledReasonBn: 'যাচাইকৃত টেস্ট পরীক্ষার প্রশ্ন এখনো নেই (০টি)',
  },
  {
    id: 'repeated-board',
    nameBn: 'পুনরাবৃত্ত বোর্ড প্রশ্ন',
    nameEn: 'Repeated Board Question',
    disabled: true,
    disabledReasonBn: 'যাচাইকৃত পুনরাবৃত্ত বোর্ড প্রশ্ন এখনো নেই (০টি)',
  },
  {
    id: 'multiple-schools',
    nameBn: 'একাধিক স্কুলের প্রশ্ন',
    nameEn: 'Questions from multiple schools',
    disabled: true,
    disabledReasonBn: 'যাচাইকৃত একাধিক-স্কুল প্রশ্ন এখনো নেই (০টি)',
  },
  {
    id: 'textbook',
    nameBn: 'পাঠ্যবই (Textbook-only)',
    nameEn: 'Textbook only',
    disabled: true,
    disabledReasonBn: 'যাচাইকৃত পাঠ্যবই প্রশ্ন এখনো নেই (০টি)',
  },
  {
    id: 'guide',
    nameBn: 'গাইড (Guide-only)',
    nameEn: 'Guide only',
    disabled: true,
    disabledReasonBn: 'যাচাইকৃত গাইড প্রশ্ন এখনো নেই (০টি)',
  },
];

export const QPG_COGNITIVE_OPTIONS: Array<{
  id: QpgCognitiveLevel | 'any';
  nameBn: string;
  nameEn: string;
}> = [
  { id: 'any', nameBn: 'সব স্তর', nameEn: 'All levels' },
  { id: 'knowledge', nameBn: 'জ্ঞান', nameEn: 'Knowledge' },
  { id: 'comprehension', nameBn: 'অনুধাবন', nameEn: 'Comprehension' },
  { id: 'application', nameBn: 'প্রয়োগ', nameEn: 'Application' },
  { id: 'higher', nameBn: 'উচ্চতর দক্ষতা (দক্ষতা)', nameEn: 'Higher-order skills' },
];

export const QPG_NATURE_OPTIONS: Array<{
  id: QpgQuestionNature | 'any';
  nameBn: string;
  nameEn: string;
}> = [
  { id: 'any', nameBn: 'সব ধরন', nameEn: 'All natures' },
  { id: 'mathematical', nameBn: 'গাণিতিক', nameEn: 'Mathematical' },
  { id: 'theoretical', nameBn: 'তত্ত্বীয়', nameEn: 'Theoretical' },
];

export interface QpgSelectionResult {
  questions: QpgQuestion[];
  available: number;
  requested: number;
  shortfall: number;
  /** Honest reasons shown to the teacher when the pool is short. */
  reasonsBn: string[];
  reasonsEn: string[];
}

export function selectQpgQuestions(
  sel: QpgSelection,
  /** Pool to select from — the page passes the CACHE-FIRST chapter
   *  pool (see ./questionPaperCache); defaults to the static pool. */
  pool: QpgQuestion[] = QPG_VERIFIED_POOL,
): QpgSelectionResult {
  const reasonsBn: string[] = [];
  const reasonsEn: string[] = [];
  let filtered = pool.filter((q) => sel.chapterIds.includes(q.chapterId));
  if (sel.topicIds.length > 0) {
    filtered = filtered.filter((q) => sel.topicIds.includes(q.topicId));
  }
  if (sel.exerciseIds && sel.exerciseIds.length > 0) {
    // Exercise sub-selection: only questions mapped to one of the
    // chosen exercises. No verified question carries an exerciseId
    // today (Phase B mapping not done), so this honestly yields 0
    // with a reason — never a silent gap, never guessed mapping.
    const mapped = filtered.filter(
      (q) => q.exerciseId !== undefined && sel.exerciseIds!.includes(q.exerciseId),
    );
    if (mapped.length === 0) {
      reasonsBn.push(
        'নির্বাচিত অনুশীলনীগুলোর যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি — Phase B যাচাই শেষে এখানে যোগ হবে। অনুশীলনী না বেছে পুরো অধ্যায় দিয়ে পেপার বানান।',
      );
      reasonsEn.push(
        'No verified questions exist for the selected exercises yet — they join here once Phase B verification finishes. Build from the whole chapter instead.',
      );
    }
    filtered = mapped;
  }
  if (sel.type === 'all') {
    // Combined paper (MCQ + CQ) — no type filter. The pool holds
    // both, so 'all' honestly yields both kinds.
  } else {
    // A specific kind: keep ONLY that type. (An explicit 'mcq'
    // filter matters now that CQ shares the pool — without it an
    // MCQ paper would silently include CQ questions.)
    filtered = filtered.filter((q) => q.type === sel.type);
    if (filtered.length === 0) {
      // No verified questions of this type in the selected
      // chapters/topics — an honest reason, never filler. CQ exists
      // for Classes 9–12 only; short / written / other kinds have
      // no verified pack yet.
      const section = QPG_SECTION_TYPES.find((t) => t.questionType === sel.type);
      const typeBn = section?.nameBn ?? sel.type;
      const typeEn = section?.nameEn ?? sel.type;
      reasonsBn.push(
        `নির্বাচিত অধ্যায়/টপিকে যাচাইকৃত ${typeBn} প্রশ্ন নেই। অন্য অধ্যায় বা ধরন বেছে নিন — যাচাই হয়নি এমন প্রশ্ন এখানে দেখানো হয় না।`,
      );
      reasonsEn.push(
        `No verified ${typeEn} questions in the selected chapters/topics. Pick another chapter or kind — unverified questions are never shown here.`,
      );
    }
  }
  if (sel.source && sel.source !== 'any') {
    if (sel.source === 'board' || sel.source === 'repeated-board' || sel.source === 'test-exam') {
      // Honesty rule: these sources hold 0 verified questions today.
      reasonsBn.push('যাচাইকৃত বোর্ড/টেস্ট প্রশ্ন এখনো নেই — এই ফিল্টারটি বন্ধ আছে।');
      reasonsEn.push('No verified board/test questions exist yet — this filter is disabled.');
      filtered = [];
    } else {
      filtered = filtered.filter((q) => q.source === sel.source);
    }
  }
  if (sel.cognitiveLevel && sel.cognitiveLevel !== 'any') {
    // Verified questions carry no cognitive-level tags yet.
    reasonsBn.push(
      'যাচাইকৃত প্রশ্নে জ্ঞান/অনুধাবন/প্রয়োগ স্তর এখনো ট্যাগ করা হয়নি — আপাতত "সব স্তর" বেছে নিন।',
    );
    reasonsEn.push(
      'Verified questions are not cognitive-level-tagged yet — please keep "All levels" for now.',
    );
    filtered = [];
  }
  if (sel.nature && sel.nature !== 'any') {
    // Verified questions carry no nature tags yet.
    reasonsBn.push(
      'যাচাইকৃত প্রশ্নে গাণিতিক/তত্ত্বীয় ধরন এখনো ট্যাগ করা হয়নি — আপাতত "সব ধরন" বেছে নিন।',
    );
    reasonsEn.push(
      'Verified questions are not nature-tagged yet — please keep "All natures" for now.',
    );
    filtered = [];
  }
  if (sel.difficulty !== 'all') {
    // Verified questions carry no difficulty tags yet; filtering by a
    // guessed difficulty would be inventing metadata.
    reasonsBn.push(
      'যাচাইকৃত প্রশ্নে কাঠিন্য স্তর (সহজ/মাঝারি/কঠিন) এখনো ট্যাগ করা হয়নি — আপাতত "সবগুলো" বেছে নিন।',
    );
    reasonsEn.push(
      'Verified questions are not difficulty-tagged yet — please keep "All" for now.',
    );
    filtered = [];
  }
  const available = filtered.length;
  const requested = Math.max(0, Math.floor(sel.count));
  const questions = filtered.slice(0, requested);
  const shortfall = Math.max(0, requested - questions.length);
  if (shortfall > 0 && available > 0) {
    reasonsBn.push(
      `এই অধ্যায়ে যাচাইকৃত প্রশ্ন আছে ${available}টি — চাওয়া ${requested}টির মধ্যে ${shortfall}টির ঘাটতি।`,
    );
    reasonsEn.push(
      `This chapter has ${available} verified questions — ${shortfall} short of the ${requested} requested.`,
    );
  }
  if (available === 0 && (sel.type === 'mcq' || sel.type === 'all') && sel.difficulty === 'all') {
    reasonsBn.push('এই অধ্যায়ের যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি।');
    reasonsEn.push('No verified questions exist for this chapter yet.');
  }
  return { questions, available, requested, shortfall, reasonsBn, reasonsEn };
}

// ---------------------------------------------------------------------
// Two-flow prefill (pattern 2, sprint 26 Nov 2026): the SAME chapter
// picker feeds (a) the exam paper and (b) the Sheet Builder. The
// generator saves the teacher's stream/class/subject/chapters to
// sessionStorage; the Sheet Builder reads it once on mount and
// scopes itself to those chapters. Session-only — never persisted,
// never sent anywhere.
// ---------------------------------------------------------------------

export const QPG_FLOW_PREFILL_KEY = 'eduvelto-qpg-flow-prefill';

export interface QpgFlowPrefill {
  stream: QpgStream;
  classId: string;
  subjectId: string;
  chapterIds: string[];
}

export function saveQpgFlowPrefill(prefill: QpgFlowPrefill): boolean {
  try {
    if (typeof sessionStorage === 'undefined') return false;
    sessionStorage.setItem(QPG_FLOW_PREFILL_KEY, JSON.stringify(prefill));
    return true;
  } catch {
    return false;
  }
}

export function loadQpgFlowPrefill(): QpgFlowPrefill | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(QPG_FLOW_PREFILL_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !['general', 'madrasah', 'job_admission'].includes((parsed as { stream?: unknown }).stream as string) ||
      typeof (parsed as { classId?: unknown }).classId !== 'string' ||
      typeof (parsed as { subjectId?: unknown }).subjectId !== 'string' ||
      !Array.isArray((parsed as { chapterIds?: unknown }).chapterIds)
    ) {
      return null;
    }
    return parsed as QpgFlowPrefill;
  } catch {
    return null;
  }
}

export function clearQpgFlowPrefill(): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem(QPG_FLOW_PREFILL_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------
// Paper setup — ALL paper text is customizable and FREE (owner
// 25 Nov 08:41). Pre-filled from the teacher's selections, ALWAYS
// editable. Content text (what the paper says) = free; presentation
// / layout (how it looks) = Pro (see QpgLayoutOptions).
// ---------------------------------------------------------------------

export interface QpgPaperSetup {
  /** Exam title — teacher may write e.g. "বার্ষিক পরীক্ষা ২০২৬". */
  title: string;
  institutionName: string;
  /** Institution address — free editable text (auto-field, 25 Nov 09:19). */
  institutionAddress: string;
  /** Institution motto — free editable text (auto-field, 25 Nov 09:19). */
  institutionMotto: string;
  subject: string;
  classLabel: string;
  /** ISO date (YYYY-MM-DD). */
  examDate: string;
  totalMarks: number;
  timeMinutes: number;
  instructions: string;
  sectionHeading: string;
  /** মানবণ্টন (pattern 4, sprint 27 Nov 2026): how many questions
   *  of this section the student must answer — the rest print as
   *  extra alternatives. Undefined (or >= question count) means
   *  "answer all". */
  answerCount?: number;
  /** Subject Code — part of the restored 8-field exam header (Turn 32).
   *  Free editable text; empty renders as "—". */
  subjectCode: string;
  /** Set Code (ক/খ/গ/ঘ) — empty means a single-set paper. */
  setCode: '' | 'ক' | 'খ' | 'গ' | 'ঘ';
  /** Set seed (Day 4 hardening, 26 Nov 2026) — the shuffle seed
   *  for ক/খ/গ/ঘ papers. Printed on set papers so re-entering it
   *  rebuilds the identical set. Undefined for single-set papers. */
  seed?: number;
  /** Page numbers (comparison fixes, 26 Nov 2026 — eProshnoBank has
   *  a page-number toggle): when true, every rendered page carries
   *  "পাতা N / মোট" at the bottom. Free, default off. */
  pageNumbers?: boolean;
}

/** One section of a multi-section paper (comparison fixes, 26 Nov
 *  2026 — G2+G3: the primary-school pattern is a paper of sections,
 *  e.g. MCQ + সংক্ষিপ্ত + রচনামূলক + শূন্যস্থান, each with its own
 *  type, count, marks and answer-count). A section's questions are
 *  listed by id; the paper's flat `questions` array is the
 *  concatenation in section order (so OMR / answer key / export keep
 *  working unchanged). */
export interface QpgPaperSection {
  id: string;
  headingBn: string;
  type: QpgSectionType;
  questionIds: string[];
  marksPerQuestion: number;
  /** "Answer X of Y" for this section — the rest print as extra
   *  alternatives. Undefined (or >= question count) = answer all. */
  answerCount?: number;
}

/** Sections of a paper — the paper's own `sections` when it is a
 *  multi-section paper, otherwise ONE synthetic section built from
 *  the flat questions list (so single-section papers keep working
 *  unchanged: the heading / marks / answer-count come from the
 *  setup). */
export function qpgPaperSections(paper: QpgPaper): QpgPaperSection[] {
  if (paper.sections && paper.sections.length > 0) return paper.sections;
  const marksPerQ =
    paper.questions.length > 0
      ? Math.max(1, Math.round(paper.setup.totalMarks / paper.questions.length))
      : 1;
  // Single-section papers keep the original shape; the type follows
  // the questions (an all-CQ paper is a CQ section, not MCQ).
  const allCq = paper.questions.length > 0 && paper.questions.every((q) => q.type === 'cq');
  return [
    {
      id: 'section-1',
      headingBn: paper.setup.sectionHeading,
      type: allCq ? 'cq' : 'mcq',
      questionIds: paper.questions.map((q) => q.id),
      marksPerQuestion: marksPerQ,
      answerCount: paper.setup.answerCount,
    },
  ];
}

/** Build explicit sections for a question list, grouped by type —
 *  MCQ first (ক-বিভাগ), then CQ (খ-বিভাগ). Each section carries its
 *  own marks per question (MCQ 1, CQ 10), so a Combined paper's total
 *  is MCQ × 1 + CQ × 10. A single-kind list yields one section.
 *  The teacher's setup.sectionHeading is NOT overwritten here — for
 *  single-section papers the paper renders setup.sectionHeading; the
 *  section heading rides inside the first block only for
 *  multi-section papers (see buildPaperDom). */
export function qpgSectionsForQuestions(questions: readonly QpgQuestion[]): QpgPaperSection[] {
  const sections: QpgPaperSection[] = [];
  const mcq = qpgMcqQuestions(questions);
  const cq = qpgCqQuestions(questions);
  if (mcq.length > 0) {
    sections.push({
      id: 'section-mcq',
      headingBn: 'ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)',
      type: 'mcq',
      questionIds: mcq.map((q) => q.id),
      marksPerQuestion: 1,
    });
  }
  if (cq.length > 0) {
    sections.push({
      id: 'section-cq',
      headingBn: 'খ-বিভাগ: সৃজনশীল প্রশ্ন (CQ)',
      type: 'cq',
      questionIds: cq.map((q) => q.id),
      marksPerQuestion: 10,
    });
  }
  return sections;
}

/** Total marks of a multi-section paper = sum over sections of
 *  (questions × marks per question). Pure. */
export function qpgMultiSectionTotalMarks(sections: QpgPaperSection[]): number {
  return sections.reduce((sum, s) => sum + s.questionIds.length * Math.max(1, s.marksPerQuestion), 0);
}

/** Auto Set Code Generator — the four set codes (Turn 32). */
export const QPG_SET_CODES = ['ক', 'খ', 'গ', 'ঘ'] as const;
export type QpgSetCode = (typeof QPG_SET_CODES)[number];

/** Pro-gated layout options — shown LOCKED in the MVP (never free). */
export interface QpgLayoutOptions {
  font: 'default' | 'serif' | 'sans';
  columns: 1 | 2;
  spacing: 'compact' | 'normal' | 'relaxed';
  dividerStyle: 'line' | 'double' | 'none';
  /** Custom logo IMAGE upload is Pro; the institution NAME as text is free. */
  customLogoDataUrl: string | null;
  /** One-click separate Answer Key sheet is Pro. */
  includeAnswerKey: boolean;
}

export const QPG_DEFAULT_LAYOUT: QpgLayoutOptions = {
  font: 'default',
  columns: 1,
  spacing: 'normal',
  dividerStyle: 'line',
  customLogoDataUrl: null,
  includeAnswerKey: false,
};

export function defaultPaperSetup(args: {
  title: string;
  subject: string;
  classLabel: string;
  questionCount: number;
  marksPerQuestion: number;
  /** Suggested time in minutes (pattern time, or 1 min / MCQ). */
  timeMinutes: number;
  sectionHeading: string;
  subjectCode?: string;
  setCode?: QpgPaperSetup['setCode'];
  /** Set seed (Day 4 hardening, 26 Nov 2026) — printed on set papers. */
  seed?: number;
  /** মানবণ্টন (pattern 4): "answer X of Y" — see QpgPaperSetup. */
  answerCount?: number;
  /** Auto-fields (25 Nov 09:19): pre-filled, editable, resettable. */
  institutionAddress?: string;
  institutionMotto?: string;
  /** Exact total marks (CQ / Combined papers: MCQ × 1 + CQ × 10 —
   *  see qpgQuestionsTotalMarks). When given, it replaces
   *  questionCount × marksPerQuestion; otherwise the product is used
   *  (unchanged MCQ behaviour). */
  totalMarks?: number;
}): QpgPaperSetup {
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: args.title,
    institutionName: '',
    institutionAddress: args.institutionAddress ?? '',
    institutionMotto: args.institutionMotto ?? '',
    subject: args.subject,
    classLabel: args.classLabel,
    examDate: today,
    totalMarks: args.totalMarks ?? args.questionCount * args.marksPerQuestion,
    timeMinutes: args.timeMinutes,
    instructions:
      'সব প্রশ্নের উত্তর দাও। প্রতিটি সঠিক উত্তরের জন্য নির্ধারিত নম্বর পাবে। ভুল উত্তরের জন্য নম্বর কাটা যেতে পারে (প্রশ্নপত্রে উল্লেখ থাকলে)।',
    sectionHeading: args.sectionHeading,
    answerCount: args.answerCount,
    subjectCode: args.subjectCode ?? '',
    setCode: args.setCode ?? '',
    seed: args.seed,
  };
}

export interface QpgPaper {
  id: string;
  setup: QpgPaperSetup;
  questions: QpgQuestion[];
  /** Multi-section papers (comparison fixes, 26 Nov 2026): when
   *  present, the paper's sections — each with its own heading, type,
   *  marks and answer-count. `questions` is the concatenation in
   *  section order. Absent = the original single-section paper. */
  sections?: QpgPaperSection[];
  /** Answer key in MCQ order (correct letters) — drives the
   *  per-set keys and the OMR evaluator. CQ has no key (written
   *  work, never OMR), so a CQ-only paper's key is [] and a Combined
   *  paper's key covers its MCQ section only (see qpgMcqAnswerKey). */
  answerKey: Array<'A' | 'B' | 'C' | 'D'>;
  /** Chapter(s) the paper draws from, for the 8-field header. */
  chapterNameBn: string;
  /** True when the counts differ from the verified real-exam pattern
   *  (e.g. a Primary paper that is not 90) — labelled "custom
   *  variant", never a real exam pattern. */
  isCustomVariant: boolean;
  /** Track that produced the paper (academic chapter paper vs model test). */
  kind: 'chapter-paper' | 'model-test-section';
  /** Verified-pattern label shown on the paper, or the custom-variant label. */
  patternLabelBn: string;
  patternLabelEn: string;
  createdAt: string;
}

export function buildQpgPaper(args: {
  setup: QpgPaperSetup;
  questions: QpgQuestion[];
  sections?: QpgPaperSection[];
  isCustomVariant: boolean;
  kind: QpgPaper['kind'];
  patternLabelBn: string;
  patternLabelEn: string;
}): QpgPaper {
  return {
    id: `qpg-${Date.now().toString(36)}-${Math.floor(Math.random() * 1296).toString(36)}`,
    setup: args.setup,
    questions: args.questions,
    sections: args.sections,
    answerKey: qpgMcqAnswerKey(args.questions),
    chapterNameBn:
      [...new Set(args.questions.map((q) => q.chapterNameBn))].join(' • ') || '—',
    isCustomVariant: args.isCustomVariant,
    kind: args.kind,
    patternLabelBn: args.patternLabelBn,
    patternLabelEn: args.patternLabelEn,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------
// A-Z parity (Proshnobanai read, 25 Nov 2026 10:14) — MVP adds.
// ---------------------------------------------------------------------

export interface QpgPaperTemplate {
  id: string;
  nameBn: string;
  nameEn: string;
  /** Title pattern — {subject} / {class} are filled from the setup. */
  titlePatternBn: string;
  instructionsBn: string;
  sectionHeading: string;
}

/** Named paper templates — chosen BEFORE creating, they pre-fill the
 *  paper's text fields (title / instructions / section heading).
 *  Everything stays editable afterwards (all paper text is free).
 *  No template invents content: only wording presets. */
export const QPG_PAPER_TEMPLATES: QpgPaperTemplate[] = [
  {
    id: 'annual',
    nameBn: 'বার্ষিক পরীক্ষা',
    nameEn: 'Annual Exam',
    titlePatternBn: 'বার্ষিক পরীক্ষা — {subject} ({class})',
    instructionsBn: 'সব প্রশ্নের উত্তর দাও। সময় ও পূর্ণমান মাথায় রেখে উত্তর লেখো।',
    sectionHeading: 'ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)',
  },
  {
    id: 'half-yearly',
    nameBn: 'অর্ধবার্ষিক পরীক্ষা',
    nameEn: 'Half-Yearly Exam',
    titlePatternBn: 'অর্ধবার্ষিক পরীক্ষা — {subject} ({class})',
    instructionsBn: 'সব প্রশ্নের উত্তর দাও। সময় ও পূর্ণমান মাথায় রেখে উত্তর লেখো।',
    sectionHeading: 'ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)',
  },
  {
    id: 'model-test',
    nameBn: 'মডেল টেস্ট',
    nameEn: 'Model Test',
    titlePatternBn: 'মডেল টেস্ট — {subject} ({class})',
    instructionsBn: 'পরীক্ষার মতো করে সময় ধরে উত্তর দাও। শেষে Answer Key মিলিয়ে নাও।',
    sectionHeading: 'ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)',
  },
  {
    id: 'class-test',
    nameBn: 'ক্লাস টেস্ট',
    nameEn: 'Class Test',
    titlePatternBn: 'ক্লাস টেস্ট — {subject} ({class})',
    instructionsBn: 'সব প্রশ্নের উত্তর দাও।',
    sectionHeading: 'ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)',
  },
  {
    id: 'weekly',
    nameBn: 'সাপ্তাহিক পরীক্ষা',
    nameEn: 'Weekly Exam',
    titlePatternBn: 'সাপ্তাহিক পরীক্ষা — {subject} ({class})',
    instructionsBn: 'সব প্রশ্নের উত্তর দাও।',
    sectionHeading: 'ক-বিভাগ: বহুনির্বাচনি প্রশ্ন (MCQ)',
  },
];

export function qpgPaperTemplateById(id: string): QpgPaperTemplate | undefined {
  return QPG_PAPER_TEMPLATES.find((t) => t.id === id);
}

/** Apply a template to a setup: title / instructions / section heading
 *  are replaced from the template; every other field is kept. Unknown
 *  template id → the setup unchanged. */
export function applyQpgTemplate(
  setup: QpgPaperSetup,
  templateId: string,
): QpgPaperSetup {
  const template = qpgPaperTemplateById(templateId);
  if (!template) return setup;
  return {
    ...setup,
    title: template.titlePatternBn
      .replace('{subject}', setup.subject)
      .replace('{class}', setup.classLabel),
    instructions: template.instructionsBn,
    sectionHeading: template.sectionHeading,
  };
}

// ---------------------------------------------------------------------
// Standard Checker (A-Z parity) — validates each section has enough
// verified questions for a balanced paper, and that the declared full
// marks match the questions × marks-per-question. Pure: no I/O.
// ---------------------------------------------------------------------

export interface QpgStandardSectionInput {
  headingBn: string;
  /** Questions the teacher wants in this section. */
  requested: number;
  /** Verified questions actually available for this section. */
  available: number;
  marksPerQuestion: number;
}

export interface QpgStandardSectionCheck extends QpgStandardSectionInput {
  sufficient: boolean;
  shortfall: number;
  messageBn: string;
}

export interface QpgStandardCheck {
  sections: QpgStandardSectionCheck[];
  totalRequested: number;
  totalAvailable: number;
  computedMarks: number;
  declaredMarks: number;
  marksMatch: boolean;
  /** Overall: every section sufficient AND marks match. */
  passes: boolean;
  summaryBn: string;
}

export function checkQpgPaperStandard(args: {
  sections: QpgStandardSectionInput[];
  declaredMarks: number;
}): QpgStandardCheck {
  const sections: QpgStandardSectionCheck[] = args.sections.map((s) => {
    const requested = Math.max(0, Math.floor(s.requested));
    const available = Math.max(0, Math.floor(s.available));
    const shortfall = Math.max(0, requested - available);
    const sufficient = requested > 0 && shortfall === 0;
    return {
      ...s,
      requested,
      available,
      shortfall,
      sufficient,
      messageBn:
        requested === 0
          ? `${s.headingBn}: কোনো প্রশ্ন নেই — অন্তত ১টি প্রশ্ন নিন।`
          : shortfall > 0
            ? `${s.headingBn}: ${available}টি যাচাইকৃত প্রশ্ন আছে, ${requested}টি চাওয়া — ${shortfall}টির ঘাটতি।`
            : `${s.headingBn}: ${requested}টি প্রশ্ন — যথেষ্ট যাচাইকৃত প্রশ্ন আছে।`,
    };
  });
  const totalRequested = sections.reduce((a, s) => a + s.requested, 0);
  const totalAvailable = sections.reduce((a, s) => a + s.available, 0);
  const computedMarks = sections.reduce((a, s) => a + s.requested * s.marksPerQuestion, 0);
  const marksMatch = computedMarks === args.declaredMarks;
  const passes = sections.length > 0 && sections.every((s) => s.sufficient) && marksMatch;
  const summaryBn = passes
    ? 'মান যাচাই পাস — প্রতিটি বিভাগে যথেষ্ট যাচাইকৃত প্রশ্ন আছে এবং পূর্ণমান মিলেছে।'
    : `মান যাচাই পাস হয়নি — ${sections
        .filter((s) => !s.sufficient)
        .map((s) => s.messageBn)
        .join(' ')}${marksMatch ? '' : ` পূর্ণমান মিলছে না (হিসাব ${computedMarks}, লেখা ${args.declaredMarks})।`}`;
  return {
    sections,
    totalRequested,
    totalAvailable,
    computedMarks,
    declaredMarks: args.declaredMarks,
    marksMatch,
    passes,
    summaryBn,
  };
}

// ---------------------------------------------------------------------
// Per-question Replace (A-Z parity) — swap one selected question for
// another, keeping its position. Pure: returns a new array; no-op
// when oldId is not selected or newId is already selected.
// ---------------------------------------------------------------------

export function replaceQpgQuestion(
  selectedIds: string[],
  oldId: string,
  newId: string,
): string[] {
  const at = selectedIds.indexOf(oldId);
  if (at < 0 || selectedIds.includes(newId)) return [...selectedIds];
  const next = [...selectedIds];
  next[at] = newId;
  return next;
}

// ---------------------------------------------------------------------
// Track 3 — Job & Admission Coaching model tests.
// Patterns REUSED from the repo (never re-derived):
//  - BCS / Bank / Primary / NTRCA: JOB_RULES_CONFIGS (jobExams.ts)
//  - NU Admission: nuFullMockConfigSeed() (nuExamConfig.ts)
// ---------------------------------------------------------------------

export interface QpgModelTestSubject {
  nameBn: string;
  nameEn: string;
  /** Verified marks/questions for this subject in the real pattern. */
  marks: number;
  /** Verified questions available TODAY for this exam+subject. */
  verifiedAvailable: number;
}

export interface QpgModelTest {
  examSlug: 'bcs' | 'bank' | 'primary-teacher' | 'ntrca' | 'nu-admission';
  nameBn: string;
  nameEn: string;
  questionCount: number;
  timeMinutes: number;
  marksPerQuestion: number;
  negativeMarking: number | null;
  passMark: number | null;
  subjects: QpgModelTestSubject[];
  patternSourceBn: string;
  /** 'verified' | 'last-verified-18th' — NTRCA 18th is last-verified, never presented as current. */
  patternStatus: 'verified' | 'last-verified-18th';
  /** Full mock possible today? (available verified >= pattern count) */
  fullMockPossible: boolean;
  /** Total verified questions available for this exam today. */
  totalVerifiedAvailable: number;
}

/** Verified questions available per exam+subject TODAY. Only the BCS
 *  English batch is verified — and it is verified FOR BCS, so it
 *  counts only under BCS English, never under Bank / Primary / NTRCA
 *  / NU English (reusing it there would mislabel its verification). */
function verifiedAvailableFor(examSlug: string, subjectNameEn: string): number {
  if (examSlug === 'bcs' && subjectNameEn === 'English Language & Literature') {
    // BCS only: Academic (Classes 3–8) questions are verified for their
    // NCTB units, NOT for BCS — they must never inflate the BCS count.
    return QPG_VERIFIED_POOL.filter((q) => q.chapterId === QPG_VERIFIED_CHAPTER_ID).length;
  }
  return 0;
}

function modelTestFromRules(
  examSlug: 'bcs' | 'bank' | 'primary-teacher' | 'ntrca',
  nameBn: string,
  nameEn: string,
  patternStatus: 'verified' | 'last-verified-18th',
): QpgModelTest {
  const cfg = JOB_RULES_CONFIGS[examSlug];
  const subjects: QpgModelTestSubject[] = cfg.subjects.map((s) => ({
    nameBn: s.nameBn,
    nameEn: s.nameEn,
    marks: s.marks,
    verifiedAvailable: verifiedAvailableFor(examSlug, s.nameEn),
  }));
  const totalVerifiedAvailable = subjects.reduce((a, s) => a + s.verifiedAvailable, 0);
  return {
    examSlug,
    nameBn,
    nameEn,
    questionCount: cfg.questionCount ?? 0,
    timeMinutes: cfg.timeMinutes ?? 0,
    marksPerQuestion: cfg.marksPerQuestion ?? 1,
    negativeMarking: cfg.negativeMarking,
    passMark: cfg.passMark,
    subjects,
    patternSourceBn: cfg.patternSource,
    patternStatus,
    fullMockPossible: totalVerifiedAvailable >= (cfg.questionCount ?? Number.POSITIVE_INFINITY),
    totalVerifiedAvailable,
  };
}

export function qpgModelTests(): QpgModelTest[] {
  const nu = nuFullMockConfigSeed();
  const nuSubjects: QpgModelTestSubject[] = [
    { nameBn: 'বাংলা', nameEn: 'Bangla', marks: nu.sections.bangla, verifiedAvailable: 0 },
    { nameBn: 'ইংরেজি', nameEn: 'English', marks: nu.sections.english, verifiedAvailable: 0 },
    { nameBn: 'সাধারণ জ্ঞান', nameEn: 'General Knowledge', marks: nu.sections.generalKnowledge, verifiedAvailable: 0 },
    { nameBn: 'শাখা-ভিত্তিক বিষয়', nameEn: 'Group subjects', marks: nu.sections.groupSubjects, verifiedAvailable: 0 },
  ];
  const nuTotal = 0;
  return [
    modelTestFromRules('bcs', 'BCS প্রিলিমিনারি', 'BCS Preliminary', 'verified'),
    modelTestFromRules('bank', 'ব্যাংক জব', 'Bank Job', 'verified'),
    modelTestFromRules('primary-teacher', 'প্রাথমিক শিক্ষক', 'Primary Teacher', 'verified'),
    modelTestFromRules('ntrca', 'NTRCA', 'NTRCA', 'last-verified-18th'),
    {
      examSlug: 'nu-admission',
      nameBn: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি',
      nameEn: 'National University Admission',
      questionCount: nu.totalQuestions,
      timeMinutes: nu.durationSeconds / 60,
      marksPerQuestion: nu.marking.correct,
      negativeMarking: null, // Verified: no negative marking (2025-26 config).
      passMark: nu.passMark.value,
      subjects: nuSubjects,
      patternSourceBn:
        'NU ভর্তি বিজ্ঞপ্তি ২০২৫-২৬ (মেমো ১০(২২৬)জাতী:বি:/রেজি:/অ্যাকা:/২০২৬/৩৩৪৮, ২০/১১/২০২৫)',
      patternStatus: 'verified',
      fullMockPossible: nuTotal >= nu.totalQuestions,
      totalVerifiedAvailable: nuTotal,
    },
  ];
}

/** Questions available for one model-test subject section today. */
export function qpgModelSectionQuestions(examSlug: string, subjectNameEn: string): QpgQuestion[] {
  if (examSlug === 'bcs' && subjectNameEn === 'English Language & Literature') {
    // BCS only — Academic questions are not BCS questions.
    return QPG_VERIFIED_POOL.filter((q) => q.chapterId === QPG_VERIFIED_CHAPTER_ID);
  }
  return [];
}

/** Track 3 scope, PENDING (Turn 32): Medical / University admission
 *  sits under Track 3 ONLY with a verified pattern. The medical
 *  admission pattern must be verified against the official circular
 *  before ANY paper is generated — until then it is BLOCKED here, not
 *  built. (University admission via NU is covered by qpgModelTests.) */
export const QPG_PENDING_TRACK3_EXAMS: Array<{
  examSlug: string;
  nameBn: string;
  nameEn: string;
  blockedReasonBn: string;
  blockedReasonEn: string;
}> = [
  {
    examSlug: 'medical-admission',
    nameBn: 'মেডিকেল ভর্তি',
    nameEn: 'Medical Admission',
    blockedReasonBn:
      'প্যাটার্ন যাচাই হয়নি — অফিসিয়াল সার্কুলারের বিরুদ্ধে যাচাই শেষ না হওয়া পর্যন্ত কোনো পেপার বানানো যাবে না।',
    blockedReasonEn:
      'Pattern not verified — no paper can be generated until the pattern is verified against the official circular.',
  },
];

// ---------------------------------------------------------------------
// Pre-built combined papers (pattern 6, sprint 27 Nov 2026): Class 8
// scholarship bundles — 100 marks / 3 hours, sections droppable.
// The STRUCTURE (subjects, sections, marks, time) is fixed and
// honest; GENERATION stays gated on verified questions — today every
// bundle holds 0 verified questions (no Class 8 questions are
// verified yet), so each card shows the shortfall and its generate
// button stays disabled. No questions are invented to fill a bundle.
// ---------------------------------------------------------------------

export interface QpgCombinedSection {
  id: string;
  headingBn: string;
  headingEn: string;
  /** Subject id in the general stream (see GENERAL_SUBJECTS_BY_BAND). */
  subjectId: string;
  marks: number;
}

export interface QpgCombinedPaper {
  id: string;
  nameBn: string;
  nameEn: string;
  classId: string;
  totalMarks: number;
  timeMinutes: number;
  sections: QpgCombinedSection[];
}

export const QPG_COMBINED_PAPERS: QpgCombinedPaper[] = [
  {
    id: 'class-8-scholarship-bangla',
    nameBn: 'বাংলা — সাহিত্য-কণিকা + আনন্দপাঠ + ব্যাকরণ ও নির্মিতি',
    nameEn: 'Bangla — Literature + Supplementary Reader + Grammar',
    classId: 'class-8',
    totalMarks: 100,
    timeMinutes: 180,
    sections: [
      { id: 'bangla-lit', headingBn: 'সাহিত্য-কণিকা (গদ্য ও কবিতা)', headingEn: 'Literature (Prose & Poetry)', subjectId: 'bangla', marks: 50 },
      { id: 'bangla-grammar', headingBn: 'ব্যাকরণ ও নির্মিতি', headingEn: 'Grammar & Composition', subjectId: 'bangla', marks: 50 },
    ],
  },
  {
    id: 'class-8-scholarship-english',
    nameBn: 'English — 1st Paper + 2nd Paper',
    nameEn: 'English — 1st Paper + 2nd Paper',
    classId: 'class-8',
    totalMarks: 100,
    timeMinutes: 180,
    sections: [
      { id: 'english-1st', headingBn: 'English 1st Paper', headingEn: 'English 1st Paper', subjectId: 'english', marks: 50 },
      { id: 'english-2nd', headingBn: 'English 2nd Paper (Grammar & Composition)', headingEn: 'English 2nd Paper (Grammar & Composition)', subjectId: 'english', marks: 50 },
    ],
  },
  {
    id: 'class-8-scholarship-math',
    nameBn: 'গণিত — বহুনির্বাচনী + সংক্ষিপ্ত-উত্তর + সৃজনশীল',
    nameEn: 'Mathematics — MCQ + Short Answer + Creative',
    classId: 'class-8',
    totalMarks: 100,
    timeMinutes: 180,
    sections: [
      { id: 'math-mcq', headingBn: 'বহুনির্বাচনী প্রশ্ন', headingEn: 'MCQ', subjectId: 'math', marks: 30 },
      { id: 'math-short', headingBn: 'সংক্ষিপ্ত-উত্তর প্রশ্ন', headingEn: 'Short Answer', subjectId: 'math', marks: 20 },
      { id: 'math-creative', headingBn: 'সৃজনশীল প্রশ্ন', headingEn: 'Creative', subjectId: 'math', marks: 50 },
    ],
  },
  {
    id: 'class-8-scholarship-science-bgs',
    nameBn: 'বিজ্ঞান + বাংলাদেশ ও বিশ্বপরিচয় (৫০+৫০)',
    nameEn: 'Science + Bangladesh & Global Studies (50+50)',
    classId: 'class-8',
    totalMarks: 100,
    timeMinutes: 180,
    sections: [
      { id: 'science', headingBn: 'বিজ্ঞান', headingEn: 'Science', subjectId: 'science', marks: 50 },
      { id: 'bgs', headingBn: 'বাংলাদেশ ও বিশ্বপরিচয়', headingEn: 'Bangladesh & Global Studies', subjectId: 'bgs', marks: 50 },
    ],
  },
];

/** Verified questions available for one combined-paper section today
 *  (Class 8 Academic MCQs, verified 26 Nov 2026 — Bangla 20, English 20,
 *  Math 22, Science 24, BGS 16). Section marks are the TARGET, never the
 *  availability: a section can hold verified MCQs and still not be
 *  generatable as a whole (e.g. its creative / short-answer marks need
 *  question types the pool does not hold yet). */
export function qpgCombinedSectionAvailable(section: QpgCombinedSection): number {
  return qpgChaptersFor('general', 'class-8', section.subjectId).reduce(
    (sum, ch) => sum + ch.verifiedCount,
    0,
  );
}

/** A bundle is generatable only when every KEPT section has at least
 *  one verified question. NOTE: this flag means "verified questions
 *  exist per section", NOT "generatable" — the pool holds MCQs only,
 *  so creative / short-answer marks cannot be filled from it, and the
 *  QPG page's bundle button has NO click handler yet. The button stays
 *  disabled with honest copy until bundle generation is wired as its
 *  own task — do NOT enable it on this flag alone. (Class 8 packs were
 *  verified 26 Nov 2026, so the flag is true for the four Class 8
 *  bundles; the button still stays disabled.) */
export function qpgCombinedPaperReady(
  paper: QpgCombinedPaper,
  droppedSectionIds: string[] = [],
): boolean {
  const kept = paper.sections.filter((s) => !droppedSectionIds.includes(s.id));
  return kept.length > 0 && kept.every((s) => qpgCombinedSectionAvailable(s) > 0);
}
