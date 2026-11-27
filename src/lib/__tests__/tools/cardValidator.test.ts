import { describe, it, expect } from 'vitest';
import { validateCardNumber, detectCardBrand, maskCardNumber } from '../../tools/cardValidator';

describe('cardValidator (Luhn only)', () => {
  it('accepts the standard test Visa number', () => {
    const v = validateCardNumber('4242 4242 4242 4242');
    expect(v.luhnValid).toBe(true);
    expect(v.brand).toBe('Visa');
  });
  it('rejects a number that fails Luhn', () => {
    expect(validateCardNumber('4242424242424241').luhnValid).toBe(false);
  });
  it('detects brands', () => {
    expect(detectCardBrand('5555555555554444')).toBe('Mastercard');
    expect(detectCardBrand('378282246310005')).toBe('American Express');
  });
  it('masks all but the last 4 digits', () => {
    expect(maskCardNumber('4242424242424242')).toContain('4242');
    expect(maskCardNumber('4242424242424242')).not.toContain('42424242');
  });
});
