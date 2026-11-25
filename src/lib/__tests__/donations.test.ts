// Eduvelto — donation validation + payment-method tests (Phase 3,
// 25 Nov 2026, feature/ssg-bilingual-support).
//
// Guards the owner-provided numbers and the placeholders:
// bKash + Nagad share the ONE real number (+8801754267001);
// Rocket and Bank Transfer carry NO number and show
// "শীঘ্রই আসছে" — no Rocket number or bank account may ever be
// invented here. The donation data layer collects Name, Amount
// and TrxID only — no phone number, no email.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DONATION_AMOUNT_MAX,
  DONATION_METHODS,
  SUPPORT_BKASH_NAGAD_NUMBER,
  validateDonationInput,
} from '../donations';

describe('donation payment methods (owner-provided numbers)', () => {
  it('bKash and Nagad share the one owner-provided number', () => {
    expect(SUPPORT_BKASH_NAGAD_NUMBER).toBe('+8801754267001');
    const bkash = DONATION_METHODS.find((m) => m.id === 'bkash');
    const nagad = DONATION_METHODS.find((m) => m.id === 'nagad');
    expect(bkash?.number).toBe('+8801754267001');
    expect(nagad?.number).toBe('+8801754267001');
    expect(bkash?.comingSoon).toBe(false);
    expect(nagad?.comingSoon).toBe(false);
  });

  it('Rocket and Bank Transfer are placeholders with NO number', () => {
    for (const id of ['rocket', 'bank'] as const) {
      const method = DONATION_METHODS.find((m) => m.id === id);
      expect(method, `${id} method missing`).toBeDefined();
      expect(method?.number).toBeNull();
      expect(method?.comingSoon).toBe(true);
    }
  });

  it('no invented number appears anywhere in the methods list', () => {
    // Every digit-run of 6+ in the serialised methods must be the
    // one owner-provided number — a second number would be an
    // invented Rocket/bank account.
    const json = JSON.stringify(DONATION_METHODS);
    const numbers = [...json.matchAll(/\+?\d[\d\s-]{5,}/g)].map((m) => m[0].replace(/[\s-]/g, ''));
    expect(numbers.length).toBeGreaterThan(0);
    for (const n of numbers) expect(n).toBe('+8801754267001');
  });

  it('the donation record holds Name, Amount and TrxID only — no phone, no email', () => {
    const src = readFileSync(resolve(__dirname, '../donations.ts'), 'utf8');
    const iface = /export interface DonationInput \{([^}]*)\}/.exec(src);
    expect(iface, 'DonationInput interface not found').not.toBeNull();
    const body = iface![1];
    expect(body).toContain('name');
    expect(body).toContain('amount');
    expect(body).toContain('trxId');
    expect(body.toLowerCase()).not.toContain('phone');
    expect(body.toLowerCase()).not.toContain('email');
  });
});

describe('validateDonationInput (mirrors the firestore.rules donations create rule)', () => {
  const valid = { name: 'Rahim Uddin', amount: 500, trxId: '9HX7K2M4P1' };

  it('accepts a well-formed donation', () => {
    expect(validateDonationInput(valid)).toEqual({ ok: true, errors: [] });
  });

  it('rejects an empty name and a name over 100 chars', () => {
    expect(validateDonationInput({ ...valid, name: '   ' }).errors).toContain('name-required');
    expect(validateDonationInput({ ...valid, name: 'ক'.repeat(101) }).errors).toContain('name-too-long');
    expect(validateDonationInput({ ...valid, name: 'ক'.repeat(100) }).ok).toBe(true);
  });

  it('rejects a non-positive, non-numeric or over-limit amount', () => {
    for (const amount of [0, -50, Number.NaN, Infinity, '500', null, undefined]) {
      expect(validateDonationInput({ ...valid, amount }).errors).toContain('amount-invalid');
    }
    expect(validateDonationInput({ ...valid, amount: DONATION_AMOUNT_MAX + 1 }).errors).toContain(
      'amount-too-large',
    );
    expect(validateDonationInput({ ...valid, amount: DONATION_AMOUNT_MAX }).ok).toBe(true);
  });

  it('rejects an empty TrxID and one over 50 chars', () => {
    expect(validateDonationInput({ ...valid, trxId: '' }).errors).toContain('trxid-required');
    expect(validateDonationInput({ ...valid, trxId: 'X'.repeat(51) }).errors).toContain('trxid-too-long');
    expect(validateDonationInput({ ...valid, trxId: 'X'.repeat(50) }).ok).toBe(true);
  });
});
