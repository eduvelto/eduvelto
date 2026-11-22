// Eduvelto — Firebase Auth (Step 1: real authentication + student profiles).
//
// - Email/password sign-up + sign-in, Google sign-in (popup first,
//   redirect fallback), sign-out, password reset, and auth-state
//   handling for the whole app.
// - Google sign-in: signInWithPopup FIRST, signInWithRedirect as
//   fallback when a popup cannot open (22 Nov 2026, fix/google-login-
//   diagnosis). Why: every observed `auth/internal-error` (4+ attempts,
//   sign-in AND link, desktop AND phone) came through the redirect
//   flow — including one link attempt where the Google link LANDED
//   server-side yet the app still reported internal-error. The server
//   exchange therefore succeeded at least once while the redirect-
//   result machinery (gapi iframe, pending-redirect storage,
//   redirect-user lookup) reported failure. The popup flow returns the
//   result directly and bypasses ALL of that machinery, so it is both
//   the fix candidate and the decisive test: if popup works, the
//   redirect delivery was the problem; if popup fails with the same
//   internal-error, the failure is in the server-side signInWithIdp
//   exchange itself. Popup was never tried before (21 Nov: popup
//   failed immediately in the WhatsApp in-app browser / PWA, which is
//   why redirect was adopted — the fallback below keeps that behaviour:
//   popup-blocked / unsupported environment silently falls back to
//   redirect, exactly as before). A user-closed popup is NOT a
//   fallback case: the user cancelled, so the error is shown.
// - The redirect result is still handled in AuthProvider's mount effect
//   (getRedirectResult) and the normal onAuthStateChanged listener;
//   the role-setup hold survives the reload via sessionStorage
//   (consume-once, see ROLE_SETUP_HOLD_KEY below).
// - Every auth failure also records a redacted diagnostic detail
//   (code + message + customData with any token response withheld):
//   the SDK's `auth/internal-error` message carries the server's own
//   detail, which the old UI threw away by showing only the code.
//   The detail is shown under the error on /login and /register so the
//   next failure can be diagnosed from a screenshot alone. It never
//   contains an idToken / refreshToken.
// - Session survives a page reload: Firebase Auth uses local persistence
//   on web by default (the user stays signed in until they sign out).
// - On every sign-in the `users/{uid}` profile document is created if it
//   does not exist yet (see ./profile.ts). `lastActiveAt` is written once
//   per login session — not on every page view (write-budget discipline,
//   plan §5). A restored session counts as one login.
// - A suspended account (profile `isActive === false`) stays signed in at
//   the Auth level but cannot use the app: `suspended` is true and App
//   renders the suspended screen instead of the routes.
// - OWNER DECISION 21 Nov 2026: student identity verification is REMOVED
//   entirely — students are NEVER gated on any verification state. The
//   only account gate in this module is suspension (see above).
//
// Until the Firebase console has the sign-in providers enabled
// (Authentication → Sign-in method → Email/Password + Google) and the
// Firestore database created, sign-in / profile calls fail and the UI
// shows the honest reason (see friendlyErrorMessage in ./profile.ts).

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile as updateAuthProfile,
  type User,
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  authErrorCode,
  ensureUserProfile,
  friendlyErrorMessage,
  getUserProfile,
  updateUserProfile,
  type ProfileEdit,
  type UserProfile,
} from './profile';

export interface AuthState {
  /** Firebase Auth user, null when signed out. */
  user: User | null;
  /** Firestore profile doc, null until it loads (or when signed out). */
  profile: UserProfile | null;
  /** True until the first auth-state event has been handled. */
  loading: boolean;
  /** True when the profile says isActive === false (suspended by Admin). */
  suspended: boolean;
  /** Last friendly error message, if any. */
  error: string | null;
  /** Raw Firebase error code behind `error` (e.g. 'auth/popup-blocked'),
   * shown in small text under the friendly message so a failure can be
   * diagnosed from a screenshot alone. Null when there is no error. */
  errorCode: string | null;
  /** Redacted diagnostic detail behind `error` (code + SDK message +
   * customData with any token response withheld), shown in a
   * collapsible block under the error on /login and /register. The
   * SDK message carries the server's own detail for
   * `auth/internal-error`, which the code alone never shows. Null
   * when there is no error. Never contains an idToken/refreshToken. */
  errorDetail: string | null;
  signUp: (
    displayName: string,
    email: string,
    password: string,
    options?: { role?: 'student' | 'teacher' | 'parent'; fields?: ProfileEdit },
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  /** holdForRoleSetup: skip profile creation — the caller navigates to
   * /register/role and RoleSetupPage creates the profile with the
   * chosen role. */
  signInWithGoogle: (options?: { holdForRoleSetup?: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  saveProfile: (fields: ProfileEdit) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const googleProvider = new GoogleAuthProvider();
// Always ask which Google account to use (shared devices / many accounts).
googleProvider.setCustomParameters({ prompt: 'select_account' });

/** Role-setup hold: while the user is on /register/role choosing their
 * role after a Google sign-in, the provider must NOT auto-create a
 * default 'student' profile — that would destroy the choice. Set by
 * RegisterPage before Google sign-in (via signInWithGoogle's
 * holdForRoleSetup option), released by RoleSetupPage once the profile
 * is created, and cleared on sign-out. In-memory only: if the tab
 * closes mid-setup, the next sign-in auto-creates a student profile
 * (documented behaviour).
 *
 * The redirect flow reloads the page, which wipes in-memory state — so
 * the hold is ALSO written to sessionStorage when a Google redirect
 * starts, and restored into the in-memory flag by AuthProvider's mount
 * effect (before the auth listener runs). RoleSetupPage clears the
 * stored flag once it mounts; release / sign-out clear it too.
 * sessionStorage is per-tab, so closing the tab wipes it and the next
 * sign-in auto-creates a student profile, as documented above. */
let roleSetupHold = false;
const ROLE_SETUP_HOLD_KEY = 'eduvelto-role-setup-hold';

function readStoredHold(): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(ROLE_SETUP_HOLD_KEY) === '1';
  } catch {
    return false;
  }
}

function storeHold(): void {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(ROLE_SETUP_HOLD_KEY, '1');
  } catch {
    // Storage unavailable — the in-memory flag still covers this tab.
  }
}

function clearStoredHold(): void {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(ROLE_SETUP_HOLD_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function holdProfileCreationForRoleSetup(): void {
  roleSetupHold = true;
}

export function releaseProfileCreationHold(): void {
  roleSetupHold = false;
  clearStoredHold();
}

/** Clear only the stored (sessionStorage) hold flag — used by
 * RoleSetupPage once it mounts, after the auth listener has already
 * consumed the in-memory flag. The in-memory flag stays set until the
 * profile is created or the user signs out. */
export function clearStoredRoleSetupHold(): void {
  clearStoredHold();
}

/** True when a Google redirect for role setup is in flight (the stored
 * hold flag is set) — used by RegisterPage after the redirect returns,
 * to send the new user to /register/role. */
export function isRoleSetupHoldStored(): boolean {
  return readStoredHold();
}

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  /** Redacted diagnostic detail for an auth failure: the SDK error's
   * code + message + customData. The message is the important part —
   * for `auth/internal-error` the Firebase SDK puts the Identity
   * Toolkit server's own detail in it, which the friendly message and
   * the bare code both hide. customData._tokenResponse (which carries
   * idToken/refreshToken on tagged errors) is NEVER included — only a
   * marker that it was withheld. Safe to show on screen and to log. */
  function redactErrorDetail(e: unknown): string | null {
    if (!e || typeof e !== 'object') return null;
    const err = e as { code?: unknown; message?: unknown; customData?: unknown };
    const code = typeof err.code === 'string' ? err.code : authErrorCode(e);
    const message = typeof err.message === 'string' ? err.message : String(e);
    let customData: unknown;
    if (err.customData && typeof err.customData === 'object') {
      const cd = { ...(err.customData as Record<string, unknown>) };
      if ('_tokenResponse' in cd) cd._tokenResponse = '[withheld: contains tokens]';
      customData = cd;
    }
    try {
      return JSON.stringify({ code, message, customData }, null, 2);
    } catch {
      return JSON.stringify({ code, message });
    }
  }

  /** Record a failure: friendly Bangla message + raw Firebase code +
   * redacted diagnostic detail. */
  function fail(e: unknown): void {
    setError(friendlyErrorMessage(e));
    setErrorCode(authErrorCode(e));
    const detail = redactErrorDetail(e);
    setErrorDetail(detail);
    if (typeof console !== 'undefined' && detail) {
      console.error('[Eduvelto] auth failure:', detail);
    }
  }

  function clearAuthError(): void {
    setError(null);
    setErrorCode(null);
    setErrorDetail(null);
  }
  // UID whose lastActiveAt was already written in this page session.
  const touchedUid = useRef<string | null>(null);
  // UID whose profile is being created by an explicit sign-in call right
  // now, so the auth-state listener does not race it with a second create.
  const creatingForUid = useRef<string | null>(null);

  // One lastActiveAt write per login session (see module header).
  async function touchLastActive(uid: string): Promise<void> {
    if (!db || touchedUid.current === uid) return;
    touchedUid.current = uid;
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      // Non-fatal: the profile is usable without the timestamp.
      if (typeof console !== 'undefined') console.warn('[Eduvelto] lastActiveAt update failed:', e);
    }
  }

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    // A Google redirect reloads the page: restore the role-setup hold
    // BEFORE the auth listener runs (otherwise it would auto-create a
    // default 'student' profile and destroy the role choice). The
    // stored flag is NOT cleared here — RoleSetupPage clears it once
    // it mounts (the listener has already consumed the in-memory
    // flag by then), and releaseProfileCreationHold / signOut clear
    // it too. sessionStorage is per-tab, so closing the tab wipes it
    // and the next sign-in auto-creates a student profile, as
    // documented above.
    if (readStoredHold()) {
      roleSetupHold = true;
    }
    // Surface a failed Google redirect (e.g. account-exists, or the
    // redirect being cancelled): without this call the failure would
    // be silent and the login page would show nothing at all.
    // Resolves to null when no redirect is pending.
    void getRedirectResult(auth).catch((e: unknown) => {
      fail(e);
    });
    const unsub = onAuthStateChanged(auth, (u) => {
      void (async () => {
        if (!u || !db) {
          touchedUid.current = null;
          creatingForUid.current = null;
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setUser(u);
        // An explicit sign-in call is creating this profile right now;
        // it owns the profile state — do not race it here.
        if (creatingForUid.current === u.uid) return;
        // Role-setup hold: a Google sign-in whose role is not chosen yet.
        // Load the profile if one already exists; otherwise do NOT create
        // one — RoleSetupPage creates it with the chosen role.
        if (roleSetupHold) {
          try {
            const existing = await getUserProfile(db, u.uid);
            setProfile(existing);
            if (existing) await touchLastActive(u.uid);
          } catch (e) {
            fail(e);
          } finally {
            setLoading(false);
          }
          return;
        }
        try {
          const { profile: p, created } = await ensureUserProfile(db, u);
          setProfile(p);
          if (!created) await touchLastActive(u.uid);
        } catch (e) {
          fail(e);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signUp(
    displayName: string,
    email: string,
    password: string,
    options?: { role?: 'student' | 'teacher' | 'parent'; fields?: ProfileEdit },
  ): Promise<void> {
    if (!auth || !db) throw new Error('not-configured');
    clearAuthError();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const u = cred.user;
      creatingForUid.current = u.uid;
      try {
        await updateAuthProfile(u, { displayName: displayName.trim() });
        const { profile: p } = await ensureUserProfile(db, u, displayName.trim(), options);
        setUser(u);
        setProfile(p);
      } finally {
        creatingForUid.current = null;
      }
    } catch (e) {
      fail(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string): Promise<void> {
    if (!auth || !db) throw new Error('not-configured');
    clearAuthError();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const u = cred.user;
      creatingForUid.current = u.uid;
      try {
        const { profile: p, created } = await ensureUserProfile(db, u);
        setUser(u);
        setProfile(p);
        if (!created) await touchLastActive(u.uid);
      } finally {
        creatingForUid.current = null;
      }
    } catch (e) {
      fail(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  /** Google sign-in: POPUP first, REDIRECT fallback.
   *
   * 21 Nov 2026 — signInWithPopup failed on the owner's phone: tapping
   * "Google দিয়ে লগইন" errored immediately with no account chooser,
   * because the page was opened in a context that does not support
   * popups (in-app WebView / installed PWA). That is why redirect was
   * adopted — and the fallback below preserves it.
   *
   * 22 Nov 2026 — every `auth/internal-error` since (sign-in AND link,
   * desktop AND phone) came through the redirect flow, including a
   * link attempt where the Google link LANDED server-side yet the app
   * still reported internal-error. The popup flow returns the result
   * directly and bypasses the redirect-result machinery (gapi iframe,
   * pending-redirect storage, redirect-user lookup), so popup is now
   * tried first: if it works, the redirect delivery was the problem;
   * if it fails with the same internal-error, the failure is in the
   * server-side signInWithIdp exchange and needs a server-side answer
   * (Firebase support / secret reset as a last resort — owner action).
   *
   * Flow: popup first. Only when the popup cannot open at all
   * (blocked / unsupported environment / storage unsupported) fall
   * back to redirect, exactly as before. A user-closed popup, a
   * cancelled popup request, or any account/server error is the real
   * answer and is surfaced — the app must NOT silently navigate the
   * user to Google after they closed the chooser.
   *
   * On popup success the promise resolves with the credential; the
   * auth-state listener signs the user in and creates/loads the
   * profile, exactly as the redirect path did. Callers must therefore
   * still navigate when `user` appears (see LoginPage/RegisterPage).
   * On redirect success the page navigates away to Google and the
   * promise never resolves — same as before.
   */
  async function signInWithGoogle(options?: { holdForRoleSetup?: boolean }): Promise<void> {
    if (!auth || !db) throw new Error('not-configured');
    clearAuthError();
    setLoading(true);
    const setHold = (): void => {
      if (options?.holdForRoleSetup) {
        roleSetupHold = true;
        // Survives the redirect reload; consumed once by the mount
        // effect (see ROLE_SETUP_HOLD_KEY). Harmless for popup (no
        // reload), where the in-memory flag alone would do.
        storeHold();
      }
    };
    const clearHold = (): void => {
      roleSetupHold = false;
      clearStoredHold();
    };
    try {
      setHold();
      try {
        await signInWithPopup(auth, googleProvider);
        return;
      } catch (popupError) {
        const code = authErrorCode(popupError);
        if (
          code === 'auth/popup-blocked' ||
          code === 'auth/operation-not-supported-in-this-environment' ||
          code === 'auth/web-storage-unsupported'
        ) {
          // Popup cannot open in this browser/context — fall back to
          // the redirect flow (the pre-existing behaviour).
          setHold();
          await signInWithRedirect(auth, googleProvider);
          // Not reached on success: the page navigates away to Google.
          return;
        }
        throw popupError;
      }
    } catch (e) {
      clearHold();
      fail(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function signOut(): Promise<void> {
    if (!auth) return;
    clearAuthError();
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      fail(e);
      throw e;
    }
    touchedUid.current = null;
    creatingForUid.current = null;
    roleSetupHold = false;
    clearStoredHold();
    setUser(null);
    setProfile(null);
  }

  async function resetPassword(email: string): Promise<void> {
    if (!auth) throw new Error('not-configured');
    clearAuthError();
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (e) {
      fail(e);
      throw e;
    }
  }

  async function saveProfile(fields: ProfileEdit): Promise<void> {
    if (!db || !user) throw new Error('not-signed-in');
    clearAuthError();
    try {
      const updated = await updateUserProfile(db, user.uid, fields);
      setProfile(updated);
    } catch (e) {
      fail(e);
      throw e;
    }
  }

  const value: AuthState = {
    user,
    profile,
    loading,
    suspended: profile?.isActive === false,
    error,
    errorCode,
    errorDetail,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    saveProfile,
    clearError: () => {
      setError(null);
      setErrorCode(null);
      setErrorDetail(null);
    },
  };

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Read the profile without a hook (for non-component code). */
export async function loadProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  try {
    return await getUserProfile(db, uid);
  } catch {
    return null;
  }
}
