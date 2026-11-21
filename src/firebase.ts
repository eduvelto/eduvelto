import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config';

// Single Firebase app instance. If the owner has not pasted the real config
// yet (gate G1), the placeholder values are used and the app runs in
// "not configured" mode: pages render their honest empty states and any
// Firebase call fails safely instead of crashing the page.
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  // DEV/STAGING ONLY: point the app at the local Firebase emulators so
  // dashboards can be screenshotted and tested without touching the
  // live project. Enabled ONLY by the explicit build flag
  // VITE_USE_FIREBASE_EMULATORS=1 (never in a production build — the
  // flag is absent there, and this block does nothing). Ports come from
  // VITE_FIRESTORE_EMULATOR_PORT / VITE_AUTH_EMULATOR_PORT (defaults
  // 8080 / 9099 — the ports this branch's emulator config uses).
  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === '1') {
    const fsPort = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT ?? 8080);
    const authPort = Number(import.meta.env.VITE_AUTH_EMULATOR_PORT ?? 9099);
    connectFirestoreEmulator(db, '127.0.0.1', fsPort);
    connectAuthEmulator(auth, `http://127.0.0.1:${authPort}`);
    if (typeof console !== 'undefined') {
      console.warn(
        `[Eduvelto] EMULATOR MODE: Firestore 127.0.0.1:${fsPort}, Auth 127.0.0.1:${authPort}. ` +
          'No live data is read or written.',
      );
    }
  }
} else if (typeof console !== 'undefined') {
  console.warn(
    '[Eduvelto] Firebase is not configured yet. Copy src/firebase-config.example.ts ' +
      'to src/firebase-config.ts and paste the project config from the Firebase console (gate G1).',
  );
}

export { app, auth, db, isFirebaseConfigured };
export { firebaseConfig };
