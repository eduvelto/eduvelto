// Eduvelto — newsletter signup (homepage redesign, 24 Nov 2026).
//
// The footer newsletter form writes to the `newsletterSubscribers`
// Firestore collection — a real store, enforced by
// firestore.rules (public create with a validated email + fixed
// fields only; read owner/admin only; no update/delete). There is
// no email-sending yet: subscribing stores the address for the
// owner to use for updates; the form says so honestly and never
// promises an email that will not arrive.

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const NEWSLETTER_COLLECTION = 'newsletterSubscribers';

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** Pure email check — shared by the form and the unit tests. The
 * Firestore rules enforce the same shape server-side. */
export function isValidNewsletterEmail(email: string): boolean {
  const v = email.trim();
  return v.length >= 4 && v.length <= 200 && EMAIL_RE.test(v);
}

export async function subscribeNewsletter(email: string): Promise<{ ok: boolean; reason?: string }> {
  const clean = email.trim().toLowerCase();
  if (!isValidNewsletterEmail(clean)) return { ok: false, reason: 'invalid-email' };
  if (!db) return { ok: false, reason: 'unavailable' };
  try {
    await addDoc(collection(db, NEWSLETTER_COLLECTION), {
      email: clean,
      source: 'footer',
      status: 'subscribed',
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
