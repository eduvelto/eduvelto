// Eduvelto — Job reports + corrections (Step 15, design §2.21):
// students report wrong content, teachers/students propose fixes.
// A report is a SIGNAL, never a fact — it never writes to the
// circular/question/lesson itself (ChatGPT principle #4).
//
// Two separate flows (design §2.21 — a report says what is wrong,
// a correction proposes what is right):
// - jobReports/{reportId}: a student reports a problem.
// - jobCorrections/{correctionId}: a student/teacher proposes a
//   fix (what is wrong + what is right + the source/evidence).
//
// DEPLOY-BLOCKED: both collections' rules are written and
// emulator-verified in this step but cannot deploy until the
// public-ID rules refactor frees ~4,992 compiled bytes (see
// firestore.rules). Until then, student report/correction writes
// are denied by the live rules and the UI shows that honestly
// (the form explains reports open after the admin update).
//
// ANONYMOUS REPORTS — REJECTED for v1 (ChatGPT allows them;
// Gemini wants authenticated-or-rate-limited; reconciled:
// authenticated-only). An open create rule with no rate limiting
// and no Cloud Functions to throttle it is a spam vector on
// Spark free; reporting is a signed-in-student feature in v1
// (students already sign in to practise). Anonymous reporting is
// a Phase 3 item if abuse controls exist.

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

export type JobReportTargetType = 'jobQuestion' | 'jobLesson' | 'jobCircular' | 'jobMock';

/** Report reasons (design §2.21 + ChatGPT's circular report
 * categories). The question/lesson reasons and the circular
 * reasons share one enum; the client form offers only the
 * reasons that fit the target. The pairing is enforced
 * client-side — the rules check the enum only. */
export type JobReportReason =
  | 'wrong-answer'
  | 'wrong-explanation'
  | 'wrong-info'
  | 'wrong-deadline'
  | 'wrong-post-count'
  | 'broken-link'
  | 'new-extension'
  | 'wrong-organization'
  | 'duplicate'
  | 'other';

export const JOB_REPORT_REASONS: JobReportReason[] = [
  'wrong-answer',
  'wrong-explanation',
  'wrong-info',
  'wrong-deadline',
  'wrong-post-count',
  'broken-link',
  'new-extension',
  'wrong-organization',
  'duplicate',
  'other',
];

export const JOB_REPORT_REASON_BN: Record<JobReportReason, string> = {
  'wrong-answer': 'ভুল উত্তর',
  'wrong-explanation': 'ভুল ব্যাখ্যা',
  'wrong-info': 'ভুল তথ্য',
  'wrong-deadline': 'ভুল শেষ তারিখ',
  'wrong-post-count': 'ভুল পদসংখ্যা',
  'broken-link': 'ভাঙা লিংক',
  'new-extension': 'নতুন সময়-বৃদ্ধি',
  'wrong-organization': 'ভুল সংস্থা',
  duplicate: 'ডুপ্লিকেট বিজ্ঞপ্তি',
  other: 'অন্য ভুল তথ্য',
};

/** Reasons offered for a circular report (ChatGPT's six
 * circular categories + other). */
export const CIRCULAR_REPORT_REASONS: JobReportReason[] = [
  'wrong-deadline',
  'wrong-post-count',
  'broken-link',
  'new-extension',
  'wrong-organization',
  'duplicate',
  'other',
];

/** Report statuses (design §2.21). ChatGPT's triage maps onto
 * this enum: new → open; under review / needs evidence /
 * confirmed → investigating (with a note); resolved → resolved;
 * dismissed → dismissed. */
export type JobReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export const JOB_REPORT_STATUSES: JobReportStatus[] = ['open', 'investigating', 'resolved', 'dismissed'];

export const JOB_REPORT_STATUS_BN: Record<JobReportStatus, string> = {
  open: 'খোলা',
  investigating: 'তদন্তে',
  resolved: 'সমাধান হয়েছে',
  dismissed: 'বাতিল',
};

/** Priority (ChatGPT): normal / high / urgent — urgent for
 * possible fraud or a materially wrong deadline. Multiple
 * reports about the same field are a prioritisation signal,
 * never proof. */
export type JobReportPriority = 'normal' | 'high' | 'urgent';

export interface JobReport {
  docId: string;
  reporterId: string;
  targetType: JobReportTargetType;
  targetId: string;
  targetAuthorId: string;
  reason: JobReportReason;
  details: string | null;
  /** Student's suggested correct value (never written into the
   * circular's official fields). */
  suggestedValue: string | null;
  /** Evidence URL the student offers (official notice link). */
  evidenceUrl: string | null;
  status: JobReportStatus;
  priority: JobReportPriority;
  resolvedBy: string | null;
  resolvedAtMillis: number | null;
  resolutionNote: string | null;
  createdAtMillis: number | null;
  updatedAtMillis: number | null;
}

export function jobReportFromStored(docId: string, data: Record<string, unknown>): JobReport | null {
  if (typeof data.reporterId !== 'string' || data.reporterId.length === 0) return null;
  if (typeof data.targetId !== 'string' || data.targetId.length === 0) return null;
  if (typeof data.reason !== 'string' || !JOB_REPORT_REASONS.includes(data.reason as JobReportReason)) return null;
  const toMillis = (v: unknown): number | null => {
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
  };
  const status = (data.status as JobReportStatus) ?? 'open';
  if (!JOB_REPORT_STATUSES.includes(status)) return null;
  return {
    docId,
    reporterId: data.reporterId as string,
    targetType: (data.targetType as JobReportTargetType) ?? 'jobCircular',
    targetId: data.targetId as string,
    targetAuthorId: (data.targetAuthorId as string) ?? '',
    reason: data.reason as JobReportReason,
    details: (data.details as string | null) ?? null,
    suggestedValue: (data.suggestedValue as string | null) ?? null,
    evidenceUrl: (data.evidenceUrl as string | null) ?? null,
    status,
    priority: (data.priority as JobReportPriority) ?? 'normal',
    resolvedBy: (data.resolvedBy as string | null) ?? null,
    resolvedAtMillis: toMillis(data.resolvedAt),
    resolutionNote: (data.resolutionNote as string | null) ?? null,
    createdAtMillis: toMillis(data.createdAt),
    updatedAtMillis: toMillis(data.updatedAt),
  };
}

export function validateJobReport(data: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const allowed = [
    'reporterId', 'targetType', 'targetId', 'targetAuthorId', 'reason', 'details',
    'suggestedValue', 'evidenceUrl', 'status', 'priority', 'resolvedBy', 'resolvedAt',
    'resolutionNote', 'createdAt', 'updatedAt',
  ];
  for (const k of Object.keys(data)) {
    if (!allowed.includes(k)) problems.push(`jobReports: unexpected key '${k}'`);
  }
  if (typeof data.reporterId !== 'string' || (data.reporterId as string).length === 0) {
    problems.push('jobReports: reporterId must be a non-empty string');
  }
  if (typeof data.reason !== 'string' || !JOB_REPORT_REASONS.includes(data.reason as JobReportReason)) {
    problems.push('jobReports: reason must be one of the report reasons');
  }
  if (
    typeof data.targetType !== 'string' ||
    !(['jobQuestion', 'jobLesson', 'jobCircular', 'jobMock'] as string[]).includes(data.targetType as string)
  ) {
    problems.push('jobReports: targetType is invalid');
  }
  if (typeof data.details === 'string' && (data.details as string).length > 2000) {
    problems.push('jobReports: details must be at most 2000 characters');
  }
  if (typeof data.suggestedValue === 'string' && (data.suggestedValue as string).length > 500) {
    problems.push('jobReports: suggestedValue must be at most 500 characters');
  }
  return problems;
}

export interface NewJobReport {
  reporterId: string;
  targetType: JobReportTargetType;
  targetId: string;
  targetAuthorId: string;
  reason: JobReportReason;
  details: string | null;
  suggestedValue: string | null;
  evidenceUrl: string | null;
  priority: JobReportPriority;
}

export async function createJobReport(input: NewJobReport): Promise<string> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  const data: Record<string, unknown> = {
    reporterId: input.reporterId,
    targetType: input.targetType,
    targetId: input.targetId,
    targetAuthorId: input.targetAuthorId,
    reason: input.reason,
    details: input.details,
    suggestedValue: input.suggestedValue,
    evidenceUrl: input.evidenceUrl,
    status: 'open',
    priority: input.priority,
    resolvedBy: null,
    resolvedAt: null,
    resolutionNote: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const problems = validateJobReport(data);
  if (problems.length > 0) throw new Error(problems[0]);
  const ref = await addDoc(collection(firestore, 'jobReports'), data);
  return ref.id;
}

/** Admin inbox: open reports first (client-side sort — one ==
 * filter + limit, no composite index). */
export async function listJobReports(args?: {
  status?: JobReportStatus | null;
  pageSize?: number;
}): Promise<JobReport[]> {
  const firestore = db;
  if (!firestore) return [];
  const constraints = [];
  if (args?.status) constraints.push(where('status', '==', args.status));
  const snap = await getDocs(
    query(collection(firestore, 'jobReports'), ...constraints, limit(args?.pageSize ?? 25)),
  );
  const out: JobReport[] = [];
  for (const d of snap.docs) {
    const r = jobReportFromStored(d.id, d.data() as Record<string, unknown>);
    if (r !== null) out.push(r);
  }
  out.sort((a, b) => (b.createdAtMillis ?? -1) - (a.createdAtMillis ?? -1));
  return out;
}

/** Moderator decision on a report. Resolving NEVER writes the
 * student's suggestion into the circular — the moderator opens
 * the circular in the editor workflow, verifies against the
 * official source, and updates it there (creating a history
 * entry). The report only records the outcome. */
export async function decideJobReport(
  report: JobReport,
  status: 'investigating' | 'resolved' | 'dismissed',
  resolutionNote: string,
  uid: string,
): Promise<void> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (report.status === 'resolved' || report.status === 'dismissed') {
    throw new Error('এই রিপোর্টের সিদ্ধান্ত ইতিমধ্যে হয়ে গেছে।');
  }
  if (status !== 'investigating' && resolutionNote.trim().length < 10) {
    throw new Error('সিদ্ধান্তের কারণ কমপক্ষে ১০ অক্ষরের হতে হবে।');
  }
  await updateDoc(doc(firestore, 'jobReports', report.docId), {
    status,
    resolvedBy: status === 'investigating' ? null : uid,
    resolvedAt: status === 'investigating' ? null : serverTimestamp(),
    resolutionNote: resolutionNote.trim().length > 0 ? resolutionNote.trim() : null,
    updatedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Corrections (design §2.21)
// ---------------------------------------------------------------------------

export type JobCorrectionStatus = 'pending' | 'accepted' | 'rejected';

export const JOB_CORRECTION_STATUS_BN: Record<JobCorrectionStatus, string> = {
  pending: 'অপেক্ষমাণ',
  accepted: 'গৃহীত',
  rejected: 'খারিজ',
};

export interface JobCorrection {
  docId: string;
  requesterId: string;
  targetType: JobReportTargetType;
  targetId: string;
  whatsWrong: string;
  proposedFix: string;
  source: string;
  status: JobCorrectionStatus;
  decidedBy: string | null;
  decidedAtMillis: number | null;
  decisionReason: string | null;
  createdAtMillis: number | null;
  updatedAtMillis: number | null;
}

export function jobCorrectionFromStored(docId: string, data: Record<string, unknown>): JobCorrection | null {
  if (typeof data.requesterId !== 'string' || data.requesterId.length === 0) return null;
  if (typeof data.whatsWrong !== 'string' || data.whatsWrong.length === 0) return null;
  if (typeof data.proposedFix !== 'string' || data.proposedFix.length === 0) return null;
  if (typeof data.source !== 'string' || data.source.length === 0) return null;
  const status = (data.status as JobCorrectionStatus) ?? 'pending';
  if (status !== 'pending' && status !== 'accepted' && status !== 'rejected') return null;
  const toMillis = (v: unknown): number | null => {
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
  };
  return {
    docId,
    requesterId: data.requesterId as string,
    targetType: (data.targetType as JobReportTargetType) ?? 'jobCircular',
    targetId: (data.targetId as string) ?? '',
    whatsWrong: data.whatsWrong as string,
    proposedFix: data.proposedFix as string,
    source: data.source as string,
    status,
    decidedBy: (data.decidedBy as string | null) ?? null,
    decidedAtMillis: toMillis(data.decidedAt),
    decisionReason: (data.decisionReason as string | null) ?? null,
    createdAtMillis: toMillis(data.createdAt),
    updatedAtMillis: toMillis(data.updatedAt),
  };
}

export interface NewJobCorrection {
  requesterId: string;
  targetType: JobReportTargetType;
  targetId: string;
  whatsWrong: string;
  proposedFix: string;
  source: string;
}

export async function createJobCorrection(input: NewJobCorrection): Promise<string> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (input.whatsWrong.trim().length === 0 || input.whatsWrong.length > 2000) {
    throw new Error('কী ভুল তা লিখুন (সর্বোচ্চ ২০০০ অক্ষর)।');
  }
  if (input.proposedFix.trim().length === 0 || input.proposedFix.length > 2000) {
    throw new Error('সঠিক কী হওয়া উচিত তা লিখুন (সর্বোচ্চ ২০০০ অক্ষর)।');
  }
  if (input.source.trim().length === 0 || input.source.length > 500) {
    throw new Error('সংশোধনের উৎস/প্রমাণ দিন (সর্বোচ্চ ৫০০ অক্ষর)।');
  }
  const ref = await addDoc(collection(firestore, 'jobCorrections'), {
    requesterId: input.requesterId,
    targetType: input.targetType,
    targetId: input.targetId,
    whatsWrong: input.whatsWrong.trim(),
    proposedFix: input.proposedFix.trim(),
    source: input.source.trim(),
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listJobCorrections(args?: {
  status?: JobCorrectionStatus | null;
  pageSize?: number;
}): Promise<JobCorrection[]> {
  const firestore = db;
  if (!firestore) return [];
  const constraints = [];
  if (args?.status) constraints.push(where('status', '==', args.status));
  const snap = await getDocs(
    query(collection(firestore, 'jobCorrections'), ...constraints, limit(args?.pageSize ?? 25)),
  );
  const out: JobCorrection[] = [];
  for (const d of snap.docs) {
    const c = jobCorrectionFromStored(d.id, d.data() as Record<string, unknown>);
    if (c !== null) out.push(c);
  }
  out.sort((a, b) => (b.createdAtMillis ?? -1) - (a.createdAtMillis ?? -1));
  return out;
}

/** Moderator decision. Accepting a correction does NOT apply
 * it to the circular automatically — the moderator applies the
 * fix in the editor workflow (with the official source checked
 * and a history entry), then marks it accepted here. */
export async function decideJobCorrection(
  correction: JobCorrection,
  status: 'accepted' | 'rejected',
  decisionReason: string,
  uid: string,
): Promise<void> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  if (correction.status !== 'pending') throw new Error('এই অনুরোধের সিদ্ধান্ত ইতিমধ্যে হয়ে গেছে।');
  if (decisionReason.trim().length < 10) throw new Error('সিদ্ধান্তের কারণ কমপক্ষে ১০ অক্ষরের হতে হবে।');
  await updateDoc(doc(firestore, 'jobCorrections', correction.docId), {
    status,
    decidedBy: uid,
    decidedAt: serverTimestamp(),
    decisionReason: decisionReason.trim(),
    updatedAt: serverTimestamp(),
  });
}
