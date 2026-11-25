// Done-for-you custom paper service — order shape + WhatsApp order text
// (owner 25 Nov 10:50, "koro"). Pure functions only: the order is NOT
// stored in Firestore in this build — the buyer sends the order text via
// WhatsApp (eduvelto.com/whatsapp redirect; the raw number is never
// shown) and pays bKash/Nagad + TrxID. Fulfilment is HUMAN (owner/team
// builds the paper and delivers the PDF via WhatsApp) — never automated.
// A Firestore-backed order-tracking collection is a Phase 2 follow-up:
// it must wait for the merge to resolve the BRT-11 donations drift
// (see the MVP report §5) so a new collection does not deepen it.
import {
  QPG_CUSTOM_PAPER_BDT,
  QPG_CUSTOM_PAPER_THEIR_MAX_BDT,
  QPG_CUSTOM_PAPER_THEIR_MIN_BDT,
  QPG_PAYMENT_NUMBER,
} from './questionPaper';

/** A custom-paper order request, as the buyer fills it in. */
export interface CustomPaperOrder {
  buyerName: string;
  /** Buyer's own WhatsApp number (optional — so the team can reply). */
  buyerWhatsapp: string;
  className: string;
  subject: string;
  /** Chapters / topics the paper must cover (free text). */
  chapters: string;
  /** Question types + counts, e.g. "MCQ ২০টি, সৃজনশীল ৫টি". */
  questionTypes: string;
  totalMarks: number;
  /** Per-section mark split, e.g. "ক-বিভাগ ২০, খ-বিভাগ ৩০". */
  markDistribution: string;
  examTitle: string;
  institutionName: string;
  /** Date the paper is needed by (free text, e.g. "২৮ নভেম্বর"). */
  dateNeeded: string;
  instructions: string;
}

export function emptyCustomPaperOrder(): CustomPaperOrder {
  return {
    buyerName: '',
    buyerWhatsapp: '',
    className: '',
    subject: '',
    chapters: '',
    questionTypes: '',
    totalMarks: 0,
    markDistribution: '',
    examTitle: '',
    institutionName: '',
    dateNeeded: '',
    instructions: '',
  };
}

/** Required-field validation (Bangla messages for the form). */
export function validateCustomPaperOrder(o: CustomPaperOrder): string[] {
  const problems: string[] = [];
  if (!o.className.trim()) problems.push('শ্রেণি লিখুন।');
  if (!o.subject.trim()) problems.push('বিষয় লিখুন।');
  if (!(o.totalMarks > 0)) problems.push('মোট নম্বর ০-এর বেশি হতে হবে।');
  if (!o.dateNeeded.trim()) problems.push('কবে নাগাদ পেপার লাগবে, তা লিখুন।');
  return problems;
}

/** The order text the buyer pastes into WhatsApp. Never includes the
 *  Eduvelto WhatsApp number (hide-number rule) — the buyer is already
 *  in the WhatsApp chat when they paste it. The bKash/Nagad PAYMENT
 *  number is included: it is the payment-step number, shown publicly
 *  on the order page, not the WhatsApp number. */
export function buildCustomPaperOrderText(o: CustomPaperOrder): string {
  const lines = [
    'কাস্টম প্রশ্নপত্রের অর্ডার — Eduvelto',
    `নাম: ${o.buyerName.trim() || '—'}`,
    `শ্রেণি: ${o.className.trim()}`,
    `বিষয়: ${o.subject.trim()}`,
    `অধ্যায়/টপিক: ${o.chapters.trim() || '—'}`,
    `প্রশ্নের ধরন ও সংখ্যা: ${o.questionTypes.trim() || '—'}`,
    `মোট নম্বর: ${o.totalMarks}`,
    `নম্বর বণ্টন: ${o.markDistribution.trim() || '—'}`,
    `পরীক্ষার নাম: ${o.examTitle.trim() || '—'}`,
    `প্রতিষ্ঠান: ${o.institutionName.trim() || '—'}`,
    `লাগবে: ${o.dateNeeded.trim()}`,
    `নির্দেশনা: ${o.instructions.trim() || '—'}`,
    `মূল্য: ৳${QPG_CUSTOM_PAPER_BDT} (বাজার মূল্য ৳${QPG_CUSTOM_PAPER_THEIR_MIN_BDT}–${QPG_CUSTOM_PAPER_THEIR_MAX_BDT} → ৭০% ছাড়ে)`,
    `পেমেন্ট: বিকাশ/নগদ ${QPG_PAYMENT_NUMBER} নম্বরে ৳${QPG_CUSTOM_PAPER_BDT} পাঠিয়ে TrxID + শেষ ৩ ডিজিট জানাবেন।`,
  ];
  return lines.join('\n');
}
