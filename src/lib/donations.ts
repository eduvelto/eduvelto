// Eduvelto — "Support Eduvelto" donations (Phase 3, 25 Nov 2026,
// feature/ssg-bilingual-support).
//
// The site is 100% free and support is VOLUNTARY. Donors send money
// through a payment method and (from Commit 2) record Name + Amount
// + TrxID in the `donations` collection; the public Supporters Wall
// shows name + amount only.
//
// REAL numbers (owner-provided 25 Nov 2026 07:25): bKash + Nagad share
// ONE number, +8801754267001. Rocket and Bank Transfer are
// PLACEHOLDERS ONLY — they carry no number and show "শীঘ্রই আসছে"
// (coming soon). NEVER invent a Rocket number or a bank account
// here; the placeholder test in donations.test.ts enforces it.
// Donor phone numbers are NEVER collected (the form asks for Name,
// Amount and TrxID only) and NEVER shown publicly.
//
// Validation here is the client-side mirror of the firestore.rules
// `donations` match block (Commit 2): name 1–100 chars, amount a
// positive number up to ৳10,000,000, TrxID 1–50 chars, exactly the
// four keys {name, amount, trxId, createdAt} — no phone/email/extra
// fields. The rules are the enforcement; this only fails fast in
// the UI with a readable message.

import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const DONATIONS_COLLECTION = 'donations';

/** The ONE owner-provided number, shared by bKash and Nagad. */
export const SUPPORT_BKASH_NAGAD_NUMBER = '+8801754267001';

export const DONATION_NAME_MAX = 100;
export const DONATION_TRXID_MAX = 50;
/** Sane upper bound for a single voluntary donation (৳1 crore). */
export const DONATION_AMOUNT_MAX = 10_000_000;

export type DonationMethodId = 'bkash' | 'nagad' | 'rocket' | 'bank';

export interface DonationMethod {
  id: DonationMethodId;
  nameBn: string;
  nameEn: string;
  /** Null = no number yet: the method shows "শীঘ্রই আসছে". */
  number: string | null;
  comingSoon: boolean;
}

/** Payment methods for the Support page + quick modal. bKash and
 *  Nagad share the owner's number; Rocket and Bank Transfer are
 *  coming-soon placeholders with NO number (never invent one). */
export const DONATION_METHODS: readonly DonationMethod[] = [
  { id: 'bkash', nameBn: 'বিকাশ', nameEn: 'bKash', number: SUPPORT_BKASH_NAGAD_NUMBER, comingSoon: false },
  { id: 'nagad', nameBn: 'নগদ', nameEn: 'Nagad', number: SUPPORT_BKASH_NAGAD_NUMBER, comingSoon: false },
  { id: 'rocket', nameBn: 'রকেট', nameEn: 'Rocket', number: null, comingSoon: true },
  { id: 'bank', nameBn: 'ব্যাংক ট্রান্সফার', nameEn: 'Bank Transfer', number: null, comingSoon: true },
];

export interface DonationInput {
  name: string;
  amount: number;
  trxId: string;
}

export type DonationValidationError =
  | 'name-required'
  | 'name-too-long'
  | 'amount-invalid'
  | 'amount-too-large'
  | 'trxid-required'
  | 'trxid-too-long';

/** Pure validation — shared by the form and the unit tests. Mirrors
 *  the firestore.rules `donations` create rule field-for-field, so a
 *  form that passes here is never denied by the rules for shape. */
export function validateDonationInput(input: {
  name: unknown;
  amount: unknown;
  trxId: unknown;
}): { ok: boolean; errors: DonationValidationError[] } {
  const errors: DonationValidationError[] = [];
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name.length === 0) errors.push('name-required');
  else if (name.length > DONATION_NAME_MAX) errors.push('name-too-long');
  const amount = input.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    errors.push('amount-invalid');
  } else if (amount > DONATION_AMOUNT_MAX) {
    errors.push('amount-too-large');
  }
  const trxId = typeof input.trxId === 'string' ? input.trxId.trim() : '';
  if (trxId.length === 0) errors.push('trxid-required');
  else if (trxId.length > DONATION_TRXID_MAX) errors.push('trxid-too-long');
  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Firestore store (Commit 2). Same shape as lib/newsletter.ts: the
// rules are the enforcement (public create with exactly the four
// keys, public read for the wall, no update/delete); these helpers
// only fail fast and return a reason instead of throwing.
// ---------------------------------------------------------------------------

export interface Supporter {
  id: string;
  name: string;
  amount: number;
  createdAtMillis: number | null;
}

/** Record a donation (Name + Amount + TrxID only — never a phone
 *  number). Anyone may submit, signed in or not. */
export async function submitDonation(input: DonationInput): Promise<{ ok: boolean; reason?: string }> {
  const check = validateDonationInput(input);
  if (!check.ok) return { ok: false, reason: check.errors[0] };
  if (!db) return { ok: false, reason: 'unavailable' };
  try {
    await addDoc(collection(db, DONATIONS_COLLECTION), {
      name: input.name.trim(),
      amount: input.amount,
      trxId: input.trxId.trim(),
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/** Public Supporters Wall — newest first. The returned rows carry
 *  name + amount + date only; the TrxID is never included in the
 *  returned objects, so the wall cannot leak it. */
export async function listSupporters(limitCount = 50): Promise<Supporter[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, DONATIONS_COLLECTION), orderBy('createdAt', 'desc'), limit(limitCount)),
    );
    return snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt as { toMillis?: () => number } | null | undefined;
      return {
        id: d.id,
        name: typeof data.name === 'string' ? data.name : '',
        amount: typeof data.amount === 'number' ? data.amount : 0,
        createdAtMillis: typeof createdAt?.toMillis === 'function' ? createdAt.toMillis() : null,
      };
    });
  } catch {
    return [];
  }
}
