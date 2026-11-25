// Eduvelto — Question Paper Generator Phase 2: TrxID review / Pro unlock.
//
// A manual bKash/Nagad payment becomes a Pro unlock, with a HUMAN
// admin review in between. No payment gateway; verification is manual
// (the established M2 pattern: on-site form → Firestore order →
// admin review → unlock).
//
//   Buyer: picks a tier → pays in the bKash/Nagad app → submits the
//     on-site TrxID form (tier, amount, TrxID, last 3 digits of the
//     sender's number, method, optional WhatsApp + coupon) → order
//     lands PENDING in qpgProOrders.
//   Admin: checks the TrxID in the bKash/Nagad app (amount matches
//     the tier; TrxID exists; sender's last 3 digits match) → approve
//     (unlock) or reject (reason required). Duplicate TrxID warns.
//   No auto-approval, no auto-unlock. Every unlock follows a human
//     approval. A rejected order stays on record (audit trail —
//     never edited); the buyer resubmits as a NEW order.
//
// Owner-input items (§8.1–§8.5) are UNRESOLVED. The proposals below
// are used as named defaults and flagged PROPOSAL wherever they
// surface; the UI shows NO time promise and NO refund wording until
// the owner confirms them (spec §5 "if the owner does not answer").
//
// This module is pure (validation + derivation). Firestore I/O lives
// in ./qpgFirestore. Rules live in firestore.rules (branch only —
// the 11:51 deploy was hosting-only, so the rules deploy itself is
// owner-approval-owed; see §8.6).

import {
  QPG_PRO_PLAN_AMOUNTS,
  QPG_PRO_MONTHLY_BDT,
  QPG_PRO_PER_PAPER_BDT,
  type QpgProPlan,
} from './questionPaper';
import type { QpgProOrderDoc } from './questionPaperUsage';

/** Order status — kebab-case, matching the existing qpgProOrders
 *  rules + tests ('pending-review', not the spec draft's
 *  'pending_review'). */
export type QpgProOrderStatus = 'pending-review' | 'approved' | 'rejected';

export type QpgProOrderSource = 'onsite' | 'whatsapp';

/** The Firestore order document — the extended QpgProOrderDoc
 *  (./questionPaperUsage). Field-name note: the spec draft (§5)
 *  calls the fields submittedAt / reviewedByUid / reviewedAt /
 *  rejectReason; the rules + code use createdAt / decidedBy /
 *  decidedAt / decisionNote — same meaning, rules' names win. */
export type QpgProOrder = QpgProOrderDoc;

// ---------------------------------------------------------------------
// Unlock semantics — PROPOSALS (§8.2–§8.4, owner confirms).
// ---------------------------------------------------------------------

/** PROPOSAL (§8.2): admin review turnaround. NOT shown in the UI
 *  until the owner confirms it — no time promise is made. */
export const QPG_PRO_REVIEW_TURNAROUND_HOURS_PROPOSAL = 12;
/** PROPOSAL (§8.3): a single-paper credit stays usable this long. */
export const QPG_SINGLE_PAPER_CREDIT_DAYS_PROPOSAL = 30;
/** Monthly Pro lasts 30 days from approval. */
export const QPG_MONTHLY_PRO_DAYS = 30;
/** Annual tiers last 365 days from approval. */
export const QPG_ANNUAL_PRO_DAYS = 365;
/** PROPOSAL (§8.5): refund wording — NOT shown in the UI until the
 *  owner confirms it. */
export const QPG_PRO_REFUND_POLICY_PROPOSAL_BN =
  'Pro চালু হওয়ার পর রিফান্ড নেই; চালু হওয়ার আগে অনুরোধে রিফান্ড দেওয়া হয়।';

/** TrxID format (client-side): exactly 10 alphanumeric characters.
 *  The rules keep the wider 6–30 outer bound; the client is the
 *  stricter gate (a typo'd TrxID is caught before it is submitted). */
export function validateTrxId(trxId: string): string | null {
  const t = trxId.trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(t)) {
    return 'TrxID ১০ অক্ষরের (অক্ষর/সংখ্যা) হতে হবে — bKash/Nagad অ্যাপে দেখানো TrxIDটি মিলিয়ে লিখুন।';
  }
  return null;
}

/** Last 3 digits of the sender's bKash/Nagad number: exactly 3 digits. */
export function validateSenderLast3(last3: string): string | null {
  if (!/^[0-9]{3}$/.test(last3.trim())) {
    return 'পাঠানো নম্বরের শেষ ৩ সংখ্যা লিখুন (শুধু সংখ্যা)।';
  }
  return null;
}

/** Client-side validation for a new TrxID order (rules are
 *  authoritative; this keeps bad payloads out before they are sent). */
export function validateQpgProOrderSubmission(order: Partial<QpgProOrder>): string[] {
  const problems: string[] = [];
  if (!order.uid || typeof order.uid !== 'string') problems.push('uid is required');
  if (!order.plan || !(order.plan in QPG_PRO_PLAN_AMOUNTS)) {
    problems.push('plan must be a known Pro plan (per-paper, monthly or an annual tier)');
  } else {
    const expected = QPG_PRO_PLAN_AMOUNTS[order.plan];
    // The amount is ALWAYS the plan amount. A contribution coupon
    // (§3) does not change what the buyer submits — the discount is
    // verified by the admin at review, never self-applied.
    if (order.amountBdt !== expected) {
      problems.push(`amountBdt for ${order.plan} must be ${expected}`);
    }
  }
  if (order.paymentMethod !== 'bkash' && order.paymentMethod !== 'nagad') {
    problems.push('paymentMethod must be bkash or nagad');
  }
  const trxProblem = order.trxId === undefined ? 'trxId is required' : validateTrxId(order.trxId);
  if (trxProblem) problems.push(trxProblem);
  const last3Problem =
    order.senderLast3 === undefined ? 'senderLast3 is required' : validateSenderLast3(order.senderLast3);
  if (last3Problem) problems.push(last3Problem);
  if (order.senderWhatsapp !== undefined && order.senderWhatsapp !== '') {
    if (!/^\+?[0-9]{11,15}$/.test(order.senderWhatsapp.replace(/[\s-]/g, ''))) {
      problems.push('senderWhatsapp must be a valid phone number');
    }
  }
  if (order.status !== 'pending-review') problems.push('new orders must start as pending-review');
  if (order.source !== 'onsite' && order.source !== 'whatsapp') {
    problems.push('source must be onsite or whatsapp');
  }
  // Unlock window / credits are set by the ADMIN at approval — a new
  // order must not carry them.
  if (order.proStart !== undefined || order.proEnd !== undefined || order.remainingUses !== undefined) {
    problems.push('a new order must not carry proStart/proEnd/remainingUses (admin sets them on approval)');
  }
  return problems;
}

/** Build the order document for a new on-site submission. Amount is
 *  always the plan amount (a coupon discount is admin-verified at
 *  review, never self-applied by the buyer). */
export function buildQpgProOrder(args: {
  uid: string;
  plan: QpgProPlan;
  paymentMethod: 'bkash' | 'nagad';
  trxId: string;
  senderLast3: string;
  senderWhatsapp?: string;
  couponCode?: string;
  source?: QpgProOrderSource;
  now?: Date;
}): QpgProOrder {
  const amount = QPG_PRO_PLAN_AMOUNTS[args.plan];
  const order: QpgProOrder = {
    uid: args.uid,
    plan: args.plan,
    amountBdt: amount,
    paymentMethod: args.paymentMethod,
    trxId: args.trxId.trim().toUpperCase(),
    senderLast3: args.senderLast3.trim(),
    status: 'pending-review',
    source: args.source ?? 'onsite',
    createdAt: (args.now ?? new Date()).toISOString(),
  };
  if (args.senderWhatsapp) order.senderWhatsapp = args.senderWhatsapp;
  if (args.couponCode) order.couponCode = args.couponCode.trim().toUpperCase();
  return order;
}

/** Duplicate-TrxID warning for the admin queue: every OTHER order
 *  carrying the same TrxID (any status). Reusing a TrxID is rejected. */
export function findDuplicateTrxIdOrders(
  orders: Array<{ id: string; trxId: string }>,
  trxId: string,
  selfId?: string,
): Array<{ id: string; trxId: string }> {
  const t = trxId.trim().toUpperCase();
  return orders.filter((o) => o.id !== selfId && o.trxId.trim().toUpperCase() === t);
}

// ---------------------------------------------------------------------
// Unlock derivation — Pro status is DERIVED from qpgProOrders (no new
// collection): the latest approved, unexpired record for the uid,
// plus single-paper credits as records with remainingUses.
// ---------------------------------------------------------------------

export type QpgProScope =
  | { kind: 'all' }
  | { kind: 'classes'; classIds: string[] }
  | { kind: 'single-paper' };

export interface QpgProStatus {
  proUnlocked: boolean;
  /** The plan granting the status (null when locked). */
  plan: QpgProPlan | null;
  /** Unlock window end (null for single-paper credits — those expire
   *  via remainingUses + their own proEnd). */
  expiresAt: string | null;
  /** Clean-download credits left on approved per-paper orders. */
  singlePaperCredits: number;
  /** Tier scope (PROPOSAL §8.4: tier-scoped — a per-class purchase
   *  unlocks Pro for that class's subjects only; monthly unlocks all
   *  classes for 30 days). */
  scope: QpgProScope;
  /** The order id granting the status (null when locked). */
  orderId: string | null;
}

export const QPG_PRO_LOCKED: QpgProStatus = {
  proUnlocked: false,
  plan: null,
  expiresAt: null,
  singlePaperCredits: 0,
  scope: { kind: 'single-paper' },
  orderId: null,
};

/** Class ids covered by each annual tier (PROPOSAL §8.4 scope). */
export function qpgProPlanClassIds(plan: QpgProPlan): string[] | 'all' | 'single-paper' {
  switch (plan) {
    case 'per-paper':
      return 'single-paper';
    case 'monthly':
      return 'all';
    case 'class-3':
      return ['class-3'];
    case 'class-4':
      return ['class-4'];
    case 'class-5':
      return ['class-5'];
    case 'class-6-8':
      return ['class-6', 'class-7', 'class-8'];
    case 'class-9-10':
      return ['class-9', 'class-10'];
    case 'class-11-12':
      return ['class-11', 'class-12'];
    case 'per-subject':
    case 'subject-teacher':
      // Per-subject tiers unlock one subject (Class 6+) — the class
      // scope is decided by the subject the buyer picks at checkout;
      // the code treats them as class-scoped to 6–10 until the owner
      // confirms the exact scope rule (§8.4).
      return ['class-6', 'class-7', 'class-8', 'class-9', 'class-10'];
    case 'bundle-3-5':
      return ['class-3', 'class-4', 'class-5'];
    case 'bundle-6-8':
      return ['class-6', 'class-7', 'class-8'];
    case 'bundle-3-8':
      return ['class-3', 'class-4', 'class-5', 'class-6', 'class-7', 'class-8'];
    case 'bundle-6-10':
      return ['class-6', 'class-7', 'class-8', 'class-9', 'class-10'];
    case 'bundle-3-10':
      return ['class-3', 'class-4', 'class-5', 'class-6', 'class-7', 'class-8', 'class-9', 'class-10'];
    case 'coaching-5-8':
      return ['class-5', 'class-6', 'class-7', 'class-8'];
    case 'coaching-5-10':
      return ['class-5', 'class-6', 'class-7', 'class-8', 'class-9', 'class-10'];
    case 'coaching-3-10':
      return ['class-3', 'class-4', 'class-5', 'class-6', 'class-7', 'class-8', 'class-9', 'class-10'];
    case 'coaching-6-12':
      return ['class-6', 'class-7', 'class-8', 'class-9', 'class-10', 'class-11', 'class-12'];
    case 'coaching-3-12':
      return [
        'class-3', 'class-4', 'class-5', 'class-6', 'class-7', 'class-8',
        'class-9', 'class-10', 'class-11', 'class-12',
      ];
    default:
      return 'single-paper';
  }
}

/** Days of Pro granted by an approved order (single-paper = credit
 *  window, not a time-based unlock). */
export function qpgProPlanDays(plan: QpgProPlan): number {
  if (plan === 'per-paper') return QPG_SINGLE_PAPER_CREDIT_DAYS_PROPOSAL;
  if (plan === 'monthly') return QPG_MONTHLY_PRO_DAYS;
  return QPG_ANNUAL_PRO_DAYS;
}

/** The approval outcome the admin's write applies: unlock window +
 *  (single-paper only) one credit. */
export function qpgApprovalWindow(
  plan: QpgProPlan,
  approvedAt = new Date(),
): { proStart: string; proEnd: string; remainingUses: number | undefined } {
  const days = qpgProPlanDays(plan);
  const proStart = approvedAt.toISOString();
  const proEnd = new Date(approvedAt.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  return { proStart, proEnd, remainingUses: plan === 'per-paper' ? 1 : undefined };
}

/** Derive Pro status from the buyer's APPROVED orders. A time-based
 *  order counts while now < proEnd. A single-paper order counts its
 *  remainingUses while now < proEnd. Rejected / pending orders grant
 *  nothing. The latest approved time-based order wins the plan. */
export function deriveQpgProStatus(
  approvedOrders: Array<{
    id: string;
    plan: QpgProPlan;
    proStart?: string;
    proEnd?: string;
    remainingUses?: number;
  }>,
  now = new Date(),
): QpgProStatus {
  const nowMs = now.getTime();
  let credits = 0;
  let best: { id: string; plan: QpgProPlan; proEnd: string } | null = null;
  for (const o of approvedOrders) {
    if (!o.proEnd) continue;
    const endMs = Date.parse(o.proEnd);
    if (Number.isNaN(endMs) || nowMs >= endMs) continue;
    if (o.plan === 'per-paper') {
      credits += Math.max(0, o.remainingUses ?? 0);
      continue;
    }
    if (!best || endMs > Date.parse(best.proEnd)) {
      best = { id: o.id, plan: o.plan, proEnd: o.proEnd };
    }
  }
  if (best) {
    const scope = qpgProPlanClassIds(best.plan);
    return {
      proUnlocked: true,
      plan: best.plan,
      expiresAt: best.proEnd,
      singlePaperCredits: credits,
      scope:
        scope === 'all'
          ? { kind: 'all' }
          : scope === 'single-paper'
            ? { kind: 'single-paper' }
            : { kind: 'classes', classIds: scope },
      orderId: best.id,
    };
  }
  if (credits > 0) {
    return {
      proUnlocked: false,
      plan: 'per-paper',
      expiresAt: null,
      singlePaperCredits: credits,
      scope: { kind: 'single-paper' },
      orderId: null,
    };
  }
  return QPG_PRO_LOCKED;
}

/** Single-paper credit decrement (pure): the next remainingUses
 *  after one clean download, or null when the credit cannot be used
 *  (0 left, or expired). The Firestore transaction enforces the same
 *  check server-side (rules: only −1, only if > 0 and unexpired). */
export function nextSinglePaperUses(
  remainingUses: number | undefined,
  proEnd: string | undefined,
  now = new Date(),
): number | null {
  const left = remainingUses ?? 0;
  if (left <= 0) return null;
  if (proEnd) {
    const endMs = Date.parse(proEnd);
    if (!Number.isNaN(endMs) && now.getTime() >= endMs) return null;
  }
  return left - 1;
}

/** Plan label helpers (the dialog + My orders reuse them). */
export function qpgProPlanLabel(plan: QpgProPlan): string {
  if (plan === 'per-paper') return `প্রতি পেপার ৳${QPG_PRO_PER_PAPER_BDT}`;
  if (plan === 'monthly') return `মাসিক ৳${QPG_PRO_MONTHLY_BDT}`;
  return `বার্ষিক ৳${QPG_PRO_PLAN_AMOUNTS[plan]}`;
}
