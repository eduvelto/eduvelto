import { describe, it, expect } from 'vitest';
import { md5Hex } from '../../tools/md5';

describe('md5Hex (RFC 1321 vectors)', () => {
  it.each([
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['hello', '5d41402abc4b2a76b9719d911017c592'],
    ['The quick brown fox jumps over the lazy dog', '9e107d9d372bb6826bd81d3542a419d6'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
  ])('md5(%s) = %s', (input, expected) => {
    expect(md5Hex(input)).toBe(expected);
  });
});
