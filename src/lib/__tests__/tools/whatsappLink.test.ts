import { describe, it, expect } from 'vitest';
import { buildWhatsAppLink, normalizePhone } from '../../tools/whatsappLink';

describe('whatsappLink', () => {
  it('builds a wa.me link with an encoded message', () => {
    expect(buildWhatsAppLink('8801712345678', 'Hello there')).toBe('https://wa.me/8801712345678?text=Hello%20there');
  });
  it('converts a local 0 number to 880', () => {
    expect(normalizePhone('01712345678')).toBe('8801712345678');
    expect(buildWhatsAppLink('01712345678', '')).toBe('https://wa.me/8801712345678');
  });
  it('rejects a bad number', () => {
    expect(() => buildWhatsAppLink('abc', 'hi')).toThrow('valid phone number');
  });
});
