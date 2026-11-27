import { describe, it, expect } from 'vitest';
import { decodeJwt } from '../../tools/jwtDecoder';
import { encodeBase64Url } from '../../tools/base64';

function makeToken(payload: Record<string, unknown>): string {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('decodeJwt', () => {
  it('decodes header and payload', () => {
    const d = decodeJwt(makeToken({ sub: '123', name: 'Mizan', iat: 1516239022 }));
    expect(d.header.alg).toBe('HS256');
    expect(d.payload.sub).toBe('123');
    expect(d.signature).toBe('fake-signature');
  });
  it('reads expiry', () => {
    const d = decodeJwt(makeToken({ exp: 1 }));
    expect(d.expired).toBe(true);
    expect(d.expiresAt).toBe('1970-01-01T00:00:01.000Z');
  });
  it('rejects malformed tokens', () => {
    expect(() => decodeJwt('only-one-part')).toThrow('three parts');
    expect(() => decodeJwt('a.b.c')).toThrow('not valid Base64URL JSON');
  });
});
