// Eduvelto — Job Preparation mock-exam audit log (Step 9 closure,
// checklist item 11: audit logging).
//
// Every mock lifecycle transition writes one best-effort audit
// entry to users/{uid}/jobExamAuditLogs (auto-ID): the exam was
// started, submitted, abandoned, or a submit failed. The audit log
// is an OPERATIONAL trail for the owner/Moderator (who took which
// mock, when, and whether the submit failed) — it is NOT a security
// control: a determined client can write a false entry, exactly as
// it can forge an attempt (Step 9 §4.3 residual limit — scores are
// therefore never "Verified"). The rules bound the SHAPE (owner
// only, fixed fields, trusted timestamp) so the trail cannot be
// rewritten into another student's record or backdated.
//
// Best-effort by design: logMockAuditEvent NEVER throws and NEVER
// blocks the exam flow — a failed audit write must not fail a
// submit. The entry carries NO answers, NO scores and NO personal
// data beyond the student's own uid (which the rules pin to the
// caller); the detail field is a short machine-readable reason
// code (e.g. 'key-unreadable'), never free text from the user.
//
// LANGUAGE: code comments in English; the detail codes are
// machine-readable, never shown to students.

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/** Mock audit event kinds (Step 9 lifecycle only). */
export const MOCK_AUDIT_EVENTS = [
  'mock_started',
  'mock_submitted',
  'mock_abandoned',
  'mock_submit_failed',
] as const;

export type MockAuditEvent = (typeof MOCK_AUDIT_EVENTS)[number];

/** A users/{uid}/jobExamAuditLogs doc. */
export interface JobExamAuditLogDoc {
  uid: string;
  event: MockAuditEvent;
  examSlug: string;
  mockId: string;
  sessionId: string;
  bundleId: string;
  createdAt: unknown;
  /** Short machine-readable reason code, or null. Never free text,
   * never an answer or a score. */
  detail: string | null;
}

/** Build one audit-log doc (createdAt is a server timestamp — the
 * rules require it to be ≤ now and < 5 minutes old, P0-03). */
export function buildMockAuditLogDoc(input: {
  uid: string;
  event: MockAuditEvent;
  examSlug: string;
  mockId: string;
  sessionId: string;
  bundleId: string;
  detail?: string | null;
}): JobExamAuditLogDoc {
  return {
    uid: input.uid,
    event: input.event,
    examSlug: input.examSlug,
    mockId: input.mockId,
    sessionId: input.sessionId,
    bundleId: input.bundleId,
    createdAt: serverTimestamp(),
    detail: input.detail ?? null,
  };
}

/** Light lib-side validation of an audit-log doc (mirrors
 * validJobExamAuditLog in the rules — the rules are the authority;
 * this only keeps malformed docs from being attempted). Returns
 * problem strings; empty = valid. */
export function validateMockAuditLog(doc: unknown): string[] {
  const problems: string[] = [];
  const label = 'jobExamAuditLogs';
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    return [`${label}: doc must be an object`];
  }
  const d = doc as Record<string, unknown>;
  const keys = Object.keys(d);
  const allowed = ['uid', 'event', 'examSlug', 'mockId', 'sessionId', 'bundleId', 'createdAt', 'detail'];
  for (const k of keys) {
    if (!allowed.includes(k)) problems.push(`${label}: unknown field '${k}'`);
  }
  for (const f of ['uid', 'examSlug', 'mockId', 'sessionId', 'bundleId'] as const) {
    if (typeof d[f] !== 'string' || (d[f] as string).length === 0 || (d[f] as string).length > 200) {
      problems.push(`${label}: ${f} must be a non-empty string ≤200 chars`);
    }
  }
  if (!(MOCK_AUDIT_EVENTS as readonly string[]).includes(String(d.event))) {
    problems.push(`${label}: event must be one of ${MOCK_AUDIT_EVENTS.join(', ')}`);
  }
  if (d.detail !== null && (typeof d.detail !== 'string' || d.detail.length > 500)) {
    problems.push(`${label}: detail must be null or a string ≤500 chars`);
  }
  return problems;
}

/** Write one audit entry, best-effort: resolves (never rejects)
 * whether the write landed or not. Callers fire-and-forget this —
 * `void logMockAuditEvent(...)` — so the exam flow never waits on
 * the audit trail. */
export async function logMockAuditEvent(
  uid: string,
  input: Omit<Parameters<typeof buildMockAuditLogDoc>[0], 'uid'>,
): Promise<void> {
  try {
    if (!db) return;
    const doc = buildMockAuditLogDoc({ uid, ...input });
    if (validateMockAuditLog(doc).length > 0) return;
    await addDoc(collection(db, 'users', uid, 'jobExamAuditLogs'), doc as unknown as Record<string, unknown>);
  } catch {
    // Audit is informational only — a failed write never surfaces.
  }
}
