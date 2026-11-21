import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';

const lang = process.argv[2] || 'bn';
const env = await initializeTestEnvironment({
  projectId: 'eduvelto',
  firestore: { host: '127.0.0.1', port: 8083 },
});
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'owner'), limit(1)));
  if (snap.empty) throw new Error('owner user not found in emulator');
  await updateDoc(doc(db, 'users', snap.docs[0].id), { language: lang });
});
await env.cleanup();
console.log(`owner language set to ${lang}`);
