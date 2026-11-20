/**
 * EduOrbit — Firebase client config (REAL project, wired 20 Nov 2026).
 *
 * Project: Eduvelto — project ID `eduvelto` (Spark plan, no billing).
 * Web app: "Eduvelto Web" (registered in the Firebase console 20 Nov 2026).
 * Console: https://console.firebase.google.com/project/eduvelto/overview
 *
 * These client keys are PUBLIC-BY-DESIGN: they identify the project in
 * the browser and are safe to ship in the app. Security comes from
 * Firestore Security Rules + Firebase Auth, never from hiding these keys.
 * (See Firebase docs: "Firebase API keys are not secret".)
 *
 * NEVER commit a SERVICE-ACCOUNT key (firebase-adminsdk-*.json) or any
 * private key. Those belong nowhere in this repo — see .gitignore.
 *
 * Still missing in the console (not code — needs a console session):
 * - Enable sign-in providers: Authentication → Sign-in method →
 *   Email/Password ON + Google ON. Until then every sign-in fails with
 *   `auth/operation-not-allowed`, and the app says so honestly.
 * - Create the Firestore database: Firestore Database → Create database →
 *   production mode, location `asia-south1`. Until then profile reads
 *   and writes fail, and the app says so honestly.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyBWtzXrFraiHJsKjsO2YCr_BK7GYlLBkr8',
  authDomain: 'eduvelto.firebaseapp.com',
  projectId: 'eduvelto',
  storageBucket: 'eduvelto.firebasestorage.app',
  messagingSenderId: '781355434811',
  appId: '1:781355434811:web:87a77ac0d45bb9bc5a6d1e',
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID';
