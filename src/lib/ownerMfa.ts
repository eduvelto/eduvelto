// Eduvelto — Owner two-factor authentication (TOTP) helpers.
// (23 Nov 2026, staging — owner 2FA preparation.)
//
// Firebase Auth TOTP multi-factor authentication is FREE on the Spark
// plan. The project-level switch lives in the Firebase console
// (Authentication → Settings → Multi-factor authentication → TOTP):
// VERIFIED 23 Nov 2026 via the Identity Toolkit API — the project's
// MFA state is currently DISABLED, so no enrollment can succeed until
// the owner enables TOTP there himself. Nothing in this module changes
// any live setting.
//
// SECURITY RULES FOR THIS MODULE (hard limits):
// - A TOTP secret, password, or backup code is NEVER written to disk,
//   Firestore, or any log. The secret is shown to the owner ONCE in
//   the enrollment UI for his authenticator app; the backup codes are
//   shown ONCE for him to store himself.
// - Backup codes are stored in Firestore ONLY as salted SHA-256 hashes
//   (owner-only rules, see firestore.rules /ownerSecurity). A hash
//   cannot be turned back into a code; verification re-hashes the
//   typed code and compares. Consuming a code deletes its hash.
// - Firebase Auth TOTP has no "backup code" sign-in: a backup code
//   does NOT sign anyone in. It is used while signed in to remove a
//   lost authenticator factor. If the owner has NO signed-in session
//   anywhere, recovery is the Firebase console (project owner can
//   disable MFA for the account) — see OwnerSecurityPage + the
//   checklist in team/2fa-preparation-2026-11-23.md.
// - The real recovery path is a SECOND enrolled authenticator
//   (second device / password-manager TOTP): with two factors
//   enrolled, losing one never locks the owner out.

import {
  getMultiFactorResolver,
  multiFactor,
  TotpMultiFactorGenerator,
  type Auth,
  type MultiFactorInfo,
  type MultiFactorResolver,
  type TotpSecret,
  type User,
} from 'firebase/auth';
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';

export const TOTP_FACTOR_ID = 'totp';

/** Enrolled second factors on the Firebase Auth user (synchronous read). */
export function getEnrolledFactors(user: User): MultiFactorInfo[] {
  try {
    return multiFactor(user).enrolledFactors ?? [];
  } catch {
    return [];
  }
}

export function hasTotpFactor(factors: MultiFactorInfo[]): boolean {
  return factors.some((f) => f.factorId === TOTP_FACTOR_ID);
}

/** Pure claim check (unit-testable): true when the ID token proves the
 * current session completed a second factor (TOTP or phone). */
export function sessionHasSecondFactor(
  claims: Record<string, unknown> | null | undefined,
): boolean {
  if (!claims) return false;
  const firebase = claims.firebase as Record<string, unknown> | undefined;
  if (!firebase || typeof firebase !== 'object') return false;
  const second = firebase.sign_in_second_factor;
  return second === 'totp' || second === 'phone';
}

/** True when the current session's ID token carries the second-factor
 * claim. A restored session from before enrollment (or from before MFA
 * was enabled) has no claim — the admin gate treats that as
 * "needs re-authentication". Uses the cached token (no forced refresh). */
export async function isSessionMfaVerified(user: User): Promise<boolean> {
  try {
    const result = await user.getIdTokenResult();
    return sessionHasSecondFactor(result.claims as Record<string, unknown>);
  } catch {
    return false;
  }
}

export interface TotpEnrollmentStart {
  secret: TotpSecret;
  /** Base32 secret for manual entry in the authenticator app. */
  secretKey: string;
  /** otpauth:// URL (manual entry / copy). No QR image is generated —
   * the app has no QR library; manual entry is the supported path. */
  qrCodeUrl: string;
}

/** Start TOTP enrollment: returns the secret the owner types (or
 * pastes) into his authenticator app. Throws
 * auth/operation-not-allowed when TOTP is not enabled in the Firebase
 * console — the UI turns that into the console-enable instruction. */
export async function startTotpEnrollment(user: User): Promise<TotpEnrollmentStart> {
  const session = await multiFactor(user).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  return {
    secret,
    secretKey: secret.secretKey,
    qrCodeUrl: secret.generateQrCodeUrl(user.email ?? 'Eduvelto', 'Eduvelto'),
  };
}

/** Finish enrollment by verifying the 6-digit code from the
 * authenticator app. On success the factor is enrolled immediately. */
export async function finishTotpEnrollment(
  user: User,
  secret: TotpSecret,
  code: string,
  displayName = 'Authenticator',
): Promise<void> {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code.trim());
  await multiFactor(user).enroll(assertion, displayName);
}

/** Remove an enrolled factor. May throw auth/requires-recent-login
 * when the session is old — the UI then asks for a fresh sign-in. */
export async function unenrollFactor(user: User, factorUid: string): Promise<void> {
  await multiFactor(user).unenroll(factorUid);
}

/** Build the MFA resolver from a failed sign-in (error code
 * auth/multi-factor-auth-required). Returns null when the error is not
 * an MFA challenge. */
export function getMfaResolver(auth: Auth, error: unknown): MultiFactorResolver | null {
  try {
    return getMultiFactorResolver(auth, error as never);
  } catch {
    return null;
  }
}

/** Complete a pending MFA sign-in with the 6-digit authenticator code. */
export async function resolveMfaSignIn(
  resolver: MultiFactorResolver,
  code: string,
  factorUid?: string,
): Promise<void> {
  const hint =
    (factorUid ? resolver.hints.find((h) => h.uid === factorUid) : undefined) ??
    resolver.hints[0];
  if (!hint) throw new Error('no-mfa-factor');
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim());
  await resolver.resolveSignIn(assertion);
}

// ---------- Backup codes (hashes only, never plaintext) ----------

/** Unambiguous alphabet (no 0/O, 1/I/L) — codes stay readable when the
 * owner copies them by hand from a printed sheet. */
const BACKUP_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const BACKUP_CODE_LENGTH = 12;

/** Generate `count` backup codes, formatted XXXX-XXXX-XXXX. Each code
 * carries ~60 bits of entropy (32^12). Plaintext exists ONLY in the
 * returned array — callers display it once and never store it. */
export function generateBackupCodes(count = 10): string[] {
  const bytes = new Uint8Array(count * BACKUP_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let raw = '';
    for (let j = 0; j < BACKUP_CODE_LENGTH; j++) {
      raw += BACKUP_CODE_ALPHABET[bytes[i * BACKUP_CODE_LENGTH + j] % BACKUP_CODE_ALPHABET.length];
    }
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`);
  }
  return codes;
}

/** Normalise a typed code for comparison (case + separators ignored). */
export function normalizeBackupCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidBackupCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(code.trim());
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(text: string): Promise<string> {
  if (!crypto.subtle) throw new Error('secure-context-required');
  const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(data), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** One-way hash of a backup code with a per-code salt. The salt is
 * stored beside the hash; the code itself is never stored. */
export async function hashBackupCode(
  code: string,
  salt: string,
): Promise<string> {
  return sha256Hex(`${salt}:${normalizeBackupCode(code)}`);
}

export interface BackupCodeEntry {
  salt: string;
  hash: string;
}

/** Hash a fresh set of codes for storage (one salt per code). */
export async function hashBackupCodes(codes: string[]): Promise<BackupCodeEntry[]> {
  const out: BackupCodeEntry[] = [];
  for (const code of codes) {
    const salt = randomHex(8);
    out.push({ salt, hash: await hashBackupCode(code, salt) });
  }
  return out;
}

/** Find the stored entry matching a typed code (or null). Pure — the
 * caller reads the entries from Firestore. */
export async function findMatchingBackupCode(
  code: string,
  entries: BackupCodeEntry[],
): Promise<BackupCodeEntry | null> {
  const normalized = normalizeBackupCode(code);
  if (normalized.length !== BACKUP_CODE_LENGTH) return null;
  for (const entry of entries) {
    if ((await hashBackupCode(code, entry.salt)) === entry.hash) return entry;
  }
  return null;
}

// ---------- Owner security records (Firestore, owner-only rules) ----------

export interface OwnerSecurityDoc {
  lastLoginAt?: Timestamp | null;
  knownDeviceIds?: string[];
  mfaEnrolledAt?: Timestamp | null;
  backupCodesUpdatedAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface LoginHistoryEntry {
  id: string;
  createdAt: Timestamp | null;
  deviceId: string;
  userAgent: string;
  isNewDevice: boolean;
}

const MFA_ENROLLED_SESSION_KEY = 'eduvelto-mfa-enrolled-this-session';

/** Mark this tab session as "enrollment just completed": the owner
 * proved possession of the authenticator seconds ago, so the admin
 * gate treats the current session as verified until the next sign-in
 * (enrollment alone does not add the second-factor claim to the ID
 * token — only a fresh TOTP sign-in does). Cleared on sign-out. */
export function markMfaEnrolledThisSession(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(MFA_ENROLLED_SESSION_KEY, '1');
    }
  } catch {
    // Storage unavailable — the gate then asks for a fresh sign-in.
  }
}

export function wasMfaEnrolledThisSession(): boolean {
  try {
    return (
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(MFA_ENROLLED_SESSION_KEY) === '1'
    );
  } catch {
    return false;
  }
}

export function clearMfaEnrolledThisSession(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(MFA_ENROLLED_SESSION_KEY);
    }
  } catch {
    // Nothing to clear.
  }
}

const DEVICE_ID_KEY = 'eduvelto-device-id';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** Stable per-device id (localStorage, created once). Used only to
 * recognise "a new device signed in" for the login-alert list — it is
 * not a credential and is never sent anywhere except the owner's own
 * login-history records. */
export function getOrCreateDeviceId(storage?: StorageLike): string {
  const store =
    storage ??
    (typeof localStorage !== 'undefined' ? localStorage : undefined);
  try {
    const existing = store?.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = `d${randomHex(8)}`;
    try {
      store?.setItem(DEVICE_ID_KEY, id);
    } catch {
      // Storage unavailable — the id still identifies this page session.
    }
    return id;
  } catch {
    return `d${randomHex(8)}`;
  }
}

function ownerSecurityDocRef(db: Firestore, uid: string) {
  return doc(db, 'ownerSecurity', uid);
}

/** Best-effort login record for the owner account (never throws, never
 * blocks sign-in): appends a login-history entry and updates the
 * owner's security doc (last login + known devices). */
export async function recordOwnerLogin(db: Firestore, uid: string): Promise<void> {
  try {
    const deviceId = getOrCreateDeviceId();
    const secRef = ownerSecurityDocRef(db, uid);
    const snap = await getDoc(secRef);
    const known = ((snap.data() as DocumentData | undefined)?.knownDeviceIds ?? []) as string[];
    const isNewDevice = !known.includes(deviceId);
    const batch = writeBatch(db);
    batch.set(
      secRef,
      {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        knownDeviceIds: arrayUnion(deviceId),
      },
      { merge: true },
    );
    const entryRef = doc(collection(db, 'ownerSecurity', uid, 'loginHistory'));
    batch.set(entryRef, {
      createdAt: serverTimestamp(),
      deviceId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : '',
      isNewDevice,
    });
    await batch.commit();
  } catch {
    // Non-fatal: the login itself already succeeded.
  }
}

export async function getOwnerSecurity(db: Firestore, uid: string): Promise<OwnerSecurityDoc | null> {
  try {
    const snap = await getDoc(ownerSecurityDocRef(db, uid));
    return snap.exists() ? (snap.data() as OwnerSecurityDoc) : null;
  } catch {
    return null;
  }
}

/** Record that TOTP enrollment completed (convenience record for the
 * dashboard — the authoritative state is Auth's enrolledFactors). */
export async function markMfaEnrolled(db: Firestore, uid: string): Promise<void> {
  await setDoc(
    ownerSecurityDocRef(db, uid),
    { mfaEnrolledAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function listOwnerLoginHistory(
  db: Firestore,
  uid: string,
  maxEntries = 10,
): Promise<LoginHistoryEntry[]> {
  const q = query(
    collection(db, 'ownerSecurity', uid, 'loginHistory'),
    orderBy('createdAt', 'desc'),
    limit(maxEntries),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    return {
      id: d.id,
      createdAt: (data.createdAt as Timestamp | null) ?? null,
      deviceId: typeof data.deviceId === 'string' ? data.deviceId : '',
      userAgent: typeof data.userAgent === 'string' ? data.userAgent : '',
      isNewDevice: data.isNewDevice === true,
    };
  });
}

/** Replace ALL stored backup-code hashes with a fresh set. The old
 * codes stop working the moment this resolves. */
export async function saveBackupCodeHashes(
  db: Firestore,
  uid: string,
  entries: BackupCodeEntry[],
): Promise<void> {
  const colRef = collection(db, 'ownerSecurity', uid, 'backupCodes');
  const existing = await getDocs(colRef);
  const batch = writeBatch(db);
  for (const d of existing.docs) batch.delete(d.ref);
  for (const entry of entries) {
    batch.set(doc(colRef, entry.hash), {
      salt: entry.salt,
      createdAt: serverTimestamp(),
    });
  }
  batch.set(
    ownerSecurityDocRef(db, uid),
    { backupCodesUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );
  await batch.commit();
}

export async function countBackupCodes(db: Firestore, uid: string): Promise<number> {
  const snap = await getDocs(collection(db, 'ownerSecurity', uid, 'backupCodes'));
  return snap.size;
}

/** Verify a typed backup code against the stored hashes; on a match the
 * code is CONSUMED (its hash is deleted — one-time use). Returns
 * { ok, remaining } — remaining is the count left after the call. */
export async function consumeBackupCode(
  db: Firestore,
  uid: string,
  code: string,
): Promise<{ ok: boolean; remaining: number }> {
  const colRef = collection(db, 'ownerSecurity', uid, 'backupCodes');
  const snap = await getDocs(colRef);
  const entries: Array<BackupCodeEntry & { id: string }> = snap.docs.map((d) => ({
    id: d.id,
    salt: (d.data() as DocumentData).salt as string,
    hash: d.id,
  }));
  const match = await findMatchingBackupCode(code, entries);
  if (!match) return { ok: false, remaining: entries.length };
  await deleteDoc(doc(colRef, (match as BackupCodeEntry & { id: string }).id));
  return { ok: true, remaining: entries.length - 1 };
}
