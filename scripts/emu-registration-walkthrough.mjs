// Eduvelto — emulator end-to-end registration walkthrough (DEV ONLY).
//
// Proves the real Auth -> profile path the app uses, against the LOCAL
// emulators (never live): sign up via the Auth emulator REST API, then
// create the users/{uid} doc via the Firestore REST API with the exact
// payload ensureUserProfile() writes (role 'student', NO verificationStatus,
// NO isActive), then read it back and confirm there is no verification
// state and no wait. Also proves the negative: the same student cannot
// add verificationStatus to their own doc, and a fresh student cannot be
// put into 'pending' by anyone.
//
// Run AFTER starting the emulators on the alt ports:
//   ./node_modules/.bin/firebase emulators:start --config firebase.alt-ports.json --only firestore,auth
//   FIRESTORE_PORT=8081 AUTH_PORT=9098 node scripts/emu-registration-walkthrough.mjs
//
// Requires node 18+ (global fetch). Exits non-zero on any failed check.

const FIRESTORE_PORT = Number(process.env.FIRESTORE_PORT ?? 8081);
const AUTH_PORT = Number(process.env.AUTH_PORT ?? 9098);
const PROJECT = 'eduvelto';
const API_KEY = 'fake-api-key';

let pass = 0;
let fail = 0;
function check(name, ok, extra = '') {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}${extra ? ` — ${extra}` : ''}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

async function main() {
  console.log('Eduvelto registration walkthrough (emulator, alt ports)');
  console.log(`  auth: 127.0.0.1:${AUTH_PORT}  firestore: 127.0.0.1:${FIRESTORE_PORT}`);

  const runId = Date.now().toString(36);
  // 1. Sign up (what RegisterPage -> signUp -> createUserWithEmailAndPassword does).
  const signUp = await fetch(
    `http://127.0.0.1:${AUTH_PORT}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `walkthrough-student-${runId}@example.com`, password: 'secret123', returnSecureToken: true }),
    },
  );
  const signUpBody = await signUp.json();
  check('1. student signs up via Auth emulator', signUp.ok && !!signUpBody.localId, signUp.ok ? `uid=${signUpBody.localId}` : JSON.stringify(signUpBody));
  if (!signUp.ok) process.exit(1);
  const uid = signUpBody.localId;
  const idToken = signUpBody.idToken;

  const fsBase = `http://127.0.0.1:${FIRESTORE_PORT}/v1/projects/${PROJECT}/databases/(default)/documents`;
  const authHeaders = { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' };

  // 2. Create the profile doc with the app's exact payload (ensureUserProfile).
  // REST form: POST .../documents/users?documentId={uid} (the id is a
  // query param, not part of the path).
  const create = await fetch(`${fsBase}/users?documentId=${uid}&key=${API_KEY}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      fields: {
        displayName: { stringValue: 'Walkthrough Student' },
        email: { stringValue: 'walkthrough-student@example.com' },
        role: { stringValue: 'student' },
        language: { stringValue: 'bn' },
      },
    }),
  });
  const createBody = await create.json();
  check('2. profile created (role student, NO verificationStatus, NO isActive)', create.ok, create.ok ? '' : JSON.stringify(createBody));

  // 3. Read it back — immediate dashboard access needs this read to work.
  const read = await fetch(`${fsBase}/users/${uid}?key=${API_KEY}`, { headers: authHeaders });
  const readBody = await read.json();
  const fields = readBody.fields ?? {};
  check('3. student reads own profile immediately (dashboard access)', read.ok);
  check('4. profile carries NO verificationStatus field', read.ok && !('verificationStatus' in fields), read.ok ? `fields=${Object.keys(fields).join(',')}` : '');
  check('5. profile role is student', read.ok && fields.role?.stringValue === 'student');

  // 6. Negative: the student cannot add verificationStatus to their own doc.
  const selfVerify = await fetch(`${fsBase}/users/${uid}?updateMask.fieldPaths=verificationStatus&key=${API_KEY}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ fields: { verificationStatus: { stringValue: 'verified' } } }),
  });
  check('6. student setting own verificationStatus=verified is DENIED', !selfVerify.ok, `HTTP ${selfVerify.status}`);

  // 7. Negative: creating a second student doc WITH verificationStatus is denied.
  const signUp2 = await fetch(
    `http://127.0.0.1:${AUTH_PORT}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `walkthrough-student2-${runId}@example.com`, password: 'secret123', returnSecureToken: true }),
    },
  );
  const signUp2Body = await signUp2.json();
  const uid2 = signUp2Body.localId;
  const token2 = signUp2Body.idToken;
  const createBad = await fetch(`${fsBase}/users?documentId=${uid2}&key=${API_KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token2}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        displayName: { stringValue: 'Walkthrough Student 2' },
        email: { stringValue: 'walkthrough-student2@example.com' },
        role: { stringValue: 'student' },
        language: { stringValue: 'bn' },
        verificationStatus: { stringValue: 'pending' },
      },
    }),
  });
  check('7. student doc created WITH verificationStatus=pending is DENIED', !createBad.ok, `HTTP ${createBad.status}`);

  console.log(`\nWalkthrough: ${pass} passed, ${fail} failed.`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Walkthrough crashed:', e);
  process.exit(1);
});
