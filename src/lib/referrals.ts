// Eduvelto — Free Quiz share-and-win referrals (owner order 28 Nov
// 2026, 12:53).
//
// A visitor creates a personal referral link (6-char code). Visits
// through that link bump `count` on the `quizReferrals/<code>` doc
// (at most once per browser per day — localStorage guard). The entry
// form does NOT write to Firestore: a valid entry opens WhatsApp to
// Eduvelto with the name, bKash number and ref code.
//
// Firestore shape (rules: public create/update only, NO public read —
// Worker 2 owns firestore.rules):
//   quizReferrals/<code>: { code, name, createdAt, firstSeen,
//   lastSeen, count }
// Never getDoc here: the rules do not allow public reads, and
// recordReferralVisit must never create docs for unknown codes —
// updateDoc on a missing doc throws, and that is swallowed silently.

import {
  doc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { db } from '../firebase';

export const QUIZ_REFERRALS_COLLECTION = 'quizReferrals';
export const REFERRAL_CODE_LENGTH = 6;
export const REFERRAL_CODE_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const EDUVELTO_WHATSAPP_NUMBER = '8801975225751';
export const EDUVELTO_SITE_URL = 'https://eduvelto.com';

/** Short random ref code, e.g. "aK3xQ9". */
export function generateReferralCode(): string {
  const bytes = new Uint8Array(REFERRAL_CODE_LENGTH);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let code = '';
  for (const b of bytes) {
    code += REFERRAL_CODE_CHARSET[b % REFERRAL_CODE_CHARSET.length];
  }
  return code;
}

export function isValidReferralCode(code: string): boolean {
  return (
    code.length === REFERRAL_CODE_LENGTH &&
    [...code].every((c) => REFERRAL_CODE_CHARSET.includes(c))
  );
}

export function buildReferralLink(code: string): string {
  return `${EDUVELTO_SITE_URL}/free-quiz?ref=${code}`;
}

/** Bengali digits ০-৯ → 0-9, trimmed. Nothing else is stripped. */
export function normalizeBkashNumber(input: string): string {
  return input
    .trim()
    .replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
}

/** null = valid. 'empty' when blank, 'invalid' otherwise. */
export function validateBkashNumber(
  input: string,
): 'empty' | 'invalid' | null {
  const value = normalizeBkashNumber(input);
  if (!value) return 'empty';
  // Exactly 11 digits starting with 01.
  if (!/^01\d{9}$/.test(value)) return 'invalid';
  return null;
}

/** null = valid. 'empty' when blank. */
export function validateReferralName(name: string): 'empty' | null {
  return name.trim() ? null : 'empty';
}

/** Message sent to Eduvelto on WhatsApp for a share-and-win entry. */
export function buildReferralEntryMessage(
  name: string,
  bkashNumber: string,
  code: string,
): string {
  return (
    'আসসালামু আলাইকুম! আমি Eduvelto ফ্রি কুইজ শেয়ার-অ্যান্ড-উইন-এ অংশ নিতে চাই।\n' +
    `নাম: ${name.trim()}\n` +
    `বিকাশ নম্বর: ${normalizeBkashNumber(bkashNumber)}\n` +
    `রেফারেল কোড: ${code}`
  );
}

/** wa.me link that opens a WhatsApp chat with Eduvelto. */
export function buildReferralWhatsAppUrl(
  name: string,
  bkashNumber: string,
  code: string,
): string {
  const text = encodeURIComponent(
    buildReferralEntryMessage(name, bkashNumber, code),
  );
  return `https://wa.me/${EDUVELTO_WHATSAPP_NUMBER}?text=${text}`;
}

/** Generic WhatsApp share link (no fixed recipient). */
export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Facebook share dialog URL (standard sharer.php link — no SDK). */
export function buildFacebookShareUrl(url: string, quote: string): string {
  const params = new URLSearchParams({ u: url, quote });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Create the referral doc (doc ID = the code) and return the code.
 * Throws on Firestore failure — the caller shows an honest error
 * instead of pretending the link was created.
 */
export async function createReferral(
  name: string,
  firestoreDb: Firestore | null = db,
): Promise<string> {
  if (!firestoreDb) throw new Error('not-configured');
  const code = generateReferralCode();
  const now = serverTimestamp();
  await setDoc(doc(firestoreDb, QUIZ_REFERRALS_COLLECTION, code), {
    code,
    name: name.trim(),
    createdAt: now,
    firstSeen: now,
    lastSeen: now,
    count: 0,
  });
  return code;
}

// ---------------------------------------------------------------------------
// Visit counting (at most once per browser per day)
// ---------------------------------------------------------------------------

export function referralVisitGuardKey(
  code: string,
  date: Date = new Date(),
): string {
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `eduvelto-ref-counted-${code}-${day}`;
}

interface StringStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const memoryStore = new Map<string, string>();
const memoryStorage: StringStorage = {
  getItem: (key) => memoryStore.get(key) ?? null,
  setItem: (key, value) => {
    memoryStore.set(key, value);
  },
};

function defaultStorage(): StringStorage {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // Private mode / SSR — fall through to the in-memory store.
  }
  return memoryStorage;
}

// In-memory session guard: stops a double count when the page's
// mount effect runs twice (React StrictMode) before the first write
// has finished and the localStorage flag is set.
const countedThisSession = new Set<string>();

/**
 * Count one visit for `code`: count +1, lastSeen = now. Counts at
 * most once per browser per day (localStorage guard, checked BEFORE
 * writing, set only AFTER a successful write). Never creates a doc
 * for an unknown code and never shows an error to the visitor —
 * every failure is swallowed silently.
 */
export async function recordReferralVisit(
  code: string,
  firestoreDb: Firestore | null = db,
  storage: StringStorage = defaultStorage(),
): Promise<void> {
  if (!isValidReferralCode(code)) return;
  if (!firestoreDb) return;
  const key = referralVisitGuardKey(code);
  if (countedThisSession.has(key)) return;
  countedThisSession.add(key);
  try {
    if (storage.getItem(key)) return;
  } catch {
    return;
  }
  try {
    await updateDoc(doc(firestoreDb, QUIZ_REFERRALS_COLLECTION, code), {
      count: increment(1),
      lastSeen: serverTimestamp(),
    });
    try {
      storage.setItem(key, '1');
    } catch {
      // Storage unavailable — the session guard still blocks a
      // second count on this page load.
    }
  } catch {
    // Unknown code, rules not live yet, offline — silent by design.
  }
}
