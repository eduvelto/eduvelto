// Eduvelto — Owner 2FA helpers unit tests.
//
// Pure-function coverage only (backup-code format/hashing, claim
// parsing, device-id logic). The Firebase SDK wrappers (enrollment,
// resolver, Firestore writes) are thin and are verified by the
// emulator rules tests + the staging preview — they are NOT faked here.
//
// Run with `npm run test:unit`.
import { describe, it, expect } from 'vitest';
import {
  findMatchingBackupCode,
  generateBackupCodes,
  getOrCreateDeviceId,
  hashBackupCode,
  hashBackupCodes,
  hasTotpFactor,
  isValidBackupCodeFormat,
  normalizeBackupCode,
  sessionHasSecondFactor,
  type BackupCodeEntry,
} from '../ownerMfa';

function fakeFactor(factorId: string) {
  return { uid: `uid-${factorId}`, factorId, displayName: factorId, enrollmentTime: null } as never;
}

describe('owner 2FA — backup codes', () => {
  it('generates 10 unique codes in XXXX-XXXX-XXXX format', () => {
    const codes = generateBackupCodes(10);
    expect(codes).toHaveLength(10);
    for (const code of codes) {
      expect(isValidBackupCodeFormat(code)).toBe(true);
      // Unambiguous alphabet only: no 0/O, 1/I/L.
      expect(code).not.toMatch(/[01OIL]/);
    }
    expect(new Set(codes).size).toBe(10);
  });

  it('normalises case and separators', () => {
    expect(normalizeBackupCode('abcd-efgh-ijkl')).toBe('ABCDEFGHIJKL');
    expect(normalizeBackupCode(' abcd efgh ijkl ')).toBe('ABCDEFGHIJKL');
    expect(isValidBackupCodeFormat('abcd-efgh-ijkl')).toBe(true);
    expect(isValidBackupCodeFormat('abc-efgh-ijkl')).toBe(false);
    expect(isValidBackupCodeFormat('abcd-efgh-ijk')).toBe(false);
  });

  it('hash round-trip: same code+salt matches, different salt does not', async () => {
    const code = 'ABCD-EFGH-IJKL';
    const h1 = await hashBackupCode(code, 'salt-one');
    const h2 = await hashBackupCode(code, 'salt-one');
    const h3 = await hashBackupCode(code, 'salt-two');
    const h4 = await hashBackupCode('WXYZ-EFGH-IJKL', 'salt-one');
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h1).not.toBe(h4);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('findMatchingBackupCode finds the right entry and rejects wrong codes', async () => {
    const codes = generateBackupCodes(3);
    const entries: BackupCodeEntry[] = await hashBackupCodes(codes);
    expect(await findMatchingBackupCode(codes[1], entries)).not.toBeNull();
    // Case + separator insensitive.
    expect(await findMatchingBackupCode(codes[1].toLowerCase().replace(/-/g, ' '), entries)).not.toBeNull();
    expect(await findMatchingBackupCode('ZZZZ-ZZZZ-ZZZZ', entries)).toBeNull();
    expect(await findMatchingBackupCode('short', entries)).toBeNull();
  });

  it('hashBackupCodes gives each code its own salt', async () => {
    const entries = await hashBackupCodes(['ABCD-EFGH-IJKL', 'ABCD-EFGH-IJKL']);
    expect(entries).toHaveLength(2);
    expect(entries[0].salt).not.toBe(entries[1].salt);
    expect(entries[0].hash).not.toBe(entries[1].hash);
  });
});

describe('owner 2FA — factor + session checks', () => {
  it('hasTotpFactor detects a totp factor only', () => {
    expect(hasTotpFactor([])).toBe(false);
    expect(hasTotpFactor([fakeFactor('phone')])).toBe(false);
    expect(hasTotpFactor([fakeFactor('phone'), fakeFactor('totp')])).toBe(true);
  });

  it('sessionHasSecondFactor reads the ID-token claim', () => {
    expect(sessionHasSecondFactor(null)).toBe(false);
    expect(sessionHasSecondFactor({})).toBe(false);
    expect(sessionHasSecondFactor({ firebase: {} })).toBe(false);
    expect(
      sessionHasSecondFactor({ firebase: { sign_in_second_factor: 'totp' } }),
    ).toBe(true);
    expect(
      sessionHasSecondFactor({ firebase: { sign_in_second_factor: 'phone' } }),
    ).toBe(true);
    expect(
      sessionHasSecondFactor({ firebase: { sign_in_provider: 'password' } }),
    ).toBe(false);
  });
});

describe('owner 2FA — device id', () => {
  it('creates a stable id and reuses it from storage', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    const first = getOrCreateDeviceId(storage);
    expect(first).toMatch(/^d[0-9a-f]{16}$/);
    expect(getOrCreateDeviceId(storage)).toBe(first);
  });

  it('returns a fresh id when storage is unavailable', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    expect(getOrCreateDeviceId(broken)).toMatch(/^d[0-9a-f]{16}$/);
  });
});
