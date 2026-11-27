import { describe, it, expect } from 'vitest';
import { encodeUrl, decodeUrl, buildUtmUrl, parseUrlParts } from '../../tools/urlTools';

describe('urlTools', () => {
  it('encodes and decodes', () => {
    expect(encodeUrl('hello world?x=1')).toBe('hello%20world%3Fx%3D1');
    expect(decodeUrl('hello%20world')).toBe('hello world');
    expect(() => decodeUrl('%')).toThrow('Not a valid percent-encoded URL');
  });
  it('builds UTM links', () => {
    expect(buildUtmUrl('https://example.com/page', { source: 'facebook', medium: 'social', campaign: 'launch' }))
      .toBe('https://example.com/page?utm_source=facebook&utm_medium=social&utm_campaign=launch');
  });
  it('parses URL parts', () => {
    expect(parseUrlParts('https://example.com/a/b?x=1#top')?.host).toBe('example.com');
    expect(parseUrlParts('not a url')).toBeNull();
  });
});
