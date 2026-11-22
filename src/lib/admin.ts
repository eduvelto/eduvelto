// Eduvelto — admin operations library (Owner Admin Dashboard only).
//
// Everything here runs from the dashboard in the owner's browser — no
// code, no console, no terminal. Every admin action writes one entry to
// the append-only `adminActions` audit log (who, what, when, before/after,
// reason). The Firestore rules are the enforcement layer; this module
// adds friendly code-level guards on top of them.
//
// OWNER PROTECTION (binding, spec §3): no action in this module can
// remove or downgrade the Owner account. The Owner's own document is
// excluded from suspend / role-change, and the 'owner' role is never
// offered as a choice. The rules enforce the same server-side — and the
// rules (not this code) are what stop an admin promoting themselves to
// owner by a direct Firestore call.
//
// HONEST LIMITS (shown in the dashboard, not hidden):
// - The dashboard controls what lives INSIDE the platform. Spending,
//   domain/DNS, app-store publishing, password/2FA and building NEW
//   features can never be done from any in-app dashboard — see
//   getExternalItems() and the spec (owner-admin-dashboard-spec).
// - Feature toggles are stored settings. A toggle takes effect only
//   once that feature's code reads the setting — turning a toggle on
//   does not magically build the feature. Category C flags
//   (live-classes, video-ads, paid-subscriptions) are HARD-BLOCKED in
//   setFeatureFlag() — they need the owner's separate approval.
// - Code guards are NOT security. The rules are. Where this module
//   cannot enforce something (e.g. the age of a user — there is no
//   date-of-birth field yet), it requires the owner's explicit
//   attestation and says so, instead of pretending to check.
// - The audit log is append-only and owner-readable only. Admins cannot
//   read it. Every action + its audit entry are written in ONE batch,
//   so an action cannot happen with no audit trail.
//
// REVIEW (20 Nov 2026, 7 specialist reviewers): the fixes from that
// review are marked "REVIEW" in the comments below. Known gaps left
// open on purpose are listed in the spec ("Review findings applied").

import { getAuth } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { UserRole } from './profile';
import {
  APP_VERSION_DOC,
  DEFAULT_DOWNLOAD_URL,
  compareVersions,
  isValidVersion,
} from './appVersion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminUserRow {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  /** Absent = active. Only an explicit false suspends. */
  isActive: boolean;
  suspendedReason?: string;
  verificationStatus?: string;
  createdAt: unknown;
  educationType?: string | null;
  institution?: string | null;
  program?: string | null;
  department?: string | null;
  classLevel?: string | null;
}

/** Human verification checklist — ALL four must be true before Approve. */
export interface VerificationChecks {
  identity: boolean;
  institution: boolean;
  subject: boolean;
  adult: boolean;
  evidenceRef?: string;
}

export interface VerificationRow {
  id: string;
  userId: string;
  fullName: string;
  institution: string;
  status: string;
  createdAt: unknown;
  checkedBy?: string;
  reason?: string;
  checks?: VerificationChecks;
  /** Any extra fields the application form stored. */
  extra: Record<string, unknown>;
}

export interface AuditRow {
  id: string;
  actorId: string;
  action: string;
  details?: string;
  targetId?: string;
  before?: string;
  after?: string;
  reason?: string;
  createdAt: unknown;
}

export interface DashboardCounts {
  users: number;
  pendingVerifications: number;
}

export interface UserContentRow {
  id: string;
  kind: 'post' | 'question';
  title: string;
  body: string;
  reviewStatus?: string;
  createdAt: unknown;
}

export interface UserReportRow {
  id: string;
  reason: string;
  status: string;
  targetType?: string;
  details?: string;
  createdAt: unknown;
}

export interface SupportThreadRow {
  id: string;
  userId: string;
  status: string;
  createdAt: unknown;
}

export interface SupportMessageRow {
  id: string;
  senderId: string;
  body: string;
  kind: string;
  createdAt: unknown;
}

export interface UserDetail {
  user: AdminUserRow;
  posts: UserContentRow[];
  questions: UserContentRow[];
  reportsAbout: UserReportRow[];
  supportThreads: SupportThreadRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A reason is mandatory for every consequential decision (min 10 chars). */
export const MIN_REASON_LENGTH = 10;

export function requireReason(reason: string): string {
  const clean = reason.trim();
  if (clean.length < MIN_REASON_LENGTH) throw new Error('reason-too-short');
  return clean.slice(0, 500);
}

/**
 * The acting user is ALWAYS derived from the signed-in Auth user —
 * never taken from a caller-supplied parameter (REVIEW security S2:
 * a caller passing someone else's uid mis-attributes the audit log).
 */
export function getActorUid(): string {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error('not-signed-in');
  return uid;
}

/** Bangla digits for every number the owner sees (REVIEW a11y S6). */
export function formatBnNumber(n: number): string {
  return n.toLocaleString('bn-BD');
}

/** Human-readable time from a Firestore Timestamp, Date, string or null.
 *  `lang` picks the locale: Bangla month names/digits in 'bn', English in 'en'. */
export function formatTime(value: unknown, lang: 'bn' | 'en' = 'bn'): string {
  try {
    if (value == null) return '—';
    let d: Date | null = null;
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      d = (value as { toDate: () => Date }).toDate();
    } else if (value instanceof Date) {
      d = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      const t = new Date(value);
      d = Number.isNaN(t.getTime()) ? null : t;
    }
    if (!d) return '—';
    // No seconds, month name, Bangla day period (REVIEW a11y S7).
    return d.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/** Sort rows newest-first by a createdAt-like value (client-side). */
function byNewest(a: { createdAt: unknown }, b: { createdAt: unknown }): number {
  const t = (v: unknown): number => {
    if (v == null) return 0;
    if (typeof v === 'object' && v !== null && 'toDate' in v) return (v as { toDate: () => Date }).toDate().getTime();
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'string' || typeof v === 'number') {
      const n = new Date(v).getTime();
      return Number.isNaN(n) ? 0 : n;
    }
    return 0;
  };
  return t(b.createdAt) - t(a.createdAt);
}

/**
 * Friendly error for admin failures — every error box in the
 * dashboard shows this, plus what to do next (REVIEW UX B6). The raw
 * code is logged to the console for debugging; the UI never shows a
 * bare error code. `lang` picks the message language.
 */
export function friendlyAdminError(error: unknown, lang: 'bn' | 'en' = 'bn'): string {
  const code =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown';
  if (typeof console !== 'undefined') console.error('[Eduvelto admin] error:', code, error);
  const M: Record<string, { bn: string; en: string }> = {
    'not-signed-in': {
      bn: 'আবার লগইন করুন — আপনার সেশন শেষ হয়ে গেছে। লগইন করে আবার চেষ্টা করুন।',
      en: 'Please log in again — your session has expired. Log in and try again.',
    },
    'not-configured': {
      bn: 'Firebase এখনো যুক্ত হয়নি — প্রকল্প সেটআপ সম্পূর্ণ হলে এই পাতা কাজ করবে।',
      en: 'Firebase is not connected yet — this page will work once the project setup is complete.',
    },
    'owner-protected': {
      bn: 'মালিকের অ্যাকাউন্টে এই কাজ করা যায় না — মালিককে কেউ স্থগিত বা ডাউনগ্রেড করতে পারে না।',
      en: 'This cannot be done on the owner’s account — nobody can suspend or downgrade the owner.',
    },
    'owner-role-not-assignable': {
      bn: 'মালিকের ভূমিকা কাউকে দেওয়া যায় না — মালিক একজনই।',
      en: 'The owner role cannot be given to anyone — there is only one owner.',
    },
    'reason-too-short': {
      bn: `কারণ কমপক্ষে ${formatBnNumber(MIN_REASON_LENGTH)} অক্ষর লিখুন — কেন এই সিদ্ধান্ত, তা পরে দেখা যায় এজন্য।`,
      en: `Write a reason of at least ${MIN_REASON_LENGTH} characters — so the reason for this decision can be seen later.`,
    },
    'user-not-found': {
      bn: 'এই ব্যবহারকারী পাওয়া যায়নি। তালিকা রিফ্রেশ করে আবার চেষ্টা করুন।',
      en: 'This user was not found. Refresh the list and try again.',
    },
    'verification-not-found': {
      bn: 'এই আবেদনটি পাওয়া যায়নি। তালিকা রিফ্রেশ করে আবার চেষ্টা করুন।',
      en: 'This application was not found. Refresh the list and try again.',
    },
    'verification-not-pending': {
      bn: 'এই আবেদনটির সিদ্ধান্ত ইতিমধ্যে হয়ে গেছে। নতুন সিদ্ধান্ত নিতে প্রথমে "আবার খুলুন" করুন।',
      en: 'This application has already been decided. To decide again, first choose "Reopen".',
    },
    'verification-not-verified': {
      bn: 'এই শিক্ষক এখনো ভেরিফায়েড নন — শুধু ভেরিফায়েড শিক্ষকের যাচাই বাতিল করা যায়।',
      en: 'This teacher is not verified yet — only a verified teacher’s verification can be revoked.',
    },
    'verification-not-decided': {
      bn: 'এই আবেদনটির এখনো কোনো সিদ্ধান্ত হয়নি — "আবার খুলুন" শুধু সিদ্ধান্ত হওয়া আবেদনে চলে।',
      en: 'This application has not been decided yet — "Reopen" only works on decided applications.',
    },
    'cannot-decide-own-application': {
      bn: 'নিজের আবেদনে নিজে সিদ্ধান্ত নেওয়া যায় না — অন্য অ্যাডমিন/মালিক সিদ্ধান্ত নেবেন।',
      en: 'You cannot decide your own application — another admin or the owner will decide.',
    },
    'verification-checks-incomplete': {
      bn: 'অনুমোদনের আগে ৪টি যাচাই সবগুলো টিক দিতে হবে — পরিচয়, প্রতিষ্ঠান, বিষয়/যোগ্যতা ও প্রাপ্তবয়স্ক।',
      en: 'Before approving, tick all 4 checks — identity, institution, subject/qualification and adult.',
    },
    'adult-check-required': {
      bn: 'এই ভূমিকা দেওয়ার আগে নিশ্চিত করুন — এই ব্যক্তি প্রাপ্তবয়স্ক এবং পরিচয় যাচাই করা হয়েছে। টিক দিয়ে আবার চেষ্টা করুন।',
      en: 'Before giving this role, make sure this person is an adult and their identity has been verified. Tick and try again.',
    },
    'restricted-feature-needs-separate-owner-approval': {
      bn: 'এই ফিচারটি সীমাবদ্ধ (Category C) — মালিকের আলাদা অনুমোদন ছাড়া চালু হবে না।',
      en: 'This feature is restricted (Category C) — it will not turn on without the owner’s separate approval.',
    },
    'unknown-feature': {
      bn: 'এই ফিচারটি চেনা যায়নি। পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।',
      en: 'This feature was not recognised. Refresh the page and try again.',
    },
    'permission-denied': {
      bn: 'ডাটাবেস অনুমতি দেয়নি — Firestore নিয়ম (rules) এখনো ডেপ্লয় হয়নি, অথবা এই কাজের অনুমতি আপনার নেই। নিয়ম ডেপ্লয় হয়েছে কিনা দেখুন।',
      en: 'The database did not allow this — the Firestore rules are not deployed yet, or you do not have permission for this. Check whether the rules are deployed.',
    },
    unavailable: {
      bn: 'Firebase-এ পৌঁছানো যাচ্ছে না, অথবা ডাটাবেসের ইনডেক্স এখনো তৈরি হয়নি। সংযোগ দেখে আবার চেষ্টা করুন।',
      en: 'Cannot reach Firebase, or the database index is not ready yet. Check the connection and try again.',
    },
    'failed-precondition': {
      bn: 'Firebase-এ পৌঁছানো যাচ্ছে না, অথবা ডাটাবেসের ইনডেক্স এখনো তৈরি হয়নি। সংযোগ দেখে আবার চেষ্টা করুন।',
      en: 'Cannot reach Firebase, or the database index is not ready yet. Check the connection and try again.',
    },
  };
  const m = M[code] ?? {
    bn: 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন — না হলে পাতাটি রিফ্রেশ করুন।',
    en: 'Something went wrong. Try again — if not, refresh the page.',
  };
  return lang === 'bn' ? m.bn : m.en;
}

/** Bangla dictionary for audit-log actions (REVIEW UX S4). */
export const AUDIT_ACTION_LABELS: Record<string, { bn: string; en: string }> = {
  'user-suspend': { bn: 'ব্যবহারকারী স্থগিত', en: 'User suspended' },
  'user-reactivate': { bn: 'ব্যবহারকারী আবার চালু', en: 'User reactivated' },
  'user-role-change': { bn: 'ভূমিকা পরিবর্তন', en: 'Role changed' },
  'teacher-verification-approved': { bn: 'শিক্ষক অনুমোদন', en: 'Teacher approved' },
  'teacher-verification-rejected': { bn: 'শিক্ষক আবেদন বাতিল', en: 'Teacher rejected' },
  'teacher-verification-revoked': { bn: 'শিক্ষক যাচাই বাতিল', en: 'Teacher verification revoked' },
  'teacher-verification-reopened': { bn: 'আবেদন আবার খোলা', en: 'Application reopened' },
  'feature-enabled': { bn: 'ফিচার চালু', en: 'Feature enabled' },
  'feature-disabled': { bn: 'ফিচার বন্ধ', en: 'Feature disabled' },
  'backup-exported': { bn: 'ব্যাকআপ সংরক্ষণ', en: 'Backup exported' },
  'user-profile-viewed': { bn: 'প্রোফাইল দেখা', en: 'Profile viewed' },
  'support-thread-viewed': { bn: 'সাপোর্ট থ্রেড দেখা', en: 'Support thread viewed' },
  'support-message-sent': { bn: 'সাপোর্ট মেসেজ পাঠানো', en: 'Support message sent' },
  'message-reported': { bn: 'মেসেজ রিপোর্ট', en: 'Message reported' },
  'message-blocked': { bn: 'মেসেজ ব্লক', en: 'Message blocked' },
};

export function auditActionLabel(action: string): { bn: string; en: string } {
  return AUDIT_ACTION_LABELS[action] ?? { bn: action, en: action };
}

// ---------------------------------------------------------------------------
// Audit log (adminActions — append-only, owner-readable only)
// ---------------------------------------------------------------------------

export interface AuditEntryOptions {
  before?: string;
  after?: string;
  reason?: string;
}

function auditEntryData(
  actorUid: string,
  action: string,
  details: string,
  targetId: string,
  opts: AuditEntryOptions = {},
): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    actorId: actorUid,
    action,
    details: details.slice(0, 1000),
    targetId: targetId.slice(0, 200),
    createdAt: serverTimestamp(),
  };
  if (opts.before !== undefined) entry.before = opts.before.slice(0, 500);
  if (opts.after !== undefined) entry.after = opts.after.slice(0, 500);
  if (opts.reason !== undefined) entry.reason = opts.reason.slice(0, 500);
  return entry;
}

/**
 * Record one admin action. The rules require actorId == the caller's uid,
 * the action to be in the fixed enum, and createdAt to be a real
 * timestamp. Never edit or delete entries (rules forbid it).
 */
export async function logAdminAction(
  db: Firestore,
  action: string,
  details = '',
  targetId = '',
  opts: AuditEntryOptions = {},
): Promise<void> {
  await addDoc(
    collection(db, 'adminActions'),
    auditEntryData(getActorUid(), action, details, targetId, opts),
  );
}

/** Newest-first audit entries (owner only — the rules enforce this). Latest 100. */
export async function listAdminActions(db: Firestore): Promise<AuditRow[]> {
  const snap = await getDocs(
    query(collection(db, 'adminActions'), orderBy('createdAt', 'desc'), limit(100)),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      actorId: typeof data.actorId === 'string' ? data.actorId : '',
      action: typeof data.action === 'string' ? data.action : '',
      details: typeof data.details === 'string' ? data.details : undefined,
      targetId: typeof data.targetId === 'string' ? data.targetId : undefined,
      before: typeof data.before === 'string' ? data.before : undefined,
      after: typeof data.after === 'string' ? data.after : undefined,
      reason: typeof data.reason === 'string' ? data.reason : undefined,
      createdAt: data.createdAt ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Users (area 1 + area 10) + owner oversight (23:22 decision)
// ---------------------------------------------------------------------------

const USER_PAGE_SIZE = 25;

function toAdminUserRow(uid: string, data: DocumentData): AdminUserRow {
  return {
    uid,
    displayName: typeof data.displayName === 'string' ? data.displayName : '(নাম নেই)',
    email: typeof data.email === 'string' ? data.email : '',
    role: (data.role as UserRole) ?? 'student',
    isActive: data.isActive !== false,
    suspendedReason:
      typeof data.suspendedReason === 'string' ? data.suspendedReason : undefined,
    verificationStatus:
      typeof data.verificationStatus === 'string' ? data.verificationStatus : undefined,
    createdAt: data.createdAt ?? null,
    educationType: (data.educationType as string | null) ?? null,
    institution: (data.institution as string | null) ?? null,
    program: (data.program as string | null) ?? null,
    department: (data.department as string | null) ?? null,
    classLevel: (data.classLevel as string | null) ?? null,
  };
}

export interface UserListPage {
  rows: AdminUserRow[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * User accounts, newest first, 25 per page (REVIEW cost F1: the old
 * 200-doc unpaginated list could never reach users past #200, and cost
 * 200 reads per load). Pass the previous page's lastDoc to load more.
 */
export async function listUsers(
  db: Firestore,
  after?: QueryDocumentSnapshot<DocumentData> | null,
): Promise<UserListPage> {
  const base = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc'),
    limit(USER_PAGE_SIZE),
  );
  const q = after ? query(base, startAfter(after)) : base;
  const snap = await getDocs(q);
  return {
    rows: snap.docs.map((d) => toAdminUserRow(d.id, d.data())),
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
    hasMore: snap.docs.length === USER_PAGE_SIZE,
  };
}

/** Find a user by exact email (1 read per match — never load the list to find someone). */
export async function searchUsersByEmail(db: Firestore, email: string): Promise<AdminUserRow[]> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('email', '==', email.trim()), limit(10)),
  );
  return snap.docs.map((d) => toAdminUserRow(d.id, d.data()));
}

async function loadTargetUser(db: Firestore, targetUid: string): Promise<DocumentData> {
  const snap = await getDoc(doc(db, 'users', targetUid));
  if (!snap.exists()) throw new Error('user-not-found');
  return snap.data();
}

/**
 * Owner oversight (owner decision 20 Nov 23:22, as narrowed by the
 * privacy brief 21 Nov 00:17): the owner can open ANY user's profile and
 * view that user's public posts/questions, reports about them, and their
 * SUPPORT threads (owner/admin <-> user — support messaging is the one
 * messaging area the dashboard may show). The view itself is written to
 * the audit log (who viewed whom, when). Students' private info stays
 * protected from everyone EXCEPT the owner, and only when needed.
 * PRIVACY BRIEF 00:17 — there is NO routine access to private message
 * content for anyone (owner, admin, moderator, teacher, guardian): no
 * private-inbox viewing feature exists in this dashboard, guardians must
 * NOT read their children's private messages, teachers must NOT read
 * students' private messages. Exceptional access is allowed ONLY for a
 * serious safety incident, via a documented, auditable, owner-approved,
 * time-boxed, scoped, read-only process — never hidden or unrestricted.
 * No such feature is built until the privacy + messaging design proposal
 * is explicitly approved by the owner.
 */
export async function getUserDetail(db: Firestore, targetUid: string): Promise<UserDetail> {
  const actor = getActorUid();
  const snap = await getDoc(doc(db, 'users', targetUid));
  if (!snap.exists()) throw new Error('user-not-found');
  const user = toAdminUserRow(targetUid, snap.data());
  const [postsSnap, questionsSnap, reportsSnap, threadsSnap] = await Promise.all([
    getDocs(query(collection(db, 'posts'), where('authorId', '==', targetUid), limit(25))),
    getDocs(query(collection(db, 'questions'), where('authorId', '==', targetUid), limit(25))),
    getDocs(
      query(collection(db, 'reports'), where('targetAuthorId', '==', targetUid), limit(25)),
    ),
    getDocs(
      query(collection(db, 'supportMessages'), where('userId', '==', targetUid), limit(10)),
    ),
  ]);
  const posts: UserContentRow[] = postsSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      kind: 'post',
      title: typeof data.title === 'string' ? data.title : '',
      body: typeof data.body === 'string' ? data.body : '',
      reviewStatus: typeof data.reviewStatus === 'string' ? data.reviewStatus : undefined,
      createdAt: data.createdAt ?? null,
    };
  });
  const questions: UserContentRow[] = questionsSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      kind: 'question',
      title: typeof data.title === 'string' ? data.title : '',
      body: typeof data.body === 'string' ? data.body : '',
      reviewStatus: typeof data.reviewStatus === 'string' ? data.reviewStatus : undefined,
      createdAt: data.createdAt ?? null,
    };
  });
  const reportsAbout: UserReportRow[] = reportsSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      reason: typeof data.reason === 'string' ? data.reason : '',
      status: typeof data.status === 'string' ? data.status : '',
      targetType: typeof data.targetType === 'string' ? data.targetType : undefined,
      details: typeof data.details === 'string' ? data.details : undefined,
      createdAt: data.createdAt ?? null,
    };
  });
  const supportThreads: SupportThreadRow[] = threadsSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: typeof data.userId === 'string' ? data.userId : '',
      status: typeof data.status === 'string' ? data.status : '',
      createdAt: data.createdAt ?? null,
    };
  });
  posts.sort(byNewest);
  questions.sort(byNewest);
  reportsAbout.sort(byNewest);
  supportThreads.sort(byNewest);
  // The oversight view is itself audited (who viewed whom, when).
  await addDoc(
    collection(db, 'adminActions'),
    auditEntryData(actor, 'user-profile-viewed', user.displayName, targetUid),
  );
  return { user, posts, questions, reportsAbout, supportThreads };
}

/** Read one support thread's messages (text only, Phase 1). The view is audited. */
export async function getSupportThreadMessages(
  db: Firestore,
  threadId: string,
  userName: string,
): Promise<SupportMessageRow[]> {
  const snap = await getDocs(
    query(
      collection(db, 'supportMessages', threadId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50),
    ),
  );
  const rows = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      senderId: typeof data.senderId === 'string' ? data.senderId : '',
      body: typeof data.body === 'string' ? data.body : '',
      kind: typeof data.kind === 'string' ? data.kind : '',
      createdAt: data.createdAt ?? null,
    };
  });
  await addDoc(
    collection(db, 'adminActions'),
    auditEntryData(getActorUid(), 'support-thread-viewed', userName, threadId),
  );
  return rows;
}

/** Roles the dashboard may assign. 'owner' is NEVER offered here. */
export const ASSIGNABLE_ROLES: readonly UserRole[] = [
  'admin',
  'moderator',
  'teacher',
  'student',
  'parent',
];

/**
 * Suspend (active=false) or reactivate a user. Refuses the Owner.
 * Reason is MANDATORY (shown to the user on the suspended screen).
 * The change + its audit entry are ONE batch (REVIEW F19: no
 * action-without-audit is possible).
 */
export async function setUserActive(
  db: Firestore,
  targetUid: string,
  active: boolean,
  reason: string,
): Promise<void> {
  const cleanReason = requireReason(reason);
  const actor = getActorUid();
  const target = await loadTargetUser(db, targetUid);
  if (target.role === 'owner') throw new Error('owner-protected');
  const before = target.isActive !== false ? 'active' : 'suspended';
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', targetUid), {
    isActive: active,
    suspendedReason: active ? null : cleanReason,
    updatedAt: serverTimestamp(),
  });
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(
      actor,
      active ? 'user-reactivate' : 'user-suspend',
      typeof target.displayName === 'string' ? target.displayName : targetUid,
      targetUid,
      { before, after: active ? 'active' : 'suspended', reason: cleanReason },
    ),
  );
  await batch.commit();
}

/**
 * Change a user's role. Refuses the Owner and refuses role 'owner'.
 * Reason is MANDATORY. Elevating a student to teacher/moderator/admin
 * additionally requires the owner's attestation that the person is an
 * adult whose identity was checked (REVIEW F6/F7: there is no
 * date-of-birth field yet, so no code can check age — the dashboard
 * asks the owner to confirm it, and records the confirmation).
 */
export async function setUserRole(
  db: Firestore,
  targetUid: string,
  role: UserRole,
  reason: string,
  adultChecked = false,
): Promise<void> {
  if (role === 'owner') throw new Error('owner-role-not-assignable');
  const cleanReason = requireReason(reason);
  const actor = getActorUid();
  const target = await loadTargetUser(db, targetUid);
  if (target.role === 'owner') throw new Error('owner-protected');
  const privileged = role === 'teacher' || role === 'moderator' || role === 'admin';
  if (privileged && target.role === 'student' && !adultChecked) {
    throw new Error('adult-check-required');
  }
  const before = typeof target.role === 'string' ? target.role : 'student';
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', targetUid), {
    role,
    updatedAt: serverTimestamp(),
  });
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(
      actor,
      'user-role-change',
      `${typeof target.displayName === 'string' ? target.displayName : targetUid}${
        privileged && target.role === 'student' ? ' — প্রাপ্তবয়স্ক যাচাই করা হয়েছে' : ''
      }`,
      targetUid,
      { before, after: role, reason: cleanReason },
    ),
  );
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Teacher verification (area 2)
// ---------------------------------------------------------------------------

export interface TeacherApplicationFields {
  fullName: string;
  teachingLevel: string;
  subjects: string[];
  classes: string[];
  institution: string;
  /** Job title / post at the institution (e.g. "Assistant Teacher"). */
  post?: string;
  /** Institution contact (phone or email) the admin can use to verify employment. */
  institutionContact?: string;
  qualifications: string;
  experienceYears: number;
  verificationReason: string;
  evidenceRef?: string;
}

/**
 * File a teacher verification application (Step 5 — the REAL form).
 * One application per teacher: deterministic id `tv_{userId}`. A pending
 * application cannot be re-filed; a verified teacher cannot re-apply; a
 * rejected teacher MAY re-apply (record is overwritten as pending again).
 * The record is the REQUEST — nothing here grants 'verified': only an
 * Admin's decideTeacherVerification() can do that, with the 4-point
 * human checklist + mandatory reason. The teacher's profile already
 * carries verificationStatus 'pending' from registration, so no user-doc
 * write happens here.
 */
export async function submitTeacherApplication(
  db: Firestore,
  userId: string,
  fields: TeacherApplicationFields,
): Promise<string> {
  const cleanReason = requireReason(fields.verificationReason);
  const subjects = fields.subjects.map((s) => s.trim()).filter(Boolean).slice(0, 20);
  const classes = fields.classes.map((s) => s.trim()).filter(Boolean).slice(0, 20);
  if (subjects.length === 0 || classes.length === 0) {
    throw new Error('teacher-application-needs-subject-and-class');
  }
  if (!fields.fullName.trim() || !fields.institution.trim() || !fields.qualifications.trim()) {
    throw new Error('teacher-application-incomplete');
  }
  const id = `tv_${userId}`;
  const ref = doc(db, 'teacherVerifications', id);
  const existing = await getDoc(ref);
  const isReapply = existing.exists();
  if (isReapply) {
    const status = existing.data().status as string | undefined;
    if (status === 'pending') throw new Error('application-already-pending');
    if (status === 'verified') throw new Error('already-verified');
    // 'rejected' → allow re-application below (merge: createdAt stays).
  }
  const data = {
    id,
    userId,
    fullName: fields.fullName.trim().slice(0, 100),
    teachingLevel: fields.teachingLevel.trim().slice(0, 100),
    subjects,
    classes,
    institution: fields.institution.trim().slice(0, 200),
    post: (fields.post ?? '').trim().slice(0, 100),
    institutionContact: (fields.institutionContact ?? '').trim().slice(0, 100),
    qualifications: fields.qualifications.trim().slice(0, 500),
    experienceYears: Math.max(0, Math.min(60, Math.floor(fields.experienceYears))),
    verificationReason: cleanReason,
    evidenceRef: (fields.evidenceRef ?? '').trim().slice(0, 200),
    status: 'pending',
    verificationStatus: 'pending',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (isReapply) {
    // Merge: the original createdAt is preserved (rules allowlist).
    await setDoc(ref, data, { merge: true });
  } else {
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  }
  return id;
}

/** The signed-in teacher's own application, if any (for the form page). */
export async function getMyTeacherApplication(
  db: Firestore,
  userId: string,
): Promise<VerificationRow | null> {
  const snap = await getDoc(doc(db, 'teacherVerifications', `tv_${userId}`));
  if (!snap.exists()) return null;
  const data = snap.data();
  const { userId: uid, fullName, institution, status, createdAt, checkedBy, reason, checks, ...extra } = data;
  return {
    id: snap.id,
    userId: typeof uid === 'string' ? uid : '',
    fullName: typeof fullName === 'string' ? fullName : '(নাম নেই)',
    institution: typeof institution === 'string' ? institution : '',
    status: typeof status === 'string' ? status : 'pending',
    createdAt: createdAt ?? null,
    checkedBy: typeof checkedBy === 'string' ? checkedBy : undefined,
    reason: typeof reason === 'string' ? reason : undefined,
    checks: (checks as VerificationChecks | undefined) ?? undefined,
    extra,
  };
}

/**
 * Verification applications, newest first (limit 50). The status filter
 * is applied client-side: where('status','==',…) + orderBy('createdAt')
 * needs a composite index (added to firestore.indexes.json — deploy it
 * with the rules; until then the query would fail, so we do not use it).
 */
export async function listTeacherVerifications(
  db: Firestore,
  statusFilter?: string,
): Promise<VerificationRow[]> {
  const snap = await getDocs(
    query(collection(db, 'teacherVerifications'), orderBy('createdAt', 'desc'), limit(50)),
  );
  const rows = snap.docs.map((d) => {
    const data = d.data();
    const { userId, fullName, institution, status, createdAt, checkedBy, reason, checks, ...extra } = data;
    return {
      id: d.id,
      userId: typeof userId === 'string' ? userId : '',
      fullName: typeof fullName === 'string' ? fullName : '(নাম নেই)',
      institution: typeof institution === 'string' ? institution : '',
      status: typeof status === 'string' ? status : 'pending',
      createdAt: createdAt ?? null,
      checkedBy: typeof checkedBy === 'string' ? checkedBy : undefined,
      reason: typeof reason === 'string' ? reason : undefined,
      checks: (checks as VerificationChecks | undefined) ?? undefined,
      extra,
    };
  });
  return statusFilter ? rows.filter((r) => r.status === statusFilter) : rows;
}

/**
 * Approve or reject a teacher application — ONE separate decision per
 * application (owner rule 20 Nov 23:21: never bundled, never assumed).
 * - The record must be PENDING and the decider must not be the applicant.
 * - Reason is MANDATORY (min 10 chars).
 * - APPROVE additionally requires the 4-point human checklist
 *   (identity / institution / subject+qualification / adult) — all true
 *   (REVIEW F1). No checklist, no approve.
 * - Approve also sets role 'teacher' on the user (REVIEW F4) and mirrors
 *   verificationStatus + verifiedBy. Reject mirrors 'rejected'.
 * - The decision + mirror + audit entry are ONE batch — they succeed or
 *   fail together (REVIEW F19). A mirror failure is surfaced, never
 *   swallowed (REVIEW N1).
 */
export async function decideTeacherVerification(
  db: Firestore,
  recordId: string,
  decision: 'verified' | 'rejected',
  reason: string,
  checks?: VerificationChecks,
): Promise<void> {
  const cleanReason = requireReason(reason);
  const actor = getActorUid();
  const ref = doc(db, 'teacherVerifications', recordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('verification-not-found');
  const data = snap.data();
  if (data.status !== 'pending') throw new Error('verification-not-pending');
  const userId = data.userId as string | undefined;
  if (!userId || userId === actor) throw new Error('cannot-decide-own-application');
  if (decision === 'verified') {
    if (!checks || !checks.identity || !checks.institution || !checks.subject || !checks.adult) {
      throw new Error('verification-checks-incomplete');
    }
  }
  const target = await loadTargetUser(db, userId);
  if (target.role === 'owner') throw new Error('owner-protected');
  const batch = writeBatch(db);
  const recordUpdate: Record<string, unknown> = {
    status: decision,
    checkedBy: actor,
    checkedAt: serverTimestamp(),
    reason: cleanReason,
    updatedAt: serverTimestamp(),
  };
  if (decision === 'verified' && checks) {
    recordUpdate.checks = {
      identity: true,
      institution: true,
      subject: true,
      adult: true,
      evidenceRef: (checks.evidenceRef ?? '').slice(0, 200),
    };
  }
  batch.update(ref, recordUpdate);
  const mirror: Record<string, unknown> = {
    verificationStatus: decision,
    verifiedBy: actor,
    verifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (decision === 'verified') mirror.role = 'teacher';
  batch.update(doc(db, 'users', userId), mirror);
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(
      actor,
      decision === 'verified' ? 'teacher-verification-approved' : 'teacher-verification-rejected',
      `${typeof data.fullName === 'string' ? data.fullName : recordId} — ${cleanReason}`,
      recordId,
      { before: 'pending', after: decision, reason: cleanReason },
    ),
  );
  await batch.commit();
}

/** Revoke a verified teacher (reason mandatory). Role returns to student. */
export async function revokeTeacherVerification(
  db: Firestore,
  recordId: string,
  reason: string,
): Promise<void> {
  const cleanReason = requireReason(reason);
  const actor = getActorUid();
  const ref = doc(db, 'teacherVerifications', recordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('verification-not-found');
  const data = snap.data();
  if (data.status !== 'verified') throw new Error('verification-not-verified');
  const userId = data.userId as string | undefined;
  if (!userId || userId === actor) throw new Error('cannot-decide-own-application');
  const target = await loadTargetUser(db, userId);
  if (target.role === 'owner') throw new Error('owner-protected');
  const batch = writeBatch(db);
  batch.update(ref, {
    status: 'revoked',
    checkedBy: actor,
    checkedAt: serverTimestamp(),
    reason: cleanReason,
    updatedAt: serverTimestamp(),
  });
  const mirror: Record<string, unknown> = {
    verificationStatus: 'revoked',
    verifiedBy: actor,
    verifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (target.role === 'teacher') mirror.role = 'student';
  batch.update(doc(db, 'users', userId), mirror);
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(
      actor,
      'teacher-verification-revoked',
      `${typeof data.fullName === 'string' ? data.fullName : recordId} — ${cleanReason}`,
      recordId,
      { before: 'verified', after: 'revoked', reason: cleanReason },
    ),
  );
  await batch.commit();
}

/** Re-open a decided application back to pending (reason mandatory). */
export async function reopenTeacherVerification(
  db: Firestore,
  recordId: string,
  reason: string,
): Promise<void> {
  const cleanReason = requireReason(reason);
  const actor = getActorUid();
  const ref = doc(db, 'teacherVerifications', recordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('verification-not-found');
  const data = snap.data();
  if (data.status !== 'verified' && data.status !== 'rejected' && data.status !== 'revoked') {
    throw new Error('verification-not-decided');
  }
  const userId = data.userId as string | undefined;
  if (!userId || userId === actor) throw new Error('cannot-decide-own-application');
  const target = await loadTargetUser(db, userId);
  if (target.role === 'owner') throw new Error('owner-protected');
  const batch = writeBatch(db);
  batch.update(ref, {
    status: 'pending',
    checkedBy: actor,
    checkedAt: serverTimestamp(),
    reason: cleanReason,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', userId), {
    verificationStatus: 'pending',
    verifiedBy: actor,
    verifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(
      actor,
      'teacher-verification-reopened',
      `${typeof data.fullName === 'string' ? data.fullName : recordId} — ${cleanReason}`,
      recordId,
      { before: String(data.status), after: 'pending', reason: cleanReason },
    ),
  );
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Feature toggles (area 9) — stored in settings/features
// ---------------------------------------------------------------------------

export interface FeatureFlagDef {
  id: string;
  labelBn: string;
  labelEn: string;
  /** A = launch ON, B = future OFF by default, C = restricted (video §). */
  category: 'A' | 'B' | 'C';
  defaultOn: boolean;
  noteBn: string;
  noteEn: string;
  /** Honest answer to "what happens if I turn this on TODAY?" (REVIEW F14). */
  effectBn: string;
  effectEn: string;
}

export const FEATURE_FLAGS: readonly FeatureFlagDef[] = [
  {
    id: 'ai-teacher',
    labelBn: 'AI শিক্ষক (আসল AI)',
    labelEn: 'AI Teacher (real AI)',
    category: 'A',
    defaultOn: false,
    noteBn: 'এখন শুধু স্ক্রিপ্ট করা ডেমো চলে। আসল AI চালু করতে পেইড API + মালিকের আলাদা অনুমোদন লাগবে।',
    noteEn: 'Only a scripted demo runs today. Real AI needs a paid API + the owner’s separate approval.',
    effectBn: 'আজ চালু করলে কিছুই বদলাবে না — স্ক্রিপ্ট করা ডেমোই চলবে, আসল AI নয়।',
    effectEn: 'Turning it on today changes nothing — the scripted demo keeps running, not real AI.',
  },
  {
    id: 'video-uploads',
    labelBn: 'ভিডিও আপলোড (যাচাইকৃত শিক্ষক)',
    labelEn: 'Video uploads (verified teachers only)',
    category: 'A',
    defaultOn: false,
    noteBn: 'আপলোডের ফরম এখনো তৈরি হয়নি — টগল শুধু সেটিং হিসেবে সংরক্ষিত হয়।',
    noteEn: 'The upload flow is not built yet — the toggle is stored as a setting only.',
    effectBn: 'আজ চালু করলে কিছুই হবে না — আপলোডের ফরম তৈরি হয়নি।',
    effectEn: 'Turning it on today does nothing — the upload flow is not built yet.',
  },
  {
    id: 'comments',
    labelBn: 'মন্তব্য (Comments)',
    labelEn: 'Comments',
    category: 'B',
    defaultOn: false,
    noteBn: 'মডারেশন প্রস্তুত না হওয়া পর্যন্ত বন্ধ (ভবিষ্যৎ ফিচার)।',
    noteEn: 'OFF until moderation is ready (future feature).',
    effectBn: 'আজ চালু করলে কিছুই হবে না — মন্তব্যের ব্যবস্থা তৈরি হয়নি।',
    effectEn: 'Turning it on today does nothing — comments are not built yet.',
  },
  {
    id: 'social',
    labelBn: 'সোশ্যাল / কমিউনিটি',
    labelEn: 'Social / Community',
    category: 'B',
    defaultOn: false,
    noteBn: 'শুধু ডিজাইন প্রস্তাব আছে; নিরাপত্তা + মডারেশন ছাড়া চালু হবে না।',
    noteEn: 'Design proposal only; never enabled without safety + moderation.',
    effectBn: 'আজ চালু করলে কিছুই হবে না — সোশ্যাল ফিচার তৈরি হয়নি।',
    effectEn: 'Turning it on today does nothing — social features are not built yet.',
  },
  {
    id: 'games',
    labelBn: 'গেম ও পুরস্কার (EduPlay)',
    labelEn: 'Games & rewards (EduPlay)',
    category: 'B',
    defaultOn: false,
    noteBn: 'পরিকল্পনায় আছে; এখনো তৈরি হয়নি।',
    noteEn: 'Planned; not built yet.',
    effectBn: 'আজ চালু করলে কিছুই হবে না — গেম তৈরি হয়নি।',
    effectEn: 'Turning it on today does nothing — games are not built yet.',
  },
  {
    id: 'health',
    labelBn: 'স্বাস্থ্য (Eduvelto Health)',
    labelEn: 'Health (Eduvelto Health)',
    category: 'B',
    defaultOn: false,
    noteBn: 'পরিকল্পনায় আছে; চিকিৎসা তথ্য যাচাই ছাড়া চালু হবে না।',
    noteEn: 'Planned; never enabled without qualified review of health content.',
    effectBn: 'আজ চালু করলে কিছুই হবে না — স্বাস্থ্য বিভাগ তৈরি হয়নি।',
    effectEn: 'Turning it on today does nothing — the health section is not built yet.',
  },
  {
    id: 'career',
    labelBn: 'ক্যারিয়ার',
    labelEn: 'Career',
    category: 'B',
    defaultOn: false,
    noteBn: 'পরিকল্পনায় আছে; এখনো তৈরি হয়নি।',
    noteEn: 'Planned; not built yet.',
    effectBn: 'আজ চালু করলে কিছুই হবে না — ক্যারিয়ার বিভাগ তৈরি হয়নি।',
    effectEn: 'Turning it on today does nothing — the career section is not built yet.',
  },
  {
    id: 'offline-downloads',
    labelBn: 'অফলাইন ডাউনলোড',
    labelEn: 'Offline downloads',
    category: 'B',
    defaultOn: false,
    noteBn: 'ভবিষ্যৎ ফিচার; খরচের হিসাব ছাড়া চালু হবে না।',
    noteEn: 'Future feature; never enabled without a cost check.',
    effectBn: 'আজ চালু করলে কিছুই হবে না — ডাউনলোড তৈরি হয়নি।',
    effectEn: 'Turning it on today does nothing — downloads are not built yet.',
  },
  {
    id: 'live-classes',
    labelBn: 'লাইভ ক্লাস',
    labelEn: 'Live classes',
    category: 'C',
    defaultOn: false,
    noteBn: 'সীমাবদ্ধ — মালিকের আলাদা অনুমোদন ছাড়া কখনো চালু হবে না।',
    noteEn: 'Restricted — never enabled without the owner’s separate approval.',
    effectBn: 'তালাবদ্ধ — চালু করা যাবে না। লাইভ ক্লাসে শিশুদের নিরাপত্তার ব্যবস্থা আগে তৈরি করতে হবে।',
    effectEn: 'Locked — cannot be enabled. Child-safety measures for live classes must be built first.',
  },
  {
    id: 'video-ads',
    labelBn: 'ভিডিও বিজ্ঞাপন',
    labelEn: 'Video ads',
    category: 'C',
    defaultOn: false,
    noteBn: 'সীমাবদ্ধ — ভিডিও মনিটাইজেশন বন্ধ আছে।',
    noteEn: 'Restricted — video monetisation is OFF.',
    effectBn: 'তালাবদ্ধ — চালু করা যাবে না। ভিডিও বিজ্ঞাপন বন্ধ রাখার মালিকের সিদ্ধান্ত।',
    effectEn: 'Locked — cannot be enabled. The owner’s decision keeps video ads OFF.',
  },
  {
    id: 'paid-subscriptions',
    labelBn: 'পেইড সাবস্ক্রিপশন',
    labelEn: 'Paid subscriptions',
    category: 'C',
    defaultOn: false,
    noteBn: 'সীমাবদ্ধ — শেখা ফ্রি থাকে; টাকা দিয়ে কেনা কোনো সুবিধা আলাদা অনুমোদন ছাড়া চালু হবে না।',
    noteEn: 'Restricted — learning stays free; nothing paid without separate approval.',
    effectBn: 'তালাবদ্ধ — চালু করা যাবে না। শেখা ফ্রি থাকে।',
    effectEn: 'Locked — cannot be enabled. Learning stays free.',
  },
];

/** Stored flag values (missing = default). */
export async function getFeatureFlags(db: Firestore): Promise<Record<string, boolean>> {
  const snap = await getDoc(doc(db, 'settings', 'features'));
  if (!snap.exists()) return {};
  const data = snap.data();
  const out: Record<string, boolean> = {};
  for (const f of FEATURE_FLAGS) {
    if (typeof data[f.id] === 'boolean') out[f.id] = data[f.id] as boolean;
  }
  return out;
}

/**
 * Store one toggle + audit it (one batch). Category C flags are
 * HARD-BLOCKED here (REVIEW F12/S5): a single call can never enable
 * video-ads, paid-subscriptions or live-classes — not even by the
 * owner from the dashboard. Enabling one needs a separate,
 * explicitly-approved owner decision (and a dedicated function then).
 * The flag takes effect only when the feature's code reads it.
 */
export async function setFeatureFlag(
  db: Firestore,
  flagId: string,
  value: boolean,
): Promise<void> {
  const def = FEATURE_FLAGS.find((f) => f.id === flagId);
  if (!def) throw new Error('unknown-feature');
  if (def.category === 'C') {
    throw new Error('restricted-feature-needs-separate-owner-approval');
  }
  const actor = getActorUid();
  const batch = writeBatch(db);
  batch.set(
    doc(db, 'settings', 'features'),
    { [flagId]: value, updatedAt: serverTimestamp() },
    { merge: true },
  );
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(actor, value ? 'feature-enabled' : 'feature-disabled', def.labelEn, flagId, {
      before: value ? 'off' : 'on',
      after: value ? 'on' : 'off',
    }),
  );
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Forced app update (owner brief 22 Nov 2026): publish a new app version
// from the dashboard — NO code/deploy. Writes config/appVersion in ONE
// batch with the audit entry, so a version change can never happen with
// no audit trail. Code-level validation mirrors the Firestore rules;
// the rules are the real enforcement.
// ---------------------------------------------------------------------------

export interface AppVersionFormValues {
  latestVersion: string;
  minVersion: string;
  releaseNotes: string;
  downloadUrl: string;
}

export async function updateAppVersionConfig(
  db: Firestore,
  values: AppVersionFormValues,
): Promise<void> {
  const latest = values.latestVersion.trim();
  const min = values.minVersion.trim();
  const downloadUrl = values.downloadUrl.trim() || DEFAULT_APP_DOWNLOAD_URL;
  if (!isValidVersion(latest) || !isValidVersion(min)) throw new Error('invalid-version');
  if (compareVersions(min, latest) > 0) throw new Error('min-version-above-latest');
  if (!(downloadUrl.startsWith('/') || downloadUrl.startsWith('https://'))) {
    throw new Error('invalid-download-url');
  }
  const actor = getActorUid();
  const beforeSnap = await getDoc(doc(db, 'config', APP_VERSION_DOC));
  const beforeData = beforeSnap.exists() ? beforeSnap.data() : null;
  const before =
    beforeData && typeof beforeData.latestVersion === 'string'
      ? `latest ${beforeData.latestVersion}, min ${beforeData.minVersion ?? ''}`
      : 'not published';
  const batch = writeBatch(db);
  batch.set(
    doc(db, 'config', APP_VERSION_DOC),
    {
      latestVersion: latest,
      minVersion: min,
      releaseNotes: values.releaseNotes.slice(0, 2000),
      downloadUrl,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(actor, 'app-version-change', `App version published`, 'config/appVersion', {
      before,
      after: `latest ${latest}, min ${min}`,
    }),
  );
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Dashboard counts (cached — REVIEW cost F4/F11: no polling, no
// re-fetch on every visit; the append-only audit count is dropped —
// counting an ever-growing log on every visit gets more expensive
// forever, and the number is not actionable)
// ---------------------------------------------------------------------------

let cachedCounts: { at: number; value: DashboardCounts } | null = null;
const COUNTS_TTL_MS = 5 * 60 * 1000;

export async function getDashboardCounts(db: Firestore): Promise<DashboardCounts> {
  const now = Date.now();
  if (cachedCounts && now - cachedCounts.at < COUNTS_TTL_MS) return cachedCounts.value;
  const [users, pending] = await Promise.all([
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(
      query(collection(db, 'teacherVerifications'), where('status', '==', 'pending')),
    ),
  ]);
  const value = { users: users.data().count, pendingVerifications: pending.data().count };
  cachedCounts = { at: now, value };
  return value;
}

export function clearCountsCache(): void {
  cachedCounts = null;
}

// ---------------------------------------------------------------------------
// External items — things NO in-app dashboard can ever control.
// The dashboard SHOWS their status + where to do them, honestly.
// ---------------------------------------------------------------------------

export interface ExternalItem {
  id: string;
  titleBn: string;
  titleEn: string;
  statusBn: string;
  statusEn: string;
  detailBn: string;
  detailEn: string;
  whereBn: string;
  whereEn: string;
}

/** Official domain expiry (NameBari Invoice #2: 20/11/2026 – 19/11/2027). */
export const DOMAIN_EXPIRY_ISO = '2027-11-19';
export const DOMAIN_RENEWAL_BDT = 1500;

export function domainDaysLeft(now: Date = new Date()): number {
  const expiry = new Date(`${DOMAIN_EXPIRY_ISO}T00:00:00+06:00`);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * External items with live status where it can be computed in the browser.
 * `adsenseConfigured` comes from the ads lib (publisher ID set or not).
 */
export function getExternalItems(adsenseConfigured: boolean): ExternalItem[] {
  const days = domainDaysLeft();
  const daysBn = formatBnNumber(days);
  return [
    {
      id: 'domain',
      titleBn: 'ডোমেইন — eduvelto.com',
      titleEn: 'Domain — eduvelto.com',
      statusBn:
        days > 90
          ? `সক্রিয় — মেয়াদ শেষ হতে ${daysBn} দিন বাকি`
          : `সতর্কতা — মেয়াদ শেষ হতে ${daysBn} দিন বাকি`,
      statusEn:
        days > 90 ? `Active — ${days} days left` : `Warning — ${days} days left`,
      detailBn: `মেয়াদ শেষ: ১৯ নভেম্বর ২০২৭। নবায়ন ৳${formatBnNumber(DOMAIN_RENEWAL_BDT)}/বছর। মেয়াদ শেষ হলে ওয়েবসাইট বন্ধ হয়ে যাবে — সময়মতো নবায়ন করুন।`,
      detailEn: `Expires 19 Nov 2027. Renewal ৳${DOMAIN_RENEWAL_BDT}/year. The website stops if it expires — renew in time.`,
      whereBn: 'NameBari ক্লায়েন্ট এরিয়া → Domains → eduvelto.com → Renew',
      whereEn: 'NameBari client area → Domains → eduvelto.com → Renew',
    },
    {
      id: 'billing',
      titleBn: 'Firebase বিলিং',
      titleEn: 'Firebase billing',
      statusBn: 'Spark (ফ্রি) — ০ ডলার/মাস',
      statusEn: 'Spark (free) — $0/month',
      detailBn: 'বড় হলে Blaze (পেইড) লাগবে — সেটা শুধু Firebase console থেকে, আপনার পেমেন্টে। ড্যাশবোর্ড থেকে বিলিং বদলানো যায় না।',
      detailEn: 'Blaze (paid) is needed at scale — only from the Firebase console, with your payment. Billing cannot change from the dashboard.',
      whereBn: 'Firebase console → eduvelto → Usage and billing',
      whereEn: 'Firebase console → eduvelto → Usage and billing',
    },
    {
      id: 'adsense',
      titleBn: 'AdSense অনুমোদন',
      titleEn: 'AdSense approval',
      statusBn: adsenseConfigured ? 'সংযুক্ত আছে' : 'এখনো জমা দেওয়া হয়নি',
      statusEn: adsenseConfigured ? 'Connected' : 'Not submitted yet',
      detailBn: 'অনুমোদন দেয় Google — সাইট eduvelto.com-এ লাইভ হলে ও আসল কনটেন্ট থাকলে জমা দেওয়া যাবে।',
      detailEn: 'Google approves it — submittable once the site is live on eduvelto.com with real content.',
      whereBn: 'Google AdSense অ্যাকাউন্ট (আপনার অ্যাকাউন্ট)',
      whereEn: 'Google AdSense account (your account)',
    },
    {
      id: 'play-store',
      titleBn: 'Play Store / App Store',
      titleEn: 'Play Store / App Store',
      statusBn: 'অ্যাপ এখনো তৈরি হয়নি — ২৫ ডলার ফি দেওয়া হয়নি',
      statusEn: 'Apps not built yet — $25 fee not paid',
      detailBn: 'অ্যাপ প্রকাশ করতে Play Console (২৫ ডলার একবার) ও App Store Connect লাগবে — দুটোই আপনার অ্যাকাউন্ট, আপনার অ্যাকশন।',
      detailEn: 'Publishing apps needs Play Console ($25 once) and App Store Connect — both your accounts, your action.',
      whereBn: 'Play Console / App Store Connect (আপনার অ্যাকাউন্ট)',
      whereEn: 'Play Console / App Store Connect (your account)',
    },
    {
      id: 'security',
      titleBn: 'পাসওয়ার্ড ও দুই ধাপের যাচাই (2FA)',
      titleEn: 'Password & two-step verification (2FA)',
      statusBn: 'আপনার নিজের অ্যাকশন — ড্যাশবোর্ডে নেই (ইচ্ছাকৃত)',
      statusEn: 'Your own action — not in the dashboard (by design)',
      detailBn: 'পাসওয়ার্ড বদল, দুই ধাপের যাচাই (2FA) চালু, অ্যাকাউন্ট উদ্ধার — এগুলো নিরাপত্তার জন্য শুধু আপনিই করবেন, অন্য কেউ নয়।',
      detailEn: 'Password change, two-step verification (2FA) setup, account recovery — only you do these, by design, never anyone else.',
      whereBn: 'লগইন পাতা → পাসওয়ার্ড বদল / Google অ্যাকাউন্ট → দুই ধাপের যাচাই (2FA)',
      whereEn: 'Login page → reset password / Google account → two-step verification (2FA)',
    },
  ];
}
