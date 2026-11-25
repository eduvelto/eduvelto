// Eduvelto — Question Paper Generator Phase 2: Firestore-backed
// custom-order tracking (spec §6).
//
// The custom-paper service (built 25 Nov ~05:00, live 11:51) is a
// HUMAN service: the buyer orders on WhatsApp, the owner/team builds
// the paper by hand, the PDF is delivered via WhatsApp at ৳49/paper.
// It deliberately had NO Firestore collection (BRT-11 drift); the
// drift is resolved at the merge (preflight 103), so this follow-up
// adds TRACKING ONLY — it does not automate paper creation, and no
// delivery time is promised anywhere.
//
//   Buyer: submits the request form (same fields as the WhatsApp
//     order text) → order lands pending_payment → pays (bKash/Nagad +
//     TrxID) → admin marks paid → building → delivered.
//   Admin: delivery-status workflow (paid → building → delivered).
//   Buyer: sees the order status in "My orders" (same surface as
//     the Pro orders, §5).
//
// Collection: qpgCustomOrders (four-places rule).

import { QPG_CUSTOM_PAPER_BDT } from './questionPaper';

export type QpgCustomOrderStatus = 'pending_payment' | 'paid' | 'building' | 'delivered';

export const QPG_CUSTOM_ORDER_STATUSES: Array<{
  id: QpgCustomOrderStatus;
  nameBn: string;
  nameEn: string;
}> = [
  { id: 'pending_payment', nameBn: 'পেমেন্টের অপেক্ষায়', nameEn: 'Awaiting payment' },
  { id: 'paid', nameBn: 'পেমেন্ট হয়েছে', nameEn: 'Paid' },
  { id: 'building', nameBn: 'তৈরি হচ্ছে', nameEn: 'Building' },
  { id: 'delivered', nameBn: 'ডেলিভার করা হয়েছে', nameEn: 'Delivered' },
];

export interface QpgCustomOrderDoc {
  uid: string;
  buyerName: string;
  /** Optional — the reply channel for delivery. */
  buyerWhatsapp?: string;
  className: string;
  subject: string;
  chapters: string;
  questionTypes: string;
  totalMarks: number;
  markDistribution: string;
  examTitle: string;
  institutionName: string;
  dateNeeded: string;
  instructions: string;
  /** Fixed ৳49/paper (70%-rule). */
  priceBdt: number;
  trxId?: string;
  status: QpgCustomOrderStatus;
  source: 'onsite' | 'whatsapp';
  submittedAt: string;
  paidAt?: string;
  deliveredAt?: string;
  updatedByUid?: string;
}

/** Allowed status transitions (admin-only). Forward only, one step
 *  at a time — a delivered order never goes back. */
const CUSTOM_ORDER_TRANSITIONS: Record<QpgCustomOrderStatus, QpgCustomOrderStatus[]> = {
  pending_payment: ['paid'],
  paid: ['building'],
  building: ['delivered'],
  delivered: [],
};

export function canTransitionCustomOrder(
  from: QpgCustomOrderStatus,
  to: QpgCustomOrderStatus,
): boolean {
  return CUSTOM_ORDER_TRANSITIONS[from].includes(to);
}

export function validateQpgCustomOrder(doc: Partial<QpgCustomOrderDoc>): string[] {
  const problems: string[] = [];
  if (!doc.uid || typeof doc.uid !== 'string') problems.push('uid is required');
  if (!doc.className || doc.className.trim().length === 0) problems.push('শ্রেণি লিখুন।');
  if (!doc.subject || doc.subject.trim().length === 0) problems.push('বিষয় লিখুন।');
  if (typeof doc.totalMarks !== 'number' || doc.totalMarks <= 0) {
    problems.push('মোট নম্বর ০-এর বেশি হতে হবে।');
  }
  if (!doc.dateNeeded || doc.dateNeeded.trim().length === 0) problems.push('লাগবে (তারিখ) লিখুন।');
  if (doc.priceBdt !== QPG_CUSTOM_PAPER_BDT) {
    problems.push(`priceBdt must be ${QPG_CUSTOM_PAPER_BDT}`);
  }
  if (doc.status !== 'pending_payment') problems.push('a new custom order must start as pending_payment');
  if (doc.source !== 'onsite' && doc.source !== 'whatsapp') {
    problems.push('source must be onsite or whatsapp');
  }
  return problems;
}

/** Build the Firestore doc from the request form (same fields as the
 *  WhatsApp order text in ./customPaperOrder — the two stay in sync
 *  by sharing the field list, not by duplicating strings). */
export function buildQpgCustomOrder(args: {
  uid: string;
  buyerName: string;
  buyerWhatsapp?: string;
  className: string;
  subject: string;
  chapters: string;
  questionTypes: string;
  totalMarks: number;
  markDistribution: string;
  examTitle: string;
  institutionName: string;
  dateNeeded: string;
  instructions: string;
  source?: 'onsite' | 'whatsapp';
  now?: Date;
}): QpgCustomOrderDoc {
  const doc: QpgCustomOrderDoc = {
    uid: args.uid,
    buyerName: args.buyerName,
    className: args.className,
    subject: args.subject,
    chapters: args.chapters,
    questionTypes: args.questionTypes,
    totalMarks: args.totalMarks,
    markDistribution: args.markDistribution,
    examTitle: args.examTitle,
    institutionName: args.institutionName,
    dateNeeded: args.dateNeeded,
    instructions: args.instructions,
    priceBdt: QPG_CUSTOM_PAPER_BDT,
    status: 'pending_payment',
    source: args.source ?? 'onsite',
    submittedAt: (args.now ?? new Date()).toISOString(),
  };
  if (args.buyerWhatsapp) doc.buyerWhatsapp = args.buyerWhatsapp;
  return doc;
}
