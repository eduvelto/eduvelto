// Eduvelto — Job circulars ADMIN (Step 15): data operations for
// the admin verification workflow.
//
// What this module does:
// - Admin list/queue loads (moderator reads; one == filter + limit,
//   client-side sort — the Step 14 pattern; no composite index).
// - Create / edit / submit / verify / publish / unpublish /
//   delete flows for circulars, all through the Step 14 rules
//   (moderator create/update within the 25-key allowlist;
//   delete is Admin-only).
// - The verification checklist (7 evidence-based results —
//   ChatGPT) and the no-self-approval guard (ChatGPT canApprove:
//   verifier AND createdBy != uid AND lastEditedBy != uid;
//   submittedBy ≡ lastEditedBy at submit time in our model).
// - Sensitive-field diff → circularHistory entries (append-only,
//   per-field audit trail) + adminActions entries (the admin
//   action audit that already exists — zero new rules).
// - Duplicate detection (client-side, surface-only — never
//   auto-delete, never auto-merge).
//
// HONESTY (binding):
// - A circular entered here is NOT verified until a verifier
//   completes the checklist and approves that revision.
//   Verified ≠ published: 'verified' means the facts were
//   checked; 'published' means students can see it.
// - The checklist is enforced in this UI at approve time. The
//   Firestore rules do NOT re-check the ticks (compiled-rules
//   margin ≈ 100 bytes after the Step 15 delta — a rules-side
//   check is a post-refactor follow-up, recorded in the report).
//   That is the documented limit of this React-only workflow
//   (ChatGPT's qualification): a carefully controlled small-team
//   workflow, not a tamper-proof compliance system.
// - A student report NEVER writes to a circular (see
//   jobReports.ts). A deadline change NEVER overwrites silently:
//   the old value is kept in circularHistory (and in the
//   adminActions before/after) before the new value is written.
// - circularHistory writes are best-effort: their rules are
//   DEPLOY-BLOCKED until the public-ID refactor (see
//   firestore.rules). If the write is denied, the admin action
//   still completes (the adminActions entry is the audit that
//   landed) and the caller is told the history entry is pending
//   — never silently dropped.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { logAdminAction } from './admin';
import {
  circularFromStored,
  circularTimestampToMillis,
  firstBlockingChecklistItem,
  isVerificationChecklistComplete,
  validateCircular,
  type JobCircular,
  type VerificationChecklist,
} from './jobCirculars';
import { addCircularHistoryEntry, type CircularHistoryField } from './jobCircularHistory';
import { checkOfficialDomain, KNOWN_OFFICIAL_DOMAINS, type ApprovedDomainEntry } from './jobOfficialDomains';

export const ADMIN_CIRCULARS_PAGE_SIZE = 25;
export const ADMIN_CIRCULARS_COUNT_CAP = 100;

/** Sensitive fields — a change to any of these on a PUBLISHED
 * circular must create a circularHistory entry (ChatGPT's audit
 * list, adapted to our stored fields; category-wise vacancy
 * breakdowns do not exist as stored fields, so totalPosts is the
 * audited vacancy field). */
export const SENSITIVE_CIRCULAR_FIELDS: CircularHistoryField[] = [
  'applicationDeadline',
  'officialUrl',
  'applyUrl',
  'totalPosts',
  'reviewStatus',
  'examDate',
  'applicationStartDate',
];

export const SENSITIVE_FIELD_BN: Record<CircularHistoryField, string> = {
  applicationDeadline: 'আবেদনের শেষ তারিখ',
  officialUrl: 'অফিসিয়াল বিজ্ঞপ্তির লিংক',
  applyUrl: 'আবেদনের লিংক',
  totalPosts: 'পদসংখ্যা',
  reviewStatus: 'যাচাইয়ের অবস্থা',
  examDate: 'পরীক্ষার তারিখ',
  applicationStartDate: 'আবেদন শুরুর তারিখ',
  duplicateOf: 'ডুপ্লিকেট হিসেবে যুক্ত',
  correctionOf: 'সংশোধন হিসেবে যুক্ত',
  extensionOf: 'সময়-বৃদ্ধি হিসেবে যুক্ত',
  relatedTo: 'সম্পর্কিত বিজ্ঞপ্তি হিসেবে যুক্ত',
};

/** Stored-field accessors for the diff (timestamps → millis,
 * everything else → its raw value). */
function storedFieldValue(c: JobCircular, field: CircularHistoryField): string | null {
  switch (field) {
    case 'applicationDeadline':
      return c.applicationDeadlineMillis === null ? null : String(c.applicationDeadlineMillis);
    case 'officialUrl':
      return c.officialUrl;
    case 'applyUrl':
      return c.applyUrl;
    case 'totalPosts':
      return c.totalPosts === null ? null : String(c.totalPosts);
    case 'reviewStatus':
      return c.reviewStatus;
    case 'examDate':
      return c.examDateMillis === null ? null : String(c.examDateMillis);
    case 'applicationStartDate':
      return c.applicationStartDateMillis === null ? null : String(c.applicationStartDateMillis);
  }
  // Relationship fields (duplicateOf / correctionOf / ...) are
  // recorded as history entries, never diffed from a snapshot.
  return null;
}

export interface SensitiveFieldChange {
  field: CircularHistoryField;
  previousValue: string | null;
  newValue: string | null;
}

/** Pure diff of the sensitive fields between two circular
 * snapshots. The caller writes one circularHistory entry per
 * change (plus one adminActions entry for the whole action). */
export function diffSensitiveCircularFields(before: JobCircular, after: JobCircular): SensitiveFieldChange[] {
  const out: SensitiveFieldChange[] = [];
  for (const field of SENSITIVE_CIRCULAR_FIELDS) {
    const prev = storedFieldValue(before, field);
    const next = storedFieldValue(after, field);
    if (prev !== next) out.push({ field, previousValue: prev, newValue: next });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Admin list / queue
// ---------------------------------------------------------------------------

export type AdminCircularTab = 'pending' | 'returned' | 'draft' | 'verified' | 'published' | 'rejected' | 'all';

/** reviewStatus values behind each queue tab. 'pending' is the
 * verification queue (in-review); 'returned' is a draft the
 * verifier sent back WITH a reviewNote (changes requested —
 * ChatGPT's state, expressed on our reviewStatus + reviewNote,
 * not a third status field). */
export const ADMIN_TAB_STATUSES: Record<AdminCircularTab, string[] | null> = {
  pending: ['in-review'],
  returned: ['draft'],
  draft: ['draft'],
  verified: ['verified'],
  published: ['published'],
  rejected: ['rejected'],
  all: null,
};

export interface AdminCircularPage {
  items: JobCircular[];
  cursor: DocumentSnapshot | null;
  hasMore: boolean;
}

/** One page of circulars for the admin queue, optionally for one
 * reviewStatus. Moderator-only read (the rules deny students).
 * 'returned' filters client-side to drafts WITH a reviewNote. */
export async function listAdminCirculars(args?: {
  reviewStatus?: string | null;
  returnedOnly?: boolean;
  pageSize?: number;
  cursor?: DocumentSnapshot | null;
}): Promise<AdminCircularPage> {
  const firestore = db;
  if (!firestore) return { items: [], cursor: null, hasMore: false };
  const size = args?.pageSize ?? ADMIN_CIRCULARS_PAGE_SIZE;
  const constraints = [];
  if (args?.reviewStatus) constraints.push(where('reviewStatus', '==', args.reviewStatus));
  const q =
    args?.cursor != null
      ? query(collection(firestore, 'circulars'), ...constraints, startAfter(args.cursor), limit(size + 1))
      : query(collection(firestore, 'circulars'), ...constraints, limit(size + 1));
  const snap = await getDocs(q);
  let items: JobCircular[] = [];
  for (const d of snap.docs) {
    const c = circularFromStored(d.id, d.data() as Record<string, unknown>);
    if (c !== null) items.push(c);
  }
  if (args?.returnedOnly) items = items.filter((c) => c.reviewNote !== null && c.reviewNote.trim().length > 0);
  // Newest updated first (client-side — no orderBy, no index).
  items.sort((a, b) => (b.updatedAtMillis ?? -1) - (a.updatedAtMillis ?? -1));
  const hasMore = snap.docs.length > size;
  const pageDocs = hasMore ? snap.docs.slice(0, size) : snap.docs;
  return { items: items.slice(0, size), cursor: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null, hasMore };
}

/** Queue counts for the admin hub tiles: ONE query (limit 100),
 * grouped client-side by reviewStatus. Counts are exact up to
 * the cap; beyond it the tile says "১০০+" (never a guessed
 * number). */
export async function loadAdminCircularCounts(): Promise<{
  pending: number;
  returned: number;
  draft: number;
  verified: number;
  published: number;
  rejected: number;
  total: number;
  capped: boolean;
}> {
  const firestore = db;
  const zero = { pending: 0, returned: 0, draft: 0, verified: 0, published: 0, rejected: 0, total: 0, capped: false };
  if (!firestore) return zero;
  const snap = await getDocs(query(collection(firestore, 'circulars'), limit(ADMIN_CIRCULARS_COUNT_CAP)));
  const counts = { ...zero, capped: snap.docs.length >= ADMIN_CIRCULARS_COUNT_CAP };
  for (const d of snap.docs) {
    const c = circularFromStored(d.id, d.data() as Record<string, unknown>);
    if (!c) continue;
    counts.total += 1;
    if (c.reviewStatus === 'in-review') counts.pending += 1;
    else if (c.reviewStatus === 'draft') {
      if (c.reviewNote !== null && c.reviewNote.trim().length > 0) counts.returned += 1;
      else counts.draft += 1;
    } else if (c.reviewStatus === 'verified') counts.verified += 1;
    else if (c.reviewStatus === 'published') counts.published += 1;
    else if (c.reviewStatus === 'rejected') counts.rejected += 1;
  }
  return counts;
}

/** Load one circular for the admin editor (any reviewStatus —
 * moderator read). Null when missing/invalid. */
export async function loadAdminCircular(circularId: string): Promise<JobCircular | null> {
  const firestore = db;
  if (!firestore) return null;
  const snap = await getDoc(doc(firestore, 'circulars', circularId));
  if (!snap.exists()) return null;
  return circularFromStored(snap.id, snap.data() as Record<string, unknown>);
}

/** Same-exam circulars for duplicate detection (one == filter +
 * limit, client-side sort — no composite index). */
export async function listAdminCircularsByExam(examSlug: string): Promise<JobCircular[]> {
  const firestore = db;
  if (!firestore) return [];
  const snap = await getDocs(
    query(collection(firestore, 'circulars'), where('examSlug', '==', examSlug), limit(50)),
  );
  const out: JobCircular[] = [];
  for (const d of snap.docs) {
    const c = circularFromStored(d.id, d.data() as Record<string, unknown>);
    if (c !== null) out.push(c);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Create / edit
// ---------------------------------------------------------------------------

export interface CircularFormData {
  examSlug: string;
  postTitleBn: string;
  postTitleEn: string;
  circularNumber: string | null;
  publishedDateMillis: number | null;
  applicationDeadlineMillis: number | null;
  deadlinePrecision: 'date_only' | 'datetime';
  totalPosts: number | null;
  eligibilitySummaryBn: string;
  eligibilitySummaryEn: string;
  officialUrl: string;
  applyUrl: string | null;
  copyStatus: 'stored' | 'link-only';
  copyTextExcerpt: string | null;
  examDateMillis: number | null;
  applicationStartDateMillis: number | null;
}

function formToStored(form: CircularFormData, uid: string, now: unknown): Record<string, unknown> {
  return {
    examSlug: form.examSlug,
    postTitleBn: form.postTitleBn,
    postTitleEn: form.postTitleEn,
    circularNumber: form.circularNumber,
    publishedDate: form.publishedDateMillis === null ? null : new Date(form.publishedDateMillis),
    applicationDeadline: form.applicationDeadlineMillis === null ? null : new Date(form.applicationDeadlineMillis),
    deadlinePrecision: form.deadlinePrecision,
    totalPosts: form.totalPosts,
    eligibilitySummaryBn: form.eligibilitySummaryBn,
    eligibilitySummaryEn: form.eligibilitySummaryEn,
    officialUrl: form.officialUrl,
    applyUrl: form.applyUrl,
    copyStatus: form.copyStatus,
    copyTextExcerpt: form.copyTextExcerpt,
    reviewStatus: 'draft',
    verifiedBy: null,
    verifiedAt: null,
    examDate: form.examDateMillis === null ? null : new Date(form.examDateMillis),
    applicationStartDate: form.applicationStartDateMillis === null ? null : new Date(form.applicationStartDateMillis),
    authorId: uid,
    createdAt: now,
    updatedAt: now,
    verificationChecklist: null,
    reviewNote: null,
    lastEditedBy: uid,
  };
}

/** Validate a create/edit form client-side (mirrors
 * validateCircular, but on the form shape before conversion). */
export function validateCircularForm(form: CircularFormData): string[] {
  const problems: string[] = [];
  if (form.examSlug.trim().length === 0) problems.push('পরীক্ষা বাছাই করুন।');
  if (form.postTitleBn.trim().length === 0) problems.push('পদের নাম (বাংলা) লিখুন।');
  if (form.postTitleEn.trim().length === 0) problems.push('পদের নাম (English) লিখুন।');
  if (form.officialUrl.trim().length === 0) problems.push('অফিসিয়াল বিজ্ঞপ্তির লিংক দিন।');
  else if (checkOfficialDomain(form.officialUrl).kind === 'invalid') problems.push('অফিসিয়াল লিংকটি সঠিক URL নয়।');
  if (form.eligibilitySummaryBn.trim().length === 0) problems.push('যোগ্যতার সারাংশ (বাংলা) লিখুন।');
  if (form.eligibilitySummaryEn.trim().length === 0) problems.push('যোগ্যতার সারাংশ (English) লিখুন।');
  if (form.totalPosts !== null && (!Number.isInteger(form.totalPosts) || form.totalPosts < 0)) {
    problems.push('পদসংখ্যা একটি পূর্ণ সংখ্যা হতে হবে, অথবা ফাঁকা রাখুন (উল্লেখ নেই)।');
  }
  if (
    form.applicationDeadlineMillis !== null &&
    form.applicationStartDateMillis !== null &&
    form.applicationDeadlineMillis < form.applicationStartDateMillis
  ) {
    problems.push('আবেদনের শেষ তারিখ শুরুর তারিখের আগে হতে পারে না।');
  }
  return problems;
}

export async function createAdminCircular(
  form: CircularFormData,
  uid: string,
): Promise<{ docId: string; historyPending: false }> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  const problems = validateCircularForm(form);
  if (problems.length > 0) throw new Error(problems[0]);
  const ref = doc(collection(firestore, 'circulars'));
  const data = formToStored(form, uid, serverTimestamp());
  const ruleProblems = validateCircular(data, ref.id);
  if (ruleProblems.length > 0) throw new Error(ruleProblems[0]);
  await setDoc(ref, data);
  return { docId: ref.id, historyPending: false };
}

export interface AdminWriteResult {
  /** True when the circularHistory entries could NOT be written
   * (their rules are not live yet) — the admin action itself
   * succeeded and the adminActions entry landed; the history
   * must be backfilled after the rules deploy. */
  historyPending: boolean;
}

async function writeHistoryEntries(
  circularId: string,
  changes: SensitiveFieldChange[],
  uid: string,
  sourceId: string | null,
): Promise<boolean> {
  if (changes.length === 0) return false;
  try {
    for (const ch of changes) {
      await addCircularHistoryEntry({
        circularId,
        fieldChanged: ch.field,
        previousValue: ch.previousValue,
        newValue: ch.newValue,
        sourceId,
        changedBy: uid,
        note: null,
      });
    }
    return false;
  } catch {
    // DEPLOY-BLOCKED rules (see module header): the history is
    // pending, not lost — the adminActions entry below is the
    // audit that landed.
    return true;
  }
}

/** Edit a draft/in-review/verified circular (NOT a published one
 * through this path — published edits go through
 * updatePublishedCircular so the history + audit are explicit).
 * Returns the updated snapshot + whether history is pending. */
export async function updateAdminCircular(
  before: JobCircular,
  form: CircularFormData,
  uid: string,
  opts?: { resetToDraft?: boolean },
): Promise<{ circular: JobCircular; historyPending: boolean }> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  const problems = validateCircularForm(form);
  if (problems.length > 0) throw new Error(problems[0]);
  const stored = formToStored(form, uid, serverTimestamp());
  // Keep the editorial state the form does not own — except a
  // rejected circular edited again goes back to draft (the
  // rejection reason is cleared; the rejection itself stays in
  // the adminActions audit log).
  stored.reviewStatus = opts?.resetToDraft ? 'draft' : before.reviewStatus;
  stored.verifiedBy = before.verifiedBy;
  stored.verifiedAt = before.verifiedAtMillis === null ? null : new Date(before.verifiedAtMillis);
  stored.createdAt = before.createdAtMillis === null ? serverTimestamp() : new Date(before.createdAtMillis);
  stored.verificationChecklist =
    before.verificationChecklist === null
      ? null
      : {
          ...before.verificationChecklist,
          checkedAt:
            before.verificationChecklist.checkedAtMillis === null
              ? null
              : new Date(before.verificationChecklist.checkedAtMillis),
        };
  stored.reviewNote = opts?.resetToDraft ? null : before.reviewNote;
  const ruleProblems = validateCircular(stored, before.docId);
  if (ruleProblems.length > 0) throw new Error(ruleProblems[0]);
  await updateDoc(doc(firestore, 'circulars', before.docId), stored);
  const after = await loadAdminCircular(before.docId);
  if (!after) throw new Error('Circular could not be re-read after saving.');
  const changes = diffSensitiveCircularFields(before, after);
  const historyPending = await writeHistoryEntries(before.docId, changes, uid, null);
  return { circular: after, historyPending };
}

// ---------------------------------------------------------------------------
// Verification workflow
// ---------------------------------------------------------------------------

/** No-self-approval (ChatGPT canApprove): the verifier must not
 * be the author, the last editor, or (equivalently in our model)
 * the submitter. The OWNER may override with an explicit reason
 * (Gemini: only a super_admin can bypass, with overrideReason)
 * — a one-person team would otherwise deadlock, and the override
 * is recorded in the audit log, never silent. */
export function canApproveCircular(
  circular: JobCircular,
  uid: string,
  isOwner: boolean,
  overrideReason: string | null,
): { allowed: boolean; reasonBn: string | null } {
  const selfEdit = circular.authorId === uid || circular.lastEditedBy === uid;
  if (!selfEdit) return { allowed: true, reasonBn: null };
  if (isOwner && overrideReason !== null && overrideReason.trim().length >= 10) {
    return { allowed: true, reasonBn: null };
  }
  if (isOwner) {
    return {
      allowed: false,
      reasonBn: 'আপনি এই বিজ্ঞপ্তির লেখক/সর্বশেষ সম্পাদক — নিজের কাজ নিজে অনুমোদন করতে কমপক্ষে ১০ অক্ষরের কারণ লিখুন (মালিকের ওভাররাইড)।',
    };
  }
  return {
    allowed: false,
    reasonBn: 'আপনি এই বিজ্ঞপ্তির লেখক/সর্বশেষ সম্পাদক — নিজের কাজ নিজে অনুমোদন করা যায় না। অন্য যাচাইকারীকে দিন।',
  };
}

/** Submit a draft for verification (draft → in-review). */
export async function submitCircularForVerification(
  circular: JobCircular,
  uid: string,
): Promise<AdminWriteResult> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (circular.reviewStatus !== 'draft') throw new Error('শুধু খসড়া বিজ্ঞপ্তি যাচাইয়ের জন্য পাঠানো যায়।');
  await updateDoc(doc(firestore, 'circulars', circular.docId), {
    reviewStatus: 'in-review',
    reviewNote: null,
    lastEditedBy: uid,
    updatedAt: serverTimestamp(),
  });
  const after = (await loadAdminCircular(circular.docId)) ?? circular;
  const changes = diffSensitiveCircularFields(circular, after);
  const historyPending = await writeHistoryEntries(circular.docId, changes, uid, null);
  return { historyPending };
}

/** Approve (in-review → verified). Requires a complete
 * checklist, a verification note, and the no-self-approval
 * guard (or an owner override reason). The approval is tied to
 * this revision: the checklist + checkedBy + checkedAt are
 * stored on the doc, and the note goes into the audit log. */
export async function approveCircular(
  circular: JobCircular,
  checklist: VerificationChecklist,
  verificationNote: string,
  uid: string,
  isOwner: boolean,
  overrideReason: string | null,
): Promise<AdminWriteResult> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (circular.reviewStatus !== 'in-review') throw new Error('শুধু যাচাইয়ের অপেক্ষায় থাকা বিজ্ঞপ্তি অনুমোদন করা যায়।');
  if (!isVerificationChecklistComplete(checklist)) {
    const blocking = firstBlockingChecklistItem(checklist);
    throw new Error(
      blocking
        ? `চেকলিস্ট অসম্পূর্ণ — “${blocking}” এখনো উত্তীর্ণ/প্রযোজ্য-নয় হয়নি।`
        : 'চেকলিস্ট অসম্পূর্ণ — সব আইটেম উত্তীর্ণ বা প্রযোজ্য-নয় হতে হবে।',
    );
  }
  if (verificationNote.trim().length < 10) throw new Error('যাচাইয়ের নোট কমপক্ষে ১০ অক্ষরের হতে হবে।');
  const guard = canApproveCircular(circular, uid, isOwner, overrideReason);
  if (!guard.allowed) throw new Error(guard.reasonBn ?? 'অনুমোদন করা যাচ্ছে না।');
  const storedChecklist = {
    ...checklist,
    checkedBy: uid,
    checkedAt: serverTimestamp(),
  };
  await updateDoc(doc(firestore, 'circulars', circular.docId), {
    reviewStatus: 'verified',
    verifiedBy: uid,
    verifiedAt: serverTimestamp(),
    verificationChecklist: storedChecklist,
    reviewNote: null,
    lastEditedBy: uid,
    updatedAt: serverTimestamp(),
  });
  const details = overrideReason
    ? `যাচাইকৃত (মালিকের ওভাররাইড — ${overrideReason.trim()}). নোট: ${verificationNote.trim()}`
    : `যাচাইকৃত। নোট: ${verificationNote.trim()}`;
  await logAdminAction(firestore, 'job-content-verified', details, circular.docId, {
    after: 'verified',
    reason: verificationNote.trim().slice(0, 500),
  });
  const after = (await loadAdminCircular(circular.docId)) ?? circular;
  const changes = diffSensitiveCircularFields(circular, after);
  const historyPending = await writeHistoryEntries(circular.docId, changes, uid, null);
  return { historyPending };
}

/** Request changes (in-review → draft + reviewNote). The draft
 * and its evidence are kept — rejection/return never deletes. */
export async function returnCircularForChanges(
  circular: JobCircular,
  reviewNote: string,
  uid: string,
): Promise<AdminWriteResult> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (circular.reviewStatus !== 'in-review') throw new Error('শুধু যাচাইয়ের অপেক্ষায় থাকা বিজ্ঞপ্তি ফেরত পাঠানো যায়।');
  if (reviewNote.trim().length < 10) throw new Error('ফেরত পাঠানোর কারণ কমপক্ষে ১০ অক্ষরের হতে হবে।');
  await updateDoc(doc(firestore, 'circulars', circular.docId), {
    reviewStatus: 'draft',
    reviewNote: reviewNote.trim(),
    lastEditedBy: uid,
    updatedAt: serverTimestamp(),
  });
  await logAdminAction(firestore, 'job-content-returned', `সংশোধনের জন্য ফেরত: ${reviewNote.trim()}`, circular.docId, {
    after: 'draft',
    reason: reviewNote.trim().slice(0, 500),
  });
  const after = (await loadAdminCircular(circular.docId)) ?? circular;
  const changes = diffSensitiveCircularFields(circular, after);
  const historyPending = await writeHistoryEntries(circular.docId, changes, uid, null);
  return { historyPending };
}

/** Publish a verified circular (verified → published). Only the
 * approved revision publishes — the checklist stored on the doc
 * is the approval record. */
export async function publishCircular(circular: JobCircular, uid: string): Promise<AdminWriteResult> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (circular.reviewStatus !== 'verified') throw new Error('শুধু যাচাইকৃত বিজ্ঞপ্তি প্রকাশ করা যায়।');
  if (!circular.verifiedBy) throw new Error('যাচাইকারীর তথ্য ছাড়া প্রকাশ করা যায় না।');
  await updateDoc(doc(firestore, 'circulars', circular.docId), {
    reviewStatus: 'published',
    lastEditedBy: uid,
    updatedAt: serverTimestamp(),
  });
  await logAdminAction(firestore, 'job-content-published', 'বিজ্ঞপ্তি প্রকাশিত।', circular.docId, { after: 'published' });
  const after = (await loadAdminCircular(circular.docId)) ?? circular;
  const changes = diffSensitiveCircularFields(circular, after);
  const historyPending = await writeHistoryEntries(circular.docId, changes, uid, null);
  return { historyPending };
}

/** Unpublish (published/verified → rejected). The doc stays in
 * the admin history — unpublishing never deletes. */
export async function unpublishCircular(
  circular: JobCircular,
  reason: string,
  uid: string,
): Promise<AdminWriteResult> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (circular.reviewStatus !== 'published' && circular.reviewStatus !== 'verified') {
    throw new Error('শুধু প্রকাশিত বা যাচাইকৃত বিজ্ঞপ্তি প্রত্যাহার করা যায়।');
  }
  if (reason.trim().length < 10) throw new Error('প্রত্যাহারের কারণ কমপক্ষে ১০ অক্ষরের হতে হবে।');
  await updateDoc(doc(firestore, 'circulars', circular.docId), {
    reviewStatus: 'rejected',
    reviewNote: reason.trim(),
    lastEditedBy: uid,
    updatedAt: serverTimestamp(),
  });
  await logAdminAction(firestore, 'job-content-unpublished', `প্রত্যাহার: ${reason.trim()}`, circular.docId, {
    after: 'rejected',
    reason: reason.trim().slice(0, 500),
  });
  const after = (await loadAdminCircular(circular.docId)) ?? circular;
  const changes = diffSensitiveCircularFields(circular, after);
  const historyPending = await writeHistoryEntries(circular.docId, changes, uid, null);
  return { historyPending };
}

/** Reject outright (in-review → rejected). The draft and its
 * evidence stay in the admin history — rejection never deletes. */
export async function rejectCircular(
  circular: JobCircular,
  reason: string,
  uid: string,
): Promise<AdminWriteResult> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (circular.reviewStatus !== 'in-review') throw new Error('শুধু যাচাইয়ের অপেক্ষায় থাকা বিজ্ঞপ্তি বাতিল করা যায়।');
  if (reason.trim().length < 10) throw new Error('বাতিলের কারণ কমপক্ষে ১০ অক্ষরের হতে হবে।');
  await updateDoc(doc(firestore, 'circulars', circular.docId), {
    reviewStatus: 'rejected',
    reviewNote: reason.trim(),
    lastEditedBy: uid,
    updatedAt: serverTimestamp(),
  });
  await logAdminAction(firestore, 'job-content-returned', `বাতিল: ${reason.trim()}`, circular.docId, {
    after: 'rejected',
    reason: reason.trim().slice(0, 500),
  });
  const after = (await loadAdminCircular(circular.docId)) ?? circular;
  const changes = diffSensitiveCircularFields(circular, after);
  const historyPending = await writeHistoryEntries(circular.docId, changes, uid, null);
  return { historyPending };
}

/** Delete a circular (Admin only — the rules enforce isAdmin).
 * Only for wrongly created docs; the audit entry
 * 'job-content-deleted' is written FIRST so the deletion is
 * never traceless. The caller must confirm with the typed
 * reason (≥10 chars). */
export async function deleteCircular(
  circular: JobCircular,
  reason: string,
  // Kept for call-site symmetry with the other workflow
  // functions; the audit entry's actor comes from the signed-in
  // user inside logAdminAction (getActorUid).
  _uid: string,
): Promise<void> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (reason.trim().length < 10) throw new Error('মোছার কারণ কমপক্ষে ১০ অক্ষরের হতে হবে।');
  await logAdminAction(
    firestore,
    'job-content-deleted',
    `বিজ্ঞপ্তি মোছা হয়েছে (${circular.postTitleBn} — ${circular.examSlug}): ${reason.trim()}`,
    circular.docId,
    { before: circular.reviewStatus, reason: reason.trim().slice(0, 500) },
  );
  await deleteDoc(doc(firestore, 'circulars', circular.docId));
}

/** Update a PUBLISHED circular's facts (e.g. an official
 * deadline extension). The original values are preserved in
 * circularHistory BEFORE the write (never silently replaced),
 * and the change needs a reason + the official source URL.
 * The circular stays published; its "সর্বশেষ হালনাগাদ" date
 * tells students it changed. */
export async function updatePublishedCircular(
  before: JobCircular,
  form: CircularFormData,
  reason: string,
  sourceUrl: string,
  uid: string,
): Promise<{ circular: JobCircular; historyPending: boolean }> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (before.reviewStatus !== 'published') throw new Error('শুধু প্রকাশিত বিজ্ঞপ্তির তথ্য এভাবে বদলানো যায়।');
  if (reason.trim().length < 10) throw new Error('পরিবর্তনের কারণ কমপক্ষে ১০ অক্ষরের হতে হবে।');
  if (sourceUrl.trim().length === 0) throw new Error('পরিবর্তনের অফিসিয়াল উৎসের লিংক দিন।');
  const { circular, historyPending } = await updateAdminCircular(before, form, uid);
  await logAdminAction(
    firestore,
    'job-content-unpublished',
    `প্রকাশিত বিজ্ঞপ্তি হালনাগাদ: ${reason.trim()} (উৎস: ${sourceUrl.trim()})`,
    before.docId,
    { after: 'published', reason: reason.trim().slice(0, 500) },
  );
  return { circular, historyPending };
}

// ---------------------------------------------------------------------------
// Duplicate detection (surface-only — never auto-delete/merge)
// ---------------------------------------------------------------------------

/** Normalised dedupe key (Gemini primary key, adapted: our
 * circulars have no separate org field, so examSlug stands in
 * for the org code — the exam IS the recruiting stream here;
 * ChatGPT's hash(organizationId | reference) maps to the same
 * shape). Null when no circular number is stored. */
export function circularDedupeKey(c: {
  examSlug: string;
  circularNumber: string | null;
  publishedDateMillis: number | null;
}): string | null {
  if (!c.circularNumber || c.circularNumber.trim().length === 0) return null;
  const num = c.circularNumber.trim().toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]/g, '');
  const year =
    c.publishedDateMillis === null
      ? 'unknown'
      : String(new Date(c.publishedDateMillis).getUTCFullYear());
  return `${c.examSlug}__${num}__${year}`;
}

function titleTokens(titleBn: string, titleEn: string): Set<string> {
  const text = `${titleBn} ${titleEn}`.toLowerCase();
  const tokens = text.split(/[^a-z0-9\u0980-\u09ff]+/g).filter((t) => t.length >= 2);
  return new Set(tokens);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

export interface DuplicateCandidate {
  circular: JobCircular;
  /** 'exact-key' = same dedupe key; 'similar' = same exam +
   * similar title + deadline within ±7 days. */
  match: 'exact-key' | 'similar';
  detailBn: string;
}

const SEVEN_DAYS_MILLIS = 7 * 24 * 60 * 60 * 1000;

/** Find likely duplicates of a draft among already-stored
 * circulars (same-exam list, compared client-side). Returns
 * candidates only — a human decides: reject as duplicate, link
 * as a correction/reissue, or keep both (phased notices and
 * re-advertisements are legitimate separate posts). */
export function findDuplicateCirculars(
  draft: {
    examSlug: string;
    circularNumber: string | null;
    publishedDateMillis: number | null;
    postTitleBn: string;
    postTitleEn: string;
    applicationDeadlineMillis: number | null;
  },
  existing: JobCircular[],
  selfDocId: string | null = null,
): DuplicateCandidate[] {
  const out: DuplicateCandidate[] = [];
  const draftKey = circularDedupeKey(draft);
  const draftTokens = titleTokens(draft.postTitleBn, draft.postTitleEn);
  for (const c of existing) {
    if (selfDocId !== null && c.docId === selfDocId) continue;
    if (c.examSlug !== draft.examSlug) continue;
    const key = circularDedupeKey(c);
    if (draftKey !== null && key === draftKey) {
      out.push({
        circular: c,
        match: 'exact-key',
        detailBn: 'একই স্মারক নম্বর ও সাল — সম্ভাব্য ডুপ্লিকেট।',
      });
      continue;
    }
    const sim = jaccard(draftTokens, titleTokens(c.postTitleBn, c.postTitleEn));
    const deadlineClose =
      draft.applicationDeadlineMillis !== null &&
      c.applicationDeadlineMillis !== null &&
      Math.abs(draft.applicationDeadlineMillis - c.applicationDeadlineMillis) <= SEVEN_DAYS_MILLIS;
    if (sim >= 0.5 && deadlineClose) {
      out.push({
        circular: c,
        match: 'similar',
        detailBn: 'একই পরীক্ষা, মিলে যাওয়া শিরোনাম ও কাছাকাছি শেষ তারিখ — মিলিয়ে দেখুন।',
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Approved domains (admin-managed list — deferred rules)
// ---------------------------------------------------------------------------

export interface ApprovedDomainRow {
  docId: string;
  domain: string;
  organizationBn: string;
  organizationEn: string;
  category: string;
  status: 'active' | 'watch' | 'deprecated';
  notesBn: string | null;
  addedBy: string | null;
  updatedAtMillis: number | null;
}

export function approvedDomainFromStored(docId: string, data: Record<string, unknown>): ApprovedDomainRow | null {
  if (typeof data.domain !== 'string' || data.domain.trim().length === 0) return null;
  if (typeof data.organization !== 'string' || data.organization.trim().length === 0) return null;
  return {
    docId,
    domain: (data.domain as string).toLowerCase(),
    organizationBn: data.organization as string,
    organizationEn: data.organization as string,
    category: typeof data.examSlugs === 'string' ? (data.examSlugs as string) : '',
    status:
      data.status === 'watch' || data.status === 'deprecated' ? (data.status as 'watch' | 'deprecated') : 'active',
    notesBn: typeof data.notesBn === 'string' ? (data.notesBn as string) : null,
    addedBy: typeof data.addedBy === 'string' ? (data.addedBy as string) : null,
    updatedAtMillis: circularTimestampToMillis(data.updatedAt),
  };
}

/** Load the admin-managed domain list. When the rules are not
 * live yet the read is denied and this returns null — the caller
 * falls back to the v1 code list (KNOWN_OFFICIAL_DOMAINS) and
 * says so. Collection rows win over the code list when live. */
export async function listApprovedDomains(): Promise<ApprovedDomainRow[] | null> {
  const firestore = db;
  if (!firestore) return null;
  try {
    const snap = await getDocs(query(collection(firestore, 'approvedDomains'), limit(100)));
    const rows: ApprovedDomainRow[] = [];
    for (const d of snap.docs) {
      const r = approvedDomainFromStored(d.id, d.data() as Record<string, unknown>);
      if (r !== null) rows.push(r);
    }
    return rows;
  } catch {
    return null;
  }
}

/** The effective domain list for checks: collection rows when
 * the rules are live, otherwise the v1 code list. */
export function effectiveDomainList(collectionRows: ApprovedDomainRow[] | null): ApprovedDomainEntry[] {
  if (collectionRows === null) return KNOWN_OFFICIAL_DOMAINS;
  return collectionRows.map((r) => ({
    domain: r.domain,
    organizationBn: r.organizationBn,
    organizationEn: r.organizationEn,
    category: (['bcs', 'bank', 'primary', 'ntrca', 'other_govt'].includes(r.category)
      ? r.category
      : 'other_govt') as ApprovedDomainEntry['category'],
    status: r.status,
    notesBn: r.notesBn,
  }));
}

export interface NewApprovedDomain {
  domain: string;
  organization: string;
  examSlugs: string;
  addedBy: string;
}

/** Add a domain to the admin-managed list (Admin only — the
 * rules enforce isAdmin). A matching hostname is a supporting
 * trust signal, never proof a particular circular is genuine;
 * the verifier must still inspect the actual document. */
export async function createApprovedDomain(input: NewApprovedDomain): Promise<string> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  const domain = input.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (domain.length === 0 || domain.includes(' ') || !domain.includes('.')) {
    throw new Error('সঠিক ডোমেইন লিখুন (যেমন: bpsc.gov.bd)।');
  }
  if (input.organization.trim().length === 0) throw new Error('সংস্থার নাম লিখুন।');
  const ref = await addDoc(collection(firestore, 'approvedDomains'), {
    domain,
    organization: input.organization.trim(),
    examSlugs: input.examSlugs.trim(),
    addedBy: input.addedBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Change a domain's status (suspend = soft action — the
 * historical record is preserved, never hard-deleted). */
export async function setApprovedDomainStatus(
  row: ApprovedDomainRow,
  status: 'active' | 'watch' | 'deprecated',
): Promise<void> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  await updateDoc(doc(firestore, 'approvedDomains', row.docId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/** Hard-delete a domain row (Admin only, wrongly created rows
 * only — suspension is the normal action). */
export async function deleteApprovedDomain(row: ApprovedDomainRow): Promise<void> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  await deleteDoc(doc(firestore, 'approvedDomains', row.docId));
}
