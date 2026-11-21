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
// FLOW (two proofs, per the proposal §4):
//   1. Guardian requests: creates parentLinks/{parentUid}_{childUid}
//      with status 'pending', carrying the child's name/class/
//      institution as typed by the guardian.
//   2. Child confirms in-app: the child (signed in as themself) sets
//      status 'pending' -> 'confirmed'. This is the family's proof.
//   3. Admin activates: an Admin sets 'confirmed' -> 'verified' after
//      the consent record is complete. This is the record's proof.
//      (The existing rule already said "Only Admin activates a link
//      after the consent record is complete" — kept.)
//   4. Anyone revokes at any time: guardian, child, or Admin sets
//      status 'revoked'. After revocation the guardian immediately
//      loses access (rules deny reads without a 'verified' link).
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
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type ParentLinkStatus = 'pending' | 'confirmed' | 'verified' | 'revoked';

export interface ParentLink {
  id: string;
  parentId: string;
  studentId: string;
  status: ParentLinkStatus;
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
  revokedAt?: unknown;
  verifiedBy?: string;
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
    revokedAt: d.revokedAt,
    verifiedBy: (d.verifiedBy as string) ?? undefined,
  };
}

/** Guardian requests a link to a child (status 'pending'). */
export async function requestParentLink(
  db: Firestore,
  parentUid: string,
  childUid: string,
  childDisplayName: string,
  childClassLevel: string,
  childInstitution: string,
): Promise<ParentLink> {
  const id = parentLinkId(parentUid, childUid);
  const data = {
    parentId: parentUid,
    studentId: childUid,
    status: 'pending' as const,
    childDisplayName: childDisplayName.slice(0, 100),
    childClassLevel: childClassLevel.slice(0, 100),
    childInstitution: childInstitution.slice(0, 200),
    requestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'parentLinks', id), data);
  const snap = await getDoc(doc(db, 'parentLinks', id));
  if (!snap.exists()) throw new Error('link-create-failed');
  return toLink(snap.id, snap.data());
}

/** The child confirms the guardian's request (pending -> confirmed). */
export async function confirmParentLink(db: Firestore, linkId: string): Promise<void> {
  await updateDoc(doc(db, 'parentLinks', linkId), {
    status: 'confirmed',
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Guardian or child revokes a link at any time (any status -> revoked). */
export async function revokeParentLink(db: Firestore, linkId: string): Promise<void> {
  await updateDoc(doc(db, 'parentLinks', linkId), {
    status: 'revoked',
    revokedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
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
