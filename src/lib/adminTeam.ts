// Eduvelto — Admin & Management Team System (owner brief 21 Nov 08:31).
//
// Owner-side library for the /admin/team dashboard. The OWNER (role
// 'owner', UID below) assigns trusted people to management sectors with
// per-sector permissions. The Firestore rules are the enforcement layer:
//   - `adminAssignments/{uid}` is writable ONLY by the Owner UID (rules).
//   - Sector powers come ONLY from the assignment doc + an MFA session
//     (hasSectorPermMfa in the rules); delegated admins are NOT role
//     'admin' and hold no powers without a live assignment.
//   - Every team action and its audit entry are written in ONE batch,
//     so an action cannot happen with no audit trail (same pattern as
//     setUserActive / setUserRole in lib/admin.ts).
//   - The 'owner' role is never assignable here and the Owner's own
//     document is never a target: assignAdmin / updateAdminPermissions /
//     setAdminSuspended / removeAdmin all refuse the Owner UID and any
//     user whose role is 'owner'. The rules enforce the same server-side.
//
// HONEST LIMITS (shown in the dashboard, not hidden):
// - MFA is ENFORCED by the rules for delegated sector writes, but the
//   dashboard CANNOT see another admin's MFA enrollment status: Firebase
//   Auth has no admin API on the Spark plan, and enrollment state is not
//   stored in Firestore. The owner verifies enrollment out-of-band (ask
//   the admin; a successful MFA-gated action in the audit log proves a
//   live MFA session was used). Do NOT show a fake "MFA enrolled" badge.
// - The OWNER role itself is NOT MFA-gated by the rules: the owner
//   reaches admin powers through the legacy isAdmin()/isModerator()
//   branches, which predate the team system. Gating owner writes on MFA
//   would lock the owner out until Firebase Auth MFA is enrolled — that
//   needs the owner's explicit decision + enrollment first (see the
//   team report, remaining issue #1). The owner's MFA enrollment is a
//   console/account action, never an in-app one.
// - Temporary access expiry is enforced by the rules (expiresAt compared
//   with request.time) — no cron or cleanup job is needed.
// - Suspending an assignment revokes SECTOR powers only. The person's
//   own account (student/teacher login, library, exams) keeps working.
//   To suspend the account itself, use Users → suspend (setUserActive).
// - Production deploys, billing, domain/DNS, rules changes and owner
//   security are console-only and can never be done from any dashboard.

import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import {
  auditEntryData,
  formatTime,
  getActorUid,
  listAdminActions,
  requireReason,
  searchUsersByEmail,
  type AdminUserRow,
  type AuditRow,
} from './admin';

/** The one Super Admin. Must match ownerUid() in firestore.rules. */
export const OWNER_UID = 'nczNklmktsVrxg43UzcgdSm6v0j2';

// ---------------------------------------------------------------------------
// Sectors + permissions
// ---------------------------------------------------------------------------

export const TEAM_SECTORS = [
  'platform-management',
  'academic-management',
  'content-library',
  'examination',
  'teacher-management',
  'student-management',
  'guardian-management',
  'community-moderation',
  'user-support',
  'ai-management',
  'security-monitoring',
  'reports-analytics',
] as const;
export type TeamSectorId = (typeof TEAM_SECTORS)[number];

export const SECTOR_LABELS: Record<TeamSectorId, { bn: string; en: string }> = {
  'platform-management': { bn: 'প্ল্যাটফর্ম পরিচালনা', en: 'Platform Management' },
  'academic-management': { bn: 'একাডেমিক পরিচালনা', en: 'Academic Management' },
  'content-library': { bn: 'কনটেন্ট ও লাইব্রেরি', en: 'Content & Library Management' },
  examination: { bn: 'পরীক্ষা পরিচালনা', en: 'Examination Management' },
  'teacher-management': { bn: 'শিক্ষক পরিচালনা', en: 'Teacher Management' },
  'student-management': { bn: 'শিক্ষার্থী পরিচালনা', en: 'Student Management' },
  'guardian-management': { bn: 'অভিভাবক পরিচালনা', en: 'Guardian Management' },
  'community-moderation': { bn: 'কমিউনিটি মডারেশন', en: 'Community & Social Feed Moderation' },
  'user-support': { bn: 'ব্যবহারকারী সহায়তা', en: 'User Support Management' },
  'ai-management': { bn: 'AI পরিচালনা', en: 'AI Management' },
  'security-monitoring': { bn: 'নিরাপত্তা পর্যবেক্ষণ', en: 'Security Monitoring' },
  'reports-analytics': { bn: 'রিপোর্ট ও বিশ্লেষণ', en: 'Reports & Analytics' },
};

export const TEAM_PERMISSIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'reject',
  'publish',
  'moderate',
  'manage-users',
  'view-reports',
] as const;
export type TeamPermission = (typeof TEAM_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<TeamPermission, { bn: string; en: string }> = {
  view: { bn: 'দেখা', en: 'View' },
  create: { bn: 'তৈরি', en: 'Create' },
  edit: { bn: 'সম্পাদনা', en: 'Edit' },
  delete: { bn: 'মুছে ফেলা', en: 'Delete' },
  approve: { bn: 'অনুমোদন', en: 'Approve' },
  reject: { bn: 'বাতিল', en: 'Reject' },
  publish: { bn: 'প্রকাশ', en: 'Publish' },
  moderate: { bn: 'মডারেট', en: 'Moderate' },
  'manage-users': { bn: 'ব্যবহারকারী পরিচালনা', en: 'Manage Users' },
  'view-reports': { bn: 'রিপোর্ট দেখা', en: 'View Reports' },
};

/**
 * Per-sector applicability: which of the 10 permissions a sector may
 * hold. This is the owner-side UI/validation layer; the rules enforce
 * the global enums (no invented sector/permission can be stored by a
 * direct call). The matrix covers every (sector, permission) pair the
 * rules actually use — see firestore.rules hasSectorPerm* calls:
 * community-moderation moderate/view/delete; user-support view/moderate;
 * content-library create/delete/view; teacher-management approve/reject/
 * view; guardian-management approve/view; examination create/delete/
 * moderate/view; student-management manage-users/view; platform-
 * management edit; ai-management edit; academic-management create/
 * delete/view; security-monitoring + reports-analytics view-reports.
 * 'publish' is applicable where sectorPublish() is used in the rules
 * (academic, content-library, examination) plus platform + AI.
 */
export const SECTOR_PERMISSIONS: Record<TeamSectorId, TeamPermission[]> = {
  'platform-management': [
    'view', 'create', 'edit', 'delete', 'approve', 'reject', 'publish', 'manage-users', 'view-reports',
  ],
  'academic-management': [
    'view', 'create', 'edit', 'delete', 'approve', 'reject', 'publish', 'view-reports',
  ],
  'content-library': [
    'view', 'create', 'edit', 'delete', 'approve', 'reject', 'publish', 'view-reports',
  ],
  examination: [
    'view', 'create', 'edit', 'delete', 'approve', 'reject', 'publish', 'moderate', 'view-reports',
  ],
  'teacher-management': ['view', 'approve', 'reject', 'manage-users', 'view-reports'],
  'student-management': ['view', 'manage-users', 'view-reports'],
  'guardian-management': ['view', 'approve', 'reject', 'manage-users', 'view-reports'],
  'community-moderation': ['view', 'moderate', 'delete', 'view-reports'],
  'user-support': ['view', 'moderate', 'manage-users', 'view-reports'],
  'ai-management': ['view', 'create', 'edit', 'publish', 'view-reports'],
  'security-monitoring': ['view', 'view-reports'],
  'reports-analytics': ['view', 'view-reports'],
};

/** Audit actions this system writes (must be in the rules' action enum). */
export const TEAM_AUDIT_ACTIONS = [
  'admin-assigned',
  'admin-permissions-changed',
  'admin-suspended',
  'admin-reactivated',
  'admin-removed',
  'admin-access-revoked-all',
  'admin-temporary-access-granted',
] as const;

// ---------------------------------------------------------------------------
// Types + validation
// ---------------------------------------------------------------------------

export type SectorMap = Partial<Record<TeamSectorId, TeamPermission[]>>;

export interface AdminAssignment {
  userId: string;
  displayName: string;
  email: string;
  sectors: SectorMap;
  status: 'active' | 'suspended';
  expiresAt: Timestamp | null;
  assignedBy: string;
  assignedAt: unknown;
  updatedAt: unknown;
  note?: string;
}

export interface TeamAdminRow extends AdminAssignment {
  /** Latest audit action by this admin (from the owner-visible log). */
  lastActivityAt: unknown;
  lastActivityAction: string;
}

/**
 * Validate a sector map: known sectors only, ≥1 permission per sector,
 * every permission applicable to its sector. Throws on the first problem.
 * Returns a cleaned copy (unknown keys dropped is NOT allowed — throw).
 */
export function validateSectors(sectors: SectorMap): SectorMap {
  const cleaned: SectorMap = {};
  const ids = Object.keys(sectors) as TeamSectorId[];
  if (ids.length === 0) throw new Error('at-least-one-sector');
  for (const sector of ids) {
    if (!(TEAM_SECTORS as readonly string[]).includes(sector)) {
      throw new Error(`unknown-sector:${sector}`);
    }
    const perms = sectors[sector] ?? [];
    if (perms.length === 0) throw new Error(`empty-permissions:${sector}`);
    for (const perm of perms) {
      if (!(TEAM_PERMISSIONS as readonly string[]).includes(perm)) {
        throw new Error(`unknown-permission:${perm}`);
      }
      if (!SECTOR_PERMISSIONS[sector].includes(perm)) {
        throw new Error(`permission-not-applicable:${sector}:${perm}`);
      }
    }
    cleaned[sector] = [...new Set(perms)];
  }
  return cleaned;
}

export function sectorSummary(sectors: SectorMap): string {
  return (Object.keys(sectors) as TeamSectorId[])
    .map((s) => `${SECTOR_LABELS[s].en} (${(sectors[s] ?? []).join(', ')})`)
    .join(' · ');
}

export function isAssignmentExpired(a: AdminAssignment, now = new Date()): boolean {
  if (!a.expiresAt) return false;
  const v: unknown = a.expiresAt;
  let d: Date | null = null;
  if (v instanceof Timestamp) d = v.toDate();
  else if (v instanceof Date) d = v;
  if (!d) return false;
  return d.getTime() <= now.getTime();
}

export function assignmentStatus(a: AdminAssignment): 'active' | 'suspended' | 'expired' {
  if (a.status === 'suspended') return 'suspended';
  if (isAssignmentExpired(a)) return 'expired';
  return 'active';
}

// ---------------------------------------------------------------------------
// Reads (owner only — the rules enforce this)
// ---------------------------------------------------------------------------

function toAssignment(uid: string, data: DocumentData): AdminAssignment {
  const sectors = (data.sectors ?? {}) as SectorMap;
  return {
    userId: uid,
    displayName: typeof data.displayName === 'string' ? data.displayName : '(নাম নেই)',
    email: typeof data.email === 'string' ? data.email : '',
    sectors,
    status: data.status === 'suspended' ? 'suspended' : 'active',
    expiresAt: (data.expiresAt ?? null) as Timestamp | null,
    assignedBy: typeof data.assignedBy === 'string' ? data.assignedBy : '',
    assignedAt: data.assignedAt ?? null,
    updatedAt: data.updatedAt ?? null,
    note: typeof data.note === 'string' ? data.note : undefined,
  };
}

/** All admin assignments, newest first. Owner only. */
export async function listAdminAssignments(db: Firestore): Promise<AdminAssignment[]> {
  const snap = await getDocs(
    query(collection(db, 'adminAssignments'), orderBy('assignedAt', 'desc'), limit(100)),
  );
  return snap.docs.map((d) => toAssignment(d.id, d.data()));
}

export async function getAdminAssignment(
  db: Firestore,
  targetUid: string,
): Promise<AdminAssignment | null> {
  const snap = await getDoc(doc(db, 'adminAssignments', targetUid));
  if (!snap.exists()) return null;
  return toAssignment(snap.id, snap.data());
}

/** Find a user by exact email (for the "add admin" form). Reuses admin.ts. */
export async function findUserByEmail(db: Firestore, email: string): Promise<AdminUserRow[]> {
  return searchUsersByEmail(db, email.trim().toLowerCase());
}

/** Team audit entries (latest 100), newest first. Owner only. */
export async function listTeamAudit(db: Firestore): Promise<AuditRow[]> {
  const all = await listAdminActions(db);
  const wanted = new Set<string>(TEAM_AUDIT_ACTIONS as unknown as string[]);
  return all.filter((r) => wanted.has(r.action));
}

/** The OWNER's own MFA enrollment (current session). Empty = none enrolled. */
export function getMyMfaFactors(): string[] {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return [];
    // multiFactor is not on the firebase/auth User type in this version —
    // read it through a loose cast instead of pretending otherwise.
    const mf = (
      user as unknown as {
        multiFactor?: { enrolledFactors?: Array<{ factorId: string }> };
      }
    ).multiFactor;
    return (mf?.enrolledFactors ?? []).map((f) => f.factorId);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Writes — every one is owner-only, batched with its audit entry
// ---------------------------------------------------------------------------

async function loadTargetForTeam(db: Firestore, targetUid: string): Promise<DocumentData> {
  if (targetUid === OWNER_UID) throw new Error('owner-protected');
  const snap = await getDoc(doc(db, 'users', targetUid));
  if (!snap.exists()) throw new Error('user-not-found');
  const data = snap.data();
  if (data.role === 'owner') throw new Error('owner-protected');
  return data;
}

export interface AssignAdminOptions {
  targetUid: string;
  sectors: SectorMap;
  reason: string;
  note?: string;
  /** Temporary access: powers stop working after this time (rules-enforced). */
  expiresAt?: Date | null;
}

/**
 * Assign a user as a delegated admin. Creates the assignment + audit
 * entry in ONE batch. With expiresAt set, the audit action is
 * 'admin-temporary-access-granted', otherwise 'admin-assigned'.
 */
export async function assignAdmin(db: Firestore, opts: AssignAdminOptions): Promise<void> {
  const cleanReason = requireReason(opts.reason);
  const actor = getActorUid();
  const target = await loadTargetForTeam(db, opts.targetUid);
  const sectors = validateSectors(opts.sectors);
  const displayName =
    typeof target.displayName === 'string' ? target.displayName : opts.targetUid;
  const email = typeof target.email === 'string' ? target.email : '';
  const temporary = opts.expiresAt != null;
  if (temporary && opts.expiresAt!.getTime() <= Date.now()) {
    throw new Error('expiry-in-past');
  }
  const batch = writeBatch(db);
  batch.set(doc(db, 'adminAssignments', opts.targetUid), {
    userId: opts.targetUid,
    displayName,
    email,
    sectors,
    status: 'active',
    expiresAt: temporary ? Timestamp.fromDate(opts.expiresAt!) : null,
    assignedBy: actor,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    note: (opts.note ?? '').slice(0, 500),
  });
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(
      actor,
      temporary ? 'admin-temporary-access-granted' : 'admin-assigned',
      `${displayName} — ${sectorSummary(sectors)}${temporary ? ` — মেয়াদ ${formatTime(opts.expiresAt)} পর্যন্ত` : ''}`,
      opts.targetUid,
      { after: sectorSummary(sectors), reason: cleanReason },
    ),
  );
  await batch.commit();
}

/** Change an admin's sectors/permissions (assignment must exist). */
export async function updateAdminPermissions(
  db: Firestore,
  targetUid: string,
  sectors: SectorMap,
  reason: string,
): Promise<void> {
  const cleanReason = requireReason(reason);
  const actor = getActorUid();
  await loadTargetForTeam(db, targetUid);
  const existing = await getAdminAssignment(db, targetUid);
  if (!existing) throw new Error('assignment-not-found');
  const cleaned = validateSectors(sectors);
  const before = sectorSummary(existing.sectors);
  const after = sectorSummary(cleaned);
  const batch = writeBatch(db);
  batch.update(doc(db, 'adminAssignments', targetUid), {
    sectors: cleaned,
    updatedAt: serverTimestamp(),
  });
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(actor, 'admin-permissions-changed', existing.displayName, targetUid, {
      before,
      after,
      reason: cleanReason,
    }),
  );
  await batch.commit();
}

/** Suspend (or reactivate) an admin's assignment. Sector powers stop at once. */
export async function setAdminSuspended(
  db: Firestore,
  targetUid: string,
  suspended: boolean,
  reason: string,
): Promise<void> {
  const cleanReason = requireReason(reason);
  const actor = getActorUid();
  await loadTargetForTeam(db, targetUid);
  const existing = await getAdminAssignment(db, targetUid);
  if (!existing) throw new Error('assignment-not-found');
  const before = existing.status === 'suspended' ? 'suspended' : 'active';
  const after = suspended ? 'suspended' : 'active';
  const batch = writeBatch(db);
  batch.update(doc(db, 'adminAssignments', targetUid), {
    status: after,
    updatedAt: serverTimestamp(),
  });
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(
      actor,
      suspended ? 'admin-suspended' : 'admin-reactivated',
      existing.displayName,
      targetUid,
      { before, after, reason: cleanReason },
    ),
  );
  await batch.commit();
}

/** Remove an admin entirely — powers stop immediately (rules read the doc). */
export async function removeAdmin(db: Firestore, targetUid: string, reason: string): Promise<void> {
  const cleanReason = requireReason(reason);
  const actor = getActorUid();
  await loadTargetForTeam(db, targetUid);
  const existing = await getAdminAssignment(db, targetUid);
  if (!existing) throw new Error('assignment-not-found');
  const batch = writeBatch(db);
  batch.delete(doc(db, 'adminAssignments', targetUid));
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(actor, 'admin-removed', existing.displayName, targetUid, {
      before: sectorSummary(existing.sectors),
      after: 'removed',
      reason: cleanReason,
    }),
  );
  await batch.commit();
}

/**
 * Revoke ALL delegated access in one action: deletes every assignment
 * doc + one audit entry in ONE batch. The Owner's own powers are not
 * assignments and are untouched.
 */
export async function revokeAllDelegatedAccess(db: Firestore, reason: string): Promise<void> {
  const cleanReason = requireReason(reason);
  const actor = getActorUid();
  const all = await listAdminAssignments(db);
  if (all.length > 400) throw new Error('too-many-assignments');
  const batch = writeBatch(db);
  for (const a of all) {
    batch.delete(doc(db, 'adminAssignments', a.userId));
  }
  batch.set(
    doc(collection(db, 'adminActions')),
    auditEntryData(
      actor,
      'admin-access-revoked-all',
      `${all.length} জন অ্যাডমিনের অ্যাক্সেস বাতিল`,
      'all',
      { before: all.map((a) => a.displayName).join(', ').slice(0, 500), after: 'revoked', reason: cleanReason },
    ),
  );
  await batch.commit();
}
