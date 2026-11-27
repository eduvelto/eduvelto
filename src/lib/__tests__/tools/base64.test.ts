import { describe, it, expect } from 'vitest';
import { encodeBase64, decodeBase64, encodeBase64Url, decodeBase64Url, isValidBase64 } from '../../tools/base64';

describe('base64', () => {
  it('round-trips ASCII and Bangla text', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=');
    expect(decodeBase64('aGVsbG8=')).toBe('hello');
    const bn = 'আমি বাংলা';
    expect(decodeBase64(encodeBase64(bn))).toBe(bn);
  });
  it('base64url strips padding and uses -_', () => {
    const url = encodeBase64Url('hello world?');
    expect(url).not.toContain('+');
    expect(url).not.toContain('/');
    expect(decodeBase64Url(url)).toBe('hello world?');
  });
  it('rejects invalid base64', () => {
    expect(() => decodeBase64('not!!base64')).toThrow('Not valid Base64');
    expect(isValidBase64('aGVsbG8=')).toBe(true);
    expect(isValidBase64('!!!')).toBe(false);
  });
});
