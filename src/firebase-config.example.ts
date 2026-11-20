/**
 * Eduvelto — Firebase client config TEMPLATE.
 *
 * HOW TO USE:
 * 1. The owner creates the Firebase project (gate G1) at
 *    https://console.firebase.google.com — Spark plan, NO billing,
 *    no payment method.
 * 2. In the Firebase console: Project settings → "Your apps" → Web app →
 *    copy the firebaseConfig object.
 * 3. Copy this file to `src/firebase-config.ts` and paste the real values
 *    over the YOUR_* placeholders below.
 * 4. `src/firebase-config.ts` is git-ignored? NO — it is NOT git-ignored,
 *    because these client keys are PUBLIC-BY-DESIGN: they identify the
 *    project in the browser and are safe to ship in the app. Security comes
 *    from Firestore Security Rules, never from hiding these keys.
 *    (See Firebase docs: "Firebase API keys are not secret".)
 *
 * NEVER commit a SERVICE-ACCOUNT key (firebase-adminsdk-*.json) or any
 * private key. Those belong nowhere in this repo — see .gitignore.
 */
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID';
