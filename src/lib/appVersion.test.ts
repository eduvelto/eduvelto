// Unit tests for the forced-app-update version logic (src/lib/appVersion).
// Pure functions only — no Firebase, no DOM, no emulator needed.
// Run: npx vitest run src/lib/appVersion.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseVersion,
  isValidVersion,
  compareVersions,
  checkAppVersion,
  type AppVersionConfig,
} from './appVersion';

function cfg(over: Partial<AppVersionConfig>): AppVersionConfig {
  return {
    latestVersion: '0.2.0',
    minVersion: '0.2.0',
    releaseNotes: '',
    downloadUrl: '/install',
    updatedAt: null,
    ...over,
  };
}

describe('parseVersion', () => {
  it('parses x.y.z', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
  });
  it('fills missing parts with 0', () => {
    expect(parseVersion('1.2')).toEqual([1, 2, 0]);
    expect(parseVersion('1')).toEqual([1, 0, 0]);
  });
  it('rejects malformed versions', () => {
    expect(parseVersion('')).toBeNull();
    expect(parseVersion('abc')).toBeNull();
    expect(parseVersion('v1.2')).toBeNull();
    expect(parseVersion('1.2.3.4')).toBeNull();
    expect(parseVersion('1.2.x')).toBeNull();
    expect(parseVersion(' 1.2.3 ')).toEqual([1, 2, 3]);
  });
});

describe('isValidVersion', () => {
  it('accepts digits-only versions', () => {
    expect(isValidVersion('0.1.0')).toBe(true);
    expect(isValidVersion('10.20.30')).toBe(true);
  });
  it('rejects anything else', () => {
    expect(isValidVersion('1.0-beta')).toBe(false);
    expect(isValidVersion('1.0.0 ')).toBe(true); // trailing space is trimmed
    expect(isValidVersion('')).toBe(false);
  });
});

describe('compareVersions', () => {
  it('orders versions numerically, not lexicographically', () => {
    expect(compareVersions('0.9.0', '0.10.0')).toBe(-1);
    expect(compareVersions('0.10.0', '0.9.0')).toBe(1);
    expect(compareVersions('1.0.0', '0.99.99')).toBe(1);
  });
  it('treats missing parts as 0', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('1', '1.0.0')).toBe(0);
  });
  it('returns 0 for equal versions', () => {
    expect(compareVersions('0.1.0', '0.1.0')).toBe(0);
  });
  it('returns 0 (fail open) when either side is malformed', () => {
    expect(compareVersions('abc', '0.1.0')).toBe(0);
    expect(compareVersions('0.1.0', 'xyz')).toBe(0);
    expect(compareVersions('', '')).toBe(0);
  });
});

describe('checkAppVersion', () => {
  it('is current when nothing is published', () => {
    expect(checkAppVersion(null, '0.1.0')).toBe('current');
  });
  it('blocks when bundled < minVersion', () => {
    expect(checkAppVersion(cfg({ latestVersion: '0.2.0', minVersion: '0.2.0' }), '0.1.0')).toBe('blocked');
    expect(checkAppVersion(cfg({ latestVersion: '0.3.0', minVersion: '0.2.0' }), '0.1.9')).toBe('blocked');
  });
  it('shows update-available when minVersion is met but latest is newer', () => {
    expect(checkAppVersion(cfg({ latestVersion: '0.2.0', minVersion: '0.1.0' }), '0.1.0')).toBe(
      'update-available',
    );
  });
  it('is current when bundled >= latestVersion', () => {
    expect(checkAppVersion(cfg({ latestVersion: '0.1.0', minVersion: '0.1.0' }), '0.1.0')).toBe('current');
    expect(checkAppVersion(cfg({ latestVersion: '0.1.0', minVersion: '0.1.0' }), '0.2.0')).toBe('current');
  });
  it('minVersion wins over latestVersion (blocked even when latest is old)', () => {
    // A config that forces 0.2.0 while latest is also 0.2.0 blocks 0.1.0.
    expect(checkAppVersion(cfg({ latestVersion: '0.2.0', minVersion: '0.2.0' }), '0.1.0')).toBe('blocked');
  });
});
