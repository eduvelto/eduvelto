import { describe, it, expect } from 'vitest';
import { generateUuid, isValidUuid, shaHex, hashText } from '../../tools/hashTools';

describe('hashTools', () => {
  it('generates valid v4 UUIDs', () => {
    const id = generateUuid();
    expect(isValidUuid(id)).toBe(true);
    expect(generateUuid()).not.toBe(id);
    expect(isValidUuid('not-a-uuid')).toBe(false);
  });
  it('sha256 of abc matches the known vector', async () => {
    expect(await shaHex('abc', 'SHA-256')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('sha1 of abc matches the known vector', async () => {
    expect(await shaHex('abc', 'SHA-1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });
  it('hashText handles MD5 too', async () => {
    expect(await hashText('hello', 'MD5')).toBe('5d41402abc4b2a76b9719d911017c592');
  });
});
