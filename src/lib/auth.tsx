// Eduvelto — Firebase Auth (Step 1: real authentication + student profiles).
//
// - Email/password sign-up + sign-in, Google sign-in (popup), sign-out,
//   password reset, and auth-state handling for the whole app.
// - Session survives a page reload: Firebase Auth uses local persistence
//   on web by default (the user stays signed in until they sign out).
// - On every sign-in the `users/{uid}` profile document is created if it
//   does not exist yet (see ./profile.ts). `lastActiveAt` is written once
//   per login session — not on every page view (write-budget discipline,
//   plan §5). A restored session counts as one login.
// - A suspended account (profile `isActive === false`) stays signed in at
//   the Auth level but cannot use the app: `suspended` is true and App
//   renders the suspended screen instead of the routes.
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
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile as updateAuthProfile,
  type User,
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
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
 * (documented behaviour). */
let roleSetupHold = false;

export function holdProfileCreationForRoleSetup(): void {
  roleSetupHold = true;
}

export function releaseProfileCreationHold(): void {
  roleSetupHold = false;
}

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
            setError(friendlyErrorMessage(e));
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
          setError(friendlyErrorMessage(e));
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
    setError(null);
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
      setError(friendlyErrorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string): Promise<void> {
    if (!auth || !db) throw new Error('not-configured');
    setError(null);
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
      setError(friendlyErrorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle(options?: { holdForRoleSetup?: boolean }): Promise<void> {
    if (!auth || !db) throw new Error('not-configured');
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const u = cred.user;
      creatingForUid.current = u.uid;
      try {
        if (options?.holdForRoleSetup) {
          roleSetupHold = true;
          // Load an existing profile if this is a returning account;
          // do NOT create one — RoleSetupPage does it with the role.
          const existing = await getUserProfile(db, u.uid);
          setUser(u);
          setProfile(existing);
          if (existing) await touchLastActive(u.uid);
          return;
        }
        const { profile: p, created } = await ensureUserProfile(db, u);
        setUser(u);
        setProfile(p);
        if (!created) await touchLastActive(u.uid);
      } finally {
        creatingForUid.current = null;
      }
    } catch (e) {
      setError(friendlyErrorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function signOut(): Promise<void> {
    if (!auth) return;
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      setError(friendlyErrorMessage(e));
      throw e;
    }
    touchedUid.current = null;
    creatingForUid.current = null;
    roleSetupHold = false;
    setUser(null);
    setProfile(null);
  }

  async function resetPassword(email: string): Promise<void> {
    if (!auth) throw new Error('not-configured');
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (e) {
      setError(friendlyErrorMessage(e));
      throw e;
    }
  }

  async function saveProfile(fields: ProfileEdit): Promise<void> {
    if (!db || !user) throw new Error('not-signed-in');
    setError(null);
    try {
      const updated = await updateUserProfile(db, user.uid, fields);
      setProfile(updated);
    } catch (e) {
      setError(friendlyErrorMessage(e));
      throw e;
    }
  }

  const value: AuthState = {
    user,
    profile,
    loading,
    suspended: profile?.isActive === false,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    saveProfile,
    clearError: () => setError(null),
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
