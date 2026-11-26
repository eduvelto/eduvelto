// Eduvelto — unified user feedback (Day 3 Report Error, unified 26 Nov 2026).
//
// ONE collection `feedback/{feedbackId}` with a `type` field replaces
// three separate collections:
//   - type 'question-error': a student reports a wrong question
//     (wrong answer / wrong explanation / typo / out-of-syllabus /
//     other). This is the Day 3 Report Error flow.
//   - type 'contact': the Contact page message (was `contactMessages`).
//   - type 'report': a general report against content/a user
//     (spam / abuse / copyright / personal-info / other; was
//     `reports`). Read by admin oversight (getUserDetail).
//
// A feedback doc is a SIGNAL, never a fact — deciding one NEVER
// writes to the question/content itself and NEVER grants anything
// (no Pro reward in this flow; the "7 days free Pro for valid
// reporters" is a later plan, not implemented here).
//
// Common fields (all types):
//   type: 'question-error' | 'contact' | 'report'
//   reporterUid: string — the signed-in uid. 'anonymous' is the
//     shape-level sentinel for a signed-out reporter, but v1
//     submit requires sign-in (the rules allow create only for
//     a signed-in user whose reporterUid == uid()).
//   status: 'pending' (question-error, contact) | 'open' (report)
//     | 'valid' | 'invalid' (question-error decisions only)
//   createdAt / updatedAt: server timestamps.
// Type-specific fields are validated per type in the rules
// (validFeedbackCreate) and in the builders below.
//
// Rules (firestore.rules): any signed-in user can create (own uid
// only, per-type status + fields); only moderators (admin/owner
// included) can read/update, EXCEPT a type='report' reporter may
// read their own report; delete never. See
// emulator-tests/rules-feedback.test.ts.

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

export type FeedbackType = 'question-error' | 'contact' | 'report';

export const FEEDBACK_TYPES: FeedbackType[] = ['question-error', 'contact', 'report'];

export type QuestionReportErrorType =
  | 'wrong-answer'
  | 'wrong-explanation'
  | 'typo'
  | 'out-of-syllabus'
  | 'other';

export const QUESTION_REPORT_ERROR_TYPES: QuestionReportErrorType[] = [
  'wrong-answer',
  'wrong-explanation',
  'typo',
  'out-of-syllabus',
  'other',
];

export const QUESTION_REPORT_ERROR_TYPE_BN: Record<QuestionReportErrorType, string> = {
  'wrong-answer': 'ভুল উত্তর',
  'wrong-explanation': 'ভুল ব্যাখ্যা',
  typo: 'বানান/টাইপ ভুল',
  'out-of-syllabus': 'সিলেবাসের বাইরে',
  other: 'অন্য ভুল',
};

export type QuestionReportStatus = 'pending' | 'valid' | 'invalid';

export const QUESTION_REPORT_STATUSES: QuestionReportStatus[] = ['pending', 'valid', 'invalid'];

export const QUESTION_REPORT_STATUS_BN: Record<QuestionReportStatus, string> = {
  pending: 'অপেক্ষমাণ',
  valid: 'সঠিক রিপোর্ট',
  invalid: 'ভুল রিপোর্ট',
};

export const QUESTION_REPORT_DESCRIPTION_MAX = 1000;
export const QUESTION_TEXT_SNAPSHOT_MAX = 200;

export type ReportReason = 'spam' | 'abuse' | 'copyright' | 'personal-info' | 'other';
export const REPORT_REASONS: ReportReason[] = ['spam', 'abuse', 'copyright', 'personal-info', 'other'];

export type ReportTargetType = 'post' | 'comment' | 'socialPost' | 'user' | 'message';
export const REPORT_TARGET_TYPES: ReportTargetType[] = ['post', 'comment', 'socialPost', 'user', 'message'];

export const CONTACT_MESSAGE_MAX = 5000;

export interface QuestionReport {
  docId: string;
  /** Always 'question-error' — the feedback collection's type field. */
  type: 'question-error';
  questionId: string;
  questionText: string;
  errorType: QuestionReportErrorType;
  description: string;
  reporterUid: string;
  status: QuestionReportStatus;
  /** True only after an admin approves (status 'valid'). */
  flaggedForCorrection: boolean;
  decidedBy: string | null;
  decidedAtMillis: number | null;
  decisionNote: string | null;
  createdAtMillis: number | null;
  updatedAtMillis: number | null;
}

/** Snapshot of the question text stored on the report — the
 * first 200 characters, so the report keeps its meaning even
 * if the question is edited later. */
export function questionTextSnapshot(questionText: string): string {
  return questionText.slice(0, QUESTION_TEXT_SNAPSHOT_MAX);
}

export interface NewQuestionReport {
  questionId: string;
  questionText: string;
  errorType: QuestionReportErrorType;
  description: string;
  reporterUid: string;
}

const QUESTION_ERROR_KEYS = [
  'type',
  'questionId',
  'questionText',
  'errorType',
  'description',
  'reporterUid',
  'status',
  'flaggedForCorrection',
  'decidedBy',
  'decidedAt',
  'decisionNote',
  'createdAt',
  'updatedAt',
];

export function validateQuestionReport(data: Record<string, unknown>): string[] {
  const problems: string[] = [];
  for (const k of Object.keys(data)) {
    if (!QUESTION_ERROR_KEYS.includes(k)) problems.push(`feedback: unexpected key '${k}'`);
  }
  if (data.type !== 'question-error') problems.push("feedback: type must be 'question-error'");
  if (typeof data.questionId !== 'string' || (data.questionId as string).length === 0 || (data.questionId as string).length > 200) {
    problems.push('feedback: questionId must be a non-empty string of at most 200 characters');
  }
  if (typeof data.questionText !== 'string' || (data.questionText as string).length === 0 || (data.questionText as string).length > QUESTION_TEXT_SNAPSHOT_MAX) {
    problems.push('feedback: questionText must be a non-empty string of at most 200 characters (snapshot)');
  }
  if (typeof data.errorType !== 'string' || !QUESTION_REPORT_ERROR_TYPES.includes(data.errorType as QuestionReportErrorType)) {
    problems.push('feedback: errorType must be one of the report error types');
  }
  if (typeof data.description !== 'string' || (data.description as string).trim().length === 0) {
    problems.push('feedback: description must not be empty');
  } else if ((data.description as string).length > QUESTION_REPORT_DESCRIPTION_MAX) {
    problems.push(`feedback: description must be at most ${QUESTION_REPORT_DESCRIPTION_MAX} characters`);
  }
  if (typeof data.reporterUid !== 'string' || (data.reporterUid as string).length === 0) {
    problems.push('feedback: reporterUid must be a non-empty string');
  }
  if (typeof data.status !== 'string' || !QUESTION_REPORT_STATUSES.includes(data.status as QuestionReportStatus)) {
    problems.push('feedback: status must be pending, valid or invalid');
  }
  if (typeof data.flaggedForCorrection !== 'boolean') {
    problems.push('feedback: flaggedForCorrection must be a boolean');
  }
  return problems;
}

/** Pure builder: validates and returns the exact document a
 * submit writes (createdAt/updatedAt supplied by the caller so
 * tests can pass a fixed value; submit passes serverTimestamp).
 * Throws on the first validation problem. */
export function buildQuestionReportDoc(
  input: NewQuestionReport,
  createdAt: unknown,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    type: 'question-error',
    questionId: input.questionId,
    questionText: questionTextSnapshot(input.questionText),
    errorType: input.errorType,
    description: input.description.trim(),
    reporterUid: input.reporterUid,
    status: 'pending',
    flaggedForCorrection: false,
    decidedBy: null,
    decidedAt: null,
    decisionNote: null,
    createdAt,
    updatedAt: createdAt,
  };
  const problems = validateQuestionReport(data);
  if (problems.length > 0) throw new Error(problems[0]);
  return data;
}

/** Submit one question-error report. Signed-in only in v1 (the
 * rules enforce reporterUid == uid()); a signed-out /
 * 'anonymous' caller gets a Bangla sign-in error instead of a
 * silent write. */
export async function submitQuestionReport(input: NewQuestionReport): Promise<string> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (!input.reporterUid || input.reporterUid === 'anonymous') {
    throw new Error('রিপোর্ট পাঠাতে লগইন করুন।');
  }
  const data = buildQuestionReportDoc(input, serverTimestamp());
  const ref = await addDoc(collection(firestore, 'feedback'), data);
  return ref.id;
}

function toMillis(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'object') {
    const o = v as { toMillis?: unknown; seconds?: unknown };
    if (typeof o.toMillis === 'function') {
      const m = (o as { toMillis(): unknown }).toMillis();
      return typeof m === 'number' ? m : null;
    }
    if (typeof o.seconds === 'number') return (o.seconds as number) * 1000;
  }
  return null;
}

export function questionReportFromStored(docId: string, data: Record<string, unknown>): QuestionReport | null {
  if (data.type !== 'question-error') return null;
  if (typeof data.questionId !== 'string' || data.questionId.length === 0) return null;
  if (typeof data.questionText !== 'string' || data.questionText.length === 0) return null;
  if (typeof data.errorType !== 'string' || !QUESTION_REPORT_ERROR_TYPES.includes(data.errorType as QuestionReportErrorType)) return null;
  if (typeof data.reporterUid !== 'string' || data.reporterUid.length === 0) return null;
  const status = (data.status as QuestionReportStatus) ?? 'pending';
  if (!QUESTION_REPORT_STATUSES.includes(status)) return null;
  return {
    docId,
    type: 'question-error',
    questionId: data.questionId as string,
    questionText: data.questionText as string,
    errorType: data.errorType as QuestionReportErrorType,
    description: (data.description as string) ?? '',
    reporterUid: data.reporterUid as string,
    status,
    flaggedForCorrection: data.flaggedForCorrection === true,
    decidedBy: (data.decidedBy as string | null) ?? null,
    decidedAtMillis: toMillis(data.decidedAt),
    decisionNote: (data.decisionNote as string | null) ?? null,
    createdAtMillis: toMillis(data.createdAt),
    updatedAtMillis: toMillis(data.updatedAt),
  };
}

/** Admin queue: pending reports first (client-side sort — one
 * == filter + limit, no composite index; the type filter is
 * applied client-side in questionReportFromStored so no
 * type+status composite index is needed). */
export async function listQuestionReports(args?: {
  status?: QuestionReportStatus | null;
  pageSize?: number;
}): Promise<QuestionReport[]> {
  const firestore = db;
  if (!firestore) return [];
  const constraints = [];
  if (args?.status) constraints.push(where('status', '==', args.status));
  const snap = await getDocs(
    query(collection(firestore, 'feedback'), ...constraints, limit(args?.pageSize ?? 25)),
  );
  const out: QuestionReport[] = [];
  for (const d of snap.docs) {
    const r = questionReportFromStored(d.id, d.data() as Record<string, unknown>);
    if (r !== null) out.push(r);
  }
  out.sort((a, b) => (b.createdAtMillis ?? -1) - (a.createdAtMillis ?? -1));
  return out;
}

export type QuestionReportDecision = 'valid' | 'invalid';

/** Pure admin transition: only a pending report can be
 * decided. Approve ('valid') flags the question for
 * correction; reject ('invalid') does not. The question doc
 * itself is never touched — only this report's fields. */
export function decideQuestionReportTransition(
  report: QuestionReport,
  decision: QuestionReportDecision,
): { status: QuestionReportStatus; flaggedForCorrection: boolean } {
  if (report.status !== 'pending') {
    throw new Error('এই রিপোর্টের সিদ্ধান্ত ইতিমধ্যে হয়ে গেছে।');
  }
  if (decision !== 'valid' && decision !== 'invalid') {
    throw new Error('সিদ্ধান্ত valid অথবা invalid হতে হবে।');
  }
  return {
    status: decision,
    flaggedForCorrection: decision === 'valid',
  };
}

/** Admin decision on a question-error report. Approving marks
 * it 'valid' and flags the question for correction
 * (flaggedForCorrection); rejecting marks it 'invalid'. No
 * question is changed here and no reward is granted —
 * correction happens separately in the question editor
 * workflow. */
export async function decideQuestionReport(
  report: QuestionReport,
  decision: QuestionReportDecision,
  decisionNote: string,
  uid: string,
): Promise<void> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  const next = decideQuestionReportTransition(report, decision);
  await updateDoc(doc(firestore, 'feedback', report.docId), {
    ...next,
    decidedBy: uid,
    decidedAt: serverTimestamp(),
    decisionNote: decisionNote.trim().length > 0 ? decisionNote.trim() : null,
    updatedAt: serverTimestamp(),
  });
}

// ---- type 'contact' (Contact page message) ----

export interface NewContactMessage {
  name: string;
  email: string | null;
  message: string;
  reporterUid: string;
}

const CONTACT_KEYS = ['type', 'reporterUid', 'status', 'name', 'message', 'email', 'createdAt', 'updatedAt'];

export function validateContactMessage(data: Record<string, unknown>): string[] {
  const problems: string[] = [];
  for (const k of Object.keys(data)) {
    if (!CONTACT_KEYS.includes(k)) problems.push(`feedback: unexpected key '${k}'`);
  }
  if (data.type !== 'contact') problems.push("feedback: type must be 'contact'");
  if (typeof data.name !== 'string' || (data.name as string).trim().length === 0 || (data.name as string).length > 100) {
    problems.push('feedback: name must be a non-empty string of at most 100 characters');
  }
  if (typeof data.message !== 'string' || (data.message as string).trim().length === 0 || (data.message as string).length > CONTACT_MESSAGE_MAX) {
    problems.push(`feedback: message must be a non-empty string of at most ${CONTACT_MESSAGE_MAX} characters`);
  }
  if (data.email !== null && (typeof data.email !== 'string' || (data.email as string).length > 200)) {
    problems.push('feedback: email must be null or a string of at most 200 characters');
  }
  if (typeof data.reporterUid !== 'string' || (data.reporterUid as string).length === 0) {
    problems.push('feedback: reporterUid must be a non-empty string');
  }
  if (data.status !== 'pending') problems.push("feedback: contact status must be 'pending'");
  return problems;
}

export function buildContactMessageDoc(
  input: NewContactMessage,
  createdAt: unknown,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    type: 'contact',
    reporterUid: input.reporterUid,
    status: 'pending',
    name: input.name.trim(),
    message: input.message.trim(),
    email: input.email === null ? null : input.email.trim() || null,
    createdAt,
    updatedAt: createdAt,
  };
  const problems = validateContactMessage(data);
  if (problems.length > 0) throw new Error(problems[0]);
  return data;
}

/** Submit one contact message (Contact page). Signed-in only;
 * the rules enforce reporterUid == uid(). */
export async function submitContactMessage(input: NewContactMessage): Promise<string> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (!input.reporterUid || input.reporterUid === 'anonymous') {
    throw new Error('বার্তা পাঠাতে লগইন করুন।');
  }
  const data = buildContactMessageDoc(input, serverTimestamp());
  const ref = await addDoc(collection(firestore, 'feedback'), data);
  return ref.id;
}

// ---- type 'report' (general report against content / a user) ----

export interface NewReport {
  reason: ReportReason;
  targetType: ReportTargetType;
  targetId: string;
  targetAuthorId: string;
  details: string | null;
  reporterUid: string;
}

const REPORT_KEYS = [
  'type',
  'reporterUid',
  'status',
  'reason',
  'targetType',
  'targetId',
  'targetAuthorId',
  'details',
  'createdAt',
  'updatedAt',
];

export function validateReport(data: Record<string, unknown>): string[] {
  const problems: string[] = [];
  for (const k of Object.keys(data)) {
    if (!REPORT_KEYS.includes(k)) problems.push(`feedback: unexpected key '${k}'`);
  }
  if (data.type !== 'report') problems.push("feedback: type must be 'report'");
  if (typeof data.reason !== 'string' || !REPORT_REASONS.includes(data.reason as ReportReason)) {
    problems.push('feedback: reason must be one of spam, abuse, copyright, personal-info, other');
  }
  if (typeof data.targetType !== 'string' || !REPORT_TARGET_TYPES.includes(data.targetType as ReportTargetType)) {
    problems.push('feedback: targetType must be one of post, comment, socialPost, user, message');
  }
  if (typeof data.targetId !== 'string' || (data.targetId as string).length === 0) {
    problems.push('feedback: targetId must be a non-empty string');
  }
  if (typeof data.targetAuthorId !== 'string' || (data.targetAuthorId as string).length === 0) {
    problems.push('feedback: targetAuthorId must be a non-empty string');
  }
  if (data.details !== null && (typeof data.details !== 'string' || (data.details as string).length > 2000)) {
    problems.push('feedback: details must be null or a string of at most 2000 characters');
  }
  if (typeof data.reporterUid !== 'string' || (data.reporterUid as string).length === 0) {
    problems.push('feedback: reporterUid must be a non-empty string');
  }
  if (data.status !== 'open') problems.push("feedback: report status must be 'open'");
  return problems;
}

export function buildReportDoc(input: NewReport, createdAt: unknown): Record<string, unknown> {
  const data: Record<string, unknown> = {
    type: 'report',
    reporterUid: input.reporterUid,
    status: 'open',
    reason: input.reason,
    targetType: input.targetType,
    targetId: input.targetId,
    targetAuthorId: input.targetAuthorId,
    details: input.details === null ? null : input.details.trim() || null,
    createdAt,
    updatedAt: createdAt,
  };
  const problems = validateReport(data);
  if (problems.length > 0) throw new Error(problems[0]);
  return data;
}

/** Submit one general report (spam/abuse/copyright/
 * personal-info/other against a post, comment, social post,
 * user or message). Signed-in only; the rules enforce
 * reporterUid == uid(). No in-app writer uses this yet — it
 * exists so the type is submittable and testable; admin
 * oversight reads it via getUserDetail. */
export async function submitReport(input: NewReport): Promise<string> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (!input.reporterUid || input.reporterUid === 'anonymous') {
    throw new Error('রিপোর্ট পাঠাতে লগইন করুন।');
  }
  const data = buildReportDoc(input, serverTimestamp());
  const ref = await addDoc(collection(firestore, 'feedback'), data);
  return ref.id;
}
