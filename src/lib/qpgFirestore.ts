// Eduvelto — Question Paper Generator Phase 2: Firestore I/O.
//
// All QPG Firestore reads/writes in one place. Every function takes
// `db: Firestore` first (same pattern as ./backup) so tests can pass
// an emulator db; pages import `db` from ../firebase.
//
// BRANCH ONLY — the qpgProOrders / qpgUsage / qpgReports rules are in
// firestore.rules but NOT deployed (the 11:51 deploy was hosting-only).
// Until the owner approves the rules deploy (§8.6), live calls to
// these functions fail with permission-denied; the UI surfaces that
// honestly ("Pro যাচাই এখনো চালু হয়নি") instead of pretending the
// flow works. No live Firestore writes happen from this branch.
//
// Query discipline (Spark, 50k reads/day): every list query uses a
// SINGLE equality filter (auto-indexed — no composite index needed)
// and sorts client-side; per-session loads are cached in
// sessionStorage by the caller (see ./questionPaperCache pattern and
// QPG_PRO_STATUS_CACHE_KEY below). No listeners — one-shot reads.

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { QPG_FREE_MONTHLY_LIMIT } from './questionPaper';
import {
  qpgCurrentMonth,
  type QpgUsageDoc,
} from './questionPaperUsage';
import {
  deriveQpgProStatus,
  nextSinglePaperUses,
  qpgApprovalWindow,
  QPG_PRO_LOCKED,
  type QpgProOrder,
  type QpgProStatus,
} from './qpgProOrders';
import {
  contributionApprovalFor,
  type QpgContributionDoc,
  type QpgContributionRejectReason,
  type QpgContributorStatsDoc,
} from './qpgContributions';
import { validateQpgBoard, type QpgBoardDoc } from './qpgSmartboard';
import {
  canTransitionCustomOrder,
  type QpgCustomOrderDoc,
  type QpgCustomOrderStatus,
} from './qpgCustomOrders';

/** Timestamp → ISO string (Firestore Timestamp or ISO string in). */
export function qpgTsToIso(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'toDate' in (v as Record<string, unknown>)) {
    return ((v as { toDate: () => Date }).toDate()).toISOString();
  }
  return new Date().toISOString();
}

function docData<T>(snap: QueryDocumentSnapshot<DocumentData>): T & { id: string } {
  return { id: snap.id, ...(snap.data() as T) };
}

/** Session cache key for the derived Pro status (one small query
 *  per session, not per action — spec §5). */
export const QPG_PRO_STATUS_CACHE_KEY = 'eduvelto-qpg-pro-status-v1';

/** How long a cached Pro status is trusted (5 minutes — an admin
 *  approval lands within one session refresh, never a stale unlock). */
export const QPG_PRO_STATUS_CACHE_MS = 5 * 60 * 1000;

interface QpgProStatusCache {
  status: QpgProStatus;
  fetchedAt: number;
}

/** Load the derived Pro status once per session: a fresh (< 5 min)
 *  sessionStorage entry is returned without a Firestore read; otherwise
 *  the status is loaded from qpgProOrders and cached. Guests ('guest'
 *  uid) never read Firestore — they are locked. */
export async function loadCachedProStatus(
  db: Firestore,
  uid: string,
  now = new Date(),
): Promise<QpgProStatus> {
  if (uid === 'guest') return QPG_PRO_LOCKED;
  try {
    const raw = sessionStorage.getItem(QPG_PRO_STATUS_CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as QpgProStatusCache;
      if (
        cached &&
        typeof cached.fetchedAt === 'number' &&
        now.getTime() - cached.fetchedAt < QPG_PRO_STATUS_CACHE_MS &&
        cached.status &&
        typeof cached.status.proUnlocked === 'boolean'
      ) {
        return cached.status;
      }
    }
  } catch {
    // Corrupt cache entry — fall through to a fresh load.
  }
  const status = await loadQpgProStatus(db, uid, now);
  try {
    sessionStorage.setItem(
      QPG_PRO_STATUS_CACHE_KEY,
      JSON.stringify({ status, fetchedAt: now.getTime() } satisfies QpgProStatusCache),
    );
  } catch {
    // sessionStorage full/blocked — the status still works for this page.
  }
  return status;
}

/** Drop the cached Pro status (after a single-paper credit is spent,
 *  so the next load re-derives it). */
export function clearCachedProStatus(): void {
  try {
    sessionStorage.removeItem(QPG_PRO_STATUS_CACHE_KEY);
  } catch {
    // Nothing to clear.
  }
}

// ---------------------------------------------------------------------
// Free-tier usage — Firestore qpgUsage (replaces the localStorage
// demo stand-in for signed-in users; guests keep the demo counter).
//   qpgUsage/{uid}_{yyyyMM}: { uid, month, freeDownloads, updatedAt }
// ---------------------------------------------------------------------

export function qpgUsageDocId(uid: string, month: string): string {
  return `${uid}_${month}`;
}

export interface QpgUsageRead {
  exists: boolean;
  month: string;
  freeDownloads: number;
}

export async function getQpgUsage(
  db: Firestore,
  uid: string,
  now = new Date(),
): Promise<QpgUsageRead> {
  const month = qpgCurrentMonth(now);
  const snap = await getDoc(doc(db, 'qpgUsage', qpgUsageDocId(uid, month)));
  if (!snap.exists()) return { exists: false, month, freeDownloads: 0 };
  const data = snap.data() as Partial<QpgUsageDoc>;
  return { exists: true, month, freeDownloads: data.freeDownloads ?? 0 };
}

/** Record one free download against the Firestore quota. Transaction:
 *  create the month doc at 0 then increment by exactly 1 (the rules
 *  enforce the +1-only shape); refuse when the 3/month cap is spent.
 *  Returns the new usage, or allowed:false when the quota is spent. */
export async function recordQpgFreeDownload(
  db: Firestore,
  uid: string,
  now = new Date(),
): Promise<{ allowed: boolean; used: number; remaining: number; limit: number }> {
  const month = qpgCurrentMonth(now);
  const limit = QPG_FREE_MONTHLY_LIMIT;
  const ref = doc(db, 'qpgUsage', qpgUsageDocId(uid, month));
  const used = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? ((snap.data() as Partial<QpgUsageDoc>).freeDownloads ?? 0) : 0;
    if (current >= limit) return -1;
    if (!snap.exists()) {
      tx.set(ref, { uid, month, freeDownloads: 1, updatedAt: serverTimestamp() });
    } else {
      tx.update(ref, { freeDownloads: current + 1, updatedAt: serverTimestamp() });
    }
    return current + 1;
  });
  if (used < 0) {
    const read = await getQpgUsage(db, uid, now);
    return { allowed: false, used: read.freeDownloads, remaining: 0, limit };
  }
  return { allowed: true, used, remaining: Math.max(0, limit - used), limit };
}

// ---------------------------------------------------------------------
// Pro orders — qpgProOrders (TrxID review / Pro unlock, spec §5).
// ---------------------------------------------------------------------

export async function submitQpgProOrder(
  db: Firestore,
  order: QpgProOrder,
): Promise<string> {
  const ref = await addDoc(collection(db, 'qpgProOrders'), {
    uid: order.uid,
    plan: order.plan,
    amountBdt: order.amountBdt,
    paymentMethod: order.paymentMethod,
    trxId: order.trxId,
    senderLast3: order.senderLast3,
    ...(order.senderWhatsapp ? { senderWhatsapp: order.senderWhatsapp } : {}),
    ...(order.couponCode ? { couponCode: order.couponCode } : {}),
    status: 'pending-review',
    source: order.source,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export interface QpgProOrderRow extends QpgProOrder {
  id: string;
}

function orderRow(snap: QueryDocumentSnapshot<DocumentData>): QpgProOrderRow {
  const d = snap.data() as Record<string, unknown>;
  return {
    id: snap.id,
    uid: String(d.uid ?? ''),
    plan: d.plan as QpgProOrder['plan'],
    amountBdt: Number(d.amountBdt ?? 0),
    paymentMethod: d.paymentMethod as QpgProOrder['paymentMethod'],
    trxId: String(d.trxId ?? ''),
    senderLast3: String(d.senderLast3 ?? ''),
    senderWhatsapp: d.senderWhatsapp ? String(d.senderWhatsapp) : undefined,
    couponCode: d.couponCode ? String(d.couponCode) : undefined,
    status: d.status as QpgProOrder['status'],
    source: (d.source as QpgProOrder['source']) ?? 'onsite',
    createdAt: qpgTsToIso(d.createdAt),
    decidedBy: d.decidedBy ? String(d.decidedBy) : undefined,
    decidedAt: d.decidedAt ? qpgTsToIso(d.decidedAt) : undefined,
    decisionNote: d.decisionNote ? String(d.decisionNote) : undefined,
    proStart: d.proStart ? qpgTsToIso(d.proStart) : undefined,
    proEnd: d.proEnd ? qpgTsToIso(d.proEnd) : undefined,
    remainingUses: typeof d.remainingUses === 'number' ? d.remainingUses : undefined,
  };
}

/** The buyer's orders, newest first (single equality filter on uid;
 *  sorted client-side — no composite index needed). */
export async function loadMyQpgProOrders(db: Firestore, uid: string): Promise<QpgProOrderRow[]> {
  const snap = await getDocs(
    query(collection(db, 'qpgProOrders'), where('uid', '==', uid), limit(50)),
  );
  return snap.docs.map(orderRow).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Derive the buyer's Pro status from their APPROVED orders (one
 *  small query per session — the caller caches it in sessionStorage
 *  under QPG_PRO_STATUS_CACHE_KEY). */
export async function loadQpgProStatus(
  db: Firestore,
  uid: string,
  now = new Date(),
): Promise<QpgProStatus> {
  const orders = await loadMyQpgProOrders(db, uid);
  return deriveQpgProStatus(
    orders.filter((o) => o.status === 'approved'),
    now,
  );
}

/** Admin review queue: pending orders, newest first. */
export async function loadProOrderReviewQueue(db: Firestore): Promise<QpgProOrderRow[]> {
  const snap = await getDocs(
    query(collection(db, 'qpgProOrders'), where('status', '==', 'pending-review'), limit(20)),
  );
  return snap.docs.map(orderRow).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Admin decision on one order (batched where a coupon is involved).
 *  Approve: status approved + decide fields + unlock window (and one
 *  credit for per-paper). The coupon, when present, is verified
 *  first (belongs to the buyer, unused, unexpired) and marked used on
 *  the contribution record as part of the same batch. Reject: status
 *  rejected + reason (required). */
export async function decideQpgProOrder(
  db: Firestore,
  args: {
    orderId: string;
    adminUid: string;
    decision: 'approved' | 'rejected';
    decisionNote: string;
    /** The contribution id carrying the coupon, when the admin
     *  verified one (looked up by couponCode beforehand). */
    couponContributionId?: string;
    now?: Date;
  },
): Promise<void> {
  const orderSnap = await getDoc(doc(db, 'qpgProOrders', args.orderId));
  if (!orderSnap.exists()) throw new Error('Order not found.');
  const order = orderRow(orderSnap as QueryDocumentSnapshot<DocumentData>);
  if (order.status !== 'pending-review') throw new Error('Order is already decided.');
  if (args.decision === 'rejected' && args.decisionNote.trim().length === 0) {
    throw new Error('A reject reason is required.');
  }
  const batch = writeBatch(db);
  const orderRef = doc(db, 'qpgProOrders', args.orderId);
  if (args.decision === 'approved') {
    const window = qpgApprovalWindow(order.plan, args.now ?? new Date());
    batch.update(orderRef, {
      status: 'approved',
      decidedBy: args.adminUid,
      decidedAt: serverTimestamp(),
      decisionNote: args.decisionNote,
      proStart: window.proStart,
      proEnd: window.proEnd,
      ...(window.remainingUses !== undefined ? { remainingUses: window.remainingUses } : {}),
    });
  } else {
    batch.update(orderRef, {
      status: 'rejected',
      decidedBy: args.adminUid,
      decidedAt: serverTimestamp(),
      decisionNote: args.decisionNote,
    });
  }
  if (args.decision === 'approved' && args.couponContributionId) {
    batch.update(doc(db, 'qpgContributions', args.couponContributionId), {
      couponUsedAt: serverTimestamp(),
      couponUsedOrderId: args.orderId,
    });
  }
  await batch.commit();
}

/** Single-paper credit decrement (transaction): one clean download
 *  consumes one credit — only −1, only if > 0 and unexpired (the
 *  rules enforce the same shape). Returns the new remainingUses, or
 *  null when the credit cannot be used. */
export async function decrementSinglePaperCredit(
  db: Firestore,
  orderId: string,
  now = new Date(),
): Promise<number | null> {
  const ref = doc(db, 'qpgProOrders', orderId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return null;
    const d = snap.data() as Partial<QpgProOrder>;
    const next = nextSinglePaperUses(
      d.remainingUses,
      d.proEnd ? qpgTsToIso(d.proEnd) : undefined,
      now,
    );
    if (next === null) return null;
    tx.update(ref, { remainingUses: next });
    return next;
  });
}

// ---------------------------------------------------------------------
// Smartboard — qpgBoards.
// ---------------------------------------------------------------------

export async function saveQpgBoard(
  db: Firestore,
  boardId: string,
  board: QpgBoardDoc,
): Promise<void> {
  const problems = validateQpgBoard(board);
  if (problems.length > 0) throw new Error(problems.join(' '));
  await setDoc(
    doc(db, 'qpgBoards', boardId),
    { ...board, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function loadQpgBoard(
  db: Firestore,
  boardId: string,
): Promise<(QpgBoardDoc & { id: string }) | null> {
  const snap = await getDoc(doc(db, 'qpgBoards', boardId));
  if (!snap.exists()) return null;
  return docData<QpgBoardDoc>(snap as QueryDocumentSnapshot<DocumentData>);
}

export async function loadMyQpgBoards(
  db: Firestore,
  uid: string,
): Promise<Array<QpgBoardDoc & { id: string }>> {
  const snap = await getDocs(
    query(collection(db, 'qpgBoards'), where('ownerUid', '==', uid), limit(20)),
  );
  return snap.docs
    .map((d) => docData<QpgBoardDoc>(d))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

// ---------------------------------------------------------------------
// Contributions — qpgContributions + qpgContributorStats.
// ---------------------------------------------------------------------

export async function submitQpgContribution(
  db: Firestore,
  contribution: QpgContributionDoc,
): Promise<string> {
  // One batched write: the submission + the contributor's
  // totalSubmitted counter. The stats doc is created on first submit
  // (totalSubmitted 1); later submits increment it — never reset.
  const batch = writeBatch(db);
  const ref = doc(collection(db, 'qpgContributions'));
  batch.set(ref, { ...contribution, createdAt: serverTimestamp() });
  const statsRef = doc(db, 'qpgContributorStats', contribution.contributorUid);
  const statsSnap = await getDoc(statsRef);
  if (!statsSnap.exists()) {
    batch.set(statsRef, {
      uid: contribution.contributorUid,
      displayName: contribution.contributorName,
      institution: contribution.institution,
      totalSubmitted: 1,
      approved: 0,
      rejected: 0,
      points: 0,
      level: 'নবীন',
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(statsRef, {
      totalSubmitted: increment(1),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return ref.id;
}

export interface QpgContributionRow extends QpgContributionDoc {
  id: string;
  /** Set when a coupon is redeemed against a Pro order. */
  couponUsedAt?: string;
  couponUsedOrderId?: string;
}

function contributionRow(snap: QueryDocumentSnapshot<DocumentData>): QpgContributionRow {
  const d = snap.data() as Record<string, unknown>;
  return {
    id: snap.id,
    contributorUid: String(d.contributorUid ?? ''),
    contributorName: String(d.contributorName ?? ''),
    institution: String(d.institution ?? ''),
    stream: d.stream as QpgContributionDoc['stream'],
    classId: String(d.classId ?? ''),
    subjectId: String(d.subjectId ?? ''),
    chapterId: String(d.chapterId ?? ''),
    topic: String(d.topic ?? ''),
    type: d.type as QpgContributionDoc['type'],
    questionText: String(d.questionText ?? ''),
    options: Array.isArray(d.options) ? (d.options as string[]) : [],
    correctAnswer: (d.correctAnswer as number | string) ?? '',
    explanation: String(d.explanation ?? ''),
    source: String(d.source ?? ''),
    difficulty: d.difficulty as QpgContributionDoc['difficulty'],
    cognitiveLevel: d.cognitiveLevel as QpgContributionDoc['cognitiveLevel'],
    nature: d.nature as QpgContributionDoc['nature'],
    ownWordingConfirmed: d.ownWordingConfirmed === true,
    status: d.status as QpgContributionDoc['status'],
    rejectReason: d.rejectReason as QpgContributionRejectReason | undefined,
    rejectNote: d.rejectNote ? String(d.rejectNote) : undefined,
    reviewedByUid: d.reviewedByUid ? String(d.reviewedByUid) : undefined,
    reviewedAt: d.reviewedAt ? qpgTsToIso(d.reviewedAt) : undefined,
    pointsAwarded: typeof d.pointsAwarded === 'number' ? d.pointsAwarded : undefined,
    couponCode: d.couponCode ? String(d.couponCode) : undefined,
    couponExpiresAt: d.couponExpiresAt ? qpgTsToIso(d.couponExpiresAt) : undefined,
    couponUsedAt: d.couponUsedAt ? qpgTsToIso(d.couponUsedAt) : undefined,
    couponUsedOrderId: d.couponUsedOrderId ? String(d.couponUsedOrderId) : undefined,
    createdAt: qpgTsToIso(d.createdAt),
  };
}

export async function loadMyQpgContributions(
  db: Firestore,
  uid: string,
): Promise<QpgContributionRow[]> {
  const snap = await getDocs(
    query(collection(db, 'qpgContributions'), where('contributorUid', '==', uid), limit(50)),
  );
  return snap.docs.map(contributionRow).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Admin review queue: pending submissions, oldest first. */
export async function loadContributionReviewQueue(db: Firestore): Promise<QpgContributionRow[]> {
  const snap = await getDocs(
    query(collection(db, 'qpgContributions'), where('status', '==', 'pending_review'), limit(20)),
  );
  return snap.docs.map(contributionRow).sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
}

/** Find a contribution by its coupon code (admin coupon check). */
export async function loadContributionByCoupon(
  db: Firestore,
  couponCode: string,
): Promise<QpgContributionRow | null> {
  const snap = await getDocs(
    query(collection(db, 'qpgContributions'), where('couponCode', '==', couponCode.trim().toUpperCase()), limit(1)),
  );
  return snap.docs.length > 0 ? contributionRow(snap.docs[0]) : null;
}

/** Admin decision on one contribution (one batched write: the
 *  contribution + the contributor stats + the coupon). Never
 *  auto-approves — this function is only called from the admin queue.
 *  Approval does NOT publish the question itself: the question enters
 *  the verified pool through the existing verified-question write
 *  path (moderator-only), with contributor attribution. */
export async function decideQpgContribution(
  db: Firestore,
  args: {
    contributionId: string;
    adminUid: string;
    decision: 'approved' | 'rejected';
    rejectReason?: QpgContributionRejectReason;
    rejectNote?: string;
    now?: Date;
  },
): Promise<void> {
  const ref = doc(db, 'qpgContributions', args.contributionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Submission not found.');
  const contribution = contributionRow(snap as QueryDocumentSnapshot<DocumentData>);
  if (contribution.status !== 'pending_review') throw new Error('Submission is already decided.');
  if (args.decision === 'rejected' && !args.rejectReason) {
    throw new Error('A reject reason is required.');
  }
  const statsRef = doc(db, 'qpgContributorStats', contribution.contributorUid);
  const statsSnap = await getDoc(statsRef);
  const stats = (statsSnap.exists() ? statsSnap.data() : null) as Partial<QpgContributorStatsDoc> | null;
  const base = {
    approved: stats?.approved ?? 0,
    points: stats?.points ?? 0,
  };
  const batch = writeBatch(db);
  if (args.decision === 'approved') {
    const outcome = contributionApprovalFor(base, args.now ?? new Date());
    batch.update(ref, {
      status: 'approved',
      reviewedByUid: args.adminUid,
      reviewedAt: serverTimestamp(),
      pointsAwarded: outcome.pointsAwarded,
      couponCode: outcome.couponCode,
      couponExpiresAt: outcome.couponExpiresAt,
    });
    batch.set(
      statsRef,
      {
        uid: contribution.contributorUid,
        displayName: contribution.contributorName,
        institution: contribution.institution,
        totalSubmitted: stats?.totalSubmitted ?? 0,
        approved: outcome.newStats.approved,
        rejected: stats?.rejected ?? 0,
        points: outcome.newStats.points,
        level: outcome.newStats.level,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    batch.update(ref, {
      status: 'rejected',
      reviewedByUid: args.adminUid,
      reviewedAt: serverTimestamp(),
      rejectReason: args.rejectReason,
      ...(args.rejectNote ? { rejectNote: args.rejectNote } : {}),
    });
    batch.set(
      statsRef,
      {
        uid: contribution.contributorUid,
        displayName: contribution.contributorName,
        institution: contribution.institution,
        totalSubmitted: stats?.totalSubmitted ?? 0,
        approved: stats?.approved ?? 0,
        rejected: (stats?.rejected ?? 0) + 1,
        points: stats?.points ?? 0,
        level: stats?.level ?? 'নবীন',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
  await batch.commit();
}

/** Leaderboard: top contributors by points (public read, top 20). */
export async function loadQpgLeaderboard(db: Firestore): Promise<QpgContributorStatsDoc[]> {
  const snap = await getDocs(query(collection(db, 'qpgContributorStats'), limit(20)));
  const rows = snap.docs.map((d) => docData<QpgContributorStatsDoc>(d));
  return rows.sort((a, b) => b.points - a.points || b.approved - a.approved).slice(0, 20);
}

// ---------------------------------------------------------------------
// Custom orders — qpgCustomOrders (tracking only; fulfilment stays human).
// ---------------------------------------------------------------------

export async function submitQpgCustomOrder(
  db: Firestore,
  order: QpgCustomOrderDoc,
): Promise<string> {
  const ref = await addDoc(collection(db, 'qpgCustomOrders'), {
    ...order,
    submittedAt: serverTimestamp(),
  });
  return ref.id;
}

export interface QpgCustomOrderRow extends QpgCustomOrderDoc {
  id: string;
}

function customOrderRow(snap: QueryDocumentSnapshot<DocumentData>): QpgCustomOrderRow {
  const d = snap.data() as Record<string, unknown>;
  return {
    id: snap.id,
    uid: String(d.uid ?? ''),
    buyerName: String(d.buyerName ?? ''),
    buyerWhatsapp: d.buyerWhatsapp ? String(d.buyerWhatsapp) : undefined,
    className: String(d.className ?? ''),
    subject: String(d.subject ?? ''),
    chapters: String(d.chapters ?? ''),
    questionTypes: String(d.questionTypes ?? ''),
    totalMarks: Number(d.totalMarks ?? 0),
    markDistribution: String(d.markDistribution ?? ''),
    examTitle: String(d.examTitle ?? ''),
    institutionName: String(d.institutionName ?? ''),
    dateNeeded: String(d.dateNeeded ?? ''),
    instructions: String(d.instructions ?? ''),
    priceBdt: Number(d.priceBdt ?? 0),
    trxId: d.trxId ? String(d.trxId) : undefined,
    status: d.status as QpgCustomOrderStatus,
    source: (d.source as QpgCustomOrderDoc['source']) ?? 'onsite',
    submittedAt: qpgTsToIso(d.submittedAt),
    paidAt: d.paidAt ? qpgTsToIso(d.paidAt) : undefined,
    deliveredAt: d.deliveredAt ? qpgTsToIso(d.deliveredAt) : undefined,
    updatedByUid: d.updatedByUid ? String(d.updatedByUid) : undefined,
  };
}

export async function loadMyQpgCustomOrders(
  db: Firestore,
  uid: string,
): Promise<QpgCustomOrderRow[]> {
  const snap = await getDocs(
    query(collection(db, 'qpgCustomOrders'), where('uid', '==', uid), limit(50)),
  );
  return snap.docs.map(customOrderRow).sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

/** Admin queue: all custom orders, newest first (status filter is
 *  applied in the page — one query, no composite index). */
export async function loadCustomOrderQueue(db: Firestore): Promise<QpgCustomOrderRow[]> {
  const snap = await getDocs(query(collection(db, 'qpgCustomOrders'), limit(50)));
  return snap.docs.map(customOrderRow).sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

/** Admin delivery-status step (paid → building → delivered). Forward
 *  only, one step at a time; a delivered order never goes back. */
export async function updateCustomOrderStatus(
  db: Firestore,
  args: { orderId: string; to: QpgCustomOrderStatus; adminUid: string },
): Promise<void> {
  const ref = doc(db, 'qpgCustomOrders', args.orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Order not found.');
  const current = (snap.data() as Partial<QpgCustomOrderDoc>).status;
  if (!current || !canTransitionCustomOrder(current, args.to)) {
    throw new Error(`Cannot move a custom order from ${current ?? 'unknown'} to ${args.to}.`);
  }
  await updateDoc(ref, {
    status: args.to,
    updatedByUid: args.adminUid,
    ...(args.to === 'paid' ? { paidAt: serverTimestamp() } : {}),
    ...(args.to === 'delivered' ? { deliveredAt: serverTimestamp() } : {}),
  });
}
