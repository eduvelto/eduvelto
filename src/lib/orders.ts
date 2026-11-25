// Eduvelto — ৳149 suggestion-PDF orders (Phase 3 Commit 3,
// 25 Nov 2026, feature/ssg-bilingual-support).
//
// Secondary monetization: "Download Last-Minute Exam Suggestion
// & Special Model Test PDF (৳149)" — the buyer pays via bKash /
// Nagad and submits the TrxID; the order lands in the `orders`
// collection for the owner to fulfil.
//
// ⚠️ SALES GATE — NO PDF IS FOR SALE YET. SUGGESTION_PDF_SALES_ENABLED
// is false on purpose: no verified suggestion-PDF content exists
// (the library audit found 506 wrong books; selling wrong paid
// content would damage the owner's reputation). The card shows
// "শীঘ্রই আসছে" and the order button stays disabled until this
// flag is flipped — flip it ONLY when verified PDF content exists
// AND the owner approves the sale in writing. The orders.test.ts
// flag test is the forcing function: flipping the flag without
// updating that test fails the suite.
//
// Order shape (mirrors the firestore.rules `orders` block):
// exactly {userId, productId, amount, trxId, status, createdAt}.
// Signed-in ONLY (orders tie to a buyer account); amount is
// ALWAYS ৳149; status is ALWAYS 'pending' at create (only the
// owner changes it, off-client); TrxID 1–50 chars. No public
// read — a buyer reads only their own orders, the owner/admin
// reads all (backup preflight included).

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const ORDERS_COLLECTION = 'orders';

/** The one paid product in this phase. */
export const SUGGESTION_PDF_PRODUCT_ID = 'suggestion-pdf';
export const SUGGESTION_PDF_PRICE = 149;

export const ORDER_TRXID_MAX = 50;

/** SALES GATE — see the header. False = card is UI-only. */
export const SUGGESTION_PDF_SALES_ENABLED = false;

export type OrderValidationError =
  | 'signin-required'
  | 'product-invalid'
  | 'amount-invalid'
  | 'trxid-required'
  | 'trxid-too-long'
  | 'status-invalid';

/** Pure validation — shared by the modal and the unit tests.
//  Mirrors the firestore.rules `orders` create rule field-for-field. */
export function validateOrderInput(input: {
  userId: unknown;
  productId: unknown;
  amount: unknown;
  trxId: unknown;
  status: unknown;
}): { ok: boolean; errors: OrderValidationError[] } {
  const errors: OrderValidationError[] = [];
  if (typeof input.userId !== 'string' || input.userId.length === 0) errors.push('signin-required');
  if (input.productId !== SUGGESTION_PDF_PRODUCT_ID) errors.push('product-invalid');
  if (input.amount !== SUGGESTION_PDF_PRICE) errors.push('amount-invalid');
  const trxId = typeof input.trxId === 'string' ? input.trxId.trim() : '';
  if (trxId.length === 0) errors.push('trxid-required');
  else if (trxId.length > ORDER_TRXID_MAX) errors.push('trxid-too-long');
  if (input.status !== 'pending') errors.push('status-invalid');
  return { ok: errors.length === 0, errors };
}

/** Submit a ৳149 suggestion-PDF order for a signed-in buyer. */
export async function submitOrder(
  userId: string | null,
  trxId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const check = validateOrderInput({
    userId,
    productId: SUGGESTION_PDF_PRODUCT_ID,
    amount: SUGGESTION_PDF_PRICE,
    trxId,
    status: 'pending',
  });
  if (!check.ok) return { ok: false, reason: check.errors[0] };
  if (!db) return { ok: false, reason: 'unavailable' };
  try {
    await addDoc(collection(db, ORDERS_COLLECTION), {
      userId: userId as string,
      productId: SUGGESTION_PDF_PRODUCT_ID,
      amount: SUGGESTION_PDF_PRICE,
      trxId: trxId.trim(),
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
