import { describe, expect, it } from 'vitest';
import { getReturnTo, loginState, sanitizeReturnTo } from '../loginReturn';
import type { Location } from 'react-router-dom';

function loc(partial: Partial<Location>): Location {
  return {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'test',
    ...partial,
  } as Location;
}

describe('sanitizeReturnTo', () => {
  it('accepts a plain same-site path', () => {
    expect(sanitizeReturnTo('/jobs/bcs')).toBe('/jobs/bcs');
  });
  it('accepts a path with a query string', () => {
    expect(sanitizeReturnTo('/jobs/bcs?tab=practice')).toBe('/jobs/bcs?tab=practice');
  });
  it('rejects protocol-relative and absolute URLs', () => {
    expect(sanitizeReturnTo('//evil.example.com')).toBeNull();
    expect(sanitizeReturnTo('https://evil.example.com')).toBeNull();
  });
  it('rejects /login and /register (would loop)', () => {
    expect(sanitizeReturnTo('/login')).toBeNull();
    expect(sanitizeReturnTo('/register')).toBeNull();
    expect(sanitizeReturnTo('/login/reset')).toBeNull();
  });
  it('rejects non-strings', () => {
    expect(sanitizeReturnTo(null)).toBeNull();
    expect(sanitizeReturnTo(42)).toBeNull();
    expect(sanitizeReturnTo({})).toBeNull();
  });
});

describe('getReturnTo', () => {
  it('prefers router state over the query param', () => {
    expect(getReturnTo(loc({ state: { from: '/jobs/bcs' }, search: '?next=/library' }))).toBe('/jobs/bcs');
  });
  it('falls back to ?next= when state is empty', () => {
    expect(getReturnTo(loc({ search: '?next=/library' }))).toBe('/library');
  });
  it('returns null when neither is present or valid', () => {
    expect(getReturnTo(loc({}))).toBeNull();
    expect(getReturnTo(loc({ search: '?next=https://evil.example.com' }))).toBeNull();
  });
});

describe('loginState', () => {
  it('wraps the from path', () => {
    expect(loginState('/jobs/bcs')).toEqual({ from: '/jobs/bcs' });
  });
});
