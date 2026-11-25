// Eduvelto — Question Paper Generator: usage, Pro orders, typo reports.
//
// FIRESTORE DESIGN (branch only — NEVER deployed, never written to live
// Firestore in the MVP). Collections + rules live in firestore.rules;
// the three collections join BACKUP_COLLECTIONS (see src/lib/backup.ts)
// and the REST exporter, so they are covered by the backup drift test.
//
//   qpgUsage/{uid}_{yyyyMM}  — per-teacher per-month free downloads
//     { uid, month: 'YYYY-MM', freeDownloads: number, updatedAt }
//   qpgProOrders/{orderId}   — TrxID upgrade orders, admin-reviewed
//     { uid, plan, amountBdt, paymentMethod, trxId,
//       status: 'pending-review' | 'approved' | 'rejected',
//       createdAt, decidedBy?, decidedAt?, decisionNote? }
//   qpgReports/{reportId}    — "Report Typo/Error" on a question
//     { reporterId, questionId, chapterId, reason, details,
//       status: 'open' | 'investigating' | 'resolved' | 'dismissed',
//       createdAt, resolvedBy?, resolvedAt?, resolutionNote? }
//   A report NEVER auto-publishes or auto-edits anything: only a
//   moderator may decide it (rules: update = moderator only, decide
//   fields only), and question docs are untouched by the report flow.
//
// DEMO STAND-IN (what is LIVE in today's demo, clearly labelled):
// free-download quota is enforced against localStorage (key below),
// NOT Firestore — no live writes happen in the MVP. The stand-in is
// per browser + per signed-in uid when available, and resets monthly.
// The UI labels it "ডেমো কোটা (স্থানীয়)" so nobody mistakes it for
// the Firestore counter.

import {
  QPG_FREE_MONTHLY_LIMIT,
  QPG_PRO_PLAN_AMOUNTS,
  type QpgProPlan,
} from './questionPaper';

/** Pro plan ids + exact amounts — single source of truth lives in
 *  ./questionPaper (PRICING FINAL, owner 25 Nov 09:34: 30% of
 *  Eproshnobank, i.e. 70% off, rounded to the nearest ৳10). */
export type { QpgProPlan } from './questionPaper';
export { QPG_PRO_PLAN_AMOUNTS };

export interface QpgUsageDoc {
  uid: string;
  month: string; // 'YYYY-MM'
  freeDownloads: number;
  updatedAt: string;
}

export interface QpgProOrderDoc {
  uid: string;
  plan: QpgProPlan;
  amountBdt: number;
  paymentMethod: 'bkash' | 'nagad';
  trxId: string;
  /** Last 3 digits of the sender's bKash/Nagad number (Phase 2:
   *  the admin matches them against the payment in the app). */
  senderLast3: string;
  /** Optional own WhatsApp number, for the unlock notification. */
  senderWhatsapp?: string;
  /** Contribution coupon (§3) applied at checkout, if any. The
   *  discount is verified by the admin at review, never self-applied. */
  couponCode?: string;
  status: 'pending-review' | 'approved' | 'rejected';
  /** 'onsite' = the on-site TrxID form; 'whatsapp' = the admin
   *  created/linked the order from a WhatsApp message. */
  source: 'onsite' | 'whatsapp';
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
  /** Set by the admin at approval (unlock window). */
  proStart?: string;
  proEnd?: string;
  /** Single-paper plan only: clean-download credits left. */
  remainingUses?: number;
}

export type QpgReportReason =
  | 'typo'
  | 'wrong-answer'
  | 'wrong-explanation'
  | 'unclear-question'
  | 'other';

export const QPG_REPORT_REASONS: Array<{ id: QpgReportReason; nameBn: string; nameEn: string }> = [
  { id: 'typo', nameBn: 'বানান/টাইপ ভুল', nameEn: 'Typo' },
  { id: 'wrong-answer', nameBn: 'ভুল উত্তর', nameEn: 'Wrong answer' },
  { id: 'wrong-explanation', nameBn: 'ভুল ব্যাখ্যা', nameEn: 'Wrong explanation' },
  { id: 'unclear-question', nameBn: 'প্রশ্ন অস্পষ্ট', nameEn: 'Unclear question' },
  { id: 'other', nameBn: 'অন্যান্য', nameEn: 'Other' },
];

export interface QpgReportDoc {
  reporterId: string;
  questionId: string;
  chapterId: string;
  reason: QpgReportReason;
  details: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  /** REPORT ERROR REWARD (Turn 32): a VALID correction earns the
   *  reporting teacher 7 free days of Pro — ONLY after admin
   *  validation, NEVER automatic. 'none' = no reward decided;
   *  'pending' = validated, reward queued; 'granted' = 7 days applied.
   *  The moderator sets these fields on decide; the reporter cannot. */
  rewardStatus?: 'none' | 'pending' | 'granted';
  rewardDays?: number;
  rewardGrantedAt?: string;
  rewardExpiresAt?: string;
}

/** Free Pro days earned by one validated correction. */
export const QPG_REPORT_REWARD_DAYS = 7;

/** Client-side mirror of the Firestore shape checks (rules are
 *  authoritative; this keeps bad payloads out before they are sent). */
export function validateQpgProOrder(doc: Partial<QpgProOrderDoc>): string[] {
  const problems: string[] = [];
  if (!doc.uid || typeof doc.uid !== 'string') problems.push('uid is required');
  if (!doc.plan || !(doc.plan in QPG_PRO_PLAN_AMOUNTS)) {
    problems.push('plan must be a known Pro plan (per-paper, monthly or an annual tier)');
  } else if (doc.amountBdt !== QPG_PRO_PLAN_AMOUNTS[doc.plan]) {
    problems.push(`amountBdt for ${doc.plan} must be ${QPG_PRO_PLAN_AMOUNTS[doc.plan]}`);
  }
  if (doc.paymentMethod !== 'bkash' && doc.paymentMethod !== 'nagad') {
    problems.push('paymentMethod must be bkash or nagad');
  }
  if (typeof doc.trxId !== 'string' || doc.trxId.trim().length < 6 || doc.trxId.trim().length > 30) {
    problems.push('trxId must be 6–30 characters');
  }
  // Phase 2: the admin matches the sender's last 3 digits against
  // the payment in the bKash/Nagad app — exactly 3 digits.
  if (typeof doc.senderLast3 !== 'string' || !/^[0-9]{3}$/.test(doc.senderLast3.trim())) {
    problems.push('senderLast3 must be exactly 3 digits');
  }
  if (doc.status !== 'pending-review') problems.push('new orders must start as pending-review');
  if (doc.source !== 'onsite' && doc.source !== 'whatsapp') {
    problems.push('source must be onsite or whatsapp');
  }
  // Unlock window / credits are set by the ADMIN at approval — a new
  // order must not carry them.
  if (doc.proStart !== undefined || doc.proEnd !== undefined || doc.remainingUses !== undefined) {
    problems.push('a new order must not carry proStart/proEnd/remainingUses (admin sets them on approval)');
  }
  return problems;
}

export function validateQpgReport(doc: Partial<QpgReportDoc>): string[] {
  const problems: string[] = [];
  if (!doc.reporterId || typeof doc.reporterId !== 'string') problems.push('reporterId is required');
  if (!doc.questionId || typeof doc.questionId !== 'string') problems.push('questionId is required');
  if (!doc.chapterId || typeof doc.chapterId !== 'string') problems.push('chapterId is required');
  if (!QPG_REPORT_REASONS.some((r) => r.id === doc.reason)) problems.push('reason is not a known value');
  if (typeof doc.details !== 'string' || doc.details.length > 2000) {
    problems.push('details must be a string up to 2000 characters');
  }
  if (doc.status !== 'open') problems.push('new reports must start as open');
  // Reward: only ever 7 days, only after admin validation — a new
  // report must carry no reward at all.
  if (doc.rewardStatus !== undefined && doc.rewardStatus !== 'none') {
    problems.push('a new report must not carry a reward (admin validates first)');
  }
  if (doc.rewardDays !== undefined && doc.rewardDays !== QPG_REPORT_REWARD_DAYS) {
    problems.push(`rewardDays must be ${QPG_REPORT_REWARD_DAYS} when set`);
  }
  return problems;
}

// ---------------------------------------------------------------------
// Demo stand-in: local usage counter (localStorage, monthly rollover).
// Labelled DEMO everywhere it surfaces. Firestore enforcement is the
// designed (branch-only) path and is NOT live in the MVP demo.
// ---------------------------------------------------------------------

export const QPG_DEMO_USAGE_KEY = 'eduvelto-qpg-demo-usage-v1';
export const QPG_DEMO_REPORTS_KEY = 'eduvelto-qpg-demo-reports-v1';

export function qpgCurrentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Storage shim: localStorage in the browser, in-memory fallback
 *  (vitest node env, SSR) so the module never throws. */
const memoryStore = new Map<string, string>();
function storageGet(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch {
    // fall through to memory
  }
  return memoryStore.get(key) ?? null;
}
function storageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {
    // fall through to memory
  }
  memoryStore.set(key, value);
}

export interface QpgDemoUsage {
  /** 'DEMO (local)' — the enforcement live in today's demo. */
  enforcement: 'DEMO (local)';
  month: string;
  used: number;
  limit: number;
  remaining: number;
}

export function getDemoUsage(uid: string, now = new Date()): QpgDemoUsage {
  const month = qpgCurrentMonth(now);
  const limit = QPG_FREE_MONTHLY_LIMIT;
  let used = 0;
  try {
    const raw = storageGet(`${QPG_DEMO_USAGE_KEY}:${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw) as { month?: string; used?: number };
      if (parsed.month === month && typeof parsed.used === 'number') used = parsed.used;
    }
  } catch {
    used = 0;
  }
  return { enforcement: 'DEMO (local)', month, used, limit, remaining: Math.max(0, limit - used) };
}

/** Record one free download against the demo quota. Returns the new
 *  usage, or `allowed: false` when the 3/month demo quota is spent. */
export function recordDemoFreeDownload(
  uid: string,
  now = new Date(),
): { allowed: boolean; usage: QpgDemoUsage } {
  const usage = getDemoUsage(uid, now);
  if (usage.remaining <= 0) return { allowed: false, usage };
  const next: QpgDemoUsage = { ...usage, used: usage.used + 1, remaining: usage.remaining - 1 };
  storageSet(
    `${QPG_DEMO_USAGE_KEY}:${uid}`,
    JSON.stringify({ month: next.month, used: next.used }),
  );
  return { allowed: true, usage: next };
}

/** Demo typo-report queue (local only — the Firestore qpgReports
 *  collection + admin review flow is designed in the branch, not live). */
export function saveDemoReport(
  report: Omit<QpgReportDoc, 'status' | 'createdAt'>,
): { saved: boolean; problems: string[] } {
  const problems = validateQpgReport({ ...report, status: 'open' });
  if (problems.length > 0) return { saved: false, problems };
  const doc: QpgReportDoc = { ...report, status: 'open', createdAt: new Date().toISOString() };
  let queue: QpgReportDoc[] = [];
  try {
    const raw = storageGet(QPG_DEMO_REPORTS_KEY);
    if (raw) queue = JSON.parse(raw) as QpgReportDoc[];
  } catch {
    queue = [];
  }
  queue.push(doc);
  storageSet(QPG_DEMO_REPORTS_KEY, JSON.stringify(queue));
  return { saved: true, problems: [] };
}

export function listDemoReports(): QpgReportDoc[] {
  try {
    const raw = storageGet(QPG_DEMO_REPORTS_KEY);
    return raw ? (JSON.parse(raw) as QpgReportDoc[]) : [];
  } catch {
    return [];
  }
}
