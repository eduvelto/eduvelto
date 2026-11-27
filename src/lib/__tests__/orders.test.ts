// Eduvelto — ৳149 suggestion-PDF order validation tests (Phase 3,
// 25 Nov 2026, feature/ssg-bilingual-support).
//
// Guards the sales gate and the order shape: the card is UI-ONLY
// until verified PDF content exists — SUGGESTION_PDF_SALES_ENABLED
// must stay false until the owner approves the sale in writing
// with verified content. The card must keep its "যাচাই চলছে"
// notice while sales are off (28 Nov 2026 completeness audit —
// was "শীঘ্রই আসছে" before).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ORDER_TRXID_MAX,
  SUGGESTION_PDF_PRICE,
  SUGGESTION_PDF_PRODUCT_ID,
  SUGGESTION_PDF_SALES_ENABLED,
  validateOrderInput,
} from '../orders';

const VALID = {
  userId: 'buyer-1',
  productId: 'suggestion-pdf',
  amount: 149,
  trxId: '9HX7K2M4P1',
  status: 'pending',
};

describe('suggestion-PDF sales gate', () => {
  it('sales are OFF — no PDF is for sale until verified content exists', () => {
    expect(SUGGESTION_PDF_SALES_ENABLED).toBe(false);
    expect(SUGGESTION_PDF_PRODUCT_ID).toBe('suggestion-pdf');
    expect(SUGGESTION_PDF_PRICE).toBe(149);
  });

  it('the card says verification is in progress while sales are off', () => {
    const src = readFileSync(resolve(__dirname, '../../components/SuggestionPdfCard.tsx'), 'utf8');
    expect(src).toContain('যাচাই চলছে');
    expect(src).toContain('SUGGESTION_PDF_SALES_ENABLED');
    // The card never claims a PDF is ready to download.
    expect(src).not.toContain('ডাউনলোড করুন');
  });

  it('the probe marker is on a plain DOM div, not on <Card>', () => {
    // Regression guard (25 Nov 2026): Card (ui.tsx) does not forward
    // unknown props, so data-suggestion-pdf-card on <Card> never
    // reaches the rendered page — the rendered probe found 0.
    const src = readFileSync(resolve(__dirname, '../../components/SuggestionPdfCard.tsx'), 'utf8');
    expect(src).toContain('<div data-suggestion-pdf-card>');
    expect(src).not.toContain('<Card\n      data-suggestion-pdf-card');
    expect(src).not.toContain('<Card data-suggestion-pdf-card');
  });
});

describe('validateOrderInput (mirrors the firestore.rules orders create rule)', () => {
  it('accepts a well-formed ৳149 order', () => {
    expect(validateOrderInput(VALID)).toEqual({ ok: true, errors: [] });
  });

  it('rejects a missing buyer (signed-in only)', () => {
    expect(validateOrderInput({ ...VALID, userId: '' }).errors).toContain('signin-required');
    expect(validateOrderInput({ ...VALID, userId: null }).errors).toContain('signin-required');
  });

  it('rejects any product but suggestion-pdf and any amount but ৳149', () => {
    expect(validateOrderInput({ ...VALID, productId: 'other-pdf' }).errors).toContain('product-invalid');
    for (const amount of [100, 150, 0, '149', null]) {
      expect(validateOrderInput({ ...VALID, amount }).errors).toContain('amount-invalid');
    }
  });

  it('rejects an empty TrxID and one over 50 chars', () => {
    expect(validateOrderInput({ ...VALID, trxId: '' }).errors).toContain('trxid-required');
    expect(validateOrderInput({ ...VALID, trxId: 'X'.repeat(ORDER_TRXID_MAX + 1) }).errors).toContain(
      'trxid-too-long',
    );
  });

  it('rejects any status but pending at create', () => {
    expect(validateOrderInput({ ...VALID, status: 'paid' }).errors).toContain('status-invalid');
    expect(validateOrderInput({ ...VALID, status: 'delivered' }).errors).toContain('status-invalid');
  });
});
