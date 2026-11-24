// Eduvelto — newsletter email validation unit tests
// (homepage redesign, 24 Nov 2026). Pure function only — the
// Firestore rules enforce the same shape server-side (see
// emulator-tests/rules-newsletter.test.ts).

import { describe, expect, it } from 'vitest';
import { isValidNewsletterEmail } from '../newsletter';

describe('isValidNewsletterEmail', () => {
  it('accepts ordinary addresses', () => {
    expect(isValidNewsletterEmail('reader@example.com')).toBe(true);
    expect(isValidNewsletterEmail('ali.hasan+edu@sub.example.co.uk')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(isValidNewsletterEmail('not-an-email')).toBe(false);
    expect(isValidNewsletterEmail('a@b')).toBe(false);
    expect(isValidNewsletterEmail('@example.com')).toBe(false);
    expect(isValidNewsletterEmail('a@.com')).toBe(false);
    expect(isValidNewsletterEmail('')).toBe(false);
  });

  it('trims surrounding whitespace', () => {
    expect(isValidNewsletterEmail('  reader@example.com  ')).toBe(true);
  });

  it('rejects over-long addresses (rules cap is 200)', () => {
    expect(isValidNewsletterEmail(`${'a'.repeat(195)}@example.com`)).toBe(false);
  });
});
