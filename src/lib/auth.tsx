// Eduvelto — Firebase Auth (Step 1: real authentication + student profiles).
//
// - Email/password sign-up + sign-in, Google sign-in (redirect), sign-out,
//   password reset, and auth-state handling for the whole app.
// - Google sign-in uses signInWithRedirect, NOT signInWithPopup: the
//   popup fails on the owner's phone (21 Nov 2026 — tapping Google login
//   errored immediately with no account chooser: the popup never opened,
//   because the page was opened in a WebView/PWA context that does not
//   support popups). A redirect is a plain page navigation, so it works
//   in mobile Chrome, installed PWAs and in-app browsers alike. The
//   redirect result is handled in AuthProvider's mount effect
//   (getRedirectResult) and the normal onAuthStateChanged listener;
//   the role-setup hold survives the reload via sessionStorage
//   (consume-once, see ROLE_SETUP_HOLD_KEY below).
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

  /** Record a failure: friendly Bangla message + raw Firebase code. */
  function fail(e: unknown): void {
    setError(friendlyErrorMessage(e));
    setErrorCode(authErrorCode(e));
  }

  function clearAuthError(): void {
    setError(null);
    setErrorCode(null);
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

  /** Google sign-in via REDIRECT (not popup).
   *
   * 21 Nov 2026 — signInWithPopup failed on the owner's phone: tapping
   * "Google দিয়ে লগইন" errored immediately with no account chooser,
   * because the page was opened in a context that does not support
   * popups (in-app WebView / installed PWA). A redirect is a plain
   * page navigation to Google and back, so it works in mobile Chrome,
   * installed PWAs and in-app browsers alike, and on desktop too.
   *
   * Flow: this call stores the role-setup hold (if requested) in
   * sessionStorage, then navigates away to Google. It does NOT resolve
   * on success — the page reloads, AuthProvider's mount effect picks
   * up the redirect result (getRedirectResult) and the auth-state
   * listener signs the user in and creates/loads the profile, exactly
   * as the popup path did. Callers must therefore NOT rely on this
   * promise resolving: LoginPage/RegisterPage navigate when `user`
   * appears (see their effects). On failure the promise rejects
   * (e.g. redirect blocked) and the friendly message + code are set.
   */
  async function signInWithGoogle(options?: { holdForRoleSetup?: boolean }): Promise<void> {
    if (!auth || !db) throw new Error('not-configured');
    clearAuthError();
    setLoading(true);
    try {
      if (options?.holdForRoleSetup) {
        roleSetupHold = true;
        // Survives the redirect reload; consumed once by the mount
        // effect (see ROLE_SETUP_HOLD_KEY).
        storeHold();
      }
      await signInWithRedirect(auth, googleProvider);
      // Not reached on success: the page navigates away to Google.
    } catch (e) {
      roleSetupHold = false;
      clearStoredHold();
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
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    saveProfile,
    clearError: () => {
      setError(null);
      setErrorCode(null);
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
