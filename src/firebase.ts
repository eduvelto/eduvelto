import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
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
} else if (typeof console !== 'undefined') {
  console.warn(
    '[Eduvelto] Firebase is not configured yet. Copy src/firebase-config.example.ts ' +
      'to src/firebase-config.ts and paste the project config from the Firebase console (gate G1).',
  );
}

export { app, auth, db, isFirebaseConfigured };
export { firebaseConfig };
