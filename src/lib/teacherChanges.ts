// Eduvelto — teacher subject/class change requests (Step 5/7).
//
// A teacher's profile subjects/classes are a REQUEST until an Admin
// approves them. Changing them never takes effect silently:
//   1. Teacher submits: teacherChangeRequests/{id} with status
//      'pending' (requested subjects + classes + reason).
//   2. Admin decides (decideTeacherChangeRequest, dashboard or console):
//      'approved' -> the teacher's users doc subjects/teachingLevel/
//      classLevel are updated AND the request is marked approved, in ONE
//      batch, with an audit-log entry (adminActions). 'rejected' ->
//      request marked rejected with a reason; the profile is untouched.
//   3. Until approval, the teacher dashboard keeps showing the OLD
//      approved subjects/classes, with the pending request listed.
// The initial verification application uses the EXISTING
// teacherVerifications queue (admin.ts decideTeacherVerification) —
// this module is only for CHANGES after a teacher is verified.

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

export type TeacherChangeStatus = 'pending' | 'approved' | 'rejected';

export interface TeacherChangeRequest {
  id: string;
  teacherUid: string;
  requestedSubjects: string[];
  requestedClasses: string[];
  requestedTeachingLevel: string;
  reason: string;
  status: TeacherChangeStatus;
  decidedBy?: string;
  decidedAt?: unknown;
  decisionReason?: string;
}

function toRequest(id: string, d: Record<string, unknown>): TeacherChangeRequest {
  return {
    id,
    teacherUid: (d.teacherUid as string) ?? '',
    requestedSubjects: (d.requestedSubjects as string[]) ?? [],
    requestedClasses: (d.requestedClasses as string[]) ?? [],
    requestedTeachingLevel: (d.requestedTeachingLevel as string) ?? '',
    reason: (d.reason as string) ?? '',
    status: (d.status as TeacherChangeStatus) ?? 'pending',
    decidedBy: (d.decidedBy as string) ?? undefined,
    decidedAt: d.decidedAt,
    decisionReason: (d.decisionReason as string) ?? undefined,
  };
}

/** Teacher submits a subject/class change request (status 'pending'). */
export async function submitTeacherChangeRequest(
  db: Firestore,
  teacherUid: string,
  requestedSubjects: string[],
  requestedClasses: string[],
  requestedTeachingLevel: string,
  reason: string,
): Promise<string> {
  if (requestedSubjects.length === 0) throw new Error('change-needs-subject');
  if (reason.trim().length < 10) throw new Error('change-needs-reason');
  const ref = await addDoc(collection(db, 'teacherChangeRequests'), {
    teacherUid,
    requestedSubjects: requestedSubjects.slice(0, 20).map((s) => s.slice(0, 100)),
    requestedClasses: requestedClasses.slice(0, 20).map((s) => s.slice(0, 100)),
    requestedTeachingLevel: requestedTeachingLevel.slice(0, 100),
    reason: reason.trim().slice(0, 500),
    status: 'pending' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Pending requests for one teacher (newest first is client-sorted). */
export async function listMyChangeRequests(db: Firestore, teacherUid: string): Promise<TeacherChangeRequest[]> {
  const snap = await getDocs(
    query(collection(db, 'teacherChangeRequests'), where('teacherUid', '==', teacherUid)),
  );
  return snap.docs.map((s) => toRequest(s.id, s.data()));
}

/** All pending change requests (admin queue). */
export async function listPendingChangeRequests(db: Firestore): Promise<TeacherChangeRequest[]> {
  const snap = await getDocs(
    query(collection(db, 'teacherChangeRequests'), where('status', '==', 'pending')),
  );
  return snap.docs.map((s) => toRequest(s.id, s.data()));
}

/**
 * Admin decides a change request. Approve applies the requested
 * subjects/classes to the teacher's profile in the same batch as the
 * request decision + audit entry — they succeed or fail together.
 * Reject leaves the profile untouched. Reason mandatory (>= 10 chars).
 * The decider may never decide their own request.
 */
export async function decideTeacherChangeRequest(
  db: Firestore,
  actorUid: string,
  requestId: string,
  decision: 'approved' | 'rejected',
  reason: string,
): Promise<void> {
  if (reason.trim().length < 10) throw new Error('decision-needs-reason');
  const ref = doc(db, 'teacherChangeRequests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('change-request-not-found');
  const data = snap.data();
  if (data.status !== 'pending') throw new Error('change-request-not-pending');
  const teacherUid = data.teacherUid as string | undefined;
  if (!teacherUid || teacherUid === actorUid) throw new Error('cannot-decide-own-request');
  const batch = writeBatch(db);
  batch.update(ref, {
    status: decision,
    decidedBy: actorUid,
    decidedAt: serverTimestamp(),
    decisionReason: reason.trim().slice(0, 500),
    updatedAt: serverTimestamp(),
  });
  if (decision === 'approved') {
    batch.update(doc(db, 'users', teacherUid), {
      subjects: (data.requestedSubjects as string[]) ?? [],
      teachingLevel: (data.requestedTeachingLevel as string) ?? null,
      classLevel: ((data.requestedClasses as string[]) ?? [])[0] ?? null,
      updatedAt: serverTimestamp(),
    });
  }
  // Audit entry in the SAME batch — the decision and its audit trail
  // succeed or fail together (admin.ts discipline). The rules require
  // actorId == caller, action in the fixed enum, createdAt a timestamp.
  batch.set(doc(collection(db, 'adminActions')), {
    actorId: actorUid,
    action: decision === 'approved' ? 'teacher-change-approved' : 'teacher-change-rejected',
    details: `${teacherUid} — ${reason.trim().slice(0, 200)}`,
    targetId: requestId,
    before: 'pending',
    after: decision,
    reason: reason.trim().slice(0, 500),
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}
