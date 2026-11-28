// Job Circular Links Hub — unit tests.
// Exactly 8 official portals, bare https domains only (no deep
// paths, no other URLs), every entry with non-empty Bangla +
// English name and note, and the category filter behaving.
import { describe, it, expect } from 'vitest';
import {
  JOB_CIRCULAR_LINKS,
  filterJobCircularLinks,
} from '../../tools/jobCircularLinks';

const EXPECTED_URLS = [
  'https://bpsc.gov.bd',
  'https://erecruitment.bb.org.bd',
  'https://ntrca.gov.bd',
  'https://dpe.gov.bd',
  'https://alljobs.teletalk.com.bd',
  'https://mopa.gov.bd',
  'https://bangladesh.gov.bd',
  'https://bmet.gov.bd',
];

describe('JOB_CIRCULAR_LINKS', () => {
  it('has exactly 8 links', () => {
    expect(JOB_CIRCULAR_LINKS).toHaveLength(8);
  });

  it('contains exactly the 8 verified official URLs — no others', () => {
    const urls = JOB_CIRCULAR_LINKS.map((l) => l.url);
    expect([...urls].sort()).toEqual([...EXPECTED_URLS].sort());
  });

  it('every URL starts with https:// and has no deep path (bare domain only)', () => {
    for (const link of JOB_CIRCULAR_LINKS) {
      expect(link.url.startsWith('https://')).toBe(true);
      const afterScheme = link.url.slice('https://'.length);
      expect(afterScheme).not.toContain('/');
      expect(link.url).toMatch(/^https:\/\/[a-z0-9.-]+$/);
    }
  });

  it('every entry has a non-empty Bangla and English name and note', () => {
    for (const link of JOB_CIRCULAR_LINKS) {
      expect(link.nameBn.trim().length).toBeGreaterThan(0);
      expect(link.nameEn.trim().length).toBeGreaterThan(0);
      expect(link.noteBn.trim().length).toBeGreaterThan(0);
      expect(link.noteEn.trim().length).toBeGreaterThan(0);
    }
  });

  it('does not include the superseded/unresolvable bank domains', () => {
    const urls = JOB_CIRCULAR_LINKS.map((l) => l.url);
    expect(urls).not.toContain('https://bankersselection.org.bd');
    expect(urls).not.toContain('https://bangladeshbank.org.bd');
  });

  it('category filter returns only BCS links for bcs, and all links for all', () => {
    const bcs = filterJobCircularLinks(JOB_CIRCULAR_LINKS, 'bcs');
    expect(bcs).toHaveLength(1);
    expect(bcs[0]?.url).toBe('https://bpsc.gov.bd');
    expect(filterJobCircularLinks(JOB_CIRCULAR_LINKS, 'all')).toHaveLength(8);
  });

  it('category filter returns only bank links for bank and only primary links for primary', () => {
    const bank = filterJobCircularLinks(JOB_CIRCULAR_LINKS, 'bank');
    expect(bank).toHaveLength(1);
    expect(bank[0]?.url).toBe('https://erecruitment.bb.org.bd');
    const primary = filterJobCircularLinks(JOB_CIRCULAR_LINKS, 'primary');
    expect(primary).toHaveLength(1);
    expect(primary[0]?.url).toBe('https://dpe.gov.bd');
  });
});
