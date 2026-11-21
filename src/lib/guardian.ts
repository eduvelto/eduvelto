// Eduvelto — guardian ↔ child linking (Step 8).
//
// Built on the EXISTING `parentLinks` collection (firestore.rules,
// "parent links / invites — Phase 4, gated on consent design") — the
// role proposal's `guardianLinks` maps to this collection, not a new
// one, so no duplicate structure is created.
//
// Link document ID is deterministic: `${parentUid}_${childUid}` — one
// link per guardian–child pair, and the rules can check it with a
// single get() (isLinkedGuardian helper in firestore.rules).
//
// FLOW (two proofs, per the proposal §4, corrected 21 Nov 07:36):
//   1. Guardian requests: creates parentLinks/{parentUid}_{childUid}
//      with status 'pending', carrying their OWN name + relationship +
//      contact and the child's name/class/institution/ID as typed.
//      Written info ONLY — no documents, no OTP, no SMS, no fee.
//   2. Child confirms in-app: the child (signed in as themself) sets
//      status 'pending' -> 'confirmed' on their own Confirmation
//      Screen ("Yes, this is my parent/guardian"). No link without the
//      child's consent. This is the family's proof.
//   3. Admin decides: an Admin cross-checks the written information
//      and sets 'confirmed' -> 'verified' (approve) or -> 'rejected'
//      (reject, with a reason ≥10 chars). This is the record's proof.
//   4. Anyone revokes at any time: the child, the guardian, or an
//      Admin sets status 'revoked'. After revocation the guardian
//      immediately loses access (rules deny reads without a 'verified'
//      link).
//
// AUDIT (binding): EVERY linking activity writes an adminActions entry
// in the SAME batch as the link change — request, child confirmation,
// admin decision, revoke. The change and its audit trail succeed or
// fail together. Actions: guardian-link-requested /
// guardian-link-confirmed / guardian-link-approved /
// guardian-link-rejected / guardian-link-revoked.
//
// PRIVACY (privacy proposal §0–§3, binding): a guardian sees ONLY
// progress, results, routines, notices and teacher updates for
// verified-linked children — NEVER the child's messages, NEVER another
// student's data, NEVER the child's email/phone. The link document
// carries only the child's display name + current class (denormalized
// so the guardian dashboard can show it WITHOUT reading the child's
// users doc, which holds the email). The child updates
// childClassLevel on the link when their class changes (or an Admin
// does); the guardian dashboard reads the child's live profile only
// through the link-gated read, and the UI renders displayName +
// academic fields only — never email/phone.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type ParentLinkStatus = 'pending' | 'confirmed' | 'verified' | 'rejected' | 'revoked';

export interface ParentLink {
  id: string;
  parentId: string;
  studentId: string;
  status: ParentLinkStatus;
  /** Guardian's own name, relationship and contact — as typed in the request. */
  guardianDisplayName: string;
  relationship: string;
  guardianContact: string;
  childDisplayName: string;
  childClassLevel: string;
  childInstitution: string;
  /** Denormalized academic snapshot of the child (updated by the child
   * whenever their academic profile changes) — the guardian dashboard
   * filters the child's books from THIS, so it never needs to read the
   * child's users doc (which holds the child's email). */
  childEducationType?: string;
  childDepartment?: string;
  childProgram?: string;
  childBoard?: string;
  requestedAt?: unknown;
  confirmedAt?: unknown;
  verifiedAt?: unknown;
  rejectedAt?: unknown;
  revokedAt?: unknown;
  verifiedBy?: string;
  decidedBy?: string;
  decisionReason?: string;
}

export function parentLinkId(parentUid: string, childUid: string): string {
  return `${parentUid}_${childUid}`;
}

function toLink(id: string, d: Record<string, unknown>): ParentLink {
  return {
    id,
    parentId: (d.parentId as string) ?? '',
    studentId: (d.studentId as string) ?? '',
    status: (d.status as ParentLinkStatus) ?? 'pending',
    guardianDisplayName: (d.guardianDisplayName as string) ?? '',
    relationship: (d.relationship as string) ?? '',
    guardianContact: (d.guardianContact as string) ?? '',
    childDisplayName: (d.childDisplayName as string) ?? '',
    childClassLevel: (d.childClassLevel as string) ?? '',
    childInstitution: (d.childInstitution as string) ?? '',
    childEducationType: (d.childEducationType as string) ?? undefined,
    childDepartment: (d.childDepartment as string) ?? undefined,
    childProgram: (d.childProgram as string) ?? undefined,
    childBoard: (d.childBoard as string) ?? undefined,
    requestedAt: d.requestedAt,
    confirmedAt: d.confirmedAt,
    verifiedAt: d.verifiedAt,
    rejectedAt: d.rejectedAt,
    revokedAt: d.revokedAt,
    verifiedBy: (d.verifiedBy as string) ?? undefined,
    decidedBy: (d.decidedBy as string) ?? undefined,
    decisionReason: (d.decisionReason as string) ?? undefined,
  };
}

/** One audit entry for a linking activity (same batch as the link change). */
function auditEntry(
  batch: ReturnType<typeof writeBatch>,
  db: Firestore,
  actorUid: string,
  action: string,
  linkId: string,
  details: string,
  before: string,
  after: string,
): void {
  batch.set(doc(collection(db, 'adminActions')), {
    actorId: actorUid,
    action,
    details: details.slice(0, 1000),
    targetId: linkId,
    before: before.slice(0, 500),
    after: after.slice(0, 500),
    createdAt: serverTimestamp(),
  });
}

export interface GuardianRequestInfo {
  guardianDisplayName: string;
  relationship: string;
  guardianContact: string;
  childDisplayName: string;
  childClassLevel: string;
  childInstitution: string;
}

/** Guardian requests a link to a child (status 'pending') + audit entry. */
export async function requestParentLink(
  db: Firestore,
  parentUid: string,
  childUid: string,
  info: GuardianRequestInfo,
): Promise<ParentLink> {
  if (childUid === parentUid) throw new Error('cannot-link-self');
  if (!info.guardianDisplayName.trim() || !info.relationship.trim()) {
    throw new Error('guardian-info-required');
  }
  if (!info.childDisplayName.trim() || !info.childClassLevel.trim()) {
    throw new Error('child-info-required');
  }
  const id = parentLinkId(parentUid, childUid);
  const batch = writeBatch(db);
  batch.set(doc(db, 'parentLinks', id), {
    parentId: parentUid,
    studentId: childUid,
    status: 'pending' as const,
    guardianDisplayName: info.guardianDisplayName.trim().slice(0, 100),
    relationship: info.relationship.trim().slice(0, 50),
    guardianContact: info.guardianContact.trim().slice(0, 20),
    childDisplayName: info.childDisplayName.trim().slice(0, 100),
    childClassLevel: info.childClassLevel.trim().slice(0, 100),
    childInstitution: info.childInstitution.trim().slice(0, 200),
    requestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  auditEntry(
    batch,
    db,
    parentUid,
    'guardian-link-requested',
    id,
    `${info.guardianDisplayName.trim()} (${info.relationship.trim()}) → ${info.childDisplayName.trim()} (${info.childClassLevel.trim()})`,
    'none',
    'pending',
  );
  await batch.commit();
  const snap = await getDoc(doc(db, 'parentLinks', id));
  if (!snap.exists()) throw new Error('link-create-failed');
  return toLink(snap.id, snap.data());
}

/** The child confirms the guardian's request (pending -> confirmed) + audit entry. */
export async function confirmParentLink(db: Firestore, linkId: string, childUid: string): Promise<void> {
  const ref = doc(db, 'parentLinks', linkId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('link-not-found');
  if (snap.data().status !== 'pending') throw new Error('link-not-pending');
  if (snap.data().studentId !== childUid) throw new Error('not-the-child');
  const batch = writeBatch(db);
  batch.update(ref, {
    status: 'confirmed',
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  auditEntry(
    batch,
    db,
    childUid,
    'guardian-link-confirmed',
    linkId,
    `Child confirmed guardian link ${linkId}`,
    'pending',
    'confirmed',
  );
  await batch.commit();
}

/** The child REJECTS the guardian's request (pending -> revoked) + audit entry. */
export async function rejectParentLink(db: Firestore, linkId: string, childUid: string): Promise<void> {
  const ref = doc(db, 'parentLinks', linkId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('link-not-found');
  if (snap.data().status !== 'pending') throw new Error('link-not-pending');
  if (snap.data().studentId !== childUid) throw new Error('not-the-child');
  const batch = writeBatch(db);
  batch.update(ref, {
    status: 'revoked',
    revokedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  auditEntry(
    batch,
    db,
    childUid,
    'guardian-link-revoked',
    linkId,
    `Child rejected guardian link ${linkId}`,
    'pending',
    'revoked',
  );
  await batch.commit();
}

/**
 * Admin decides a confirmed (or pending) link: approve -> 'verified',
 * reject -> 'rejected' (reason mandatory, >= 10 chars). The decision +
 * audit entry are ONE batch. The decider may never decide a link they
 * are part of (a guardian-admin cannot approve their own child's link).
 */
export async function decideParentLink(
  db: Firestore,
  actorUid: string,
  linkId: string,
  decision: 'verified' | 'rejected',
  reason: string,
): Promise<void> {
  if (reason.trim().length < 10) throw new Error('decision-needs-reason');
  const ref = doc(db, 'parentLinks', linkId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('link-not-found');
  const data = snap.data();
  if (data.status !== 'pending' && data.status !== 'confirmed') {
    throw new Error('link-not-decidable');
  }
  if (data.parentId === actorUid || data.studentId === actorUid) {
    throw new Error('cannot-decide-own-link');
  }
  const batch = writeBatch(db);
  if (decision === 'verified') {
    batch.update(ref, {
      status: 'verified',
      verifiedBy: actorUid,
      verifiedAt: serverTimestamp(),
      decidedBy: actorUid,
      decisionReason: reason.trim().slice(0, 500),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(ref, {
      status: 'rejected',
      decidedBy: actorUid,
      decisionReason: reason.trim().slice(0, 500),
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  auditEntry(
    batch,
    db,
    actorUid,
    decision === 'verified' ? 'guardian-link-approved' : 'guardian-link-rejected',
    linkId,
    `${String(data.guardianDisplayName ?? '')} → ${String(data.childDisplayName ?? '')} — ${reason.trim().slice(0, 200)}`,
    String(data.status ?? ''),
    decision,
  );
  await batch.commit();
}

/** Guardian, child, or admin revokes a link at any time + audit entry. */
export async function revokeParentLink(db: Firestore, linkId: string, actorUid: string): Promise<void> {
  const ref = doc(db, 'parentLinks', linkId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('link-not-found');
  const before = String(snap.data().status ?? '');
  if (before === 'revoked') throw new Error('link-already-revoked');
  const batch = writeBatch(db);
  batch.update(ref, {
    status: 'revoked',
    revokedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  auditEntry(batch, db, actorUid, 'guardian-link-revoked', linkId, `Link ${linkId} revoked`, before, 'revoked');
  await batch.commit();
}

/** The child updates the denormalized academic snapshot on their own
 * link (called when the student saves a new classLevel — keeps the
 * guardian dashboard in sync automatically). */
export interface ChildAcademicSnapshot {
  childClassLevel: string;
  childDisplayName?: string;
  childEducationType?: string;
  childDepartment?: string;
  childProgram?: string;
  childBoard?: string;
}

export async function updateLinkChildClass(
  db: Firestore,
  linkId: string,
  snapshot: ChildAcademicSnapshot,
): Promise<void> {
  const patch: Record<string, unknown> = {
    childClassLevel: snapshot.childClassLevel.slice(0, 100),
    updatedAt: serverTimestamp(),
  };
  if (snapshot.childDisplayName !== undefined) patch.childDisplayName = snapshot.childDisplayName.slice(0, 100);
  if (snapshot.childEducationType !== undefined) patch.childEducationType = snapshot.childEducationType.slice(0, 50);
  if (snapshot.childDepartment !== undefined) patch.childDepartment = snapshot.childDepartment.slice(0, 100);
  if (snapshot.childProgram !== undefined) patch.childProgram = snapshot.childProgram.slice(0, 100);
  if (snapshot.childBoard !== undefined) patch.childBoard = snapshot.childBoard.slice(0, 200);
  await updateDoc(doc(db, 'parentLinks', linkId), patch);
}

/** All links where this user is the child (for the child's confirm step
 * and for syncing the academic snapshot on profile change). */
export async function listLinksForChild(db: Firestore, childUid: string): Promise<ParentLink[]> {
  const snap = await getDocs(query(collection(db, 'parentLinks'), where('studentId', '==', childUid)));
  return snap.docs.map((s) => toLink(s.id, s.data()));
}

/** All links for one guardian (any status). */
export async function listMyLinks(db: Firestore, parentUid: string): Promise<ParentLink[]> {
  const snap = await getDocs(query(collection(db, 'parentLinks'), where('parentId', '==', parentUid)));
  return snap.docs.map((s) => toLink(s.id, s.data()));
}

/** All links, newest-requested first (admin queue — client-sorted). */
export async function listAllParentLinks(db: Firestore): Promise<ParentLink[]> {
  const snap = await getDocs(collection(db, 'parentLinks'));
  const links = snap.docs.map((s) => toLink(s.id, s.data()));
  return links.sort((a, b) => {
    const ta = (a.requestedAt as { seconds?: number } | undefined)?.seconds ?? 0;
    const tb = (b.requestedAt as { seconds?: number } | undefined)?.seconds ?? 0;
    return tb - ta;
  });
}

/** Pending link requests addressed to one child (for the child's confirm step). */
export async function listPendingRequestsForChild(db: Firestore, childUid: string): Promise<ParentLink[]> {
  const snap = await getDocs(
    query(collection(db, 'parentLinks'), where('studentId', '==', childUid), where('status', '==', 'pending')),
  );
  return snap.docs.map((s) => toLink(s.id, s.data()));
}

/** Verified links for one guardian — the only children the guardian may see. */
export async function listVerifiedLinks(db: Firestore, parentUid: string): Promise<ParentLink[]> {
  const links = await listMyLinks(db, parentUid);
  return links.filter((l) => l.status === 'verified');
}

/** One link by id (guardian, child, or admin). */
export async function getParentLink(db: Firestore, linkId: string): Promise<ParentLink | null> {
  const snap = await getDoc(doc(db, 'parentLinks', linkId));
  if (!snap.exists()) return null;
  return toLink(snap.id, snap.data());
}
